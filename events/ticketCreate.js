const {
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const supportRoleId = '1347470996025905165';
const ticketCategoryId = '1349526427460173984';

async function handleTicketInteraction(interaction) {
  if (!interaction.isStringSelectMenu()) return false;
  if (interaction.customId !== 'support') return false;

  await interaction.deferReply({ ephemeral: true }); // Defer para evitar timeout

  const escolha = interaction.values[0];
  const guild = interaction.guild;
  const author = interaction.user;

  const categorias = {
    suporte: {
      nome: 'suporte',
      assunto: 'Suporte Geral <:pureza_i:1382063941030776932>',
      descricao: `A equipe ja esta ciente da abertura do seu ticket, basta aguardar que em breve o responsável pelo suporte irá lhe atender.`,
    },
    dúvidas: {
      nome: 'duvidas',
      assunto: 'Dúvidas Gerais <:pureza_a:1382074529714667674>',
      descricao: `A equipe ja esta ciente da abertura do seu ticket, basta aguardar que em breve o responsável pelo suporte irá lhe atender.`,
    },
    parceria: {
      nome: 'parceria',
      assunto: 'Pedir parceria <:partner:1380712121381294172>',
      descricao: `A equipe ja esta ciente da abertura do seu ticket, basta aguardar que em breve o responsável pelo suporte irá lhe atender.`,
    },
    denúncia: {
      nome: 'denuncia',
      assunto: 'Fazer denúncia <:martelin:1332805356593872998>',
      descricao: `A equipe ja esta ciente da abertura do seu ticket, basta aguardar que em breve o responsável pelo suporte irá lhe atender.`,
    },
    infoVIP: {
      nome: 'info-vip',
      assunto: 'Sobre VIP <:cdw_whiteBR:1382063944042020885>',
      descricao: `A equipe ja esta ciente da abertura do seu ticket, basta aguardar que em breve o responsável pelo suporte irá lhe atender.`,
    },
  };

  const categoria = categorias[escolha];
  if (!categoria) {
    return interaction.editReply({ content: '❌ Categoria inválida.', flags: 64 });
  }

  const nomeCanal = `ticket-${categoria.nome}-${author.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const existente = guild.channels.cache.find(ch =>
    ch.name === nomeCanal && ch.type === ChannelType.GuildText
  );
  if (existente) {
    return interaction.editReply({ content: `Você já tem um ticket aberto: ${existente}`, flags: 64 });
  }

  const canalTicket = await guild.channels.create({
    name: nomeCanal,
    type: ChannelType.GuildText,
    parent: ticketCategoryId,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: author.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: supportRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ],
  });

  const embedTicket = new EmbedBuilder()
  .setTitle(categoria.assunto)
  .setDescription(`Olá <@${author.id}>, ${categoria.descricao}\n\n**Diretrizes:**\n\`1\` Não abra ticket à toa.\n\`2\` Siga as regras do servidor.`)
  .setColor('#47ff00')
  .setThumbnail(author.displayAvatarURL({ dynamic: true, size: 1024 })) // 👈 thumbnail com avatar
  .setFooter({ text: 'Kn0w Support' })
  .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close-btn_${author.id}`)
      .setLabel('Concluir')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),

    new ButtonBuilder()
      .setCustomId(`ticket_cancel-btn_${author.id}`)
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌'),
  );

  await canalTicket.send({
    content: `<@${author.id}> ||<@&${supportRoleId}>||`,
    embeds: [embedTicket],
    components: [row],
  });

  await interaction.editReply({ content: `✅ Ticket criado: ${canalTicket}`, flags: 64 });

  return true;
}

module.exports = { handleTicketInteraction };