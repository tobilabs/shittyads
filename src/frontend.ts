export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>💩 ShittyAds</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0f0f0f;
      color: #f0f0f0;
      font-family: Arial, Helvetica, sans-serif;
      min-height: 100vh;
    }
    body.drag-over::after {
      content: '';
      position: fixed;
      inset: 0;
      border: 3px solid #f97316;
      border-radius: 4px;
      pointer-events: none;
      z-index: 50;
    }

    /* Header */
    header {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(15,15,15,.9);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid #1f1f1f;
    }
    .header-inner {
      max-width: 760px;
      margin: 0 auto;
      padding: .75rem 1rem;
      display: flex;
      align-items: center;
      gap: .75rem;
    }
    .header-inner h1 { font-size: 1.1rem; font-weight: 700; flex: 1; }
    .header-inner .subtitle { color: #555; font-size: .8rem; }

    #upload-btn {
      background: #1f1f1f;
      border: 1px solid #333;
      color: #ccc;
      font-size: .8rem;
      padding: .4rem .9rem;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color .15s, color .15s;
      display: none;
    }
    #upload-btn:hover { border-color: #f97316; color: #f97316; }
    #upload-btn.uploading { color: #f97316; animation: pulse 1s infinite; }

    #secret-toggle {
      background: none;
      border: none;
      color: #444;
      font-size: .8rem;
      cursor: pointer;
      padding: .4rem .5rem;
      transition: color .15s;
      white-space: nowrap;
    }
    #secret-toggle:hover { color: #aaa; }

    /* Secret dropdown */
    #secret-wrap {
      display: none;
      position: absolute;
      top: calc(100% + .5rem);
      right: 1rem;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: .75rem;
      z-index: 100;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
    }
    #secret-wrap.open { display: block; }
    #secret-wrap input {
      background: #0f0f0f;
      border: 1px solid #333;
      border-radius: 6px;
      color: #fff;
      font-size: .85rem;
      padding: .4rem .75rem;
      width: 240px;
      outline: none;
      transition: border-color .15s;
    }
    #secret-wrap input:focus { border-color: #f97316; }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

    /* Caught-up divider */
    .caught-up {
      display: flex;
      align-items: center;
      gap: .75rem;
      color: #444;
      font-size: .75rem;
      user-select: none;
    }
    .caught-up::before, .caught-up::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #2a2a2a;
    }

    /* Gallery */
    main {
      max-width: 760px;
      margin: 0 auto;
      padding: 2rem 1rem 4rem;
    }

    #gallery { display: flex; flex-direction: column; gap: 2rem; }

    .ad-item img {
      width: 100%;
      border-radius: 8px;
      display: block;
      background: #1a1a1a;
      cursor: zoom-in;
      max-height: 85vh;
      object-fit: contain;
    }
    .ad-meta {
      display: flex;
      justify-content: space-between;
      font-size: .75rem;
      color: #555;
      margin-top: .4rem;
      padding: 0 .2rem;
    }
    .ad-meta span:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 60%;
    }

    #sentinel { height: 1rem; }
    #status { text-align: center; color: #444; font-size: .875rem; padding: 2rem 0; }

    /* Toasts */
    .toast {
      display: none;
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      color: #000;
      font-size: .85rem;
      font-weight: 600;
      padding: .5rem 1.25rem;
      border-radius: 999px;
      z-index: 300;
      pointer-events: none;
      white-space: nowrap;
    }
    #paste-toast { background: #f97316; }
    #drop-hint { background: #f97316; }

    /* Lightbox */
    #lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.92);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    #lightbox.open { display: flex; }
    #lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
    #lightbox-close {
      position: absolute;
      top: 1rem; right: 1.25rem;
      background: none; border: none;
      color: #fff; font-size: 2rem;
      cursor: pointer; line-height: 1;
    }
    #lightbox-close:hover { color: #aaa; }

    /* Onboarding overlay */
    #onboarding {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.85);
      z-index: 200;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    #onboarding.open { display: flex; }
    #onboarding-box {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      padding: 2rem;
    }
    #onboarding-box h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: .75rem; }
    #onboarding-box p { color: #aaa; font-size: .9rem; line-height: 1.6; margin-bottom: .75rem; }
    #onboarding-box p:last-of-type { margin-bottom: 1.5rem; }
    #onboarding-close {
      display: block;
      width: 100%;
      background: #f97316;
      color: #000;
      font-weight: 700;
      font-size: .95rem;
      border: none;
      border-radius: 8px;
      padding: .7rem 1rem;
      cursor: pointer;
      transition: background .15s;
    }
    #onboarding-close:hover { background: #ea6a00; }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <h1>💩 ShittyAds</h1>
    <span class="subtitle">Drag &amp; Drop oder Strg+V</span>
    <button id="upload-btn">Hochladen</button>
    <button id="secret-toggle">⚙</button>
    <div id="secret-wrap">
      <input type="password" id="secret-input" placeholder="Upload-Secret…">
    </div>
  </div>
