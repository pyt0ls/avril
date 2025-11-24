const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'invite',
  description: 'Me adicione ao seu servidor com permissões essenciais!',
  async execute(message) {
    const user = message.author;
    const bot = message.client.user;

    const embed = new EmbedBuilder()
      .setColor('#47ff00')
      .setAuthor({ 
        name: 'feliz por me escolher!', 
        iconURL: 'https://cdn.discordapp.com/emojis/1332805350847414365.png?v=1&size=48&quality=lossless' 
      })
      .setTitle('<:pureza_i:1382063941030776932> | **Me adicione!**')
      .setDescription('**Click abaixo para adicionar o bot em seu servidor, lembrando que você deve fornecer permissões essenciais para um bom funcionamento!**')
      .setFooter({ text: `obrigada(a) ${user.username}`, iconURL: user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Clique aqui para add')
        .setStyle(ButtonStyle.Link)
        .setEmoji('<:links:1329724255163781150>')
        .setURL('https://discord.com/oauth2/authorize?client_id=1361444936880492604&permissions=8&integration_type=0&scope=bot%20applications.commands')
    );

    message.channel.send({ embeds: [embed], components: [row] });
  },
};