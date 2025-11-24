const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leite')
    .setDescription('Adiciona um efeito de leite ao avatar.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário para aplicar o efeito')),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario') || interaction.user;
    const avatarURL = usuario.displayAvatarURL({ format: 'png', size: 2048 });

    // Nova rota da API Pawsy
    const apiURL = `https://api.pawsy.gay/v1/leite?url=${encodeURIComponent(avatarURL)}`;

    await interaction.deferReply();

    try {
      const response = await axios.get(apiURL, { responseType: 'arraybuffer' });

      if (response.status === 200) {
        const embed = new EmbedBuilder()
          .setTitle('🍼 Avatar com leite')
          .setDescription(`<@${usuario.id}>, aqui está seu avatar com efeito!`)
          .setImage('attachment://leite.png')
          .setColor(0x00ffff)
          .setFooter({ text: `Feito por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed],
          files: [{ attachment: response.data, name: 'leite.png' }]
        });
      } else {
        await interaction.editReply('❌ Erro: a API não retornou sucesso.');
      }
    } catch (error) {
      console.error('Erro ao buscar imagem da API:', error.message);
      await interaction.editReply(`❌ Erro: ${error.response?.data?.erro || 'não foi possível gerar a imagem.'}`);
    }
  }
};