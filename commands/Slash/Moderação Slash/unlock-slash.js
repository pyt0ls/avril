const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Desbloqueia o canal atual para todos.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    // Verifica permissão do usuário
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: '❌ Você precisa da permissão **Gerenciar Cargos** para usar este comando.',
        ephemeral: true,
      });
    }

    // Verifica permissão do bot
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: '❌ Eu preciso da permissão **Gerenciar Cargos** para desbloquear o canal.',
        ephemeral: true,
      });
    }

    try {
      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: true }
      );

      await interaction.reply('<:deslock:1382065249817202740> Canal desbloqueado com sucesso!');
    } catch (err) {
      console.error('Erro ao desbloquear o canal:', err);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao tentar desbloquear este canal.',
        ephemeral: true,
      });
    }
  },
};