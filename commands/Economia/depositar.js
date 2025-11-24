const { formatAmount, loadCoins, saveCoins, parseAmount } = require("../../utils/coinsUtils");
const config = require("../../config");

module.exports = {
  name: "depositar",
  aliases: ["dep"],
  async execute(message, args) {
    const user = message.author;
    const coins = loadCoins();

    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };

    const amountStr = args[0];
    if (!amountStr) {
      return message.reply("Você precisa informar uma quantia para depositar, ou `all` para depositar tudo.");
    }

    let amount;

    if (amountStr.toLowerCase() === "all") {
  amount = coins[user.id].carteira;
  if (amount <= 0) {
    return message.reply("❌ Você não tem coins na carteira para depositar.");
  }
}
    else {
      amount = parseAmount(amountStr);
      if (isNaN(amount) || amount <= 0) {
        return message.reply("Quantia inválida para depositar.");
      }
      if (amount > coins[user.id].carteira) {
        return message.reply("Você não tem essa quantia na carteira.");
      }
    }

    coins[user.id].carteira -= amount;
    coins[user.id].banco += amount;
    saveCoins(coins);

    await message.channel.send({
      embeds: [{
        title: "🏦 Depósito realizado!",
        description: `Você depositou **${formatAmount(amount)}** coins na sua conta bancária.`,
        color: 0x11e1db,
        footer: { text: `Usado por ${user.username}` },
        thumbnail: { url: user.displayAvatarURL({ dynamic: true }) }
      }]
    });
  }
};