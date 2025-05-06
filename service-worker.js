const CACHE_NAME = 'focus-tree-v2';
const APP_SHELL = [
  '/index.html?cache-bust=v2',
  '/stats.html?cache-bust=v2',
  '/styles.css',
  '/app.js',
  '/manifest.json?cache-bust=v2',
  '/icons/icon-192x192.png?cache-bust=v2',
  '/icons/icon-512x512.png?cache-bust=v2'
];

// Install → precache
self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
});

// Activate → clean old caches
self.addEventListener('activate', evt => {
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

// Fetch → network-first for navigation, cache-first for everything else
self.addEventListener('fetch', evt => {
  if (evt.request.mode === 'navigate') {
    // Try network first
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
          return res;
        })
        .catch(() => caches.match('/index.html?cache-bust=v2'))
    );
  } else {
    // Cache-first for static assets
    evt.respondWith(
      caches.match(evt.request).then(cached =>
        cached || fetch(evt.request)
      )
    );
  }
});

// Listen for skipWaiting messages from page
self.addEventListener('message', evt => {
  if (evt.data && evt.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
