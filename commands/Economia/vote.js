const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const { formatAmount } = require("../../utils/coinsUtils");

module.exports = {
  name: "vote",
  aliases: ["votar"],
  async execute(message) {
    if (!message.guild) {
      return message.reply("Execute este comando em um servidor, por favor.");
    }

    const userId = message.author.id;
    const guildId = message.guild.id;

    // Prefixo
    const prefixPath = path.join(__dirname, "../../database/prefixos.json");
    let prefix = ";";
    if (fs.existsSync(prefixPath)) {
      try {
        const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
        if (prefixDB[guildId]) prefix = prefixDB[guildId];
      } catch {
        // Se der erro ignora e usa prefix padrão
      }
    }

    // Caminhos
    const coinsPath = path.join(__dirname, "../../database/coins.json");
    const tempPath = path.join(__dirname, "../../database/tempEconomia.json");

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

    // Garante usuário na base
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
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({
          text: message.author.username,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
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
        `Obrigado pelo seu voto, ${message.member.displayName}!\n\n` +
          `Você recebeu **${formatAmount(reward)}** coins como recompensa.\n\n` +
          `🗳️ [Clique aqui para votar](https://top.gg/bot/1351683702333374494/vote)\n` +
          `E ganhe coins bônus cada vez que votar!\n\n` +
          `💰 Use \`${prefix}coins\` para ver seu saldo.`
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1154623572019527731/1154628268851470387/game-show-entertainment-20-512.png"
      )
      .setColor("#fa8072")
      .setFooter({
        text: `${message.author.username} obrigado.`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};