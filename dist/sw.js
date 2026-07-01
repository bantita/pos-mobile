// Service Worker — Xcellence POS PWA v2
// ต้องมี service worker ถึงจะเปิดแบบ standalone บน Android ได้

const CACHE_NAME = 'pos-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network first, no cache
  event.respondWith(fetch(event.request));
});
