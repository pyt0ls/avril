const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'melhoramigo',
  aliases: ['bff', 'amigo'],
  async execute(message, args) {
    const cooldown = 6000;
    const userCooldowns = global.bffCooldowns || new Map();

    const now = Date.now();
    if (userCooldowns.has(message.author.id)) {
      const expirationTime = userCooldowns.get(message.author.id) + cooldown;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return message.reply({
          content: `<:att:1330271050138783785> ╸<@${message.author.id}>, espere **${timeLeft}s** para usar o comando novamente!`,
        });
      }
    }

    userCooldowns.set(message.author.id, now);
    global.bffCooldowns = userCooldowns;

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

    const randomUser = message.guild.members.cache
      .filter(member => !member.user.bot && member.id !== message.author.id)
      .random();

    const chance = porcentagens[Math.floor(Math.random() * porcentagens.length)];

    const embed = new EmbedBuilder()
      .setTitle('<:cdw_white_anjo_cdw:1329730350624018463> • **Melhor Amigo**')
      .setColor('#fa8072')
      .setImage('https://cdn.discordapp.com/attachments/1148414200830505011/1155561301381230612/6c027f6bdb500e5c33b441637940ca92--naruto-sh-couples.jpg')
      .setTimestamp()
      .addFields(
        {
          name: `<@${message.author.id}>`,
          value: `Esse pode ser ou se tornar o seu melhor amigo!\n──────── <@${randomUser?.id || message.author.id}> ────────`,
        },
        {
          name: chance,
          value: 'Acho que seriam bons amigos, se já não são!',
        }
      );

    message.channel.send({ embeds: [embed] });
  }
};