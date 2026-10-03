"""P8-2 (지도 12): cross-check and region tags for the twelve map targets, read
straight from the delivery workbooks (V162, 2026-09-30 입고).

The map layers themselves are built by scripts/v138/build-map-layers-v138.mjs from
the public packs (the same rows the detail screens read). This script reads the
workbooks independently, so the build can be checked against the delivery:

- B-002 · B-024 · B-035 · B-036: per-province rows (63 and 34 systems) and their
  coverage. Written to tmp/map12-prepared-v162/ (large, not committed); the
  summary goes to reports/v157-2/map12-prepared-v162.json.
- A-013: the public pack carries only the SDG code and information type of each
  record; the NDC action text that names a region is in the workbook alone. The
  records whose text names one of the six socio-economic regions by its official
  name (six-regions.json, "exact" variants only) are written to
  tools/etl/countries/vnm/map12/prepared/a-013-regions.json, which the build reads.
  General words ("coastal areas", "Northern mountainous regions") are not region
  names and are not linked.

Rules kept here (user, 2026-09-30):
- Only rows the source itself states per province/region/site. A national
  value is never spread over provinces; rows the supplier marked as an
  allocation ("[추정치(배분)]") are excluded and listed.
- A name that cannot be resolved to a 63 or 34 code stops the build.

V162 column changes (2026-09-30 delivery): '2025 개편 후 소속(34개 체계)' became
'개편 후 소속 단위'; every sheet carries '행정단위' (Province / City /
'Province/City (2025년 34개 체계)' / Country); 34-unit rows use unaccented names
('aNang', 'Hue', 'HaTinh') and are resolved through the 34-unit name column.

    python scripts/v157-2/prepare-map12-v157-2.py --source <delivery dir> [--only B-002,A-013]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
CHECK_DIR = ROOT / "tmp/map12-prepared-v162"
TAG_DIR = ROOT / "tools/etl/countries/vnm/map12/prepared"
SUMMARY = ROOT / "reports/v157-2/map12-prepared-v162.json"
GEOMETRY = ROOT / "public/data/vietnam/v2/geometry"
MAP12 = ROOT / "tools/etl/countries/vnm/map12"

parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True)
parser.add_argument("--delivered-at", default="2026-09-30")
parser.add_argument("--only", default="")
args = parser.parse_args()
SOURCE = Path(args.source)
ONLY = {x.strip() for x in args.only.split(",") if x.strip()}


# ------------------------------------------------------------------ names → codes
def name_key(value: str) -> str:
    text = unicodedata.normalize("NFD", str(value or "")).replace("đ", "d").replace("Đ", "D")
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"^(tinh|thanh pho|tp\.?|province|city)\s+", "", text.strip(), flags=re.I)
    return re.sub(r"[^a-z0-9]", "", text.lower())


ALIASES = json.loads((GEOMETRY / "vnm-adm1-aliases.json").read_text(encoding="utf-8"))["aliases"]
KEY63: dict[str, str] = {}
NAME63: dict[str, str] = {}
for row in ALIASES:
    NAME63[row["adm1Code"]] = row["canonicalName"]
    for variant in [row["canonicalName"], row["normalizedKey"], *row["variants"]]:
        KEY63[name_key(variant)] = row["adm1Code"]
# Spellings the delivery uses that the alias table does not list.
EXTRA63 = {"hochiminh": "Hồ Chí Minh", "hcmc": "Hồ Chí Minh", "thuathienhue": "Thừa Thiên Huế"}
for key, canonical in EXTRA63.items():
    code = KEY63.get(name_key(canonical))
    if code:
        KEY63.setdefault(key, code)

UNITS34 = [f["properties"] for f in json.loads((GEOMETRY / "vnm-adm1-34.geojson").read_text(encoding="utf-8"))["features"]]
KEY34 = {name_key(u["name"]): u["unitCode"] for u in UNITS34}
NAME34 = {u["unitCode"]: u["name"] for u in UNITS34}


def code63(name: str) -> str:
    code = KEY63.get(name_key(name))
    if not code:
        raise SystemExit(f"UNRESOLVED_63: {name!r}")
    return code


def code34(name: str) -> str:
    code = KEY34.get(name_key(name))
    if not code:
        raise SystemExit(f"UNRESOLVED_34: {name!r}")
    return code


# ------------------------------------------------------------------ workbook
def workbook(element_id: str) -> Path:
    rows = sorted(p for p in SOURCE.glob(f"{element_id}_*.xlsx") if "수정안" not in p.name and not p.name.startswith("~$"))
    if not rows:
        raise SystemExit(f"NO_WORKBOOK: {element_id}")
    return rows[0]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def entity_rows(path: Path, element_id: str):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = next(w for w in wb.worksheets if w.title.startswith("1.2"))
    rows = list(ws.iter_rows(values_only=True))
    header = [str(c).strip() if c is not None else "" for c in rows[1]]
    labels = [str(c).strip() if c is not None else "" for c in rows[2]]
    data = [r for r in rows[3:] if r and str(r[0] or "").startswith(element_id)]
    by_label = {labels[i]: i for i in range(len(labels)) if labels[i]}
    return ws.title, header, labels, by_label, data


def cell(row, index):
    value = row[index] if index is not None and index < len(row) else None
    return None if value in (None, "") else value


def number(value):
    try:
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return None


def source_block(path: Path, sheet: str, used: Counter, excluded: Counter) -> dict:
    return {
        "kind": f"delivery-{args.delivered_at}",
        "file": path.name,
        "sha256": sha256(path),
        "sheet": sheet,
        "indicatorIdsUsed": dict(sorted(used.items())),
        "indicatorIdsExcluded": dict(sorted(excluded.items())),
    }


def coverage(rows: list[dict]) -> dict:
    codes63 = {r["adm1Code"] for r in rows if r.get("system") == "adm1-63"}
    codes34 = {r["unitCode"] for r in rows if r.get("system") == "adm1-34"}
    return {
        "adm1_63": {"regions": len(codes63), "missing": sorted(set(NAME63) - codes63)},
        "adm1_34": {"regions": len(codes34), "missing": sorted(set(NAME34) - codes34)},
    }


UNIT34_LABEL = "개편 후 소속 단위"


def region_row(row, by, indicator: str) -> dict | None:
    """The province/unit a row belongs to, from the row's own system; None for a national row."""
    unit = str(cell(row, by["행정단위"]) or "")
    if unit == "Country":
        return None
    if indicator.endswith("_adm34") or "34개 체계" in unit:
        name = cell(row, by[UNIT34_LABEL])
        unit_code = code34(name)
        return {"system": "adm1-34", "unitCode": unit_code, "name": NAME34[unit_code], "sourceName": name}
    name = cell(row, by["지역명"])
    code = code63(name)
    return {"system": "adm1-63", "adm1Code": code, "name": NAME63[code], "sourceName": name}


