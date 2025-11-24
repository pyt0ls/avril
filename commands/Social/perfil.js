const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'perfil',
    aliases: ['profile'],
    async execute(message, args) {
        const target = message.mentions.users.first() || message.client.users.cache.get(args[0]) || message.author;

        // Caminhos dos bancos
        const coinsPath = path.join(__dirname, '../../database/coins.json');
        const marryPath = path.join(__dirname, '../../database/marry.json');
        const bfPath = path.join(__dirname, '../../database/bf.json');
        const vipPath = path.join(__dirname, '../../database/vipData.json');
        const repPath = path.join(__dirname, '../../database/rep.json');
        const perfilPath = path.join(__dirname, '../../database/perfil.json');

        // Função para carregar JSON seguro
        function loadJson(filePath) {
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
            const raw = fs.readFileSync(filePath, 'utf8');
            try {
                return JSON.parse(raw);
            } catch {
                return {};
            }
        }

        const coins = loadJson(coinsPath);
        const marry = loadJson(marryPath);
        const bf = loadJson(bfPath);
        const vip = loadJson(vipPath);
        const rep = loadJson(repPath);
        const perfil = loadJson(perfilPath);

        const userId = target.id;

        // Dados básicos
        const userCoinsData = coins[userId] || { carteira: 0, banco: 0 };
        const userCoins = (userCoinsData.carteira || 0) + (userCoinsData.banco || 0);

        const userRep = rep[userId] || 0;
        const casadoCom = marry.casamentos?.[userId] || null;

        // Melhor amigo (sem tempo)
        const bfCom = bf.amizades?.[userId] || null;

        // VIP e tempo
        const vipExpira = vip[userId] ? vip[userId] * 1000 : 0;
        const temVip = vipExpira && vipExpira > Date.now();

        const vipString = temVip
            ? `✔️ Ativo até <t:${Math.floor(vipExpira / 1000)}:R>`
            : '❌ Não possui VIP ativo';

        // Perfil customizado
        const dadosPerfil = perfil[userId] || {};
        const sobremim = dadosPerfil.sobremim || 'Não definido.';
        const cor = dadosPerfil.cor || '#fa8072';
        const pronome = dadosPerfil.pronome || 'Não definido.';
        const banner = dadosPerfil.banner || null;

        // Monta embed
        const embed = new EmbedBuilder()
            .setColor(cor)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setTitle(`🎭 Perfil de ${target.username}`)
            .setDescription(
                `> 🧢 **Usuário:** <@${userId}> \`${userId}\`\n\n` +

                `> 💍 **Estado civil:** ${casadoCom ? `Casado(a) com <@${casadoCom}>` : 'Solteiro(a)'}\n` +

                `> 🫂 **Melhor amigo(a):** ${bfCom ? `<@${bfCom}>` : 'Nenhum'}\n\n` +

                `> 💰 **Coins:** R$ ${userCoins.toLocaleString()}\n` +

                `> ⭐ **Reputações:** ${userRep.toLocaleString()}\n\n` +

                `> 🏅 **Status VIP:** ${vipString}\n\n` +

                `> 🏳️‍⚧️ **Pronome:** ${pronome}\n\n` +

                `> 📝 **Sobre mim:**\n${sobremim}`
            )
            .setFooter({ text: `Executado por ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        if (banner) {
            embed.setImage(banner);
        }

        message.reply({ embeds: [embed] });
    }
};