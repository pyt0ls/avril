const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matar')
    .setDescription('Atire em um usuário mencionado!')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('O usuário que você quer matar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: '<:No_New00K:1332805357885722636> Você não pode se mencionar!',
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: '<:No_New00K:1332805357885722636> Você não pode matar um bot!',
        ephemeral: true
      });
    }

    const gifs = [
      'https://cdn.discordapp.com/attachments/399448944889036801/608649210757251082/punch.gif',
      'https://cdn.discordapp.com/attachments/399448944889036801/608645883487322112/kill.gif',
      'https://cdn.discordapp.com/attachments/399448944889036801/651506952152809482/c8279fec-8b6e-43e3-aa98-d81938252061.gif',
      'https://media.giphy.com/media/20KSmo8aJ7HYu5L0rf/giphy.gif'
    ];

    const colors = ['#00FF00', '#FF0000', '#FFFF00', '#47EABC', '#DF2E90', '#543683', '#264BEC'];

    const embed = new EmbedBuilder()
      .setDescription(`🔫 ${interaction.user} atirou em ${target} e matou.`)
      .setColor(colors[Math.floor(Math.random() * colors.length)])
      .setImage(gifs[Math.floor(Math.random() * gifs.length)])
      .setFooter({ text: `use "/matar" pra matar alguém.` });

    await interaction.reply({ embeds: [embed] });
  }
};