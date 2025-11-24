const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleall-bots')
    .setDescription('Adiciona um cargo a todos os bots do servidor.')
    .addRoleOption(option =>
      option.setName('cargo')
        .setDescription('Adicione um cargo a todos os bots.')
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
    content: '❌ Eu preciso da permissão **Gerenciar Cargos** para atribuir cargos aos bots.',
    ephemeral: true
  });
}

    const role = interaction.options.getRole('cargo');

    // 🔒 Verifica se o bot pode atribuir o cargo
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: '❌ Não posso atribuir esse cargo porque ele está acima do meu cargo mais alto.',
        ephemeral: true
      });
    }

    // ⏳ Defer para ganhar tempo
    await interaction.deferReply({ ephemeral: true });

    const statusEmbed = new EmbedBuilder()
      .setTitle('🤖 Aplicando Cargo a Bots...')
      .setDescription(`Atribuindo o cargo ${role} a todos os bots. Isso pode levar alguns minutos, por favor aguarde.`)
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

    // Aplica cargo só aos bots
    for (const member of members.values()) {
      if (!member.user.bot || member.roles.cache.has(role.id)) continue;

      try {
        await member.roles.add(role);
        sucesso++;
      } catch (err) {
        falha++;
      }

      await new Promise(res => setTimeout(res, 300));
    }

    const finalEmbed = new EmbedBuilder()
      .setTitle('✅ Cargo Aplicado aos Bots')
      .setDescription(`O cargo ${role} foi atribuído a todos os bots do servidor.`)
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