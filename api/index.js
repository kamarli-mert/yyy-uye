const { appendRegistrationRow, getCredentialStatus } = require('../sheetsClient');

// Vercel için basit handler fonksiyonu
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Health check
    if (req.url === '/health' || req.url === '/api/health') {
      res.status(200).json({ ok: true });
      return;
    }

    // Debug endpoint
    if (req.url === '/debug/creds' || req.url === '/api/debug/creds') {
      const status = getCredentialStatus();
      res.status(200).json(status);
      return;
    }

    // Register endpoint
    if (req.url === '/register' || req.url === '/api/register') {
      if (req.method !== 'POST') {
        res.status(405).json({ ok: false, error: 'Method not allowed' });
        return;
      }

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
      res.status(200).json({ ok: true, id: result.id, at: result.timestamp });
      return;
    }

    // 404 for other routes
    res.status(404).json({ ok: false, error: 'Not found' });

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ ok: false, error: 'Server error: ' + err.message });
  }
};
