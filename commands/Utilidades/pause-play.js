const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const config = require('../../config.js');

module.exports = {
  name: 'pause',
  description: 'Pausa a música atual',
  async execute(message, args, client) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    const prefixesPath = path.resolve(__dirname, '../../database/prefixos.json');
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (prefixDB[guildId]) prefix = prefixDB[guildId];
    }

    const msg = await message.reply('⏸️ Pausando música...');

    try {
      const queueRes = await fetch(`http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/queue?bot_id=${client.user.id}&guild_id=${guildId}`);
      const queueData = await queueRes.json();

      const musicName = queueData?.currentTrack?.name || 'Desconhecida';

      await fetch(`http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.TOKEN,
          bot_id: client.user.id,
          user_id: userId,
          guild_id: guildId
        })
      });

      const embed = {
        title: '🎵 Música pausada.',
        description: `**Música atual:** ${musicName}`,
        footer: { text: 'Kn0w Music - System' },
        timestamp: new Date(),
        color: 0xffcc00
      };

      await msg.edit({ content: '', embeds: [embed], components: [] });

    } catch (error) {
      console.error('Erro ao pausar música:', error);
      msg.edit('❌ Ocorreu um erro ao tentar pausar a música.');
    }
  }
};