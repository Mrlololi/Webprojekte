# Webprojekte by Iva Tsatskrialashvili

Two small web projects I rebuilt from scratch in 2026, plus a landing page that links to both.

Live: <https://mrlololi.github.io/Webprojekte/>

| Project | What it is | What you can see in the code | Live |
|---|---|---|---|
| [GeoAPP](geoapp/) | A quiz that helps Ukrainians in Georgia learn the Georgian numbers 0-30 | Plain JavaScript app, data in a JSON file, three interface languages, saved progress, keyboard controls, accessibility | [Open](https://mrlololi.github.io/Webprojekte/geoapp/) |
| [KittyCats](kittycats/) | A one-page layout demo with kittens drawn in SVG | CSS Grid, Flexbox, `position: sticky`, a two-column split, a form grid, light and dark theme | [Open](https://mrlololi.github.io/Webprojekte/kittycats/) |

## About me

I'm Iva Tsatskrialashvili, a Marketing Automation Engineer in Graz, Austria. I work with ActiveCampaign, Zapier, Leadpages and Wix. I'm studying Marketing & Sales at FH CAMPUS 02 Graz and come from mobile software development.

- LinkedIn: <https://www.linkedin.com/in/tsatskrialashvili-iva/>
- Malt: <https://www.malt.com/profile/ivatsatskrialashvili>

## What's in the folder

```
Webprojekte/
├── index.html            landing page
├── 404.html              "page not found", GitHub Pages shows it for any wrong address
├── README.md             this file
├── .nojekyll             tells GitHub Pages to serve the files as they are
├── assets/
│   ├── css/base.css      shared colours, type sizes, header, footer, buttons
│   ├── css/landing.css   styles for the landing page only
│   ├── js/theme.js       light/dark switch, shared by all three pages
│   ├── favicon.svg       favicon of the landing page
│   ├── icons/            SVG favicons and 180x180 touch icons for each page
│   └── og/               1200x630 preview images for social media
├── geoapp/               see geoapp/README.md
└── kittycats/            see kittycats/README.md
```

## Shared design

All three pages load `assets/css/base.css`, so they look like they belong together.

- Colours are CSS custom properties written with `light-dark()`, so one variable covers both themes. Every text colour has at least 4.5:1 contrast with its background. A few examples: text `#1c1b19` on `#f7f5f0` is 15.8:1, the GeoAPP teal `#0f766e` on white is 5.5:1 and the KittyCats orange `#b4490c` on white is 5.4:1. The old KittyCats orange `#da6517` only reaches 3.6:1, so it's used for decoration only.
- Fonts are the ones already on your device, so nothing has to be downloaded or licensed. Body text uses `system-ui`, headings use a serif. Font sizes scale with `clamp()`.
- The CSS is split into cascade layers (`@layer tokens, reset, base, components, page`). That keeps selectors simple, and there's no `!important` and no inline `style` anywhere.
- The theme follows your system setting on the first visit. If you click the switch, the choice is saved in `localStorage` (key `iva-portfolio-theme`) and applies to all three pages.

## Run it locally

Double-click `index.html`. Everything works, GeoAPP included: when it's opened from disk it reads its data from `data/numbers.js`, because browsers block `fetch()` for local files.

If you want it exactly like on GitHub Pages, start any small web server in this folder, for example:

```bash
python -m http.server 8000
```

and open <http://localhost:8000/>.

## Put it on GitHub Pages

1. Create a public repository called `Webprojekte` under `mrlololi` and push the contents of this folder to the `main` branch. `index.html` should be at the top level of the repository.
2. In the repository go to Settings, then Pages. Under "Build and deployment" choose "Deploy from a branch", pick `main` and `/ (root)`, and save.
3. About a minute later the site is online at `https://mrlololi.github.io/Webprojekte/`.

The canonical and Open Graph links in the pages point to that address. If you pick a different repository name or a custom domain, replace `https://mrlololi.github.io/Webprojekte/` in the three `index.html` files, and `/Webprojekte/` in `404.html` (that page can show up at any address, so its links start at the root).

### Quick check after uploading

- Open each page on your phone and on a computer.
- GeoAPP offline: open GeoAPP once, then switch on airplane mode and reload. The quiz should still load. On Android Chrome you can also add it to the home screen ("Install app").
- Run Lighthouse in Chrome (F12, tab "Lighthouse") on each page.

### The old links on Malt

The Malt profile still links to `mrlololi.github.io/GeoAPP` and `mrlololi.github.io/KittyCats`. You can either change those links, or put a redirect into the `index.html` of each old repository:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>GeoAPP has moved</title>
  <link rel="canonical" href="https://mrlololi.github.io/Webprojekte/geoapp/">
  <meta http-equiv="refresh" content="0; url=https://mrlololi.github.io/Webprojekte/geoapp/">
</head>
<body>
  <p>GeoAPP has moved to <a href="https://mrlololi.github.io/Webprojekte/geoapp/">mrlololi.github.io/Webprojekte/geoapp</a>.</p>
</body>
</html>
```

For KittyCats, use `kittycats` instead of `geoapp`.

## Images and rights

Everything here was made for this project. The cats and icons are SVG written by hand, and the social media images and touch icons were drawn with simple shapes and system fonts. Nothing was copied from the old sites or from anyone else, and there are no placeholder images.
