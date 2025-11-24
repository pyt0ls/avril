const { EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../config.js');

module.exports = {
  name: 'svlinks',
  description: 'Lista links de convite dos servidores do bot.',
  aliases: ['allsv', 'guildslink', 'linksv'],

  async execute(message, args) {
    if (!OWNERS.includes(message.author.id)) {
      return message.reply({
        content: '🚫 Este comando é exclusivo para o desenvolvedor do bot.',
        allowedMentions: { repliedUser: false }
      });
    }

    const bot = message.client;
    const guildsArray = bot.guilds.cache.map(guild => guild);
    const page = Number(args[0]) || 1;
    const guildsPerPage = 10;
    const totalPages = Math.ceil(guildsArray.length / guildsPerPage);

    if (page < 1 || page > totalPages) {
      return message.reply({
        content: `❌ Página inválida. Existem ${totalPages} páginas.`,
        allowedMentions: { repliedUser: false }
      });
    }

    const startIndex = (page - 1) * guildsPerPage;
    const endIndex = startIndex + guildsPerPage;
    const currentGuilds = guildsArray.slice(startIndex, endIndex);

    const description = await Promise.all(
      currentGuilds.map(async (guild, index) => {
        let invite;
        try {
          const invites = await guild.invites.fetch();
          invite = invites.find(i => i.maxAge === 0 && i.maxUses === 0) || invites.first();
          if (!invite) {
            const channels = guild.channels.cache.filter(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('CreateInstantInvite'));
            const channel = channels.first();
            if (channel) {
              invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
            }
          }
        } catch {
          invite = null;
        }

        const link = invite ? invite.url : 'Sem convite';

        return `**${startIndex + index + 1} -** ${link}\n> nome: **${guild.name}**`;
      })
    );

    const embed = new EmbedBuilder()
      .setTitle(`🔗 • Links dos Servidores | Página ${page}/${totalPages}`)
      .setColor('#00FFFF')
      .setThumbnail(bot.user.displayAvatarURL())
      .setDescription(description.join('\n\n') || '🚫 Nenhum servidor encontrado.')
      .setFooter({ text: `Developer ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  }
};