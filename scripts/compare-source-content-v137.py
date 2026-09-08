#!/usr/bin/env python3
"""Compare old and new source workbooks by cell content, not by byte hash.

Excel rewrites internal metadata on every save, so all 145 workbooks differ by
SHA-256 while their values may be untouched. This parses both sides with the
pipeline's own workbook parser and diffs the normalized records, so a workbook
is only reported as changed when a value, unit, year, indicator or entity
actually moved.

Read-only against both sources.
"""

from __future__ import annotations

import csv
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tools.vietnam_etl.workbook_parser import parse_workbook_bytes  # noqa: E402

OLD_ZIP = ROOT / "_source" / "vietnam" / "v124" / "vietnam-data(4).zip"
NEW_DIR = ROOT / "베트남데이터" / "file"
OUT_DIR = ROOT / "reports" / "final-data-integration"

ELEMENT_CHARS = "ABCDE"


def element_of(name: str) -> str | None:
    stem = pathlib.PurePosixPath(name).name
    for i in range(len(stem) - 4):
        if stem[i] in ELEMENT_CHARS and stem[i + 1] in "-_" and stem[i + 2 : i + 5].isdigit():
            return f"{stem[i]}-{stem[i + 2:i + 5]}"
    return None


def obs_key(rec: dict) -> tuple:
    """Logical identity of an observation, independent of row order."""
    return (
        str(rec.get("indicator_id") or rec.get("indicatorId") or ""),
        str(rec.get("year") or ""),
        str(rec.get("unit") or ""),
        str(rec.get("name") or ""),
    )


def obs_value(rec: dict) -> str:
    return str(rec.get("value") if rec.get("value") is not None else "")


def load_old() -> dict[str, dict]:
    out: dict[str, dict] = {}
    if not OLD_ZIP.exists():
        return out
    with zipfile.ZipFile(OLD_ZIP) as archive:
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            eid = element_of(entry.filename)
            if not eid:
                raw = entry.filename.encode("cp437", "ignore")
                for enc in ("utf-8", "cp949", "euc-kr"):
                    try:
                        eid = element_of(raw.decode(enc))
                        break
                    except UnicodeDecodeError:
                        continue
            if not eid:
                continue
            out[eid] = parse_workbook_bytes(archive.read(entry), entry.filename, include_records=True)
    return out


def load_new() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for path in sorted(NEW_DIR.glob("*.xlsx")):
        eid = element_of(path.name)
        if not eid:
            continue
        out[eid] = parse_workbook_bytes(path.read_bytes(), path.name, include_records=True)
    return out


old = load_old()
new = load_new()

rows = []
for eid in sorted(set(old) | set(new)):
    o, n = old.get(eid), new.get(eid)

    def stats(parsed):
        if not parsed:
            return {}
        obs = parsed.get("observations") or []
        ents = parsed.get("entities") or []
        years = sorted({str(r.get("year")) for r in obs if r.get("year") not in (None, "")})
        return {
            "obs": len(obs),
            "ent": len(ents),
            "indicators": {str(r.get("indicator_id") or r.get("indicatorId") or "") for r in obs},
            "years": years,
            "units": {str(r.get("unit") or "") for r in obs},
            "map": {obs_key(r): obs_value(r) for r in obs},
            "security": parsed.get("securityFindings") or [],
            "errors": parsed.get("errors") or [],
        }

    so, sn = stats(o), stats(n)

    if not o:
        state, detail = "NEW_ONLY", ""
    elif not n:
        state, detail = "OLD_ONLY", "구 원천에만 존재. 이번 폴더에 없다는 이유만으로 삭제하지 않음"
    else:
        changed_vals = sum(
            1 for k, v in sn["map"].items() if k in so["map"] and so["map"][k] != v
        )
        added = len(set(sn["map"]) - set(so["map"]))
        removed = len(set(so["map"]) - set(sn["map"]))
        if changed_vals == 0 and added == 0 and removed == 0 and so["ent"] == sn["ent"]:
            state = "CONTENT_IDENTICAL"
            detail = "바이트는 다르나 관측 키·값·엔터티 수가 모두 동일"
        else:
            state = "CONTENT_CHANGED"
            detail = f"값변경 {changed_vals} / 추가 {added} / 삭제 {removed} / 엔터티 {so['ent']}→{sn['ent']}"

    rows.append(
        {
            "elementId": eid,
            "state": state,
            "detail": detail,
            "oldObs": so.get("obs", ""),
            "newObs": sn.get("obs", ""),
            "oldEnt": so.get("ent", ""),
            "newEnt": sn.get("ent", ""),
            "oldYears": ("~".join([so["years"][0], so["years"][-1]]) if so.get("years") else ""),
            "newYears": ("~".join([sn["years"][0], sn["years"][-1]]) if sn.get("years") else ""),
            "newIndicatorCount": len(sn.get("indicators", ())),
            "unitsAdded": " | ".join(sorted(sn.get("units", set()) - so.get("units", set()))[:6]),
            "unitsRemoved": " | ".join(sorted(so.get("units", set()) - sn.get("units", set()))[:6]),
            "newSecurityFindings": len(sn.get("security", [])),
            "newParseErrors": " | ".join(sn.get("errors", [])[:3]),
        }
    )

OUT_DIR.mkdir(parents=True, exist_ok=True)
with (OUT_DIR / "source-content-comparison-v137.csv").open("w", encoding="utf-8", newline="") as fh:
    writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

tally: dict[str, int] = {}
for row in rows:
    tally[row["state"]] = tally.get(row["state"], 0) + 1

summary = {
    "stateTally": tally,
    "contentChanged": [r["elementId"] for r in rows if r["state"] == "CONTENT_CHANGED"],
    "oldOnly": [r["elementId"] for r in rows if r["state"] == "OLD_ONLY"],
    "totalSecurityFindings": sum(int(r["newSecurityFindings"] or 0) for r in rows),
    "elementsWithParseErrors": [r["elementId"] for r in rows if r["newParseErrors"]],
}
(OUT_DIR / "source-content-comparison-v137.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(summary, ensure_ascii=False, indent=2)[:3000])
