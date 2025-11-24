const fs = require("fs");
const path = require("path");
const config = require("../../config");

const vipDataPath = path.join(__dirname, "../../database/vipData.json");

// Garante que o arquivo exista
if (!fs.existsSync(vipDataPath)) {
    fs.writeFileSync(vipDataPath, JSON.stringify({}, null, 4));
}

module.exports = {
    name: "setvip",
    aliases: [],
    async execute(message, args) {
        // Verificar se é dono
        if (!config.OWNERS.includes(message.author.id)) {
            return message.reply("🚫 Você não tem permissão para usar esse comando.");
        }

        const user = message.mentions.users.first() || (args[0] && message.client.users.cache.get(args[0]));
        const dias = parseInt(args[1]);

        if (!user || !dias) {
            return message.reply("❌ Uso correto: `!setvip @usuário <dias>` ou `!setvip ID <dias>`");
        }

        if (isNaN(dias) || dias <= 0) {
            return message.reply("❌ O tempo deve ser um número válido em dias.");
        }

        const tempo = Math.floor(Date.now() / 1000) + (dias * 86400);

        const vipData = JSON.parse(fs.readFileSync(vipDataPath, "utf8"));
        vipData[user.id] = tempo;
        fs.writeFileSync(vipDataPath, JSON.stringify(vipData, null, 4));

        await message.channel.send({
            embeds: [{
                title: "✨ VIP Ativado!",
                description: `O usuário ${user} recebeu **VIP por ${dias} dias.**\n🗓️ Expira: <t:${tempo}:R>`,
                color: 0xf7c62c,
                footer: { text: `Usado por ${message.author.username}` },
                thumbnail: { url: user.displayAvatarURL({ dynamic: true }) }
            }]
        });
    }
};