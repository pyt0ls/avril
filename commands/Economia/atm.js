const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const coinsPath = path.join(__dirname, '../../database/coins.json');

function loadCoins() {
  if (!fs.existsSync(coinsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
  } catch {
    return {};
  }
}

module.exports = {
  name: 'atm',
  aliases: [],
  description: 'Mostra sua posição no ranking de coins e seu saldo.',
  async execute(message, args) {
    const coinsDB = loadCoins();

    // Pega usuário mencionado ou autor da mensagem
    let user = message.mentions.users.first() || message.author;
    const userId = user.id;

    // Pega os dados do usuário, ou padrão
    const userData = coinsDB[userId] || { carteira: 0, banco: 0 };

    // Escolha o saldo que quer usar pra ranking — banco aqui
    const userCoins = userData.banco || 0;

    // Ordena os usuários pelo saldo (maior primeiro)
    const sorted = Object.entries(coinsDB)
      .sort(([, a], [, b]) => (b.banco || 0) - (a.banco || 0));

    // Encontra a posição do usuário na lista ordenada
    const position = sorted.findIndex(([id]) => id === userId) + 1;

    // Embed com a posição e saldo
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Rank de Coins de ${user.username}`)
      .setDescription(`Você tem **${userCoins.toLocaleString('pt-BR')} coins** no banco.` +
        (position ? `\nVocê está em **#${position}° lugar** no ranking.` : ''))
      .setColor('#ffffff')
      .setFooter({ text: `${user.username}, sua posição no rank de coins!`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};