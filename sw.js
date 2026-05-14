const CACHE = 'panier-v4';
const ASSETS = ['/Panier---IPC/', '/Panier---IPC/index.html', '/Panier---IPC/manifest.json', '/Panier---IPC/prix_db.json', '/Panier---IPC/icon-192.png', '/Panier---IPC/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
  );
  self.clients.claim();
});

const BYPASS_HOSTS = ['anthropic.com', 'supabase.co', 'docs.google.com', 'sheets.googleapis.com', 'jsdelivr.net', 'unpkg.com'];

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (BYPASS_HOSTS.some(h => e.request.url.includes(h))) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
