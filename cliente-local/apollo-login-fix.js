/**
 * Módulo para lidar com o login no Apollo
 */

// Função para detectar e preencher o login do Apollo
async function handleApolloLogin(page, log) {
  try {
    log("Verificando se estamos na tela de login do Apollo...");
    
    // Capturar screenshot para depuração
    try {
      const screenshotPath = path.join(LOG_DIR, `apollo-login-screen.png`);
      await page.screenshot({ path: screenshotPath });
      log(`Screenshot da tela de login salvo em: ${screenshotPath}`);
    } catch (err) {
      log(`Erro ao capturar screenshot: ${err.message}`, "WARN");
    }
    
    // Verificar se há texto "Welcome to Apollo!" na página
    const isApolloLogin = await page.evaluate(() => {
      const pageText = document.body.innerText;
      return pageText.includes("Welcome to Apollo");
    });
    
    if (isApolloLogin) {
      log("Tela de login do Apollo detectada. Preenchendo credenciais...");
      
      try {
        // Abordagem direta para preencher os campos e clicar no botão
        await page.evaluate(() => {
          // Encontrar todos os campos de entrada
          const inputs = document.querySelectorAll('input');
          
          // Preencher o primeiro campo (Username) com 'admin'
          if (inputs.length > 0) {
            inputs[0].value = 'admin';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
            console.log("Campo Username preenchido com 'admin'");
          }
          
          // Preencher o segundo campo (Password) com 'admin'
          if (inputs.length > 1) {
            inputs[1].value = 'admin';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
            console.log("Campo Password preenchido com 'admin'");
          }
          
          // Encontrar e clicar no botão de login
          const buttons = document.querySelectorAll('button');
          for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].textContent.includes('Login')) {
              console.log("Botão Login encontrado, clicando...");
              buttons[i].click();
              return true;
            }
          }
          
          // Se não encontrar um botão específico, clicar no primeiro botão
          if (buttons.length > 0) {
            console.log("Clicando no primeiro botão disponível...");
            buttons[0].click();
            return true;
          }
          
          return false;
        });
        
        log("Credenciais preenchidas e botão clicado via JavaScript direto");
      } catch (error) {
        log(`Erro ao preencher via JavaScript: ${error.message}`, "WARN");
        
        // Abordagem alternativa usando Puppeteer diretamente
        try {
          log("Tentando abordagem alternativa com Puppeteer...");
          
          // Preencher Username
          log("Preenchendo Username com 'admin'");
          await page.waitForTimeout(1000);
          await page.focus('input[type="text"]');
          await page.keyboard.type("admin");
          
          // Preencher Password
          log("Preenchendo Password com 'admin'");
          await page.waitForTimeout(1000);
          await page.focus('input[type="password"]');
          await page.keyboard.type("admin");
          
          // Clicar no botão Login
          log("Clicando no botão Login");
          await page.waitForTimeout(1000);
          
          // Tentar diferentes seletores para o botão
          const loginButtonSelectors = [
            'button.btn-primary',
            'button.login-btn',
            'button:contains("Login")',
            'button'
          ];
          
          for (const selector of loginButtonSelectors) {
            try {
              await page.click(selector);
              log(`Clicado com sucesso usando seletor: ${selector}`);
              break;
            } catch (err) {
              log(`Não foi possível clicar usando seletor: ${selector}`, "DEBUG");
            }
          }
        } catch (puppeteerError) {
          log(`Erro na abordagem com Puppeteer: ${puppeteerError.message}`, "WARN");
        }
      }
      
      // Aguardar a navegação ser concluída
      log("Aguardando navegação após login...");
      await page.waitForTimeout(5000); // Aguardar 5 segundos independentemente
      
      try {
        await page.waitForNavigation({ 
          waitUntil: "networkidle2", 
          timeout: 10000 
        }).catch(() => {
          log("Navegação após login não detectada, continuando...");
        });
      } catch (navError) {
        log(`Erro ao aguardar navegação: ${navError.message}`, "WARN");
      }
      
      // Verificar se o login foi bem-sucedido
      const loginSuccess = await page.evaluate(() => {
        return !document.querySelector('input[type="password"]');
      });
      
      if (loginSuccess) {
        log("Login realizado com sucesso!");
        return true;
      } else {
        log("Login pode não ter sido bem-sucedido. Tentando continuar...", "WARN");
        
        // Tentar uma última abordagem - simular tecla Enter
        try {
          await page.keyboard.press('Enter');
          log("Tecla Enter pressionada como última tentativa");
          await page.waitForTimeout(3000);
        } catch (enterError) {
          log(`Erro ao pressionar Enter: ${enterError.message}`, "WARN");
        }
        return false;
      }
    } else {
      log("Não é uma tela de login do Apollo.");
      return false;
    }
  } catch (error) {
    log(`Erro ao lidar com login do Apollo: ${error.message}`, "ERROR");
    return false;
  }
}

// Exportar a função
module.exports = {
  handleApolloLogin
};
