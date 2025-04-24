const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Armazenar a última solicitação recebida
let lastRequest = null;
let requestQueue = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Rota principal - Servir a página HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota para receber o PIN e o nome do dispositivo
app.post("/submit", (req, res) => {
  const { pin, deviceName } = req.body;
  
  // Validar o PIN (deve ter 4 dígitos)
  if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
    return res
      .status(400)
      .json({ success: false, message: "O PIN deve ter 4 dígitos numéricos" });
  }

  // Armazenar a solicitação
  const request = {
    id: Date.now().toString(),
    pin,
    deviceName: deviceName || '',
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  // Adicionar à fila
  requestQueue.push(request);
  lastRequest = request;

  console.log(`Nova solicitação recebida: PIN=${pin}, Device=${deviceName || 'N/A'}`);

  // Retornar sucesso
  return res.json({
    success: true,
    message: "Solicitação recebida com sucesso! O cliente local processará em breve.",
    requestId: request.id
  });
});

// Rota para o cliente local verificar se há novas solicitações
app.get('/api/pending-requests', (req, res) => {
  // Retornar as solicitações pendentes
  const pendingRequests = requestQueue.filter(req => req.status === 'pending');
  return res.json({ pendingRequests });
});

// Rota para o cliente local marcar uma solicitação como processada
app.post('/api/mark-processed', (req, res) => {
  const { requestId, success, message } = req.body;
  
  // Encontrar a solicitação
  const requestIndex = requestQueue.findIndex(req => req.id === requestId);
  
  if (requestIndex === -1) {
    return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
  }
  
  // Atualizar o status
  requestQueue[requestIndex].status = success ? 'completed' : 'failed';
  requestQueue[requestIndex].processedAt = new Date().toISOString();
  requestQueue[requestIndex].message = message;
  
  console.log(`Solicitação ${requestId} marcada como ${requestQueue[requestIndex].status}`);
  
  return res.json({ success: true });
});

// Rota para verificar o status de uma solicitação específica
app.get('/api/request-status/:requestId', (req, res) => {
  const { requestId } = req.params;
  
  // Encontrar a solicitação
  const request = requestQueue.find(req => req.id === requestId);
  
  if (!request) {
    return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
  }
  
  return res.json({ success: true, request });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para usar a aplicação`);
});
