const fs = require('fs');
const path = require('path');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const coinsPath = path.join(__dirname, '../../../database/coins.json');

function loadCoins() {
  if (!fs.existsSync(coinsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveCoins(data) {
  fs.writeFileSync(coinsPath, JSON.stringify(data, null, 2));
}

function formatAmount(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(2).replace(/\.00$/, '') + 'b';
  if (value >= 1e6) return (value / 1e6).toFixed(2).replace(/\.00$/, '') + 'm';
  if (value >= 1e3) return (value / 1e3).toFixed(2).replace(/\.00$/, '') + 'k';
  return value.toString();
}

function parseBet(str) {
  str = str.toLowerCase().trim();
  let multiplier = 1;

  if (str.endsWith('k')) {
    multiplier = 1e3;
    str = str.slice(0, -1);
  } else if (str.endsWith('m')) {
    multiplier = 1e6;
    str = str.slice(0, -1);
  } else if (str.endsWith('b')) {
    multiplier = 1e9;
    str = str.slice(0, -1);
  }

  const num = Number(str);
  if (isNaN(num)) return null;
  return Math.floor(num * multiplier);
}

// Cooldown Map simples
const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Jogue slots e aposte suas coins!')
    .addStringOption(option =>
      option.setName('valor')
        .setDescription('Valor da aposta (ex: 10k, 5m)')
        .setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    // Check cooldown 6s
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + 6000;
      if (now < expirationTime) {
        const remaining = Math.ceil((expirationTime - now) / 1000);
        return interaction.reply({ content: `⏳ Aguarde ${remaining} segundo(s) para usar o comando novamente.`, ephemeral: true });
      }
    }

    const betInput = interaction.options.getString('valor');
    const bet = parseBet(betInput);

    if (bet === null || bet <= 0) {
      return interaction.reply({ content: '❌ Valor inválido. Use números ou com sufixo k, m, b (ex: 10k, 5m).', ephemeral: true });
    }

    // Carrega coins
    const coinsDB = loadCoins();
    const userCoins = (coinsDB[userId]?.banco) || 0;

    if (userCoins < bet) {
      return interaction.reply({ content: '❌ Você não possui coins suficientes no banco para essa aposta.', ephemeral: true });
    }

    // Símbolos dos slots
    const symbols = ['🚢', '⚡', '⭐'];

    // Sorteia os 3 símbolos
    const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
    const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

    const slotsResult = `${slot1} | ${slot2} | ${slot3}`;

    let won = false;
    if (slot1 === slot2 && slot2 === slot3) {
      won = true;
    }

    // Atualiza coins
    if (won) {
      coinsDB[userId].banco = (coinsDB[userId].banco || 0) + bet;
    } else {
      coinsDB[userId].banco = (coinsDB[userId].banco || 0) - bet;
    }

    saveCoins(coinsDB);

    // Monta embed
    const embed = new EmbedBuilder()
      .setColor(won ? '#00ffc3' : '#ff0000')
      .setTitle('🎰 • Slots')
      .setThumbnail('https://cdn.discordapp.com/attachments/1148414200830505011/1151704740246343810/jago33-slot-machine.gif')
      .setDescription(
        `Você apostou **${formatAmount(bet)}** coins e ${won ? 'ganhou' : 'perdeu'}!\n` +
        `Resultado: ${slotsResult}`
      );

    await interaction.reply({ embeds: [embed] });

    // Registra cooldown
    cooldowns.set(userId, now);
  }
};