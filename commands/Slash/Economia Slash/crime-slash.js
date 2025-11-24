const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { loadCoins } = require("../../../utils/coinsUtils");
const {
  isCooldownOver,
  getCooldownRemaining,
} = require("../../../utils/cooldownUtils");
const cooldowns = require("../../../utils/cooldownsConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crime")
    .setDescription("Tente cometer um crime, com chance de multa ou prisão."),

  async execute(interaction) {
    const userId = interaction.user.id;
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
        .setFooter({ text: interaction.user.username })
        .setTimestamp();

      return interaction.reply({ embeds: [embedCooldown], ephemeral: true });
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
        text: `Executado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embedConfirm], components: [row], ephemeral: false });
  },
};