"""Build the A-027 land-transport line asset from OpenStreetMap (V155-1).

Selection, straight from the Geofabrik Viet Nam extract:

* roads: ``highway`` in ``motorway`` / ``trunk`` / ``primary`` (link roads
  excluded, they are ramps and junction stubs);
* rail: ``railway=rail`` without a ``service`` tag (sidings, yards, spurs and
  crossovers are service tracks).

Ways whose nodes all fall outside the published province boundaries plus a
2 km margin are dropped; ways are never cut, so a cross-border road keeps its
OSM shape. Consecutive ways that share class, ``ref`` and ``name`` are merged
with ``shapely.ops.linemerge`` into one feature (a way with neither ``ref``
nor ``name`` stays on its own). Vertices are then thinned with a
topology-preserving Douglas-Peucker pass whose tolerance is recorded in the
asset; no vertex is moved or invented.

Outputs:

* ``geometry/vnm-roads-rail.geojson``
* ``geometry/vnm-roads-rail-overview.geojson`` (coarser tolerance for low zoom)
* ``geometry-manifest.json`` entries appended
* ``reports/v155/roads-rail-v155.json`` including the class-by-class length
  table set against the A-027 feature counts already published.

Run:

    python tools/vietnam_spatial/build_osm_roads_rail_v155.py [--pbf PATH]
"""

from __future__ import annotations

import argparse
import csv
import json
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import osmium
from shapely.geometry import LineString, MultiLineString, mapping
from shapely.ops import linemerge

from osm_common_v155 import (
    ACCURACY_NOTICE,
    ATTRIBUTION,
    CRS_NOTE,
    DEFAULT_PBF,
    GEOMETRY_DIR,
    LICENSE,
    LICENSE_URL,
    REPORT_DIR,
    REPOSITORY_ROOT,
    SOURCE_NAME,
    ProvinceLookup,
    append_manifest_entry,
    base_manifest_entry,
    geodesic_length_km,
    gzip_size,
    verify_pbf,
    write_json,
)


ELEMENT_ID = "A-027"
ASSET_NAME = "vnm-roads-rail.geojson"
OVERVIEW_ASSET_NAME = "vnm-roads-rail-overview.geojson"
REPORT_NAME = "roads-rail-v155.json"

ROAD_CLASSES = {"motorway": "고속도로", "trunk": "간선도로", "primary": "주요도로"}
RAIL_CLASS = "철도"
CLASS_ORDER = ["고속도로", "간선도로", "주요도로", "철도"]
CLASS_SOURCE_TAG = {
    "고속도로": "highway=motorway",
    "간선도로": "highway=trunk",
    "주요도로": "highway=primary",
    "철도": "railway=rail (service 제외)",
}
# Existing A-027 indicator ids that count the same feature classes in the
# Geofabrik shapefile release; used only for the comparison table.
A027_COUNT_INDICATORS = {
    "고속도로": "A-027_roads_fclass_motorway_count",
    "간선도로": "A-027_roads_fclass_trunk_count",
    "주요도로": "A-027_roads_fclass_primary_count",
    "철도": "A-027_railways_fclass_rail_count",
}

# ~20 m at Viet Nam's latitudes for the main asset; ~200 m for the overview.
DETAIL_TOLERANCE_DEG = 0.0002
OVERVIEW_TOLERANCE_DEG = 0.002
DETAIL_GZIP_BUDGET = 4 * 1024 * 1024
OVERVIEW_GZIP_BUDGET = 1 * 1024 * 1024


def classify(tags: Any) -> str | None:
    highway = tags.get("highway")
    if highway in ROAD_CLASSES:
        return ROAD_CLASSES[highway]
    if tags.get("railway") == "rail" and "service" not in tags:
        return RAIL_CLASS
    return None