# ------------------------------------------------------------------ elements
def prepare_b002() -> dict:
    path = workbook("B-002")
    sheet, header, labels, by, data = entity_rows(path, "B-002")
    ind = header.index("indicator_id")
    used, excluded, rows = Counter(), Counter(), []
    zone_cols = ["열대 A군(%)", "건조 B군(%)", "온대 C군(%)", "냉대 D군(%)", "한대 E군(%)"]
    for r in data:
        indicator = str(r[ind])
        # The per-zone breakdown rows (…_class_adm1) restate the same provinces
        # once per climate class; the map reads the province summary rows.
        if "_class_" in indicator:
            excluded[indicator] += 1
            continue
        used[indicator] += 1
        rows.append({
            **region_row(r, by, indicator),
            "period": str(cell(r, by["기간"])),
            "valueKind": str(cell(r, by["값 구분"])),
            "dominantZone": str(cell(r, by["우세 기후대"])),
            "dominantSharePct": number(cell(r, by["우세 기후대 점유율(%)"])),
            "zoneGroupSharePct": {c.split(" ")[0]: number(cell(r, by[c])) for c in zone_cols},
        })
    return {
        "elementId": "B-002",
        "mapForm": "categorical-choropleth",
        "method": "Beck et al.(2023) Köppen-Geiger 1km 래스터를 성·시 경계로 격자 집계(납품). 34개 체계 값은 34 경계로 다시 계산한 납품 행",
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "periods": sorted({r["period"] for r in rows}),
        "rows": rows,
    }


