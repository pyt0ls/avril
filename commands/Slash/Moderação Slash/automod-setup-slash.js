const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod-setup')
    .setDescription('Configura regras básicas do AutoMod.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const member = interaction.member;

    // Verifica permissão
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Você precisa da permissão **Administrador** para usar este comando.',
        ephemeral: true,
      });
    }

    const guild = interaction.guild;

    try {
      await interaction.deferReply({ ephemeral: true });

      // Lista de regras que o bot vai criar
      const rulesToCreate = [
        {
          name: 'Filtro de palavrões',
          triggerType: 1,
          triggerMetadata: {
            keywordFilter: ['palavrão1', 'palavrão2', 'ofensa'],
          },
        },
        {
          name: 'Filtro de links e conteúdo sexual',
          triggerType: 5,
          triggerMetadata: {
            presets: [1, 2], // 1 = Links Maliciosos, 2 = Conteúdo Sexual
          },
        },
        {
          name: 'Filtro de menções em massa',
          triggerType: 4,
          triggerMetadata: {
            mentionTotalLimit: 4,
          },
        },
        {
          name: 'Filtro de spam de palavras',
          triggerType: 1,
          triggerMetadata: {
            keywordFilter: ['spam1', 'spam2', 'spam3'],
          },
        },
      ];

      const existingRules = await guild.autoModerationRules.fetch();
      let createdCount = 0;

      for (const rule of rulesToCreate) {
        // Busca regra duplicada por nome
        const duplicateByName = existingRules.find(r => r.name === rule.name);

        // Para tipo 5, apenas verifica se já existe qualquer regra tipo 5
        const duplicateType5 = rule.triggerType === 5 
          ? existingRules.find(r => r.triggerType === 5) 
          : null;

        if (duplicateByName) {
          try {
            await duplicateByName.delete();
            console.log(`♻️ Regra removida por nome: ${rule.name}`);
          } catch (err) {
            console.log(`⚠️ Não consegui remover a regra existente (${rule.name}), ignorando...`);
          }
        }

        if (duplicateType5) {
          console.log(`⚠️ Já existe uma regra tipo 5, pulando criação: ${rule.name}`);
          continue; // Não cria nova regra tipo 5 se já existe
        }

        // Para outros tipos (1, 4), deleta duplicadas por triggerType se não for tipo 5
        if (rule.triggerType !== 5) {
          const duplicateByType = existingRules.find(r => r.triggerType === rule.triggerType);
          if (duplicateByType) {
            try {
              await duplicateByType.delete();
              console.log(`♻️ Regra removida por tipo: ${rule.name}`);
            } catch (err) {
              console.log(`⚠️ Não consegui remover a regra existente (${rule.name}), ignorando...`);
            }
          }
        }

        // Cria a regra
        await guild.autoModerationRules.create({
          name: rule.name,
          creatorId: guild.ownerId,
          enabled: true,
          eventType: 1,
          triggerType: rule.triggerType,
          triggerMetadata: rule.triggerMetadata,
          actions: [
            {
              type: 1,
              metadata: {
                customMessage: 'Mensagem bloqueada pela moderação automática do **Avril**.',
              },
            },
          ],
        });

        createdCount++;
        console.log(`✅ Regra criada: ${rule.name}`);
      }

      await interaction.editReply({
        content: `✅ ${createdCount} regras configuradas com sucesso!`,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao configurar o AutoMod.',
      });
    }
  },
};