const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatAmount } = require("../../../utils/coinsUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Resgate sua recompensa diária de coins."),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: "Execute este comando em um servidor, por favor.",
        ephemeral: true,
      });
    }

    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // Pega prefixo do servidor
    const prefixPath = path.join(__dirname, "../../database/prefixos.json");
    let prefix = ";";
    if (fs.existsSync(prefixPath)) {
      try {
        const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
        if (prefixDB[guildId]) prefix = prefixDB[guildId];
      } catch {
        // erro ignorado, mantém prefix padrão
      }
    }

    // Caminhos dos arquivos
    const coinsPath = path.join(__dirname, "../../../database/coins.json");
    const tempPath = path.join(__dirname, "../../../database/tempEconomia.json");

    // Garante que os arquivos existam
    if (!fs.existsSync(coinsPath)) fs.writeFileSync(coinsPath, "{}");
    if (!fs.existsSync(tempPath)) fs.writeFileSync(tempPath, "{}");

    let coinsData = {};
    let tempData = {};

    try {
      coinsData = JSON.parse(fs.readFileSync(coinsPath, "utf8") || "{}");
      tempData = JSON.parse(fs.readFileSync(tempPath, "utf8") || "{}");
    } catch {
      coinsData = {};
      tempData = {};
    }

    if (!coinsData[userId]) coinsData[userId] = { carteira: 0, banco: 0 };
    if (!tempData[userId]) tempData[userId] = {};

    const now = Math.floor(Date.now() / 1000);
    const cooldown = 86400; // 24h em segundos

    const lastDaily = tempData[userId].temp_daily || 0;
    const nextDaily = lastDaily + cooldown;

    if (now < nextDaily) {
      const timeLeft = `<t:${nextDaily}:R>`;
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`Olá, ${interaction.user.username}!`)
        .setDescription(`Você já resgatou sua recompensa diária.\nVolte ${timeLeft}.`)
        .setAuthor({
          name: "Cooldown ativo",
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({
          text: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Recompensa entre 50k e 100k coins
    const reward = Math.floor(Math.random() * (100000 - 50000 + 1)) + 50000;

    coinsData[userId].carteira += reward;
    tempData[userId].temp_daily = now;

    // Salva os arquivos
    fs.writeFileSync(coinsPath, JSON.stringify(coinsData, null, 2));
    fs.writeFileSync(tempPath, JSON.stringify(tempData, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("「<:70s_whitcash:1304070691892625448>」Recompensa Diária")
      .setDescription(
        `<@${userId}> Você recebeu **${formatAmount(reward)}** coins!\n` +
          `Use \`${prefix}coins\` para ver seu saldo.`
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1109147495377944637/1109148220694745138/s337k4z.png"
      )
      .setColor("#ffffff")
      .setFooter({
        text: `Comando utilizado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};