const config = require("../../../config");
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  global: false, // <<< só adicionar isso para registrar só na guild

  data: new SlashCommandBuilder()
    .setName("limpar-dm")
    .setDescription("Limpa DM com o bot.")
    .addStringOption(option =>
      option
        .setName("userid")
        .setDescription("ID do usuário da DM para limpar")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!config.OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: "❌ Apenas desenvolvedores autorizados podem usar este comando.", ephemeral: true });
    }

    const userId = interaction.options.getString("userid");

    await interaction.deferReply();

    try {
      const user = await interaction.client.users.fetch(userId);
      if (!user) return interaction.editReply("❌ Usuário não encontrado.");

      const dm = await user.createDM();

      const embedInicial = new EmbedBuilder()
        .setTitle("🧹 Limpando mensagens...")
        .setDescription(`Aguarde enquanto limpo as mensagens da DM com <@${user.id}>.`)
        .setColor("Yellow")
        .setTimestamp();

      const statusMsg = await interaction.editReply({ embeds: [embedInicial] });

      let deletedCount = 0;
      let limit = 1000;
      let lastId;

      while (limit > 0) {
        const options = { limit: Math.min(limit, 100) };
        if (lastId) options.before = lastId;

        const fetched = await dm.messages.fetch(options);
        const botMessages = fetched.filter(m => m.author.id === interaction.client.user.id);

        for (const msg of botMessages.values()) {
          try {
            await msg.delete();
            deletedCount++;
            limit--;
            if (limit <= 0) break;
          } catch (err) {
            console.warn(`Erro ao deletar: ${err.message}`);
          }
        }

        if (botMessages.size === 0) break;

        lastId = fetched.last()?.id;
      }

      const embedFinal = new EmbedBuilder()
        .setTitle("✅ DM limpa!")
        .setDescription(`Foram apagadas **${deletedCount} mensagens** do bot na DM com <@${user.id}>.`)
        .setColor("Green")
        .setTimestamp();

      await interaction.editReply({ embeds: [embedFinal] });

    } catch (err) {
      console.error(err);
      return interaction.editReply("❌ Ocorreu um erro ao tentar limpar as mensagens da DM.");
    }
  }
};