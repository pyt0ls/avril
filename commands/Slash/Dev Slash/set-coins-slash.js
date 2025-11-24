const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatAmount, loadCoins, saveCoins, parseAmount } = require('../../../utils/coinsUtils');
const config = require('../../../config');

module.exports = {
  global: false, // <<< adiciona isso pra registrar só na guild

  data: new SlashCommandBuilder()
    .setName('setcoins')
    .setDescription('Adiciona coins para um usuário (por ID ou menção)')
    .addStringOption(option =>
      option.setName('usuario')
        .setDescription('ID ou menção do usuário que receberá os coins')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('quantia')
        .setDescription('Quantia de coins (ex: 1k, 10m, 1.5b)')
        .setRequired(true)),

  async execute(interaction) {
    const userInput = interaction.options.getString('usuario');
    const amountStr = interaction.options.getString('quantia');

    // Verifica se é dono
    if (!config.OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });
    }

    // Tenta extrair ID de uma menção ou aceitar ID diretamente
    const userId = userInput.replace(/[<@!>]/g, '');
    const user = await interaction.client.users.fetch(userId).catch(() => null);

    if (!user) {
      return interaction.reply({ content: '❌ Usuário inválido. Use uma menção (@usuário) ou ID válido.', ephemeral: true });
    }

    const amount = parseAmount(amountStr);
    if (!amount || isNaN(amount) || amount <= 0) {
      return interaction.reply({ content: '❌ Quantia inválida. Use um número positivo (ex: `1000`, `10k`, `1.5m`).', ephemeral: true });
    }

    const coins = loadCoins();
    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };
    if (typeof coins[user.id].banco !== 'number') coins[user.id].banco = 0;

    coins[user.id].banco += amount;
    saveCoins(coins);

    const embed = new EmbedBuilder()
      .setDescription(`Você deu ${formatAmount(amount)} coins para ${user}.`)
      .setColor('#ffffff');

    return interaction.reply({ embeds: [embed] });
  }
};