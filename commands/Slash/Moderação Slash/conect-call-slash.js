const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField, MessageFlags } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('conect-call')
    .setDescription('Conecta o bot em um canal de voz.')
    .addBooleanOption(option =>
      option.setName('mutado')
        .setDescription('Fazer o bot entrar mutado e surdo?')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Escolha um canal de voz visível')
        .addChannelTypes(2)
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('canal_id')
        .setDescription('Ou digite o ID do canal manualmente (para canais privados)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const canalSelecionado = interaction.options.getChannel('canal');
    const canalIdDigitado = interaction.options.getString('canal_id');
    const mutado = interaction.options.getBoolean('mutado');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
      return interaction.editReply({
        content: '❌ Você precisa da permissão **Mover Membros** para usar este comando.'
      });
    }

    const canal = canalSelecionado ?? interaction.guild.channels.cache.get(canalIdDigitado);

    if (!canal || !canal.isVoiceBased()) {
      return interaction.editReply({ content: '❌ Canal inválido ou não é de voz.' });
    }

    const botMember = await interaction.guild.members.fetchMe(); // garante que o bot foi buscado corretamente
    const botPermissions = canal.permissionsFor(botMember);

    if (
      !botPermissions.has(PermissionsBitField.Flags.Connect) ||
      !botPermissions.has(PermissionsBitField.Flags.Speak)
    ) {
      return interaction.editReply({
        content: '❌ Eu preciso das permissões **Conectar** e **Falar** no canal de voz selecionado.'
      });
    }

    if (!canal.joinable) {
      return interaction.editReply({
        content: '❌ Não consigo entrar nesse canal de voz. Verifique permissões ou hierarquia de cargos.'
      });
    }

    try {
      const connection = joinVoiceChannel({
        channelId: canal.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: mutado,
        selfMute: mutado
      });

      connection.on("error", (err) => {
        console.error("Erro na conexão de voz:", err);
      });

      await interaction.editReply({
        content: `✅ Conectado ao canal **${canal.name}**\n ${mutado ? '🔇 (mutado e surdo)' : '🔊 (ativo)'}.`
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar conectar ao canal de voz.'
      });
    }
  }
};