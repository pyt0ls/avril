const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ui')
    .setDescription('Mostra informações do usuário.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário para mostrar as informações')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('usuario') || interaction.user;
      let member;

      try {
        member = await interaction.guild.members.fetch(user.id);
      } catch {}

      const res = await fetch(`https://pawsy.gay/api/userinfo?id=${user.id}`);
      if (!res.ok)
        return interaction.editReply('❌ | Não consegui acessar a API externa.');

      const apiData = await res.json();
      let badgesRaw = apiData.badges || [];

      if (typeof badgesRaw === 'string') {
        badgesRaw = badgesRaw.replace(/["']/g, '')
          .split(',')
          .map(b => b.trim())
          .filter(Boolean);
      }
      if (!Array.isArray(badgesRaw)) badgesRaw = [];

      const badgeEmojis = {
        Nitro: '<:nitro:1380664162513981640>',
        certified_moderator: '<:mod:1380715098900795412>',
        'HypeSquad Events': '<:hype:1380694353823010866>',
        'HypeSquad Balance': '<:HypeSquad_Balance:1382077144418746581>',
        'HypeSquad Brilliance': '<:HypeSquad_Brilliance:1382077150642831514>',
        'HypeSquad Bravery': '<:HypeSquad_Bravery:1382077147220279459>',
        'Bug Hunter Level 1': '<:Bug_Hunter:1380709298702782545>',
        'Bug Hunter Level 2': '<:Bug_Hunter_level:1380709319691075735>',
        'Desenvolvedor Ativo': '<:devpobre:1382077312522129449>',
        'Desenvolvedor Verificado': '<:dev:1380694437939777628>',
        'Discord Partner': '<:partner:1380712121381294172>',
        'Early Supporter': '<:ggps_:1380700204029972601>',
      };

      const userBadges = badgesRaw
        .map(b => badgeEmojis[b] || `\`${b}\``)
        .join(' ') || 'Nenhuma';

      const authorName = member?.nickname
        ? `${user.tag} (${member.nickname})`
        : user.tag;

      const embedDescription =
`**<:4branco_estrela:1333712393133490187>stalkeando** [\`${member?.nickname || user.username}\`](https://discord.com/users/${user.id})

<:members:1382075056867381358> **Username:**
\`\`\`
${user.username}
\`\`\`<:r_discord_id:1382075060113641472> **ID:**
\`\`\`
${user.id}
\`\`\`
-# <:white_7midias:1382075229639282688> **Badges:** ${userBadges}

<:z_whiteregra:1330271051082371188> Conta criada em:
<t:${Math.floor(user.createdTimestamp / 1000)}> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`;

      const embed = new EmbedBuilder()
        .setColor('#ffffff')
        .setAuthor({ name: authorName, iconURL: user.displayAvatarURL() })
        .setThumbnail(user.displayAvatarURL())
        .setDescription(embedDescription)
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      const embedsToSend = [embed];

      if (member) {
        const joinedAt = member.joinedTimestamp
          ? `<t:${Math.floor(member.joinedTimestamp / 1000)}> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`
          : 'Desconhecido';

        const highestRole = member.roles.highest;
        const roleDisplay = highestRole && highestRole.id !== interaction.guild.id
          ? `<@&${highestRole.id}>`
          : 'Nenhum cargo relevante';

        const isOwner = interaction.guild.ownerId === member.id;

        const embed2 = new EmbedBuilder()
          .setColor('#ffffff')
          .setTitle('📌 Informações do servidor')
          .setDescription(
`**<:4branco_estrela:1333712393133490187>Entrou no servidor em:**  
${joinedAt}

<:v_branco4:1382060159139844196> **Cargo mais alto:** ${roleDisplay}

${isOwner ? '👑 **Usuário contém a coroa!**' : ''}`)
          .setFooter({ text: `Servidor: ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        embedsToSend.push(embed2);
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('view_avatar')
          .setLabel('Ver avatar global do usuário')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: embedsToSend, components: [row] });

      const collector = interaction.channel.createMessageComponentCollector({
        time: 60_000,
        filter: (i) =>
          i.customId === 'view_avatar' && i.user.id === interaction.user.id
      });

      collector.on('collect', async i => {
        if (i.replied || i.deferred) return;

        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });

        const embedAvatar = new EmbedBuilder()
          .setColor('#ffffff')
          .setTitle(`🖼️ Avatar global de ${user.username}`)
          .setImage(avatarURL)
          .setFooter({ text: `ID: ${user.id}` });

        const downloadRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Download')
            .setStyle(ButtonStyle.Link)
            .setURL(avatarURL)
            .setEmoji('<:links:1329724255163781150>')
        );

        await i.reply({
          embeds: [embedAvatar],
          components: [downloadRow],
          ephemeral: true
        });
      });

    } catch (error) {
      console.error('Erro no comando /ui:', error);
      if (interaction.deferred || interaction.replied)
        await interaction.editReply('❌ | Ocorreu um erro ao executar o comando.');
      else
        await interaction.reply({ content: '❌ | Ocorreu um erro.', ephemeral: true });
    }
  }
};