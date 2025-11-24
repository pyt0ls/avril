const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const lembretesPath = path.resolve(__dirname, '../../../database/lembretes.json');

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
  data: new SlashCommandBuilder()
    .setName('lembrete')
    .setDescription('Define um lembrete com aviso.')
    .addStringOption(option =>
      option.setName('tempo')
        .setDescription('Quando te lembrar? (ex: 10s, 5m, 1h, 2d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('mensagem')
        .setDescription('O que você quer que eu lembre?')
        .setRequired(true)),

  async execute(interaction) {
    const tempoStr = interaction.options.getString('tempo');
    const mensagem = interaction.options.getString('mensagem');
    const userId = interaction.user.id;

    const match = tempoStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return interaction.reply({ content: '⏱️ Tempo inválido! Use `10s`, `5m`, `1h`, `2d`, etc.', ephemeral: true });
    }

    const unidades = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const tempoMs = parseInt(match[1]) * unidades[match[2]];
    const lembreteId = `${userId}_${Date.now()}`;
    const criadoEm = Math.floor(Date.now() / 1000); // timestamp atual

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

    await interaction.reply({
      content: '🔔 Onde você quer receber o lembrete?',
      components: [row],
      ephemeral: true
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === userId && ['lembrete_dm', 'lembrete_chat'].includes(i.customId),
      max: 1,
      time: 15000
    });

    collector.on('collect', async i => {
      const destino = i.customId === 'lembrete_dm' ? 'dm' : 'canal';

      const lembretes = loadLembretes();
      lembretes[lembreteId] = {
        userId,
        canalId: interaction.channel.id,
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

        const client = i.client;
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
        interaction.editReply({ content: '⏳ Tempo esgotado. Nenhuma opção escolhida.', components: [] });
      }
    });
  }
};