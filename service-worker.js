// give it a new version so that the updated todo.js / styles.css get re-cached
const CACHE_NAME = 'focus-tree-v4';
const ASSETS = [
  '/',               // our app shell
  '/index.html',
  '/stats.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', evt => {
  // pre-cache all app shell assets
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  // clean up old caches
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
  // navigation requests: try network first, fallback to cache
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          // update cache in background
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // static asset requests: cache-first
  evt.respondWith(
    caches.match(evt.request)
      .then(cached => cached || fetch(evt.request))
  );
});
