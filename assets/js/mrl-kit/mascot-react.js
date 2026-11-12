// mrl-kit mascot-react.js VERSION 6f5d1a53dec8 (vendored from mrlololi-site/site/assets/js/kit/; do not edit here, run tools/sync-mrl-kit.mjs)
// Mascot kit (Stage 7a, 11.11.2026): how Logik, Lösung and Live react. One source for the main site
// (assets/js/mascots.js builds the hero, the footer wave and the idles on top of it) and Webprojekte
// (vendored copy in site/assets/js/mrl-kit/, kept equal by tools/sync-mrl-kit.mjs).
// - setPose: swaps eyes, mouth, arms and accessory for another emotion (the body stays).
// - react: the shared hop plus one signature per mascot. Logik «Prüfblick» (tilts about 8°, thinks
//   400 ms, then joy), Lösung «Schraubdreh» (the wrench turns once, 500 ms), Live «Sternfunkeln» (the
//   star antenna wiggles three times, then a wave). No sound.
// - Reduced motion or «Bewegung pausieren»: nothing moves, only the happy face for 1.2 s (and the bubble).
// - initPoke: every group of mascots is ONE button (role="button", a name like «Logik, Lösung und Live
//   winken», a visible focus ring from the page CSS, at least 44 px). Click, tap, Enter or Space: the
//   reaction and a short bubble (aria-hidden) whose line one polite live region also reads out.
import { parts, MASCOTS } from './mascot-art.js';
import { reduceMotion, motion } from './motion.js';

export const KEYS = MASCOTS.map((m) => m.key);
const still = () => reduceMotion.matches || motion.paused;

export function setPose(svg, emo) {
  if (svg.dataset.emo === emo) return;
  const p = parts(Number(svg.dataset.mascot), emo);
  for (const [name, html] of Object.entries(p)) {
    const el = svg.querySelector(`[data-part="${name}"]`);
    if (el) el.innerHTML = html;
  }
  svg.dataset.emo = emo;
}

// Every running reaction of one mascot (animations and timers), so a new click starts it again cleanly.
const flights = new WeakMap();
function clear(svg) {
  const f = flights.get(svg);
  if (!f) return;
  f.anims.forEach((a) => a.cancel?.());
  f.timers.forEach(clearTimeout);
  flights.delete(svg);
}
function flight(svg) {
  clear(svg);
  const f = { anims: [], timers: [] };
  flights.set(svg, f);
  return f;
}
const later = (f, ms, fn) => f.timers.push(setTimeout(fn, ms));
const done = (svg) => { flights.delete(svg); delete svg.dataset.jumping; setPose(svg, svg.dataset.base || 'idle'); };

// The shared hop (Web Animations): happy face while in the air; then (end) a pose for a moment.
// height: % of the mascot's height. Without motion: the happy face for 1.2 s, nothing moves.
export function jump(svg, height = 30, { end = null, f = flight(svg) } = {}) {
  svg.dataset.jumping = 'true';
  setPose(svg, 'joy');
  if (still() || !svg.animate) { later(f, 1200, () => done(svg)); return f; }
  const a = svg.animate([
    { transform: 'translateY(0) scale(1.1, 0.9)', easing: 'ease-out' },
    { transform: `translateY(-${height}%) scale(0.94, 1.06)`, offset: 0.45, easing: 'ease-in' },
    { transform: 'translateY(0) scale(1.08, 0.92)', offset: 0.82, easing: 'ease-out' },
    { transform: 'none' },
  ], { duration: 650 });
  f.anims.push(a);
  a.onfinish = () => {
    if (!end) { done(svg); return; }
    setPose(svg, end.pose);
    later(f, end.ms, () => done(svg));
  };
  return f;
}

// An SVG group turning around a point of the 100 grid (view-box units).
function turnPart(f, el, origin, frames, opts) {
  if (!el?.animate) return;
  el.style.transformBox = 'view-box';
  el.style.transformOrigin = origin;
  const a = el.animate(frames, opts);
  a.onfinish = () => { el.style.transformOrigin = ''; el.style.transformBox = ''; };
  f.anims.push(a);
}

// The hop plus the mascot's signature. height: see jump().
export function react(svg, height = 26) {
  const i = Number(svg.dataset.mascot);
  const f = flight(svg);
  if (still() || !svg.animate) return jump(svg, height, { f });
  if (i === 0) {
    // Logik «Prüfblick»: a look with the head tilted, thinking, then the happy hop.
    setPose(svg, 'think');
    svg.dataset.jumping = 'true';
    const tilt = svg.animate([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-8deg)', offset: 0.3 },
      { transform: 'rotate(-8deg)', offset: 0.75 },
      { transform: 'rotate(0deg)' },
    ], { duration: 520, easing: 'ease-in-out' });
    svg.style.transformOrigin = '50% 85%';
    f.anims.push(tilt);
    tilt.onfinish = () => { svg.style.transformOrigin = ''; jump(svg, height, { f }); };
    return f;
  }
  jump(svg, height, { f, end: i === 2 ? { pose: 'wave', ms: 900 } : null });
  const acc = svg.querySelector('[data-part="accessory"]');
  if (i === 1) {
    // Lösung «Schraubdreh»: the wrench turns once around the hand that holds it.
    const m = acc?.firstElementChild?.getAttribute('transform')?.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
    if (m) turnPart(f, acc, `${m[1]}px ${m[2]}px`, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 500, easing: 'ease-in-out' });
  } else if (i === 2) {
    // Live «Sternfunkeln»: the star antenna wiggles three times.
    turnPart(f, acc, '50px 18px', [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0deg)' }], { duration: 220, iterations: 3, easing: 'ease-in-out' });
  }
  return f;
}

