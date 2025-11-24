const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Bloqueia o canal atual para todos.')
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
        content: '❌ Eu preciso da permissão **Gerenciar Cargos** para bloquear o canal.',
        ephemeral: true,
      });
    }

    try {
      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: false }
      );

      interaction.reply('<:lock:1382067121218912317> Canal bloqueado com sucesso!');
    } catch (err) {
      console.error('Erro ao bloquear o canal:', err);
      interaction.reply({
        content: '❌ Ocorreu um erro ao tentar bloquear este canal.',
        ephemeral: true,
      });
    }
  },
};