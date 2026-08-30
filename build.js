#!/usr/bin/env node
"use strict";
/* Generates kits/<slug>.html, sitemap.xml and the product-card region of
 * index.html from data/products.js.
 *
 *   node build.js            write files
 *   node build.js --check    verify committed output matches (exit 1 if stale)
 *
 * Node built-ins only — no package.json, no npm install. `--check` is meant to
 * run as the Vercel build command so a forgotten rebuild fails the deploy
 * instead of silently shipping a stale price.
 */

const fs = require("fs");
const path = require("path");

const { SITE, products, KIT_FACTS } = require("./data/products.js");
const MEDIA = require("./media.js");

const CHECK = process.argv.includes("--check");
const ROOT = __dirname;
const h = MEDIA.h;

/* ---------- helpers ---------------------------------------------------- */

// JSON.stringify does NOT escape "<", so a product name containing "</script>"
// would terminate the block. Escape the characters that can break out.
function jsonForScript(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function render(tpl, vars) {
  const out = tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`unknown template token ${m}`);
    return vars[k];
  });
  const leftover = out.match(/\{\{\w+\}\}/);
  if (leftover) throw new Error(`unresolved token ${leftover[0]} in output`);
  return out;
}

function abs(p) {
  return SITE.origin + "/" + String(p).replace(/^\//, "");
}

// Derived, so data/products.js stays declarative.
function decorate(p) {
  const url = `${SITE.origin}/kits/${p.slug}`;
  const waText = `היי! אני מעוניין/ת בערכת ${p.name} של ${SITE.brand} 🙂`;
  return {
    ...p,
    url,
    priceLabel: `${p.price} ₪`,
    title: `${p.name} · ${SITE.brand}`,
    wa: `https://wa.me/${SITE.waPhone}?text=` + encodeURIComponent(waText),
  };
}

/* ---------- product pages --------------------------------------------- */

function buildProductPage(tpl, p) {
  const first = p.media[0];
  if (first.type !== "image") {
    throw new Error(`${p.id}: media[0] must be an image so it can be the LCP element`);
  }
  const ws = MEDIA.widthsOf(first);
  // Preload must match the candidate <picture> selects (AVIF), not the fallback.
  const preloadSrcset = ws
    .map((w) => `${MEDIA.url(`${MEDIA.stemOf(first.src)}-${w}.avif`)} ${w}w`)
    .join(", ");

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        description: p.desc,
        image: abs(p.ogImage),
        url: p.url,
        sku: p.id,
        brand: { "@type": "Brand", name: SITE.brand },
        offers: {
          "@type": "Offer",
          url: p.url,
          priceCurrency: "ILS",
          price: String(p.price),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: SITE.brand },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "דף הבית", item: SITE.origin + "/" },
          { "@type": "ListItem", position: 2, name: "ערכות", item: SITE.origin + "/#gallery" },
          { "@type": "ListItem", position: 3, name: p.name },
        ],
      },
    ],
  };

  const facts = KIT_FACTS.map((f) =>
    `            <li${f.included ? "" : ' class="is-excluded"'}>` +
    `${h(f.text)}${f.included ? "" : ' <span class="pp-visually-hidden">(לא כלול)</span>'}</li>`
  ).join("\n");

  return render(tpl, {
    V: String(SITE.assetVersion),
    TITLE: h(p.title),
    NAME: h(p.name),
    DESC: h(p.desc),
    PRICE_LABEL: h(p.priceLabel),
    PRICE_AMOUNT: String(p.price),
    TIME: h(p.time),
    SIZE: h(p.size),
    AGE: h(p.age),
    URL: h(p.url),
    WA: h(p.wa),
    OG_IMAGE: h(abs(p.ogImage)),
    OG_IMAGE_ALT: h(p.card.alt),
    PRELOAD_SRCSET: h(preloadSrcset),
    PRELOAD_SIZES: MEDIA.PDP_SIZES,
    MAIN_MEDIA: MEDIA.mainMediaHTML(first, { eager: true }),
    NAV: p.media.length > 1 ? MEDIA.navHTML() : "",
    THUMBS: p.media.map((m, i) => MEDIA.thumbHTML(m, i, i === 0)).join(""),
    MEDIA_JSON: jsonForScript(p.media),
    JSONLD: jsonForScript(jsonld),
    FACTS: facts,
  });
}

/* ---------- homepage card region -------------------------------------- */

const START = "<!-- BUILD:gallery:start";
const END = "<!-- BUILD:gallery:end -->";

