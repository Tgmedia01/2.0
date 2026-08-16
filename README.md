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
robots.txt, sitemap.xml
```

## Design system — Signal from Noise

The homepage's organising idea is a business turning confusion into clarity.
Elements start fragmented, disordered or unresolved and settle into a clear,
aligned structure as you read or scroll — the hero headline resolves out of
typographic noise, transformation pairs untangle into clean type, and the
process section's line straightens as you move through it. The balance is
deliberately weighted toward clarity: roughly 70% confident/resolved, 30%
controlled disruption. Services, work and other interior pages stay in the
resolved, service-led register throughout — the disorder motif belongs to the
homepage's narrative, not the whole site.

- **Colour** — ink `#070707`, paper `#ffffff`, fog `#f2f2f2`, stone `#a2a2a9`,
  graphite `#797979`, cobalt `#2445ff` (functional accent — focus rings,
  current-page marker, service/CTA sections), plus `--signal` (`#ff3d1a`), a
  single functional orange-red intervention used exactly once site-wide (the
  availability status dot in the hero). Tokens live at the top of `styles.css`.
- **Type** — Newsreader (serif, weight 400) reserved for major statements
  (hero, section headlines, big display CTAs); Archivo (grotesk sans) for
  navigation, body copy, services and labels. Italics are a rare accent, not
  a running style. Heading scale: `.h-27`, `.h-a`…`.h-g` (serif) and
  `.h-sans-a`…`.h-sans-c` (sans, for services/process/labels). One-off
  `max-width`/`margin` values for a specific headline stay as inline style —
  that is content art direction, not a system value.
- **Layout** — full-bleed canvas, gutters `clamp(20px, 3vw, 44px)`, a small
  section-spacing scale (`--sp-1`…`--sp-4`), max 4px corner radius, no
  gradients/shadows/glassmorphism/pill buttons.
- **Motion** — `shared.js`: an opening ident (homepage, once per session), the
  hero's noise-to-clarity entrance and its interactive noise/clarity rail
  (a native range input, fully keyboard-operable), the transformation
  section's scroll-triggered resolve, the cobalt services accordion
  (hover/focus/click/keyboard), the process section's scroll-driven SVG line
  that untangles as you scroll, crop reveals on images, magnetic CTAs,
  subtle pointer drift and a short route wipe between pages (with a timeout
  fallback so it can never get stuck). Everything respects
  `prefers-reduced-motion`, and every "starts hidden/collapsed" effect is
  gated behind a `*--enhanced` class added by JavaScript at the moment it
  takes over — with JavaScript off, all content renders in its fully
  readable, already-resolved state instead of staying hidden.

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
