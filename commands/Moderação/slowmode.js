module.exports = {
  name: 'slowmode',
  description: 'Define o modo lento no canal atual.',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageChannels')) {
      return message.reply('❌ Você precisa da permissão **Gerenciar Canais** para usar este comando.');
    }

    if (!message.guild.members.me.permissions.has('ManageChannels')) {
      return message.reply('❌ Eu preciso da permissão **Gerenciar Canais** para definir o modo lento.');
    }

    const seconds = parseInt(args[0]);

    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply('❌ Informe um tempo válido entre **0 e 21600 segundos**.');
    }

    try {
      await message.channel.setRateLimitPerUser(seconds);
      message.reply(`🐢 Modo lento ajustado para **${seconds} segundos**.`);
    } catch (err) {
      console.error('Erro ao definir o modo lento:', err);
      message.reply('❌ Ocorreu um erro ao tentar definir o modo lento.');
    }
  }
};