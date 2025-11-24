const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: "rmvcastigo",
  description: "Remove o castigo (timeout) de um usuário.",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ Você não tem permissão para remover castigos.");
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ Eu não tenho permissão para remover castigos. Me conceda `Moderar membros`.");
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply("❌ Mencione um usuário para remover o castigo.");

    const member = message.guild.members.cache.get(user.id);
    if (!member) return message.reply("❌ Usuário não encontrado no servidor.");

    // Verifica se o usuário está mesmo em timeout
    if (!member.communicationDisabledUntilTimestamp || Date.now() > member.communicationDisabledUntilTimestamp) {
      return message.reply("❌ Este usuário não está sob castigo atualmente.");
    }

    try {
      await member.timeout(null); // Remove o timeout
      message.channel.send(`✅ ${user.tag} teve o castigo removido com sucesso.`);
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Não consegui remover o castigo. Verifique minhas permissões ou a hierarquia de cargos.");
    }
  }
};