const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const cooldowns = require("../../utils/cooldownsConfig");

module.exports = {
  name: "tempo",
  aliases: ["cooldown", "cd"],
  execute(message) {
    const userId = message.author.id;
    const tempPath = path.join(__dirname, "../../database/tempEconomia.json");

    if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "{}");

    let rawData = fs.readFileSync(tempPath, "utf8") || "{}";
    let tempData = {};
    try {
      tempData = JSON.parse(rawData);
    } catch {
      tempData = {};
    }

    const now = Math.floor(Date.now() / 1000);

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
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTitle(`**Usuário:** ${message.author.username}`)
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
        text: `intervalos de ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });

    message.channel.send({ embeds: [embed] });
  },
};