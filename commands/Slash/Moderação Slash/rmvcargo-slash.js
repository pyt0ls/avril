const { 
  SlashCommandBuilder, 
  PermissionsBitField, 
  EmbedBuilder 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rmvcargo')
    .setDescription('Remove um cargo de um usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que terá o cargo removido')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('Cargo a ser removido')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

  async execute(interaction) {
  
  // Verificação permissão do usuário
if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
  return interaction.reply({ content: '❌ Você não tem permissão para gerenciar cargos.', ephemeral: true });
}

// Verificação permissão do bot
if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
  return interaction.reply({ content: '❌ Eu preciso da permissão **Gerenciar Cargos** para executar isso.', ephemeral: true });
}
    const user = interaction.options.getMember('usuario');
    const role = interaction.options.getRole('cargo');

    if (!interaction.guild) {
      return interaction.reply({ content: '❌ Este comando só pode ser usado dentro de um servidor.', ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: '❌ Você não tem permissão para gerenciar cargos.', ephemeral: true });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: '❌ Eu preciso da permissão `Gerenciar Cargos` para executar isso.', ephemeral: true });
    }

    if (!user) {
      return interaction.reply({ content: '❌ Usuário inválido ou não encontrado no servidor.', ephemeral: true });
    }

    if (!role) {
      return interaction.reply({ content: '❌ Cargo inválido ou não encontrado no servidor.', ephemeral: true });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: '❌ Não posso remover esse cargo, ele está acima do meu cargo.', ephemeral: true });
    }

    if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({ content: '❌ Você não pode gerenciar cargos iguais ou superiores ao seu.', ephemeral: true });
    }

    if (!user.roles.cache.has(role.id)) {
      return interaction.reply({ content: '⚠️ Este usuário não possui esse cargo.', ephemeral: true });
    }

    try {
      await user.roles.remove(role);

      const embed = new EmbedBuilder()
        .setTitle('❌ Cargo Removido')
        .setColor('Red')
        .addFields(
          { name: '👤 Usuário', value: `<@${user.id}>`, inline: true },
          { name: '📛 Cargo', value: `<@&${role.id}>`, inline: true },
          { name: '👮 Responsável', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Opcional: apaga a resposta após 10 segundos
      setTimeout(async () => {
        const msg = await interaction.fetchReply();
        if (msg.deletable) await msg.delete().catch(() => {});
      }, 10000);

    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ Erro ao tentar remover o cargo. Verifique permissões e hierarquia.', ephemeral: true });
    }
  }
};