const fs = require("fs");
const path = require("path");
const warnsDB = path.join(__dirname, "../../database/warn.json");

module.exports = {
  name: "warns",
  description: "Exibe os avisos de um usuário.",
  execute(message, args) {
    const user = message.mentions.users.first();
    if (!user) return message.reply("❌ Mencione um usuário para ver os avisos.");

    if (!fs.existsSync(warnsDB)) return message.reply("⚠️ Nenhum aviso registrado ainda.");

    const db = JSON.parse(fs.readFileSync(warnsDB, "utf8"));
    const userWarns = db[user.id];

    if (!userWarns || userWarns.length === 0)
      return message.reply("✅ Esse usuário não possui nenhum aviso.");

    let list = userWarns
      .map((w, i) => `\`${i + 1}.\` **${w.reason}** - <t:${Math.floor(new Date(w.date).getTime() / 1000)}:F>`)
      .join("\n");

    message.channel.send({
      embeds: [{
        title: `⚠️ Avisos de ${user.tag}`,
        description: list,
        color: 0xffaa00
      }]
    });
  },
};