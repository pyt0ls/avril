const fetch = require('node-fetch');
const config = require('../../config.js');

module.exports = {
  name: 'stop',
  description: 'Para a música e remove o bot do canal de voz',
  aliases: [],
  async execute(message, args, client) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const msg = await message.reply('⏹️ Parando música...');

    try {
      const res = await fetch('http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/stop', {
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
        description: '🛑 Música parada e o bot foi desconectado!\n-# A lista de reprodução foi resetada.',
        color: 0xff0000
      };

      await msg.edit({ content: '', embeds: [embed], components: [] });

    } catch (error) {
      console.error('Erro ao parar música:', error);
      msg.edit('❌ Erro ao tentar parar a música. Tente novamente.');
    }
  }
};