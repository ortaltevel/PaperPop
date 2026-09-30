#!/usr/bin/env python3
"""Remove the edge-connected studio background from the apple card art."""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


SOURCE = Path("assets/products/apple-closed.jpg")
OUTPUT = Path("assets/products/apple-tight.png")


def main():
    image = Image.open(SOURCE).convert("RGB")
    pixels = np.asarray(image)
    high = pixels.max(axis=2)
    low = pixels.min(axis=2)
    candidate = (high > 202) & ((high - low) < 38)
    height, width = candidate.shape
    outside = np.zeros((height, width), dtype=bool)
    queue = deque()

    for x in range(width):
        if candidate[0, x]: queue.append((0, x))
        if candidate[height - 1, x]: queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0]: queue.append((y, 0))
        if candidate[y, width - 1]: queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if outside[y, x] or not candidate[y, x]:
            continue
        outside[y, x] = True
        if y: queue.append((y - 1, x))
        if y + 1 < height: queue.append((y + 1, x))
        if x: queue.append((y, x - 1))
        if x + 1 < width: queue.append((y, x + 1))

    # The studio photo also contains a soft, neutral cast shadow below the
    # apple. It is not part of the product and makes this catalog card look
    # different from the other clean cut-outs. Red, green and brown paper all
    # have appreciable chroma, so neutral residual pixels can be removed safely.
    chroma_ratio = (high - low) / np.maximum(high, 1)
    cast_shadow = chroma_ratio < 0.35
    alpha = Image.fromarray(
        np.where(outside | cast_shadow, 0, 255).astype("uint8"), "L"
    )
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    result = image.convert("RGBA")
    result.putalpha(alpha)
    result.save(OUTPUT, optimize=True)


if __name__ == "__main__":
    main()
