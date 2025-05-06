const CACHE_NAME = 'focus-tree-cache-v2';
const ASSETS = [
  '/',
  '/index.html?ver=1.1.0',
  '/stats.html?ver=1.1.0',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png?ver=1.1.0',
  '/icons/icon-512x512.png?ver=1.1.0'
];

self.addEventListener('install', evt => {
  // Precache new version
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  // Remove old caches
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(old => caches.delete(old))
      )
    )
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cached =>
      cached || fetch(evt.request)
    )
  );
});
