const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { formatAmount, parseAmount } = require('../../utils/coinsUtils');

const coinsPath = path.join(__dirname, '../../database/coins.json');
const prefixPath = path.join(__dirname, '../../database/prefixos.json');

const naipes = ['♠️', '♥️', '♦️', '♣️'];
const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function carregarCoins() {
  if (!fs.existsSync(coinsPath)) return {};
  return JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
}

function salvarCoins(data) {
  fs.writeFileSync(coinsPath, JSON.stringify(data, null, 2));
}

function sortearCarta() {
  const valor = valores[Math.floor(Math.random() * valores.length)];
  const naipe = naipes[Math.floor(Math.random() * naipes.length)];
  return { valor, naipe };
}

function calcularTotal(mao) {
  let total = 0;
  let ases = 0;

  for (const carta of mao) {
    if (['J', 'Q', 'K'].includes(carta.valor)) {
      total += 10;
    } else if (carta.valor === 'A') {
      total += 11;
      ases++;
    } else {
      total += parseInt(carta.valor);
    }
  }

  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }

  return total;
}

function formatarMao(mao) {
  return mao.map(c => `\`${c.valor}${c.naipe}\``).join(' ');
}

module.exports = {
  name: 'blackjack',
  aliases: ['bj', 'bjk', 'blackj'],
  description: 'Jogue Blackjack e aposte suas coins!',
  async execute(message, args, client) {
  
// Cooldown específico do blackjack
if (!client.blackjackCooldowns) client.blackjackCooldowns = new Map();

const cooldowns = client.blackjackCooldowns;
const now = Date.now();
const cooldownAmount = 60 * 1000; // 1 minuto

if (cooldowns.has(message.author.id)) {
  const expirationTime = cooldowns.get(message.author.id);

  if (now < expirationTime) {
    const timeLeft = Math.ceil((expirationTime - now) / 1000);
    return message.reply(`⏳ Aguarde **${timeLeft}s** para jogar novamente.`);
  }
}

// Define novo cooldown
cooldowns.set(message.author.id, now + cooldownAmount);


    const userId = message.author.id;
    const guildId = message.guild?.id;

    // Puxar prefixo
    let prefix = ';';
    if (fs.existsSync(prefixPath)) {
      const db = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
      if (db[guildId]) prefix = db[guildId];
    }

    // Checar argumento de quantia
    const quantiaArg = args[0];
    if (!quantiaArg) {
      return message.reply(`Uso incorreto! Utilize: \`${prefix}blackjack <quantia>\``);
    }

    let coinsDB = carregarCoins();
    if (!coinsDB[userId]) coinsDB[userId] = { carteira: 0, banco: 0 };

    let quantia;
    if (quantiaArg.toLowerCase() === 'all') {
      quantia = coinsDB[userId].banco;
    } else {
      const parsed = parseAmount(quantiaArg);
      if (parsed === null) return message.reply('Quantia inválida. Use números ou k/m/b/all.');
      quantia = Math.floor(parsed);
    }

    if (quantia < 100) return message.reply('Aposta mínima é 100 coins.');
    if (quantia > coinsDB[userId].banco) return message.reply(`Você não tem coins suficientes! Saldo: ${formatAmount(coinsDB[userId].banco)}`);

    coinsDB[userId].banco -= quantia;
    salvarCoins(coinsDB);

    const game = {
      jogador: [],
      bot: [],
      ativo: true,
      aposta: quantia
    };

    game.jogador.push(sortearCarta(), sortearCarta());
    game.bot.push(sortearCarta());

    const embed = new EmbedBuilder()
      .setTitle(`🃏 Blackjack - ${message.author.tag}`)
      .setDescription(`Cartas: ${formatarMao(game.jogador)}\nTotal: **${calcularTotal(game.jogador)}**\n\n🂠 Aguardando sua jogada...`)
      .setColor('#2b2d31')
      .setFooter({ text: `Aposta: ${formatAmount(quantia)} • Use os botões abaixo`, iconURL: message.author.displayAvatarURL() });

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hit').setLabel('➕ Pedir').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stand').setLabel('🛑 Parar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('regras').setLabel('📋 Regras').setStyle(ButtonStyle.Secondary)
    );

    const gameMsg = await message.channel.send({ embeds: [embed], components: [botoes] });

    const collector = gameMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 120_000
    });

    async function finalizar(resultado, ganho = 0) {
      game.ativo = false;
      collector.stop();

      if (ganho > 0) {
        coinsDB[userId].banco += ganho;
        salvarCoins(coinsDB);
      }

      embed.setDescription(resultado).setColor(ganho > 0 ? '#00ff00' : '#ff0000');
      await gameMsg.edit({ embeds: [embed], components: [] });
    }

    collector.on('collect', async i => {
      if (!game.ativo) return i.reply({ content: 'O jogo já foi encerrado.', ephemeral: true });

      if (i.customId === 'regras') {
        return i.reply({
          content: '📋 **Regras do Blackjack**\n• Tente somar o mais próximo de 21.\n• A carta A vale 1 ou 11.\n• Se passar de 21, você perde.\n• Dealer compra até 17.',
          ephemeral: true
        });
      }

      if (i.customId === 'hit') {
        game.jogador.push(sortearCarta());
        const total = calcularTotal(game.jogador);

        if (total > 21) {
          return finalizar(`💥 Você estourou com ${formatarMao(game.jogador)} (**${total}**)!\nPerdeu **${formatAmount(game.aposta)} coins**.`);
        }

        embed.setDescription(`Cartas: ${formatarMao(game.jogador)}\nTotal: **${total}**\n\n🂠 Aguardando sua jogada...`);
        await i.update({ embeds: [embed] });
      }

      if (i.customId === 'stand') {
        // Dealer joga
        while (calcularTotal(game.bot) < 17) {
          game.bot.push(sortearCarta());
        }

        const totalJogador = calcularTotal(game.jogador);
        const totalBot = calcularTotal(game.bot);

        let resultado = `🃏 Suas cartas: ${formatarMao(game.jogador)} (**${totalJogador}**)\n🤖 Dealer: ${formatarMao(game.bot)} (**${totalBot}**)`;

        if (totalBot > 21 || totalJogador > totalBot) {
          resultado += `\n\n🎉 Você venceu e ganhou **${formatAmount(game.aposta * 2)} coins**!`;
          return finalizar(resultado, game.aposta * 2);
        } else if (totalJogador === totalBot) {
          resultado += `\n\n🤝 Empate! Você recebeu sua aposta de volta.`;
          return finalizar(resultado, game.aposta);
        } else {
          resultado += `\n\n😵 Você perdeu **${formatAmount(game.aposta)} coins**.`;
          return finalizar(resultado, 0);
        }
      }
    });

    collector.on('end', () => {
      game.ativo = false;
    });
  }
};