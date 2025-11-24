const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const { loadCoins, saveCoins } = require("../../utils/coinsUtils");
const {
  loadTempData,
  isCooldownOver,
  getCooldownRemaining,
  setCooldown,
} = require("../../utils/cooldownUtils");
const cooldowns = require("../../utils/cooldownsConfig");
const config = require("../../config");

// Caminho dos arquivos
const armasPath = path.join(__dirname, "../../database/armasData.json");
const prefixesPath = path.join(__dirname, "../../database/prefixos.json");

// Garante que o arquivo de armas existe
if (!fs.existsSync(armasPath))
  fs.writeFileSync(armasPath, JSON.stringify({}, null, 4));

module.exports = {
  name: "roubar",
  aliases: ["steal", "rob"],
  async execute(message) {
    const user = message.author;
    const userId = user.id;
    const target = message.mentions.users.first();

    // Carregar prefixo
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (message.guild && prefixDB[message.guild.id])
        prefix = prefixDB[message.guild.id];
    }

    if (!target) {
      return message.reply({
        content: `❌ Você precisa mencionar alguém.\nExemplo: \`${prefix}roubar @usuário\``,
      });
    }

    if (target.id === user.id) {
      return message.reply({
        content: "❌ Você não pode roubar de si mesmo.",
      });
    }

    if (target.bot) {
      return message.reply({
        content: "❌ Você não pode roubar bots.",
      });
    }

    // Carregar dados
    const coins = loadCoins();
    const armasData = JSON.parse(fs.readFileSync(armasPath, "utf8"));

    if (!coins[target.id] || coins[target.id].carteira < 100) {
      return message.reply({
        content: "❌ O usuário não tem dinheiro suficiente na carteira para ser roubado (mínimo 100 coins).",
      });
    }

    // Verificar arma
    if (!armasData[userId] || armasData[userId].length === 0) {
      return message.reply({
        content: `❌ Você não possui uma arma para roubar.\n🛍️ Compre uma usando \`${prefix}shop\`.`,
      });
    }

    // Cooldown
    const cooldownTime = cooldowns.temp_roubar;

    if (!isCooldownOver(userId, "temp_roubar", cooldownTime)) {
      const remaining = getCooldownRemaining(userId, "temp_roubar", cooldownTime);
      const availableAt = Math.floor(Date.now() / 1000) + remaining;

      const embedCooldown = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("🚓 Você já cometeu um roubo!")
        .setDescription(`Tente novamente <t:${availableAt}:R>.`)
        .setFooter({ text: message.author.username })
        .setTimestamp();

      return message.reply({ embeds: [embedCooldown] });
    }

    // Confirmação
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`roubar-confirm-${target.id}-${userId}`)
        .setLabel("Roubar")
        .setStyle(ButtonStyle.Danger)
    );

    const embedConfirm = new EmbedBuilder()
      .setTitle("🔫 **Confirmação de Roubo**")
      .setDescription(
        `⚠️ Você está prestes a roubar ${target}. Isso pode gerar consequências!\n\nDeseja continuar?`
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