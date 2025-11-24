const { EmbedBuilder } = require('discord.js');
const { OWNERS, prefix } = require('../../config.js');

module.exports = {
  name: 'kstts',
  description: 'Mostra o status do bot.',
  usage: `${prefix}kstts`,
  aliases: ['Kn0wStatus', 'kstatus'],

  async execute(message, args) {
    // Verificar se é dono
    if (!OWNERS.includes(message.author.id)) {
      return message.reply('🚫 Você não tem permissão para usar este comando. Somente o desenvolvedor pode.');
    }

    try {
      const bot = message.client;

      // Dados de uptime
      const uptime = bot.uptime;
      const agora = Math.floor(Date.now() / 1000);

      const segundos = Math.floor(uptime / 1000) % 60;
      const minutos = Math.floor(uptime / (1000 * 60)) % 60;
      const horas = Math.floor(uptime / (1000 * 60 * 60));

      const ativoTimestamp = agora - (horas * 3600 + minutos * 60 + segundos);

      // Dados gerais
      const servidores = bot.guilds.cache.size;
      const membros = bot.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
      const comandos = bot.commands.size;

      // Simulação de tempo de expiração de hosting (exemplo: daqui 7 dias)
      const hostingExpire = agora + (7 * 24 * 60 * 60); // 7 dias

      const embed = new EmbedBuilder()
        .setTitle('<a:loading:1412501259436429507> **Status do BOT!**')
        .setColor('#3399ff')
        .setThumbnail(bot.user.displayAvatarURL())
        .setAuthor({ name: 'Atividades alice', iconURL: bot.user.displayAvatarURL() })
        .setDescription(
          `
<:links:1329724255163781150> **Servidores:** ${servidores.toLocaleString('pt-BR')}
<:membropv:1412506556494516425> **Membros:** ${membros.toLocaleString('pt-BR')}
<:z_whiteregra:1330271051082371188> **Comandos:** ${comandos} total.
<:v_branco4:1382060159139844196> **Online:** <t:${ativoTimestamp}:R>
<:relogio:1343477670251462711> **Expira:** (<t:1893466800:R>)
          `.trim()
        )
        .setFooter({ text: `Developer ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      const msg = await message.reply({ embeds: [embed] });
      setTimeout(() => {
        msg.delete().catch(() => {});
      }, 15000); // 15 segundos

    } catch (error) {
      console.error(error);
      message.reply('❌ Ocorreu um erro ao executar o comando de status.');
    }
  },
};