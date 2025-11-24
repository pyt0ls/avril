const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bf')
    .setDescription('Peça alguém em melhor amizade')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Quem você quer pedir em melhor amizade')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const author = interaction.user;

    if (target.id === author.id) {
      return interaction.reply({
        content: '🫂 Você não pode ser melhor amigo de si mesmo!',
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: '🫂 Você não pode ser melhor amigo de um bot!',
        ephemeral: true
      });
    }

    const bfPath = path.join(__dirname, '../../../database/bf.json');
    if (!fs.existsSync(bfPath)) fs.writeFileSync(bfPath, JSON.stringify({}));

    const bfData = JSON.parse(fs.readFileSync(bfPath, 'utf8'));
    bfData.amizades = bfData.amizades || {};
    bfData.pedidos = bfData.pedidos || {};

    if (bfData.amizades[author.id]) {
      return interaction.reply({
        content: '🫂 Você já tem um melhor amigo! Termine a amizade atual para fazer outro pedido.',
        ephemeral: true
      });
    }

    if (bfData.amizades[target.id]) {
      return interaction.reply({
        content: '🫂 Essa pessoa já tem um melhor amigo.',
        ephemeral: true
      });
    }

    bfData.pedidos[target.id] = author.id;
    fs.writeFileSync(bfPath, JSON.stringify(bfData, null, 4));

    const embed = new EmbedBuilder()
      .setTitle('🫂 Pedido de Melhor Amizade')
      .setDescription(`<@${target.id}>, você recebeu um pedido de melhor amizade de <@${author.id}>!\n\n> ✅ Clique em **"Aceitar"** para aceitar.\n> ❌ Clique em **"Recusar"** para recusar.`)
      .setColor('#ffffff');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`amizade-${target.id}-${author.id}`)
        .setLabel('Aceitar')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🤝'),
      new ButtonBuilder()
        .setCustomId(`recusaramizade-${target.id}-${author.id}`)
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};