const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const dbPath = path.join(__dirname, '../../../database/coins.json');

function loadCoins() {
  if (!fs.existsSync(dbPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return {};
  }
}

function formatAmount(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'b';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'm';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'k';
  return value.toString();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Faça transferência de coins para outro usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para quem enviar coins')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('quantia')
        .setDescription('Quantia de coins para transferir (ex: 100, 1k, 2.5m)')
        .setRequired(true)),

  async execute(interaction) {
    const coins = loadCoins();

    const authorId = interaction.user.id;
    const target = interaction.options.getUser('usuario');
    const amountRaw = interaction.options.getString('quantia').toLowerCase();

    if (target.id === authorId) {
      return interaction.reply({ content: '❌ Você não pode transferir para você mesmo.', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: '❌ Você não pode transferir para um bot.', ephemeral: true });
    }

    const multiplier = {
      k: 1e3,
      m: 1e6,
      b: 1e9,
    };

    const match = amountRaw.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
    if (!match) {
      return interaction.reply({ content: '❌ O valor da transferência deve conter apenas números ou sufixos k, m, b!', ephemeral: true });
    }

    let amount = parseFloat(match[1]);
    if (match[2]) amount *= multiplier[match[2]];
    amount = Math.floor(amount);

    if (isNaN(amount) || amount <= 0) {
      return interaction.reply({ content: '❌ Você só pode realizar transferências com números positivos!', ephemeral: true });
    }

    if (!coins[authorId] || (coins[authorId].banco || 0) < amount) {
      return interaction.reply({ content: '❌ Você não tem esta quantia!', ephemeral: true });
    }

    // Embed para pedir confirmação com botões
    const embed = new EmbedBuilder()
      .setTitle('<:70s_whitcash:1304070691892625448> • Pagamento sendo efetuado!')
      .setDescription(
        `<@${authorId}>, deseja fazer uma transferência no valor de **${formatAmount(amount)}** coins para <@${target.id}>? Confirme no botão abaixo.\n\n⚠️ Os botões irão parar de funcionar <t:${Math.floor(Date.now() / 1000) + 300}:R>.`
      )
      .setColor('#8C52FF')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`pay_accept_${authorId}_${target.id}_${amount}`)
          .setLabel('Confirmar')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`pay_decline_${authorId}_${target.id}_${amount}`)
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [embed], components: [row] });

    // A interação dos botões deve ser tratada no event handler interactionCreate.js
  }
};