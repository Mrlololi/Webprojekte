// mrl-kit mascot-react.js VERSION d2757e6cb059 (vendored from mrlololi-site/site/assets/js/kit/; do not edit here, run tools/sync-mrl-kit.mjs)
// Mascot kit (Stage 7a, 11.11.2026): how Logik, Lösung and Live react. One source for the main site
// (assets/js/mascots.js builds the hero, the footer wave and the idles on top of it) and Webprojekte
// (vendored copy in site/assets/js/mrl-kit/, kept equal by tools/sync-mrl-kit.mjs).
// - setPose: swaps eyes, mouth, arms and accessory for another emotion (the body stays).
// - react: the shared hop plus one signature per mascot. Logik «Prüfblick» (tilts about 8°, thinks
//   400 ms, then joy), Lösung «Schraubdreh» (the wrench turns once, 500 ms), Live «Sternfunkeln» (the
//   star antenna wiggles three times, then a wave). No sound.
// - Reduced motion or «Bewegung pausieren»: nothing moves, only the happy face for 1.2 s.
// - initPoke: every group of mascots is ONE button (role="button", a name like «Logik, Lösung und Live
//   winken», a visible focus ring from the page CSS, at least 44 px). Click, tap, Enter or Space:
//   silent reaction only (R7, 25.11.2026: no speech bubble, no live-region text).
import { parts, MASCOTS } from './mascot-art.js';
import { reduceMotion, motion } from './motion.js';

export const KEYS = MASCOTS.map((m) => m.key);
const still = () => reduceMotion.matches || motion.paused;

// Design system 5.1 rule 7 (Iva 18.11.2026): smooth, never abrupt. A pose change crossfades (220 ms): the
// old drawing of a part fades out on top while the new one fades in; still (reduced motion, paused): at once.
const FADE = 220;
export function setPose(svg, emo) {
  if (svg.dataset.emo === emo) return;
  const p = parts(Number(svg.dataset.mascot), emo);
  const soft = !still() && Boolean(svg.animate);
  for (const [name, html] of Object.entries(p)) {
    const el = svg.querySelector(`[data-part="${name}"]`);
    if (!el || el.innerHTML === html || el.firstElementChild?.matches?.('[data-pose-in]') && el.firstElementChild.innerHTML === html) continue;
    if (soft) {
      // The old drawing as a copy without data-part (nobody animates or finds it), fading out on top. Every
      // element of the copy keeps the pose its original shows right now (a waving arm, a turning wrench);
      // the originals are not touched, so their running animations end where they were going to.
      svg.querySelectorAll(`[data-fading="${name}"]`).forEach((x) => x.remove());
      const old = el.cloneNode(true);
      const src = [el, ...el.querySelectorAll('*')];
      [old, ...old.querySelectorAll('*')].forEach((x, k) => {
        const t = getComputedStyle(src[k]).transform;
        if (t && t !== 'none') x.style.transform = t;
      });
      old.removeAttribute('data-part');
      old.setAttribute('data-fading', name);
      old.querySelectorAll('[class]').forEach((x) => x.classList.remove('m-wave', 'm-eye'));
      el.after(old);
      old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => old.remove();
      // The new drawing fades in inside the part (the part itself never jumps: it stays at full opacity).
      el.innerHTML = `<g data-pose-in>${html}</g>`;
      el.firstElementChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, easing: 'ease-in-out' });
    } else el.innerHTML = html;
  }
  svg.dataset.emo = emo;
}

// Every running reaction of one mascot (animations and timers). A new click does not reset the mascot:
// the running animations keep their current pose (commitStyles) and the next movement starts from there.
const flights = new WeakMap();
function clear(svg) {
  const f = flights.get(svg);
  if (!f) return;
  f.anims.forEach((a) => {
    try { if (a.playState === 'running' && a.effect?.target?.isConnected) a.commitStyles(); } catch { /* not rendered */ }
    a.cancel?.();
  });
  f.timers.forEach(clearTimeout);
  flights.delete(svg);
}
// The pose a new movement starts from: the committed inline transform (after clear), else none. The inline
// value is dropped, the animation takes over from exactly there.
function from(el) {
  const t = el.style.transform || 'none';
  el.style.transform = '';
  return t;
}
// A part that was turned (wrench, star) and interrupted: eases back to rest from where it stands.
function settle(f, el, ms = 260) {
  if (!el?.style.transform) return;
  const t = from(el);
  if (t === 'none') return;
  // Back by the angle (a matrix would be interpolated as a matrix and shrink the part on the way).
  const m = new DOMMatrixReadOnly(t);
  const deg = Math.atan2(m.b, m.a) * 180 / Math.PI;
  const a = el.animate([{ transform: `rotate(${deg}deg)` }, { transform: 'rotate(0deg)' }], { duration: ms, easing: 'ease-out' });
  f.anims.push(a);
}
function flight(svg) {
  clear(svg);
  const f = { anims: [], timers: [] };
  flights.set(svg, f);
  return f;
}
const later = (f, ms, fn) => f.timers.push(setTimeout(fn, ms));
const done = (svg) => { flights.delete(svg); delete svg.dataset.jumping; svg.style.transformOrigin = ''; setPose(svg, svg.dataset.base || 'idle'); };

