const { EmbedBuilder, Events, ChannelType, PermissionsBitField } = require('discord.js');

// Substitua pelo ID do canal de log
const LOG_CHANNEL_ID = '1384377034871930910';

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    try {
      // Buscar dono do servidor
      const owner = await guild.fetchOwner();

      // Tentar criar convite de algum canal de texto
      let inviteLink = '❌ Sem permissão para criar convite';

      const textChannel = guild.channels.cache.find(
        ch =>
          ch.type === ChannelType.GuildText &&
          ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite)
      );

      if (textChannel) {
        const invite = await textChannel.createInvite({ maxAge: 0, maxUses: 0, reason: 'Log de entrada' });
        inviteLink = `[Clique aqui para entrar](${invite.url})`;
      }

      // Criar embed
      const embed = new EmbedBuilder()
        .setTitle('📥 Novo Servidor Adicionado')
        .setColor('Green')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '📛 Nome do Servidor', value: guild.name, inline: true },
          { name: '🆔 ID do Servidor', value: guild.id, inline: true },
          { name: '👑 Dono', value: `${owner.user.tag} (${owner.id})` },
          { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
          { name: '🌍 Região', value: guild.preferredLocale || 'Indefinida', inline: true },
          { name: '🔗 Link de Convite', value: inviteLink }
        )
        .setFooter({ text: `Agora estou em ${guild.client.guilds.cache.size} servidores.` })
        .setTimestamp();

      // Buscar canal de log
      const logChannel = await guild.client.channels.fetch(LOG_CHANNEL_ID);

      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Erro ao registrar entrada em novo servidor:', err);
    }
  }
};