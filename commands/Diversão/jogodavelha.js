const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { parseAmount, formatAmount } = require('../../utils/coinsUtils');

const coinsPath = path.join(__dirname, '../../database/coins.json');
const prefixPath = path.join(__dirname, '../../database/prefixos.json');

function loadCoins() {
  if (!fs.existsSync(coinsPath)) return {};
  return JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
}

function saveCoins(data) {
  fs.writeFileSync(coinsPath, JSON.stringify(data, null, 2));
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : 'empate';
}

module.exports = {
  name: 'jogodavelha',
  aliases: ['jdv', 'velha'],
  description: 'Desafie alguém para um jogo da velha apostando coins!',
  async execute(message, args, client) {
  
// Cooldown específico do jogodavelha
if (!client.jdvCooldowns) client.jdvCooldowns = new Map();

const cooldowns = client.jdvCooldowns;
const now = Date.now();
const cooldownAmount = 30 * 1000; // 30 segundos

if (cooldowns.has(message.author.id)) {
  const expirationTime = cooldowns.get(message.author.id);

  if (now < expirationTime) {
    const timeLeft = Math.ceil((expirationTime - now) / 1000);
    return message.reply(`⏳ Aguarde **${timeLeft}s** para jogar novamente.`);
  }
}

// Define novo cooldown
cooldowns.set(message.author.id, now + cooldownAmount);

    const author = message.author;
    const mention = message.mentions.users.first();
    const guildId = message.guildId;

    // prefixo
    let prefix = ';';
    if (fs.existsSync(prefixPath)) {
      const db = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
      if (db[guildId]) prefix = db[guildId];
    }

    if (!mention || mention.id === author.id || mention.bot) {
      return message.reply(`Use: \`${prefix}jdv @usuário <quantia>\``);
    }

    const amountRaw = args[1];
    if (!amountRaw) return message.reply(`Você precisa especificar a quantia da aposta!`);

    let coinsDB = loadCoins();
    if (!coinsDB[author.id]) coinsDB[author.id] = { carteira: 0, banco: 0 };
    if (!coinsDB[mention.id]) coinsDB[mention.id] = { carteira: 0, banco: 0 };

    let amount;
    if (amountRaw.toLowerCase() === 'all') {
      amount = coinsDB[author.id].banco;
    } else {
      const parsed = parseAmount(amountRaw);
      if (parsed === null) return message.reply('Quantia inválida.');
      amount = Math.floor(parsed);
    }

    if (amount < 100) return message.reply('A aposta mínima é de 100 coins.');
    if (coinsDB[author.id].banco < amount || coinsDB[mention.id].banco < amount) {
      return message.reply('Um dos dois não tem coins suficientes.');
    }

    // Enviar confirmação
const confirmEmbed = new EmbedBuilder()
  .setTitle('🕹️ Jogo da Velha - Confirmação')
  .setDescription(`${mention}, você foi desafiado por ${author}!\n\nAposta valendo: **${formatAmount(amount)}** de coins.\nClique em **Aceitar** para iniciar.\nClique em **Recusar** para cancelar.`)
  .setColor('#f1c40f');

const confirmRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('aceitar')
    .setLabel('✅ Aceitar')
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId('recusar')
    .setLabel('❌ Recusar')
    .setStyle(ButtonStyle.Danger)
);

const confirmMsg = await message.channel.send({
  content: `${mention}`,
  embeds: [confirmEmbed],
  components: [confirmRow]
});

const confirm = await confirmMsg.awaitMessageComponent({
  filter: i => i.user.id === mention.id,
  time: 30000
}).catch(() => null);

if (!confirm || confirm.customId === 'recusar') {
  confirmEmbed
    .setDescription(`${mention} recusou o desafio ou não respondeu.`)
    .setColor('#ff0000');

  // Edita a mensagem original para mostrar a recusa e remove os botões
  return confirmMsg.edit({ embeds: [confirmEmbed], components: [] });
}

await confirm.deferUpdate();
// Deleta a mensagem de confirmação para limpar o chat e iniciar o jogo
await confirmMsg.delete();

// Aqui continua seu código do jogo normalmente...

// descontar coins agora
coinsDB[author.id].banco -= amount;
coinsDB[mention.id].banco -= amount;
saveCoins(coinsDB);

    const board = Array(9).fill(null);
    let currentPlayer = author.id;
    const symbols = {
      [author.id]: '❌',
      [mention.id]: '⭕'
    };

    function renderBoard() {
      const rows = [];
      for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
          const idx = i * 3 + j;
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`cell_${idx}`)
              .setLabel(board[idx] ? board[idx] : '-')
              .setStyle(board[idx] ? (board[idx] === '❌' ? ButtonStyle.Danger : ButtonStyle.Primary) : ButtonStyle.Secondary)
              .setDisabled(!!board[idx])
          );
        }
        rows.push(row);
      }
      return rows;
    }

    const embed = new EmbedBuilder()
      .setTitle('Jogo da Velha')
      .setDescription(`É a vez de ${message.guild.members.cache.get(currentPlayer)}\n\n💸 Uma taxa de **0 Coins** foi aplicada.\n${mention} receberá o valor de **${formatAmount(amount)}**!`)
      .setColor('#9b59b6');

    const gameMsg = await message.channel.send({
      content: `${mention}`,
      embeds: [embed],
      components: renderBoard()
    });

    const collector = gameMsg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async i => {
      if (![author.id, mention.id].includes(i.user.id)) {
        return i.reply({ content: 'Você não está participando desta partida.', ephemeral: true });
      }

      if (i.user.id !== currentPlayer) {
        return i.reply({ content: 'Não é sua vez.', ephemeral: true });
      }

      const idx = parseInt(i.customId.split('_')[1]);
      if (board[idx]) return;

      board[idx] = symbols[i.user.id];
      const winner = checkWinner(board);

      if (winner) {
        let description;
        let color;
        if (winner === 'empate') {
          coinsDB[author.id].banco += amount;
          coinsDB[mention.id].banco += amount;
          description = `Empate! Ambos os jogadores receberam suas apostas de volta.`;
          color = '#f1c40f';
        } else {
          const winnerId = Object.keys(symbols).find(key => symbols[key] === winner);
          coinsDB[winnerId].banco += amount * 2;
          description = `<@${winnerId}> Ganhou e recebeu **${formatAmount(amount * 2)} coins**!`;
          color = '#2ecc71';
        }

        saveCoins(coinsDB);
        embed.setDescription(description).setColor(color);
        collector.stop();

        return i.update({ embeds: [embed], components: renderBoard() });
      }

      // troca de turno
      currentPlayer = currentPlayer === author.id ? mention.id : author.id;
      embed.setDescription(`É a vez de <@${currentPlayer}>\n\n💸 Uma taxa de **0 Coins** foi aplicada.\n${mention} receberá o valor de **${formatAmount(amount)}**!`);

      await i.update({ embeds: [embed], components: renderBoard() });
    });

    collector.on('end', async () => {
      if (!checkWinner(board)) {
        // empate forçado por tempo
        coinsDB[author.id].banco += amount;
        coinsDB[mention.id].banco += amount;
        saveCoins(coinsDB);
        embed.setDescription(`⏰ Tempo esgotado! O jogo empatou e os coins foram devolvidos.`).setColor('#e67e22');
        await gameMsg.edit({ embeds: [embed], components: renderBoard() });
      }
    });
  }
};