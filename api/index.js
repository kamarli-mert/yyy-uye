const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const { appendRegistrationRow, getCredentialStatus } = require('../sheetsClient');

const app = express();
app.use(helmet());
app.use(bodyParser.json());

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // mobile app/local tools
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed'), false);
  }
}));

// Oran sınırlama - Vercel için özel yapılandırma
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 60, // dakikada 60 istek
  keyGenerator: (req) => {
    // Vercel'de X-Forwarded-For header'ını kullan
    return req.headers['x-forwarded-for'] || req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Statik frontend
app.use(express.static('public'));

// Basit healthcheck
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Sade debug: kimlik bilgisi durumunu göster (gizli veri yok)
app.get('/debug/creds', (req, res) => {
  try {
    const status = getCredentialStatus();
    res.json(status);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../public/index.html');
});

// Kayıt endpointi
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, studentNumber, phoneNumber, department, classYear, studentEmail, formSecret } = req.body || {};

    // Basit gizli anahtar doğrulaması
    if (process.env.FORM_SECRET && formSecret !== process.env.FORM_SECRET) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    console.log('DEBUG - Form data:', { fullName, studentNumber, phoneNumber, department, classYear, studentEmail });
    
    if (!fullName || !studentNumber || !phoneNumber || !department || !classYear || !studentEmail) {
      return res.status(400).json({ ok: false, error: 'Eksik alanlar: Ad Soyad, Öğrenci No, Telefon, Bölüm, Sınıf ve Öğrenci E-posta zorunlu' });
    }

    console.log('DEBUG - Calling appendRegistrationRow with:', { fullName, studentNumber, phoneNumber, department, classYear, studentEmail });
    const result = await appendRegistrationRow({ fullName, studentNumber, phoneNumber, department, classYear, studentEmail });
    console.log('DEBUG - appendRegistrationRow result:', result);
    res.json({ ok: true, id: result.id, at: result.timestamp });
  } catch (err) {
    console.error('Register error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ ok: false, error: 'Server error: ' + err.message });
  }
});

module.exports = app;
