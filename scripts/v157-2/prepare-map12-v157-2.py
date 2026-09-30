"""P8-2 (지도 12): map-ready tables for the 12 "map pending" elements.

STATUS 2026-09-30 (세션2): the 09-22 vintage prepared/*.json this script used to write
were removed before this branch was ever pushed (old-vintage values are not committed,
per user instruction). Re-run this with --source pointed at the V162-refreshed data
once feat/v162-data-refresh merges into origin/main - not before.

Rules kept here (user, 2026-09-30):
- Only rows the source itself states per province/region/site. A national
  value is never spread over provinces; rows the supplier marked as an
  allocation ("[추정치(배분)]") are excluded and listed.
- Every crosswalk carries official URLs (tools/etl/countries/vnm/map12/*.json).
- A name that cannot be resolved to a 63 or 34 code stops the build.

V162 diff notes (세션5, 2026-09-30) confirmed against this script and the verified
reference tables (reports/v157-2/REVIEW_V157-2.md, sections 2-3):
- B-024: prepare_b024() already keeps only the rows whose "값의 성격" is NOT both
  "배분" and "추정" - the NSO rice-cultivation-area rows (97 of the new delivery's 194).
  No code change needed; re-run with the new --source.
- C-017: the new delivery carries a per-record region column (북/중/남 + Ninh Thuan and
  Khanh Hoa marked as special cases). When this script adds a C-017 builder, read that
  column first; fall back to map12/c017-price-regions.json (six-region grouping, see
  build-c017-regions-v157-2.mjs) only for a record the column leaves blank. Flag the
  two special-case provinces on the map and in the panel.
- C-006: session5's tally (18 projects / 27 provinces) matches verify-jcm-v157-2.mjs's
  output exactly (mapUse === "count" rows) - no per-project reconciliation needed.

    python scripts/v157-2/prepare-map12-v157-2.py [--source <processed_data dir>] [--only B-002,B-024]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "tools/etl/countries/vnm/map12/prepared"
GEOMETRY = ROOT / "public/data/vietnam/v2/geometry"

parser = argparse.ArgumentParser()
parser.add_argument("--source", default=str(Path.home() / "Downloads" / "processed_data" / "processed_data"))
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
EXTRA63 = {"hochiminh": "Hồ Chí Minh", "hcmc": "Hồ Chí Minh", "thuathienhue": "Thừa Thiên Huế", "hue": "Thừa Thiên Huế"}
for key, canonical in EXTRA63.items():
    code = KEY63.get(name_key(canonical))
    if code:
        KEY63.setdefault(key, code)

UNITS34 = [f["properties"] for f in json.loads((GEOMETRY / "vnm-adm1-34.geojson").read_text(encoding="utf-8"))["features"]]
KEY34 = {name_key(u["name"]): u["unitCode"] for u in UNITS34}
NAME34 = {u["unitCode"]: u["name"] for u in UNITS34}
MEMBERS34 = {u["unitCode"]: u["memberAdm1Codes"] for u in UNITS34}


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
        "kind": "processed_data-2026-09-22",
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


def region_row(row, idx_name, idx_name34, indicator: str) -> dict:
    """The province/unit a row belongs to, from the indicator's own system."""
    if indicator.endswith("_adm34"):
        name = cell(row, idx_name34)
        unit = code34(name)
        return {"system": "adm1-34", "unitCode": unit, "name": NAME34[unit], "sourceName": name}
    name = cell(row, idx_name)
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
        used[indicator] += 1
        rows.append({
            **region_row(r, by["지역명"], by["2025 개편 후 소속(34개 체계)"], indicator),
            "period": str(cell(r, by["기간"])),
            "valueKind": str(cell(r, by["값 구분"])),
            "dominantZone": str(cell(r, by["우세 기후대"])),
            "dominantSharePct": number(cell(r, by["우세 기후대 점유율(%)"])),
            "zoneGroupSharePct": {c.split(" ")[0]: number(cell(r, by[c])) for c in zone_cols},
            "zoneCount": number(cell(r, by["기후대 수"])),
        })
    return {
        "elementId": "B-002",
        "mapForm": "categorical-choropleth",
        "mapFormNote": "성·시별 최다 기후대(범주). 기간 선택(1901-1930 · 1991-2020 실적 / 2071-2099 SSP2-4.5 · SSP5-8.5 전망)",
        "method": "Beck et al.(2023) Köppen-Geiger 1km 래스터를 성·시 경계로 격자 집계(납품 09-22). 34개 체계 값은 34 경계로 다시 계산한 납품 행",
        "defaultPeriod": "1991-2020",
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "rows": rows,
    }


