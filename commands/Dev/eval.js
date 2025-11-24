const { EmbedBuilder } = require('discord.js');
const { OWNERS, prefix } = require('../../config.js');
const util = require('util');

module.exports = {
  name: 'eval',
  description: 'Executa código JavaScript.',
  usage: `${prefix}eval <código>`,
  async execute(message, args) {
    // Verificar se é dono
    if (!OWNERS.includes(message.author.id)) {
      return message.reply('🚫 Apenas desenvolvedores do bot podem usar este comando.');
    }

    const code = args.join(' ');

    if (!code) {
      return message.reply('⚠️ Você precisa fornecer um código para executar.');
    }

    // Bloquear código que contenha 'botleave'
    if (code.toLowerCase().includes('botleave')) {
      return message.reply('🚫 Execução de função proibida detectada.');
    }

    try {
      let evaled = eval(code);

      if (evaled instanceof Promise) {
        evaled = await evaled;
      }

      let output = typeof evaled !== 'string' ? util.inspect(evaled, { depth: 0 }) : evaled;

      if (output.length > 1000) output = output.substring(0, 1000) + '...';

      const embed = new EmbedBuilder()
        .setTitle('✅ Eval - Sucesso')
        .setColor('#00ff99')
        .setDescription(`**Código:**\n\`\`\`js\n${code}\n\`\`\`\n**Resultado:**\n\`\`\`js\n${output}\n\`\`\``)
        .setFooter({ text: `Developer: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

      await message.reply({ embeds: [embed] });
    } catch (err) {
      let errorMsg = err.message || err.toString();
      errorMsg = errorMsg.replace(/`/g, '`' + String.fromCharCode(8203)); // impedir bug de markdown

      const embed = new EmbedBuilder()
        .setTitle('❌ Eval - Erro')
        .setColor('#ff0000')
        .setDescription(`**Código:**\n\`\`\`js\n${code}\n\`\`\`\n**Erro:**\n\`\`\`js\n${errorMsg}\n\`\`\``)
        .setFooter({ text: `Developer: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

      await message.reply({ embeds: [embed] });
    }
  },
};