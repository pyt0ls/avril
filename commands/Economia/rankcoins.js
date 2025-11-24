const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { formatAmount } = require('../../utils/coinsUtils');

function loadCoins() {
  const dbPath = path.join(__dirname, '../../database/coins.json');
  if (!fs.existsSync(dbPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return {};
  }
}

module.exports = {
  name: 'rank-coins',
  aliases: ['ranking'],
  async execute(message) {
    const coins = loadCoins();

    const leaderboard = Object.entries(coins)
      .map(([userId, data]) => ({
        userId,
        coins: data.banco || 0
      }))
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 10);

    if (leaderboard.length === 0) {
      return message.channel.send('Nenhum dado de coins encontrado.');
    }

    let description = '';
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const user = message.client.users.cache.get(entry.userId);
      const username = user ? `${user.username}#${user.discriminator}` : 'Usuário não encontrado';

      description += `**${i + 1}°** - ${username}\n**Coins:** ${formatAmount(entry.coins)}\n\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('💰 Top 10 usuários mais ricos')
      .setDescription(description)
      .setColor('Gold')
      .setThumbnail('https://cdn.discordapp.com/emojis/1142085706395684874.png?size=2048');

    await message.channel.send({ embeds: [embed] });
  }
};