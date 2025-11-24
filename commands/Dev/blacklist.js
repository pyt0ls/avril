const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../config');

const dbPath = path.join(__dirname, '../../database/blacklist.json');
const prefixesPath = '../../database/prefixos.json';
const LOG_CHANNEL_ID = '1385323701385433189'; // ⬅️ Substitua pelo ID do canal de logs

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({}, null, 2));
}

module.exports = {
  name: 'bl',
  description: 'Gerencia a blacklist de usuários (Apenas Donos)',
  category: 'Dev',

  async execute(message, args) {
    if (!message.guild) return message.reply('❌ Este comando só pode ser usado em servidores.');

    if (!OWNERS.includes(message.author.id)) {
      return message.reply('🚫 Apenas desenvolvedores do bot podem usar este comando.');
    }

    // Puxar prefixo correto do servidor
    let prefix = 'k?';
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
      if (prefixDB[message.guild.id]) prefix = prefixDB[message.guild.id];
    }

    const subcomando = args[0];
    const alvo = args[1];
    const motivo = args.slice(2).join(' ') || 'Não informado';

    if (!subcomando || !['add', 'rmv', 'check'].includes(subcomando)) {
      return message.reply(`❌ Subcomando inválido. Use \`add\`, \`rmv\` ou \`check\`.\nExemplo: \`${prefix}bl add @user motivo aqui\``);
    }

    if (!alvo) return message.reply('❌ Você precisa mencionar ou fornecer um ID de usuário.');

    const user =
      message.mentions.users.first() ||
      (message.guild.members.cache.get(alvo)?.user) ||
      (await message.client.users.fetch(alvo).catch(() => null));

    if (!user) return message.reply('❌ Usuário inválido. Mencione ou forneça um ID válido.');

    const userId = user.id;
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    if (subcomando === 'add') {
      if (db[userId]) return message.reply('⚠️ Este usuário já está na blacklist.');

      db[userId] = {
        motivo,
        adicionadoPor: message.author.tag,
        data: new Date().toISOString()
      };

      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('🚫 Usuário Adicionado à Blacklist')
        .setColor('Red')
        .addFields(
          { name: '👤 Usuário', value: `${user.tag} (\`${userId}\`)`, inline: true },
          { name: '📄 Motivo', value: motivo, inline: true },
          { name: '👮‍♂️ Por', value: message.author.tag }
        )
        .setTimestamp();

      // Envia no canal do comando
      await message.reply({ embeds: [embed] });

      // Envia log no canal específico
      const logChannel = message.client.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [embed] });
    }

    if (subcomando === 'rmv') {
      if (!db[userId]) return message.reply('❌ Este usuário não está na blacklist.');

      delete db[userId];
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      const replyMsg = `✅ O usuário \`${user.tag}\` foi removido da blacklist.`;
      await message.reply(replyMsg);

      // Envia log no canal específico
      const logEmbed = new EmbedBuilder()
        .setTitle('✅ Usuário Removido da Blacklist')
        .setColor('Green')
        .addFields(
          { name: '👤 Usuário', value: `${user.tag} (\`${userId}\`)`, inline: true },
          { name: '👮‍♂️ Por', value: message.author.tag }
        )
        .setTimestamp();

      const logChannel = message.client.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [logEmbed] });
    }

    if (subcomando === 'check') {
      if (!db[userId]) return message.reply(`✅ O usuário \`${user.tag}\` **não está** na blacklist.`);

      const info = db[userId];
      const embed = new EmbedBuilder()
        .setTitle('📋 Blacklist Info')
        .setColor('DarkRed')
        .addFields(
          { name: '👤 Usuário', value: `${user.tag} (\`${userId}\`)`, inline: true },
          { name: '📄 Motivo', value: info.motivo, inline: true },
          { name: '👮‍♂️ Adicionado por', value: info.adicionadoPor || 'Desconhecido' },
          { name: '🕒 Data', value: `<t:${Math.floor(new Date(info.data).getTime() / 1000)}:R>` }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  }
};