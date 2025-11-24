const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desconect-call')
    .setDescription('Desconecta o bot de um canal de voz.')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
      return interaction.editReply({ 
        content: '❌ Você não tem permissão para usar este comando.' 
      });
    }

    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return interaction.editReply({ content: '❌ O bot não está conectado a nenhum canal de voz.' });
    }

    try {
      connection.destroy();
      await interaction.editReply({ content: '✅ Bot desconectado do canal de voz.' });
    } catch (err) {
      console.error('Erro ao desconectar do canal de voz:', err);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao tentar desconectar do canal de voz.' });
    }
  }
};