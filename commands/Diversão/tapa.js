const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'tapa',
    aliases: ['bater', 'slap'],
    description: 'Dê um tapa em alguém!',
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
        if (target.bot) return message.reply({ content: '<:No_New00K:1332805357885722636> Você não pode bater em um bot!' });

        const gifs = [
            'https://i.imgur.com/Ra6faiG.gif',
            'https://i.imgur.com/PanITpI.gif',
            'https://media1.giphy.com/media/mEtSQlxqBtWWA/giphy.gif',
            'https://media2.giphy.com/media/gSIz6gGLhguOY/giphy.gif',
            'https://media1.giphy.com/media/6Fad0loHc6Cbe/giphy.gif'
        ];

        const colors = ['#FF0000', '#00BFFF'];

        const embed = new EmbedBuilder()
            .setDescription(`${message.author} deu um tapa em ${target}`)
            .setColor(colors[Math.floor(Math.random() * colors.length)])
            .setImage(gifs[Math.floor(Math.random() * gifs.length)])
            .setFooter({ text: `use "${prefix}tapa @" pra bater em alguém!` });

        message.channel.send({ embeds: [embed] });
    }
};