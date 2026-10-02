"""V162: the delivered 63->34 crosswalk (VNM_행정구역_개편_63to34_대조표.csv)
against the published one (vnm-adm1-34.geojson memberAdm1Codes, which matches
reports/v138/map-targets-build-v138.json crosswalk34). Reports row differences
only; the published crosswalk is kept (user rule 2026-09-30).

    python scripts/v162/compare-crosswalk34-v162.py --csv <path> --out reports/v162/crosswalk34-compare-v162.json
"""
import argparse, csv, json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(); ap.add_argument("--csv", required=True); ap.add_argument("--out", required=True)
a = ap.parse_args()

def key(v):
    t = unicodedata.normalize("NFD", str(v)).replace("đ", "d").replace("Đ", "D")
    t = "".join(c for c in t if unicodedata.category(c) != "Mn").lower()
    t = re.sub(r"^(tinh|thanh pho)\s+", "", t.strip())
    t = re.sub(r"\s+(province|city)$", "", t)
    return re.sub(r"[^a-z0-9]", "", t)

aliases = json.loads((ROOT / "public/data/vietnam/v2/geometry/vnm-adm1-aliases.json").read_text(encoding="utf-8"))["aliases"]
k63 = {}
for r in aliases:
    for v in [r["canonicalName"], r["normalizedKey"], *r["variants"]]:
        k63[key(v)] = r["adm1Code"]
k63.setdefault("hochiminh", k63.get(key("Hồ Chí Minh")))
units = [f["properties"] for f in json.loads((ROOT / "public/data/vietnam/v2/geometry/vnm-adm1-34.geojson").read_text(encoding="utf-8"))["features"]]
published = {key(u["name"]): {"unitCode": u["unitCode"], "name": u["name"], "members": sorted(u["memberAdm1Codes"])} for u in units}

rows = list(csv.DictReader(open(a.csv, encoding="utf-8-sig")))
diffs, matched, unresolved = [], 0, []
seen = set()
for r in rows:
    name = r["개편후_영문"] or r["개편후_지역명"]
    unit = published.get(key(name)) or published.get(key(r["개편후_지역명"]))
    members_raw = [m.strip() for m in r["개편전_구역명"].split("/") if m.strip()]
    members = sorted(filter(None, (k63.get(key(m)) for m in members_raw)))
    missing = [m for m in members_raw if not k63.get(key(m))]
    if missing:
        unresolved.append({"row": r, "names": missing})
    if not unit:
        diffs.append({"type": "unit-not-in-published", "row": r, "members": members})
        continue
    seen.add(unit["unitCode"])
    if members != unit["members"] or int(r["개편전_구역수"] or 0) != len(unit["members"]):
        diffs.append({"type": "membership-differs", "unitCode": unit["unitCode"], "name": unit["name"],
                      "delivered": members, "deliveredCount": r["개편전_구역수"], "published": unit["members"], "osmId": r["개편후_OSM_ID"]})
    else:
        matched += 1
for u in units:
    if u["unitCode"] not in seen:
        diffs.append({"type": "published-unit-missing-in-csv", "unitCode": u["unitCode"], "name": u["name"]})
out = {"schema": "crosswalk34-compare-v162", "csv": Path(a.csv).name, "rows": len(rows), "publishedUnits": len(units),
       "matched": matched, "differences": diffs, "unresolvedNames": unresolved,
       "decision": "기존 대응표 유지(Nghị quyết 202/2025/QH15 기준 geoBoundaries 34). 공식 정정이 확인된 행만 반영"}
Path(a.out).parent.mkdir(parents=True, exist_ok=True)
Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(json.dumps({k: out[k] for k in ("rows", "publishedUnits", "matched")} | {"differences": len(diffs), "unresolved": len(unresolved)}, ensure_ascii=False))
for d in diffs: print(json.dumps(d, ensure_ascii=False)[:300])
for u in unresolved: print("UNRESOLVED", json.dumps(u, ensure_ascii=False)[:200])
