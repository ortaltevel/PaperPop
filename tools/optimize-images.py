#!/usr/bin/env python3
"""Generate responsive AVIF/WebP variants (+ one fallback) for site imagery.

Run from the site root:  python3 tools/optimize-images.py

Why this exists: the source art is stored as full-resolution PNG, including
photos with no alpha channel — PNG's worst case. The homepage was shipping
~12.3 MB of images for slots that render at 130-590 CSS px. This pre-builds
width-suffixed variants so the markup can hand the browser a real choice via
<picture>/srcset, with no runtime image service and no npm dependencies.

Filenames are width-suffixed (Get-900.avif), which is what lets /assets keep the
1-year `immutable` cache header: adding a width is always a new filename.

CAVEAT: the suffix encodes width only, NOT quality. If you retune the AVIF/WebP
quality constants below, the filenames do not change, so anyone holding the old
immutable copy keeps it for up to a year. When changing quality, either bump the
width set or append a marker (e.g. Get-900-q70.avif) so the URL changes too.

Widths come from measured CSS slot sizes, not guesses: see the plan file.
"""

import os
import pathlib
import sys

from PIL import Image

# (path, widths, has_alpha)
JOBS = [
    # --- Group A: RGB photos, no alpha. Rendered 384-590 CSS px (cover fits). ---
    ("assets/process/Get.png",       (600, 900, 1200), False),
    ("assets/process/FoldGlue.png",  (600, 900, 1200), False),
    ("assets/process/Show.png",      (600, 900, 1200), False),
    ("assets/media/Gift.png",        (600, 900, 1200), False),
    ("assets/media/AboutUs.png",     (900,),           False),
    ("assets/media/hero-poster.jpg", (900, 1200, 1600), False),

    # --- Group B: RGBA product cutouts. Rendered 130-234 CSS px in cards,
    #     up to ~500 px in the PDP main image. 1000 px was pure overshoot. ---
    ("assets/products/soccer-tight.png",        (400, 600, 800), True),
    ("assets/products/duck-tight.png",          (400, 600, 800), True),
    ("assets/products/heart-tight.png",         (400, 600, 800), True),
    ("assets/products/octopus-blue-tight.png",  (400, 600, 800), True),
    ("assets/products/OctepusGreen-clean.png",  (400, 600, 800), True),
    ("assets/products/OctepusYellow-clean.png", (400, 600, 800), True),
    ("assets/products/OctepusPink-clean.png",   (400, 600, 800), True),
    ("assets/products/octopus-display.png",     (400, 600, 800), True),

    # --- Lifestyle photos, pre-squared by tools/square-crop.py. Opaque, so
    #     they get JPEG fallbacks; widths are capped at each master size. ---
    ("assets/products/duck-held.jpg", (400, 600, 800), False),
    ("assets/products/duck-lifestyle.jpg", (400, 600, 800), False),
    ("assets/products/duck-scene.jpg", (400, 600, 800), False),
    ("assets/products/duck-desk.jpg", (400, 600, 800), False),
    ("assets/products/duck-shelf.jpg", (400, 600, 800), False),
    ("assets/products/duck-closeup.jpg", (400, 600, 800), False),
    ("assets/products/duck-stand.jpg", (400, 600), False),
    ("assets/products/heart-lifestyle.jpg", (400, 600, 800), False),
    ("assets/products/heart-shelf.jpg", (400, 600, 800), False),
    ("assets/products/octopus-pair.jpg", (400, 600, 800), False),
    ("assets/products/octopus-lifestyle.jpg", (400, 600, 800), False),
    ("assets/products/octopus-shelf.jpg", (400,), False),
    ("assets/products/octopus-closeup.jpg", (400, 600), False),
    ("assets/products/octopus-scene.jpg", (400, 600, 800), False),

    # --- Already-reasonable JPEGs, but 1120-1400 px wide for a ~500 px slot. ---
    ("assets/products/soccer-grass.jpg",  (500, 750, 1120), False),
    ("assets/products/soccer-shelf.jpg",  (500, 750),       False),
    ("assets/products/soccer-girl.jpg",   (500, 750),       False),
    ("assets/products/soccer-boy.jpg",    (500, 750),       False),
    ("assets/products/duck-display.jpg",  (400, 600, 800),  False),
]

AVIF_Q_ALPHA, AVIF_Q_OPAQUE = 66, 66  # tuned so VMAF >= 93 (measured)
WEBP_Q_ALPHA, WEBP_Q_OPAQUE = 72, 76


def human(n):
    return f"{n:,}"


def main():
    if not pathlib.Path("assets").is_dir():
        sys.exit("error: run this from the site root (assets/ not found)")

    total_src = total_out = 0
    missing = []

    for path, widths, alpha in JOBS:
        p = pathlib.Path(path)
        if not p.exists():
            missing.append(path)
            continue

        src_bytes = p.stat().st_size
        total_src += src_bytes
        stem = p.with_suffix("")

        with Image.open(p) as im:
            im = im.convert("RGBA" if alpha else "RGB")
            W, H = im.size

            made = []
            for w in widths:
                if w > W:
                    continue
                r = im.resize((w, round(H * w / W)), Image.LANCZOS)
                a = f"{stem}-{w}.avif"
                b = f"{stem}-{w}.webp"
                r.save(a, "AVIF", quality=AVIF_Q_ALPHA if alpha else AVIF_Q_OPAQUE)
                r.save(b, "WEBP", quality=WEBP_Q_ALPHA if alpha else WEBP_Q_OPAQUE, method=6)
                made += [a, b]

            # One universal fallback for browsers without AVIF *and* WebP,
            # at the middle width. Alpha -> quantised PNG; opaque -> JPEG.
            fb_w = widths[len(widths) // 2] if len(widths) > 1 else widths[0]
            fb_w = min(fb_w, W)
            r = im.resize((fb_w, round(H * fb_w / W)), Image.LANCZOS)
            if alpha:
                fb = f"{stem}-{fb_w}.fallback.png"
                # FASTOCTREE is the only Pillow method that quantises RGBA
                # without discarding the alpha channel.
                r.quantize(colors=256, method=Image.FASTOCTREE).save(fb, optimize=True)
            else:
                fb = f"{stem}-{fb_w}.fallback.jpg"
                r.save(fb, "JPEG", quality=76, optimize=True, progressive=True)
            made.append(fb)

        out_bytes = sum(os.path.getsize(f) for f in made)
        total_out += out_bytes
        best = min(
            (os.path.getsize(f) for f in made if f.endswith(".avif")),
            default=out_bytes,
        )
        print(f"{path:44s} {human(src_bytes):>10} -> best AVIF {human(best):>8}  "
              f"({len(made)} files)")

    print("-" * 88)
    print(f"{'source total':44s} {human(total_src):>10}")
    print(f"{'all variants written':44s} {human(total_out):>10}")
    if missing:
        print("\nSKIPPED (not found):")
        for m in missing:
            print("  " + m)


if __name__ == "__main__":
    main()
