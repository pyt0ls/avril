const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = './database/entradas.json';

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {};
    const config = data[member.guild.id];
    if (!config || !config.saidaLog) return;

    const canal = member.guild.channels.cache.get(config.saidaLog);
    if (!canal) return;

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setAuthor({ name: 'Saída do Servidor', iconURL: member.user.displayAvatarURL() })
      .setDescription(`📤 <@${member.user.id}> saiu do servidor.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `ID: ${member.user.id}` })
      .setTimestamp();

    canal.send({ embeds: [embed] }).catch(() => {});
  }
};