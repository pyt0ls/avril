const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { parseAmount, loadCoins, saveCoins, formatAmount } = require('../../../utils/coinsUtils');
const config = require('../../../config');

module.exports = {
  global: false, // <<< adiciona aqui para registrar só na guild

  data: new SlashCommandBuilder()
    .setName('give-coins')
    .setDescription('Inicia um sorteio (apenas donos).')
    .addStringOption(option =>
      option.setName('tempo')
        .setDescription('Duração do sorteio (ex: 1m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('premio')
        .setDescription('Prêmio do sorteio')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('vencedores')
        .setDescription('Quantidade de vencedores (padrão 1)')
        .setMinValue(1)
        .setRequired(false)),

  async execute(interaction) {
    if (!config.OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: '🚫 Apenas donos podem usar este comando.', ephemeral: true });
    }

    function parseDuration(str) {
      const match = str.match(/^(\d+)(s|m|h|d)$/);
      if (!match) return null;
      const num = parseInt(match[1]);
      const unit = match[2];
      switch(unit) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return null;
      }
    }

    const durationStr = interaction.options.getString('tempo');
    const prize = interaction.options.getString('premio');
    const winnersCount = interaction.options.getInteger('vencedores') || 1;

    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      return interaction.reply({ content: '❌ Tempo inválido! Use formatos como 10s, 5m, 1h, 2d.', ephemeral: true });
    }

    const prizeAmount = parseAmount(prize);
    const isCoinPrize = prizeAmount && !isNaN(prizeAmount) && prizeAmount > 0;
    const endTimestamp = Date.now() + durationMs;
    const participants = new Set();

    const embed = new EmbedBuilder()
      .setTitle('🎉 Sorteio Iniciado!')
      .setDescription(`Prêmio: **${prize}**\nTermina em: <t:${Math.floor(endTimestamp / 1000)}:R>\nNúmero de vencedores: **${winnersCount}**\n\nClique no botão para participar!`)
      .setColor('Random');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setLabel('Participar')
        .setStyle(ButtonStyle.Success)
    );

    const giveawayMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = giveawayMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: durationMs,
    });

    collector.on('collect', async i => {
      if (i.user.bot) return;

      try {
        if (participants.has(i.user.id)) {
          if (i.replied || i.deferred) {
            await i.followUp({ content: 'Você já está participando!', ephemeral: true });
          } else {
            await i.reply({ content: 'Você já está participando!', ephemeral: true });
          }
          return;
        }

        participants.add(i.user.id);

        // Atualiza embed com número de participantes
        const updatedEmbed = EmbedBuilder.from(embed).setDescription(
          `Prêmio: **${prize}**\nTermina em: <t:${Math.floor(endTimestamp / 1000)}:R>\nNúmero de vencedores: **${winnersCount}**\n\nParticipantes: **${participants.size}**\n\nClique no botão para participar!`
        );
        await giveawayMessage.edit({ embeds: [updatedEmbed] });

        if (i.replied || i.deferred) {
          await i.followUp({ content: 'Você entrou no sorteio! 🍀', ephemeral: true });
        } else {
          await i.reply({ content: 'Você entrou no sorteio! 🍀', ephemeral: true });
        }
      } catch (error) {
        // Apenas log para evitar crashar
        console.error('Erro ao processar interação:', error);
      }
    });

    collector.on('end', async () => {
      try {
        if (participants.size === 0) {
          const noWinnerEmbed = EmbedBuilder.from(embed)
            .setDescription(`Sorteio finalizado!\nPrêmio: **${prize}**\nNenhum participante.`)
            .setColor('Red');
          return giveawayMessage.edit({ embeds: [noWinnerEmbed], components: [] });
        }

        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, winnersCount);
        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

        if (isCoinPrize) {
          const coins = loadCoins();
          for (const id of winners) {
            if (!coins[id]) coins[id] = { carteira: 0, banco: 0 };
            coins[id].carteira += prizeAmount;
          }
          saveCoins(coins);
        }

        const finishedEmbed = EmbedBuilder.from(embed)
          .setTitle('🎉 Sorteio Finalizado!')
          .setDescription(`Prêmio: **${prize}**\nVencedor(es): ${winnerMentions}\nParticipantes: **${participants.size}**`)
          .setColor('Green');

        await giveawayMessage.edit({ embeds: [finishedEmbed], components: [] });

        for (const winnerId of winners) {
          await interaction.channel.send(`🎊 Parabéns <@${winnerId}>! Você ganhou **${isCoinPrize ? formatAmount(prizeAmount) : prize}**!`);
        }
      } catch (error) {
        console.error('Erro ao finalizar o sorteio:', error);
      }
    });
  }
};