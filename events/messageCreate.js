const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const checarManutencao = require('../utils/checarManutencao');
const prefixesPath = './database/prefixos.json';
const afkPath = './database/afk.json';
const afkGlobalFile = path.resolve('./database/afk_global.json');
const maintenanceFile = './database/maintenance.json';
const { OWNERS } = require('../config.js');
const clPath = './database/clConfig.json';
// Guarda IDs de usuários que estão aguardando confirmação de divórcio
const pendingDivorces = new Set();
// Guarda IDs de usuários que estão aguardando confirmação de término de amizade
const pendingUnbfs = new Set();

// ===================================
// 🧠 CONFIGURAÇÃO DA API GEMINI (CORRIGIDO)
// ===================================

// Coloque estes requires no TOPO do seu messageCreate.js (se já não estiverem)
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ATENÇÃO: Verifique se o caminho './../config.js' está correto para sua estrutura!
const config = require('../config.js'); 

// Inicializa a API fora do evento para que só seja feito uma vez
const genAI = new GoogleGenerativeAI(config.GEMINI_KEY); 

// ===================================

// ✅ Debug control
const DEBUG_MODE = false;
function log(...args) {
  if (DEBUG_MODE) console.log(...args);
}

function logInfo(...args) {
  if (DEBUG_MODE) console.info(...args);
}
function logWarn(...args) {
  if (DEBUG_MODE) console.warn(...args);
}
function logError(...args) {
  console.error(...args); // Sempre exibe
}

function loadMaintenance() {
    if (!fs.existsSync(maintenanceFile)) return { active: false, reason: '' };
    return JSON.parse(fs.readFileSync(maintenanceFile, 'utf8'));
}

function getPrefixes() {
    if (!fs.existsSync(prefixesPath)) return {};
    return JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
}

function getAfkData() {
    if (!fs.existsSync(afkPath)) return {};
    return JSON.parse(fs.readFileSync(afkPath, 'utf8'));
}

function saveAfkData(data) {
    fs.writeFileSync(afkPath, JSON.stringify(data, null, 4));
}

function getAfkGlobalData() {
  if (fs.existsSync(afkGlobalFile)) {
    return JSON.parse(fs.readFileSync(afkGlobalFile, 'utf8'));
  }
  return {};
}

function saveAfkGlobalData(data) {
  fs.writeFileSync(afkGlobalFile, JSON.stringify(data, null, 4));
}

const cooldowns = new Map();
const cooldownWarningsCount = new Map();
const commandExecutionsCount = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        log('📩 Evento messageCreate disparado');
        
        // Dentro do execute(message, client)
if (message.author.bot) return;

// 🔗 Anti-link (deve vir aqui, antes do prefix check!)
const antilinkPath = './database/antilink.json';
if (fs.existsSync(antilinkPath)) {
  const db = JSON.parse(fs.readFileSync(antilinkPath, 'utf8') || '{}');
  const guildConfig = db[message.guild?.id];

  if (guildConfig && guildConfig.enabled) {
    // Ignora se o autor tiver permissões elevadas
    const permissionsToIgnore = ['Administrator', 'ManageMessages', 'ManageGuild'];
    if (message.member?.permissions.has(permissionsToIgnore)) return;

    const linkRegex = /(https?:\/\/|www\.|discord\.gg|discord\.com\/invite)/i;
    if (linkRegex.test(message.content)) {
      try {
        await message.delete();
        message.channel.send(`🚫 ${message.author}, links não são permitidos aqui.`)
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        return;
      } catch (err) {
        console.error('Erro ao deletar mensagem com link:', err);
      }
    }
  }
}
     // PUXA PREFIXO PADRÃO  //
     
        const prefixes = getPrefixes();
        const prefix = prefixes[message.guild?.id] || ';';
        
      // 🔍 DEBUG: Mostra no console tudo sobre a mensagem recebida
  log(`[DEBUG] ${message.author.tag} em ${message.guild.name}: ${message.content}`);

  // Detecta prefixos inválidos
  if (typeof prefix !== 'string' || !prefix.trim()) {
    logWarn(`[AVISO] Prefixo inválido detectado no servidor ${message.guild.name} (${message.guild.id}). Resetando para padrão.`);

    // Resetar no arquivo
    prefixes[message.guild.id] = ';';
    fs.writeFileSync('./database/prefixos.json', JSON.stringify(prefixes, null, 2));

    return message.channel.send('⚠️ O prefixo estava corrompido e foi resetado para `;`. Tente novamente.')
      .then(msg => setTimeout(() => msg.delete().catch(() => {}), 7000));
  }

  // Teste simples para garantir que o bot responde
  if (message.content === `${prefix}00`) {
    return message.channel.send('Online!');
  }

