const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config.js'); 

// Inicializa a API
const genAI = new GoogleGenerativeAI(config.GEMINI_KEY);

module.exports = {
    name: 'gemini',
    aliases: ['gpt', 'ia', 'bot'],
    description: 'Responde perguntas usando a IA do Google Gemini.',

    // Lógica Universal de Argumentos (para resolver o erro de .join)
    async execute(a, b, c) {
        let message, args;

        if (a && a.author) { message = a; args = b; } 
        else if (b && b.author) { message = b; args = c; }
        
        if (!args || !Array.isArray(args)) {
            const prefix = config.PREFIX || ';';
            const content = message.content.slice(prefix.length).trim();
            args = content.split(/ +/).slice(1);
        }

        if (args.length === 0) return message.reply('❌ Digite uma pergunta! Ex: `;gemini Explique a gravidade`');

        const pergunta = args.join(' ');
        const user = message.author;
        const client = message.client;

        const msgEspera = await message.reply('⏳ **Pensando com Gemini 2.0 Flash...**');
        await message.channel.sendTyping();

        try {
            // --- MUDANÇA FINAL: USANDO O MODELO CORRETO (gemini-2.0-flash) ---
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.0-flash', 
                systemInstruction: `Você é uma amiga simpática, empática e divertida. Responda em português, como se estivesse conversando informalmente com um amigo no Discord. Use poucas palavras, evite parágrafos longos e seja direta e leve. Use emojis.`
            });

            const result = await model.generateContent(pergunta);
            const response = await result.response;
            let text = response.text();

            if (!text) text = '⚠️ A IA não retornou resposta.';

            const embed = new EmbedBuilder()
                .setColor('#00ccff')
                .setAuthor({ name: 'Gemini 2.0 Flash', iconURL: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' })
                .setDescription(text.length > 4096 ? text.slice(0, 4093) + '...' : text)
                .setFooter({ text: `Para: ${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            await msgEspera.edit({ content: '', embeds: [embed] });

        } catch (err) {
            console.error('Erro Gemini:', err);
            await msgEspera.edit({ content: '❌ Ocorreu um erro na API do Google. (Verifique sua chave no config.js)' });
        }
    }
};
