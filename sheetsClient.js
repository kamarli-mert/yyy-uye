const { google } = require('googleapis');
const { randomUUID } = require('crypto');

function decodeServiceAccount() {
  // Önce .env'den base64'i dene
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);
    // Bazı ortamlarda private_key içinde \n olarak gelir, gerçek yeni satıra çevir
    if (parsed && typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    // Tanılama: kritik alanlar var mı?
    const hasEmail = Boolean(parsed && parsed.client_email);
    const keyLen = parsed && parsed.private_key ? parsed.private_key.length : 0;
    console.log('CREDENTIAL CHECK -> client_email set?:', hasEmail);
    console.log('CREDENTIAL CHECK -> private_key length:', keyLen);
    if (!hasEmail || !keyLen) {
      throw new Error('Service Account JSON eksik: client_email veya private_key yok');
    }
    return parsed;
  }

  // Artık sheet.json fallback yok; güvenlik için zorunlu
  throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 tanımlı değil (.env zorunlu)');
}

async function getSheetsClient() {
  const credentials = decodeServiceAccount();
  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  // GoogleAuth ile oluştur (gtoken "No key" hatalarını daha sağlıklı yönetir)
  const auth = new google.auth.GoogleAuth({ credentials, scopes });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function appendRegistrationRow({ fullName, studentNumber, phoneNumber, department, classYear, studentEmail }) {
  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || '1_-RzpKDNiE4ymLGq-xzOEW-N2J3Jtv2P';
  const tab = process.env.GOOGLE_SHEET_TAB || 'Sayfa1';
  
  console.log('DEBUG - spreadsheetId:', spreadsheetId);
  console.log('DEBUG - tab:', tab);
  console.log('DEBUG - process.env keys:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));

  // Track id ve zaman damgas\u0131 ekleyelim
  const id = randomUUID();
  const timestamp = new Date().toISOString();

  const values = [[
    fullName || '',
    studentNumber || '',
    phoneNumber || '',
    department || '',
    String(classYear || ''),
    studentEmail || ''
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });

  return { id, timestamp };
}

module.exports = { appendRegistrationRow };

// Debug icin yardimci: kimlik bilgisi sahte-özet durumu
function getCredentialStatus() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) return { ok: false, reason: 'ENV_GOOGLE_SERVICE_ACCOUNT_BASE64_MISSING' };
  try {
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);
    const hasEmail = Boolean(parsed && parsed.client_email);
    const keyLen = parsed && parsed.private_key ? parsed.private_key.replace(/\\n/g, '\n').length : 0;
    return { ok: hasEmail && keyLen > 0, hasEmail, keyLen };
  } catch (e) {
    return { ok: false, reason: 'BASE64_OR_JSON_PARSE_ERROR', message: e.message };
  }
}

module.exports.getCredentialStatus = getCredentialStatus;


