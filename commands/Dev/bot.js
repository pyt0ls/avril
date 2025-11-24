const fs = require('fs');
const path = require('path');
const { OWNERS } = require('../../config.js'); // IDs dos donos

const maintenanceFile = path.resolve(__dirname, '../../database/maintenance.json');

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
  name: 'bot',
  description: 'Ativa ou desativa o bot (modo online ou manutenção).',
  execute(message, args) {
    if (!OWNERS.includes(message.author.id)) {
      return message.reply('❌ Somente meus desenvolvedores podem usar esse comando.');
    }

    if (args.length === 0) {
      return message.reply('Use: !bot <on|off> [motivo]');
    }

    const status = args[0].toLowerCase();

    if (status !== 'on' && status !== 'off') {
      return message.reply('Status inválido. Use "on" para ativar ou "off" para desativar com motivo.');
    }

    if (status === 'on') {
      // Ativa online
      saveMaintenance({ active: false, reason: '' });

      return message.channel.send({
        embeds: [{
          color: 0xfa8072,
          title: 'Status do bot',
          description: '✅️ ╸Encontra-se Online',
          footer: {
            text: `developer ${message.author.username}`,
            icon_url: message.author.displayAvatarURL({ dynamic: true }),
          },
          thumbnail: {
            url: message.client.user.displayAvatarURL({ dynamic: true }),
          },
        }],
      });
    }

    // status == off -> modo manutenção
    const reason = args.slice(1).join(' ').trim();

    // permite razão opcional, sem erro
    saveMaintenance({ active: true, reason });

    return message.channel.send({
      embeds: [{
        color: 0xfa8072,
        title: 'Status do bot',
        fields: [
          { name: '🚧 Status do bot', value: '✅️ ╸**Em manutenção**' },
          { name: '📋 ╸Razão:', value: `❔️ ${reason || 'Nenhum motivo especificado'}` },
        ],
        footer: {
          text: `developer ${message.author.username}`,
          icon_url: message.author.displayAvatarURL({ dynamic: true }),
        },
        thumbnail: {
          url: message.client.user.displayAvatarURL({ dynamic: true }),
        },
      }],
    });
  },
};