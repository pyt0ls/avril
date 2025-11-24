const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'kick',
  description: 'Expulsa um usuário do servidor com confirmação.',
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ Você precisa da permissão **Expulsar Membros** para usar este comando.');
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ Eu preciso da permissão **Expulsar Membros** para isso.');
    }

    const member = message.mentions.members.first();
    const motivo = args.slice(1).join(' ') || 'Sem motivo fornecido';

    if (!member) return message.reply('❌ Mencione um usuário válido para expulsar.');
    if (!member.kickable || member.id === message.author.id)
      return message.reply('❌ Não posso expulsar este membro.');

    const confirmEmbed = new EmbedBuilder()
      .setColor('Orange')
      .setTitle('⚠️ Confirmação de Expulsão')
      .setDescription(`Você deseja mesmo expulsar **${member.user.tag}**?\nMotivo: \`${motivo}\``);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_kick_${member.id}`)
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_kick')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    const sent = await message.reply({ embeds: [confirmEmbed], components: [row] });

    const collector = sent.createMessageComponentCollector({
      time: 15000,
      filter: (i) => i.user.id === message.author.id,
    });

    let actionTaken = false;

    collector.on('collect', async (interaction) => {
      if (interaction.customId === `confirm_kick_${member.id}`) {
        try {
          await member.kick(motivo);
          await interaction.update({
            content: `✅ ${member.user.tag} foi expulso.\n📝 Motivo: ${motivo}`,
            embeds: [],
            components: [],
          });
          actionTaken = true;
          collector.stop(); // Encerra o coletor para não cair no "tempo esgotado"
        } catch (err) {
          console.error('Erro ao expulsar:', err);
          await interaction.update({
            content: '❌ Ocorreu um erro ao tentar expulsar o membro.',
            embeds: [],
            components: [],
          });
          actionTaken = true;
          collector.stop();
        }
      } else if (interaction.customId === 'cancel_kick') {
        await interaction.update({
          content: '❎ Expulsão cancelada.',
          embeds: [],
          components: [],
        });
        actionTaken = true;
        collector.stop();
      }
    });

    collector.on('end', () => {
      if (!actionTaken) {
        sent.edit({
          content: '⏰ Tempo esgotado. Expulsão cancelada.',
          embeds: [],
          components: [],
        });
      }
    });
  },
};