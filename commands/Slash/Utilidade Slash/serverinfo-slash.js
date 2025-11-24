const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Mostra informações do servidor (pode usar ID de servidor opcional)')
    .addStringOption(option =>
      option.setName('guild_id')
        .setDescription('ID do servidor para puxar as informações')
        .setRequired(false)),

  async execute(interaction) {
    let guild;

    const guildId = interaction.options.getString('guild_id');
    const client = interaction.client;

    if (guildId) {
      guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return interaction.reply({ content: '❌ Não foi possível encontrar o servidor com esse ID. O bot provavelmente não está nele ou o ID está incorreto.', ephemeral: true });
      }
    } else {
      guild = interaction.guild;
      if (!guild) return interaction.reply({ content: '❌ Este comando só pode ser usado dentro de um servidor ou forneça um ID válido.', ephemeral: true });
    }

    let owner;
    try {
      owner = await guild.fetchOwner();
    } catch {
      return interaction.reply({ content: '❌ Não foi possível obter o dono do servidor.', ephemeral: true });
    }

    const createdTimestamp = Math.floor((guild.id / 4194304 + 1420070400000) / 1000);
    const ownerCreatedTimestamp = Math.floor((owner.id / 4194304 + 1420070400000) / 1000);

    const embed = new EmbedBuilder()
      .setColor('#47ff00')
      .setTitle('Informações do Servidor')
      .setDescription('Aqui estão as informações detalhadas do servidor:')
      .addFields(
        {
          name: '🌐 Principal:',
          value:
            `> 🗯️ Nome: **${guild.name}**\n` +
            `> ℹ️ ID: \`${guild.id}\`\n` +
            `> 📅 Criado: <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)\n` +
            `> 🌟 Proprietário(a): [${owner.user.tag}](https://discordapp.com/users/${owner.id})`,
        },
        {
          name: '🔎 Estatísticas:',
          value:
            `> ⚜️ Cargos: \`${guild.roles.cache.size}\`\n` +
            `> #️⃣ Canais: \`${guild.channels.cache.size}\`\n` +
            `> 🤪 Emojis: \`${guild.emojis.cache.size}\`\n` +
            `> 👤 Membros: \`${guild.memberCount ?? 'Desconhecido'}\``,
        },
        {
          name: '🌟 Proprietário(a):',
          value:
            `> 🌟 Nome: ${owner.user.tag}\n` +
            `> 💫 Menção: <@${owner.id}>\n` +
            `> ℹ️ ID: \`${owner.id}\`\n` +
            `> 📅 Criado: <t:${ownerCreatedTimestamp}:F> (<t:${ownerCreatedTimestamp}:R>)`,
        }
      )
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }) || null)
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
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

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};