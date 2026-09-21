"""V153-D0 per-element enrichment of the projected records.

Everything here restates what a source already says next to the record that
needs it; nothing is estimated.

- B-046 / B-047: the observation sheet has no mineral column - the mineral is
  only in the meta sheet's ``요소_KR`` ("확인 매장량 — 희토류"), which the ETL
  publishes as the indicator's ``labelKo``. Each observation gets that mineral
  as its ``name`` and the measure part as ``measureLabel``, so the download CSV
  and the detail screen can name the mineral instead of ``reserves_0``.
- E-006: whether the investor sits in Vietnam is decided from its own
  coordinates (point in the 34-province boundary) - the source geocoded the HQ
  for organisations without a Vietnam office - and published as
  ``locationClass``; a Vietnam location also gets its province.
- A-023: WRI rows carry ``[발전소ID: WRI…]`` in their note and the delivery
  ships the GPPD CSV (CC BY 4.0); the row with that ``gppd_idnr`` supplies
  ``owner``, ``commissioning_year``, ``source`` and ``url``. OSM rows already
  hold the operator tag and the object id, published under stable keys plus the
  object's OSM URL. Every plant gets the province its coordinate falls in (34
  current and 63 former), computed once here rather than at runtime.
"""

from __future__ import annotations

import csv
import json
import pathlib
import re
from typing import Any, Iterable, Mapping

GPPD_SOURCE_FILE = "A-023_global_power_plant_database.vnm.csv"
LOCATION_IN_VIETNAM = "베트남 소재"
LOCATION_ABROAD = "해외 소재(베트남 투자 실적)"
MINERAL_ELEMENT_IDS = {"B-046", "B-047"}

# Keys added to normalizedAttributes, with the label the field definition
# carries. "derived:" marks a column the delivery did not ship as such.
DERIVED_FIELDS_V153: dict[str, list[tuple[str, str]]] = {
    "E-006": [
        ("locationClass", "소재 구분(좌표의 34개 성·시 경계 포함 여부로 판정)"),
        ("adm1Name34", "소재 성·시(2025-07-01 시행 34개 기준)"),
        ("adm1Code34", "소재 성·시 코드(34개 기준)"),
        ("adm1Name63", "소재 성·시(개편 전 63개 기준)"),
        ("adm1Code63", "소재 성·시 코드(63개 기준)"),
    ],
    "A-023": [
        ("gppdId", "WRI GPPD 발전소 ID(gppd_idnr)"),
        ("owner", "소유자(GPPD owner)"),
        ("operator", "운영자(OSM operator 태그)"),
        ("commissioningYear", "가동 연도(GPPD commissioning_year · OSM start_date)"),
        ("sourceName", "원천 출처명(GPPD source)"),
        ("sourceUrl", "원천 URL(GPPD url · OSM 객체 URL)"),
        ("adm1Name34", "소재 성·시(2025-07-01 시행 34개 기준)"),
        ("adm1Code34", "소재 성·시 코드(34개 기준)"),
        ("adm1Name63", "소재 성·시(개편 전 63개 기준)"),
        ("adm1Code63", "소재 성·시 코드(63개 기준)"),
    ],
}


# --- point in polygon ---------------------------------------------------------


def _ring_contains(ring: list[list[float]], lon: float, lat: float) -> bool:
    """Even-odd ray casting; a point on an edge counts as inside."""

    inside = False
    count = len(ring)
    j = count - 1
    for i in range(count):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat):
            x_cross = (xj - xi) * (lat - yi) / (yj - yi) + xi
            if lon < x_cross:
                inside = not inside
        j = i
    return inside


def _polygon_contains(polygon: list[list[list[float]]], lon: float, lat: float) -> bool:
    if not polygon or not _ring_contains(polygon[0], lon, lat):
        return False
    return not any(_ring_contains(hole, lon, lat) for hole in polygon[1:])


def _bbox(coords: Iterable[Any]) -> tuple[float, float, float, float]:
    xs: list[float] = []
    ys: list[float] = []

    def walk(node: Any) -> None:
        if isinstance(node[0], (int, float)):
            xs.append(float(node[0]))
            ys.append(float(node[1]))
        else:
            for child in node:
                walk(child)

    walk(list(coords))
    return min(xs), min(ys), max(xs), max(ys)


