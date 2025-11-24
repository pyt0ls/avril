const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField // ⬅️ ADICIONE ISSO AQUI
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Cria uma embed 100% personalizado.')
    .setDefaultMemberPermissions(0x0000000000002000n),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ManageMessages'))
      return interaction.reply({ content: '❌ Você precisa da permissão Gerenciar Mensagens para usar este comando.', ephemeral: true });
      
      // Verifica permissões do bot no canal atual (onde o comando foi usado)
const botPerms = interaction.channel.permissionsFor(interaction.guild.members.me);
if (!botPerms.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
  return interaction.reply({
    content: '❌ Eu preciso das permissões **Enviar Mensagens** e **Incorporar Links (Embed Links)** para executar este comando.',
    ephemeral: true
  });
}

    let embed = new EmbedBuilder()
      .setDescription('Todas as alterações serão mostradas neste exemplo prévio, quando a embed for enviada, campos não inseridos não serão mostrados.')
      .setColor('#2f3136')
      .setFooter({ text: `Todos os direitos reservados, ${interaction.guild.name}.` });

    let selectedChannel = null;

    const previewMessage = await interaction.reply({
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
      ],
      fetchReply: true
    });

    const collector = previewMessage.createMessageComponentCollector({
      time: 5 * 60 * 1000
    });

    const ask = async (int, text) => {
      await int.followUp({ content: text, ephemeral: true });
      const filter = m => m.author.id === interaction.user.id;
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
      const resposta = collected.first();
      if (resposta) await resposta.delete().catch(() => {});
      return resposta?.content || null;
    };

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Apenas quem usou o comando pode interagir.', ephemeral: true });
      }

      await i.deferUpdate();

      if (i.customId === 'set_channel') {
        const input = await ask(i, '📨 • Envie o canal de destino (menção ou ID):');
        const canal = interaction.guild.channels.cache.get(input?.replace(/[<#>]/g, ''));
        if (!canal || canal.type !== ChannelType.GuildText)
          return interaction.followUp({ content: '❌ Canal inválido.', ephemeral: true });
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
          return interaction.followUp({ content: '❌ Cor inválida.', ephemeral: true });
        }
      }

      if (i.customId === 'cancel') {
        collector.stop('cancelado');
        return previewMessage.edit({ content: '❌ • Cancelado.', embeds: [], components: [] });
      }

      if (i.customId === 'send') {
        if (!selectedChannel) {
          return interaction.followUp({ content: '❌ Você precisa definir um canal primeiro.', ephemeral: true });
        }

        selectedChannel.send({ embeds: [embed] });
        collector.stop('enviado');
        return previewMessage.edit({ content: '✅ • Embed enviada com sucesso!', embeds: [], components: [] });
      }

      const canalTexto = selectedChannel ? `**${selectedChannel}**` : '**Nenhum canal definido**';
      previewMessage.edit({
        content: `🛠️ Enviar para: ${canalTexto}`,
        embeds: [embed]
      });
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'enviado' && reason !== 'cancelado') {
        previewMessage.edit({
  content: '⏰ • Tempo esgotado.',
  components: []
}).catch(() => {}); // ⬅️ Evita crash se a mensagem não existir
      }
    });
  }
};