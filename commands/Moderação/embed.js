const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  Colors,
  PermissionsBitField // ✅ necessário para verificar permissões do bot
} = require('discord.js');

module.exports = {
  name: 'embed',
  description: 'Cria e envia um embed personalizado com interface visual.',

  async execute(message) {
    // Verifica permissão do autor
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ Você precisa da permissão **Gerenciar Mensagens** para usar este comando.');
    }

    // Verifica permissão do bot
    const botPerms = message.channel.permissionsFor(message.guild.members.me);
    if (!botPerms || !botPerms.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
      return message.reply('❌ Eu preciso das permissões **Enviar Mensagens** e **Incorporar Links** para executar este comando.');
    }

    let embed = new EmbedBuilder()
      .setDescription('Todas as alterações serão mostradas neste exemplo prévio, quando a embed for enviada, campos não inseridos não serão mostrados.')
      .setColor('#2f3136')
      .setFooter({ text: `Todos os direitos reservados, ${message.guild.name}.` });

    let selectedChannel = null;

    const previewMessage = await message.channel.send({
      content: '🛠️ Enviar para: **Nenhum canal definido**',
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('set_channel').setLabel('Definir Canal').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('set_title').setLabel('Definir Título').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('set_desc').setLabel('Definir Descrição').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('set_image').setLabel('Definir Banner').setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('set_thumb').setLabel('Definir Thumbnail').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('set_color').setLabel('Escolher Cor').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('send').setLabel('Enviar').setStyle(ButtonStyle.Success)
        )
      ]
    });

    const collector = previewMessage.createMessageComponentCollector({
      time: 5 * 60 * 1000
    });

    const ask = async (interaction, text) => {
      await interaction.followUp({ content: text, ephemeral: true });
      const collected = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: 60000
      });
      const resposta = collected.first();
      if (resposta) await resposta.delete().catch(() => {});
      return resposta?.content || null;
    };

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: '❌ Apenas quem usou o comando pode interagir.', ephemeral: true });
      }

      await i.deferUpdate();

      if (i.customId === 'set_channel') {
        const input = await ask(i, '📨 • Envie o canal de destino (menção ou ID):');
        const canal = message.guild.channels.cache.get(input?.replace(/[<#>]/g, ''));
        if (!canal || canal.type !== ChannelType.GuildText) {
          return message.channel.send('❌ Canal inválido.');
        }
        selectedChannel = canal;
      }

      if (i.customId === 'set_title') {
        const input = await ask(i, '📝 • Envie o título!');
        embed.setTitle(input === 'skip' ? null : input);
      }

      if (i.customId === 'set_desc') {
        const input = await ask(i, '💬 • Envie a descrição!');
        embed.setDescription(input === 'skip' ? null : input);
      }

      if (i.customId === 'set_image') {
        const input = await ask(i, '🖼 • Envie a URL da imagem principal.');
        embed.setImage(input === 'skip' ? null : input);
      }

      if (i.customId === 'set_thumb') {
        const input = await ask(i, '🖼 • Envie a URL da thumbnail.');
        embed.setThumbnail(input === 'skip' ? null : input);
      }

      if (i.customId === 'set_color') {
        const input = await ask(i, '🎨 • Envie uma cor hexadecimal (ex: `#ff0000`).');
        if (input !== 'skip' && /^#?[0-9a-f]{6}$/i.test(input)) {
          const hex = input.startsWith('#') ? input : `#${input}`;
          embed.setColor(hex);
        } else if (input !== 'skip') {
          return message.channel.send('❌ Cor inválida.');
        }
      }

      if (i.customId === 'cancel') {
        collector.stop('cancelado');
        return previewMessage.edit({ content: '❌ • Cancelado.', embeds: [], components: [] }).catch(() => {});
      }

      if (i.customId === 'send') {
        if (!selectedChannel) {
          return message.channel.send('❌ Você precisa definir um canal primeiro.');
        }

        selectedChannel.send({ embeds: [embed] }).catch(() => {});
        collector.stop('enviado');
        return previewMessage.edit({ content: '✅ • Embed enviada com sucesso!', embeds: [], components: [] }).catch(() => {});
      }

      const canalTexto = selectedChannel ? `**${selectedChannel}**` : '**Nenhum canal definido**';
      previewMessage.edit({
        content: `🛠️ Enviar para: ${canalTexto}`,
        embeds: [embed]
      }).catch(() => {});
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'enviado' && reason !== 'cancelado') {
        previewMessage.edit({
          content: '⏰ • Tempo esgotado.',
          components: []
        }).catch(() => {});
      }
    });
  }
};