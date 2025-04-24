const puppeteer = require("puppeteer");
const axios = require("axios");
const dotenv = require("dotenv");
const notifier = require("node-notifier");
const path = require("path");
const fs = require("fs");

// Carregar variáveis de ambiente
dotenv.config();

// Configurar diretório de logs
const LOG_DIR = path.join(__dirname, "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Configurar arquivo de log
const LOG_FILE = path.join(
  LOG_DIR,
  `pin-automacao-${new Date().toISOString().split("T")[0]}.log`
);

// Função para registrar logs
function log(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  // Registrar no console
  console.log(logMessage);

  // Registrar no arquivo
  fs.appendFileSync(LOG_FILE, logMessage + "\n");

  // Mostrar notificação para erros
  if (level === "ERROR") {
    showNotification("Erro", message);
  }
}

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const TARGET_URL = process.env.TARGET_URL || "https://localhost:47990/pin#PIN";
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || "5000", 10);

// Variável para armazenar o navegador
let browser = null;

// Função para inicializar o navegador
async function initBrowser() {
  if (browser) return browser;

  log("Inicializando o navegador...");
  browser = await puppeteer.launch({
    headless: false, // Definido como false para visualizar o processo
    ignoreHTTPSErrors: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--allow-insecure-localhost",
    ],
  });

  // Lidar com o fechamento do navegador
  browser.on("disconnected", () => {
    log("Navegador foi fechado. Reinicializando...", "WARN");
    browser = null;
    setTimeout(initBrowser, 1000);
  });

  return browser;
}

// Função para mostrar notificações
function showNotification(title, message) {
  notifier.notify({
    title: title,
    message: message,
    icon: path.join(__dirname, "icon.png"), // Você pode adicionar um ícone personalizado
    sound: true,
    wait: false,
  });
}

// Função para processar uma solicitação
async function processRequest(request) {
  log(`Processando solicitação: PIN=${request.pin}, Device=${request.deviceName || "N/A"}`);
  
  try {
    // Inicializar o navegador se necessário
    const browser = await initBrowser();
    
    // Abrir uma nova página
    const page = await browser.newPage();
    
    // Configurar para ignorar erros de certificado
    await page.setBypassCSP(true);
    
    // Configurar para aceitar todos os tipos de conteúdo
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      req.continue();
    });
    
    // Navegar para a URL alvo
    log(`Navegando para ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

    // Aguardar o carregamento dos campos
    log("Aguardando carregamento dos campos...");
    await page.waitForSelector(".card-body");

    // Preencher o campo PIN
    log(`Preenchendo PIN: ${request.pin}`);
    await page.waitForSelector('input[placeholder="Pin"]');
    await page.type('input[placeholder="Pin"]', request.pin);

    // Preencher o campo de nome do dispositivo, se fornecido
    if (request.deviceName) {
      log(`Preenchendo nome do dispositivo: ${request.deviceName}`);
      await page.waitForSelector('input[placeholder="Optional: Device Name"]');
      await page.type(
        'input[placeholder="Optional: Device Name"]',
        request.deviceName
      );
    }

    // Clicar no botão "Send"
    log("Clicando no botão Send...");
    await page.waitForSelector("button.btn.btn-primary");
    await page.click("button.btn.btn-primary");

    // Aguardar um pouco para ver o resultado
    await page.waitForTimeout(3000);

    // Capturar screenshot para verificação
    log("Capturando screenshot...");
    const screenshotPath = path.join(LOG_DIR, `screenshot-${request.id}.png`);
    await page.screenshot({ path: screenshotPath });

    // Fechar a página
    await page.close();

    log(`Solicitação ${request.id} processada com sucesso!`);
    
    // Mostrar notificação de sucesso
    showNotification(
      'PIN Processado com Sucesso',
      `O PIN ${request.pin} foi processado com sucesso!`
    );

    // Marcar a solicitação como processada no servidor
    await markRequestAsProcessed(request.id, true, "Processado com sucesso");

    return true;
  } catch (error) {
    log(`Erro ao processar solicitação ${request.id}: ${error.message}`, 'ERROR');

    // Marcar a solicitação como falha no servidor
    await markRequestAsProcessed(request.id, false, error.message);

    return false;
  }
}

// Função para verificar se há novas solicitações
async function checkForRequests() {
  try {
    log("Verificando novas solicitações...", "DEBUG");
    const response = await axios.get(`${SERVER_URL}/api/pending-requests`);

    const { pendingRequests } = response.data;

    if (pendingRequests && pendingRequests.length > 0) {
      log(`Encontradas ${pendingRequests.length} solicitações pendentes.`);

      // Mostrar notificação
      showNotification(
        "Nova solicitação de PIN",
        `Recebida solicitação para processar PIN: ${pendingRequests[0].pin}`
      );

      // Processar a primeira solicitação pendente
      const request = pendingRequests[0];
      await processRequest(request);
    } else {
      log("Nenhuma solicitação pendente encontrada.", "DEBUG");
    }
  } catch (error) {
    log(`Erro ao verificar solicitações: ${error.message}`, "ERROR");
  }

  // Agendar a próxima verificação
  setTimeout(checkForRequests, CHECK_INTERVAL);
}

// Função para marcar uma solicitação como processada no servidor
async function markRequestAsProcessed(requestId, success, message) {
  try {
    await axios.post(`${SERVER_URL}/api/mark-processed`, {
      requestId,
      success,
      message,
    });
    log(
      `Solicitação ${requestId} marcada como ${
        success ? "concluída" : "falha"
      } no servidor.`
    );
  } catch (error) {
    log(
      `Erro ao marcar solicitação ${requestId} como processada: ${error.message}`,
      "ERROR"
    );
  }
}

// Função para criar um ícone na bandeja do sistema (apenas para Windows)
function setupTrayIcon() {
  try {
    log("Configurando ícone na bandeja do sistema...");
    
    // Mostrar notificação inicial
    showNotification(
      "Automação de PIN Iniciada",
      `Cliente conectado ao servidor: ${SERVER_URL}\nVerificando a cada ${CHECK_INTERVAL/1000} segundos.`
    );
    
    // Registrar que o aplicativo está em execução
    log("Aplicativo em execução na bandeja do sistema. Pressione Ctrl+C para encerrar.");
    
    // Capturar Ctrl+C para encerramento limpo
    process.on('SIGINT', () => {
      log("Encerrando aplicativo...", "WARN");
      if (browser) {
        browser.close().catch(() => {});
      }
      process.exit(0);
    });
  } catch (error) {
    log(`Erro ao configurar ícone na bandeja: ${error.message}`, "ERROR");
  }
}

// Função principal
async function main() {
  log("=== Cliente de Automação de PIN ===");
  log(`Servidor: ${SERVER_URL}`);
  log(`URL Alvo: ${TARGET_URL}`);
  log(`Intervalo de verificação: ${CHECK_INTERVAL}ms`);
  log("Iniciando...");
  
  // Configurar ícone na bandeja
  setupTrayIcon();
  
  // Inicializar o navegador
  await initBrowser();
  
  // Iniciar a verificação de solicitações
  checkForRequests();
}

// Iniciar o programa
main().catch((error) => {
  log(`Erro fatal: ${error.message}`, "ERROR");
  process.exit(1);
});
