// mrl-kit mascot-art.js VERSION 6f5d1a53dec8 (vendored from mrlololi-site/site/assets/js/kit/; do not edit here, run tools/sync-mrl-kit.mjs)
// The three mascots Logik, Lösung, Live (v2, 28.10.2026) as inline SVG strings.
// Used by the build (src/templates/mascots.mjs) and in the browser (mascots.js swaps a pose).
// 100 grid, «leichtes Volumen»: flat pastel body with a lighter belly (clipped to the body), soft
// white highlight top-left, ink outline. Distinct silhouettes: Logik a rounded hexagon, Lösung a
// ball, Live a soft teardrop with the star antenna. All stand on the same ground line (y 105).
// Named groups (legs, body, belly, eyes, mouth, accessory, arms) so GSAP can move the parts; an
// emotion only swaps eyes, mouth, arms and the accessory. Class "o": strokes that sit on the
// background (they turn light on the dark footer).
const INK = '#2B2A33';
const PEACH = '#F7DCC8';
// face: eye line y, eye offset from the middle, mouth y. sh: the left shoulder (the right one mirrors).
export const MASCOTS = [
  {
    key: 'logik', name: 'Logik', fill: '#F4C9D3', belly: '#FBE6EC', ink: '#9C3F58',
    d: 'M25.5 30.5A16 16 0 0 1 39.7 22H60.3A16 16 0 0 1 74.5 30.5L86.1 52.5A16 16 0 0 1 86.1 67.5L74.5 89.5A16 16 0 0 1 60.3 98H39.7A16 16 0 0 1 25.5 89.5L13.9 67.5A16 16 0 0 1 13.9 52.5z',
    face: [55, 12.5, 71], sh: [17, 72], shine: [33, 34, -32], bellyTop: 77,
  },
  {
    key: 'loesung', name: 'Lösung', fill: '#BFD8EE', belly: '#E4F0FA', ink: '#2F6A9E',
    d: 'M50 22a38 38 0 1 1 0 76a38 38 0 1 1 0-76z',
    face: [56, 12, 71], sh: [14, 70], shine: [33, 39, -38], bellyTop: 77,
  },
  {
    key: 'live', name: 'Live', fill: '#CFE3C2', belly: '#EAF4E3', ink: '#3F6B31',
    d: 'M50 17C55 17 82 40 82 66A32 32 0 0 1 18 66C18 40 45 17 50 17z',
    face: [62, 11, 77], sh: [19, 74], shine: [36, 44, -48], bellyTop: 83,
  },
];
export const EMOTIONS = ['idle', 'think', 'wow', 'joy', 'wave'];

const line = (d, w = 3.4, cls = '') => `<path${cls ? ` class="${cls}"` : ''} d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const face = (emo) => (emo === 'wave' ? 'idle' : emo);

// A round ink eye with a white highlight dot; class m-eye blinks (mascots.js).
const eye = (x, y, r, lx = 0.35, ly = -0.38) => `<g class="m-eye"><circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + r * lx}" cy="${y + r * ly}" r="${(r * 0.34).toFixed(1)}" fill="#fff"/></g>`;

function eyes(m, e) {
  const [y, s] = m.face;
  const L = 50 - s, R = 50 + s;
  if (e === 'think') return eye(L + 1.2, y - 1.2, 4.6, 0.4, -0.3) + eye(R + 1.2, y - 1.2, 4.6, 0.4, -0.3) + line(`M${R - 6} ${y - 12}q6-4 12-1`, 2.8);
  if (e === 'wow') return eye(L, y, 6.6) + eye(R, y, 6.6) + line(`M${L - 5} ${y - 12.5}q5-4 10 0M${R - 5} ${y - 12.5}q5-4 10 0`, 2.6);
  if (e === 'joy') return line(`M${L - 6} ${y + 1.5}q6-8 12 0M${R - 6} ${y + 1.5}q6-8 12 0`, 3.6);
  return eye(L, y, 5.6) + eye(R, y, 5.6);
}

function mouth(m, e) {
  const y = m.face[2];
  if (e === 'think') return line(`M${47} ${y + 1}q4-2.5 9-.5`, 3);
  if (e === 'wow') return `<ellipse cx="50" cy="${y + 1.5}" rx="3.8" ry="4.8" fill="${INK}"/>`;
  if (e === 'joy') return `<path d="M42 ${y - 1}q8 13 16 0z" fill="${INK}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M46 ${y + 5}q4 3 8 0q-4-2-8 0z" fill="#E8838F"/>`;
  return line(`M44 ${y}q6 5.5 12 0`, 3.4);
}

// Arms for the left side, relative to the shoulder: a curve [control x, y, hand x, y]; the right
// side mirrors. Short arms: the hand stays close to the body.
const POSE = { down: [-7, 4, -7, 13], out: [-9, -1, -10, -12], up: [-9, -6, -6, -20] };
const ARMS = { idle: ['down', 'down'], think: ['down', 'chin'], wow: ['out', 'out'], joy: ['up', 'up'], wave: ['down', 'wave'] };
// The hand (a small round mitten in the body colour) of one arm: [x, y].
function handAt(m, side, pose) {
  const [sx, sy] = m.sh;
  const x = side ? 100 - sx : sx;
  if (pose === 'chin') return [58, m.face[2] + 8];
  if (pose === 'wave') return [x + 12, sy - 19];
  const [, , hx, hy] = POSE[pose];
  return [x + (side ? -hx : hx), sy + hy];
}

const hand = (x, y, fill, r = 4.4) => `<circle class="o" cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="2.4"/>`;

