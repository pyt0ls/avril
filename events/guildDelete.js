const { EmbedBuilder, Events } = require('discord.js');

// ID do canal de log
const LOG_CHANNEL_ID = '1384377074323820647';

module.exports = {
  name: Events.GuildDelete,
  async execute(guild) {
    try {
      // Tentar obter dono do cache (não é garantido após remoção)
      let ownerInfo = 'Indisponível';
      if (guild.ownerId) {
        const owner = await guild.client.users.fetch(guild.ownerId).catch(() => null);
        if (owner) {
          ownerInfo = `${owner.tag} (${owner.id})`;
        }
      }

      // Tentar obter o link do servidor (último invite conhecido)
      let inviteLink = 'Nenhum convite encontrado';
      const invites = await guild.invites?.fetch().catch(() => null);
      if (invites && invites.size > 0) {
        const firstInvite = invites.first();
        if (firstInvite) {
          inviteLink = `https://discord.gg/${firstInvite.code}`;
        }
      }

      // Criar embed de saída
      const embed = new EmbedBuilder()
        .setTitle('📤 Removido de um Servidor')
        .setColor('Red')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '📛 Nome do Servidor', value: guild.name || 'Nome desconhecido', inline: true },
          { name: '🆔 ID do Servidor', value: guild.id, inline: true },
          { name: '👑 Dono', value: ownerInfo },
          { name: '👥 Membros (no momento da saída)', value: `${guild.memberCount || 'Desconhecido'}`, inline: true },
          { name: '🔗 Convite (último conhecido)', value: inviteLink }
        )
        .setFooter({ text: `Agora estou em ${guild.client.guilds.cache.size} servidores.` })
        .setTimestamp();

      // Buscar canal de log
      const logChannel = await guild.client.channels.fetch(LOG_CHANNEL_ID);

      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Erro ao registrar saída de servidor:', err);
    }
  }
};