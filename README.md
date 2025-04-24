# Automação de Preenchimento de PIN

Este projeto consiste em duas partes:

1. Um servidor web hospedado no Railway que recebe solicitações de preenchimento de PIN
2. Um cliente executável Windows que roda continuamente no computador alvo, automatizando o preenchimento do formulário em tempo real

## Arquitetura

O sistema funciona da seguinte forma:

1. O servidor web é hospedado no Railway e fornece uma interface para inserir o PIN e o nome do dispositivo
2. Quando um usuário submete o formulário, o servidor armazena a solicitação em uma fila
3. O cliente executável Windows, rodando continuamente no computador alvo, verifica constantemente o servidor em busca de novas solicitações
4. Quando uma nova solicitação é recebida, o cliente automaticamente abre o navegador, preenche o formulário e clica no botão "Send"
5. O cliente reporta o status de processamento de volta ao servidor e exibe notificações no computador alvo

## Componentes

### Servidor Web (Railway)

- Interface web simples para inserir o PIN e o nome do dispositivo
- Validação do PIN (deve ter 4 dígitos numéricos)
- API para o cliente local verificar novas solicitações
- Fila de solicitações pendentes
- Pronto para implantação no Railway

### Cliente Executável Windows

- Executável Windows que roda continuamente em segundo plano
- Verifica constantemente o servidor em busca de novas solicitações
- Automatiza o preenchimento do formulário usando Puppeteer
- Exibe notificações quando novas solicitações são recebidas e processadas
- Registra logs e capturas de tela para monitoramento
- Configurável para iniciar automaticamente com o Windows

## Tecnologias Utilizadas

- Node.js
- Express
- Puppeteer
- Axios
- Bootstrap
- Docker
- pkg (para criar o executável Windows)
- node-notifier (para notificações no Windows)

## Como Executar

### Servidor Web

1. Navegue até o diretório raiz do projeto
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure o arquivo `.env` com as variáveis de ambiente necessárias:
   ```
   PORT=3000
   ```
4. Inicie o servidor:
   ```
   npm start
   ```
5. Acesse a aplicação em `http://localhost:3000`

### Cliente Executável Windows

#### Opção 1: Usar o executável pré-compilado

1. Baixe a pasta `dist` contendo o executável
2. Copie a pasta para o computador alvo
3. Edite o arquivo `.env` na pasta `dist` para configurar:
   ```
   # URL do servidor web no Railway (substitua pelo URL correto)
   SERVER_URL=https://seu-app.railway.app

   # URL do formulário de PIN
   TARGET_URL=https://localhost:47990/pin#PIN

   # Intervalo de verificação (em milissegundos)
   CHECK_INTERVAL=5000
   ```
4. Execute o arquivo `iniciar.bat` para iniciar o aplicativo

#### Opção 2: Compilar o executável

1. Navegue até o diretório `cliente-local`
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure o arquivo `.env` com as variáveis de ambiente necessárias
4. Compile o executável:
   ```
   npm run build
   ```
5. O executável será gerado na pasta `dist`
6. Copie a pasta `dist` para o computador alvo
7. Execute o arquivo `iniciar.bat` para iniciar o aplicativo

## Implantação no Railway

1. Faça login no Railway
2. Crie um novo projeto
3. Conecte seu repositório Git
4. Configure as variáveis de ambiente:
   - `PORT`: 3000
5. Implante a aplicação
6. Atualize o arquivo `.env` do cliente executável com o URL do servidor implantado:
   ```
   SERVER_URL=https://seu-app.railway.app
   ```

## Configuração para Inicialização Automática

Para que o cliente executável inicie automaticamente com o Windows:

1. Pressione `Win + R` para abrir o diálogo Executar
2. Digite `shell:startup` e pressione Enter
3. Crie um atalho para o arquivo `iniciar.bat` na pasta que foi aberta
4. O aplicativo será iniciado automaticamente quando o Windows iniciar

## Estrutura do Projeto

- `index.js`: Arquivo principal do servidor web
- `public/index.html`: Interface do usuário
- `Dockerfile`: Configuração para implantação em contêiner
- `cliente-local/`: Diretório contendo o cliente de automação
  - `index.js`: Arquivo principal do cliente
  - `build.js`: Script para criar o executável Windows
  - `.env`: Configurações do cliente

## Licença

ISC
