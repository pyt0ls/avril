const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const repPath = path.join(__dirname, "../../../database/reps.json");

// Garante que o arquivo existe
if (!fs.existsSync(repPath)) fs.writeFileSync(repPath, "{}");

// Função para carregar JSON
function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
  } catch {
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank-reps")
    .setDescription("Mostra o ranking global de usuários com mais reputações"),

  async execute(interaction) {
    const repData = loadJson(repPath);

    const users = Object.entries(repData)
      .filter(([_, data]) => data.rep > 1)
      .map(([id, data]) => ({
        id,
        rep: data.rep
      }))
      .sort((a, b) => b.rep - a.rep)
      .slice(0, 10);

    if (users.length === 0) {
      return interaction.reply({
        content: "❌ | Nenhum usuário com mais de 1 reputação encontrada.",
        ephemeral: true
      });
    }

    const rankingLines = await Promise.all(
      users.map(async (user, index) => {
        try {
          const userObj = await interaction.client.users.fetch(user.id);
          return `**${index + 1}.** ${userObj.username} — ${user.rep} Reps\nID: \`${user.id}\``;
        } catch {
          return `**${index + 1}.** (Desconhecido) — ${user.rep} Reps\nID: \`${user.id}\``;
        }
      })
    );

    const embed = new EmbedBuilder()
      .setTitle("<:4branco_estrela:1333712393133490187> **Ranking Global de Reputações!**")
      .setDescription(rankingLines.join("\n\n"))
      .setColor("#00ff99")
      .setThumbnail("https://cdn.discordapp.com/attachments/1015095138684522636/1015096060936474655/reps.png")
      .setFooter({
        text: `Solicitado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};