const config = require("../../config");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "limpardm",
  description: "Limpa as mensagens enviadas pelo bot em uma DM específica.",
  category: "Dev",

  async execute(message, args) {
    if (!config.OWNERS.includes(message.author.id)) {
      return message.reply("❌ Apenas desenvolvedores autorizados podem usar este comando.");
    }

    const userId = args[0];
    if (!userId) {
      return message.reply("❌ Forneça o ID do usuário da DM para limpar.");
    }

    try {
      const user = await message.client.users.fetch(userId);
      if (!user) return message.reply("❌ Usuário não encontrado.");

      const dm = await user.createDM();

      const embedInicial = new EmbedBuilder()
        .setTitle("🧹 Limpando mensagens...")
        .setDescription(`Aguarde enquanto limpo as mensagens da DM com <@${user.id}>.`)
        .setColor("Yellow")
        .setTimestamp();

      const statusMsg = await message.channel.send({ embeds: [embedInicial] });

      let deletedCount = 0;
      let fetched;
      let limit = 1000;

      while (limit > 0) {
        fetched = await dm.messages.fetch({ limit: Math.min(limit, 100) });
        const botMessages = fetched.filter(m => m.author.id === message.client.user.id);

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

        // Se nenhuma mensagem do bot for encontrada, para o loop
        if (botMessages.size === 0) break;
      }

      const embedFinal = new EmbedBuilder()
        .setTitle("✅ DM limpa!")
        .setDescription(`Foram apagadas **${deletedCount} mensagens** do bot na DM com <@${user.id}>.`)
        .setColor("Green")
        .setTimestamp();

      await statusMsg.edit({ embeds: [embedFinal] });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Ocorreu um erro ao tentar limpar as mensagens da DM.");
    }
  }
};