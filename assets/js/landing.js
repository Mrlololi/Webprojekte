/**
 * Landing page: language details, calm reveals, preview loops while visible,
 * footer mascots, and the 3D logo balls (loaded late, only where they can run well).
 *
 * The language itself is chosen by the inline script in <head> (before the first paint);
 * this file only updates what CSS cannot reach: title, meta tags, links.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var lang = root.lang === 'en' ? 'en' : 'de';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Title, meta and links for the chosen language ---------- */
  var META = {
    en: {
      title: 'Web projects: learning apps, AI and animation | Iva Tsatskrialashvili',
      description: 'Four web projects by Iva Tsatskrialashvili, Marketing Automation Engineer in Graz: a Georgian learning app, phrase cards for youth exchanges, an AI inbox and an animation page.',
      ogTitle: 'Web projects by Iva Tsatskrialashvili',
      ogDescription: 'A Georgian learning app, phrase cards for youth exchanges, an AI inbox and an animation page. Everything to try in your browser.',
      url: 'https://mrlololi.com/Webprojekte/?lang=en',
      locale: 'en_GB',
      altLocale: 'de_AT'
    }
  };

  function setMeta(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.setAttribute(el.tagName === 'LINK' ? 'href' : 'content', value);
  }

  if (lang === 'en') {
    var m = META.en;
    document.title = m.title;
    setMeta('meta[name="description"]', m.description);
    setMeta('meta[property="og:title"]', m.ogTitle);
    setMeta('meta[name="twitter:title"]', m.ogTitle);
    setMeta('meta[property="og:description"]', m.ogDescription);
    setMeta('meta[name="twitter:description"]', m.ogDescription);
    setMeta('meta[property="og:url"]', m.url);
    setMeta('meta[property="og:locale"]', m.locale);
    setMeta('meta[property="og:locale:alternate"]', m.altLocale);
    setMeta('link[rel="canonical"]', m.url);
    document.querySelectorAll('[data-href-en]').forEach(function (a) {
      a.setAttribute('href', a.getAttribute('data-href-en'));
    });
  }

  document.querySelectorAll('.lang-links a[data-lang]').forEach(function (a) {
    if (a.getAttribute('data-lang') === lang) a.setAttribute('aria-current', 'true');
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  /* ---------- Cards reveal on scroll, and again when they come back ---------- */
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      // Hide again only when the card has left below the window (scrolling back up),
      // so the reveal replays on the next way down.
      if (entry.isIntersecting) entry.target.classList.add('is-in');
      else if (entry.boundingClientRect.top > 0) entry.target.classList.remove('is-in');
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { reveal.observe(el); });
  root.classList.add('reveal-on');

  /* ---------- Preview loops run only while visible ---------- */
  var live = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-live', entry.isIntersecting);
    });
  });
  document.querySelectorAll('.project__visual').forEach(function (el) { live.observe(el); });

  /* ---------- Footer mascots wave when the footer comes into view ---------- */
  var mascots = document.querySelector('.footer-mascots');
  if (mascots && !reduced) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        mascots.classList.toggle('is-waving', entry.isIntersecting);
      });
    }, { threshold: 0.6 }).observe(mascots);
  }

  /* ---------- 3D logo balls: after the page is idle, only with a fine pointer,
     hover, no reduced motion. Everyone else keeps the flat SVG. ---------- */
  var balls = document.querySelector('[data-balls]');
  var canRun = balls && !reduced &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !(navigator.connection && navigator.connection.saveData);

  function loadBalls() {
    import('./balls3d.js').then(function (mod) { mod.init(balls); }).catch(function () {
      /* No module support or no WebGL: the flat logo stays. */
    });
  }

  if (canRun) {
    var later = function () {
      if ('requestIdleCallback' in window) window.requestIdleCallback(loadBalls, { timeout: 4000 });
      else window.setTimeout(loadBalls, 1500);
    };
    if (document.readyState === 'complete') later();
    else window.addEventListener('load', later, { once: true });
  }
})();
