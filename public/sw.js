const CACHE_VERSION = 'v1';
const CACHE_NAME = `aile-karti-${CACHE_VERSION}`;
const ORIGIN = self.location.origin;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
];

// Install: cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: purge old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML, cache-first for static assets
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const isHtml = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');

  e.respondWith(
    isHtml
      ? fetchAndCache(request)
      : caches.match(request).then((r) => r || fetchAndCache(request))
  );
});

function fetchAndCache(request) {
  return fetch(request)
    .then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return res;
    })
    .catch(() => caches.match(request).then((r) => r || caches.match('/')));
}
