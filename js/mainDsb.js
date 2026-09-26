const API        = 'https://api-logingoogle-amprem.vercel.app/api/v1/auth';
const GOOGLE_URL = 'https://api-logingoogle-amprem.vercel.app/api/v1/auth?auth';
const STORE      = 'xync_auth';

const AM_PROXY = 'https://am-web.xyncteamofficial.workers.dev';
const AM_API   = 'https://restapidhan.vercel.app';
const AM_KEY   = 'freeapikeydhan26';

const TT_WORKER = 'https://am-web.xyncteamofficial.workers.dev';
const TT_API    = 'https://api-tiktokv2.vercel.app/api/v2/tiktok';

const YT_DL_API = 'https://api-ytdlv1.xyncteamofficial.workers.dev';

const SP_WORKER   = 'https://am-web.xyncteamofficial.workers.dev';
const SP_API      = 'https://api-tiktokv2.vercel.app/api/v2/spotify';
const SP_FALLBACK = 'https://spotsaver.net/api/spotify/';

const SC_API    = 'https://api-tiktokv2.vercel.app/api/v2/soundcloud';
const SC_WORKER = 'https://am-web.xyncteamofficial.workers.dev';

const TM_WORKER = 'https://am-web.xyncteamofficial.workers.dev';
const TM_API    = 'https://api.mail.tm';

async function api(q, body, token) {
  const opt = { method: body ? 'POST' : 'GET', headers: {} };
  if (body) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  if (token) opt.headers.Authorization = 'Bearer ' + token;
  let r;
  try {
    r = await fetch(API + '?' + q, opt);
  } catch {
    const e = new Error('❌ Koneksi ke server gagal. Cek internet lu.');
    e.status = 0;
    throw e;
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) {
    const e = new Error(d.msg || ('❌ Error ' + r.status));
    e.status = r.status;
    throw e;
  }
  return d;
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; }
}

function saveSession(d) {
  if (!d || !d.idToken) return;
  const old = loadSession() || {};
  localStorage.setItem(STORE, JSON.stringify({
    idToken: d.idToken,
    refreshToken: d.refreshToken || old.refreshToken || null,
    exp: Date.now() + (Number(d.expiresIn) || 3600) * 1000
  }));
}

function clearSession() {
  try { localStorage.removeItem(STORE); } catch {}
}

async function getMe() {
  const s = loadSession();
  if (!s || !s.idToken) {
    const e = new Error('Belum login');
    e.status = 401;
    throw e;
  }
  if (s.exp - Date.now() > 60000) {
    try {
      return await api('me', null, s.idToken);
    } catch (e) {
      if (e.status !== 401 || !s.refreshToken) throw e;
    }
  }
  if (!s.refreshToken) {
    clearSession();
    const e = new Error('Session habis');
    e.status = 401;
    throw e;
  }
  try {
    const d = await api('refresh', { refreshToken: s.refreshToken });
    saveSession(d);
    return d;
  } catch (e) {
    if (e.status !== 0) clearSession();
    throw e;
  }
}

function fmtDate(iso) {
  if (!iso) return 'N/A';
  try {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

function authLabel(pid) {
  if (!pid) return 'Unknown';
  const p = pid.toLowerCase();
  const map = {
    'google.com': 'Google',
    'password': 'Email / Password',
    'email': 'Email',
    'facebook.com': 'Facebook',
    'github.com': 'GitHub',
    'twitter.com': 'Twitter',
    'apple.com': 'Apple'
  };
  return map[p] || pid;
}

function renderUser(user) {
  sessionStorage.setItem('xync_sess', JSON.stringify({
    uid: user.uid,
    email: user.email,
    name: user.name
  }));

  document.body.classList.add('sess-ok');

  const corner  = document.getElementById('avatarCorner');
  const photo   = document.getElementById('uPhoto');
  const letter  = document.getElementById('uLetter');

  const uName = user.name || (user.email ? user.email.split('@')[0] : 'User');
  const uInit = (user.email || uName).charAt(0).toUpperCase();

  if (user.photo) {
    photo.src = user.photo;
    photo.style.display = 'block';
    letter.style.display = 'none';
  } else {
    photo.style.display = 'none';
    letter.style.display = 'flex';
    letter.textContent = uInit;
  }

  corner.classList.add('show');

  const profPhoto   = document.getElementById('profPhoto');
  const profLetter  = document.getElementById('profLetter');
  const profName    = document.getElementById('profName');
  const profMail    = document.getElementById('profMail');
  const profUid     = document.getElementById('profUid');
  const profProv    = document.getElementById('profProv');
  const profCreated = document.getElementById('profCreated');
  const profLastIn  = document.getElementById('profLastIn');
  const profBadge   = document.getElementById('profBadge');

  profName.textContent    = uName;
  profMail.textContent    = user.email || '(tidak ada email)';
  profUid.textContent     = user.uid;
  profProv.textContent    = authLabel((user.providers && user.providers[0]) || 'password');

  profCreated.textContent = fmtDate(user.createdAt);
  profLastIn.textContent  = fmtDate(user.lastLoginAt);

  if (user.emailVerified) {
    profBadge.className = 'prof-badge ok';
    profBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Email Verified</span>';
  } else {
    profBadge.className = 'prof-badge no';
    profBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> <span>Belum Verified</span>';
  }

  if (user.photo) {
    profPhoto.src = user.photo;
    profPhoto.style.display = 'flex';
    profLetter.style.display = 'none';
  } else {
    profPhoto.style.display = 'none';
    profLetter.style.display = 'flex';
    profLetter.textContent = uInit;
  }

  const modal = document.getElementById('profPanel');
  function showProf() {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function hideProf() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  corner.addEventListener('click', showProf);
  document.getElementById('panelClose').addEventListener('click', hideProf);
  modal.addEventListener('click', (e) => { if (e.target === modal) hideProf(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) hideProf();
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const txt = document.getElementById(btn.dataset.copy).textContent;
      try {
        await navigator.clipboard.writeText(txt);
        const ico = btn.querySelector('i');
        ico.className = 'fa-solid fa-check';
        btn.classList.add('copied');
        setTimeout(() => {
          ico.className = 'fa-solid fa-copy';
          btn.classList.remove('copied');
        }, 1500);
      } catch {}
    });
  });

  async function signout(btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
    try {
      sessionStorage.removeItem('xync_sess');
      clearSession();
      await api('logout').catch(() => {});
      window.location.replace('index.html');
    } catch (e) {
      btn.disabled = false;
    }
  }

  document.getElementById('btnSignout').addEventListener('click', function () {
    signout(this);
  });
}

async function boot() {
  try {
    const d = await getMe();
    window.__authUser = d.user;
    window.__getIdToken = async () => (await getMe(), (loadSession() || {}).idToken);
    renderUser(d.user);
  } catch (e) {
    window.location.replace('index.html');
  }
}

boot();

window.addEventListener('pageshow', (e) => {
  if (e.persisted && !loadSession()) {
    window.location.replace('index.html');
  }
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + target).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
});

document.querySelectorAll('.api-code-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const isOpen = target.classList.toggle('show');
    btn.classList.toggle('open', isOpen);
  });
});

const secSend   = document.getElementById('sec-send');
const secVerify = document.getElementById('sec-verify');
const nd1       = document.getElementById('nd1');
const nd2       = document.getElementById('nd2');

