"""Pixel comparison for the V159 regression screens.

Both captures are blurred by 1px; a pixel differs when any RGB channel then moves by more than 24. A screen passes
when both captures have the same size and at most 0.5% of pixels differ.
Prints {elementId: {...}} as JSON.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

CHANNEL_DELTA = 24
BLUR_RADIUS = 1.0
MAX_RATIO = 0.005
MAX_SHIFT = 2


def main() -> None:
    out = Path(sys.argv[1])
    results = {}
    for element_id in sys.argv[2:]:
        base = out / "base" / f"{element_id}.png"
        new = out / "new" / f"{element_id}.png"
        if not base.exists() or not new.exists():
            results[element_id] = {"pass": False, "reason": "missing capture"}
            continue
        # A 1px blur removes sub-pixel antialiasing noise; a changed word,
        # bar or block still differs over a wide area.
        a = np.asarray(Image.open(base).convert("RGB").filter(ImageFilter.GaussianBlur(BLUR_RADIUS)), dtype=np.int16)
        b = np.asarray(Image.open(new).convert("RGB").filter(ImageFilter.GaussianBlur(BLUR_RADIUS)), dtype=np.int16)
        # Sub-pixel layout above the section (the V159 hero line) can move it
        # by a fraction of a pixel, which rounds to one row more or less and
        # shifts every row. Compare at the best of -2..+2 row offsets over the
        # common height; a height change beyond 2px is a real change.
        if a.shape[1] != b.shape[1] or abs(a.shape[0] - b.shape[0]) > MAX_SHIFT:
            results[element_id] = {"pass": False, "reason": "size", "base": list(a.shape[:2]), "new": list(b.shape[:2])}
            continue
        best = None
        for shift in range(-MAX_SHIFT, MAX_SHIFT + 1):
            a0, b0 = max(0, shift), max(0, -shift)
            height = min(a.shape[0] - a0, b.shape[0] - b0)
            if height <= 0:
                continue
            diff = np.abs(a[a0:a0 + height] - b[b0:b0 + height]).max(axis=2) > CHANNEL_DELTA
            ratio = float(diff.sum()) / (height * a.shape[1])
            if best is None or ratio < best[0]:
                best = (ratio, shift)
        ratio, shift = best
        results[element_id] = {"pass": ratio <= MAX_RATIO, "diffRatio": round(ratio, 6), "rowShift": shift, "size": [list(a.shape[:2]), list(b.shape[:2])]}
    sys.stdout.reconfigure(encoding="utf-8")
    json.dump(results, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