def prepare_b024() -> dict:
    path = workbook("B-024")
    sheet, header, labels, by, data = entity_rows(path, "B-024")
    ind = header.index("indicator_id")
    used, excluded, rows = Counter(), Counter(), []
    source_note = None
    for r in data:
        indicator = str(r[ind])
        nature = str(cell(r, by["값의 성격"]) or "")
        # The agricultural-water share per province is the national AQUASTAT
        # value spread by rice area: an allocation, not a provincial figure.
        if "배분" in nature and "추정" in nature:
            excluded[indicator] += 1
            continue
        used[indicator] += 1
        source_note = cell(r, by["원자료 출처"])
        rows.append({
            **region_row(r, by["지역명"], by["2025 개편 후 소속(34개 체계)"], indicator),
            "year": int(number(cell(r, by["기준연도"]))),
            "value": number(cell(r, by["값"])),
            "unit": str(cell(r, by["단위"])),
            "sourceValue": number(cell(r, by["배분 기준값(원값)"])),
            "sourceUnit": str(cell(r, by["원값 단위"])),
        })
    return {
        "elementId": "B-024",
        "mapForm": "choropleth",
        "mapFormNote": "대리지표: 성·시별 벼 재배면적(ha). 농업용수 비중 자체의 성별 값은 원천에 없음",
        "proxy": True,
        "method": "베트남 통계청(NSO, 구 GSO) 성별 벼 재배면적 원천 통계(관개면적 표 없음 → 대리지표). 국가 농업용수 비중을 면적 비율로 나눈 '배분' 행은 제외(임의 배분 금지)",
        "officialSource": {"publisher": "General Statistics Office of Viet Nam (NSO)", "table": "PxWeb E06.13 Planted area of paddy by province", "citation": source_note},
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "rows": rows,
    }


LC_CLASSES = ["산림", "농경지", "초지·관목", "습지", "도시", "나지", "수체"]


def prepare_b035() -> dict:
    path = workbook("B-035")
    sheet, header, labels, by, data = entity_rows(path, "B-035")
    ind = header.index("indicator_id")
    used, excluded, rows = Counter(), Counter(), []
    national = []
    for r in data:
        indicator = str(r[ind])
        used[indicator] += 1
        values = {
            "areaKm2": {c: number(cell(r, by[f"{c} 면적(km²)"])) for c in LC_CLASSES},
            "sharePctOfLand": {c: number(cell(r, by[f"{c} 비율(%, 육지 대비)"])) for c in LC_CLASSES if f"{c} 비율(%, 육지 대비)" in by},
            "landAreaKm2": number(cell(r, by["육지 면적 합계(km², 수체 제외)"])),
        }
        year = int(number(cell(r, by["연도"])))
        if indicator.endswith("_national_year"):
            national.append({"year": year, **values})
            continue
        rows.append({**region_row(r, by["지역명"], by["2025 개편 후 소속(34개 체계)"], indicator), "year": year, **values})
    return {
        "elementId": "B-035",
        "mapForm": "choropleth",
        "mapFormNote": "성·시별 토지피복 면적·비율(연도 선택, 1992–2022). 기본 = 산림 비율",
        "method": "ESA CCI Land Cover 300m 래스터를 성·시 경계로 격자 집계(납품 09-22, B-039~B-042와 같은 방식). GSO 보강 불필요(0단계 자료에 성별 값 있음)",
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "national": national,
        "rows": rows,
    }


