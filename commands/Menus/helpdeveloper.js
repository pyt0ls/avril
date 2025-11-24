const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");

const config = require("../../config");

module.exports = {
  name: "helpdeveloper",
  aliases: ["devmenu", "paineldev", "devm"],

  execute(message) {

    if (!config.OWNERS.includes(message.author.id)) {
      return message.reply("⛔ Apenas desenvolvedores podem acessar este painel.");
    }

    const serverIcon = message.guild.iconURL({ dynamic: true, size: 1024 });
    const authorAvatar = message.author.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor("#ffffff")
      .setAuthor({ name: `Painel Developer - ${message.guild.name}`, iconURL: serverIcon })
      .setThumbnail(serverIcon)
      .setFooter({ text: message.author.username, iconURL: authorAvatar })
      .setTimestamp()
      .setDescription(`
<:proteo:1441491061770813511> **Olá Developer:** <@${message.author.id}>
\`${message.author.id}\`

🛠 Bem-vindo ao **Painel Dev – Developer**  
Selecione uma função abaixo.
      `);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`devpanel-${message.author.id}`)
      .setPlaceholder("Selecione uma função developer")
      .addOptions([
        {
          label: "Alterar Avatar",
          value: `avatar-${message.author.id}`,
          emoji: "🖼️"
        },
        {
          label: "Alterar Banner",
          value: `banner-${message.author.id}`,
          emoji: "🎴"
        },
        {
          label: "Alterar Nickname",
          value: `nick-${message.author.id}`,
          emoji: "✏️"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    message.reply({ embeds: [embed], components: [row] });
  }
};