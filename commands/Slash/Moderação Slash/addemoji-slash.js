const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addemoji')
    .setDescription('Adiciona emojis de outros servidores no seu.')
    .addStringOption(option =>
      option
        .setName('entrada')
        .setDescription('Emojis ou links com nomes (ex: <:emoji:id> ou https://... nome)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  async execute(interaction) {
  
    const entrada = interaction.options.getString('entrada');
    
if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
  return interaction.reply({
    content: '❌ Você precisa da permissão **Gerenciar Emojis e Figurinhas** para usar este comando.',
    ephemeral: true,
  });
}
    // 🔒 Permissões do bot
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return interaction.reply({
        content: '❌ Eu preciso da permissão **Gerenciar Emojis** para adicionar emojis.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const args = entrada.trim().split(/\s+/);
    const regex = /<(a)?:([\w\d_]+):(\d+)>/;
    const results = [];

    let i = 0;
    while (i < args.length) {
      const current = args[i];
      const match = current.match(regex);

      // Emoji do tipo <:nome:id>
      if (match) {
        const isAnimated = match[1];
        const name = match[2];
        const id = match[3];
        const ext = isAnimated ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;

        try {
          const added = await interaction.guild.emojis.create({ attachment: url, name });
          results.push(`✅ \`${added.name}\` adicionado com sucesso!`);
        } catch (err) {
          console.error(`Erro ao adicionar ${name}:`, err.message);
          results.push(`❌ Erro ao adicionar \`${name}\`: ${err.message}`);
        }

        i++;
        continue;
      }

      // Caso seja um link com nome
      if (current.startsWith('http')) {
        const url = current;
        const name = args[i + 1];

        if (!name || name.match(/^<|http/)) {
          results.push(`❌ Você precisa fornecer um **nome** após o link do emoji.\nExemplo: \`/addemoji entrada: ${url} nome_do_emoji\``);
          i++;
          continue;
        }

        try {
          const added = await interaction.guild.emojis.create({ attachment: url, name });
          results.push(`✅ \`${added.name}\` adicionado com sucesso via link!`);
        } catch (err) {
          console.error(`Erro ao adicionar ${name}:`, err.message);
          results.push(`❌ Erro ao adicionar \`${name}\`: ${err.message}`);
        }

        i += 2;
        continue;
      }

      // Entrada inválida
      results.push(`❌ Entrada inválida: \`${current}\``);
      i++;
    }

    return interaction.editReply({ content: results.join('\n') });
  },
};