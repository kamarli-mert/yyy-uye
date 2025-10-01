const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
// Env tanilama logu (yalnizca tesiste yardimci)
console.log('ENV CHECK -> has GOOGLE_SERVICE_ACCOUNT_BASE64:', Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64));
console.log('ENV CHECK -> GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID || '(not set)');
console.log('ENV CHECK -> GOOGLE_SHEET_TAB:', process.env.GOOGLE_SHEET_TAB || '(not set)');
console.log('ENV CHECK -> FORM_SECRET set?:', Boolean(process.env.FORM_SECRET));

const { appendRegistrationRow, getCredentialStatus } = require('./sheetsClient');

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
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // İlk IP'yi al (proxy chain'den)
      return forwardedFor.split(',')[0].trim();
    }
    // IPv6 desteği için ipKeyGenerator kullan
    return rateLimit.ipKeyGenerator(req);
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Statik frontend (mutlak yol ile)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Kök rota için açık dosya servisi (bazı ortamlarda gerekli)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Basit healthcheck
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Sade debug: kimlik bilgisi durumunu goster (gizli veri yok)
app.get('/debug/creds', (req, res) => {
  try {
    const status = getCredentialStatus();
    res.json(status);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Kay\u0131t endpointi
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, studentNumber, phoneNumber, department, classYear, studentEmail, formSecret } = req.body || {};

    // Basit gizli anahtar do\u011frulamas\u0131
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on :${port}`);
});


