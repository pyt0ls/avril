const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

// Caminho da database
const repPath = path.join(__dirname, "../../database/reps.json");

// Garante que o arquivo existe
if (!fs.existsSync(repPath)) fs.writeFileSync(repPath, "{}");

// Carrega os dados
let repData = {};
try {
  repData = JSON.parse(fs.readFileSync(repPath, "utf8") || "{}");
} catch {
  repData = {};
}

module.exports = {
  name: "rankreps",
  aliases: ["topreps", "reptop", "rankrep"],
  async execute(message) {
    // Filtra usuários com +1 rep e monta array
    const users = Object.entries(repData)
      .filter(([_, data]) => data.rep > 1)
      .map(([id, data]) => ({
        id,
        rep: data.rep
      }))
      .sort((a, b) => b.rep - a.rep)
      .slice(0, 10);

    if (users.length === 0) {
      return message.reply("❌ | Nenhum usuário com mais de 1 reputação encontrada.");
    }

    // Puxa os usernames globalmente
    const rankingLines = await Promise.all(
      users.map(async (user, index) => {
        try {
          const userObj = await message.client.users.fetch(user.id);
          return `**${index + 1}.** ${userObj.username} — ${user.rep} Reps)\nID: \`${user.id}\``;
        } catch {
          return `**${index + 1}.** (Desconhecido) — (${user.rep} Reps)\nID: \`${user.id}\``;
        }
      })
    );

    const embed = new EmbedBuilder()
      .setTitle("<:4branco_estrela:1333712393133490187> **Ranking Global de Reputações!**")
      .setDescription(rankingLines.join("\n\n"))
      .setColor("#00ff99")
      .setThumbnail("https://cdn.discordapp.com/attachments/1015095138684522636/1015096060936474655/reps.png")
      .setFooter({
        text: `Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};