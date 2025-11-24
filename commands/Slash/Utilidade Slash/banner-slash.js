const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch'); // Lembre-se de usar a v2 se estiver com CommonJS

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Exibe o banner de um usuário (se disponível).')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para ver o banner')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;

    try {
      const response = await fetch(`https://discord.com/api/v10/users/${user.id}`, {
        headers: {
          Authorization: `Bot ${interaction.client.token}`
        }
      });

      if (!response.ok) {
        return interaction.reply({ content: `❌ Erro ao acessar a API do Discord (status ${response.status})`, ephemeral: true });
      }

      const data = await response.json();

      if (!data.banner) {
        return interaction.reply({ content: `❌ ${user.username} não possui banner.`, ephemeral: true });
      }

      const bannerFormat = data.banner.startsWith("a_") ? "gif" : "png";
      const bannerURL = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}.${bannerFormat}?size=1024`;

      const embed = new EmbedBuilder()
        .setTitle(`🖼 Banner de ${user.username}`)
        .setImage(bannerURL)
        .setColor('#5865F2')
        .setFooter({ text: `Requisitado por ${interaction.user.username}` });

      return interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao tentar obter o banner.', ephemeral: true });
    }
  }
};