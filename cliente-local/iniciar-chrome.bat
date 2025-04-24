@echo off
echo ===== Iniciando Chrome com Depuracao Remota =====
echo.

REM Fechar qualquer instância do Chrome que esteja em execução
taskkill /f /im chrome.exe

REM Aguardar um pouco para garantir que o Chrome foi fechado
timeout /t 2 /nobreak > nul

REM Iniciar o Chrome com a porta de depuração remota
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%USERPROFILE%\ChromeDebug"

echo Chrome iniciado com porta de depuracao remota 9222.
echo Agora execute o cliente de automacao.
echo.
pause
