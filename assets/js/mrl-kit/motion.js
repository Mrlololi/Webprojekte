// mrl-kit motion.js VERSION 6f5d1a53dec8 (vendored from mrlololi-site/site/assets/js/kit/; do not edit here, run tools/sync-mrl-kit.mjs)
// Stage 6c: one controller for every demo (hero line, problem cards, price pictures, process steps,
// tool row, KI demo, 404 scene). Iva's rule (29.10.2026): a demo loops calmly while it is visible.
// - The HTML shows the end frame (solved), for no JS and reduced motion.
// - Visible enough (a third of it, or a third of the window for tall ones): it plays from its start
//   frame, rests on its end frame for a moment and plays again, for as long as it stays visible.
// - Off-screen or hidden tab: it stops and goes back to its start frame, so the next entry plays
//   forward again (never «solved», then a jump back to «broken»).
// - Every looping demo has a pause button (WCAG 2.2.2, 44 px, «Pause» / «Abspielen»); a paused
//   demo shows its end frame and stays paused for the visit (sessionStorage).
// - Reduced motion: no autoplay, the end frame; the button steps through the frames (demos with a
//   single frame hide it there, so no button does nothing).
// Stage 6f (4.11.2026), one conductor:
// - Only the demo nearest the centre of the window plays; the rows (tools, «Weitere Leistungen»)
//   follow the same rule now. It is decided again while scrolling.
// - After each round at least 2.5 s on the end frame, then a soft reset: it fades to grey (class
//   is-fading) before the start frame, never a hard cut.
// - One global «Bewegung pausieren» (footer, localStorage): every demo stays on its end frame.
// The demo element carries data-play="start|run|end" for the CSS; without it the CSS shows the end.
// Stage 7a (11.11.2026): this file is the shared motion core of the mascot kit (assets/js/kit/). The
// main site imports it directly; Webprojekte keeps a vendored copy (site/assets/js/mrl-kit/, checked by
// tools/sync-mrl-kit.mjs). Same attribute and key on both: html[data-motion="paused"] and localStorage
// «motion-paused» (one origin, so a pause on mrlololi.com holds on /Webprojekte/ too).
// Two options for a row of pictures that take turns (the Webprojekte hub): rotate (when one round
// ends, the next visible one in page order plays; pointing at or focusing its card takes the turn) and
// idle: 'end' (a picture that waits shows its finished frame, not its start frame).
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const all = [];
let io = null;
let lastTurn = null; // rotate: the demo whose round ended last
const SHARE = 1 / 3;
const MIN_REST = 2500;
const FADE = 450;

const store = {
  get: (k) => { try { return sessionStorage.getItem(`demo-paused:${k}`) === '1'; } catch { return false; } },
  set: (k, v) => { try { sessionStorage.setItem(`demo-paused:${k}`, v ? '1' : '0'); } catch { /* not kept */ } },
};

// The global pause, remembered across visits (a convenience: without storage it simply starts off).
export const motion = {
  paused: (() => { try { return localStorage.getItem('motion-paused') === '1'; } catch { return false; } })(),
  set(v) {
    this.paused = v;
    try { localStorage.setItem('motion-paused', v ? '1' : '0'); } catch { /* not kept */ }
    document.documentElement.dataset.motion = v ? 'paused' : 'on';
    document.dispatchEvent(new CustomEvent('motion:change', { detail: v }));
    for (const d of all) { if (d.looping) stop(d, 'end'); else if (v) { d.hooks.finish(); set(d, 'end'); } paint(d); }
    decide();
  },
};
document.documentElement.dataset.motion = motion.paused ? 'paused' : 'on';

// The toggle «Bewegung pausieren» / «Bewegung abspielen» (Stage 6g: in the header and the footer, one
// state; every toggle shows it).
export function initMotionToggle() {
  const toggles = [...document.querySelectorAll('.motion-toggle')];
  const label = () => toggles.forEach((b) => {
    b.setAttribute('aria-pressed', String(motion.paused));
    // Webprojekte: a button without label attributes holds both texts in both languages (CSS shows one).
    if (!b.dataset.pauseLabel) return;
    const text = motion.paused ? b.dataset.playLabel : b.dataset.pauseLabel;
    const span = b.querySelector('.motion-toggle__text');
    if (span) span.textContent = text; else b.textContent = text;
    b.setAttribute('aria-label', text);
  });
  toggles.forEach((b) => { b.hidden = false; b.addEventListener('click', () => motion.set(!motion.paused)); });
  document.addEventListener('motion:change', label);
  label();
}

