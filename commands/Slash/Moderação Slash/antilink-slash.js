const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');
const fs = require('fs');
const path = require('path'); // <--- Adicione esta linha

const dbPath = path.resolve(__dirname, '../../../database/antilink.json');
// resto do código...

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('Ativa ou desativa o sistema de antilinks do servidor.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages), // só quem tem perm pode usar

  async execute(interaction) {
    const guildId = interaction.guild.id;

    // Verifica permissão manualmente (por segurança extra)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ Você precisa da permissão `Gerenciar Mensagens` para usar este comando.',
        ephemeral: true
      });
    }

    // Lê o banco de dados
    let db = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    // Inicializa o estado se não existir
    if (!db[guildId]) {
      db[guildId] = { enabled: false };
    }

    const estado = db[guildId].enabled ? '🟢 Ativado' : '🔴 Desativado';

    const embed = new EmbedBuilder()
      .setTitle('🔗 Sistema de AntiLinks')
      .setDescription(`Status atual: **${estado}**\n\nClique no botão abaixo para alternar o sistema.`)
      .setColor(db[guildId].enabled ? 0x57F287 : 0xED4245);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_antilink')
        .setLabel(db[guildId].enabled ? 'Desativar' : 'Ativar')
        .setStyle(db[guildId].enabled ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
      ephemeral: false
    });

    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async (i) => {
      db[guildId].enabled = !db[guildId].enabled;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      const newEstado = db[guildId].enabled ? '🟢 Ativado' : '🔴 Desativado';

      const newEmbed = EmbedBuilder.from(embed)
        .setDescription(`Status atual: **${newEstado}**\n\nClique no botão abaixo para alternar o sistema.`)
        .setColor(db[guildId].enabled ? 0x57F287 : 0xED4245);

      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('toggle_antilink')
          .setLabel(db[guildId].enabled ? 'Desativar' : 'Ativar')
          .setStyle(db[guildId].enabled ? ButtonStyle.Danger : ButtonStyle.Success)
      );

      await i.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  }
};