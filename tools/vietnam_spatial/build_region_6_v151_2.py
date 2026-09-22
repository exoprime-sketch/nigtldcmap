"""Build the Global Data Lab six-region dissolve of Viet Nam's 63 ADM1 units.

B-021 (Global Data Lab's Vulnerability Index products) reports values at the
GDL "six region" grouping rather than at province level. The grouping is a
province membership table, not a set of digitized boundaries, so this builder
synthesizes no coordinates: it reads the committed 63-unit ADM1 asset, groups
its features by the `regionMappings` table in
`public/data/vietnam/v2/spatial/layers/b-021.json`, dissolves each group with
Shapely's `unary_union` (reusing the same guarded helpers as the 34-unit ADM1
builder), and records provenance for every output vertex so a reviewer can
confirm that nothing was invented.

Run:

    python -m pip install shapely pyproj
    python tools/vietnam_spatial/build_region_6_v151_2.py
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# Allow `python tools/vietnam_spatial/build_region_6_v151_2.py` to resolve the
# `tools.*` package import below even though only this file's own directory is
# put on sys.path automatically for a direct script invocation.
_REPOSITORY_ROOT_FOR_IMPORT = Path(__file__).resolve().parents[2]
if str(_REPOSITORY_ROOT_FOR_IMPORT) not in sys.path:
    sys.path.insert(0, str(_REPOSITORY_ROOT_FOR_IMPORT))

from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from shapely.validation import explain_validity

from tools.vietnam_spatial.build_adm1_34_v151 import (
    AREA_TOLERANCE_PPM,
    MAX_SOURCE_GAP_KM2,
    _geodesic_area_m2,
    _interior_hole_areas_km2,
    _read_json,
    _ring_and_hole_counts,
    _sha256,
    _vertices,
    _write_json,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GEOMETRY_DIR = REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2" / "geometry"
DEFAULT_LAYER_PATH = (
    REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2" / "spatial" / "layers" / "b-021.json"
)

SOURCE_ASSET_NAME = "vnm-adm1-63.geojson"
OUTPUT_ASSET_NAME = "vnm-region-6.geojson"
MANIFEST_NAME = "geometry-manifest.json"

REGION_SYSTEM = "gdl-six-region"
MEMBERSHIP_SOURCE = "spatial/layers/b-021.json#regionMappings"

EXPECTED_SOURCE_FEATURE_COUNT = 63
EXPECTED_REGION_COUNT = 6

# Korean labels for the six GDL regions, as published in B-021's regionMappings.
REGION_NAME_KO = {
    "Central Highlands": "중부고원",
    "Mekong River Delta": "메콩강 삼각주",
    "North Central Coast and South Central Coast": "북중부·남중부 해안",
    "North East, North West": "동북부·서북부",
    "Red River Delta": "홍강 삼각주",
    "South East": "동남부",
}


def build(geometry_dir: Path, layer_path: Path) -> dict[str, Any]:
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

    layer = _read_json(layer_path)
    region_mappings = layer["regionMappings"]
    if len(region_mappings) != EXPECTED_REGION_COUNT:
        raise ValueError(
            f"regionMappings holds {len(region_mappings)} regions, expected "
            f"{EXPECTED_REGION_COUNT}"
        )

    assigned: dict[str, str] = {}
    for row in region_mappings:
        region = str(row["region"])
        for code in row["provinceCodes"]:
            code = str(code)
            if code not in by_code:
                raise ValueError(f"regionMappings names {code}, which the boundary asset lacks")
            if code in assigned:
                raise ValueError(f"{code} belongs to both {assigned[code]} and {region}")
            assigned[code] = region
    missing = sorted(set(by_code) - set(assigned))
    if missing:
        raise ValueError(f"regionMappings leaves these provinces unassigned: {missing}")
    if len(assigned) != EXPECTED_SOURCE_FEATURE_COUNT:
        raise ValueError(
            f"regionMappings assigns {len(assigned)} provinces, expected "
            f"{EXPECTED_SOURCE_FEATURE_COUNT} with no duplicates"
        )

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
        "memberCoverageCount": 0,
        "multiPolygonCount": 0,
        "polygonCount": 0,
        "regionCount": 0,
        "sourceGapsLeftOpen": [],
        "syntheticVertexCount": 0,
    }

    for row in sorted(region_mappings, key=lambda item: str(item["region"])):
        region = str(row["region"])
        if region not in REGION_NAME_KO:
            raise ValueError(f"No Korean name mapped for GDL region {region!r}")
        member_codes = sorted(str(code) for code in row["provinceCodes"])
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
        validation["memberCoverageCount"] += len(members)

        features.append(
            {
                "geometry": geometry,
                "properties": {
                    "areaKm2": round(dissolved_area / 1_000_000, 3),
                    "memberAdm1Codes": member_codes,
                    "memberNames": [member["name"] for member in members],
                    "name": region,
                    "nameKo": REGION_NAME_KO[region],
                    "partCount": polygon_count,
                    # Deliberately NOT `adm1Code`/`unitCode`: a region-6 polygon
                    # must never pick up a value keyed to a province-level system.
                    "regionKey": region,
                    "regionSystem": REGION_SYSTEM,
                },
                "type": "Feature",
            }
        )

    if len(features) != EXPECTED_REGION_COUNT:
        raise ValueError(f"Built {len(features)} regions, expected {EXPECTED_REGION_COUNT}")
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
            f"which points at a regionMappings error rather than a digitizing sliver: {oversized}"
        )

    features.sort(key=lambda feature: str(feature["properties"]["name"]))

    output = {
        "features": features,
        "metadata": {
            "derivation": (
                "Topological union (Shapely unary_union) of the ADM1-63 member "
                f"polygons named in {MEMBERSHIP_SOURCE} provinceCodes. No "
                "coordinate is synthesized; every published vertex is present "
                "in the source asset."
            ),
            "membershipSource": MEMBERSHIP_SOURCE,
            "regionSystem": REGION_SYSTEM,
            "sourceAsset": SOURCE_ASSET_NAME,
            "sourceSha256": _sha256(source_path),
        },
        "name": "vnm-region-6",
        "type": "FeatureCollection",
    }

    output_path = geometry_dir / OUTPUT_ASSET_NAME
    _write_json(output_path, output)

    validation["areaDeltaPpmMax"] = round(validation["areaDeltaPpmMax"], 6)
    validation["featureCount"] = len(features)
    validation["regionCount"] = len(features)
    validation["sourceFeatureCount"] = len(source_features)
    _update_manifest(geometry_dir, output_path, source_path, layer_path, validation)
    return validation


def _update_manifest(
    geometry_dir: Path,
    output_path: Path,
    source_path: Path,
    layer_path: Path,
    validation: dict[str, Any],
) -> None:
    manifest_path = geometry_dir / MANIFEST_NAME
    manifest = _read_json(manifest_path)
    layer = _read_json(layer_path)
    version = f"b-021-{str(layer.get('generatedAt', ''))[:10]}"
    entry = {
        "attribution": (
            "geoBoundaries (William & Mary geoLab), VNM ADM1, boundary year 2008, build "
            "2023-12-12; Runfola et al. (2020), PLOS ONE 15(4): e0231866. Six-region "
            "grouping follows Global Data Lab (GDL Area Database / GVI) region "
            "membership; GDL 기관 이용약관에 따라 비영리 표출로 한정."
        ),
        "derivedFrom": {
            "asset": f"/data/vietnam/v2/geometry/{SOURCE_ASSET_NAME}",
            "method": f"shapely.ops.unary_union over {MEMBERSHIP_SOURCE} provinceCodes",
            "sha256": _sha256(source_path),
        },
        "featureCount": validation["featureCount"],
        "geometryTypes": ["Polygon", "MultiPolygon"],
        "kind": "region-6",
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
        "version": version,
    }
    assets = [item for item in manifest["assets"] if item.get("kind") != "region-6"]
    assets.append(entry)
    manifest["assets"] = sorted(assets, key=lambda item: str(item.get("url", "")))
    _write_json(manifest_path, manifest)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--geometry-dir", type=Path, default=DEFAULT_GEOMETRY_DIR)
    parser.add_argument("--layer", type=Path, default=DEFAULT_LAYER_PATH)
    args = parser.parse_args()
    validation = build(args.geometry_dir, args.layer)
    print(json.dumps({"status": "PASS", "asset": OUTPUT_ASSET_NAME, **validation}, ensure_ascii=False))


if __name__ == "__main__":
    main()
