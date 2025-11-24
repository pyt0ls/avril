const fs = require("fs");
const path = require("path");
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { formatAmount } = require("../../../utils/coinsUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Vote no bot para ganhar coins!"),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "Execute este comando em um servidor, por favor.",
        ephemeral: true,
      });
    }

    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    // Prefixo
    const prefixPath = path.join(__dirname, "../../../database/prefixos.json");
    let prefix = ";";
    if (fs.existsSync(prefixPath)) {
      try {
        const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
        if (prefixDB[guildId]) prefix = prefixDB[guildId];
      } catch {
        // ignore e usa prefix padrão
      }
    }

    // Caminhos
    const coinsPath = path.join(__dirname, "../../../database/coins.json");
    const tempPath = path.join(__dirname, "../../../database/tempEconomia.json");

    // Garante arquivos
    if (!fs.existsSync(coinsPath)) fs.writeFileSync(coinsPath, "{}");
    if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "{}");

    let coinsData = {};
    let tempData = {};

    try {
      coinsData = JSON.parse(fs.readFileSync(coinsPath, "utf8") || "{}");
      tempData = JSON.parse(fs.readFileSync(tempPath, "utf8") || "{}");
    } catch {
      coinsData = {};
      tempData = {};
    }

    if (!coinsData[userId]) coinsData[userId] = { carteira: 0, banco: 0 };
    if (!tempData[userId]) tempData[userId] = {};

    const now = Math.floor(Date.now() / 1000);
    const cooldown = 13 * 60 * 60; // 13 horas

    const lastVote = tempData[userId].temp_vote || 0;
    const nextVote = lastVote + cooldown;

    if (now < nextVote) {
      const timeLeft = `<t:${nextVote}:R>`;
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`⛔ Você já votou recentemente!`)
        .setDescription(`Volte ${timeLeft} para votar novamente e ganhar coins.`)
        .setAuthor({
          name: "Cooldown ativo",
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({
          text: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const reward = 5000;

    coinsData[userId].carteira += reward;
    tempData[userId].temp_vote = now;

    // Salva
    fs.writeFileSync(coinsPath, JSON.stringify(coinsData, null, 2));
    fs.writeFileSync(tempPath, JSON.stringify(tempData, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("「<:blue_66x:1304070562016137300>」Voto enviado com sucesso!")
      .setDescription(
        `Obrigado pelo seu voto, ${interaction.member.displayName}!\n\n` +
          `Você recebeu **${formatAmount(reward)}** coins como recompensa.\n\n` +
          `🗳️ [Clique aqui para votar](https://top.gg/bot/1361444936880492604/vote)\n` +
          `E ganhe coins bônus cada vez que votar!\n\n` +
          `💰 Use \`${prefix}coins\` para ver seu saldo.`
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1154623572019527731/1154628268851470387/game-show-entertainment-20-512.png"
      )
      .setColor("#fa8072")
      .setFooter({
        text: `${interaction.user.username} obrigado.`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};