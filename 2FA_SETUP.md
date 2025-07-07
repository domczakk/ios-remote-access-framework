# RemoteAdminTool - Konfiguracja 2FA

## 🔐 Dwuskładnikowa Autoryzacja (2FA)

System RemoteAdminTool obsługuje dwuskładnikową autoryzację z użyciem Google Authenticator (TOTP - Time-based One-Time Password).

## Konfiguracja Backend

### 1. Instalacja zależności

```bash
cd backend
npm install speakeasy qrcode
```

### 2. Konfiguracja środowiska

Edytuj plik `.env`:

```env
# 2FA Configuration
ENABLE_2FA=true
TOTP_ISSUER=RemoteAdminTool
```

### 3. Uruchomienie serwera

```bash
npm start
```

Serwer automatycznie wygeneruje sekret 2FA przy pierwszym uruchomieniu.

## Konfiguracja 2FA w Panelu Administratora

### Krok 1: Dostęp do konfiguracji

1. Otwórz panel administratora: `http://localhost:5173`
2. Na stronie logowania kliknij **"Konfiguruj 2FA"**
3. Zostanie wyświetlony kod QR i klucz ręczny

### Krok 2: Instalacja Google Authenticator

#### Na urządzeniu mobilnym:
1. **iOS**: Pobierz "Google Authenticator" z App Store
2. **Android**: Pobierz "Google Authenticator" z Google Play
3. **Alternatywy**: 
   - Microsoft Authenticator
   - Authy
   - 1Password

### Krok 3: Dodanie konta

#### Metoda 1: Skanowanie QR kodu
1. Otwórz Google Authenticator
2. Kliknij "+" (Dodaj konto)
3. Wybierz "Skanuj kod QR"
4. Skanuj kod QR z panelu administratora

#### Metoda 2: Wprowadzenie ręczne
1. Otwórz Google Authenticator
2. Kliknij "+" (Dodaj konto)
3. Wybierz "Wprowadź klucz"
4. Wprowadź:
   - **Nazwa konta**: RemoteAdminTool
   - **Klucz**: (skopiuj z panelu administratora)
   - **Typ**: Time-based

### Krok 4: Weryfikacja

1. W Google Authenticator pojawi się 6-cyfrowy kod
2. Kod zmienia się co 30 sekund
3. Użyj tego kodu podczas logowania

## Logowanie z 2FA

### Proces logowania:

1. **Wprowadź dane logowania** (username/password)
2. **System sprawdzi 2FA** - jeśli włączone, poprosi o kod
3. **Wprowadź kod z Google Authenticator**
4. **Zaloguj się** do panelu

### Przykład:

```
Username: admin
Password: admin123
2FA Code: 123456 (z Google Authenticator)
```

## Bezpieczeństwo 2FA

### Zalecenia:

1. **Zachowaj sekret w bezpiecznym miejscu**
   - Sekret jest wyświetlany w konsoli serwera
   - Zapisz go w bezpiecznym miejscu jako backup

2. **Używaj silnych haseł**
   - 2FA nie zastępuje silnego hasła
   - Używaj obu warstw bezpieczeństwa

3. **Backup kodów**
   - Rozważ zapisanie kodów backup
   - W przypadku utraty urządzenia

### Konfiguracja zaawansowana:

#### Zmiana sekretu 2FA:

```javascript
// W backend/server.js
const admin2FASecret = speakeasy.generateSecret({
  name: 'RemoteAdminTool',
  issuer: 'RemoteAdminTool',
  length: 32 // Długość sekretu
});
```

#### Dostosowanie parametrów TOTP:

```javascript
const verify2FA = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Tolerancja czasowa (2 * 30s = 60s)
    algorithm: 'sha1',
    digits: 6,
    period: 30
  });
};
```

## Rozwiązywanie problemów

### Problem: Kod 2FA nie działa

**Rozwiązania:**
1. **Sprawdź czas urządzenia** - synchronizuj z serwerem NTP
2. **Sprawdź algorytm** - upewnij się, że używasz SHA1
3. **Sprawdź długość** - kod powinien mieć 6 cyfr
4. **Sprawdź okres** - kod zmienia się co 30 sekund

### Problem: Nie mogę skanować QR kodu

**Rozwiązania:**
1. **Użyj klucza ręcznego** - skopiuj sekret z panelu
2. **Sprawdź jakość QR** - upewnij się, że jest czytelny
3. **Spróbuj innej aplikacji** - Microsoft Authenticator, Authy

### Problem: Utraciłem dostęp do 2FA

**Rozwiązania:**
1. **Restartuj serwer** - nowy sekret zostanie wygenerowany
2. **Wyłącz 2FA tymczasowo** - ustaw `ENABLE_2FA=false`
3. **Skonfiguruj ponownie** - po ponownym włączeniu

## Testowanie 2FA

### Test weryfikacji:

```bash
# Test endpointu weryfikacji
curl -X POST http://localhost:3001/api/2fa/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"123456"}'
```

### Test logowania:

```bash
# Test logowania z 2FA
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username":"admin",
    "password":"admin123",
    "totpToken":"123456"
  }'
```

## Monitoring 2FA

### Logi serwera:

```javascript
// Dodaj logowanie prób 2FA
console.log(`[2FA] Login attempt for ${username} - 2FA: ${isValid ? 'SUCCESS' : 'FAILED'}`);
```

### Statystyki:

```javascript
// Endpoint statystyk 2FA
app.get('/api/2fa/stats', (req, res) => {
  res.json({
    enabled: process.env.ENABLE_2FA === 'true',
    totalAttempts: 2FAAttempts,
    successfulAttempts: successful2FA,
    failedAttempts: failed2FA
  });
});
```

## Wyłączenie 2FA

### Tymczasowe wyłączenie:

```env
# W pliku .env
ENABLE_2FA=false
```

### Trwałe wyłączenie:

1. Usuń zależności z `package.json`
2. Usuń kod 2FA z `server.js`
3. Usuń konfigurację z `.env`

## Najlepsze praktyki

### 1. Bezpieczeństwo:
- ✅ Używaj silnych sekretów (32+ znaki)
- ✅ Regularnie rotuj sekrety
- ✅ Monitoruj próby logowania
- ✅ Loguj wszystkie akcje 2FA

### 2. UX:
- ✅ Jasne komunikaty błędów
- ✅ Możliwość ponownej próby
- ✅ Backup opcje
- ✅ Instrukcje krok po kroku

### 3. Produkcja:
- ✅ Używaj HTTPS/WSS
- ✅ Implementuj rate limiting
- ✅ Monitoruj wydajność
- ✅ Backup sekretów

## Podsumowanie

2FA w RemoteAdminTool zapewnia dodatkową warstwę bezpieczeństwa:

- **TOTP standard** - kompatybilny z Google Authenticator
- **QR kod** - łatwa konfiguracja
- **Klucz ręczny** - backup opcja
- **Konfigurowalne** - można włączyć/wyłączyć
- **Bezpieczne** - silne szyfrowanie

**Pamiętaj**: 2FA to dodatkowa warstwa bezpieczeństwa, nie zastępuje silnych haseł i innych dobrych praktyk bezpieczeństwa. 