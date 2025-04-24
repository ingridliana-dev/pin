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

        // Tentar encontrar e preencher o campo de username
        try {
          // Tentar com ID específico primeiro
          const usernameExists = await page.$("#usernameInput");
          if (usernameExists) {
            console.log("Campo #usernameInput encontrado");
            await page.type("#usernameInput", "admin", { delay: 100 });
          } else {
            // Tentar com seletores alternativos
            console.log("Tentando seletores alternativos para username...");
            const alternativeSelectors = [
              'input[type="text"]',
              'input[placeholder*="Username" i]',
              'input[placeholder*="User" i]',
              'input:not([type="password"])',
            ];

            let usernameFieldFilled = false;

            for (const selector of alternativeSelectors) {
              try {
                const exists = await page.$(selector);
                if (exists) {
                  await page.type(selector, "admin", { delay: 100 });
                  console.log(
                    `Campo username preenchido com sucesso usando ${selector}`
                  );
                  usernameFieldFilled = true;
                  break;
                }
              } catch (err) {
                console.log(
                  `Não foi possível usar seletor ${selector}: ${err.message}`
                );
              }
            }

            if (!usernameFieldFilled) {
              // Se não encontrar um campo específico, usar o primeiro campo de texto
              console.log(
                "Nenhum campo específico de username encontrado. Tentando usar o primeiro campo de entrada..."
              );
              await page.evaluate((username) => {
                const inputs = Array.from(document.querySelectorAll("input"));
                const textInputs = inputs.filter(
                  (input) => input.type !== "password"
                );
                if (textInputs.length > 0) {
                  textInputs[0].value = username;
                  textInputs[0].dispatchEvent(
                    new Event("input", { bubbles: true })
                  );
                  textInputs[0].dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                }
              }, "admin");
            }
          }
        } catch (err) {
          console.log(`Erro ao preencher username: ${err.message}`);
        }

        // Aguardar um pouco antes de preencher a senha
        await page.waitForTimeout(1000);

        // Tentar encontrar e preencher o campo de password
        try {
          // Tentar com ID específico primeiro
          const passwordExists = await page.$("#passwordInput");
          if (passwordExists) {
            console.log("Campo #passwordInput encontrado");
            await page.type("#passwordInput", "admin", { delay: 100 });
          } else {
            // Tentar com seletores alternativos
            console.log("Tentando seletores alternativos para password...");
            const alternativeSelectors = [
              'input[type="password"]',
              'input[placeholder*="Password" i]',
              'input[placeholder*="Senha" i]',
            ];

            let passwordFieldFilled = false;

            for (const selector of alternativeSelectors) {
              try {
                const exists = await page.$(selector);
                if (exists) {
                  await page.type(selector, "admin", { delay: 100 });
                  console.log(
                    `Campo password preenchido com sucesso usando ${selector}`
                  );
                  passwordFieldFilled = true;
                  break;
                }
              } catch (err) {
                console.log(
                  `Não foi possível usar seletor ${selector}: ${err.message}`
                );
              }
            }

            if (!passwordFieldFilled) {
              // Se não encontrar um campo específico, usar o primeiro campo de senha
              console.log(
                "Nenhum campo específico de password encontrado. Tentando usar o primeiro campo de senha..."
              );
              await page.evaluate((password) => {
                const inputs = Array.from(document.querySelectorAll("input"));
                const passwordInputs = inputs.filter(
                  (input) => input.type === "password"
                );
                if (passwordInputs.length > 0) {
                  passwordInputs[0].value = password;
                  passwordInputs[0].dispatchEvent(
                    new Event("input", { bubbles: true })
                  );
                  passwordInputs[0].dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                }
              }, "admin");
            }
          }
        } catch (err) {
          console.log(`Erro ao preencher password: ${err.message}`);
        }

        // Aguardar um pouco antes de clicar no botão
        await page.waitForTimeout(1000);

        // Clicar no botão de login
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
                await page.click(selector);
                console.log(
                  `Botão de login clicado com sucesso usando ${selector}`
                );
                buttonClicked = true;
                break;
              }
            } catch (err) {
              console.log(
                `Não foi possível usar seletor de botão ${selector}: ${err.message}`
              );
            }
          }

          // Se não conseguiu clicar em nenhum botão, tentar com JavaScript direto
          if (!buttonClicked) {
            console.log("Tentando clicar no botão via JavaScript direto...");

            buttonClicked = await page.evaluate(() => {
              // Procurar por botões que contenham o texto "Login"
              const buttons = Array.from(document.querySelectorAll("button"));
              const loginButton = buttons.find(
                (button) =>
                  button.textContent.includes("Login") ||
                  button.textContent.trim() === "Login"
              );

              if (loginButton) {
                loginButton.click();
                return true;
              }

              // Se não encontrar um botão específico com texto "Login", pegar o primeiro botão
              if (buttons.length > 0) {
                buttons[0].click();
                return true;
              }

              return false;
            });

            if (buttonClicked) {
              console.log("Botão clicado com sucesso via JavaScript");
            } else {
              // Se ainda não conseguiu, tentar pressionar Enter
              console.log(
                "Não foi possível clicar no botão via JS, tentando pressionar Enter"
              );
              await page.keyboard.press("Enter");
              console.log("Tecla Enter pressionada");
            }
          }
        } catch (err) {
          console.log(`Erro ao clicar no botão de login: ${err.message}`);

          // Última tentativa - pressionar Enter
          try {
            await page.keyboard.press("Enter");
            console.log("Tecla Enter pressionada como última tentativa");
          } catch (enterErr) {
            console.log(`Erro ao pressionar Enter: ${enterErr.message}`);
          }
        }

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
      // Verificar se o seletor .card-body existe na página
      const hasCardBody = await page.evaluate(() => {
        return document.querySelector(".card-body") !== null;
      });

      if (hasCardBody) {
        console.log("Elemento .card-body encontrado na página.");
        try {
          // Esperar pelo elemento com um timeout menor para evitar bloqueio
          await page.waitForSelector(".card-body", { timeout: 5000 });
          console.log("Elemento .card-body carregado com sucesso.");
        } catch (err) {
          console.log(
            `Erro ao esperar pelo elemento .card-body: ${err.message}. Continuando mesmo assim.`
          );
        }
      } else {
        console.log(
          "Elemento .card-body não encontrado na página. Continuando sem esperar por ele."
        );
      }

      // Aguardar um pouco para garantir que a página carregou
      await page.waitForTimeout(3000);

      // Preencher o campo PIN
      console.log(`Preenchendo PIN: ${TEST_PIN}`);

      // Verificar se o campo de PIN existe na página
      try {
        // Tentar encontrar o campo de PIN usando vários seletores
        const pinSelectors = [
          'input[placeholder="Pin"]',
          'input[name="pin"]',
          'input[type="number"]',
          'input[id*="pin" i]',
          'input[class*="pin" i]',
        ];

        let pinFieldFound = false;

        for (const selector of pinSelectors) {
          try {
            const exists = await page.$(selector);
            if (exists) {
              console.log(
                `Campo de PIN encontrado usando seletor: ${selector}`
              );
              await page.type(selector, TEST_PIN);
              pinFieldFound = true;
              break;
            }
          } catch (err) {
            console.log(
              `Não foi possível usar seletor ${selector}: ${err.message}`
            );
          }
        }

        if (!pinFieldFound) {
          // Se não encontrar um campo específico, usar o primeiro campo de texto
          console.log(
            "Nenhum campo específico de PIN encontrado. Tentando usar o primeiro campo de entrada..."
          );
          await page.evaluate((pin) => {
            const inputs = Array.from(document.querySelectorAll("input"));
            if (inputs.length > 0) {
              inputs[0].value = pin;
              inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
              inputs[0].dispatchEvent(new Event("change", { bubbles: true }));
            }
          }, TEST_PIN);
        }
      } catch (error) {
        console.log(`Erro ao preencher PIN: ${error.message}`);
      }

      // Preencher o campo de nome do dispositivo
      console.log(`Preenchendo nome do dispositivo: ${TEST_DEVICE_NAME}`);

      // Verificar se o campo de nome do dispositivo existe na página
      try {
        // Tentar encontrar o campo de nome do dispositivo usando vários seletores
        const deviceNameSelectors = [
          'input[placeholder="Optional: Device Name"]',
          'input[name="deviceName"]',
          'input[id*="device" i]',
          'input[class*="device" i]',
        ];

        let deviceNameFieldFound = false;

        for (const selector of deviceNameSelectors) {
          try {
            const exists = await page.$(selector);
            if (exists) {
              console.log(
                `Campo de nome do dispositivo encontrado usando seletor: ${selector}`
              );
              await page.type(selector, TEST_DEVICE_NAME);
              deviceNameFieldFound = true;
              break;
            }
          } catch (err) {
            console.log(
              `Não foi possível usar seletor ${selector}: ${err.message}`
            );
          }
        }

        if (!deviceNameFieldFound) {
          // Se não encontrar um campo específico, usar o segundo campo de texto
          console.log(
            "Nenhum campo específico de nome do dispositivo encontrado. Tentando usar o segundo campo de entrada..."
          );
          await page.evaluate((deviceName) => {
            const inputs = Array.from(document.querySelectorAll("input"));
            if (inputs.length > 1) {
              inputs[1].value = deviceName;
              inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
              inputs[1].dispatchEvent(new Event("change", { bubbles: true }));
            }
          }, TEST_DEVICE_NAME);
        }
      } catch (error) {
        console.log(`Erro ao preencher nome do dispositivo: ${error.message}`);
      }

      // Clicar no botão "Send"
      console.log("Clicando no botão Send...");

      // Verificar se o botão existe na página
      try {
        // Tentar encontrar o botão usando vários seletores
        const buttonSelectors = [
          "button.btn.btn-primary",
          'button[type="submit"]',
          'input[type="submit"]',
          'button:contains("Send")',
          'button:contains("Submit")',
          'button:contains("Enviar")',
        ];

        let buttonClicked = false;

        for (const selector of buttonSelectors) {
          try {
            const exists = await page.$(selector);
            if (exists) {
              console.log(`Botão encontrado usando seletor: ${selector}`);
              await page.click(selector);
              buttonClicked = true;
              break;
            }
          } catch (err) {
            console.log(
              `Não foi possível usar seletor ${selector}: ${err.message}`
            );
          }
        }

        if (!buttonClicked) {
          // Se não encontrar um botão específico, clicar no primeiro botão
          console.log(
            "Nenhum botão específico encontrado. Tentando clicar no primeiro botão disponível..."
          );
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            if (buttons.length > 0) {
              buttons[0].click();
            } else {
              // Tentar também inputs do tipo submit
              const submitInputs = document.querySelectorAll(
                'input[type="submit"]'
              );
              if (submitInputs.length > 0) {
                submitInputs[0].click();
              }
            }
          });
        }
      } catch (error) {
        console.log(`Erro ao clicar no botão: ${error.message}`);

        // Última tentativa - pressionar Enter
        try {
          await page.keyboard.press("Enter");
          console.log("Tecla Enter pressionada como última tentativa");
        } catch (enterErr) {
          console.log(`Erro ao pressionar Enter: ${enterErr.message}`);
        }
      }

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
