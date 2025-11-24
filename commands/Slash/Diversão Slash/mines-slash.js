const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { formatAmount, parseAmount } = require('../../../utils/coinsUtils');

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
  fs.writeFileSync(coinsPath, JSON.stringify(data, null, 4));
}

function generateBoard(minesCount = 3) {
  const totalCells = 16;
  const board = Array(totalCells).fill('safe');
  let minesPlaced = 0;

  while (minesPlaced < minesCount) {
    const pos = Math.floor(Math.random() * totalCells);
    if (board[pos] !== 'mine') {
      board[pos] = 'mine';
      minesPlaced++;
    }
  }

  return board;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mines')
    .setDescription('Jogue Mines! Escolha quantas minas e aposte suas coins.')
    .addStringOption(option =>
      option.setName('quantia')
        .setDescription('Quantia para apostar (ex: 100, 1k, 2.5m, all)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('minas')
        .setDescription('Número de minas (mín: 4, máx: 14, padrão: 4)')
        .setRequired(false)
        .setMinValue(4)
        .setMaxValue(14)),

  async execute(interaction) {
  
  //Cooldown 
    const cooldowns = interaction.client.minesCooldowns || new Map();
    interaction.client.minesCooldowns = cooldowns;

    const now = Date.now();
    const cooldownAmount = 60 * 1000;

    if (cooldowns.has(interaction.user.id)) {
      const expirationTime = cooldowns.get(interaction.user.id);
      const timeLeft = expirationTime - now;
      if (timeLeft > 0) {
        return interaction.reply({
          content: `⏳ Aguarde **${Math.ceil(timeLeft / 1000)}s** para jogar Mines novamente.`,
          flags: 64
        });
      }
    }

    cooldowns.set(interaction.user.id, now + cooldownAmount);
    setTimeout(() => cooldowns.delete(interaction.user.id), cooldownAmount);

    const userId = interaction.user.id;
    let coinsDB = loadCoins();
    if (!coinsDB[userId]) coinsDB[userId] = { carteira: 0, banco: 0 };

    // Quantia
    let quantiaInput = interaction.options.getString('quantia');
    if (quantiaInput.toLowerCase() === 'all') {
      quantiaInput = coinsDB[userId].banco;
    } else {
      const parsed = parseAmount(quantiaInput);
      if (parsed === null) {
        return interaction.reply({ content: `Quantia inválida. Use números ou k/m/b/all.`, flags: 64 });
      }
      quantiaInput = Math.floor(parsed);
    }

    if (quantiaInput < 100) {
      return interaction.reply({ content: 'Aposta mínima é 100 coins.', flags: 64 });
    }

    if (quantiaInput > coinsDB[userId].banco) {
      return interaction.reply({ content: `Você não tem coins suficientes. Saldo: ${formatAmount(coinsDB[userId].banco)}`, flags: 64 });
    }

    // Minas (opcional)
    let minesCount = interaction.options.getInteger('minas');
    if (minesCount === null) minesCount = 4;
    if (minesCount < 4 || minesCount > 14) {
      return interaction.reply({ content: 'Número de minas deve ser entre 4 e 14.', flags: 64 });
    }

    coinsDB[userId].banco -= quantiaInput;
    saveCoins(coinsDB);

    const board = generateBoard(minesCount);
    const gameState = {
      userId,
      quantiaInicial: quantiaInput,
      minesCount,
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
              label = '🍀';
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
      .setTitle(`Mines - **${interaction.user.tag}**`)
      .setDescription(`Minas: **${minesCount}**\nAposta: **${formatAmount(quantiaInput)}**\nClique nas ❔️ para revelar.\nCuidado para não clicar numa 💣`)
      .setColor('#ffcc00')
      .setFooter({ text: `Jogo iniciado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    interaction.client.minesGames = interaction.client.minesGames || new Map();
    interaction.client.minesGames.set(userId, gameState);

    await interaction.reply({ embeds: [embed], components: createButtons(gameState.revealed, gameState.ganhoAtual) });

    const filter = i => i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120_000 });

    collector.on('collect', async i => {
      if (!gameState.active) return i.reply({ content: 'Jogo encerrado!', flags: 64 });

      const finalizarJogo = async (mensagem, cor, valorFinal, perdeu = false, ganhou = false) => {
        gameState.active = false;
        for (let j = 0; j < gameState.board.length; j++) {
          gameState.revealed.add(j);
        }

        embed.setDescription(mensagem).setColor(cor);

        try {
          if (i.replied || i.deferred) {
            await i.editReply({
              embeds: [embed],
              components: createButtons(gameState.revealed, valorFinal, true, perdeu, gameState.quantiaInicial, ganhou)
            });
          } else {
            await i.update({
              embeds: [embed],
              components: createButtons(gameState.revealed, valorFinal, true, perdeu, gameState.quantiaInicial, ganhou)
            });
          }
        } catch (err) {
          console.error('Erro ao finalizar o jogo:', err);
        }

        i.client.minesGames.delete(userId);
        collector.stop();
      };

      if (i.customId === 'regras') {
        return i.reply({
          ephemeral: true,
          content: `📋 **Regras do Mines**\n• Revele as ❔️ para ganhar.\n• Evite clicar numa 💣.\n• Cada 🍀 segura aumenta seu multiplicador.\n• Saque antes de perder tudo!`
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
        `Minas: **${minesCount}**\n` +
        `Aposta: **${formatAmount(quantiaInput)}**\n` +
        `\n` +
        `Possivel ganho: **${formatAmount(gameState.ganhoAtual)} coins**\nTrevos encontrados: **${gameState.trevos}**`
      ).setColor('#ffcc00');

      await i.update({ embeds: [embed], components: createButtons(gameState.revealed, gameState.ganhoAtual) });
    });

    collector.on('end', () => {
      interaction.client.minesGames.delete(userId);
    });
  }
};