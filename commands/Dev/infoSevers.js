const { EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../config.js');

module.exports = {
  name: 'infosevers',
  description: 'Mostra informações dos servidores que o bot está.',
  aliases: ['infosv', 'ifsv'],

  async execute(message, args) {
    if (!OWNERS.includes(message.author.id)) {
      return message.reply({
        content: '🚫 Este comando é exclusivo para o desenvolvedor do bot.',
        allowedMentions: { repliedUser: false }
      });
    }

    const guilds = message.client.guilds.cache.map(g => g);
    const totalPages = Math.ceil(guilds.length / 10);

    const page = Math.max(1, Math.min(Number(args[0]) || 1, totalPages));
    const start = (page - 1) * 10;
    const end = start + 10;

    const servers = guilds.slice(start, end);

    const embed = new EmbedBuilder()
      .setTitle(`📄 | Info de Servidores | Página ${page}/${totalPages}`)
      .setColor('#fa8072')
      .setFooter({ text: `Developer ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const description = servers.map((guild, index) => {
      const owner = guild.members.cache.get(guild.ownerId);
      const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
      return `**#${start + index + 1} |** **[${guild.name}](https://discord.com/channels/${guild.id})**\n` +
        `> 👑 | **Dono:** ${owner ? `${owner.user.username}#${owner.user.discriminator} (${guild.ownerId})` : `ID: ${guild.ownerId}`}\n` +
        `> 📆 | **Criado:** <t:${createdTimestamp}:D> | <t:${createdTimestamp}:R>\n`;
    }).join('\n');

    embed.setDescription(description || '🚫 Nenhum servidor encontrado.');

    message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  }
};