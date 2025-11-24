const ms = require("ms");
const {
  SlashCommandBuilder,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("castigar")
    .setDescription("Aplica um castigo (timeout) a um usuário.")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("Usuário a ser castigado")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tempo")
        .setDescription("Duração do castigo (ex: 10s, 5m, 1h, 1d)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo do castigo")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("usuario");
    const timeArg = interaction.options.getString("tempo") || "1h";
    const motivo = interaction.options.getString("motivo") || "Sem motivo informado";

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({
        content: "❌ Você não tem permissão para castigar membros.",
        ephemeral: true,
      });
    }

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({
        content: "❌ Usuário não encontrado no servidor.",
        ephemeral: true,
      });
    }

    const timeMs = ms(timeArg);
    if (!timeMs || timeMs < 1000 || timeMs > 2419200000) {
      return interaction.reply({
        content:
          "❌ Tempo inválido! Use um valor entre 1s e 28d. Exemplos: 10s, 5m, 1h, 1d, 7d",
        ephemeral: true,
      });
    }

    try {
      await member.timeout(timeMs, motivo);
      await interaction.reply(
        `🔇 ${user.tag} foi castigado por ${timeArg}. Motivo: **${motivo}**`
      );
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content:
          "❌ Não consegui aplicar o castigo. Verifique minhas permissões.",
        ephemeral: true,
      });
    }
  },
};