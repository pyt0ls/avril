const { formatAmount, loadCoins, saveCoins, parseAmount } = require("../../utils/coinsUtils");
const config = require("../../config");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "delcoins",
  aliases: ["delc"],
  async execute(message, args) {
    if (!config.OWNERS.includes(message.author.id)) {
      return message.reply("🚫 Você não tem permissão para usar esse comando.");
    }

    const coins = loadCoins();

    const targetArg = args[0];
    const valueArg = args[1];

    // Comando: !delcoins all
    if (targetArg?.toLowerCase() === "all") {
      let total = 0;
      for (const uid in coins) {
        total += (coins[uid].carteira || 0) + (coins[uid].banco || 0);
        coins[uid].carteira = 0;
        coins[uid].banco = 0;
      }

      saveCoins(coins);

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`🗑️ Você deletou ${formatAmount(removed)} coins de ${user}.\n💰 Total removido: **${formatAmount(total)}**`);

      return message.channel.send({ embeds: [embed] });
    }

    // Obter usuário por menção ou ID
    const user = message.mentions.users.first() || await message.client.users.fetch(targetArg).catch(() => null);
    if (!user) {
      return message.reply("❌ Usuário inválido. Mencione ou forneça um ID válido.");
    }

    // Garante estrutura de dados
    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };

    // Zerar tudo (sem valor passado)
    if (!valueArg) {
      const total = (coins[user.id].carteira || 0) + (coins[user.id].banco || 0);
      coins[user.id].carteira = 0;
      coins[user.id].banco = 0;

      saveCoins(coins);

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`🧹 Coins de ${user} foram **zerados**.\n💰 Total removido: **${formatAmount(total)}**`);

      return message.channel.send({ embeds: [embed] });
    }

    // Remover valor específico da carteira
    const amount = parseAmount(valueArg);
    if (!amount || isNaN(amount) || amount <= 0) {
      return message.reply("❌ Quantia inválida. Use um número válido como `10k`, `1m`, `1000`...");
    }

    const before = coins[user.id].carteira || 0;
    coins[user.id].carteira = Math.max(0, before - amount);
    const removed = before - coins[user.id].carteira;

    saveCoins(coins);

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`🗑️ Você deletou ${formatAmount(removed)} coins de ${user}.`);

    message.channel.send({ embeds: [embed] });
  }
};