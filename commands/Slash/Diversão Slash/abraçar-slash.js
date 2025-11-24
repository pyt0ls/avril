const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abraçar')
    .setDescription('Abrace alguém com carinho!')
    .addUserOption(option =>
      option.setName('usuário')
        .setDescription('Quem você deseja abraçar?')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuário');

    if (target.id === interaction.user.id)
      return interaction.reply({ content: '❌ Você não pode se abraçar!', ephemeral: true });

    if (target.bot)
      return interaction.reply({ content: '❌ Você não pode abraçar um bot!', ephemeral: true });

    const gifs = [
      'https://cdn.weeb.sh/images/Sk-xxs3C-.gif',
      'https://cdn.weeb.sh/images/ryjJFdmvb.gif',
      'https://cdn.weeb.sh/images/HJ7lY_QwW.gif',
      'https://cdn.weeb.sh/images/Hk0yFumwW.gif'
    ];

    const cores = ['#00FF00', '#FF8D00', '#98BDF0', '#264BEC'];

    const embed = new EmbedBuilder()
      .setDescription(`🤗 ${interaction.user} você abraçou ${target}`)
      .setColor(cores[Math.floor(Math.random() * cores.length)])
      .setImage(gifs[Math.floor(Math.random() * gifs.length)])
      .setFooter({ text: `Use o comando novamente para espalhar carinho!` });

    await interaction.reply({ embeds: [embed] });
  }
};