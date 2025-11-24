const { REST, Routes } = require('discord.js');
const { TOKEN, CLIENT_ID, GUILD_ID } = require('./config'); // Adicione GUILD_ID no seu config.js
const fs = require('fs');
const path = require('path');

const globalCommands = [];
const guildCommands = [];
const slashPath = path.join(__dirname, 'commands/Slash');

// Função para carregar comandos com separação entre global e guilda
function carregarComandos(pasta) {
  const itens = fs.readdirSync(pasta);

  for (const item of itens) {
    const itemPath = path.join(pasta, item);

    if (fs.statSync(itemPath).isDirectory()) {
      carregarComandos(itemPath);
    } else if (item.endsWith('.js')) {
      try {
        const command = require(itemPath);

        if (!command.data) {
          console.warn(`[AVISO] O comando em "${itemPath}" está sem o campo "data".`);
          continue;
        }

        if (!command.execute) {
          console.warn(`[AVISO] O comando em "${itemPath}" está sem a função "execute".`);
          continue;
        }

        if (typeof command.data.toJSON !== 'function') {
          console.warn(`[ERRO] O campo "data" em "${itemPath}" não possui um método .toJSON(). Provavelmente não é um SlashCommandBuilder.`);
          continue;
        }

        // Decide onde registrar
        if (command.global === false) {
          guildCommands.push(command.data.toJSON());
          console.log(`[📦 Guilda] ${command.data.name} (${itemPath})`);
        } else {
          globalCommands.push(command.data.toJSON());
          console.log(`[🌐 Global] ${command.data.name} (${itemPath})`);
        }

      } catch (err) {
        console.error(`[❌ ERRO] Ao carregar o comando "${itemPath}":`, err);
      }
    }
  }
}

carregarComandos(slashPath);

console.log(`\n📋 Total Global: ${globalCommands.length}, Guilda: ${guildCommands.length}`);

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    // Atualiza comandos globais
    if (globalCommands.length) {
      console.log(`\n🌐 Atualizando ${globalCommands.length} comando(s) globais...`);
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: globalCommands }
      );
      console.log('✅ Comandos globais registrados com sucesso!');
    }

    // Atualiza comandos de guilda
    if (guildCommands.length) {
      console.log(`\n📦 Atualizando ${guildCommands.length} comando(s) de guilda...`);
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: guildCommands }
      );
      console.log('✅ Comandos de guilda registrados com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();