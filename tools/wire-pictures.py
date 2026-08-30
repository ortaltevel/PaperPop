#!/usr/bin/env python3
"""Rewrite plain <img> tags in index.html into responsive <picture> blocks.

One-shot migration helper. Run from the site root:
    python3 tools/wire-pictures.py

It only touches <img> tags whose src matches a known optimized asset, and it is
idempotent — an <img> already wrapped in <picture> is skipped.

`sizes` values come from the measured CSS slot widths (see the plan file), not
from guesses: .pp-media__art renders at 219 CSS px on a 4-column desktop grid,
.pp-steps__photo at 384, .pp-mpanel__media at 574, .pp-about__media at 590.
"""

import pathlib
import re
import sys

# src stem -> (widths, sizes attr, fallback ext, intrinsic w/h at fallback width)
SPECS = {
    "assets/products/octopus-blue-tight": ((400, 600, 800), "card", "png"),
    "assets/products/duck-tight":         ((400, 600, 800), "card", "png"),
    "assets/products/heart-tight":        ((400, 600, 800), "card", "png"),
    "assets/products/soccer-tight":       ((400, 600, 800), "card", "png"),
    "assets/process/Get":                 ((600, 900, 1200), "step", "jpg"),
    "assets/process/FoldGlue":            ((600, 900, 1200), "step", "jpg"),
    "assets/process/Show":                ((600, 900, 1200), "step", "jpg"),
    "assets/media/Gift":                  ((600, 900, 1200), "gift", "jpg"),
    "assets/media/AboutUs":               ((900,),           "about", "jpg"),
}

SIZES = {
    "card":  "(min-width:1201px) 219px, (min-width:861px) 234px, (min-width:381px) 39vw, 78vw",
    "step":  "(min-width:861px) 384px, 100vw",
    "gift":  "(min-width:861px) 574px, 100vw",
    "about": "(min-width:861px) 590px, 100vw",
}

IMG_RE = re.compile(r'([ \t]*)<img\b([^>]*?)\s*/?>', re.S)
ATTR_RE = re.compile(r'(\w[\w-]*)\s*=\s*"([^"]*)"')


def main():
    path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
    if not path.exists():
        sys.exit(f"error: {path} not found")
    html = path.read_text(encoding="utf-8")

    from PIL import Image

    changed = 0

    def repl(m):
        nonlocal changed
        indent, raw = m.group(1), m.group(2)
        attrs = dict(ATTR_RE.findall(raw))
        src = attrs.get("src", "")
        stem = re.sub(r"\?.*$", "", src)
        stem = re.sub(r"\.(png|jpe?g)$", "", stem)
        spec = SPECS.get(stem)
        if not spec:
            return m.group(0)
        widths, kind, fb_ext = spec

        fb_w = widths[len(widths) // 2] if len(widths) > 1 else widths[0]
        fb = f"{stem}-{fb_w}.fallback.{fb_ext}"
        if not pathlib.Path(fb).exists():
            print(f"  ! missing {fb} — left {src} unchanged")
            return m.group(0)

        with Image.open(fb) as im:
            w, h = im.size

        def srcset(ext):
            return (",\n" + indent + " " * 12).join(
                f"{stem}-{n}.{ext} {n}w" for n in widths
                if pathlib.Path(f"{stem}-{n}.{ext}").exists()
            )

        cls = attrs.get("class", "")
        alt = attrs.get("alt", "")
        loading = attrs.get("loading", "lazy")
        sizes = SIZES[kind]

        img_attrs = [f'class="{cls}"'] if cls else []
        img_attrs += [
            f'src="{fb}"',
            f'width="{w}" height="{h}"',
            f'alt="{alt}"',
            f'loading="{loading}"',
            'decoding="async"',
        ]

        out = [f'{indent}<picture>']
        for ext, mime in (("avif", "image/avif"), ("webp", "image/webp")):
            ss = srcset(ext)
            if ss:
                out.append(f'{indent}  <source type="{mime}"')
                out.append(f'{indent}          srcset="{ss}"')
                out.append(f'{indent}          sizes="{sizes}">')
        out.append(f'{indent}  <img {" ".join(img_attrs)}')
        out.append(f'{indent}       sizes="{sizes}">')
        out.append(f'{indent}</picture>')
        changed += 1
        return "\n".join(out)

    # Skip <img>s already inside a <picture>
    def guarded(m):
        before = html[: m.start()]
        if before.rfind("<picture>") > before.rfind("</picture>"):
            return m.group(0)
        return repl(m)

    new = IMG_RE.sub(guarded, html)
    if changed:
        path.write_text(new, encoding="utf-8")
    print(f"{path}: rewrote {changed} <img> tag(s) into <picture>")


if __name__ == "__main__":
    main()
