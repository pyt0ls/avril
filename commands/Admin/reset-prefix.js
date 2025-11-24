const fs = require('fs');
const { PermissionFlagsBits } = require('discord.js');
const prefixFile = './database/prefixos.json';

const DEFAULT_PREFIX = ';';

module.exports = {
    name: 'resetprefix',
    description: 'Reseta o prefixo para o padrão.',
    async execute(message) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Você precisa ser administrador para resetar o prefixo.');
        }

        let prefixes = {};

        // Se o arquivo existir, carrega os dados
        if (fs.existsSync(prefixFile)) {
            prefixes = JSON.parse(fs.readFileSync(prefixFile, 'utf8'));
        }

        // Se o servidor já estiver usando o padrão
        if (!prefixes[message.guild.id]) {
            return message.reply(`❗️ Prefixo já está no padrão: \`${DEFAULT_PREFIX}\``);
        }

        // Remove o prefixo personalizado e salva
        delete prefixes[message.guild.id];
        fs.writeFileSync(prefixFile, JSON.stringify(prefixes, null, 4));

        return message.reply(`✅ Prefixo resetado para o padrão: \`${DEFAULT_PREFIX}\``);
    }
};