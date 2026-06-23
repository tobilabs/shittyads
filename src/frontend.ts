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

    main {
      max-width: 760px;
      margin: 0 auto;
      padding: 2rem 1rem 4rem;
    }

    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: .25rem; }
    .subtitle { color: #666; font-size: .875rem; margin-bottom: 2rem; }

    #drop-zone {
      border: 2px dashed #444;
      border-radius: 12px;
      padding: 2.5rem;
      text-align: center;
      cursor: pointer;
      transition: border-color .15s, background .15s;
      margin-bottom: 1.5rem;
      user-select: none;
    }
    #drop-zone:hover, #drop-zone.drag-over {
      border-color: #f97316;
      background: rgba(249,115,22,.07);
    }
    #drop-zone p { color: #ccc; font-size: 1.05rem; font-weight: 500; }
    #drop-zone small { color: #555; font-size: .8rem; margin-top: .3rem; display: block; }
    #drop-zone.uploading p { color: #f97316; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

    /* Paste toast */
    #paste-toast {
      display: none;
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #f97316;
      color: #000;
      font-size: .85rem;
      font-weight: 600;
      padding: .5rem 1.25rem;
      border-radius: 999px;
      z-index: 200;
      pointer-events: none;
    }

    .secret-row {
      text-align: right;
      margin-bottom: 2rem;
    }
    .secret-toggle {
      background: none;
      border: none;
      color: #555;
      font-size: .75rem;
      cursor: pointer;
      transition: color .15s;
    }
    .secret-toggle:hover { color: #aaa; }
    .secret-input-wrap { margin-top: .5rem; display: flex; justify-content: flex-end; gap: .5rem; }
    .secret-input-wrap input {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 6px;
      color: #fff;
      font-size: .85rem;
      padding: .4rem .75rem;
      width: 280px;
      outline: none;
      transition: border-color .15s;
    }
    .secret-input-wrap input:focus { border-color: #f97316; }

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
  </style>
</head>
<body>
<main>
  <h1>💩 ShittyAds</h1>
  <p class="subtitle">Eine Sammlung von Scam- und Trash-Werbung aus dem Internet</p>

  <div id="drop-zone" style="display:none">
    <p>Screenshot hier hinziehen, klicken oder einfügen (Strg+V)</p>
    <small>JPG · PNG · GIF · WEBP · max. 20 MB · mehrere Dateien möglich</small>
    <input type="file" id="file-input" accept="image/*" multiple hidden>
  </div>

  <div class="secret-row">
    <button class="secret-toggle" id="secret-toggle">⚙ Upload-Secret ▼</button>
    <div class="secret-input-wrap" id="secret-wrap" style="display:none">
      <input type="password" id="secret-input" placeholder="Upload-Secret eingeben…">
    </div>
  </div>

  <div id="gallery"></div>
  <div id="sentinel"></div>
  <div id="status"></div>
</main>

<div id="paste-toast">Bild eingefügt, lädt hoch…</div>

<div id="lightbox">
  <button id="lightbox-close">✕</button>
  <img id="lightbox-img" src="" alt="Vollbild">
</div>

<script>
const SCROLL_KEY = 'shittyads_scroll';
const SECRET_KEY = 'shittyads_secret';

let nextCursor = null;
let loading = false;
let hasMore = true;
let scrollRestored = false;

// --- Secret ---
const secretInput = document.getElementById('secret-input');
const secretWrap = document.getElementById('secret-wrap');
const secretToggle = document.getElementById('secret-toggle');
const dropZone = document.getElementById('drop-zone');

function applySecret(val) {
  if (val) {
    localStorage.setItem(SECRET_KEY, val);
    dropZone.style.display = '';
  } else {
    localStorage.removeItem(SECRET_KEY);
    dropZone.style.display = 'none';
  }
}

secretInput.value = localStorage.getItem(SECRET_KEY) || '';
applySecret(secretInput.value);
secretInput.addEventListener('input', () => applySecret(secretInput.value));
secretToggle.addEventListener('click', () => {
  const open = secretWrap.style.display === 'none';
  secretWrap.style.display = open ? 'flex' : 'none';
  secretToggle.textContent = '⚙ Upload-Secret ' + (open ? '▲' : '▼');
});

// --- Upload ---
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => { if (fileInput.files.length) upload(fileInput.files); fileInput.value = ''; });

// Paste support (Ctrl+V anywhere on the page)
document.addEventListener('paste', e => {
  if (!localStorage.getItem(SECRET_KEY)) return;
  const files = Array.from(e.clipboardData.items)
    .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
    .map(item => item.getAsFile())
    .filter(Boolean);
  if (files.length) {
    showPasteToast();
    upload(files);
  }
});

function showPasteToast() {
  const toast = document.getElementById('paste-toast');
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

async function upload(files) {
  const label = dropZone.querySelector('p');
  dropZone.classList.add('uploading');
  label.textContent = 'Lädt hoch…';
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const headers = {};
  const secret = localStorage.getItem(SECRET_KEY);
  if (secret) headers['x-upload-secret'] = secret;
  try {
    const res = await fetch('/upload', { method: 'POST', headers, body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      alert('Upload fehlgeschlagen: ' + err.error);
      return;
    }
    document.getElementById('gallery').innerHTML = '';
    nextCursor = null;
    hasMore = true;
    scrollRestored = true;
    await loadMore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } finally {
    dropZone.classList.remove('uploading');
    label.textContent = 'Screenshot hier hinziehen, klicken oder einfügen (Strg+V)';
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
    const article = document.createElement('article');
    article.className = 'ad-item';
    const img = document.createElement('img');
    img.src = '/img/' + item.key;
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
    const data = await res.json();
    appendAds(data.items);
    nextCursor = data.nextCursor || null;
    hasMore = !!nextCursor;

    if (!scrollRestored) {
      scrollRestored = true;
      const saved = localStorage.getItem(SCROLL_KEY);
      if (saved) requestAnimationFrame(() => window.scrollTo({ top: +saved, behavior: 'instant' }));
    }

    if (!hasMore) {
      const totalInGallery = document.getElementById('gallery').children.length;
      setStatus(totalInGallery > 0 ? 'Das war alles. Mehr Schrott bitte hochladen. 🗑️' : '', false);
    } else {
      setStatus('', false);
    }
  } finally {
    loading = false;
  }
}

function setStatus(msg, animate) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.style.animation = animate ? 'pulse 1s infinite' : 'none';
}

// Scroll save
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      localStorage.setItem(SCROLL_KEY, String(window.scrollY));
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// Infinite scroll
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadMore();
}, { rootMargin: '400px' });
observer.observe(document.getElementById('sentinel'));

// Initial load
loadMore();

// --- Lightbox ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
</script>
</body>
</html>`;
}
