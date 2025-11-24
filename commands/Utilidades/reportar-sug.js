const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'sug',
    description: 'Envia uma sugestão para os desenvolvedores.',
    category: 'Utilidades',

    async execute(message, args) {
        const canalSugestao = '1358950103628386364';
        const conteudo = args.join(' ');

        if (!conteudo) {
            return message.reply('❌ Escreva a sugestão que deseja enviar.');
        }

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('💡 Nova Sugestão')
            .addFields(
                { name: 'Usuário', value: `<@${message.author.id}> (\`${message.author.id}\`)` },
                { name: 'Sugestão', value: conteudo }
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Sugestão enviada via comando' })
            .setTimestamp();

        const canalDestino = message.client.channels.cache.get(canalSugestao);
        if (!canalDestino) return message.reply('❌ Canal de sugestões não encontrado.');

        await canalDestino.send({ embeds: [embed] });
        message.reply('✅ Sugestão enviada com sucesso!');
    }
};