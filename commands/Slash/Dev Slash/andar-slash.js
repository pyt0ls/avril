const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { OWNERS } = require('../../../config.js');

function parseTempo(str) {
    const regex = /^((\d+)m)?\s*((\d+)s)?$/i;
    const match = str.match(regex);
    if (!match) return null;

    const minutos = parseInt(match[2]) || 0;
    const segundos = parseInt(match[4]) || 0;
    const total = (minutos * 60) + segundos;

    return total > 0 ? total : null;
}

module.exports = {
    global: false,
    data: new SlashCommandBuilder()
        .setName('andar')
        .setDescription('Move um usuário por várias calls!')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuário que será movido')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('tempo')
                .setDescription('Tempo total (ex: 30s & 2m)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const alvo = interaction.options.getUser('usuario');
        const tempoStr = interaction.options.getString('tempo');
        const tempo = parseTempo(tempoStr);
        const membroAlvo = await interaction.guild.members.fetch({ user: alvo.id, force: true });
        const botMember = interaction.guild.members.me;

        if (!OWNERS.includes(userId)) {
            return interaction.editReply({ content: '🚫 Você não pode usar este comando.' });
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.editReply({ content: '❌ Você precisa da permissão `Mover Membros` para usar este comando.' });
        }

        if (!botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.editReply({ content: '❌ Preciso da permissão `Mover Membros` para mover usuários.' });
        }

        if (!tempo || tempo < 5 || tempo > 300) {
            return interaction.editReply({ content: '⏱️ O tempo deve estar entre 5 segundos e 5 minutos. Exemplos válidos: `30s`, `2m`, `1m30s`.' });
        }

        if (!membroAlvo.voice.channel) {
            return interaction.editReply({ content: '❌ Esse usuário não está em uma call.' });
        }

        const canaisVoz = interaction.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildVoice && (c.members.size < c.userLimit || c.userLimit === 0))
            .filter(c => c.id !== membroAlvo.voice.channelId);

        if (canaisVoz.size === 0) {
            return interaction.editReply({ content: '⚠️ Não há outros canais de voz disponíveis para mover o usuário.' });
        }

        interaction.editReply({ content: `🚶 Iniciando caminhada de **${alvo.tag}**` });

        let segundosPassados = 0;
        const intervalo = 3000; // mover a cada 3 segundos

        const mover = async () => {
            if (!membroAlvo.voice.channel) return clearInterval(loop);

            const canaisDisponiveis = canaisVoz.filter(c => c.id !== membroAlvo.voice.channelId);
            if (canaisDisponiveis.size === 0) return;

            const aleatorio = [...canaisDisponiveis.values()][Math.floor(Math.random() * canaisDisponiveis.size)];

            try {
                await membroAlvo.voice.setChannel(aleatorio);
            } catch (err) {
                console.warn(`Erro ao mover ${membroAlvo.user.tag}:`, err);
            }
        };

        const loop = setInterval(async () => {
            segundosPassados += intervalo / 1000;

            if (!membroAlvo.voice.channel || segundosPassados >= tempo) {
                clearInterval(loop);
                return interaction.followUp({
                    content: `🏁 **${alvo.tag}** parou de andar!`,
                    ephemeral: true
                });
            }

            await mover();
        }, intervalo);
    }
};