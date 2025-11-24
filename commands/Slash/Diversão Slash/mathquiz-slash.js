const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const mathAnswers = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mathquiz')
    .setDescription('Teste seu nível de inteligência com matemática'),

  async execute(interaction) {
  
  // Cooldown específico do mathquiz (Slash)
const cooldowns = interaction.client.minesCooldowns || new Map();
interaction.client.minesCooldowns = cooldowns;

const now = Date.now();
const cooldownAmount = 30 * 1000; // 30 segundos

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

    mathAnswers.set(interaction.user.id, correctAnswer);

    const embed = new EmbedBuilder()
      .setColor('#fa8072')
      .setTitle('🧠 Teste de inteligência')
      .setDescription(`Resolva a conta: \`${c1} ${isAddition ? '+' : '-'} ${c2} = ?\`\nResponda aqui com o número correto para ganhar 100 moedas!`)
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', message => {
      const respostaUsuario = parseInt(message.content, 10);
      const respostaCorreta = mathAnswers.get(interaction.user.id);

      if (respostaUsuario === respostaCorreta) {
        message.reply('🎉 Parabéns, você acertou e ganhou **100** moedas!');
      } else {
        message.reply(`❌ Errado! A resposta correta era **${respostaCorreta}.**`);
      }

      mathAnswers.delete(interaction.user.id);
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.channel.send(`<@${interaction.user.id}>, tempo acabou. Tente novamente!`);
        mathAnswers.delete(interaction.user.id);
      }
    });
  },

  mathAnswers,
};