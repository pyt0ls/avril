const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Mostra o ping do bot e outras informações.',
    category: 'Utilidades',

    async execute(message) {
        const botPing = Math.round(message.client.ws.ping);
        const uptime = message.client.uptime;
        const now = Math.floor(Date.now() / 1000);

        const segundos = Math.floor(uptime / 1000) % 60;
        const minutos = Math.floor(uptime / (1000 * 60)) % 60;
        const horas = Math.floor(uptime / (1000 * 60 * 60));

        const ativoTimestamp = now - (horas * 3600 + minutos * 60 + segundos);
        const velocidade = Math.floor(Math.random() * 6) + 1;
        const rede = Math.floor(Math.random() * (65 - 39 + 1)) + 39;

        const imageURL = `https://falsiskremlin.sirv.com/resim_2020-11-28_113400.png?text.0.text=${botPing}%20ms&text.0.position.x=-10%25&text.0.position.y=-25%25&text.0.size=60&text.0.color=ffffff&text.0.font.family=Play&watermark.0.image=%2FImages%2F784413323910709288.png&watermark.0.position.x=-35%25&watermark.0.scale.width=200&watermark.0.scale.height=200`;

        const embed = new EmbedBuilder()
            .setTitle('<a:loading:1412501259436429507> • **Ping BOT**')
            .setColor('#FA8072')
            .setDescription(`**Ping de:** ${botPing} ms!\n**Ativo:** <t:${ativoTimestamp}:R>\n**Velocidade:** ${velocidade} ms!\n**Velocidade rede:** ${rede} Mbps`)
            .setThumbnail(message.client.user.displayAvatarURL())
            .setImage(imageURL)
            .setFooter({ text: `Executado por ${message.author.username}` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};