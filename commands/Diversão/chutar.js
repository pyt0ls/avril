const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'chutar',
    aliases: [],
    description: 'Dê um chute em um usuário mencionado!',
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
        if (target.bot) return message.reply({ content: '<:No_New00K:1332805357885722636> Você não pode chutar um bot!' });

        const gifs = [
            'https://pa1.narvii.com/6448/73ad0e09e85cb03326191829ce593444b16c7fda_hq.gif',
            'https://pa1.narvii.com/6385/cfb4b6bc81a6288bec8b690ffbb538336e41f953_hq.gif',
            'https://pa1.narvii.com/6448/6e438ddfb3466577d3da5e242cadaa324bfd6267_hq.gif',
            'https://i.kym-cdn.com/photos/images/original/001/228/265/7bf.gif'
        ];

        const embed = new EmbedBuilder()
            .setDescription(`🦶🏻 ${message.author} você chutou ${target}`)
            .setColor('#177DDA')
            .setImage(gifs[Math.floor(Math.random() * gifs.length)])
            .setFooter({ text: `use "${prefix}chutar @" pra chutar alguém.` });

        message.channel.send({ embeds: [embed] });
    }
};