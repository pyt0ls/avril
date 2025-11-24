const fs = require('fs');
const path = require('path');
const { 
  SlashCommandBuilder, 
  PermissionFlagsBits 
} = require('discord.js');

const warnsDB = path.join(__dirname, '../../../database/warn.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetwarn')
    .setDescription('Remove todos os avisos de um usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para limpar os avisos')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ Você não tem permissão para usar esse comando.', ephemeral: true });
    }

    const user = interaction.options.getUser('usuario');

    if (!fs.existsSync(warnsDB)) {
      return interaction.reply({ content: '⚠️ Nenhum aviso registrado.', ephemeral: true });
    }

    const db = JSON.parse(fs.readFileSync(warnsDB, 'utf8'));

    if (!db[user.id] || db[user.id].length === 0) {
      return interaction.reply({ content: '✅ Esse usuário já não possui nenhum aviso.', ephemeral: true });
    }

    delete db[user.id];
    fs.writeFileSync(warnsDB, JSON.stringify(db, null, 2));

    return interaction.reply(`✅ Todos os avisos de ${user.tag} foram removidos.`);
  }
};