const CACHE_NAME = 'focus-tree-v1';
const ASSETS = [
  './',
  './index.html',
  './stats.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

self.addEventListener('install', evt => {
  // Activate worker immediately
  self.skipWaiting();
  // Precache app shell
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  // Navigation (HTML) → network-first
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          // Update cache
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(evt.request, copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // Other assets → cache-first
    evt.respondWith(
      caches.match(evt.request).then(cached => cached || fetch(evt.request))
    );
  }
});
