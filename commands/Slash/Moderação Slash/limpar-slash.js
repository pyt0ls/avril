const { 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  ChannelType 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('Limpa mensagens de um usuário específico no canal atual.')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário cujas mensagens serão apagadas')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade de mensagens para apagar (1 a 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    // Permissão já é checada pelo Discord pelo setDefaultMemberPermissions, mas vamos reforçar:
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ Você precisa da permissão **Gerenciar Mensagens** para usar este comando.', ephemeral: true });
    }

    const user = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('quantidade');
    const channel = interaction.channel;

    await interaction.deferReply({ ephemeral: true }); // defer para comandos que demoram

    try {
      // Busca últimas 100 mensagens do canal
      const messages = await channel.messages.fetch({ limit: 100 });
      // Filtra mensagens do usuário alvo
      const userMessages = messages.filter(m => m.author.id === user.id).first(amount);

      if (!userMessages.length) {
        return interaction.editReply(`❌ Não encontrei mensagens do usuário ${user.tag} para apagar.`);
      }

      // Apaga as mensagens filtradas
      await channel.bulkDelete(userMessages, true);

      return interaction.editReply(`✅ Apaguei ${userMessages.length} mensagens de ${user.tag}.`);
    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Não foi possível apagar as mensagens.');
    }
  }
};