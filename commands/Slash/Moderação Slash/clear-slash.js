const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpe as mensagens do chat.')
    .addIntegerOption(option =>
      option
        .setName('quantidade')
        .setDescription('Número de mensagens. (Max: 1 a 1000)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
  return interaction.reply({
    content: '❌ Você não tem permissão para gerenciar mensagens.',
    ephemeral: true,
  });
}
    const quantidade = interaction.options.getInteger('quantidade');
    const canal = interaction.channel;

    if (!canal.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ Eu preciso da permissão `Gerenciar Mensagens` para executar este comando.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let apagadasTotal = 0;
      let restante = quantidade;

      while (restante > 0) {
        const apagarAgora = Math.min(restante, 100);
        const mensagens = await canal.bulkDelete(apagarAgora, true);
        apagadasTotal += mensagens.size;

        // Se não conseguir mais apagar, para
        if (mensagens.size < apagarAgora) break;

        restante -= apagarAgora;
      }

      const resposta = await canal.send(`🧹 Apaguei ${apagadasTotal} mensagens!`);
      setTimeout(() => resposta.delete().catch(() => {}), 5000);

      await interaction.editReply({
        content: `✅ ${apagadasTotal} mensagens apagadas com sucesso.`,
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao tentar apagar as mensagens.\n -# Pode haver mensagens com mais de 14 dias, que não podem ser apagadas pela API, tente um número menor ou use "nuke" para reiniciar o canal.',
      });
    }
  },
};