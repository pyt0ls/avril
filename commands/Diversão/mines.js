const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js'); const fs = require('fs'); const path = require('path'); const { formatAmount, parseAmount } = require('../../utils/coinsUtils');

const coinsPath = path.join(__dirname, '../../database/coins.json'); const prefixesPath = path.join(__dirname, '../../database/prefixos.json');

function loadCoins() { if (!fs.existsSync(coinsPath)) return {}; try { return JSON.parse(fs.readFileSync(coinsPath, 'utf8')); } catch { return {}; } }

function saveCoins(data) { fs.writeFileSync(coinsPath, JSON.stringify(data, null, 4)); }

function generateBoard(minesCount = 3) { const totalCells = 16; const board = Array(totalCells).fill('safe'); let minesPlaced = 0;

while (minesPlaced < minesCount) { const pos = Math.floor(Math.random() * totalCells); if (board[pos] !== 'mine') { board[pos] = 'mine'; minesPlaced++; } }

return board; }

module.exports = { name: 'mines', description: 'Jogue Mines e aposte suas coins!', async execute(message, args, client) { const cooldowns = client.minesCooldowns || new Map(); client.minesCooldowns = cooldowns;

const now = Date.now();
const cooldownAmount = 60 * 1000;

if (cooldowns.has(message.author.id)) {
  const expirationTime = cooldowns.get(message.author.id);
  const timeLeft = expirationTime - now;

  if (timeLeft > 0) {
    const seconds = Math.ceil(timeLeft / 1000);
    return message.reply(`⏳ Aguarde **${seconds}s** para jogar Mines novamente.`);
  }
}

cooldowns.set(message.author.id, now + cooldownAmount);
setTimeout(() => cooldowns.delete(message.author.id), cooldownAmount);

let prefix = 'k?';
if (fs.existsSync(prefixesPath)) {
  const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
  if (prefixDB[message.guild.id]) prefix = prefixDB[message.guild.id];
}

const userId = message.author.id;
let coinsDB = loadCoins();
if (!coinsDB[userId]) coinsDB[userId] = { carteira: 0, banco: 0 };

const quantiaArg = args[0];

if (!quantiaArg) {
  return message.reply(`Uso incorreto, acompanhe:\n\`${prefix}mines <quantia> <minas>\`\nMin: 4 bombas, Max: 14.`);
}

let minas = parseInt(args[1]);
if (isNaN(minas)) minas = 4;

if (minas < 4 || minas > 14) {
  return message.reply('Número de minas deve ser entre 4 e 14.');
}

let quantiaInput;
if (quantiaArg.toLowerCase() === 'all') {
  quantiaInput = coinsDB[userId].banco;
} else {
  const parsed = parseAmount(quantiaArg);
  if (parsed === null) {
    return message.reply('Quantia inválida. Use números ou k/m/b/all.');
  }
  quantiaInput = Math.floor(parsed);
}

if (quantiaInput < 100) return message.reply('Aposta mínima é 100 coins.');
if (quantiaInput > coinsDB[userId].banco) {
  return message.reply(`Você não tem coins suficientes. Saldo: ${formatAmount(coinsDB[userId].banco)}`);
}

if (isNaN(minas) || minas < 1 || minas > 14) {
  return message.reply('Número de minas deve ser entre 1 e 14.');
}

coinsDB[userId].banco -= quantiaInput;
saveCoins(coinsDB);

const board = generateBoard(minas);
const gameState = {
  userId,
  quantiaInicial: quantiaInput,
  minesCount: minas,
  board,
  revealed: new Set(),
  clicadas: new Set(),
  ganhoAtual: 0,
  multipler: 1,
  trevos: 0,
  active: true,
};

function createButtons(revealedSet, ganhoAtual, disabled = false, modoPerda = false, aposta = 0, modoGanho = false) {
  const rows = [];

  for (let row = 0; row < 4; row++) {
    const actionRow = new ActionRowBuilder();
    for (let col = 0; col < 4; col++) {
      const idx = row * 4 + col;
      const isRevealed = revealedSet.has(idx);

      let label = '❔️';
      let style = ButtonStyle.Primary;

      if (isRevealed) {
        if (board[idx] === 'mine') {
          label = '💣';
          style = gameState.clicadas.has(idx) ? ButtonStyle.Danger : ButtonStyle.Secondary;
        } else {
          label = gameState.clicadas.has(idx) ? '🍀' : '🍀';
          style = gameState.clicadas.has(idx) ? ButtonStyle.Success : ButtonStyle.Secondary;
        }
      }

      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`cell_${idx}`)
          .setLabel(label)
          .setStyle(style)
          .setDisabled(disabled)
      );
    }
    rows.push(actionRow);
  }

  const controlRow = new ActionRowBuilder();

  if (modoPerda) {
    controlRow.addComponents(
      new ButtonBuilder()
        .setCustomId('sacar')
        .setLabel(`❌ Perdeu (${formatAmount(aposta)})`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  } else if (modoGanho) {
    controlRow.addComponents(
      new ButtonBuilder()
        .setCustomId('sacar')
        .setLabel(`🎉 Ganhou (${formatAmount(ganhoAtual)})`)
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
    );
  } else {
    controlRow.addComponents(
      new ButtonBuilder()
        .setCustomId('sacar')
        .setLabel(`Sacar (${formatAmount(ganhoAtual)})`)
        .setEmoji('💰')
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled)
    );
  }

  controlRow.addComponents(
    new ButtonBuilder()
      .setCustomId('regras')
      .setLabel('Regras')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );

  rows.push(controlRow);
  return rows;
}

const embed = new EmbedBuilder()
  .setTitle(`Mines - **${message.author.tag}**`)
  .setDescription(`Minas: **${minas}**\nAposta: **${formatAmount(quantiaInput)}**\nClique nas ❔️ para revelar.\nCuidado para não clicar numa 💣`)
  .setColor('#ffcc00')
  .setFooter({ text: `Jogo iniciado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

client.minesGames = client.minesGames || new Map();
client.minesGames.set(userId, gameState);

const gameMsg = await message.channel.send({ embeds: [embed], components: createButtons(gameState.revealed, gameState.ganhoAtual) });

const collector = gameMsg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 120_000 });

collector.on('collect', async i => {
  if (!gameState.active) {
    return i.reply({ content: 'Jogo encerrado!', flags: 64 });
  }

  const finalizarJogo = async (mensagem, cor, valorFinal, perdeu = false, ganhou = false) => {
    gameState.active = false;

    for (let j = 0; j < gameState.board.length; j++) {
      gameState.revealed.add(j);
    }

    embed.setDescription(mensagem).setColor(cor);

    collector.stop(); // <- Encerrar antes de atualizar

    try {
      await i.update({
        embeds: [embed],
        components: createButtons(gameState.revealed, valorFinal, true, perdeu, gameState.quantiaInicial, ganhou)
      });
    } catch (err) {
      console.warn('Erro ao atualizar finalização do jogo:', err.message);
    }

    i.client.minesGames.delete(userId);
  };

  if (i.customId === 'regras') {
    return i.reply({
      content: `📋 **Regras do Mines**\n• Revele as ❔️ para ganhar.\n• Evite clicar numa 💣.\n• Cada 🍀 segura aumenta seu multiplicador.\n• Saque antes de perder tudo!`,
      flags: 64
    });
  }

  if (i.customId === 'sacar') {
    coinsDB[userId].banco += gameState.ganhoAtual;
    saveCoins(coinsDB);

    return finalizarJogo(
      `🎉 Você sacou **${formatAmount(gameState.ganhoAtual)} coins** com sucesso!\nTodas as células foram reveladas.`,
      '#00ff00',
      gameState.ganhoAtual,
      false,
      true
    );
  }

  if (!i.customId.startsWith('cell_')) {
    return i.reply({ content: 'Botão inválido.', flags: 64 });
  }

  const idx = parseInt(i.customId.split('_')[1]);
  if (gameState.revealed.has(idx)) {
    return i.reply({ content: 'Essa célula já foi revelada.', flags: 64 });
  }

  gameState.revealed.add(idx);
  gameState.clicadas.add(idx);

  if (gameState.board[idx] === 'mine') {
    return finalizarJogo(
      `💥 Você clicou numa mina!\nPerdeu **${formatAmount(gameState.quantiaInicial)} coins**, poxa lamentável.\n\nJogo encerrado com sucesso!\nTodas as células foram reveladas.`,
      '#ff0000',
      gameState.quantiaInicial,
      true
    );
  }

  gameState.trevos += 1;

  const totalCelas = 16;
  const bonus = (gameState.minesCount / totalCelas) * 1.5;
  const ganhoPorAcerto = 0.25 + bonus;

  gameState.multipler += ganhoPorAcerto;
  gameState.ganhoAtual = Math.floor(gameState.quantiaInicial * gameState.multipler);

  embed.setDescription(
    `Minas: **${minas}**\n` +
    `Aposta: **${formatAmount(quantiaInput)}**\n` +
    `\n` +
    `Possivel ganho: **${formatAmount(gameState.ganhoAtual)} coins**\nTrevos encontrados: **${gameState.trevos}**`
  ).setColor('#ffcc00');

  try {
    await i.update({
      embeds: [embed],
      components: createButtons(gameState.revealed, gameState.ganhoAtual)
    });
  } catch (err) {
    console.warn('Erro ao atualizar jogada:', err.message);
  }
});
} // fecha async execute
}; // fecha module.exports