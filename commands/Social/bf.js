const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prefix } = require('../../config.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'bf',
  description: 'Peça alguém em melhor amizade',
  usage: `${prefix}bf @usuário`,

  async execute(message, args) {
    if (!args[0]) {
      return message.reply('🫂 Você precisa mencionar quem deseja ser seu melhor amigo!');
    }

    const target = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
    if (!target) {
      return message.reply('🫂 Usuário não encontrado.');
    }

    if (target.id === message.author.id) {
      return message.reply('🫂 Você não pode ser melhor amigo de si mesmo!');
    }

    if (target.bot) {
      return message.reply('🫂 Você não pode ser melhor amigo de um bot!');
    }

    const bfPath = path.join(__dirname, '../../database/bf.json');
    if (!fs.existsSync(bfPath)) fs.writeFileSync(bfPath, JSON.stringify({}));

    const bfData = JSON.parse(fs.readFileSync(bfPath, 'utf8'));
    bfData.amizades = bfData.amizades || {};
    bfData.pedidos = bfData.pedidos || {};

    if (bfData.amizades[message.author.id]) {
      return message.reply('🫂 Você já tem um melhor amigo! Termine a amizade atual para fazer outro pedido.');
    }

    if (bfData.amizades[target.id]) {
      return message.reply('🫂 Essa pessoa já tem um melhor amigo.');
    }

    bfData.pedidos[target.id] = message.author.id;
    fs.writeFileSync(bfPath, JSON.stringify(bfData, null, 4));

    const embed = new EmbedBuilder()
      .setTitle('🫂 Pedido de Melhor Amizade')
      .setDescription(`<@${target.id}>, você recebeu um pedido de melhor amizade de <@${message.author.id}>!\n\n> ✅ Clique em **"Aceitar"** para aceitar.\n> ❌ Clique em **"Recusar"** para recusar.`)
      .setColor('#ffffff');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`amizade-${target.id}-${message.author.id}`)
        .setLabel('Aceitar')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🤝'),
      new ButtonBuilder()
        .setCustomId(`recusaramizade-${target.id}-${message.author.id}`)
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};