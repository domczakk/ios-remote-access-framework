# RemoteAdminTool - iOS Device Management Framework

Bezpieczny framework do zdalnego zarządzania urządzeniami iOS do celów testowania bezpieczeństwa.

## Architektura

System składa się z trzech głównych komponentów:

1. **Backend** (Node.js + Express + Socket.IO) - Serwer zarządzający
2. **iOS App** (Swift 5) - Aplikacja na urządzeniach iOS
3. **Frontend** (React + Tailwind) - Panel administratora

## Struktura projektu

```
RemoteAdminTool/
├── backend/           # Serwer Node.js
├── ios-app/          # Aplikacja iOS
├── frontend/         # Panel administratora
└── docs/            # Dokumentacja
```

## Szybki start

### 1. Backend
```bash
cd backend
npm install
cp env.example .env
# Edytuj .env z własnym JWT_SECRET
npm start
```

### 2. iOS App
```bash
cd ios-app
# Otwórz RemoteAdminTool.xcodeproj w Xcode
# Skonfiguruj Bundle ID i Team
# Uruchom na urządzeniu
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Dwuskładnikowa Autoryzacja (2FA)

System obsługuje 2FA z Google Authenticator:

### Konfiguracja 2FA:
1. Uruchom backend z `ENABLE_2FA=true`
2. W panelu administratora kliknij "Konfiguruj 2FA"
3. Skanuj kod QR w Google Authenticator
4. Użyj kodu podczas logowania

### Szczegółowa dokumentacja: [2FA_SETUP.md](2FA_SETUP.md)

## Bezpieczeństwo

- Wszystkie komunikacje są szyfrowane
- JWT tokeny dla autoryzacji
- **2FA z Google Authenticator**
- Dostęp tylko do własnych urządzeń
- Zgodność z prawem - tylko do testowania

## Dokumentacja

- [SETUP.md](SETUP.md) - Instrukcje uruchomienia
- [SECURITY.md](SECURITY.md) - Wytyczne bezpieczeństwa
- [2FA_SETUP.md](2FA_SETUP.md) - Konfiguracja 2FA

## Licencja

MIT License - Do użytku osobistego i testowego. 