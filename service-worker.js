const CACHE_NAME = 'focus-tree-v3';
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
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(old => caches.delete(old))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(evt.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    evt.respondWith(
      caches.match(evt.request).then(cached => cached || fetch(evt.request))
    );
  }
});
