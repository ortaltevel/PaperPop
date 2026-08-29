/* ============================================================================
   PaperPop storefront — vanilla interactions
   No framework, no build step. Three jobs:
     1. Inject inline SVG icons (Lucide paths) into [data-icon] spans — keeps the
        markup light and removes the runtime CDN dependency the design used.
     2. Drive the rotating hero (crossfade, dots, pause on hover/focus,
        prefers-reduced-motion aware).
     3. Toggle the mobile navigation drawer.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- 1. Icons (Lucide 0.544, 24x24, stroke rounded) ------------------- */
  var ICONS = {
    "arrow-left": '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "shopping-bag": '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
    "alert-circle": '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    youtube: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'
  };

  function renderIcons(root) {
    var nodes = (root || document).querySelectorAll(".pp-icon[data-icon]");
    nodes.forEach(function (span) {
      if (span.dataset.rendered) return;
      var name = span.getAttribute("data-icon");
      var paths = ICONS[name];
      if (!paths) return;
      span.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
      span.dataset.rendered = "1";
    });
  }

  /* ---- 2. Rotating hero -------------------------------------------------- */
  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".pp-hero__slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".pp-hero__dot"));
    if (slides.length < 2) return;

    var interval = parseInt(hero.getAttribute("data-interval"), 10) || 6000;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var i = 0;
    var timer = null;
    var paused = false;

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, idx) {
        var active = idx === i;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-hidden", active ? "false" : "true");
      });
      dots.forEach(function (d, idx) {
        d.setAttribute("aria-current", idx === i ? "true" : "false");
      });
    }

    function start() {
      if (paused || reduce || timer) return;
      timer = window.setInterval(function () { show(i + 1); }, interval);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    dots.forEach(function (d, idx) {
      d.addEventListener("click", function () { show(idx); stop(); start(); });
    });
    hero.addEventListener("mouseenter", function () { paused = true; stop(); });
    hero.addEventListener("mouseleave", function () { paused = false; start(); });
    hero.addEventListener("focusin", function () { paused = true; stop(); });
    hero.addEventListener("focusout", function () { paused = false; start(); });

    show(0);
    start();
  }

  /* ---- 3. Mobile drawer -------------------------------------------------- */
  function initDrawer() {
    var burger = document.querySelector("[data-burger]");
    var drawer = document.querySelector("[data-drawer]");
    if (!burger || !drawer) return;
    var iconSpan = burger.querySelector(".pp-icon");

    burger.addEventListener("click", function () {
      var open = drawer.hasAttribute("hidden") === false;
      if (open) {
        drawer.setAttribute("hidden", "");
      } else {
        drawer.removeAttribute("hidden");
      }
      var nowOpen = !open;
      burger.setAttribute("aria-expanded", nowOpen ? "true" : "false");
      if (iconSpan) {
        iconSpan.setAttribute("data-icon", nowOpen ? "x" : "menu");
        iconSpan.removeAttribute("data-rendered");
        renderIcons(burger);
      }
    });

    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        drawer.setAttribute("hidden", "");
        burger.setAttribute("aria-expanded", "false");
        if (iconSpan) {
          iconSpan.setAttribute("data-icon", "menu");
          iconSpan.removeAttribute("data-rendered");
          renderIcons(burger);
        }
      });
    });
  }

  /* ---- Hero video: honour reduced-motion (poster instead of playback) ---- */
  function initHeroVideo() {
    var v = document.querySelector("[data-hero-video]");
    if (!v) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      v.removeAttribute("autoplay");
      v.autoplay = false;
      try { v.pause(); } catch (e) {}
    }
  }

  /* ---- About illustration: fetch a centerline SVG and draw it stroke by
     stroke when it scrolls into view. The inline PNG stays as a fallback for
     no-JS / reduced-motion / fetch failure, so the illustration always shows. */
  function initAboutDraw() {
    var el = document.querySelector(".pp-about__media");
    if (!el) return;
    var url = el.getAttribute("data-about-svg");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!url || reduce || !window.fetch || !("IntersectionObserver" in window)) return;
    fetch(url).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (txt) {
      el.innerHTML = txt;            // swap the fallback PNG for the inline SVG
      el.classList.add("pp-draw-js"); // strokes hidden until drawn
      var done = false;
      var reveal = function () { if (!done) { done = true; el.classList.add("is-drawn"); } };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) reveal(); });
      }, { threshold: 0.25 });
      io.observe(el);
      window.setTimeout(reveal, 6000); // safety: never stay hidden
    }).catch(function () { /* keep the PNG fallback */ });
  }

  function boot() {
    renderIcons(document);
    initHero();
    initHeroVideo();
    initDrawer();
    initAboutDraw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
