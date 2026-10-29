// Builds the static part of ki-kundenservice/index.html from data/inbox.json.
//
//   node tools/build.mjs                    render index.html from data/inbox.json
//   node tools/build.mjs --from <demo_ki>   first combine <demo_ki>/daten/mails.json and
//                                           <demo_ki>/daten/ergebnisse_beispiel.json into
//                                           data/inbox.json (texts are copied unchanged)
//
// Everything between <!-- build:NAME --> and <!-- /build:NAME --> in index.html is
// replaced. Do not edit those parts by hand. The page needs no JavaScript to show all
// 20 mails; js/inbox.js only turns the same HTML into a two-pane inbox.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'data', 'inbox.json');
const indexPath = join(root, 'index.html');

/* ---------- 1. Optional: combine the source files ---------- */

const fromIndex = process.argv.indexOf('--from');
if (fromIndex !== -1) {
  const dir = process.argv[fromIndex + 1];
  const read = (p) => JSON.parse(readFileSync(join(dir, 'daten', p), 'utf8'));
  const mails = read('mails.json');
  const lauf = read('ergebnisse_beispiel.json');
  const byId = new Map(lauf.ergebnisse.map((r) => [r.id, r]));
  const combined = {
    quelle: 'demo_ki/daten/mails.json und demo_ki/daten/ergebnisse_beispiel.json (Texte unverändert)',
    lauf: { erzeugt: lauf.erzeugt, modell: lauf.modell },
    mails: mails.map((m) => {
      const r = byId.get(m.id);
      if (!r) throw new Error(`no result for mail ${m.id}`);
      const { id, ...ergebnis } = r;
      // Only one mail is not German; a tiny word check is enough to set its lang attribute.
      const lang = /\b(the|is|also|available)\b/i.test(m.text) ? 'en' : 'de';
      return { id: m.id, von: m.von, betreff: m.betreff, text: m.text, lang, ergebnis };
    })
  };
  writeFileSync(dataPath, JSON.stringify(combined, null, 1) + '\n');
  console.log(`data/inbox.json written (${combined.mails.length} mails)`);
}

/* ---------- 2. Read and check the data ---------- */

const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const mails = data.mails;
if (mails.length !== 20) throw new Error(`expected 20 mails, got ${mails.length}`);

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Decision: "entwurf" (draft ready to approve), "mensch" (a human decides), "gefiltert" (spam/phishing).
const typ = (r) => (r.kategorie === 'Spam' ? 'gefiltert' : r.braucht_mensch ? 'mensch' : 'entwurf');
const TYP = {
  entwurf: { short: 'Entwurf', long: 'Entwurf' },
  mensch: { short: 'an Menschen', long: 'an einen Menschen' },
  gefiltert: { short: 'gefiltert', long: 'gefiltert' }
};

// Special cases, recognised from the result itself.
function special(m) {
  const r = m.ergebnis;
  if (r.kategorie === 'Spam') return 'phishing';
  if (/zahlungsdaten/i.test(r.aktion)) return 'karte';
  if (/rechtlich|anwalt/i.test(r.grund + ' ' + m.text)) return 'anwalt';
  return '';
}
const SPECIAL = {
  karte: {
    badge: 'Kartendaten',
    note: 'Sonderfall Kartendaten: Die Kundin schickt ihre Kartennummer per Mail. Der Entwurf wiederholt sie nicht, bittet darum, Kartendaten nie per Mail zu schicken, und die interne Aufgabe lautet: Mail löschen.'
  },
  anwalt: {
    badge: 'Anwalt',
    note: 'Sonderfall Anwalt: Bei einer rechtlichen Drohung bestätigt der Entwurf nur den Eingang. Entscheiden und antworten muss die Inhaberin persönlich.'
  },
  phishing: {
    badge: 'Phishing',
    note: 'Sonderfall Phishing: Die Mail wird als Phishing erkannt und gefiltert. Es gibt keinen Entwurf, der Link wird nicht geöffnet.'
  }
};

// Highlight sensitive bits of a mail without changing the text: card data and links.
function mailText(text) {
  return esc(text)
    .replace(/(\d{4} \d{4} \d{4} \d{4}, \d{2}\/\d{2}, CVC \d{3})/g, '<mark class="mail__mark">$1</mark>')
    .replace(/(https?:\/\/[^\s]+)/g, '<mark class="mail__mark">$1</mark>');
}

const percent = (x) => Math.round(x * 100) + ' %';

/* ---------- 3. Render ---------- */

const counts = { entwurf: 0, mensch: 0, gefiltert: 0 };
mails.forEach((m) => counts[typ(m.ergebnis)]++);

const stats = `
        <li><strong>${mails.length}</strong> <span>Mails im Postfach</span></li>
        <li><strong>${counts.entwurf}</strong> <span>Entwürfe direkt freigabebereit</span></li>
        <li><strong>${counts.mensch}</strong> <span>gehen an einen Menschen, mit Entwurf</span></li>
        <li><strong>${counts.gefiltert}</strong> <span>gefiltert, kein Entwurf</span></li>
      `;

const filters = `
            <button type="button" class="filter" data-filter="alle" aria-pressed="true">Alle <span class="filter__count">${mails.length}</span></button>
            <button type="button" class="filter" data-filter="entwurf" aria-pressed="false">Entwurf <span class="filter__count">${counts.entwurf}</span></button>
            <button type="button" class="filter" data-filter="mensch" aria-pressed="false">an Menschen <span class="filter__count">${counts.mensch}</span></button>
            <button type="button" class="filter" data-filter="gefiltert" aria-pressed="false">gefiltert <span class="filter__count">${counts.gefiltert}</span></button>
          `;

