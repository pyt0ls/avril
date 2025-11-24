const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unroleall')
    .setDescription('Remove um cargo de todos os membros do servidor.')
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('O cargo que será removido de todos os membros.')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Permissão do usuário
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: '❌ Você precisa da permissão **Gerenciar Cargos** para usar este comando.',
        ephemeral: true
      });
    }
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
  return interaction.reply({
    content: '❌ Eu preciso da permissão **Gerenciar Cargos** para remover cargos dos membros.',
    ephemeral: true
  });
}

    const role = interaction.options.getRole('cargo');

    // Hierarquia de cargos do bot
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: '❌ Não posso remover esse cargo porque ele está acima do meu cargo mais alto.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // Embed inicial
    const statusEmbed = new EmbedBuilder()
      .setTitle('🕐 Removendo Cargo...')
      .setDescription(`Removendo o cargo ${role} de todos os membros. Isso pode levar alguns minutos, por favor aguarde.`)
      .setColor('Orange')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [statusEmbed] });

    let members;
    try {
      members = await interaction.guild.members.fetch();
    } catch (err) {
      console.error(err);
      return interaction.editReply({
        content: '❌ Erro ao buscar os membros. Verifique se o bot tem o intent **Guild Members** ativado no Developer Portal.',
        embeds: [],
      });
    }

    let sucesso = 0;
    let falha = 0;

    for (const member of members.values()) {
      if (member.user.bot || !member.roles.cache.has(role.id)) continue;

      try {
        await member.roles.remove(role);
        sucesso++;
      } catch {
        falha++;
      }

      await new Promise(res => setTimeout(res, 300));
    }

    // Embed final
    const finalEmbed = new EmbedBuilder()
      .setTitle('✅ Cargo Removido de Todos')
      .setDescription(`O cargo ${role} foi removido dos membros do servidor.`)
      .addFields(
        { name: '✅ Sucesso', value: `${sucesso}`, inline: true },
        { name: '❌ Falha', value: `${falha}`, inline: true },
        { name: '👥 Total Escaneado', value: `${members.size}`, inline: true }
      )
      .setColor('Red')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [finalEmbed] });
  }
};