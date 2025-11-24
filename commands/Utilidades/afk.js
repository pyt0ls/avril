const fs = require('fs');
const path = require('path');
const afkFile = path.resolve('./database/afk.json');

module.exports = {
  name: 'afk',
  aliases: ['ausente', 'off', 'brb'],
  description: 'Define seu status AFK com uma mensagem opcional.',
  async execute(message, args) {
    const user = message.member;
    const userId = message.author.id;
    const guildId = message.guild.id;

    let afkData = {};
    if (fs.existsSync(afkFile)) {
      afkData = JSON.parse(fs.readFileSync(afkFile, 'utf8'));
    }

    if (!afkData[guildId]) afkData[guildId] = {};

    const reason = args.join(' ') || 'Nenhum';
    const oldNick = user.nickname || message.author.username;

    afkData[guildId][userId] = {
      reason,
      timestamp: Date.now(),
      oldNick
    };

    fs.writeFileSync(afkFile, JSON.stringify(afkData, null, 4));

    // Tenta mudar o nome para [AFK] Nome
    if (message.guild.members.me.permissions.has('ManageNicknames')) {
      try {
        const afkNick = `[AFK] ${oldNick}`;
        if (user.nickname !== afkNick && afkNick.length <= 32) {
          await user.setNickname(afkNick).catch(() => {});
        }
      } catch {}
    }

    // Responde e depois apaga a mensagem de confirmação e o comando
    const sent = await message.channel.send(
      `🌛 Você agora está **AFK**! O modo AFK será desativado quando você falar algo no chat!`
    ).catch(() => null);

    // Aguarda um pouco antes de deletar para não parecer atrasado
    setTimeout(() => {
      sent?.delete().catch(() => {});
      message.delete().catch(() => {});
    }, 20000);
  }
};