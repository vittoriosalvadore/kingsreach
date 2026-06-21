// Kingsreach service worker — makes the game installable and offline-capable.
//
// Strategy:
//   * App shell (this dir's files) is precached at install.
//   * Navigations are network-first, falling back to the cached index.html so
//     the game still launches offline but picks up new deploys when online.
//   * Everything else (including the Three.js / opentype.js CDN modules and
//     Three's lazily-imported bloom addons + their transitive deps) is cached
//     on first successful load — cache-first thereafter. So the FIRST launch
//     needs the network; every launch after that works fully offline.
//
// Bump CACHE when the shell changes to retire the old cache.
const CACHE = 'kingsreach-v1';
const SHELL = [
  './vendor/opentype.min.js',
  './vendor/three/three.module.js',
  './src/helpers.js',
  './src/data.js',
  './src/state.js',
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // HTML document: network-first, fall back to cached shell when offline.
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Everything else (incl. cross-origin CDN): cache-first, then fill the cache.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      // Cache successful basic/CORS responses; skip opaque error/partial.
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
