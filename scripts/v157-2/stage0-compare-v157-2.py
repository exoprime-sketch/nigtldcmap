"""P8-2 stage 0: the 09-22 processed_data (the 1-pager's basis) against the
current V156 public data, for the 12 elements still shown as 'map pending'.

For each element it records, from each side, what could place the data on a
map: observation indicator ids, entity rows with coordinates, entity attribute
columns naming a province/region/site, and the declared spatial unit. Nothing
is written to the public tree.

    python scripts/v157-2/stage0-compare-v157-2.py [--source <processed_data dir>]
"""
from __future__ import annotations

import argparse
import base64
import gzip
import json
import re
import sys
from collections import Counter
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
TARGETS = ["A-013", "A-022", "B-002", "B-024", "B-035", "B-036", "B-044", "B-046", "B-047", "C-003", "C-006", "C-017", "B-048"]
PLACE_HINT = re.compile(r"성|시|권역|지역|province|region|site|광산|mine|lat|lon|위도|경도|좌표|location|위치|zone|대수층|유역", re.I)

parser = argparse.ArgumentParser()
parser.add_argument("--source", default=str(Path.home() / "Downloads" / "processed_data" / "processed_data"))
parser.add_argument("--out", default="reports/v157-2/stage0-compare-v157-2")
args = parser.parse_args()
SOURCE = Path(args.source)


def workbook_for(element_id: str) -> Path | None:
    # The revised draft ("_수정안") is not the delivered file; lock files are skipped.
    rows = sorted(p for p in SOURCE.glob(f"{element_id}_*.xlsx") if "수정안" not in p.name and not p.name.startswith("~$"))
    return rows[0] if rows else None


def sheet_rows(ws):
    rows = list(ws.iter_rows(values_only=True))
    # Row 2 holds the English field names, row 3 the Korean ones, data from row 4.
    header = [str(c).strip() if c is not None else "" for c in (rows[1] if len(rows) > 1 else [])]
    data = [r for r in rows[3:] if r and any(c not in (None, "") for c in r)]
    return header, data


def profile_workbook(path: Path) -> dict:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    out = {"file": path.name, "sheets": [ws.title for ws in wb.worksheets]}
    for ws in wb.worksheets:
        title = ws.title
        if title.startswith("1.1"):
            header, data = sheet_rows(ws)
            idx = header.index("indicator_id") if "indicator_id" in header else 2
            ids = Counter(str(r[idx]) for r in data if len(r) > idx and r[idx] not in (None, ""))
            out["observation"] = {"rows": sum(ids.values()), "indicatorIds": len(ids), "sampleIds": list(ids)[:40]}
        elif title.startswith("1.2"):
            header, data = sheet_rows(ws)
            data = [r for r in data if str(r[0] or "").strip().upper().startswith(path.name[:1])]
            lat = header.index("lat") if "lat" in header else None
            lon = header.index("lon") if "lon" in header else None
            with_xy = sum(1 for r in data if lat is not None and lon is not None and len(r) > lon and r[lat] not in (None, "") and r[lon] not in (None, ""))
            # Korean labels (row 3) say what attr_n holds.
            rows = list(ws.iter_rows(values_only=True, max_row=3))
            labels = [str(c).strip() if c is not None else "" for c in (rows[2] if len(rows) > 2 else [])]
            place_cols = [f"{h}={labels[i] if i < len(labels) else ''}"[:80] for i, h in enumerate(header) if h and (PLACE_HINT.search(h) or (i < len(labels) and PLACE_HINT.search(labels[i])))]
            out["entity"] = {"rows": len(data), "withCoordinates": with_xy, "placeColumns": place_cols}
        elif title.startswith("2_meta"):
            header, data = sheet_rows(ws)
            su = header.index("spatial_unit") if "spatial_unit" in header else None
            url = header.index("source_url") if "source_url" in header else None
            out["meta"] = {
                "spatialUnits": sorted({str(r[su]) for r in data if su is not None and len(r) > su and r[su]}),
                "sourceUrls": sorted({str(r[url]) for r in data if url is not None and len(r) > url and r[url]})[:8],
            }
    return out


def v156_elements() -> dict:
    """The current public packs (V156) decoded once."""
    found = {}
    for pack in sorted((ROOT / "public/data/vietnam/v2/packs").glob("*-pack-*.json")):
        doc = json.loads(pack.read_text(encoding="utf-8"))
        body = json.loads(gzip.decompress(base64.b64decode("".join(doc["payloadChunks"]))))
        for element_id, element in (body.get("elements") or {}).items():
            if element_id in TARGETS:
                found[element_id] = element
    return found


def profile_v156(element: dict) -> dict:
    obs = (element.get("observations") or {}).get("records") or []
    ents = (element.get("entities") or {}).get("records") or []
    ids = Counter(r.get("indicatorId") for r in obs)
    keys = Counter(k for r in ents for k in (r.get("normalizedAttributes") or {}))
    place_keys = [k for k in keys if PLACE_HINT.search(k)]
    with_xy = sum(1 for r in ents if r.get("lat") not in (None, "") and r.get("lon") not in (None, ""))
    return {
        "observationRows": len(obs),
        "indicatorIds": len(ids),
        "sampleIds": list(ids)[:40],
        "entityRows": len(ents),
        "withCoordinates": with_xy,
        "placeKeys": place_keys[:20],
    }


catalog = {e["elementId"]: e for e in json.loads((ROOT / "public/data/vietnam/v2/catalog.json").read_text(encoding="utf-8"))["elements"]}
current = v156_elements()
report = {"schema": "stage0-compare-v157-2", "source": str(SOURCE), "elements": []}
for element_id in TARGETS:
    path = workbook_for(element_id)
    row = {
        "elementId": element_id,
        "publicStatus": catalog.get(element_id, {}).get("publicStatus"),
        "source0922": profile_workbook(path) if path else None,
        "v156": profile_v156(current[element_id]) if element_id in current else None,
    }
    report["elements"].append(row)

out = ROOT / args.out
out.parent.mkdir(parents=True, exist_ok=True)
(out.with_suffix(".json")).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
for row in report["elements"]:
    s = row["source0922"] or {}
    v = row["v156"] or {}
    print(json.dumps({
        "id": row["elementId"],
        "status": row["publicStatus"],
        "0922": {"obs": (s.get("observation") or {}).get("rows"), "ids": (s.get("observation") or {}).get("indicatorIds"), "ent": (s.get("entity") or {}).get("rows"), "xy": (s.get("entity") or {}).get("withCoordinates"), "su": (s.get("meta") or {}).get("spatialUnits")},
        "v156": {"obs": v.get("observationRows"), "ids": v.get("indicatorIds"), "ent": v.get("entityRows"), "xy": v.get("withCoordinates"), "place": v.get("placeKeys")},
    }, ensure_ascii=False))
