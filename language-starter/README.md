# Language Starter: first phrases for youth exchanges

A small free phrase app for international youth exchanges and trainings. Participants from many countries learn a few first sentences in each other's languages: 45 short phrases in 6 topics, in 42 languages. It's a pilot for clubs and associations (Vereine) and a portfolio project.

Live: <https://mrlololi.com/Webprojekte/language-starter/>

## What it does

- **Two languages:** "My language" (starts with the browser language) and "I am learning" (starts empty). A swap button switches them. The address keeps the pair, for example `?from=de&to=ka&ui=de`, so a group leader can send a direct link. The pair is also remembered in `localStorage`.
- **Phrase cards per topic:** the phrase in the learned language, big and with its `lang` attribute, the Latin spelling for non-Latin scripts, the translation, both forms where the speaker's gender changes the words (labelled m / w in German, m / f in English), a Listen button and a "Report a mistake" e-mail link (`mailto:`, nothing is sent from the site).
- **Quiz** per topic or for all: four answers from the same topic, keys 1-4 and Enter, both directions, a score, a result screen and "repeat mistakes". Progress is saved per language pair.
- **Phrase card to print** (Sprachkarte): all 45 phrases on exactly one A4 page in two columns, with a QR code to the language pair. The QR code is made in the browser (no outside service). The card is also shown on the page as a preview.
- **Listen:** a recorded mp3 if one exists, otherwise the browser's own speech voice. If there is neither, the button is not shown.
- **Draft banner** for every language that no native speaker has checked yet.
- **Review mode** for native speakers, built for one link in a group chat on a phone (see below). `noindex`.
- **Works offline** after the first visit, and can be added to the home screen. On a weak signal the page does not hang: after 3 seconds it shows the saved copy.
- **Small downloads:** the app loads a small index and only the languages it shows (a few KB each), not all 42.
- **Interface in German and English.** Russian, Ukrainian and Georgian keys are prepared in `js/i18n.js` (empty for now, they fall back to English). As soon as one of them has strings, its button appears in the switch.
- No tracking, no account, no cookies, no requests to other servers.

## Files

```
language-starter/
├── index.html             page; the English -> German list inside it works without JavaScript
├── css/langstarter.css    styles on top of ../assets/css/base.css, incl. print and review mode
├── js/i18n.js             all interface texts (de, en; ru, uk, ka prepared)
├── js/storage.js          localStorage with try/catch (prefix langstarter:v1:)
├── js/voice.js            Listen: mp3 from audio/manifest.json, else speech synthesis
├── js/app.js              chooser, cards, quiz, phrase card, review mode
├── js/vendor/qrcode.min.js  QR code generator (qrcode-generator 2.0.4 by Kazuhiko Arase, MIT)
├── data/phrases.json      THE data file - edit only this one
├── data/index.json        generated: languages (with "checked"), topics, phrase order
├── data/xx.json           generated: one file per language (fi.json, ka.json ...)
├── data/phrases.js        generated copy of everything for file:// (do not edit)
├── audio/manifest.json    list of recorded mp3 files (empty in the pilot)
├── tools/build.mjs        checks the data, writes index.json, xx.json, phrases.js and the no-JS list
├── sw.js                  service worker, cache "langstarter-v3", network first with a 3 s limit
└── manifest.webmanifest   name, colours, icons for "add to home screen"
```

## Data format (`data/phrases.json`)

One flat entry per phrase and language (45 x 42 = 1890), so the file can be exported to a table for reviewers.

```json
{ "n": 26, "id": "mood.tired", "group": "mood", "lang": "ru", "text": null,
  "forms": { "m": "Я устал", "f": "Я устала" },
  "translit": { "m": "Ya ustal", "f": "Ya ustala" },
  "checked": true, "note": "" }
```

| Field | Meaning |
|---|---|
| `n` | Fixed phrase number 1-45, the same in every language. Reviewers write "12: ...". It never changes; new phrases get 46, 47 and so on. |
| `id`, `group` | Phrase id (`intro.hello`, `num.7`) and topic (`intro`, `polite`, `project`, `mood`, `help`, `numbers`). |
| `text` | The phrase. `null` when there are two forms. |
| `forms` | `{ "m": ..., "f": ... }` when the speaker's gender changes the words (only on the 6 phrases where the English entry has `"gender": true`). |
| `translit` | Latin spelling, only for ka, hy, el, ru, uk, be, bg, mk, sr (Serbian: the Latin alphabet). A string, or `{ m, f }` with forms. |
| `{X}` | Placeholder for a name or place, only in "My name is", "I am from" and "Where is". Shown as "…", never spoken. |
| `checked` | `true` when a native speaker checked the entry. A language counts as checked when all its entries are. |
| `note` | A short English note about a real doubt (register, regional variant, a case ending that changes). |

