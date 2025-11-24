const {
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType
} = require('discord.js');

module.exports = {
  name: 'excluir',
  aliases: ['delchannel', 'deletechannel'],
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('❌ Você não tem permissão para excluir canais.');
    }

    const canal = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

    if (!canal) {
      return message.reply('❌ Você precisa mencionar um canal ou fornecer um ID válido.');
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply('❌ Eu não tenho permissão para excluir canais.');
    }

    if (!canal.deletable || canal.type === ChannelType.GuildCategory) {
      return message.reply('❌ Não posso excluir esse canal (pode ser uma categoria ou tenho permissões insuficientes).');
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('⚠️ Confirmação de Exclusão')
      .setDescription(`Você realmente deseja excluir o canal ${canal}?`)
      .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirmar-${message.author.id}`)
        .setLabel('Apagar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️'),
      new ButtonBuilder()
        .setCustomId(`cancelar-${message.author.id}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌')
    );

    const confirmMsg = await message.channel.send({
      embeds: [confirmEmbed],
      components: [row]
    });

    const collector = confirmMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: '❌ Apenas quem usou o comando pode interagir.', ephemeral: true });
      }

      const [action] = interaction.customId.split('-');

      if (action === 'confirmar') {
        const successEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('🗑️ Canal Excluído')
          .setDescription(`O canal **${canal.name}** foi excluído por <@${message.author.id}>.`)
          .setTimestamp()
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

        await interaction.update({ embeds: [successEmbed], components: [] });

        try {
          await canal.delete(`Excluído por ${message.author.tag}`);
          if (message.deletable) message.delete().catch(() => {});
          setTimeout(() => confirmMsg.delete().catch(() => {}), 10_000);
        } catch (err) {
          console.error('Erro ao excluir canal:', err);
          message.channel.send('❌ Ocorreu um erro ao excluir o canal.').catch(() => {});
        }

        collector.stop();
      }

      if (action === 'cancelar') {
        await interaction.update({
  embeds: [
    new EmbedBuilder()
      .setColor('Blue')
      .setTitle('❌ Ação Cancelada')
      .setDescription('A exclusão do canal foi cancelada.')
      .setTimestamp()
      .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
  ],
  components: []
});

setTimeout(() => {
  interaction.message.delete().catch(() => {});
}, 10_000); // apaga após 10 segundos

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