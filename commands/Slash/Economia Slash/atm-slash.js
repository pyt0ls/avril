const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const coinsPath = path.join(__dirname, '../../../database/coins.json');

function loadCoins() {
  if (!fs.existsSync(coinsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
  } catch {
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('atm')
    .setDescription('Mostra sua posição no ranking de coins e seu saldo.')
    .addUserOption(option =>
      option.setName('usuário')
        .setDescription('Usuário para consultar o saldo')
        .setRequired(false)
    ),

  async execute(interaction) {
    const coinsDB = loadCoins();

    // Pega usuário selecionado ou autor da interação
    const user = interaction.options.getUser('usuário') || interaction.user;
    const userId = user.id;

    const userData = coinsDB[userId] || { carteira: 0, banco: 0 };
    const userCoins = userData.banco || 0;

    const sorted = Object.entries(coinsDB)
      .sort(([, a], [, b]) => (b.banco || 0) - (a.banco || 0));

    const position = sorted.findIndex(([id]) => id === userId) + 1;

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Rank de Coins de ${user.username}`)
      .setDescription(`Você tem **${userCoins.toLocaleString('pt-BR')} coins** no banco.` +
        (position ? `\nVocê está em **#${position}° lugar** no ranking.` : ''))
      .setColor('#ffffff')
      .setFooter({ text: `${user.username}, sua posição no rank de coins!`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};