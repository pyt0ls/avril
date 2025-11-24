const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Mostra o avatar de um usuário.')
    .addUserOption(option =>
      option
        .setName('usuário')
        .setDescription('Usuário que você quer ver o avatar')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuário') || interaction.user;
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🖼 Avatar de ${user.username}`)
      .setImage(avatarURL)
      .setFooter({
        text: `Requisitado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Download')
        .setStyle(ButtonStyle.Link)
        .setURL(avatarURL)
        .setEmoji('<:links:1329724255163781150>')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};