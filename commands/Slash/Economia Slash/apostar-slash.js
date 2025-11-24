const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { formatAmount, parseAmount, loadCoins, saveCoins } = require("../../../utils/coinsUtils");
const config = require("../../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("apostar")
    .setDescription("Faça uma aposta com outro usuário.")
    .addStringOption(option =>
      option.setName("quantia")
        .setDescription("Valor para apostar")
        .setRequired(true))
    .addUserOption(option =>
      option.setName("usuario")
        .setDescription("Usuário para apostar contra")
        .setRequired(false)),

  async execute(interaction) {
    const author = interaction.user;
    let target = interaction.options.getUser("usuario");
    let amountStr = interaction.options.getString("quantia");

    // Se não tem target, tenta pegar autor da última mensagem válida no canal
    if (!target) {
      const fetched = await interaction.channel.messages.fetch({ limit: 10 });
      const anterior = fetched
        .filter(msg => !msg.author.bot && msg.author.id !== author.id)
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
        .first();

      if (!anterior) {
        return interaction.reply({
          content: "❌ Não encontrei mensagem anterior para apostar.",
          ephemeral: true
        });
      }
      target = anterior.author;
    }

    // Validações
    if (target.id === author.id) {
      return interaction.reply({
        content: "<:No_New00K:1332805357885722636> ╸Você não pode apostar com você mesmo.",
        ephemeral: true
      });
    }
    if (target.bot) {
      return interaction.reply({
        content: "<:No_New00K:1332805357885722636> ╸Você não pode apostar com um bot.",
        ephemeral: true
      });
    }
    if (!amountStr) {
      return interaction.reply({
        content: "Use assim: `/apostar usuario quantia` ou `/apostar quantia` na mensagem do alvo.",
        ephemeral: true
      });
    }

    amountStr = amountStr.replace(/[^0-9kmbKMB]/g, "");
    const amount = parseAmount(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return interaction.reply({
        content: "Digite um valor positivo e válido.",
        ephemeral: true
      });
    }
    if (amount < 100) {
      return interaction.reply({
        content: "Aposte um valor igual ou maior que 100 coins.",
        ephemeral: true
      });
    }

    // Carrega dados de coins
    const coins = loadCoins();
    const authorId = author.id;
    const targetId = target.id;

    if (!coins[authorId]) coins[authorId] = { carteira: 0, banco: 0 };
    if (!coins[targetId]) coins[targetId] = { carteira: 0, banco: 0 };

    if (coins[authorId].banco < amount) {
      return interaction.reply({
        content: "Você não tem moedas suficientes no banco.",
        ephemeral: true
      });
    }
    if (coins[targetId].banco < amount) {
      return interaction.reply({
        content: `${target.username} não tem moedas suficientes para apostar.`,
        ephemeral: true
      });
    }

    // Prefixo customizado (se precisar usar depois)
    let prefix = config.PREFIX;
    const prefixesPath = path.join(__dirname, "../../database/prefixos.json");
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (interaction.guild && prefixDB[interaction.guild.id]) {
        prefix = prefixDB[interaction.guild.id];
      }
    }

    // Embed e botão
    const embed = new EmbedBuilder()
      .setTitle("🎰 • Pedido de Aposta")
      .setDescription(`${author} deseja apostar **${amount.toLocaleString()}** (${formatAmount(amount)}) de **coins** contra ${target}\n\nClique no botão abaixo para **aceitar**.`)
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

    // Envia a mensagem como reply (ephemeral: false)
    const apostaMsg = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
      ephemeral: false
    });

    // Timeout para expirar a aposta em 10s
    apostaMsg.apostaTimeout = setTimeout(async () => {
      try {
        await apostaMsg.edit({
          content: "⏳ Acabou o tempo para confirmar a aposta, faça o desafio novamente!",
          embeds: [],
          components: []
        });
      } catch {
        // mensagem já editada ou removida
      }
    }, 10_000);
  }
};