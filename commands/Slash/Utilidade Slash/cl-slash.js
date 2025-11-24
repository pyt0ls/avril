const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const configPath = path.join(__dirname, '../../../database/clConfig.json');

function getConfig(guildId) {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}');
  return data[guildId] || { enabled: false, keyword: 'cl' };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cl')
    .setDescription('Limpa suas próprias mensagens no canal atual.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });

    const guildId = interaction.guild.id;
    const config = getConfig(guildId);

    if (!config.enabled) {
      return interaction.reply({ content: '❌ O sistema de limpeza está desativado neste servidor.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const fetched = await interaction.channel.messages.fetch({ limit: 100 });

      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

      const userMessages = fetched.filter(msg =>
        msg.author.id === interaction.user.id &&
        msg.createdTimestamp > fourteenDaysAgo
      );

      if (userMessages.size === 0) {
        return interaction.editReply('❌ Não encontrei mensagens suas para apagar neste canal.');
      }

      await interaction.channel.bulkDelete(userMessages, true);
      return interaction.editReply(`✅ Foram apagadas **${userMessages.size}** mensagens suas.`);
    } catch (err) {
      console.error('Erro ao limpar mensagens:', err);
      return interaction.editReply('❌ Ocorreu um erro ao tentar apagar suas mensagens.');
    }
  }
};