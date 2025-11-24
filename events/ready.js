// events/ready.js
const { ChannelType, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const moment = require('moment');
moment.locale('pt-br');

const LOG_CHANNEL_ID = '1414490761126482080';

module.exports = {
  name: 'clientReady',
  once: true,
  
  async execute(client) {
    console.log(`✅ | ${client.user.username} está online!`);

    // ================================
    // IDs dos canais
    // ================================
    const servidoresChannelId = '1372312629607006288';
    const membrosChannelId = '1383527415791226941';
    const voiceChannelId = '1383529214162108447';
    const guildId = '1265008346998636585';

    // ================================
    // Função de envio de logs
    // ================================
    async function sendLogEmbed(title, description, color = '#1ABC9C', extraFields = []) {
      try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!channel || !channel.isTextBased()) return;

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setTimestamp()
          .setFooter({ text: 'Logs do bot' });

        if (extraFields.length) embed.addFields(...extraFields);

        await channel.send({ embeds: [embed] });
      } catch (err) {
        console.error('❌ Não consegui enviar log:', err);
      }
    }

    // ================================
    // Conectar no canal de voz
    // ================================
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      const channel = guild.channels.cache.get(voiceChannelId);
      if (channel && channel.type === ChannelType.GuildVoice) {
        try {
          joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true,
          });
        } catch (error) {
          console.error("❌ Erro ao conectar no canal de voz:", error);
        }
      }
    }

    // ================================
    // Atualizar canais de contagem
    // ================================
    const updateVoiceChannels = async () => {
      const servidores = client.guilds.cache.size;
      const membros = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

      const servidoresChannel = client.channels.cache.get(servidoresChannelId);
      if (servidoresChannel) servidoresChannel.setName(`🌐 Servidores: ${servidores.toLocaleString()}`);

      const membrosChannel = client.channels.cache.get(membrosChannelId);
      if (membrosChannel) membrosChannel.setName(`👥 Membros: ${membros.toLocaleString()}`);
    };

    updateVoiceChannels();
    setInterval(updateVoiceChannels, 5 * 60 * 1000);

    // ================================
    // Log de bot online
    // ================================
    const now = moment().format('DD/MM/YYYY HH:mm:ss');
    await sendLogEmbed(
      '🟢 Bot Online',
      'O bot foi iniciado/reiniciado com sucesso!',
      '#1ABC9C',
      [
        { name: '🕒 Hora', value: now, inline: true },
        { name: '🆔 ID do Bot', value: client.user.id, inline: true },
        { name: '👤 Usuário', value: client.user.tag, inline: true },
      ]
    );

    // ================================
    // Eventos de shard
    // ================================
    client.on('shardDisconnect', async (event, shardId) => {
      await sendLogEmbed(
        '🔌 Shard Desconectado',
        `Shard ${shardId} desconectou do gateway.`,
        '#E67E22'
      );
    });

    client.on('shardReconnecting', async (shardId) => {
      await sendLogEmbed(
        '♻️ Shard Reconectando',
        `Shard ${shardId} está reconectando ao gateway...`,
        '#3498DB'
      );
    });

    // ================================
    // Erros globais
    // ================================
    process.on('uncaughtException', async (err) => {
      await sendLogEmbed(
        '🔥 Erro Fatal (uncaughtException)',
        `\`\`\`${err.stack || err}\`\`\``,
        '#E74C3C'
      );
    });

    process.on('unhandledRejection', async (reason) => {
      await sendLogEmbed(
        '⚠️ Rejeição Não Tratada (unhandledRejection)',
        `\`\`\`${reason}\`\`\``,
        '#F1C40F'
      );
    });

    // ================================
    // Erros em comandos
    // ================================
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return;

      try {
        // aqui normalmente você processaria o comando
      } catch (err) {
        const userTag = interaction.user.tag;
        const commandName = interaction.commandName;
        const now = moment().format('DD/MM/YYYY HH:mm:ss');

        console.error(`❌ Erro no comando ${commandName}:`, err);

        await sendLogEmbed(
          '❌ Erro em Comando',
          `Comando: \`${commandName}\`\nUsuário: ${userTag}\nHora: ${now}`,
          '#E74C3C',
          [{ name: 'Erro', value: `\`\`\`${err.stack || err}\`\`\`` }]
        );

        if (interaction.deferred || interaction.replied) {
          interaction.editReply('❌ Ocorreu um erro ao executar o comando.');
        } else {
          interaction.reply({ content: '❌ Ocorreu um erro ao executar o comando.', ephemeral: true });
        }
      }
    });
  },
};