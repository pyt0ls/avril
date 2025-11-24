const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../../config.js');

module.exports = {
  global: false, // <<< só adicionar isso para registrar só na guild

  data: new SlashCommandBuilder()
    .setName('kn0w-status')
    .setDescription('Mostra o status do bot (Apenas para o desenvolvedor).'),

  async execute(interaction) {
    // Verificar se é dono
    if (!OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: '🚫 Este comando é exclusivo para o desenvolvedor.', ephemeral: true });
    }

    try {
      const bot = interaction.client;

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

      // Data fixa de expiração (exemplo real pode ser alterado)
      const hostingExpire = 1893466800; // Timestamp fixo que você colocou

      const embed = new EmbedBuilder()
        .setTitle('<a:loading:1412501259436429507> **Status do BOT!**')
        .setColor('#3399ff')
        .setThumbnail(bot.user.displayAvatarURL())
        .setAuthor({ name: 'Atividades avril', iconURL: bot.user.displayAvatarURL() })
        .setDescription(
          `
<:links:1329724255163781150> **Servidores:** ${servidores.toLocaleString('pt-BR')}
<:membropv:1412506556494516425> **Membros:** ${membros.toLocaleString('pt-BR')}
<:z_whiteregra:1330271051082371188> **Comandos:** ${comandos} total.
<:v_branco4:1382060159139844196> **Online:** <t:${ativoTimestamp}:R>
<:relogio:1343477670251462711> **Expira:** (<t:${hostingExpire}:R>)
          `.trim()
        )
        .setFooter({ text: `Developer ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      const reply = await interaction.reply({ embeds: [embed], ephemeral: true });

      // Deletar após 15 segundos (se não quiser, pode remover essa parte)
      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 15000);

    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Ocorreu um erro ao executar o comando de status.', ephemeral: true });
    }
  },
};