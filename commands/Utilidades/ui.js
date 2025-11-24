const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  name: 'ui',
  description: 'Mostra informações do usuário e suas badges da API Pawsy.',
  category: 'Utilidades',

  async execute(message, args = []) {
    try {
      await message.channel.sendTyping();
      const client = message.client;
      const userId = args.length ? args[0].replace(/[<@!>]/g, '') : message.author.id;

      // Fetch do usuário
      let user;
      try {
        user = await client.users.fetch(userId);
      } catch {
        return message.channel.send('❌ | Usuário inválido ou não encontrado.');
      }

      // Fetch do membro do servidor
      let member = null;
      try {
        member = await message.guild.members.fetch(userId);
      } catch {}

      // Fetch da API Pawsy
      const res = await fetch(`https://pawsy.gay/api/userinfo?id=${userId}`);
      if (!res.ok) return message.channel.send('❌ | Não consegui acessar a API externa.');
      const apiData = await res.json();

      // Badges
      let badgesRaw = apiData.badges || [];
      if (typeof badgesRaw === 'string') {
        badgesRaw = badgesRaw
          .replace(/["']/g, '')
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

      // Embed principal
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
        .setAuthor({ name: authorName, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(embedDescription)
        .setFooter({ text: `Solicitado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      const embedsToSend = [embed];

      // Embed do servidor
      if (member) {
        const joinedAt = member.joinedTimestamp
          ? `<t:${Math.floor(member.joinedTimestamp / 1000)}> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`
          : 'Desconhecido';

        const highestRole = member.roles.highest;
        const roleDisplay = highestRole && highestRole.id !== message.guild.id
          ? `<@&${highestRole.id}>`
          : 'Nenhum cargo relevante';

        const isOwner = message.guild.ownerId === member.id;

        const embed2 = new EmbedBuilder()
          .setColor('#ffffff')
          .setTitle('📌 Informações do servidor')
          .setDescription(
`<:4branco_estrela:1333712393133490187> **Entrou no servidor em:**  
${joinedAt}

<:v_branco4:1382060159139844196> **Cargo mais alto:** ${roleDisplay}

${isOwner ? '👑 **Usuário contém a coroa!**' : ''}`)
          .setFooter({ text: `Servidor: ${message.guild.name}`, iconURL: message.guild.iconURL() })
          .setTimestamp();

        embedsToSend.push(embed2);
      }

      // Construindo os botões
      const buttons = new ActionRowBuilder();

      // Botão Avatar Global
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId('view_avatar')
          .setLabel('Avatar Global')
          .setStyle(ButtonStyle.Secondary)
      );

      // Botão Avatar do Servidor (só se existir)
      if (member?.avatar) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('view_server_avatar')
            .setLabel('Avatar do Servidor')
            .setStyle(ButtonStyle.Secondary)
        );
      }

      // Botão Banner (só se existir)
      if (user.banner) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId('view_banner')
            .setLabel('Banner')
            .setStyle(ButtonStyle.Secondary)
        );
      }

      // Botão Nomes Anteriores
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId('view_previous_names')
          .setLabel('Nomes Anteriores')
          .setStyle(ButtonStyle.Secondary)
      );

      // Botão Cor do Perfil
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId('view_color')
          .setLabel('Cor do Perfil')
          .setStyle(ButtonStyle.Secondary)
      );

      // Enviando mensagem
      const sentMsg = await message.channel.send({
        embeds: embedsToSend,
        components: [buttons]
      });

      // Collector
      const collector = sentMsg.createMessageComponentCollector({
        time: 60_000,
        filter: (i) => i.user.id === message.author.id
      });

      collector.on('collect', async (interaction) => {
        if (interaction.replied || interaction.deferred) return;

        let embedEphemeral;
        let rowEphemeral = new ActionRowBuilder();

        switch (interaction.customId) {
          case 'view_avatar':
            {
              const avatarURL = user.displayAvatarURL({ size: 1024, dynamic: true });
              embedEphemeral = new EmbedBuilder()
                .setColor('#ffffff')
                .setTitle(`🖼️ Avatar global de ${user.username}`)
                .setImage(avatarURL)
                .setFooter({ text: `ID: ${user.id}` });

              rowEphemeral.addComponents(
                new ButtonBuilder()
                  .setLabel('Download')
                  .setStyle(ButtonStyle.Link)
                  .setURL(avatarURL)
                  .setEmoji('<:links:1329724255163781150>')
              );
            }
            break;

          case 'view_server_avatar':
            if (!member?.avatar) {
              return interaction.reply({ content: '❌ Usuário não possui avatar no servidor.', flags: 64 });
            }
            {
              const serverAvatarURL = member.displayAvatarURL({ size: 1024, dynamic: true });
              embedEphemeral = new EmbedBuilder()
                .setColor('#ffffff')
                .setTitle(`🖼️ Avatar do servidor de ${user.username}`)
                .setImage(serverAvatarURL)
                .setFooter({ text: `ID: ${user.id}` });

              rowEphemeral.addComponents(
                new ButtonBuilder()
                  .setLabel('Download')
                  .setStyle(ButtonStyle.Link)
                  .setURL(serverAvatarURL)
                  .setEmoji('<:links:1329724255163781150>')
              );
            }
            break;

          case 'view_banner':
            if (!user.banner) {
              return interaction.reply({ content: '❌ Usuário não possui banner.', flags: 64 });
            }
            {
              const bannerURL = user.bannerURL({ size: 1024, dynamic: true });
              embedEphemeral = new EmbedBuilder()
                .setColor('#ffffff')
                .setTitle(`🖼️ Banner de ${user.username}`)
                .setImage(bannerURL)
                .setFooter({ text: `ID: ${user.id}` });

              rowEphemeral.addComponents(
                new ButtonBuilder()
                  .setLabel('Download')
                  .setStyle(ButtonStyle.Link)
                  .setURL(bannerURL)
                  .setEmoji('<:links:1329724255163781150>')
              );
            }
            break;

          case 'view_previous_names':
            {
              const names = apiData.previous_usernames?.join('\n') || 'Nenhum registro';
              embedEphemeral = new EmbedBuilder()
                .setColor('#ffffff')
                .setTitle(`📝 Nomes anteriores de ${user.username}`)
                .setDescription(names)
                .setFooter({ text: `ID: ${user.id}` });
            }
            break;

          case 'view_color':
            {
              const color = user.accent_color ? `#${user.accent_color.toString(16).padStart(6, '0')}` : '#777788';
              embedEphemeral = new EmbedBuilder()
              .setColor(user.accent_color ?? '#ffffff')
                .setTitle(`🎨 Cor do perfil de ${user.username}`)
                .setDescription(color)
                .setFooter({ text: `ID: ${user.id}` });
            }
            break;

          default:
            return;
        }

        // Resposta do botão
        await interaction.reply({
          embeds: [embedEphemeral],
          components: rowEphemeral.components.length ? [rowEphemeral] : [],
          flags: 64
        });
      });

      collector.on('end', async () => {
        // Desativa os botões após o tempo
        const disabledRow = new ActionRowBuilder().addComponents(
          buttons.components.map(b => b.setDisabled(true))
        );
        sentMsg.edit({ components: [disabledRow] }).catch(() => {});
      });

    } catch (error) {
      console.error('Erro no comando ui:', error);
      return message.channel.send('❌ | Ocorreu um erro ao executar o comando.');
    }
  },
};