def prepare_b024() -> dict:
    path = workbook("B-024")
    sheet, header, labels, by, data = entity_rows(path, "B-024")
    ind = header.index("indicator_id")
    used, excluded, rows = Counter(), Counter(), []
    for r in data:
        indicator = str(r[ind])
        nature = str(cell(r, by["값의 성격"]) or "")
        # The agricultural-water share per province is the national AQUASTAT
        # value spread by rice area: an allocation, not a provincial figure.
        if "배분" in nature and "추정" in nature:
            excluded[indicator] += 1
            continue
        used[indicator] += 1
        rows.append({
            **region_row(r, by, indicator),
            "year": int(number(cell(r, by["기준연도"]))),
            "value": number(cell(r, by["값"])),
            "unit": str(cell(r, by["단위"])),
        })
    return {
        "elementId": "B-024",
        "mapForm": "choropleth",
        "proxy": True,
        "method": "베트남 통계청(NSO, 구 GSO) 성별 벼 재배면적 원천 통계(관개면적 표 없음 → 대리지표). 국가 농업용수 비중을 면적 비율로 나눈 '배분' 행은 제외(임의 배분 금지)",
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "rows": rows,
    }


LC_CLASSES = ["산림", "농경지", "초지·관목", "습지", "도시", "나지"]


def prepare_b035() -> dict:
    path = workbook("B-035")
    sheet, header, labels, by, data = entity_rows(path, "B-035")
    ind = header.index("indicator_id")
    used, excluded, rows = Counter(), Counter(), []
    for r in data:
        indicator = str(r[ind])
        region = region_row(r, by, indicator)
        if region is None:
            excluded[indicator] += 1
            continue
        used[indicator] += 1
        rows.append({
            **region,
            "year": int(number(cell(r, by["연도"]))),
            "areaKm2": {c: number(cell(r, by[f"{c} 면적(km²)"])) for c in LC_CLASSES},
            "sharePctOfLand": {c: number(cell(r, by[f"{c} 비율(%, 육지 대비)"])) for c in LC_CLASSES},
        })
    return {
        "elementId": "B-035",
        "mapForm": "choropleth",
        "method": "ESA CCI / C3S Land Cover 300m 래스터를 성·시 경계로 격자 집계(납품). 국가 행(Country)은 지도에서 제외",
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "years": sorted({r["year"] for r in rows}),
        "rows": rows,
    }


def prepare_b036() -> dict:
    path = workbook("B-036")
    sheet, header, labels, by, data = entity_rows(path, "B-036")
    ind = header.index("indicator_id")
    used, excluded, rows = Counter(), Counter(), []
    for r in data:
        indicator = str(r[ind])
        region = region_row(r, by, indicator)
        if region is None:
            excluded[indicator] += 1
            continue
        used[indicator] += 1
        rows.append({
            **region,
            "period": str(cell(r, by["기간(시작-종료)"])),
            "cagrPctPerYear": {c: number(cell(r, by[f"{c} CAGR(%/yr)"])) for c in LC_CLASSES},
        })
    return {
        "elementId": "B-036",
        "mapForm": "diverging-choropleth",
        "method": "B-035 성×연도 토지피복 면적(ESA CCI LC 격자 집계)에서 계산한 연평균 변화율(납품 자체 산출값)",
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "periods": sorted({r["period"] for r in rows}),
        "rows": rows,
    }


