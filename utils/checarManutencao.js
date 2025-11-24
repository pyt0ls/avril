const { OWNERS } = require('../config.js');

function checarManutencao(ctx, maintenance) {
    const userId = ctx.author?.id || ctx.user?.id;

    if (maintenance?.active && !OWNERS.includes(userId)) {
        const mention = `<@${userId}>`;

        if (ctx.reply) {
            ctx.reply({
                content:
                    `<:pureza_i:1382063941030776932> **Olá ${mention}**, estou passando por uma pequena atualização no momento!\n` +
                    `-# <:v_branco4:1382060159139844196> Tente novamente em alguns minutos...`,
                ephemeral: true
            }).catch(() => {});
        }
        return true;
    }

    return false;
}

module.exports = checarManutencao;