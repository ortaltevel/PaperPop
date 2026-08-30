#!/usr/bin/env python3
"""Turn lifestyle product photos into SQUARE images centred on the product.

The product-page frame is 1:1, but these photos run from 0.46 to 1.33 aspect.
Neither CSS option is acceptable on its own:
  * object-fit:contain  -> visible letterbox around the photo
  * object-fit:cover    -> centre-crops, and the product is usually OFF-centre
                           (duck upper-left, heart left-of-centre), so it cuts
                           the subject.

So we crop to square here instead, centred on the product rather than on the
image. The product is located by its brand colour (each kit is a distinctive
saturated hue against neutral interiors), and the square is clamped to the image
so no padding is ever introduced.

Usage:
    python3 tools/square-crop.py            # write outputs
    python3 tools/square-crop.py --debug     # also write bbox overlays
"""

import pathlib
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw

SRC_ROOT = pathlib.Path("../Assets/Products")
OUT_ROOT = pathlib.Path("assets/products")
DEBUG = "--debug" in sys.argv

# Hue windows (OpenCV-style degrees/2 -> here plain 0-360) plus saturation and
# value floors, tuned per kit. Keep these generous; the bbox is robust to noise
# because we take a high percentile rather than absolute extremes.
TARGETS = {
    "duck":    {"hue": [(40, 70)],               "s": 0.45, "v": 0.45},  # yellow body
    "heart":   {"hue": [(0, 14), (346, 360)],    "s": 0.45, "v": 0.35},  # red
    "octopus": {"hue": [(180, 215), (330, 360)], "s": 0.18, "v": 0.55},  # light blue + pink
}

# (product, source filename, output stem, alt text, optional overrides)
#   tight: multiplier on the product's longest edge — zooms in on wide room
#          shots where the product would otherwise be a speck.
#   hue:   replaces the product's default hue windows (e.g. a yellow octopus).
#   anchor: "top"/"bottom" pins the crop to that edge instead of centring on
#          the product — for shots where a face sits above the product.
JOBS = [
    # --- duck ---
    ("duck", "Duck/08239981-0089-4E40-A916-2D07C91248D7.png", "duck-held",
     "הברווז השובב מוחזק ביד על מרפסת"),
    ("duck", "Duck/32527DC4-D47B-40ED-B865-FBC7986507B8.png", "duck-lifestyle",
     "הברווז השובב בבית"),
    # Wide living-room shot: the duck's blob is only ~243px, so a tight crop
    # would need a 3.3x upscale. Keep the full sharp square — the duck reads as
    # in-context rather than as the subject, which is what this photo is for.
    ("duck", "Duck/abe2ce7b-6068-4dd9-9aea-5734f8124824.jpg", "duck-scene",
     "הברווז השובב מוצג בסלון על מזנון"),
    ("duck", "Duck/8dc2f366-ff45-4a13-b035-ae12bbf175a1.jpg", "duck-desk",
     "הברווז השובב על שולחן"),
    ("duck", "Duck/9d31fb8d-9663-4f9a-96c6-be6f7dbd3266.jpg", "duck-shelf",
     "הברווז השובב על מדף"),
    ("duck", "Duck/d80ee232-6a58-43b7-8a9e-2e944afaff48.jpg", "duck-closeup",
     "הברווז השובב מקרוב"),
    ("duck", "Duck/64edc325-85ee-483a-893b-459f2bd5bd7a.jpg", "duck-stand",
     "הברווז השובב מוצג על קובייה שחורה"),
    # Studio shot on grey. Portrait 1167x1600, so it letterboxed in the 1:1
    # frame; squared here so it can fill like every other photo.
    ("duck", "Duck/Duck_Display.jpeg", "duck-display",
     "הברווז השובב — צילום מוצר על רקע אפור"),

    # --- heart ---
    # The heart sits at chest height, so product-centring cut the top of her
    # head. Anchor to the top edge: full face + heart, cropping off the bottom.
    ("heart", "Heart/5836D471-2604-475A-ACBC-98DB05C0D2EB.png", "heart-lifestyle",
     "בחורה מחזיקה את הלב הפועם", {"anchor": "top"}),
    ("heart", "Heart/14C4F040-6526-4AB1-BB3B-1859C2D01774.png", "heart-held",
     "הלב הפועם מוחזק ביד"),
    ("heart", "Heart/7BA307D7-C737-45ED-8C34-93036641A929.png", "heart-shelf",
     "הלב הפועם על מדף עם צמח ותמונה"),
    # --- octopus ---
    ("octopus", "Octopus/C5A7822C-C1E2-4C13-BF9A-CAD25DEEB977.png", "octopus-pair",
     "התמנון שעושה סדר בתכלת ובוורוד עם עפרונות"),
    ("octopus", "Octopus/146C523F-F08E-41DF-9483-06D66F9DBE1A.png", "octopus-lifestyle",
     "התמנון שעושה סדר על שולחן עבודה"),
    # This octopus is YELLOW, so the default blue/pink windows find nothing and
    # the frame is dominated by the person. Match yellow and crop in.
    ("octopus", "Octopus/C43CB2EF-B705-40D9-9D5E-D8F6A2E778A0.png", "octopus-shelf",
     "התמנון שעושה סדר בצהוב על שולחן", {"hue": [(38, 68)], "s": 0.45, "v": 0.45, "tight": 2.2}),
    ("octopus", "Octopus/459bfe93-b624-4883-8068-eab6656deb2b.jpg", "octopus-closeup",
     "התמנון שעושה סדר מקרוב"),
    ("octopus", "Octopus/IMG_5635.HEIC", "octopus-scene",
     "התמנון שעושה סדר בחדר"),
]


