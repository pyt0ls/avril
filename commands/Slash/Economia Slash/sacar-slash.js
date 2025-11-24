const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { formatAmount, loadCoins, saveCoins, parseAmount } = require("../../../utils/coinsUtils");
const config = require("../../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sacar")
    .setDescription("Saque coins da sua conta bancária para a carteira")
    .addStringOption(option =>
      option
        .setName("quantia")
        .setDescription("Quantia para sacar ou 'all' para tudo")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.user;
    const amountStr = interaction.options.getString("quantia");

    const coins = loadCoins();
    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };

    let amount;
    if (amountStr.toLowerCase() === "all") {
      amount = coins[user.id].banco;
      if (amount === 0) {
        return interaction.reply({ content: "Você não tem coins no banco para sacar.", ephemeral: true });
      }
    } else {
      amount = parseAmount(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({ content: "Quantia inválida para sacar.", ephemeral: true });
      }
      if (amount > coins[user.id].banco) {
        return interaction.reply({ content: "Você não tem essa quantia no banco.", ephemeral: true });
      }
    }

    coins[user.id].banco -= amount;
    coins[user.id].carteira += amount;
    saveCoins(coins);

    // Pega prefixo customizado
    let prefix = config.PREFIX;
    const prefixesPath = path.join(__dirname, "../../database/prefixos.json");
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (interaction.guild && prefixDB[interaction.guild.id]) {
        prefix = prefixDB[interaction.guild.id];
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("💸 Saque realizado!")
      .setDescription(`Você sacou **${formatAmount(amount)}** coins da sua conta bancária.`)
      .setColor(0x11e1db)
      .setFooter({ text: `Use ${prefix}bal para ver seu saldo.` })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  },
};