function arms(m, emo) {
  const [sx, sy] = m.sh;
  return ARMS[emo].map((pose, side) => {
    const x = side ? 100 - sx : sx;
    const [hx, hy] = handAt(m, side, pose);
    // At the chin the arm lies on the body, so it stays ink on the dark footer too (no class "o").
    if (pose === 'chin') return line(`M${x} ${sy}C${x + 9} ${sy + 6} ${hx + 9} ${hy + 3} ${hx} ${hy}`) + hand(hx, hy, m.fill).replace(' class="o"', '');
    // Waving: the raised right arm turns around its shoulder (data-origin, see mascots.js).
    if (pose === 'wave') return `<g class="m-wave" data-origin="${x} ${sy}">${line(`M${x} ${sy}q12-2 12-19`, 3.4, 'o')}${hand(hx, hy, m.fill, 4.8)}</g>`;
    const [cx, cy] = POSE[pose];
    return line(`M${x} ${sy}q${side ? -cx : cx} ${cy} ${hx - x} ${hy - sy}`, 3.4, 'o') + hand(hx, hy, m.fill);
  }).join('');
}

// Lösung's small white wrench, held in a hand (the hand is drawn on top of the handle).
function wrench(x, y, rot) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" fill="#fff" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"><rect x="-2.4" y="-18" width="4.8" height="22" rx="2.4"/><path d="M-2.4-17l-3.6-4a6.5 6.5 0 0 1 2.8-8l1.5 5h3.4l1.5-5a6.5 6.5 0 0 1 2.8 8l-3.6 4z"/></g>`;
}
// Right hand, or the left one whenever the right is at the chin or waving: [side, rotation].
const WRENCH = { idle: [1, 24], think: [0, -24], wow: [1, 18], joy: [1, 10], wave: [0, -24] };

function accessory(i, emo) {
  const m = MASCOTS[i];
  const e = face(emo);
  if (i === 0) {
    // Logik's round glasses, in every emotion (a little bigger around the «wow» eyes).
    const [y, s] = m.face;
    const r = e === 'wow' ? 10.5 : 9.5;
    return `<g class="m-glasses" fill="none" stroke="${INK}" stroke-width="2.6"><circle cx="${50 - s}" cy="${y}" r="${r}"/><circle cx="${50 + s}" cy="${y}" r="${r}"/><path d="M${50 - s + r} ${y}h${2 * s - 2 * r}" stroke-linecap="round"/></g>`;
  }
  if (i === 1) {
    const [side, rot] = WRENCH[emo];
    return wrench(...handAt(m, side, ARMS[emo][side]), rot);
  }
  // Live: a small star antenna in peach; sparks when happy.
  return `${line('M50 18V6', 3, 'o')}<path class="o" d="M50-5.6l1.8 4.2 4.5.4-3.4 2.9 1 4.4L50 4l-3.9 2.3 1-4.4-3.4-2.9 4.5-.4z" fill="${PEACH}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>${e === 'joy' ? line('M39 2l-5-3M61 2l5-3', 2.4, 'o') : ''}`;
}

// The swappable parts of one pose.
export function parts(i, emo) {
  const m = MASCOTS[i];
  const e = face(emo);
  return { eyes: eyes(m, e), mouth: mouth(m, e), accessory: accessory(i, emo), arms: arms(m, emo) };
}

const group = (name, body) => `<g data-part="${name}">${body}</g>`;
// One mascot. attrs: extra attributes for the <svg> (class, aria-hidden, ...), as a string.
// The belly is clipped to the body outline. The clipPath id is mascot plus pose (on the site each
// mascot shows a pose once per page); a page with repeats passes its own suffix in idSuffix.
export function mascotSvg(i, emo = 'idle', attrs = '', idSuffix = '') {
  const m = MASCOTS[i];
  const p = parts(i, emo);
  const id = `mb-${m.key}-${emo}${idSuffix}`;
  const [y, s] = m.face;
  const [hx, hy, rot] = m.shine;
  const legs = `${line('M41 92v12M59 92v12', 3.4, 'o')}${line('M36 105h9M55 105h9', 4, 'o')}`;
  const belly = `<ellipse clip-path="url(#${id})" cx="50" cy="${m.bellyTop + 26}" rx="36" ry="26" fill="${m.belly}"/>`;
  const body = `<clipPath id="${id}"><path d="${m.d}"/></clipPath><path d="${m.d}" fill="${m.fill}"/>${group('belly', belly)}`
    + `<circle cx="${50 - s - 9}" cy="${y + 10}" r="4.6" fill="${m.ink}" opacity=".22"/><circle cx="${50 + s + 9}" cy="${y + 10}" r="4.6" fill="${m.ink}" opacity=".22"/>`
    + `<ellipse cx="${hx}" cy="${hy}" rx="8" ry="4.8" fill="#fff" opacity=".6" transform="rotate(${rot} ${hx} ${hy})"/>`
    + `<path class="o" d="${m.d}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  return `<svg viewBox="-8 -8 120 124" data-mascot="${i}" data-emo="${emo}"${attrs ? ` ${attrs}` : ''}>`
    + `<ellipse data-part="shadow" class="m-shadow" cx="50" cy="109" rx="23" ry="3.6" fill="${INK}" opacity=".13"/>`
    + `<g data-part="rig">${group('legs', legs)}${group('body', body)}${group('eyes', p.eyes)}${group('mouth', p.mouth)}${group('accessory', p.accessory)}${group('arms', p.arms)}</g></svg>`;
}
