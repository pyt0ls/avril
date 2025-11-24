const fs = require("fs");
const path = require("path");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { formatAmount, parseAmount, loadCoins, saveCoins } = require("../../utils/coinsUtils");
const config = require("../../config");

module.exports = {
  name: "apostar",
  aliases: ["apost", "ap"],
  async execute(message, args) {
    let target = message.mentions.users.first();
    let amountStr;

    // Se não houver menção, tenta pegar o autor da última mensagem
    if (!target) {
      const fetched = await message.channel.messages.fetch({ limit: 2 });
      const anterior = fetched.filter(msg => msg.id !== message.id).first();
      if (!anterior) return message.reply("❌ Não encontrei mensagem anterior para apostar.");
      target = anterior.author;

      const valorBruto = args[0];
      if (!valorBruto) return message.reply("❌ Você precisa indicar um valor.");
      amountStr = valorBruto.replace(/[^0-9kmbKMB]/g, "");
    } else {
      amountStr = args[1];
    }

    // Validações
    if (target.id === message.author.id) return message.reply("<:No_New00K:1332805357885722636> ╸Você não pode apostar com você mesmo.");
    if (target.bot) return message.reply("<:No_New00K:1332805357885722636> ╸Você não pode apostar com um bot.");
    if (!amountStr) return message.reply("Use assim: `!apostar @usuário <quantia>` ou `!apostar <valor>` na mensagem do alvo.");

    const amount = parseAmount(amountStr);
    if (isNaN(amount) || amount <= 0) return message.reply("Digite um valor positivo e válido.");
    if (amount < 100) return message.reply("Aposte um valor igual ou maior que 100 coins.");

    // Carrega dados de coins
    const coins = loadCoins();
    const authorId = message.author.id;
    const targetId = target.id;

    if (!coins[authorId]) coins[authorId] = { carteira: 0, banco: 0 };
    if (!coins[targetId]) coins[targetId] = { carteira: 0, banco: 0 };

    if (coins[authorId].banco < amount)
      return message.reply("Você não tem moedas suficientes no banco.");
    if (coins[targetId].banco < amount)
      return message.reply(`${target.username} não tem moedas suficientes para apostar.`);

    // Prefixo customizado
    let prefix = config.PREFIX;
    const prefixesPath = path.join(__dirname, "../../database/prefixos.json");
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (message.guild && prefixDB[message.guild.id]) {
        prefix = prefixDB[message.guild.id];
      }
    }

    // Embed e botão
    const embed = new EmbedBuilder()
      .setTitle("🎰 • Pedido de Aposta")
      .setDescription(`${message.author} deseja apostar **${amount.toLocaleString()}** (${formatAmount(amount)}) de **coins** contra ${target}\n\nClique no botão abaixo para **aceitar**.`)
      .setColor(0x00ffc3)
      .setThumbnail('https://cdn.discordapp.com/attachments/1362642722275594330/1386600662946680933/600282.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`apostar-${targetId}-${amount}-${authorId}`)
        .setLabel("Apostar")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("✅"),
      new ButtonBuilder()
        .setCustomId(`recusar-${targetId}-${amount}-${authorId}`)
        .setLabel("Recusar")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("❌")
    );

    // Envia a mensagem como reply à mensagem original
    const apostaMsg = await message.reply({
      embeds: [embed],
      components: [row],
      allowedMentions: { repliedUser: false }
    });

    // Tempo limite de 10s para aceitar a aposta (armazenado na mensagem)
apostaMsg.apostaTimeout = setTimeout(async () => {
  try {
    await apostaMsg.edit({
      content: "⏳ Acabou o tempo para confirmar a aposta, faça o desafio novamente!",
      embeds: [],
      components: []
    });
  } catch (err) {
    // Pode ter sido editada por interação
  }
}, 10_000);
  }
};