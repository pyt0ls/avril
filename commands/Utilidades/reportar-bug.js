const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bug',
    description: 'Reporta um bug para os desenvolvedores.',
    category: 'Utilidades',

    async execute(message, args) {
        const canalBug = '1352456197805969488';
        const conteudo = args.join(' ');

        if (!conteudo) {
            return message.reply('❌ Escreva o bug que deseja reportar.');
        }

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🐞 Novo Bug Reportado')
            .addFields(
                { name: 'Usuário', value: `<@${message.author.id}> (\`${message.author.id}\`)` },
                { name: 'Bug', value: conteudo }
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Bug reportado via comando' })
            .setTimestamp();

        const canalDestino = message.client.channels.cache.get(canalBug);
        if (!canalDestino) return message.reply('❌ Canal de bugs não encontrado.');

        await canalDestino.send({ embeds: [embed] });
        message.reply('✅ Bug reportado com sucesso!');
    }
};