// 💬 Comando CL personalizado (deletar mensagens do autor pela palavra-chave)

if (message.guild && fs.existsSync(clPath)) {
  const clData = JSON.parse(fs.readFileSync(clPath, 'utf8') || '{}');
  const guildCL = clData[message.guild.id];

  if (guildCL && guildCL.enabled) {
    const keyword = (guildCL.keyword || `${prefix}cl`).toLowerCase();
    const content = message.content.trim().toLowerCase();

    if (content === keyword) {
      try {
        await message.delete().catch(() => {});

        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

        const userMessages = fetched.filter(m =>
          m.author.id === message.author.id &&
          m.createdTimestamp > fourteenDaysAgo
        );

        if (userMessages.size > 0) {
          await message.channel.bulkDelete(userMessages, true);
          log(`CL: ${message.author.tag} limpou mensagens em ${message.channel.name}`);
        }
      } catch (err) {
        console.error('CL: Erro ao limpar mensagens do autor:', err);
      }
      return; // para impedir continuar processando outros comandos
    }
  }
}

//manutenção de maquina //MENÇÃO AO BOT

        const maintenance = loadMaintenance();

        // 🛠️ Mencionou o bot durante manutenção (fica no topo)
if ([`<@${client.user.id}>`, `<@!${client.user.id}>`].includes(message.content.trim())) {
    if (checarManutencao(message, maintenance)) return;

    // ... restante da resposta à menção

    const embed = new EmbedBuilder()
        .setColor('#ffffff')
        .setAuthor({ name: 'Olá! Precisa de ajuda?', iconURL: client.user.displayAvatarURL() })
        .setDescription(
            `• Olá ${message.author}, sou o assistente deste servidor!\n\n` +
            `• Posso te ajudar com várias configurações e comandos.\n\n` +
            `• Prefixo aqui: \`${prefix}help\`\n` +
            `• Para alterar: \`${prefix}setprefix\``
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: `Solicitado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Suporte')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/NmWy87RjFe')
            .setEmoji('<:redseta:1329724263070171197>'),
        new ButtonBuilder()
            .setLabel('Adicionar')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
            .setEmoji('<:links:1329724255163781150>')
    );

    return message.reply({ embeds: [embed], components: [row] });
}

// Supondo que você tenha importado as funções e arquivos:
const afkFile = path.resolve('./database/afk.json');

function getAfkData() {
  if (fs.existsSync(afkFile)) {
    return JSON.parse(fs.readFileSync(afkFile, 'utf8'));
  }
  return {};
}

function saveAfkData(data) {
  fs.writeFileSync(afkFile, JSON.stringify(data, null, 4));
}



// === Seu código AFK melhorado com suporte ao global ===

let afkData = getAfkData();
let afkGlobalData = getAfkGlobalData();

const guildId = message.guild.id;
const member = message.member;
const userId = message.author.id;

// Garante que o servidor esteja no objeto local
if (!afkData[guildId]) afkData[guildId] = {};

// Remove AFK local se existir
if (afkData[guildId][userId]) {
  const oldNick = afkData[guildId][userId].oldNick;

  if (member && member.manageable && oldNick && member.nickname !== oldNick) {
    try {
      await member.setNickname(oldNick).catch(() => {});
    } catch {}
  }

  delete afkData[guildId][userId];
  saveAfkData(afkData);

  await message.reply('😁 Você não está mais **AFK**.')
    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
}

// Remove AFK global se existir (não mexe no apelido)
if (afkGlobalData[userId]) {
  delete afkGlobalData[userId];
  saveAfkGlobalData(afkGlobalData);

  await message.reply('😁 Você não está mais **AFK global**.')
    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
}

// Verifica se alguma pessoa mencionada está AFK (local ou global)
const mentionedAfks = new Map();

message.mentions.users.forEach(user => {
  const localAfk = afkData[guildId]?.[user.id];
  const globalAfk = afkGlobalData[user.id];

  if (localAfk) {
    mentionedAfks.set(user, {
      reason: localAfk.reason,
      timestamp: localAfk.timestamp,
      scope: 'local'
    });
  } else if (globalAfk) {
    mentionedAfks.set(user, {
      reason: globalAfk.reason,
      timestamp: globalAfk.timestamp,
      scope: 'global'
    });
  }
});

if (mentionedAfks.size > 0) {
  for (const [user, afkInfo] of mentionedAfks) {
    const motivo = afkInfo.reason?.trim() || 'Nenhum';
    const timestamp = afkInfo.timestamp
      ? `<t:${Math.floor(afkInfo.timestamp / 1000)}:R>`
      : 'há um tempo';
    const escopo = afkInfo.scope === 'global' ? 'global' : 'neste servidor';

    await message.channel.send(
      `😴 <@${message.author.id}>, o usuário <@${user.id}> está **AFK (${escopo})**.\n📚 Motivo: \`${motivo}\`\n🕓 Desde: ${timestamp}`
    ).then(msg => setTimeout(() => msg.delete().catch(() => {}), 20000));
  }
}


