module.exports = {
  name: 'unlock',
  description: 'Desbloqueia o canal atual para todos.',
  async execute(message) {
    // Verifica se o membro tem permissão de GERENCIAR CARGOS
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('❌ Você precisa da permissão **Gerenciar Cargos** para usar este comando.');
    }

    // Verifica se o bot também tem essa permissão
    if (!message.guild.members.me.permissions.has('ManageRoles')) {
      return message.reply('❌ Eu preciso da permissão **Gerenciar Cargos** para desbloquear o canal.');
    }

    try {
      await message.channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        { SendMessages: true }
      );

      message.reply('🔓 Canal desbloqueado com sucesso!');
    } catch (err) {
      console.error('Erro ao desbloquear o canal:', err);
      message.reply('❌ Ocorreu um erro ao tentar desbloquear este canal.');
    }
  }
};