const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

// Caminho do banco de reputações
const repPath = path.join(__dirname, "../../database/reps.json");

module.exports = {
  name: "reps",
  aliases: ["minharep", "repinfo"],
  async execute(message) {
    // Recarrega repData do arquivo toda vez que o comando é chamado
    let repData = {};
    try {
      repData = JSON.parse(fs.readFileSync(repPath, "utf8") || "{}");
    } catch {
      repData = {};
    }

    const user = message.mentions.users.first() || message.author;
    const rep = repData[user.id]?.rep || 0;

    const embed = new EmbedBuilder()
      .setTitle("<:4branco_estrela:1333712393133490187> **REPUTAÇÕES!**")
      .setDescription(
        `-# <:redseta:1329724263070171197> **Reputação do usuário:**\n\n` +
        `<:repxd:1383536743466270771> <@${user.id}>\n` +
        `<:v_branco4:1382060159139844196> Possui **${rep.toLocaleString()}** reputações!`
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