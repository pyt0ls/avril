const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

const emojiList = ["🍎", "🚗", "🐶", "🎲", "⚽", "🚀", "🍕", "🎧"];

module.exports = {
  name: "emojiquiz",
  aliases: ["eq"],
  async execute(message, args, client) {
  
 // Cooldown específico do emojiquiz
if (!message.client.emojiQuizCooldowns) message.client.emojiQuizCooldowns = new Map();

const cooldowns = message.client.emojiQuizCooldowns;
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


    const chosenEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    client.emojiQuizData = client.emojiQuizData || new Map();
    client.emojiQuizData.set(message.author.id, chosenEmoji);

    // 1. Envia mensagem para decorar o emoji
    const memorizeMsg = await message.channel.send(`🧠 **Decore este emoji:** ${chosenEmoji}`);

    // 2. Espera 5 segundos para o usuário decorar
    setTimeout(async () => {
      await memorizeMsg.delete().catch(() => {});

      // 3. Embaralha os emojis para os botões
      const shuffledEmojis = [...emojiList].sort(() => Math.random() - 0.5);

      // Cria botões (8 botões, 2 linhas de 4)
      const buttons = shuffledEmojis.map((emoji) =>
        new ButtonBuilder()
          .setCustomId(`emoji-${emoji}-${message.author.id}`)
          .setLabel(emoji)
          .setStyle("Secondary")
      );

      const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 4));
      const row2 = new ActionRowBuilder().addComponents(buttons.slice(4, 8));

      // 4. Envia a embed perguntando qual era o emoji
      const embed = new EmbedBuilder()
        .setTitle("🧠 Emoji Quiz!")
        .setDescription(`Qual emoji você acabou de decorar? Clique no correto para ganhar 100 moedas!`)
        .setColor("Random")
        .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await message.channel.send({
        embeds: [embed],
        components: [row1, row2],
      });

      // Timeout para remover o quiz do cache após 1 minuto
      setTimeout(() => {
        client.emojiQuizData.delete(message.author.id);
      }, 60000);
    }, 3000); // 5 segundos para decorar
  },
};