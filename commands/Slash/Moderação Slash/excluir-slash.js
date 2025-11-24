const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('excluir')
    .setDescription('Exclui um canal após confirmação')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal que você quer excluir')
        .setRequired(true)
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildVoice,
          ChannelType.GuildNews,
          ChannelType.GuildForum
        )
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ content: '❌ Você não tem permissão para excluir canais.', ephemeral: true });
    }

    const canal = interaction.options.getChannel('canal');

    if (!canal) {
      return interaction.reply({ content: '❌ Você precisa mencionar um canal válido.', ephemeral: true });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ content: '❌ Eu não tenho permissão para excluir canais.', ephemeral: true });
    }

    if (!canal.deletable || canal.type === ChannelType.GuildCategory) {
      return interaction.reply({
        content: '❌ Não posso excluir esse canal (pode ser uma categoria ou tenho permissões insuficientes).',
        ephemeral: true
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('⚠️ Confirmação de Exclusão')
      .setDescription(`Você realmente deseja excluir o canal ${canal}?`)
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirmar-${interaction.user.id}`)
        .setLabel('Apagar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️'),
      new ButtonBuilder()
        .setCustomId(`cancelar-${interaction.user.id}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌')
    );

    const confirmMsg = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      fetchReply: true,
      ephemeral: true
    });

    const collector = confirmMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000
    });

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        return btnInteraction.reply({ content: '❌ Apenas quem usou o comando pode interagir.', ephemeral: true });
      }

      const [action] = btnInteraction.customId.split('-');

      if (action === 'confirmar') {
        const successEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('🗑️ Canal Excluído')
          .setDescription(`O canal **${canal.name}** foi excluído por <@${interaction.user.id}>.`)
          .setTimestamp()
          .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        await btnInteraction.update({ embeds: [successEmbed], components: [] });

        try {
          await canal.delete(`Excluído por ${interaction.user.tag}`);
          setTimeout(() => confirmMsg.delete().catch(() => {}), 10_000);
        } catch (err) {
          console.error('Erro ao excluir canal:', err);
          interaction.followUp({ content: '❌ Ocorreu um erro ao excluir o canal.', ephemeral: true });
        }

        collector.stop();
      }

      if (action === 'cancelar') {
        await btnInteraction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('Blue')
              .setTitle('❌ Ação Cancelada')
              .setDescription('A exclusão do canal foi cancelada.')
              .setTimestamp()
              .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          ],
          components: []
        });

        setTimeout(() => {
          btnInteraction.message.delete().catch(() => {});
        }, 10_000);

        collector.stop();
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        confirmMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor('Grey')
              .setTitle('⏰ Tempo Esgotado')
              .setDescription('Você não respondeu a tempo. A exclusão foi cancelada.')
              .setTimestamp()
          ],
          components: []
        }).catch(() => {});
      }
    });
  }
};