def prepare_b036() -> dict:
    path = workbook("B-036")
    sheet, header, labels, by, data = entity_rows(path, "B-036")
    ind = header.index("indicator_id")
    used, excluded, rows, national = Counter(), Counter(), [], []
    classes = ["산림", "농경지", "초지·관목", "습지", "도시", "나지"]
    for r in data:
        indicator = str(r[ind])
        used[indicator] += 1
        values = {
            "period": str(cell(r, by["기간(시작-종료)"])),
            "years": number(cell(r, by["연수"])),
            "cagrPctPerYear": {c: number(cell(r, by[f"{c} CAGR(%/yr)"])) for c in classes},
            "areaStartKm2": {c: number(cell(r, by[f"{c} 면적 시작(km²)"])) for c in classes},
            "areaEndKm2": {c: number(cell(r, by[f"{c} 면적 종료(km²)"])) for c in classes},
        }
        if indicator.endswith("_national"):
            national.append(values)
            continue
        rows.append({**region_row(r, by["지역명"], by["2025 개편 후 소속(34개 체계)"], indicator), **values})
    return {
        "elementId": "B-036",
        "mapForm": "diverging-choropleth",
        "mapFormNote": "성·시별 토지피복 연평균 변화율(%/yr, 기간 선택). 기본 = 산림, 1992-2022",
        "method": "B-035 성×연도 토지피복 면적(ESA CCI LC 격자 집계)에서 계산한 CAGR(납품 09-22 자체 산출·환산값)",
        "source": source_block(path, sheet, used, excluded),
        "coverage": coverage(rows),
        "national": national,
        "rows": rows,
    }


# ------------------------------------------------------------------ V156 packs
_PACK_CACHE: dict[str, dict] = {}


def v156_element(element_id: str) -> dict:
    if not _PACK_CACHE:
        import base64
        import gzip

        for pack in sorted((ROOT / "public/data/vietnam/v2/packs").glob("*-pack-*.json")):
            doc = json.loads(pack.read_text(encoding="utf-8"))
            body = json.loads(gzip.decompress(base64.b64decode("".join(doc["payloadChunks"]))))
            _PACK_CACHE.update(body.get("elements") or {})
    return _PACK_CACHE[element_id]


def v156_source(element_id: str) -> dict:
    manifest = json.loads((ROOT / "public/data/vietnam/v2/manifest.json").read_text(encoding="utf-8"))
    return {"kind": "v156-public-pack", "elementId": element_id, "manifestGeneratedAt": manifest.get("generatedAt")}


# ------------------------------------------------------------------ minerals (B-044·B-046·B-047 ← B-048 mines)
# B-048 광종 text → the mineral keys it names. A co-product the supplier lists
# in the same field ("텅스텐(+형석·비스무트·구리)") counts, flagged as such.
MINE_MINERALS = {
    "보크사이트/알루미나": [("bauxite", False), ("alumina", False)],
    "텅스텐(+형석·비스무트·구리)": [("tungsten", False), ("fluorspar", True), ("copper", True)],
    "희토류": [("rare_earths", False)],
    "티타늄(ilmenite·leucoxene)": [("titanium", False)],
    "구리": [("copper", False)],
    "니켈": [("nickel", False)],
}
# Indicator label suffix (after " — ") → mineral key.
MINERAL_KEYS = {
    "희토류": "rare_earths", "텅스텐": "tungsten", "보크사이트": "bauxite", "알루미나": "alumina", "흑연": "graphite",
    "안티모니": "antimony", "주석": "tin", "형석": "fluorspar", "인광석": "phosphate", "인광석(아파타이트)": "phosphate",
    "구리": "copper", "니켈": "nickel", "코발트": "cobalt", "리튬": "lithium", "망간": "manganese", "납-아연": "lead_zinc",
    "철": "iron", "크로마이트": "chromite", "티타늄광물": "titanium", "티타늄광물(미가공)": "titanium", "시멘트": "cement",
}


