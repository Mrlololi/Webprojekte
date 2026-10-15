/**
 * GeoAPP service worker - makes the quiz work offline after the first visit.
 *
 * Strategy: network first, cache as fallback. Online visitors always get the
 * newest files (no stale versions after an update); offline visitors get the
 * last copy that was loaded. Only same-origin GET requests are handled.
 *
 * If you add a file the app needs, add it to FILES as well.
 */
var CACHE = 'geoapp-v1';
var FILES = [
  './',
  './index.html',
  './css/geoapp.css',
  './js/i18n.js',
  './js/storage.js',
  './js/app.js',
  './data/numbers.json',
  './manifest.webmanifest',
  '../assets/css/base.css',
  '../assets/js/theme.js',
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