The English entries also carry `meaning` (the note for translators, shown in review mode) and `gender: true` on the phrases where a speaker form can be needed. `languages` holds the endonym, the speech code (`tts`, for example `ka-GE`, Norwegian `nb-NO`), the script and `reviewers` (names; if there are any, a "Thank you" section appears).

**After every change to `phrases.json` run:**

```bash
node tools/build.mjs
```

It stops with an error if an entry is missing or empty, then writes `data/index.json`, one `data/xx.json` per language, `data/phrases.js` and the static English -> German list in `index.html`.

### Add a language

1. Add it to `languages` with `endonym`, `tts`, `script`, `eu` and `"reviewers": []`.
2. Add 45 entries (copy the English ones, keep `n`, `id`, `group`), with `"checked": false`. Add `translit` if the script is not Latin, and `forms` where needed.
3. Run `node tools/build.mjs`.

### Mark a language as checked

When a native speaker has sent their fixes (the text from the review page, in a group chat or by e-mail), fix the texts, set `"checked": true` on all 45 entries of that language and add the name to `reviewers` if the person agrees. Run `node tools/build.mjs`. The draft banner disappears for that language.

## Review mode

One link for everyone: `https://mrlololi.com/Webprojekte/language-starter/?review`. It lists all 42 languages (endonym, name, «draft» or «checked», drafts first); a tap opens `?review=fi`. Direct links like `?review=fi` keep working. `&ui=de` shows the page in German (EN and DE; otherwise the browser language decides).

- Phones (below 640 px): one block per phrase with number, English, the meaning note, the translation (large) and the Latin spelling. Wider screens and print: a table.
- Under each phrase: «Correct» and «Suggest a fix» (44 px, `aria-pressed`). «Suggest a fix» opens a field with a visible label (16 px text, so iOS does not zoom).
- The bar at the bottom counts the fixes and offers «Copy my fixes», «Share» (where the phone has it) and «Send by e-mail» (`mailto:hello@mrlololi.com`). The text looks like this:

  ```
  Language Starter · Suomi (fi)
  12: <fix>
  19: <fix>
  All other phrases look correct.
  ```

  It stays honest: phrases after the last one the person marked are listed as «Not checked: 30-45».
- In-app browsers (WhatsApp, Instagram, Facebook) often block the clipboard: then the text appears selected in a read-only box with «Long-press to copy», next to Share and e-mail.
- Marks and fixes are kept in `localStorage` per language, so nothing is lost when the phone switches apps. Nothing is ever sent automatically.
- The bar respects the safe area of phones and never covers the field you type in. Confirmations are read out by screen readers (`aria-live`).

### Add mp3 recordings later

1. Put the files into `audio/{lang}/`, named by phrase id: `audio/ka/intro.hello.mp3`, and for the two forms `audio/ru/mood.tired.m.mp3` and `audio/ru/mood.tired.f.mp3`. Leave out the `{X}` gap when recording.
2. List them in `audio/manifest.json`: `"files": ["ka/intro.hello.mp3", "ru/mood.tired.m.mp3"]`.
3. Only listed files are used; everything else keeps using the browser voice. A file is stored by the service worker the first time it is played, so it then also plays offline. Languages without any browser voice (for example sq, eu) only get a Listen button through recordings.

## Voices and privacy

Listen uses the speech voices of the device or browser. Voices on the device are preferred. Some browsers also offer network voices (for example the "Google" voices in desktop Chrome): with those, the phrase text is sent to the browser maker's speech service. When the device is offline and only a network voice exists, the button is hidden. If a language has no voice and no recording on the device, the page says so once above the cards. iOS sometimes offers its voices only after the first tap, so the page checks again then.

## Look

Since 29.10.2026 the page uses the shared header, footer, colours and fonts of Webprojekte (the look of mrlololi.com, see the root README). The phrase card for printing stays black on white paper, also in the dark theme. Data, URLs and the print layout did not change. On 29.10.2026 (polish before the group chats) the review mode was rebuilt for phones, the phrase cards line up in rows without a lonely card, the quiz is centred on wide screens, and the header fits in one row on phones.

## Accessibility

WCAG 2.2 AA: every phrase element has its `lang` attribute (and `xx-Latn` on Latin spellings), keyboard play (1-4, Enter), visible focus, real buttons and radio inputs, feedback with icon and text, contrast of at least 4.5:1 in both themes, less motion when the system asks for it.

## Run it locally

Double-click `index.html` (the data then comes from `data/phrases.js`; offline mode needs a server), or run `python -m http.server 8000` in the `Webprojekte` folder and open <http://localhost:8000/language-starter/>.

## Name and trademark

The project is not affiliated with the EU programme Erasmus+. The name and logo are not used in the title, design or images; the page mentions the programme once in the text as an example.
