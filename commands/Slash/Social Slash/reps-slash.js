const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const repPath = path.join(__dirname, "../../../database/reps.json");

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
  } catch {
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reps")
    .setDescription("Veja quantas reputações você ou outro usuário têm")
    .addUserOption(option =>
      option.setName("usuario")
        .setDescription("Usuário que deseja ver a reputação")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("usuario") || interaction.user;

    const repData = loadJson(repPath);
    const rep = repData[user.id]?.rep || 0;

    const embed = new EmbedBuilder()
      .setTitle("<:4branco_estrela:1333712393133490187> **REPUTAÇÕES!**")
      .setDescription(
        `-# <:redseta:1329724263070171197> **Reputação do usuário:**\n\n` +
        `<:repxd:1383536743466270771> <@${user.id}>\n` +
        `<:v_branco4:1382060159139844196> Possui **${rep.toLocaleString()}** reputações!`
      )
      .setThumbnail("https://cdn.discordapp.com/attachments/1077714940745502750/1105210766157680750/reputacao.png")
      .setColor("#00ff99")
      .setFooter({
        text: `Solicitado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};