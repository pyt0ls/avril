const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const cooldown = 10 * 1000; // 10 segundos
const userCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('beijar')
    .setDescription('Beije um usuário mencionado com carinho!')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para beijar')
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

    // Prefixo personalizado (usado só no footer)
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
      return interaction.reply({ content: '❌ Você não pode beijar um bot!', ephemeral: true });
    }

    const gifs = [
      'https://static.tumblr.com/d706565a2bc6d483d1653ccb0b20131a/xsrwpob/WXNo9ggsk/tumblr_static_716b76zo9lwkgc0oc4g4oo0gg.gif',
      'https://i.waifu.pics/cW4uZF0.gif',
      'https://i.waifu.pics/eKNeUOR.gif',
      'https://rrp-production.loritta.website/img/f5c51a13f2eaf61436ae9ea82c9139e870478287.gif'
    ];

    const embed = new EmbedBuilder()
      .setDescription(`> ${interaction.user} **você beijou** ${target} <:gg4ps013:1319421185628569632>`)
      .setColor('#f100ff')
      .setImage(gifs[Math.floor(Math.random() * gifs.length)])
      .setFooter({ text: `Use "${prefix}beijar @" para beijar alguém!` });

    await interaction.reply({ embeds: [embed] });
  },
};