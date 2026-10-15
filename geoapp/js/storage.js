/**
 * GeoAPP - safe wrapper around localStorage.
 *
 * Every read and write is wrapped in try/catch: storage can be missing,
 * full, or blocked (private windows, disabled cookies, sandboxed iframes).
 * In that case the app keeps working; it just forgets on reload.
 */
window.GeoStorage = (function () {
  'use strict';

  var PREFIX = 'geoapp:v1:';
  var available = (function () {
    try {
      var probe = PREFIX + 'probe';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  })();

  function get(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      var value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key);
      return true;
    } catch (error) {
      return false;
    }
  }

  return { available: available, get: get, set: set, remove: remove };
})();
