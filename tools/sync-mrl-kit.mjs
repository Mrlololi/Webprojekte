// Stage 7a (11.11.2026): the mascot kit of mrlololi.com, vendored into Webprojekte.
// The source lives in the sibling repo: mrlololi-site/site/assets/js/kit/ (mascot-art.js,
// mascot-react.js, motion.js). Webprojekte never loads it from the main site at run time (GeoAPP and
// Language Starter are offline apps); it keeps a copy in assets/js/mrl-kit/ with a VERSION header.
//   node tools/sync-mrl-kit.mjs           copy the kit (after a change on the main site)
//   node tools/sync-mrl-kit.mjs --check   exit 1 if a copy differs from the source (QA gate)
// The VERSION line is the date of the copy plus a short hash of the three source files.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
// webprojekte/site/tools -> Projekte/mrlololi-site/site/assets/js/kit
const SRC = process.env.MRL_KIT || resolve(site, '..', '..', 'mrlololi-site', 'site', 'assets', 'js', 'kit');
const OUT = join(site, 'assets', 'js', 'mrl-kit');
const FILES = ['mascot-art.js', 'mascot-react.js', 'motion.js'];

if (!existsSync(SRC)) { console.error(`kit source not found: ${SRC}`); process.exit(2); }
const src = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(SRC, f), 'utf8')]));
const hash = createHash('sha256').update(FILES.map((f) => src[f]).join('\n')).digest('hex').slice(0, 12);
const head = (f) => `// mrl-kit ${f} VERSION ${hash} (vendored from mrlololi-site/site/assets/js/kit/; do not edit here, run tools/sync-mrl-kit.mjs)\n`;
const strip = (s) => s.replace(/^\/\/ mrl-kit .* VERSION .*\n/, '');

if (process.argv.includes('--check')) {
  const bad = FILES.filter((f) => {
    const p = join(OUT, f);
    return !existsSync(p) || strip(readFileSync(p, 'utf8')) !== src[f];
  });
  if (bad.length) { console.error(`mrl-kit differs from the main site: ${bad.join(', ')} (run node tools/sync-mrl-kit.mjs)`); process.exit(1); }
  console.log(`mrl-kit ok (${hash})`);
} else {
  mkdirSync(OUT, { recursive: true });
  for (const f of FILES) writeFileSync(join(OUT, f), head(f) + src[f]);
  console.log(`mrl-kit copied (${hash}): ${FILES.join(', ')}`);
}
