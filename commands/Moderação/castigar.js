const ms = require("ms");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "castigar",
  description: "Aplica um castigo (timeout) a um usuário.",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("❌ Você não tem permissão para castigar membros.");
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply("❌ Mencione um usuário para castigar.");

    const member = message.guild.members.cache.get(user.id);
    if (!member) return message.reply("❌ Usuário não encontrado no servidor.");

    // Tempo do timeout (args[1]) ou 1h padrão
    const timeArg = args[1] || "1h";
    const timeMs = ms(timeArg);

    if (!timeMs || timeMs < 1000 || timeMs > 2419200000) {
      return message.reply(
        "❌ Tempo inválido! Use um valor entre 1s e 28d. Exemplos: 10s, 5m, 1h, 1d, 7d"
      );
    }

    const motivo = args.slice(2).join(" ") || "Sem motivo informado";

    try {
      await member.timeout(timeMs, motivo);
      message.channel.send(
        `🔇 ${user.tag} foi castigado por ${timeArg}. Motivo: **${motivo}**`
      );
    } catch (err) {
      console.error(err);
      message.channel.send(
        "❌ Não consegui aplicar o castigo. Verifique minhas permissões."
      );
    }
  },
};