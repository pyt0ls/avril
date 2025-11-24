const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
  async handleDeveloperPanel(interaction) {
    const [action, userId] = interaction.values[0].split("-");

    // Menu pertence ao usuário certo?
    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: "❌ Esse painel não é seu.",
        ephemeral: true
      });
    }

    // É dono?
    if (!config.OWNERS.includes(interaction.user.id)) {
      return interaction.reply({
        content: "⛔ Apenas desenvolvedores podem usar isso.",
        ephemeral: true
      });
    }

    let embed;

    switch (action) {

      // ======================== AVATAR ========================
      case "avatar": {
        embed = new EmbedBuilder()
          .setColor("#ffcc00")
          .setTitle("🖼️ Alterar Avatar do Bot")
          .setDescription("Envie agora **uma imagem** ou um **link direto** para o novo avatar.");

        await interaction.update({ embeds: [embed], components: [] });

        const filter = m => m.author.id === interaction.user.id;
        const msg = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 }).catch(() => null);

        if (!msg || msg.size < 1) return;

        const message = msg.first();

        try {
          let buffer;

          // ---- Se usuário enviou arquivo ----
          if (message.attachments.size > 0) {
            const attachment = message.attachments.first();

            const axios = require("axios");
            const res = await axios.get(attachment.url, { responseType: "arraybuffer" });
            buffer = Buffer.from(res.data);
          }

          // ---- Se enviou link ----
          else {
            const axios = require("axios");
            const res = await axios.get(message.content, { responseType: "arraybuffer" });
            buffer = Buffer.from(res.data);
          }

          await interaction.client.user.setAvatar(buffer);

          await interaction.followUp({
            content: "✅ Avatar atualizado com sucesso!",
            ephemeral: true
          });

        } catch (e) {
          console.log(e);
          await interaction.followUp({
            content: "❌ Não consegui mudar o avatar. Envie uma imagem válida.",
            ephemeral: true
          });
        }

        message.delete().catch(() => {});
        break;
      }

      // ======================== BANNER ========================
      case "banner": {
  embed = new EmbedBuilder()
    .setColor("#00aaff")
    .setTitle("🎴 Alterar Banner Global do Bot")
    .setDescription("Envie o **link direto** da imagem ou **anexe uma imagem** para definir o novo banner.");

  await interaction.update({ embeds: [embed], components: [] });

  const filter = m => m.author.id === interaction.user.id;
  const msg = await interaction.channel.awaitMessages({
    filter,
    max: 1,
    time: 60000
  }).catch(() => null);

  if (!msg || msg.size < 1) return;

  const message = msg.first();

  // 👉 Pegar imagem por anexo OU link
  let url = null;

  if (message.attachments.size > 0) {
    url = message.attachments.first().url; // imagem enviada
  } else {
    url = message.content.trim(); // link enviado
  }

  if (!url || !url.startsWith("http")) {
    await interaction.followUp({
      content: "❌ Você precisa enviar um **link válido** ou **uma imagem**.",
      ephemeral: true
    });
    return;
  }

  try {
    const axios = require("axios");
    const { Routes } = require("discord.js");

    // 👉 Baixar imagem (agora funciona mesmo com anexo)
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // 👉 Enviar pro Developer Portal
    await interaction.client.rest.patch(
      Routes.user(),
      {
        body: {
          banner: `data:image/png;base64,${buffer.toString("base64")}`
        }
      }
    );

    await interaction.followUp({
      content: "✅ **Banner global atualizado com sucesso!**",
      ephemeral: true
    });

  } catch (e) {
    console.log(e);

    await interaction.followUp({
      content: `❌ **Erro ao alterar o banner.**\nDetalhes: \`${e.message}\``,
      ephemeral: true
    });
  }

  message.delete().catch(() => {});
  break;
}

      // ======================== NOME GLOBAL ========================
      case "nick": {
        embed = new EmbedBuilder()
          .setColor("#ffaa00")
          .setTitle("✏️ Alterar Nome Global")
          .setDescription("Digite o **novo nome global** do bot.");

        await interaction.update({ embeds: [embed], components: [] });

        const filter = m => m.author.id === interaction.user.id;
        const msg = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });

        if (!msg || msg.size < 1) return;

        const newNick = msg.first().content;

        try {
          await interaction.client.user.setUsername(newNick);

          await interaction.followUp({
            content: `✅ Nome global alterado para **${newNick}**`,
            ephemeral: true
          });

        } catch (e) {
          console.log(e);
          await interaction.followUp({
            content: "❌ Não consegui alterar o nome global (limite de hora atingido?).",
            ephemeral: true
          });
        }

        msg.first().delete().catch(() => {});
        break;
      }

      default:
        return interaction.reply({
          content: "❌ Opção desconhecida.",
          ephemeral: true
        });
    } // <-- FECHA O SWITCH

  } // <-- FECHA O MÉTODO handleDeveloperPanel
}; // <-- FECHA O module.exports