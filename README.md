# J.A.R.V.I.S. v6.0 NEXUS — Instrukcja Uruchomienia Agenta na VPS Oracle Cloud

Ten przewodnik krok po kroku opisuje, jak wgrać, zbudować i uruchomić ten kompletny full-stackowy system **J.A.R.V.I.S. Nexus** (reagujący na żywo, z pulpitem analityki sentimentu i integracją LLM) na Twoim serwerze w **Oracle Cloud VPS (Ubuntu)**, aby działał 24/7 jako Twój osobisty agent.

Ponieważ aplikacja została zaktualizowana i dentyfikuje adres serwera dynamicznie (`window.location.hostname`), frontend automatycznie połączy się z backendem niezależnie od tego, pod jakim adresem IP lub domeną uruchomisz aplikację na Oracle VPS.

---

## 1. Wymagania Wstępne na Serwerze Oracle VPS

Zaloguj się na swój serwer VPS przez SSH i zainstaluj wymagane pakiety:

```bash
# Aktualizacja bazy pakietów
sudo apt update && sudo apt upgrade -y

# Instalacja Node.js (rekomendowana wersja v18+) i npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Sprawdzenie poprawności instalacji
node -v
npm -v
```

---

## 2. Transfer Plików i Instalacja Zależności

Prześlij pliki z tego repozytorium na swój serwer (np. za pomocą `git clone` lub narzędzia `scp`/`sftp` do folderu `/home/ubuntu/jarvis-nexus`), a następnie zainstaluj moduły:

```bash
# Wejdź do katalogu projektu
cd /home/ubuntu/jarvis-nexus

# Zainstaluj zależności z package.json
npm install
```

---

## 3. Konfiguracja Środowiska (.env)

Stwórz plik środowiskowy `.env` na bazie pliku przykładowego `.env.example`, aby skonfigurować swój tajny klucz API dla czatbota i analizatora:

```bash
# Skopiuj przykład do pliku roboczego
cp .env.example .env

# Edytuj konfigurację środowiskową
nano .env
```

Wklej lub zaktualizuj następujące zmienne:
```env
# Twój klucz API dla backendu (serwer używa go bezpiecznie bez ujawniania klientowi)
GEMINI_API_KEY=twoj_klucz_api_gemini_tutaj
```
*Zapisz plik kombinacją `Ctrl+O`, a potem wyjdź przez `Ctrl+X`.*

---

## 4. Kompilacja i Budowa Produkcyjna

Gdy zależności są zainstalowane i plik `.env` jest gotowy, zbuduj zoptymalizowaną wersję produkcyjną aplikacji:

```bash
# Zbudowanie frontendu z Vite i kompilacja backendowego serwera (Express) do pojedynczego cjs
npm run build
```
Proces ten wygeneruje zoptymalizowane statyczne pliki w katalogu `/dist` oraz spakuje backend do `/dist/server.cjs`, maksymalizując wydajność na dyskach VPS.

---

## 5. Uruchomienie jako Usługa Tła (Działanie 24/7)

Aby zagwarantować, że aplikacja będzie działać nieprzerwanie (również po zamknięciu terminala SSH) i uruchomi się automatycznie przy ewentualnym restarcie serwera, skonfiguruj **PM2** lub **Systemd**.

### Opcja A (Rekomendowana): PM2 (Bardzo prosty menedżer)
```bash
# Zainstaluj PM2 globalnie
sudo npm install -p pm2 -g

# Uruchom agenta pod kontrolą PM2
pm2 start dist/server.cjs --name "jarvis-nexus"

# Dodaj do autostartu systemowego
pm2 save
pm2 startup
```

### Opcja B: Systemd (Wbudowana usługa systemowa)
Utwórz plik konfiguracji usługi:
```bash
sudo nano /etc/systemd/system/jarvis-nexus.service
```

Wklej poniższą konfigurację (upewnij się, że ścieżki odpowiadają Twojej lokalizacji):
```ini
[Unit]
Description=JARVIS Nexus System Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/jarvis-nexus
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Zapisz plik i uruchom usługę:
```bash
sudo systemctl daemon-reload
sudo systemctl enable jail-nexus
sudo systemctl start jarvis-nexus

# Sprawdzenie statusu
sudo systemctl status jarvis-nexus
```

---

## 6. Odblokowanie Portu w Oracle Cloud (Bardzo Ważne)

Domyślnie serwer uruchamia się na porcie `3000`. Aby ruch sieciowy z zewnątrz mógł dotrzeć do Twojej aplikacji, musisz go odblokować na dwa sposoby:

### Krok A: Oracle Cloud Infrastructure (OCI Console)
1. Przejdź do panelu administracyjnego przedziału Oracle Cloud.
2. Wejdź w ustawienia swojej virtualnej sieci chmurowej (**Virtual Cloud Network (VCN)**) -> **Security Lists**.
3. Dodaj nową regułę wejściową (**Ingress Rule**):
   * **Source CIDR**: `0.0.0.0/0`
   * **IP Protocol**: `TCP`
   * **Destination Port Range**: `3000`
   * **Description**: `JARVIS Port`

### Krok B: Usunięcie blokady lokalnego zapory (IPtables) na VPS
Domyślne systemy Ubuntu w Oracle posiadają restrykcyjne reguły iptables. Wpisz w terminalu SSH poniższe komendy, aby przepuścić ruch:

```bash
# Przepuszczenie ruchu na port 3000
sudo iptables -I INPUT 6 -p tcp --dport 3000 -j ACCEPT

# Zapisanie reguł na stałe (żeby przetrwały restart)
sudo apt-get install iptables-persistent -y
sudo netfilter-persistent save
```

---

## 7. Weryfikacja i Uruchomienie w Przeglądarce

Aplikacja jest gotowa! Możesz teraz wejść na adres swojego serwera Oracle VPS:
```
http://<IP_TWOJEGO_SERWERA_ORACLE>:3000/
```

Wszystkie zapytania, analityka sentimentu oraz integracje z LLM będą teraz w pełni kontrolowane przez Twojego osobistego agenta działającego na Twoim własnym serwerze Oracle.
