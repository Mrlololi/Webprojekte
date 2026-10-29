/**
 * Language Starter service worker - works offline after the first visit,
 * and does not hang on a weak signal (event Wi-Fi, a hostel, WhatsApp's browser).
 *
 * Network first with a 3 second limit: if the network answers in time,
 * visitors get the newest files. If it is slower, the last saved copy is
 * shown and the network answer still updates the cache in the background.
 * Without a connection the saved copy is used right away.
 *
 * Only same-origin GET requests are handled. Every successful response is
 * stored, so a language file (data/xx.json) or a recorded mp3 that was used
 * once also works offline. The shell, the index and English are stored on
 * install; other languages when they are first opened.
 *
 * If you add a file the app needs, add it to FILES as well.
 */
var CACHE = 'langstarter-v3';
var TIMEOUT_MS = 3000;
var FILES = [
  './',
  './index.html',
  './css/langstarter.css',
  './js/i18n.js',
  './js/storage.js',
  './js/voice.js',
  './js/vendor/qrcode.min.js',
  './js/app.js',
  './data/index.json',
  './data/en.json',
  './audio/manifest.json',
  './manifest.webmanifest',
  '../assets/css/base.css',
  '../assets/js/theme.js',
  '../assets/fonts/bricolage-grotesque-latin.woff2',
  '../assets/fonts/atkinson-hyperlegible-next-latin.woff2',
  '../assets/icons/langstarter.svg',
  '../assets/icons/langstarter-192.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return cache.addAll(FILES).then(function () {
          // Then every language file, one by one and best effort (all together about 55 KB):
          // offline, another language pair still works. A failed file is fetched when used.
          return fetch('./data/index.json')
            .then(function (response) { return response.json(); })
            .then(function (index) {
              return Promise.all(Object.keys(index.languages).map(function (code) {
                return cache.add('./data/' + code + '.json').catch(function () {});
              }));
            })
            .catch(function () {});
        });
      })
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

function fromNetwork(request) {
  return fetch(request).then(function (response) {
    // 206 (partial content) cannot be cached; voice.js fetches mp3 files whole.
    if (response.status === 200 && response.type === 'basic') {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
    }
    return response;
  });
}

function fromCache(request) {
  return caches.match(request, { ignoreSearch: true }).then(function (cached) {
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./');
    return undefined;
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  var network = fromNetwork(request);
  // Let a slow answer finish and refresh the cache even after the saved copy was shown.
  event.waitUntil(network.catch(function () {}));

  event.respondWith(new Promise(function (resolve) {
    var done = false;
    var finish = function (response) {
      if (done || !response) return false;
      done = true;
      resolve(response);
      return true;
    };
    var timer = setTimeout(function () { fromCache(request).then(finish); }, TIMEOUT_MS);
    network.then(function (response) {
      clearTimeout(timer);
      finish(response);
    }, function () {
      clearTimeout(timer);
      fromCache(request).then(function (cached) {
        if (!finish(cached)) finish(Response.error());
      });
    });
  }));
});