// 🔢 Verificação de resposta do Math Quiz
const { mathAnswers } = require('../commands/Diversão/mathquiz.js');

if (mathAnswers.has(message.author.id)) {
    const correct = mathAnswers.get(message.author.id);
    const userAnswer = parseInt(message.content.trim());

    if (isNaN(userAnswer)) return; // Ignora se não for número

    if (userAnswer === correct) {
        message.reply(`✅ Parabéns ${message.author}, você acertou! Ganhou **100 moedas**!`);
        // Aqui você coloca sua função de adicionar coins, exemplo:
        // addCoins(message.author.id, 100);
    } else {
        message.reply(`❌ Errou ${message.author}! O resultado era **${correct}**.`);
    }

    mathAnswers.delete(message.author.id);
    return; // Encerra aqui pra não executar outras coisas (como comandos)
}

// CONFIRMAÇÕES DE DIVORCIAR 

// Se o usuário está aguardando confirmação de divórcio e respondeu "sim"
if (pendingDivorces.has(message.author.id) && /^sim$/i.test(message.content.trim())) {
    // Carregue seus dados de casamento — ajuste para seu sistema de armazenamento
    const marryDataPath = './database/marry.json';
    let marryData = {};
    if (fs.existsSync(marryDataPath)) {
        marryData = JSON.parse(fs.readFileSync(marryDataPath, 'utf8'));
    }
    marryData.casamentos = marryData.casamentos || {};

    //const userId = message.author.id;
    const partnerId = marryData.casamentos[userId];

    if (!partnerId) {
        await message.reply(`💍 Você não está casado(a)!`);
        pendingDivorces.delete(userId);
        return;
    }

    // Remove o casamento
    delete marryData.casamentos[userId];
    delete marryData.casamentos[partnerId];

    // Se tiver outros dados relacionados, remova também
    if (marryData.tempos) {
        delete marryData.tempos[userId];
        delete marryData.tempos[partnerId];
    }

    fs.writeFileSync(marryDataPath, JSON.stringify(marryData, null, 4));

    await message.reply(`💔 <@${userId}>, você se divorciou de <@${partnerId}>!`);

    pendingDivorces.delete(userId);

    // Impede que a mensagem seja processada como comando depois
    return;
}

// CONFIRMAÇÕES DE UNBF (Término de Melhor Amizade)

