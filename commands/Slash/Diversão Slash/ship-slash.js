const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Veja a compatibilidade entre duas pessoas.')
    .addUserOption(option =>
      option.setName('pessoa1')
        .setDescription('Primeira pessoa para o ship')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('pessoa2')
        .setDescription('Segunda pessoa para o ship')
        .setRequired(true)),

  async execute(interaction) {
    const cooldownTime = 10000;
    const userId = interaction.user.id;

    if (cooldowns.has(userId)) {
      const expiration = cooldowns.get(userId) + cooldownTime;
      if (Date.now() < expiration) {
        return interaction.reply({
          content: `⏳ | **${interaction.user.username}**, você está em cooldown! Tente novamente <t:${Math.floor(expiration / 1000)}:R>`,
          ephemeral: true
        });
      }
    }
    cooldowns.set(userId, Date.now());
    setTimeout(() => cooldowns.delete(userId), cooldownTime);

    const user1 = interaction.options.getUser('pessoa1');
    const user2 = interaction.options.getUser('pessoa2');

    if (user1.id === user2.id) {
      return interaction.reply({
        content: '<:att:1330271050138783785> **Você precisa mencionar duas pessoas diferentes.**',
        ephemeral: true
      });
    }

    if (user1.bot || user2.bot) {
      return interaction.reply({
        content: '<:att:1330271050138783785> **Você não pode shippar bots!**',
        ephemeral: true
      });
    }

    const porcentagem = Math.floor(Math.random() * 101);
    const estimativas = [
      "😭 quase impossível",
      "😔 muito difícil",
      "😩 difícil",
      "☺️ talvez role alguma coisa",
      "🙂 as chances são grandes",
      "😌 quase certeza que vai rolar!",
      "😁 pode ser amor verdadeiro 💕",
      "😃 eles parecem almas gêmeas",
      "😀 amor verdadeiro ❤️",
      "😚 eles têm que ficar juntos",
      "😍 eles se amam totalmente! 💕"
    ];
    const estimativa = estimativas[Math.floor(Math.random() * estimativas.length)];

    const imageUrl = `https://jayaapi.vercel.app/freeship?user1=${user1.displayAvatarURL({ extension: 'png' })}&user2=${user2.displayAvatarURL({ extension: 'png' })}&title=COMPATIBILIDADE&porcentagem=${porcentagem}`;

    let prefix = '!';
    const prefixPath = './database/prefixos.json';
    if (fs.existsSync(prefixPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
      if (prefixDB[interaction.guildId]) prefix = prefixDB[interaction.guildId];
    }

    const embed = new EmbedBuilder()
      .setTitle('<:70saliana:1327891081907671125> | **Construindo Casal.**')
      .setDescription(`Será que ${user1} tem chance com ${user2}?\n\nEstimativa: ${estimativa}`)
      .setColor('#ff66cc')
      .addFields({ name: 'Shippados com sucesso! <:gg4ps013:1319421185628569632>', value: 'ㅤ' })
      .setImage(imageUrl)
      .setThumbnail('https://cdn.discordapp.com/emojis/1162305895745720330.png?size=2048')
      .setFooter({
        text: `Use "${prefix}ship @pessoa1 @pessoa2" para testar outros ships!`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      });

    interaction.reply({ embeds: [embed] });
  }
};