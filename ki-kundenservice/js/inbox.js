/**
 * KI im Kundenservice: turns the static mail list into a two-pane inbox.
 *
 * The HTML already holds all 20 mails (built by tools/build.mjs), so this
 * script fetches nothing and sends nothing. It only shows one mail at a time,
 * adds the filters, the keyboard navigation, the demo «Freigeben» button and
 * the savings calculator.
 */
(function () {
  'use strict';

  var inbox = document.getElementById('inbox');
  if (!inbox) return;

  var list = inbox.querySelector('.inbox__list');
  var items = Array.prototype.slice.call(list.querySelectorAll('.item'));
  var mails = Array.prototype.slice.call(inbox.querySelectorAll('.mail'));
  var status = document.getElementById('inbox-status');
  var count = inbox.querySelector('.inbox__count');
  var back = inbox.querySelector('[data-back]');
  var filterButtons = Array.prototype.slice.call(inbox.querySelectorAll('.filter'));
  var wide = window.matchMedia('(min-width: 56em)');

  var FILTER_TEXT = { alle: 'alle Mails', entwurf: 'Entwurf', mensch: 'an einen Menschen', gefiltert: 'gefiltert' };
  var current = null;
  var filter = 'alle';

  Array.prototype.forEach.call(document.querySelectorAll('[data-filters], [data-js-only], [data-approve], [data-back]'), function (el) {
    el.hidden = false;
  });

  function byId(id) {
    return document.getElementById('mail-' + id);
  }

  function itemFor(id) {
    for (var i = 0; i < items.length; i++) if (items[i].getAttribute('data-id') === String(id)) return items[i];
    return null;
  }

  function visibleItems() {
    return items.filter(function (item) { return !item.parentNode.hidden; });
  }

  function announce(text) {
    status.textContent = '';
    window.setTimeout(function () { status.textContent = text; }, 60);
  }

  function describe(id) {
    var mail = byId(id);
    var title = mail.querySelector('.mail__title').textContent;
    var decision = mail.querySelector('.decision__value').textContent;
    return 'Mail ' + id + ' von ' + mails.length + ' geöffnet: ' + title + '. ' + decision + '.';
  }

  /* Roving tabindex: the list is one tab stop, arrows move inside it. */
  function setTabStop(item) {
    items.forEach(function (other) { other.setAttribute('tabindex', other === item ? '0' : '-1'); });
  }

  function select(id) {
    current = String(id);
    mails.forEach(function (mail) { mail.hidden = mail.getAttribute('data-id') !== current; });
    items.forEach(function (item) {
      if (item.getAttribute('data-id') === current) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    setTabStop(itemFor(current));
  }

  function openReading(focusTitle) {
    inbox.classList.add('is-reading');
    if (focusTitle) byId(current).querySelector('.mail__title').focus();
  }

  function showFromList(item) {
    select(item.getAttribute('data-id'));
    if (wide.matches) {
      announce(describe(current));
    } else {
      openReading(true);
    }
  }

  list.addEventListener('click', function (event) {
    var item = event.target.closest('.item');
    if (!item) return;
    event.preventDefault();
    showFromList(item);
  });

  list.addEventListener('keydown', function (event) {
    var item = event.target.closest('.item');
    if (!item) return;
    var shown = visibleItems();
    var index = shown.indexOf(item);
    var next = null;
    if (event.key === 'ArrowDown') next = shown[Math.min(index + 1, shown.length - 1)];
    else if (event.key === 'ArrowUp') next = shown[Math.max(index - 1, 0)];
    else if (event.key === 'Home') next = shown[0];
    else if (event.key === 'End') next = shown[shown.length - 1];
    else if (event.key === ' ') { event.preventDefault(); showFromList(item); return; }
    if (!next) return;
    event.preventDefault();
    setTabStop(next);
    next.focus();
  });

  back.addEventListener('click', function () {
    inbox.classList.remove('is-reading');
    var item = itemFor(current);
    if (item) item.focus();
  });

  /* Filters */

  function applyFilter(name, quiet) {
    filter = name;
    filterButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === name));
    });
    items.forEach(function (item) {
      var li = item.parentNode;
      li.hidden = name !== 'alle' && li.getAttribute('data-typ') !== name;
    });
    var shown = visibleItems();
    count.textContent = shown.length + ' von ' + items.length + ' Mails';
    var currentItem = itemFor(current);
    if (!currentItem || currentItem.parentNode.hidden) {
      if (shown.length) select(shown[0].getAttribute('data-id'));
    } else {
      setTabStop(currentItem);
    }
    if (!quiet) announce(shown.length + (shown.length === 1 ? ' Mail' : ' Mails') + ' angezeigt: ' + FILTER_TEXT[name] + '.');
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () { applyFilter(button.getAttribute('data-filter')); });
  });

  /* «Freigeben»: a demo, nothing leaves the page. */

  inbox.addEventListener('click', function (event) {
    var button = event.target.closest('.approve__btn');
    if (!button) return;
    var mail = button.closest('.mail');
    mail.querySelector('.approve__status').textContent = 'Freigegeben. Demo: nichts wird gesendet.';
    var item = itemFor(mail.getAttribute('data-id'));
    if (item && !item.querySelector('.item__done')) {
      var done = document.createElement('span');
      done.className = 'item__done';
      done.textContent = 'freigegeben';
      item.querySelector('.item__chips').appendChild(done);
    }
  });

  /* Links to a mail (special cases, or an address with #mail-15) */

  function goTo(id) {
    var item = itemFor(id);
    if (!item) return false;
    if (item.parentNode.hidden) applyFilter('alle', true);
    select(id);
    if (!wide.matches) inbox.classList.add('is-reading');
    byId(id).querySelector('.mail__title').focus();
    return true;
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a.special-link');
    if (!link) return;
    var match = /^#mail-(\d+)$/.exec(link.getAttribute('href'));
    if (match && goTo(match[1])) event.preventDefault();
  });

  /* Start */

  applyFilter('alle', true);
  var start = /^#mail-(\d+)$/.exec(window.location.hash);
  if (start && itemFor(start[1])) {
    goTo(start[1]);
  } else {
    select(items[0].getAttribute('data-id'));
  }

  /* ---------- Savings calculator ---------- */

  var form = document.getElementById('calc');
  if (!form) return;
  var oneDecimal = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  var noDecimal = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 0 });
  var out = {
    hours: document.querySelector('[data-calc="hours"]'),
    euro: document.querySelector('[data-calc="euro"]'),
    total: document.querySelector('[data-calc="total"]')
  };

  function number(name, max) {
    var value = parseFloat(form.elements[name].value);
    if (!isFinite(value) || value < 0) return 0;
    return Math.min(value, max);
  }

  // Same formula as the first demo: mails per week x 4.33 weeks x share x minutes,
  // a checked draft saves 70 % of that time, the team costs 25 € an hour.
  function calc() {
    var total = number('mails', 5000) * 4.33 * number('share', 100) / 100 * number('minutes', 60) / 60;
    var saved = total * 0.7;
    out.hours.textContent = oneDecimal.format(saved);
    out.euro.textContent = noDecimal.format(saved * 25) + ' €';
    out.total.textContent = oneDecimal.format(total);
  }

  form.addEventListener('input', calc);
  form.addEventListener('submit', function (event) { event.preventDefault(); });
  calc();
})();
