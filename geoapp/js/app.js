/**
 * GeoAPP - quiz logic.
 *
 * Depends on (loaded before, all with `defer`):
 *   window.GEOAPP_I18N  - js/i18n.js
 *   window.GeoStorage   - js/storage.js
 *   window.GeoVoice     - js/voice.js (recorded numbers, optional)
 *
 * Data comes from data/numbers.json. When the page is opened straight from
 * disk (file://) browsers refuse to fetch() local files, so the app loads
 * data/numbers.js instead - the same data wrapped in one assignment.
 */
(function () {
  'use strict';

  var I18N = window.GEOAPP_I18N;
  var store = window.GeoStorage;
  var voice = window.GeoVoice || { ready: Promise.resolve(), has: function () { return false; }, play: function () {}, stop: function () {} };

  var DATA_URL = 'data/numbers.json';
  var DATA_FALLBACK_URL = 'data/numbers.js';
  var OPTION_COUNT = 4;
  var NEXT_GUARD_MS = 300; // ignore a held-down Enter right after answering
  var RANGES = { all: [0, 30], a: [0, 10], b: [11, 20], c: [21, 30] };
  var LANG_CODES = I18N.languages.map(function (l) { return l.code; });

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */

  var state = {
    lang: I18N.defaultLang,
    numbers: [],              // array from numbers.json
    byNumber: new Map(),      // number -> entry
    settings: { mode: 'choice', range: 'all' },
    progress: { rounds: 0, best: null, bestStreak: 0, items: {} },
    round: null,              // see newRound()
    options: [],              // numbers shown as options for the current question
    hintVisible: false,
    answeredAt: 0,
    resetArmed: false
  };

  /* ------------------------------------------------------------------ */
  /* DOM                                                                 */
  /* ------------------------------------------------------------------ */

  function $(id) { return document.getElementById(id); }

  var el = {
    langButtons: $('lang-buttons'),
    storageNotice: $('storage-notice'),
    screens: {
      loading: $('screen-loading'),
      start: $('screen-start'),
      question: $('screen-question'),
      result: $('screen-result')
    },
    loadingText: $('loading-text'),
    startForm: $('start-form'),
    startTitle: $('start-title'),
    resumeBtn: $('resume-btn'),
    statKnown: $('stat-known'),
    statBest: $('stat-best'),
    statRounds: $('stat-rounds'),
    statStreak: $('stat-streak'),
    resetBtn: $('reset-btn'),
    resetMsg: $('reset-msg'),

    counter: $('q-counter'),
    progressBar: $('q-progress'),
    scoreOk: $('score-ok'),
    scoreBad: $('score-bad'),
    scoreStreak: $('score-streak'),
    streakPill: $('streak-pill'),
    word: $('q-word'),
    translit: $('q-translit'),
    hintBtn: $('hint-btn'),
    qListen: $('q-listen'),
    options: $('q-options'),
    typedForm: $('q-typed'),
    input: $('q-input'),
    checkBtn: $('check-btn'),
    feedback: $('q-feedback'),
    nextBtn: $('next-btn'),
    kbdHint: $('kbd-hint'),
    quitBtn: $('quit-btn'),

    resultTitle: $('result-title'),
    ringValue: $('result-ring-value'),
    percentShort: $('r-percent-short'),
    rCorrect: $('r-correct'),
    rTotal: $('r-total'),
    rPercent: $('r-percent'),
    rMessage: $('r-message'),
    rStreak: $('r-streak'),
    rWrongWrap: $('r-wrong-wrap'),
    rWrong: $('r-wrong'),
    retryBtn: $('retry-btn'),
    againBtn: $('again-btn'),
    settingsBtn: $('settings-btn'),

    numbersBody: $('numbers-body'),

    demo: $('tw-demo'),
    replay: $('tw-replay'),
    twRange: $('tw-range'),
    twNum: $('tw-num'),
    twWord: $('tw-word'),
    twTranslit: $('tw-translit'),
    twParts: $('tw-parts'),
    twSum: $('tw-sum'),
    twLiteral: $('tw-literal'),
    twNote: $('tw-note'),
    twListen: $('tw-listen'),
    twStatus: $('tw-status')
  };

  /* ------------------------------------------------------------------ */
  /* i18n                                                                */
  /* ------------------------------------------------------------------ */

  function langInfo(code) {
    return I18N.languages.filter(function (l) { return l.code === code; })[0] || I18N.languages[0];
  }

  function raw(key) {
    var dict = I18N[state.lang] || {};
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    if (Object.prototype.hasOwnProperty.call(I18N.common, key)) return I18N.common[key];
    var fallback = I18N[I18N.defaultLang] || {};
    return Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key] : key;
  }

  /** Translate `key`, fill {placeholders}, pick a plural form when vars.n is given. */
  function t(key, vars) {
    var value = raw(key);
    vars = vars || {};
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      var category = 'other';
      try {
        category = new Intl.PluralRules(langInfo(state.lang).locale).select(Number(vars.n));
      } catch (error) { /* very old browser - use "other" */ }
      value = value[category] || value.other;
    }
    return String(value).replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? formatValue(vars[name]) : match;
    });
  }

  function formatValue(value) {
    return typeof value === 'number' ? value.toLocaleString(langInfo(state.lang).locale) : String(value);
  }

  /** Text with [Key] markers -> text nodes and <kbd> elements. */
  function setKbdText(node, text) {
    var parts = text.split(/(\[[^\]]+\])/);
    node.replaceChildren.apply(node, parts.filter(Boolean).map(function (part) {
      var match = /^\[([^\]]+)\]$/.exec(part);
      if (!match) return document.createTextNode(part);
      var kbd = document.createElement('kbd');
      kbd.textContent = match[1];
      return kbd;
    }));
  }

  function applyStaticStrings() {
    var root = document.documentElement;
    root.lang = state.lang;
    document.title = t('meta.title');
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', t('meta.description'));

    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (node) {
      node.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length === 2) node.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });

    renderLangButtons();
  }

  function renderLangButtons() {
    var buttons = I18N.languages.map(function (lang) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'lang-switch__btn';
      button.setAttribute('data-lang', lang.code);
      button.setAttribute('aria-pressed', String(lang.code === state.lang));

      var short = document.createElement('span');
      short.textContent = lang.short;
      var full = document.createElement('span');
      full.className = 'visually-hidden';
      full.lang = lang.code;
      full.textContent = ' - ' + lang.name;

      button.append(short, full);
      return button;
    });
    el.langButtons.replaceChildren.apply(el.langButtons, buttons);
  }

  function setLanguage(code, focusCode) {
    if (LANG_CODES.indexOf(code) === -1) return;
    state.lang = code;
    store.set('lang', code);
    applyStaticStrings();
    refreshCurrentScreen();
    if (focusCode) {
      var again = el.langButtons.querySelector('[data-lang="' + focusCode + '"]');
      if (again) again.focus();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Data                                                                */
  /* ------------------------------------------------------------------ */

  function isValidData(data) {
    return data && Array.isArray(data.numbers) && data.numbers.length >= OPTION_COUNT &&
      data.numbers.every(function (n) {
        return typeof n.number === 'number' && n.georgian && n.translit && n.uk && n.de && n.en;
      });
  }

  function loadScriptFallback() {
    return new Promise(function (resolve, reject) {
      if (window.GEOAPP_NUMBERS) {
        resolve(window.GEOAPP_NUMBERS);
        return;
      }
      var script = document.createElement('script');
      script.src = DATA_FALLBACK_URL;
      script.onload = function () {
        if (window.GEOAPP_NUMBERS) resolve(window.GEOAPP_NUMBERS);
        else reject(new Error('numbers.js did not define GEOAPP_NUMBERS'));
      };
      script.onerror = function () { reject(new Error('numbers.js failed to load')); };
      document.head.appendChild(script);
    });
  }

  function loadNumbers() {
    // file:// - fetch() would be blocked (and logged as an error), go straight to the fallback.
    if (window.location.protocol === 'file:' || !window.fetch) return loadScriptFallback();
    return fetch(DATA_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .catch(loadScriptFallback);
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function shuffled(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function numbersInRange(rangeKey) {
    var range = RANGES[rangeKey] || RANGES.all;
    return state.numbers
      .map(function (n) { return n.number; })
      .filter(function (n) { return n >= range[0] && n <= range[1]; });
  }

  function translation(entry) {
    return entry[state.lang] || entry.en;
  }

  function showScreen(name) {
    Object.keys(el.screens).forEach(function (key) {
      el.screens[key].hidden = key !== name;
    });
    state.screen = name;
  }

  /**
   * Every screen change lines the quiz card up right under the sticky header,
   * so on a phone the Georgian word and all answers are on screen at once
   * (otherwise "Start" left the question below the fold). Then focus moves
   * without a second scroll.
   */
  function focusSoon(node) {
    if (!node) return;
    // setTimeout, not requestAnimationFrame: rAF never fires in a background tab.
    window.setTimeout(function () {
      var card = document.querySelector('.quiz-card');
      var header = document.querySelector('.site-header');
      if (card) {
        var offset = (header ? header.offsetHeight : 0) + 12;
        var target = Math.max(0, card.getBoundingClientRect().top + window.scrollY - offset);
        if (Math.abs(window.scrollY - target) > 4) {
          window.scrollTo({ top: target, behavior: reducedMotion() ? 'instant' : 'smooth' });
        }
      }
      node.focus({ preventScroll: true });
    }, 0);
  }

  function reducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function svgIcon(kind) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', kind === 'ok' ? 'm5 12.5 4.5 4.5L19 7.5' : 'm6.5 6.5 11 11M17.5 6.5l-11 11');
    svg.appendChild(path);
    return svg;
  }

  function span(className, text, lang) {
    var node = document.createElement('span');
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    if (lang) node.lang = lang;
    return node;
  }

  /* ------------------------------------------------------------------ */
  /* Progress (persisted)                                                */
  /* ------------------------------------------------------------------ */

  function loadPersisted() {
    var progress = store.get('progress', null);
    if (progress && typeof progress === 'object' && progress.items && typeof progress.items === 'object') {
      state.progress = {
        rounds: Number(progress.rounds) || 0,
        best: typeof progress.best === 'number' ? progress.best : null,
        bestStreak: Number(progress.bestStreak) || 0,
        items: progress.items
      };
    }

    var settings = store.get('settings', null);
    if (settings && typeof settings === 'object') {
      if (settings.mode === 'choice' || settings.mode === 'typed') state.settings.mode = settings.mode;
      if (Object.prototype.hasOwnProperty.call(RANGES, settings.range)) state.settings.range = settings.range;
    }

    var round = store.get('round', null);
    if (isValidRound(round)) {
      // Rounds saved before the streak counter existed start at 0.
      round.streak = Number(round.streak) || 0;
      round.bestStreak = Number(round.bestStreak) || 0;
      state.round = round;
    }
  }

  function isValidRound(round) {
    return round && Array.isArray(round.queue) && round.queue.length > 0 &&
      typeof round.index === 'number' && round.index >= 0 && round.index <= round.queue.length &&
      (round.mode === 'choice' || round.mode === 'typed') &&
      round.queue.every(function (n) { return state.numbers.length === 0 || state.byNumber.has(n); });
  }

  function validResult(result) {
    var ok = result && typeof result.total === 'number' && typeof result.correct === 'number' &&
      typeof result.percent === 'number' && Array.isArray(result.wrong) &&
      (result.mode === 'choice' || result.mode === 'typed') &&
      result.wrong.every(function (n) { return state.byNumber.has(n); });
    return ok ? result : null;
  }

  function saveProgress() { store.set('progress', state.progress); }
  function saveSettings() { store.set('settings', state.settings); }
  function saveRound() {
    if (state.round) store.set('round', state.round);
    else store.remove('round');
  }

  function recordAnswer(number, ok) {
    var item = state.progress.items[number] || { ok: 0, bad: 0, last: null };
    if (ok) item.ok += 1;
    else item.bad += 1;
    item.last = ok ? 'ok' : 'bad';
    state.progress.items[number] = item;
    saveProgress();
  }

  function knownCount() {
    return state.numbers.filter(function (n) {
      var item = state.progress.items[n.number];
      return item && item.last === 'ok';
    }).length;
  }

  /* ------------------------------------------------------------------ */
  /* Start screen                                                        */
  /* ------------------------------------------------------------------ */

  function renderStart() {
    var form = el.startForm;
    form.querySelector('input[name="mode"][value="' + state.settings.mode + '"]').checked = true;
    form.querySelector('input[name="range"][value="' + state.settings.range + '"]').checked = true;

    el.statKnown.textContent = state.numbers.length
      ? t('stats.knownValue', { n: knownCount(), total: state.numbers.length })
      : t('stats.none');
    el.statBest.textContent = state.progress.best === null ? t('stats.none') : formatPercent(state.progress.best);
    el.statRounds.textContent = formatValue(state.progress.rounds);
    el.statStreak.textContent = formatValue(state.progress.bestStreak);

    var round = state.round;
    var resumable = round && round.index < round.queue.length;
    el.resumeBtn.hidden = !resumable;
    if (resumable) {
      el.resumeBtn.textContent = t('start.resume', { done: answeredCount(round), total: round.queue.length });
    }

    el.resetBtn.textContent = t(state.resetArmed ? 'stats.resetConfirm' : 'stats.reset');
  }

  function formatPercent(value) {
    try {
      return new Intl.NumberFormat(langInfo(state.lang).locale, { style: 'percent', maximumFractionDigits: 0 }).format(value / 100);
    } catch (error) {
      return value + ' %';
    }
  }

  function answeredCount(round) {
    return round.index + (round.answered ? 1 : 0);
  }

  function openStart(focus) {
    state.resetArmed = false;
    el.resetMsg.textContent = '';
    renderStart();
    showScreen('start');
    if (focus) focusSoon(el.startTitle);
  }

  function onStartSubmit(event) {
    event.preventDefault();
    var data = new FormData(el.startForm);
    state.settings.mode = data.get('mode') === 'typed' ? 'typed' : 'choice';
    state.settings.range = Object.prototype.hasOwnProperty.call(RANGES, data.get('range')) ? data.get('range') : 'all';
    saveSettings();
    whenReady(function () { startRound(numbersInRange(state.settings.range), false); });
  }

  function onResetClick() {
    if (!state.resetArmed) {
      state.resetArmed = true;
      el.resetBtn.textContent = t('stats.resetConfirm');
      el.resetMsg.textContent = '';
      return;
    }
    state.resetArmed = false;
    state.progress = { rounds: 0, best: null, bestStreak: 0, items: {} };
    state.round = null;
    saveProgress();
    saveRound();
    renderStart();
    renderTable();
    el.resetMsg.textContent = t('stats.resetDone');
  }

  /* ------------------------------------------------------------------ */
  /* Round flow                                                          */
  /* ------------------------------------------------------------------ */

  function startRound(pool, isRetry) {
    state.round = {
      mode: state.settings.mode,
      range: state.settings.range,
      retry: Boolean(isRetry),
      queue: shuffled(pool),
      index: 0,
      answered: false,
      correct: 0,
      wrong: [],
      streak: 0,
      bestStreak: 0
    };
    saveRound();
    showScreen('question');
    showQuestion(true);
  }

  function resumeRound() {
    var round = state.round;
    if (!round) return;
    if (round.answered) {
      round.answered = false;
      round.index += 1;
    }
    saveRound();
    if (round.index >= round.queue.length) {
      finishRound();
      return;
    }
    showScreen('question');
    showQuestion(true);
  }

  function currentEntry() {
    var round = state.round;
    return round ? state.byNumber.get(round.queue[round.index]) : null;
  }

  /** Correct answer plus three distractors - two "look-alikes" (7/17/27, ±1) when possible. */
  function buildOptions(correct) {
    var all = state.numbers.map(function (n) { return n.number; }).filter(function (n) { return n !== correct; });
    var lookAlikes = shuffled(all.filter(function (n) {
      var diff = Math.abs(n - correct);
      return diff === 1 || diff === 10 || diff === 20 || n % 10 === correct % 10;
    })).slice(0, 2);
    var rest = shuffled(all.filter(function (n) { return lookAlikes.indexOf(n) === -1; }));
    var picked = lookAlikes.concat(rest).slice(0, OPTION_COUNT - 1);
    return shuffled(picked.concat(correct));
  }

  function showQuestion(moveFocus) {
    var round = state.round;
    var entry = currentEntry();
    if (!entry) {
      openStart(true);
      return;
    }

    state.hintVisible = false;
    state.options = round.mode === 'choice' ? buildOptions(entry.number) : [];

    el.word.textContent = entry.georgian;
    el.translit.textContent = entry.translit;
    el.feedback.replaceChildren();
    el.feedback.className = 'feedback';
    el.nextBtn.hidden = true;
    el.options.classList.remove('just-answered');
    el.input.classList.remove('is-right', 'is-wrong');
    voice.stop();

    el.options.hidden = round.mode !== 'choice';
    el.typedForm.hidden = round.mode !== 'typed';

    if (round.mode === 'typed') {
      el.input.value = '';
      el.input.readOnly = false;
      el.input.removeAttribute('aria-invalid');
      el.checkBtn.disabled = false;
      el.checkBtn.hidden = false;
    }

    renderQuestionTexts();
    renderOptions();
    saveRound();

    if (moveFocus) focusSoon(round.mode === 'typed' ? el.input : el.counter);
  }

  /** Everything on the question screen that depends on the language. */
  function renderQuestionTexts() {
    var round = state.round;
    if (!round) return;
    var total = round.queue.length;

    el.counter.textContent = t('q.counter', { n: round.index + 1, total: total });
    el.progressBar.max = total;
    el.progressBar.value = answeredCount(round);
    el.scoreOk.textContent = formatValue(round.correct);
    el.scoreBad.textContent = formatValue(round.wrong.length);
    el.scoreStreak.textContent = formatValue(round.streak || 0);
    var entry = currentEntry();
    el.qListen.hidden = !entry || !voice.has(entry.number);

    el.translit.classList.toggle('is-visible', state.hintVisible);
    el.hintBtn.setAttribute('aria-pressed', String(state.hintVisible));
    el.hintBtn.textContent = t(state.hintVisible ? 'q.hintHide' : 'q.hintShow');

    setKbdText(el.kbdHint, t(round.mode === 'choice' ? 'q.kbdChoice' : 'q.kbdTyped'));
    el.nextBtn.textContent = t(round.index + 1 >= total ? 'q.finish' : 'q.next');
  }

  function renderOptions() {
    var round = state.round;
    if (!round || round.mode !== 'choice') {
      el.options.replaceChildren();
      return;
    }
    var buttons = state.options.map(function (number, index) {
      var entry = state.byNumber.get(number);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'option';
      button.setAttribute('data-value', String(number));

      var key = span('option__key', String(index + 1));
      key.setAttribute('aria-hidden', 'true');
      var mark = span('option__mark');
      button.append(key, span('option__num', String(number)), span('option__word', translation(entry)), mark);
      button.addEventListener('click', function () { answer(number, null); });
      return button;
    });
    el.options.replaceChildren.apply(el.options, buttons);
  }

  function toggleHint() {
    state.hintVisible = !state.hintVisible;
    renderQuestionTexts();
  }

  /* ---------- answering ---------- */

  function normalise(text, umlautToBase) {
    var value = String(text).toLowerCase().normalize('NFC').trim();
    value = value.replace(/ß/g, 'ss');
    if (umlautToBase) value = value.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
    else value = value.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
    return value.replace(/[\s\-‐‑–—'’ʼ`´".,!?]/g, '');
  }

  /** Accepts digits, the number word in any of the three languages, or the transliteration. */
  function matchesTyped(input, entry) {
    var trimmed = input.trim();
    if (/^\d{1,3}$/.test(trimmed)) return Number(trimmed) === entry.number;
    var candidates = [entry.uk, entry.de, entry.en, entry.translit, entry.georgian];
    return [false, true].some(function (umlautToBase) {
      var typed = normalise(trimmed, umlautToBase);
      return typed.length > 0 && candidates.some(function (word) {
        return normalise(word, umlautToBase) === typed;
      });
    });
  }

  function onTypedSubmit(event) {
    event.preventDefault();
    if (!state.round || state.round.answered) return;
    var value = el.input.value;
    if (!value.trim()) {
      el.input.setAttribute('aria-invalid', 'true');
      showFeedbackMessage(t('q.empty'), 'hint');
      el.input.focus();
      return;
    }
    var entry = currentEntry();
    answer(matchesTyped(value, entry) ? entry.number : null, value.trim());
  }

  /**
   * @param {number|null} chosen  number picked (choice) or matched (typed); null = no match
   * @param {string|null} typedText  raw input in typed mode
   */
  function answer(chosen, typedText) {
    var round = state.round;
    if (!round || round.answered) return;
    var entry = currentEntry();
    var isCorrect = chosen === entry.number;

    round.answered = true;
    if (isCorrect) {
      round.correct += 1;
      round.streak = (round.streak || 0) + 1;
      round.bestStreak = Math.max(round.bestStreak || 0, round.streak);
      if (round.streak > state.progress.bestStreak) state.progress.bestStreak = round.streak;
    } else {
      round.wrong.push(entry.number);
      round.streak = 0;
    }
    round.lastTyped = typedText;
    round.lastChosen = chosen;
    recordAnswer(entry.number, isCorrect);
    saveRound();
    state.answeredAt = Date.now();

    markOptions(chosen, entry.number);
    el.options.classList.add('just-answered');
    if (round.mode === 'typed') {
      el.input.readOnly = true;
      el.checkBtn.disabled = true;
      el.checkBtn.hidden = true;
      el.input.classList.add(isCorrect ? 'is-right' : 'is-wrong');
      if (!isCorrect) el.input.setAttribute('aria-invalid', 'true');
    }

    renderFeedback(isCorrect, entry, typedText);
    el.feedback.classList.add('feedback--anim');
    renderQuestionTexts();
    if (isCorrect) restartClass(el.streakPill, 'is-bumped');
    renderTableRow(entry.number);

    el.nextBtn.hidden = false;
    el.nextBtn.focus();
  }

  function markOptions(chosen, correct) {
    el.options.querySelectorAll('.option').forEach(function (button) {
      var value = Number(button.getAttribute('data-value'));
      var mark = button.querySelector('.option__mark');
      button.disabled = true;
      mark.replaceChildren();
      if (value === correct) {
        button.classList.add('is-correct');
        mark.append(svgIcon('ok'), span('visually-hidden', ', ' + t('option.correct')));
      } else if (value === chosen) {
        button.classList.add('is-wrong');
        mark.append(svgIcon('bad'), span('visually-hidden', ', ' + t('option.yours')));
      } else {
        button.classList.add('is-muted');
      }
    });
  }

  function showFeedbackMessage(text, kind) {
    el.feedback.className = 'feedback feedback--' + kind;
    el.feedback.replaceChildren(span('feedback__title', text));
  }

  function renderFeedback(isCorrect, entry, typedText) {
    el.feedback.className = 'feedback ' + (isCorrect ? 'feedback--ok' : 'feedback--bad');
    var icon = span('feedback__icon');
    icon.appendChild(svgIcon(isCorrect ? 'ok' : 'bad'));

    var body = span('feedback__body');
    body.append(span('feedback__title', t(isCorrect ? 'fb.correct' : 'fb.wrong')));

    var detail = span('feedback__detail');
    if (!isCorrect) detail.append(span('', t('fb.answerIs') + ' '));
    detail.append(
      span('feedback__num', String(entry.number)),
      document.createTextNode(' = '),
      span('feedback__ka', entry.georgian, 'ka'),
      document.createTextNode(' '),
      span('feedback__translit', '(' + entry.translit + ')', 'ka-Latn'),
      document.createTextNode(', ' + translation(entry))
    );
    body.append(detail);

    if (!isCorrect && typedText) {
      body.append(span('feedback__typed', t('fb.youTyped', { answer: typedText })));
    }
    // The streak is read out once per answer, as part of this polite status message.
    var streak = state.round ? state.round.streak : 0;
    if (isCorrect && streak >= 2) {
      body.append(span('feedback__streak', t('fb.streak', { n: streak })));
    }
    el.feedback.replaceChildren(icon, body);
  }

  /** Remove and re-add a class so its CSS animation plays again. */
  function restartClass(node, name) {
    node.classList.remove(name);
    void node.offsetWidth;
    node.classList.add(name);
  }

  function goNext(fromKeyboard) {
    var round = state.round;
    if (!round || !round.answered) return;
    if (fromKeyboard && Date.now() - state.answeredAt < NEXT_GUARD_MS) return;
    round.answered = false;
    round.index += 1;
    saveRound();
    if (round.index >= round.queue.length) finishRound();
    else showQuestion(true);
  }

  function finishRound() {
    var round = state.round;
    var total = round.queue.length;
    var percent = Math.round((round.correct / total) * 100);

    state.progress.rounds += 1;
    if (!round.retry) {
      state.progress.best = state.progress.best === null ? percent : Math.max(state.progress.best, percent);
    }
    saveProgress();

    state.lastResult = {
      mode: round.mode,
      range: round.range,
      total: total,
      correct: round.correct,
      percent: percent,
      wrong: round.wrong.slice(),
      streak: round.bestStreak || 0
    };
    store.set('lastResult', state.lastResult);
    state.round = null;
    saveRound();

    renderResult();
    showScreen('result');
    focusSoon(el.resultTitle);
  }

  /* ------------------------------------------------------------------ */
  /* Result screen                                                       */
  /* ------------------------------------------------------------------ */

  function renderResult() {
    var result = state.lastResult;
    if (!result) return;

    el.rCorrect.textContent = formatValue(result.correct);
    el.rTotal.textContent = formatValue(result.total);
    el.rPercent.textContent = t('result.percent', { p: result.percent });
    el.percentShort.textContent = formatPercent(result.percent);
    el.ringValue.setAttribute('stroke-dasharray', result.percent + ' 100');

    var messageKey = result.percent === 100 ? 'result.perfect'
      : result.percent >= 80 ? 'result.great'
      : result.percent >= 50 ? 'result.good'
      : 'result.low';
    el.rMessage.textContent = t(messageKey);
    el.rStreak.textContent = result.streak ? t('result.streak', { n: result.streak }) : '';

    var wrongCount = result.wrong.length;
    el.rWrongWrap.hidden = wrongCount === 0;
    el.retryBtn.hidden = wrongCount === 0;
    el.retryBtn.textContent = t('result.retry', { n: wrongCount });

    var unique = result.wrong.filter(function (n, i, list) { return list.indexOf(n) === i; });
    el.rWrong.replaceChildren.apply(el.rWrong, unique.map(function (number) {
      var entry = state.byNumber.get(number);
      var li = document.createElement('li');
      li.className = 'wrong__item';
      li.append(
        span('wrong__ka', entry.georgian, 'ka'),
        span('wrong__translit', entry.translit, 'ka-Latn'),
        span('wrong__answer', entry.number + ', ' + translation(entry))
      );
      return li;
    }));
  }

  function retryWrong() {
    var result = state.lastResult;
    if (!result || !result.wrong.length) return;
    state.settings.mode = result.mode;
    var unique = result.wrong.filter(function (n, i, list) { return list.indexOf(n) === i; });
    startRound(unique, true);
  }

  function playAgain() {
    var result = state.lastResult;
    if (result) {
      state.settings.mode = result.mode;
      state.settings.range = result.range;
    }
    startRound(numbersInRange(state.settings.range), false);
  }

  /* ------------------------------------------------------------------ */
  /* Number table                                                        */
  /* ------------------------------------------------------------------ */

  function statusCell(number) {
    var item = state.progress.items[number];
    var kind = item && item.last ? item.last : 'none';
    var cell = document.createElement('td');
    var badge = span('status status--' + kind);
    if (kind !== 'none') badge.appendChild(svgIcon(kind));
    badge.append(span('', t('status.' + kind)));
    cell.appendChild(badge);
    return cell;
  }

  function buildRow(entry) {
    var row = document.createElement('tr');
    row.setAttribute('data-number', String(entry.number));

    var num = document.createElement('th');
    num.scope = 'row';
    num.className = 'col-number';
    num.textContent = String(entry.number);

    var ka = document.createElement('td');
    ka.lang = 'ka';
    ka.className = 'col-ka';
    ka.textContent = entry.georgian;

    var tr = document.createElement('td');
    tr.lang = 'ka-Latn';
    tr.className = 'col-translit';
    tr.textContent = entry.translit;

    var word = document.createElement('td');
    word.textContent = translation(entry);

    row.append(num, ka, tr, word, statusCell(entry.number));
    return row;
  }

  function renderTable() {
    el.numbersBody.replaceChildren.apply(el.numbersBody, state.numbers.map(buildRow));
  }

  function renderTableRow(number) {
    var row = el.numbersBody.querySelector('tr[data-number="' + number + '"]');
    if (row) row.replaceWith(buildRow(state.byNumber.get(number)));
  }

  /* ------------------------------------------------------------------ */
  /* Counting in twenties: the "take a number apart" card                */
  /* ------------------------------------------------------------------ */

  var TEEN_END = 'მეტი'; // "more": every word from 11 to 19 ends like this

  /**
   * Splits a number from the data into parts. Nothing is made up: every
   * part is cut from the words in numbers.json, and if the pieces don't
   * spell the word exactly, the word is shown whole.
   */
  function breakdown(n) {
    var entry = state.byNumber.get(n);
    var and = t('tw.and');
    var unit = state.byNumber.get(n > 20 ? n - 20 : n - 10);
    var twenty = state.byNumber.get(20);
    var stem = twenty ? twenty.georgian.slice(0, -1) : ''; // ოცი -> ოც

    if (n > 20 && unit && stem + 'და' + unit.georgian === entry.georgian) {
      return {
        parts: [[stem, '20', 'twenty'], ['და', and, 'link'], [unit.georgian, String(n - 20), 'unit']],
        sum: '20 + ' + (n - 20) + ' = ' + n,
        literal: t('tw.literal', { text: translation(twenty) + ' ' + and + ' ' + translation(unit) }),
        note: t('tw.note.after')
      };
    }
    if (n > 10 && n < 20 && unit && entry.georgian.slice(-TEEN_END.length) === TEEN_END) {
      return {
        parts: [[entry.georgian.slice(0, -TEEN_END.length), String(n - 10), 'unit'], [TEEN_END, t('tw.moreWord'), 'link']],
        sum: '10 + ' + (n - 10) + ' = ' + n,
        literal: '',
        note: t('tw.note.teen', { word: translation(unit) })
      };
    }
    return {
      parts: [[entry.georgian, String(n), n === 20 ? 'twenty' : 'unit']],
      sum: '',
      literal: '',
      note: t(n === 0 ? 'tw.note.zero' : n === 20 ? 'tw.note.twenty' : 'tw.note.base')
    };
  }

  function partNode(part) {
    var node = span('tw-part tw-part--' + part[2]);
    node.append(span('tw-part__ka', part[0], 'ka'), span('tw-part__val', part[1]));
    return node;
  }

  var twTimer = 0;

  function renderTwenties(animate) {
    if (!el.twRange || !state.numbers.length) return;
    var n = Number(el.twRange.value);
    var entry = state.byNumber.get(n);
    if (!entry) return;
    var info = breakdown(n);

    el.twNum.textContent = String(n);
    el.twWord.textContent = entry.georgian;
    el.twTranslit.textContent = entry.translit;
    el.twParts.replaceChildren.apply(el.twParts, info.parts.map(partNode));
    el.twSum.textContent = info.sum;
    el.twSum.hidden = !info.sum;
    el.twLiteral.textContent = info.literal;
    el.twLiteral.hidden = !info.literal;
    el.twNote.textContent = info.note;
    el.twListen.hidden = !voice.has(n);

    if (animate && !reducedMotion()) {
      restartClass(el.twParts, 'is-lighting');
      restartClass(el.twSum, 'is-lighting');
    }

    // Screen readers hear one short summary once the slider stops moving.
    window.clearTimeout(twTimer);
    if (animate) {
      twTimer = window.setTimeout(function () {
        el.twStatus.replaceChildren(
          document.createTextNode(n + ', '),
          span('', entry.georgian, 'ka'),
          document.createTextNode(info.sum ? ', ' + info.sum.split(' = ')[0] : '')
        );
      }, 700);
    }
  }

  function stepTwenties(delta) {
    var next = Math.min(30, Math.max(0, Number(el.twRange.value) + delta));
    if (next === Number(el.twRange.value)) return;
    el.twRange.value = String(next);
    renderTwenties(true);
  }

  /** The 30 = ოც + და + ათი demo plays once when it scrolls into view. */
  function setupDemo() {
    if (!el.demo || reducedMotion() || !('IntersectionObserver' in window)) return;
    el.replay.hidden = false;
    el.demo.classList.add('is-waiting');
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      playDemo();
    }, { threshold: 0.4 });
    observer.observe(el.demo);
  }

  function playDemo() {
    el.demo.classList.remove('is-waiting');
    restartClass(el.demo, 'is-playing');
  }

  /* ------------------------------------------------------------------ */
  /* Language change while a screen is open                              */
  /* ------------------------------------------------------------------ */

  function refreshCurrentScreen() {
    if (!state.numbers.length) {
      return;
    }
    renderTable();
    renderTwenties(false);
    if (state.screen === 'start') {
      renderStart();
    } else if (state.screen === 'question' && state.round) {
      renderQuestionTexts();
      if (state.round.answered) {
        var entry = currentEntry();
        // Re-render translated option labels and feedback, keep the marks.
        renderOptions();
        markOptions(state.round.lastChosen, entry.number);
        renderFeedback(state.round.lastChosen === entry.number, entry, state.round.lastTyped);
      } else {
        renderOptions();
      }
    } else if (state.screen === 'result') {
      renderResult();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Keyboard                                                            */
  /* ------------------------------------------------------------------ */

  function onKeydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
    if (state.screen !== 'question' || !state.round) return;

    var target = event.target;
    var tag = target && target.tagName;
    var inTextField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target && target.isContentEditable);

    // 1-4 picks an answer (multiple choice only, never while typing in a field).
    if (!inTextField && state.round.mode === 'choice' && !state.round.answered && /^[1-4]$/.test(event.key)) {
      var index = Number(event.key) - 1;
      if (index < state.options.length) {
        event.preventDefault();
        answer(state.options[index], null);
      }
      return;
    }

    // Enter continues - unless focus is on a control that handles Enter itself.
    if (event.key === 'Enter' && state.round.answered) {
      var ownEnter = tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || tag === 'TEXTAREA';
      if (!ownEnter) {
        event.preventDefault();
        goNext(true);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Wiring                                                              */
  /* ------------------------------------------------------------------ */

  function wire() {
    el.langButtons.addEventListener('click', function (event) {
      var button = event.target.closest('[data-lang]');
      if (button) setLanguage(button.getAttribute('data-lang'), button.getAttribute('data-lang'));
    });

    el.startForm.addEventListener('submit', onStartSubmit);
    el.startForm.addEventListener('change', function () {
      var data = new FormData(el.startForm);
      state.settings.mode = data.get('mode') === 'typed' ? 'typed' : 'choice';
      state.settings.range = data.get('range') || 'all';
      saveSettings();
    });
    el.resumeBtn.addEventListener('click', function () { whenReady(resumeRound); });
    el.resetBtn.addEventListener('click', onResetClick);

    el.hintBtn.addEventListener('click', toggleHint);
    el.typedForm.addEventListener('submit', onTypedSubmit);
    el.input.addEventListener('input', function () {
      if (!state.round || state.round.answered) return;
      el.input.removeAttribute('aria-invalid');
      if (el.feedback.classList.contains('feedback--hint')) {
        el.feedback.replaceChildren();
        el.feedback.className = 'feedback';
      }
    });
    el.nextBtn.addEventListener('click', function (event) {
      // event.detail === 0 means the click came from the keyboard (Enter / Space).
      goNext(event.detail === 0);
    });
    el.quitBtn.addEventListener('click', function () { openStart(true); });

    el.retryBtn.addEventListener('click', retryWrong);
    el.againBtn.addEventListener('click', playAgain);
    el.settingsBtn.addEventListener('click', function () { openStart(true); });

    el.qListen.addEventListener('click', function () {
      var entry = currentEntry();
      if (entry) voice.play(entry.number);
    });
    el.twRange.addEventListener('input', function () { renderTwenties(true); });
    document.querySelectorAll('.tw-step').forEach(function (button) {
      button.addEventListener('click', function () { stepTwenties(Number(button.getAttribute('data-step'))); });
    });
    el.twListen.addEventListener('click', function () { voice.play(Number(el.twRange.value)); });
    el.replay.addEventListener('click', playDemo);

    document.addEventListener('keydown', onKeydown);
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  function pickInitialLanguage() {
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get('lang');
    } catch (error) { /* ignore */ }
    if (fromUrl && LANG_CODES.indexOf(fromUrl) !== -1) return fromUrl;
    var saved = store.get('lang', null);
    return LANG_CODES.indexOf(saved) !== -1 ? saved : I18N.defaultLang;
  }

  /**
   * The start screen is rendered straight away (it needs no data), so the
   * layout never jumps when numbers.json arrives. A click on "Start" that
   * comes before the data is queued in state.pending and run afterwards.
   */
  function boot() {
    state.lang = pickInitialLanguage();
    applyStaticStrings();
    el.storageNotice.hidden = store.available;
    loadPersisted();
    openStart(false);
    document.documentElement.classList.remove('i18n-pending');
    wire();
    setupDemo();
    registerServiceWorker();

    loadNumbers()
      .then(function (data) {
        if (!isValidData(data)) throw new Error('Invalid numbers data');
        state.numbers = data.numbers.slice().sort(function (a, b) { return a.number - b.number; });
        state.numbers.forEach(function (entry) { state.byNumber.set(entry.number, entry); });
        state.lastResult = validResult(store.get('lastResult', null));
        if (state.round && !isValidRound(state.round)) {
          state.round = null;
          saveRound();
        }
        renderTable();
        renderTwenties(false);
        // Listen buttons appear only once the manifest says a recording exists.
        voice.ready.then(function () {
          renderTwenties(false);
          if (state.screen === 'question' && state.round) renderQuestionTexts();
        });
        if (state.screen === 'start') renderStart();
        if (state.pending) {
          var pending = state.pending;
          state.pending = null;
          pending();
        }
      })
      .catch(function () {
        el.screens.loading.classList.add('is-error');
        el.loadingText.setAttribute('data-i18n', 'quiz.error');
        el.loadingText.textContent = t('quiz.error');
        showScreen('loading');
      });
  }

  /**
   * Offline support: sw.js keeps a copy of the app, so it also works on the
   * marshrutka without signal. Service workers need https (or localhost), so
   * nothing happens when the page is opened from disk.
   */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    var secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!secure) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode is a bonus */ });
    });
  }

  /** Run `action` now, or as soon as the numbers are loaded. */
  function whenReady(action) {
    if (state.numbers.length) action();
    else state.pending = action;
  }

  boot();
})();
