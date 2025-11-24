const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Clona e deleta o canal atual.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
  
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
  return interaction.reply({
    content: '🚫 Você precisa da permissão **Gerenciar Canais** para usar este comando.',
    ephemeral: true
  });
}
    const oldChannel = interaction.channel;

    // Verifica se o bot tem permissão
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: '❌ Eu preciso da permissão `Gerenciar Canais` para fazer isso.',
        ephemeral: true
      });
    }

    // Defer inicial
    await interaction.deferReply({ ephemeral: true });

    try {
      // Clona o canal
      const newChannel = await oldChannel.clone({
        name: oldChannel.name,
        reason: `Nuke solicitado por ${interaction.user.tag}`
      });

      // Define a posição original
      await newChannel.setPosition(oldChannel.position);

      // Cria e envia a mensagem de confirmação no novo canal
      const embed = new EmbedBuilder()
        .setDescription(`-# Canal nukado com sucesso - ${interaction.user}`)
        .setColor('#ffffff');

      await newChannel.send({ embeds: [embed] });

      // Envia resposta ao usuário
      await interaction.editReply({ content: '✅ Canal nukado!', ephemeral: true });

      // Aguarda 2 segundos antes de deletar o canal original
      setTimeout(() => {
        oldChannel.delete().catch(err => console.error('Erro ao deletar canal:', err));
      }, 2000);

    } catch (error) {
      console.error('Erro ao executar nuke:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar fazer o nuke no canal.'
      });
    }
  }
};