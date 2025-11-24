const axios = require("axios");

module.exports = {
  name: "alice",
  aliases: ["ask", "lice"],
  description: "Converse com a IA Gemini, respondendo de forma natural.",
  category: "Utilidades",

  async execute(message, args) {
    // Junta todos os argumentos enviados após o comando em uma string só
    const pergunta = args.join(" ").trim();

    // Se a pessoa só digitou "kn0w" sem nada depois
    if (!pergunta) {
      return message.reply({
        content: `Olá <@${message.author.id}>, tudo bem? Como posso te ajudar hoje? 😊`,
        allowedMentions: { repliedUser: true } // Faz o bot marcar com @ e reply
      });
    }

    // Mostra que o bot está digitando
    await message.channel.sendTyping();

    // API Key da Nexus (essa precisa estar válida)
    const key = "nexus_dafc1ca2bd56ce3da65331f00425da01";

    // Endpoint para acesso ao modelo Gemini
    const endpoint = "https://nexus.adonis-except.xyz/gemini";

    try {
      // Envia a pergunta para a API da Gemini
      const response = await axios.post(endpoint, {
        userID: message.author.id, // ID do usuário para controle
        text: pergunta,            // A pergunta feita
        personality: "conversacional", // Define o estilo de resposta
        longitud: 700,             // Tamanho da resposta
        systemInstruction: "Você é uma amiga simpática, empática e divertida. Fale sempre em português de forma natural e humana, como se estivesse conversando com um amigo próximo, com carinho e bom humor.",
        model: "gemini-1.5-flash"  // Modelo leve e rápido
      }, {
        headers: {
          "x-api-key": key,
          "Content-Type": "application/json"
        }
      });

      // Se não houver resposta válida, mostra um erro
      const resposta = response.data?.result || "❌ Nenhuma resposta foi retornada.";

      // Envia a resposta como mensagem simples, com reply e sem embed
      await message.reply({
        content: `${resposta.length > 2000 ? resposta.slice(0, 1997) + "..." : resposta}`,
        allowedMentions: { repliedUser: true } // Faz o reply marcar o autor
      });
    } catch (error) {
      console.error("Erro ao chamar a API do Kn0w:", error);

      // Mensagem de erro visível ao usuário
      await message.reply({
        content: "❌ Ocorreu um erro ao tentar obter a resposta do bot.",
        allowedMentions: { repliedUser: true }
      });
    }
  }
};