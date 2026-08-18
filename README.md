# TG Media — site files

Static HTML/CSS/JS site for tgmedia.uk. No build step, no framework — every
page is plain HTML that links to one shared stylesheet and one shared script.

## File structure

```
index.html                  Home
work.html                   Work archive
project-barstudios.html     Bar Studios — full case study
project-westbury.html       Westbury Music — project notes (pending client sign-off)
project-purplegranite.html  Purple Granite — project notes (pending client sign-off)
project-hairroom.html       Redirects to work.html#hair-room (archive entry only)
project-alpinemi.html       Redirects to work.html#alpine-mi (archive entry only)
project-aura.html           Redirects to work.html (retired — template/demo content)
project-studio-beta.html    Redirects to work.html (retired — template/demo content)
project-template.html       Redirects to work.html (retired — duplication template)
services.html                What I do and how it is quoted
about.html                   Studio / about page
contact.html                 Start a project — enquiry form
privacy.html, cookies.html, terms.html    Legal pages
404.html                     Not-found page
styles.css                   All shared styles — colours, type, layout, components
shared.js                    All shared behaviour — motion, nav, enquiry form
barstudios-*.png             Real client assets shipped on the site
IMAGE_SOURCES.md             Every image: origin, licence, where it is used
robots.txt, sitemap.xml
```

## Design system — Exposed Structure

The site is built from full-bleed **scenes** rather than one white section
repeated. Each scene commits to a colour field, a density and a type voice, and
the page is composed so those alternate: paper into ink into fog into cobalt
into blueprint, dense reading areas against wide typographic moments. The
vibe is a gallery frame mixed with a blueprint — deconstructed industrial,
not streetwear industrial: no hazard marks, no diagonal tape, no quotation
marks as decoration.

The organising idea is a business turning confusion into clarity. Elements
start fragmented, blurred, tangled or misaligned and resolve as you read — the
hero headline settles out of typographic noise, the transformation pairs
un-blur into alignment, and the process line untangles as it travels between
the four stages. Roughly 70% confident/resolved to 30% controlled disruption.

- **Colour** — ink `#070707`, paper `#ffffff`, fog `#f2f2f2`, stone `#a2a2a9`,
  graphite `#797979`, cobalt `#2445ff`, and a pale cobalt-tinted blueprint
  ground `#eef1ff` for the fourth field. Applied as whole-scene fields via
  `.field-paper` / `.field-fog` / `.field-ink` / `.field-cobalt` /
  `.field-blueprint`. Each field re-points `--fg`, `--fg-soft`, `--fg-faint`,
  `--line` and `--accent`, so type, rules and links invert as a set instead of
  being overridden one at a time.
- **Type** — Archivo (to 800) carries structure, navigation and every oversized
  display word; Newsreader carries statements and reading moments. Scales:
  `.mega` / `.mega-fit` / `.mega--serif` for display, `.h-a`…`.h-g` (serif) and
  `.h-sans-a`…`.h-sans-c` (grotesk) beneath. Meta/spec rows use tabular
  figures (`font-variant-numeric: tabular-nums`) so numbers read like a
  technical drawing's dimension line.
- **Texture** — CSS-only, no bitmap assets. `.tex--grid` / `.tex--grid-fine`
  draw a fine exposed 1px grid with `repeating-linear-gradient()`, tinted
  cobalt on the blueprint field and inverted to a light line on dark fields.
- **Structural detail** — `.mark-frame` snaps four cobalt registration ticks
  onto a card's corners on hover/focus; `.img-load` shows a blueprint-grid
  skeleton under an image until it decodes; `[data-draw]` rules draw
  themselves in left-to-right on scroll, alongside the existing `[data-rise]`
  fades and `[data-reveal]` clip-path opens.
- **Layout** — `.wrap` for contained content, scenes for full-bleed colour,
  `.scene--overlap` to interlock two fields, `.edge` for the vertical
  marginalia. Max 4px radius; no gradients, shadows, glassmorphism or pills.

### Page art direction

Each main page has its own composition rather than one reusable template:

| Page | Direction |
|---|---|
| Home | Nine scenes: hero, ink problem, full-viewport transformation, sticky services takeover, blueprint interlude, black Tom, travelling process line, compact work strip, cobalt ending |
| Services | Boldest type on the site. Four blocks alternating ink / paper / cobalt / fog, each with a different internal layout; blueprint ending |
| Studio | Personal and dense — facts immediately, a numbered ladder, a black working section, one loud blueprint-field principle |
| Work | Image-led opening, then an editorial index with oversized names and hover previews. Not an equal card grid |
| Projects | Each opens in its own colour: Bar Studios monochrome, Westbury cobalt, Purple Granite stone |
| Contact | Split — black colour field carrying the message, plain paper panel carrying the form |
| Legal / 404 | Deliberately calm and readable, brand details kept small |

## Motion

`shared.js`, no libraries. One rAF loop, IntersectionObserver for entrances,
SVG path animation for the process line.

- Hero resolves in ~1.2s: lines rise into place, noise fragments flicker out.
- Scenes rise in on entry; the transformation rows un-blur and align.
- Services becomes a pinned sequence where each discipline takes the viewport,
  driven by scroll and operable by pointer, keyboard (rail + arrow keys) and
  touch. Below 760px, or under reduced motion, it degrades to four stacked
  colour bands.
- The process line is a single SVG path that untangles as it travels between
  stages; the marquee only animates while on screen.
- Route changes use a fast cobalt wipe with a timeout fallback.

**Two rules hold everywhere:**

1. **Nothing is hidden by CSS alone.** Every "starts hidden" state is gated
   behind a class JavaScript adds (`.js-motion`, `.svc--enhanced`,
   `.transform--enhanced`, `.process--enhanced`). With JavaScript off, every
   page renders complete — this is tested, not assumed.
2. **Every hide-to-animate carries a timeout sweep**, so a missed observer or a
   throttled frame can never leave content invisible.

All of it respects `prefers-reduced-motion`.

## Editing content

Open the relevant `.html` file in any editor and change the text directly —
there are no template placeholders to hunt for. Keep the voice first-person
singular ("I", not "we") — TG Media is one person. Don't add clients,
statistics, outcomes or testimonials that are not confirmed; an unconfirmed
project stays in the typographic archive on `work.html` rather than getting
invented imagery.

### Adding a project

There's no template file to duplicate. Copy the structure of
`project-barstudios.html` (full case study) or `project-westbury.html`
(pending notes) into a new `project-<slug>.html`, link it from `work.html`
and from the relevant `case-nav` prev/next links on neighbouring project
pages.

### Colours / type

Edit the custom properties at the top of `styles.css` (`:root { ... }`).

## Contact form

Posts to Formspree (`https://formspree.io/f/myklyzqv`). Works as a plain POST
with JavaScript off; with JS on, `shared.js` validates the required fields
inline, submits by `fetch`, and swaps in a success or failure state without
leaving the page. Spam protection is a honeypot field (`_gotcha`, hidden
off-screen) — Formspree's own convention. To change the endpoint, update the
form's `action` attribute in `contact.html`.

## Deploying

Any static host works — GitHub Pages, Netlify, Cloudflare Pages. Upload the
files as they are; there is nothing to build or install.
