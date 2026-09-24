#!/usr/bin/env python3
"""Remove only the edge-connected studio background from the fox card art.

The white paper inside the black frame must stay opaque, so a global
white-to-alpha conversion is not suitable. This flood fill starts at the image
edges and stops at the dark frame, preserving the framed artwork and its soft
shadow while making the surrounding studio background transparent.
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


SOURCE = Path("assets/products/fox-closeup.jpg")
OUTPUT = Path("assets/products/fox-tight.png")


def main():
    image = Image.open(SOURCE).convert("RGB")
    pixels = np.asarray(image)
    high = pixels.max(axis=2)
    low = pixels.min(axis=2)
    # Studio background: bright and nearly neutral. The dark frame forms a
    # closed boundary, so the white sheet inside it is never reached.
    candidate = (high > 205) & ((high - low) < 34)
    height, width = candidate.shape
    outside = np.zeros((height, width), dtype=bool)
    queue = deque()

    for x in range(width):
        if candidate[0, x]:
            queue.append((0, x))
        if candidate[height - 1, x]:
            queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0]:
            queue.append((y, 0))
        if candidate[y, width - 1]:
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if outside[y, x] or not candidate[y, x]:
            continue
        outside[y, x] = True
        if y:
            queue.append((y - 1, x))
        if y + 1 < height:
            queue.append((y + 1, x))
        if x:
            queue.append((y, x - 1))
        if x + 1 < width:
            queue.append((y, x + 1))

    # A small blur avoids a jagged halo around the photographed frame.
    alpha = Image.fromarray(np.where(outside, 0, 255).astype("uint8"), "L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    result = image.convert("RGBA")
    result.putalpha(alpha)
    result.save(OUTPUT, optimize=True)


if __name__ == "__main__":
    main()
