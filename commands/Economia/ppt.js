const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { parseAmount, formatAmount } = require('../../utils/coinsUtils');

module.exports = {
    name: 'ppt',
    aliases: ['pedrapapeltesoura'],
    description: 'Jogue pedra, papel ou tesoura e aposte moedas do banco!',
    async execute(message, args, client) {
        const guildId = message.guild.id;
        const userId = message.author.id;

        // Puxa prefixo do servidor
        const prefixPath = path.join(__dirname, '../../database/prefixos.json');
        let prefix = ';';
        if (fs.existsSync(prefixPath)) {
            const prefixDB = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
            if (prefixDB[guildId]) prefix = prefixDB[guildId];
        }

        // Puxa economia do usuário
        const coinsPath = path.join(__dirname, '../../database/coins.json');
        let coinsDB = {};
        if (fs.existsSync(coinsPath)) {
            coinsDB = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
        }

        if (!coinsDB[userId]) coinsDB[userId] = { carteira: 0, banco: 0 };

        let quantiaInput = args[0];
        const escolha = args[1]?.toLowerCase();

        if (!quantiaInput || !escolha)
            return message.reply(`<:Sim_New00K:1332805350847414365> ╸<@${userId}>, Use da seguinte forma: \`${prefix}ppt <quantia> <pedra | papel | tesoura>\``);

        if (quantiaInput.toLowerCase() === 'all') {
            quantiaInput = coinsDB[userId].banco;
        } else {
            const parsed = parseAmount(quantiaInput);
            if (parsed === null) {
                return message.reply(`<:No_New00K:1332805357885722636> ╸<@${userId}>, Digite uma quantia numeral válida. Use: \`k | m | b | all\``);
            }
            quantiaInput = Math.floor(parsed);
        }

        if (quantiaInput < 100)
            return message.reply(`<:No_New00K:1332805357885722636> ╸<@${userId}>, Você deve apostar no mínimo **100** moedas.`);

        if (quantiaInput > coinsDB[userId].banco)
            return message.reply(`<:No_New00K:1332805357885722636> ╸<@${userId}>, Você não tem essa quantia no banco. Saldo atual: \`${formatAmount(coinsDB[userId].banco)}\``);

        if (!['pedra', 'papel', 'tesoura'].includes(escolha))
            return message.reply(`<:No_New00K:1332805357885722636> ╸<@${userId}>, Escolha uma das opções: \`pedra | papel | tesoura\``);

        const opcoes = ['pedra', 'papel', 'tesoura'];
        const escolhaBot = opcoes[Math.floor(Math.random() * opcoes.length)];

        let resultado, delta;
        if (escolha === escolhaBot) {
            resultado = 'nós empatamos';
            delta = 0;
        } else if (
            (escolha === 'pedra' && escolhaBot === 'tesoura') ||
            (escolha === 'tesoura' && escolhaBot === 'papel') ||
            (escolha === 'papel' && escolhaBot === 'pedra')
        ) {
            resultado = 'você ganhou';
            delta = quantiaInput;
            coinsDB[userId].banco += delta;
        } else {
            resultado = 'eu ganhei';
            delta = -quantiaInput;
            coinsDB[userId].banco -= quantiaInput;
        }

        // Salva a economia
        fs.writeFileSync(coinsPath, JSON.stringify(coinsDB, null, 4), 'utf8');

        const embed = new EmbedBuilder()
            .setTitle('<:1230749971679281194:1329730351710601286> • **Pedra, Papel, Tesoura**')
            .setDescription(`${message.author.username} jogou **${escolha}**\nEu joguei **${escolhaBot}**\n\nPortanto, ${resultado}!\n\n<:70s_whitcash:1304070691892625448> • **Resultado:** \`${delta >= 0 ? '+' : ''}${formatAmount(delta)}\``)
            .setColor('#00ffc3')
            .setImage('https://cdn.discordapp.com/attachments/1148414200830505011/1148861516179836928/pedra-papel-tesoura1-5fa51133958cfe0c4216786500534833-640-0.png')
            .setTimestamp()
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        message.channel.send({ embeds: [embed] });
    }
};