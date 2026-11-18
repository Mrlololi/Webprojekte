// mrl-kit icons.mjs VERSION a4ff00db6be0 (vendored from mrlololi-site/site/assets/js/kit/; do not edit here, run tools/sync-mrl-kit.mjs)
// Icon set «mrlololi line» (Stage 7b, design system v1 section 3). Build time only: templates import
// this module the way they import mascot-art.js; no page loads it in the browser.
// Drawing rules (3.1): 24 grid with 2 units of padding; circles, rounded rectangles, lines and arcs,
// never a triangle; one outline colour (currentColor, set by .i in kit.css); at most ONE fill shape,
// which carries style="fill: var(--i-fill, none)" (empty on small sizes, the tone on picto sizes); at
// most one moving part, class «m»; no other class. Live's antenna star is the only pointed shape.
// ICONS = { id: { tone, body, project? } }; tone: 'pink' | 'blue' | 'pist' | 'lav' | 'peach' | null.
const F = 'style="fill: var(--i-fill, none)"';

// Live's antenna star (assets/js/kit/mascot-art.js, accessory of mascot 2), scaled to 0.6 around
// (18.5, 6): the sign of «arrived» in mail-star.
const STAR = 'M18.5 2.34L19.58 4.86 22.28 5.1 20.24 6.84 20.84 9.48 18.5 8.1 16.16 9.48 16.76 6.84 14.72 5.1 17.42 4.86z';

export const ICONS = {
  // Small glyph: done, included (a bare tick; a disc behind it is CSS).
  check: { tone: null, body: '<path d="M5 12.5l4.5 4.5L19 7.5"/>' },

  // Run-log, one purchase in six steps.
  form: { tone: 'pink', body: `<rect x="4" y="2.5" width="16" height="19" rx="2.5" ${F}/><path d="M7.5 6.5h6"/><rect x="7.5" y="9.5" width="9" height="3" rx="1.5"/><rect class="m" x="7.5" y="15.5" width="5.5" height="3" rx="1.5"/>` },
  card: { tone: 'blue', body: `<rect x="2.5" y="5.5" width="19" height="13" rx="2.5" ${F}/><path d="M2.5 9.75h19"/><path class="m" d="M6 14.75h4.5"/>` },
  receipt: { tone: 'blue', body: `<path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h9A1.5 1.5 0 0 1 18 3.5v16.5a1.5 1.5 0 0 1-3 0a1.5 1.5 0 0 1-3 0a1.5 1.5 0 0 1-3 0a1.5 1.5 0 0 1-3 0z" ${F}/><g class="m"><path d="M9 7h6"/><path d="M9 10.5h6"/></g><path d="M9 14h3.5"/>` },
  tag: { tone: 'pink', body: `<g class="m"><rect x="3.5" y="7.5" width="16" height="9" rx="3" transform="rotate(-45 11.5 12)" ${F}/><circle cx="15.6" cy="7.9" r="1.4"/></g>` },
  unlock: { tone: 'pist', body: `<rect x="5" y="11" width="14" height="10" rx="2.5" ${F}/><path class="m" d="M8.5 11V7.5a3.5 3.5 0 0 1 7 0"/><path d="M12 15v2"/>` },
  'mail-star': { tone: 'pist', body: `<rect x="2.5" y="9.5" width="13.5" height="10.5" rx="2" ${F}/><path d="M3 10.5l6.25 4.75L15.5 10.5"/><path class="m" d="${STAR}"/>` },

  // Home process, four steps (redrawn from the 40 grid of Stage 6).
  calendar: { tone: 'pink', body: `<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" ${F}/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path class="m" pathLength="1" d="M8.5 15l2.5 2.5 4.5-4.5"/>` },
  offer: { tone: 'pink', body: `<rect x="5" y="2.5" width="14" height="19" rx="2.5" ${F}/><g class="m"><path pathLength="1" d="M8.5 8h7"/><path pathLength="1" d="M8.5 12h7"/><path pathLength="1" d="M8.5 16h4"/></g>` },
  blocks: { tone: 'blue', body: `<rect x="3.5" y="14.5" width="8" height="6" rx="1.5"/><rect x="12.5" y="14.5" width="8" height="6" rx="1.5"/><rect class="m" x="8" y="4.5" width="8" height="6" rx="1.5" ${F}/>` },
  key: { tone: 'pist', body: `<g class="m"><circle cx="8" cy="12" r="4" ${F}/><path d="M12 12h9M18 12v3M21 12v2.5"/></g>` },
};

const SIZES = [16, 20, 24, 32, 40, 48];

// The markup for one use. size: 16 to 48; tone: the id's own unless given (null: no fill); it is written
// as a tone-* class on the picto sizes (32, 40, 48) only. inline: the drawing itself (for a moving m part).
export function icon(id, { size = 24, tone, inline = false } = {}) {
  const e = ICONS[id];
  if (!e) throw new Error(`icons: unknown id «${id}»`);
  if (!SIZES.includes(size)) throw new Error(`icons: size ${size} is not one of ${SIZES.join(', ')}`);
  const t = tone === undefined ? e.tone : tone;
  const cls = `i i--${size}${size >= 32 && t ? ` tone-${t}` : ''}`;
  if (inline) return `<svg class="${cls}" data-icon="${id}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${e.body}</svg>`;
  return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
}

// The hidden symbol block for a page (only the ids it uses through <use>).
export function iconSymbols(ids) {
  const list = [...new Set(ids)];
  for (const id of list) if (!ICONS[id]) throw new Error(`icons: unknown id «${id}»`);
  if (!list.length) return '';
  return `<svg class="i-defs" width="0" height="0" aria-hidden="true" focusable="false">${list.map((id) => `<symbol id="i-${id}" viewBox="0 0 24 24">${ICONS[id].body}</symbol>`).join('')}</svg>`;
}