def b048_mines() -> list[dict]:
    """The eight B-048 mines: V156 verified coordinates, else the 09-22
    supplier coordinate (OSM feature point, marked estimated), else province only."""
    path = workbook("B-048")
    _, header, labels, by, data = entity_rows(path, "B-048")
    lat_i, lon_i = header.index("lat"), header.index("lon")
    locations = json.loads((ROOT / "public/data/vietnam/v2/spatial/locations/b-048.json").read_text(encoding="utf-8"))["byRecordId"]
    v156 = {(r.get("normalizedAttributes") or {}).get("광산명"): r for r in v156_element("B-048")["entities"]["records"]}
    mines = []
    for r in data:
        name = str(cell(r, by["광산명"]))
        kind = str(cell(r, by["광종"]))
        province = code63(str(cell(r, by["소재 행정구역(성)"])))
        basis = str(cell(r, by["좌표 산출근거"]) or "")
        record = v156.get(name) or {}
        verified = locations.get(record.get("recordId") or record.get("id") or "", {})
        lat, lon = number(cell(r, lat_i)), number(cell(r, lon_i))
        if lat is not None and lon is not None and "USGS MRDS" in basis:
            coordinate = {"lat": lat, "lon": lon, "basis": "USGS MRDS(Edition 20160315) 지점 좌표", "estimated": False, "inPublishedLayer": bool(verified)}
        elif lat is not None and lon is not None:
            coordinate = {"lat": lat, "lon": lon, "basis": basis.split(" — ")[0][:160], "estimated": True, "inPublishedLayer": False}
        else:
            coordinate = None
        mines.append({
            "mine": name,
            "mineralText": kind,
            "minerals": [{"key": key, "coProduct": co} for key, co in MINE_MINERALS[kind]],
            "adm1Code": province,
            "provinceName": NAME63[province],
            "unitCode": next(u for u, members in MEMBERS34.items() if province in members),
            "coordinate": coordinate,
            "representation": "point" if coordinate else "province",
        })
    return mines


def mineral_series(element_id: str) -> dict[str, list[dict]]:
    el = v156_element(element_id)
    labels = {i["indicatorId"]: i for i in el["meta"]["indicators"]}
    by_mineral: dict[str, list[dict]] = defaultdict(list)
    for obs in el["observations"]["records"]:
        meta = labels.get(obs["indicatorId"], {})
        label = str(meta.get("indicatorNameKo") or meta.get("labelKo") or meta.get("name") or meta.get("요소_KR") or "")
        mineral = MINERAL_KEYS.get(label.split(" — ")[-1].strip()) if " — " in label else None
        if not mineral:
            continue
        by_mineral[mineral].append({
            "indicatorId": obs["indicatorId"], "label": label, "year": obs.get("year"),
            "value": obs.get("value"), "unit": meta.get("unit"), "scope": "국가 전체 값",
        })
    return by_mineral


def prepare_minerals(element_id: str, form_note: str) -> dict:
    mines = b048_mines()
    series = mineral_series(element_id)
    minerals = []
    for key, rows in sorted(series.items()):
        linked = [m for m in mines if any(x["key"] == key for x in m["minerals"])]
        minerals.append({
            "mineral": key,
            "series": rows,
            "mines": [{"mine": m["mine"], "coProduct": next(x["coProduct"] for x in m["minerals"] if x["key"] == key)} for m in linked],
            "mapStatus": "mines" if linked else "national-only",
        })
    return {
        "elementId": element_id,
        "mapForm": "mine-points-and-provinces",
        "mapFormNote": form_note,
        "method": "B-048 주요 광산을 광종으로 조인. 좌표가 있으면 지점(USGS MRDS 검증 좌표 또는 납품 09-22 OSM 지물 대표점=추정 좌표), 없으면 소재 성 강조. 값은 국가 전체 값으로 패널에만 표시(광산·성에 나눠 배분하지 않음)",
        "source": {**v156_source(element_id), "join": "B-048 (09-22 + V156)", "b048Workbook": workbook("B-048").name, "b048Sha256": sha256(workbook("B-048"))},
        "coverage": {"mines": len(mines), "minePoints": sum(1 for m in mines if m["coordinate"]), "mineProvinces": len({m["adm1Code"] for m in mines}),
                     "mineralsWithMines": sum(1 for m in minerals if m["mapStatus"] == "mines"), "mineralsNationalOnly": [m["mineral"] for m in minerals if m["mapStatus"] == "national-only"]},
        "mines": mines,
        "minerals": minerals,
        "rows": mines,
    }


