const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const dbPath = './database/antilink.json';

module.exports = {
  name: 'antilink',
  description: 'Ativa ou desativa o sistema de antilinks do servidor.',
  async execute(message) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ Você precisa da permissão `Gerenciar Mensagens` para usar este comando.');
    }

    const guildId = message.guild.id;

    // Carrega o JSON
    let db = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    // Garante que o servidor tem entrada no JSON
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

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
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

      await interaction.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', () => {
      msg.edit({ components: [] });
    });
  }
};