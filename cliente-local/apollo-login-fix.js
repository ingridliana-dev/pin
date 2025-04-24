/**
 * Módulo para lidar com o login no Apollo
 */
const path = require("path");

// Função para detectar e preencher o login do Apollo
async function handleApolloLogin(page, log, LOG_DIR) {
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
        // Abordagem direta para preencher os campos usando os IDs específicos
        await page.evaluate(() => {
          // Preencher o campo Username com 'admin' usando o ID específico
          const usernameInput = document.getElementById("usernameInput");
          if (usernameInput) {
            usernameInput.value = "admin";
            usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
            usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
            console.log(
              "Campo Username (usernameInput) preenchido com 'admin'"
            );
          } else {
            console.log(
              "Campo usernameInput não encontrado, tentando alternativas"
            );
            // Fallback para o primeiro input se o ID não for encontrado
            const inputs = document.querySelectorAll('input[type="text"]');
            if (inputs.length > 0) {
              inputs[0].value = "admin";
              inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
              inputs[0].dispatchEvent(new Event("change", { bubbles: true }));
              console.log("Campo Username alternativo preenchido com 'admin'");
            }
          }

          // Preencher o campo Password com 'admin' usando o ID específico
          const passwordInput = document.getElementById("passwordInput");
          if (passwordInput) {
            passwordInput.value = "admin";
            passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
            passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
            console.log(
              "Campo Password (passwordInput) preenchido com 'admin'"
            );
          } else {
            console.log(
              "Campo passwordInput não encontrado, tentando alternativas"
            );
            // Fallback para o primeiro input password se o ID não for encontrado
            const inputs = document.querySelectorAll('input[type="password"]');
            if (inputs.length > 0) {
              inputs[0].value = "admin";
              inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
              inputs[0].dispatchEvent(new Event("change", { bubbles: true }));
              console.log("Campo Password alternativo preenchido com 'admin'");
            }
          }

          // Encontrar e clicar no botão de login
          const buttons = document.querySelectorAll("button");
          for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].textContent.includes("Login")) {
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

          // Preencher Username usando o ID específico
          log("Preenchendo Username com 'admin'");
          await page.waitForTimeout(1000);

          // Tentar usar o ID específico primeiro
          try {
            await page.focus("#usernameInput");
            await page.keyboard.type("admin");
            log("Campo Username preenchido usando #usernameInput");
          } catch (err) {
            log(
              "Não foi possível usar #usernameInput, tentando alternativa",
              "WARN"
            );
            await page.focus('input[type="text"]');
            await page.keyboard.type("admin");
          }

          // Preencher Password usando o ID específico
          log("Preenchendo Password com 'admin'");
          await page.waitForTimeout(1000);

          // Tentar usar o ID específico primeiro
          try {
            await page.focus("#passwordInput");
            await page.keyboard.type("admin");
            log("Campo Password preenchido usando #passwordInput");
          } catch (err) {
            log(
              "Não foi possível usar #passwordInput, tentando alternativa",
              "WARN"
            );
            await page.focus('input[type="password"]');
            await page.keyboard.type("admin");
          }

          // Clicar no botão Login
          log("Clicando no botão Login");
          await page.waitForTimeout(1000);

          // Tentar diferentes seletores para o botão
          const loginButtonSelectors = [
            "button.btn-primary",
            "button.login-btn",
            'button:contains("Login")',
            "button",
          ];

          for (const selector of loginButtonSelectors) {
            try {
              await page.click(selector);
              log(`Clicado com sucesso usando seletor: ${selector}`);
              break;
            } catch (err) {
              log(
                `Não foi possível clicar usando seletor: ${selector}`,
                "DEBUG"
              );
            }
          }
        } catch (puppeteerError) {
          log(
            `Erro na abordagem com Puppeteer: ${puppeteerError.message}`,
            "WARN"
          );
        }
      }

      // Aguardar a navegação ser concluída
      log("Aguardando navegação após login...");
      await page.waitForTimeout(5000); // Aguardar 5 segundos independentemente

      try {
        await page
          .waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 10000,
          })
          .catch(() => {
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
        log(
          "Login pode não ter sido bem-sucedido. Tentando continuar...",
          "WARN"
        );

        // Tentar uma última abordagem - simular tecla Enter
        try {
          await page.keyboard.press("Enter");
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
  handleApolloLogin,
};
