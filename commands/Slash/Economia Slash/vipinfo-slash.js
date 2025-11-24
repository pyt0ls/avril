const fs = require("fs");
const path = require("path");
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const config = require("../../../config");

const vipDataPath = path.join(__dirname, "../../../database/vipData.json");
const prefixPath = path.join(__dirname, "../../../database/prefixos.json");

// Garante que os arquivos existam
if (!fs.existsSync(vipDataPath)) {
  fs.writeFileSync(vipDataPath, JSON.stringify({}, null, 4));
}
if (!fs.existsSync(prefixPath)) {
  fs.writeFileSync(prefixPath, JSON.stringify({}, null, 4));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vipinfo")
    .setDescription("Mostra informações do VIP de um usuário.")
    .addUserOption(option =>
      option
        .setName("usuário")
        .setDescription("O usuário para consultar o VIP")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("usuário") || interaction.user;

    // Carrega banco de prefixos
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
      if (interaction.guild && prefixDB[interaction.guild.id]) {
        prefix = prefixDB[interaction.guild.id];
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

    const embed = new EmbedBuilder()
      .setTitle("✨ » Info VIP")
      .setDescription(`
👤 **Usuário:** ${user}
💎 **Status do VIP:** ${status}
⏰ **Tempo restante:** ${temVip ? `Expira ${tempoRestante}` : "Nenhum"}
      `.trim())
      .setColor(temVip ? 0x47ff00 : 0xff0000)
      .setThumbnail("https://cdn.discordapp.com/emojis/1343690175812997233.webp?size=240")
      .setFooter({ text: `Resgate coins usando ${prefix}recompensa` })
      .setTimestamp()
      .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) });

    await interaction.reply({ embeds: [embed] });
  },
};