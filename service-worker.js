const CACHE_NAME = 'focus-tree-v5';
const ASSETS = [
  '/',               // app shell
  '/index.html',
  '/stats.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
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
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  // Network-first for navigation, fallback to cache
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for everything else
  evt.respondWith(
    caches.match(evt.request)
      .then(cached => cached || fetch(evt.request))
  );
});
