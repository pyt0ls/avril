const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
    name: 'botinfo',
    aliases: ['bi'],
    description: 'Exibe informações sobre o bot.',
    category: 'Utilidades',
    async execute(message) {
        const bot = message.client.user;

        const embed = new EmbedBuilder()
            .setTitle('<:blue_66x:1304070562016137300> AVRIL BOT')
            .setDescription(`**\`💬\`** • Olá ${message.author.username}! Como sabe, sou a avril, uma simples bot contendo diversos comandos para divertir e ajudar você ou seu servidor!\n\n**• Veja algumas informações.**`)
            .addFields(
                {
                    name: '[🏆] • avril:',
                    value: `> **• Nome:** ${bot.username}\n> **• Prefixo:** ${config.PREFIX} (padrão)\n> **• Comandos:** ${message.client.commands.size} no total.`
                },
                {
                    name: '[👑] • Developer:',
                    value: `> **• Nome:** [\`@pytols#0000\`](https://discordapp.com/users/${bot.ownerId || '437129096674410496'})\n> **• TikTok:** [@pytols](https://tiktok.com/@pytols)\n> **• Instagram:** [@pytols](https://instagram.com/pytols)`
                }
            )
            .setAuthor({ name: 'Informações sobre mim!', iconURL: bot.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
            .setColor('#00bfff')
            .setImage('https://dl.dropboxusercontent.com/scl/fi/gaoks9j7h0un7we6cfk33/1745652693080.jpeg?rlkey=av8fm1xpp12v4bumdxdczpbcg&dl=0')
            .setFooter({ text: 'avril. • Obrigado por me usar!' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Adicione')
                .setStyle(ButtonStyle.Link)
                .setURL(config.INVITE_URL || 'https://discord.com/api/oauth2/authorize?client_id=1361444936880492604&permissions=8&scope=bot%20applications.commands'),
            new ButtonBuilder()
                .setLabel('Meu Servidor')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/NmWy87RjFe')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
};