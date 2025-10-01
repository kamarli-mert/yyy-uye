console.log('app.js loaded');

// Ortama göre API kök adresini belirle
// - file:// ile açıldıysa: yerel geliştirme sunucusu varsayılanı
// - http(s):// ise: aynı origin altında çalışan /api'yi kullan
const API_BASE = (typeof window !== 'undefined' && window.API_BASE)
  ? window.API_BASE
  : (location.origin.startsWith('file://') ? 'http://localhost:3000' : '');

const form = document.getElementById('f');
const btn = document.getElementById('btn');
const msg = document.getElementById('msg');
const toast = document.getElementById('toast');

const errors = {
  fullName: document.getElementById('e-fullName'),
  studentNumber: document.getElementById('e-studentNumber'),
  phoneNumber: document.getElementById('e-phoneNumber'),
  department: document.getElementById('e-department'),
  classYear: document.getElementById('e-classYear'),
  studentEmail: document.getElementById('e-studentEmail')
};

function setFieldError(id, message){
  const input = document.getElementById(id);
  const errEl = errors[id];
  if(message){
    input.classList.add('error');
    if (errEl) errEl.textContent = message;
  } else {
    input.classList.remove('error');
    if (errEl) errEl.textContent = '';
  }
}

function validate(){
  let ok = true;
  const fullName = document.getElementById('fullName').value.trim();
  const studentNumber = document.getElementById('studentNumber').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const department = document.getElementById('department').value.trim();
  const classYear = document.getElementById('classYear').value.trim();
  const studentEmail = document.getElementById('studentEmail').value.trim();

  setFieldError('fullName', fullName ? '' : 'Bu alan zorunlu');
  if(!fullName) ok = false;

  const snOk = /^\d{2,}$/.test(studentNumber);
  setFieldError('studentNumber', snOk ? '' : 'Sadece rakam, en az 2 hane');
  if(!snOk) ok = false;

  const phoneOk = /^0\d{10}$/.test(phoneNumber);
  setFieldError('phoneNumber', phoneOk ? '' : 'Format: 0XXXXXXXXXX (11 hane)');
  if(!phoneOk) ok = false;

  setFieldError('department', department ? '' : 'Bu alan zorunlu');
  if(!department) ok = false;

  const cy = Number(classYear);
  const classOk = Number.isInteger(cy) && cy >= 1 && cy <= 8;
  setFieldError('classYear', classOk ? '' : '1 ile 8 arasında olmalı');
  if(!classOk) ok = false;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail);
  setFieldError('studentEmail', emailOk ? '' : 'Geçerli bir e‑posta girin');
  if(!emailOk) ok = false;

  return ok;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!validate()) { msg.textContent = 'Lütfen hatalı alanları düzeltin'; msg.className='notice err'; return; }
  btn.classList.add('loading'); btn.disabled = true; msg.textContent = 'Gönderiliyor...'; msg.className='notice';
  const payload = {
    fullName: document.getElementById('fullName').value.trim(),
    studentNumber: document.getElementById('studentNumber').value.trim(),
    phoneNumber: document.getElementById('phoneNumber').value.trim(),
    department: document.getElementById('department').value.trim(),
    classYear: document.getElementById('classYear').value.trim(),
    studentEmail: document.getElementById('studentEmail').value.trim(),
    formSecret: 'abc123def456'
  };
  try{
    const res = await fetch(`${API_BASE}/api/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    if(data.ok){
      msg.textContent = 'Kayıt alındı'; msg.className='notice ok';
      toast.textContent = 'Kayıt başarıyla eklendi';
      toast.className='show ok';
      setTimeout(()=>{ toast.className=''; }, 1800);
      form.reset();
      // Alan hatalarını temizle
      Object.keys(errors).forEach(k => setFieldError(k, ''));
    } else {
      msg.textContent = 'Hata: '+(data.error||'Bilinmeyen'); msg.className='notice err';
      toast.textContent = 'Hata: '+(data.error||'Bilinmeyen');
      toast.className='show err';
      setTimeout(()=>{ toast.className=''; }, 2200);
    }
  }catch(err){
    msg.textContent = 'Hata: sunucuya ulaşılamıyor'; msg.className='notice err';
    toast.textContent = 'Sunucuya ulaşılamıyor';
    toast.className='show err';
    setTimeout(()=>{ toast.className=''; }, 2200);
  } finally { btn.disabled = false; btn.classList.remove('loading'); }
});
