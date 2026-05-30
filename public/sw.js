const CACHE_NAME = 'jsms-hsse-v2';
// Jangan cache request asset/HTML secara agresif saat testing Firestore real-time.
// Fokus hanya ke root + index.html agar fetch ke Firestore tidak ter-intercept.
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Disable aggressive caching for troubleshooting.
// Firestore realtime listeners must not be intercepted.
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request)
//       .then(response => response || fetch(event.request))
//   );
// });
