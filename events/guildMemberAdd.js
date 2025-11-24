const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = './database/entradas.json';

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {};
    const config = data[member.guild.id];
    if (!config) return;

    // Log de entrada
    if (config.entradaLog) {
      const canalLog = member.guild.channels.cache.get(config.entradaLog);
      if (canalLog) {
        const embed = new EmbedBuilder()
          .setColor('Green')
          .setAuthor({ name: 'Nova Entrada', iconURL: member.user.displayAvatarURL() })
          .setDescription(`📥 <@${member.user.id}> entrou no servidor!`)
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: `ID: ${member.user.id}` })
          .setTimestamp();
        canalLog.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Mensagem pública de boas-vindas
    if (config.canalBemVindo && config.mensagemBemVindo) {
      const canalBemVindo = member.guild.channels.cache.get(config.canalBemVindo);
      if (canalBemVindo) {
        const msg = config.mensagemBemVindo
          .replace(/{usuario}/g, `<@${member.id}>`)
          .replace(/{servidor}/g, `${member.guild.name}`);
        canalBemVindo.send({ content: msg }).catch(() => {});
      }
    }
  }
};