const { EmbedBuilder } = require('discord.js');

const cooldowns = new Map();

module.exports = {
  name: 'rip',
  description: 'Faz um RIP de um usuário mencionado.',
  cooldown: 10000, // 10 segundos cooldown (em ms)
  async execute(message, args) {
    const authorId = message.author.id;

    // Verifica cooldown
    if (cooldowns.has(authorId)) {
      const last = cooldowns.get(authorId);
      const now = Date.now();
      if (now - last < 10000) {
        return message.reply({
          content: `:x: <@${authorId}> **Espere 10 segundos antes de usar este comando novamente.**`,
          allowedMentions: { users: [] },
        });
      }
    }

    const target = message.mentions.users.first();

    // Validações
    if (!target) {
      return message.reply({
        content: `:x: <@${authorId}> **Você precisa mencionar alguém válido!**`,
        allowedMentions: { users: [] },
      });
    }

    if (target.id === authorId) {
      return message.reply({
        content: `:x: <@${authorId}> **Você não pode se mencionar!**`,
        allowedMentions: { users: [] },
      });
    }

    if (target.bot) {
      return message.reply({
        content: `:x: <@${authorId}> **Você não pode fazer rip de um bot!**`,
        allowedMentions: { users: [] },
      });
    }

    cooldowns.set(authorId, Date.now());

    // Monta o embed
    const embed = new EmbedBuilder()
      .setTitle(`RIP de <@${target.id}>`)
      .setColor('FA8072')
      .setFooter({ text: 'Sentiremos saudades... Só que não' })
      .setImage(`https://vacefron.nl/api/grave?user=${target.displayAvatarURL({ extension: 'png', size: 512 })}`);

    try {
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply({
        content: '⁉️・Erro!! Algo deu errado ao executar o comando. Verifique se você mencionou alguém corretamente...',
        allowedMentions: { users: [] },
      });
    }
  },
};