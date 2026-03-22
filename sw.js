const CACHE = 'darts-v3';

self.addEventListener('install', e => {
  // Take over immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // MP3 sound files: cache-first (they never change)
  if (url.pathname.includes('/sounds/')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(response => {
            cache.put(e.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Everything else (index.html, manifest, fonts): network-first
  // Always try to get the latest version, fall back to cache if offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Save fresh copy in cache
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request)) // offline fallback
  );
});
