const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'cafune',
    aliases: ['cafuné', 'carinho'],
    description: 'Faça cafuné em alguém!',
    cooldown: 10,
    async execute(message, args, client) {
        const target = message.mentions.users.first();

        const prefixesPath = './database/prefixos.json';
        let prefix = ';';
        if (fs.existsSync(prefixesPath)) {
            const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
            if (prefixDB[message.guild.id]) prefix = prefixDB[message.guild.id];
        }

        if (!target) return message.reply({ content: '<:No_New00K:1332805357885722636> Você precisa mencionar alguém válido!' });
        if (target.id === message.author.id) return message.reply({ content: '<:No_New00K:1332805357885722636> Você não pode se mencionar!' });
        if (target.bot) return message.reply({ content: '<:No_New00K:1332805357885722636> Você não pode fazer cafuné em um bot!' });

        const gifs = [
            'https://cdn.discordapp.com/attachments/642851142237421568/677868049394696223/tenor_12.gif',
            'https://cdn.discordapp.com/attachments/644642667434868742/677871734644277248/1503133021_1a4cbfe6668bf99701fc37309416aed02f27047d_hq.gif',
            'https://cdn.discordapp.com/attachments/644642667434868742/677872063587024941/anime-pat-gif-8.gif'
        ];

        const embed = new EmbedBuilder()
            .setDescription(`${message.author} fez um cafuné em ${target}`)
            .setColor('#ffb6c1')
            .setImage(gifs[Math.floor(Math.random() * gifs.length)])
            .setFooter({ text: `use "${prefix}cafune @" pra fazer carinho em alguém.` });

        message.channel.send({ embeds: [embed] });
    }
};