const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionsBitField
} = require('discord.js');
const { parseAmount, formatAmount } = require('../../utils/coinsUtils');
const fs = require('fs');
const path = require('path');

const giveawaysPath = path.resolve(__dirname, '../../database/giveaways.json');

function loadGiveaways() {
  if (!fs.existsSync(giveawaysPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(giveawaysPath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveGiveaways(data) {
  fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 4));
}

module.exports = {
  name: 'giveaway',
  description: 'Inicia um sorteio no canal.',
  usage: 'infome <tempo> <quantidade_vencedores> <prêmio> [descrição opcional]',
  permissions: [PermissionsBitField.Flags.ManageMessages],

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('🚫 Você precisa da permissão **Gerenciar Mensagens** para usar isso.');
    }

    const [tempo, vencedoresRaw, ...resto] = args;
    if (!tempo || !vencedoresRaw || resto.length === 0) {
      return message.reply('❌ Uso incorreto. Exemplo: `!sorteio 1h 1 500 coins para o vencedor`');
    }

    const match = tempo.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return message.reply('❌ Tempo inválido! Use `10s`, `5m`, `1h`, `2d`, etc.');
    }

    const unitMap = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const durationMs = parseInt(match[1]) * unitMap[match[2]];
    const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);

    const winnersCount = Math.max(1, parseInt(vencedoresRaw));
    const prize = resto.join(' ');
    const description = undefined; // opcionalmente, pode adaptar para extrair

    const prizeAmount = parseAmount(prize);
    const isCoinPrize = prizeAmount && !isNaN(prizeAmount) && prizeAmount > 0;

    const participants = new Set();

    let embedDesc = '';
    if (description) embedDesc += `📌 ${description}\n\n`;
    embedDesc += `Prêmio: **${prize}**\nTermina: <t:${endTimestamp}:R>\nVencedor(es): **${winnersCount}**\n\nClique no botão para participar!`;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Sorteio Iniciado!')
      .setDescription(embedDesc)
      .setColor('Random')
      .setFooter({ text: `Iniciado por ${message.author.tag}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setLabel('Participar')
        .setStyle(ButtonStyle.Success)
    );

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: durationMs
    });

    collector.on('collect', async i => {
      if (i.user.bot) return;

      if (participants.has(i.user.id)) {
        return i.reply({ content: 'Você já está participando!', ephemeral: true });
      }

      participants.add(i.user.id);

      let newDesc = '';
      if (description) newDesc += `📌 ${description}\n\n`;
      newDesc += `Prêmio: **${prize}**\nTermina: <t:${endTimestamp}:R>\nVencedor(es): **${winnersCount}**\n\nParticipantes: **${participants.size}**\nClique no botão para participar!`;

      const updatedEmbed = EmbedBuilder.from(embed).setDescription(newDesc);

      await msg.edit({ embeds: [updatedEmbed] });
      await i.reply({ content: 'Você entrou no sorteio! 🍀', ephemeral: true });
    });

    collector.on('end', async () => {
      if (participants.size === 0) {
        const noWinner = EmbedBuilder.from(embed)
          .setTitle('Sorteio cancelado')
          .setDescription(`❌ Ninguém participou para ganhar **${prize}**.`)
          .setColor('Red');
        return msg.edit({ embeds: [noWinner], components: [] });
      }

      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, winnersCount);
      const mentions = winners.map(id => `<@${id}>`).join(', ');

      const giveaways = loadGiveaways();

      giveaways[msg.id] = {
        messageId: msg.id,
        channelId: message.channel.id,
        guildId: message.guild.id,
        prize: prize,
        prizeAmount: prizeAmount,
        isCoinPrize: isCoinPrize,
        winnersCount: winnersCount,
        winners: winners,
        participants: [...participants],
        endedAt: Date.now(),
        startedBy: message.author.id,
      };

      saveGiveaways(giveaways);

      let finalDesc = '';
      if (description) finalDesc += `📌 ${description}\n\n`;
      finalDesc += `Prêmio: **${prize}**\nVencedor(es): ${mentions}\nTotal de participantes: **${participants.size}**`;

      const resultEmbed = EmbedBuilder.from(embed)
        .setTitle('🎉 Sorteio Finalizado!')
        .setDescription(finalDesc)
        .setColor('Green');

      await msg.edit({ embeds: [resultEmbed], components: [] });

      await message.channel.send(`🎊 Parabéns ${mentions}! Você ganhou **${isCoinPrize ? formatAmount(prizeAmount) : prize}**!`);
    });
  }
};