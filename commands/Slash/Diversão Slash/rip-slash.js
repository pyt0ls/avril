const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rip')
    .setDescription('Faz um RIP de um usuário mencionado.')
    .addUserOption(option =>
      option.setName('usuário')
        .setDescription('Usuário para fazer o RIP')
        .setRequired(true)
    ),

  async execute(interaction) {
    const authorId = interaction.user.id;

    if (cooldowns.has(authorId)) {
      const last = cooldowns.get(authorId);
      const now = Date.now();
      if (now - last < 10000) {
        return interaction.reply({
          content: `:x: <@${authorId}> **Espere 10 segundos antes de usar este comando novamente.**`,
          ephemeral: true
        });
      }
    }

    const target = interaction.options.getUser('usuário');

    if (target.id === authorId) {
      return interaction.reply({
        content: `:x: <@${authorId}> **Você não pode se mencionar!**`,
        ephemeral: true
      });
    }

    if (target.bot) {
      return interaction.reply({
        content: `:x: <@${authorId}> **Você não pode fazer rip de um bot!**`,
        ephemeral: true
      });
    }

    cooldowns.set(authorId, Date.now());

    const embed = new EmbedBuilder()
      .setTitle(`RIP de <@${target.id}>`)
      .setColor('FA8072')
      .setFooter({ text: 'Sentiremos saudades... Só que não' })
      .setImage(`https://vacefron.nl/api/grave?user=${target.displayAvatarURL({ extension: 'png', size: 512 })}`);

    try {
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: '⁉️・Erro!! Algo deu errado ao executar o comando.',
        ephemeral: true
      });
    }
  },
};