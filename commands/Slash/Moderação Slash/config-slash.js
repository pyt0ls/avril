const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../../../database/entradas.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 4));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Painel de configuração do sistema de boas-vindas'),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({
        content: '❌ Você precisa da permissão **Gerenciar Servidor** para usar este comando.',
        ephemeral: true,
      });
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

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId === 'config-menu',
      time: 60000,
      max: 1,
    });

    collector.on('collect', async i => {
      const data = loadConfig();
      const guildId = interaction.guild.id;
      if (!data[guildId]) data[guildId] = {};

      // Desativa os componentes da interação para não travar o menu
      await i.deferUpdate();

      if (i.values[0] === 'entrada') {
        await i.followUp({ content: '📥 Mencione o canal para **log de entrada**:', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const entradaMsg = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

        const entradaCanal = entradaMsg.first()?.mentions.channels.first();
        if (!entradaCanal || entradaCanal.type !== ChannelType.GuildText) {
          return interaction.followUp({ content: '❌ Canal inválido.', ephemeral: true });
        }

        data[guildId].entradaLog = entradaCanal.id;
        saveConfig(data);

        return interaction.followUp({ content: '✅ Canal de log de entrada configurado!', ephemeral: true });
      }

      if (i.values[0] === 'saida') {
        await i.followUp({ content: '📤 Mencione o canal para **log de saída**:', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const saidaMsg = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

        const saidaCanal = saidaMsg.first()?.mentions.channels.first();
        if (!saidaCanal || saidaCanal.type !== ChannelType.GuildText) {
          return interaction.followUp({ content: '❌ Canal inválido.', ephemeral: true });
        }

        data[guildId].saidaLog = saidaCanal.id;
        saveConfig(data);

        return interaction.followUp({ content: '✅ Canal de log de saída configurado!', ephemeral: true });
      }

      if (i.values[0] === 'bemvindo') {
        await i.followUp({ content: '👋 Mencione o canal onde a **mensagem de boas-vindas** será enviada:', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const bemvindoMsg = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

        const bemvindoCanal = bemvindoMsg.first()?.mentions.channels.first();
        if (!bemvindoCanal || bemvindoCanal.type !== ChannelType.GuildText) {
          return interaction.followUp({ content: '❌ Canal inválido.', ephemeral: true });
        }

        data[guildId].canalBemVindo = bemvindoCanal.id;
        saveConfig(data);

        return interaction.followUp({ content: '✅ Canal de mensagem de boas-vindas configurado!', ephemeral: true });
      }

      if (i.values[0] === 'mensagem') {
        await i.followUp({
          content: '💬 Envie a mensagem de boas-vindas. Use `{usuario}` e `{servidor}` como variáveis:',
          ephemeral: true,
        });

        const filter = m => m.author.id === interaction.user.id;
        const msgContent = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });

        if (!msgContent.size) return interaction.followUp({ content: '⏳ Tempo esgotado.', ephemeral: true });

        const mensagem = msgContent.first().content;
        data[guildId].mensagemBemVindo = mensagem;
        saveConfig(data);

        return interaction.followUp({ content: '✅ Mensagem de boas-vindas atualizada!', ephemeral: true });
      }
    });

    collector.on('end', () => {
      message.edit({ components: [] }).catch(() => {});
    });
  },
};