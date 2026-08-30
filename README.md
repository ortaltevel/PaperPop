# PaperPop — storefront

Static Hebrew-first (RTL) storefront for **PaperPop**. No framework and no
runtime dependencies: HTML, CSS, vanilla JS. The four product pages are
generated at author time by a small Node script so their content is present in
the raw HTML (crawlers and WhatsApp link previews do not run JavaScript).

## Structure

```
site/
├── index.html            # homepage; the product-card region is machine-owned
├── kits/<slug>.html      # GENERATED product pages — do not edit
├── 404.html
├── styles.css            # design-system tokens + components, flattened
├── app.js                # icons, hero video gate, drawer, about draw, scrollspy,
│                         #   PDP gallery hydration
├── media.js              # gallery markup — shared by build.js AND the browser
├── build.js              # generator (Node built-ins only)
├── data/products.js      # SINGLE SOURCE OF TRUTH (names, prices, media)
├── templates/product.html
├── tools/                # one-off image + markup helpers
├── sitemap.xml           # GENERATED
├── robots.txt
├── vercel.json           # clean URLs, redirects, cache + security headers
├── .vercelignore         # keeps masters/build sources out of the deploy
└── assets/
    ├── og/               # 1200x630 link-preview images
    ├── products/         # <name>-<width>.avif|webp + one .fallback.*
    ├── process/ media/   # same width-suffixed convention
    └── logo*.svg
```

## Editing content

**All product data lives in `data/products.js`.** Change a price, name,
description, size or media list there, then:

```bash
node build.js          # regenerates kits/*.html, sitemap.xml, index.html cards
```

Commit the regenerated files. `node build.js --check` re-derives everything and
exits non-zero if the committed output is stale — run it in CI/as the Vercel
build command so a forgotten rebuild cannot ship a wrong price.

Do **not** hand-edit `kits/*.html`, `sitemap.xml`, or anything between the
`<!-- BUILD:gallery:start -->` / `end` markers in `index.html`. Everything else
in `index.html` (hero, how-it-works, gift, about, FAQ) is hand-authored.

## Images

`tools/optimize-images.py` (Python 3 + Pillow, both preinstalled on macOS)
generates responsive `AVIF` + `WebP` variants plus one universal fallback:

```bash
python3 tools/optimize-images.py
```

Filenames are width-suffixed (`Get-900.avif`), which is what lets `/assets` keep
a 1-year `immutable` cache header. Quality is tuned to a measured VMAF ≥ 93.
**The suffix encodes width only, not quality** — if you retune quality, change
the filename too or returning visitors keep the old copy.

Every `<picture>` wrapper needs `display:contents` (already in `styles.css`).
Without it the percentage (`78%`/`86%`) and `inset:0` image sizing would resolve
against `<picture>` instead of the intended parent and break silently.

## Local preview

```bash
python3 -m http.server 8799     # then open http://127.0.0.1:8799
```

Note that `cleanUrls` is a Vercel feature, so locally you browse
`kits/duck.html` rather than `/kits/duck`.

## Deploy

Plain static files; no framework preset. Pushing to `main` deploys production;
`preview` is a long-lived preview branch.

## Content status

**Real (brand-supplied):** product names, prices (45/65/45/45 ₪), sizes,
age 10+, "glue not included", WhatsApp-first purchasing, all copy.

**Still an estimate — confirm before relying on it:** the per-kit assembly
`time` values in `data/products.js`. They are now server-rendered, so Google and
AI answer engines will quote them as fact.

**Not built yet:** shipping / returns / terms pages.
