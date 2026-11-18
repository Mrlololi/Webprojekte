// mrl-kit enter.js VERSION 880e1ec7088c (vendored from mrlololi-site/site/assets/js/kit/; do not edit here, run tools/sync-mrl-kit.mjs)
// Entrances (Stage 7b, design system 5.2): IntersectionObserver and Web Animations, no GSAP.
// [data-enter="lines"] a heading (rises 16 px), [data-enter="stagger"] a list whose children arrive one
// by one, [data-enter] a single block (24 px). 500 ms, --ease-soft, once per page view, never hidden
// again. Trigger: 12 % inside the window. Safety: a quarter visible for 600 ms plays it; the page bottom
// reveals everything left. Guards (Stage 6e): anything on screen or above when this runs is simply
// shown; an element passed unseen is shown without motion; the start state is set by JS only; reduced
// motion or «Bewegung pausieren»: nothing at all (a pause while elements wait reveals them at once).
// The DOM contract: data-entered on an element when its entrance starts (never removed, not on elements
// that are simply shown), the bubbling event enter:start at that moment, data-entering on the closest
// <section> while an entrance runs and for 600 ms after (kit/motion.js starts no loop there).
import { motion, reduceMotion } from './motion.js';

export const ENTER = 500;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const AFTER = 600;
const SAFETY = 600;

// skip(el): elements another script animates (the SplitText lines on wide home pages, motion.js).
export function initEnter({ skip = () => false } = {}) {
  if (reduceMotion.matches || motion.paused || !('IntersectionObserver' in window) || !Element.prototype.animate) return { adopt() {} };
  const waiting = new Set();
  const busy = new Map(); // section -> running entrances
  const parts = (el) => (el.dataset.enter === 'stagger' ? [...el.children] : [el]);
  const hide = (el) => parts(el).forEach((p) => { p.style.opacity = '0'; });
  const reveal = (el) => { waiting.delete(el); parts(el).forEach((p) => { p.style.opacity = ''; }); io.unobserve(el); safety.unobserve(el); };
  const play = (el) => {
    if (!waiting.has(el)) return;
    waiting.delete(el);
    io.unobserve(el);
    safety.unobserve(el);
    el.setAttribute('data-entered', '');
    const sec = el.closest('section');
    if (sec) { busy.set(sec, (busy.get(sec) || 0) + 1); sec.setAttribute('data-entering', ''); }
    el.dispatchEvent(new CustomEvent('enter:start', { bubbles: true }));
    const rise = el.dataset.enter === 'lines' ? 16 : 24;
    const anims = parts(el).map((p, i) => {
      p.style.opacity = '';
      const delay = el.dataset.enter === 'stagger' ? (i < 4 ? i * 70 : 280) : 0;
      return p.animate([{ opacity: 0, transform: `translateY(${rise}px)` }, { opacity: 1, transform: 'none' }], { duration: ENTER, delay, easing: EASE, fill: 'backwards' });
    });
    Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => setTimeout(() => {
      if (!sec) return;
      const n = busy.get(sec) - 1;
      busy.set(sec, n);
      if (n <= 0) sec.removeAttribute('data-entering');
    }, AFTER));
  };
  const io = new IntersectionObserver((list) => list.forEach((e) => { if (e.isIntersecting) play(e.target); }), { rootMargin: '0px 0px -12% 0px' });
  const timers = new WeakMap();
  const safety = new IntersectionObserver((list) => list.forEach((e) => {
    if (e.intersectionRatio >= 0.25) { if (!timers.has(e.target)) timers.set(e.target, setTimeout(() => play(e.target), SAFETY)); }
    else { clearTimeout(timers.get(e.target)); timers.delete(e.target); }
  }), { threshold: [0, 0.25] });
  // Passed unseen (a jump to an anchor, a fast scroll): shown without motion. The bottom: all of it.
  const check = () => {
    const bottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    for (const el of [...waiting]) {
      if (bottom) play(el);
      else if (el.getBoundingClientRect().bottom < 0) reveal(el);
    }
  };
  let queued = false;
  addEventListener('scroll', () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; check(); }); }, { passive: true });
  document.addEventListener('motion:change', () => { if (motion.paused) [...waiting].forEach(reveal); });
  const adopt = (els) => {
    for (const el of els) {
      if (el.hasAttribute('data-entered') || waiting.has(el)) continue;
      // On screen or above when this runs: simply shown (the first screen never animates).
      if (el.getBoundingClientRect().top < innerHeight) continue;
      waiting.add(el);
      hide(el);
      io.observe(el);
      safety.observe(el);
    }
  };
  adopt([...document.querySelectorAll('[data-enter]')].filter((el) => !skip(el)));
  // adopt(els): take over elements another script meant to animate but could not (GSAP did not load).
  return { adopt };
}
