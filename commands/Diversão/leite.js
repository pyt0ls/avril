const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'leite',
  aliases: ['milk'],
  async execute(message, args) {
    // Obtém o usuário mencionado ou o autor
    const usuario = message.mentions.users.first() || message.author;
    const avatarURL = usuario.displayAvatarURL({ format: 'png', size: 2048 });

    // Constrói a URL da nova API
    const apiURL = `https://api.pawsy.gay/v1/leite?url=${encodeURIComponent(avatarURL)}`;

    try {
      // Verifica se a API responde com sucesso
      const response = await axios.get(apiURL, { responseType: 'arraybuffer' });

      // Verifica se o status é 200 OK
      if (response.status === 200) {
        const embed = new EmbedBuilder()
          .setTitle('🍼 Avatar com leite')
          .setDescription(`<@${usuario.id}>, aqui está seu avatar com efeito!`)
          .setImage(`attachment://leite.png`)
          .setColor(0x00ffff)
          .setFooter({ text: `Feito por ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();

        return message.reply({
          embeds: [embed],
          files: [{ attachment: response.data, name: 'leite.png' }]
        });
      } else {
        return message.reply('❌ Erro: a API não retornou sucesso.');
      }

    } catch (error) {
      console.error('Erro ao buscar imagem da API:', error.message);
      return message.reply(`❌ Erro: ${error.response?.data?.erro || 'não foi possível gerar a imagem.'}`);
    }
  }
};