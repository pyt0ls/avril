const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch'); // Use node-fetch@2 para evitar problemas com require

module.exports = {
    name: 'banner',
    aliases: ['bn'],
    description: 'Exibe o banner de um usuário (se disponível).',
    category: 'Utilidades',

    async execute(message) {
        const user = message.mentions.users.first() || message.author;

        try {
            const response = await fetch(`https://discord.com/api/v10/users/${user.id}`, {
                headers: {
                    Authorization: `Bot ${message.client.token}`
                }
            });

            if (!response.ok) {
                return message.reply(`❌ Erro ao acessar a API do Discord (status ${response.status})`);
            }

            const data = await response.json();

            if (!data.banner) {
                return message.reply(`❌ ${user.username} não possui banner.`);
            }

            const bannerFormat = data.banner.startsWith("a_") ? "gif" : "png";
            const bannerURL = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}.${bannerFormat}?size=1024`;

            const embed = new EmbedBuilder()
                .setTitle(`🖼 Banner de ${user.username}`)
                .setImage(bannerURL)
                .setColor('#5865F2')
                .setFooter({ text: `Requisitado por ${message.author.username}` });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('❌ Ocorreu um erro ao tentar obter o banner.');
        }
    }
};