const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const cooldown = 10 * 1000; // 10 segundos cooldown
const userCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cafune')
    .setDescription('Faça cafuné em alguém!')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para fazer cafuné')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    if (userCooldowns.has(userId)) {
      const expirationTime = userCooldowns.get(userId) + cooldown;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return interaction.reply({ content: `⏳ Espere **${timeLeft}s** para usar o comando novamente!`, ephemeral: true });
      }
    }
    userCooldowns.set(userId, now);

    const target = interaction.options.getUser('usuario');
    const guild = interaction.guild;

    // Prefixo personalizado para footer
    const prefixesPath = './database/prefixos.json';
    let prefix = ';';
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (guild && prefixDB[guild.id]) prefix = prefixDB[guild.id];
    }

    // Validações
    if (target.id === userId) {
      return interaction.reply({ content: '❌ Você não pode se mencionar!', ephemeral: true });
    }

    if (target.bot) {
      return interaction.reply({ content: '❌ Você não pode fazer cafuné em um bot!', ephemeral: true });
    }

    const gifs = [
      'https://cdn.discordapp.com/attachments/642851142237421568/677868049394696223/tenor_12.gif',
      'https://cdn.discordapp.com/attachments/644642667434868742/677871734644277248/1503133021_1a4cbfe6668bf99701fc37309416aed02f27047d_hq.gif',
      'https://cdn.discordapp.com/attachments/644642667434868742/677872063587024941/anime-pat-gif-8.gif'
    ];

    const embed = new EmbedBuilder()
      .setDescription(`${interaction.user} fez um cafuné em ${target}`)
      .setColor('#ffb6c1')
      .setImage(gifs[Math.floor(Math.random() * gifs.length)])
      .setFooter({ text: `use "${prefix}cafune @" pra fazer carinho em alguém.` });

    await interaction.reply({ embeds: [embed] });
  },
};