const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unroleall-bots')
    .setDescription('Remove um cargo de todos os bots do servidor.')
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('Remova um cargo de todos os bots.')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🛡️ Verifica permissão do usuário
    // Está presente
if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
  return interaction.reply({
    content: '❌ Você precisa da permissão **Gerenciar Cargos** para usar este comando.',
    ephemeral: true
  });
}

// Está faltando (exemplo de como deveria ter)
if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
  return interaction.reply({
    content: '❌ Eu preciso da permissão **Gerenciar Cargos** para executar isso.',
    ephemeral: true
  });
}

    const role = interaction.options.getRole('cargo');

    // 🔒 Verifica se o bot pode remover o cargo
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: '❌ Não posso remover esse cargo porque ele está acima do meu cargo mais alto.',
        ephemeral: true
      });
    }

    // ⏳ Defer para ganhar tempo
    await interaction.deferReply({ ephemeral: true });

    const statusEmbed = new EmbedBuilder()
      .setTitle('🔄 Removendo Cargo de Bots...')
      .setDescription(`Removendo o cargo ${role} de todos os bots. Isso pode levar alguns minutos, por favor aguarde.`)
      .setColor('Yellow')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [statusEmbed] });

    // Busca todos os membros
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

    // Remove cargo apenas de bots que têm o cargo
    for (const member of members.values()) {
      if (!member.user.bot || !member.roles.cache.has(role.id)) continue;

      try {
        await member.roles.remove(role);
        sucesso++;
      } catch (err) {
        falha++;
      }

      await new Promise(res => setTimeout(res, 300));
    }

    const finalEmbed = new EmbedBuilder()
      .setTitle('✅ Cargo Removido dos Bots')
      .setDescription(`O cargo ${role} foi removido de todos os bots do servidor.`)
      .addFields(
        { name: '✅ Sucesso', value: `${sucesso}`, inline: true },
        { name: '❌ Falha', value: `${falha}`, inline: true },
        { name: '🤖 Bots encontrados', value: `${members.filter(m => m.user.bot).size}`, inline: true }
      )
      .setColor('Green')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [finalEmbed] });
  }
};