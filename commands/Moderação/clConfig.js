const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../database/clConfig.json');
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}', 'utf8');

module.exports = {
  name: 'clconfig',
  description: 'Configura o sistema de clear personalizado',
  category: 'Moderação',

  async execute(message) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.channel.send('Você não tem permissão para isso.');
    }

    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const guildId = message.guild.id;

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
      .setFooter({ text: `Servidor: ${message.guild.name}` })
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

    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60_000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'Apenas o autor pode usar esses botões.', ephemeral: true });
      }

      if (interaction.customId === 'toggle_cl') {
        data[guildId].enabled = !data[guildId].enabled;
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

        embed.setDescription(
          `🔹 **Status:** ${data[guildId].enabled ? 'Ativado ✅' : 'Desativado ❌'}\n🔹 **Palavra-chave:** \`${data[guildId].keyword}\``
        );

        row.components[0]
          .setLabel(data[guildId].enabled ? 'Desativar' : 'Ativar')
          .setStyle(data[guildId].enabled ? ButtonStyle.Danger : ButtonStyle.Success);

        await interaction.update({ embeds: [embed], components: [row] });
      }

      if (interaction.customId === 'set_keyword') {
        await interaction.reply({ content: 'Envie a nova palavra-chave para o clear personalizado.', ephemeral: true });

        const msgCollector = interaction.channel.createMessageCollector({
          filter: m => m.author.id === message.author.id,
          max: 1,
          time: 30_000
        });

        msgCollector.on('collect', (m) => {
          data[guildId].keyword = m.content.trim();
          fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

          embed.setDescription(
            `🔹 **Status:** ${data[guildId].enabled ? 'Ativado ✅' : 'Desativado ❌'}\n🔹 **Palavra-chave:** \`${data[guildId].keyword}\``
          );

          msg.edit({ embeds: [embed], components: [row] });
          m.reply('Palavra-chave atualizada com sucesso.').then(r => setTimeout(() => r.delete(), 5000));
        });
      }
    });
  }
};