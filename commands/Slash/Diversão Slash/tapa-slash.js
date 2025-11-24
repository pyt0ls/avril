const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tapa')
    .setDescription('Dê um tapa em alguém!')
    .addUserOption(option =>
      option.setName('alvo')
        .setDescription('Quem você quer dar um tapa?')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('alvo');

    const prefixesPath = './database/prefixos.json';
    let prefix = 'k?';
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (prefixDB[interaction.guildId]) prefix = prefixDB[interaction.guildId];
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: '<:No_New00K:1332805357885722636> Você não pode se mencionar!',
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: '<:No_New00K:1332805357885722636> Você não pode bater em um bot!',
        ephemeral: true
      });
    }

    const gifs = [
      'https://i.imgur.com/Ra6faiG.gif',
      'https://i.imgur.com/PanITpI.gif',
      'https://media1.giphy.com/media/mEtSQlxqBtWWA/giphy.gif',
      'https://media2.giphy.com/media/gSIz6gGLhguOY/giphy.gif',
      'https://media1.giphy.com/media/6Fad0loHc6Cbe/giphy.gif'
    ];

    const colors = ['#FF0000', '#00BFFF'];

    const embed = new EmbedBuilder()
      .setDescription(`${interaction.user} deu um tapa em ${target}`)
      .setColor(colors[Math.floor(Math.random() * colors.length)])
      .setImage(gifs[Math.floor(Math.random() * gifs.length)])
      .setFooter({ text: `use "${prefix}tapa @" pra bater em alguém!` });

    interaction.reply({ embeds: [embed] });
  }
};