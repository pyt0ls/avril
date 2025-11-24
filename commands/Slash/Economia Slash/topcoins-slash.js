const fs = require('fs');
const path = require('path');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const config = require('../../../config');
const { formatAmount } = require('../../../utils/coinsUtils');

const dbPath = path.join(__dirname, '../../../database/coins.json');
const prefixesPath = path.join(__dirname, '../../../database/prefixos.json');

function loadCoins() {
  if (!fs.existsSync(dbPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return {};
  }
}

function encodeParam(str) {
  return encodeURIComponent(str);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top-coins')
    .setDescription('Mostra o ranking global elite de coins com imagem customizada'),

  async execute(interaction) {
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (interaction.guild && prefixDB[interaction.guild.id]) {
        prefix = prefixDB[interaction.guild.id];
      }
    }

    const coins = loadCoins();

    const leaderboard = Object.entries(coins)
      .map(([userId, data]) => ({
        userId,
        coins: data.banco || 0,
      }))
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 5);

    if (leaderboard.length === 0) {
      return interaction.reply('Nenhum dado de coins encontrado.');
    }

    const usernames = [];
    const avatars = [];
    const banners = [];
    const valores = [];

    for (const entry of leaderboard) {
      const user = interaction.client.users.cache.get(entry.userId);
      usernames.push(user ? `${user.username}` : 'Desconhecido');
      avatars.push(user ? user.displayAvatarURL({ dynamic: true, size: 128 }) : '');
      banners.push('');
      valores.push(entry.coins);
    }

    const varAmount = 5;
    const varTitle = 'Top Elite de Coins';
    const varFooter = `Utilize "${prefix}atm" para ver sua atual posição no ranking global.`;
    const varTheme = 13;
    const varPage = 1;
    const varBackground = '';

    const urlImg = `https://jayaapi.vercel.app/ranking?tema=${varTheme}&quantia=${varAmount}` +
      `&title=${encodeParam(varTitle)}` +
      `&usernames=${encodeParam(usernames.join(','))}` +
      `&avatars=${encodeParam(avatars.join(','))}` +
      `&banners=${encodeParam(banners.join(','))}` +
      `&valores=${encodeParam(valores.join(','))}` +
      `&page=${varPage}` +
      `&footer=${encodeParam(varFooter)}` +
      (varBackground ? `&background=${encodeParam(varBackground)}` : '');

    const embed = new EmbedBuilder()
      .setColor('#33e4ff')
      .setTitle('🌐 • Ranking Global')
      .setImage(urlImg);

    await interaction.reply({ embeds: [embed] });
  },
};