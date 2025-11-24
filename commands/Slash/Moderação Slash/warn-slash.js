const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnDB = path.join(__dirname, '../../../database/warn.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Adiciona um aviso a um membro.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para aplicar o aviso')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('motivo')
        .setDescription('Motivo do aviso')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo') || 'Sem motivo informado';
    const date = new Date().toLocaleDateString('pt-BR');

    let db = {};
    if (fs.existsSync(warnDB)) {
      db = JSON.parse(fs.readFileSync(warnDB, 'utf-8'));
    }

    if (!db[user.id]) db[user.id] = [];

    db[user.id].push({ reason, date });

    fs.writeFileSync(warnDB, JSON.stringify(db, null, 2));

    await interaction.reply(`⚠️ ${user.tag} foi avisado. Motivo: **${reason}**`);

    // Verificação para ban automático
    if (db[user.id].length >= 5) {
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (member) {
        member.ban({ reason: 'Acumulou 5 avisos.' })
          .then(() => {
            interaction.followUp(`🚫 ${user.tag} foi banido por acumular 5 avisos.`);
          })
          .catch(err => {
            console.error(err);
            interaction.followUp('❌ Não consegui banir o usuário. Verifique minhas permissões.');
          });
      }
    }
  }
};