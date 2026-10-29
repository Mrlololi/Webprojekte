# KittyCats: an animation and layout demo

KittyCats is a single page about kittens that grow up into slightly grumpier cats, with a bit of Halloween cobweb on top. Since October 2026 it is the animation showcase of Webprojekte: the hand-drawn SVG kittens blink, flick their tails, stretch, change their mood and one walks along with your scroll. Every section uses a different layout technique and a different animation technique, and two small notes on the page («Technique» and «Animation») say which.

Live: <https://mrlololi.com/Webprojekte/kittycats/>

It's only a demo. No kittens are for sale and the contact form doesn't send anything.

## Animation

| # | Section | Animation technique |
|---|---|---|
| - | Top of the page | GSAP timeline: the kitten blinks and both cats flick their tails for about four seconds, then rest. ScrollTrigger replays it when the part comes back and pauses it off-screen. |
| 01 | A few honest questions | SVG path morph without a paid plugin: tail, eyelids and mouth have the same path commands in both moods, so GSAP tweens the numbers in the `d` attribute (`attr: { d }`). ScrollTrigger with `scrub` ties the mood to the scroll position. |
| 02 | From kitten to cat | GSAP ScrollTrigger: `ScrollTrigger.batch()` lifts the tiles into place and plays it backwards when you scroll back, so the entrance replays. Each kitten blinks once. |
| 03 | More kitties to choose from | CSS scroll-driven animation: each kitten stretches while its card comes into view, `animation-timeline: view()` inside `@supports`, no JavaScript. Browsers without it get an IntersectionObserver class instead. |
| 04 | About KittyCats | GSAP ScrollTrigger, scrubbed: from 768px the card drifts 40px against the text. On phones `gsap.matchMedia()` leaves only a fade. |
| 05 | Get more information | None, on purpose: nothing moves next to the form fields. |
| - | Between the sections | A small cat walks along a dashed line with the scroll position (ScrollTrigger, scrub). |

Rules: transform and opacity only (plus SVG attributes), loops pause off-screen, no pinning on phones, and with "reduce motion" every drawing shows its final state. Without JavaScript everything is visible and readable.

GSAP 3.15.0 (core and ScrollTrigger) is self-hosted in `../assets/vendor/` and loaded only on this page. Licence: GreenSock standard "no charge" license (https://gsap.com/standard-license), free for commercial sites. No club or paid plugins are used. The page's own motion code is `js/motion.js`.

## Sections and layout techniques

| # | Section | Technique |
|---|---|---|
| - | Top of the page | Fluid layout: `clamp()` for text and spacing, `aspect-ratio` keeps room for the drawing so nothing jumps |
| 01 | A few honest questions | `position: sticky`. The heading stays in its column, and each card sticks a bit lower than the one before, so they stack up. |
| 02 | From kitten to cat | CSS Grid. On phones `repeat(auto-fit, minmax(9.5rem, 1fr))`, from 768px four columns where the first tile takes 2 x 2 cells. |
| 03 | More kitties to choose from | Flexbox. `flex-wrap`, `flex: 0 1 15rem` and `justify-content: center`. Inside each card `margin-top: auto` pushes the button to the bottom. |
| 04 | About KittyCats | Two-column split. `grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)`, one column below 768px, same order in the HTML. |
| 05 | Get more information | Form grid. Two columns, full-width fields with `grid-column: 1 / -1`, error messages screen readers can hear. |
| 06 | Footer | `body` is a flex column and `main` grows (`flex: 1 0 auto`), so the footer stays at the bottom. Inside, `flex-wrap` lets the two parts move under each other. |

## Other details

- Light and dark theme with CSS custom properties (`light-dark()`). The first visit follows the system setting, after that the visitor's choice is saved in `localStorage` and shared with the other pages of the portfolio.
- All drawings are SVG written in code. There's one kitten and one cat, defined once as `<symbol>` and reused with `<use>`. The fur is `currentColor` and the light patches are see-through white, so the same drawing works for eight fur colours. The spider and the cobweb are SVG too. Because there are no photos, nothing needs lazy loading and nothing shifts while loading.
- The gallery tiles are toggle buttons (`aria-pressed`). On a computer, pointing at a tile already shows the grown-up cat. A tap, Enter or Space switches it on any device.
- "Get a call" on a cat card fills in the form with the cat's name and puts the cursor there.
- The form uses the browser's own checks (`validity`) with friendlier messages, linked with `aria-describedby`. The cursor jumps to the first field that needs fixing.
- The menu shows which section you're looking at (`IntersectionObserver` and `aria-current`).
- Skip link, visible focus on everything, a sensible tab order, and no animations when the system asks for less motion.

## Tech

Plain HTML and CSS with a little JavaScript. The page can be read without JavaScript too. No framework, no build step and no requests to other servers.

```
kittycats/
├── index.html        content and the SVG drawings
├── css/kittycats.css styles for this page (on top of ../assets/css/base.css)
└── js/main.js        gallery switch, form checks, menu highlight
```

## Content

The texts come from the first version from October 2025, which had four pages (Home, Gallery, About, Login): the questions at the top, the eight cats (Alex, Bob, Nick, Leila, Zuriko, Bamby, Kote, Piso), the mission and the form fields. What changed:

- The four pages are now one page with sections.
- The login page is gone. A fake login form on a portfolio looks like phishing, to browsers and to people.
- Bamby, Kote and Piso all had the same description in the old version. Now each has its own.
- The photos and Google Fonts were replaced with my own SVG drawings and system fonts.

## Run it locally

- The quick way: double-click `index.html`.
- Like on GitHub Pages: run `python -m http.server 8000` in the `Webprojekte` folder and open <http://localhost:8000/kittycats/>.

## Old address

The first version lived at mrlololi.github.io/KittyCats. That address now redirects here; the redirect lives in the repository `Mrlololi/KittyCats`.

## Put it on GitHub Pages

KittyCats goes online together with the whole `Webprojekte` repository, see the [main README](../README.md#hosting). It uses the shared files in `../assets/`, so upload the whole `Webprojekte` folder and not just `kittycats/`.
