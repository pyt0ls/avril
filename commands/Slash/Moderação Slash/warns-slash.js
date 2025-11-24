const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnsDB = path.join(__dirname, '../../../database/warn.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Exibe os avisos de um usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para ver os avisos')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');

    if (!fs.existsSync(warnsDB)) {
      return interaction.reply({ content: '⚠️ Nenhum aviso registrado ainda.', ephemeral: true });
    }

    const db = JSON.parse(fs.readFileSync(warnsDB, 'utf8'));
    const userWarns = db[user.id];

    if (!userWarns || userWarns.length === 0) {
      return interaction.reply({ content: '✅ Esse usuário não possui nenhum aviso.', ephemeral: true });
    }

    const list = userWarns
      .map((w, i) => {
        const timestamp = Math.floor(new Date(w.date).getTime() / 1000);
        return `\`${i + 1}.\` **${w.reason}** - <t:${timestamp}:F>`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Avisos de ${user.tag}`)
      .setDescription(list)
      .setColor(0xffaa00);

    interaction.reply({ embeds: [embed] });
  }
};