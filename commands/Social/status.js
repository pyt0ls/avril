const { EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const marryDataPath = path.join(__dirname, '../../database/marry.json');

function loadJson(path) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

module.exports = {
  name: 'status',
  description: 'Verifica o status de casamento de um usuário',
  usage: '!status @usuário ou !status <ID>',
  async execute(message, args) {
    const marryData = loadJson(marryDataPath);
    marryData.casamentos = marryData.casamentos || {};
    marryData.tempos = marryData.tempos || {};

    let user;
    if (args[0]) {
      // tenta buscar por ID ou menção
      const id = args[0].replace(/[<@!>]/g, ''); // tira menção pra deixar só o ID
      user = await message.client.users.fetch(id).catch(() => null);
    } else {
      user = message.author;
    }

    if (!user) {
      return message.reply('❌ Usuário não encontrado ou ID inválido.');
    }

    const casadoComId = marryData.casamentos[user.id] || null;
    const tempoCasado = marryData.tempos[user.id] || null;

    if (!casadoComId) {
      const embed = new EmbedBuilder()
        .setColor('#fa8072')
        .setTitle(`💔 Status de ${user.username}`)
        .setDescription(`>>> **${user.username} não possuí nenhum tipo de relacionamento...**`)
        .setThumbnail('https://cdn.discordapp.com/emojis/1162305895745720330.png?size=2048');

      return message.reply({ embeds: [embed] });
    }

    // tenta buscar o parceiro(a)
    const parceiro = await message.client.users.fetch(casadoComId).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor('#fa8072')
      .setTitle(`💍 Status de ${user.username}`)
      .setDescription(
        `>>> 💠 **Usuário:**\n<@${user.id}> ${user.username}\n\n` +
        `💖 **Parceiro(a):**\n<@${casadoComId}> ${parceiro ? parceiro.username : 'Usuário desconhecido'}\n\n` +
        `<:relogio:1382896998700679230> **Tempo de casado(a):**\n<t:${Math.floor(tempoCasado / 1000)}:R> (<t:${Math.floor(tempoCasado / 1000)}:d>)`
      )
      .setThumbnail('https://cdn.discordapp.com/emojis/1162305895745720330.png?size=2048');

    message.reply({ embeds: [embed] });
  },
};