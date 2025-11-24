const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ComponentType
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Desbane um usuário por ID ou todos com confirmação.')
    .addStringOption(option =>
      option.setName('alvo')
        .setDescription('ID do usuário para desbanir ou "all" para todos')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),

  async execute(interaction) {
  
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
  return interaction.reply({
    content: '❌ Você precisa da permissão **Banir Membros** para usar este comando.',
    ephemeral: true
  });
}
  
  if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
  return interaction.reply({
    content: '❌ Eu preciso da permissão **Banir Membros** para executar isso.',
    ephemeral: true
  });
}
    const target = interaction.options.getString('alvo');
    const bans = await interaction.guild.bans.fetch();

    if (target.toLowerCase() !== 'all' && !bans.has(target)) {
      return interaction.reply({ content: '❌ Esse usuário não está banido.', ephemeral: true });
    }

    const embedConfirm = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('Confirmação de Desbanimento')
      .setDescription(
        target.toLowerCase() === 'all'
          ? `Você tem certeza que quer **desbanir todos** os ${bans.size} usuários banidos?`
          : `Você tem certeza que quer **desbanir o usuário** com ID \`${target}\`?`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_unban')
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_unban')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Danger)
    );

    const reply = await interaction.reply({
      embeds: [embedConfirm],
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      max: 1,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on('collect', async i => {
      if (i.customId === 'confirm_unban') {
        await i.deferUpdate();

        if (target.toLowerCase() === 'all') {
          if (bans.size === 0) {
            return interaction.editReply({
              content: 'ℹ️ Não há usuários banidos para desbanir.',
              embeds: [],
              components: []
            });
          }

          let successCount = 0;
          for (const [userId] of bans) {
            try {
              await interaction.guild.members.unban(userId);
              successCount++;
            } catch (err) {
              console.error(`Erro ao desbanir ${userId}:`, err);
            }
          }

          return interaction.editReply({
            content: `✅ Desbanidos ${successCount} usuários com sucesso!`,
            embeds: [],
            components: []
          });
        } else {
          try {
            await interaction.guild.members.unban(target);
            return interaction.editReply({
              content: `✅ Usuário com ID \`${target}\` foi desbanido com sucesso!`,
              embeds: [],
              components: []
            });
          } catch (err) {
            console.error('Erro ao desbanir usuário:', err);
            return interaction.editReply({
              content: '❌ Não foi possível desbanir esse usuário.',
              embeds: [],
              components: []
            });
          }
        }
      } else if (i.customId === 'cancel_unban') {
        await i.deferUpdate();
        return interaction.editReply({
          content: '❌ Desbanimento cancelado.',
          embeds: [],
          components: []
        });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          content: '⌛ Tempo para confirmação expirou.',
          embeds: [],
          components: []
        });
      }
    });
  }
};