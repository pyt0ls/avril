const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um usuário do servidor com confirmação.')
    .addUserOption(option =>
      option.setName('usuario').setDescription('Usuário a ser expulso').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('motivo').setDescription('Motivo da expulsão').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('usuario');
    const motivo = interaction.options.getString('motivo') || 'Sem motivo fornecido';

    // Verificações
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        content: '❌ Eu preciso da permissão **Expulsar Membros** para isso.',
        ephemeral: true,
      });
    }

    if (!member) {
      return interaction.reply({
        content: '❌ Usuário não encontrado ou não está no servidor.',
        ephemeral: true,
      });
    }

    if (!member.kickable || member.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ Não posso expulsar este membro. Verifique permissões e hierarquia.',
        ephemeral: true,
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor('Orange')
      .setTitle('⚠️ Confirmação de Expulsão')
      .setDescription(`Você deseja mesmo expulsar **${member.user.tag}**?\nMotivo: \`${motivo}\``);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_kick`)
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_kick')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    const sent = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });

    const collector = sent.createMessageComponentCollector({
      time: 15000,
      filter: i => i.user.id === interaction.user.id,
    });

    let actionTaken = false;

    collector.on('collect', async i => {
      if (i.customId === 'confirm_kick') {
        try {
          await member.kick(motivo);
          await i.update({
            content: `✅ ${member.user.tag} foi expulso.\n📝 Motivo: ${motivo}`,
            embeds: [],
            components: [],
          });
        } catch (err) {
          console.error('Erro ao expulsar:', err);
          await i.update({
            content: '❌ Ocorreu um erro ao tentar expulsar o membro.',
            embeds: [],
            components: [],
          });
        }
        actionTaken = true;
        collector.stop();
      }

      if (i.customId === 'cancel_kick') {
        await i.update({
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
        }).catch(() => {});
      }
    });
  },
};