const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatAmount, loadCoins, saveCoins, parseAmount } = require('../../../utils/coinsUtils');
const config = require('../../../config');

module.exports = {
  global: false, // <-- só adicionar essa linha para marcar como comando só da guilda

  data: new SlashCommandBuilder()
    .setName('delcoins')
    .setDescription('Remove coins da carteira ou zera totalmente um usuário.')
    .addSubcommand(sub =>
      sub.setName('all')
        .setDescription('Zera completamente os coins (carteira + banco) de um usuário.')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Usuário para zerar os coins')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('quantia')
        .setDescription('Remove uma quantia da carteira de um usuário.')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('Usuário para remover os coins')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('valor')
            .setDescription('Valor a remover (ex: 10k, 1m, 1000)')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!config.OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const coins = loadCoins();

    // Garante estrutura segura
    if (!coins[user.id]) coins[user.id] = { carteira: 0, banco: 0 };

    if (sub === 'all') {
      const total = (coins[user.id].carteira || 0) + (coins[user.id].banco || 0);
      coins[user.id].carteira = 0;
      coins[user.id].banco = 0;
      saveCoins(coins);

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription(`Coins de ${user} foram **zerados**.\n-# Total removido: ${formatAmount(total)}`);

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'quantia') {
      const valueArg = interaction.options.getString('valor');
      const amount = parseAmount(valueArg);

      if (!amount || isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: '❌ Quantia inválida. Use um número válido como `10k`, `1m`, `1000`...',
          ephemeral: true
        });
      }

      const before = coins[user.id].carteira || 0;
      coins[user.id].carteira = Math.max(0, before - amount);
      const removed = before - coins[user.id].carteira;
      saveCoins(coins);

      const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setDescription(`Você deletou ${formatAmount(removed)} coins de ${user}.`);

      return interaction.reply({ embeds: [embed] });
    }
  }
};