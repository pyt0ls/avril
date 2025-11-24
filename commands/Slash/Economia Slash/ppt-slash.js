const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { parseAmount, formatAmount } = require('../../../utils/coinsUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ppt')
    .setDescription('Jogue pedra, papel ou tesoura e aposte moedas do banco!')
    .addStringOption(option =>
      option.setName('quantia')
        .setDescription('Quantia para apostar (ex: 100, 1k, 2.5m ou all)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('escolha')
        .setDescription('Escolha pedra, papel ou tesoura')
        .setRequired(true)
        .addChoices(
          { name: 'pedra', value: 'pedra' },
          { name: 'papel', value: 'papel' },
          { name: 'tesoura', value: 'tesoura' }
        )),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const coinsPath = path.join(__dirname, '../../../database/coins.json');
    let coinsDB = {};

    if (fs.existsSync(coinsPath)) {
      try {
        coinsDB = JSON.parse(fs.readFileSync(coinsPath, 'utf8'));
      } catch {
        coinsDB = {};
      }
    }

    if (!coinsDB[userId]) coinsDB[userId] = { carteira: 0, banco: 0 };

    let quantiaInputRaw = interaction.options.getString('quantia');
    let quantiaInput;

    if (quantiaInputRaw.toLowerCase() === 'all') {
      quantiaInput = coinsDB[userId].banco;
    } else {
      const parsed = parseAmount(quantiaInputRaw);
      if (parsed === null || isNaN(parsed)) {
        return interaction.reply({
          content: `<:No_New00K:1332805357885722636> ╸<@${userId}>, Digite uma quantia válida. Use: \`k | m | b | all\``,
          ephemeral: true
        });
      }
      quantiaInput = Math.floor(parsed);
    }

    // Garantir que seja número a partir daqui
    quantiaInput = Number(quantiaInput);

    if (quantiaInput < 100) {
      return interaction.reply({
        content: `<:No_New00K:1332805357885722636> ╸<@${userId}>, Você deve apostar no mínimo **100** moedas.`,
        ephemeral: true
      });
    }

    if (quantiaInput > coinsDB[userId].banco) {
      return interaction.reply({
        content: `<:No_New00K:1332805357885722636> ╸<@${userId}>, Você não tem essa quantia no banco. Saldo: \`${formatAmount(coinsDB[userId].banco)}\``,
        ephemeral: true
      });
    }

    const escolha = interaction.options.getString('escolha');
    const opcoes = ['pedra', 'papel', 'tesoura'];
    const escolhaBot = opcoes[Math.floor(Math.random() * opcoes.length)];

    let resultado, delta;
    if (escolha === escolhaBot) {
      resultado = 'nós empatamos';
      delta = 0;
    } else if (
      (escolha === 'pedra' && escolhaBot === 'tesoura') ||
      (escolha === 'tesoura' && escolhaBot === 'papel') ||
      (escolha === 'papel' && escolhaBot === 'pedra')
    ) {
      resultado = 'você ganhou';
      delta = quantiaInput;
      coinsDB[userId].banco += delta;
    } else {
      resultado = 'eu ganhei';
      delta = -quantiaInput;
      coinsDB[userId].banco -= quantiaInput;
    }

    fs.writeFileSync(coinsPath, JSON.stringify(coinsDB, null, 4), 'utf8');

    const embed = new EmbedBuilder()
      .setTitle('<:1230749971679281194:1329730351710601286> • **Pedra, Papel, Tesoura**')
      .setDescription(`${interaction.user.username} jogou **${escolha}**\nEu joguei **${escolhaBot}**\n\nPortanto, ${resultado}!\n\n<:70s_whitcash:1304070691892625448> • **Resultado:** \`${delta >= 0 ? '+' : ''}${formatAmount(delta)}\``)
      .setColor('#00ffc3')
      .setImage('https://cdn.discordapp.com/attachments/1148414200830505011/1148861516179836928/pedra-papel-tesoura1-5fa51133958cfe0c4216786500534833-640-0.png')
      .setTimestamp()
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    return interaction.reply({ embeds: [embed] });
  }
};