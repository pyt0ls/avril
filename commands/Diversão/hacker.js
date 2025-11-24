const { EmbedBuilder } = require('discord.js');

const cooldowns = new Map();

const emails = [
  'gostoso29@gmail.com',
  'banida666@gmail.com',
  'naruto46@gmail.com',
  'zezindograu@gmail.com',
  'solitariu@gmail.com',
  'nobruzera@gmail.com',
  'akaza975@gmail.com',
  'muzando18@gmail.com',
  'beilha@gmail.com',
];

const senhas = [
  '12345678',
  '23082005',
  '13012009',
  'maisdordno',
  'onglrsbel',
  'naruto837',
  'predoguta98',
  'zezindsgao',
  'zezindesga',
  'gustavoX',
  'nobrezurapelao',
  'akazasup3',
  'akatsuki',
  'muzandoebha',
  'beilha827',
  'veigh918',
];

const cpfs = [
  '500.384.197-00',
  '982.290.827-10',
  '927.200.657-85',
  '193.487.928-19',
  '763.398.873-75',
  '726.847.723-96',
  '947.182.094-65',
  '726.938.917-19',
];

const localizacoes = [
  'São Paulo',
  'Rio de Janeiro',
  'Paraná',
  'Rio Grande do Sul',
  'Acre',
  'Amazonas',
  'Pará',
  'Bahia',
  'Alagoas',
  'Minas Gerais',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Piauí',
  'Goiás',
  'Pernambuco',
];

// Função helper para pegar random
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  name: 'hackear',
  aliases: ['hack'],
  description: 'Hackeia um usuário com dados randomizados.',
  async execute(message, args) {
    const authorId = message.author.id;

    // Cooldown 6 segundos
    if (cooldowns.has(authorId)) {
      const last = cooldowns.get(authorId);
      const now = Date.now();
      if (now - last < 6000) {
        return message.reply(`❌️ ╸<@${authorId}>, Espere 5 segundos para usar o comando novamente!`);
      }
    }

    const target = message.mentions.users.first();

    // Checa se mencionou alguém
    if (!target) {
      return message.reply(`❌️ ╸<@${authorId}>, Você tem que mencionar uma pessoa para hackear!`);
    }

    // Não pode se hackear
    if (target.id === authorId) {
      return message.reply(`❌️ ╸<@${authorId}>, Você não pode se hackear!`);
    }

    // Não pode hackear bot
    if (target.bot) {
      return message.reply(`❌️ ╸<@${authorId}>, Você não pode hackear um bot!`);
    }

    cooldowns.set(authorId, Date.now());

    // Embed inicial
    const embed = new EmbedBuilder()
      .setTitle('<:pureza_a:1382074529714667674> • **Usuário hackeado!**')
      .setColor('FA8072')
      .setThumbnail('https://cdn.discordapp.com/emojis/1148965498013372557.png?v=1&size=48&quality=lossless')
      .setFooter({ text: `Utilizado por: ${message.author.username}` })
      .setDescription('O usuário está sendo hackeado, aguarde...');

    const sent = await message.reply({ embeds: [embed] });

    // Espera 5 segundos e edita mensagem com os dados
    setTimeout(() => {
      const embedEdit = new EmbedBuilder()
        .setTitle('<:pureza_a:1382074529714667674> • **Usuário hackeado!**')
        .setColor('FA8072')
        .setThumbnail('https://cdn.discordapp.com/emojis/1148965498013372557.png?v=1&size=48&quality=lossless')
        .setFooter({ text: `Utilizado por: ${message.author.username}` })
        .setDescription(
          `👤 • **__Pessoa:__** \n\`<@${target.id}>\`\n` +
          `📧 - **__Email:__**\n\`${randomFromArray(emails)}\`\n` +
          `🔐 - **__Senha:__**\n\`${randomFromArray(senhas)}\`\n` +
          `🎫 • **__Cpf:__**\n\`${randomFromArray(cpfs)}\`\n` +
          `🌐 • **__Localização:__**\n\`${randomFromArray(localizacoes)}\``
        );

      sent.edit({ embeds: [embedEdit] }).catch(() => { });
    }, 5000);
  },
};