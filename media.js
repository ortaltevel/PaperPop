/* Gallery markup, shared by build.js (Node) and the browser.
 *
 * This file exists so the HTML written at build time and the HTML written when
 * a visitor clicks a thumbnail come from ONE implementation. If they diverged,
 * the first click would visibly re-render the image. Structural guarantee, not
 * a promise to keep two copies in sync.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api; // build.js
  else root.PP_MEDIA = api;                                                  // browser
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // The PDP main image renders ~500 CSS px on desktop; 86% of a near-viewport
  // square on mobile (see .pp-pdp__main .pp-media__art in styles.css).
  var PDP_SIZES = "(min-width:861px) 500px, 86vw";
  var DEFAULT_WIDTHS = [400, 600, 800];

  function h(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stemOf(src) {
    return src.replace(/\.(png|jpe?g)$/, "");
  }

  /* Root-absolute. Product pages live at /kits/<slug>, so a relative
     "assets/..." would resolve to /kits/assets/... and 404. */
  function url(p) {
    return "/" + String(p).replace(/^\/+/, "");
  }

  // JPEG sources have no alpha, so optimize-images.py wrote .fallback.jpg;
  // PNG sources here are cutouts with transparency -> quantised .fallback.png.
  function fallbackOf(src, midWidth) {
    return stemOf(src) + "-" + midWidth + (/\.jpe?g$/.test(src) ? ".fallback.jpg" : ".fallback.png");
  }

  function widthsOf(m) {
    return m.widths || DEFAULT_WIDTHS;
  }

  function srcset(src, widths, ext) {
    var stem = stemOf(src);
    return widths
      .map(function (w) { return url(stem + "-" + w + "." + ext) + " " + w + "w"; })
      .join(", ");
  }

  /* Main gallery item. opts.eager marks the build-time first item as the LCP
     candidate; client-side re-renders omit it. */
  function mainMediaHTML(m, opts) {
    opts = opts || {};
    if (m.type === "video") {
      // `muted` must be an ATTRIBUTE for reliable iOS inline autoplay.
      return '<video autoplay muted loop playsinline preload="metadata" poster="' +
        h(url(m.poster)) + '" aria-label="' + h(m.alt) + '">' +
        (m.webm ? '<source src="' + h(url(m.webm)) + '" type="video/webm">' : "") +
        '<source src="' + h(url(m.src)) + '" type="video/mp4"></video>';
    }

    var ws = widthsOf(m);
    var mid = ws[Math.floor(ws.length / 2)];
    var cls = "pp-media__art" + (m.fill ? " pp-media__art--fill" : "");
    var loadAttrs = opts.eager
      ? ' loading="eager" decoding="async" fetchpriority="high"'
      : ' decoding="async"';

    return '<picture>' +
      '<source type="image/avif" srcset="' + h(srcset(m.src, ws, "avif")) + '" sizes="' + PDP_SIZES + '">' +
      '<source type="image/webp" srcset="' + h(srcset(m.src, ws, "webp")) + '" sizes="' + PDP_SIZES + '">' +
      '<img class="' + cls + '" src="' + h(url(fallbackOf(m.src, mid))) + '"' +
      ' sizes="' + PDP_SIZES + '" alt="' + h(m.alt) + '"' + loadAttrs + '>' +
      '</picture>';
  }

  /* Thumbnail button. Thumbnails render at 74px, so always the smallest variant. */
  function thumbHTML(m, i, isCurrent) {
    var ws = widthsOf(m);
    var src = url(m.type === "video" ? m.poster : stemOf(m.src) + "-" + ws[0] + ".avif");
    var cls = "pp-pdp__thumb" +
      (m.type === "video" ? " pp-pdp__thumb--video" : "") +
      (m.fill ? " pp-pdp__thumb--fill" : "");
    return '<button class="' + cls + '" type="button" role="tab"' +
      ' aria-current="' + (isCurrent ? "true" : "false") + '"' +
      ' aria-label="' + h(m.alt) + '">' +
      '<img src="' + h(src) + '" alt="" loading="lazy" decoding="async"></button>';
  }

  function navHTML() {
    return '<button class="pp-pdp__nav pp-pdp__nav--prev" type="button" aria-label="התמונה הקודמת">' +
      '<span class="pp-icon" data-icon="chevron-left"></span></button>' +
      '<button class="pp-pdp__nav pp-pdp__nav--next" type="button" aria-label="התמונה הבאה">' +
      '<span class="pp-icon" data-icon="chevron-right"></span></button>';
  }

  return {
    h: h,
    stemOf: stemOf,
    url: url,
    fallbackOf: fallbackOf,
    widthsOf: widthsOf,
    mainMediaHTML: mainMediaHTML,
    thumbHTML: thumbHTML,
    navHTML: navHTML,
    PDP_SIZES: PDP_SIZES,
  };
});
