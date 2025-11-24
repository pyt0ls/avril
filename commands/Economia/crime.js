const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { loadCoins, saveCoins, formatAmount } = require("../../utils/coinsUtils");
const { loadTempData, isCooldownOver, getCooldownRemaining, setCooldown } = require("../../utils/cooldownUtils");
const cooldowns = require("../../utils/cooldownsConfig");

module.exports = {
  name: "crime",
  async execute(message) {
    const userId = message.author.id;
    const cooldownTime = cooldowns.temp_crime;

    const coins = loadCoins();
    if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };

    if (!isCooldownOver(userId, "temp_crime", cooldownTime)) {
      const remaining = getCooldownRemaining(userId, "temp_crime", cooldownTime);
      const availableAt = Math.floor(Date.now() / 1000) + remaining;

      const embedCooldown = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("🚨 Você está preso!")
        .setDescription(`Você só poderá cometer um crime novamente <t:${availableAt}:R>!`)
        .setFooter({ text: message.author.username })
        .setTimestamp();

      return message.reply({ embeds: [embedCooldown] });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`crime-confirm-${userId}`)
        .setLabel("Cometer Crime")
        .setStyle(ButtonStyle.Danger)
    );

    const embedConfirm = new EmbedBuilder()
      .setTitle("**Confirmação**")
      .setDescription(
        "Esse comando pode causar consequências negativas como ser preso temporariamente ou levar uma multa.\n\nDeseja continuar?"
      )
      .setColor("#ffffff")
      .setFooter({
        text: `Executado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await message.reply({ embeds: [embedConfirm], components: [row] });
  },
};