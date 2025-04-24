/**
 * Módulo para lidar com o preenchimento de formulários
 */

// Função para preencher o campo PIN
async function fillPinField(page, pin, log, LOG_DIR, path) {
  // Capturar screenshot antes de preencher o PIN
  try {
    const screenshotPath = path.join(LOG_DIR, `before-pin-form.png`);
    await page.screenshot({ path: screenshotPath });
    log(`Screenshot antes de preencher PIN salvo em: ${screenshotPath}`);
  } catch (err) {
    log(`Erro ao capturar screenshot: ${err.message}`, "WARN");
  }
  
  // Tentar diferentes abordagens para preencher o PIN
  let pinFieldFilled = false;
  
  // Abordagem 1: Tentar usar seletores específicos
  try {
    // Tentar encontrar o campo de PIN usando vários seletores
    const pinSelectors = [
      'input[placeholder="Pin"]',
      'input[name="pin"]',
      'input[type="number"]',
      'input[id*="pin" i]',
      'input[class*="pin" i]'
    ];
    
    for (const selector of pinSelectors) {
      try {
        const exists = await page.$(selector);
        if (exists) {
          await page.type(selector, pin);
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
      }, pin);
      
      if (pinFieldFilled) {
        log("PIN preenchido com sucesso via JavaScript");
      } else {
        log("Não foi possível encontrar campo para preencher o PIN", "WARN");
      }
    } catch (jsError) {
      log(`Erro ao preencher PIN via JavaScript: ${jsError.message}`, "WARN");
    }
  }
  
  // Abordagem 3: Última tentativa - simular digitação em qualquer campo visível
  if (!pinFieldFilled) {
    log("Tentando última abordagem para preencher PIN...");
    
    try {
      // Tentar focar em qualquer campo de entrada e digitar
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        if (inputs.length > 0) {
          inputs[0].focus();
        }
      });
      
      await page.keyboard.type(pin);
      log("PIN digitado via simulação de teclado");
    } catch (keyboardError) {
      log(`Erro ao digitar PIN via teclado: ${keyboardError.message}`, "ERROR");
    }
  }
  
  return pinFieldFilled;
}

// Função para preencher o campo de nome do dispositivo
async function fillDeviceNameField(page, deviceName, log) {
  if (!deviceName) return false;
  
  log(`Preenchendo nome do dispositivo: ${deviceName}`);
  
  // Tentar diferentes abordagens para preencher o nome do dispositivo
  let deviceNameFilled = false;
  
  // Abordagem 1: Tentar usar seletores específicos
  try {
    // Tentar encontrar o campo de nome do dispositivo usando vários seletores
    const deviceNameSelectors = [
      'input[placeholder="Optional: Device Name"]',
      'input[name="deviceName"]',
      'input[id*="device" i]',
      'input[class*="device" i]'
    ];
    
    for (const selector of deviceNameSelectors) {
      try {
        const exists = await page.$(selector);
        if (exists) {
          await page.type(selector, deviceName);
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
      }, deviceName);
      
      if (deviceNameFilled) {
        log("Nome do dispositivo preenchido com sucesso via JavaScript");
      } else {
        log("Não foi possível encontrar campo para preencher o nome do dispositivo", "WARN");
      }
    } catch (jsError) {
      log(`Erro ao preencher nome do dispositivo via JavaScript: ${jsError.message}`, "WARN");
    }
  }
  
  // Abordagem 3: Última tentativa - simular digitação em qualquer campo visível
  if (!deviceNameFilled) {
    log("Tentando última abordagem para preencher nome do dispositivo...");
    
    try {
      // Tentar focar no segundo campo de entrada e digitar
      await page.evaluate(() => {
        const inputs = document.querySelectorAll("input");
        if (inputs.length > 1) {
          inputs[1].focus();
        }
      });
      
      await page.keyboard.type(deviceName);
      log("Nome do dispositivo digitado via simulação de teclado");
      deviceNameFilled = true;
    } catch (keyboardError) {
      log(`Erro ao digitar nome do dispositivo via teclado: ${keyboardError.message}`, "ERROR");
    }
  }
  
  return deviceNameFilled;
}

// Função para clicar no botão de envio
async function clickSubmitButton(page, log, LOG_DIR, path, requestId) {
  // Aguardar um pouco antes de tentar enviar
  await page.waitForTimeout(1000);
  
  // Clicar no botão "Send" ou equivalente
  log("Procurando botão para enviar o formulário...");
  
  // Capturar screenshot antes de clicar no botão
  try {
    const screenshotPath = path.join(LOG_DIR, `before-submit-${requestId}.png`);
    await page.screenshot({ path: screenshotPath });
    log(`Screenshot antes de enviar salvo em: ${screenshotPath}`);
  } catch (err) {
    log(`Erro ao capturar screenshot: ${err.message}`, "WARN");
  }
  
  // Tentar diferentes abordagens para clicar no botão de envio
  let buttonClicked = false;
  
  // Abordagem 1: Tentar usar seletores específicos
  try {
    // Tentar encontrar o botão usando vários seletores
    const buttonSelectors = [
      "button.btn.btn-primary",
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Send")',
      'button:contains("Submit")',
      'button:contains("Enviar")'
    ];
    
    for (const selector of buttonSelectors) {
      try {
        const exists = await page.$(selector);
        if (exists) {
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
      
      if (buttonClicked) {
        log("Botão clicado com sucesso via JavaScript");
      } else {
        log("Não foi possível encontrar botão para clicar", "WARN");
      }
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
  
  if (buttonClicked) {
    log("Formulário enviado com sucesso!");
  } else {
    log("Não foi possível enviar o formulário após várias tentativas", "ERROR");
  }
  
  return buttonClicked;
}

// Exportar as funções
module.exports = {
  fillPinField,
  fillDeviceNameField,
  clickSubmitButton
};
