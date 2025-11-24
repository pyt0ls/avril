const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'unbf',
  description: 'Termine sua melhor amizade atual',

  async execute(message) {
    const bfPath = path.join(__dirname, '../../database/bf.json');

    if (!fs.existsSync(bfPath)) fs.writeFileSync(bfPath, JSON.stringify({}));

    const bfData = JSON.parse(fs.readFileSync(bfPath, 'utf8'));
    bfData.amizades = bfData.amizades || {};

    const parceiro = bfData.amizades[message.author.id];

    if (!parceiro) {
      return message.reply('🫂 Você não tem um melhor amigo(a) atualmente!');
    }

    const embed = new EmbedBuilder()
      .setTitle('**Término de Amizade**')
      .setDescription(`> ❔ <@${message.author.id}>, você deseja **encerrar a amizade** com <@${parceiro}>?\n\n> ✅ Digite **"sim"** para confirmar.`)
      .setColor('#ffffff');

    await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'sim';
    const collector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', () => {
      delete bfData.amizades[message.author.id];
      delete bfData.amizades[parceiro];

      fs.writeFileSync(bfPath, JSON.stringify(bfData, null, 4));

      const confirmEmbed = new EmbedBuilder()
        .setTitle('🫂 Término Confirmado')
        .setDescription(`> 💔 <@${message.author.id}> **terminou a amizade** com <@${parceiro}>.`)
        .setColor('#ff0000');

      message.channel.send({ embeds: [confirmEmbed] });
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        message.channel.send(`⏰ <@${message.author.id}>, o tempo acabou e o término de amizade foi cancelado.`);
      }
    });
  }
};