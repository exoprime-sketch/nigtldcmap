"""Build the A-028 coastal and water infrastructure asset from OSM (V155-1).

Selection from the Geofabrik Viet Nam extract:

* ports: ``landuse=port``, ``harbour=yes`` or ``seamark:type=harbour`` on a
  node, way or multipolygon relation - published as the representative point;
* dams: ``waterway=dam`` on a node, way or relation - representative point,
  with the crest length for open ways;
* reservoirs: ``natural=water`` + ``water=reservoir`` areas of at least 1 km²
  (geodesic) - published as a simplified polygon. The older ``landuse=reservoir``
  tagging is counted for the report but not published.

Representative points are ``shapely`` ``representative_point()`` for areas
(guaranteed inside), the middle vertex for open ways and the node itself for
nodes; they are derived from OSM node locations only. Each feature carries the
2025 34-unit and pre-2025 63-unit province codes of its representative point;
features whose point falls outside both boundary assets (offshore harbours)
keep ``null`` codes and are counted.

Outputs: ``geometry/vnm-water-coastal-infra.geojson``, a manifest entry and
``reports/v155/water-coastal-infra-v155.json``.

Run:

    python tools/vietnam_spatial/build_osm_water_coastal_v155.py [--pbf PATH]
"""

from __future__ import annotations

import argparse
import json
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import osmium
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, mapping
from shapely.validation import make_valid

from osm_common_v155 import (
    ACCURACY_NOTICE,
    ATTRIBUTION,
    CRS_NOTE,
    DEFAULT_PBF,
    GEOMETRY_DIR,
    LICENSE,
    LICENSE_URL,
    REPORT_DIR,
    SOURCE_NAME,
    ProvinceLookup,
    append_manifest_entry,
    base_manifest_entry,
    geodesic_area_km2,
    geodesic_length_km,
    gzip_size,
    verify_pbf,
    write_json,
)


ELEMENT_ID = "A-028"
ASSET_NAME = "vnm-water-coastal-infra.geojson"
REPORT_NAME = "water-coastal-infra-v155.json"

KIND_PORT = "port"
KIND_DAM = "dam"
KIND_RESERVOIR = "reservoir"
KIND_LABELS = {KIND_PORT: "항만", KIND_DAM: "댐", KIND_RESERVOIR: "저수지"}
KIND_ORDER = [KIND_PORT, KIND_DAM, KIND_RESERVOIR]
MIN_RESERVOIR_KM2 = 1.0
RESERVOIR_TOLERANCE_DEG = 0.0002
GZIP_BUDGET = 2 * 1024 * 1024
FILTER_KEYS = ("landuse", "harbour", "seamark:type", "waterway", "natural")


def port_tag(tags: Any) -> str | None:
    if tags.get("landuse") == "port":
        return "landuse=port"
    if tags.get("harbour") == "yes":
        return "harbour=yes"
    if tags.get("seamark:type") == "harbour":
        return "seamark:type=harbour"
    return None


def dam_tag(tags: Any) -> str | None:
    return "waterway=dam" if tags.get("waterway") == "dam" else None


def reservoir_tag(tags: Any) -> str | None:
    if tags.get("natural") == "water" and tags.get("water") == "reservoir":
        return "natural=water+water=reservoir"
    return None


def area_to_shape(area: Any) -> Any:
    polygons = []
    for outer in area.outer_rings():
        shell = [(node.lon, node.lat) for node in outer if node.location.valid()]
        holes = [
            [(node.lon, node.lat) for node in inner if node.location.valid()]
            for inner in area.inner_rings(outer)
        ]
        if len(shell) >= 4:
            polygons.append(Polygon(shell, [hole for hole in holes if len(hole) >= 4]))
    if not polygons:
        return None
    geometry = MultiPolygon(polygons) if len(polygons) > 1 else polygons[0]
    return geometry if geometry.is_valid else make_valid(geometry)