const chipPrio = (p) => `<span class="chip chip--prio chip--${esc(p)}"><span class="visually-hidden">Priorität: </span>${esc(p)}</span>`;
const chipTyp = (t, long) => `<span class="decision-chip decision-chip--${t}"><span class="visually-hidden">Entscheidung: </span>${long ? TYP[t].long : TYP[t].short}</span>`;
const badge = (s) => (s ? `<span class="badge badge--${s}">${SPECIAL[s].badge}</span>` : '');

let list = '\n';
for (const m of mails) {
  const r = m.ergebnis;
  const t = typ(r);
  const s = special(m);
  list += `            <li data-typ="${t}"><a class="item" href="#mail-${m.id}" data-id="${m.id}">
              <span class="item__top"><span class="item__from">${esc(m.von)}</span> <span class="item__num">Nr. ${m.id}</span></span>
              <span class="item__subject"${m.lang !== 'de' ? ` lang="${m.lang}"` : ''}>${esc(m.betreff)}</span>
              <span class="item__chips"><span class="chip">${esc(r.kategorie)}</span> ${chipPrio(r.prioritaet)} ${chipTyp(t, false)} ${badge(s)}</span>
            </a></li>\n`;
}
list += '          ';

let articles = '\n';
for (const m of mails) {
  const r = m.ergebnis;
  const t = typ(r);
  const s = special(m);
  const lang = m.lang !== 'de' ? ` lang="${m.lang}"` : '';
  const id = `mail-${m.id}`;

  let decision;
  if (t === 'entwurf') decision = `<p>Die KI schreibt einen Entwurf, ein Mensch prüft ihn und gibt ihn frei. Einschätzung der KI: ${percent(r.sicherheit)} sicher.</p>`;
  else if (t === 'mensch') decision = `<p><strong>Grund:</strong> ${esc(r.grund)}</p>\n                <p>Der Entwurf geht trotzdem mit, als Vorschlag. Einschätzung der KI: ${percent(r.sicherheit)} sicher.</p>`;
  else decision = `<p>Spam oder Phishing erkannt. Die KI schreibt keinen Entwurf. Einschätzung der KI: ${percent(r.sicherheit)} sicher.</p>`;

  const draft = r.entwurf
    ? `<p class="draft__subject"><span class="draft__label">Betreff:</span> <span${lang}>${esc(r.betreff)}</span></p>
                <div class="draft__text"${lang}>${esc(r.entwurf)}</div>
                <div class="approve" data-approve hidden>
                  <button type="button" class="btn btn--primary approve__btn">Freigeben</button>
                  <p class="approve__status" role="status"></p>
                </div>`
    : `<p class="draft__none">Kein Entwurf: Die Mail wurde gefiltert.</p>`;

  let task = r.aktion ? `<p>${esc(r.aktion)}</p>` : `<p class="task__none">Keine. Der Entwurf reicht.</p>`;
  if (r.fehlende_infos) task += `\n                <p><strong>Noch nachfragen:</strong> ${esc(r.fehlende_infos)}</p>`;

  articles += `            <article class="mail" id="${id}" data-typ="${t}" data-id="${m.id}" aria-labelledby="${id}-title">
              <header class="mail__head">
                <p class="mail__meta">Mail ${m.id} von ${mails.length} <span aria-hidden="true">·</span> von ${esc(m.von)}</p>
                <h3 class="mail__title" id="${id}-title" tabindex="-1"${lang}>${esc(m.betreff)}</h3>
                <p class="mail__chips"><span class="chip"><span class="visually-hidden">Kategorie: </span>${esc(r.kategorie)}</span> ${chipPrio(r.prioritaet)} ${badge(s)}</p>
              </header>
              <div class="mail__text"${lang}>${mailText(m.text)}</div>
${s ? `              <p class="special special--${s}">${SPECIAL[s].note}</p>\n` : ''}              <section class="decision" aria-labelledby="${id}-decision">
                <h4 id="${id}-decision">Entscheidung <span class="decision__value">${chipTyp(t, true)}</span></h4>
                ${decision}
              </section>
              <section class="draft" aria-labelledby="${id}-draft">
                <h4 id="${id}-draft">Antwortentwurf</h4>
                ${draft}
              </section>
              <section class="task" aria-labelledby="${id}-task">
                <h4 id="${id}-task">Interne Aufgabe</h4>
                ${task}
              </section>
            </article>\n`;
}
articles += '          ';

const lauf = esc(data.lauf.erzeugt);

/* ---------- 4. Write into index.html ---------- */

let index = readFileSync(indexPath, 'utf8');
function put(name, html) {
  const a = `<!-- build:${name} -->`;
  const b = `<!-- /build:${name} -->`;
  const i = index.indexOf(a);
  const j = index.indexOf(b);
  if (i === -1 || j === -1) throw new Error(`markers for ${name} not found in index.html`);
  index = index.slice(0, i + a.length) + html + index.slice(j);
}
put('stats', stats);
put('filters', filters);
put('list', list);
put('mails', articles);
put('lauf', lauf);
writeFileSync(indexPath, index);

console.log(`index.html: ${mails.length} mails (${counts.entwurf} Entwurf, ${counts.mensch} an Menschen, ${counts.gefiltert} gefiltert)`);
