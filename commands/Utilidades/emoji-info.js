const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'emoji-info',
    description: 'Mostra informações detalhadas de um emoji personalizado.',
    category: 'Utilidades',
    async execute(message, args, client) {
        if (!message.guild) return message.reply('Use esse comando apenas em servidores.');
        if (!args[0]) return message.reply('Por favor, insira um emoji.');

        const emojiInput = args[0];
        // Validar emoji personalizado no formato <:name:id> ou <a:name:id>
        const emojiRegex = /<(a?):(\w+):(\d+)>/;
        const match = emojiInput.match(emojiRegex);

        if (!match) return message.reply('Insira um emoji válido.');

        const isAnimated = match[1] === 'a';
        const emojiName = match[2];
        const emojiId = match[3];

        // Construir a URL do emoji
        const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;

        // Calcular a data de criação do emoji (discord snowflake)
        const discordEpoch = 1420070400000;
        const emojiTimestamp = (BigInt(emojiId) >> 22n) + BigInt(discordEpoch);
        const emojiDate = new Date(Number(emojiTimestamp));

        // Servidor do emoji (não é possível pegar direto pelo ID, usa guild emoji cache)
        const guildEmoji = message.guild.emojis.cache.get(emojiId);
        const guildName = guildEmoji ? message.guild.name : 'Desconhecido';

        const embed = new EmbedBuilder()
            .setTitle('Informações sobre emoji')
            .setColor('Fa8072')
            .setThumbnail(emojiURL)
            .addFields(
                { name: '• Nome:', value: emojiName, inline: true },
                { name: '• ID:', value: emojiId, inline: true },
                { name: '• Status:', value: isAnimated ? 'Este emoji é animado' : 'Este emoji é estático', inline: true },
                { name: '• Criado:', value: `<t:${Math.floor(emojiDate.getTime() / 1000)}:R>`, inline: true },
                { name: '• Menção:', value: `\`${emojiInput}\``, inline: true },
                { name: '• Servidor:', value: guildName, inline: true }
            )
            .setFooter({ text: `Executado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};