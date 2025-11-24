const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Reporta um bug para os desenvolvedores.')
    .addStringOption(option =>
      option.setName('descricao')
        .setDescription('Descreva o bug que deseja reportar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const canalBug = '1352456197805969488';
    const conteudo = interaction.options.getString('descricao');

    if (!conteudo) {
      return interaction.reply({ content: '❌ Escreva o bug que deseja reportar.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('🐞 Novo Bug Reportado')
      .addFields(
        { name: 'Usuário', value: `<@${interaction.user.id}> (\`${interaction.user.id}\`)` },
        { name: 'Bug', value: conteudo }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Bug reportado via comando' })
      .setTimestamp();

    const canalDestino = interaction.client.channels.cache.get(canalBug);
    if (!canalDestino) {
      return interaction.reply({ content: '❌ Canal de bugs não encontrado.', ephemeral: true });
    }

    await canalDestino.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Bug reportado com sucesso!', ephemeral: true });
  }
};