const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sug')
    .setDescription('Envia uma sugestão para os desenvolvedores.')
    .addStringOption(option =>
      option.setName('descricao')
        .setDescription('Descreva a sugestão que deseja enviar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const canalSugestao = '1358950103628386364';
    const conteudo = interaction.options.getString('descricao');

    if (!conteudo) {
      return interaction.reply({ content: '❌ Escreva a sugestão que deseja enviar.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('💡 Nova Sugestão')
      .addFields(
        { name: 'Usuário', value: `<@${interaction.user.id}> (\`${interaction.user.id}\`)` },
        { name: 'Sugestão', value: conteudo }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Sugestão enviada via comando' })
      .setTimestamp();

    const canalDestino = interaction.client.channels.cache.get(canalSugestao);
    if (!canalDestino) {
      return interaction.reply({ content: '❌ Canal de sugestões não encontrado.', ephemeral: true });
    }

    await canalDestino.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Sugestão enviada com sucesso!', ephemeral: true });
  }
};