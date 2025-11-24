const { EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../config.js');

module.exports = {
  name: 'cmds',
  description: 'Mostra todos os comandos do bot.',
  aliases: ['allcmds'],

  async execute(message) {
    if (!OWNERS.includes(message.author.id)) {
      return message.reply({
        content: '🚫 Este comando é exclusivo para o desenvolvedor do bot.',
        allowedMentions: { repliedUser: false }
      });
    }

    const bot = message.client;

    const comandos = bot.commands.map(cmd => `╺╸ **${cmd.name}**`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('**Meus Comandos!**')
      .setColor('#47ff00')
      .setThumbnail(bot.user.displayAvatarURL())
      .setAuthor({ name: 'Todos meus comandos!', iconURL: bot.user.displayAvatarURL() })
      .setDescription(comandos || '🚫 Nenhum comando encontrado.')
      .setFooter({ text: `Developer ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  }
};