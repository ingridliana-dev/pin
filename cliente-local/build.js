const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Criar diretório dist se não existir
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copiar o arquivo .env para o diretório dist
fs.copyFileSync(
  path.join(__dirname, '.env'),
  path.join(distDir, '.env')
);

// Criar diretório logs no diretório dist
const logsDir = path.join(distDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Executar pkg para criar o executável
console.log('Empacotando o aplicativo...');
exec('pkg . --targets node16-win-x64 --output dist/pin-automacao-cliente.exe', (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao empacotar: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
  console.log('Aplicativo empacotado com sucesso!');
  
  // Criar arquivo de configuração para inicialização automática
  const startupScript = `@echo off
echo Iniciando Cliente de Automacao de PIN...
start "" "%~dp0pin-automacao-cliente.exe"
`;
  
  fs.writeFileSync(path.join(distDir, 'iniciar.bat'), startupScript);
  
  console.log('Arquivo de inicialização criado com sucesso!');
  console.log(`\nPara instalar o aplicativo:`);
  console.log(`1. Copie a pasta 'dist' para o computador alvo`);
  console.log(`2. Execute o arquivo 'iniciar.bat' para iniciar o aplicativo`);
  console.log(`3. Para iniciar automaticamente com o Windows, crie um atalho para 'iniciar.bat' na pasta de inicialização do Windows`);
});
