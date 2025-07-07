# RemoteAdminTool - Instrukcje Uruchomienia

## Wymagania systemowe

- **Node.js** 18+ 
- **Xcode** 15+ (dla iOS)
- **iPhone/iPad** z iOS 17+
- **npm** lub **yarn**

## 1. Backend (Node.js)

### Instalacja i konfiguracja

```bash
cd backend
npm install
```

### Konfiguracja środowiska

1. Skopiuj plik konfiguracyjny:
```bash
cp env.example .env
```

2. Edytuj plik `.env`:
```env
# JWT Secret - ZMIEŃ NA WŁASNY, BEZPIECZNY KLUCZ!
JWT_SECRET=twoj-super-bezpieczny-jwt-secret-klucz

# Port serwera
PORT=3001

# CORS Origins (dla frontendu)
CORS_ORIGIN=http://localhost:5173

# Dane logowania administratora
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# 2FA Configuration
ENABLE_2FA=true
TOTP_ISSUER=RemoteAdminTool
```

### Uruchomienie

```bash
npm start
```

Serwer będzie dostępny na `http://localhost:3001`

## 2. Aplikacja iOS

### Wymagania

- Mac z Xcode 15+
- iPhone/iPad z iOS 17+
- Apple Developer Account (dla urządzeń fizycznych)

### Konfiguracja

1. Otwórz projekt w Xcode:
```bash
cd ios-app
open RemoteAdminTool.xcodeproj
```

2. W Xcode:
   - Wybierz swój Team w "Signing & Capabilities"
   - Zmień Bundle Identifier na unikalny (np. `com.twoja-firma.remoteadmintool`)
   - Wybierz urządzenie docelowe

3. Edytuj `ContentView.swift`:
   - Zmień `serverURL` na adres twojego serwera
   - Zaktualizuj JWT token w `registerDevice()`

### Uruchomienie

1. Podłącz iPhone/iPad do Maca
2. W Xcode wybierz urządzenie
3. Kliknij ▶️ (Run)

### Zgody aplikacji

Aplikacja poprosi o zgody na:
- **Lokalizację** - dla funkcji `get_location`
- **Kamerę** - dla przyszłych funkcji
- **Ekran** - dla screenshotów

## 3. Frontend (React)

### Instalacja

```bash
cd frontend
npm install
```

### Uruchomienie

```bash
npm run dev
```

Panel będzie dostępny na `http://localhost:5173`

### Logowanie

Domyślne dane logowania:
- **Login**: `admin`
- **Hasło**: `admin123`

## 4. 🔐 Konfiguracja 2FA

### Włączenie 2FA

1. Upewnij się, że w `.env` masz `ENABLE_2FA=true`
2. Uruchom backend ponownie
3. W panelu administratora kliknij "Konfiguruj 2FA"
4. Skanuj kod QR w Google Authenticator

### Logowanie z 2FA

1. Wprowadź dane logowania (username/password)
2. System poprosi o kod 2FA
3. Wprowadź 6-cyfrowy kod z Google Authenticator
4. Zaloguj się do panelu

**Szczegółowa dokumentacja 2FA**: [2FA_SETUP.md](2FA_SETUP.md)

## 5. Testowanie systemu

### Krok 1: Uruchom backend
```bash
cd backend
npm start
```

### Krok 2: Uruchom frontend
```bash
cd frontend
npm run dev
```

### Krok 3: Uruchom aplikację iOS
- Otwórz projekt w Xcode
- Uruchom na urządzeniu
- Kliknij "Połącz"

### Krok 4: Zaloguj się do panelu
- Otwórz `http://localhost:5173`
- Zaloguj się jako admin (z 2FA jeśli włączone)
- Sprawdź czy urządzenie się pojawiło

### Krok 5: Testuj komendy
- **Ping** - sprawdź połączenie
- **Alert** - wyświetl alert na urządzeniu
- **Lokalizacja** - pobierz GPS
- **Screenshot** - zrób zrzut ekranu
- **Zdalna kontrola** - przygotuj do dalszych interakcji

## Bezpieczeństwo

### Ważne uwagi:

1. **Zmień domyślne hasło administratora** w `.env`
2. **Użyj silnego JWT_SECRET**
3. **Włącz 2FA** dla dodatkowego bezpieczeństwa
4. **Ogranicz dostęp do sieci** - system tylko do testów
5. **Nie używaj w produkcji** bez dodatkowych zabezpieczeń
6. **Zgodność z prawem** - tylko własne urządzenia

### Konfiguracja sieci

Dla urządzeń w różnych sieciach:

1. **Backend**: Zmień `CORS_ORIGIN` na adres frontendu
2. **iOS App**: Zmień `serverURL` na IP serwera
3. **Firewall**: Otwórz port 3001

## Rozwiązywanie problemów

### Backend nie startuje
- Sprawdź czy port 3001 jest wolny
- Sprawdź czy Node.js jest zainstalowany
- Sprawdź plik `.env`

### iOS app nie łączy się
- Sprawdź adres serwera w `ContentView.swift`
- Sprawdź czy backend działa
- Sprawdź sieć na urządzeniu

### Frontend nie łączy się z backendem
- Sprawdź czy backend działa na porcie 3001
- Sprawdź konfigurację proxy w `vite.config.js`
- Sprawdź CORS w backendzie

### Urządzenie nie pojawia się w panelu
- Sprawdź czy aplikacja iOS jest połączona
- Sprawdź JWT token w aplikacji iOS
- Sprawdź logi backendu

### Problem z 2FA
- Sprawdź czy `ENABLE_2FA=true` w `.env`
- Sprawdź czas urządzenia (synchronizuj z NTP)
- Sprawdź czy używasz poprawnej aplikacji (Google Authenticator)
- Zobacz [2FA_SETUP.md](2FA_SETUP.md) dla szczegółowych instrukcji

## Struktura projektu

```
RemoteAdminTool/
├── backend/           # Serwer Node.js
│   ├── server.js     # Główny plik serwera
│   ├── package.json  # Zależności
│   └── env.example   # Przykład konfiguracji
├── ios-app/          # Aplikacja iOS
│   └── RemoteAdminTool/
│       ├── ContentView.swift  # Główny widok
│       ├── AppDelegate.swift  # Delegat aplikacji
│       └── Info.plist        # Konfiguracja
├── frontend/         # Panel administratora
│   ├── src/
│   │   ├── components/       # Komponenty React
│   │   ├── contexts/         # Konteksty (auth)
│   │   └── App.jsx          # Główna aplikacja
│   └── package.json         # Zależności
├── README.md         # Główna dokumentacja
├── SETUP.md          # Instrukcje uruchomienia
├── SECURITY.md       # Wytyczne bezpieczeństwa
└── 2FA_SETUP.md     # Konfiguracja 2FA
```

## Licencja

MIT License - Do użytku osobistego i testowego.

**UWAGA**: System jest przeznaczony wyłącznie do testowania własnych urządzeń w celach edukacyjnych i testowania bezpieczeństwa. 