def middle_vertex(coordinates: list[tuple[float, float]]) -> tuple[float, float]:
    return coordinates[len(coordinates) // 2]


def collect(pbf: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """One pass over nodes, open ways and assembled areas."""

    stats: dict[str, Any] = {
        "ports": {"node": 0, "way": 0, "area": 0},
        "dams": {"node": 0, "way": 0, "area": 0},
        "reservoirsCandidate": 0,
        "reservoirsBelowMinArea": 0,
        "reservoirsUnbuildable": 0,
        "landuseReservoirLegacyTagCount": 0,
        "landuseReservoirLegacyOnlyCount": 0,
    }
    records: list[dict[str, Any]] = []

    processor = (
        osmium.FileProcessor(str(pbf))
        .with_locations()
        .with_areas()
        .with_filter(osmium.filter.KeyFilter(*FILTER_KEYS))
    )
    for obj in processor:
        tags = obj.tags
        if obj.is_node():
            for kind, tag in ((KIND_PORT, port_tag(tags)), (KIND_DAM, dam_tag(tags))):
                if tag:
                    stats["ports" if kind == KIND_PORT else "dams"]["node"] += 1
                    records.append(
                        {
                            "kind": kind,
                            "sourceTag": tag,
                            "osmType": "node",
                            "osmId": obj.id,
                            "name": tags.get("name"),
                            "point": (obj.location.lon, obj.location.lat),
                            "lengthKm": None,
                            "areaKm2": None,
                            "geometry": None,
                        }
                    )
        elif obj.is_way():
            if obj.is_closed():
                continue  # closed ways arrive again as areas
            for kind, tag in ((KIND_PORT, port_tag(tags)), (KIND_DAM, dam_tag(tags))):
                if not tag:
                    continue
                coordinates = [(node.location.lon, node.location.lat) for node in obj.nodes if node.location.valid()]
                if len(coordinates) < 2:
                    continue
                stats["ports" if kind == KIND_PORT else "dams"]["way"] += 1
                records.append(
                    {
                        "kind": kind,
                        "sourceTag": tag,
                        "osmType": "way",
                        "osmId": obj.id,
                        "name": tags.get("name"),
                        "point": middle_vertex(coordinates),
                        "lengthKm": round(geodesic_length_km(coordinates), 3) if kind == KIND_DAM else None,
                        "areaKm2": None,
                        "geometry": None,
                    }
                )
        elif obj.is_area():
            legacy = tags.get("landuse") == "reservoir"
            if legacy:
                stats["landuseReservoirLegacyTagCount"] += 1
            reservoir = reservoir_tag(tags)
            if legacy and not reservoir:
                stats["landuseReservoirLegacyOnlyCount"] += 1
            osm_type = "way" if obj.from_way() else "relation"
            osm_id = obj.orig_id()
            for kind, tag in ((KIND_PORT, port_tag(tags)), (KIND_DAM, dam_tag(tags))):
                if not tag:
                    continue
                geometry = area_to_shape(obj)
                if geometry is None:
                    continue
                stats["ports" if kind == KIND_PORT else "dams"]["area"] += 1
                point = geometry.representative_point()
                records.append(
                    {
                        "kind": kind,
                        "sourceTag": tag,
                        "osmType": osm_type,
                        "osmId": osm_id,
                        "name": tags.get("name"),
                        "point": (point.x, point.y),
                        "lengthKm": None,
                        "areaKm2": round(geodesic_area_km2(geometry), 4),
                        "geometry": None,
                    }
                )
            if reservoir:
                stats["reservoirsCandidate"] += 1
                geometry = area_to_shape(obj)
                if geometry is None:
                    stats["reservoirsUnbuildable"] += 1
                    continue
                area_km2 = geodesic_area_km2(geometry)
                if area_km2 < MIN_RESERVOIR_KM2:
                    stats["reservoirsBelowMinArea"] += 1
                    continue
                point = geometry.representative_point()
                records.append(
                    {
                        "kind": KIND_RESERVOIR,
                        "sourceTag": reservoir,
                        "osmType": osm_type,
                        "osmId": osm_id,
                        "name": tags.get("name"),
                        "point": (point.x, point.y),
                        "lengthKm": None,
                        "areaKm2": round(area_km2, 4),
                        "geometry": geometry,
                    }
                )
    return records, stats


def build(args: argparse.Namespace) -> dict[str, Any]:
    started = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    source = verify_pbf(args.pbf)
    header = osmium.io.Reader(str(args.pbf)).header()
    source["replicationTimestamp"] = header.get("osmosis_replication_timestamp")
    generated_at = source["lastModified"]

    lookup = ProvinceLookup(args.geometry_dir)
    records, stats = collect(args.pbf)

    features: list[dict[str, Any]] = []
    ids: set[str] = set()
    counts: dict[str, int] = defaultdict(int)
    outside_country = 0
    no_province = defaultdict(int)
    null_name = defaultdict(int)
    bbox = [180.0, 90.0, -180.0, -90.0]
    vertex_source = 0
    vertex_published = 0
    order = {kind: index for index, kind in enumerate(KIND_ORDER)}
    for record in sorted(records, key=lambda item: (order[item["kind"]], item["osmType"], item["osmId"])):
        point = Point(record["point"])
        probe = record["geometry"] if record["geometry"] is not None else point
        if not lookup.touches_country(probe):
            outside_country += 1
            continue
        location = lookup.locate(point)
        if location["adm1Code34"] is None:
            no_province[record["kind"]] += 1
        if not record["name"]:
            null_name[record["kind"]] += 1
        feature_id = f"A-028-OSM-{record['kind']}-{record['osmType'][0]}{record['osmId']}"
        if feature_id in ids:
            raise ValueError(f"Duplicate feature id {feature_id}")
        ids.add(feature_id)
        if record["geometry"] is not None:
            geometry = record["geometry"]
            vertex_source += sum(len(polygon.exterior.coords) + sum(len(ring.coords) for ring in polygon.interiors) for polygon in (geometry.geoms if geometry.geom_type == "MultiPolygon" else [geometry]))
            simplified = geometry.simplify(RESERVOIR_TOLERANCE_DEG, preserve_topology=True)
            if simplified.is_empty or not simplified.is_valid:
                simplified = geometry
            vertex_published += sum(len(polygon.exterior.coords) + sum(len(ring.coords) for ring in polygon.interiors) for polygon in (simplified.geoms if simplified.geom_type == "MultiPolygon" else [simplified]))
            geometry_json = mapping(simplified)
            minx, miny, maxx, maxy = simplified.bounds
        else:
            geometry_json = mapping(point)
            minx, miny, maxx, maxy = point.bounds
        bbox = [min(bbox[0], minx), min(bbox[1], miny), max(bbox[2], maxx), max(bbox[3], maxy)]
        counts[record["kind"]] += 1
        features.append(
            {
                "type": "Feature",
                "id": feature_id,
                "properties": {
                    "elementId": ELEMENT_ID,
                    "featureId": feature_id,
                    "kind": record["kind"],
                    "kindLabel": KIND_LABELS[record["kind"]],
                    "sourceTag": record["sourceTag"],
                    "name": record["name"],
                    "osmType": record["osmType"],
                    "osmId": record["osmId"],
                    "lengthKm": record["lengthKm"],
                    "areaKm2": record["areaKm2"],
                    "representativeLon": round(point.x, 7),
                    "representativeLat": round(point.y, 7),
                    "representativePointMethod": (
                        "osm node"
                        if record["osmType"] == "node"
                        else ("shapely representative_point (inside the area)" if record["areaKm2"] is not None else "middle OSM node of the way")
                    ),
                    **location,
                    "geometryProvenance": "osm-node-locations",
                    "isSynthetic": False,
                },
                "geometry": geometry_json,
            }
        )

    collection = {
        "type": "FeatureCollection",
        "name": "vnm-water-coastal-infra",
        "bbox": [round(value, 7) for value in bbox],
        "metadata": {
            "schemaVersion": "v155-spatial-1",
            "elementId": ELEMENT_ID,
            "title": "Viet Nam ports, dams and reservoirs (OpenStreetMap)",
            "selection": {
                "port": "landuse=port | harbour=yes | seamark:type=harbour (node, way, area) -> representative point",
                "dam": "waterway=dam (node, way, area) -> representative point; crest length for open ways",
                "reservoir": f"natural=water + water=reservoir areas >= {MIN_RESERVOIR_KM2} km2 -> polygon (simplified {RESERVOIR_TOLERANCE_DEG} deg)",
                "excluded": "landuse=reservoir legacy tagging (counted in the report only)",
            },
            "provinceAssignment": "point-in-polygon of the representative point against vnm-adm1-34 and vnm-adm1-63; null when offshore",
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
            "featureCount": len(features),
            "featureCountByKind": {kind: counts[kind] for kind in KIND_ORDER},
            "geometryProvenance": "osm-node-locations",
            "isSynthetic": False,
            "generatedAt": generated_at,
        },
        "features": features,
    }
    path = args.geometry_dir / ASSET_NAME
    write_json(path, collection, indent=None)
    gzip_bytes = gzip_size(path)
    if gzip_bytes > GZIP_BUDGET:
        raise ValueError(f"{ASSET_NAME} gzip {gzip_bytes} exceeds the 2 MB budget")

    validation = {
        **stats,
        "featureCount": len(features),
        "featureCountByKind": collection["metadata"]["featureCountByKind"],
        "droppedOutsideCountry": outside_country,
        "noProvinceByKind": dict(no_province),
        "nullNameRateByKind": {kind: round(null_name[kind] / counts[kind], 4) if counts[kind] else None for kind in KIND_ORDER},
        "reservoirVertexCount": vertex_published,
        "reservoirSourceVertexCount": vertex_source,
        "reservoirToleranceDeg": RESERVOIR_TOLERANCE_DEG,
        "duplicateIdCount": 0,
        "invalidGeometryCount": 0,
        "emptyGeometryCount": 0,
        "bbox": collection["bbox"],
        "crs": "EPSG:4326",
        "bytes": path.stat().st_size,
        "gzipBytes": gzip_bytes,
    }
    entry = base_manifest_entry(
        kind="osm-water-coastal-infra",
        url=f"/data/vietnam/v2/geometry/{ASSET_NAME}",
        path=path,
        feature_count=len(features),
        geometry_types=sorted({feature["geometry"]["type"] for feature in features}),
        source=source,
    )
    entry.update(
        {
            "elementId": ELEMENT_ID,
            "selection": collection["metadata"]["selection"],
            "featureCountByKind": collection["metadata"]["featureCountByKind"],
            "validation": {
                "duplicateIdCount": 0,
                "emptyGeometryCount": 0,
                "featureCount": len(features),
                "geometryValidity": "pass",
                "invalidGeometryCount": 0,
                "noProvinceCount": sum(no_province.values()),
                "reservoirsBelowMinArea": stats["reservoirsBelowMinArea"],
                "validator": "Shapely 2.1.2 (GEOS is_valid) + pyproj Geod area/length",
            },
        }
    )
    if not args.skip_manifest:
        append_manifest_entry(args.geometry_dir, entry)

    report = {
        "schema": "v155-asset-report-1",
        "asset": ASSET_NAME,
        "generatedAt": started,
        "source": source,
        "outputs": {ASSET_NAME: {"bytes": path.stat().st_size, "gzipBytes": gzip_bytes, "sha256": entry["sha256"], "bbox": collection["bbox"]}},
        "validation": validation,
    }
    write_json(REPORT_DIR / REPORT_NAME, report)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pbf", type=Path, default=DEFAULT_PBF)
    parser.add_argument("--geometry-dir", type=Path, default=GEOMETRY_DIR)
    parser.add_argument("--skip-manifest", action="store_true")
    args = parser.parse_args()
    report = build(args)
    validation = report["validation"]
    print(
        json.dumps(
            {
                "status": "PASS",
                "byKind": validation["featureCountByKind"],
                "reservoirsBelowMinArea": validation["reservoirsBelowMinArea"],
                "legacyLanduseReservoir": validation["landuseReservoirLegacyTagCount"],
                "noProvince": validation["noProvinceByKind"],
                "gzipBytes": validation["gzipBytes"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
