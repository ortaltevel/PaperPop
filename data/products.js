"use strict";
/* Single source of truth for the storefront.
 *
 * Edit this file, then run `node build.js` to regenerate kits/*.html,
 * sitemap.xml and the product-card region of index.html. Nothing else should
 * hold a price, a product name or a media list.
 *
 * Display strings are DERIVED in build.js (priceLabel, WhatsApp deep link,
 * canonical URL, page title) so this file stays declarative.
 */

const SITE = {
  origin: "https://paperpop.co.il",
  brand: "PaperPop",
  waPhone: "972504427479",
  locale: "he_IL",
  // Bumped whenever styles.css / app.js change; stamped into every generated
  // page so index.html and kits/*.html can never disagree on a cached copy.
  assetVersion: 42,
};

// Brand-supplied, identical for every kit.
const AGE = "מגיל 10 ומעלה, ומגיל 6 בליווי מבוגר";

/* NOTE ON `time`: these are estimates carried over from the original build,
 * not measured values. They are now server-rendered, which means Google and AI
 * answer engines will quote them as fact. Confirm per kit. */

const products = [
  {
    id: "octopus",
    slug: "octopus",
    name: "התמנון שעושה סדר",
    price: 45,
    time: "עד שעה וחצי",
    size: "25 × 15 × 30 ס״מ",
    age: AGE,
    desc: "גם יצירה כיפית וגם מקום לכל הדברים הקטנים. יוצרים תמנון צבעוני שהופך לסדרן הכי חמוד על השולחן.",
    // Landscape 1200x630 render for WhatsApp/Facebook link previews.
    ogImage: "assets/og/octopus-og.jpg",
    // Richer alt than the PDP's, used on the homepage card.
    card: {
      src: "assets/products/octopus-blue-tight.png",
      alt: "התמנון שעושה סדר — פסל נייר מקופל בתכלת עם שמונה זרועות",
    },
    media: [
      { type: "image", src: "assets/products/octopus-blue-tight.png", alt: "התמנון שעושה סדר בתכלת" },
      { type: "image", src: "assets/products/octopus-display.png", alt: "התמנון שעושה סדר — צילום מוצר" },
      { type: "image", src: "assets/products/OctepusPink-clean.png", alt: "התמנון שעושה סדר בוורוד" },
      { type: "image", src: "assets/products/OctepusYellow-clean.png", alt: "התמנון שעושה סדר בצהוב" },
      { type: "image", src: "assets/products/OctepusGreen-clean.png", alt: "התמנון שעושה סדר בירוק" },
    ],
  },
  {
    id: "duck",
    slug: "duck",
    name: "הברווז השובב",
    price: 65,
    time: "עד שעה וחצי",
    size: "21 × 16 × 25 ס״מ",
    age: AGE,
    desc: "ברווז צהוב עם המון אופי, כמה קיפולים והדבקות ויש לכם חבר חדש על המדף שיעשה שמח.",
    ogImage: "assets/og/duck-og.jpg",
    card: {
      src: "assets/products/duck-tight.png",
      alt: "הברווז השובב — פסל נייר מקופל בצהוב עם מקור אדום",
    },
    media: [
      { type: "image", src: "assets/products/duck-tight.png", alt: "הברווז השובב" },
      { type: "image", src: "assets/products/duck-display.jpg", alt: "הברווז השובב — צילום מוצר" },
      { type: "image", src: "assets/products/duck-sketch.png", widths: [370], alt: "הברווז השובב — שרטוט הדגם" },
    ],
  },
  {
    id: "heart",
    slug: "heart",
    name: "הלב הפועם",
    price: 45,
    time: "עד שעה",
    size: "23 × 27 × 11 ס״מ",
    age: AGE,
    desc: "קצת נייר, קצת דבק והרבה לב! כי ברגע שהיא מוכנה, אי אפשר לפספס אותה.",
    ogImage: "assets/og/heart-og.jpg",
    card: {
      src: "assets/products/heart-tight.png",
      alt: "הלב הפועם — פסל נייר מקופל אדום בעל פאות",
    },
    media: [
      { type: "image", src: "assets/products/heart-tight.png", alt: "הלב הפועם" },
      { type: "image", src: "assets/products/heart-display.jpg", alt: "הלב הפועם — צילום מוצר" },
      {
        type: "video",
        src: "assets/media/hero.mp4",
        webm: "assets/media/hero.webm",
        poster: "assets/media/hero-poster-1200.fallback.jpg",
        alt: "הרכבת הלב הפועם",
      },
    ],
  },
  {
    id: "soccer",
    slug: "soccer",
    name: "הכדור שלא מפספס",
    price: 45,
    time: "עד שעה וחצי",
    size: "12 × 12 × 12 ס״מ",
    age: AGE,
    desc: "מרכיבים, מדביקים ורואים איך מחתיכות נייר נולד כדורגל תלת מימדי שעושה חשק לצעוק גווול!",
    ogImage: "assets/og/soccer-og.jpg",
    card: {
      src: "assets/products/soccer-tight.png",
      alt: "הכדור שלא מפספס — פסל נייר מקופל בשחור ולבן",
    },
    media: [
      { type: "image", src: "assets/products/soccer-tight.png", alt: "הכדור שלא מפספס" },
      { type: "image", src: "assets/products/soccer-grass.jpg", widths: [500, 750, 1120], alt: "הכדור שלא מפספס על הדשא", fill: true },
      { type: "image", src: "assets/products/soccer-girl.jpg", widths: [500, 750], alt: "ילדה מחזיקה את הכדור שלא מפספס", fill: true },
      { type: "image", src: "assets/products/soccer-boy.jpg", widths: [500, 750], alt: "ילד מחזיק את הכדור שלא מפספס", fill: true },
      { type: "image", src: "assets/products/soccer-shelf.jpg", widths: [500, 750], alt: "הכדור שלא מפספס על המדף", fill: true },
    ],
  },
];

// Kit facts shown on every product page. Kept here so the copy lives with the
// data rather than being duplicated across four generated files.
const KIT_FACTS = [
  { text: "הערכה חתוכה, אין צורך במספריים", included: true },
  { text: "החלקים מגיעים עם סימון קווי קיפול, אין צורך לחרוץ", included: true },
  { text: "הערכה כוללת הוראות הרכבה", included: true },
  { text: "מיוצר בישראל", included: true },
  { text: "הערכה אינה כוללת דבק", included: false },
];

module.exports = { SITE, AGE, products, KIT_FACTS };
