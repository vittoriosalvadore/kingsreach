// Kingsreach service worker — makes the game installable and offline-capable.
//
// Strategy (v2):
//   * App code (index.html, ./src/*.js, manifest) is **network-first**: a fresh
//     deploy is picked up immediately when online, falling back to cache offline.
//     (v1 served these cache-first and never updated them — returning players got
//     stale builds; this fixes that.)
//   * Immutable, version-pinned assets (./vendor/*, ./icons/*) are cache-first
//     for fast loads — they only change on a deliberate re-vendor.
//   * The shell is precached at install so the first offline launch still works.
//
// Bump CACHE on every deploy that changes precached immutables, or to force a
// purge of stale caches from older versions.
const CACHE = 'kingsreach-v2';
const SHELL = [
  './vendor/opentype.min.js',
  './vendor/three/three.module.js',
  './src/helpers.js',
  './src/data.js',
  './src/state.js',
  './src/meta.js',
  './src/audio.js',
  './src/scene.js',
  './src/textures.js',
  './src/fx.js',
  './src/gear.js',
  './src/props.js',
  './src/villagers.js',
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

const putInCache = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Immutable, version-pinned assets: cache-first (fast; rarely change).
  const immutable = url.origin === self.location.origin &&
    (url.pathname.includes('/vendor/') || url.pathname.includes('/icons/'));
  if (immutable) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => putInCache(req, res))));
    return;
  }

  // App shell + code (HTML, ./src/*.js, manifest, everything else): network-first
  // so new deploys are picked up immediately; fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then(res => putInCache(req, res))
      .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
