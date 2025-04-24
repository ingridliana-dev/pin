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

      // ===== NOVA IMPLEMENTAÇÃO RECOMENDADA =====

      // 1. Aguardar um tempo para garantir que a página carregou completamente
      log("Aguardando carregamento completo da página...");
      await page.waitForTimeout(3000);

      // 2. Verificar e registrar todos os campos de entrada disponíveis para depuração
      const inputFields = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input"));
        return inputs.map((input) => ({
          type: input.type,
          id: input.id,
          name: input.name,
          placeholder: input.placeholder,
          className: input.className,
        }));
      });

      log(`Campos de entrada encontrados: ${JSON.stringify(inputFields)}`);

      // 3. Esperar explicitamente pelo campo de username
      log("Esperando pelo campo de username...");
      try {
        // Tentar esperar pelo ID específico primeiro
        await page
          .waitForSelector("#usernameInput", { timeout: 5000 })
          .then(() => log("Campo #usernameInput encontrado"))
          .catch(() =>
            log("Campo #usernameInput não encontrado, tentando alternativas")
          );
      } catch (err) {
        log(`Erro ao esperar pelo campo de username: ${err.message}`, "WARN");
      }

      // 4. Preencher o campo de username
      log("Preenchendo campo de username com 'admin'...");
      try {
        // Tentar com ID específico primeiro
        const usernameExists = await page.$("#usernameInput");
        if (usernameExists) {
          // Limpar o campo primeiro
          await page.evaluate(() => {
            document.getElementById("usernameInput").value = "";
          });

          // Preencher o campo com type
          await page.type("#usernameInput", "admin", { delay: 100 });
          log("Campo username preenchido com sucesso usando #usernameInput");
        } else {
          // Tentar com seletores alternativos
          log("Tentando seletores alternativos para username...");
          const alternativeSelectors = [
            'input[type="text"]',
            'input[placeholder*="Username" i]',
            'input[placeholder*="User" i]',
            'input:not([type="password"])',
          ];

          for (const selector of alternativeSelectors) {
            const exists = await page.$(selector);
            if (exists) {
              await page.type(selector, "admin", { delay: 100 });
              log(`Campo username preenchido com sucesso usando ${selector}`);
              break;
            }
          }
        }
      } catch (err) {
        log(`Erro ao preencher username: ${err.message}`, "WARN");
      }

      // 5. Aguardar um pouco antes de preencher a senha
      await page.waitForTimeout(1000);

      // 6. Esperar explicitamente pelo campo de password
      log("Esperando pelo campo de password...");
      try {
        await page
          .waitForSelector("#passwordInput", { timeout: 5000 })
          .then(() => log("Campo #passwordInput encontrado"))
          .catch(() =>
            log("Campo #passwordInput não encontrado, tentando alternativas")
          );
      } catch (err) {
        log(`Erro ao esperar pelo campo de password: ${err.message}`, "WARN");
      }

      // 7. Preencher o campo de password
      log("Preenchendo campo de password com 'admin'...");
      try {
        // Tentar com ID específico primeiro
        const passwordExists = await page.$("#passwordInput");
        if (passwordExists) {
          // Limpar o campo primeiro
          await page.evaluate(() => {
            document.getElementById("passwordInput").value = "";
          });

          // Preencher o campo com type
          await page.type("#passwordInput", "admin", { delay: 100 });
          log("Campo password preenchido com sucesso usando #passwordInput");
        } else {
          // Tentar com seletores alternativos
          log("Tentando seletores alternativos para password...");
          const alternativeSelectors = [
            'input[type="password"]',
            'input[placeholder*="Password" i]',
            'input[placeholder*="Senha" i]',
          ];

          for (const selector of alternativeSelectors) {
            const exists = await page.$(selector);
            if (exists) {
              await page.type(selector, "admin", { delay: 100 });
              log(`Campo password preenchido com sucesso usando ${selector}`);
              break;
            }
          }
        }
      } catch (err) {
        log(`Erro ao preencher password: ${err.message}`, "WARN");
      }

      // 8. Aguardar um pouco antes de clicar no botão
      await page.waitForTimeout(1000);

      // 9. Esperar explicitamente pelo botão de login
      log("Esperando pelo botão de login...");
      try {
        // Tentar diferentes seletores para o botão
        const loginButtonSelectors = [
          "button.btn-primary",
          "button.login-button",
          'button[type="submit"]',
          "button",
        ];

        let buttonClicked = false;

        for (const selector of loginButtonSelectors) {
          try {
            const buttonExists = await page.$(selector);
            if (buttonExists) {
              // Esperar que o botão esteja visível e clicável
              await page.waitForSelector(selector, {
                visible: true,
                timeout: 2000,
              });

              // Clicar no botão
              await page.click(selector);
              log(`Botão de login clicado com sucesso usando ${selector}`);
              buttonClicked = true;
              break;
            }
          } catch (err) {
            log(
              `Não foi possível usar seletor de botão ${selector}: ${err.message}`,
              "DEBUG"
            );
          }
        }

        // Se não conseguiu clicar em nenhum botão, tentar com JavaScript direto
        if (!buttonClicked) {
          log("Tentando clicar no botão via JavaScript direto...");

          try {
            buttonClicked = await page.evaluate(() => {
              // Procurar por botões que contenham o texto "Login"
              const buttons = Array.from(document.querySelectorAll("button"));
              const loginButton = buttons.find(
                (button) =>
                  button.textContent.includes("Login") ||
                  button.textContent.trim() === "Login"
              );

              if (loginButton) {
                console.log("Botão de login encontrado via JS, clicando...");
                loginButton.click();
                return true;
              }

              // Se não encontrar um botão específico com texto "Login", pegar o primeiro botão
              if (buttons.length > 0) {
                console.log("Clicando no primeiro botão disponível via JS...");
                buttons[0].click();
                return true;
              }

              return false;
            });

            if (buttonClicked) {
              log("Botão clicado com sucesso via JavaScript");
            } else {
              // Se ainda não conseguiu, tentar pressionar Enter
              log(
                "Não foi possível clicar no botão via JS, tentando pressionar Enter"
              );
              await page.keyboard.press("Enter");
              log("Tecla Enter pressionada");
            }
          } catch (jsErr) {
            log(
              `Erro ao tentar clicar via JavaScript: ${jsErr.message}`,
              "WARN"
            );
            // Tentar pressionar Enter como último recurso
            await page.keyboard.press("Enter");
            log("Tecla Enter pressionada como último recurso");
          }
        }
      } catch (err) {
        log(`Erro ao clicar no botão de login: ${err.message}`, "WARN");

        // Última tentativa - pressionar Enter
        try {
          await page.keyboard.press("Enter");
          log("Tecla Enter pressionada como última tentativa");
        } catch (enterErr) {
          log(`Erro ao pressionar Enter: ${enterErr.message}`, "ERROR");
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
