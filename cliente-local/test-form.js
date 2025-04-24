const puppeteer = require("puppeteer");

// URL alvo
const TARGET_URL = "https://localhost:47990/pin#PIN";

// Dados de teste
const TEST_PIN = "1234";
const TEST_DEVICE_NAME = "Teste";

async function testForm() {
  console.log("Iniciando teste de preenchimento de formulário...");

  let browser = null;

  try {
    // Inicializar o navegador
    console.log("Inicializando o navegador...");
    // Usar o Chrome instalado em vez do navegador embutido
    browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Caminho para o Chrome instalado
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list",
        "--allow-insecure-localhost",
        "--disable-web-security",
        "--allow-running-insecure-content",
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
    console.log(`Navegando para ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

    // Verificar se há aviso de segurança e contorná-lo
    console.log("Verificando se há aviso de segurança...");
    try {
      // Verificar se o botão "Avançadas" está presente
      const advancedButtonExists = await page.evaluate(() => {
        // Procurar por botões que contenham o texto "Avançadas"
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.some((button) =>
          button.textContent.includes("Avançadas")
        );
      });

      if (advancedButtonExists) {
        console.log('Aviso de segurança detectado. Clicando em "Avançadas"...');

        // Clicar no botão "Avançadas" usando evaluate
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const advancedButton = buttons.find((button) =>
            button.textContent.includes("Avançadas")
          );
          if (advancedButton) advancedButton.click();
        });

        // Aguardar um pouco para o link aparecer
        await page.waitForTimeout(1000);

        // Verificar e clicar no link "Ir para localhost (não seguro)"
        const proceedLinkExists = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("a"));
          return links.some(
            (link) =>
              link.textContent.includes("Ir para localhost") ||
              link.textContent.includes("não seguro")
          );
        });

        if (proceedLinkExists) {
          console.log('Clicando em "Ir para localhost (não seguro)"...');

          // Clicar no link usando evaluate
          await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll("a"));
            const proceedLink = links.find(
              (link) =>
                link.textContent.includes("Ir para localhost") ||
                link.textContent.includes("não seguro")
            );
            if (proceedLink) proceedLink.click();
          });

          // Aguardar a navegação ser concluída
          await page.waitForNavigation({ waitUntil: "networkidle2" });
        }
      } else {
        console.log("Nenhum aviso de segurança detectado.");
      }
    } catch (error) {
      console.error(`Erro ao lidar com aviso de segurança: ${error.message}`);
      // Continuar mesmo se houver erro, pois pode ser que o aviso não apareça
    }

    // Verificar se há tela de login e fazer login
    console.log("Verificando se há tela de login...");
    try {
      // Aguardar um pouco para a página carregar
      await page.waitForTimeout(2000);

      // Verificar se há campos de login e senha
      const hasLoginForm = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input"));
        return inputs.some(
          (input) =>
            input.type === "text" ||
            input.type === "password" ||
            input.placeholder === "Username" ||
            input.placeholder === "Password"
        );
      });

      if (hasLoginForm) {
        console.log("Tela de login detectada. Preenchendo credenciais...");

        // Preencher o campo de login
        await page.type(
          'input[type="text"], input[placeholder="Username"]',
          "admin"
        );

        // Preencher o campo de senha
        await page.type(
          'input[type="password"], input[placeholder="Password"]',
          "admin"
        );

        // Clicar no botão de login
        await page.evaluate(() => {
          // Procurar por botões que possam ser de login
          const buttons = Array.from(
            document.querySelectorAll('button, input[type="submit"]')
          );
          const loginButton = buttons.find(
            (button) =>
              button.textContent.includes("Login") ||
              button.textContent.includes("Entrar") ||
              button.value === "Login" ||
              button.value === "Entrar" ||
              button.type === "submit"
          );

          if (loginButton) loginButton.click();
        });

        // Aguardar a navegação ser concluída
        await page
          .waitForNavigation({ waitUntil: "networkidle2" })
          .catch(() => {
            console.log("Navegação após login não detectada, continuando...");
          });

        console.log("Login realizado com sucesso!");
      } else {
        console.log("Nenhuma tela de login detectada.");
      }
    } catch (error) {
      console.error(`Erro ao lidar com tela de login: ${error.message}`);
      // Continuar mesmo se houver erro, pois pode ser que a tela de login não apareça
    }

    // Aguardar o carregamento dos campos
    console.log("Aguardando carregamento dos campos...");
    try {
      await page.waitForSelector(".card-body", { timeout: 10000 });
      console.log("Campos carregados com sucesso!");

      // Preencher o campo PIN
      console.log(`Preenchendo PIN: ${TEST_PIN}`);
      await page.waitForSelector('input[placeholder="Pin"]');
      await page.type('input[placeholder="Pin"]', TEST_PIN);

      // Preencher o campo de nome do dispositivo
      console.log(`Preenchendo nome do dispositivo: ${TEST_DEVICE_NAME}`);
      await page.waitForSelector('input[placeholder="Optional: Device Name"]');
      await page.type(
        'input[placeholder="Optional: Device Name"]',
        TEST_DEVICE_NAME
      );

      // Clicar no botão "Send"
      console.log("Clicando no botão Send...");
      await page.waitForSelector("button.btn.btn-primary");
      await page.click("button.btn.btn-primary");

      // Aguardar um pouco para ver o resultado
      await page.waitForTimeout(3000);

      console.log("Teste concluído com sucesso!");
    } catch (error) {
      console.error(`Erro ao interagir com o formulário: ${error.message}`);

      // Capturar screenshot para depuração
      try {
        await page.screenshot({ path: "error-screenshot.png" });
        console.log("Screenshot de erro salvo como error-screenshot.png");
      } catch (err) {
        console.error(`Erro ao capturar screenshot: ${err.message}`);
      }
    }

    // Manter o navegador aberto por 10 segundos para visualização
    console.log("Aguardando 10 segundos antes de fechar o navegador...");
    await page.waitForTimeout(10000);

    // Fechar o navegador
    await browser.close();
  } catch (error) {
    console.error(`Erro fatal: ${error.message}`);
    if (browser) {
      await browser.close();
    }
  }
}

// Executar o teste
testForm();
