const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra o painel de ajuda interativo.'),

  async execute(interaction) {
    const serverIcon = interaction.guild?.iconURL({ dynamic: true, size: 1024 }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png';
const authorAvatar = interaction.user?.displayAvatarURL({ dynamic: true, size: 1024 }) ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

    const embed = new EmbedBuilder()
      .setColor('#ffffff')
      .setAuthor({ name: `Painel - ${interaction.guild.name}`, iconURL: serverIcon })
      .setThumbnail(serverIcon)
      .setFooter({ text: interaction.user.username, iconURL: authorAvatar })
      .setTimestamp()
      .setDescription(`
<:members:1382075056867381358> **Olá:** <@${interaction.user.id}>
\`${interaction.user.id}\`

<:relogio:1382896998700679230> **Expiração:**
<t:1893466800:D>

<:att:1330271050138783785> **Informações:**
[Servidor de Suporte](https://discord.gg/NmWy87RjFe)
      `);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help')
      .setPlaceholder('Selecione a categoria.')
      .addOptions([
        {
          label: 'Página Inicial',
          description: 'Voltar para o início do painel',
          value: `home-${interaction.user.id}`,
          emoji: { id: '1382086832757407867', name: 'paginainicial' }
        },
        {
          label: 'Social',
          description: 'Menu Social',
          value: `social-${interaction.user.id}`,
          emoji: { id: '1382065757319462953', name: 'insta' }
        },
        {
          label: 'Jogos',
          description: 'Menu de jogos',
          value: `jogos-${interaction.user.id}`,
          emoji: '<:jogos:1418388139004923944>'
        },
        {
          label: 'Economia',
          description: 'Menu de economia',
          value: `economia-${interaction.user.id}`,
          emoji: { id: '1382063944042020885', name: 'cdw_whiteBR' }
        },
        {
          label: 'Diversão',
          description: 'Menu de diversão',
          value: `diversão-${interaction.user.id}`,
          emoji: { id: '1382068282147733586', name: 'booster' }
        },
        {
          label: 'Utilidades',
          description: 'Menu utilidades',
          value: `utilidade-${interaction.user.id}`,
          emoji: { id: '1382068285054652539', name: 'adicionar' }
        },
        {
          label: 'Moderação',
          description: 'Menu de Moderação',
          value: `admin-${interaction.user.id}`,
          emoji: { id: '1382063941030776932', name: 'pureza_i' }
        },
        {
          label: 'Developer',
          description: 'Menu do Developer',
          value: `dev-${message.author.id}`,
          emoji: '<:proteo:1441491061770813511>'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
  },
};