const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Define o modo lento no canal atual.')
    .addIntegerOption(option =>
      option
        .setName('tempo')
        .setDescription('Tempo em segundos (0 a 21600)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const tempo = interaction.options.getInteger('tempo');
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
  return interaction.reply({
    content: '❌ Você precisa da permissão **Gerenciar Canais** para usar este comando.',
    ephemeral: true,
  });
}

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: '❌ Eu preciso da permissão **Gerenciar Canais** para definir o modo lento.',
        ephemeral: true,
      });
    }

    if (tempo < 0 || tempo > 21600) {
      return interaction.reply({
        content: '❌ Informe um tempo válido entre **0 e 21600 segundos**.',
        ephemeral: true,
      });
    }

    try {
      await interaction.channel.setRateLimitPerUser(tempo);
      interaction.reply(`🐢 Modo lento ajustado para **${tempo} segundos**.`);
    } catch (err) {
      console.error('Erro ao definir o modo lento:', err);
      interaction.reply({
        content: '❌ Ocorreu um erro ao tentar definir o modo lento.',
        ephemeral: true,
      });
    }
  },
};