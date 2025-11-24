const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionCollector } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Desbane um usuário pelo ID ou todos com "all" com confirmação por botão',
    aliases: ['desban'],
    permissions: ['BanMembers'],
    usage: '<userID|all>',
    async execute(message, args, client) {
        if (!message.member.permissions.has('BanMembers')) 
            return message.reply('❌ Você não tem permissão para usar este comando.');

        const target = args[0];
        if (!target) return message.reply('❌ Você precisa fornecer o ID do usuário ou "all" para desbanir todos que estiverem banido.');

        const bans = await message.guild.bans.fetch();

        if (target.toLowerCase() !== 'all' && !bans.has(target)) {
            return message.reply('❌ Esse usuário não está banido.');
        }

        // Cria embed e botões para confirmação
        const embedConfirm = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('Confirmação de Desbanimento')
            .setDescription(
                target.toLowerCase() === 'all' ?
                `Você tem certeza que quer **desbanir todos** os ${bans.size} usuários banidos?` :
                `Você tem certeza que quer **desbanir o usuário** com ID \`${target}\`?`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_unban')
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('cancel_unban')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Danger),
        );

        const confirmationMessage = await message.reply({ embeds: [embedConfirm], components: [row] });

        // Criar coletor de interação só para quem executou o comando
        const filter = i => ['confirm_unban', 'cancel_unban'].includes(i.customId) && i.user.id === message.author.id;
        const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 30000, max: 1 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_unban') {
                await i.deferUpdate();

                if (target.toLowerCase() === 'all') {
                    if (bans.size === 0) {
                        return confirmationMessage.edit({ content: 'ℹ️ Não há usuários banidos para desbanir.', embeds: [], components: [] });
                    }

                    let successCount = 0;
                    for (const [userId] of bans) {
                        try {
                            await message.guild.members.unban(userId);
                            successCount++;
                        } catch (err) {
                            console.error(`Erro ao desbanir ${userId}:`, err);
                        }
                    }

                    return confirmationMessage.edit({ content: `✅ Desbanidos ${successCount} usuários com sucesso!`, embeds: [], components: [] });
                } else {
                    try {
                        await message.guild.members.unban(target);
                        return confirmationMessage.edit({ content: `✅ Usuário com ID \`${target}\` foi desbanido com sucesso!`, embeds: [], components: [] });
                    } catch (err) {
                        console.error('Erro ao desbanir usuário:', err);
                        return confirmationMessage.edit({ content: '❌ Não foi possível desbanir esse usuário.', embeds: [], components: [] });
                    }
                }
            } else if (i.customId === 'cancel_unban') {
                await i.deferUpdate();
                return confirmationMessage.edit({ content: '❌ Desbanimento cancelado.', embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                confirmationMessage.edit({ content: '⌛ Tempo para confirmação expirou.', embeds: [], components: [] });
            }
        });
    }
};