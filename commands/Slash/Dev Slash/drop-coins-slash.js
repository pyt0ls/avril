const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');
const { OWNERS } = require('../../../config');
const { loadCoins, saveCoins } = require('../../../utils/coinsUtils');

// Função para parsear valores como "1k", "2.5m", "1b"
function parseAmount(input) {
  const match = input.toLowerCase().match(/^(\d+(\.\d+)?)([kmb])?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const suffix = match[3];

  switch (suffix) {
    case 'k': return Math.floor(num * 1_000);
    case 'm': return Math.floor(num * 1_000_000);
    case 'b': return Math.floor(num * 1_000_000_000);
    default: return Math.floor(num);
  }
}

module.exports = {
  global: false, // <<< só adicionar isso para registrar só na guild

  data: new SlashCommandBuilder()
    .setName('forcedrop')
    .setDescription('Dropar coins no canal atual.')
    .addStringOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade de coins a dropar (ex: 1k, 2m, 1b)')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Apenas desenvolvedores podem usar este comando.', ephemeral: true });
    }

    const rawInput = interaction.options.getString('quantidade');
    const amount = parseAmount(rawInput);

    if (!amount || amount <= 0) {
      return interaction.reply({ content: '❌ Valor inválido. Use formatos como `1000`, `1k`, `2.5m`, `1b`.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#11e1db')
      .setTitle('🎉 Drop de Coins!')
      .setDescription(`O primeiro a clicar no botão abaixo receberá **${amount.toLocaleString()} de coins**!`)
      .setFooter({ text: 'Seja rápido para pegar!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('drop_pegar')
        .setLabel('Pegar!')
        .setStyle(ButtonStyle.Success)
    );

    const dropMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = dropMessage.createMessageComponentCollector({ filter: i => i.customId === 'drop_pegar', time: 15000, max: 1 });

    collector.on('collect', async i => {
      const userId = i.user.id;
      const coins = loadCoins();

      if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };
      coins[userId].carteira += amount;
      saveCoins(coins);

      await i.update({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff99')
            .setTitle('🎉 Drop Coletado!')
            .setDescription(`Parabéns <@${userId}>! Você pegou **${amount.toLocaleString()} de coins**.`)
            .setFooter({ text: 'Drop finalizado' })
            .setTimestamp()
        ],
        components: []
      });
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await interaction.editReply({
          embeds: [
            embed.setColor('#ff0000').setDescription(`Ninguém pegou o drop de **${amount.toLocaleString()} coins**.`)
          ],
          components: []
        });
      }
    });
  }
};