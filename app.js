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
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
    "alert-circle": '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    youtube: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M10.5 8.6v6.8l5.5-3.4z"/>',
    "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    whatsapp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.893a11.821 11.821 0 00-3.481-8.463"/></svg>'
  };

  function renderIcons(root) {
    var nodes = (root || document).querySelectorAll(".pp-icon[data-icon]");
    nodes.forEach(function (span) {
      if (span.dataset.rendered) return;
      var name = span.getAttribute("data-icon");
      var glyph = ICONS[name];
      if (!glyph) return;
      span.innerHTML = glyph.lastIndexOf("<svg", 0) === 0
        ? glyph  // full SVG (e.g. filled brand marks) — inject as-is
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
          'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
          'stroke-linejoin="round" aria-hidden="true">' + glyph + "</svg>";
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

      // Total run time = last stroke's delay (max --i * 4ms) + its .9s duration.
      var paths = el.querySelectorAll(".pp-about-svg path");
      var maxI = 0;
      Array.prototype.forEach.call(paths, function (p) {
        var i = parseFloat(p.style.getPropertyValue("--i")) || 0;
        if (i > maxI) maxI = i;
      });
      var totalMs = maxI * 4 + 900 + 120; // + small buffer

      var drawing = false;
      function play() {
        if (drawing) return;          // already animating — let it finish, don't restart
        drawing = true;
        el.classList.remove("is-drawn");
        void el.offsetWidth;          // force reflow so the animation restarts
        el.classList.add("is-drawn");
        window.setTimeout(function () { drawing = false; }, totalMs);
      }

      // Auto-play once when it first scrolls into view.
      var autoPlayed = false;
      function autoPlay() { if (!autoPlayed) { autoPlayed = true; play(); } }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) autoPlay(); });
        }, { threshold: 0.25 });
        io.observe(el);
      } else {
        autoPlay();
      }
      window.setTimeout(autoPlay, 6000); // safety: never stay hidden

      // Replay whenever the user taps "מי אנחנו" (guarded: ignored mid-animation).
      Array.prototype.forEach.call(document.querySelectorAll('a[href="#about"]'), function (a) {
        a.addEventListener("click", function () { autoPlayed = true; play(); });
      });
    }).catch(function () { /* keep the PNG fallback */ });
  }

  /* ---- Scrollspy: move the nav underline to the section in view --------- */
  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.pp-header__nav a[href^="#"], .pp-header__drawer a[href^="#"]')
    );
    if (!links.length) return;
    var ids = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    var sections = ids
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean)
      .sort(function (a, b) { return a.offsetTop - b.offsetTop; });
    if (!sections.length) return;

    function setActive(id) {
      links.forEach(function (a) {
        if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    }
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      for (var i = 0; i < sections.length; i++) {
        if (visible[sections[i].id]) { setActive(sections[i].id); break; }
      }
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  function boot() {
    renderIcons(document);
    initHero();
    initHeroVideo();
    initDrawer();
    initAboutDraw();
    initScrollSpy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
