const { EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../config.js');

module.exports = {
  name: 'servidores',
  description: 'Mostra os servidores em que o bot está.',
  aliases: ['servers', 'allservers'],

  async execute(message, args) {
    // Verificar se é dono
    if (!OWNERS.includes(message.author.id)) {
      return message.reply('🚫 Este comando é exclusivo para o desenvolvedor do bot.');
    }

    try {
      const bot = message.client;

      const servidores = bot.guilds.cache.size;
      const membros = bot.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);

      const nomesServidores = bot.guilds.cache
        .map(guild => `╺╸ ${guild.name}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('🌎 • **Onde Estou?**')
        .setColor('#FA8072')
        .setDescription(
          `
📍 • **__Estou em:__**
\`\`\`${servidores} servidores\`\`\`

👥 • **__Conheço:__**
\`\`\`${membros} Membros\`\`\`

📌 • **__Nomes:__**
\`\`\`${nomesServidores}\`\`\`
          `.trim()
        )
        .setFooter({
          text: `Developer ${message.author.username}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });

    } catch (err) {
      console.error(err);

      const erroEmbed = new EmbedBuilder()
        .setDescription('**epa, um momento!**')
        .setColor('#FF0000')
        .setFooter({
          text: `Atenção aqui ${message.author.username}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });

      return message.reply({ embeds: [erroEmbed], allowedMentions: { repliedUser: false } });
    }
  },
};