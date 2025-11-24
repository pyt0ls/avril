const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionsBitField } = require('discord.js');
const { parseAmount, formatAmount } = require('../../../utils/coinsUtils');
const fs = require('fs');
const path = require('path');

const giveawaysPath = path.resolve(__dirname, '../../../database/giveaways.json');

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
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Inicia um sorteio comum.')
    .addStringOption(option =>
      option.setName('tempo')
        .setDescription('Duração (ex: 1m, 1h, 2d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('premio')
        .setDescription('Prêmio do sorteio')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('vencedores')
        .setDescription('Número de vencedores (padrão: 1)')
        .setMinValue(1)
        .setRequired(false))
    .addStringOption(option =>
      option.setName('descricao')
        .setDescription('Descrição opcional que aparece acima do prêmio')
        .setRequired(false)),

  async execute(interaction) {
    // Verifica permissão do usuário
if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
  return interaction.reply({ 
    content: '🚫 Você precisa da permissão **Gerenciar Mensagens** para usar isso.', 
    ephemeral: true 
  });
}

// Verifica permissão do bot
if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
  return interaction.reply({
    content: '❌ Eu não tenho permissão para gerenciar mensagens neste servidor.',
    ephemeral: true,
  });
}

    const durationStr = interaction.options.getString('tempo');
    const prize = interaction.options.getString('premio');
    const winnersCount = interaction.options.getInteger('vencedores') || 1;
    const description = interaction.options.getString('descricao');

    // Conversão de tempo
    const match = durationStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return interaction.reply({ content: '❌ Tempo inválido! Use `10s`, `5m`, `1h`, `2d`, etc.', ephemeral: true });
    }

    const unitMap = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const durationMs = parseInt(match[1]) * unitMap[match[2]];
    const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);

    const prizeAmount = parseAmount(prize);
    const isCoinPrize = prizeAmount && !isNaN(prizeAmount) && prizeAmount > 0;

    const participants = new Set();

    // Montar descrição da embed com descrição opcional acima do prêmio
    let embedDesc = '';
    if (description) embedDesc += `📌 ${description}\n\n`;
    embedDesc += `Prêmio: **${prize}**\nTermina: <t:${endTimestamp}:R>\nVencedor(es): **${winnersCount}**\n\nClique no botão para participar!`;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Sorteio Iniciado!')
      .setDescription(embedDesc)
      .setColor('Random')
      .setFooter({ text: `Iniciado por ${interaction.user.tag}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setLabel('Participar')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
const msg = await interaction.fetchReply();

    // Criar coletor para o botão participar
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: durationMs
    });

    collector.on('collect', async i => {
      if (i.user.bot) return;

      if (participants.has(i.user.id)) {
        if (i.replied || i.deferred) {
          await i.followUp({ content: 'Você já está participando!', ephemeral: true });
        } else {
          await i.reply({ content: 'Você já está participando!', ephemeral: true });
        }
        return;
      }

      participants.add(i.user.id);

      // Atualizar embed com número de participantes
      let newDesc = '';
      if (description) newDesc += `📌 ${description}\n\n`;
      newDesc +=
        `Prêmio: **${prize}**\nTermina: <t:${endTimestamp}:R>\nVencedor(es): **${winnersCount}**\n\nParticipantes: **${participants.size}**\nClique no botão para participar!`;

      const updatedEmbed = EmbedBuilder.from(embed).setDescription(newDesc);

      await msg.edit({ embeds: [updatedEmbed] });

      if (i.replied || i.deferred) {
        await i.followUp({ content: 'Você entrou no sorteio! 🍀', ephemeral: true });
      } else {
        await i.reply({ content: 'Você entrou no sorteio! 🍀', ephemeral: true });
      }
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

      // Aqui salvamos os dados do sorteio no giveaways.json
      const giveaways = loadGiveaways();

      giveaways[msg.id] = {
        messageId: msg.id,
        channelId: interaction.channel.id,
        guildId: interaction.guild.id,
        prize: prize,
        prizeAmount: prizeAmount,
        isCoinPrize: isCoinPrize,
        winnersCount: winnersCount,
        winners: winners,
        participants: [...participants],
        endedAt: Date.now(),
        startedBy: interaction.user.id,
      };

      saveGiveaways(giveaways);

      let finalDesc = '';
      if (description) finalDesc += `📌 ${description}\n\n`;
      finalDesc += `Prêmio: **${prize}**\nVencedor(es): ${mentions}\nTotal de participantes: **${participants.size}**`;

      const resultEmbed = EmbedBuilder.from(embed)
        .setTitle('🎉 Sorteio Finalizado!')
        .setDescription(finalDesc)
        .setColor('Green');

      try {
  const fetchedMsg = await interaction.channel.messages.fetch(msg.id);
  await fetchedMsg.edit({ embeds: [resultEmbed], components: [] });
} catch (err) {
  console.warn(`⚠️ Não foi possível editar a mensagem do sorteio: ${err.message}`);
}

await interaction.channel.send(`🎊 Parabéns ${mentions}! Você ganhou **${isCoinPrize ? formatAmount(prizeAmount) : prize}**!`);
    });
  }
};