def load(path: pathlib.Path) -> Image.Image:
    """Open an image; route HEIC through sips since Pillow cannot read it."""
    if path.suffix.lower() in (".heic", ".heif"):
        tmp = pathlib.Path(tempfile.mkdtemp()) / "conv.png"
        subprocess.run(
            ["sips", "-s", "format", "png", str(path), "--out", str(tmp)],
            check=True, capture_output=True,
        )
        return Image.open(tmp).convert("RGB")
    return Image.open(path).convert("RGB")


def product_bbox(im: Image.Image, spec: dict):
    """Bounding box of the product, found by brand colour. None if not found."""
    # Work small for speed; the bbox is scaled back up afterwards.
    small = im.copy()
    small.thumbnail((400, 400), Image.LANCZOS)
    hsv = np.asarray(small.convert("HSV"), dtype=np.float32)
    hue = hsv[..., 0] * 360.0 / 255.0
    sat = hsv[..., 1] / 255.0
    val = hsv[..., 2] / 255.0

    mask = np.zeros(hue.shape, dtype=bool)
    for lo, hi in spec["hue"]:
        mask |= (hue >= lo) & (hue <= hi)
    mask &= sat >= spec["s"]
    mask &= val >= spec["v"]

    if mask.sum() < 40:  # too few pixels to trust
        return None

    # Take the LARGEST CONNECTED BLOB, not the extent of all matching pixels.
    # Wide room shots contain plenty of same-hue clutter (wood, cushions, a red
    # book spine), and a bounding box over all of it spans most of the frame —
    # measured at 659x480 for a duck that occupies a fraction of that.
    blob = _largest_blob(mask)
    if blob is None:
        return None
    y0, x0, y1, x1 = blob

    sx = im.width / small.width
    sy = im.height / small.height
    return (x0 * sx, y0 * sy, x1 * sx, y1 * sy), mask.sum() / mask.size


