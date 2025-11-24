const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const bfPath = path.join(__dirname, '../../../database/bf.json');

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unbf')
    .setDescription('Termine sua melhor amizade atual'),

  async execute(interaction) {
    const user = interaction.user;
    const bfData = loadJson(bfPath);
    bfData.amizades = bfData.amizades || {};

    const parceiro = bfData.amizades[user.id];

    if (!parceiro) {
      return interaction.reply({
        content: '🫂 Você não tem um melhor amigo(a) atualmente!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('**Término de Amizade**')
      .setDescription(`> ❔ <@${user.id}>, você deseja **encerrar a amizade** com <@${parceiro}>?\n\n> ✅ Digite **"sim"** para confirmar.`)
      .setColor('#ffffff');

    await interaction.reply({ embeds: [embed], fetchReply: true });

    const channel = await interaction.channel;
    const filter = m => m.author.id === user.id && m.content.toLowerCase() === 'sim';

    const collector = channel.createMessageCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', () => {
      delete bfData.amizades[user.id];
      delete bfData.amizades[parceiro];
      saveJson(bfPath, bfData);

      const confirmEmbed = new EmbedBuilder()
        .setTitle('🫂 Término Confirmado')
        .setDescription(`> 💔 <@${user.id}> **terminou a amizade** com <@${parceiro}>.`)
        .setColor('#ff0000');

      channel.send({ embeds: [confirmEmbed] });
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        channel.send(`⏰ <@${user.id}>, o tempo acabou e o término de amizade foi cancelado.`);
      }
    });
  }
};