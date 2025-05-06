const CACHE_NAME = 'focus-app-v1';
const ASSETS = [
  '/focus/',
  '/focus/index.html',
  '/focus/stats.html',
  '/focus/styles.css',
  '/focus/app.js',
  '/focus/manifest.json',
  '/focus/icons/icon-192x192.png',
  '/focus/icons/icon-512x512.png'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(old => caches.delete(old))
      ))
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
