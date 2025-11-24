const fs = require('fs');
const path = require('path');
const { prefix } = require('../../config.js');

const configPath = path.join(__dirname, '../../database/clConfig.json');

function getConfig(guildId) {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}');
  return data[guildId] || { enabled: false, keyword: `${prefix}cl` };
}

module.exports = {
  name: 'cl',
  description: 'Limpa suas próprias mensagens no canal.',
  category: 'Utilidades',

  async execute(message) {
    if (!message.guild) return; // só em servidor

    const guildId = message.guild.id;
    const config = getConfig(guildId);

    if (!config.enabled) return; // sistema desligado

    const keyword = (config.keyword || `${prefix}cl`).toLowerCase();
    const content = message.content.toLowerCase().trim();

    // Executa só se a mensagem for exatamente a palavra-chave (ex: 'cl' ou 'limpar')
    if (content !== keyword) return;

    try {
      // Apaga a mensagem do comando
      await message.delete().catch(() => {});

      // Busca até 100 mensagens no canal
      const fetched = await message.channel.messages.fetch({ limit: 100 });

      // Limite de 14 dias para apagar mensagens (limitação do Discord)
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

      // Filtra mensagens do autor dentro do limite de 14 dias
      const userMessages = fetched.filter(msg =>
        msg.author.id === message.author.id &&
        msg.createdTimestamp > fourteenDaysAgo
      );

      if (userMessages.size === 0) {
        return message.channel.send('Não encontrei mensagens suas para apagar neste canal.').then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 5000);
        });
      }

      // Apaga as mensagens do usuário encontradas
      await message.channel.bulkDelete(userMessages, true);

    } catch (err) {
      console.error('Erro ao limpar mensagens:', err);
    }
  }
};