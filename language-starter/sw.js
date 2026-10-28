/**
 * Language Starter service worker - works offline after the first visit.
 *
 * Same strategy as GeoAPP: network first, cache as fallback. Online
 * visitors always get the newest files; offline visitors get the last copy.
 * Only same-origin GET requests are handled. Every successful response is
 * stored, so a recorded mp3 that was played once also plays offline.
 *
 * If you add a file the app needs, add it to FILES as well.
 */
var CACHE = 'langstarter-v1';
var FILES = [
  './',
  './index.html',
  './css/langstarter.css',
  './js/i18n.js',
  './js/storage.js',
  './js/voice.js',
  './js/vendor/qrcode.min.js',
  './js/app.js',
  './data/phrases.json',
  './audio/manifest.json',
  './manifest.webmanifest',
  '../assets/css/base.css',
  '../assets/js/theme.js',
  '../assets/icons/langstarter.svg',
  '../assets/icons/langstarter-192.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (key) {
          return key.indexOf('langstarter-') === 0 && key !== CACHE;
        }).map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(function (response) {
        // 206 (partial content) cannot be cached; voice.js fetches mp3 files whole.
        if (response.status === 200 && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      })
      .catch(function () {
        return caches.match(request, { ignoreSearch: true }).then(function (cached) {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('./');
          return Response.error();
        });
      })
  );
});
