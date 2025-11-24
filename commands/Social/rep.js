const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

// Caminhos das databases
const repPath = path.join(__dirname, "../../database/reps.json");
const tempPath = path.join(__dirname, "../../database/tempEconomia.json");

// Garante que os arquivos existem
if (!fs.existsSync(repPath)) fs.writeFileSync(repPath, "{}");
if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "{}");

let repData = {};
let tempData = {};

try {
  repData = JSON.parse(fs.readFileSync(repPath, "utf8") || "{}");
} catch {
  repData = {};
}

try {
  tempData = JSON.parse(fs.readFileSync(tempPath, "utf8") || "{}");
} catch {
  tempData = {};
}

const cooldown = 3600; // 1 hora

module.exports = {
  name: "rep",
  aliases: ["reputacao"],
  async execute(message, args) {
    const userId = message.author.id;
    const mention = message.mentions.users.first();

    if (!mention) {
      return message.reply({
        content: `❌ | <@${userId}>, mencione alguém para enviar uma reputação.`,
      });
    }

    if (mention.id === userId) {
      return message.reply({
        content: `❌ | <@${userId}>, você não pode enviar reputação para si mesmo!`,
      });
    }

    if (mention.bot) {
      return message.reply({
        content: `❌ | <@${userId}>, você não pode enviar reputação para bots!`,
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const lastRep = tempData[userId]?.temp_rep || 0;
    const nextRep = lastRep + cooldown;

    if (now < nextRep) {
      const timeLeft = `<t:${nextRep}:R>`;
      return message.reply({
        content: `⛔ | <@${userId}>, você só poderá enviar uma nova reputação ${timeLeft}!`,
      });
    }

    const msg = args.slice(1).join(" ") || "pra você <3";

    // Atualiza reputação
    repData[mention.id] = {
      rep: (repData[mention.id]?.rep || 0) + 1,
    };

    // Salva tempo de cooldown no arquivo de temp
    if (!tempData[userId]) tempData[userId] = {};
    tempData[userId].temp_rep = now;

    // Salvar arquivos
    fs.writeFileSync(repPath, JSON.stringify(repData, null, 2));
    fs.writeFileSync(tempPath, JSON.stringify(tempData, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("<:4branco_estrela:1333712393133490187> **Envio de Reputação!**")
      .setDescription(
        `<:repxd:1383536743466270771> Reputação enviada.\n\n` +
          `<:blue:1412269879888838667> De: <@${userId}>\n` +
          `<:blue:1412269879888838667> Para: <@${mention.id}>\n` +
          `<:blue:1412269879888838667> Recado: ${msg}`
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1077714940745502750/1105210766157680750/reputacao.png"
      )
      .setColor("#00ff99")
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};