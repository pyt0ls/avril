const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionType,
  ComponentType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const { loadCoins, saveCoins } = require("../../../utils/coinsUtils");
const {
  loadTempData,
  isCooldownOver,
  getCooldownRemaining,
  setCooldown,
} = require("../../../utils/cooldownUtils");
const cooldowns = require("../../../utils/cooldownsConfig");
const config = require("../../../config");

// Caminhos
const armasPath = path.join(__dirname, "../../../database/armasData.json");
const prefixesPath = path.join(__dirname, "../../../database/prefixos.json");

// Garante arquivo armas
if (!fs.existsSync(armasPath))
  fs.writeFileSync(armasPath, JSON.stringify({}, null, 4));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roubar")
    .setDescription("Roube coins de outro usuário")
    .addUserOption((option) =>
      option
        .setName("alvo")
        .setDescription("Usuário para roubar")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const user = interaction.user;
    const userId = user.id;
    const target = interaction.options.getUser("alvo");

    if (target.id === userId) {
      return interaction.reply({
        content: "❌ Você não pode roubar de si mesmo.",
        ephemeral: true,
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: "❌ Você não pode roubar bots.",
        ephemeral: true,
      });
    }

    // Prefixo (não muito usado em slash, mas deixei se precisar)
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (interaction.guild && prefixDB[interaction.guild.id])
        prefix = prefixDB[interaction.guild.id];
    }

    // Carregar dados
    const coins = loadCoins();
    const armasData = JSON.parse(fs.readFileSync(armasPath, "utf8"));

    if (!coins[target.id] || coins[target.id].carteira < 100) {
      return interaction.reply({
        content:
          "❌ O usuário não tem dinheiro suficiente na carteira para ser roubado (mínimo 100 coins).",
        ephemeral: true,
      });
    }

    if (!armasData[userId] || armasData[userId].length === 0) {
      return interaction.reply({
        content: `❌ Você não possui uma arma para roubar.\n🛍️ Compre uma usando \`${prefix}shop\`.`,
        ephemeral: true,
      });
    }

    // Cooldown
    const cooldownTime = cooldowns.temp_roubar;

    if (!isCooldownOver(userId, "temp_roubar", cooldownTime)) {
      const remaining = getCooldownRemaining(userId, "temp_roubar", cooldownTime);
      const availableAt = Math.floor(Date.now() / 1000) + remaining;

      const embedCooldown = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("🚓 Você já cometeu um roubo!")
        .setDescription(`Tente novamente <t:${availableAt}:R>.`)
        .setFooter({ text: user.username })
        .setTimestamp();

      return interaction.reply({ embeds: [embedCooldown], ephemeral: true });
    }

    // Criar botão para confirmação
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`roubar-confirm-${target.id}-${userId}`)
        .setLabel("Roubar")
        .setStyle(ButtonStyle.Danger)
    );

    const embedConfirm = new EmbedBuilder()
      .setTitle("🔫 **Confirmação de Roubo**")
      .setDescription(
        `⚠️ Você está prestes a roubar ${target}. Isso pode gerar consequências!\n\nDeseja continuar?`
      )
      .setColor("#ffffff")
      .setFooter({
        text: `Executado por ${user.username}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    // Envia resposta com botão e espera interação do botão
    await interaction.reply({ embeds: [embedConfirm], components: [row], ephemeral: true });

    // Cria collector para aguardar interação no botão só para o autor do comando
    const filter = (i) =>
      i.customId === `roubar-confirm-${target.id}-${userId}` && i.user.id === userId;

    try {
      const buttonInteraction = await interaction.channel.awaitMessageComponent({
        filter,
        componentType: ComponentType.Button,
        time: 15000,
      });

      // Ao confirmar o roubo

      // Lê os dados atuais de novo (por segurança)
      const coinsNew = loadCoins();

      const maxRoubo = Math.min(coinsNew[target.id].carteira, 5000);
      // Valor roubado aleatório entre 1 e maxRoubo
      const roubado = Math.floor(Math.random() * maxRoubo) + 1;

      // Atualiza saldos
      coinsNew[target.id].carteira -= roubado;
      if (!coinsNew[userId]) coinsNew[userId] = { carteira: 0, banco: 0 };
      coinsNew[userId].carteira += roubado;

      saveCoins(coinsNew);

      // Seta cooldown
      setCooldown(userId, "temp_roubar");

      // Resposta do roubo
      const embedSuccess = new EmbedBuilder()
        .setTitle("💰 Roubo concluído!")
        .setDescription(
          `${user} você roubou **${roubado.toLocaleString()} coins** de ${target}!`
        )
        .setColor("#00ff00")
        .setTimestamp();

      await buttonInteraction.update({ embeds: [embedSuccess], components: [] });
    } catch (err) {
      // Timeout ou erro
      if (err.code === "INTERACTION_COLLECTOR_ERROR" || err.code === 50013) {
        await interaction.editReply({
          content: "⏳ Tempo esgotado para confirmar o roubo.",
          embeds: [],
          components: [],
        });
      } else {
        await interaction.editReply({
          content: "❌ Ocorreu um erro ao processar sua solicitação.",
          embeds: [],
          components: [],
        });
      }
    }
  },
};