const fs = require("fs");
const path = require("path");
const { formatAmount, loadCoins, saveCoins, parseAmount } = require("../../utils/coinsUtils");
const config = require("../../config");

module.exports = {
  name: "sacar",
  aliases: ["sac"],
  async execute(message, args) {
    const user = message.author;
    const coins = loadCoins();

    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };

    const amountStr = args[0];
    if (!amountStr) {
      return message.reply("Você precisa informar uma quantia para sacar, ou `all` para sacar tudo.");
    }

    let amount;
    if (amountStr.toLowerCase() === "all") {
      amount = coins[user.id].banco;
      if (amount === 0) {
        return message.reply("Você não tem coins no banco para sacar.");
      }
    } else {
      amount = parseAmount(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return message.reply("Quantia inválida para sacar.");
      }
      if (amount > coins[user.id].banco) {
        return message.reply("Você não tem essa quantia no banco.");
      }
    }

    coins[user.id].banco -= amount;
    coins[user.id].carteira += amount;
    saveCoins(coins);

    // Puxar prefixo customizado se existir
    let prefix = config.PREFIX;
    const prefixesPath = path.join(__dirname, "../../database/prefixos.json");
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (message.guild && prefixDB[message.guild.id]) {
        prefix = prefixDB[message.guild.id];
      }
    }

    await message.channel.send({
      embeds: [{
        title: "💸 Saque realizado!",
        description: `Você sacou **${formatAmount(amount)}** coins da sua conta bancária.`,
        color: 0x11e1db,
        footer: { text: `Use ${prefix}bal para ver seu saldo.` },
        thumbnail: { url: user.displayAvatarURL({ dynamic: true }) }
      }]
    });
  }
};