const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ban',
  description: 'Bane um usuário do servidor com confirmação',
  async execute(message, args, client) {
    // Só permitir em servidores
    if (!message.guild || !message.member) {
      return message.reply('❌ Este comando só pode ser usado em servidores.');
    }

    // Permissão do autor
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('🚫 Você não tem permissão para **banir membros**.');
    }

    // Permissão do bot
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('🚫 Eu não tenho permissão para **banir membros**.');
    }

    const user = message.mentions.members.first();
    const motivo = args.slice(1).join(' ') || 'Motivo não especificado';

    if (!user) {
      return message.reply('⚠️ Mencione um usuário para banir. Ex: `ban @user motivo`');
    }

    if (!user.bannable) {
      return message.reply('❌ Não consigo banir esse usuário. Verifique minha hierarquia e permissões.');
    }

    if (user.id === message.author.id) {
      return message.reply('❌ Você não pode se banir.');
    }

    if (user.id === client.user.id) {
      return message.reply('❌ Eu não posso me banir.');
    }

    // Embed de confirmação
    const confirmEmbed = new EmbedBuilder()
      .setTitle('🔨 Confirmar Banimento')
      .setDescription(`Deseja banir \`${user.user.username}\`?\n**Motivo:** ${motivo}`)
      .setColor('Red');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_ban')
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_ban')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({ embeds: [confirmEmbed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      time: 15000, // 15 segundos
      filter: (i) => i.user.id === message.author.id,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'confirm_ban') {
        await user.ban({ reason: motivo });

        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Usuário Banido')
          .addFields(
            { name: '👤 Usuário', value: `${user.user.tag}`, inline: true },
            { name: '🛠️ Moderador', value: `${message.author.tag}`, inline: true },
            { name: '📄 Motivo', value: motivo }
          )
          .setColor('DarkRed')
          .setTimestamp();

        await interaction.update({ embeds: [successEmbed], components: [] });
        collector.stop();
      }

      if (interaction.customId === 'cancel_ban') {
        await interaction.update({ content: '❌ Banimento cancelado.', embeds: [], components: [] });
        collector.stop();
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await msg.edit({ content: '⏱️ Tempo esgotado. Banimento cancelado.', embeds: [], components: [] }).catch(() => {});
      }
    });
  },
};