</header>

<main>
  <input type="file" id="file-input" accept="image/*" multiple hidden>
  <div id="gallery"></div>
  <div id="sentinel"></div>
  <div id="status"></div>
</main>

<div id="paste-toast" class="toast">Bild eingefügt, lädt hoch…</div>
<div id="drop-hint" class="toast">Loslassen zum Hochladen</div>

<div id="onboarding">
  <div id="onboarding-box">
    <h2>💩 Willkommen bei ShittyAds</h2>
    <p>Diese Seite sammelt Screenshots von schlechter, irreführender oder scammy Internet-Werbung — zur Dokumentation und zum Schmunzeln. Es werden hier keinerlei echte Werbeanzeigen ausgespielt.</p>
    <p>Dein <strong>Adblocker erkennt die Bilder fälschlicherweise als Werbung</strong> und blockiert sie. Bitte deaktiviere ihn für diese Seite, damit die Screenshots sichtbar sind.</p>
    <button id="onboarding-close">Verstanden — Adblocker deaktivieren &amp; neu laden</button>
  </div>
</div>

<div id="lightbox">
  <button id="lightbox-close">✕</button>
  <img id="lightbox-img" src="" alt="Vollbild">
</div>

<script>
const SECRET_KEY = 'shittyads_secret';
const ONBOARDING_KEY = 'shittyads_welcomed';
const LAST_SEEN_KEY = 'shittyads_last_seen';

// Read once at page start — stays fixed for this session
const sessionLastSeen = localStorage.getItem(LAST_SEEN_KEY);
let dividerInserted = false;
let lastSeenUpdated = false;

// --- Onboarding (once) ---
if (!localStorage.getItem(ONBOARDING_KEY)) {
  document.getElementById('onboarding').classList.add('open');
  document.getElementById('onboarding-close').addEventListener('click', () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    location.reload();
  });
}

let nextCursor = null;
let loading = false;
let hasMore = true;

// --- Secret ---
const secretInput = document.getElementById('secret-input');
const secretWrap = document.getElementById('secret-wrap');
const secretToggle = document.getElementById('secret-toggle');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

function applySecret(val) {
  if (val) {
    localStorage.setItem(SECRET_KEY, val);
    uploadBtn.style.display = 'block';
  } else {
    localStorage.removeItem(SECRET_KEY);
    uploadBtn.style.display = 'none';
  }
}

secretInput.value = localStorage.getItem(SECRET_KEY) || '';
applySecret(secretInput.value);
secretInput.addEventListener('input', () => applySecret(secretInput.value));

secretToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  secretWrap.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!secretWrap.contains(e.target) && e.target !== secretToggle) {
    secretWrap.classList.remove('open');
  }
});

// --- Upload ---
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { if (fileInput.files.length) upload(fileInput.files); fileInput.value = ''; });

// Whole-page drag & drop
let dragCounter = 0;
document.addEventListener('dragenter', e => {
  if (!localStorage.getItem(SECRET_KEY)) return;
  if (!e.dataTransfer.types.includes('Files')) return;
  dragCounter++;
  document.body.classList.add('drag-over');
  showToast('drop-hint');
});
document.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter <= 0) { dragCounter = 0; document.body.classList.remove('drag-over'); hideToast('drop-hint'); }
});
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  dragCounter = 0;
  document.body.classList.remove('drag-over');
  hideToast('drop-hint');
  if (!localStorage.getItem(SECRET_KEY)) return;
  if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
});

