const fs = require("fs");
const path = require("path");
const warnsDB = path.join(__dirname, "../../database/warn.json");

module.exports = {
  name: "resetwarn",
  description: "Remove todos os avisos de um usuário.",
  execute(message, args) {
    if (!message.member.permissions.has("ManageMessages"))
      return message.reply("❌ Você não tem permissão para usar esse comando.");

    const user = message.mentions.users.first();
    if (!user) return message.reply("❌ Mencione um usuário para limpar os avisos.");

    if (!fs.existsSync(warnsDB)) return message.reply("⚠️ Nenhum aviso registrado.");

    const db = JSON.parse(fs.readFileSync(warnsDB, "utf8"));

    if (!db[user.id] || db[user.id].length === 0)
      return message.reply("✅ Esse usuário já não possui nenhum aviso.");

    delete db[user.id];
    fs.writeFileSync(warnsDB, JSON.stringify(db, null, 2));

    message.reply(`✅ Todos os avisos de ${user.tag} foram removidos.`);
  },
};