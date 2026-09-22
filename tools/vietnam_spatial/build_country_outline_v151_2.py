"""Build the Viet Nam national outline (full-detail and a display-only z5).

The full outline is the topological union of all 63 published ADM1 provinces,
so it synthesizes no coordinate: every published vertex is present in the
committed 63-unit asset, and the guarded checks below fail the build if that
stops being true.

`vnm-country-outline-z5.geojson` is a second, simplified copy meant only for
low zoom levels where the full-detail outline is too heavy to paint. It is
explicitly NOT used for area or boundary analysis: its geometry is a
Douglas-Peucker simplification (tolerance 0.01 deg, preserve_topology) of the
full outline, and it drops small non-mainland island parts the simplification
leaves as slivers. Both the tolerance and the drop count are recorded so nyone
reading the manifest can tell it apart from a source-accurate asset.

Run:

    python -m pip install shapely pyproj
    python tools/vietnam_spatial/build_country_outline_v151_2.py
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# Allow `python tools/vietnam_spatial/build_country_outline_v151_2.py` to
# resolve the `tools.*` package import below even though only this file's own
# directory is put on sys.path automatically for a direct script invocation.
_REPOSITORY_ROOT_FOR_IMPORT = Path(__file__).resolve().parents[2]
if str(_REPOSITORY_ROOT_FOR_IMPORT) not in sys.path:
    sys.path.insert(0, str(_REPOSITORY_ROOT_FOR_IMPORT))

from shapely.geometry import MultiPolygon, mapping, shape
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

REPOSITORY_ROOT = _REPOSITORY_ROOT_FOR_IMPORT
DEFAULT_GEOMETRY_DIR = REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2" / "geometry"

SOURCE_ASSET_NAME = "vnm-adm1-63.geojson"
OUTPUT_ASSET_NAME = "vnm-country-outline.geojson"
OUTPUT_Z5_ASSET_NAME = "vnm-country-outline-z5.geojson"
MANIFEST_NAME = "geometry-manifest.json"

EXPECTED_SOURCE_FEATURE_COUNT = 63

# The build date of the underlying geoBoundaries 63-unit asset; both outlines
# are a direct derivation of it and carry no other dated provenance of their
# own, so this is the real fact to publish as their version.
SOURCE_BUILD_DATE = "2023-12-12"

Z5_SIMPLIFY_TOLERANCE_DEG = 0.01
Z5_MIN_ISLAND_AREA_KM2 = 2.0


def _polygon_parts(geometry: Any) -> list[Any]:
    return list(geometry.geoms) if geometry.geom_type == "MultiPolygon" else [geometry]


def build(geometry_dir: Path) -> dict[str, Any]:
    source_path = geometry_dir / SOURCE_ASSET_NAME
    source = _read_json(source_path)
    source_features = source["features"]
    if len(source_features) != EXPECTED_SOURCE_FEATURE_COUNT:
        raise ValueError(
            f"{SOURCE_ASSET_NAME} holds {len(source_features)} features, "
            f"expected {EXPECTED_SOURCE_FEATURE_COUNT}"
        )

    geometries = []
    for feature in source_features:
        geometry = shape(feature["geometry"])
        if not geometry.is_valid:
            code = feature["properties"].get("adm1Code")
            raise ValueError(f"Invalid source geometry for {code}: {explain_validity(geometry)}")
        geometries.append(geometry)

    dissolved = unary_union(geometries)
    if dissolved.is_empty or dissolved.geom_type not in {"Polygon", "MultiPolygon"}:
        raise ValueError(f"Dissolve produced {dissolved.geom_type} for the country outline")
    if not dissolved.is_valid:
        raise ValueError(f"Invalid national dissolve: {explain_validity(dissolved)}")

    member_area = sum(_geodesic_area_m2(geometry) for geometry in geometries)
    dissolved_area = _geodesic_area_m2(dissolved)
    delta_ppm = abs(dissolved_area - member_area) / member_area * 1_000_000
    if delta_ppm > AREA_TOLERANCE_PPM:
        raise ValueError(
            f"National dissolve changed the area by {delta_ppm:.3f} ppm, over the "
            f"{AREA_TOLERANCE_PPM} ppm tolerance"
        )

    source_vertices = {
        vertex
        for feature in source_features
        for vertex in _vertices(feature["geometry"])
    }
    geometry_geojson = mapping(dissolved)
    synthetic = [vertex for vertex in _vertices(geometry_geojson) if vertex not in source_vertices]
    if synthetic:
        raise ValueError(
            f"{len(synthetic)} published vertices are absent from {SOURCE_ASSET_NAME}; "
            "the dissolve would be inventing a boundary"
        )

    polygon_count, hole_count = _ring_and_hole_counts(dissolved)
    source_gaps = [
        {"areaKm2": round(hole_km2, 4)} for hole_km2 in _interior_hole_areas_km2(dissolved)
    ]
    oversized = [gap for gap in source_gaps if gap["areaKm2"] > MAX_SOURCE_GAP_KM2]
    if oversized:
        raise ValueError(
            f"Source gaps larger than {MAX_SOURCE_GAP_KM2} km² survived the national "
            f"dissolve, which points at a source error rather than a digitizing sliver: "
            f"{oversized}"
        )

    full_vertex_count = sum(1 for _ in _vertices(geometry_geojson))
    area_km2 = round(dissolved_area / 1_000_000, 3)

    full_output = {
        "features": [
            {
                "geometry": geometry_geojson,
                "properties": {
                    "areaKm2": area_km2,
                    "derivedFrom": "vnm-adm1-63",
                    "iso3": "VNM",
                    "name": "Viet Nam",
                    "nameKo": "베트남",
                    "partCount": polygon_count,
                    "simplifyToleranceDeg": 0,
                },
                "type": "Feature",
            }
        ],
        "metadata": {
            "derivation": (
                "Topological union (Shapely unary_union) of all 63 published ADM1 "
                f"province polygons in {SOURCE_ASSET_NAME}. No coordinate is "
                "synthesized; every published vertex is present in the source asset."
            ),
            "sourceAsset": SOURCE_ASSET_NAME,
            "sourceSha256": _sha256(source_path),
        },
        "name": "vnm-country-outline",
        "type": "FeatureCollection",
    }
    full_output_path = geometry_dir / OUTPUT_ASSET_NAME
    _write_json(full_output_path, full_output)

    full_validation = {
        "areaDeltaPpmMax": round(delta_ppm, 6),
        "dissolvedInteriorHoleCount": hole_count,
        "featureCount": 1,
        "invalidGeometryCount": 0,
        "partCount": polygon_count,
        "sourceFeatureCount": len(source_features),
        "sourceGapsLeftOpen": source_gaps,
        "syntheticVertexCount": len(synthetic),
        "vertexCount": full_vertex_count,
    }

    # z5: a display-only simplification. It intentionally changes geometry, so
    # its area/vertex deltas versus the full outline are reported, not guarded.
    simplified = dissolved.simplify(Z5_SIMPLIFY_TOLERANCE_DEG, preserve_topology=True)
    if simplified.is_empty or simplified.geom_type not in {"Polygon", "MultiPolygon"}:
        raise ValueError(f"z5 simplify produced {simplified.geom_type}")
    if not simplified.is_valid:
        raise ValueError(f"Invalid z5 simplification: {explain_validity(simplified)}")

    parts = _polygon_parts(simplified)
    parts_with_area = [(part, _geodesic_area_m2(part) / 1_000_000) for part in parts]
    mainland_index = max(range(len(parts_with_area)), key=lambda index: parts_with_area[index][1])
    kept_parts = []
    dropped_area_km2_total = 0.0
    dropped_part_count = 0
    for index, (part, area_km2_part) in enumerate(parts_with_area):
        if index == mainland_index or area_km2_part >= Z5_MIN_ISLAND_AREA_KM2:
            kept_parts.append(part)
        else:
            dropped_part_count += 1
            dropped_area_km2_total += area_km2_part

    z5_geometry = kept_parts[0] if len(kept_parts) == 1 else MultiPolygon(kept_parts)
    z5_geometry_geojson = mapping(z5_geometry)
    z5_area_m2 = _geodesic_area_m2(z5_geometry)
    z5_area_km2 = round(z5_area_m2 / 1_000_000, 3)
    z5_vertex_count = sum(1 for _ in _vertices(z5_geometry_geojson))
    z5_area_delta_ppm_vs_full = round(
        abs(z5_area_m2 - dissolved_area) / dissolved_area * 1_000_000, 3
    )

    z5_output = {
        "features": [
            {
                "geometry": z5_geometry_geojson,
                "properties": {
                    "areaKm2": z5_area_km2,
                    "derivedFrom": "vnm-adm1-63",
                    "iso3": "VNM",
                    "name": "Viet Nam",
                    "nameKo": "베트남",
                    "partCount": len(kept_parts),
                    "simplifyToleranceDeg": Z5_SIMPLIFY_TOLERANCE_DEG,
                },
                "type": "Feature",
            }
        ],
        "metadata": {
            "derivation": (
                "Display-only Douglas-Peucker simplification "
                f"(shapely.simplify, tolerance={Z5_SIMPLIFY_TOLERANCE_DEG} deg, "
                f"preserve_topology=True) of {OUTPUT_ASSET_NAME}, with non-mainland "
                f"parts under {Z5_MIN_ISLAND_AREA_KM2} km2 dropped as simplification "
                "slivers. Not for area or boundary analysis; use the full outline for "
                "that."
            ),
            "droppedPartAreaKm2Total": round(dropped_area_km2_total, 3),
            "droppedPartCount": dropped_part_count,
            "sourceAsset": OUTPUT_ASSET_NAME,
            "sourceSha256": _sha256(full_output_path),
        },
        "name": "vnm-country-outline-z5",
        "type": "FeatureCollection",
    }
    z5_output_path = geometry_dir / OUTPUT_Z5_ASSET_NAME
    _write_json(z5_output_path, z5_output)

    z5_validation = {
        "areaDeltaPpmVsFull": z5_area_delta_ppm_vs_full,
        "droppedPartAreaKm2Total": round(dropped_area_km2_total, 3),
        "droppedPartCount": dropped_part_count,
        "featureCount": 1,
        "fullPartCount": len(parts_with_area),
        "fullVertexCount": full_vertex_count,
        "geometryValidity": "pass",
        "partCount": len(kept_parts),
        "vertexCount": z5_vertex_count,
    }

    _update_manifest(geometry_dir, full_output_path, z5_output_path, full_validation, z5_validation)

    return {
        "full": {**full_validation, "areaKm2": area_km2},
        "z5": {**z5_validation, "areaKm2": z5_area_km2},
    }


def _base_license() -> dict[str, Any]:
    return {
        "attributionRequired": True,
        "geoBoundariesDerivativeLicense": "CC-BY-4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "sourceBoundaryLicense": "Public Domain",
    }


def _base_attribution() -> str:
    return (
        "geoBoundaries (William & Mary geoLab), VNM ADM1, boundary year 2008, build "
        "2023-12-12; Runfola et al. (2020), PLOS ONE 15(4): e0231866."
    )


def _update_manifest(
    geometry_dir: Path,
    full_output_path: Path,
    z5_output_path: Path,
    full_validation: dict[str, Any],
    z5_validation: dict[str, Any],
) -> None:
    manifest_path = geometry_dir / MANIFEST_NAME
    manifest = _read_json(manifest_path)

    full_entry = {
        "attribution": _base_attribution(),
        "derivedFrom": {
            "asset": f"/data/vietnam/v2/geometry/{SOURCE_ASSET_NAME}",
            "method": "shapely.ops.unary_union over all 63 ADM1 features",
            "sha256": _sha256(geometry_dir / SOURCE_ASSET_NAME),
        },
        "featureCount": 1,
        "geometryTypes": ["Polygon", "MultiPolygon"],
        "kind": "country-outline",
        "license": _base_license(),
        "partCount": full_validation["partCount"],
        "sha256": _sha256(full_output_path),
        "simplifyToleranceDeg": 0,
        "url": f"/data/vietnam/v2/geometry/{OUTPUT_ASSET_NAME}",
        "validation": {
            **{key: value for key, value in sorted(full_validation.items())},
            "geometryValidity": "pass",
            "validator": "Shapely 2.1.2 (GEOS is_valid) + pyproj Geod area",
        },
        "version": SOURCE_BUILD_DATE,
        "vertexCount": full_validation["vertexCount"],
    }

    z5_entry = {
        "attribution": _base_attribution(),
        "derivedFrom": {
            "asset": f"/data/vietnam/v2/geometry/{OUTPUT_ASSET_NAME}",
            "method": (
                f"shapely.simplify(tolerance={Z5_SIMPLIFY_TOLERANCE_DEG}, "
                "preserve_topology=True); non-mainland parts under "
                f"{Z5_MIN_ISLAND_AREA_KM2} km2 dropped"
            ),
            "sha256": _sha256(full_output_path),
        },
        "featureCount": 1,
        "geometryTypes": ["Polygon", "MultiPolygon"],
        "kind": "country-outline-z5",
        "license": _base_license(),
        "partCount": z5_validation["partCount"],
        "sha256": _sha256(z5_output_path),
        "simplifyToleranceDeg": Z5_SIMPLIFY_TOLERANCE_DEG,
        "url": f"/data/vietnam/v2/geometry/{OUTPUT_Z5_ASSET_NAME}",
        "validation": {**{key: value for key, value in sorted(z5_validation.items())}},
        "version": f"{SOURCE_BUILD_DATE}-z5",
        "vertexCount": z5_validation["vertexCount"],
    }

    assets = [
        item
        for item in manifest["assets"]
        if item.get("kind") not in {"country-outline", "country-outline-z5"}
    ]
    assets.append(full_entry)
    assets.append(z5_entry)
    manifest["assets"] = sorted(assets, key=lambda item: str(item.get("url", "")))
    _write_json(manifest_path, manifest)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--geometry-dir", type=Path, default=DEFAULT_GEOMETRY_DIR)
    args = parser.parse_args()
    result = build(args.geometry_dir)
    print(
        json.dumps(
            {
                "status": "PASS",
                "assets": [OUTPUT_ASSET_NAME, OUTPUT_Z5_ASSET_NAME],
                **result,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
