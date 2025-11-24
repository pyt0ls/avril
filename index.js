// ================================
// Captura erros globais
// ================================
process.on("unhandledRejection", (reason) => {
  console.error("🚨 Rejeição não tratada:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🚨 Exceção não tratada:", err);
});

// ================================

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();


// 📦 Carregar comandos (de forma recursiva)
function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.lstatSync(fullPath);

        if (stat.isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith('.js')) {
            const command = require(fullPath);
            if (command.name) {
                client.commands.set(command.name, command);
            } else {
                //console.warn(`⚠️ Comando ignorado (sem name): ${fullPath}`);
            }
        }
    }
}
loadCommands(path.join(__dirname, 'commands'));

//Carrega comandos por slash

client.slashCommands = new Collection();

function loadSlashCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadSlashCommands(fullPath); // vai para subpastas
        } else if (file.endsWith('.js')) {
            const command = require(fullPath);
            if ('data' in command && 'execute' in command) {
                client.slashCommands.set(command.data.name, command);
            } else {
                console.warn(`[⚠️] O Slash Command em ${fullPath} está sem "data" ou "execute".`);
            }
        }
    }
}
loadSlashCommands(path.join(__dirname, 'commands/Slash'));


// 📂 Carregar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

const registeredEvents = new Set();

for (const file of eventFiles) {
    //console.log('Carregando evento:', file);
    // Log para mostrar qual arquivo está sendo carregado

    const event = require(path.join(eventsPath, file));
    
    if (!event.name) continue; // Pula arquivos sem nome de evento

    if (registeredEvents.has(event.name)) {
        //console.warn(`⚠️ Evento '${event.name}' já registrado, ignorando duplicata.`);
        continue;
    }

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }

    registeredEvents.add(event.name);
    //console.log(`✅ Evento '${event.name}' registrado.`);
}

// ✅ Bot pronto

client.once('clientReady', (c) => {
  console.log(`✅ ${c.user.tag} conectado!`);
  
  const atividades = [
    'Prefixo: ; | /help'
  ];

  let i = 0;

  setInterval(() => {
    client.user.setPresence({
      activities: [{
        name: atividades[i],
        type: ActivityType.Streaming,
        url: 'https://twitch.tv/avril' // precisa ter uma URL se for streaming
      }],
      status: 'online'
    });

    i = (i + 1) % atividades.length;
  }, 15000); // troca a cada 15 segundos
});

// 🔐 Login
client.login(config.TOKEN);