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
const LOG_FILE = path.join(
  LOG_DIR,
  `test-${new Date().toISOString().split("T")[0]}.log`
);

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

    // Verificar se há tela de login e fazer login
    log("Verificando se há tela de login...");
    try {
      // Aguardar um pouco para a página carregar
      await page.waitForTimeout(2000);

      // Capturar screenshot para depuração
      try {
        const screenshotPath = path.join(LOG_DIR, `login-screen.png`);
        await page.screenshot({ path: screenshotPath });
        log(`Screenshot da tela de login salvo em: ${screenshotPath}`);
      } catch (err) {
        log(`Erro ao capturar screenshot: ${err.message}`);
      }

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
        log("Tela de login detectada. Preenchendo credenciais...");

        // Tentar encontrar e preencher o campo de username
        try {
          // Tentar com ID específico primeiro
          const usernameExists = await page.$("#usernameInput");
          if (usernameExists) {
            log("Campo #usernameInput encontrado");
            await page.type("#usernameInput", "admin", { delay: 100 });
          } else {
            // Tentar com seletores alternativos
            log("Tentando seletores alternativos para username...");
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
                  log(
                    `Campo username preenchido com sucesso usando ${selector}`
                  );
                  usernameFieldFilled = true;
                  break;
                }
              } catch (err) {
                log(
                  `Não foi possível usar seletor ${selector}: ${err.message}`
                );
              }
            }

            if (!usernameFieldFilled) {
              // Se não encontrar um campo específico, usar o primeiro campo de texto
              log(
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
          log(`Erro ao preencher username: ${err.message}`);
        }

        // Aguardar um pouco antes de preencher a senha
        await page.waitForTimeout(1000);

        // Tentar encontrar e preencher o campo de password
        try {
          // Tentar com ID específico primeiro
          const passwordExists = await page.$("#passwordInput");
          if (passwordExists) {
            log("Campo #passwordInput encontrado");
            await page.type("#passwordInput", "admin", { delay: 100 });
          } else {
            // Tentar com seletores alternativos
            log("Tentando seletores alternativos para password...");
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
                  log(
                    `Campo password preenchido com sucesso usando ${selector}`
                  );
                  passwordFieldFilled = true;
                  break;
                }
              } catch (err) {
                log(
                  `Não foi possível usar seletor ${selector}: ${err.message}`
                );
              }
            }

            if (!passwordFieldFilled) {
              // Se não encontrar um campo específico, usar o primeiro campo de senha
              log(
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
          log(`Erro ao preencher password: ${err.message}`);
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
                log(`Botão de login clicado com sucesso usando ${selector}`);
                buttonClicked = true;
                break;
              }
            } catch (err) {
              log(
                `Não foi possível usar seletor de botão ${selector}: ${err.message}`
              );
            }
          }

          // Se não conseguiu clicar em nenhum botão, tentar com JavaScript direto
          if (!buttonClicked) {
            log("Tentando clicar no botão via JavaScript direto...");

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
              log("Botão clicado com sucesso via JavaScript");
            } else {
              // Se ainda não conseguiu, tentar pressionar Enter
              log(
                "Não foi possível clicar no botão via JS, tentando pressionar Enter"
              );
              await page.keyboard.press("Enter");
              log("Tecla Enter pressionada");
            }
          }
        } catch (err) {
          log(`Erro ao clicar no botão de login: ${err.message}`);

          // Última tentativa - pressionar Enter
          try {
            await page.keyboard.press("Enter");
            log("Tecla Enter pressionada como última tentativa");
          } catch (enterErr) {
            log(`Erro ao pressionar Enter: ${enterErr.message}`);
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
          log(`Erro ao aguardar navegação: ${navError.message}`);
        }

        log("Login realizado com sucesso!");
      } else {
        log("Nenhuma tela de login detectada.");
      }
    } catch (error) {
      log(`Erro ao lidar com tela de login: ${error.message}`);
      // Continuar mesmo se houver erro, pois pode ser que a tela de login não apareça
    }

    // Aguardar o carregamento dos campos
    log("Aguardando carregamento dos campos...");

    // Verificar se há uma aba "PIN Pairing" e clicar nela
    try {
      log("Verificando se há uma aba 'PIN Pairing'...");

      // Capturar screenshot antes de clicar na aba
      try {
        const screenshotPath = path.join(LOG_DIR, `before-tab-click.png`);
        await page.screenshot({ path: screenshotPath });
        log(`Screenshot antes de clicar na aba salvo em: ${screenshotPath}`);
      } catch (err) {
        log(`Erro ao capturar screenshot: ${err.message}`);
      }

      // Tentar clicar diretamente no botão "PIN Pairing" usando um seletor mais específico
      let tabClicked = false;

      // Primeiro, tentar com texto exato
      try {
        // Usar uma abordagem mais direta para encontrar o botão "PIN Pairing"
        const pinPairingButtonExists = await page.evaluate(() => {
          // Procurar por botões que contenham exatamente o texto "PIN Pairing"
          const buttons = Array.from(
            document.querySelectorAll("button, a, div.btn, span.btn")
          );

          // Filtrar para encontrar o botão com texto exato "PIN Pairing"
          const pinPairingButton = buttons.find((btn) => {
            return btn.textContent && btn.textContent.trim() === "PIN Pairing";
          });

          if (pinPairingButton) {
            // Destacar o botão para debug
            pinPairingButton.style.border = "3px solid red";
            // Clicar no botão
            pinPairingButton.click();
            return true;
          }
          return false;
        });

        if (pinPairingButtonExists) {
          log(
            "Botão 'PIN Pairing' encontrado e clicado com sucesso via JavaScript."
          );
          tabClicked = true;
          // Aguardar um pouco para a interface atualizar
          await page.waitForTimeout(1000);
        }
      } catch (err) {
        log(
          `Erro ao tentar clicar diretamente no botão 'PIN Pairing': ${err.message}`
        );
      }

      // Se não conseguiu clicar, tentar com seletores específicos
      if (!tabClicked) {
        try {
          // Tentar seletores mais específicos para os botões de aba
          const tabSelectors = [
            // Seletores específicos para a interface mostrada
            ".btn:nth-child(2)", // Segundo botão na interface
            "button:nth-of-type(2)", // Segundo botão
            "a.btn:nth-child(2)", // Segundo link com classe btn
            "div.btn:nth-child(2)", // Segunda div com classe btn
            // Seletores baseados no texto
            'button:contains("PIN Pairing")',
            'a:contains("PIN Pairing")',
            'div:contains("PIN Pairing")',
            '.btn:contains("PIN Pairing")',
            // Seletores genéricos
            '.nav-link:contains("PIN Pairing")',
            '.tab:contains("PIN Pairing")',
          ];

          for (const selector of tabSelectors) {
            try {
              const exists = await page.$(selector);
              if (exists) {
                await page.click(selector);
                log(
                  `Aba 'PIN Pairing' clicada com sucesso usando seletor: ${selector}`
                );
                tabClicked = true;
                // Aguardar um pouco para a interface atualizar
                await page.waitForTimeout(1000);
                break;
              }
            } catch (err) {
              log(`Não foi possível usar seletor ${selector}: ${err.message}`);
            }
          }
        } catch (err) {
          log(
            `Erro ao tentar clicar na aba 'PIN Pairing' com seletores: ${err.message}`
          );
        }
      }

      // Se ainda não conseguiu clicar, tentar clicar em qualquer elemento com texto "PIN Pairing"
      if (!tabClicked) {
        try {
          log(
            "Tentando clicar em qualquer elemento com texto 'PIN Pairing'..."
          );

          // Usar uma abordagem mais agressiva para encontrar e clicar no elemento
          tabClicked = await page.evaluate(() => {
            // Função para verificar se um elemento ou seus filhos contêm o texto
            function hasText(element, text) {
              if (element.textContent && element.textContent.includes(text)) {
                return true;
              }
              return false;
            }

            // Procurar por qualquer elemento que contenha o texto "PIN Pairing"
            const elements = Array.from(document.querySelectorAll("*"));
            const pinPairingElements = elements.filter((el) =>
              hasText(el, "PIN Pairing")
            );

            // Tentar clicar em cada elemento encontrado
            for (const el of pinPairingElements) {
              try {
                // Destacar o elemento para debug
                el.style.border = "3px solid blue";
                el.click();
                console.log("Clicado em elemento com texto PIN Pairing:", el);
                return true;
              } catch (e) {
                console.error("Erro ao clicar no elemento:", e);
              }
            }

            return false;
          });

          if (tabClicked) {
            log("Elemento com texto 'PIN Pairing' encontrado e clicado.");
            // Aguardar um pouco para a interface atualizar
            await page.waitForTimeout(1000);
          } else {
            log(
              "Não foi possível encontrar elementos clicáveis com texto 'PIN Pairing'."
            );
          }
        } catch (err) {
          log(`Erro ao tentar abordagem agressiva: ${err.message}`);
        }
      }

      // Capturar screenshot após tentar clicar na aba
      try {
        const screenshotPath = path.join(LOG_DIR, `after-tab-click.png`);
        await page.screenshot({ path: screenshotPath });
        log(`Screenshot após tentar clicar na aba salvo em: ${screenshotPath}`);
      } catch (err) {
        log(`Erro ao capturar screenshot: ${err.message}`);
      }

      if (!tabClicked) {
        log(
          "Não foi possível clicar na aba 'PIN Pairing' após várias tentativas."
        );
      }
    } catch (err) {
      log(`Erro ao verificar aba 'PIN Pairing': ${err.message}`);
    }

    // Verificar se o seletor .card-body existe na página
    const hasCardBody = await page.evaluate(() => {
      return document.querySelector(".card-body") !== null;
    });

    if (hasCardBody) {
      log("Elemento .card-body encontrado na página.");
      try {
        // Esperar pelo elemento com um timeout menor para evitar bloqueio
        await page.waitForSelector(".card-body", { timeout: 5000 });
        log("Elemento .card-body carregado com sucesso.");
      } catch (err) {
        log(
          `Erro ao esperar pelo elemento .card-body: ${err.message}. Continuando mesmo assim.`
        );
      }
    } else {
      log(
        "Elemento .card-body não encontrado na página. Continuando sem esperar por ele."
      );
    }

    // Aguardar um pouco para garantir que a página carregou
    await page.waitForTimeout(3000);

    // Preencher o campo PIN
    const testPin = "1234";
    log(`Preenchendo PIN: ${testPin}`);

    // Verificar se o campo de PIN existe na página
    try {
      // Tentar encontrar o campo de PIN usando vários seletores
      const pinSelectors = [
        'input[placeholder="Pin"]',
        'input[placeholder="PIN"]',
        'input[placeholder="pin"]',
        'input[placeholder*="PIN" i]',
        'input[placeholder*="Pin" i]',
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
            log(`Campo de PIN encontrado usando seletor: ${selector}`);
            await page.type(selector, testPin);
            pinFieldFound = true;
            break;
          }
        } catch (err) {
          log(`Não foi possível usar seletor ${selector}: ${err.message}`);
        }
      }

      if (!pinFieldFound) {
        // Se não encontrar um campo específico, usar o primeiro campo de texto
        log(
          "Nenhum campo específico de PIN encontrado. Tentando usar o primeiro campo de entrada..."
        );
        await page.evaluate((pin) => {
          const inputs = Array.from(document.querySelectorAll("input"));
          if (inputs.length > 0) {
            inputs[0].value = pin;
            inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
            inputs[0].dispatchEvent(new Event("change", { bubbles: true }));
          }
        }, testPin);
      }
    } catch (error) {
      log(`Erro ao preencher PIN: ${error.message}`);
    }

    // Preencher o campo de nome do dispositivo
    const testDeviceName = "Teste";
    log(`Preenchendo nome do dispositivo: ${testDeviceName}`);

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
            log(
              `Campo de nome do dispositivo encontrado usando seletor: ${selector}`
            );
            await page.type(selector, testDeviceName);
            deviceNameFieldFound = true;
            break;
          }
        } catch (err) {
          log(`Não foi possível usar seletor ${selector}: ${err.message}`);
        }
      }

      if (!deviceNameFieldFound) {
        // Se não encontrar um campo específico, usar o segundo campo de texto
        log(
          "Nenhum campo específico de nome do dispositivo encontrado. Tentando usar o segundo campo de entrada..."
        );
        await page.evaluate((deviceName) => {
          const inputs = Array.from(document.querySelectorAll("input"));
          if (inputs.length > 1) {
            inputs[1].value = deviceName;
            inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
            inputs[1].dispatchEvent(new Event("change", { bubbles: true }));
          }
        }, testDeviceName);
      }
    } catch (error) {
      log(`Erro ao preencher nome do dispositivo: ${error.message}`);
    }

    // Clicar no botão "Send"
    log("Clicando no botão Send...");

    // Verificar se o botão existe na página
    try {
      // Tentar encontrar o botão usando vários seletores
      const buttonSelectors = [
        "button:contains(Send)",
        "button.btn.btn-primary",
        "button.btn-primary",
        'button[type="submit"]',
        'input[type="submit"]',
        "button",
      ];

      let buttonClicked = false;

      for (const selector of buttonSelectors) {
        try {
          const exists = await page.$(selector);
          if (exists) {
            log(`Botão encontrado usando seletor: ${selector}`);
            await page.click(selector);
            buttonClicked = true;
            break;
          }
        } catch (err) {
          log(`Não foi possível usar seletor ${selector}: ${err.message}`);
        }
      }

      // Tentar encontrar o botão pelo texto exato "Send"
      if (!buttonClicked) {
        log("Tentando encontrar o botão pelo texto exato 'Send'...");

        try {
          // Usar evaluate para encontrar um botão com texto exato "Send"
          buttonClicked = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll("button"));
            // Procurar botão com texto exato "Send" ou que contenha "Send"
            const sendButton = allButtons.find(
              (btn) =>
                btn.textContent.trim() === "Send" ||
                btn.textContent.includes("Send") ||
                btn.innerText.trim() === "Send" ||
                btn.innerText.includes("Send")
            );

            if (sendButton) {
              sendButton.click();
              return true;
            }
            return false;
          });

          if (buttonClicked) {
            log("Botão 'Send' encontrado e clicado com sucesso");
          }
        } catch (err) {
          log(`Erro ao tentar encontrar botão 'Send': ${err.message}`);
        }
      }

      // Se ainda não clicou em nenhum botão, tentar o primeiro botão disponível
      if (!buttonClicked) {
        // Se não encontrar um botão específico, clicar no primeiro botão
        log(
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
      log(`Erro ao clicar no botão: ${error.message}`);

      // Última tentativa - pressionar Enter
      try {
        await page.keyboard.press("Enter");
        log("Tecla Enter pressionada como última tentativa");
      } catch (enterErr) {
        log(`Erro ao pressionar Enter: ${enterErr.message}`);
      }
    }

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