function observer() {
  if (io) return io;
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const d = all.find((x) => x.el === e.target);
      if (!d) continue;
      d.enough = e.isIntersecting && (e.intersectionRatio >= SHARE || e.intersectionRect.height >= SHARE * innerHeight);
    }
    decide();
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
  document.addEventListener('visibilitychange', decide);
  reduceMotion.addEventListener('change', () => { all.forEach((d) => { if (d.looping) stop(d, 'end'); paint(d); }); decide(); });
  // Nearest to the centre changes while scrolling, also without crossing a threshold.
  let queued = false;
  addEventListener('scroll', () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; decide(); }); }, { passive: true });
  return io;
}

const set = (d, phase) => { d.phase = phase; d.el.dataset.play = phase; d.hooks.state?.(phase); };
const distance = (d) => { const r = d.el.getBoundingClientRect(); return Math.abs((r.top + r.bottom) / 2 - innerHeight / 2); };

// The free demo nearest the centre loops; every other one holds its start frame (its end, when paused).
function decide() {
  const can = (d) => d.auto && d.enough && !d.paused && !motion.paused && !document.hidden && !reduceMotion.matches;
  const free = all.filter(can);
  const best = turn(free) || free.sort((a, b) => distance(a) - distance(b))[0];
  for (const d of all) {
    if (!d.auto) continue;
    if (d === best) { if (!d.looping) { d.looping = true; begin(d); } continue; }
    const still = d.paused || motion.paused || reduceMotion.matches || d.idle === 'end';
    if (d.looping) stop(d, still ? 'end' : 'start');
    else if (!still && d.phase !== 'start') { d.hooks.reset(); set(d, 'start'); }
  }
}

// Rotate: the one the visitor points at, else the one playing now, else the next after the last turn.
function turn(free) {
  const row = all.filter((d) => d.rotate);
  if (!row.length) return null;
  const ok = free.filter((d) => d.rotate);
  if (!ok.length) return null;
  const now = ok.find((d) => d.want) || ok.find((d) => d.looping);
  if (now) return now;
  const from = row.indexOf(lastTurn);
  for (let i = 1; i <= row.length; i++) { const d = row[(from + i + row.length) % row.length]; if (ok.includes(d)) return d; }
  return ok[0];
}

// A waiting picture that shows its finished frame fades out before it starts (no hard cut).
function begin(d) {
  if (d.idle !== 'end' || d.phase !== 'end') { cycle(d); return; }
  d.el.classList.add('is-fading');
  d.timer = setTimeout(() => { if (d.looping) cycle(d); else d.el.classList.remove('is-fading'); }, FADE);
}

function cycle(d) {
  clearTimeout(d.timer);
  d.el.classList.remove('is-fading');
  d.hooks.reset();
  set(d, 'start');
  void d.el.offsetWidth; // a reflow, so the CSS animations of «run» start again from 0
  set(d, 'run');
  d.el.dispatchEvent(new CustomEvent('demo:run'));
  const ms = d.hooks.play() ?? d.duration;
  wait(d, ms, () => {
    d.hooks.finish();
    set(d, 'end');
    wait(d, d.rest, () => {
      if (!d.looping) return;
      d.el.classList.add('is-fading');
      d.timer = setTimeout(() => {
        if (!d.looping) { d.el.classList.remove('is-fading'); return; }
        if (!d.rotate) { cycle(d); return; }
        // Rotate: hand the turn on; this picture comes back on its finished frame.
        lastTurn = d;
        d.want = false;
        stop(d, 'end');
        decide();
      }, FADE);
    });
  });
}

// Waits ms of time that is not held (hooks.held, e.g. the pointer on the screenshot), then fn.
function wait(d, ms, fn) {
  let left = ms;
  const step = () => {
    const dt = Math.min(left, 250);
    d.timer = setTimeout(() => { if (!d.hooks.held?.()) left -= dt; if (left <= 0) fn(); else step(); }, dt);
  };
  step();
}

function stop(d, frame) {
  d.looping = false;
  clearTimeout(d.timer);
  d.el.classList.remove('is-fading');
  if (frame === 'end') { d.hooks.finish(); set(d, 'end'); } else { d.hooks.reset(); set(d, 'start'); }
}

// The pause button: icon and label follow the state; under reduced motion it steps the frames.
function paint(d) {
  const b = d.button;
  if (!b) return;
  // A single-frame demo (a moving row) has nothing to step: no button there under reduced motion.
  if (reduceMotion.matches && d.frames < 2) b.setAttribute('data-wait', ''); else b.removeAttribute('data-wait');
  const mode = reduceMotion.matches ? 'step' : d.paused ? 'play' : 'pause';
  b.dataset.mode = mode;
  b.querySelector('.loopctl__text').textContent = b.dataset[`${mode}Label`];
  if (mode === 'step') b.removeAttribute('aria-pressed'); else b.setAttribute('aria-pressed', String(mode === 'play'));
}

