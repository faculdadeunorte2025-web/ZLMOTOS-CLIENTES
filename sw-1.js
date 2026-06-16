// ZL Motos — Mecânico · Service Worker
const CACHE = 'zl-mecanico-v1';

// Arquivos para cache offline
const PRECACHE = [
  './',
  './mecanico.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap'
];

// Instala e faz cache dos arquivos principais
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE).catch(() => {}))
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Fetch: rede primeiro, cache como fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Firebase e APIs externas — sempre rede, sem cache
  const url = e.request.url;
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Salva no cache se resposta válida
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Notificações push (futuro)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'ZL Motos', {
    body: data.body || '',
    icon: data.icon || '',
    badge: data.badge || ''
  });
});
