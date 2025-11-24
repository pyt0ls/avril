const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Abra o shopping do bot para comprar armas ou itens.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Shopping da avril.", iconURL: interaction.client.user.displayAvatarURL() })
      .setTitle("**Shop da avril**")
      .setDescription("Olá, aqui você poderá comprar suas armas ou arrumar sua picareta quebrada.\n\nUse o menu abaixo para escolher a categoria desejada.")
      .setThumbnail("https://dl.dropboxusercontent.com/scl/fi/wy4cjgo7s1fjn2znppqm3/1741653411728.jpeg?rlkey=6wvexe9ut6zq0ox59fbqkb2qm&dl=0")
      .setImage("https://dl.dropboxusercontent.com/scl/fi/1vzxmcebxz5p3tjrfkift/1741653420754.jpeg?rlkey=y0d5taytiwk2za0114e2jn9h6&dl=0")
      .setColor("#ffffff")
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const select = new StringSelectMenuBuilder()
      .setCustomId(`shop-${interaction.user.id}`)
      .setPlaceholder('🛍️ • Selecione um item para comprar')
      .addOptions(
        {
          label: 'Facão Cego',
          description: 'Valor: 300 coins',
          value: `comprar_faca-${interaction.user.id}`,
          emoji: '🗡',
        },
        {
          label: 'Vibrador Antigo',
          description: 'Valor: 2.000 coins',
          value: `comprar_vibrador-${interaction.user.id}`,
          emoji: '🕹',
        },
        {
          label: 'Pistola Básica',
          description: 'Valor: 500 coins',
          value: `comprar_arma-${interaction.user.id}`,
          emoji: '🔫',
        },
        {
          label: 'Rola de Borracha',
          description: 'Valor: 5.000 coins',
          value: `comprar_rola-${interaction.user.id}`,
          emoji: '🍆',
        },
        {
          label: 'Fuzil AK-47',
          description: 'Valor: 1.500 coins',
          value: `comprar_fuzil-${interaction.user.id}`,
          emoji: '💥',
        }
      );

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};