if (pendingUnbfs.has(message.author.id) && /^sim$/i.test(message.content.trim())) {
    const bfPath = './database/bf.json';
    let bfData = {};
    if (fs.existsSync(bfPath)) {
        bfData = JSON.parse(fs.readFileSync(bfPath, 'utf8'));
    }
    bfData.amizades = bfData.amizades || {};

    //const userId = message.author.id;
    const partnerId = bfData.amizades[userId];

    if (!partnerId) {
        await message.reply('🫂 Você não tem um melhor amigo(a)!');
        pendingUnbfs.delete(userId);
        return;
    }

    // Remove a amizade dos dois
    delete bfData.amizades[userId];
    delete bfData.amizades[partnerId];

    fs.writeFileSync(bfPath, JSON.stringify(bfData, null, 4));

    await message.reply(`💔 <@${userId}> se afastou de <@${partnerId}>. Vocês não são mais melhores amigos.`);

    pendingUnbfs.delete(userId);
    return;
}


// === INÍCIO DO TRECHO DE RESPOSTA AO BOT (GEMINI via AXIOS - FINAL) ===

// 1. Checa se o bot foi mencionado na mensagem
const botMentionID = client.user.id;
const isBotMentioned = message.mentions.users.has(botMentionID);

// 2. Checa se é uma resposta direta (reply) à uma mensagem do bot
let isReplyToBot = false;
if (message.reference) {
  try {
    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
    if (repliedMessage && repliedMessage.author.id === botMentionID) {
      isReplyToBot = true;
    }
  } catch (err) {
    isReplyToBot = false;
  }
}

