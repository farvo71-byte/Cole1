@echo off
echo ========================================================
echo   Instalator J.A.R.V.I.S. Nexus dla Windows
echo ========================================================

:: Sprawdzenie czy Node.js jest zainstalowany
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ERROR: Node.js nie został znaleziony.
    echo Pobierz i zainstaluj Node.js (LTS v18+) ze strony https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Instalowanie zależności...
call npm install

echo [2/3] Budowanie aplikacji (build)...
call npm run build

echo ========================================================
echo [3/3] Instalacja zakończona sukcesem!
echo.
echo Aby uruchomić system, wpisz w terminalu:
echo    npm start
echo.
echo Następnie otwórz adres wyświetlony w terminalu (zazwyczaj http://localhost:3000)
echo ========================================================
pause