function flash(id, type, msg) {
  const el = document.getElementById(id);
  el.className = 'msg-box show ' + type;
  el.innerHTML = msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clear(id) {
  const el = document.getElementById(id);
  el.className = 'msg-box';
  el.innerHTML = '';
}
function busy(btn, on, lbl) {
  btn.disabled = on;
  btn.innerHTML = on ? '<span class="ring"></span> Processing...' : lbl;
}
function safe(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function openVerify(email) {
  secSend.classList.remove('active');
  secVerify.classList.add('active');
  nd1.classList.remove('active');
  nd1.classList.add('done');
  nd1.innerHTML = '<i class="fa-solid fa-check"></i><span class="txt">Sent</span>';
  nd2.classList.add('active');
  document.getElementById('emailCheck').value = email || '';
  document.getElementById('linkInput').focus();
}
function openSend() {
  secVerify.classList.remove('active');
  secSend.classList.add('active');
  nd1.classList.remove('done');
  nd1.classList.add('active');
  nd1.innerHTML = '<i class="fa-solid fa-envelope"></i><span class="txt">Send</span>';
  nd2.classList.remove('active');
}

async function amSendLink(email) {
  const target = `${AM_API}/api/am?action=send&apikey=${encodeURIComponent(AM_KEY)}&email=${encodeURIComponent(email)}`;
  const url = `${AM_PROXY}/?target=${encodeURIComponent(target)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json, text/plain, */*' }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function amVerify(email, link) {
  const target = `${AM_API}/api/am?action=verif&apikey=${encodeURIComponent(AM_KEY)}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(link)}`;
  const url = `${AM_PROXY}/?target=${encodeURIComponent(target)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json, text/plain, */*' }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

document.getElementById('doSend').addEventListener('click', async () => {
  const btn   = document.getElementById('doSend');
  const email = document.getElementById('emailAddr').value.trim();
  clear('msg-send');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return flash('msg-send', 'fail',
      '<i class="fa-solid fa-triangle-exclamation"></i> Masukkan email yang valid!');
  }

  busy(btn, true);
  flash('msg-send', 'pend',
    '<span class="ring"></span> Mengirim magic link ke <b>' + safe(email) + '</b>...');

  try {
    const { ok, status, data } = await amSendLink(email);

    const isSuccess =
      ok && (
        data.status === true ||
        data.status === 'success' ||
        data.status === 'ok' ||
        data.success === true ||
        data.message?.toLowerCase().includes('berhasil') ||
        data.message?.toLowerCase().includes('success') ||
        data.message?.toLowerCase().includes('sent')
      );

    if (isSuccess) {
      flash('msg-send', 'ok',
        `<i class="fa-solid fa-circle-check"></i> <b>Magic link terkirim!</b><br>
         Cek inbox / spam: <b>${safe(email)}</b><br>
         <small>Mengalihkan ke halaman verifikasi...</small>`);
      setTimeout(() => {
        clear('msg-send');
        openVerify(email);
      }, 1600);
    } else {
      const err = data.error || data.message || ('HTTP ' + status);
      flash('msg-send', 'fail',
        `<i class="fa-solid fa-circle-xmark"></i> <b>Gagal mengirim</b><br>${safe(err)}
         <pre>${safe(JSON.stringify(data, null, 2))}</pre>`);
    }
  } catch (e) {
    flash('msg-send', 'fail',
      `<i class="fa-solid fa-circle-xmark"></i> Network error: ${safe(e.message)}`);
  } finally {
    busy(btn, false, '<i class="fa-solid fa-paper-plane"></i> Send Magic Link');
  }
});

document.getElementById('doVerify').addEventListener('click', async () => {
  const btn   = document.getElementById('doVerify');
  const email = document.getElementById('emailCheck').value.trim();
  const link  = document.getElementById('linkInput').value.trim();
  clear('msg-verify');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return flash('msg-verify', 'fail',
      '<i class="fa-solid fa-triangle-exclamation"></i> Email tidak valid!');
  }
  if (!/^https?:\/\//.test(link)) {
    return flash('msg-verify', 'fail',
      '<i class="fa-solid fa-triangle-exclamation"></i> Magic link harus dimulai dengan http:// atau https://');
  }

  busy(btn, true);
  flash('msg-verify', 'pend',
    '<span class="ring"></span> Memverifikasi premium...');

  try {
    const { ok, status, data } = await amVerify(email, link);

    const isSuccess =
      ok && (
        data.status === true ||
        data.status === 'success' ||
        data.status === 'ok' ||
        data.success === true ||
        data.message?.toLowerCase().includes('berhasil') ||
        data.message?.toLowerCase().includes('success') ||
        data.message?.toLowerCase().includes('activated') ||
        data.message?.toLowerCase().includes('verified')
      );

    if (isSuccess) {
      flash('msg-verify', 'ok',
        `<i class="fa-solid fa-crown"></i> <b>PREMIUM BERHASIL!</b><br><br>
         📧 <b>${safe(email)}</b><br>
         Silakan buka Alight Motion & login pakai akun Google ini.
         <pre>${safe(JSON.stringify(data, null, 2))}</pre>`);
    } else {
      const err = data.error || data.message || ('HTTP ' + status);
      flash('msg-verify', 'fail',
        `<i class="fa-solid fa-circle-xmark"></i> <b>Verifikasi gagal</b><br>${safe(err)}
         <pre>${safe(JSON.stringify(data, null, 2))}</pre>`);
    }
  } catch (e) {
    flash('msg-verify', 'fail',
      `<i class="fa-solid fa-circle-xmark"></i> Network error: ${safe(e.message)}`);
  } finally {
    busy(btn, false, '<i class="fa-solid fa-unlock-keyhole"></i> Verify Premium');
  }
});

document.getElementById('goBack').addEventListener('click', () => {
  clear('msg-verify');
  openSend();
});

document.getElementById('emailAddr').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('doSend').click();
});

const ttUrl     = document.getElementById('ttUrl');
const ttFetch   = document.getElementById('ttFetch');
const ttResult  = document.getElementById('ttResult');
const ttSrcHint = document.getElementById('ttSrcHint');

const TT_SOURCES = {
  '':           { name: 'Auto',        hint: '<b>Auto</b> — coba TikWM dulu, kalau gagal otomatis pindah ke SnapTik.app lalu SnapTik.fi.' },
  'tikwm':      { name: 'TikWM',       hint: '<b>TikWM</b> — paling cepat (~1 detik), ada HD, watermark, dan audio.' },
  'snaptikapp': { name: 'SnapTik.app', hint: '<b>SnapTik.app</b> — HD asli dari server SnapTik (3-6 detik), tanpa audio terpisah.' },
  'snaptikfi':  { name: 'SnapTik.fi',  hint: '<b>SnapTik.fi</b> — kualitas SD saja, tapi ada audio terpisah.' }
};
let ttSource = localStorage.getItem('tt_source') || '';
if (!(ttSource in TT_SOURCES)) ttSource = '';

document.querySelectorAll('.tt-src').forEach(btn => {
  if (btn.dataset.src === ttSource) {
    document.querySelectorAll('.tt-src').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ttSrcHint.innerHTML = TT_SOURCES[ttSource].hint;
  }
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tt-src').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ttSource = btn.dataset.src;
    localStorage.setItem('tt_source', ttSource);
    ttSrcHint.innerHTML = TT_SOURCES[ttSource].hint;
  });
});

function ttMsg(type, msg) {
  const el = document.getElementById('msg-tt');
  el.className = 'msg-box show ' + type;
  el.innerHTML = msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function ttClear() {
  const el = document.getElementById('msg-tt');
  el.className = 'msg-box';
  el.innerHTML = '';
  ttResult.classList.remove('show');
  ttResult.innerHTML = '';
}
function ttBusy(on) {
  ttFetch.disabled = on;
  ttFetch.innerHTML = on
    ? '<span class="ring"></span> Processing...'
    : '<i class="fa-solid fa-cloud-arrow-down"></i> Download';
}
function fmtNum(n) {
  if (n === null || n === undefined || n === '') return '–';
  n = Number(n) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
function ttEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function fetchTikTok(url) {
  const qs = new URLSearchParams({ url });
  if (ttSource) qs.set('source', ttSource);

  const target = `${TT_API}?${qs}`;
  const res = await fetch(`${TT_WORKER}/?target=${encodeURIComponent(target)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = json.errors
      ? Object.entries(json.errors).map(([k, v]) => `${k}: ${v}`).join('<br>')
      : '';
    const e = new Error(json.message || `HTTP ${res.status}`);
    e.detail = detail;
    throw e;
  }

  json._source = res.headers.get('X-Source') || ttSource || 'tikwm';
  json._hd = res.headers.get('X-HD') || '';
  return json;
}

async function handleTT() {
  const url = ttUrl.value.trim();
  ttClear();

  if (!url) {
    return ttMsg('fail',
      '<i class="fa-solid fa-triangle-exclamation"></i> Masukkan URL TikTok!');
  }
  if (!/(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(url)) {
    return ttMsg('fail',
      '<i class="fa-solid fa-triangle-exclamation"></i> URL TikTok tidak valid!');
  }

  ttBusy(true);
  ttMsg('pend', `<span class="ring"></span> Mengambil data via <b>${TT_SOURCES[ttSource].name}</b>...`);

  try {
    const data = await fetchTikTok(url);

    if (!data || data.code !== 0 || !data.data) {
      const err = (data && data.msg) || 'Gagal mengambil data';
      ttMsg('fail',
        `<i class="fa-solid fa-circle-xmark"></i> <b>Gagal</b><br>${ttEsc(err)}
         <pre>${ttEsc(JSON.stringify(data, null, 2))}</pre>`);
      return;
    }

    renderTT(data.data, data._source, data._hd);
    ttMsg('ok',
      `<i class="fa-solid fa-circle-check"></i> <b>Berhasil!</b> Data diambil via <b>${ttEsc(data._source)}</b>.`);

  } catch (e) {
    ttMsg('fail',
      `<i class="fa-solid fa-circle-xmark"></i> ${ttEsc(e.message)}${e.detail ? `<pre>${e.detail}</pre>` : ''}`);
  } finally {
    ttBusy(false);
  }
}

function renderTT(d, source, hdFlag) {
  const isSlide = Array.isArray(d.images) && d.images.length > 0;
  const author = d.author || {};
  const music = d.music_info || {};
  const hasHd = !!(d.hdplay && d.play && d.hdplay !== d.play);
  const isSnapApp = source === 'snaptikapp' || ttSource === 'snaptikapp' || /rapidcdn\.app/i.test(d.play || '');
  if (isSnapApp) source = 'snaptikapp';

  let html = '';

  html += `<div class="tt-badges">
    <span class="tt-badge src"><i class="fa-solid fa-server"></i> ${ttEsc(source || 'tikwm')}</span>
    ${isSlide
      ? `<span class="tt-badge"><i class="fa-solid fa-images"></i> Slide</span>`
      : (hasHd || hdFlag === 'direct')
        ? `<span class="tt-badge hd"><i class="fa-solid fa-circle-check"></i> HD tersedia</span>`
        : `<span class="tt-badge sd"><i class="fa-solid fa-circle-info"></i> SD only</span>`}
    ${d.duration ? `<span class="tt-badge"><i class="fa-solid fa-clock"></i> ${ttEsc(d.duration)}s</span>` : ''}
  </div>`;

  html += `
    <div class="tt-info-card">
      <div class="tt-author">
        ${author.avatar
          ? `<img class="tt-author-avatar" src="${ttEsc(author.avatar)}" alt=""
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="tt-author-avatar" style="display:none;">${ttEsc((author.nickname || '?').charAt(0).toUpperCase())}</div>`
          : `<div class="tt-author-avatar">${ttEsc((author.nickname || '?').charAt(0).toUpperCase())}</div>`
        }
        <div class="tt-author-info">
          <div class="tt-author-name">${ttEsc(author.nickname || 'Unknown')}</div>
          <div class="tt-author-handle">@${ttEsc(author.unique_id || 'unknown')}</div>
        </div>
      </div>
      <div class="tt-stats">
        <div class="tt-stat"><i class="fa-solid fa-play"></i><span class="num">${fmtNum(d.play_count)}</span><span class="lbl">Views</span></div>
        ${isSnapApp ? '' : `<div class="tt-stat"><i class="fa-solid fa-heart"></i><span class="num">${fmtNum(d.digg_count)}</span><span class="lbl">Likes</span></div>`}
        <div class="tt-stat"><i class="fa-solid fa-comment"></i><span class="num">${fmtNum(d.comment_count)}</span><span class="lbl">Comments</span></div>
        <div class="tt-stat"><i class="fa-solid fa-share"></i><span class="num">${fmtNum(d.share_count)}</span><span class="lbl">Shares</span></div>
      </div>
    </div>
  `;

  if (d.title) {
    html += `<div class="tt-title">${ttEsc(d.title)}</div>`;
  }

  if (isSlide) {
    html += `<div class="tt-slides">`;
    d.images.forEach((imgUrl, i) => {
      html += `
        <div class="tt-slide-item">
          <img src="${ttEsc(imgUrl)}" alt="slide ${i+1}" loading="lazy">
          <span class="slide-num">${i+1}</span>
          <a class="slide-dl" href="${ttEsc(imgUrl)}" download="slide_${i+1}.jpg"
             target="_blank" rel="noopener" title="Download">
            <i class="fa-solid fa-download"></i>
          </a>
        </div>
      `;
    });
    html += `</div>`;

    html += `
      <div class="tt-dl-group">
        <button class="tt-dl-btn tt-dl-btn-primary" id="ttDownloadAll">
          <i class="fa-solid fa-images"></i> Download Semua Slide (${d.images.length})
        </button>
      </div>
    `;

  } else if (d.play || d.hdplay) {
    const videoUrl = d.hdplay || d.play;
    html += `
      <div class="tt-cover-wrap">
        <video controls playsinline preload="metadata" poster="${ttEsc(d.cover || d.origin_cover || '')}">
          <source src="${ttEsc(videoUrl)}" type="video/mp4">
        </video>
      </div>
      <div class="tt-dl-group">
        <a class="tt-dl-btn tt-dl-btn-primary" href="${ttEsc(videoUrl)}"
           download="tiktok${hasHd ? '_hd' : ''}.mp4" target="_blank" rel="noopener">
          <i class="fa-solid fa-download"></i> ${hasHd ? 'Download Video HD (No WM)' : 'Download Video (No WM)'}
        </a>
        ${hasHd ? `
          <a class="tt-dl-btn tt-dl-btn-secondary" href="${ttEsc(d.play)}"
             download="tiktok_sd.mp4" target="_blank" rel="noopener">
            <i class="fa-solid fa-compress"></i> Download Video SD (No WM)
          </a>
        ` : ''}
        ${d.wmplay ? `
          <a class="tt-dl-btn tt-dl-btn-secondary" href="${ttEsc(d.wmplay)}"
             download="tiktok_wm.mp4" target="_blank" rel="noopener">
            <i class="fa-solid fa-droplet"></i> Download dengan Watermark
          </a>
        ` : ''}
      </div>
    `;
  } else {
    html += `<div class="tt-title" style="border-left-color:#ef4444;color:#fca5a5;">
      ⚠️ Tidak ada media yang bisa di-download dari URL ini.
    </div>`;
  }

  if (music.play) {
    html += `
      <div class="tt-dl-group" style="margin-top:10px;">
        <a class="tt-dl-btn tt-dl-btn-secondary" href="${ttEsc(music.play)}"
           download="music.mp3" target="_blank" rel="noopener">
          <i class="fa-solid fa-music"></i> Download Audio
        </a>
      </div>
    `;
  }

  ttResult.innerHTML = html;
  ttResult.classList.add('show');

  const btnAll = document.getElementById('ttDownloadAll');
  if (btnAll) {
    btnAll.addEventListener('click', async () => {
      const orig = btnAll.innerHTML;
      btnAll.disabled = true;
      for (let i = 0; i < d.images.length; i++) {
        try {
          btnAll.innerHTML = `<span class="ring"></span> ${i+1}/${d.images.length}...`;
          const link = document.createElement('a');
          link.href = d.images[i];
          link.download = `slide_${i+1}.jpg`;
          link.target = '_blank';
          link.rel = 'noopener';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise(r => setTimeout(r, 400));
        } catch {}
      }
      btnAll.innerHTML = orig;
      btnAll.disabled = false;

      setTimeout(() => {
        ttClear();
        ttUrl.value = '';
      }, 500);
    });
  }
}

ttResult.addEventListener('click', (e) => {
  if (e.target.closest('#ttDownloadAll')) return;

  const isDlLink = e.target.closest('a[download]') || e.target.closest('.slide-dl');
  if (!isDlLink) return;

  setTimeout(() => {
    ttClear();
    ttUrl.value = '';
  }, 1200);
});

ttFetch.addEventListener('click', handleTT);
ttUrl.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleTT();
});

document.querySelectorAll('.dl-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dl-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dl-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('dl-panel-' + tab.dataset.dltab)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
});

const ytUrl     = document.getElementById('ytUrl');
const ytFetch   = document.getElementById('ytFetch');
const ytResult  = document.getElementById('ytResult');
const ytHint    = document.getElementById('ytAutoHint');

function ytEsc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function ytExtractId(input) {
  const value = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  try {
    const parsed = new URL(value.includes('://') ? value : `https://${value}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
    }
    if (host !== 'youtube.com' && !host.endsWith('.youtube.com')) return '';
    const queryId = parsed.searchParams.get('v') || '';
    if (/^[A-Za-z0-9_-]{11}$/.test(queryId)) return queryId;
    const match = parsed.pathname.match(/^\/(?:shorts|embed|v|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function ytLooksLikeShorts(input) {
  try {
    const parsed = new URL(input.includes('://') ? input : `https://${input}`);
    return /^\/shorts\/[A-Za-z0-9_-]{11}(?:\/|$)/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function ytFmtDuration(value) {
  const total = Number(value);
  if (!Number.isFinite(total) || total < 0) return '';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function ytMsg(type, html) {
  const el = document.getElementById('msg-yt');
  el.className = 'msg-box show ' + type;
  el.innerHTML = html;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ytClear() {
  const el = document.getElementById('msg-yt');
  el.className = 'msg-box';
  el.innerHTML = '';
  ytResult.classList.remove('show');
  ytResult.innerHTML = '';
}

function ytBusy(on) {
  ytFetch.disabled = on;
  ytFetch.innerHTML = on
    ? '<span class="ring"></span> Auto Detecting...'
    : '<i class="fa-solid fa-cloud-arrow-down"></i> Download';
}

function ytSanitize(name) {
  return String(name || 'youtube-media')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'youtube-media';
}

function ytProgressColor(pct) {
  const hue = Math.max(0, Math.min(120, (pct / 100) * 120));
  return `hsl(${hue}, 92%, 48%)`;
}

function ytMediaRow(item) {
  const typeLabel = item.type === 'audio' ? 'Audio' : 'Video';
  const name = item.format || `${item.quality || typeLabel} [.${item.extension || 'mp4'}]`;
  const detail = [
    typeLabel,
    item.extension ? item.extension.toUpperCase() : '',
    item.size || ''
  ].filter(Boolean).join(' • ');

  return `
    <div class="yt-item">
      <div class="yt-item-info">
        <div class="yt-item-name">${ytEsc(name)}</div>
        <div class="yt-item-sub">${ytEsc(detail)}</div>
      </div>
      <button type="button" class="tt-dl-btn tt-dl-btn-primary yt-dl-trigger"
              data-url="${ytEsc(item.url)}"
              data-name="${ytEsc(item.quality || 'youtube-media')}"
              data-ext="${ytEsc(item.extension || 'mp4')}">
        <i class="fa-solid fa-download"></i> Download
      </button>
    </div>
  `;
}

function ytRender(response) {
  const data = response.data || {};
  const type = response._inputWasShorts || response.type === 'shorts' ? 'shorts' : 'video';
  const thumbnail = data.thumbnail || (data.id
    ? `https://i.ytimg.com/vi/${encodeURIComponent(data.id)}/hqdefault.jpg`
    : '');
  const duration = ytFmtDuration(data.duration);
  const typeName = type === 'shorts' ? 'YouTube Shorts' : 'YouTube Video';

  let mediaHtml = '';
  if (data.url) {
    mediaHtml = ytMediaRow({
      type: data.format === 'mp3' ? 'audio' : 'video',
      quality: 'Shorts',
      format: `YouTube Shorts [.${data.format || 'mp4'}]`,
      extension: data.format || 'mp4',
      size: '',
      url: data.url
    });
  } else {
    const medias = Array.isArray(data.medias) ? data.medias : [];
    mediaHtml = medias.length
      ? medias.map(ytMediaRow).join('')
      : '<div class="yt-empty"><i class="fa-solid fa-circle-exclamation"></i><br>Tidak ada format download yang tersedia.</div>';
  }

  ytResult.innerHTML = `
    <div class="yt-meta">
      ${thumbnail ? `<img class="yt-thumb" src="${ytEsc(thumbnail)}" alt="Thumbnail" loading="lazy">` : ''}
      <div class="yt-meta-body">
        <div class="yt-meta-title">${ytEsc(data.title || `YouTube ${data.id || ''}`)}</div>
        <div class="yt-meta-sub">
          <span class="yt-chip"><i class="fa-brands fa-youtube"></i> ${ytEsc(typeName)}</span>
          ${duration ? `<span class="yt-chip"><i class="fa-solid fa-clock"></i> ${ytEsc(duration)}</span>` : ''}
          <span class="yt-chip"><i class="fa-solid fa-wand-magic-sparkles"></i> Auto Detected</span>
        </div>
      </div>
    </div>
    <div class="yt-list">${mediaHtml}</div>
  `;
  ytResult.classList.add('show');
}

async function ytRequest(input, forcedType = '') {
  const params = new URLSearchParams({ url: input });
  if (forcedType) params.set('type', forcedType);

  const res = await fetch(`${YT_DL_API}?${params}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success || !data.data) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }
  return data;
}

function ytSetProgress(btn, pct) {
  const bar = btn.querySelector('.yt-dl-progress-fill');
  const txt = btn.querySelector('.yt-dl-progress-text');
  if (bar) {
    bar.style.width = pct + '%';
    bar.style.background = ytProgressColor(pct);
  }
  if (txt) txt.textContent = pct + '%';
}

async function ytDownloadBlob(url, filename, btn) {
  let res = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
    credentials: 'omit'
  });

  if ((res.status === 502 || res.status === 410 || res.status === 403) && ytUrl.value.trim()) {
    btn.innerHTML = '<span class="ring"></span> Refresh token...';
    try {
      const fresh = await ytRequest(ytUrl.value.trim());
      const medias = fresh.data?.medias || (fresh.data?.url ? [{ url: fresh.data.url }] : []);
      const ext = filename.split('.').pop();
      const match = medias.find(m => (m.extension || '').toLowerCase() === ext.toLowerCase()) || medias[0];
      if (match && match.url) {
        url = match.url;
        res = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow',
          credentials: 'omit'
        });
      }
    } catch {}
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let finalName = filename;
  const cd = res.headers.get('content-disposition');
  if (cd) {
    const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^";']+)/i);
    if (m && m[1]) {
      try { finalName = decodeURIComponent(m[1].trim()); } catch {}
    }
  }

  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body && res.body.getReader ? res.body.getReader() : null;
  let blob;

  if (reader && total > 0) {
    btn.innerHTML = `<span class="yt-dl-progress"><span class="yt-dl-progress-fill" style="width:0%;background:${ytProgressColor(0)}"></span><span class="yt-dl-progress-text">0%</span></span>`;
    ytSetProgress(btn, 0);

    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      const pct = Math.min(99, Math.round((received / total) * 100));
      ytSetProgress(btn, pct);
    }
    blob = new Blob(chunks, {
      type: res.headers.get('content-type') || 'application/octet-stream'
    });
    ytSetProgress(btn, 100);
    await new Promise(r => setTimeout(r, 250));
  } else {
    btn.innerHTML = `<span class="yt-dl-progress"><span class="yt-dl-progress-fill" style="width:100%;background:${ytProgressColor(100)}"></span><span class="yt-dl-progress-text">100%</span></span>`;
    blob = await res.blob();
    await new Promise(r => setTimeout(r, 250));
  }

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = finalName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
}

document.getElementById('ytResult').addEventListener('click', async (e) => {
  const btn = e.target.closest('.yt-dl-trigger');
  if (!btn || btn.disabled) return;
  e.preventDefault();
  e.stopPropagation();

  const url  = btn.dataset.url;
  const name = ytSanitize(btn.dataset.name || 'youtube-media');
  const ext  = btn.dataset.ext || 'mp4';
  const filename = `${name}.${ext}`;

  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="yt-dl-progress"><span class="yt-dl-progress-fill" style="width:0%;background:${ytProgressColor(0)}"></span><span class="yt-dl-progress-text">0%</span></span>`;

  try {
    await ytDownloadBlob(url, filename, btn);
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Selesai!';
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = orig;
    }, 1800);
  } catch (err) {
    console.error('YT download error:', err);
    btn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Gagal';
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = orig;
    }, 2200);
    ytMsg('fail', `<i class="fa-solid fa-circle-xmark"></i> Download gagal: ${ytEsc(err.message || 'Unknown error')}`);
  }
});

async function handleYouTubeDownload() {
  const input = ytUrl.value.trim();
  ytClear();

  if (!input) {
    return ytMsg('fail', '<i class="fa-solid fa-triangle-exclamation"></i> Masukkan URL YouTube!');
  }
  if (!ytExtractId(input)) {
    return ytMsg('fail', '<i class="fa-solid fa-triangle-exclamation"></i> URL atau ID YouTube tidak valid!');
  }

  const inputWasShorts = ytLooksLikeShorts(input);
  ytBusy(true);
  ytMsg('pend', '<span class="ring"></span> Mendeteksi link dan mengambil format download...');

  try {
    let data;
    try {
      data = await ytRequest(input);
    } catch (firstError) {
      if (!inputWasShorts) throw firstError;
      ytMsg('pend', '<span class="ring"></span> Provider Shorts sibuk, mencoba jalur alternatif...');
      data = await ytRequest(input, 'video');
      data._fallback = true;
    }

    data._inputWasShorts = inputWasShorts;
    ytRender(data);
    const detected = inputWasShorts || data.type === 'shorts'
      ? 'YouTube Shorts'
      : 'YouTube Video';
    const via = data._fallback ? ' melalui jalur alternatif' : '';
    ytMsg('ok', `<i class="fa-solid fa-circle-check"></i> <b>${ytEsc(detected)}</b> terdeteksi${via}. Pilih format untuk mulai download.`);
  } catch (error) {
    ytMsg('fail', `<i class="fa-solid fa-circle-xmark"></i> ${ytEsc(error.message || 'Gagal mengambil data YouTube.')}`);
  } finally {
    ytBusy(false);
  }
}

ytFetch.addEventListener('click', handleYouTubeDownload);
ytUrl.addEventListener('keydown', event => {
  if (event.key === 'Enter') handleYouTubeDownload();
});
ytUrl.addEventListener('input', () => {
  const value = ytUrl.value.trim();
  const label = ytLooksLikeShorts(value) ? 'Shorts terdeteksi dari URL' : 'Video/ID akan dideteksi oleh API';
  ytHint.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${ytEsc(label)} saat tombol Download ditekan.`;
});

const spQuery  = document.getElementById('spQuery');
const spBtn    = document.getElementById('spSearch');
const spResult = document.getElementById('spResult');

let spLast  = null;
let spItems = [];

function spEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function spMsg(type, msg) {
  const el = document.getElementById('msg-sp');
  el.className = 'msg-box show ' + type;
  el.innerHTML = msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function spFmtDur(sec) {
  const s = parseInt(sec, 10);
  if (Number.isNaN(s) || s <= 0) return '';
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function spBusy(on) {
  spBtn.disabled = on;
  spBtn.innerHTML = on
    ? '<span class="ring"></span> Processing...'
    : '<i class="fa-solid fa-magnifying-glass"></i> Search';
}

async function spFetchJson(params) {
  const qs = new URLSearchParams(params).toString();
  const urls = [
    `${SP_WORKER}/?target=${encodeURIComponent(`${SP_API}?${qs}`)}`,
    `${SP_WORKER}/?target=${encodeURIComponent(SP_FALLBACK + qs)}`
  ];
  let lastErr = new Error('Gagal konek ke API Spotify 😭');
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'Accept': 'application/json' } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 404) {
        const err = new Error(json.message || `HTTP ${res.status}`);
        err.fatal = res.status === 400 || res.status === 401 || res.status === 403;
        throw err;
      }
      if (!res.ok) {
        lastErr = new Error(json.message || `HTTP ${res.status}`);
        continue;
      }
      return json;
    } catch (e) {
      lastErr = e;
      if (e.fatal) throw e;
    }
  }
  throw lastErr;
}

function spStreamUrl(t) {
  if (t.download_proxy && t.download_proxy.includes('dl=')) return t.download_proxy;
  if (!t.download) return '';
  const label = (t.artist && t.artist !== '?' ? t.artist + ' - ' : '') + t.title;
  return `${SP_API}?dl=${encodeURIComponent(t.download)}&name=${encodeURIComponent(label)}`;
}

function spDlBtnsHtml(t) {
  const via = spStreamUrl(t);
  return `
    ${via ? `<a class="tt-dl-btn tt-dl-btn-primary" href="${spEsc(via)}" target="_blank" rel="noopener">
      <i class="fa-solid fa-download"></i> Download MP3
    </a>` : ''}
    <a class="tt-dl-btn tt-dl-btn-secondary" href="${spEsc(t.download)}" target="_blank" rel="noopener">
      <i class="fa-solid fa-link"></i> Direct Link
    </a>
    ${via ? `<button class="tt-dl-btn tt-dl-btn-secondary" type="button" data-spcopy="${spEsc(via)}">
      <i class="fa-solid fa-copy"></i> Copy Link
    </button>` : ''}
  `;
}

function renderSp(data) {
  const tracks = (data.tracks || []).slice(0, 10);
  spItems = tracks;

  let html = `<span class="sp-badge"><i class="fa-brands fa-spotify"></i> ${spEsc(String(data.type || 'search').toUpperCase())}</span>`;

  if ((data.type === 'album' || data.type === 'playlist') && data.title) {
    html += `
      <div class="sp-coll">
        <div class="sp-coll-icon"><i class="fa-solid fa-${data.type === 'album' ? 'compact-disc' : 'list-ul'}"></i></div>
        <div class="sp-coll-info">
          <div class="sp-coll-title">${spEsc(data.title)}</div>
          <div class="sp-coll-sub">${data.owner ? '👤 ' + spEsc(data.owner) + ' • ' : ''}Total ${spEsc(data.total || tracks.length)} track</div>
        </div>
      </div>
    `;
  }

  if (data.type === 'track' && tracks.length === 1) {
    const t = tracks[0];
    if (t.error || (!t.download && !t.download_proxy)) {
      html += `
        <div class="sp-single">
          ${t.cover ? `<img class="sp-single-cover" src="${spEsc(t.cover)}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="sp-track-info">
            <div class="sp-track-title">${spEsc(t.title)}</div>
            <div class="sp-track-artist">${spEsc(t.artist)}</div>
          </div>
        </div>
        <div class="sp-more" style="color:#fca5a5;"><i class="fa-solid fa-circle-xmark"></i> ${spEsc(t.error || 'Link download gak ketemu 🤔')}</div>
      `;
    } else {
      html += `
        <div class="sp-single">
          ${t.cover ? `<img class="sp-single-cover" src="${spEsc(t.cover)}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="sp-track-info">
            <div class="sp-track-title">${spEsc(t.title)}</div>
            <div class="sp-track-artist">${spEsc(t.artist)}${t.duration_formatted ? ' • ' + spEsc(t.duration_formatted) : ''}</div>
          </div>
        </div>
        <div class="sp-dl-btns">${spDlBtnsHtml(t)}</div>
      `;
    }
  } else if (tracks.length) {
    html += `<div class="sp-list">`;
    tracks.forEach((it, i) => {
      const n = it.no || (i + 1);
      html += `
        <div class="sp-track">
          <div class="sp-track-num">${n}</div>
          ${it.cover
            ? `<img class="sp-track-cover" src="${spEsc(it.cover)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
            : `<div class="sp-track-cover"></div>`}
          <div class="sp-track-info">
            <div class="sp-track-title">${spEsc(it.title)}</div>
            <div class="sp-track-artist">${spEsc(it.artist)}${it.error ? ' • ⚠️ ' + spEsc(it.error) : ''}</div>
          </div>
          <div class="sp-track-dur">${spEsc(it.duration_formatted || spFmtDur(it.duration))}</div>
          <button class="sp-track-dl" type="button" data-spdl="${n}" title="Download MP3">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
        <div class="sp-dl-box" data-spbox="${n}" hidden></div>
      `;
    });
    html += `</div>`;
    if ((data.total || 0) > tracks.length) {
      html += `<div class="sp-more"><i class="fa-solid fa-circle-info"></i> Menampilkan ${tracks.length} dari ${spEsc(data.total)} track (maksimal 10)</div>`;
    }
  } else {
    html += `<div class="sp-more">😶 Gak ada hasil bro</div>`;
  }

  spResult.innerHTML = html;
  spResult.classList.add('show');
}

spResult.addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('[data-spcopy]');
  if (copyBtn) {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.spcopy);
      const ico = copyBtn.querySelector('i');
      ico.className = 'fa-solid fa-check';
      setTimeout(() => { ico.className = 'fa-solid fa-copy'; }, 1500);
    } catch {}
    return;
  }

  const btn = e.target.closest('[data-spdl]');
  if (!btn) return;

  const n = parseInt(btn.dataset.spdl, 10);
  const box = spResult.querySelector(`[data-spbox="${n}"]`);
  const item = spItems[n - 1];
  if (!box || !item) return;

  if (!box.hidden) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }

  btn.disabled = true;
  box.hidden = false;
  box.innerHTML = `<span class="ring"></span> <span style="font-size:11px;color:#93c5fd;font-family:'Courier New',monospace;">Nyari videoId & siapin link MP3...</span>`;

  try {
    const data = await spFetchJson({ ...spLast, track: String(n) });
    const t = (data.tracks || []).find(x => (x.no || 0) === n) || (data.tracks || [])[0];
    if (!t || t.error || (!t.download && !t.download_proxy)) {
      throw new Error((t && t.error) || data.message || 'Link download gak ketemu 🤔');
    }
    box.innerHTML = `
      <div class="sp-dl-title"><i class="fa-solid fa-circle-check"></i> <b>${spEsc(t.title)}</b> — ${spEsc(t.artist)}</div>
      <div class="sp-dl-btns">${spDlBtnsHtml(t)}</div>
    `;
  } catch (err) {
    box.innerHTML = `<div style="font-size:11px;color:#fca5a5;font-family:'Courier New',monospace;line-height:1.6;"><i class="fa-solid fa-circle-xmark"></i> ${spEsc(err.message)}</div>`;
  } finally {
    btn.disabled = false;
  }
});

async function handleSpSearch() {
  const q = spQuery.value.trim();
  if (!q) {
    return spMsg('fail', '<i class="fa-solid fa-triangle-exclamation"></i> Masukkan judul lagu atau URL Spotify dulu!');
  }

  spResult.classList.remove('show');
  spResult.innerHTML = '';
  spItems = [];

  const isUrl = /^https?:\/\//i.test(q) || q.startsWith('spotify:');
  spLast = isUrl ? { url: q } : { q };

  spBusy(true);
  spMsg('pend', '<span class="ring"></span> Nyari lagunya...');

  try {
    const data = await spFetchJson({ ...spLast, limit: '10' });
    if (!data || data.status === false) {
      throw new Error((data && data.message) || 'Gagal ambil data');
    }
    renderSp(data);
    spMsg('ok', `<i class="fa-solid fa-circle-check"></i> <b>Ketemu!</b> Tipe: <b>${spEsc(String(data.type || 'search').toUpperCase())}</b> — klik tombol <b>⬇</b> di track buat ambil link MP3.`);
  } catch (e) {
    spMsg('fail', `<i class="fa-solid fa-circle-xmark"></i> ${spEsc(e.message)}`);
  } finally {
    spBusy(false);
  }
}

spBtn.addEventListener('click', handleSpSearch);
spQuery.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSpSearch();
});

const scQuery  = document.getElementById('scQuery');
const scBtn    = document.getElementById('scSearch');
const scResult = document.getElementById('scResult');

let scLast  = null;
let scItems = [];

function scEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function scMsg(type, msg) {
  const el = document.getElementById('msg-sc');
  el.className = 'msg-box show ' + type;
  el.innerHTML = msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function scFmtDur(sec) {
  const s = parseInt(sec, 10);
  if (Number.isNaN(s) || s <= 0) return '';
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function scDur(t) {
  const s = parseInt(t.duration, 10);
  if (Number.isNaN(s) || s <= 0) return '';
  return (t.duration_formatted && t.duration_formatted !== '?:??') ? t.duration_formatted : scFmtDur(s);
}
function scBusy(on) {
  scBtn.disabled = on;
  scBtn.innerHTML = on
    ? '<span class="ring"></span> Processing...'
    : '<i class="fa-solid fa-magnifying-glass"></i> Search';
}

async function scFetchJson(params) {
  const qs = new URLSearchParams(params).toString();
  const urls = [`${SC_API}?${qs}`];
  if (SC_WORKER) urls.push(`${SC_WORKER}/?target=${encodeURIComponent(`${SC_API}?${qs}`)}`);
  let lastErr = new Error('Gagal konek ke API SoundCloud 😭');
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'Accept': 'application/json' } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 404) {
        const err = new Error(json.message || `HTTP ${res.status}`);
        err.fatal = res.status === 400 || res.status === 401 || res.status === 403;
        throw err;
      }
      if (!res.ok) {
        lastErr = new Error(json.message || `HTTP ${res.status}`);
        continue;
      }
      return json;
    } catch (e) {
      lastErr = e;
      if (e.fatal) throw e;
    }
  }
  throw lastErr;
}

function scNorm(data) {
  if (!data) return {};
  if (Array.isArray(data.tracks)) return data;
  if (data.status && (data.title || data.download || data.download_proxy)) {
    return {
      ...data,
      type: data.type || 'track',
      tracks: [{
        no: 1, id: data.id || null, title: data.title || '?', artist: data.artist || '?',
        duration: data.duration || 0, duration_formatted: data.duration_formatted || '',
        cover: data.cover || '', url: data.url || '',
        download: data.download || '', download_proxy: data.download_proxy || '',
        cover_download: data.cover_download || '', cover_proxy: data.cover_proxy || '',
        error: data.error || ''
      }]
    };
  }
  return data;
}

function scStreamUrl(t) {
  if (t.download_proxy && t.download_proxy.includes('dl=')) return t.download_proxy;
  if (!t.download) return '';
  const label = (t.artist && t.artist !== '?' ? t.artist + ' - ' : '') + t.title;
  return `${SC_API}?dl=${encodeURIComponent(t.download)}&name=${encodeURIComponent(label)}`;
}

function scDlBtnsHtml(t) {
  const via  = scStreamUrl(t);
  const cVia = (t.cover_proxy && t.cover_proxy.includes('dl=')) ? t.cover_proxy
             : (t.cover_download ? `${SC_API}?dl=${encodeURIComponent(t.cover_download)}&name=${encodeURIComponent(t.artist + ' - ' + t.title + ' cover')}` : '');
  return `
    ${via ? `<a class="tt-dl-btn tt-dl-btn-primary" href="${scEsc(via)}" target="_blank" rel="noopener">
      <i class="fa-solid fa-download"></i> Download MP3
    </a>` : ''}
    ${t.download ? `<a class="tt-dl-btn tt-dl-btn-secondary" href="${scEsc(t.download)}" target="_blank" rel="noopener">
      <i class="fa-solid fa-link"></i> Direct Link
    </a>` : ''}
    ${via ? `<button class="tt-dl-btn tt-dl-btn-secondary" type="button" data-sccopy="${scEsc(via)}">
      <i class="fa-solid fa-copy"></i> Copy Link
    </button>` : ''}
    ${cVia ? `<a class="tt-dl-btn tt-dl-btn-secondary" href="${scEsc(cVia)}" target="_blank" rel="noopener">
      <i class="fa-solid fa-image"></i> Download Cover
    </a>` : ''}
  `;
}

function renderSc(data) {
  const tracks = (data.tracks || []).slice(0, 10);
  scItems = tracks;
  const type = String(data.type || 'search');

  let html = `<span class="sp-badge"><i class="fa-brands fa-soundcloud"></i> ${scEsc(type.toUpperCase())}</span>`;

  if ((type === 'playlist' || type === 'album') && (data.title || data.query)) {
    html += `
      <div class="sp-coll">
        <div class="sp-coll-icon"><i class="fa-solid fa-list-ul"></i></div>
        <div class="sp-coll-info">
          <div class="sp-coll-title">${scEsc(data.title || data.query)}</div>
          <div class="sp-coll-sub">Total ${scEsc(data.total || tracks.length)} track</div>
        </div>
      </div>
    `;
  }

  if (type === 'track' && tracks.length === 1) {
    const t = tracks[0];
    if (t.error || (!t.download && !t.download_proxy)) {
      html += `
        <div class="sp-single">
          ${t.cover ? `<img class="sp-single-cover" src="${scEsc(t.cover)}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="sp-track-info">
            <div class="sp-track-title">${scEsc(t.title)}</div>
            <div class="sp-track-artist">${scEsc(t.artist)}</div>
          </div>
        </div>
        <div class="sp-more" style="color:#fca5a5;"><i class="fa-solid fa-circle-xmark"></i> ${scEsc(t.error || 'Link download gak ketemu 🤔')}</div>
      `;
    } else {
      html += `
        <div class="sp-single">
          ${t.cover ? `<img class="sp-single-cover" src="${scEsc(t.cover)}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="sp-track-info">
            <div class="sp-track-title">${scEsc(t.title)}</div>
            <div class="sp-track-artist">${scEsc(t.artist)}${scDur(t) ? ' • ' + scEsc(scDur(t)) : ''}</div>
          </div>
        </div>
        <div class="sp-dl-btns">${scDlBtnsHtml(t)}</div>
      `;
    }
  } else if (tracks.length) {
    html += `<div class="sp-list">`;
    tracks.forEach((it, i) => {
      const n = it.no || (i + 1);
      html += `
        <div class="sp-track">
          <div class="sp-track-num">${n}</div>
          ${it.cover
            ? `<img class="sp-track-cover" src="${scEsc(it.cover)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
            : `<div class="sp-track-cover"></div>`}
          <div class="sp-track-info">
            <div class="sp-track-title">${scEsc(it.title)}</div>
            <div class="sp-track-artist">${scEsc(it.artist)}${it.error ? ' • ⚠️ ' + scEsc(it.error) : ''}</div>
          </div>
          <div class="sp-track-dur">${scEsc(scDur(it))}</div>
          <button class="sp-track-dl" type="button" data-scdl="${n}" title="Download MP3">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
        <div class="sp-dl-box" data-scbox="${n}" hidden></div>
      `;
    });
    html += `</div>`;
    if ((data.total || 0) > tracks.length) {
      html += `<div class="sp-more"><i class="fa-solid fa-circle-info"></i> Menampilkan ${tracks.length} dari ${scEsc(data.total)} track (maksimal 10)</div>`;
    }
  } else {
    html += `<div class="sp-more">😶 Gak ada hasil bro</div>`;
  }

  scResult.innerHTML = html;
  scResult.classList.add('show');
}

scResult.addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('[data-sccopy]');
  if (copyBtn) {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.sccopy);
      const ico = copyBtn.querySelector('i');
      ico.className = 'fa-solid fa-check';
      setTimeout(() => { ico.className = 'fa-solid fa-copy'; }, 1500);
    } catch {}
    return;
  }

  const btn = e.target.closest('[data-scdl]');
  if (!btn) return;

  const n = parseInt(btn.dataset.scdl, 10);
  const box = scResult.querySelector(`[data-scbox="${n}"]`);
  const item = scItems[n - 1];
  if (!box || !item) return;

  if (!box.hidden) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }

  btn.disabled = true;
  box.hidden = false;
  box.innerHTML = `<span class="ring"></span> <span style="font-size:11px;color:#93c5fd;font-family:'Courier New',monospace;">Nyiapin link MP3 dari SoundCloud...</span>`;

  try {
    const data = scNorm(await scFetchJson({ ...scLast, track: String(n) }));
    const t = (data.tracks || []).find(x => (x.no || 0) === n) || (data.tracks || [])[0];
    if (!t || t.error || (!t.download && !t.download_proxy)) {
      throw new Error((t && t.error) || data.message || 'Link download gak ketemu 🤔');
    }
    box.innerHTML = `
      <div class="sp-dl-title"><i class="fa-solid fa-circle-check"></i> <b>${scEsc(t.title)}</b> — ${scEsc(t.artist)}</div>
      <div class="sp-dl-btns">${scDlBtnsHtml(t)}</div>
    `;
  } catch (err) {
    box.innerHTML = `<div style="font-size:11px;color:#fca5a5;font-family:'Courier New',monospace;line-height:1.6;"><i class="fa-solid fa-circle-xmark"></i> ${scEsc(err.message)}</div>`;
  } finally {
    btn.disabled = false;
  }
});

async function handleScSearch() {
  const q = scQuery.value.trim();
  if (!q) {
    return scMsg('fail', '<i class="fa-solid fa-triangle-exclamation"></i> Masukkan judul lagu atau URL SoundCloud dulu!');
  }

  scResult.classList.remove('show');
  scResult.innerHTML = '';
  scItems = [];

  const isUrl = /^https?:\/\//i.test(q) || q.startsWith('soundcloud:');
  scLast = isUrl ? { url: q } : { q };

  scBusy(true);
  scMsg('pend', '<span class="ring"></span> Nyari lagunya...');

  try {
    const data = scNorm(await scFetchJson({ ...scLast, limit: '10' }));
    if (!data || data.status === false) {
      throw new Error((data && data.message) || 'Gagal ambil data');
    }
    renderSc(data);
    scMsg('ok', `<i class="fa-solid fa-circle-check"></i> <b>Ketemu!</b> Tipe: <b>${scEsc(String(data.type || 'search').toUpperCase())}</b> — klik tombol <b>⬇</b> di track buat ambil link MP3.`);
  } catch (e) {
    scMsg('fail', `<i class="fa-solid fa-circle-xmark"></i> ${scEsc(e.message)}`);
  } finally {
    scBusy(false);
  }
}

scBtn.addEventListener('click', handleScSearch);
scQuery.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleScSearch();
});

const TM_LS_EMAIL  = 'xync_tm_email';
const TM_LS_PASS   = 'xync_tm_pass';
const TM_LS_TOKEN  = 'xync_tm_token';
const TM_LS_DOMAIN = 'xync_tm_domain';
const TM_LS_AUTO   = 'xync_tm_auto';

let tmAvailableDomains = [];
let tmCurrentEmail = null;
let tmCurrentPass  = null;
let tmCurrentToken = null;
let tmPollTimer    = null;
let tmSeenIds      = new Set();
let tmSelectedDomain = null;
let tmAutoRefreshOn = false;

const tmEmailShow = document.getElementById('tmEmailShow');
const tmEmailTxt  = document.getElementById('tmEmailTxt');
const tmCopyBtn   = document.getElementById('tmCopyBtn');
const tmInbox     = document.getElementById('tmInbox');
const tmRefresh   = document.getElementById('tmRefreshBtn');
const tmUseAM     = document.getElementById('tmUseAM');
const tmResetBtn  = document.getElementById('tmResetBtn');
const tmAutoRefresh = document.getElementById('tmAutoRefresh');
const tmAutoWrap  = document.getElementById('tmAutoWrap');
const tmDomainGrid = document.getElementById('tmDomains');

function tmMsg(type, msg) {
  const el = document.getElementById('msg-tm');
  el.className = 'msg-box show ' + type;
  el.innerHTML = msg;
}
function tmClearMsg() {
  const el = document.getElementById('msg-tm');
  el.className = 'msg-box';
  el.innerHTML = '';
}

function tmProxy(target, extraHeaders) {
  const h = extraHeaders || {};
  const hb64 = btoa(unescape(encodeURIComponent(JSON.stringify(h))));
  return `${TM_WORKER}/?target=${encodeURIComponent(target)}&hdrs=${encodeURIComponent(hb64)}`;
}

async function tmFetchDomains() {
  const res = await fetch(tmProxy(`${TM_API}/domains`));
  if (!res.ok) throw new Error('Gagal ambil domain');
  const data = await res.json();
  return (data['hydra:member'] || []).map(d => d.domain);
}

async function tmCreateAccount(address, password) {
  const res = await fetch(tmProxy(`${TM_API}/accounts`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err['hydra:description'] || err.detail || 'Gagal buat akun');
  }
  return res.json();
}

async function tmLogin(address, password) {
  const res = await fetch(tmProxy(`${TM_API}/token`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });
  if (!res.ok) throw new Error('Gagal login');
  const data = await res.json();
  return data.token;
}

async function tmGetMessages() {
  if (!tmCurrentToken) return [];
  const res = await fetch(tmProxy(`${TM_API}/messages`, {
    'Authorization': `Bearer ${tmCurrentToken}`
  }));
  if (!res.ok) return [];
  const data = await res.json();
  return data['hydra:member'] || [];
}

async function tmReadMessage(id) {
  if (!tmCurrentToken) return null;
  const res = await fetch(tmProxy(`${TM_API}/messages/${id}`, {
    'Authorization': `Bearer ${tmCurrentToken}`
  }));
  if (!res.ok) return null;
  return res.json();
}

function tmRandomName() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function tmRandomPass() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 14; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "@1A";
}

function tmSaveState() {
  try {
    if (tmCurrentEmail) {
      localStorage.setItem(TM_LS_EMAIL, tmCurrentEmail);
      if (tmCurrentPass) localStorage.setItem(TM_LS_PASS, tmCurrentPass);
      if (tmCurrentToken) localStorage.setItem(TM_LS_TOKEN, tmCurrentToken);
      if (tmSelectedDomain) localStorage.setItem(TM_LS_DOMAIN, tmSelectedDomain);
    }
    localStorage.setItem(TM_LS_AUTO, tmAutoRefreshOn ? '1' : '0');
  } catch {}
}

function tmClearState() {
  try {
    [TM_LS_EMAIL, TM_LS_PASS, TM_LS_TOKEN, TM_LS_DOMAIN, TM_LS_AUTO].forEach(k => localStorage.removeItem(k));
  } catch {}
}

function tmSetEmail(email, password, token) {
  tmCurrentEmail = email;
  tmCurrentPass  = password || tmCurrentPass;
  tmCurrentToken = token || tmCurrentToken;
  tmSeenIds.clear();

  tmEmailTxt.textContent = email;
  tmEmailShow.classList.remove('empty');
  tmCopyBtn.disabled = false;
  tmUseAM.disabled = false;
  tmSaveState();
  startTmPoll();
}

async function tmLoadState() {
  try {
    const savedEmail = localStorage.getItem(TM_LS_EMAIL);
    const savedPass  = localStorage.getItem(TM_LS_PASS);
    const savedToken = localStorage.getItem(TM_LS_TOKEN);
    const savedAuto  = localStorage.getItem(TM_LS_AUTO);

    if (savedAuto === '1') {
      tmAutoRefreshOn = true;
      tmAutoRefresh.checked = true;
      tmAutoWrap.classList.add('active');
    }
    if (savedEmail && savedToken) {
      tmSetEmail(savedEmail, savedPass, savedToken);
      tmMsg('ok',
        `<i class="fa-solid fa-circle-check"></i> <b>Session dipulihkan</b><br><code>${savedEmail}</code>`);
    }
  } catch {}
}

function tmRenderMessages(msgs) {
  if (!msgs || !msgs.length) {
    if (!tmInbox.querySelector('.tm-empty') && !tmInbox.querySelector('.tm-msg')) {
      tmInbox.innerHTML = `
        <div class="tm-empty">
          <i class="fa-solid fa-envelope"></i>
          Belum ada pesan masuk.<br>
          Tunggu sebentar, inbox akan muncul otomatis.
        </div>
      `;
    }
    return;
  }
  const emptyEl = tmInbox.querySelector('.tm-empty');
  if (emptyEl) emptyEl.remove();

  msgs.forEach(m => {
    if (!m || !m.id) return;
    if (tmSeenIds.has(m.id)) return;
    tmSeenIds.add(m.id);
    tmInbox.insertBefore(buildTmMessage(m), tmInbox.firstChild);
  });
}

function buildTmMessage(m) {
  const div = document.createElement('div');
  div.className = 'tm-msg';

  const fromTxt = (m.from && (m.from.name || m.from.address)) || 'unknown';
  const subjectTxt = m.subject || '(Tanpa Subject)';
  const dateTxt = m.createdAt || '';

  div.innerHTML = `
    <div class="tm-msg-head">
      <span class="tm-msg-dot"></span>
      <span class="tm-msg-from">${fromTxt}</span>
    </div>
    <div class="tm-msg-subject">${subjectTxt}</div>
    <div class="tm-msg-date">${dateTxt}</div>
    <div class="tm-msg-body"><span style="color:#64748b;">Klik untuk memuat isi pesan…</span></div>
  `;

  div.addEventListener('click', async (e) => {
    if (e.target.closest('.tm-link-btn')) return;

    if (!div.dataset.loaded) {
      div.dataset.loaded = '1';
      const bodyEl = div.querySelector('.tm-msg-body');
      bodyEl.innerHTML = '<span style="color:#64748b;">Memuat isi pesan…</span>';
      try {
        const full = await tmReadMessage(m.id);
        const htmlArr = full && full.html;
        const bodyRaw = (Array.isArray(htmlArr) && htmlArr[0]) || (full && full.text) || '';
        const bodyClean = bodyRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        const urlRegex = /https?:\/\/[^\s"'<>()]+/gi;
        const urls = bodyRaw.match(urlRegex) || [];
        const uniqUrls = [...new Set(urls)].slice(0, 5);

        let linksHtml = '';
        uniqUrls.forEach(u => {
          linksHtml += `<button class="tm-link-btn" data-url="${u.replace(/"/g,'&quot;')}"><i class="fa-solid fa-bolt"></i> Pakai Link Ini</button>`;
        });

        bodyEl.innerHTML = `
          ${bodyClean.slice(0, 1500) || '[no body]'}
          ${uniqUrls.length ? `<div style="margin-top:8px;">${uniqUrls.map(u => `<div style="font-size:10px;color:#64748b;margin-bottom:6px;word-break:break-all;">${u}</div>`).join('')}</div>` : ''}
          <div>${linksHtml}</div>
        `;

        bodyEl.querySelectorAll('.tm-link-btn').forEach(btn => {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const link = btn.dataset.url;
            if (!link) return;
            document.querySelector('.nav-btn[data-tab="am"]')?.click();
            setTimeout(() => {
              const inp = document.getElementById('linkInput');
              const eChk = document.getElementById('emailCheck');
              if (eChk && tmCurrentEmail) eChk.value = tmCurrentEmail;
              if (inp) {
                inp.value = link;
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
                inp.focus();
              }
            }, 300);
          });
        });
      } catch (err) {
        bodyEl.innerHTML = `<span style="color:#fca5a5;">Gagal memuat pesan: ${err.message}</span>`;
      }
    }

    div.classList.toggle('open');
  });

  return div;
}

function stopTmPoll() {
  if (tmPollTimer) { clearInterval(tmPollTimer); tmPollTimer = null; }
}
function startTmPoll() {
  stopTmPoll();
  if (!tmCurrentEmail || !tmAutoRefreshOn) return;
  tmPollTimer = setInterval(async () => {
    try {
      const msgs = await tmGetMessages();
      tmRenderMessages(msgs);
    } catch {}
  }, 60000);
}

document.querySelectorAll('.tm-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tm-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tm-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tm-panel-' + tab.dataset.tmtab)?.classList.add('active');
  });
});

async function tmInitDomains() {
  try {
    tmAvailableDomains = await tmFetchDomains();
    if (!tmAvailableDomains.length) tmAvailableDomains = ['mail.tm'];
    tmSelectedDomain = tmAvailableDomains[0];

    tmDomainGrid.innerHTML = '';
    tmAvailableDomains.forEach((d, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tm-domain-item' + (i === 0 ? ' selected' : '');
      b.textContent = d;
      b.addEventListener('click', () => {
        document.querySelectorAll('.tm-domain-item').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        tmSelectedDomain = d;
        tmSaveState();
      });
      tmDomainGrid.appendChild(b);
    });
  } catch (err) {
    tmDomainGrid.innerHTML = '<div style="color:#fca5a5;font-size:11px;padding:8px;">Gagal memuat domain</div>';
  }
}

document.getElementById('tmGenRandom').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="ring"></span> Generating...';
  tmClearMsg();

  try {
    if (!tmAvailableDomains.length) await tmInitDomains();
    const name = tmRandomName();
    const domain = tmAvailableDomains[Math.floor(Math.random() * tmAvailableDomains.length)];
    const address = `${name}@${domain}`;
    const pass = tmRandomPass();

    await tmCreateAccount(address, pass);
    const token = await tmLogin(address, pass);

    tmSetEmail(address, pass, token);
    tmMsg('ok',
      `<i class="fa-solid fa-circle-check"></i> <b>Email random dibuat!</b><br>
       📧 <code>${address}</code>`);
  } catch (err) {
    tmMsg('fail',
      `<i class="fa-solid fa-circle-xmark"></i> Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
});

document.getElementById('tmGenCustom').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const orig = btn.innerHTML;
  const name = document.getElementById('tmName').value.trim().toLowerCase();
  tmClearMsg();

  if (!name || !/^[a-z0-9._-]{3,}$/.test(name)) {
    tmMsg('fail',
      '<i class="fa-solid fa-triangle-exclamation"></i> Nama minimal 3 karakter, cuma boleh huruf/angka/titik/underscore/minus!');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="ring"></span> Membuat...';

  try {
    const address = `${name}@${tmSelectedDomain}`;
    const pass = tmRandomPass();

    await tmCreateAccount(address, pass);
    const token = await tmLogin(address, pass);

    tmSetEmail(address, pass, token);

    document.getElementById('tmName').value = '';
    if (tmAvailableDomains.length) {
      tmSelectedDomain = tmAvailableDomains[0];
      document.querySelectorAll('.tm-domain-item').forEach((x, i) => {
        x.classList.toggle('selected', i === 0);
      });
    }
    tmSaveState();

    tmMsg('ok',
      `<i class="fa-solid fa-circle-check"></i> <b>Email custom siap!</b><br>
       📧 <code>${address}</code>`);
  } catch (err) {
    tmMsg('fail',
      `<i class="fa-solid fa-circle-xmark"></i> Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
});

tmRefresh.addEventListener('click', async () => {
  if (!tmCurrentEmail) {
    tmMsg('fail',
      '<i class="fa-solid fa-triangle-exclamation"></i> Generate email dulu!');
    return;
  }
  tmRefresh.disabled = true;
  tmRefresh.classList.add('spinning');
  try {
    const msgs = await tmGetMessages();
    tmRenderMessages(msgs);
  } catch {}
  setTimeout(() => {
    tmRefresh.disabled = false;
    tmRefresh.classList.remove('spinning');
  }, 600);
});

tmAutoRefresh.addEventListener('change', () => {
  tmAutoRefreshOn = tmAutoRefresh.checked;
  tmAutoWrap.classList.toggle('active', tmAutoRefreshOn);
  tmSaveState();

  if (tmAutoRefreshOn) {
    if (!tmCurrentEmail) {
      tmMsg('fail',
        '<i class="fa-solid fa-triangle-exclamation"></i> Generate email dulu baru nyalain Auto Refresh!');
      tmAutoRefresh.checked = false;
      tmAutoRefreshOn = false;
      tmAutoWrap.classList.remove('active');
      tmSaveState();
      return;
    }
    tmMsg('ok',
      '<i class="fa-solid fa-circle-check"></i> <b>Auto Refresh ON</b><br>Inbox akan refresh tiap 1 menit.');
    startTmPoll();
  } else {
    tmMsg('ok',
      '<i class="fa-solid fa-circle-check"></i> <b>Auto Refresh OFF</b><br>Klik Refresh manual kalau perlu.');
    stopTmPoll();
  }
});

tmCopyBtn.addEventListener('click', async () => {
  if (!tmCurrentEmail) return;
  try {
    await navigator.clipboard.writeText(tmCurrentEmail);
    const ico = tmCopyBtn.querySelector('i');
    ico.className = 'fa-solid fa-check';
    tmCopyBtn.classList.add('copied');
    setTimeout(() => {
      ico.className = 'fa-solid fa-copy';
      tmCopyBtn.classList.remove('copied');
    }, 1500);
  } catch {}
});

tmUseAM.addEventListener('click', () => {
  if (!tmCurrentEmail) return;
  document.querySelector('.nav-btn[data-tab="am"]')?.click();
  setTimeout(() => {
    const inp = document.getElementById('emailAddr');
    if (inp) {
      inp.value = tmCurrentEmail;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inp.focus();
    }
  }, 300);
});

tmResetBtn.addEventListener('click', () => {
  if (!confirm('Reset session Temp Mail? Email akan hilang dari device ini.')) return;
  stopTmPoll();
  tmCurrentEmail = null;
  tmCurrentPass  = null;
  tmCurrentToken = null;
  tmSeenIds.clear();
  tmClearState();
  tmEmailTxt.textContent = 'Belum ada email';
  tmEmailShow.classList.add('empty');
  tmCopyBtn.disabled = true;
  tmUseAM.disabled = true;
  tmAutoRefresh.checked = false;
  tmAutoRefreshOn = false;
  tmAutoWrap.classList.remove('active');
  tmInbox.innerHTML = `
    <div class="tm-empty">
      <i class="fa-solid fa-envelope"></i>
      Belum ada pesan masuk.<br>
      Generate email dulu, lalu pesan akan muncul otomatis.
    </div>
  `;
  tmClearMsg();
  tmMsg('ok', '<i class="fa-solid fa-circle-check"></i> Session direset.');
});

tmInitDomains();
tmLoadState();
