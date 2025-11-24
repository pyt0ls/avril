const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const config = require('../../config.js');

module.exports = {
  name: 'skip',
  description: 'Pula para a próxima música da fila',
  async execute(message, args, client) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    const prefixesPath = path.resolve(__dirname, '../../database/prefixos.json');
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (prefixDB[guildId]) prefix = prefixDB[guildId];
    }

    const msg = await message.reply('⏭️ Pulando música...');

    try {
      const res = await fetch('http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/sig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.TOKEN,
          bot_id: client.user.id,
          user_id: userId,
          guild_id: guildId
        })
      });

      const data = await res.json();

      if (data.error === 'Limite de saltos atingido') {
        return msg.edit(`❌ **${data.message}**`);
      }

      const embed = {
        title: '⏭️ Tocando a próxima música',
        description: `**${data?.currentTrack?.name || 'Música desconhecida'}**`,
        footer: { text: 'Kn0w Music - System' },
        timestamp: new Date(),
        color: 0x3366ff
      };

      await msg.edit({ content: '', embeds: [embed], components: [] });

    } catch (error) {
      console.error('Erro ao pular música:', error);
      msg.edit('❌ Ocorreu um erro ao tentar pular a música.');
    }
  }
};