def collect_ways(pbf: Path) -> tuple[list[dict[str, Any]], dict[str, int]]:
    ways: list[dict[str, Any]] = []
    stats = {"candidateWays": 0, "waysWithoutLocations": 0, "waysUnderTwoNodes": 0}
    # Nodes must stay in the read set so the location cache fills; the
    # EntityFilter then hides them from the loop.
    processor = (
        osmium.FileProcessor(str(pbf), osmium.osm.NODE | osmium.osm.WAY)
        .with_locations()
        .with_filter(osmium.filter.EntityFilter(osmium.osm.WAY))
        .with_filter(osmium.filter.KeyFilter("highway", "railway"))
    )
    for way in processor:
        way_class = classify(way.tags)
        if way_class is None:
            continue
        stats["candidateWays"] += 1
        coordinates: list[tuple[float, float]] = []
        missing = False
        for node in way.nodes:
            if not node.location.valid():
                missing = True
                continue
            coordinates.append((node.location.lon, node.location.lat))
        if missing:
            stats["waysWithoutLocations"] += 1
        if len(coordinates) < 2:
            stats["waysUnderTwoNodes"] += 1
            continue
        ways.append(
            {
                "id": way.id,
                "class": way_class,
                "sourceTag": CLASS_SOURCE_TAG[way_class],
                "name": way.tags.get("name"),
                "ref": way.tags.get("ref"),
                "coordinates": coordinates,
            }
        )
    return ways, stats


def merge_key(way: dict[str, Any]) -> tuple[Any, ...] | None:
    if not way["ref"] and not way["name"]:
        return None
    return (way["class"], way["ref"] or "", way["name"] or "")


