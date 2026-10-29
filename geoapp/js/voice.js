/**
 * GeoAPP - recorded pronunciation, ready for Iva's recordings.
 *
 * Only files listed in audio/manifest.json are played, for example
 * "ka/27.mp3" for the number 27. A number without a file gets no
 * "Listen" button at all. There is deliberately no speech synthesis:
 * browser voices for Georgian are rare and often wrong.
 *
 * A file is fetched as a whole (no range requests), so the service
 * worker can keep a copy and it plays offline the next time.
 */
window.GeoVoice = (function () {
  'use strict';

  var MANIFEST_URL = 'audio/manifest.json';
  var files = new Set();
  var current = null;

  function load() {
    if (window.location.protocol === 'file:' || !window.fetch) return Promise.resolve();
    return fetch(MANIFEST_URL)
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        (data && Array.isArray(data.files) ? data.files : []).forEach(function (path) {
          if (typeof path === 'string') files.add(path);
        });
      })
      .catch(function () { /* no manifest - no listen buttons */ });
  }

  var ready = load();

  function path(number) { return 'ka/' + number + '.mp3'; }

  function has(number) { return files.has(path(number)); }

  function stop() {
    if (current) current.pause();
    current = null;
  }

  function play(number) {
    stop();
    if (!has(number)) return;
    fetch('audio/' + path(number))
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.blob();
      })
      .then(function (blob) {
        var audio = new Audio(URL.createObjectURL(blob));
        current = audio;
        audio.addEventListener('ended', function () { URL.revokeObjectURL(audio.src); });
        return audio.play();
      })
      .catch(function () { /* broken file: stay silent */ });
  }

  return { ready: ready, has: has, play: play, stop: stop };
})();
