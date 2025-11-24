const { ActionRowBuilder, StringSelectMenuBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = './database/entradas.json';

function loadConfig() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

module.exports = {
  name: 'config',
  async execute(message) {
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ Você precisa da permissão **Gerenciar Servidor** para usar este comando.');
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('config-menu')
      .setPlaceholder('Selecione uma opção')
      .addOptions(
        { label: 'Canal de Log de Entradas', value: 'entrada' },
        { label: 'Canal de Log de Saídas', value: 'saida' },
        { label: 'Canal de Mensagem de Boas-vindas', value: 'bemvindo' },
        { label: 'Mensagem de Boas-vindas', value: 'mensagem' }
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Painel de Configuração')
      .setDescription('Selecione abaixo o que deseja configurar para o sistema de boas-vindas.')
      .setColor('Blue');

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id)
        return interaction.reply({ content: '❌ Apenas quem executou o comando pode usar o painel.', ephemeral: true });

      const data = loadConfig();
      const guildId = message.guild.id;
      if (!data[guildId]) data[guildId] = {};

      if (interaction.values[0] === 'entrada') {
        interaction.reply('📥 Mencione o canal para **log de entrada**:');
        const filtro = m => m.author.id === message.author.id;
        const entradaMsg = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
        const entradaCanal = entradaMsg.first().mentions.channels.first();
        if (!entradaCanal || entradaCanal.type !== ChannelType.GuildText)
          return message.channel.send('❌ Canal inválido.');
        data[guildId].entradaLog = entradaCanal.id;
        saveConfig(data);
        message.channel.send('✅ Canal de log de entrada configurado!');
      }

      if (interaction.values[0] === 'saida') {
        interaction.reply('📤 Mencione o canal para **log de saída**:');
        const filtro = m => m.author.id === message.author.id;
        const saidaMsg = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
        const saidaCanal = saidaMsg.first().mentions.channels.first();
        if (!saidaCanal || saidaCanal.type !== ChannelType.GuildText)
          return message.channel.send('❌ Canal inválido.');
        data[guildId].saidaLog = saidaCanal.id;
        saveConfig(data);
        message.channel.send('✅ Canal de log de saída configurado!');
      }

      if (interaction.values[0] === 'bemvindo') {
        interaction.reply('👋 Mencione o canal onde a **mensagem de boas-vindas** será enviada:');
        const filtro = m => m.author.id === message.author.id;
        const bemvindoMsg = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 30000 });
        const bemvindoCanal = bemvindoMsg.first().mentions.channels.first();
        if (!bemvindoCanal || bemvindoCanal.type !== ChannelType.GuildText)
          return message.channel.send('❌ Canal inválido.');
        data[guildId].canalBemVindo = bemvindoCanal.id;
        saveConfig(data);
        message.channel.send('✅ Canal de mensagem de boas-vindas configurado!');
      }

      if (interaction.values[0] === 'mensagem') {
        interaction.reply('💬 Envie a mensagem de boas-vindas. Use `{usuario}` e `{servidor}` como variáveis:');
        const filtro = m => m.author.id === message.author.id;
        const msgContent = await message.channel.awaitMessages({ filter: filtro, max: 1, time: 60000 });
        const mensagem = msgContent.first().content;
        data[guildId].mensagemBemVindo = mensagem;
        saveConfig(data);
        message.channel.send('✅ Mensagem de boas-vindas atualizada!');
      }
    });

    collector.on('end', () => {
      msg.edit({ components: [] });
    });
  }
};