// 3. Condição para o bot responder: se foi mencionado OU se é um reply ao bot
if (isBotMentioned || isReplyToBot) {
  
  // Se for uma menção, remove a menção do conteúdo para enviar para a API.
  const textoOriginal = message.content.replace(`<@${botMentionID}>`, '').trim();
  
  // Se o texto estiver vazio depois de remover a menção/checar o reply, ignora.
  if (textoOriginal.length === 0) return; 

  try {
    await message.channel.sendTyping();

    // Requer o axios aqui ou no topo do seu arquivo principal.
    const axios = require("axios"); 
    
    // ATENÇÃO: Substitua a chave hardcoded pelo seu método de acesso seguro.
    const apiKey = "AIzaSyAkwD9w6Bo4hkyWLZa1uOjdglFvLDmseK4";
    
    // ENDPOINT CORRIGIDO: Inclui :generateContent e passa a chave como parâmetro ?key=
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const systemInstruction = "Você é uma amiga simpática, empática e divertida. Responda em português, como se estivesse conversando informalmente com um amigo no Discord. Use poucas palavras, evite parágrafos longos e seja direta e leve.";

    // O payload USA o formato 'contents' com 'role' e 'parts'
            const payload = {
      
      // 1. systemInstruction AGORA É UM OBJETO DE CONTENT!
      systemInstruction: {
        parts: [{
          text: systemInstruction // <--- A string vai aqui dentro!
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

    // Chamada à API
    const response = await axios.post(endpoint, payload, {
      // Headers corretos para a API REST
      headers: {
        "Content-Type": "application/json"
      }
    });

    // Acessa a resposta de forma segura
    const resposta = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Nenhuma resposta foi retornada.";

    await message.reply({
      content: resposta.length > 2000 ? resposta.slice(0, 1997) + "..." : resposta,
      allowedMentions: { repliedUser: true }
    });
  } catch (error) {
    // Loga o erro, incluindo a resposta do servidor se disponível (para debug de erros 400/403)
    console.error("Erro ao chamar a API do bot:", error.response?.data || error.message);
    
    // Tratamento de erro seguro
    await message.reply({
      content: "oi, minha api de inteligência Artificial se encontra off-line, não sei o que responder...",
      allowedMentions: { repliedUser: true }
    });
  }

  return; // Evita processar outras coisas
}

// === FIM DO TRECHO DE MENÇÃO AO BOT


// ❌ Ignora se não tiver prefixo (fica depois do AFK)
if (!message.content.startsWith(prefix) && !isReplyToBot) return;

// ❌ Verificação de Blacklist
const blacklistPath = './database/blacklist.json';
if (fs.existsSync(blacklistPath)) {
    const blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
    if (blacklist[message.author.id]) {
        return message.reply({
            content: `<:lock:1382067121218912317> <@${message.author.id}>, **Você está banido!**\n<:z_whiteregra:1330271051082371188> Não pode utilizar comandos.\n-# <:redseta:1329724263070171197> Motivo: **${blacklist[message.author.id].motivo}**`,
            allowedMentions: { repliedUser: true }
        });
    }
}

// 🛠️ Manutenção - bloqueia comandos para não donos, depois do prefixo
if (checarManutencao(message, maintenance)) return;

 // SISTEMA DE COOLDOWN ANTISSPAM 

// Configurações
//const userId = message.author.id;
const now = Date.now();
const cooldownTime = 3000; // 3 segundos

// Verifica cooldown
if (cooldowns.has(userId)) {
    const lastUsed = cooldowns.get(userId);
    const diff = now - lastUsed;

    if (diff < cooldownTime) {
        cooldownWarningsCount.set(userId, (cooldownWarningsCount.get(userId) || 0) + 1);
        log(`⏳ Cooldown: ${message.author.tag} (${cooldownWarningsCount.get(userId)}x)`);

        return message.reply(`<:relogio:1382896998700679230> **Eii** <@${userId}>, notei um pequeno fluxo de uso nesse servidor!
-# ㅤ<:v_branco4:1382060159139844196> Você já pode utilizar o comando novamente.`);
    }
}

// Aplica cooldown
cooldowns.set(userId, now);

        // 📥 Execução do comando
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        let command = client.commands.get(cmdName) ||
                      client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));

        if (!command) return;

        try {
            commandExecutionsCount.set(command.name, (commandExecutionsCount.get(command.name) || 0) + 1);
            log(`✅ Comando ${command.name} executado (total: ${commandExecutionsCount.get(command.name)})`);

            await command.execute(message, args, client);
            log(`📘 ${message.author.tag} executou: ${command.name} em #${message.channel.name}`);

            const config = require('../config');
            const logChannel = client.channels.cache.get(config.LOG_CHANNEL_ID);
            if (logChannel && message.guild) {
                let inviteLink = '❌ Não foi possível criar convite';
                try {
                    const invite = await message.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });
                    inviteLink = `[Clique aqui para entrar](${invite.url})`;
                } catch {}

                const serverEmbed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('Informações do Servidor')
                    .setThumbnail(message.guild.iconURL({ dynamic: true }))
                    .addFields({ name: 'Servidor', value: 
                        `> **• Nome:** ${message.guild.name}\n` +
                        `> **• ID:** \`${message.guild.id}\`\n` +
                        `> **• Dono:** <@${message.guild.ownerId}> (\`${message.guild.ownerId}\`)\n` +
                        `> **• Link do Servidor:** ${inviteLink}` })
                    .setTimestamp();

                const userEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Usuário', value: 
                            `> **• Nome:** ${message.author.tag}\n` +
                            `> **• ID:** \`${message.author.id}\`\n` +
                            `> **• Apelido:** ${message.member ? message.member.displayName : 'Nenhum'}\n` +
                            `> **• Conta criada:** <t:${Math.floor(message.author.createdTimestamp / 1000)}:R>` },
                        { name: 'Comando', value: 
                            `> **• Comando:** \`${command.name}\`\n` +
                            `> **• Canal:** #${message.channel.name}\n` +
                            `> **• Tempo:** <t:${Math.floor(Date.now() / 1000)}:R>` }
                    )
                    .setFooter({ text: 'kn0w. |' })
                    .setTimestamp();

                await logChannel.send({ embeds: [serverEmbed, userEmbed] });
            }

        } catch (err) {
            logError(`❌ Erro ao executar ${cmdName}:`, err);
            message.reply('❌ Ocorreu um erro ao executar esse comando.');
        }
    }
};