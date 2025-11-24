const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatAmount, loadCoins } = require("../../../utils/coinsUtils");
const config = require("../../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coins")
    .setDescription("Mostra o saldo da carteira e banco de um usuário.")
    .addUserOption(option =>
      option.setName("usuário")
        .setDescription("Usuário para consultar o saldo")
        .setRequired(false)
    ),

  async execute(interaction) {
    // Pegar prefixo customizado ou fallback para padrão
    let prefix = config.PREFIX;
    const prefixesPath = path.join(__dirname, "../../../database/prefixos.json");
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (interaction.guild && prefixDB[interaction.guild.id]) prefix = prefixDB[interaction.guild.id];
    }

    const user = interaction.options.getUser("usuário") || interaction.user;
    const coins = loadCoins();

    if (!coins[user.id]) {
      coins[user.id] = { carteira: 0, banco: 0 };
    }

    const carteira = formatAmount(coins[user.id].carteira);
    const banco = formatAmount(coins[user.id].banco);

    const embed = new EmbedBuilder()
      .setTitle("💼 Conta bancária")
      .setDescription(
        `Seu banco possui:\n「<:cdw_whiteBR:1382063944042020885>」**${banco} coins**\n\n` +
        `Sua carteira possui:\n「<:70s_whitcash:1304070691892625448>」**${carteira} coins**`
      )
      .setColor(0x11e1db)
      .setFooter({ text: `Deposite seus coins usando ${prefix}dep all` })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  }
};