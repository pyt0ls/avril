const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emoji-info')
    .setDescription('Mostra informações detalhadas de um emoji personalizado.')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji personalizado (ex: <:nome:id> ou <a:nome:id>)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const emojiInput = interaction.options.getString('emoji');

    const emojiRegex = /<(a?):(\w+):(\d+)>/;
    const match = emojiInput.match(emojiRegex);

    if (!match) {
      return interaction.reply({ content: '❌ Insira um emoji personalizado válido.', ephemeral: true });
    }

    const isAnimated = match[1] === 'a';
    const emojiName = match[2];
    const emojiId = match[3];

    const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;

    const discordEpoch = 1420070400000;
    const emojiTimestamp = (BigInt(emojiId) >> 22n) + BigInt(discordEpoch);
    const emojiDate = new Date(Number(emojiTimestamp));

    // Tentar pegar o emoji da cache do servidor atual
    let guildName = 'Desconhecido';
    const guildEmoji = interaction.guild?.emojis.cache.get(emojiId);
    if (guildEmoji) guildName = interaction.guild.name;

    const embed = new EmbedBuilder()
      .setTitle('📙 Informações do Emoji')
      .setColor('#FA8072')
      .setThumbnail(emojiURL)
      .addFields(
        { name: '• Nome:', value: emojiName, inline: true },
        { name: '• ID:', value: emojiId, inline: true },
        { name: '• Status:', value: isAnimated ? 'Animado' : 'Estático', inline: true },
        { name: '• Criado:', value: `<t:${Math.floor(emojiDate.getTime() / 1000)}:R>`, inline: true },
        { name: '• Menção:', value: `\`${emojiInput}\``, inline: true },
        { name: '• Servidor:', value: guildName, inline: true }
      )
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};