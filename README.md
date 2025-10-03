## Kulüp Hızlı Kayıt Sistemi

Basit bir web formu ile Google Sheets'e üye bilgisi ekler. Frontend statik HTML/JS, backend Node/Express ve Google Sheets API kullanır.

### Kurulum
- Node 18+ kurulu olmalı.
- `npm install`
- `.env` dosyasını oluşturun. `sheet.json` artık kullanılmıyor; servis hesabı bilgileri yalnızca `.env` içindeki `GOOGLE_SERVICE_ACCOUNT_BASE64` ile sağlanmalıdır.
  - `GOOGLE_SERVICE_ACCOUNT_BASE64`: Google Service Account JSON içeriğini base64 kodlayıp buraya koyun (zorunlu).
  - `GOOGLE_SHEET_ID`: Google Sheet ID (zorunlu).
  - `GOOGLE_SHEET_TAB`: Sayfa adı (örn: `Sayfa1`).
  - `ALLOWED_ORIGINS`: Formu kullanacak domainler (virgülle).
  - `FORM_SECRET`: (opsiyonel) basit paylaşılan anahtar.

Örnek `.env` içeriği (tırnaksız, UTF-8 olarak kaydedin):
```
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000
GOOGLE_SHEET_ID=...
GOOGLE_SHEET_TAB=Sayfa1
FORM_SECRET=...
GOOGLE_SERVICE_ACCOUNT_BASE64=...TEK_SATIR_BASE64...
```

### Çalıştırma
```
npm run dev
```
`http://localhost:3000` adresinde form açılır.

### Dağıtım Notları
- Vercel üzerinde `public/` klasörü statik dosyalar için kullanılır.
- Kök rota (`/`) yönlendirme ile `public/index.html` dosyasına gider.
- API istekleri `api/index.js` üzerinden çalışır.

### Google Yetkilendirme
- Google Cloud Console'da bir proje oluşturup Service Account yaratın.
- Bu hesabın e-postasını hedef Sheet'e **Edit** yetkisiyle paylaşın.
- Service Account JSON dosyasını base64'e \
  ```bash
  # macOS/Linux
  base64 -w0 key.json
  # Windows PowerShell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes('key.json'))
  ```

### Güvenlik ve Yarışimsizlik
- Append API satır eklediğinden, aynı anda birden fazla cihaz çakışmaz.
- Kullanıcılar Sheet içinde farklı hücreye tıklasa bile `append` yeni satır ekler; imleç konumundan bağımsızdır.
- Web arayüzünden Sheet'e doğrudan erişimi engellemek için anahtarlar sadece sunucudadır; CORS ve oran sınırlama açıktır. `sheet.json` repoda tutulmamalıdır, `.env` zorunludur.

### Uçtan Uca Akış (Özet)
- Frontend `public/index.html` formu doldurulur → `public/app.js` istemci doğrulaması geçerse `/api/register`'a POST eder.
- Backend `server.js` zorunlu alanları ve (varsa) `FORM_SECRET`'i doğrular → `sheetsClient.appendRegistrationRow` ile Google Sheets'e yazar.
- Kimlik doğrulama `GoogleAuth` ile yapılır; servis hesabı base64'ü `.env`'den çözülür ve `private_key` satır sonları düzeltilir.

### Debug Yardımcıları
- Sağlık kontrolü: `GET /health` → `{ ok: true }`
- Kimlik bilgisi özeti: `GET /debug/creds` → `{ ok, hasEmail, keyLen }` (gizli veri içermez)

### Sorun Giderme
- 500 "No key or keyFile set": `GOOGLE_SERVICE_ACCOUNT_BASE64` hatalıdır. Dosyayı doğrudan base64'e çevirip tek satır olarak `.env`'e koyun. `.env` UTF-8 olmalı.
- 401 Unauthorized: Frontend'deki `formSecret` `.env`'deki `FORM_SECRET` ile aynı değil.
- 403 Forbidden: Service Account'a Sheet'te “Düzenleyen” yetkisi verili değil.
- 400 Bad Request: Zorunlu alanlardan biri boş.
- Sheet sekme adı: `.env`'deki `GOOGLE_SHEET_TAB` Sheet'teki ad ile birebir aynı olmalı (örn: `Sayfa1`).

### Toplanan Alanlar
- Ad Soyad (fullName) – zorunlu
- Öğrenci No (studentNumber) – zorunlu
- Telefon (phoneNumber) – zorunlu
- Bölüm (department) – zorunlu
- Kaçıncı Sınıf (classYear) – zorunlu
- Öğrenci E-posta (studentEmail) – zorunlu

### Arayüz (UI/UX)
- Placeholder'lar, odak (focus) efekti ve responsive grid.
- İstemci tarafı doğrulama: öğrenci no, telefon, sınıf aralığı, e‑posta.
- Başarı/hatada alt mesaj ve kısa süreli toast bildirimi.
- `favicon.svg` ile basit ikon.


