# Webprojekte by Iva Tsatskrialashvili

Web projects built in 2026, plus a landing page that links to them. Part of [mrlololi.com](https://mrlololi.com/) and in the same look: the logo «drei Kugeln», the pastel palette, the fonts and the mascots.

Live: <https://mrlololi.com/Webprojekte/> (German, or English with `?lang=en`)

| Project | What it is | What it shows | Live |
|---|---|---|---|
| [GeoAPP](geoapp/) | A quiz for people from Ukraine in Georgia: the Georgian numbers 0-30, with an explanation of counting in twenties | A learning app without a framework, three interface languages, saved progress, offline | [Open](https://mrlololi.com/Webprojekte/geoapp/) |
| [Language Starter](language-starter/) | First phrases for international youth exchanges: 45 phrases in 42 languages, cards to listen to, a quiz and a one-page phrase card to print | One JSON file for 1890 entries, Web Speech API with a fallback for recordings, print CSS for exactly one A4 page, review mode for native speakers | [Open](https://mrlololi.com/Webprojekte/language-starter/) |
| [KI im Kundenservice](ki-kundenservice/) | The full inbox of a made-up photo school: 20 emails, sorted by AI, with draft replies and the hard cases handed to a person | AI with clear rules and human approval; an example run, nothing is sent, no API key in the browser | [Open](https://mrlololi.com/Webprojekte/ki-kundenservice/) |
| [KittyCats](kittycats/) | A page of hand-drawn SVG kittens that move as you scroll | GSAP ScrollTrigger, CSS scroll-driven animation, SVG path morphing, plus the layout techniques Grid, Flexbox and sticky | [Open](https://mrlololi.com/Webprojekte/kittycats/) |

## About me

I'm Iva Tsatskrialashvili (he/him), a Marketing Automation Engineer in Graz, Austria. Services and prices: <https://mrlololi.com/>

- LinkedIn: <https://www.linkedin.com/in/tsatskrialashvili-iva/>
- Malt: <https://www.malt.de/profile/ivatsatskrialashvili>

## What's in the folder

```
Webprojekte/
├── index.html              landing page, German and English in one file
├── 404.html                "page not found", GitHub Pages shows it for any wrong address
├── sitemap.xml             landing page, the four projects and their language variants
├── assets/
│   ├── css/base.css        shared tokens, fonts, header, footer, buttons (all pages)
│   ├── css/landing.css     landing page and 404
│   ├── js/theme.js         light/dark switch, shared by all pages
│   ├── js/landing.js       landing page: language details, reveals, preview loops
│   ├── js/balls3d.js       the 3D logo balls (built from tools/balls3d.src.js, includes parts of OGL)
│   ├── fonts/              Bricolage Grotesque, Atkinson Hyperlegible Next, EB Garamond italic (SIL OFL)
│   ├── img/                the photo on the landing page
│   ├── vendor/             GSAP 3.15 core and ScrollTrigger (KittyCats only)
│   ├── favicon.svg         the mrlololi icon «drei Kugeln»
│   ├── icons/              favicons and touch icons of the projects
│   └── og/                 1200x630 preview images for social media
├── tools/balls3d.src.js    source of the 3D balls
├── geoapp/                 see geoapp/README.md
├── language-starter/       see language-starter/README.md
├── ki-kundenservice/       see ki-kundenservice/README.md
└── kittycats/              see kittycats/README.md
```

## Shared design

- **Look:** the header lockup of mrlololi.com on a light translucent bar, a small «Webprojekte» label, the project links, and the theme switch. The dark footer carries the lockup with the tagline «Logik, Lösung, Live.» (German pages) or «Logic, Loop, Live.» (all others); only the landing page has the three waving mascots.
- **Colours** are CSS custom properties written with `light-dark()`: soft ink `#2B2A33` on warm paper, pastels pink, blue, pistachio, lavender and peach as surfaces. The dark values were made for Webprojekte. Every text pair passes WCAG AA (4.5:1) in both themes. GeoAPP keeps its teal and KittyCats its orange, because they carry meaning there.
- **Fonts** are self-hosted (no requests to other servers): Bricolage Grotesque for headings, Atkinson Hyperlegible Next for text, EB Garamond italic for one accent word. They cover Latin only, so Georgian, Armenian, Greek and Cyrillic use the fonts of the device.
- **Motion:** small and calm. Cards reveal on scroll and again when you come back, loops run only while visible, hover effects only with a mouse. With "reduce motion" switched on, every animation shows its final state.
- **3D:** the three logo balls on the landing page are soft 3D spheres (WebGL with [OGL](https://github.com/oframe/ogl), Unlicense). They load after the page is idle and only on devices with a mouse, WebGL and no reduced-motion setting; everyone else sees the flat logo. They pause off-screen and in hidden tabs.
- The CSS is split into cascade layers (`@layer tokens, reset, base, components, page`), so selectors stay simple.
- The theme follows your system on the first visit. A click on the switch is saved in `localStorage` (`iva-portfolio-theme`) and applies to all pages. The landing page language is saved under `iva-webprojekte-lang`.

## Run it locally

Start any small web server in this folder, for example:

```bash
python -m http.server 8000
```

and open <http://localhost:8000/>. (Opened from disk, the pages also work, but fonts and the 3D balls need a server.)

## Hosting

The repository is published with GitHub Pages (branch `main`, folder `/`) under <https://mrlololi.com/Webprojekte/>. The old addresses `mrlololi.github.io/GeoAPP` and `mrlololi.github.io/KittyCats` redirect here; those redirects live in the repositories `Mrlololi/GeoAPP` and `Mrlololi/KittyCats`.

## Images and rights

Everything here was made for this project. The cats, mascots and icons are SVG drawn by hand, the social media images are rendered from HTML. The photo is Iva's own. Fonts: SIL Open Font License. GSAP: GreenSock standard "no charge" license. OGL: Unlicense.
