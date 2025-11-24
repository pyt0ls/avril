const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'serverinfo',
  description: 'Mostra informações do servidor (pode usar ID de servidor opcional)',
  category: 'Utilidades',

  async execute(message, args, client) {
    let guild;

    // Verifica se foi passado um ID
    if (args[0]) {
      const guildId = args[0];
      guild = client.guilds.cache.get(guildId);

      if (!guild) {
        return message.reply('❌ Não foi possível encontrar o servidor com esse ID. O bot provavelmente não está nele ou o ID está incorreto.');
      }
    } else {
      // Se não foi passado ID, usa o servidor atual
      guild = message.guild;
      if (!guild) return message.reply('❌ Este comando só pode ser usado dentro de um servidor ou forneça um ID de servidor válido.');
    }

    // Tenta buscar o dono do servidor
    let owner;
    try {
      owner = await guild.fetchOwner();
    } catch (err) {
      return message.reply('❌ Não foi possível obter o dono do servidor.');
    }

    // Timestamp de criação do servidor e do dono
    const createdTimestamp = Math.floor((guild.id / 4194304 + 1420070400000) / 1000);
    const ownerCreatedTimestamp = Math.floor((owner.id / 4194304 + 1420070400000) / 1000);

    const embed = new EmbedBuilder()
      .setColor('#47ff00')
      .setTitle('Informações do Servidor')
      .setDescription('Aqui estão as informações detalhadas do servidor:')
      .addFields(
        { name: '🌐 Principal:', value:
          `> 🗯️ Nome: **${guild.name}**\n` +
          `> ℹ️ ID: \`${guild.id}\`\n` +
          `> 📅 Criado: <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)\n` +
          `> 🌟 Proprietário(a): [${owner.user.tag}](https://discordapp.com/users/${owner.id})`
        },
        { name: '🔎 Estatísticas:', value:
          `> ⚜️ Cargos: \`${guild.roles.cache.size}\`\n` +
          `> #️⃣ Canais: \`${guild.channels.cache.size}\`\n` +
          `> 🤪 Emojis: \`${guild.emojis.cache.size}\`\n` +
          `> 👤 Membros: \`${guild.memberCount ?? 'Desconhecido'}\``
        },
        { name: '🌟 Proprietário(a):', value:
          `> 🌟 Nome: ${owner.user.tag}\n` +
          `> 💫 Menção: <@${owner.id}>\n` +
          `> ℹ️ ID: \`${owner.id}\`\n` +
          `> 📅 Criado: <t:${ownerCreatedTimestamp}:F> (<t:${ownerCreatedTimestamp}:R>)`
        }
      )
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }) || null)
      .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('iconserver')
          .setPlaceholder('Nada Selecionado.')
          .addOptions(
            {
              label: 'Baixar Icon',
              description: 'Clique para visualizar o avatar',
              value: 'icsv',
              emoji: '🔗',
            },
            {
              label: 'Baixar Banner',
              description: 'Clique para visualizar o banner',
              value: 'bnsv',
              emoji: '🔗',
            }
          )
      );

    return message.reply({ embeds: [embed], components: [row] });
  }
};