const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const cooldown = 6000;
const userCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('amigo')
    .setDescription('Descubra seu melhor amigo!'),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    if (userCooldowns.has(userId)) {
      const expirationTime = userCooldowns.get(userId) + cooldown;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return interaction.reply({
          content: `⏳ Espere **${timeLeft}s** para usar o comando novamente!`,
          ephemeral: true,
        });
      }
    }

    userCooldowns.set(userId, now);

    const porcentagens = [
      '50%█████▒▒▒▒▒ De chance',
      '55%█████▒▒▒▒▒ De chance',
      '60%██████▒▒▒▒ De chance',
      '65%██████▒▒▒▒ De chance',
      '70%███████▒▒▒ De chance',
      '75%███████▒▒▒ De chance',
      '80%████████▒▒ De chance',
      '85%████████▒▒ De chance',
      '90%█████████▒ De chance',
      '95%█████████▒ De chance',
      '100%██████████ De chance'
    ];

    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: '❌ Este comando só pode ser usado em servidores.', ephemeral: true });
    }

    const members = guild.members.cache.filter(m => !m.user.bot && m.id !== userId);
    const randomUser = members.random();

    const chance = porcentagens[Math.floor(Math.random() * porcentagens.length)];

    const embed = new EmbedBuilder()
      .setTitle('<:cdw_white_anjo_cdw:1329730350624018463> • **Melhor Amigo**')
      .setColor('#fa8072')
      .setImage('https://cdn.discordapp.com/attachments/1148414200830505011/1155561301381230612/6c027f6bdb500e5c33b441637940ca92--naruto-sh-couples.jpg')
      .setTimestamp()
      .addFields(
        {
          name: `<@${userId}>`,
          value: `Esse pode ser ou se tornar o seu melhor amigo!\n──────── <@${randomUser?.id || userId}> ────────`,
        },
        {
          name: chance,
          value: 'Acho que seriam bons amigos, se já não são!',
        }
      );

    interaction.reply({ embeds: [embed] });
  }
};