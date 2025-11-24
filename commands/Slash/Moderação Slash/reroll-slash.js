const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const giveawaysPath = path.resolve(__dirname, '../../../database/giveaways.json');

function loadGiveaways() {
  if (!fs.existsSync(giveawaysPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(giveawaysPath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveGiveaways(data) {
  fs.writeFileSync(giveawaysPath, JSON.stringify(data, null, 4));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Sorteia um novo vencedor.')
    .addStringOption(option =>
      option.setName('messageid')
        .setDescription('ID da mensagem do sorteio para rerollar')
        .setRequired(true)),

  async execute(interaction) {
    // Verifica permissão
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: '🚫 Você precisa da permissão **Gerenciar Mensagens** para usar este comando.', ephemeral: true });
    }
// Verifica permissão do bot no servidor (antes)
const botMember = interaction.guild.members.me;
if (!botMember.permissions.has(PermissionsBitField.Flags.SendMessages)) {
  return interaction.reply({ content: '❌ Eu não tenho permissão para enviar mensagens neste servidor.', ephemeral: true });
}

    const messageId = interaction.options.getString('messageid');
    const giveaways = loadGiveaways();

    const giveaway = giveaways[messageId];
    if (!giveaway) {
      return interaction.reply({ content: '❌ Sorteio não encontrado com essa mensagem ID.', ephemeral: true });
    }

    if (giveaway.winnersCount !== 1) {
      return interaction.reply({ content: '❌ Este comando de reroll só funciona para sorteios com **1 vencedor**.', ephemeral: true });
    }

    const participants = giveaway.participants.filter(id => id !== giveaway.winners[0]);
    if (participants.length === 0) {
      return interaction.reply({ content: '❌ Não há participantes suficientes para rerollar.', ephemeral: true });
    }

    // Sorteia um novo vencedor excluindo o anterior
    const newWinnerId = participants[Math.floor(Math.random() * participants.length)];

    // Atualiza o ganhador no arquivo
    giveaway.winners = [newWinnerId];
    saveGiveaways(giveaways);

    // Tenta pegar o canal para enviar a mensagem
    const channel = await interaction.client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) {
      return interaction.reply({ content: '❌ Não foi possível encontrar o canal do sorteio.', ephemeral: true });
    }

    // Monta a mensagem do prêmio para anunciar
    const prize = giveaway.isCoinPrize ? giveaway.prizeAmount : giveaway.prize;
    const formattedPrize = giveaway.isCoinPrize ? require('../../utils/coinsUtils').formatAmount(prize) : prize;

    await channel.send(`🔄 Sorteio reroll feito!\nNovo ganhador: <@${newWinnerId}>\nGanhou: **${formattedPrize}**!`);

    return interaction.reply({ content: `✅ Sorteio reroll feito com sucesso.\nNovo ganhador: <@${newWinnerId}>.`, ephemeral: true });
  }
};