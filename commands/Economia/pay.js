const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const dbPath = path.join(__dirname, '../../database/coins.json');

function loadCoins() {
  if (!fs.existsSync(dbPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveCoins(coins) {
  fs.writeFileSync(dbPath, JSON.stringify(coins, null, 2));
}

function formatAmount(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'b';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'm';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'k';
  return value.toString();
}

module.exports = {
  name: 'pay',
  aliases: ['transfer', 'pag'],
  description: 'Faça transferência de coins para outro usuário.',
  async execute(message, args) {
    const coins = loadCoins();

    const authorId = message.author.id;
    const target = message.mentions.users.first();

    if (!target) return message.reply(`<@${authorId}>, mencione alguém para fazer a transferência!`);
    if (target.id === authorId) return message.reply(`❌ | <@${authorId}>, você não pode transferir para você mesmo.`);
    if (target.bot) return message.reply(`❌ | <@${authorId}>, o usuário não pode ser um robô!`);
    if (!args[1]) return message.reply(`❌ | <@${authorId}>, insira a quantia que irá transferir!`);

    let amountRaw = args[1].toLowerCase();

    const multiplier = {
      k: 1e3,
      m: 1e6,
      b: 1e9,
    };

    const match = amountRaw.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
    if (!match) return message.reply(`❌ | <@${authorId}>, o valor da transferência deve conter apenas números ou sufixos k, m, b!`);

    let amount = parseFloat(match[1]);
    if (match[2]) amount *= multiplier[match[2]];

    amount = Math.floor(amount);

    if (isNaN(amount) || amount <= 0) return message.reply(`❌ | <@${authorId}>, você só pode realizar transferências com números positivos!`);

    if (!coins[authorId] || (coins[authorId].banco || 0) < amount)
      return message.reply(`❌ | <@${authorId}>, você não tem esta quantia!`);

    // Embed para pedir confirmação com botões
    const embed = new EmbedBuilder()
      .setTitle('<:70s_whitcash:1304070691892625448> • Pagamento sendo efetuado!')
      .setDescription(`<@${authorId}>, deseja fazer uma transferência no valor de **${formatAmount(amount)}** coins para <@${target.id}>? Confirme no botão abaixo.\n\n⚠️ Os botões irão parar de funcionar <t:${Math.floor(Date.now() / 1000) + 300}:R>.`)
      .setColor('#8C52FF')
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

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

    await message.channel.send({ embeds: [embed], components: [row] });

    // NÃO cria collector aqui: interação será tratada no interactionCreate.js
  }
};