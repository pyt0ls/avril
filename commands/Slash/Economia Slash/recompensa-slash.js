const fs = require("fs");
const path = require("path");
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { formatAmount } = require("../../../utils/coinsUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("recompensa")
    .setDescription("Resgate sua recompensa VIP diária (a cada 15 dias)."),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    if (!guildId) {
      return interaction.reply({
        content: "Esse comando só pode ser usado em servidores.",
        ephemeral: true,
      });
    }

    // Pega prefixo do servidor (opcional, para embed)
    const prefixPath = path.join(__dirname, "../../../database/prefixos.json");
    let prefix = ";";
    if (fs.existsSync(prefixPath)) {
      try {
        const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
        if (prefixDB[guildId]) prefix = prefixDB[guildId];
      } catch {
        // Ignora erro JSON
      }
    }

    const coinsPath = path.join(__dirname, "../../../database/coins.json");
    const tempPath = path.join(__dirname, "../../../database/tempEconomia.json");
    const vipPath = path.join(__dirname, "../../../database/vipData.json");

    if (!fs.existsSync(coinsPath)) fs.writeFileSync(coinsPath, "{}");
    if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "{}");
    if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, "{}");

    let coinsData = {};
    let tempData = {};
    let vipData = {};
    try {
      coinsData = JSON.parse(fs.readFileSync(coinsPath, "utf8") || "{}");
      tempData = JSON.parse(fs.readFileSync(tempPath, "utf8") || "{}");
      vipData = JSON.parse(fs.readFileSync(vipPath, "utf8") || "{}");
    } catch {
      coinsData = {};
      tempData = {};
      vipData = {};
    }

    const now = Math.floor(Date.now() / 1000);
    const cooldown = 1296000; // 15 dias em segundos

    const vipTimestamp = vipData[userId] || 0;

    if (!vipTimestamp || vipTimestamp < now) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("🚫 Você não possui um VIP ativo!")
        .setDescription(
          `➕ Seja um [membro(a) VIP](https://discord.com/channels/1265008346998636585/1347471285567098890) para resgatar essa recompensa.`
        )
        .setThumbnail("https://cdn.discordapp.com/emojis/1343690175812997233.webp?size=240")
        .setFooter({
          text: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const lastVipDaily = tempData[userId]?.temp_vipdaily || 0;
    const nextVipDaily = lastVipDaily + cooldown;

    if (now < nextVipDaily) {
      const timeLeft = `<t:${nextVipDaily}:R>`;
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`⏳ Cooldown ativo`)
        .setDescription(
          `Você já resgatou sua recompensa VIP.\nVolte ${timeLeft} pra resgatar novamente.`
        )
        .setAuthor({
          name: "VIP Chief",
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({
          text: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Recompensa entre 50 milhões e 100 milhões
    const reward = Math.floor(Math.random() * (100_000_000 - 50_000_000 + 1)) + 50_000_000;

    if (!coinsData[userId]) coinsData[userId] = { carteira: 0, banco: 0 };
    coinsData[userId].banco += reward;

    if (!tempData[userId]) tempData[userId] = {};
    tempData[userId].temp_vipdaily = now;

    fs.writeFileSync(coinsPath, JSON.stringify(coinsData, null, 2));
    fs.writeFileSync(tempPath, JSON.stringify(tempData, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("💎 » VIP Chief")
      .setDescription(
        `<@${userId}> você recebeu **${formatAmount(reward)}** coins!\n` +
          `⭐ VIP atual ativo: **VIP Chief**\n\n` +
          `Use \`${prefix}coins\` para consultar seu saldo!`
      )
      .setThumbnail("https://cdn.discordapp.com/emojis/1343690175812997233.webp?size=240")
      .setColor("#47ff00")
      .setFooter({
        text: "Deposite pra não ser roubado kkk.",
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  },
};