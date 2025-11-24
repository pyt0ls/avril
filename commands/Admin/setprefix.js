const fs = require('fs');
const { PermissionFlagsBits } = require('discord.js');
const prefixesPath = './database/prefixos.json';

function getPrefixes() {
    if (!fs.existsSync(prefixesPath)) return {};
    return JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
}

function savePrefixes(prefixes) {
    fs.writeFileSync(prefixesPath, JSON.stringify(prefixes, null, 4));
}

module.exports = {
    name: 'setprefix',
    description: 'Define um novo prefixo para o servidor',
    aliases: ['prefixo'],
    usage: '<novo_prefixo>',
    async execute(message, args) {
        if (!message.guild) return message.reply('❌ Este comando só pode ser usado em servidores.');

        if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
            return message.reply('❌ Você precisa da permissão **Administrador** para usar este comando.');

        const newPrefix = args[0];
        if (!newPrefix) return message.reply('❌ Você precisa informar o novo prefixo.');

        if (newPrefix.length > 5) return message.reply('❌ O prefixo não pode ter mais que 5 caracteres.');

        const prefixes = getPrefixes();
        prefixes[message.guild.id] = newPrefix;
        savePrefixes(prefixes);

        return message.reply(`✅ Prefixo alterado para \`${newPrefix}\` neste servidor!`);
    }
};