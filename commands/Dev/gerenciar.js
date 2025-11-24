const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');

module.exports = {
  name: 'gerenciar',
  description: 'Gerencia um servidor onde o bot está',
  aliases: ['geren', 'gs'],
  async execute(message, args, client) {
    if (!message || !message.author || !message.channel) return;

    if (!config.OWNERS.includes(message.author.id)) {
      return await message.channel.send('❌ Apenas os donos do bot podem usar este comando.');
    }

    let guild;
    const guildId = args[0];

    if (guildId) {
      guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return await message.channel.send('❌ O bot não está nesse servidor ou o ID é inválido.');
      }
    } else {
      guild = message.guild;
    }

    const owner = await guild.fetchOwner().catch(() => null);

    // Tentar obter ou criar convite
    let inviteLink = 'Nenhum convite disponível';
    try {
      let invite;

      // Tenta buscar convites existentes
      const invites = await guild.invites.fetch();
      if (invites.size > 0) {
        invite = invites.first();
      } else {
        // Tenta criar um convite em algum canal de texto com permissão
        const channel = guild.channels.cache.find(c =>
          c.isTextBased() &&
          c.permissionsFor(guild.members.me).has(PermissionFlagsBits.CreateInstantInvite)
        );

        if (channel) {
          invite = await channel.createInvite({ maxAge: 0, maxUses: 0, reason: 'Comando gerenciar' });
        }
      }

      if (invite) inviteLink = `https://discord.gg/${invite.code}`;
    } catch (err) {
      inviteLink = 'Não foi possível gerar convite';
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔧 Gerenciamento de Servidor`)
      .setColor('Yellow')
      .setDescription(`Informações do servidor **${guild.name}**`)
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Dono', value: owner ? `${owner.user.tag} (${owner.id})` : 'Indisponível', inline: true },
        { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
        { name: '🌍 Região', value: guild.preferredLocale || 'Indefinida', inline: true },
        { name: '📆 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
        { name: '🔗 Link de Convite', value: inviteLink, inline: false }
      )
      .setThumbnail(guild.iconURL({ dynamic: true }) || null)
      .setFooter({ text: 'Gerenciamento de Servidor' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`leave_${guild.id}`)
        .setLabel('Sair do Servidor')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`fechar_${message.author.id}`)
        .setLabel('Fechar')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};