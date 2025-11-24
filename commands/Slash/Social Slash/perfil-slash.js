const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Mostra o perfil de um usuário')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuário que deseja ver o perfil')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const userId = target.id;

    // Caminhos dos arquivos
    const basePath = path.join(__dirname, '../../../database/');
    const coins = loadJson(path.join(basePath, 'coins.json'));
    const marry = loadJson(path.join(basePath, 'marry.json'));
    const bf = loadJson(path.join(basePath, 'bf.json'));
    const vip = loadJson(path.join(basePath, 'vipData.json'));
    const rep = loadJson(path.join(basePath, 'rep.json'));
    const perfil = loadJson(path.join(basePath, 'perfil.json'));

    // Dados financeiros
    const userCoinsData = coins[userId] || { carteira: 0, banco: 0 };
    const userCoins = (userCoinsData.carteira || 0) + (userCoinsData.banco || 0);
    const userRep = rep[userId] || 0;

    // Casamento e melhor amigo
    const casadoCom = marry.casamentos?.[userId] || null;
    const bfCom = bf.amizades?.[userId] || null;

    // VIP
    const vipExpira = vip[userId] ? vip[userId] * 1000 : 0;
    const temVip = vipExpira && vipExpira > Date.now();
    const vipString = temVip
      ? `✔️ Ativo até <t:${Math.floor(vipExpira / 1000)}:R>`
      : '❌ Não possui VIP ativo';

    // Perfil customizado
    const dadosPerfil = perfil[userId] || {};
    const sobremim = dadosPerfil.sobremim || 'Não definido.';
    const cor = dadosPerfil.cor || '#fa8072';
    const pronome = dadosPerfil.pronome || 'Não definido.';
    const banner = dadosPerfil.banner || null;

    // Monta embed
    const embed = new EmbedBuilder()
      .setColor(cor)
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setTitle(`🎭 Perfil de ${target.username}`)
      .setDescription(
        `> 🧢 **Usuário:** <@${userId}> \`${userId}\`\n\n` +
        `> 💍 **Estado civil:** ${casadoCom ? `Casado(a) com <@${casadoCom}>` : 'Solteiro(a)'}\n` +
        `> 🫂 **Melhor amigo(a):** ${bfCom ? `<@${bfCom}>` : 'Nenhum'}\n\n` +
        `> 💰 **Coins:** R$ ${userCoins.toLocaleString()}\n` +
        `> ⭐ **Reputações:** ${userRep.toLocaleString()}\n\n` +
        `> 🏅 **Status VIP:** ${vipString}\n\n` +
        `> 🏳️‍⚧️ **Pronome:** ${pronome}\n\n` +
        `> 📝 **Sobre mim:**\n${sobremim}`
      )
      .setFooter({
        text: `Executado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      });

    if (banner) embed.setImage(banner);

    await interaction.reply({ embeds: [embed] });
  }
};