# Cliente Local para Automação de PIN

Este é o cliente local que deve ser executado no computador Windows onde o formulário de PIN está disponível. Ele funciona como um serviço em segundo plano, verificando continuamente o servidor web em busca de novas solicitações e automatizando o preenchimento do formulário em tempo real.

## Requisitos

- Windows 10 ou superior
- Acesso ao formulário de PIN em https://localhost:47990/pin#PIN
- Conexão com o servidor web (hospedado no Railway)
- Google Chrome instalado (usado pelo Puppeteer)

## Instalação do Executável

### Opção 1: Usar o executável pré-compilado

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

### Opção 2: Compilar o executável

1. Instale o Node.js 16 ou superior
2. Clone o repositório
3. Navegue até o diretório `cliente-local`
4. Instale as dependências:
   ```
   npm install
   ```
5. Configure o arquivo `.env` com as variáveis de ambiente necessárias
6. Compile o executável:
   ```
   npm run build
   ```
7. O executável será gerado na pasta `dist`
8. Copie a pasta `dist` para o computador alvo
9. Execute o arquivo `iniciar.bat` para iniciar o aplicativo

## Configuração para Inicialização Automática

Para que o aplicativo inicie automaticamente com o Windows:

1. Pressione `Win + R` para abrir o diálogo Executar
2. Digite `shell:startup` e pressione Enter
3. Crie um atalho para o arquivo `iniciar.bat` na pasta que foi aberta
4. O aplicativo será iniciado automaticamente quando o Windows iniciar

## Funcionamento

1. O cliente verifica continuamente o servidor web em busca de novas solicitações
2. Quando uma nova solicitação é recebida, o cliente mostra uma notificação
3. O cliente abre o navegador e navega até o formulário de PIN
4. O cliente preenche automaticamente o PIN e o nome do dispositivo (se fornecido)
5. O cliente clica no botão "Send" para submeter o formulário
6. O cliente marca a solicitação como processada no servidor
7. O cliente mostra uma notificação de sucesso

## Logs e Monitoramento

- Os logs são salvos na pasta `logs` dentro do diretório do aplicativo
- Capturas de tela são salvas na pasta `logs` para referência
- Notificações são exibidas quando novas solicitações são recebidas e processadas
- O aplicativo continua rodando em segundo plano, mesmo quando o usuário faz logout

## Solução de Problemas

Se o aplicativo não estiver funcionando corretamente:

1. Verifique os logs na pasta `logs`
2. Certifique-se de que o URL do servidor no arquivo `.env` está correto
3. Verifique se o computador tem acesso à internet e ao formulário de PIN
4. Reinicie o aplicativo executando `iniciar.bat` novamente
