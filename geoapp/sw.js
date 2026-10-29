/**
 * GeoAPP service worker - makes the quiz work offline after the first visit.
 *
 * Strategy: network first, cache as fallback. Online visitors always get the
 * newest files (no stale versions after an update); offline visitors get the
 * last copy that was loaded. Only same-origin GET requests are handled.
 *
 * If you add a file the app needs, add it to FILES as well and raise the
 * number in CACHE. Recordings in audio/ are not listed: each one is saved
 * the first time it is played, so it then plays offline too.
 */
var CACHE = 'geoapp-v2';
var FILES = [
  './',
  './index.html',
  './css/geoapp.css',
  './js/i18n.js',
  './js/storage.js',
  './js/voice.js',
  './js/app.js',
  './data/numbers.json',
  './audio/manifest.json',
  './manifest.webmanifest',
  '../assets/css/base.css',
  '../assets/js/theme.js',
  '../assets/fonts/bricolage-grotesque-latin.woff2',
  '../assets/fonts/atkinson-hyperlegible-next-latin.woff2',
  '../assets/icons/geoapp.svg',
  '../assets/icons/geoapp-192.png'
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
          return key.indexOf('geoapp-') === 0 && key !== CACHE;
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
        if (response.ok && response.type === 'basic') {
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