def _largest_blob(mask: np.ndarray):
    """Bounding box (y0, x0, y1, x1) of the largest 8-connected True region.

    Iterative flood fill — the mask is downscaled to <=400px per side, so this
    is a few hundred thousand cells at worst and needs no scipy.
    """
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    best = None
    best_area = 0
    for sy0 in range(h):
        row = mask[sy0]
        for sx0 in range(w):
            if not row[sx0] or seen[sy0, sx0]:
                continue
            # BFS from this seed
            stack = [(sy0, sx0)]
            seen[sy0, sx0] = True
            area = 0
            miny = maxy = sy0
            minx = maxx = sx0
            while stack:
                cy, cx = stack.pop()
                area += 1
                if cy < miny: miny = cy
                if cy > maxy: maxy = cy
                if cx < minx: minx = cx
                if cx > maxx: maxx = cx
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            stack.append((ny, nx))
            if area > best_area:
                best_area = area
                best = (miny, minx, maxy, maxx)
    # A blob of a handful of pixels is noise, not a product.
    return best if best_area >= 30 else None


def square_crop(im: Image.Image, bbox, tight=None, anchor=None):
    """Square crop, clamped to the image, centred on the product.

    Never pads: the side is capped at min(W, H), so the result is always real
    pixels. The window slides to keep the product's centre in view and, where
    possible, the whole product inside.

    `tight` (a multiplier on the product's longest edge) zooms in for wide
    room shots where the product would otherwise be a speck. Without it the
    square is as large as the image allows.
    """
    W, H = im.size
    side = min(W, H)
    if tight and bbox is not None:
        x0, y0, x1, y1 = bbox
        want = max(x1 - x0, y1 - y0) * tight
        side = int(max(120, min(side, want)))

    if bbox is None:
        left = (W - side) / 2
        top = (H - side) / 2
    else:
        x0, y0, x1, y1 = bbox
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        left = cx - side / 2
        top = cy - side / 2
        # Prefer a window that contains the whole product when it fits.
        if x1 - x0 <= side:
            left = min(max(left, x1 - side), x0)
        if y1 - y0 <= side:
            top = min(max(top, y1 - side), y0)

    # An explicit anchor wins over product-centring. Used when the subject the
    # photo is really about (e.g. a person's face) sits above the product, so
    # centring on the product alone would crop the face.
    if anchor == "top":
        top = 0
    elif anchor == "bottom":
        top = H - side

    left = max(0, min(left, W - side))
    top = max(0, min(top, H - side))
    # Round the origin FIRST, then add the integer side. Rounding both edges
    # independently can yield a 1px-off rectangle (observed 1167x1168), which
    # shows as a hairline seam once the image is object-fit:cover'd.
    side = int(side)
    x, y = int(round(left)), int(round(top))
    x = min(x, W - side)
    y = min(y, H - side)
    return im.crop((x, y, x + side, y + side))


def main():
    if not OUT_ROOT.is_dir():
        sys.exit("run from the site root (assets/products not found)")

    made = []
    for job in JOBS:
        product, rel, stem, alt = job[:4]
        over = job[4] if len(job) > 4 else {}
        src = SRC_ROOT / rel
        if not src.exists():
            print(f"  ! missing source {rel}")
            continue
        im = load(src)
        spec = dict(TARGETS[product]); spec.update(
            {k: v for k, v in over.items() if k in ("hue", "s", "v")})
        found = product_bbox(im, spec)
        bbox, coverage = found if found else (None, 0.0)
        sq = square_crop(im, bbox, tight=over.get("tight"),
                         anchor=over.get("anchor"))

        out = OUT_ROOT / f"{stem}.jpg"
        sq.save(out, "JPEG", quality=92, optimize=True, progressive=True)
        made.append((stem, alt))
        flag = "" if bbox else "   (no colour match -> centre crop)"
        print(f"{stem:22s} {im.width}x{im.height} -> {sq.width}x{sq.width}"
              f"  coverage={coverage*100:4.1f}%{flag}")

        if DEBUG and bbox:
            dbg = im.copy()
            ImageDraw.Draw(dbg).rectangle(bbox, outline=(255, 0, 255), width=8)
            dbg.thumbnail((600, 600))
            dbg.save(OUT_ROOT.parent.parent / f"_dbg-{stem}.jpg", "JPEG", quality=80)

    print(f"\n{len(made)} square masters written to {OUT_ROOT}/")
    print("Next: add them to data/products.js, then run")
    print("  python3 tools/optimize-images.py   (add the new stems to JOBS first)")


if __name__ == "__main__":
    main()
