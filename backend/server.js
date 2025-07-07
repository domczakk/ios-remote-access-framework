const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Store connected devices
const connectedDevices = new Map();

// Store 2FA secrets (in production, use database)
const admin2FASecret = speakeasy.generateSecret({
  name: process.env.TOTP_ISSUER || 'RemoteAdminTool',
  issuer: process.env.TOTP_ISSUER || 'RemoteAdminTool'
});

console.log('🔐 2FA Secret generated:', admin2FASecret.base32);

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

// Generate QR code for 2FA setup
const generateQRCode = async (secret) => {
  try {
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: process.env.TOTP_ISSUER || 'RemoteAdminTool',
      issuer: process.env.TOTP_ISSUER || 'RemoteAdminTool',
      algorithm: 'sha1',
      digits: 6,
      period: 30
    });
    
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Verify 2FA token
const verify2FA = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps in case of clock skew
  });
};

// Admin authentication with 2FA
const authenticateAdmin = async (req, res) => {
  const { username, password, totpToken } = req.body;
  
  if (username !== process.env.ADMIN_USERNAME || 
      password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
  }

  // Check if 2FA is enabled
  if (process.env.ENABLE_2FA === 'true') {
    if (!totpToken) {
      return res.status(400).json({ 
        error: 'Token 2FA wymagany',
        requires2FA: true 
      });
    }

    // Verify 2FA token
    const isValid = verify2FA(totpToken, admin2FASecret.base32);
    if (!isValid) {
      return res.status(401).json({ error: 'Nieprawidłowy token 2FA' });
    }
  }
  
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  return res.json({ token });
};

// Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'RemoteAdminTool API',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/login',
      devices: 'GET /api/devices',
      sendCommand: 'POST /api/send-command',
      twoFactorSetup: 'GET /api/2fa/setup',
      twoFactorVerify: 'POST /api/2fa/verify'
    },
    twoFactorEnabled: process.env.ENABLE_2FA === 'true'
  });
});

app.post('/api/login', authenticateAdmin);

// 2FA setup endpoint
app.get('/api/2fa/setup', async (req, res) => {
  try {
    const qrCode = await generateQRCode(admin2FASecret);
    res.json({
      secret: admin2FASecret.base32,
      qrCode: qrCode,
      issuer: process.env.TOTP_ISSUER || 'RemoteAdminTool'
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd generowania QR kodu' });
  }
});

// Test 2FA token
app.post('/api/2fa/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token wymagany' });
  }

  const isValid = verify2FA(token, admin2FASecret.base32);
  res.json({ valid: isValid });
});

// Protected routes
app.get('/api/devices', verifyToken, (req, res) => {
  const devices = Array.from(connectedDevices.values()).map(device => ({
    socketId: device.socketId,
    name: device.name,
    system: device.system,
    version: device.version,
    batteryLevel: device.batteryLevel,
    connectedAt: device.connectedAt
  }));
  
  res.json({ devices });
});

app.post('/api/send-command', verifyToken, (req, res) => {
  const { deviceId, command, data } = req.body;
  
  if (!deviceId || !command) {
    return res.status(400).json({ error: 'Brak deviceId lub command' });
  }
  
  const device = connectedDevices.get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Urządzenie nie znalezione' });
  }
  
  const socket = io.sockets.sockets.get(device.socketId);
  if (!socket) {
    connectedDevices.delete(deviceId);
    return res.status(404).json({ error: 'Urządzenie odłączone' });
  }
  
  socket.emit('command', { command, data });
  res.json({ success: true, message: 'Komenda wysłana' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Nowe połączenie: ${socket.id}`);
  
  socket.on('register_device', async (data) => {
    try {
      const { token, name, system, version, batteryLevel } = data;
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Register device
      connectedDevices.set(socket.id, {
        socketId: socket.id,
        name: name || 'Unknown Device',
        system: system || 'iOS',
        version: version || 'Unknown',
        batteryLevel: batteryLevel || 0,
        connectedAt: new Date().toISOString()
      });
      
      console.log(`Urządzenie zarejestrowane: ${name} (${socket.id})`);
      socket.emit('registration_success');
      
    } catch (error) {
      console.error('Błąd rejestracji urządzenia:', error);
      socket.emit('registration_error', { error: 'Nieprawidłowy token' });
    }
  });
  
  socket.on('command_response', (data) => {
    console.log(`Odpowiedź z urządzenia ${socket.id}:`, data);
    // Broadcast to admin panel
    io.emit('device_response', {
      deviceId: socket.id,
      ...data
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`Urządzenie odłączone: ${socket.id}`);
    connectedDevices.delete(socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connectedDevices: connectedDevices.size,
    timestamp: new Date().toISOString(),
    twoFactorEnabled: process.env.ENABLE_2FA === 'true'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connectedDevices: connectedDevices.size,
    timestamp: new Date().toISOString(),
    twoFactorEnabled: process.env.ENABLE_2FA === 'true'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
  console.log(`📱 WebSocket dostępny na ws://localhost:${PORT}`);
  console.log(`🔗 API dostępne na http://localhost:${PORT}/api`);
  console.log(`🔐 2FA ${process.env.ENABLE_2FA === 'true' ? 'włączone' : 'wyłączone'}`);
});

module.exports = { app, io, connectedDevices }; 