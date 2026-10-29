# GeoAPP: learn Georgian numbers

GeoAPP is a quiz for Ukrainians who ended up in Georgia after 2022 and want to learn the Georgian numbers from 0 to 30. Numbers come first because you need them right away: prices at the market, the number of your marshrutka, phone numbers, times. The interface is in Ukrainian (the default), German and English.

Live: <https://mrlololi.com/Webprojekte/geoapp/>

## What it does

- Two ways to answer. Pick one of four options (keys 1-4), or type the answer. Typing accepts digits like `17`, the word in Ukrainian, German or English, and the transliteration.
- Two of the three wrong options look a lot like the right one (7, 17 and 27, or a number next to it). Those are the numbers people actually mix up.
- You can practise 0-10, 11-20, 21-30 or all 31 numbers. The order is always random.
- After each answer you see right away if it was correct, together with the Georgian word, how to say it and the translation. The score updates as you go.
- At the end there's a result with a percentage, a list of your mistakes and a button to repeat only those.
- Progress is saved in `localStorage`: your settings, the round you're in (reload and carry on), your best round, how many rounds you played and your last answer for each number. Every read and write is wrapped in `try/catch`. If the browser blocks storage, the app still works and shows a short note.
- Works offline after the first visit and can be added to the home screen of a phone. That matters for the people it's built for: mobile data is often slow or expensive.
- On a phone the round scrolls itself so the Georgian word and all four answers are on one screen. Number-key hints are hidden on touch screens.
- **Counting in twenties:** an animated example (30 = ოც + და + ათი = 20 + 10) and a card where you pick any number from 0 to 30 and see its parts light up, with the literal meaning ("twenty and seven"). Only the 31 words from `data/numbers.json` are used. Examples above 30 will be added after a native speaker has checked them.
- **Live feedback:** a soft glow for a right answer, a calm colour fade for a wrong one, and a streak counter for right answers in a row. Screen readers hear the streak once per answer, politely.
- A table with all 31 numbers.
- Light and dark theme and the look of mrlololi.com, shared with the rest of Webprojekte. With "reduce motion" the explanation shows its final state.

## What it shows

| Topic | How it's done |
|---|---|
| Data apart from code | All numbers are in [`data/numbers.json`](data/numbers.json): the number, Georgian script, transliteration, Ukrainian, German, English |
| Three languages | Every interface text is in one object in [`js/i18n.js`](js/i18n.js). The HTML only has `data-i18n` keys. Plural forms use `Intl.PluralRules`, because Ukrainian has three of them ("1 помилку", "3 помилки", "5 помилок"). `<html lang>`, the page title and the description change with the language. `?lang=de` or `?lang=en` in the address opens the page in that language. |
| Keyboard | 1-4 to answer, Enter to check or go on. After each step the focus moves to the next useful button. |
| Accessibility (WCAG 2.1 AA) | Real buttons and radio inputs, a visible focus ring, feedback read out by screen readers, a `<progress>` bar, `lang="ka"` on every Georgian word, right and wrong shown with an icon and text and not only with colour, contrast of at least 4.5:1, less motion when the system asks for it |
| No jumping layout | The start screen is drawn before the data arrives. If you press Start before that, the click waits for the data. |

## Tech

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies and no requests to other servers.

```
geoapp/
├── index.html
├── css/geoapp.css        styles for this page (on top of ../assets/css/base.css)
├── js/i18n.js            all interface texts: uk, de, en
├── js/storage.js         localStorage with try/catch around everything
├── js/app.js             the quiz
├── sw.js                 service worker: keeps a copy of the app for offline use
├── manifest.webmanifest  name, colours and icons for "add to home screen"
└── data/
    ├── numbers.json      the numbers (edit this one)
    └── numbers.js        a copy for opening the page from disk, don't edit by hand
```

### Why there's a numbers.js next to numbers.json

Browsers don't allow `fetch()` for files opened from disk (`file://`). So on a web server (GitHub Pages or a local server) the app loads `numbers.json`, and when you double-click the page it loads `numbers.js` instead. If you change `numbers.json`, create the copy again with:

```powershell
"/* Generated copy of numbers.json for file:// use. Do not edit - edit numbers.json and regenerate (see README). */`nwindow.GEOAPP_NUMBERS = " + (Get-Content data/numbers.json -Raw -Encoding UTF8).TrimEnd() + ";" | Set-Content data/numbers.js -Encoding UTF8 -NoNewline
```

On macOS or Linux: `{ printf 'window.GEOAPP_NUMBERS = '; cat data/numbers.json; printf ';\n'; } > data/numbers.js`

### Recordings (ready for later)

There is no speech synthesis for Georgian: browser voices for it are rare and often wrong. Instead `js/voice.js` plays recorded files, the same way as Language Starter:

- Put the files in `audio/ka/`, one per number: `audio/ka/0.mp3` to `audio/ka/30.mp3`.
- List each one in `audio/manifest.json`, for example `"files": ["ka/27.mp3"]`. Only listed files are used.
- A number without a file gets no "Listen" button. Files played once also work offline.

The manifest is empty for now; the numbers will be recorded by a native speaker.

### Offline mode

`sw.js` loads everything from the network first, so visitors always get the newest version. Only when there's no connection does it fall back to the copy it saved. Service workers only run over https (or on localhost), so offline mode is not active when you open the file from disk. If you add a file the app needs, add it to the `FILES` list in `sw.js` too.

## Run it locally

- The quick way: double-click `index.html`.
- Like on GitHub Pages: run `python -m http.server 8000` in the `Webprojekte` folder and open <http://localhost:8000/geoapp/>.

## Put it on GitHub Pages

GeoAPP goes online together with the whole `Webprojekte` repository, see the [main README](../README.md#hosting). It uses the shared files in `../assets/`, so upload the whole `Webprojekte` folder and not just `geoapp/`.

## Where it comes from

The first version was multiple choice only and in English only. Its old address mrlololi.github.io/GeoAPP now redirects here (the redirect lives in the repository `Mrlololi/GeoAPP`). This version keeps the same 31 numbers and transliterations and adds the Ukrainian and German translations, typing mode, saved progress, repeating mistakes and the three interface languages.
