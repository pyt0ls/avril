const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

const emojiList = ["🍎", "🚗", "🐶", "🎲", "⚽", "🚀", "🍕", "🎧"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emojiquiz")
    .setDescription("Tente lembrar qual emoji apareceu!"),

  async execute(interaction) {
  
   // Cooldown específico do emojiquiz (Slash)
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
    
    
    const client = interaction.client;
    const chosenEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];

    client.emojiQuizData = client.emojiQuizData || new Map();
    client.emojiQuizData.set(interaction.user.id, chosenEmoji);

    const memorizeMsg = await interaction.reply({
      content: `🧠 **Decore este emoji:** ${chosenEmoji}`,
      fetchReply: true
    });

    setTimeout(async () => {
      await interaction.deleteReply().catch(() => {});

      const shuffledEmojis = [...emojiList].sort(() => Math.random() - 0.5);
      const buttons = shuffledEmojis.map((emoji) =>
        new ButtonBuilder()
          .setCustomId(`emoji-${emoji}-${interaction.user.id}`)
          .setLabel(emoji)
          .setStyle("Secondary")
      );

      const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 4));
      const row2 = new ActionRowBuilder().addComponents(buttons.slice(4, 8));

      const embed = new EmbedBuilder()
        .setTitle("🧠 Emoji Quiz!")
        .setDescription(`Qual emoji você acabou de decorar? Clique no correto para ganhar 100 moedas!`)
        .setColor("Random")
        .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await interaction.channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed],
        components: [row1, row2],
      });

      setTimeout(() => {
        client.emojiQuizData.delete(interaction.user.id);
      }, 60000);
    }, 3000);
  },
};