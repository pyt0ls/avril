const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'nuke',
    description: 'Clona e deleta o canal atual.',
    category: 'Moderação',

    async execute(message) {
        const oldChannel = message.channel;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ Você precisa da permissão `Gerenciar Canais` para usar este comando.');
        }

        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ Eu preciso da permissão `Gerenciar Canais` para fazer isso.');
        }

        if (!oldChannel.deletable) {
            return message.reply(`❌ **Este canal não pode ser deletado.**\n-# <:v_branco4:1382060159139844196> (provavelmente é obrigatório para servidores com comunidade ativa... desculpa).`);
        }

        try {
            // Clona o canal
            const newChannel = await oldChannel.clone({
                name: oldChannel.name,
                reason: `Nuke solicitado por ${message.author.tag}`
            });

            // Mantém posição
            await newChannel.setPosition(oldChannel.position);

            // Embed de confirmação
            const embed = new EmbedBuilder()
                .setDescription(`-# Canal nukado com sucesso - ${message.author}`)
                .setColor('#ffffff');

            await newChannel.send({ embeds: [embed] });

            // Aguarda 2s antes de deletar o canal antigo
            setTimeout(() => {
                oldChannel.delete().catch(err => console.error('Erro ao deletar canal:', err));
            }, 2000);

        } catch (error) {
            console.error('Erro ao executar nuke:', error);

            if (message.channel?.viewable) {
                try {
                    await message.channel.send('❌ Ocorreu um erro ao tentar fazer o nuke no canal.');
                } catch (_) {}
            }
        }
    }
};