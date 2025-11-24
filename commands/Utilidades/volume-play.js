const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const config = require('../../config.js');

module.exports = {
  name: 'volume',
  description: 'Altera o volume da música atual (máximo 100)',
  aliases: ['vol'],
  async execute(message, args, client) {
    const guildId = message.guild.id;

    // Buscar prefixo do JSON
    const prefixesPath = path.resolve(__dirname, '../../database/prefixos.json');
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (prefixDB[guildId]) {
        prefix = prefixDB[guildId];
      }
    }

    const volume = args[0];

    if (!volume)
      return message.reply(`❌ Por favor informe um valor de volume. Exemplo: \`${prefix}volume 50\``);
    
    if (isNaN(volume))
      return message.reply('❌ Informe um número válido para o volume.');

    try {
      await fetch(`http://vps-d58308d1.es.cloud.lucnodes.es:4402/API/volumen?bot_id=${client.user.id}&guild_id=${guildId}&volumen=${volume}`);

      const embed = {
        title: '🔊 Volume ajustado 🎧',
        description: `Volume da música ajustado para \`${volume}%\``,
        color: 0x00ff00
      };

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao ajustar o volume:', error);
      message.reply('❌ Erro ao tentar ajustar o volume. Tente novamente.');
    }
  }
};