/**
 * Módulo auxiliar para automação com Playwright
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

// Função para processar uma solicitação usando Playwright
async function processRequestWithPlaywright(request, log, options = {}) {
  const {
    targetUrl = process.env.TARGET_URL || 'https://localhost:47990/pin#PIN',
    logDir = path.join(__dirname, 'logs'),
    chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless = false
  } = options;

  let browser = null;
  
  try {
    // Iniciar o navegador
    log("Iniciando navegador Chrome via Playwright...");
    browser = await chromium.launch({
      headless: headless,
      executablePath: chromePath,
      args: [
        '--disable-web-security',
        '--ignore-certificate-errors',
        '--allow-running-insecure-content'
      ]
    });
    
    // Criar um novo contexto
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 800 }
    });
    
    // Abrir uma nova página
    const page = await context.newPage();
    
    // Configurar manipuladores de eventos
    page.on('console', msg => log(`Console [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => log(`Erro na página: ${err.message}`, "ERROR"));
    
    // Navegar para a URL alvo
    log(`Navegando para ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    
    // Capturar screenshot inicial
    try {
      const screenshotPath = path.join(logDir, `initial-page-${request.id}.png`);
      await page.screenshot({ path: screenshotPath });
      log(`Screenshot inicial salvo em: ${screenshotPath}`);
    } catch (err) {
      log(`Erro ao capturar screenshot: ${err.message}`, "WARN");
    }
    
    // Verificar se estamos na tela de login do Apollo
    log("Verificando se estamos na tela de login do Apollo...");
    
    // Verificar se há texto "Welcome to Apollo!" na página
    const isApolloLogin = await page.evaluate(() => {
      const pageText = document.body.innerText;
      return pageText.includes("Welcome to Apollo");
    });
    
    if (isApolloLogin) {
      log("Tela de login do Apollo detectada. Preenchendo credenciais...");
      
      // Preencher o campo Username
      log("Preenchendo campo Username com 'admin'");
      await page.fill('input[type="text"], input:nth-child(1)', 'admin');
      
      // Preencher o campo Password
      log("Preenchendo campo Password com 'admin'");
      await page.fill('input[type="password"], input:nth-child(2)', 'admin');
      
      // Clicar no botão Login
      log("Clicando no botão Login");
      await page.click('button:has-text("Login"), button.btn-primary, button');
      
      // Aguardar a navegação ser concluída
      log("Aguardando navegação após login...");
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        log("Navegação após login não detectada, continuando...");
      });
    } else {
      log("Não é uma tela de login do Apollo ou já estamos logados.");
    }
    
    // Aguardar um pouco para a página carregar completamente
    await page.waitForTimeout(3000);
    
    // Preencher o campo PIN
    log(`Preenchendo PIN: ${request.pin}`);
    
    // Tentar diferentes abordagens para preencher o PIN
    let pinFieldFilled = false;
    
    // Abordagem 1: Usar seletores específicos do Playwright
    try {
      // Tentar encontrar e preencher o campo de PIN
      const pinSelectors = [
        'input[placeholder="Pin"]',
        'input[name="pin"]',
        'input[type="number"]',
        'input[id*="pin" i]',
        'input:nth-child(1)'
      ];
      
      for (const selector of pinSelectors) {
        try {
          const pinField = await page.$(selector);
          if (pinField) {
            await page.fill(selector, request.pin);
            log(`PIN preenchido usando seletor: ${selector}`);
            pinFieldFilled = true;
            break;
          }
        } catch (err) {
          log(`Não foi possível usar seletor ${selector}: ${err.message}`, "DEBUG");
        }
      }
    } catch (error) {
      log(`Erro ao tentar preencher PIN com seletores: ${error.message}`, "WARN");
    }
    
    // Abordagem 2: Se a primeira falhar, usar JavaScript direto
    if (!pinFieldFilled) {
      log("Tentando preencher PIN via JavaScript direto...");
      
      try {
        pinFieldFilled = await page.evaluate((pin) => {
          // Tentar encontrar o campo de PIN por diferentes atributos
          const inputs = Array.from(document.querySelectorAll('input'));
          
          // Primeiro, procurar por campos que pareçam ser para PIN
          const pinField = inputs.find(input => 
            (input.placeholder && input.placeholder.toLowerCase().includes('pin')) ||
            (input.name && input.name.toLowerCase().includes('pin')) ||
            (input.id && input.id.toLowerCase().includes('pin')) ||
            input.type === 'number' ||
            input.maxLength === 4
          );
          
          // Se encontrar um campo específico para PIN
          if (pinField) {
            pinField.value = pin;
            pinField.dispatchEvent(new Event('input', { bubbles: true }));
            pinField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("Campo de PIN encontrado e preenchido");
            return true;
          }
          
          // Se não encontrar um campo específico, usar o primeiro campo de texto
          if (inputs.length > 0) {
            inputs[0].value = pin;
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
            console.log("Primeiro campo de entrada preenchido com PIN");
            return true;
          }
          
          return false;
        }, request.pin);
      } catch (jsError) {
        log(`Erro ao preencher PIN via JavaScript: ${jsError.message}`, "WARN");
      }
    }
    
    // Preencher o campo de nome do dispositivo, se fornecido
    if (request.deviceName) {
      log(`Preenchendo nome do dispositivo: ${request.deviceName}`);
      
      // Tentar diferentes abordagens para preencher o nome do dispositivo
      let deviceNameFilled = false;
      
      // Abordagem 1: Usar seletores específicos do Playwright
      try {
        // Tentar encontrar e preencher o campo de nome do dispositivo
        const deviceNameSelectors = [
          'input[placeholder="Optional: Device Name"]',
          'input[name="deviceName"]',
          'input[id*="device" i]',
          'input:nth-child(2)'
        ];
        
        for (const selector of deviceNameSelectors) {
          try {
            const deviceField = await page.$(selector);
            if (deviceField) {
              await page.fill(selector, request.deviceName);
              log(`Nome do dispositivo preenchido usando seletor: ${selector}`);
              deviceNameFilled = true;
              break;
            }
          } catch (err) {
            log(`Não foi possível usar seletor ${selector}: ${err.message}`, "DEBUG");
          }
        }
      } catch (error) {
        log(`Erro ao tentar preencher nome do dispositivo com seletores: ${error.message}`, "WARN");
      }
      
      // Abordagem 2: Se a primeira falhar, usar JavaScript direto
      if (!deviceNameFilled) {
        log("Tentando preencher nome do dispositivo via JavaScript direto...");
        
        try {
          deviceNameFilled = await page.evaluate((deviceName) => {
            // Tentar encontrar o campo de nome do dispositivo por diferentes atributos
            const inputs = Array.from(document.querySelectorAll("input"));
            
            // Primeiro, procurar por campos que pareçam ser para nome do dispositivo
            const deviceField = inputs.find(input => 
              (input.placeholder && (
                input.placeholder.toLowerCase().includes("device") || 
                input.placeholder.toLowerCase().includes("nome") ||
                input.placeholder.toLowerCase().includes("name")
              )) ||
              (input.name && (
                input.name.toLowerCase().includes("device") ||
                input.name.toLowerCase().includes("nome") ||
                input.name.toLowerCase().includes("name")
              )) ||
              (input.id && (
                input.id.toLowerCase().includes("device") ||
                input.id.toLowerCase().includes("nome") ||
                input.id.toLowerCase().includes("name")
              ))
            );
            
            // Se encontrar um campo específico para nome do dispositivo
            if (deviceField) {
              deviceField.value = deviceName;
              deviceField.dispatchEvent(new Event("input", { bubbles: true }));
              deviceField.dispatchEvent(new Event("change", { bubbles: true }));
              console.log("Campo de nome do dispositivo encontrado e preenchido");
              return true;
            }
            
            // Se não encontrar um campo específico, usar o segundo campo de texto
            if (inputs.length > 1) {
              inputs[1].value = deviceName;
              inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
              inputs[1].dispatchEvent(new Event("change", { bubbles: true }));
              console.log("Segundo campo de entrada preenchido com nome do dispositivo");
              return true;
            }
            
            return false;
          }, request.deviceName);
        } catch (jsError) {
          log(`Erro ao preencher nome do dispositivo via JavaScript: ${jsError.message}`, "WARN");
        }
      }
    }
    
    // Clicar no botão "Send" ou equivalente
    log("Procurando botão para enviar o formulário...");
    
    // Tentar diferentes abordagens para clicar no botão de envio
    let buttonClicked = false;
    
    // Abordagem 1: Usar seletores específicos do Playwright
    try {
      // Tentar encontrar e clicar no botão
      const buttonSelectors = [
        'button.btn.btn-primary',
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Send")',
        'button:has-text("Submit")',
        'button:has-text("Enviar")',
        'button'
      ];
      
      for (const selector of buttonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await page.click(selector);
            log(`Botão clicado usando seletor: ${selector}`);
            buttonClicked = true;
            break;
          }
        } catch (err) {
          log(`Não foi possível clicar usando seletor ${selector}: ${err.message}`, "DEBUG");
        }
      }
    } catch (error) {
      log(`Erro ao tentar clicar no botão com seletores: ${error.message}`, "WARN");
    }
    
    // Abordagem 2: Se a primeira falhar, usar JavaScript direto
    if (!buttonClicked) {
      log("Tentando clicar no botão via JavaScript direto...");
      
      try {
        buttonClicked = await page.evaluate(() => {
          // Tentar encontrar o botão por diferentes atributos
          const buttons = Array.from(document.querySelectorAll("button"));
          
          // Primeiro, procurar por botões que pareçam ser de envio
          const submitButton = buttons.find(button => 
            button.textContent.includes("Send") ||
            button.textContent.includes("Submit") ||
            button.textContent.includes("Enviar") ||
            button.classList.contains("btn-primary") ||
            button.type === "submit"
          );
          
          // Se encontrar um botão específico
          if (submitButton) {
            submitButton.click();
            console.log("Botão de envio encontrado e clicado");
            return true;
          }
          
          // Se não encontrar um botão específico, clicar no primeiro botão
          if (buttons.length > 0) {
            buttons[0].click();
            console.log("Primeiro botão clicado");
            return true;
          }
          
          // Tentar também inputs do tipo submit
          const submitInputs = document.querySelectorAll('input[type="submit"]');
          if (submitInputs.length > 0) {
            submitInputs[0].click();
            console.log("Input submit clicado");
            return true;
          }
          
          return false;
        });
      } catch (jsError) {
        log(`Erro ao clicar no botão via JavaScript: ${jsError.message}`, "WARN");
      }
    }
    
    // Abordagem 3: Última tentativa - pressionar Enter
    if (!buttonClicked) {
      log("Tentando pressionar Enter como última tentativa...");
      
      try {
        await page.keyboard.press("Enter");
        log("Tecla Enter pressionada para enviar o formulário");
        buttonClicked = true;
      } catch (keyboardError) {
        log(`Erro ao pressionar Enter: ${keyboardError.message}`, "ERROR");
      }
    }
    
    // Aguardar um pouco para ver o resultado
    await page.waitForTimeout(3000);
    
    // Capturar screenshot final
    try {
      const screenshotPath = path.join(logDir, `final-${request.id}.png`);
      await page.screenshot({ path: screenshotPath });
      log(`Screenshot final salvo em: ${screenshotPath}`);
    } catch (err) {
      log(`Erro ao capturar screenshot: ${err.message}`, "WARN");
    }
    
    // Fechar a página e o navegador
    await page.close();
    await browser.close();
    
    log(`Solicitação ${request.id} processada com sucesso!`);
    return true;
    
  } catch (error) {
    log(`Erro ao processar solicitação ${request.id}: ${error.message}`, "ERROR");
    
    // Fechar o navegador se estiver aberto
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    return false;
  }
}

module.exports = {
  processRequestWithPlaywright
};
