# PaperPop — storefront homepage

A self-contained, static Hebrew-first (RTL) homepage for **PaperPop**, built from
the PaperPop Design System (`templates/storefront-home/StorefrontHome.dc.html`).
No framework, no build step, no runtime CDN dependency — just HTML, CSS and a
little vanilla JS. Drop the folder on any static host.

## Structure

```
site/
├── index.html          # the whole homepage
├── styles.css          # design-system tokens + components, flattened
├── app.js              # inline SVG icons, hero carousel, mobile drawer
├── vercel.json         # clean URLs + long-cache headers for /assets
└── assets/
    ├── logo.svg                 # brand mark (used as favicon)
    ├── logo-wordmark.png        # header logo
    ├── logo-wordmark-cream.png  # footer logo (on burgundy)
    ├── fonts/Assistant-Regular.ttf
    ├── media/                    # hero video (mp4 + webm), no audio, + poster
    ├── products/*-tight.png      # the four sculptures
    └── process/{fold,glue}.png   # how-it-works photos
```

## Pages

- **`index.html`** — home: video hero → product gallery → how-it-works → gifts → about → footer.
- **`product.html?p=<id>`** — data-driven product page (`octopus` / `duck` / `heart` / `soccer`).
  Media gallery (large image + thumbnails, images & video) on one side, details on the other.
  Product data lives in the inline `PRODUCTS` object at the bottom of `product.html`.
- **`faq.html`** — שאלות ותשובות (accordion).

Home sections (top → bottom): sticky header · **video hero** (wide 16:9 muted loop, copy on the
reading-edge side; poster fallback under `prefers-reduced-motion`; swap the clip with
`ffmpeg -i NEW.mov -an -movflags +faststart -pix_fmt yuv420p -c:v libx264 -crf 24 assets/media/hero.mp4`) ·
**gallery** (cards link to `product.html?p=…`) · **how it works** (קבלת ערכה · קיפול והדבקה · הצגה לראווה) ·
**gift** · **about** ("מאחורי הקיפולים", transparent illustration that draws in on scroll) · footer.

Clicking a gallery card opens its product page; the WhatsApp purchase CTA lives on that page.

## Deploy to Vercel

The site is plain static files, so no framework preset is needed.

```bash
cd site
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

Or drag the `site/` folder into the Vercel dashboard ("Other" framework preset).
Locally, preview with any static server, e.g. `python3 -m http.server` inside `site/`.

## Content that is real vs. placeholder

**Real (brand-supplied):** product names, prices (₪45 / ₪65 / ₪45 / ₪45), "glue
not included", age 10+, WhatsApp-first purchasing, Instagram & YouTube links, all copy.

The purchase CTAs open WhatsApp (`+972 50-4427479`) with a pre-filled Hebrew message.

**Placeholders on the product page — replace with real values** (in the `PRODUCTS` object in `product.html`):
- `time` — assembly time per kit (currently "עד שעה / שעה וחצי" estimates)
- `size` — sculpture dimensions (currently "כ-15/18/20 ס״מ" placeholders; measure the real sculptures)

**Still to confirm / add before launch:**
- Assembly times & difficulty labels on the cards are reasonable estimates — confirm per kit.
- **Gifts band** wants a real lifestyle photo (a gift-moment). Until then it is a
  designed pink panel; drop an `<img class="pp-mpanel__media">` into that panel when ready.
- Shipping / returns / terms pages (footer links are placeholders marked *בהכנה*).
- Octopus colour variants (ורוד / צהוב / ירוק) — only תכלת has photography today.
