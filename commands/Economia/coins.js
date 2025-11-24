const fs = require("fs");
const path = require("path");
const { formatAmount, loadCoins } = require("../../utils/coinsUtils");
const config = require("../../config");

module.exports = {
  name: "coins",
  aliases: ["bal", "carteira", "banco"],
  async execute(message, args) {
    // Pegar prefixo customizado ou fallback para padrão
    let prefix = config.PREFIX; 
    const prefixesPath = path.join(__dirname, "../../database/prefixos.json");
    if (fs.existsSync(prefixesPath)) {
      const prefixDB = JSON.parse(fs.readFileSync(prefixesPath, "utf8"));
      if (message.guild && prefixDB[message.guild.id]) prefix = prefixDB[message.guild.id];
    }

    const user = message.mentions.users.first() || message.author;
    const coins = loadCoins();

    if (!coins[user.id]) {
      coins[user.id] = { carteira: 0, banco: 0 };
    }

    const carteira = formatAmount(coins[user.id].carteira);
    const banco = formatAmount(coins[user.id].banco);

    await message.channel.send({
      embeds: [{
        title: "💼 Conta bancária",
        description: `Seu banco possui:\n「<:cdw_whiteBR:1382063944042020885>」**${banco} coins**\n\nSua carteira possui:\n「<:70s_whitcash:1304070691892625448>」**${carteira} coins**`,
        color: 0x11e1db,
        footer: {
          text: `Deposite seus coins usando ${prefix}dep all`
        },
        thumbnail: {
          url: user.displayAvatarURL({ dynamic: true })
        }
      }]
    });
  }
};