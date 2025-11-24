const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: "shop",
    aliases: ["loja", "mercado"],
    async execute(message) {

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Shopping da avril.", iconURL: message.client.user.displayAvatarURL() })
            .setTitle("**Shop da avril**")
            .setDescription("Olá, aqui você poderá comprar suas armas ou arrumar sua picareta quebrada.\n\nUse o menu abaixo para escolher a categoria desejada.")
            .setThumbnail("https://dl.dropboxusercontent.com/scl/fi/wy4cjgo7s1fjn2znppqm3/1741653411728.jpeg?rlkey=6wvexe9ut6zq0ox59fbqkb2qm&dl=0")
            .setImage("https://dl.dropboxusercontent.com/scl/fi/1vzxmcebxz5p3tjrfkift/1741653420754.jpeg?rlkey=y0d5taytiwk2za0114e2jn9h6&dl=0")
            .setColor("#ffffff")
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        const select = new StringSelectMenuBuilder()
            .setCustomId(`shop-${message.author.id}`)
            .setPlaceholder('🛍️ • Selecione um item para comprar')
            .addOptions(
                {
                    label: 'Facão Cego',
                    description: 'Valor: 300 coins',
                    value: `comprar_faca-${message.author.id}`,
                    emoji: '🗡',
                },
                {
                    label: 'Vibrador Antigo',
                    description: 'Valor: 2.000 coins',
                    value: `comprar_vibrador-${message.author.id}`,
                    emoji: '🕹',
                },
                {
                    label: 'Pistola Básica',
                    description: 'Valor: 500 coins',
                    value: `comprar_arma-${message.author.id}`,
                    emoji: '🔫',
                },
                {
                    label: 'Rola de Borracha',
                    description: 'Valor: 5.000 coins',
                    value: `comprar_rola-${message.author.id}`,
                    emoji: '🍆',
                },
                {
                    label: 'Fuzil AK-47',
                    description: 'Valor: 1.500 coins',
                    value: `comprar_fuzil-${message.author.id}`,
                    emoji: '💥',
                }
            );

        const row = new ActionRowBuilder().addComponents(select);

        message.reply({ embeds: [embed], components: [row] });
    }
};