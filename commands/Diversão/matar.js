const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'matar',
    aliases: ['kill'],
    description: 'Atire em um usuário mencionado!',
    cooldown: 10,
    async execute(message, args, client) {
        let target;
        try {
            target = message.mentions.users.first() || 
                     (message.reference && (await message.channel.messages.fetch(message.reference.messageId)).author);
        } catch {
            return message.channel.send('<:No_New00K:1332805357885722636> Não foi possível encontrar a mensagem referenciada!');
        }

        const prefixesPath = './database/prefixos.json';
        let prefix = ';';
        if (fs.existsSync(prefixesPath)) {
            const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
            if (prefixDB[message.guild.id]) prefix = prefixDB[message.guild.id];
        }

        if (!target) return message.channel.send('<:No_New00K:1332805357885722636> Você precisa mencionar alguém válido!');
        if (target.id === message.author.id) return message.channel.send('<:No_New00K:1332805357885722636> Você não pode se mencionar!');
        if (target.bot) return message.channel.send('<:No_New00K:1332805357885722636> Você não pode matar um bot!');

        const gifs = [
            'https://cdn.discordapp.com/attachments/399448944889036801/608649210757251082/punch.gif',
            'https://cdn.discordapp.com/attachments/399448944889036801/608645883487322112/kill.gif',
            'https://cdn.discordapp.com/attachments/399448944889036801/651506952152809482/c8279fec-8b6e-43e3-aa98-d81938252061.gif',
            'https://media.giphy.com/media/20KSmo8aJ7HYu5L0rf/giphy.gif'
        ];

        const colors = ['#00FF00', '#FF0000', '#FFFF00', '#47EABC', '#DF2E90', '#543683', '#264BEC'];

        const embed = new EmbedBuilder()
            .setDescription(`🔫 ${message.author} atirou em ${target} e matou.`)
            .setColor(colors[Math.floor(Math.random() * colors.length)])
            .setImage(gifs[Math.floor(Math.random() * gifs.length)])
            .setFooter({ text: `use "${prefix}matar @" pra matar alguém.` });

        message.channel.send({ embeds: [embed] });
    }
};