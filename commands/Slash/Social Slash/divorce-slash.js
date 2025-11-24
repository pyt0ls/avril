const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const marryDataPath = path.join(__dirname, '../../../database/marry.json');

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Pede confirmação para se divorciar do parceiro(a).'),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Este comando só pode ser usado dentro de servidores.',
        ephemeral: true
      });
    }

    const userId = interaction.user.id;
    const marryData = loadJson(marryDataPath);
    marryData.casamentos = marryData.casamentos || {};

    const parceiroId = marryData.casamentos[userId];
    if (!parceiroId) {
      return interaction.reply({
        content: `💍 **|** <@${userId}>, você não está casado(a)! Você precisa estar casado para se divorciar.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('**Pedido de divórcio**')
      .setDescription(`> ❔ **|** <@${userId}>, **você quer se divorciar de <@${parceiroId}>?**\n> ✅ **|** Digite \`sim\` neste canal para confirmar.`)
      .setColor('#ffffff');

    await interaction.reply({ embeds: [embed], ephemeral: false });

    // Cria coletor de mensagens aguardando "sim"
    const filter = m => m.author.id === userId && m.content.toLowerCase() === 'sim';
    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 30000,
      max: 1
    });

    collector.on('collect', () => {
      delete marryData.casamentos[userId];
      delete marryData.casamentos[parceiroId];

      if (marryData.tempos) {
        delete marryData.tempos[userId];
        delete marryData.tempos[parceiroId];
      }

      saveJson(marryDataPath, marryData);

      interaction.channel.send(`💔 <@${userId}>, você se divorciou com sucesso de <@${parceiroId}>.`).catch(() => {});
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.channel.send(`⌛ <@${userId}>, tempo para confirmar o divórcio acabou. Comando cancelado.`).catch(() => {});
      }
    });
  }
};