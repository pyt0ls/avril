const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'prefeitura',
    aliases: ['empregos', 'trabalho'],
    execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#FA8072')
            .setTitle('Empregos disponíveis')
            .setDescription(
                `> **Olá <@${message.author.id}>, vejo que está procurando um emprego!**\n` +
                `> **Temos vários empregos disponíveis para você!**\n\n` +
                `> **Escolha um dos empregos da lista abaixo e comece a trabalhar agora mesmo!**`
            )
            .setThumbnail('https://cdn.discordapp.com/emojis/1060506109951082526.png')
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`job-${message.author.id}`)
            .setPlaceholder('Selecione um emprego')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                {
                    label: 'Policial',
                    description: '500 moedas a cada 10 minutos',
                    value: `1-${message.author.id}`,
                    emoji: '👮'
                },
                {
                    label: 'Operário',
                    description: '1k de moedas a cada 30 minutos',
                    value: `2-${message.author.id}`,
                    emoji: '👷'
                },
                {
                    label: 'Mecânico',
                    description: '2k de moedas a cada 1 hora',
                    value: `3-${message.author.id}`,
                    emoji: '👩‍🔧'
                },
                {
                    label: 'Detetive',
                    description: '3k de moedas a cada 2 horas',
                    value: `4-${message.author.id}`,
                    emoji: '🕵️'
                },
                {
                    label: 'Fazendeiro',
                    description: '4k de moedas a cada 3 horas',
                    value: `5-${message.author.id}`,
                    emoji: '👩‍🌾'
                },
                {
                    label: 'Bombeiro',
                    description: '5k de moedas a cada 4 horas',
                    value: `6-${message.author.id}`,
                    emoji: '👩‍🚒'
                },
                {
                    label: 'Juíz',
                    description: '6k de moedas a cada 5 horas',
                    value: `7-${message.author.id}`,
                    emoji: '⚖️'
                }
            );

        const row = new ActionRowBuilder().addComponents(menu);

        message.reply({ embeds: [embed], components: [row] });
    }
};