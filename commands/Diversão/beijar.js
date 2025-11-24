const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'beijar',
    aliases: ['kiss'],
    description: 'Beije um usuário mencionado com carinho!',
    cooldown: 10,
    async execute(message, args, client) {
        const target = message.mentions.users.first();

        // Prefixo personalizado
        const prefixesPath = './database/prefixos.json';
        let prefix = ';'; // padrão
        if (fs.existsSync(prefixesPath)) {
            const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
            if (prefixDB[message.guild.id]) prefix = prefixDB[message.guild.id];
        }

        // Validações
        if (!target) {
            return message.reply({
                content: '<:No_New00K:1332805357885722636> Você precisa mencionar alguém válido!'
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                content: '<:No_New00K:1332805357885722636> Você não pode se mencionar!'
            });
        }

        if (target.bot) {
            return message.reply({
                content: '<:No_New00K:1332805357885722636> Você não pode beijar um bot!'
            });
        }

        const gifs = [
            'https://static.tumblr.com/d706565a2bc6d483d1653ccb0b20131a/xsrwpob/WXNo9ggsk/tumblr_static_716b76zo9lwkgc0oc4g4oo0gg.gif',
            'https://i.waifu.pics/cW4uZF0.gif',
            'https://i.waifu.pics/eKNeUOR.gif',
            'https://rrp-production.loritta.website/img/f5c51a13f2eaf61436ae9ea82c9139e870478287.gif'
        ];

        const embed = new EmbedBuilder()
            .setDescription(`> ${message.author} **você beijou** ${target} <:gg4ps013:1319421185628569632>`)
            .setColor('#f100ff')
            .setImage(gifs[Math.floor(Math.random() * gifs.length)])
            .setFooter({ text: `Use "${prefix}beijar @" para beijar alguém!` });

        message.channel.send({ embeds: [embed] });
    }
};