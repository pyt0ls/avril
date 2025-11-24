const fs = require("fs");
const path = require("path");
const warnDB = path.join(__dirname, "../../database/warn.json");

module.exports = {
  name: "warn",
  description: "Adiciona um aviso a um membro.",
  async execute(message, args) {
    if (!message.member.permissions.has("MANAGE_MESSAGES")) {
      return message.reply("❌ Você não tem permissão para usar este comando.");
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply("❌ Mencione um usuário para aplicar o warn.");

    const reason = args.slice(1).join(" ") || "Sem motivo informado";
    const date = new Date().toLocaleDateString("pt-BR");

    let db = {};
    if (fs.existsSync(warnDB)) {
      db = JSON.parse(fs.readFileSync(warnDB, "utf-8"));
    }

    if (!db[user.id]) db[user.id] = [];

    db[user.id].push({ reason, date });

    fs.writeFileSync(warnDB, JSON.stringify(db, null, 2));

    message.channel.send(`⚠️ ${user.tag} foi avisado. Motivo: **${reason}**`);

    // ⚠️ Verificação para banimento automático
    if (db[user.id].length >= 5) {
      const member = message.guild.members.cache.get(user.id);
      if (member) {
        member.ban({ reason: "Acumulou 5 avisos." })
          .then(() => {
            message.channel.send(`🚫 ${user.tag} foi banido por acumular 5 avisos.`);
          })
          .catch(err => {
            console.error(err);
            message.channel.send("❌ Não consegui banir o usuário. Verifique minhas permissões.");
          });
      }
    }
  }
};