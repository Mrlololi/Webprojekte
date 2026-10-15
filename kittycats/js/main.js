/**
 * KittyCats - small progressive enhancements. The page is fully readable
 * without JavaScript; this adds the kitten -> cat toggle, the "Get a call"
 * shortcut, friendly form validation and the active state in the nav.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Gallery: kitten <-> grown-up cat ---------- */

  document.querySelectorAll('.morph__btn').forEach(function (button) {
    button.addEventListener('click', function () {
      var grown = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(grown));
      var state = button.closest('.morph').querySelector('.morph__state');
      if (state) state.textContent = grown ? 'grown up' : 'kitten';
    });
  });

  /* ---------- Contact form ---------- */

  var form = document.getElementById('cat-form');
  var preferences = document.getElementById('preferences');
  var email = document.getElementById('email');
  var emailError = document.getElementById('email-error');
  var ageGroup = form.querySelector('.field--radios');
  var ageInputs = form.querySelectorAll('input[name="age"]');
  var ageError = document.getElementById('age-error');
  var status = document.getElementById('form-status');
  var submitted = false;
  var CALL_PREFIX = "Hi! I'd love a call about ";

  // "Get a call" on a cat card: prefill the request and jump to the form.
  document.querySelectorAll('.cat-card__btn').forEach(function (button) {
    button.addEventListener('click', function () {
      var name = button.getAttribute('data-cat');
      var lines = preferences.value.split('\n').filter(function (line) {
        return line.trim() && line.indexOf(CALL_PREFIX) !== 0;
      });
      preferences.value = [CALL_PREFIX + name + '.'].concat(lines).join('\n');
      status.textContent = '';
      document.getElementById('contact').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
      preferences.focus({ preventScroll: true });
      preferences.setSelectionRange(preferences.value.length, preferences.value.length);
    });
  });

  function validateEmail() {
    var message = '';
    if (email.validity.valueMissing) message = 'Please enter your email address.';
    else if (email.validity.typeMismatch) message = 'Please enter a valid email address, like name@example.com.';
    emailError.textContent = message;
    if (message) email.setAttribute('aria-invalid', 'true');
    else email.removeAttribute('aria-invalid');
    return !message;
  }

  function validateAge() {
    var chosen = Array.prototype.some.call(ageInputs, function (input) { return input.checked; });
    ageError.textContent = chosen ? '' : 'Please choose an age.';
    if (chosen) ageGroup.removeAttribute('aria-invalid');
    else ageGroup.setAttribute('aria-invalid', 'true');
    return chosen;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submitted = true;
    var ageOk = validateAge();
    var emailOk = validateEmail();

    if (!ageOk || !emailOk) {
      status.textContent = '';
      (ageOk ? email : ageInputs[0]).focus();
      return;
    }

    status.textContent = 'Thanks! In real life we would call you back now. This is only a demo, so nothing was sent.';
    form.reset();
    submitted = false;
  });

  // After the first submit, errors update while the visitor fixes them.
  email.addEventListener('input', function () { if (submitted) validateEmail(); });
  ageInputs.forEach(function (input) {
    input.addEventListener('change', function () { if (submitted) validateAge(); });
  });

  /* ---------- Nav: mark the section currently on screen ---------- */

  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (link) { byId[link.getAttribute('href').slice(1)] = link; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var active = byId[entry.target.id] || null;
        links.forEach(function (link) {
          if (link === active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main > section').forEach(function (section) {
      observer.observe(section);
    });
  }
})();
