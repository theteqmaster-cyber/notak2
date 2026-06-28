// public/sw.js — Service Worker for PWA Android
const CACHE_NAME = 'notak2-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/app',
  '/index.html',
  '/css/app.css',
  '/css/auth.css',
  '/js/app.js',
  '/js/vault.js',
  '/js/editor.js',
  '/js/library.js',
  '/js/sync.js',
  '/js/updater.js',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip API and sync routes (network only)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/sync') || 
      url.pathname.startsWith('/admin') || url.pathname.startsWith('/ci') ||
      req.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(req).then(cachedRes => {
      return cachedRes || fetch(req).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, fetchRes.clone());
          return fetchRes;
        });
      });
    })
  );
});
