const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['menu', 'painel', 'ajuda'],
  execute(message, args) {
    const serverIcon = message.guild.iconURL({ dynamic: true, size: 1024 });
    const authorAvatar = message.author.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor('#ffffff')
      .setAuthor({
        name: `Painel - ${message.guild.name}`,
        iconURL: serverIcon || undefined
      })
      .setThumbnail(serverIcon || undefined)
      .setFooter({ text: message.author.username, iconURL: authorAvatar })
      .setTimestamp()
      .setDescription(`
<:members:1382075056867381358> **Olá:** <@${message.author.id}>
\`${message.author.id}\`

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
          value: `home-${message.author.id}`,
          emoji: '<:paginainicial:1382086832757407867>'
        },
        {
          label: 'Social',
          description: 'Menu Social',
          value: `social-${message.author.id}`,
          emoji: '<:insta:1382065757319462953>'
        },
        {
          label: 'Jogos',
          description: 'Menu de jogos',
          value: `jogos-${message.author.id}`,
          emoji: '<:jogos:1418388139004923944>'
        },
        {
          label: 'Economia',
          description: 'Menu de economia',
          value: `economia-${message.author.id}`,
          emoji: '<:cdw_whiteBR:1382063944042020885>'
        },
        {
          label: 'Diversão',
          description: 'Menu de diversão',
          value: `diversão-${message.author.id}`,
          emoji: '<:booster:1382068282147733586>'
        },
        {
          label: 'Utilidades',
          description: 'Menu utilidades',
          value: `utilidade-${message.author.id}`,
          emoji: '<:adicionar:1382068285054652539>'
        },
        {
          label: 'Moderação',
          description: 'Menu de Moderação',
          value: `admin-${message.author.id}`,
          emoji: '<:pureza_i:1382063941030776932>'
        },
        {
          label: 'Developer',
          description: 'Menu do Developer',
          value: `dev-${message.author.id}`,
          emoji: '<:proteo:1441491061770813511>'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    message.reply({ embeds: [embed], components: [row] });
  }
};