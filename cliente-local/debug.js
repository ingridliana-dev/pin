const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

// Configurar arquivo de log
const LOG_FILE = path.join(__dirname, 'debug.log');

// Função para registrar logs
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  // Registrar no console
  console.log(logMessage);
  
  // Registrar no arquivo
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Configurações
const SERVER_URL = process.env.SERVER_URL || 'https://pin-production.up.railway.app';
const TARGET_URL = process.env.TARGET_URL || 'https://localhost:47990/pin#PIN';

async function checkServer() {
  try {
    log(`Verificando conexão com o servidor: ${SERVER_URL}`);
    
    // Verificar se o servidor está acessível
    const response = await axios.get(`${SERVER_URL}`);
    log(`Servidor respondeu com status: ${response.status}`);
    
    // Verificar se há solicitações pendentes
    const pendingResponse = await axios.get(`${SERVER_URL}/api/pending-requests`);
    log(`Resposta da API de solicitações pendentes:`);
    log(JSON.stringify(pendingResponse.data, null, 2));
    
    // Verificar se o TARGET_URL está configurado corretamente
    log(`URL alvo configurada: ${TARGET_URL}`);
    
    log('Verificação concluída com sucesso!');
  } catch (error) {
    log(`ERRO: ${error.message}`);
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`Dados: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// Executar a verificação
checkServer();