class Adm1Lookup:
    """Province of a coordinate, for one boundary system's GeoJSON."""

    def __init__(self, geojson_path: pathlib.Path, name_key: str, code_key: str) -> None:
        payload = json.loads(geojson_path.read_text(encoding="utf-8"))
        self.features: list[dict[str, Any]] = []
        for feature in payload.get("features", []):
            geometry = feature.get("geometry") or {}
            polygons: list[list[list[list[float]]]]
            if geometry.get("type") == "Polygon":
                polygons = [geometry["coordinates"]]
            elif geometry.get("type") == "MultiPolygon":
                polygons = geometry["coordinates"]
            else:
                continue
            properties = feature.get("properties") or {}
            self.features.append(
                {
                    "name": properties.get(name_key),
                    "code": properties.get(code_key),
                    "bbox": _bbox(geometry["coordinates"]),
                    "polygons": polygons,
                }
            )
        self.lookups = 0
        self.misses = 0

    def locate(self, lat: Any, lon: Any) -> dict[str, Any] | None:
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            return None
        self.lookups += 1
        for feature in self.features:
            west, south, east, north = feature["bbox"]
            if not (west <= lon <= east and south <= lat <= north):
                continue
            if any(_polygon_contains(polygon, float(lon), float(lat)) for polygon in feature["polygons"]):
                return {"name": feature["name"], "code": feature["code"]}
        self.misses += 1
        return None


# --- GPPD ---------------------------------------------------------------------


def load_gppd_rows(source_dir: pathlib.Path) -> dict[str, dict[str, str]]:
    path = source_dir / GPPD_SOURCE_FILE
    if not path.is_file():
        raise FileNotFoundError(f"GPPD extract missing: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        rows = {row["gppd_idnr"]: row for row in csv.DictReader(handle)}
    if not rows:
        raise ValueError(f"GPPD extract has no rows: {path}")
    return rows


# GPPD ids carry the contributing dataset as a prefix (WRI…, WKS… for Wiki-Solar, …).
_GPPD_ID_PATTERN = re.compile(r"\[발전소ID:\s*([A-Z]{3}\d+)\]")
_YEAR_PATTERN = re.compile(r"^(\d{4})(?:[-./]|$)")


def _year(value: Any) -> int | None:
    text = str(value or "").strip()
    match = _YEAR_PATTERN.match(text)
    if match:
        return int(match.group(1))
    try:
        number = float(text)
    except ValueError:
        return None
    return int(number) if number.is_integer() and 1800 <= number <= 2100 else None


def _clean(value: Any) -> str | None:
    text = str(value or "").strip()
    if not text or text in {"(미표기)", "미기재", "nan", "None"}:
        return None
    return text


# --- per element --------------------------------------------------------------


def enrich_mineral_observations(
    observations: list[dict[str, Any]], indicators: Iterable[Mapping[str, Any]]
) -> dict[str, Any]:
    """Name each B-046/B-047 observation after its mineral (from labelKo)."""

    label_by_id = {
        str(row.get("indicatorId")): str(row.get("labelKo") or "")
        for row in indicators
        if row.get("indicatorId")
    }
    minerals: dict[str, str] = {}
    for record in observations:
        label = label_by_id.get(str(record.get("indicatorId")), "")
        if " — " not in label:
            continue
        measure, mineral = label.rsplit(" — ", 1)
        record["name"] = mineral.strip()
        record["measureLabel"] = measure.strip()
        minerals[str(record.get("indicatorId"))] = mineral.strip()
    return {"namedObservations": len(minerals), "minerals": sorted(set(minerals.values()))}


def enrich_investor_entities(
    entities: list[dict[str, Any]], adm34: Adm1Lookup, adm63: Adm1Lookup
) -> dict[str, Any]:
    counts = {LOCATION_IN_VIETNAM: 0, LOCATION_ABROAD: 0}
    for record in entities:
        attributes = record.setdefault("normalizedAttributes", {})
        hit34 = adm34.locate(record.get("latitude"), record.get("longitude"))
        hit63 = adm63.locate(record.get("latitude"), record.get("longitude"))
        location = LOCATION_IN_VIETNAM if hit34 else LOCATION_ABROAD
        attributes["locationClass"] = location
        attributes["adm1Name34"] = hit34["name"] if hit34 else None
        attributes["adm1Code34"] = hit34["code"] if hit34 else None
        attributes["adm1Name63"] = hit63["name"] if hit63 else None
        attributes["adm1Code63"] = hit63["code"] if hit63 else None
        counts[location] += 1
    return counts


def enrich_power_plants(
    entities: list[dict[str, Any]],
    gppd: Mapping[str, Mapping[str, str]],
    adm34: Adm1Lookup,
    adm63: Adm1Lookup,
) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "wri": {"rows": 0, "joined": 0, "owner": 0, "commissioningYear": 0, "sourceUrl": 0, "unjoined": []},
        "osm": {"rows": 0, "operator": 0, "commissioningYear": 0, "sourceUrl": 0},
        "adm1": {"located34": 0, "located63": 0, "outside": 0},
    }
    for record in entities:
        attributes = record.setdefault("normalizedAttributes", {})
        indicator_id = str(record.get("indicatorId") or "")
        if indicator_id == "A-023_power_plant_registry":
            bucket = summary["wri"]
            bucket["rows"] += 1
            match = _GPPD_ID_PATTERN.search(str(record.get("note") or ""))
            gppd_id = match.group(1) if match else None
            row = gppd.get(gppd_id or "")
            attributes["gppdId"] = gppd_id
            if row is None:
                bucket["unjoined"].append(gppd_id or record.get("recordId"))
                attributes["owner"] = None
                attributes["commissioningYear"] = None
                attributes["sourceName"] = None
                attributes["sourceUrl"] = None
            else:
                bucket["joined"] += 1
                attributes["owner"] = _clean(row.get("owner"))
                attributes["commissioningYear"] = _year(row.get("commissioning_year"))
                attributes["sourceName"] = _clean(row.get("source"))
                attributes["sourceUrl"] = _clean(row.get("url"))
                bucket["owner"] += attributes["owner"] is not None
                bucket["commissioningYear"] += attributes["commissioningYear"] is not None
                bucket["sourceUrl"] += attributes["sourceUrl"] is not None
        else:
            bucket = summary["osm"]
            bucket["rows"] += 1
            operator = _clean(attributes.get("field_4cf75655"))
            osm_id = _clean(attributes.get("field_33702ec7"))
            attributes["operator"] = operator
            attributes["commissioningYear"] = _year(attributes.get("startDate"))
            attributes["sourceUrl"] = f"https://www.openstreetmap.org/{osm_id}" if osm_id and re.fullmatch(r"(node|way|relation)/\d+", osm_id) else None
            bucket["operator"] += operator is not None
            bucket["commissioningYear"] += attributes["commissioningYear"] is not None
            bucket["sourceUrl"] += attributes["sourceUrl"] is not None
        hit34 = adm34.locate(record.get("latitude"), record.get("longitude"))
        hit63 = adm63.locate(record.get("latitude"), record.get("longitude"))
        attributes["adm1Name34"] = hit34["name"] if hit34 else None
        attributes["adm1Code34"] = hit34["code"] if hit34 else None
        attributes["adm1Name63"] = hit63["name"] if hit63 else None
        attributes["adm1Code63"] = hit63["code"] if hit63 else None
        summary["adm1"]["located34"] += hit34 is not None
        summary["adm1"]["located63"] += hit63 is not None
        summary["adm1"]["outside"] += hit34 is None
    return summary


