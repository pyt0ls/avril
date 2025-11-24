const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatAmount, loadCoins, saveCoins, parseAmount } = require("../../../utils/coinsUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("depositar")
    .setDescription("Deposita coins da sua carteira para o banco.")
    .addStringOption(option =>
      option.setName("quantia")
        .setDescription("Quantia para depositar ou 'all' para tudo")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.user;
    const coins = loadCoins();

    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };

    const amountStr = interaction.options.getString("quantia");
    let amount;

    if (amountStr.toLowerCase() === "all") {
      amount = coins[user.id].carteira;
      if (amount <= 0) {
        return interaction.reply({
          content: "❌ Você não tem coins na carteira para depositar.",
          ephemeral: true,
        });
      }
    } else {
      amount = parseAmount(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: "Quantia inválida para depositar.",
          ephemeral: true,
        });
      }
      if (amount > coins[user.id].carteira) {
        return interaction.reply({
          content: "Você não tem essa quantia na carteira.",
          ephemeral: true,
        });
      }
    }

    coins[user.id].carteira -= amount;
    coins[user.id].banco += amount;
    saveCoins(coins);

    const embed = new EmbedBuilder()
      .setTitle("🏦 Depósito realizado!")
      .setDescription(`Você depositou **${formatAmount(amount)}** coins na sua conta bancária.`)
      .setColor(0x11e1db)
      .setFooter({ text: `Usado por ${user.username}` })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  },
};