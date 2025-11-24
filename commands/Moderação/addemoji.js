const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'addemoji',
  description: 'Adiciona emojis de outros servidores no seu.',
  aliases: ['stealemoji', 'addemote'],
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
      return message.reply('❌ Você precisa da permissão **Gerenciar Emojis** para usar este comando.');
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
      return message.reply('❌ Eu preciso da permissão **Gerenciar Emojis** para adicionar emojis.');
    }

    if (!args.length) {
      return message.reply('❌ Forneça pelo menos um emoji ou link com nome.\nExemplo: `addemoji <:emoji:ID>` ou `addemoji https://cdn.discordapp.com/emojis/ID.png nome`');
    }

    const regex = /<(a)?:([\w\d_]+):(\d+)>/;
    const results = [];

    const MAX_EMOJIS = 15;
    let i = 0;
    let addedCount = 0;

    // Mensagem inicial
    const statusMsg = await message.reply('🔄 Adicionando emojis... aguarde!');

    while (i < args.length && addedCount < MAX_EMOJIS) {
      const current = args[i];
      const match = current.match(regex);

      if (match) {
        const isAnimated = match[1];
        const name = match[2];
        const id = match[3];
        const ext = isAnimated ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;

        try {
          const added = await message.guild.emojis.create({ attachment: url, name });
          results.push(`✅ \`${added.name}\` adicionado com sucesso!`);
          addedCount++;
        } catch (err) {
          results.push(`❌ Erro ao adicionar \`${name}\`: ${err.message}`);
        }

        i++;
        continue;
      }

      if (current.startsWith('http')) {
        const url = current;
        const name = args[i + 1];

        if (!name || name.match(/^<|http/)) {
          results.push(`❌ Você precisa fornecer um **nome** após o link do emoji.\nExemplo: \`!addemoji ${url} nome_do_emoji\``);
          i++;
          continue;
        }

        try {
          const added = await message.guild.emojis.create({ attachment: url, name });
          results.push(`✅ \`${added.name}\` adicionado com sucesso via link!`);
          addedCount++;
        } catch (err) {
          results.push(`❌ Erro ao adicionar \`${name}\`: ${err.message}`);
        }

        i += 2;
        continue;
      }

      results.push(`❌ Entrada inválida: \`${current}\``);
      i++;
    }

    if (i < args.length) {
      results.push(`⚠️ Apenas os primeiros **${MAX_EMOJIS} emojis** foram processados para evitar sobrecarga.`);
    }

    // Edita a mensagem com os resultados
    await statusMsg.edit({ content: results.join('\n') });

    // Deleta a mensagem após 5 segundos
    setTimeout(() => {
      statusMsg.delete().catch(() => {});
    }, 5000);
  }
};