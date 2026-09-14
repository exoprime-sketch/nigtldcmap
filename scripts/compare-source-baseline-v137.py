#!/usr/bin/env python3
"""Compare the current V124 source ZIP against the final ``file/`` archive.

Both carry one workbook per element, so the comparison is per element id:
identical content, changed content, only in one side or the other. Nothing is
written back to either source; this only produces a report.
"""

from __future__ import annotations

import csv
import hashlib
import json
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OLD_ZIP = ROOT / "_source" / "vietnam" / "v124" / "vietnam-data(4).zip"
NEW_DIR = ROOT / "베트남데이터" / "file"
OUT_DIR = ROOT / "reports" / "final-data-integration"
CATALOG = ROOT / "public" / "data" / "vietnam" / "v2" / "catalog.json"

ELEMENT_CHARS = "ABCDE"


def element_of(name: str) -> str | None:
    """Element id from a workbook file name, e.g. ``A-017_....xlsx`` -> ``A-017``."""
    stem = pathlib.PurePosixPath(name).name
    for i in range(len(stem) - 4):
        if (
            stem[i] in ELEMENT_CHARS
            and stem[i + 1] in "-_"
            and stem[i + 2 : i + 5].isdigit()
        ):
            return f"{stem[i]}-{stem[i + 2:i + 5]}"
    return None


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


old: dict[str, dict] = {}
if OLD_ZIP.exists():
    with zipfile.ZipFile(OLD_ZIP) as archive:
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            # Names in this archive were written with a non-UTF8 code page.
            raw = entry.filename.encode("cp437", "ignore")
            for enc in ("utf-8", "cp949", "euc-kr"):
                try:
                    decoded = raw.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                decoded = entry.filename
            eid = element_of(decoded) or element_of(entry.filename)
            if not eid:
                continue
            payload = archive.read(entry)
            old[eid] = {"name": decoded, "bytes": len(payload), "sha256": sha(payload)}

new: dict[str, dict] = {}
for path in sorted(NEW_DIR.glob("*.xlsx")):
    eid = element_of(path.name)
    if not eid:
        continue
    payload = path.read_bytes()
    new[eid] = {"name": path.name, "bytes": len(payload), "sha256": sha(payload)}

catalog_ids = [e["elementId"] for e in json.loads(CATALOG.read_text("utf-8"))["elements"]]

rows = []
for eid in sorted(set(old) | set(new) | set(catalog_ids)):
    o, n = old.get(eid), new.get(eid)
    if o and n:
        state = "IDENTICAL" if o["sha256"] == n["sha256"] else "CONTENT_CHANGED"
    elif n:
        state = "NEW_ONLY"
    elif o:
        state = "OLD_ONLY"
    else:
        state = "NEITHER"
    rows.append(
        {
            "elementId": eid,
            "inCatalog": eid in catalog_ids,
            "state": state,
            "oldBytes": o["bytes"] if o else "",
            "newBytes": n["bytes"] if n else "",
            "byteDelta": (n["bytes"] - o["bytes"]) if (o and n) else "",
            "oldSha256": o["sha256"][:16] if o else "",
            "newSha256": n["sha256"][:16] if n else "",
            "newFileName": n["name"] if n else "",
        }
    )

OUT_DIR.mkdir(parents=True, exist_ok=True)
with (OUT_DIR / "source-baseline-comparison-v137.csv").open("w", encoding="utf-8", newline="") as fh:
    writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

tally: dict[str, int] = {}
for row in rows:
    tally[row["state"]] = tally.get(row["state"], 0) + 1

summary = {
    "oldSourceZip": str(OLD_ZIP.relative_to(ROOT)) if OLD_ZIP.exists() else None,
    "oldWorkbookCount": len(old),
    "newSourceDir": "베트남데이터/file",
    "newWorkbookCount": len(new),
    "catalogElementCount": len(catalog_ids),
    "stateTally": tally,
    "changedElements": [r["elementId"] for r in rows if r["state"] == "CONTENT_CHANGED"],
    "newOnlyElements": [r["elementId"] for r in rows if r["state"] == "NEW_ONLY"],
    "oldOnlyElements": [r["elementId"] for r in rows if r["state"] == "OLD_ONLY"],
    "neitherElements": [r["elementId"] for r in rows if r["state"] == "NEITHER"],
}
(OUT_DIR / "source-baseline-comparison-v137.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(summary, ensure_ascii=False, indent=2)[:2000])
