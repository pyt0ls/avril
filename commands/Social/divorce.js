const { EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const marryDataPath = path.join(__dirname, '../../database/marry.json');

function loadJson(path) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

module.exports = {
  name: 'divorce',
  description: 'Pede confirmação para se divorciar do parceiro(a).',
  usage: '!divorce',
  async execute(message) {
    if (!message.guild) {
      return message.reply('❌ Este comando só pode ser usado dentro de servidores.');
    }

    const marryData = loadJson(marryDataPath);
    marryData.casamentos = marryData.casamentos || {};

    const userId = message.author.id;

    // Verifica se está casado(a)
    const parceiroId = marryData.casamentos[userId];
    if (!parceiroId) {
      return message.reply(`💍 **|** <@${userId}>, você não está casado(a)! Você precisa estar casado para se divorciar.`);
    }

    const embed = new EmbedBuilder()
      .setTitle('**Pedido de divórcio**')
      .setDescription(`> ❔ **|** <@${userId}>, **você quer se divorciar de <@${parceiroId}>?**\n> ✅ **|** Digite \`sim\` para confirmar o divórcio.`)
      .setColor('#ffffff');

    await message.reply({ embeds: [embed] });

    // Cria coletor aguardando "sim"
    const filter = m => m.author.id === userId && m.content.toLowerCase() === 'sim';
    const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', () => {
      // Remove o casamento dos dois
      delete marryData.casamentos[userId];
      delete marryData.casamentos[parceiroId];

      if (marryData.tempos) {
        delete marryData.tempos[userId];
        delete marryData.tempos[parceiroId];
      }

      saveJson(marryDataPath, marryData);

      message.channel.send(`💔 <@${userId}>, você se divorciou com sucesso de <@${parceiroId}>.`).catch(() => {});
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.channel.send(`⌛ <@${userId}>, tempo para confirmar o divórcio acabou. Comando cancelado.`).catch(() => {});
      }
    });
  },
};