function buildGallery(products) {
  return products
    .map((p) => {
      const ws = MEDIA.widthsOf(p.card);
      const mid = ws[Math.floor(ws.length / 2)];
      const sizes =
        "(min-width:1201px) 219px, (min-width:861px) 234px, (min-width:381px) 39vw, 78vw";
      const eager = p === products[0];
      return `        <a class="pp-pcard" href="/kits/${p.slug}" aria-label="${h(p.name)}">
          <div class="pp-media">
            <picture>
              <source type="image/avif" srcset="${h(srcsetFor(p.card.src, ws, "avif"))}" sizes="${sizes}">
              <source type="image/webp" srcset="${h(srcsetFor(p.card.src, ws, "webp"))}" sizes="${sizes}">
              <img class="pp-media__art" src="${h(MEDIA.url(MEDIA.fallbackOf(p.card.src, mid)))}"
                   sizes="${sizes}" alt="${h(p.card.alt)}"
                   loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>
            </picture>
          </div>
          <div class="pp-pcard__body">
            <div>
              <h3 class="pp-pcard__name">${h(p.name)}</h3>
              <span class="pp-pcard__more">לפרטים <span class="pp-icon pp-icon--sm" data-icon="arrow-left"></span></span>
            </div>
            <span class="pp-pcard__price">${h(p.priceLabel)}</span>
          </div>
        </a>`;
    })
    .join("\n\n");
}

function srcsetFor(src, widths, ext) {
  const stem = MEDIA.stemOf(src);
  return widths.map((w) => `${MEDIA.url(`${stem}-${w}.${ext}`)} ${w}w`).join(", ");
}

function rewriteGallery(html, products) {
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s === -1 || e === -1) {
    throw new Error(
      "index.html is missing the BUILD:gallery markers — cannot own the card region"
    );
  }
  const head = html.slice(0, s);
  const tail = html.slice(e + END.length);
  return (
    head +
    START +
    " — generated from data/products.js, do not edit -->\n" +
    buildGallery(products) +
    "\n        " +
    END +
    tail
  );
}

/* ---------- sitemap ---------------------------------------------------- */

function buildSitemap(products, lastmod) {
  const urls = [
    { loc: SITE.origin + "/", priority: "1.0" },
    ...products.map((p) => ({ loc: p.url, priority: "0.8" })),
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <priority>${u.priority}</priority>\n  </url>`
      )
      .join("\n") +
    "\n</urlset>\n"
  );
}

/* ---------- main ------------------------------------------------------- */

function main() {
  const decorated = products.map(decorate);
  const tpl = fs.readFileSync(path.join(ROOT, "templates", "product.html"), "utf8");

  const outputs = new Map();

  for (const p of decorated) {
    outputs.set(path.join("kits", `${p.slug}.html`), buildProductPage(tpl, p));
  }

  const indexPath = path.join(ROOT, "index.html");
  const index = fs.readFileSync(indexPath, "utf8");
  outputs.set("index.html", rewriteGallery(index, decorated));

  // lastmod: reuse the existing value when unchanged so --check is stable and
  // the file does not churn on every build.
  const smPath = path.join(ROOT, "sitemap.xml");
  let lastmod = new Date().toISOString().slice(0, 10);
  if (fs.existsSync(smPath)) {
    const prev = fs.readFileSync(smPath, "utf8");
    const m = prev.match(/<lastmod>([\d-]+)<\/lastmod>/);
    const candidate = buildSitemap(decorated, m ? m[1] : lastmod);
    if (m && candidate === prev) lastmod = m[1];
  }
  outputs.set("sitemap.xml", buildSitemap(decorated, lastmod));

  // Validate every referenced asset exists before writing anything.
  const missing = [];
  for (const p of decorated) {
    const files = [p.ogImage];
    for (const m of p.media) {
      if (m.type === "video") {
        files.push(m.src, m.poster);
        if (m.webm) files.push(m.webm);
        continue;
      }
      const ws = MEDIA.widthsOf(m);
      const mid = ws[Math.floor(ws.length / 2)];
      for (const w of ws) {
        files.push(`${MEDIA.stemOf(m.src)}-${w}.avif`, `${MEDIA.stemOf(m.src)}-${w}.webp`);
      }
      files.push(MEDIA.fallbackOf(m.src, mid));
      files.push(`${MEDIA.stemOf(m.src)}-${ws[0]}.avif`); // thumbnail
    }
    for (const f of files) {
      if (!fs.existsSync(path.join(ROOT, f))) missing.push(`${p.id}: ${f}`);
    }
  }
  if (missing.length) {
    console.error("Missing assets:\n  " + missing.join("\n  "));
    process.exit(1);
  }

  if (CHECK) {
    let stale = 0;
    for (const [rel, content] of outputs) {
      const full = path.join(ROOT, rel);
      const cur = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
      if (cur !== content) {
        stale++;
        console.error(`STALE: ${rel}`);
      }
    }
    if (stale) {
      console.error(
        `\n${stale} generated file(s) do not match data/products.js.\n` +
          "Run `node build.js` and commit the result."
      );
      process.exit(1);
    }
    console.log(`build --check: ${outputs.size} file(s) up to date`);
    return;
  }

  fs.mkdirSync(path.join(ROOT, "kits"), { recursive: true });
  for (const [rel, content] of outputs) {
    fs.writeFileSync(path.join(ROOT, rel), content, "utf8");
    console.log(`wrote ${rel} (${Buffer.byteLength(content).toLocaleString()} bytes)`);
  }
}

main();
