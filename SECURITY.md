# RemoteAdminTool - Wytyczne Bezpieczeństwa

## ⚠️ WAŻNE OSTRZEŻENIE

Ten system jest przeznaczony **WYŁĄCZNIE** do:
- Testowania własnych urządzeń
- Celów edukacyjnych
- Testowania zabezpieczeń w kontrolowanym środowisku

**NIE UŻYWAJ** tego systemu do:
- Atakowania urządzeń innych osób
- Nieautoryzowanego dostępu
- Działalności niezgodnej z prawem

## Bezpieczeństwo Systemu

### 1. Autoryzacja i Uwierzytelnianie

#### JWT Tokens
- Używaj silnych, unikalnych sekretów JWT
- Regularnie rotuj sekrety
- Ustaw odpowiedni czas wygaśnięcia tokenów

```env
# Przykład bezpiecznego JWT_SECRET
JWT_SECRET=twoj-bardzo-dlugi-i-zlozony-sekret-jwt-klucz-2024
```

#### Dane logowania administratora
- **ZMIEŃ** domyślne dane logowania
- Używaj silnych haseł
- Rozważ implementację 2FA

```env
ADMIN_USERNAME=twoj-unikalny-login
ADMIN_PASSWORD=twoje-bardzo-silne-haslo-2024!
```

### 2. Konfiguracja Sieci

#### Firewall
```bash
# Ogranicz dostęp tylko do potrzebnych portów
sudo ufw allow 3001/tcp  # Backend
sudo ufw allow 5173/tcp  # Frontend (dev)
```

#### CORS Configuration
```javascript
// W backend/server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN, // Tylko określone domeny
  credentials: true
}));
```

### 3. Szyfrowanie Komunikacji

#### HTTPS/WSS
- Używaj HTTPS dla produkcji
- Konfiguruj SSL/TLS certyfikaty
- Wymuszaj szyfrowane połączenia

#### WebSocket Security
```javascript
// Bezpieczna konfiguracja Socket.IO
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});
```

### 4. Walidacja Danych

#### Backend Validation
```javascript
// Przykład walidacji komend
const validateCommand = (command) => {
  const allowedCommands = ['ping', 'alert', 'get_location', 'screenshot', 'remote_control'];
  return allowedCommands.includes(command);
};
```

#### iOS App Security
```swift
// Walidacja odpowiedzi serwera
func validateServerResponse(_ response: [String: Any]) -> Bool {
    // Sprawdź podpis cyfrowy
    // Waliduj dane
    return true
}
```

### 5. Logowanie i Monitorowanie

#### Backend Logs
```javascript
// Dodaj szczegółowe logowanie
console.log(`[${new Date().toISOString()}] Command sent: ${command} to device: ${deviceId}`);
```

#### Audit Trail
```javascript
// Śledź wszystkie akcje
const auditLog = {
  timestamp: new Date(),
  user: req.user,
  action: 'send_command',
  deviceId: deviceId,
  command: command,
  ip: req.ip
};
```

## Najlepsze Praktyki

### 1. Konfiguracja Środowiska

#### Development
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

#### Production
```env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=error
```

### 2. Bezpieczeństwo iOS App

#### Info.plist Permissions
```xml
<!-- Minimalne uprawnienia -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aplikacja potrzebuje dostępu do lokalizacji do celów testowych</string>
```

#### Code Signing
- Używaj własnego certyfikatu deweloperskiego
- Włącz App Transport Security
- Implementuj certificate pinning

### 3. Frontend Security

#### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

#### XSS Protection
```javascript
// Sanityzuj dane wejściowe
const sanitizeInput = (input) => {
  return input.replace(/[<>]/g, '');
};
```

## Monitoring i Alerty

### 1. System Monitoring
```javascript
// Monitoruj połączenia
io.on('connection', (socket) => {
  console.log(`[SECURITY] New connection from ${socket.handshake.address}`);
  
  socket.on('disconnect', () => {
    console.log(`[SECURITY] Disconnection from ${socket.handshake.address}`);
  });
});
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // max 100 requestów na IP
  message: 'Too many requests from this IP'
});
```

## Zgodność z Prawem

### 1. RODO/GDPR
- Przechowuj tylko niezbędne dane
- Implementuj prawo do usunięcia
- Szyfruj dane osobowe

### 2. Lokalne Przepisy
- Sprawdź przepisy o monitorowaniu
- Uzyskaj zgodę użytkowników
- Dokumentuj wszystkie akcje

## Testowanie Bezpieczeństwa

### 1. Penetration Testing
```bash
# Testuj endpointy
curl -X POST http://localhost:3001/api/send-command \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -d '{"deviceId":"test","command":"ping"}'
```

### 2. Vulnerability Scanning
```bash
# Skanuj zależności
npm audit
npm audit fix
```

### 3. Code Review
- Przeglądaj kod pod kątem podatności
- Używaj narzędzi statycznej analizy
- Testuj edge cases

## Plan Reagowania na Incydenty

### 1. Wykrywanie
- Monitoruj nietypowe aktywności
- Ustaw alerty dla podejrzanych logów
- Implementuj system detekcji włamań

### 2. Reagowanie
```javascript
// Automatyczne blokowanie
const blockSuspiciousIP = (ip) => {
  // Dodaj IP do blacklisty
  // Zaloguj incydent
  // Powiadom administratora
};
```

### 3. Odzyskiwanie
- Przygotuj plan disaster recovery
- Regularnie twórz kopie zapasowe
- Testuj procedury odzyskiwania

## Podsumowanie

**PAMIĘTAJ:**
1. ✅ Używaj tylko do testowania własnych urządzeń
2. ✅ Zmień wszystkie domyślne hasła
3. ✅ Używaj silnych kluczy szyfrowania
4. ✅ Monitoruj aktywność systemu
5. ✅ Regularnie aktualizuj zależności
6. ❌ Nie używaj do atakowania innych
7. ❌ Nie używaj w produkcji bez dodatkowych zabezpieczeń

**Ten system jest narzędziem edukacyjnym i testowym. Używaj odpowiedzialnie!** 