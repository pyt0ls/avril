const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config'); // ajuste conforme sua estrutura

const lembretesPath = path.resolve(__dirname, '../../database/lembretes.json');
const prefixesPath = path.resolve(__dirname, '../../database/prefixos.json');

// Utilitários
function loadLembretes() {
  if (!fs.existsSync(lembretesPath)) return {};
  return JSON.parse(fs.readFileSync(lembretesPath, 'utf8'));
}

function saveLembretes(data) {
  fs.writeFileSync(lembretesPath, JSON.stringify(data, null, 4));
}

function removeLembrete(id) {
  const data = loadLembretes();
  delete data[id];
  saveLembretes(data);
}

module.exports = {
  name: 'lembrete',
  aliases: ['lemb', 'lembrar', 'reminder'],
  description: 'Define um lembrete com aviso por DM ou canal.',

  async execute(message, args, client) {
    // Definir prefixo personalizado ou padrão
    let prefix = config.PREFIX;
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (message.guild && prefixDB[message.guild.id]) {
        prefix = prefixDB[message.guild.id];
      }
    }

    // Validação de argumentos
    if (!Array.isArray(args) || args.length < 2) {
      return message.reply(`❌ Uso correto: \`${prefix}lembrete <tempo> <mensagem>\``);
    }

    const [tempoStr, ...mensagemArray] = args;
    const mensagem = mensagemArray.join(' ');
    const userId = message.author.id;

    const match = tempoStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return message.reply('⏱️ Tempo inválido! Use `10s`, `5m`, `1h`, `2d`, etc.');
    }

    const unidades = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const tempoMs = parseInt(match[1]) * unidades[match[2]];
    const lembreteId = `${userId}_${Date.now()}`;
    const criadoEm = Math.floor(Date.now() / 1000);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('lembrete_dm')
        .setLabel('Receber por DM')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lembrete_chat')
        .setLabel('Receber aqui no canal')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({
      content: '🔔 Onde você quer receber o lembrete?',
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === userId && ['lembrete_dm', 'lembrete_chat'].includes(i.customId),
      max: 1,
      time: 15000
    });

    collector.on('collect', async i => {
      const destino = i.customId === 'lembrete_dm' ? 'dm' : 'canal';

      const lembretes = loadLembretes();
      lembretes[lembreteId] = {
        userId,
        canalId: message.channel.id,
        mensagem,
        destino,
        timestamp: Date.now() + tempoMs,
        criadoEm
      };
      saveLembretes(lembretes);

      await i.update({
        content: `✅ Lembrete salvo! Você será lembrado em ${tempoStr} via **${destino === 'dm' ? 'DM' : 'canal'}**.`,
        components: []
      });

      setTimeout(async () => {
        const lembrete = loadLembretes()[lembreteId];
        if (!lembrete) return;

        const user = await client.users.fetch(lembrete.userId).catch(() => null);
        const canal = await client.channels.fetch(lembrete.canalId).catch(() => null);

        const texto =
`# <:bot:1382073343804440609> Opa <@${userId}>, aqui está o seu lembrete!
 - -# **<:v_branco4:1382060159139844196> Informações sobre esse lembrete:**
   - -# <:relogio:1343477670251462711> **Definido:** <t:${lembrete.criadoEm}:F> (<t:${lembrete.criadoEm}:R>)
   - -# <:z_whiteregra:1330271051082371188> **Motivo**: \`${lembrete.mensagem}\``;

        if (lembrete.destino === 'dm' && user) {
          user.send({ content: texto }).catch(() => {
            if (canal) canal.send({ content: `<@${userId}> não pôde receber DM. ${texto}` });
          });
        } else if (canal) {
          canal.send({ content: texto });
        }

        removeLembrete(lembreteId);
      }, tempoMs);
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        msg.edit({ content: '⏳ Tempo esgotado. Nenhuma opção escolhida.', components: [] });
      }
    });
  }
};