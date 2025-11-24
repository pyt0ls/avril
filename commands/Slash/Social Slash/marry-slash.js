const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const marryDataPath = path.join(__dirname, '../../../database/marry.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Proponha casamento para outro usuário')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Quem você deseja casar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const author = interaction.user;
    const target = interaction.options.getUser('usuario');

    if (target.id === author.id) {
      return interaction.reply({
        content: '💍 Você não pode casar consigo mesmo!',
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: '💍 Você não pode casar com um bot!',
        ephemeral: true
      });
    }

    if (!fs.existsSync(marryDataPath)) {
      fs.writeFileSync(marryDataPath, JSON.stringify({}));
    }

    const marryData = JSON.parse(fs.readFileSync(marryDataPath, 'utf8'));
    marryData.casamentos = marryData.casamentos || {};
    marryData.propostas = marryData.propostas || {};

    if (marryData.casamentos[author.id]) {
      return interaction.reply({
        content: '💍 Você já está casado(a)! Para casar com outra pessoa, divórcie-se primeiro.',
        ephemeral: true
      });
    }

    if (marryData.casamentos[target.id]) {
      return interaction.reply({
        content: '💍 Essa pessoa já está casada.',
        ephemeral: true
      });
    }

    marryData.propostas[target.id] = author.id;
    fs.writeFileSync(marryDataPath, JSON.stringify(marryData, null, 4));

    const embed = new EmbedBuilder()
      .setTitle('💍 Proposta de Casamento')
      .setDescription(`<@${target.id}>, você recebeu uma proposta de casamento de <@${author.id}>!\n\nPara aceitar ou recusar, clique no botão abaixo.`)
      .setColor('#ffffff');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`casar-${target.id}-${author.id}`)
        .setLabel('Aceitar')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💍'),
      new ButtonBuilder()
        .setCustomId(`recusar-${target.id}-${author.id}`)
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false
    });
  }
};