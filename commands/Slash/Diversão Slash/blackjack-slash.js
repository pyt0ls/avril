const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { formatAmount, parseAmount } = require('../../../utils/coinsUtils');

const coinsPath = path.join(__dirname, '../../../database/coins.json');

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
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Jogue Blackjack e aposte suas coins!')
    .addStringOption(option =>
      option.setName('quantia')
        .setDescription('Quantia para apostar (ex: 100, 1k, 2m, all)')
        .setRequired(true)
    ),

  async execute(interaction) {
  
   // Cooldown específico do blackjack (Slash)
const cooldowns = interaction.client.minesCooldowns || new Map();
interaction.client.minesCooldowns = cooldowns;

const now = Date.now();
const cooldownAmount = 60 * 1000; // 1 minuto

if (cooldowns.has(interaction.user.id)) {
  const expirationTime = cooldowns.get(interaction.user.id);
  const timeLeft = expirationTime - now;

  if (timeLeft > 0) {
    return interaction.reply({
      content: `⏳ Aguarde **${Math.ceil(timeLeft / 1000)}s** para jogar novamente.`,
      ephemeral: true
    });
  }
}

// Define o cooldown e remove automaticamente após o tempo
cooldowns.set(interaction.user.id, now + cooldownAmount);
setTimeout(() => cooldowns.delete(interaction.user.id), cooldownAmount);
    
    const userId = interaction.user.id;

    let coinsDB = carregarCoins();
    if (!coinsDB[userId]) coinsDB[userId] = { carteira: 0, banco: 0 };

    let quantiaArg = interaction.options.getString('quantia');
    let quantia;

    if (quantiaArg.toLowerCase() === 'all') {
      quantia = coinsDB[userId].banco;
    } else {
      const parsed = parseAmount(quantiaArg);
      if (parsed === null) {
        return interaction.reply({ content: 'Quantia inválida. Use números ou k/m/b/all.', ephemeral: true });
      }
      quantia = Math.floor(parsed);
    }

    if (quantia < 100) {
      return interaction.reply({ content: 'Aposta mínima é 100 coins.', ephemeral: true });
    }

    if (quantia > coinsDB[userId].banco) {
      return interaction.reply({
        content: `Você não tem coins suficientes! Saldo: ${formatAmount(coinsDB[userId].banco)}`,
        ephemeral: true
      });
    }

    coinsDB[userId].banco -= quantia;
    salvarCoins(coinsDB);

    const game = {
      jogador: [sortearCarta(), sortearCarta()],
      bot: [sortearCarta()],
      ativo: true,
      aposta: quantia
    };

    const embed = new EmbedBuilder()
      .setTitle(`🃏 Blackjack - ${interaction.user.tag}`)
      .setDescription(`Cartas: ${formatarMao(game.jogador)}\nTotal: **${calcularTotal(game.jogador)}**\n\n🂠 Aguardando sua jogada...`)
      .setColor('#2b2d31')
      .setFooter({ text: `Aposta: ${formatAmount(quantia)} • Use os botões abaixo`, iconURL: interaction.user.displayAvatarURL() });

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hit').setLabel('➕ Pedir').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stand').setLabel('🛑 Parar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('regras').setLabel('📋 Regras').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [botoes] });

    const gameMsg = await interaction.fetchReply();

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
        return i.update({ embeds: [embed] });
      }

      if (i.customId === 'stand') {
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