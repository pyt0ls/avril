const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prefix } = require('../../config.js');

module.exports = {
  name: 'marry',
  description: 'Proponha casamento para outro usuário',
  usage: `${prefix}marry @usuário`,

  async execute(message, args) {
    if (!args[0]) {
      return message.reply('💍 Você precisa mencionar quem deseja casar!');
    }

    const target = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
    if (!target) {
      return message.reply('💍 Usuário não encontrado.');
    }

    if (target.id === message.author.id) {
      return message.reply('💍 Você não pode casar consigo mesmo!');
    }

    if (target.bot) {
      return message.reply('💍 Você não pode casar com um bot!');
    }

    // Aqui você deveria carregar o JSON para checar se já estão casados
    const fs = require('fs');
    const path = require('path');
    const marryDataPath = path.join(__dirname, '../../database/marry.json');

    if (!fs.existsSync(marryDataPath)) fs.writeFileSync(marryDataPath, JSON.stringify({}));

    const marryData = JSON.parse(fs.readFileSync(marryDataPath, 'utf8'));
    marryData.casamentos = marryData.casamentos || {};

    if (marryData.casamentos[message.author.id]) {
      return message.reply('💍 Você já está casado(a)! Para casar com outra pessoa, divórcie-se primeiro.');
    }

    if (marryData.casamentos[target.id]) {
      return message.reply('💍 Essa pessoa já está casada.');
    }

    // Salva temporariamente a proposta (pode ser útil para controlar expirations, por exemplo)
    marryData.propostas = marryData.propostas || {};
    marryData.propostas[target.id] = message.author.id;
    fs.writeFileSync(marryDataPath, JSON.stringify(marryData, null, 4));

    const embed = new EmbedBuilder()
      .setTitle('💍 Proposta de Casamento')
      .setDescription(`<@${target.id}>, você recebeu uma proposta de casamento de <@${message.author.id}>!\n\nPara aceitar ou recusar, clique no botão abaixo.`)
      .setColor('#ffffff');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`casar-${target.id}-${message.author.id}`)
          .setLabel('Aceitar')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💍'),
        new ButtonBuilder()
          .setCustomId(`recusar-${target.id}-${message.author.id}`)
          .setLabel('Recusar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
      );

    await message.reply({ embeds: [embed], components: [row] });
  }
};