// The shared hop (Web Animations): happy face while in the air; then (end) a pose for a moment.
// height: % of the mascot's height. Without motion: the happy face for 1.2 s, nothing moves.
export function jump(svg, height = 30, { end = null, f = flight(svg) } = {}) {
  svg.dataset.jumping = 'true';
  setPose(svg, 'joy');
  if (still() || !svg.animate) { svg.style.transform = ''; later(f, 1200, () => done(svg)); return f; }
  // A wrench or star that an interrupted reaction left turned eases back to rest (never stays frozen).
  settle(f, svg.querySelector('[data-part="accessory"]'));
  // Rule 7: the hop starts from the current pose (a hop that was interrupted, a tilt) and squashes softly
  // (no instant squash in the first frame); it ends in the rest pose.
  const a = svg.animate([
    { transform: from(svg), easing: 'ease-in-out' },
    { transform: 'translateY(0) scale(1.08, 0.92)', offset: 0.16, easing: 'ease-out' },
    { transform: `translateY(-${height}%) scale(0.95, 1.05)`, offset: 0.5, easing: 'ease-in' },
    { transform: 'translateY(0) scale(1.06, 0.94)', offset: 0.82, easing: 'ease-out' },
    { transform: 'none' },
  ], { duration: 760 });
  f.anims.push(a);
  a.onfinish = () => {
    if (!end) { done(svg); return; }
    setPose(svg, end.pose);
    later(f, end.ms, () => done(svg));
  };
  return f;
}

// An SVG group turning around a point of the 100 grid (view-box units).
// Rule 7: a part that already moves (a CSS picture animates the same star) is not taken over; the mascot
// only hops then, the part goes on with its own movement.
function turnPart(f, el, origin, frames, opts) {
  if (!el?.animate || el.getAnimations().some((x) => x.playState === 'running')) return;
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
  // Rule 7: clicked again while it still moves: no new signature from the start, the hop continues from
  // the current pose and a turned part eases back to rest.
  const acc = svg.querySelector('[data-part="accessory"]');
  if (svg.style.transform || acc?.style.transform) {
    settle(f, acc);
    return jump(svg, height, { f, end: i === 2 ? { pose: 'wave', ms: 900 } : null });
  }
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
  if (i === 1) {
    // Lösung «Schraubdreh»: the wrench turns once around the hand that holds it (rule 7: slow enough that
    // no frame turns it more than 6°).
    const m = acc?.firstElementChild?.getAttribute('transform')?.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
    if (m) turnPart(f, acc, `${m[1]}px ${m[2]}px`, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1800, easing: 'ease-in-out' });
  } else if (i === 2) {
    // Live «Sternfunkeln»: the star antenna wiggles three times (each swing at least 120 ms, rule 7).
    turnPart(f, acc, '50px 18px', [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(0deg)' }], { duration: 400, iterations: 3, easing: 'ease-in-out' });
  }
  return f;
}

/* ---------- Accessible names (R7: mascots stay silent, no bubbles or live region) ---------- */
// say: { one: '{name} winkt', many: '{names} winken', and: 'und' }.
let say = null;

// Kept as a no-op export for callers that still import speak.
export function speak() {}

/* ---------- Groups ---------- */
const labelOf = (svgs) => {
  const names = svgs.map((s) => MASCOTS[Number(s.dataset.mascot)].name);
  return names.length === 1 ? say.one.replace('{name}', names[0]) : say.many.replace('{names}', `${names.slice(0, -1).join(', ')} ${say.and} ${names.at(-1)}`);
};

// A page that switches its language without a reload (Webprojekte apps): new accessible names.
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
