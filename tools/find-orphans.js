#!/usr/bin/env node
"use strict";
/* List generated image variants on disk that nothing can request.
 *
 *   node tools/find-orphans.js            report only
 *   node tools/find-orphans.js --delete   remove them
 *
 * Why this is not a simple "grep the HTML" job: only media[0] gets <picture>
 * markup at build time. Items 2..N are rendered at RUNTIME by app.js from the
 * #pdpMedia JSON payload, so their 600/800 variants appear in no HTML file. A
 * naive scan reports ~86 false positives. So the expected set is derived from
 * data/products.js — the same source build.js validates against — plus whatever
 * the hand-authored pages reference statically.
 */

const fs = require("fs");
const path = require("path");
const { products } = require("../data/products.js");
const MEDIA = require("../media.js");

const ROOT = path.join(__dirname, "..");
const DELETE = process.argv.includes("--delete");
const expected = new Set();

function addMedia(m) {
  if (m.type === "video") {
    [m.src, m.webm, m.poster].filter(Boolean).forEach((f) => expected.add(f));
    return;
  }
  const ws = MEDIA.widthsOf(m);
  const mid = ws[Math.floor(ws.length / 2)];
  const stem = MEDIA.stemOf(m.src);
  for (const w of ws) {
    expected.add(`${stem}-${w}.avif`);
    expected.add(`${stem}-${w}.webp`);
  }
  expected.add(MEDIA.fallbackOf(m.src, mid));
  expected.add(`${stem}-${ws[0]}.avif`); // thumbnail
  expected.add(m.src);                   // master
}

for (const p of products) {
  p.media.forEach(addMedia);
  addMedia({ ...p.card, type: "image" });
  if (p.ogImage) expected.add(p.ogImage);
}

// Anything referenced literally by a hand-authored page or the stylesheet.
const STATIC = ["index.html", "product.html", "404.html", "styles.css", "app.js", "media.js"];
const RE = /(?:src|href|poster)="([^"#]+)"|srcset="([^"]+)"|url\(\s*"?([^")]+)"?\s*\)/g;
for (const f of STATIC) {
  const full = path.join(ROOT, f);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, "utf8");
  let m;
  while ((m = RE.exec(text))) {
    const vals = m[1] ? [m[1]] : m[2] ? m[2].split(",").map((x) => x.trim().split(/\s+/)[0]) : [m[3]];
    for (const v of vals) {
      if (v) expected.add(v.replace(/^\/+/, "").split("?")[0]);
    }
  }
}
// The legacy page derives variant names in JS, same shape as media.js.
const legacy = fs.readFileSync(path.join(ROOT, "product.html"), "utf8");
const ITEM = /\{\s*type:"(image|video)",\s*src:"([^"]+)"(?:,\s*widths:\[([^\]]*)\])?/g;
let it;
while ((it = ITEM.exec(legacy))) {
  if (it[1] === "video") continue;
  const ws = it[3] ? it[3].split(",").map((x) => parseInt(x, 10)) : [400, 600, 800];
  addMedia({ type: "image", src: it[2], widths: ws });
}

// Walk assets/ and flag generated variants nobody expects.
const GENERATED = /-\d+\.(avif|webp)$|\.fallback\.(jpg|png)$/;
const orphans = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);
    if (e.isDirectory()) {
      if (e.name === "כדורגל" || e.name === "og") continue;
      walk(full);
    } else if (GENERATED.test(e.name) && !expected.has(rel)) {
      orphans.push({ rel, size: fs.statSync(full).size });
    }
  }
})(path.join(ROOT, "assets"));

const total = orphans.reduce((s, o) => s + o.size, 0);
console.log(`expected variants: ${expected.size}`);
console.log(`orphaned on disk : ${orphans.length} (${total.toLocaleString()} bytes)`);
for (const o of orphans) console.log(`  ${o.rel}  ${o.size.toLocaleString()}`);
if (DELETE) {
  orphans.forEach((o) => fs.unlinkSync(path.join(ROOT, o.rel)));
  console.log(orphans.length ? `\ndeleted ${orphans.length} file(s)` : "\nnothing to delete");
}
