const {
  AttachmentBuilder,
} = require('discord.js');

const supportRoleId = '1347470996025905165';
const ticketLogChannelId = '1353845937704800396';

async function handleTicketButtonInteraction(interaction) {
  if (!interaction.isButton()) return false;

  const { customId, channel, guild, member, user } = interaction;

  if (!channel.name.startsWith('ticket-')) return false;

  const parts = customId.split('_');
  const authorId = parts.pop();
  const action = parts.join('_');

  if (user.id !== authorId && !member.roles.cache.has(supportRoleId)) {
    await interaction.reply({ content: '❌ Você não pode usar este botão.', flags: 64 });
    return true;
  }

  const logChannel = guild.channels.cache.get(ticketLogChannelId);

  const generateTranscript = async () => {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const transcript = sorted.map(msg =>
      `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.cleanContent}`
    ).join('\n') || 'Sem mensagens no ticket.';

    return new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), { name: `${channel.name}.txt` });
  };

  if (action === 'ticket_close-btn') {
    await interaction.reply({ content: 'Ticket concluído! Salvando transcrição e fechando em 5 segundos.', flags: 64 });

    const transcriptFile = await generateTranscript();

    if (logChannel) {
      await logChannel.send({
        content: `✅ Ticket **concluído** em ${channel} por ${user.tag}`,
        files: [transcriptFile]
      });
    }

    setTimeout(() => channel.delete().catch(() => {}), 5000);
    return true;
  }

  if (action === 'ticket_cancel-btn') {
    await interaction.reply({ content: 'Cancelando... Salvando transcrição e fechando em 10 segundos.', flags: 64 });

    const transcriptFile = await generateTranscript();

    if (logChannel) {
      await logChannel.send({
        content: `❌ Ticket **cancelado** em ${channel} por ${user.tag}`,
        files: [transcriptFile]
      });
    }

    setTimeout(() => channel.delete().catch(() => {}), 10000);
    return true;
  }

  return false;
}

module.exports = { handleTicketButtonInteraction };