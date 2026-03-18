# TG MEDIA — Site Files
## File Structure

```
tg-media-site/
├── index.html          ← Home page
├── about.html          ← About page
├── services.html       ← Services page
├── work.html           ← Work / Archive listing
├── project-aura.html       ← Project case study (template)
├── project-studio-beta.html ← Project case study (dark version)
├── contact.html        ← Contact page
├── styles.css          ← All shared styles (edit colours/fonts here)
├── shared.js           ← All shared JS: cursor, preloader, animations
└── README.md           ← This file
```

---

## How to edit content

Every editable section is marked with a comment like:
```html
<!-- EDIT: Your tagline here -->
```

### Text
Just open the file in any text editor (Notepad, VS Code, etc.) and find the comment, then change the text below it.

### Images
Find any `<img src="https://images.unsplash.com/...">` and replace the URL with:
- A URL from your WordPress media library (right-click image → Copy URL)
- Or any hosted image URL

### Colours / Brand
Open `styles.css` and change these 4 lines at the top:
```css
--theme-color: #0033FF;       /* Main blue — change to your brand colour */
--highlight-color: #FF6309;   /* Orange accent */
--off-white: #F2F2F2;         /* Background */
--black: #080808;             /* Text / dark sections */
```

---

## How to add a new project

1. Duplicate `project-aura.html` and rename it e.g. `project-myproject.html`
2. Edit all the `<!-- EDIT: ... -->` sections inside
3. Open `work.html` and copy one of the project card blocks, update the `href`, image, and title
4. Update the "NEXT PROJECT" link at the bottom of neighbouring project pages

---

## How to deploy (free options)

### Option A — GitHub Pages (recommended, free forever)
1. Create a free account at github.com
2. Create a new repository
3. Upload all these files
4. Go to Settings → Pages → set source to main branch
5. Your site will be live at `yourusername.github.io/repo-name`
6. You can point a custom domain to it for free

### Option B — Netlify (free, drag and drop)
1. Go to netlify.com and create a free account
2. Drag the entire `tg-media-site` folder onto the deploy area
3. Done — live in seconds with a URL like `random-name.netlify.app`
4. Add your custom domain in settings

### Option C — Cloudflare Pages (free)
1. Go to pages.cloudflare.com
2. Connect your GitHub repo or upload directly
3. Free with unlimited bandwidth

---

## Contact form setup (Formspree — free tier)

The contact form is currently set to show a browser alert.
To make it actually send emails to you:

1. Go to formspree.io and create a free account
2. Create a new form — you'll get an ID like `xpzgkwqr`
3. Open `contact.html` and find this line:
   ```html
   action="https://formspree.io/f/YOUR_FORM_ID"
   ```
4. Replace `YOUR_FORM_ID` with your actual ID
5. Remove the `onsubmit="handleSubmit(event)"` attribute from the form tag
6. Delete the `handleSubmit` function at the bottom of the file

Free tier allows 50 submissions/month.

---

## WordPress option

If you want to keep WordPress:
1. Install the "Insert Headers and Footers" plugin
2. Create a blank page template (or use a page builder with a blank canvas)
3. Paste each HTML file's content into a Custom HTML block
4. The CSS and JS files need to be uploaded to your media library or child theme
