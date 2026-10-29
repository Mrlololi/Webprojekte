# KI im Kundenservice: a demo inbox

A demo of AI reply drafts for customer service. The fictional online photo school "Lichtwerk Fotoakademie" gets 20 typical support mails. For each mail you see what the AI suggested: a category, a priority, whether a human has to decide (and why), a reply draft and an internal task for the team. A human approves every draft. Nothing is sent.

Live: <https://mrlololi.com/Webprojekte/ki-kundenservice/>
The service behind it: <https://mrlololi.com/ki-antwortentwuerfe/>

## What the page shows

- **The inbox:** the 20 mails as a list (category, priority and decision as labels), and the selected mail with the decision, the draft and the internal task. Filters: Alle, Entwurf, an Menschen, gefiltert.
- **Three special cases:** card data in a mail (the draft does not repeat it, the task says to delete the mail), a threat with a lawyer (goes to a human, the draft only confirms receipt), a phishing mail (filtered, no draft).
- **«Freigeben»** only shows "Demo: nichts wird gesendet". There is no network request at all.
- **Savings calculator:** mails per week x 4.33 weeks x share of routine mails x minutes per mail; a checked draft saves 70 % of that time; 25 € per hour. 120 mails, 6 minutes and 60 % give about 21.8 hours and 546 € per month. Same formula as the first version of the demo.
- How it works, data protection (DSGVO), links to the service and to this source code.

## The results are an example run

The decisions and drafts were made once, on 14.10.2026, by Claude with the project's system prompt and the school's knowledge base ("Beispiellauf"). They are stored in `data/inbox.json`. No AI runs on this page and the page talks to no server except its own. The page says so in the "Beispiellauf" note above the inbox. The school, all people and all mails are made up.

## Files

```
ki-kundenservice/
├── index.html        the page; the mail list and all 20 mails are in the HTML (generated, see below)
├── css/ki.css        page styles on top of ../assets/css/base.css (@layer page)
├── js/inbox.js       two-pane inbox, filters, keyboard, «Freigeben» demo, calculator (no fetch)
├── data/inbox.json   THE data file: 20 mails, each with its result (texts unchanged from the source)
└── tools/build.mjs   writes the generated parts of index.html from data/inbox.json
```

### Data and build

`data/inbox.json` combines `daten/mails.json` and `daten/ergebnisse_beispiel.json` of the original demo folder (outside this repository). The texts are copied unchanged; each mail only gets a `lang` field (`de`, or `en` for the one English mail).

```bash
node tools/build.mjs                          # render index.html from data/inbox.json
node tools/build.mjs --from <path to demo_ki> # first rebuild data/inbox.json from the source files
```

The script replaces everything between `<!-- build:NAME -->` and `<!-- /build:NAME -->` in `index.html` (stats, filter counts, the list, the 20 mails, the date of the run). Do not edit those parts by hand.

The JavaScript reads nothing: it works on the HTML that is already there. That is why the page is complete without JavaScript (the list of all mails, then every mail in full, and the calculator with the example result) and why the JSON never travels to the browser.

## A real run (local only)

The original demo folder contains `ki_entwuerfe.py`. With `--run` it sends the 20 mails to the Claude API, one by one, with the system prompt and the knowledge base, and writes `daten/ergebnisse_live.json`.

1. Put the API key in a `.env` file next to the script and make sure `.env` is in `.gitignore`. The key never goes into a file that is committed, and never into the browser.
2. Load the key into the environment and run `python ki_entwuerfe.py --run`.
3. Check the new results by hand.
4. Only the resulting JSON would be committed: rebuild `data/inbox.json` from it and run `node tools/build.mjs`. That happens only after Iva has said yes («да»).

This page never calls an API. There is no key anywhere in the site.

## Accessibility and quality

- German page, readable without JavaScript, light and dark theme, WCAG 2.2 AA (axe: 0 serious or critical issues in both themes).
- Keyboard: the list is one tab stop; arrow keys, Home and End move between mails, Enter or Space opens one. The opened mail is announced. On phones the list comes first; opening a mail moves the focus to its title, and "Zurück zur Liste" returns to the same mail in the list.
- Reduced motion: the decision label appears without fading in.
- No requests to other servers, no cookies, no tracking.
- Checks: `qa/test-ki.mjs` (outside the repository).
