const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatAmount, loadCoins, saveCoins } = require("../../../utils/coinsUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mensal")
    .setDescription("Receba sua recompensa mensal de coins!"),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "Esse comando só pode ser usado dentro de servidores.",
        ephemeral: true,
      });
    }

    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    // Pegar prefixo do servidor
    const prefixPath = path.join(__dirname, "../../../database/prefixos.json");
    let prefix = ";";
    if (fs.existsSync(prefixPath)) {
      try {
        const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
        if (prefixDB[guildId]) prefix = prefixDB[guildId];
      } catch {
        // Ignora erro no JSON
      }
    }

    // Carregar cooldowns
    const cooldownPath = path.join(__dirname, "../../../database/tempEconomia.json");
    if (!fs.existsSync(cooldownPath)) fs.writeFileSync(cooldownPath, "{}");

    let cooldownData = {};
    try {
      cooldownData = JSON.parse(fs.readFileSync(cooldownPath, "utf8"));
    } catch {
      cooldownData = {};
    }

    const now = Math.floor(Date.now() / 1000);
    const cooldownTime = 29 * 24 * 60 * 60; // 29 dias em segundos
    const lastClaim = cooldownData[userId]?.temp_mensal || 0;
    const nextClaim = lastClaim + cooldownTime;

    if (now < nextClaim) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`Olá, ${interaction.user.username}!`)
        .setDescription(
          `Você já resgatou sua recompensa mensal.\nVolte <t:${nextClaim}:R> para receber novamente.`
        )
        .setFooter({
          text: `Usado por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Gera recompensa entre 100k e 150k
    const reward = Math.floor(Math.random() * (150000 - 100000 + 1)) + 100000;

    // Atualiza saldo com funções utilitárias
    const coins = loadCoins();
    if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };
    coins[userId].carteira += reward;
    saveCoins(coins);

    // Atualiza cooldown
    if (!cooldownData[userId]) cooldownData[userId] = {};
    cooldownData[userId].temp_mensal = now;
    fs.writeFileSync(cooldownPath, JSON.stringify(cooldownData, null, 2));

    // Embed de sucesso
    const embed = new EmbedBuilder()
      .setTitle("「<:70s_whitcash:1304070691892625448>」Recompensa Mensal")
      .setDescription(
        `<@${userId}> você recebeu **${formatAmount(reward)} coins** como recompensa mensal!\n` +
          `Use \`${prefix}coins\` para consultar seu saldo.`
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1109147495377944637/1109147920873291958/W62CxVX.png"
      )
      .setColor("#47ff00")
      .setFooter({
        text: `Comando utilizado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};