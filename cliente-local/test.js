const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
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
const LOG_FILE = path.join(LOG_DIR, `test-${new Date().toISOString().split("T")[0]}.log`);

// Função para registrar logs
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  // Registrar no console
  console.log(logMessage);
  
  // Registrar no arquivo
  fs.appendFileSync(LOG_FILE, logMessage + "\n");
}

const TARGET_URL = process.env.TARGET_URL || "https://localhost:47990/pin#PIN";

// Função para testar o preenchimento do formulário
async function testFormFill() {
  log("Iniciando teste de preenchimento de formulário...");
  
  let browser = null;
  
  try {
    // Inicializar o navegador
    log("Inicializando o navegador...");
    browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list",
        "--allow-insecure-localhost",
      ],
    });
    
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
    const testPin = "1234";
    log(`Preenchendo PIN: ${testPin}`);
    await page.waitForSelector('input[placeholder="Pin"]');
    await page.type('input[placeholder="Pin"]', testPin);
    
    // Preencher o campo de nome do dispositivo
    const testDeviceName = "Teste";
    log(`Preenchendo nome do dispositivo: ${testDeviceName}`);
    await page.waitForSelector('input[placeholder="Optional: Device Name"]');
    await page.type('input[placeholder="Optional: Device Name"]', testDeviceName);
    
    // Clicar no botão "Send"
    log("Clicando no botão Send...");
    await page.waitForSelector("button.btn.btn-primary");
    await page.click("button.btn.btn-primary");
    
    // Aguardar um pouco para ver o resultado
    await page.waitForTimeout(3000);
    
    // Capturar screenshot para verificação
    log("Capturando screenshot...");
    const screenshotPath = path.join(LOG_DIR, `test-screenshot.png`);
    await page.screenshot({ path: screenshotPath });
    
    log("Teste concluído com sucesso!");
    
    // Fechar o navegador após 10 segundos
    setTimeout(() => {
      browser.close();
    }, 10000);
    
  } catch (error) {
    log(`ERRO: ${error.message}`);
    if (browser) {
      browser.close();
    }
  }
}

// Executar o teste
testFormFill();
