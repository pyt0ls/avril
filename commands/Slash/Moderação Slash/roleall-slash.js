const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleall')
    .setDescription('Adiciona um cargo a todos os membros do servidor.')
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('O cargo que será atribuído a todos os membros.')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🛡️ Verifica permissão do usuário
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: '❌ Você precisa da permissão **Gerenciar Cargos** para usar este comando.',
        ephemeral: true
      });
    }
    
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
  return interaction.reply({
    content: '❌ Eu preciso da permissão **Gerenciar Cargos** para executar essa ação.',
    ephemeral: true
  });
}

    const role = interaction.options.getRole('cargo');

    // 🔒 Verifica hierarquia do cargo para o bot poder atribuir
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: '❌ Não posso atribuir esse cargo porque ele está acima do meu cargo mais alto.',
        ephemeral: true
      });
    }

    // ⏳ Defer para ganhar tempo
    await interaction.deferReply({ ephemeral: true });

    // Embed inicial - status aplicando cargo
    const statusEmbed = new EmbedBuilder()
      .setTitle('🕐 Aplicando Cargo...')
      .setDescription(`Atribuindo o cargo ${role} a todos os membros. Isso pode levar alguns minutos, por favor aguarde.`)
      .setColor('Yellow')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Envia embed inicial
    await interaction.editReply({ embeds: [statusEmbed] });

    // Buscar membros
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

    // Loop com delay para não rate limitar
    for (const member of members.values()) {
      if (member.user.bot || member.roles.cache.has(role.id)) continue;

      try {
        await member.roles.add(role);
        sucesso++;
      } catch (err) {
        falha++;
      }

      await new Promise(res => setTimeout(res, 300));
    }

    // Embed final - resumo da operação
    const finalEmbed = new EmbedBuilder()
      .setTitle('✅ Cargo Aplicado a Todos')
      .setDescription(`O cargo ${role} foi atribuído aos membros do servidor.`)
      .addFields(
        { name: '✅ Sucesso', value: `${sucesso}`, inline: true },
        { name: '❌ Falha', value: `${falha}`, inline: true },
        { name: '👥 Total Escaneado', value: `${members.size}`, inline: true }
      )
      .setColor('Green')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Edita resposta inicial para embed final
    await interaction.editReply({ embeds: [finalEmbed] });
  }
};