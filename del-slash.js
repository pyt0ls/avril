const { REST, Routes } = require('discord.js');
const { TOKEN, CLIENT_ID } = require('./config'); // ajuste o caminho se precisar

const COMMAND_ID = '1442245256790671515'; // Coloque aqui o ID do comando global

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function deleteGlobalCommand() {
  try {
    await rest.delete(Routes.applicationCommand(CLIENT_ID, COMMAND_ID));
    console.log('Comando global apagado com sucesso!');
  } catch (error) {
    console.error('Erro ao apagar comando global:', error);
  }
}

deleteGlobalCommand();