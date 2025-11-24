const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'limpar',
  description: 'Limpa mensagens de um usuário específico no canal atual.',
  usage: '!limpar @usuario quantidade',
  permissions: [PermissionFlagsBits.ManageMessages], // quem pode usar
  
  async execute(message, args) {
    // Permissão do usuário
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ Você precisa da permissão **Gerenciar Mensagens** para usar este comando.');
    }

    // Verifica se mencionou um usuário
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('❌ Você precisa mencionar um usuário para limpar as mensagens.');
    }

    // Verifica quantidade
    const amount = parseInt(args[1], 10);
    if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('❌ Insira uma quantidade válida de 1 a 100 para apagar.');
    }

    // Busca mensagens no canal e filtra por autor
    try {
    await message.delete().catch(() => {}); // apaga o comando!
      const messages = await message.channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(m => m.author.id === user.id).first(amount);

      if (userMessages.length === 0) {
        return message.reply(`❌ Não encontrei mensagens do usuário ${user.tag} para apagar.`);
      }

      // Apaga as mensagens filtradas
      await message.channel.bulkDelete(userMessages, true);

      return message.channel.send(`✅ Apaguei ${userMessages.length} mensagens de ${user}.`).then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });

    } catch (error) {
      console.error(error);
      return message.reply('❌ Não foi possível apagar as mensagens.');
    }
  }
};