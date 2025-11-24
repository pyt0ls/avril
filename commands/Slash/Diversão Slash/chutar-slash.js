const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const cooldown = 10 * 1000; // 10 segundos cooldown
const userCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chutar')
    .setDescription('Dê um chute em um usuário mencionado!')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para chutar')
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

    // Prefixo personalizado para o footer
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
      return interaction.reply({ content: '❌ Você não pode chutar um bot!', ephemeral: true });
    }

    const gifs = [
      'https://pa1.narvii.com/6448/73ad0e09e85cb03326191829ce593444b16c7fda_hq.gif',
      'https://pa1.narvii.com/6385/cfb4b6bc81a6288bec8b690ffbb538336e41f953_hq.gif',
      'https://pa1.narvii.com/6448/6e438ddfb3466577d3da5e242cadaa324bfd6267_hq.gif',
      'https://i.kym-cdn.com/photos/images/original/001/228/265/7bf.gif'
    ];

    const embed = new EmbedBuilder()
      .setDescription(`🦶🏻 ${interaction.user} você chutou ${target}`)
      .setColor('#177DDA')
      .setImage(gifs[Math.floor(Math.random() * gifs.length)])
      .setFooter({ text: `use "${prefix}chutar @" pra chutar alguém.` });

    await interaction.reply({ embeds: [embed] });
  }
};