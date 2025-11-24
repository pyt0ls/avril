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
    .setName('ban')
    .setDescription('Bane um usuário do servidor com confirmação.')
    .addUserOption(option =>
      option.setName('usuario').setDescription('Usuário que será banido').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('motivo').setDescription('Motivo do banimento').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
  
  if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
  return interaction.reply({
    content: '❌ Você precisa da permissão **Banir Membros** para usar este comando.',
    ephemeral: true,
  });
}
    const user = interaction.options.getMember('usuario');
    const motivo = interaction.options.getString('motivo') || 'Motivo não especificado';

    // 🔒 Checagens
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: '🚫 Eu não tenho permissão para **banir membros**.',
        ephemeral: true,
      });
    }

    if (!user) {
      return interaction.reply({
        content: '⚠️ Não foi possível encontrar o usuário.',
        ephemeral: true,
      });
    }

    if (!user.bannable) {
      return interaction.reply({
        content: '❌ Não consigo banir esse usuário. Verifique minha hierarquia e permissões.',
        ephemeral: true,
      });
    }

    if (user.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ Você não pode se banir.',
        ephemeral: true,
      });
    }

    if (user.id === interaction.client.user.id) {
      return interaction.reply({
        content: '❌ Eu não posso me banir.',
        ephemeral: true,
      });
    }

    // ⏳ Embed de confirmação
    const confirmEmbed = new EmbedBuilder()
      .setTitle('🔨 Confirmar Banimento')
      .setDescription(`Deseja banir \`${user.user.tag}\`?\n**Motivo:** ${motivo}`)
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

    const reply = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({
      time: 15000,
      filter: i => i.user.id === interaction.user.id,
    });

    collector.on('collect', async i => {
      if (i.customId === 'confirm_ban') {
        await user.ban({ reason: motivo });

        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Usuário Banido')
          .addFields(
            { name: '👤 Usuário', value: `${user.user.tag}`, inline: true },
            { name: '🛠️ Moderador', value: `${interaction.user.tag}`, inline: true },
            { name: '📄 Motivo', value: motivo }
          )
          .setColor('DarkRed')
          .setTimestamp();

        await i.update({ embeds: [successEmbed], components: [] });
        collector.stop();
      }

      if (i.customId === 'cancel_ban') {
        await i.update({
          content: '❌ Banimento cancelado.',
          embeds: [],
          components: [],
        });
        collector.stop();
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        reply.edit({
          content: '⏱️ Tempo esgotado. Banimento cancelado.',
          embeds: [],
          components: [],
        }).catch(() => {});
      }
    });
  },
};