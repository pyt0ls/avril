const fetch = require('node-fetch');
const config = require('../../config.js');

module.exports = {
  name: 'play',
  description: 'Reproduz uma música usando o sistema de API externo',
  aliases: [],
  async execute(message, args, client) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const query = args.join(' ');
    if (!query) return message.reply('❌ Digite o nome ou link da música.');

    const buscandoMsg = await message.reply(`🔎 Buscando **${query}**...`);

    try {
      const searchRes = await fetch(`http://vps-d58308d1.es.cloud.lucnodes.es:4403/get_song?name=${encodeURIComponent(query)}`);
      const song = await searchRes.json();

      if (!song || !song.url) throw new Error('Música não encontrada');

      const addRes = await fetch('http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.TOKEN,
          bot_id: client.user.id,
          user_id: userId,
          guild_id: guildId,
          url: song.url,
          name: song.title
        })
      });

      const addResult = await addRes.json();

      if (addResult.error === 'Límite de musicas atingido!') {
        return buscandoMsg.edit(`❌ **${addResult.error}**\n📛 ${addResult.message}`);
      }

      if (addResult.position === 1) {
        const playRes = await fetch('http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: config.TOKEN,
            bot_id: client.user.id,
            user_id: userId,
            guild_id: guildId
          })
        });

        const playResult = await playRes.json();

        if (playResult.error === 'Você precisa está em um canal de voz.') {
          await fetch('http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: config.TOKEN,
              bot_id: client.user.id,
              user_id: userId,
              guild_id: guildId
            })
          });

          return buscandoMsg.edit(`❌ ${playResult.error}`);
        }
      }

      const imageURL = `https://edgabot.lucnodes.es/api/image/music/?name=${encodeURIComponent(song.title)}&autor=${encodeURIComponent(song.channel)}&image=${song.thumbnail}&time=${song.duration}`;

      const embed = {
        title: '🎶 Música adicionada à fila',
        url: song.original_url,
        description: `* **Nome:** ${song.title}\n- **Autor:** ${song.channel}\n- **Duração:** ${song.duration}\n- **URL:** ${song.original_url}`,
        color: 0xffff00,
        footer: {
          text: 'Kn0w Music - System',
          icon_url: 'https://edgabot.lucnodes.es/crement.png'
        },
        thumbnail: { url: song.thumbnail },
        image: { url: imageURL },
        author: { name: song.channel }
      };

      await buscandoMsg.edit({ content: '', embeds: [embed] });

    } catch (error) {
      console.error('Erro ao buscar música:', error);
      buscandoMsg.edit('❌ Erro inesperado. Tente novamente mais tarde.\nVerifique se digitou corretamente o nome da música.');
    }
  }
};