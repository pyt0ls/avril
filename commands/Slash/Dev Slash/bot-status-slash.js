const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../../config.js'); // IDs dos donos

const maintenanceFile = path.resolve(__dirname, '../../../database/maintenance.json');

function saveMaintenance(status) {
  fs.writeFileSync(maintenanceFile, JSON.stringify(status, null, 2));
}

function loadMaintenance() {
  if (!fs.existsSync(maintenanceFile)) {
    return { active: false, reason: '' };
  }
  return JSON.parse(fs.readFileSync(maintenanceFile));
}

module.exports = {
  global: false, // só registra na guild

  data: new SlashCommandBuilder()
    .setName('bot-status')
    .setDescription('Ativa ou desativa o modo manutenção.')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Defina "on" para ativar ou "off" para modo manutenção!')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' },
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Motivo da manutenção (opcional)')
        .setRequired(false)),

  async execute(interaction) {
    // Verifica se o usuário é dono
    if (!OWNERS.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Somente meus desenvolvedores podem usar esse comando.', ephemeral: true });
    }

    const status = interaction.options.getString('status');
    const reason = interaction.options.getString('reason')?.trim() || '';

    if (status === 'on') {
      // Ativa modo online
      saveMaintenance({ active: false, reason: '' });

      const embedOnline = new EmbedBuilder()
        .setColor(0xfa8072)
        .setTitle('Status do bot')
        .setDescription('✅️ ╸Encontra-se Online')
        .setFooter({ text: `developer ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }));

      return interaction.reply({ embeds: [embedOnline], ephemeral: true });
    }

    if (status === 'off') {
      // Ativa modo manutenção
      saveMaintenance({ active: true, reason });

      const embedMaintenance = new EmbedBuilder()
        .setColor(0xfa8072)
        .setTitle('Status do bot')
        .addFields(
          { name: '🚧 Status do bot', value: '✅️ ╸**Em manutenção**' },
          { name: '📋 ╸Razão:', value: reason || 'Nenhum motivo especificado' },
        )
        .setFooter({ text: `developer ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }));

      return interaction.reply({ embeds: [embedMaintenance], ephemeral: true });
    }

    // Caso algo estranho aconteça, manda mensagem
    return interaction.reply({ content: 'Status inválido. Use "on" para ativar ou "off" para desativar com motivo.', ephemeral: true });
  },
};