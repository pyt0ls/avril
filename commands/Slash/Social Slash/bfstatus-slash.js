const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bfstatus')
    .setDescription('Mostra o status de melhor amizade de alguém')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que você quer ver o status')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const userId = target.id;

    const bfPath = path.join(__dirname, '../../../database/bf.json');
    if (!fs.existsSync(bfPath)) {
      fs.writeFileSync(bfPath, JSON.stringify({ amizades: {}, tempos: {} }, null, 4));
    }

    const bfData = JSON.parse(fs.readFileSync(bfPath, 'utf8'));
    bfData.amizades = bfData.amizades || {};
    bfData.tempos = bfData.tempos || {};

    const bestFriendId = bfData.amizades[userId];

    const embed = new EmbedBuilder()
      .setColor('#fa8072')
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }));

    if (!bestFriendId) {
      embed
        .setTitle(`🎭 Melhor amigo(a) de ${target.username}`)
        .setDescription(`>>> **${target.username} não possui um melhor amigo(a)...**`);
    } else {
      const tempo = bfData.tempos[userId] || null;
      const bestFriendName = interaction.client.users.cache.get(bestFriendId)?.username || 'Desconhecido';

      embed
        .setTitle(`🎭 Melhor amigo(a) de ${target.username}`)
        .setDescription(
          `>>> <:rusername:1344923876852764682> **Usuário:**\n` +
          `<:d_white_arrow:1293702696825524244> <@${userId}> ${target.username}\n\n` +

          `<:wclown:1327891071610654772> **Melhor amigo(a):**\n` +
          `<:d_white_arrow:1293702696825524244> <@${bestFriendId}> ${bestFriendName}\n\n` +

          `<:relogio:1343477670251462711> **Tempo de amizade:**\n` +
          (tempo
            ? `<:v_branco4:1382060159139844196> <t:${Math.floor(tempo / 1000)}:R> (<t:${Math.floor(tempo / 1000)}:d>)`
            : '*Tempo desconhecido*')  
        );
    }

    await interaction.reply({ embeds: [embed] });
  }
};