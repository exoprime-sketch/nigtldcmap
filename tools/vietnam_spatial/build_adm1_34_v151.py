"""Build the 2025-07-01 Viet Nam ADM1 34-unit boundary asset (V151).

Resolution 202/2025/QH15 merged the previous 63 provinces and centrally-run
cities into 34 units on 2025-07-01. The reform only merges whole provinces: no
province was split, so every 34-unit boundary is the exact topological union of
its member boundaries in the published 63-unit asset.

This builder therefore synthesizes no coordinates. It reads the committed
63-unit asset, groups its features by the `crosswalk34` membership table in
`reports/v138/map-targets-build-v138.json`, dissolves each group with
Shapely's `unary_union`, and records provenance for every output vertex so a
reviewer can confirm that nothing was invented.

Run:

    python -m pip install shapely pyproj
    python tools/vietnam_spatial/build_adm1_34_v151.py
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Iterable

from pyproj import Geod
from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from shapely.validation import explain_validity


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GEOMETRY_DIR = REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2" / "geometry"
DEFAULT_CROSSWALK_PATH = REPOSITORY_ROOT / "reports" / "v138" / "map-targets-build-v138.json"

SOURCE_ASSET_NAME = "vnm-adm1-63.geojson"
OUTPUT_ASSET_NAME = "vnm-adm1-34.geojson"
MANIFEST_NAME = "geometry-manifest.json"

BOUNDARY_SYSTEM = "post-2025-34"
SOURCE_BOUNDARY_SYSTEM = "pre-2025-63"
EFFECTIVE_DATE = "2025-07-01"
LEGAL_BASIS = "Nghị quyết 202/2025/QH15"

EXPECTED_SOURCE_FEATURE_COUNT = 63
EXPECTED_OUTPUT_FEATURE_COUNT = 34

# The reform keeps one member province's name for the merged unit, so the
# successor is found by matching names. Thua Thien Hue was renamed to Hue in the
# same resolution and is the one unit whose name matches no member name.
SUCCESSOR_NAME_OVERRIDES = {"hue": "VN-26"}

# Area is only compared, never published as a statistic, so an equal-area
# geodesic measure on the WGS84 ellipsoid is enough.
GEOD = Geod(ellps="WGS84")

# A dissolve is lossless when the union area equals the summed member area.
# Slivers and overlaps in the source would show up here; 1 ppm of the national
# area is far below the source asset's own simplification tolerance.
AREA_TOLERANCE_PPM = 1.0

# A gap the source leaves between two neighbouring provinces stays open. Above
# this size it is no longer a digitizing sliver and the crosswalk itself is
# suspect, so the build stops instead of publishing a hole in a province.
MAX_SOURCE_GAP_KM2 = 5.0


def normalize_text(value: str) -> str:
    """Return the deterministic name key used by map-data joins."""

    value = unicodedata.normalize("NFC", value).strip().replace("Đ", "D").replace("đ", "d")
    value = "".join(
        character
        for character in unicodedata.normalize("NFD", value)
        if unicodedata.category(character) != "Mn"
    )
    value = unicodedata.normalize("NFC", value).casefold()
    return " ".join(re.findall(r"[a-z0-9]+", value))


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _geodesic_area_m2(geometry: Any) -> float:
    polygons = geometry.geoms if geometry.geom_type == "MultiPolygon" else [geometry]
    total = 0.0
    for polygon in polygons:
        outer, _ = GEOD.geometry_area_perimeter(polygon.exterior)
        total += abs(outer)
        for interior in polygon.interiors:
            inner, _ = GEOD.geometry_area_perimeter(interior)
            total -= abs(inner)
    return total


def _vertices(geometry: dict[str, Any]) -> Iterable[tuple[float, float]]:
    parts = (
        [geometry["coordinates"]]
        if geometry["type"] == "Polygon"
        else geometry["coordinates"]
    )
    for polygon in parts:
        for ring in polygon:
            for point in ring:
                yield (float(point[0]), float(point[1]))


def _ring_and_hole_counts(geometry: Any) -> tuple[int, int]:
    polygons = geometry.geoms if geometry.geom_type == "MultiPolygon" else [geometry]
    return len(list(polygons)), sum(len(polygon.interiors) for polygon in polygons)


def _interior_hole_areas_km2(geometry: Any) -> list[float]:
    """Gaps the source asset leaves between neighbouring provinces.

    A merged unit inherits them as interior rings. They are left open on
    purpose: closing one would publish a boundary segment that no source
    asset contains.
    """

    polygons = geometry.geoms if geometry.geom_type == "MultiPolygon" else [geometry]
    areas: list[float] = []
    for polygon in polygons:
        for interior in polygon.interiors:
            area, _ = GEOD.geometry_area_perimeter(interior)
            areas.append(abs(area) / 1_000_000)
    return areas


def _successor_code(region: str, members: list[dict[str, Any]]) -> str:
    key = normalize_text(region)
    override = SUCCESSOR_NAME_OVERRIDES.get(key)
    if override:
        codes = {member["adm1Code"] for member in members}
        if override not in codes:
            raise ValueError(f"Successor override {override} is not a member of {region}")
        return override
    for member in members:
        if normalize_text(member["name"]) == key:
            return str(member["adm1Code"])
    if len(members) == 1:
        return str(members[0]["adm1Code"])
    raise ValueError(f"No successor province found for the 34-unit {region!r}")


def build(geometry_dir: Path, crosswalk_path: Path) -> dict[str, Any]:
    source_path = geometry_dir / SOURCE_ASSET_NAME
    source = _read_json(source_path)
    source_features = source["features"]
    if len(source_features) != EXPECTED_SOURCE_FEATURE_COUNT:
        raise ValueError(
            f"{SOURCE_ASSET_NAME} holds {len(source_features)} features, "
            f"expected {EXPECTED_SOURCE_FEATURE_COUNT}"
        )

    by_code: dict[str, dict[str, Any]] = {}
    for feature in source_features:
        code = str(feature["properties"]["adm1Code"])
        if code in by_code:
            raise ValueError(f"Duplicate ADM1 code in the source asset: {code}")
        by_code[code] = feature

    crosswalk = _read_json(crosswalk_path)["crosswalk34"]
    if len(crosswalk) != EXPECTED_OUTPUT_FEATURE_COUNT:
        raise ValueError(
            f"crosswalk34 holds {len(crosswalk)} groups, expected "
            f"{EXPECTED_OUTPUT_FEATURE_COUNT}"
        )

    assigned: dict[str, str] = {}
    for group in crosswalk:
        for code in group["memberAdm1Codes"]:
            if code not in by_code:
                raise ValueError(f"crosswalk34 names {code}, which the boundary asset lacks")
            if code in assigned:
                raise ValueError(f"{code} belongs to both {assigned[code]} and {group['region']}")
            assigned[code] = group["region"]
    missing = sorted(set(by_code) - set(assigned))
    if missing:
        raise ValueError(f"crosswalk34 leaves these provinces unassigned: {missing}")

    source_vertices = {
        vertex
        for feature in source_features
        for vertex in _vertices(feature["geometry"])
    }

    features: list[dict[str, Any]] = []
    validation: dict[str, Any] = {
        "areaDeltaPpmMax": 0.0,
        "dissolvedInteriorHoleCount": 0,
        "invalidGeometryCount": 0,
        "mergedUnitCount": 0,
        "multiPolygonCount": 0,
        "polygonCount": 0,
        "sourceGapsLeftOpen": [],
        "syntheticVertexCount": 0,
    }

    for group in sorted(crosswalk, key=lambda item: str(item["key"])):
        region = str(group["region"])
        member_codes = sorted(str(code) for code in group["memberAdm1Codes"])
        members = [
            {
                "adm1Code": code,
                "name": str(by_code[code]["properties"]["name"]),
                "geometry": shape(by_code[code]["geometry"]),
            }
            for code in member_codes
        ]
        for member in members:
            if not member["geometry"].is_valid:
                raise ValueError(
                    f"Invalid source geometry for {member['adm1Code']}: "
                    f"{explain_validity(member['geometry'])}"
                )

        dissolved = unary_union([member["geometry"] for member in members])
        if dissolved.is_empty or dissolved.geom_type not in {"Polygon", "MultiPolygon"}:
            raise ValueError(f"Dissolve produced {dissolved.geom_type} for {region}")
        if not dissolved.is_valid:
            validation["invalidGeometryCount"] += 1
            raise ValueError(f"Invalid dissolve for {region}: {explain_validity(dissolved)}")

        member_area = sum(_geodesic_area_m2(member["geometry"]) for member in members)
        dissolved_area = _geodesic_area_m2(dissolved)
        delta_ppm = abs(dissolved_area - member_area) / member_area * 1_000_000
        if delta_ppm > AREA_TOLERANCE_PPM:
            raise ValueError(
                f"{region}: dissolve changed the area by {delta_ppm:.3f} ppm, "
                f"over the {AREA_TOLERANCE_PPM} ppm tolerance"
            )
        validation["areaDeltaPpmMax"] = max(validation["areaDeltaPpmMax"], delta_ppm)

        geometry = mapping(dissolved)
        # Every published vertex has to come from the source asset; a dissolve
        # that had to cut an overlap would introduce one that does not.
        synthetic = [
            vertex for vertex in _vertices(geometry) if vertex not in source_vertices
        ]
        validation["syntheticVertexCount"] += len(synthetic)

        polygon_count, hole_count = _ring_and_hole_counts(dissolved)
        validation["dissolvedInteriorHoleCount"] += hole_count
        for hole_km2 in _interior_hole_areas_km2(dissolved):
            validation["sourceGapsLeftOpen"].append(
                {
                    "areaKm2": round(hole_km2, 4),
                    "memberAdm1Codes": member_codes,
                    "region": region,
                }
            )
        if geometry["type"] == "MultiPolygon":
            validation["multiPolygonCount"] += 1
        else:
            validation["polygonCount"] += 1
        if len(members) > 1:
            validation["mergedUnitCount"] += 1

        successor = _successor_code(region, members)
        features.append(
            {
                "geometry": geometry,
                "properties": {
                    "boundarySystem": BOUNDARY_SYSTEM,
                    "effectiveDate": EFFECTIVE_DATE,
                    "legalBasis": LEGAL_BASIS,
                    "memberAdm1Codes": member_codes,
                    "memberNames": [member["name"] for member in members],
                    "name": region,
                    "normalizedName": normalize_text(region),
                    "partCount": polygon_count,
                    "successorAdm1Code": successor,
                    # Deliberately NOT `adm1Code`: a 34-unit polygon must never
                    # pick up a value keyed to the 63-unit system by accident.
                    "unitCode": f"VN34-{successor.removeprefix('VN-')}",
                },
                "type": "Feature",
            }
        )

    if len(features) != EXPECTED_OUTPUT_FEATURE_COUNT:
        raise ValueError(f"Built {len(features)} units, expected {EXPECTED_OUTPUT_FEATURE_COUNT}")
    if validation["syntheticVertexCount"]:
        raise ValueError(
            f"{validation['syntheticVertexCount']} published vertices are absent from "
            f"{SOURCE_ASSET_NAME}; the dissolve would be inventing a boundary"
        )
    oversized = [
        gap for gap in validation["sourceGapsLeftOpen"] if gap["areaKm2"] > MAX_SOURCE_GAP_KM2
    ]
    if oversized:
        raise ValueError(
            f"Source gaps larger than {MAX_SOURCE_GAP_KM2} km² survived the dissolve, "
            f"which points at a crosswalk error rather than a digitizing sliver: {oversized}"
        )
    unit_codes = [feature["properties"]["unitCode"] for feature in features]
    if len(set(unit_codes)) != len(unit_codes):
        raise ValueError("Duplicate unitCode in the 34-unit asset")

    output = {
        "features": features,
        "metadata": {
            "boundarySystem": BOUNDARY_SYSTEM,
            "countryIso3": "VNM",
            "crosswalkSource": "reports/v138/map-targets-build-v138.json#crosswalk34",
            "derivation": (
                "Topological union (Shapely unary_union) of the member polygons in "
                f"{SOURCE_ASSET_NAME}. No coordinate is synthesized; every published "
                "vertex is present in the source asset."
            ),
            "effectiveDate": EFFECTIVE_DATE,
            "legalBasis": LEGAL_BASIS,
            "sourceAsset": SOURCE_ASSET_NAME,
            "sourceBoundarySystem": SOURCE_BOUNDARY_SYSTEM,
            "sourceSha256": _sha256(source_path),
        },
        "name": "vnm-adm1-34",
        "type": "FeatureCollection",
    }

    output_path = geometry_dir / OUTPUT_ASSET_NAME
    _write_json(output_path, output)

    validation["areaDeltaPpmMax"] = round(validation["areaDeltaPpmMax"], 6)
    validation["featureCount"] = len(features)
    validation["memberCoverageCount"] = len(assigned)
    validation["sourceFeatureCount"] = len(source_features)
    _update_manifest(geometry_dir, output_path, source_path, validation)
    return validation


def _update_manifest(
    geometry_dir: Path,
    output_path: Path,
    source_path: Path,
    validation: dict[str, Any],
) -> None:
    manifest_path = geometry_dir / MANIFEST_NAME
    manifest = _read_json(manifest_path)
    entry = {
        "attribution": (
            "geoBoundaries (William & Mary geoLab), VNM ADM1, boundary year 2008, build "
            "2023-12-12; Runfola et al. (2020), PLOS ONE 15(4): e0231866. 2025-07-01 "
            f"34-unit grouping derived under {LEGAL_BASIS}."
        ),
        "derivedFrom": {
            "asset": f"/data/vietnam/v2/geometry/{SOURCE_ASSET_NAME}",
            "method": "shapely.ops.unary_union over crosswalk34 memberAdm1Codes",
            "sha256": _sha256(source_path),
        },
        "effectiveDate": EFFECTIVE_DATE,
        "featureCount": validation["featureCount"],
        "geometryTypes": ["Polygon", "MultiPolygon"],
        "kind": "adm1-boundary-34",
        "legalBasis": LEGAL_BASIS,
        "license": {
            "attributionRequired": True,
            "geoBoundariesDerivativeLicense": "CC-BY-4.0",
            "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
            "sourceBoundaryLicense": "Public Domain",
        },
        "sha256": _sha256(output_path),
        "url": f"/data/vietnam/v2/geometry/{OUTPUT_ASSET_NAME}",
        "validation": {
            **{key: value for key, value in sorted(validation.items())},
            "geometryValidity": "pass",
            "validator": "Shapely 2.1.2 (GEOS is_valid) + pyproj Geod area",
        },
        "sourceGapNotice": (
            "원천 경계가 이웃 성 사이에 남긴 틈은 합쳐진 단위 안에서 구멍으로 남깁니다. "
            "메우면 원천에 없는 경계선을 새로 그리는 것이므로 메우지 않습니다."
        ),
        "valuesAreAggregated": False,
        "valuesNotice": (
            "경계 전용 자산입니다. 원자료 값은 개편 전 63개 성·시 기준 그대로 두며 "
            "34개 단위로 합산·평균하지 않습니다."
        ),
        "version": EFFECTIVE_DATE,
    }
    assets = [item for item in manifest["assets"] if item.get("kind") != "adm1-boundary-34"]
    assets.append(entry)
    manifest["assets"] = sorted(assets, key=lambda item: str(item.get("url", "")))
    manifest["boundarySystems"] = {
        "default": BOUNDARY_SYSTEM,
        "legacy": SOURCE_BOUNDARY_SYSTEM,
        "valuesKeyedTo": SOURCE_BOUNDARY_SYSTEM,
    }
    _write_json(manifest_path, manifest)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--geometry-dir", type=Path, default=DEFAULT_GEOMETRY_DIR)
    parser.add_argument("--crosswalk", type=Path, default=DEFAULT_CROSSWALK_PATH)
    args = parser.parse_args()
    validation = build(args.geometry_dir, args.crosswalk)
    print(json.dumps({"status": "PASS", "asset": OUTPUT_ASSET_NAME, **validation}, ensure_ascii=False))


if __name__ == "__main__":
    main()
