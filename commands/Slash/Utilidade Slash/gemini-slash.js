const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// Certifique-se de que o Axios esteja instalado: npm install axios
const axios = require("axios"); 

// *******************************************************************
// ATENÇÃO: Se a sua chave está no config.js, você deve importá-lo aqui.
// Exemplo: const config = require('../../config.js');
// E depois usar: const apiKey = config.GEMINI_KEY; 
const apiKey = "AIzaSyAkwD9w6Bo4hkyWLZa1uOjdglFvLDmseK4"; // Mantendo a chave hardcoded como no seu exemplo
// *******************************************************************

module.exports = {
    // 1. Definição do Comando de Barra
    data: new SlashCommandBuilder()
        .setName('gemini')
        .setDescription('Responde perguntas usando a IA do Google Gemini (REST API).')
        .addStringOption(option => 
            option.setName('pergunta')
                .setDescription('Digite sua pergunta para a IA.')
                .setRequired(true)
        ),

    // 2. Lógica de Execução
    async execute(interaction) {
        // Pega o argumento 'pergunta' da interação
        const textoOriginal = interaction.options.getString('pergunta');
        
        // Deferir a resposta para evitar "Interação Falhou"
        await interaction.deferReply(); 

        // Endpoint e System Instruction
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const systemInstruction = "Você é uma amiga simpática, empática e divertida. Responda em português, como se estivesse conversando informalmente com um amigo no Discord. Use poucas palavras, evite parágrafos longos e seja direta e leve.";

        try {
            // Payload COMPLETO E CORRIGIDO para a API REST
            const payload = {
                // systemInstruction AGORA É UM OBJETO DE CONTENT!
                systemInstruction: {
                    parts: [{
                        text: systemInstruction
                    }]
                },
                contents: [{
                    role: "user",
                    parts: [{
                        text: textoOriginal
                    }]
                }],
                generationConfig: { 
                    maxOutputTokens: 200, 
                    temperature: 0.8
                }
            };

            // Chamada à API via Axios
            const response = await axios.post(endpoint, payload, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            // Acessa a resposta de forma segura
            const resposta = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Nenhuma resposta foi retornada.";
            
            // Cria um Embed para a resposta final
            const embed = new EmbedBuilder()
                .setColor('#00ccff')
                .setAuthor({ name: 'Gemini 2.0 Flash (REST)', iconURL: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' })
                .setDescription(resposta.length > 4096 ? resposta.slice(0, 4093) + '...' : resposta)
                .setFooter({ text: `Para: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            // Edita a resposta inicial (deferReply)
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            // Loga o erro
            console.error("Erro ao chamar a API do bot:", error.response?.data || error.message);
            
            // Edita a resposta inicial com a mensagem de erro
            await interaction.editReply({ 
                content: `❌ Minha inteligência artificial se encontra off-line no momento. (Erro: ${error.response?.status || 'Desconhecido'})`,
                embeds: [] 
            });
        }
    }
};
