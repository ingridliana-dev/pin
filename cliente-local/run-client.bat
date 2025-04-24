@echo off
echo Iniciando Cliente de Automacao de PIN...
echo SERVER_URL=https://pin-production.up.railway.app > D:\projetopinautomatico\cliente-local\.env
echo TARGET_URL=https://localhost:47990/pin#PIN >> D:\projetopinautomatico\cliente-local\.env
echo CHECK_INTERVAL=5000 >> D:\projetopinautomatico\cliente-local\.env
node D:\projetopinautomatico\cliente-local\index.js
