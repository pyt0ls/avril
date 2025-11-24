const fs = require("fs");
const path = require("path");
const config = require("../../config");

const vipDataPath = path.join(__dirname, "../../database/vipData.json");

// Garante que o arquivo exista
if (!fs.existsSync(vipDataPath)) {
  fs.writeFileSync(vipDataPath, JSON.stringify({}, null, 4));
}

module.exports = {
  name: "delvip",
  aliases: ["remvip", "removevip"],
  async execute(message, args) {
    // Só para donos
    if (!config.OWNERS.includes(message.author.id)) {
      return message.reply("🚫 Você não tem permissão para usar esse comando.");
    }

    // Pega usuário por menção ou ID
    const user = message.mentions.users.first() || (args[0] && message.client.users.cache.get(args[0]));

    if (!user) {
      return message.reply("❌ Mencione ou informe o ID do usuário para remover o VIP.");
    }

    const vipData = JSON.parse(fs.readFileSync(vipDataPath, "utf8"));

    if (!vipData[user.id] || vipData[user.id] === 0) {
      return message.reply(`❌ O usuário ${user} não possui VIP para ser removido.`);
    }

    // Remove VIP do usuário
    delete vipData[user.id];

    // Salva
    fs.writeFileSync(vipDataPath, JSON.stringify(vipData, null, 4));

    await message.channel.send({
      embeds: [{
        title: "❌ VIP Removido",
        description: `O VIP do usuário ${user} foi removido com sucesso!`,
        color: 0xff0000,
        footer: { text: `Executado por ${message.author.username}` },
        thumbnail: { url: user.displayAvatarURL({ dynamic: true }) }
      }]
    });
  }
};