const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const prefixPath = path.resolve(__dirname, '../../../database/prefixos.json');
const DEFAULT_PREFIX = ';';

// Funções auxiliares
function getPrefixes() {
    if (!fs.existsSync(prefixPath)) return {};
    return JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
}

function savePrefixes(prefixes) {
    fs.writeFileSync(prefixPath, JSON.stringify(prefixes, null, 4));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Define ou reseta o prefixo deste servidor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('ação')
                .setDescription('Escolha entre definir ou resetar o prefixo')
                .setRequired(true)
                .addChoices(
                    { name: 'Setar novo prefixo', value: 'set' },
                    { name: 'Resetar para padrão', value: 'reset' }
                ))
        .addStringOption(option =>
            option.setName('novo_prefixo')
                .setDescription('Novo prefixo (apenas se for setar)')
                .setRequired(false)),

    async execute(interaction) {
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
  return interaction.reply({
    content: '❌ Você precisa da permissão **Administrador** para usar este comando.',
    ephemeral: true,
  });
}
        const action = interaction.options.getString('ação');
        const newPrefix = interaction.options.getString('novo_prefixo');
        const guildId = interaction.guild.id;

        let prefixes = getPrefixes();

        if (action === 'set') {
            if (!newPrefix)
                return interaction.reply({ content: '❌ Você precisa fornecer o novo prefixo.', ephemeral: true });

            if (newPrefix.length > 5)
                return interaction.reply({ content: '❌ O prefixo não pode ter mais que 5 caracteres.', ephemeral: true });

            prefixes[guildId] = newPrefix;
            savePrefixes(prefixes);

            return interaction.reply({ content: `✅ Prefixo alterado para \`${newPrefix}\` neste servidor!`, ephemeral: true });
        }

        if (action === 'reset') {
            if (!prefixes[guildId]) {
                return interaction.reply({ content: `❗️ O prefixo já está no padrão: \`${DEFAULT_PREFIX}\``, ephemeral: true });
            }

            delete prefixes[guildId];
            savePrefixes(prefixes);

            return interaction.reply({ content: `✅ Prefixo resetado para o padrão: \`${DEFAULT_PREFIX}\``, ephemeral: true });
        }
    }
};