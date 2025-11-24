const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "rmvcargo",
  description: "Remove um cargo de um usuário.",
  aliases: ["delrole", "roleremove", "remrole"],
  async execute(message, args, client) {
    if (!message.guild || !message.member) {
      return message.channel.send("❌ Este comando só pode ser usado dentro de um servidor.");
    }

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.channel.send("❌ Você não tem permissão para gerenciar cargos.");
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.channel.send("❌ Eu preciso da permissão `Gerenciar Cargos` para executar isso.");
    }

    if (args.length < 2) {
      const prefixos = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../database/prefixos.json")));
      const prefixo = prefixos[message.guild.id] || "!";
      return message.channel.send(`❌ Uso incorreto. Use: \`${prefixo}rmvcargo <usuário> <cargo>\``);
    }

    const cleanId = mention => mention.replace(/[<@!&>]/g, "");

    const userArg = args[0];
    const roleArg = args[1];

    let user =
      message.guild.members.cache.get(cleanId(userArg)) ||
      message.mentions.members.first();

    let role =
      message.guild.roles.cache.get(cleanId(roleArg)) ||
      message.mentions.roles.first();

    if (!user) return message.channel.send("❌ Usuário inválido ou não encontrado no servidor.");
    if (!role) return message.channel.send("❌ Cargo inválido ou não encontrado no servidor.");

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.channel.send("❌ Não posso remover esse cargo, ele está acima do meu cargo.");
    }

    if (role.position >= message.member.roles.highest.position && message.guild.ownerId !== message.member.id) {
      return message.channel.send("❌ Você não pode gerenciar cargos iguais ou superiores ao seu.");
    }

    if (!user.roles.cache.has(role.id)) {
      return message.channel.send("⚠️ Este usuário não possui esse cargo.");
    }

    try {
      await user.roles.remove(role);

      const embed = new EmbedBuilder()
        .setTitle("❌ Cargo Removido")
        .setColor("Red")
        .addFields(
          { name: "👤 Usuário", value: `${user}`, inline: true },
          { name: "📛 Cargo", value: `${role}`, inline: true },
          { name: "👮 Responsável", value: `${message.author}`, inline: true }
        )
        .setTimestamp();

      const sentMsg = await message.channel.send({ embeds: [embed] });

      setTimeout(() => {
        sentMsg.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 10000);
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Erro ao tentar remover o cargo. Verifique permissões e hierarquia.");
    }
  },
};