const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config");
const { loadCoins, saveCoins, formatAmount } = require("../../utils/coinsUtils");
const { loadTempData, isCooldownOver, getCooldownRemaining, setCooldown } = require("../../utils/cooldownUtils");
const cooldowns = require("../../utils/cooldownsConfig");

module.exports = {
    name: "work",
    aliases: ["trabalhar"],

    async execute(message) {
        // Puxar prefixo
        let prefix = config.PREFIX;
        const prefixesPath = path.join(__dirname, "../../database/prefixos.json");
        if (fs.existsSync(prefixesPath)) {
            const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
            if (message.guild && prefixDB[message.guild.id]) {
                prefix = prefixDB[message.guild.id];
            }
        }

        const userId = message.author.id;

        // Carregar databases
        const jobDataPath = path.join(__dirname, "../../database/jobData.json");
        if (!fs.existsSync(jobDataPath)) fs.writeFileSync(jobDataPath, "{}");
        const jobData = JSON.parse(fs.readFileSync(jobDataPath, "utf8"));

        const userJob = jobData[userId]?.jobId || 0;

        if (userJob === 0) {
            return message.reply({
                content: `❌ | Você não tem um emprego! Use \`${prefix}prefeitura\` para escolher um.`,
            });
        }

        // Definir empregos e recompensas
        const jobs = {
            1: { nome: "Policial", recompensa: 500 },
            2: { nome: "Operário", recompensa: 1000 },
            3: { nome: "Mecânico", recompensa: 2000 },
            4: { nome: "Detetive", recompensa: 3000 },
            5: { nome: "Fazendeiro", recompensa: 4000 },
            6: { nome: "Bombeiro", recompensa: 5000 },
            7: { nome: "Juíz", recompensa: 6000 },
        };

        const job = jobs[userJob];

        if (!job) {
            return message.reply(`❌ | Emprego inválido. Use \`${prefix}prefeitura\` para escolher novamente.`);
        }

        // Cooldown usando sistema utilitário
        const cooldownTime = cooldowns.temp_work; // definido em cooldownsConfig.js

        if (!isCooldownOver(userId, "temp_work", cooldownTime)) {
            const remaining = getCooldownRemaining(userId, "temp_work", cooldownTime);
            const availableAt = Math.floor(Date.now() / 1000) + remaining;

            const embedCooldown = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("🕐 • Tempo de Trabalho")
                .setDescription(`Você já trabalhou recentemente! Volte <t:${availableAt}:R>.`)
                .setFooter({ text: message.author.username })
                .setTimestamp();

            return message.reply({ embeds: [embedCooldown] });
        }

        // Pagar
        const coins = loadCoins();
        if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };

        coins[userId].carteira += job.recompensa;

        saveCoins(coins);
        setCooldown(userId, "temp_work");

        const embed = new EmbedBuilder()
            .setColor("#00ffc3")
            .setTitle("💼 • Trabalho")
            .setDescription(`👷 | <@${userId}> trabalhou como **${job.nome}** e ganhou **${formatAmount(job.recompensa)} moedas!**`)
            .setThumbnail("https://cdn.discordapp.com/emojis/1164962674661138522.png?size=2048")
            .setFooter({ text: message.author.username })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};