/**
 * Language Starter - "Listen" buttons.
 *
 * Order of preference for one phrase:
 *   1. A recorded file listed in audio/manifest.json, for example
 *      "ka/intro.hello.mp3" or "ru/mood.tired.f.mp3". It is fetched as a
 *      whole (no range requests), so the service worker can keep a copy
 *      and the file plays offline the next time.
 *   2. The browser's own speech synthesis (Web Speech API). The voice is
 *      picked by the language's tts code (ka-GE), then by its prefix (ka).
 *      Voices on the device (localService) win over network voices.
 *   3. Nothing. If there is no file and no usable voice (or only a network
 *      voice while offline), canPlay() is false and the app hides the
 *      button. A broken button is never shown.
 *
 * {X} placeholders are never spoken.
 */
window.LSVoice = (function () {
  'use strict';

  var MANIFEST_URL = 'audio/manifest.json';
  var VOICE_WAIT_MS = 1500;

  var files = new Set();
  var voices = [];
  var synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  var current = null; // the <audio> element that is playing

  function loadManifest() {
    if (window.location.protocol === 'file:' || !window.fetch) return Promise.resolve();
    return fetch(MANIFEST_URL)
      .then(function (response) { return response.ok ? response.json() : { files: [] }; })
      .then(function (data) {
        (data && Array.isArray(data.files) ? data.files : []).forEach(function (path) {
          if (typeof path === 'string') files.add(path);
        });
      })
      .catch(function () { /* no manifest - speech synthesis only */ });
  }

  /** Voices arrive asynchronously in Chrome; wait for voiceschanged, but not forever. */
  function loadVoices() {
    if (!synth) return Promise.resolve();
    voices = synth.getVoices() || [];
    if (voices.length) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        voices = synth.getVoices() || [];
        resolve();
      }
      if (synth.addEventListener) synth.addEventListener('voiceschanged', finish);
      else synth.onvoiceschanged = finish;
      window.setTimeout(finish, VOICE_WAIT_MS);
    });
  }

  var listeners = [];

  /** Re-read the voices; tell the app when the list changed. */
  function refresh() {
    if (!synth) return;
    var before = voices.length;
    voices = synth.getVoices() || [];
    if (voices.length !== before) listeners.forEach(function (fn) { fn(); });
  }

  function init() {
    if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', refresh);
    // iOS Safari often fills the list only after the first user gesture, and after the
    // first wait above. So "no audio" is decided again on the first tap or key.
    ['pointerdown', 'touchend', 'keydown'].forEach(function (type) {
      window.addEventListener(type, function () { window.setTimeout(refresh, 300); }, { once: true, passive: true });
    });
    return Promise.all([loadManifest(), loadVoices()]);
  }

  function onChange(fn) { listeners.push(fn); }

  function norm(tag) {
    return String(tag || '').replace(/_/g, '-').toLowerCase();
  }

  /** Norwegian voices come as nb, no or nn. */
  function prefixes(tts) {
    var base = norm(tts).split('-')[0];
    return base === 'nb' || base === 'no' ? ['nb', 'no', 'nn'] : [base];
  }

  function pickVoice(tts) {
    if (!tts || !voices.length) return null;
    var offline = navigator.onLine === false;
    var usable = voices.filter(function (voice) { return !offline || voice.localService; });
    var exact = usable.filter(function (voice) { return norm(voice.lang) === norm(tts); });
    var wanted = prefixes(tts);
    var byPrefix = usable.filter(function (voice) { return wanted.indexOf(norm(voice.lang).split('-')[0]) !== -1; });
    var pool = exact.length ? exact : byPrefix;
    if (!pool.length) return null;
    var local = pool.filter(function (voice) { return voice.localService; });
    return (local.length ? local : pool)[0];
  }

  function filePath(lang, id, form) {
    return lang + '/' + id + (form ? '.' + form : '') + '.mp3';
  }

  function hasFile(lang, id, form) {
    return files.has(filePath(lang, id, form));
  }

  function canPlay(lang, tts, id, form) {
    return hasFile(lang, id, form) || Boolean(pickVoice(tts));
  }

  function speakable(text) {
    return String(text).replace(/\{X\}[-‐'’]?/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function stop() {
    if (current) {
      current.pause();
      current = null;
    }
    if (synth) synth.cancel();
  }

  function speak(text, tts) {
    var voice = pickVoice(tts);
    if (!voice || !synth) return false;
    var utterance = new SpeechSynthesisUtterance(speakable(text));
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.9;
    synth.speak(utterance);
    return true;
  }

  function playFile(path, fallback) {
    fetch('audio/' + path)
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
      .catch(fallback);
  }

  /** Play one phrase (or one form of it). */
  function play(options) {
    stop();
    if (hasFile(options.lang, options.id, options.form)) {
      playFile(filePath(options.lang, options.id, options.form), function () { speak(options.text, options.tts); });
      return;
    }
    speak(options.text, options.tts);
  }

  /** For the report: every voice the browser offers, local or network. */
  function list() {
    return voices.map(function (voice) {
      return { name: voice.name, lang: voice.lang, local: voice.localService };
    });
  }

  return { init: init, onChange: onChange, canPlay: canPlay, play: play, stop: stop, list: list, speakable: speakable };
})();
