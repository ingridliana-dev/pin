FROM node:18-slim

# Não precisamos mais das dependências do Puppeteer no servidor

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante dos arquivos
COPY . .

# Expor a porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