# ------------------------------------------------------------------ C-006 (JCM registry)
MAP12 = ROOT / "tools/etl/countries/vnm/map12"


def unit34_of(code: str) -> str:
    return next(u for u, members in MEMBERS34.items() if code in members)


def prepare_c006() -> dict:
    registry = json.loads((MAP12 / "jcm-projects.json").read_text(encoding="utf-8"))
    counted = [p for p in registry["projects"] if p["mapUse"] == "count"]
    by63: dict[str, list[str]] = defaultdict(list)
    by34: dict[str, list[str]] = defaultdict(list)
    for project in counted:
        # A project counts once in each province it names, and once per 34 unit
        # even when it names two provinces that merged into it.
        for code in sorted(set(project["provinces63"])):
            by63[code].append(project["id"])
        for unit in sorted({unit34_of(c) for c in project["provinces63"]}):
            by34[unit].append(project["id"])
    rows = [{"system": "adm1-63", "adm1Code": c, "name": NAME63[c], "projectCount": len(ids), "projectIds": ids} for c, ids in sorted(by63.items())]
    rows += [{"system": "adm1-34", "unitCode": u, "name": NAME34[u], "projectCount": len(ids), "projectIds": ids} for u, ids in sorted(by34.items())]
    return {
        "elementId": "C-006",
        "mapForm": "count-choropleth-with-list",
        "mapFormNote": "성·시별 JCM 등록 사업 건수 + 지역 패널 사업 목록(사업명·참여기업·기간·등록부 URL). 여러 성 사업은 각 성에 1건(금액·감축량 합산 없음)",
        "method": "JCM 공식 등록부(jcm.go.jp) 사업별 'Location of project'에서 성·시 확인. 본사 소재지만 적힌 사업은 '지역 미확인' 목록",
        "source": {"kind": "jcm-registry", "registryUrl": registry["registryUrl"], "csvUrl": registry.get("csvUrl"), "retrievedAt": registry["retrievedAt"],
                   "delivered0922": "C-006 1.2_entity '[사업] 소재지'(VN001–VN020) — 불일치 6건은 등록부 우선", "crosswalk": "tools/etl/countries/vnm/map12/jcm-projects.json"},
        "coverage": {"projects": len(registry["projects"]), "counted": len(counted), "adm1_63": len(by63), "adm1_34": len(by34),
                     "locationUnconfirmed": [p["id"] for p in registry["projects"] if p["mapUse"] != "count"]},
        "projects": [{k: p.get(k) for k in ("id", "title", "provinces63", "status", "mapUse", "sourceUrl", "locationText", "reviewNote")} for p in registry["projects"]],
        "rows": rows,
    }


BUILDERS = {
    "C-006": prepare_c006,
    "B-002": prepare_b002, "B-024": prepare_b024, "B-035": prepare_b035, "B-036": prepare_b036,
    "B-044": lambda: prepare_minerals("B-044", "광종별 부존 상태 — 해당 광종 광산 지점·소재 성"),
    "B-046": lambda: prepare_minerals("B-046", "광종별 확인 매장량(국가 전체 값, 패널) — 해당 광종 광산 지점·소재 성"),
    "B-047": lambda: prepare_minerals("B-047", "광종별 광산 생산량(국가 전체 값, 패널) — 해당 광종 광산 지점·소재 성"),
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
summary = []
for element_id, build in BUILDERS.items():
    if ONLY and element_id not in ONLY:
        continue
    doc = {"schema": "map12-prepared-v157-2", **build()}
    (OUT_DIR / f"{element_id.lower()}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    summary.append({"elementId": element_id, "rows": len(doc["rows"]), "coverage": doc["coverage"],
                    "used": doc["source"].get("indicatorIdsUsed"), "excluded": doc["source"].get("indicatorIdsExcluded")})
for row in summary:
    print(json.dumps(row, ensure_ascii=False))