/* ---------- Bubble and live region ---------- */
// say: { one: '{name} winkt', many: '{names} winken', and: 'und', lines: { logik: [...], live: [...],
// footer: [...], legal: [...] } }. A group with data-say="footer" speaks those lines, else the lines of
// the mascot that was clicked.
let say = null;
const last = new Map();
let live = null;

function liveRegion() {
  if (live) return live;
  live = document.createElement('p');
  live.setAttribute('aria-live', 'polite');
  live.dataset.mascotLive = '';
  Object.assign(live.style, { position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: '0', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: '0' });
  document.body.append(live);
  return live;
}

export function speak(host, svgs) {
  if (!say) return;
  const key = KEYS[Number(svgs[0]?.dataset.mascot)] || 'live';
  const group = host.closest?.('[data-say]')?.dataset.say;
  const set = (group && say.lines[group]) || say.lines[key] || [];
  if (!set.length) return;
  const id = group && say.lines[group] ? group : key;
  let i = Math.floor(Math.random() * set.length);
  if (set.length > 1 && i === last.get(id)) i = (i + 1) % set.length;
  last.set(id, i);
  const box = host instanceof SVGElement ? host.parentElement : host;
  if (getComputedStyle(box).position === 'static') box.style.position = 'relative'; // no shift: no offsets
  box.querySelector(':scope > .mbubble')?.remove();
  const b = document.createElement('span');
  b.className = 'mbubble';
  b.setAttribute('aria-hidden', 'true');
  b.textContent = set[i];
  box.append(b);
  // Near the edge of the window (a mascot at the right of a phone screen): moved inside, 8 px clear.
  const edge = b.getBoundingClientRect();
  const dx = Math.min(0, innerWidth - 8 - edge.right) + Math.max(0, 8 - edge.left);
  if (dx) b.style.marginLeft = `${Math.round(dx)}px`;
  setTimeout(() => b.remove(), 2400);
  const r = liveRegion();
  r.textContent = '';
  setTimeout(() => { r.textContent = `${MASCOTS[KEYS.indexOf(key)].name}: ${set[i]}`; }, 50);
}

/* ---------- Groups ---------- */
const labelOf = (svgs) => {
  const names = svgs.map((s) => MASCOTS[Number(s.dataset.mascot)].name);
  return names.length === 1 ? say.one.replace('{name}', names[0]) : say.many.replace('{names}', `${names.slice(0, -1).join(', ')} ${say.and} ${names.at(-1)}`);
};

// A page that switches its language without a reload (Webprojekte apps): new lines and names.
export function setLines(lines) {
  say = lines;
  if (!say) return;
  document.querySelectorAll('[data-poke][role="button"]').forEach((g) => g.setAttribute('aria-label', labelOf([...g.querySelectorAll('svg.mascot')])));
}

export function prepare(g) {
  if ('poke' in g.dataset) return;
  const svgs = [...g.querySelectorAll('svg.mascot')];
  if (!svgs.length || !say) return;
  const label = labelOf(svgs);
  g.dataset.poke = '';
  // Inside a picture hidden from screen readers: clickable only, no tab stop there (a focusable
  // element may not sit inside aria-hidden). Inside a link: the link keeps its meaning.
  if (g.parentElement?.closest('[aria-hidden="true"], a')) return;
  g.setAttribute('role', 'button');
  g.tabIndex = 0;
  g.setAttribute('aria-label', label);
  g.removeAttribute('aria-hidden');
  svgs.forEach((s) => s.setAttribute('aria-hidden', 'true'));
}

export function hit(g, target) {
  const one = target?.closest?.('svg.mascot');
  const svgs = one ? [one] : [...g.querySelectorAll('svg.mascot')];
  svgs.forEach((s, i) => setTimeout(() => react(s, 22), i * 90));
  speak(g, svgs);
}

// groups: a selector for the mascot groups. Groups added later are prepared when they appear.
export function initPoke({ lines, groups }) {
  say = lines;
  if (!say) return;
  const all = (root) => { if (root.matches?.(groups)) prepare(root); root.querySelectorAll?.(groups).forEach(prepare); };
  all(document);
  new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) all(n); }))).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (e) => {
    const g = e.target.closest?.('[data-poke]');
    if (g) hit(g, e.target);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const g = e.target.closest?.('[data-poke]');
    if (!g || e.target !== g) return;
    e.preventDefault();
    hit(g);
  });
}
