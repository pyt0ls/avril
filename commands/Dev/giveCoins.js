const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const {
  loadCoins,
  saveCoins,
  parseAmount,
  formatAmount
} = require('../../utils/coinsUtils');
const config = require('../../config');

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

module.exports = {
  name: 'sortcoins',
  description: 'Inicia um sorteio.',
  usage: 'sortcoins <tempo> [quantidade_de_vencedores] <prêmio>',
  cooldown: 10,
  async execute(message, args) {
    if (!config.OWNERS.includes(message.author.id)) {
      return message.reply('🚫 Você não tem permissão para usar este comando.');
    }

    if (args.length < 2) {
      return message.reply('❌ Uso incorreto! Exemplo: `!giveaway 5m 3 100k` ou `!giveaway 10m Nitro`');
    }

    const durationStr = args[0];
    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      return message.reply('❌ Tempo inválido! Use formato como 10s, 5m, 1h, 2d');
    }

    let winnersCount = 1;
    let prizeStartIndex = 1;
    if (!isNaN(args[1]) && Number(args[1]) > 0) {
      winnersCount = Math.min(50, Math.max(1, parseInt(args[1])));
      prizeStartIndex = 2;
    }

    const prize = args.slice(prizeStartIndex).join(' ');
    if (!prize) {
      return message.reply('❌ Você precisa especificar o prêmio do sorteio.');
    }

    const prizeAmount = parseAmount(prize);
    const isCoinPrize = prizeAmount && !isNaN(prizeAmount) && prizeAmount > 0;

    let participants = new Set();

    const endTimestamp = Date.now() + durationMs;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Sorteio iniciado!')
      .setDescription(`Prêmio: **${prize}**\nTermina em: <t:${Math.floor(endTimestamp / 1000)}:R>\nVencedor(es): **${winnersCount}**\n\nClique no botão para participar!`)
      .setColor('Blue')
      .setFooter({ text: `Iniciado por ${message.author.tag}` });

    const customId = `giveaway_${Date.now()}_${message.id}`;

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(customId)
          .setLabel('Participar')
          .setStyle(ButtonStyle.Success)
      );

    const giveawayMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = giveawayMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: durationMs,
      filter: i => i.customId === customId
    });

    collector.on('collect', async i => {
      if (i.user.bot) return i.reply({ content: 'Bots não podem participar.', ephemeral: true });

      if (participants.has(i.user.id)) {
        return i.reply({ content: 'Você já está participando!', ephemeral: true });
      }

      participants.add(i.user.id);

      const updatedEmbed = EmbedBuilder.from(embed)
        .setDescription(`Prêmio: **${prize}**\nTermina em: <t:${Math.floor(endTimestamp / 1000)}:R>\nVencedor(es): **${winnersCount}**\n\nParticipantes: **${participants.size}**\n\nClique no botão para participar!`);

      await giveawayMessage.edit({ embeds: [updatedEmbed] });

      await i.reply({ content: 'Você entrou no sorteio! Boa sorte! 🍀', ephemeral: true });
    });

    collector.on('end', async () => {
      if (participants.size === 0) {
        const noWinnerEmbed = EmbedBuilder.from(embed)
          .setTitle('Sorteio finalizado')
          .setDescription(`Não houve participantes para o sorteio do prêmio **${prize}**.`)
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
          coins[id].banco += prizeAmount;
        }
        saveCoins(coins);
      }

      const endedEmbed = EmbedBuilder.from(embed)
        .setTitle('🎉 Sorteio finalizado!')
        .setDescription(`Prêmio: **${prize}**\n\nVencedor(es): ${winnerMentions}\nTotal de participantes: **${participants.size}**`)
        .setColor('Green');

      await giveawayMessage.edit({ embeds: [endedEmbed], components: [] });

      await message.channel.send(`🎊 Parabéns ${winnerMentions}! Você ganhou **${isCoinPrize ? formatAmount(prizeAmount) : prize}**!`);
    });
  }
};