# URUCHAMIANIE J.A.R.V.I.S. NEXUS NA WINDOWS

Aby uruchomić aplikację w środowisku Windows, wykonaj poniższe kroki:

### 1. Wymagania
* **Node.js (v18 lub wyższy)**: Pobierz instalator ze strony [nodejs.org](https://nodejs.org/).
* **Terminal**: PowerShell lub Wiersz poleceń (cmd).

### 2. Instalacja
Uruchom plik `install_windows.bat` przez dwukrotne kliknięcie. Skrypt automatycznie:
1. Sprawdzi dostępność Node.js.
2. Zainstaluje potrzebne biblioteki (`npm install`).
3. Przygotuje wersję produkcyjną aplikacji (`npm run build`).

### 3. Uruchomienie
Gdy instalacja zakończy się sukcesem, otwórz terminal w katalogu projektu i wpisz:
```bash
npm start
```
Następnie w przeglądarce otwórz adres wyświetlony w konsoli (zazwyczaj `http://localhost:3000`).