// el: the demo root. hooks: reset() start frame, play() starts it and returns its length in ms,
// finish() end frame, frame(i) for reduced motion (0 = start ... frames - 1 = end), state(phase).
// rest: ms on the end frame before the next round (at least 2.5 s). loadMs: it already plays from CSS
// on load (hero, 404); the loop takes over after that. held(): true while the demo should hold. button: its pause button (or null). manual:
// never autoplays (a card inside a group that loops as a chain). ambient: kept for the callers, no
// longer outside the one-demo rule (Stage 6f).
// tap (Stage 6g): a click or tap on the picture itself (or on the elements tap names) pauses or resumes
// this demo; a small state icon shows on hover and for a moment after the tap (CSS [data-tap]).
// Links, buttons and fields inside keep their own meaning.
// rotate, idle, card (Stage 7a): see the top of this file; card is the element whose hover or focus
// takes the turn (default: the demo itself).
export function demo(el, { reset = () => {}, play = () => {}, finish = () => {}, frame, state, held, frames = 2, duration = 3000, rest = MIN_REST, loadMs = 0, button = null, manual = false, tap = false, key = el?.dataset.demo, rotate = false, idle = 'start', card = el }) {
  if (!el) return null;
  const d = { el, key, hooks: { reset, play, finish, state, held }, button, auto: !manual, phase: 'end', looping: false, enough: false, timer: 0, duration, rest: Math.max(MIN_REST, rest), frames, step: frames - 1, paused: Boolean(key) && store.get(key), rotate, idle, want: false };
  if (rotate && card) {
    const want = () => {
      if (d.want) return;
      d.want = true;
      for (const x of all) if (x !== d && x.rotate && x.looping) stop(x, 'end');
      decide();
    };
    card.addEventListener('pointerenter', want);
    card.addEventListener('focusin', want);
    card.addEventListener('pointerleave', () => { d.want = false; });
    card.addEventListener('focusout', () => { d.want = false; });
  }
  // For the demo's own controls: skip to the end of this round, or start a round now.
  d.skip = () => {
    if (d.phase !== 'run') return;
    clearTimeout(d.timer);
    finish();
    set(d, 'end');
    if (d.looping) d.timer = setTimeout(() => { if (d.looping) cycle(d); }, d.rest);
  };
  d.replay = () => { if (reduceMotion.matches || d.paused || motion.paused) { finish(); set(d, 'end'); } else if (d.looping) cycle(d); else decide(); };
  all.push(d);
  const toggle = () => {
    d.paused = !d.paused;
    if (key) store.set(key, d.paused);
    paint(d);
    if (d.paused) stop(d, 'end');
    decide();
  };
  if (tap && !manual) {
    const targets = typeof tap === 'string' ? [...el.querySelectorAll(tap)] : [el];
    const mark = () => targets.forEach((x) => { x.dataset.tap = d.paused ? 'paused' : 'on'; });
    mark();
    el.addEventListener('click', (e) => {
      const hit = targets.find((x) => x.contains(e.target));
      if (!hit || e.target.closest('a, button, input, select, textarea, summary, label, [role="button"]')) return;
      if (reduceMotion.matches || motion.paused) return;
      toggle();
      mark();
      hit.classList.add('is-flash');
      setTimeout(() => hit.classList.remove('is-flash'), 1200);
    });
  }
  if (button) {
    paint(d);
    button.addEventListener('click', () => {
      if (reduceMotion.matches) {
        d.step = (d.step + 1) % frames;
        if (frame) frame(d.step); else if (d.step === frames - 1) finish(); else reset();
        el.dataset.play = d.step === frames - 1 ? 'end' : 'start';
        return;
      }
      toggle();
    });
  }
  if (reduceMotion.matches || !('IntersectionObserver' in window) || manual) return d;
  if (d.paused || motion.paused || idle === 'end') set(d, 'end');
  else if (loadMs > 0) {
    // Leave the CSS alone while it plays on load, rest on its end frame, then the loop decides.
    d.auto = false;
    d.timer = setTimeout(() => { set(d, 'end'); d.timer = setTimeout(() => { d.auto = true; decide(); }, d.rest); }, loadMs);
  } else {
    reset();
    set(d, 'start');
  }
  observer().observe(el);
  return d;
}