// Paste
document.addEventListener('paste', e => {
  if (!localStorage.getItem(SECRET_KEY)) return;
  const files = Array.from(e.clipboardData.items)
    .filter(i => i.kind === 'file' && i.type.startsWith('image/'))
    .map(i => i.getAsFile()).filter(Boolean);
  if (files.length) { showToast('paste-toast'); upload(files); }
});

function showToast(id) {
  const el = document.getElementById(id);
  el.style.display = 'block';
}
function hideToast(id) {
  document.getElementById(id).style.display = 'none';
}

async function upload(files) {
  uploadBtn.classList.add('uploading');
  uploadBtn.textContent = 'Lädt hoch…';
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const headers = {};
  const secret = localStorage.getItem(SECRET_KEY);
  if (secret) headers['x-upload-secret'] = secret;
  try {
    const res = await fetch('/upload', { method: 'POST', headers, body: fd });
    hideToast('paste-toast');
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      alert('Upload fehlgeschlagen: ' + err.error);
      return;
    }
    document.getElementById('gallery').innerHTML = '';
    nextCursor = null;
    hasMore = true;
    await loadMore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    uploadBtn.classList.remove('uploading');
    uploadBtn.textContent = 'Hochladen';
  }
}

// --- Gallery ---
function formatDate(iso) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function appendAds(items) {
  const gallery = document.getElementById('gallery');
  for (const item of items) {
    // Insert "caught up" divider before the first already-seen item
    if (sessionLastSeen && !dividerInserted && item.key >= sessionLastSeen) {
      dividerInserted = true;
      const div = document.createElement('div');
      div.className = 'caught-up';
      div.textContent = 'Bereits gesehen';
      gallery.appendChild(div);
    }
    const article = document.createElement('article');
    article.className = 'ad-item';
    const img = document.createElement('img');
    img.src = '/r/' + item.key;
    img.alt = item.name;
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(img.src));
    const meta = document.createElement('div');
    meta.className = 'ad-meta';
    meta.innerHTML = '<span>' + escHtml(item.name) + '</span><span>' + formatDate(item.uploaded) + '</span>';
    article.appendChild(img);
    article.appendChild(meta);
    gallery.appendChild(article);
  }
}

function updateLastSeen(items) {
  if (lastSeenUpdated || !items.length) return;
  lastSeenUpdated = true;
  const newest = items[0].key; // smallest key = newest (inverted timestamp)
  const stored = localStorage.getItem(LAST_SEEN_KEY);
  if (!stored || newest < stored) {
    localStorage.setItem(LAST_SEEN_KEY, newest);
  }
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadMore() {
  if (loading || !hasMore) return;
  loading = true;
  setStatus('Lädt…', true);
  try {
    const url = nextCursor ? '/api/ads?cursor=' + encodeURIComponent(nextCursor) : '/api/ads';
    const res = await fetch(url);
    if (!res.ok) { setStatus('Fehler beim Laden (' + res.status + ')', false); return; }
    const data = await res.json();
    if (!Array.isArray(data.items)) { setStatus('Unerwartete Antwort vom Server', false); return; }
    appendAds(data.items);
    updateLastSeen(data.items);
    nextCursor = data.nextCursor || null;
    hasMore = !!nextCursor;

    if (!hasMore) {
      const total = document.getElementById('gallery').children.length;
      setStatus(total > 0 ? 'Das war alles. Mehr Schrott bitte hochladen. 🗑️' : '', false);
    } else {
      setStatus('', false);
    }
  } catch (err) {
    setStatus('Fehler: ' + err.message, false);
  } finally {
    loading = false;
  }
}

function setStatus(msg, animate) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.style.animation = animate ? 'pulse 1s infinite' : 'none';
}

// Infinite scroll
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadMore();
}, { rootMargin: '400px' });
observer.observe(document.getElementById('sentinel'));

loadMore();

// --- Lightbox ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
function openLightbox(src) { lightboxImg.src = src; lightbox.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeLightbox() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
</script>
</body>
</html>`;
}
