const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const { formatAmount } = require("../../utils/coinsUtils");

module.exports = {
  name: "semanal",
  aliases: ["weekly"],
  description: "Receba sua recompensa semanal de coins!",
  async execute(message, args) {
    if (!message.guild)
      return message.reply(
        "Desculpa meu consagrado, meu sistema é apenas para servidores, execute o comando em algum servidor!"
      );

    const userId = message.author.id;
    const guildId = message.guild.id;

    // Pega prefixo padrão do servidor
    const prefixPath = path.join(__dirname, "../../database/prefixos.json");
    let prefix = ";";
    if (fs.existsSync(prefixPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixPath, "utf8"));
      if (prefixDB[guildId]) prefix = prefixDB[guildId];
    }

    // Pega arquivo de cooldown semanal
    const cooldownPath = path.join(
      __dirname,
      "../../database/tempEconomia.json"
    );
    if (!fs.existsSync(cooldownPath)) fs.writeFileSync(cooldownPath, "{}");
    let cooldownData = {};
    try {
      cooldownData = JSON.parse(fs.readFileSync(cooldownPath, "utf8"));
    } catch {
      cooldownData = {};
    }

    const now = Math.floor(Date.now() / 1000);
    const cooldownTime = 7 * 24 * 60 * 60; // 7 dias em segundos
    const lastClaim = cooldownData[userId]?.temp_semanal || 0;

    if (now < lastClaim + cooldownTime) {
      const availableAt = lastClaim + cooldownTime;
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle(`Olá, ${message.author.username}!`)
            .setDescription(
              `Você já resgatou sua recompensa semanal.\nVolte <t:${availableAt}:R> para receber.`
            )
            .setAuthor({
              name: "Oops!",
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setFooter({ text: message.author.username })
            .setTimestamp(),
        ],
      });
    }

    // Lista random jobs
    const jobs = [
      "Comerciante",
      "Policial",
      "Oceanógrafo",
      "Orcamentista",
      "Administrador",
      "Açougueiro",
      "Advogado",
      "Pintor",
      "Bombeiro",
      "Médico",
      "Engenheiro",
      "Professor",
      "Enfermeiro",
      "Veterinário",
      "Jornalista",
      "Reporter",
      "Treinador",
      "Psicólogo",
      "Agricultor",
      "Diretor",
      "Padeiro",
      "Prefeito",
      "Vereador",
      "Auxiliar",
      "Atendente na lanchonete",
    ];

    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
    const reward = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;

    // Atualiza arquivo de cooldown e coins
    cooldownData[userId] = cooldownData[userId] || {};
    cooldownData[userId].temp_semanal = now;

    fs.writeFileSync(cooldownPath, JSON.stringify(cooldownData, null, 2));

    // Atualiza carteira coins
    const carteiraPath = path.join(__dirname, "../../database/carteira.json");
    let carteiraData = {};
    if (fs.existsSync(carteiraPath)) {
      try {
        carteiraData = JSON.parse(fs.readFileSync(carteiraPath, "utf8"));
      } catch {
        carteiraData = {};
      }
    }
    carteiraData[userId] = (carteiraData[userId] || 0) + reward;
    fs.writeFileSync(carteiraPath, JSON.stringify(carteiraData, null, 2));

    // Envia embed resposta
    const embed = new EmbedBuilder()
      .setTitle("「<:70s_whitcash:1304070691892625448>」Recompensa Semanal")
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(
        `<@${userId}> Você trabalhou como **${randomJob}** por 7 dias e ganhou **${formatAmount(
          reward
        )} coins**! Parabéns!\nUtilize \`${prefix}coins\` para ver o seu saldo!`
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1109147495377944637/1109148372549509170/8WS3Yxj.png"
      )
      .setFooter({ text: `Comando utilizado por ${message.author.username}` })
      .setColor("#47ff00")
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};