module.exports = {
    name: 'clear',
    description: 'Apaga mensagens do chat (1-1000).',
    category: 'Moderação',

    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Você precisa da permissão `Gerenciar Mensagens` para usar este comando.');
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 1000) {
            return message.reply('❌ Forneça um número entre 1 e 1000.');
        }

        let totalDeleted = 0;

        for (let i = 0; i < amount; i += 100) {
            const toDelete = Math.min(amount - i, 100);
            try {
                const deleted = await message.channel.bulkDelete(toDelete, true);
                totalDeleted += deleted.size;
                if (deleted.size < toDelete) break; // Parar se mensagens antigas não puderem ser apagadas
            } catch (err) {
                console.error(err);
                return message.channel.send('❌ Ocorreu um erro ao tentar apagar as mensagens.\n -# Provavelmente por conter mensagens há mais de 14 dias, isso é limitação do próprio Discord, tente um número menor ou use "nuke" para reiniciar o canal.');
            }
        }

        message.channel.send(`🧹 Apaguei ${totalDeleted} mensagens!`).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
    }
};