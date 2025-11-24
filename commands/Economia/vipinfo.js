const fs = require("fs");
const path = require("path");
const config = require("../../config");

const vipDataPath = path.join(__dirname, "../../database/vipData.json");
const prefixPath = path.join(__dirname, "../../database/prefixos.json");

// Garante que os arquivos existam
if (!fs.existsSync(vipDataPath)) {
  fs.writeFileSync(vipDataPath, JSON.stringify({}, null, 4));
}
if (!fs.existsSync(prefixPath)) {
  fs.writeFileSync(prefixPath, JSON.stringify({}, null, 4));
}

module.exports = {
  name: "vipinfo",
  aliases: ["vip-info", "infovip"],
  async execute(message, args) {
    const user = message.mentions.users.first()
      || (args[0] && message.client.users.cache.get(args[0]))
      || message.author;

    // Carrega banco de prefixos
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
      if (message.guild && prefixDB[message.guild.id]) {
        prefix = prefixDB[message.guild.id];
      }
    }

    // Carrega dados de VIP
    const vipData = JSON.parse(fs.readFileSync(vipDataPath, "utf8"));
    const now = Math.floor(Date.now() / 1000);
    const vipTimestamp = vipData[user.id] || 0;
    const temVip = vipTimestamp > now;

    const status = temVip
      ? "🟢 **Possui VIP ativo!**"
      : "🔴 **Não possui VIP ativo!**\n➕ Seja um [membro VIP](https://discord.gg/NmWy87RjFe)";
    const tempoRestante = temVip ? `<t:${vipTimestamp}:R>` : "Nenhum";

    await message.channel.send({
      embeds: [{
        title: "✨ » Info VIP",
        description: `
👤 **Usuário:** ${user}
💎 **Status do VIP:** ${status}
⏰ **Tempo restante:** ${temVip ? `Expira ${tempoRestante}` : "Nenhum"}
        `.trim(),
        color: temVip ? 0x47ff00 : 0xff0000,
        thumbnail: {
          url: "https://cdn.discordapp.com/emojis/1343690175812997233.webp?size=240"
        },
        footer: {
          text: `Resgate coins usando ${prefix}recompensa`
        },
        timestamp: new Date(),
        author: {
          name: `${user.username}`,
          icon_url: user.displayAvatarURL({ dynamic: true })
        }
      }]
    });
  }
};