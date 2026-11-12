// Stage 7a (11.11.2026): the motion rules and the mascots of mrlololi.com on every Webprojekte page.
// Built on the vendored mascot kit (assets/js/mrl-kit/, same files as on the main site):
// - one «Bewegung pausieren» in the footer: html[data-motion="paused"] and localStorage «motion-paused»,
//   the same key as on mrlololi.com (one origin, so a pause there holds here and back);
// - the hub previews take turns: one plays at a time (KI, Language Starter, GeoAPP; pointing at or
//   focusing a card takes the turn), rests at least 3 s on its finished frame, fades out, the next one;
// - the 404 search loops calmly through the same conductor (rests, stops when paused or away);
// - every mascot group is one button: a hop with its signature move and a short line.
// Without JS nothing moves and the mascots are pictures; reduced motion: finished frames, no hops.
import { demo, initMotionToggle } from './mrl-kit/motion.js';
import { initPoke, setLines } from './mrl-kit/mascot-react.js';

const root = document.documentElement;

// The lines (at most five words, nothing promised). de for German pages, en for every other language.
const LINES = {
  de: {
    one: '{name} winkt', many: '{names} winken', and: 'und',
    lines: {
      logik: ['Erst denken, dann bauen.', 'Ich prüfe das kurz.', 'Klingt logisch, oder?'],
      loesung: ['Das kriegen wir hin.', 'Schraube fest, läuft.', 'Einmal testen, bitte.'],
      live: ['Hallo!', 'Alles läuft.', 'Schön, dass Sie da sind.'],
      footer: ['Danke fürs Vorbeischauen!', 'Viel Spaß beim Ausprobieren!', 'Bis bald!'],
      lost: ['Gefunden!', 'Da ist das Blatt!'],
    },
  },
  en: {
    one: '{name} waves', many: '{names} wave', and: 'and',
    lines: {
      logik: ['Think first, then build.', 'Let me check that.', 'Sounds logical, right?'],
      loesung: ['We can fix that.', 'Bolt tight, it runs.', 'One more test, please.'],
      live: ['Hello!', 'All running.', 'Nice to see you.'],
      footer: ['Thanks for stopping by!', 'Have fun trying things!', 'See you soon!'],
      lost: ['Found it!', 'There is the page!'],
    },
  },
};
const lang = () => (/^de\b/i.test(root.lang) ? 'de' : 'en');

initMotionToggle();
initPoke({ lines: LINES[lang()], groups: '.footer-mascots, .nf__scene' });
// GeoAPP and Language Starter switch their language without a reload: the lines and names follow.
new MutationObserver(() => setLines(LINES[lang()])).observe(root, { attributes: true, attributeFilter: ['lang'] });

/* ---------- Hub: the three previews take turns ---------- */
// The CSS draws each finished picture; data-play="start|run|end" plays it (landing.css).
const LENGTH = { 'pv-ki': 2600, 'pv-lang': 2400, 'pv-geo': 4100 };
for (const el of document.querySelectorAll('.project__visual')) {
  const kind = Object.keys(LENGTH).find((k) => el.querySelector(`.${k}`));
  el.dataset.demo = kind || 'preview';
  demo(el, { duration: LENGTH[kind] || 3000, rest: 3000, rotate: true, idle: 'end', card: el.closest('.project') });
}

/* ---------- 404: Logik searches with the magnifier; a click and Live finds the page ---------- */
const nf = document.querySelector('.nf__scene');
if (nf) {
  demo(nf, { duration: 3000, rest: 3000 });
  nf.addEventListener('click', () => found(nf));
  nf.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') found(nf); });
}
function found(scene) {
  if (scene.classList.contains('is-found')) return;
  scene.classList.add('is-found');
  scene.dataset.say = 'lost';
  const live = scene.querySelector('svg.mascot[data-mascot="2"]');
  if (live) live.dataset.base = 'joy';
}

/* ---------- The project pages ---------- */
// GeoAPP's «30 = ოც + და + ათი» plays once on entry; paused it does not start, and a pause while it
// plays shows its finished frame (geoapp/js/app.js listens for «motion:change»). No other loops there.

/* ---------- Links to the apps carry the language of this page ---------- */
// href is the German link; on an English page the English one (data-href-en). The hub does this in
// landing.js too; here it covers the 404 page and the header links on the project pages.
if (/^en\b/i.test(root.lang)) document.querySelectorAll('a[data-href-en]').forEach((a) => a.setAttribute('href', a.dataset.hrefEn));
