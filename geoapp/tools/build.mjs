// GeoAPP build step. Run after every change to data/numbers.json or js/i18n.js:
//
//   node tools/build.mjs
//
// 1. Checks data/numbers.json and stops with an error if something is wrong
//    (missing fields, a gap in 0-30, a word that doesn't split the way the
//    "take a number apart" card expects).
// 2. data/numbers.js: the same data as numbers.json, for opening the page
//    from disk (file://), where browsers block fetch().
// 3. The static number table in index.html (between the "static:start" and
//    "static:end" comments), so the page is readable without JavaScript.
// 4. The Ukrainian texts of every data-i18n element in <main> (and the skip
//    link), so without JavaScript the page is not empty. With JavaScript
//    app.js replaces them with the chosen language.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const data = JSON.parse(read('data/numbers.json'));

/* ---------- checks ---------- */

const errors = [];
const by = new Map(data.numbers.map((n) => [n.number, n]));
for (let n = 0; n <= 30; n++) {
  const e = by.get(n);
  if (!e) { errors.push(`${n} is missing`); continue; }
  for (const key of ['georgian', 'translit', 'uk', 'de', 'en']) {
    if (typeof e[key] !== 'string' || !e[key].trim()) errors.push(`${n}: ${key} is empty`);
  }
}
if (data.numbers.length !== 31) errors.push(`expected 31 numbers, found ${data.numbers.length}`);
const stem = by.get(20)?.georgian.slice(0, -1);
for (let n = 21; n <= 30; n++) {
  const want = stem + 'და' + by.get(n - 20)?.georgian;
  if (by.get(n)?.georgian !== want) errors.push(`${n}: expected ${want} (20 + ${n - 20})`);
}
for (let n = 11; n <= 19; n++) {
  if (!by.get(n)?.georgian.endsWith('მეტი')) errors.push(`${n}: teens should end in მეტი`);
}
if (errors.length) {
  console.error('numbers.json has problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}

/* ---------- 2. numbers.js ---------- */

const json = read('data/numbers.json').replace(/\r\n/g, '\n').trimEnd();
writeFileSync(join(root, 'data/numbers.js'),
  '/* Generated copy of numbers.json for file:// use. Do not edit - edit numbers.json and run node tools/build.mjs. */\n' +
  'window.GEOAPP_NUMBERS = ' + json + ';\n');

/* ---------- 3 + 4. index.html ---------- */

const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let html = read('index.html');
const nl = html.includes('\r\n') ? '\r\n' : '\n';

const rows = data.numbers
  .slice()
  .sort((a, b) => a.number - b.number)
  .map((e) => `              <tr data-number="${e.number}"><th scope="row" class="col-number">${e.number}</th><td lang="ka" class="col-ka">${escape(e.georgian)}</td><td lang="ka-Latn" class="col-translit">${escape(e.translit)}</td><td>${escape(e.uk)}</td></tr>`)
  .join(nl);
html = html.replace(/(<!-- static:start -->)[\s\S]*?(<!-- static:end -->)/, `$1${nl}${rows}${nl}$2`);

const sandbox = {};
new Function('window', read('js/i18n.js'))(sandbox);
const I18N = sandbox.GEOAPP_I18N;
const uk = (key) => (key in I18N.uk ? I18N.uk[key] : I18N.common[key]);
const missing = [];
const fill = (part) => part.replace(/(<([a-z0-9]+)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g, (all, open, tag, key, text, close) => {
  const value = uk(key);
  if (typeof value !== 'string') { missing.push(key); return all; }
  return open + escape(value) + close;
});
const cut = (from, to) => {
  const a = html.indexOf(from);
  const b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`index.html: can't find ${from} ... ${to}`);
  html = html.slice(0, a) + fill(html.slice(a, b)) + html.slice(b);
};
cut('<body>', '<header');
cut('<main', '</main>');
if (missing.length) {
  console.error('i18n.js has no Ukrainian text for: ' + missing.join(', '));
  process.exit(1);
}
writeFileSync(join(root, 'index.html'), html);

console.log(`ok: 31 numbers checked, numbers.js and index.html updated`);