def build_features(ways: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    groups: dict[tuple[Any, ...], list[dict[str, Any]]] = defaultdict(list)
    singles: list[dict[str, Any]] = []
    for way in ways:
        key = merge_key(way)
        if key is None:
            singles.append(way)
        else:
            groups[key].append(way)

    features: list[dict[str, Any]] = []
    stats = {"mergeGroups": len(groups), "unmergedUnnamedWays": len(singles), "mergedFeatureCount": 0}

    def emit(way_class: str, name: str | None, ref: str | None, members: list[dict[str, Any]]) -> None:
        lines = [LineString(way["coordinates"]) for way in members]
        geometry = linemerge(lines) if len(lines) > 1 else lines[0]
        if geometry.geom_type == "LineString":
            geometry = MultiLineString([geometry])
        elif geometry.geom_type != "MultiLineString":
            raise ValueError(f"linemerge produced {geometry.geom_type}")
        length_km = sum(geodesic_length_km(list(line.coords)) for line in geometry.geoms)
        if length_km <= 0:
            raise ValueError(f"Zero-length feature for ways {[way['id'] for way in members]}")
        ids = sorted(way["id"] for way in members)
        feature_id = f"A-027-OSM-{ids[0]}" if len(ids) == 1 else f"A-027-OSM-M-{ids[0]}"
        features.append(
            {
                "type": "Feature",
                "id": feature_id,
                "properties": {
                    "elementId": ELEMENT_ID,
                    "featureId": feature_id,
                    "class": way_class,
                    "sourceTag": CLASS_SOURCE_TAG[way_class],
                    "name": name,
                    "ref": ref,
                    "lengthKm": round(length_km, 3),
                    "lengthMethod": "WGS84 geodesic (pyproj Geod)",
                    "osmWayCount": len(ids),
                    "osmWayIds": ids,
                    "geometryProvenance": "osm-node-locations",
                    "isSynthetic": False,
                },
                "geometry": geometry,
            }
        )

    for key in sorted(groups, key=lambda item: (CLASS_ORDER.index(item[0]), item[1], item[2])):
        members = groups[key]
        emit(key[0], members[0]["name"], members[0]["ref"], members)
        if len(members) > 1:
            stats["mergedFeatureCount"] += 1
    for way in sorted(singles, key=lambda item: (CLASS_ORDER.index(item["class"]), item["id"])):
        emit(way["class"], None, None, [way])
    return features, stats


def simplified_collection(
    features: list[dict[str, Any]], tolerance: float, *, name: str, source: dict[str, Any], generated_at: str
) -> tuple[dict[str, Any], dict[str, Any]]:
    out_features = []
    bbox = [180.0, 90.0, -180.0, -90.0]
    vertex_count = 0
    source_vertex_count = 0
    class_length: dict[str, float] = defaultdict(float)
    class_count: dict[str, int] = defaultdict(int)
    ids: set[str] = set()
    for feature in features:
        geometry = feature["geometry"]
        source_vertex_count += sum(len(line.coords) for line in geometry.geoms)
        simplified = geometry.simplify(tolerance, preserve_topology=True) if tolerance else geometry
        if simplified.geom_type == "LineString":
            simplified = MultiLineString([simplified])
        if simplified.is_empty or not simplified.is_valid:
            raise ValueError(f"Simplification broke {feature['id']}")
        vertex_count += sum(len(line.coords) for line in simplified.geoms)
        minx, miny, maxx, maxy = simplified.bounds
        bbox = [min(bbox[0], minx), min(bbox[1], miny), max(bbox[2], maxx), max(bbox[3], maxy)]
        if feature["id"] in ids:
            raise ValueError(f"Duplicate feature id {feature['id']}")
        ids.add(feature["id"])
        properties = feature["properties"]
        class_length[properties["class"]] += properties["lengthKm"]
        class_count[properties["class"]] += 1
        out_features.append(
            {
                "type": "Feature",
                "id": feature["id"],
                "properties": properties,
                "geometry": mapping(simplified),
            }
        )
    collection = {
        "type": "FeatureCollection",
        "name": name,
        "bbox": [round(value, 7) for value in bbox],
        "metadata": {
            "schemaVersion": "v155-spatial-1",
            "elementId": ELEMENT_ID,
            "title": "Viet Nam motorways, trunk and primary roads, and railways (OpenStreetMap)",
            "selection": {
                "roads": "highway in {motorway, trunk, primary}; *_link excluded",
                "rail": "railway=rail without service=*",
                "clip": "ways with no node inside the published provinces + 2 km margin dropped; ways are never cut",
            },
            "merge": "ways sharing class, ref and name merged with shapely linemerge; ways with neither ref nor name kept separate",
            "simplificationToleranceDeg": tolerance,
            "simplificationMethod": "Douglas-Peucker, topology preserving (shapely simplify); vertices removed, never moved",
            "source": SOURCE_NAME,
            "sourceExtract": source["extract"],
            "sourceDatedUrl": source["datedUrl"],
            "sourceMd5": source["md5"],
            "sourceSha256": source["sha256"],
            "sourceReplicationTimestamp": source["replicationTimestamp"],
            "license": LICENSE,
            "licenseUrl": LICENSE_URL,
            "attribution": ATTRIBUTION,
            "accuracyNotice": ACCURACY_NOTICE,
            "crs": CRS_NOTE,
            "featureCount": len(out_features),
            "vertexCount": vertex_count,
            "sourceVertexCount": source_vertex_count,
            "lengthKmByClass": {key: round(class_length[key], 1) for key in CLASS_ORDER},
            "featureCountByClass": {key: class_count[key] for key in CLASS_ORDER},
            "lengthMethod": "WGS84 geodesic (pyproj Geod) on the unsimplified OSM way",
            "geometryProvenance": "osm-node-locations",
            "isSynthetic": False,
            "generatedAt": generated_at,
        },
        "features": out_features,
    }
    return collection, {"vertexCount": vertex_count, "sourceVertexCount": source_vertex_count}


def existing_a027_counts(downloads_dir: Path) -> dict[str, Any]:
    counts: dict[str, Any] = {}
    path = downloads_dir / "a-027.csv"
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            for way_class, indicator in A027_COUNT_INDICATORS.items():
                if row["indicator_id"] == indicator:
                    counts[way_class] = {"indicatorId": indicator, "value": int(float(row["value"])), "unit": row["unit"], "sourceYearLabel": row["source_year_label"]}
    return counts


def build(args: argparse.Namespace) -> dict[str, Any]:
    started = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    source = verify_pbf(args.pbf)
    header = osmium.io.Reader(str(args.pbf)).header()
    source["replicationTimestamp"] = header.get("osmosis_replication_timestamp")
    generated_at = source["lastModified"]

    lookup = ProvinceLookup(args.geometry_dir)
    ways, collect_stats = collect_ways(args.pbf)
    kept = []
    dropped_outside = 0
    for way in ways:
        if lookup.touches_country(LineString(way["coordinates"])):
            kept.append(way)
        else:
            dropped_outside += 1
    class_way_count: dict[str, int] = defaultdict(int)
    class_way_length: dict[str, float] = defaultdict(float)
    for way in kept:
        class_way_count[way["class"]] += 1
        class_way_length[way["class"]] += geodesic_length_km(way["coordinates"])

    features, merge_stats = build_features(kept)
    detail, detail_stats = simplified_collection(
        features, DETAIL_TOLERANCE_DEG, name="vnm-roads-rail", source=source, generated_at=generated_at
    )
    overview, overview_stats = simplified_collection(
        features, OVERVIEW_TOLERANCE_DEG, name="vnm-roads-rail-overview", source=source, generated_at=generated_at
    )
    # The overview drops the way-id lists: it is a drawing aid, the detail
    # asset holds provenance.
    for feature in overview["features"]:
        feature["properties"] = {
            key: value for key, value in feature["properties"].items() if key != "osmWayIds"
        }
    overview["metadata"]["derivedFrom"] = f"/data/vietnam/v2/geometry/{ASSET_NAME}"
    overview["metadata"]["title"] += " - low-zoom overview"

    detail_path = args.geometry_dir / ASSET_NAME
    overview_path = args.geometry_dir / OVERVIEW_ASSET_NAME
    write_json(detail_path, detail, indent=None)
    write_json(overview_path, overview, indent=None)
    detail_gzip = gzip_size(detail_path)
    overview_gzip = gzip_size(overview_path)
    if detail_gzip > DETAIL_GZIP_BUDGET:
        raise ValueError(f"{ASSET_NAME} gzip {detail_gzip} exceeds the 4 MB budget")
    if overview_gzip > OVERVIEW_GZIP_BUDGET:
        raise ValueError(f"{OVERVIEW_ASSET_NAME} gzip {overview_gzip} exceeds the 1 MB budget")

    existing = existing_a027_counts(args.downloads_dir)
    comparison = []
    for way_class in CLASS_ORDER:
        comparison.append(
            {
                "class": way_class,
                "sourceTag": CLASS_SOURCE_TAG[way_class],
                "osmWayCount": class_way_count[way_class],
                "publishedFeatureCount": detail["metadata"]["featureCountByClass"][way_class],
                "lengthKm": round(class_way_length[way_class], 1),
                "existingA027": existing.get(way_class),
                "note": (
                    "기존 A-027 지표는 Geofabrik shapefile 세그먼트 건수이며 연장(km)이 없습니다. "
                    "철도 기존 건수는 service 선로를 포함해 더 큽니다."
                    if way_class == "철도"
                    else "기존 A-027 지표는 Geofabrik shapefile 세그먼트 건수이며 연장(km)이 없습니다."
                ),
            }
        )

    validation = {
        **collect_stats,
        "waysKept": len(kept),
        "waysDroppedOutsideCountry": dropped_outside,
        **merge_stats,
        "featureCount": len(detail["features"]),
        "duplicateIdCount": 0,
        "invalidGeometryCount": 0,
        "emptyGeometryCount": 0,
        "detail": {**detail_stats, "toleranceDeg": DETAIL_TOLERANCE_DEG, "bytes": detail_path.stat().st_size, "gzipBytes": detail_gzip},
        "overview": {**overview_stats, "toleranceDeg": OVERVIEW_TOLERANCE_DEG, "bytes": overview_path.stat().st_size, "gzipBytes": overview_gzip},
        "propertyNullRate": {
            "name": round(sum(1 for f in detail["features"] if not f["properties"]["name"]) / len(detail["features"]), 4),
            "ref": round(sum(1 for f in detail["features"] if not f["properties"]["ref"]) / len(detail["features"]), 4),
        },
        "bbox": detail["bbox"],
        "crs": "EPSG:4326",
    }

    detail_entry = base_manifest_entry(
        kind="osm-roads-rail",
        url=f"/data/vietnam/v2/geometry/{ASSET_NAME}",
        path=detail_path,
        feature_count=len(detail["features"]),
        geometry_types=["MultiLineString"],
        source=source,
    )
    detail_entry.update(
        {
            "elementId": ELEMENT_ID,
            "selection": detail["metadata"]["selection"],
            "simplificationToleranceDeg": DETAIL_TOLERANCE_DEG,
            "lengthKmByClass": detail["metadata"]["lengthKmByClass"],
            "validation": {
                "duplicateIdCount": 0,
                "emptyGeometryCount": 0,
                "featureCount": len(detail["features"]),
                "geometryValidity": "pass",
                "invalidGeometryCount": 0,
                "osmWayCount": len(kept),
                "validator": "Shapely 2.1.2 (GEOS is_valid) + pyproj Geod length",
            },
        }
    )
    overview_entry = base_manifest_entry(
        kind="osm-roads-rail-overview",
        url=f"/data/vietnam/v2/geometry/{OVERVIEW_ASSET_NAME}",
        path=overview_path,
        feature_count=len(overview["features"]),
        geometry_types=["MultiLineString"],
        source=source,
    )
    overview_entry.update(
        {
            "elementId": ELEMENT_ID,
            "derivedFrom": {"asset": f"/data/vietnam/v2/geometry/{ASSET_NAME}", "method": f"shapely simplify {OVERVIEW_TOLERANCE_DEG} deg", "sha256": detail_entry["sha256"]},
            "simplificationToleranceDeg": OVERVIEW_TOLERANCE_DEG,
            "usage": "zoom < 8",
        }
    )
    if not args.skip_manifest:
        append_manifest_entry(args.geometry_dir, detail_entry)
        append_manifest_entry(args.geometry_dir, overview_entry)

    report = {
        "schema": "v155-asset-report-1",
        "asset": ASSET_NAME,
        "generatedAt": started,
        "source": source,
        "outputs": {
            ASSET_NAME: {"bytes": detail_path.stat().st_size, "gzipBytes": detail_gzip, "sha256": detail_entry["sha256"], "bbox": detail["bbox"]},
            OVERVIEW_ASSET_NAME: {"bytes": overview_path.stat().st_size, "gzipBytes": overview_gzip, "sha256": overview_entry["sha256"], "bbox": overview["bbox"]},
        },
        "validation": validation,
        "classComparison": comparison,
    }
    write_json(REPORT_DIR / REPORT_NAME, report)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pbf", type=Path, default=DEFAULT_PBF)
    parser.add_argument("--geometry-dir", type=Path, default=GEOMETRY_DIR)
    parser.add_argument("--downloads-dir", type=Path, default=REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2" / "downloads")
    parser.add_argument("--skip-manifest", action="store_true")
    args = parser.parse_args()
    report = build(args)
    print(
        json.dumps(
            {
                "status": "PASS",
                "features": report["validation"]["featureCount"],
                "waysKept": report["validation"]["waysKept"],
                "dropped": report["validation"]["waysDroppedOutsideCountry"],
                "gzip": {name: item["gzipBytes"] for name, item in report["outputs"].items()},
                "lengthKm": {row["class"]: row["lengthKm"] for row in report["classComparison"]},
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
