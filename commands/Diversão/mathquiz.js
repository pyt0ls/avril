const { EmbedBuilder } = require('discord.js');

const mathAnswers = new Map(); // Guarda as respostas certas por userId

module.exports = {
  name: 'mathquiz',
  aliases: ['calc', 'calcular'],
  description: 'Teste seu nível de inteligência com matemática',

  async execute(message) {
  // Cooldown específico do mathquiz
if (!message.client.mathCooldowns) message.client.mathCooldowns = new Map();

const cooldowns = message.client.mathCooldowns;
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

    const isAddition = Math.random() < 0.5;

    let c1, c2, correctAnswer;

    if (isAddition) {
      c1 = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;
      c2 = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
      correctAnswer = c1 + c2;
    } else {
      c1 = Math.floor(Math.random() * (1000 - 400 + 1)) + 400;
      c2 = Math.floor(Math.random() * (400 - 100 + 1)) + 100;
      correctAnswer = c1 - c2;
    }

    mathAnswers.set(message.author.id, correctAnswer);

    const embed = new EmbedBuilder()
      .setColor('#fa8072')
      .setTitle('🧠 Teste de inteligência')
      .setDescription(`Resolva a conta: \`${c1} ${isAddition ? '+' : '-'} ${c2} = ?\`\nResponda aqui com o número correto para ganhar 100 moedas!`)
      .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },

  mathAnswers, // exporta o map pra usar no event handler
};