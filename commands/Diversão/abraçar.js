const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'abraçar',
    aliases: ['abraço'],
    description: 'Abrace alguém com carinho!',
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
        if (target.bot) return message.reply({ content: '<:No_New00K:1332805357885722636> Você não pode abraçar um bot!' });

        const gifs = [
            'https://cdn.weeb.sh/images/Sk-xxs3C-.gif',
            'https://cdn.weeb.sh/images/ryjJFdmvb.gif',
            'https://cdn.weeb.sh/images/HJ7lY_QwW.gif',
            'https://cdn.weeb.sh/images/Hk0yFumwW.gif'
        ];

        const colors = ['#00FF00', '#FF8D00', '#98BDF0', '#264BEC'];

        const embed = new EmbedBuilder()
            .setDescription(`🤗 ${message.author} você abraçou ${target}`)
            .setColor(colors[Math.floor(Math.random() * colors.length)])
            .setImage(gifs[Math.floor(Math.random() * gifs.length)])
            .setFooter({ text: `use "${prefix}abraçar @" para abraçar alguém.` });

        message.channel.send({ embeds: [embed] });
    }
};