const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const afkFile = path.resolve(__dirname, '../../../database/afk.json');
const afkGlobalFile = path.resolve(__dirname, '../../../database/afk_global.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Ativa o modo AFK local ou global.')
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Escolha o tipo de AFK')
        .setRequired(true)
        .addChoices(
          { name: 'Local (só neste servidor)', value: 'local' },
          { name: 'Global (todos os servidores)', value: 'global' }
        )
    )
    .addStringOption(option =>
      option.setName('motivo')
        .setDescription('Motivo do AFK')
        .setRequired(false)
    ),

  async execute(interaction) {
    const tipo = interaction.options.getString('tipo');
    const reason = interaction.options.getString('motivo') || 'Nenhum';
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const user = interaction.member;

    if (tipo === 'local') {
      let afkData = {};
      if (fs.existsSync(afkFile)) afkData = JSON.parse(fs.readFileSync(afkFile, 'utf8'));
      if (!afkData[guildId]) afkData[guildId] = {};

      const oldNick = user.nickname || interaction.user.username;

      afkData[guildId][userId] = {
        reason,
        timestamp: Date.now(),
        oldNick
      };

      fs.writeFileSync(afkFile, JSON.stringify(afkData, null, 4));

      if (interaction.guild.members.me.permissions.has('ManageNicknames')) {
        const afkNick = `[AFK] ${oldNick}`;
        if (user.nickname !== afkNick && afkNick.length <= 32) {
          await user.setNickname(afkNick).catch(() => {});
        }
      }

      await interaction.reply({
        content: `🌛 Você agora está **AFK**! O modo AFK será desativado quando você falar algo no chat!`,
        ephemeral: false
      });

    } else if (tipo === 'global') {
      let globalData = {};
      if (fs.existsSync(afkGlobalFile)) globalData = JSON.parse(fs.readFileSync(afkGlobalFile, 'utf8'));

      globalData[userId] = {
        reason,
        timestamp: Date.now(),
        username: interaction.user.username
      };

      fs.writeFileSync(afkGlobalFile, JSON.stringify(globalData, null, 4));

      await interaction.reply({
        content: `😴 Você agora está **AFK GLOBAL**! O modo AFK será desativado quando você falar algo!`,
        ephemeral: false
      });
    }
  }
};