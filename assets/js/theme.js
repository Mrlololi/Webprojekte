/**
 * Light/dark theme toggle, shared by all three pages.
 *
 * - First visit: follows the operating system (prefers-color-scheme).
 * - After a click: the choice is stored and wins on every page of the
 *   portfolio (all pages share one origin, so one localStorage key).
 * - A tiny inline script in each <head> applies the stored choice before
 *   the first paint, so there is no flash of the wrong theme.
 *
 * Markup: <button class="theme-toggle" type="button" aria-pressed="false">
 * aria-pressed="true" means "dark theme is on".
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'iva-portfolio-theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function readStored() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function writeStored(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* Storage blocked (private mode, cookies off): the toggle still works for this page view. */
    }
  }

  function effectiveTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return media && media.matches ? 'dark' : 'light';
  }

  function syncButtons() {
    var isDark = effectiveTheme() === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.setAttribute('aria-pressed', String(isDark));
    });
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    syncButtons();
  }

  var stored = readStored();
  if (stored) apply(stored);

  document.addEventListener('click', function (event) {
    var button = event.target.closest('.theme-toggle');
    if (!button) return;
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    apply(next);
    writeStored(next);
  });

  if (media) {
    var onSystemChange = function () {
      if (!readStored()) syncButtons();
    };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  syncButtons();
})();
