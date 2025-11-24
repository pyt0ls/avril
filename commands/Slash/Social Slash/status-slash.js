const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const marryDataPath = path.join(__dirname, "../../../database/marry.json");

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Verifica o status de casamento de um usuário')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para checar o status')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;

    const marryData = loadJson(marryDataPath);
    marryData.casamentos = marryData.casamentos || {};
    marryData.tempos = marryData.tempos || {};

    const casadoComId = marryData.casamentos[user.id] || null;
    const tempoCasado = marryData.tempos[user.id] || null;

    if (!casadoComId) {
      const embed = new EmbedBuilder()
        .setColor('#fa8072')
        .setTitle(`💔 Status de ${user.username}`)
        .setDescription(`>>> **${user.username} não possuí nenhum tipo de relacionamento...**`)
        .setThumbnail('https://cdn.discordapp.com/emojis/1162305895745720330.png?size=2048');

      return interaction.reply({ embeds: [embed] });
    }

    const parceiro = await interaction.client.users.fetch(casadoComId).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor('#fa8072')
      .setTitle(`💍 Status de ${user.username}`)
      .setDescription(
        `>>> 💠 **Usuário:**\n<@${user.id}> ${user.username}\n\n` +
        `💖 **Parceiro(a):**\n<@${casadoComId}> ${parceiro ? parceiro.username : 'Usuário desconhecido'}\n\n` +
        `<:relogio:1382896998700679230> **Tempo de casado(a):**\n<t:${Math.floor(tempoCasado / 1000)}:R> (<t:${Math.floor(tempoCasado / 1000)}:d>)`
      )
      .setThumbnail('https://cdn.discordapp.com/emojis/1162305895745720330.png?size=2048');

    return interaction.reply({ embeds: [embed] });
  }
};