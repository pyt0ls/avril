const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod-disable')
    .setDescription('Remove todas as regras de AutoMod criadas pelo bot, incluindo regras antigas.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const member = interaction.member;

    // Verifica permissão de administrador
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Você precisa da permissão **Administrador** para usar este comando.',
        ephemeral: true,
      });
    }

    const guild = interaction.guild;

    try {
      await interaction.deferReply({ ephemeral: true }); // Segura a interação

      const existingRules = await guild.autoModerationRules.fetch();

      // Lista de regras que o bot considera "suas"
      const botRuleNames = [
        'Filtro de palavrões',
        'Filtro de links e conteúdo sexual',
        'Filtro de menções em massa',
        'Filtro de spam de palavras',
      ];

      let deletedCount = 0;

      for (const [ruleId, rule] of existingRules) {
        // Ignora regras do sistema que não podem ser deletadas
        if (rule.managed) continue;

        // Se o nome da regra bate com a lista, deleta
        if (botRuleNames.includes(rule.name)) {
          try {
            await rule.delete();
            deletedCount++;
            console.log(`✅ Regra deletada: ${rule.name}`);
          } catch (error) {
            console.error(`⚠️ Não foi possível deletar a regra "${rule.name}":`, error);
          }
        }
      }

      if (deletedCount === 0) {
        await interaction.editReply({ content: '❌ Nenhuma regra do AutoMod encontrada para remoção.' });
      } else {
        await interaction.editReply({ content: `✅ ${deletedCount} regras do AutoMod foram removidas com sucesso!` });
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao remover as regras do AutoMod.' });
    }
  },
};