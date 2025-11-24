const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Caminhos dos arquivos
const repPath = path.join(__dirname, "../../../database/reps.json");
const tempPath = path.join(__dirname, "../../../database/tempEconomia.json");

// Garante que os arquivos existem
if (!fs.existsSync(repPath)) fs.writeFileSync(repPath, "{}");
if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "{}");

function loadJson(path) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8") || "{}");
  } catch {
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Envia uma reputação para outro usuário")
    .addUserOption(option =>
      option.setName("usuario")
        .setDescription("Usuário que receberá a reputação")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("mensagem")
        .setDescription("Mensagem que acompanhará a reputação")
        .setRequired(false)
    ),

  async execute(interaction) {
    const sender = interaction.user;
    const target = interaction.options.getUser("usuario");
    const msg = interaction.options.getString("mensagem") || "pra você <3";

    if (target.id === sender.id) {
      return interaction.reply({
        content: `❌ | Você não pode enviar reputação para si mesmo!`,
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: `❌ | Você não pode enviar reputação para bots!`,
        ephemeral: true
      });
    }

    const cooldown = 3600; // 1 hora
    const now = Math.floor(Date.now() / 1000);
    const tempData = loadJson(tempPath);
    const lastRep = tempData[sender.id]?.temp_rep || 0;
    const nextRep = lastRep + cooldown;

    if (now < nextRep) {
      return interaction.reply({
        content: `⛔ | Você só poderá enviar uma nova reputação <t:${nextRep}:R>!`,
        ephemeral: true
      });
    }

    const repData = loadJson(repPath);
    repData[target.id] = {
      rep: (repData[target.id]?.rep || 0) + 1
    };

    if (!tempData[sender.id]) tempData[sender.id] = {};
    tempData[sender.id].temp_rep = now;

    // Salva tudo
    fs.writeFileSync(repPath, JSON.stringify(repData, null, 2));
    fs.writeFileSync(tempPath, JSON.stringify(tempData, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("<:4branco_estrela:1333712393133490187> **Envio de Reputação!**")
      .setDescription(
        `<:repxd:1383536743466270771> Reputação enviada.\n\n` +
        `<:d_white_arrow:1293702696825524244> De: <@${sender.id}>\n` +
        `<:d_white_arrow:1293702696825524244> Para: <@${target.id}>\n` +
        `<:d_white_arrow:1293702696825524244> Recado: ${msg}`
      )
      .setThumbnail("https://cdn.discordapp.com/attachments/1077714940745502750/1105210766157680750/reputacao.png")
      .setColor("#00ff99")
      .setFooter({
        text: `Solicitado por ${sender.username}`,
        iconURL: sender.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};