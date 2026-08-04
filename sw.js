const CACHE_NAME = 'electrical-planner-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './version.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';
  const isCoreUpdatePath =
    requestUrl.pathname.endsWith('/index.html') ||
    requestUrl.pathname.endsWith('/version.json') ||
    requestUrl.pathname.endsWith('/manifest.webmanifest') ||
    requestUrl.pathname.endsWith('/sw.js') ||
    requestUrl.pathname === '/' ||
    requestUrl.pathname === '';

  if (isNavigation || isCoreUpdatePath) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
