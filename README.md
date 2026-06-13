# Deployment Instructions — Colette System (Oracle VPS)

Ten dokument zawiera instrukcje uruchomienia Twojego agenta (Colette System) na zdalnym serwerze (Oracle VPS).

## 1. Przygotowanie serwera (VPS)

Upewnij się, że na serwerze zainstalowano:
- Python 3.9+
- pip (menedżer pakietów Pythona)
- git

## 2. Transfer plików

Sugerujemy przeniesienie plików za pomocą `git` lub `scp`. Upewnij się, że przesyłasz cały folder projektu `COLETTE_FULL_SYSTEM` (lub odpowiednią strukturę).

```bash
# Jeśli używasz git:
git clone <twój-repozytorium-projektu>
cd <folder-projektu>
```

## 3. Konfiguracja środowiska

Zalecamy użycie wirtualnego środowiska (`venv`), aby uniknąć konfliktów zależności:

```bash
python3 -m venv venv
source venv/bin/activate
```

Zainstaluj wymagane zależności (upewnij się, że w głównym katalogu znajduje się plik `requirements.txt`):

```bash
pip install -r requirements.txt
```
*(Jeśli pliku `requirements.txt` nie ma, konieczne będzie manualne zainstalowanie bibliotek używanych w `colette_system/plugins/`, np. `pip install fastapi uvicorn websockets httpx`)*

## 4. Uruchomienie

Głównym punktem wejściowym serwera jest zazwyczaj `colette_system/plugins/main.py` lub `colette_system/plugins/server.py`.

Przed uruchomieniem zmień odpowiednie zmienne konfiguracyjne (IP serwera, klucze API) w plikach konfiguracyjnych w `colette_system/plugins/config.py`.

Uruchomienie serwera:
```bash
python3 -m colette_system.plugins.main
# lub
python3 colette_system/plugins/main.py
```

## 5. Uruchomienie jako usługa (Systemd)

Aby agent działał w tle po rozłączeniu sesji SSH, stwórz plik usługi `systemd`:
`/etc/systemd/system/colette-agent.service`

```ini
[Unit]
Description=Colette Agent System
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/<sciezka-do-projektu>
ExecStart=/home/ubuntu/<sciezka-do-projektu>/venv/bin/python3 -m colette_system.plugins.main
Restart=always

[Install]
WantedBy=multi-user.target
```

Następnie aktywuj:
```bash
sudo systemctl daemon-reload
sudo systemctl enable colette-agent
sudo systemctl start colette-agent
```
