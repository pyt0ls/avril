const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// Certifique-se de que o Axios esteja instalado: npm install axios
const axios = require("axios"); 

// *******************************************************************
// ATENÇÃO: Use uma variável de ambiente (ex: process.env.GEMINI_KEY)
const apiKey = "AIzaSyAkwD9w6Bo4hkyWLZa1uOjdglFvLDmseK4"; // Chave do Gemini
// *******************************************************************

module.exports = {
    // 1. Definição do Comando de Barra (Mantendo o nome 'avril')
    data: new SlashCommandBuilder()
        .setName('avril')
        .setDescription('Converse com o bot usando IA.')
        .addStringOption(option => 
            option.setName('pergunta')
                .setDescription('Sua pergunta para a IA.')
                .setRequired(true)
        ),

    // 2. Lógica de Execução (Lógica do Gemini)
    async execute(interaction) {
        // Pega o argumento 'pergunta' da interação
        const textoOriginal = interaction.options.getString('pergunta');
        const user = interaction.user;
        
        // Deferir a resposta para evitar "Interação Falhou"
        await interaction.deferReply(); 

        // Endpoint e System Instruction (Gemini REST API)
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        // Mantendo a personalidade gentil, mas você pode mudar para a advogada aqui
        const systemInstruction = "Você é uma advogada assistente muito gentil e educada, especializada em diversas áreas do direito. Responda em português formal, usando termos apropriados quando necessário, mas mantendo a clareza e a acessibilidade. Seja concisa, evite parágrafos longos, use vocabulário profissional e sempre ofereça uma saudação inicial.";

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

            // Chamada à API via Axios (POST para Gemini)
            const response = await axios.post(endpoint, payload, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            // Acessa a resposta de forma segura (Formato Gemini)
            const resposta = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Nenhuma resposta foi retornada.";
            
            // Cria um Embed para a resposta final (Usando o estilo 'avril' original)
            const embed = new EmbedBuilder()
                .setTitle('**avril (by pytols)**') // Ajustei o título
                .setDescription(
                    `**🤖 • Olá:** <@${user.id}> (${user.username})\n\n**✍️🏻 • R:** ${resposta.length > 1990 ? resposta.slice(0, 1990) + '...' : resposta}`
                )
                .setColor(0x00ccff) // Mudei a cor para o azul do Gemini
                .setFooter({
                    text: `${user.username} | abril`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Edita a resposta inicial (deferReply)
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            // Loga o erro
            console.error("Erro ao chamar a API do Gemini:", error.response?.data || error.message);
            
            // Edita a resposta inicial com a mensagem de erro
            await interaction.editReply({ 
                content: `❌ A inteligência artificial do avril se encontra off-line no momento. (Erro: ${error.response?.status || 'Desconhecido'})`,
                embeds: [] 
            });
        }
    }
};
