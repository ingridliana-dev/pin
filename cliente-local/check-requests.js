const axios = require('axios');

// URL do servidor no Railway
const SERVER_URL = 'https://pin-production.up.railway.app';

async function checkPendingRequests() {
  try {
    console.log(`Verificando solicitações pendentes em ${SERVER_URL}...`);
    
    // Verificar solicitações pendentes
    const response = await axios.get(`${SERVER_URL}/api/pending-requests`);
    
    console.log('Resposta do servidor:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const { pendingRequests } = response.data;
    
    if (pendingRequests && pendingRequests.length > 0) {
      console.log(`\nEncontradas ${pendingRequests.length} solicitações pendentes:`);
      
      pendingRequests.forEach((request, index) => {
        console.log(`\nSolicitação ${index + 1}:`);
        console.log(`  ID: ${request.id}`);
        console.log(`  PIN: ${request.pin}`);
        console.log(`  Nome do dispositivo: ${request.deviceName || 'N/A'}`);
        console.log(`  Timestamp: ${request.timestamp}`);
        console.log(`  Status: ${request.status}`);
      });
    } else {
      console.log('\nNenhuma solicitação pendente encontrada.');
    }
  } catch (error) {
    console.error('Erro ao verificar solicitações:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Executar a verificação
checkPendingRequests();
