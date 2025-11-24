const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { OWNERS } = require('../../../config');

const dbPath = path.join(__dirname, '../../../database/blacklist.json');
const LOG_CHANNEL_ID = '1385323701385433189'; // Canal de log

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
}

module.exports = {
  global: false, // só registra na guild

  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Gerencia a blacklist de usuários (Apenas Donos)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Adiciona um usuário à blacklist')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuário para adicionar')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('motivo')
            .setDescription('Motivo da blacklist')
            .setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('rmv')
        .setDescription('Remove um usuário da blacklist')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuário para remover')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('check')
        .setDescription('Verifica se um usuário está na blacklist')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuário para checar')
            .setRequired(true))
    ),

  async execute(interaction) {
    if (!OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: '🚫 Apenas desenvolvedores do bot podem usar este comando.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('usuario');
    const userId = user.id;
    const motivo = interaction.options.getString('motivo') || 'Não informado';
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    if (subcommand === 'add') {
      if (db[userId]) return interaction.reply({ content: '⚠️ Este usuário já está na blacklist.', ephemeral: true });

      db[userId] = {
        motivo,
        adicionadoPor: interaction.user.tag,
        data: new Date().toISOString()
      };

      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('🚫 Usuário Adicionado à Blacklist')
        .setColor('Red')
        .addFields(
          { name: '👤 Usuário', value: `${user.tag} (\`${userId}\`)`, inline: true },
          { name: '📄 Motivo', value: motivo, inline: true },
          { name: '👮‍♂️ Por', value: interaction.user.tag }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const logChannel = interaction.client.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [embed] });

    } else if (subcommand === 'rmv') {
      if (!db[userId]) return interaction.reply({ content: '❌ Este usuário não está na blacklist.', ephemeral: true });

      delete db[userId];
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      const replyMsg = `✅ O usuário \`${user.tag}\` foi removido da blacklist.`;
      await interaction.reply({ content: replyMsg });

      const logEmbed = new EmbedBuilder()
        .setTitle('✅ Usuário Removido da Blacklist')
        .setColor('Green')
        .addFields(
          { name: '👤 Usuário', value: `${user.tag} (\`${userId}\`)`, inline: true },
          { name: '👮‍♂️ Por', value: interaction.user.tag }
        )
        .setTimestamp();

      const logChannel = interaction.client.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [logEmbed] });

    } else if (subcommand === 'check') {
      if (!db[userId]) return interaction.reply({ content: `✅ O usuário \`${user.tag}\` **não está** na blacklist.`, ephemeral: true });

      const info = db[userId];
      const embed = new EmbedBuilder()
        .setTitle('📋 Blacklist Info')
        .setColor('DarkRed')
        .addFields(
          { name: '👤 Usuário', value: `${user.tag} (\`${userId}\`)`, inline: true },
          { name: '📄 Motivo', value: info.motivo, inline: true },
          { name: '👮‍♂️ Adicionado por', value: info.adicionadoPor || 'Desconhecido' },
          { name: '🕒 Data', value: `<t:${Math.floor(new Date(info.data).getTime() / 1000)}:R>` }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};