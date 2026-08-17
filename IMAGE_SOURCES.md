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

## 2. Generated texture assets (original, made for this build)

These are **not stock photography**. They were generated programmatically for
this project (Python/Pillow, script recorded below) and are original work owned
by TG Media. They carry the "Signal from Noise" idea — interference, halftone
resolution, registration marks, film grain — without pretending to be
photographs of anything.

| File | What it is | Licence | Used on |
|---|---|---|---|
| `media/tex-grain.webp` | 256px tileable film-grain field | Original work, TG Media — free to use, modify, replace | Hero, services 04, work/studio intros, final CTAs |
| `media/tex-halftone.webp` | Halftone dot field, chaotic at one edge resolving to an ordered grid at the other | Original work, TG Media | Services 03, homepage interlude, orange sections |
| `media/tex-interference.webp` | Horizontal signal-interference bars, settling as they descend | Original work, TG Media | Homepage "problem" scene, services 01 figure |
| `media/tex-marks.webp` | Print registration marks and crop rules | Original work, TG Media | Services 02, Tom scene, contact aside |

Regenerate or edit them freely — they are decorative and nothing depends on
their exact content. They are applied via CSS as low-opacity overlays
(`.tex--grain`, `.tex--halftone`, `.tex--interference`, `.tex--marks`) and are
inverted automatically on dark colour fields.

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

Kept for reproducibility. Requires `pillow`.

```python
from PIL import Image, ImageDraw, ImageFilter
import random
random.seed(7)

# tex-grain.webp — tileable grain
g = Image.new('L', (512, 512))
px = g.load()
for y in range(512):
    for x in range(512):
        px[x, y] = random.randint(0, 255)
g = g.filter(ImageFilter.GaussianBlur(0.4)).resize((256, 256), Image.LANCZOS)
Image.merge('RGB', (g, g, g)).save('media/tex-grain.webp', 'WEBP', quality=60, method=6)

# tex-halftone.webp — dots, chaotic left to ordered right
W, H = 1600, 900
ht = Image.new('L', (W, H), 255); d = ImageDraw.Draw(ht); step = 14
for gy in range(0, H + step, step):
    for gx in range(0, W + step, step):
        t = gx / W
        j = (1 - t) * step * 0.55
        cx = gx + random.uniform(-j, j); cy = gy + random.uniform(-j, j)
        r = step * 0.46 * (1 - t * 0.55)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=0)
ht.convert('L').resize((900, 506), Image.LANCZOS).save(
    'media/tex-halftone.webp', 'WEBP', quality=52, method=6)

# tex-interference.webp — displaced bars settling downward
W, H = 1600, 900
ib = Image.new('L', (W, H), 255); d = ImageDraw.Draw(ib); y = 0
while y < H:
    t = y / H
    h = random.uniform(2, 26 * (1 - t) + 3)
    off = random.uniform(-260, 260) * (1 - t) ** 2
    d.rectangle([off, y, W + off, y + h], fill=random.choice([0, 0, 20, 45, 70]))
    y += h + random.uniform(3, 20 * (1 - t) + 4)
ib = ib.filter(ImageFilter.GaussianBlur(0.6))
Image.merge('RGB', (ib, ib, ib)).save('media/tex-interference.webp', 'WEBP', quality=80, method=6)

# tex-marks.webp — registration marks
W = H = 1200
rg = Image.new('L', (W, H), 255); d = ImageDraw.Draw(rg)
for _ in range(26):
    cx, cy = random.uniform(60, W - 60), random.uniform(60, H - 60)
    r = random.uniform(10, 30)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=0, width=2)
    d.line([cx - r * 1.7, cy, cx + r * 1.7, cy], fill=0, width=2)
    d.line([cx, cy - r * 1.7, cx, cy + r * 1.7], fill=0, width=2)
for _ in range(40):
    x1, y1 = random.uniform(0, W), random.uniform(0, H)
    d.line([x1, y1, x1 + random.uniform(-90, 90), y1], fill=90, width=1)
Image.merge('RGB', (rg, rg, rg)).save('media/tex-marks.webp', 'WEBP', quality=80, method=6)
```
