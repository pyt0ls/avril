const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../config');
const { loadCoins, saveCoins } = require('../../utils/coinsUtils');
const COINS_PATH = path.join(__dirname, '../../database/coins.json');

// Função que converte valores como "1k", "2.5m", "1b"
function parseAmount(input) {
  const match = input.toLowerCase().match(/^(\d+(\.\d+)?)([kmb])?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const suffix = match[3];

  switch (suffix) {
    case 'k': return Math.floor(num * 1_000);
    case 'm': return Math.floor(num * 1_000_000);
    case 'b': return Math.floor(num * 1_000_000_000);
    default: return Math.floor(num);
  }
}

module.exports = {
  name: 'drop',
  description: 'Dropar coins em um canal (apenas donos). Suporta valores como 1k, 2m, 1.5b.',
  usage: '<quantidade>',
  async execute(message, args) {
    if (!OWNERS.includes(message.author.id)) {
      return message.reply('❌ Apenas desenvolvedores podem usar este comando.');
    }

    if (!args[0]) return message.reply('❌ Informe uma quantidade de coins para o drop.');

    const amount = parseAmount(args[0]);
    if (!amount || amount <= 0) {
      return message.reply('❌ Valor inválido. Use números como `1000`, `1k`, `2.5m`, `1b`, etc.');
    }

    const embed = new EmbedBuilder()
      .setColor('#11e1db')
      .setTitle('🎉 Drop de Coins!')
      .setDescription(`O primeiro a clicar no botão abaixo receberá **${amount.toLocaleString()} de coins**!`)
      .setFooter({ text: 'Seja rápido para pegar!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('drop_pegar')
        .setLabel('Pegar!')
        .setStyle(ButtonStyle.Success)
    );

    const dropMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const filter = i => i.customId === 'drop_pegar';
    const collector = dropMessage.createMessageComponentCollector({ filter, time: 15000, max: 1 });

    collector.on('collect', async interaction => {
      const userId = interaction.user.id;
      const coins = loadCoins();

      if (!coins[userId]) coins[userId] = { carteira: 0, banco: 0 };
      coins[userId].carteira += amount;
      saveCoins(coins);

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff99')
            .setTitle('🎉 Drop Coletado!')
            .setDescription(`Parabéns <@${userId}>! Você pegou **${amount.toLocaleString()} de coins**.`)
            .setFooter({ text: 'Drop finalizado' })
            .setTimestamp()
        ],
        components: []
      });
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await dropMessage.edit({
          embeds: [
            embed.setColor('#ff0000').setDescription(`Ninguém pegou o drop de **${amount.toLocaleString()} coins**.`)
          ],
          components: []
        });
      }
    });
  }
};