# ------------------------------------------------------------------ A-013 (six-region names in the NDC action text)
SIX = json.loads((MAP12 / "six-regions.json").read_text(encoding="utf-8"))


def six_region_patterns() -> list[tuple[str, str, re.Pattern]]:
    patterns = []
    for region in SIX["regions"]:
        names = [region["nameVi"]] + [v["text"] for v in region.get("englishVariants", []) if v.get("match") == "exact"]
        for name in names:
            name = re.sub(r"\s*\(untranslated\)$", "", name)
            # Whole words only, so "South East" is not read out of "South East Asia".
            patterns.append((region["key"], name, re.compile(rf"(?<![\w]){re.escape(name)}(?![\w])(?!\s+Asia)", re.I)))
    return patterns


def prepare_a013() -> dict:
    path = workbook("A-013")
    sheet, header, labels, by, data = entity_rows(path, "A-013")
    text_col, id_col, target_col = by["NDC 조치 원문"], by["레코드ID"], header.index("attr_1")
    patterns = six_region_patterns()
    records, regions = [], Counter()
    for r in data:
        text = str(cell(r, text_col) or "")
        found = sorted({key for key, _, pattern in patterns if pattern.search(text)})
        if not found:
            continue
        names = sorted({name for key, name, pattern in patterns if pattern.search(text)})
        for key in found:
            regions[key] += 1
        records.append({
            "sourceRecordId": str(cell(r, id_col)),
            "sdgTarget": str(cell(r, target_col)),
            "sector": str(cell(r, by["NDC 부문"]) or ""),
            "regions": found,
            "regionNamesInText": names,
            "actionText": text,
            "sourceUrl": str(cell(r, by["원문 링크"]) or ""),
        })
    return {
        "elementId": "A-013",
        "mapForm": "group-constant-six-region",
        "method": "NDC 조치 원문이 6대 사회경제 권역(NQ 81/2023/QH15)을 공식 명칭으로 적은 레코드만 그 권역에 연결. 일반 지역어(해안·북부 산지 등)는 연결하지 않음",
        "source": source_block(path, sheet, Counter({"A-013_ndc_sdg_linkage_registry": len(data)}), Counter()),
        "coverage": {"records": len(data), "linkedRecords": len(records), "regions": dict(sorted(regions.items()))},
        "rows": records,
    }


BUILDERS = {
    "B-002": prepare_b002, "B-024": prepare_b024, "B-035": prepare_b035, "B-036": prepare_b036,
    "A-013": prepare_a013,
}

CHECK_DIR.mkdir(parents=True, exist_ok=True)
TAG_DIR.mkdir(parents=True, exist_ok=True)
summary = json.loads(SUMMARY.read_text(encoding="utf-8")) if SUMMARY.exists() and ONLY else {"elements": {}}
summary.update({"schema": "map12-prepared-v162", "source": f"delivery-{args.delivered_at}"})
for element_id, build in BUILDERS.items():
    if ONLY and element_id not in ONLY:
        continue
    doc = {"schema": "map12-prepared-v157-2", **build()}
    out = (TAG_DIR / "a-013-regions.json") if element_id == "A-013" else (CHECK_DIR / f"{element_id.lower()}.json")
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    summary["elements"][element_id] = {
        "rows": len(doc["rows"]),
        "coverage": doc["coverage"],
        "used": doc["source"].get("indicatorIdsUsed"),
        "excluded": doc["source"].get("indicatorIdsExcluded"),
        "file": doc["source"]["file"],
        "sha256": doc["source"]["sha256"],
    }
    print(json.dumps({"elementId": element_id, **{k: v for k, v in summary["elements"][element_id].items() if k not in ("sha256",)}}, ensure_ascii=False))
SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
