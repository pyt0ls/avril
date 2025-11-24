const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../../../database/clConfig.json');
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}', 'utf8');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cl-config')
    .setDescription('Configura o sistema de clear personalizado.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

  async execute(interaction) {
  
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
  return interaction.reply({ content: '❌ Você precisa da permissão **Gerenciar Mensagens** para usar este comando.', ephemeral: true });
}
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!data[guildId]) {
      data[guildId] = {
        enabled: true,
        keyword: 'cl'
      };
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
    }

    const embed = new EmbedBuilder()
      .setColor('White')
      .setTitle('🧹 Sistema de Clear Personalizado')
      .setDescription(
        `🔹 **Status:** ${data[guildId].enabled ? 'Ativado ✅' : 'Desativado ❌'}\n🔹 **Palavra-chave:** \`${data[guildId].keyword}\``
      )
      .setFooter({ text: `Servidor: ${interaction.guild.name}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_cl')
        .setLabel(data[guildId].enabled ? 'Desativar' : 'Ativar')
        .setStyle(data[guildId].enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('set_keyword')
        .setLabel('Definir Palavra')
        .setStyle(ButtonStyle.Primary)
    );

    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 60000
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'toggle_cl') {
        data[guildId].enabled = !data[guildId].enabled;
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

        embed.setDescription(
          `🔹 **Status:** ${data[guildId].enabled ? 'Ativado ✅' : 'Desativado ❌'}\n🔹 **Palavra-chave:** \`${data[guildId].keyword}\``
        );

        row.components[0]
          .setLabel(data[guildId].enabled ? 'Desativar' : 'Ativar')
          .setStyle(data[guildId].enabled ? ButtonStyle.Danger : ButtonStyle.Success);

        await i.update({ embeds: [embed], components: [row] });
      }

      if (i.customId === 'set_keyword') {
        await i.reply({ content: 'Envie a nova palavra-chave para o clear personalizado.', ephemeral: true });

        const msgCollector = i.channel.createMessageCollector({
          filter: m => m.author.id === userId,
          max: 1,
          time: 30000
        });

        msgCollector.on('collect', (m) => {
          data[guildId].keyword = m.content.trim();
          fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

          embed.setDescription(
            `🔹 **Status:** ${data[guildId].enabled ? 'Ativado ✅' : 'Desativado ❌'}\n🔹 **Palavra-chave:** \`${data[guildId].keyword}\``
          );

          reply.edit({ embeds: [embed], components: [row] });
          m.reply('✅ Palavra-chave atualizada com sucesso.').then(r => setTimeout(() => r.delete().catch(() => {}), 5000));
        });
      }
    });

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  }
};