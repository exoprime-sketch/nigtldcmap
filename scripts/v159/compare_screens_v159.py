"""Pixel comparison for the V159 regression screens.

A pixel differs when any RGB channel moves by more than 16. A screen passes
when both captures have the same size and at most 0.5% of pixels differ.
Prints {elementId: {...}} as JSON.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

CHANNEL_DELTA = 16
MAX_RATIO = 0.005


def main() -> None:
    out = Path(sys.argv[1])
    results = {}
    for element_id in sys.argv[2:]:
        base = out / "base" / f"{element_id}.png"
        new = out / "new" / f"{element_id}.png"
        if not base.exists() or not new.exists():
            results[element_id] = {"pass": False, "reason": "missing capture"}
            continue
        a = np.asarray(Image.open(base).convert("RGB"), dtype=np.int16)
        b = np.asarray(Image.open(new).convert("RGB"), dtype=np.int16)
        if a.shape != b.shape:
            results[element_id] = {"pass": False, "reason": "size", "base": list(a.shape[:2]), "new": list(b.shape[:2])}
            continue
        differing = int((np.abs(a - b).max(axis=2) > CHANNEL_DELTA).sum())
        ratio = differing / (a.shape[0] * a.shape[1])
        results[element_id] = {"pass": ratio <= MAX_RATIO, "diffRatio": round(ratio, 6), "size": list(a.shape[:2])}
    sys.stdout.reconfigure(encoding="utf-8")
    json.dump(results, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
