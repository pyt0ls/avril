const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'ty',
  description: 'Envia o painel de abertura de tickets',
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Você precisa ser administrador para usar este comando.');
    }

    const embed = new EmbedBuilder()
      .setColor('#47ff00')
      .setAuthor({
        name: `Suporte - ${client.user.username}`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setTitle('**Bem-vindo ao suporte avril.**')
      .setDescription(
        'Caso tenha dúvidas, dificuldades ou precise de ajuda com o bot, não hesite em abrir um ticket. Nossa equipe está disponível para te auxiliar com qualquer problema ou questão.\n\n' +
        '> <:white_bloww:1382060155822149722> Para abrir um ticket, basta descrever o que você precisa, e responderemos o mais rápido possível.\n' +
        '> <:white_bloww:1382060155822149722> Estamos aqui para garantir que sua experiência com o bot seja a melhor possível!'
      )
      .setFooter({
        text: 'Todos os direitos reservados para, avril | helper.',
        iconURL: message.guild.iconURL({ dynamic: true }),
      });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('support')
      .setPlaceholder('Selecione uma categoria.')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: 'Suporte Geral',
          description: 'Auxílio e atendimento geral',
          value: 'suporte',
          emoji: { name: 'pureza_i', id: '1382063941030776932' },
        },
        {
          label: 'Dúvidas Gerais',
          description: 'Ticket para ajuda geral',
          value: 'dúvidas',
          emoji: { name: 'pureza_a', id: '1382074529714667674' },
        },
        {
          label: 'Pedir Parceria',
          description: 'Faça uma nova parceria conosco',
          value: 'parceria',
          emoji: { name: 'partner', id: '1380712121381294172' },
        },
        {
          label: 'Fazer Denúncia',
          description: 'Relate atitudes inadequadas ou abusos no bot',
          value: 'denúncia',
          emoji: { name: 'martelin', id: '1332805356593872998' },
        },
        {
          label: 'Sobre VIP',
          description: 'Informações sobre compras de VIP',
          value: 'infoVIP',
          emoji: { name: 'cdw_whiteBR', id: '1382063944042020885' },
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await message.channel.send({ embeds: [embed], components: [row] });
  },
};