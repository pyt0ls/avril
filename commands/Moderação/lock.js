module.exports = {
  name: 'lock',
  description: 'Bloqueia o canal atual para todos.',
  async execute(message) {
    // Verifica se o membro tem permissão de GERENCIAR CARGOS
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('❌ Você precisa da permissão **Gerenciar Cargos** para usar este comando.');
    }

    // Verifica se o bot também tem essa permissão
    if (!message.guild.members.me.permissions.has('ManageRoles')) {
      return message.reply('❌ Eu preciso da permissão **Gerenciar Cargos** para bloquear o canal.');
    }

    try {
      await message.channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        { SendMessages: false }
      );

      message.reply('🔒 Canal bloqueado com sucesso!');
    } catch (err) {
      console.error('Erro ao bloquear o canal:', err);
      message.reply('❌ Ocorreu um erro ao tentar bloquear este canal.');
    }
  }
};