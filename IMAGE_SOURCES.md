# Image sources

Every visual asset in this repository, where it came from, its licence, and
where it is used. Nothing here is hotlinked — all files are committed to the
repo and served from it.

---

## 1. Client project imagery (real work)

These are genuine assets from a real TG Media project, supplied by the client
and used only on that project's own pages.

| File | Subject | Source | Licence | Used on |
|---|---|---|---|---|
| `barstudios-redbull.png` | Production still from the Bar Studios archive | Bar Studios (client-supplied) | Used with client permission, as a record of work carried out for them | `work.html` (full-bleed opening), `project-barstudios.html` (hero) |
| `barstudios-homepage.png` | Bar Studios homepage screenshot | TG Media / Bar Studios | Own work + client permission | `index.html` (work strip), `work.html` (hover preview), `project-barstudios.html` |
| `barstudios-mobile.png` | Bar Studios site on a phone | TG Media / Bar Studios | Own work + client permission | `project-barstudios.html` |
| `barstudios-wordmark.png` | Bar Studios wordmark | Bar Studios (client-supplied) | Client's own brand asset, shown as a record of work | `project-barstudios.html` |
| `barstudios-icon.png` | Bar Studios icon | Bar Studios (client-supplied) | Client's own brand asset, shown as a record of work | `project-barstudios.html` |

**Rule:** client assets appear only in the context of that client's project.
They are never reused as decoration elsewhere on the site.

---

## 2. Texture system (CSS-only, no image assets)

The old grain/halftone/interference/registration-mark bitmaps have been
retired along with Signal Orange. Every scene texture is now a `.tex--grid` /
`.tex--grid-fine` overlay drawn with `repeating-linear-gradient()` — a fine
exposed 1px grid, cobalt-tinted on the blueprint field and light-on-dark on
ink/cobalt fields — rather than a rasterised image. There is nothing to
licence or regenerate: the pattern is defined once in `styles.css` (`.tex`,
`.tex::after`) and reused everywhere a scene needs atmospheric depth.

---

## 3. Stock photography: not used, by design

The brief allowed licensed stock imagery from Unsplash or Pexels for services,
studio atmosphere, process, interludes and textures. **It could not be
downloaded in this build environment:** outbound requests to
`images.unsplash.com` and `images.pexels.com` are refused by the network egress
policy (`403` at the proxy CONNECT stage). `fonts.googleapis.com` and
`api.github.com` pass, so this is a deliberate host restriction, not a network
fault. Rather than hotlink (explicitly ruled out) or fake it, the two slots
that might otherwise have held a photograph are filled with an original
abstract composition built from the same textures and colours as the rest of
the site — and that composition is the final design for those slots, not a
stand-in.

### The signal panel: final artwork, not a placeholder

Two places on the site carry the composition (`.signal-panel`), built from the
halftone texture, the brand colours and the site's own resolve animation: bars
that arrive scattered and settle into an aligned stack, with one cobalt bar
carrying the signal. This is the finished, permanent artwork for those
slots — an intentional part of the Signal from Noise visual system, not a
stand-in awaiting photography. Neither shows any placeholder text to visitors.

| Location | What is there |
|---|---|
| `index.html`, "Direct with Tom" scene | Paper composition, dark bars, one cobalt signal bar |
| `about.html`, closing section | Ink composition, light bars, one cobalt signal bar |

Each is marked in the HTML with a comment directly above the block. The
compositions are decorative, so they carry `aria-hidden="true"`.

---

## 4. Fonts

| Family | Source | Licence | Used for |
|---|---|---|---|
| Archivo (400–800, italic) | Google Fonts | SIL Open Font License 1.1 | Navigation, body copy, all oversized display words, labels |
| Newsreader (300/400, italic) | Google Fonts | SIL Open Font License 1.1 | Statements, editorial headlines, quotes |

Loaded via a `<link>` in the `<head>` of every page. Self-host if you later
want to drop the Google Fonts request (it is the only third-party request the
site makes, and is noted in the cookie policy).

---

## 5. Texture generation script

Retired. The `media/tex-*.webp` bitmaps this section used to document
(grain, halftone, interference, registration marks) have been removed from
the repo along with Signal Orange — see §2. There is nothing left to
regenerate; the grid overlay is pure CSS.