def derived_field_definitions(element_id: str) -> list[dict[str, str]]:
    return [
        {"sourceField": f"derived:{key}", "label": label, "normalizedKey": key}
        for key, label in DERIVED_FIELDS_V153.get(element_id, [])
    ]


class EnrichmentContextV153:
    """Loaded once per build: boundaries and the GPPD extract."""

    def __init__(self, repo: pathlib.Path) -> None:
        geometry = repo / "public/data/vietnam/v2/geometry"
        self.adm34 = Adm1Lookup(geometry / "vnm-adm1-34.geojson", "name", "unitCode")
        self.adm63 = Adm1Lookup(geometry / "vnm-adm1-63.geojson", "name", "adm1Code")
        self.gppd = load_gppd_rows(repo / "tools/vietnam_etl/source")
        self.summary: dict[str, Any] = {}

    def apply(
        self,
        element_id: str,
        observations: list[dict[str, Any]],
        entities: list[dict[str, Any]],
        indicators: Iterable[Mapping[str, Any]],
        field_definitions: list[dict[str, str]],
    ) -> None:
        if element_id in MINERAL_ELEMENT_IDS:
            self.summary[element_id] = enrich_mineral_observations(observations, indicators)
        elif element_id == "E-006":
            self.summary[element_id] = enrich_investor_entities(entities, self.adm34, self.adm63)
        elif element_id == "A-023":
            self.summary[element_id] = enrich_power_plants(entities, self.gppd, self.adm34, self.adm63)
        else:
            return
        existing = {row.get("normalizedKey") for row in field_definitions}
        for definition in derived_field_definitions(element_id):
            if definition["normalizedKey"] not in existing:
                field_definitions.append(definition)
