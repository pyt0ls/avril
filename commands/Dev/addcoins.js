const { formatAmount, loadCoins, saveCoins, parseAmount } = require('../../utils/coinsUtils');
const config = require('../../config');

module.exports = {
  name: 'setcoins',
  aliases: ['addcoins', 'addc'],
  description: 'Adiciona coins para um usuário (por ID ou menção)',
  async execute(message, args) {
    if (!config.OWNERS.includes(message.author.id)) {
      return message.reply('🚫 Você não tem permissão para usar este comando.');
    }

    if (args.length < 2) {
      return message.reply('❌ Uso correto: `setcoins @usuário <quantia>`');
    }

    const userInput = args[0];
    const amountStr = args[1];

    // Extrai ID da menção ou aceita ID diretamente
    const userId = userInput.replace(/[<@!>]/g, '');
    const user = await message.client.users.fetch(userId).catch(() => null);

    if (!user) {
      return message.reply('❌ Usuário inválido. Use uma menção (@usuário) ou ID válido.');
    }

    const amount = parseAmount(amountStr);
    if (!amount || isNaN(amount) || amount <= 0) {
      return message.reply('❌ Quantia inválida. Use um número positivo (ex: `1000`, `10k`, `1.5m`).');
    }

    const coins = loadCoins();
    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };
    if (typeof coins[user.id].banco !== 'number') coins[user.id].banco = 0;

    coins[user.id].banco += amount;
    saveCoins(coins);

    const embed = {
      description: `Você deu ${formatAmount(amount)} coins para ${user}.`,
      color: 0xffffff
    };

    return message.channel.send({ embeds: [embed] });
  }
};