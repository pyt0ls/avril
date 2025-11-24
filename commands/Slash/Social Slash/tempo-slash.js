const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const cooldowns = require("../../../utils/cooldownsConfig");

const tempPath = path.join(__dirname, "../../../database/tempEconomia.json");

function loadJson(path) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
  try {
    return JSON.parse(fs.readFileSync(path, "utf8") || "{}");
  } catch {
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tempo")
    .setDescription("Veja os seus cooldowns de economia e reputação"),

  async execute(interaction) {
    const user = interaction.user;
    const userId = user.id;
    const now = Math.floor(Date.now() / 1000);
    const tempData = loadJson(tempPath);

    const cd = (key) => {
      const cooldown = cooldowns[key];
      const last = tempData[userId]?.[key] || 0;
      const availableAt = last + cooldown;

      if (availableAt <= now) {
        return "> ✅ ╸``Disponível agora``";
      } else {
        return `> ❌ ╸\`Disponível\` <t:${availableAt}:R>`;
      }
    };

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Meus intervalos",
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setTitle(`**Usuário:** ${user.username}`)
      .setThumbnail("https://cdn.discordapp.com/emojis/1162420151396864072.png?size=2048")
      .setColor("#00ffc3")
      .setDescription(`\
> * **daily:** ${cd("temp_daily")}
> * **work:** ${cd("temp_work")}
> * **crime:** ${cd("temp_crime")}
> * **roubo:** ${cd("temp_roubar")}
> * **reputação:** ${cd("temp_rep")}
> * **semanal:** ${cd("temp_semanal")}
> * **mensal:** ${cd("temp_mensal")}
> * **vote:** ${cd("temp_vote")}`)

      .setFooter({
        text: `intervalos de ${user.username}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({ embeds: [embed] });
  }
};