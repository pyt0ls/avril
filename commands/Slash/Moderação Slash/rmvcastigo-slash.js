const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rmvcastigo')
    .setDescription('Remove o castigo (timeout) de um usuário.')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Usuário para remover o castigo')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const member = interaction.guild.members.cache.get(user.id);

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: '❌ Você não tem permissão para remover castigos.', ephemeral: true });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: '❌ Eu não tenho permissão para remover castigos. Me conceda `Moderar membros`.', ephemeral: true });
    }

    if (!member) {
      return interaction.reply({ content: '❌ Usuário não encontrado no servidor.', ephemeral: true });
    }

    if (!member.communicationDisabledUntilTimestamp || Date.now() > member.communicationDisabledUntilTimestamp) {
      return interaction.reply({ content: '❌ Este usuário não está sob castigo atualmente.', ephemeral: true });
    }

    try {
      await member.timeout(null); // Remove o timeout
      return interaction.reply(`✅ ${user.tag} teve o castigo removido com sucesso.`);
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: '❌ Não consegui remover o castigo. Verifique minhas permissões ou a hierarquia de cargos.', ephemeral: true });
    }
  },
};