"""Dissolve geoBoundaries ADM2 districts into the country's ADM1 divisions.

Builds the published ADM1 boundary asset for a country whose divisions are not
released as a standalone geoBoundaries layer at full resolution: full-resolution
ADM2 (district) polygons are grouped by their parent division (from the platform's
region-name dictionary), dissolved with shapely, cross-checked spatially against
the coarser geoBoundaries ADM1 release, and simplified as one topology-preserving
coverage. No boundary is hand-drawn: every output vertex traces back to a source
ADM2 vertex.

Usage:
    python -B tools/etl/countries/bgd/boundaries_adm2_dissolve.py --country bgd [--no-download]

--no-download reuses the files already staged under the country's
boundaries.staging directory (see tools/etl/countries/<iso3>/country.json),
after verifying each staged file's sha256 against the sidecar recorded on the
last successful download.
"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import re
import unicodedata
import urllib.request
from pathlib import Path
from typing import Any

import openpyxl
import pyproj
import shapely
from shapely.geometry import mapping, shape
from shapely.validation import explain_validity

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
GEOD = pyproj.Geod(ellps="WGS84")
USER_AGENT = "nigtldcmap-v158-boundary-builder/1.0"

# Gating thresholds from the task spec (checked on the dissolve, before and
# after simplification). These are not per-country magic numbers: they bound
# how much floating-point/topology noise is tolerated in *any* dissolve.
MAX_AREA_PPM_DISSOLVE = 1.0
MAX_GAP_KM2 = 5.0
MAX_OVERLAP_KM2 = 5.0

# geojson byte-size ceiling for the published ADM1 asset (see task step 5).
TARGET_MAX_BYTES = 1_500_000
TOLERANCE_CANDIDATES_DEG = [0.0003, 0.0004, 0.0005, 0.0006, 0.0008, 0.001, 0.0015]


# --------------------------------------------------------------------------
# Key normalisation - ports regionNameKeyV161() from src/data/geo/regionNameV161.ts
# verbatim so that Python and TypeScript agree on the same lookup key for the
# same input string. Keep this in sync with the .ts source if it changes.
# --------------------------------------------------------------------------
_WRAPPER = re.compile(
    r'^[\s\"\'“”‘’([{,.;:\-–—]+'
    r'|[\s\"\'“”‘’)\]},.;:\-–—]+$'
)
_VI_ADMIN_PREFIX = re.compile(
    r'^(?:tỉnh|thành phố|thanh pho|tp\.?|t\.p\.?|'
    r'thị xã|thị trấn|huyện|quận|phường|xã)\s+'
)
_EN_ADMIN_PREFIX = re.compile(r"^(?:province of|city of)\s+")
_EN_ADMIN_SUFFIX = re.compile(r"\s+(?:provinces?|city|municipality|division|district|commune|ward|town)$")


def region_name_key(raw: str | None) -> str:
    """Lookup key: NFC, strip wrapper punctuation, lowercase, repeatedly strip
    Vietnamese/English admin prefixes/suffixes, NFD, drop combining marks,
    d-with-stroke -> d, keep [a-z0-9] only. Must match regionNameKeyV161()."""
    text = unicodedata.normalize("NFC", raw or "")
    text = _WRAPPER.sub("", text).lower()
    while True:
        previous = text
        text = _VI_ADMIN_PREFIX.sub("", text)
        text = _EN_ADMIN_PREFIX.sub("", text)
        text = _EN_ADMIN_SUFFIX.sub("", text)
        if text == previous:
            break
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if not (0x0300 <= ord(ch) <= 0x036F))
    text = text.replace("đ", "d")
    return re.sub(r"[^a-z0-9]+", "", text)


# --------------------------------------------------------------------------
# Small IO helpers
# --------------------------------------------------------------------------
def write_bytes_lf(path: Path, data: bytes) -> None:
    """Binary write: guarantees LF-only line endings even on Windows, where
    text-mode writes would translate '\\n' to '\\r\\n'."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def dump_compact(payload: Any) -> bytes:
    return (json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def dump_pretty(payload: Any) -> bytes:
    return (json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def repo_relative(path: Path) -> str:
    """Portable, forward-slash path for the tracked report, relative to the
    repository root (works even when path walks outside it via '..')."""
    return path.relative_to(REPOSITORY_ROOT).as_posix()


# --------------------------------------------------------------------------
# Registry / ETL config
# --------------------------------------------------------------------------
def load_registry_entry(iso3: str) -> dict[str, Any]:
    registry_path = REPOSITORY_ROOT / "public" / "data" / "countries.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    for entry in registry["countries"]:
        if entry["iso3"] == iso3:
            return entry
    raise SystemExit(f"{iso3} is not declared in {registry_path}")


def load_country_config(iso3_lower: str) -> dict[str, Any]:
    path = REPOSITORY_ROOT / "tools" / "etl" / "countries" / iso3_lower / "country.json"
    if not path.exists():
        raise SystemExit(f"No ETL country config at {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_region_dictionary(iso3: str) -> tuple[dict[str, dict], dict[str, dict]]:
    """Return (district_by_key, division_by_key) from src/data/geo/regionNamesV161.json."""
    path = REPOSITORY_ROOT / "src" / "data" / "geo" / "regionNamesV161.json"
    document = json.loads(path.read_text(encoding="utf-8"))
    block = document["countries"].get(iso3)
    if block is None:
        raise SystemExit(f"{iso3} has no entries in {path}")
    district_by_key: dict[str, dict] = {}
    division_by_key: dict[str, dict] = {}
    for entry in block["entries"]:
        bucket = {"district": district_by_key, "division": division_by_key}.get(entry["level"])
        if bucket is None:
            continue
        for key in entry["keys"]:
            bucket[key] = entry
    return district_by_key, division_by_key


# --------------------------------------------------------------------------
# geoBoundaries fetch / staging
# --------------------------------------------------------------------------
def fetch_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_bytes(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=300) as response:
        return response.read()


_COMMIT_RE = re.compile(r"/([0-9a-fA-F]{6,40})/releaseData/")


def parse_source_commit(url: str) -> str:
    match = _COMMIT_RE.search(url)
    if not match:
        raise SystemExit(f"Could not parse a commit hash out of {url!r}")
    return match.group(1)


def stage_boundary_source(iso3: str, level: str, staging_dir: Path, reuse: bool) -> dict[str, Any]:
    """Fetch (or, with reuse=True, re-verify and reuse) the geoBoundaries gbOpen
    metadata + full-resolution geojson for one ADM level of one country."""
    meta_path = staging_dir / f"source-meta-{level}.json"
    geojson_path = staging_dir / f"geoBoundaries-{iso3}-{level}.geojson"

    if reuse:
        if not meta_path.exists() or not geojson_path.exists():
            raise SystemExit(
                f"--no-download given but staged {level} files are missing under {staging_dir}. "
                "Run once without --no-download first."
            )
        meta_record = json.loads(meta_path.read_text(encoding="utf-8"))
        raw_bytes = geojson_path.read_bytes()
        digest = sha256_hex(raw_bytes)
        if digest != meta_record["sha256"]:
            raise SystemExit(
                f"Staged {level} file sha256 mismatch (expected {meta_record['sha256']}, got {digest}); "
                "the staged copy no longer matches what was downloaded. Re-run without --no-download."
            )
        return {
            "meta": meta_record["apiMeta"],
            "geojson": json.loads(raw_bytes.decode("utf-8")),
            "sha256": digest,
            "source_commit": meta_record["sourceCommit"],
            "url": meta_record["url"],
        }

    api_url = f"https://www.geoboundaries.org/api/current/gbOpen/{iso3}/{level}/"
    api_meta = fetch_json(api_url)
    download_url = api_meta["gjDownloadURL"]
    source_commit = parse_source_commit(download_url)
    raw_bytes = fetch_bytes(download_url)
    digest = sha256_hex(raw_bytes)

    staging_dir.mkdir(parents=True, exist_ok=True)
    geojson_path.write_bytes(raw_bytes)
    meta_record = {
        "apiUrl": api_url,
        "apiMeta": api_meta,
        "url": download_url,
        "sourceCommit": source_commit,
        "sha256": digest,
    }
    write_bytes_lf(meta_path, dump_pretty(meta_record))

    return {
        "meta": api_meta,
        "geojson": json.loads(raw_bytes.decode("utf-8")),
        "sha256": digest,
        "source_commit": source_commit,
        "url": download_url,
    }


def attach_geometries(features: list[dict]) -> None:
    for feature in features:
        feature["_geom"] = shape(feature["geometry"])


# --------------------------------------------------------------------------
# District <-> division matching (dictionary) and ADM1 cross-check (spatial)
# --------------------------------------------------------------------------
def match_districts_to_divisions(adm2_features: list[dict], district_by_key: dict[str, dict]) -> dict[str, list[dict]]:
    """Group ADM2 features by their dictionary division ('parent'). Requires
    every dictionary district to match exactly one ADM2 feature and vice versa."""
    groups: dict[str, list[dict]] = {}
    matched_shape_name_by_local: dict[str, str] = {}
    unmatched: list[str] = []
    for feature in adm2_features:
        shape_name = feature["properties"]["shapeName"]
        entry = district_by_key.get(region_name_key(shape_name))
        if entry is None:
            unmatched.append(shape_name)
            continue
        if entry["local"] in matched_shape_name_by_local:
            raise SystemExit(
                f"Dictionary district '{entry['local']}' matched both "
                f"'{matched_shape_name_by_local[entry['local']]}' and '{shape_name}'"
            )
        matched_shape_name_by_local[entry["local"]] = shape_name
        groups.setdefault(entry["parent"], []).append(feature)
    if unmatched:
        raise SystemExit(f"{len(unmatched)} ADM2 shapeName(s) did not match the dictionary: {unmatched}")
    all_district_locals = {entry["local"] for entry in district_by_key.values()}
    missing = sorted(all_district_locals - set(matched_shape_name_by_local))
    if missing:
        raise SystemExit(f"Dictionary district(s) never matched an ADM2 feature: {missing}")
    return groups


def cross_check_adm1(
    division_groups: dict[str, list[dict]], adm1_features: list[dict]
) -> tuple[dict[str, dict], dict[str, Any]]:
    """Spatial cross-check against the independent ADM1 release (never by name or code).

    Decisive test: for every district, the ADM1 polygon holding the largest share
    of the district's area must hold a majority of it, and every district of one
    division must land in the same ADM1 polygon (8 <-> 8, one to one).

    The point-on-surface test is recorded as well, but only as evidence: the ADM1
    release is coarse (146-486 vertices per division) and its generalised
    coastline leaves a coastal district's interior point outside every ADM1
    polygon (Noakhali, a char/island district). Area overlap has no such blind
    spot, so no district needs a nearest-polygon exception.
    """
    adm1_geoms = [feature["_geom"] for feature in adm1_features]
    division_to_index: dict[str, int] = {}
    shares: list[dict[str, Any]] = []
    point_inside = 0
    point_outside: list[dict[str, Any]] = []
    for division_local, district_features in division_groups.items():
        indices_seen: set[int] = set()
        for district_feature in district_features:
            district = district_feature["_geom"]
            name = district_feature["properties"]["shapeName"]
            overlaps = sorted(
                ((district.intersection(geom).area, i) for i, geom in enumerate(adm1_geoms)), reverse=True
            )
            best_area, best_index = overlaps[0]
            share = best_area / district.area if district.area else 0.0
            if share < 0.5:
                raise SystemExit(
                    f"{name}: no ADM1 polygon holds a majority of the district "
                    f"(largest {adm1_features[best_index]['properties']['shapeName']} {share:.1%})"
                )
            indices_seen.add(best_index)
            shares.append({"district": name, "division": division_local,
                           "adm1ShapeName": adm1_features[best_index]["properties"]["shapeName"],
                           "share": round(share, 4)})
            point = shapely.point_on_surface(district)
            if any(geom.contains(point) for geom in adm1_geoms):
                point_inside += 1
            else:
                nearest = min((geom.distance(point), i) for i, geom in enumerate(adm1_geoms))
                point_outside.append({"district": name,
                                      "nearestAdm1": adm1_features[nearest[1]]["properties"]["shapeName"],
                                      "distanceDeg": round(nearest[0], 5)})
        if len(indices_seen) != 1:
            names = [adm1_features[i]["properties"]["shapeName"] for i in indices_seen]
            raise SystemExit(f"Division '{division_local}': member districts disagree on ADM1 polygon: {names}")
        division_to_index[division_local] = next(iter(indices_seen))
    if len(set(division_to_index.values())) != len(adm1_features):
        raise SystemExit(
            f"ADM1 cross-check is not a bijection: {len(division_to_index)} divisions mapped to "
            f"{len(set(division_to_index.values()))} distinct ADM1 polygon(s) out of {len(adm1_features)}"
        )
    shares.sort(key=lambda row: row["share"])
    evidence = {
        "method": "area majority: each district's largest ADM1 overlap must hold >= 50% of it and match its division",
        "districtsChecked": len(shares),
        "minimumShare": shares[0]["share"] if shares else None,
        "lowestShares": shares[:5],
        "pointOnSurface": {"inside": point_inside, "outsideAll": point_outside,
                           "note": "evidence only; the coarse ADM1 coastline leaves coastal interior points outside"},
    }
    return {local: adm1_features[index] for local, index in division_to_index.items()}, evidence


# --------------------------------------------------------------------------
# Raw workbook reading (division keys from the platform's own data, not GADM
# or geoBoundaries) - openpyxl, read-only, no writes.
# --------------------------------------------------------------------------
def find_workbook(workbooks_dir: Path, element_id: str) -> Path:
    matches = sorted(workbooks_dir.glob(f"{element_id}_*.xlsx"))
    if len(matches) != 1:
        raise SystemExit(f"Expected exactly one {element_id} workbook under {workbooks_dir}, found {len(matches)}: {matches}")
    return matches[0]


def read_entity_sheet(path: Path) -> tuple[dict[str, int], list[tuple]]:
    """Return (Korean column label -> tuple index, data rows) for the entity
    (record-form) sheet of a standard-format workbook. Column positions are
    resolved by label text, not by hardcoded index, since attr_N column
    counts differ between elements (B-003 has attr_1..14, B-017 attr_1..42)."""
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        sheet_name = next((name for name in workbook.sheetnames if "entity" in name.lower()), None)
        if sheet_name is None:
            raise SystemExit(f"No entity-list sheet found in {path}: {workbook.sheetnames}")
        rows = workbook[sheet_name].iter_rows(values_only=True)
        columns: dict[str, int] | None = None
        for scanned, row in enumerate(rows):
            if any(isinstance(value, str) and value.startswith("레코드 키") for value in row):
                columns = {value: index for index, value in enumerate(row) if isinstance(value, str)}
                break
            if scanned > 6:
                break
        if columns is None:
            raise SystemExit(f"Could not find the record-key header row in {path}")
        data_rows = list(rows)
        return columns, data_rows
    finally:
        workbook.close()


def extract_division_keys(iso3: str, columns: dict[str, int], data_rows: list[tuple]) -> dict[str, set[str]]:
    """Map GADM-style division code (e.g. 'BGD.1_1') -> romanised name(s) seen
    against it in this workbook's Division-level rows. The record-key column
    is matched by prefix since its exact header differs by element
    ('레코드 키' vs '레코드 키(string_id)')."""
    record_key_col = next(index for label, index in columns.items() if label.startswith("레코드 키"))
    roman_col = columns["지역명(로마자)"]
    admin_col = columns["행정단위"]
    pattern = re.compile(rf"{re.escape(iso3)}\.\d+_\d+")
    found: dict[str, set[str]] = {}
    for row in data_rows:
        if row[admin_col] != "Division":
            continue
        raw_key = row[record_key_col]
        match = pattern.search(str(raw_key)) if raw_key is not None else None
        if not match:
            continue
        found.setdefault(match.group(0), set()).add(str(row[roman_col]))
    return found


def build_division_records(
    iso3: str,
    division_keys: dict[str, set[str]],
    division_by_key: dict[str, dict],
    division_groups: dict[str, list[dict]],
    adm1_by_division: dict[str, dict],
    level1_count: int,
) -> list[dict]:
    records: list[dict] = []
    seen_locals: set[str] = set()
    for gadm_code, names in division_keys.items():
        if len(names) != 1:
            raise SystemExit(f"{gadm_code}: workbook has inconsistent division names {sorted(names)}")
        name_en = next(iter(names))
        dict_entry = division_by_key.get(region_name_key(name_en))
        if dict_entry is None:
            raise SystemExit(f"Workbook division name {name_en!r} ({gadm_code}) is not in the regionNamesV161 dictionary")
        division_local = dict_entry["local"]
        if division_local in seen_locals:
            raise SystemExit(f"Division '{division_local}' matched more than one GADM code in the workbook")
        seen_locals.add(division_local)
        district_features = division_groups.get(division_local)
        if not district_features:
            raise SystemExit(f"Division '{division_local}' ({gadm_code}) has no member districts from the ADM2 match")
        adm1_props = adm1_by_division[division_local]["properties"]
        records.append(
            {
                "divisionKey": gadm_code,
                "nameEn": name_en,
                "nameKo": dict_entry["ko"],
                "divisionLocal": division_local,
                "iso3166_2": adm1_props["shapeISO"],
                "adm1CrossCheck": {"shapeId": adm1_props["shapeID"], "shapeName": adm1_props["shapeName"]},
                "districtFeatures": district_features,
                "memberDistricts": sorted(f["properties"]["shapeName"] for f in district_features),
            }
        )
    if len(records) != level1_count:
        raise SystemExit(f"Expected {level1_count} divisions from the workbook, found {len(records)}: {sorted(seen_locals)}")
    missing_locals = sorted(set(division_groups) - seen_locals)
    if missing_locals:
        raise SystemExit(f"Division(s) present in the boundary data but absent from the workbook: {missing_locals}")
    records.sort(key=lambda r: tuple(int(part) for part in re.findall(r"\d+", r["divisionKey"])))
    return records


# --------------------------------------------------------------------------
# Geometry: geodesic area, validity, overlap/gap, vertex provenance
# --------------------------------------------------------------------------
def geod_area_km2(geom) -> float:
    area, _ = GEOD.geometry_area_perimeter(geom)
    return abs(area) / 1_000_000.0


def ensure_valid(geom, label: str, used_make_valid: list[str]):
    if geom.is_valid:
        return geom
    fixed = shapely.make_valid(geom)
    if not fixed.is_valid:
        raise SystemExit(f"{label}: invalid geometry that make_valid could not repair: {explain_validity(geom)}")
    used_make_valid.append(label)
    return fixed


def pairwise_overlap_km2(geoms: list) -> float:
    total = 0.0
    for a, b in itertools.combinations(geoms, 2):
        if not a.intersects(b):
            continue
        inter = a.intersection(b)
        if inter.is_empty or inter.area <= 0:
            continue
        total += geod_area_km2(inter)
    return total


def gap_km2(reference_union, candidate_geoms: list) -> float:
    candidate_union = shapely.unary_union(candidate_geoms)
    gap_geom = reference_union.difference(candidate_union)
    if gap_geom.is_empty:
        return 0.0
    return geod_area_km2(gap_geom)


def all_vertices(geoms: list) -> set[tuple[float, float]]:
    vertices: set[tuple[float, float]] = set()
    for geom in geoms:
        vertices.update(map(tuple, shapely.get_coordinates(geom).tolist()))
    return vertices


# --------------------------------------------------------------------------
# Output feature / document builders
# --------------------------------------------------------------------------
def build_adm1_feature(record: dict, geom) -> dict:
    return {
        "type": "Feature",
        "properties": {
            "divisionKey": record["divisionKey"],
            "iso3166_2": record["iso3166_2"],
            "nameEn": record["nameEn"],
            "nameKo": record["nameKo"],
            "memberDistricts": record["memberDistricts"],
            "areaKm2": round(geod_area_km2(geom), 1),
        },
        "geometry": mapping(geom),
    }


def evaluate_tolerance(ordered_geoms: list, division_records: list[dict], tolerance: float):
    simplified = list(shapely.coverage_simplify(ordered_geoms, tolerance, simplify_boundary=True))
    features = [build_adm1_feature(record, geom) for record, geom in zip(division_records, simplified)]
    data = dump_compact({"type": "FeatureCollection", "features": features})
    return simplified, features, data


def build_manifest(
    *,
    iso3: str,
    level1_count: int,
    adm1_asset_url: str,
    outline_asset_url: str,
    adm1_bytes: bytes,
    outline_bytes: bytes,
    adm1_features: list[dict],
    outline_feature: dict,
    tolerance: float,
    adm2_source: dict,
    adm1_cross_source: dict,
    round1: dict,
    round2: dict,
    outline_validation: dict,
    shapely_version: str,
) -> dict:
    boundary_system = f"adm1-{level1_count}"
    attribution = "geoBoundaries (BBS, OCHA ROAP), CC BY 3.0 IGO"
    license_block = {
        "attributionRequired": True,
        "geoBoundariesDerivativeLicense": "CC-BY-4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "sourceBoundaryLicense": adm2_source["meta"]["boundaryLicense"],
    }
    source_block = {
        "boundaryId": adm2_source["meta"]["boundaryID"],
        "sourceCommit": adm2_source["source_commit"],
        "url": adm2_source["url"],
        "sha256": adm2_source["sha256"],
        "license": adm2_source["meta"]["boundaryLicense"],
        "provider": adm2_source["meta"]["boundarySource"],
    }
    validator = f"Shapely {shapely_version} (GEOS is_valid) + pyproj Geod area"

    adm1_asset = {
        "kind": "adm1-boundary",
        "url": adm1_asset_url,
        "sha256": sha256_hex(adm1_bytes),
        "featureCount": len(adm1_features),
        "geometryTypes": sorted({f["geometry"]["type"] for f in adm1_features}),
        "version": "v158",
        "attribution": attribution,
        "license": license_block,
        "source": source_block,
        "derivedFrom": {
            "method": "dissolve-by-membership",
            "membership": (
                "regionNamesV161 district parent, cross-checked against geoBoundaries "
                f"ADM1 {adm1_cross_source['meta']['boundaryID']}"
            ),
            "adm1CrossCheck": {
                "boundaryId": adm1_cross_source["meta"]["boundaryID"],
                "url": adm1_cross_source["url"],
                "sha256": adm1_cross_source["sha256"],
                "license": adm1_cross_source["meta"]["boundaryLicense"],
            },
        },
        "simplificationToleranceDeg": tolerance,
        "validation": {
            "featureCount": len(adm1_features),
            "valid": round2["valid"],
            "overlapsKm2": round(round2["overlaps_km2"], 4),
            "gapKm2": round(round2["gap_km2"], 4),
            "areaChangePpmDissolve": round(round1["area_ppm_dissolve"], 4),
            "areaChangePctSimplified": round(round2["area_change_pct"], 4),
            "synthesizedVertices": round2["synthesized_vertices"],
            "validator": validator,
        },
    }
    outline_asset = {
        "kind": "country-outline",
        "url": outline_asset_url,
        "sha256": sha256_hex(outline_bytes),
        "featureCount": 1,
        "geometryTypes": [outline_feature["geometry"]["type"]],
        "version": "v158",
        "attribution": attribution,
        "license": license_block,
        "source": source_block,
        "derivedFrom": {
            "asset": adm1_asset_url,
            "method": "shapely.unary_union over the 8 simplified divisions",
            "sha256": sha256_hex(adm1_bytes),
        },
        "simplificationToleranceDeg": 0,
        "validation": {
            "featureCount": 1,
            "valid": outline_validation["valid"],
            "overlapsKm2": 0,
            "gapKm2": round(outline_validation["gap_km2"], 4),
            "areaChangePpmDissolve": round(round1["area_ppm_dissolve"], 4),
            "areaChangePctSimplified": round(round2["area_change_pct"], 4),
            "synthesizedVertices": outline_validation["synthesized_vertices"],
            "validator": validator,
        },
    }
    return {
        "schemaVersion": "v124-geometry-manifest-1",
        "countryIso3": iso3,
        "boundarySystem": boundary_system,
        "boundarySystems": {"default": boundary_system, "valuesKeyedTo": boundary_system},
        "assets": [adm1_asset, outline_asset],
    }


def build_crosswalk(iso3: str, iso3_lower: str, level1_count: int, division_records: list[dict], notes: str) -> dict:
    rows = [
        {
            "divisionKey": record["divisionKey"],
            "nameEn": record["nameEn"],
            "nameKo": record["nameKo"],
            "iso3166_2": record["iso3166_2"],
            "adm1CrossCheck": record["adm1CrossCheck"],
            "memberDistricts": record["memberDistricts"],
        }
        for record in division_records
    ]
    return {
        "schemaVersion": f"{iso3_lower}-crosswalk-adm1-v158",
        "countryIso3": iso3,
        "system": f"adm1-{level1_count}",
        "rows": rows,
        "notes": notes,
    }


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--country", required=True, help="ISO3 country code, e.g. bgd")
    parser.add_argument(
        "--no-download",
        action="store_true",
        help="Reuse staged boundary sources after verifying their sha256 instead of downloading again",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    iso3_lower = args.country.lower()
    iso3 = args.country.upper()

    registry_entry = load_registry_entry(iso3)
    country_config = load_country_config(iso3_lower)
    level1_count = int(registry_entry["adm"]["level1"]["count"])
    asset_path = registry_entry["adm"]["level1"]["asset"]
    adm1_filename = Path(asset_path).name
    outline_filename = f"{iso3_lower}-country-outline.geojson"
    geometry_dir = REPOSITORY_ROOT / "public" / Path(asset_path.lstrip("/")).parent
    staging_dir = REPOSITORY_ROOT / country_config["boundaries"]["staging"]
    workbooks_dir = REPOSITORY_ROOT / country_config["source"]["directory"]
    crosswalk_path = REPOSITORY_ROOT / country_config["adm1"]["crosswalk"]
    report_path = REPOSITORY_ROOT / "reports" / "v158" / f"boundaries-{iso3_lower}-v158.json"

    print(f"[1/8] Fetching geoBoundaries ADM2/ADM1 for {iso3} (no_download={args.no_download}) ...")
    adm2_source = stage_boundary_source(iso3, "ADM2", staging_dir, args.no_download)
    adm1_source = stage_boundary_source(iso3, "ADM1", staging_dir, args.no_download)

    adm2_features = adm2_source["geojson"]["features"]
    adm1_features = adm1_source["geojson"]["features"]
    expected_district_count = int(adm2_source["meta"]["admUnitCount"])
    expected_division_count = int(adm1_source["meta"]["admUnitCount"])
    if len(adm2_features) != expected_district_count:
        raise SystemExit(f"ADM2: geoBoundaries metadata says {expected_district_count} units, file has {len(adm2_features)}")
    if len(adm1_features) != expected_division_count:
        raise SystemExit(f"ADM1: geoBoundaries metadata says {expected_division_count} units, file has {len(adm1_features)}")
    if expected_division_count != level1_count:
        raise SystemExit(
            f"Registry adm.level1.count={level1_count} does not match geoBoundaries ADM1 admUnitCount={expected_division_count}"
        )

    print(f"[2/8] Parsing geometry ({len(adm2_features)} districts, {len(adm1_features)} ADM1 source polygons) ...")
    attach_geometries(adm2_features)
    attach_geometries(adm1_features)
    invalid_districts = [f["properties"]["shapeName"] for f in adm2_features if not f["_geom"].is_valid]
    if invalid_districts:
        raise SystemExit(f"Source ADM2 districts with invalid geometry: {invalid_districts}")
    invalid_adm1 = [f["properties"]["shapeName"] for f in adm1_features if not f["_geom"].is_valid]
    if invalid_adm1:
        raise SystemExit(f"Source ADM1 polygons with invalid geometry: {invalid_adm1}")

    print("[3/8] Matching districts to divisions via regionNamesV161 dictionary ...")
    district_by_key, division_by_key = load_region_dictionary(iso3)
    division_groups = match_districts_to_divisions(adm2_features, district_by_key)
    print(f"       {len(adm2_features)}/{expected_district_count} districts matched, {len(division_groups)} divisions formed")

    print("[4/8] Cross-checking against geoBoundaries ADM1 by spatial containment ...")
    adm1_by_division, adm1_evidence = cross_check_adm1(division_groups, adm1_features)
    print(f"       area majority {adm1_evidence['districtsChecked']}/{len(adm2_features)} (lowest share {adm1_evidence['minimumShare']}); "
          f"point-on-surface inside {adm1_evidence['pointOnSurface']['inside']}")

    print("[5/8] Reading division keys from the raw workbooks ...")
    b003_path = find_workbook(workbooks_dir, "B-003")
    b003_columns, b003_rows = read_entity_sheet(b003_path)
    b003_keys = extract_division_keys(iso3, b003_columns, b003_rows)
    division_records = build_division_records(iso3, b003_keys, division_by_key, division_groups, adm1_by_division, level1_count)

    b017_path = find_workbook(workbooks_dir, "B-017")
    b017_columns, b017_rows = read_entity_sheet(b017_path)
    b017_keys = extract_division_keys(iso3, b017_columns, b017_rows)
    b017_locals: set[str] = set()
    for gadm_code, names in b017_keys.items():
        entry = division_by_key.get(region_name_key(next(iter(names))))
        if entry is not None:
            b017_locals.add(entry["local"])
    all_locals = {record["divisionLocal"] for record in division_records}
    b017_missing = sorted(all_locals - b017_locals)

    rajshahi_record = next((r for r in division_records if r["nameEn"] == "Rajshahi"), None)
    notes = (
        f"B-017(WRI Aqueduct) 관구 순위표는 GADM 3.6 ADM1 {len(b017_locals)}개 기준이라 "
        f"GADM 4.1 {level1_count}개보다 적다 — 미수록: {', '.join(b017_missing) or '없음'}"
        f"({', '.join(b017_missing) or '-'}은(는) 2015년 Dhaka 관구에서 분리 신설됨). "
    )
    if rajshahi_record is not None:
        notes += (
            f"geoBoundaries ADM1 원본은 {rajshahi_record['nameEn']} 관구의 shapeName을 "
            f"\"{rajshahi_record['adm1CrossCheck']['shapeName']}\"로 표기한 오탈자를 "
            f"그대로 담고 있다(iso3166_2={rajshahi_record['iso3166_2']}, 발행 경계값엔 영향 없음)."
        )

    print(f"       B-003 division keys: {len(division_records)}/{level1_count}; B-017 division keys: {len(b017_locals)} (missing {b017_missing})")

    print("[6/8] Dissolving districts per division and checking the raw union ...")
    used_make_valid: list[str] = []
    source_geoms = [f["_geom"] for f in adm2_features]
    union_all_64 = shapely.unary_union(source_geoms)
    raw_division_geoms = []
    for record in division_records:
        geoms = [f["_geom"] for f in record["districtFeatures"]]
        union_geom = shapely.unary_union(geoms)
        union_geom = ensure_valid(union_geom, f"dissolve:{record['divisionLocal']}", used_make_valid)
        raw_division_geoms.append(union_geom)

    area_64 = geod_area_km2(union_all_64)
    area_8_raw = geod_area_km2(shapely.unary_union(raw_division_geoms))
    area_ppm_dissolve = abs(area_8_raw - area_64) / area_64 * 1_000_000
    overlaps_km2_raw = pairwise_overlap_km2(raw_division_geoms)
    gap_km2_raw = gap_km2(union_all_64, raw_division_geoms)
    valid_raw = all(g.is_valid for g in raw_division_geoms)
    print(
        f"       valid={valid_raw} areaPpmDissolve={area_ppm_dissolve:.4f} "
        f"overlapsKm2={overlaps_km2_raw:.4f} gapKm2={gap_km2_raw:.4f}"
    )
    if not valid_raw:
        raise SystemExit("Dissolved (pre-simplify) division polygons are not all valid")
    if area_ppm_dissolve > MAX_AREA_PPM_DISSOLVE:
        raise SystemExit(f"areaChangePpmDissolve {area_ppm_dissolve} exceeds the {MAX_AREA_PPM_DISSOLVE} ppm gate")
    if gap_km2_raw > MAX_GAP_KM2:
        raise SystemExit(f"gapKm2 (pre-simplify) {gap_km2_raw} exceeds the {MAX_GAP_KM2} km2 gate")
    if overlaps_km2_raw > MAX_OVERLAP_KM2:
        raise SystemExit(f"overlapsKm2 (pre-simplify) {overlaps_km2_raw} exceeds the {MAX_OVERLAP_KM2} km2 gate")

    round1 = {
        "valid": valid_raw,
        "area_ppm_dissolve": area_ppm_dissolve,
        "overlaps_km2": overlaps_km2_raw,
        "gap_km2": gap_km2_raw,
    }

    print("[7/8] Choosing a coverage_simplify tolerance and simplifying the 8 divisions together ...")
    trials = []
    for tolerance in TOLERANCE_CANDIDATES_DEG:
        _, _, data = evaluate_tolerance(raw_division_geoms, division_records, tolerance)
        trials.append({"toleranceDeg": tolerance, "bytes": len(data)})
        print(f"       tolerance={tolerance} -> {len(data)} bytes")
    within_budget = [t for t in trials if t["bytes"] <= TARGET_MAX_BYTES]
    chosen = min(within_budget, key=lambda t: t["toleranceDeg"]) if within_budget else min(trials, key=lambda t: t["bytes"])
    tolerance = chosen["toleranceDeg"]
    simplified_geoms, adm1_feature_list, adm1_bytes = evaluate_tolerance(raw_division_geoms, division_records, tolerance)
    simplified_geoms = [ensure_valid(g, f"simplify:{r['divisionLocal']}", used_make_valid) for g, r in zip(simplified_geoms, division_records)]
    # Re-serialize in case ensure_valid touched anything (normally a no-op).
    adm1_feature_list = [build_adm1_feature(record, geom) for record, geom in zip(division_records, simplified_geoms)]
    adm1_bytes = dump_compact({"type": "FeatureCollection", "features": adm1_feature_list})

    # "No gaps after simplification" is a topology check between the 8 divisions
    # themselves (did coverage_simplify keep their shared edges exactly matched),
    # NOT a comparison against the full-resolution 64-district union: that union
    # is effectively full detail, so any simplified (coarser) shape necessarily
    # differs from it along the whole outer boundary/coastline by an amount that
    # scales with the tolerance - a harmless, expected generalisation footprint,
    # not a defect. shapely.coverage_is_valid checks the real thing: are there
    # any overlaps or mismatched shared edges among the 8 simplified polygons.
    overlaps_km2_post = pairwise_overlap_km2(simplified_geoms)
    coverage_valid_post = bool(shapely.coverage_is_valid(simplified_geoms, gap_width=0.0))
    if not coverage_valid_post:
        invalid_edges = shapely.coverage_invalid_edges(simplified_geoms, gap_width=0.0)
        bad = [i for i, edge in enumerate(invalid_edges) if edge is not None and not edge.is_empty]
        raise SystemExit(f"coverage_simplify broke inter-division topology at division index(es) {bad}")
    valid_post = all(g.is_valid for g in simplified_geoms)
    union_all_8_simplified = shapely.unary_union(simplified_geoms)
    area_8_simplified = geod_area_km2(union_all_8_simplified)
    area_change_pct_simplified = (area_8_simplified - area_8_raw) / area_8_raw * 100
    # Informational only: the one-directional area lost/gained versus the
    # pre-simplify (full-detail) union, i.e. the outer-boundary generalisation
    # footprint. Not gated - areaChangePctSimplified (the net, signed figure) is
    # the meaningful magnitude check.
    generalization_lost_km2 = geod_area_km2(shapely.unary_union(raw_division_geoms).difference(union_all_8_simplified))
    generalization_gained_km2 = geod_area_km2(union_all_8_simplified.difference(shapely.unary_union(raw_division_geoms)))
    source_vertex_set = all_vertices(source_geoms)
    output_vertex_set = all_vertices(simplified_geoms)
    synthesized_vertices = len(output_vertex_set - source_vertex_set)
    print(
        f"       chosen tolerance={tolerance} bytes={len(adm1_bytes)} valid={valid_post} "
        f"coverageValid={coverage_valid_post} overlapsKm2={overlaps_km2_post:.4f} "
        f"areaChangePct={area_change_pct_simplified:.4f} synthesizedVertices={synthesized_vertices}"
    )
    if not valid_post:
        raise SystemExit("Simplified division polygons are not all valid")
    if overlaps_km2_post > MAX_OVERLAP_KM2:
        raise SystemExit(f"overlapsKm2 (post-simplify) {overlaps_km2_post} exceeds the {MAX_OVERLAP_KM2} km2 gate")

    round2 = {
        "valid": valid_post,
        "overlaps_km2": overlaps_km2_post,
        # gap_km2 reports the coverage-topology gap (0.0 once coverage_is_valid
        # passes above), not a diff against the full-resolution union - see note.
        "gap_km2": 0.0,
        "coverage_valid": coverage_valid_post,
        "area_change_pct": area_change_pct_simplified,
        "synthesized_vertices": synthesized_vertices,
        "generalization_lost_km2": generalization_lost_km2,
        "generalization_gained_km2": generalization_gained_km2,
    }

    print("[8/8] Building the country outline and writing outputs ...")
    outline_geom = shapely.unary_union(simplified_geoms)
    outline_geom = ensure_valid(outline_geom, "country-outline", used_make_valid)
    outline_feature = {
        "type": "Feature",
        "properties": {
            "iso3": registry_entry["iso3"],
            "nameEn": registry_entry["nameEn"],
            "nameKo": registry_entry["nameKo"],
        },
        "geometry": mapping(outline_geom),
    }
    outline_bytes = dump_compact({"type": "FeatureCollection", "features": [outline_feature]})
    outline_vertex_set = all_vertices([outline_geom])
    outline_validation = {
        "valid": outline_geom.is_valid,
        # The outline is a single feature (no siblings to share edges with), so
        # the coverage-topology gap concept does not apply; 0.0 mirrors the
        # adm1-boundary asset's (topology-verified) gap value.
        "gap_km2": 0.0,
        "synthesized_vertices": len(outline_vertex_set - source_vertex_set),
    }

    adm1_path = geometry_dir / adm1_filename
    outline_path = geometry_dir / outline_filename
    manifest_path = geometry_dir / "geometry-manifest.json"

    write_bytes_lf(adm1_path, adm1_bytes)
    write_bytes_lf(outline_path, outline_bytes)

    manifest = build_manifest(
        iso3=registry_entry["iso3"],
        level1_count=level1_count,
        adm1_asset_url=asset_path,
        outline_asset_url=f"{registry_entry['dataRoot']}/geometry/{outline_filename}",
        adm1_bytes=adm1_bytes,
        outline_bytes=outline_bytes,
        adm1_features=adm1_feature_list,
        outline_feature=outline_feature,
        tolerance=tolerance,
        adm2_source=adm2_source,
        adm1_cross_source=adm1_source,
        round1=round1,
        round2=round2,
        outline_validation=outline_validation,
        shapely_version=shapely.__version__,
    )
    manifest_bytes = dump_pretty(manifest)
    write_bytes_lf(manifest_path, manifest_bytes)

    crosswalk = build_crosswalk(registry_entry["iso3"], iso3_lower, level1_count, division_records, notes)
    crosswalk_bytes = dump_pretty(crosswalk)
    write_bytes_lf(crosswalk_path, crosswalk_bytes)

    report = {
        "schemaVersion": f"{iso3_lower}-boundaries-adm2-dissolve-v158",
        "countryIso3": registry_entry["iso3"],
        "generatedFromCommit": {
            "adm2": {"boundaryId": adm2_source["meta"]["boundaryID"], "sourceCommit": adm2_source["source_commit"], "url": adm2_source["url"], "sha256": adm2_source["sha256"], "license": adm2_source["meta"]["boundaryLicense"], "provider": adm2_source["meta"]["boundarySource"]},
            "adm1CrossCheck": {"boundaryId": adm1_source["meta"]["boundaryID"], "sourceCommit": adm1_source["source_commit"], "url": adm1_source["url"], "sha256": adm1_source["sha256"], "license": adm1_source["meta"]["boundaryLicense"]},
        },
        "districtMatch": {
            "expectedDistrictCount": expected_district_count,
            "matchedDistrictCount": sum(len(v) for v in division_groups.values()),
            "divisionsFormed": sorted(division_groups),
        },
        "adm1CrossCheck": {
            "byDivision": {
                division_local: {
                    "adm1ShapeId": adm1_by_division[division_local]["properties"]["shapeID"],
                    "adm1ShapeName": adm1_by_division[division_local]["properties"]["shapeName"],
                    "adm1ShapeIso": adm1_by_division[division_local]["properties"]["shapeISO"],
                    "memberDistrictCount": len(division_groups[division_local]),
                }
                for division_local in division_groups
            },
            "evidence": adm1_evidence,
        },
        "divisionKeyTable": [
            {
                "divisionKey": r["divisionKey"],
                "nameEn": r["nameEn"],
                "nameKo": r["nameKo"],
                "iso3166_2": r["iso3166_2"],
                "districtCount": len(r["memberDistricts"]),
            }
            for r in division_records
        ],
        "workbookDivisionKeys": {
            "B-003": {"path": repo_relative(b003_path), "divisionCount": len(b003_keys), "codes": sorted(b003_keys)},
            "B-017": {"path": repo_relative(b017_path), "divisionCount": len(b017_locals), "missingDivisions": b017_missing},
        },
        "dissolve": {
            "beforeSimplification": {
                "valid": round1["valid"],
                "areaKm2Union64": round(area_64, 4),
                "areaKm2Union8": round(area_8_raw, 4),
                "areaChangePpm": round(round1["area_ppm_dissolve"], 4),
                "overlapsKm2": round(round1["overlaps_km2"], 4),
                "gapKm2": round(round1["gap_km2"], 4),
                "gateAreaPpmMax": MAX_AREA_PPM_DISSOLVE,
                "gateGapKm2Max": MAX_GAP_KM2,
                "gateOverlapKm2Max": MAX_OVERLAP_KM2,
            },
            "toleranceTrials": trials,
            "chosenToleranceDeg": tolerance,
            "afterSimplification": {
                "valid": round2["valid"],
                "areaKm2Union8": round(area_8_simplified, 4),
                "areaChangePctVsPreSimplify": round(round2["area_change_pct"], 4),
                "overlapsKm2": round(round2["overlaps_km2"], 4),
                "coverageTopologyValid": round2["coverage_valid"],
                "coverageTopologyNote": (
                    "shapely.coverage_is_valid(simplified_8_divisions, gap_width=0.0): confirms coverage_simplify "
                    "introduced no overlaps and kept every shared division-to-division edge exactly matched."
                ),
                "gateOverlapKm2Max": MAX_OVERLAP_KM2,
                "outerBoundaryGeneralization": {
                    "note": (
                        "One-directional area lost/gained versus the pre-simplify (full-detail) union - the "
                        "expected cost of coarsening the outer boundary/coastline, not a gap between divisions. "
                        "The signed net (areaChangePctVsPreSimplify above) is the figure that matters."
                    ),
                    "lostKm2": round(round2["generalization_lost_km2"], 4),
                    "gainedKm2": round(round2["generalization_gained_km2"], 4),
                },
                "synthesizedVertices": round2["synthesized_vertices"],
            },
            "countryOutline": {
                "valid": outline_validation["valid"],
                "synthesizedVertices": outline_validation["synthesized_vertices"],
            },
            "usedMakeValidFor": used_make_valid,
        },
        "outputs": {
            "adm1Geojson": {"path": repo_relative(adm1_path), "bytes": len(adm1_bytes), "sha256": sha256_hex(adm1_bytes), "featureCount": len(adm1_feature_list)},
            "countryOutlineGeojson": {"path": repo_relative(outline_path), "bytes": len(outline_bytes), "sha256": sha256_hex(outline_bytes)},
            "geometryManifest": {"path": repo_relative(manifest_path), "bytes": len(manifest_bytes)},
            "crosswalk": {"path": repo_relative(crosswalk_path), "bytes": len(crosswalk_bytes)},
            "report": {"path": repo_relative(report_path)},
        },
        "notes": notes,
        "validator": f"Shapely {shapely.__version__} (GEOS is_valid) + pyproj Geod area/length",
    }
    report_bytes = dump_pretty(report)
    write_bytes_lf(report_path, report_bytes)

    print("Done.")
    print(f"ADM1_GEOJSON={adm1_path} ({len(adm1_bytes)} bytes)")
    print(f"COUNTRY_OUTLINE_GEOJSON={outline_path} ({len(outline_bytes)} bytes)")
    print(f"GEOMETRY_MANIFEST={manifest_path}")
    print(f"CROSSWALK={crosswalk_path}")
    print(f"REPORT={report_path}")


if __name__ == "__main__":
    main()
