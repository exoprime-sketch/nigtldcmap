"""Independent check of the V155-1 geometry assets plus the static previews.

Reads the published files only (never the builders' in-memory state), reruns
the structural checks - feature count, bbox inside Viet Nam, GEOS validity,
duplicate ids, CRS note, property null rates - merges the builders' own reports
into ``reports/v155/assets-v155.json`` and draws one PNG per asset over the
2025 province boundary so a reviewer can eyeball the result.

Run:

    python tools/vietnam_spatial/verify_assets_v155.py
"""

from __future__ import annotations

import argparse
import json
import time
from collections import Counter
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.collections import LineCollection, PatchCollection  # noqa: E402
from matplotlib.patches import PathPatch  # noqa: E402
from matplotlib.path import Path as MplPath  # noqa: E402
from shapely.geometry import shape  # noqa: E402

from osm_common_v155 import GEOMETRY_DIR, REPORT_DIR, V2_ROOT, gzip_size, read_json, sha256_path, write_json  # noqa: E402


VIETNAM_BBOX = (102.0, 8.0, 110.0, 24.0)
ASSETS = [
    {"file": "vnm-aqueduct40-basins.geojson", "report": "aqueduct-basins-v155.json", "budgetGzip": 3 * 1024 * 1024, "png": "aqueduct-basins.png", "colorBy": "adm1Code34Primary"},
    {"file": "vnm-aqueduct40-basins-l6.geojson", "report": "aqueduct-basins-v155.json", "budgetGzip": 3 * 1024 * 1024, "png": "aqueduct-basins-l6.png", "colorBy": None},
    {"file": "vnm-roads-rail.geojson", "report": "roads-rail-v155.json", "budgetGzip": 4 * 1024 * 1024, "png": "roads-rail.png", "colorBy": "class"},
    {"file": "vnm-roads-rail-overview.geojson", "report": "roads-rail-v155.json", "budgetGzip": 1 * 1024 * 1024, "png": None, "colorBy": "class"},
    {"file": "vnm-water-coastal-infra.geojson", "report": "water-coastal-infra-v155.json", "budgetGzip": 2 * 1024 * 1024, "png": "water-coastal-infra.png", "colorBy": "kind"},
]
# Fixed categorical order; ink stays neutral, only marks carry these hues.
CLASS_COLORS = {"고속도로": "#b13f2a", "간선도로": "#d98b2b", "주요도로": "#8a8a3a", "철도": "#2f4a8a"}
KIND_COLORS = {"port": "#2a6f97", "dam": "#a23b72", "reservoir": "#3b8a6e"}
BOUNDARY_COLOR = "#9aa0a6"
# V155-2: three nested low-lying zones drawn together, darker = lower.
SLR_ASSETS = [
    {"file": "vnm-slr-lowland-le2m.geojson", "report": "slr-lowland-v155.json", "budgetGzip": 2 * 1024 * 1024, "zoneKey": "le2m", "color": "#a9cbe8", "label": "≤2 m"},
    {"file": "vnm-slr-lowland-le1m.geojson", "report": "slr-lowland-v155.json", "budgetGzip": 2 * 1024 * 1024, "zoneKey": "le1m", "color": "#4f8fc6", "label": "≤1 m"},
    {"file": "vnm-slr-lowland-le0p5m.geojson", "report": "slr-lowland-v155.json", "budgetGzip": 2 * 1024 * 1024, "zoneKey": "le0p5m", "color": "#17416b", "label": "≤0.5 m"},
]


def check_asset(path: Path, budget: int) -> dict[str, Any]:
    document = read_json(path)
    features = document["features"]
    ids = Counter(feature.get("id") for feature in features)
    duplicates = sum(1 for count in ids.values() if count > 1)
    invalid = 0
    empty = 0
    outside = 0
    geometry_types: Counter[str] = Counter()
    null_counts: Counter[str] = Counter()
    keys: Counter[str] = Counter()
    for feature in features:
        geometry = shape(feature["geometry"])
        geometry_types[feature["geometry"]["type"]] += 1
        if geometry.is_empty:
            empty += 1
            continue
        if not geometry.is_valid:
            invalid += 1
        minx, miny, maxx, maxy = geometry.bounds
        if minx < VIETNAM_BBOX[0] or miny < VIETNAM_BBOX[1] or maxx > VIETNAM_BBOX[2] or maxy > VIETNAM_BBOX[3]:
            outside += 1
        for key, value in feature["properties"].items():
            keys[key] += 1
            if value is None or value == "" or value == []:
                null_counts[key] += 1
    return {
        "featureCount": len(features),
        "declaredFeatureCount": document["metadata"].get("featureCount"),
        "bbox": document.get("bbox"),
        "crs": document["metadata"].get("crs"),
        "geometryTypes": dict(geometry_types),
        "duplicateIdCount": duplicates,
        "invalidGeometryCount": invalid,
        "emptyGeometryCount": empty,
        "outsideVietnamBboxCount": outside,
        "propertyNullRate": {key: round(null_counts[key] / len(features), 4) for key in sorted(keys) if null_counts[key]},
        "license": document["metadata"].get("license"),
        "attribution": document["metadata"].get("attribution"),
        "bytes": path.stat().st_size,
        "gzipBytes": gzip_size(path),
        "gzipBudgetBytes": budget,
        "withinGzipBudget": gzip_size(path) <= budget,
        "sha256": sha256_path(path),
    }


def polygon_patches(geometry_json: dict[str, Any]) -> list[PathPatch]:
    polygons = [geometry_json["coordinates"]] if geometry_json["type"] == "Polygon" else geometry_json["coordinates"]
    patches = []
    for polygon in polygons:
        vertices: list[tuple[float, float]] = []
        codes: list[int] = []
        for ring in polygon:
            ring_vertices = [(float(point[0]), float(point[1])) for point in ring]
            vertices.extend(ring_vertices)
            codes.extend([MplPath.MOVETO] + [MplPath.LINETO] * (len(ring_vertices) - 2) + [MplPath.CLOSEPOLY])
        patches.append(PathPatch(MplPath(vertices, codes)))
    return patches


def draw_boundary(axis: Any) -> None:
    boundary = read_json(GEOMETRY_DIR / "vnm-adm1-34.geojson")
    patches = [patch for feature in boundary["features"] for patch in polygon_patches(feature["geometry"])]
    axis.add_collection(PatchCollection(patches, facecolor="#f4f4f2", edgecolor=BOUNDARY_COLOR, linewidth=0.4))


def render(asset: dict[str, Any], document: dict[str, Any], output: Path) -> None:
    figure, axis = plt.subplots(figsize=(7, 11), dpi=110)
    draw_boundary(axis)
    features = document["features"]
    legend_handles = []
    if asset["colorBy"] == "class":
        for way_class, color in CLASS_COLORS.items():
            segments = [
                line
                for feature in features
                if feature["properties"]["class"] == way_class
                for line in feature["geometry"]["coordinates"]
            ]
            width = 0.9 if way_class == "고속도로" else 0.5
            axis.add_collection(LineCollection(segments, colors=color, linewidths=width))
            legend_handles.append(plt.Line2D([], [], color=color, linewidth=2, label=way_class))
    elif asset["colorBy"] == "kind":
        for kind, color in KIND_COLORS.items():
            subset = [feature for feature in features if feature["properties"]["kind"] == kind]
            if kind == "reservoir":
                patches = [patch for feature in subset for patch in polygon_patches(feature["geometry"])]
                axis.add_collection(PatchCollection(patches, facecolor=color, edgecolor=color, linewidth=0.3, alpha=0.8))
                legend_handles.append(plt.Rectangle((0, 0), 1, 1, color=color, label=f"저수지 ≥1 km² ({len(subset)})"))
            else:
                xs = [feature["geometry"]["coordinates"][0] for feature in subset]
                ys = [feature["geometry"]["coordinates"][1] for feature in subset]
                marker = "^" if kind == "port" else "o"
                axis.scatter(xs, ys, s=14 if kind == "port" else 5, c=color, marker=marker, linewidths=0, alpha=0.85)
                legend_handles.append(plt.Line2D([], [], color=color, marker=marker, linestyle="", label=f"{'항만' if kind == 'port' else '댐'} ({len(subset)})"))
    else:
        # Sequential-looking fill by feature index is meaningless; use one hue
        # with visible edges so unit boundaries read.
        color_by = asset["colorBy"]
        cmap = plt.get_cmap("tab20")
        if color_by:
            categories = sorted({feature["properties"].get(color_by) for feature in features}, key=str)
            lookup = {category: cmap(index % 20) for index, category in enumerate(categories)}
            for feature in features:
                patches = polygon_patches(feature["geometry"])
                axis.add_collection(PatchCollection(patches, facecolor=lookup[feature["properties"].get(color_by)], edgecolor="#ffffff", linewidth=0.25, alpha=0.85))
            legend_handles.append(plt.Rectangle((0, 0), 1, 1, color=cmap(0), label=f"평가구역 색 = {color_by}"))
        else:
            patches = [patch for feature in features for patch in polygon_patches(feature["geometry"])]
            axis.add_collection(PatchCollection(patches, facecolor="#7fb3d5", edgecolor="#1f4e79", linewidth=0.5, alpha=0.7))
            legend_handles.append(plt.Rectangle((0, 0), 1, 1, color="#7fb3d5", label=f"유역(lvl6) {len(features)}개"))
    axis.set_xlim(VIETNAM_BBOX[0], VIETNAM_BBOX[2])
    axis.set_ylim(VIETNAM_BBOX[1], VIETNAM_BBOX[3])
    axis.set_aspect(1 / 0.96)
    axis.set_title(f"{asset['file']} — {len(features)} features", fontsize=10, color="#333333")
    axis.tick_params(labelsize=7, colors="#666666")
    for spine in axis.spines.values():
        spine.set_color("#cccccc")
    axis.legend(handles=legend_handles, loc="lower left", fontsize=8, frameon=False)
    figure.tight_layout()
    figure.savefig(output)
    plt.close(figure)


def render_slr(documents: list[tuple[dict[str, Any], dict[str, Any]]], output: Path) -> None:
    """One PNG: the 34-unit boundary with the three zones stacked (≤2 m under ≤1 m under ≤0.5 m)."""

    figure, axis = plt.subplots(figsize=(7, 11), dpi=110)
    draw_boundary(axis)
    handles = []
    for asset, document in documents:
        patches = [patch for feature in document["features"] for patch in polygon_patches(feature["geometry"])]
        axis.add_collection(PatchCollection(patches, facecolor=asset["color"], edgecolor="none", alpha=0.95))
        total = sum(feature["properties"]["areaKm2"] for feature in document["features"])
        handles.append(plt.Rectangle((0, 0), 1, 1, color=asset["color"], label=f"{asset['label']} (EGM2008) · {total:,.0f} km²"))
    axis.set_xlim(VIETNAM_BBOX[0], VIETNAM_BBOX[2])
    axis.set_ylim(VIETNAM_BBOX[1], VIETNAM_BBOX[3])
    axis.set_aspect(1 / 0.96)
    axis.set_title("B-008 개략 저지대(Copernicus DEM GLO-30, 해안 연결) — 침수 예측 아님", fontsize=10, color="#333333")
    axis.tick_params(labelsize=7, colors="#666666")
    for spine in axis.spines.values():
        spine.set_color("#cccccc")
    axis.legend(handles=handles, loc="lower left", fontsize=8, frameon=False)
    figure.tight_layout()
    figure.savefig(output)
    plt.close(figure)


def main_v155_2() -> None:
    """Check the V155-2 assets (SLR zones + D-022 draft) and write assets-v155-2.json."""

    plt.rcParams["font.family"] = ["Malgun Gothic", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False
    results: dict[str, Any] = {}
    documents = []
    for asset in SLR_ASSETS:
        path = GEOMETRY_DIR / asset["file"]
        result = check_asset(path, asset["budgetGzip"])
        if result["duplicateIdCount"] or result["emptyGeometryCount"] or result["outsideVietnamBboxCount"] or result["invalidGeometryCount"]:
            raise SystemExit(f"{asset['file']}: structural check failed {result}")
        if result["featureCount"] != result["declaredFeatureCount"]:
            raise SystemExit(f"{asset['file']}: declared featureCount differs from the file")
        if not result["withinGzipBudget"]:
            raise SystemExit(f"{asset['file']}: gzip over budget")
        document = read_json(path)
        result["totalAreaKm2"] = round(sum(feature["properties"]["areaKm2"] for feature in document["features"]), 3)
        result["unitCount"] = len({feature["properties"]["adm1Code34"] for feature in document["features"]})
        result["accuracyNotice"] = document["metadata"].get("accuracyNotice")
        result["verticalDatum"] = document["metadata"].get("verticalDatum")
        result["builderReport"] = f"reports/v155/{asset['report']}"
        results[asset["file"]] = result
        documents.append((asset, document))
    output = REPORT_DIR / "slr-lowland.png"
    render_slr(documents, output)
    preview = output.relative_to(REPORT_DIR.parent.parent).as_posix()
    for result in results.values():
        result["preview"] = preview

    manifest = read_json(GEOMETRY_DIR / "geometry-manifest.json")
    manifest_kinds = [item["kind"] for item in manifest["assets"]]
    pending = V2_ROOT / "spatial" / "pending-v155"
    by_adm1 = read_json(pending / "b-008-lowland-by-adm1.json")
    zones_table = read_json(pending / "b-008-slr-zones.json")
    d022 = read_json(pending / "d-022-locations.json")
    summary = {
        "schema": "v155-assets-report-1",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "assets": results,
        "b008Drafts": {
            "lowlandByAdm1": {"path": "public/data/vietnam/v2/spatial/pending-v155/b-008-lowland-by-adm1.json", "unitCount": len(by_adm1["units"]), "totals": by_adm1["totals"], "gzipBytes": gzip_size(pending / "b-008-lowland-by-adm1.json")},
            "slrZones": {"path": "public/data/vietnam/v2/spatial/pending-v155/b-008-slr-zones.json", "entryCount": zones_table["entryCount"], "zoneKeyCounts": dict(Counter(entry["zoneKey"] for entry in zones_table["entries"])), "gzipBytes": gzip_size(pending / "b-008-slr-zones.json")},
        },
        "d022Draft": {"path": "public/data/vietnam/v2/spatial/pending-v155/d-022-locations.json", **d022["validation"], "gzipBytes": gzip_size(pending / "d-022-locations.json")},
        "manifestKindsAppended": manifest_kinds[-3:],
        "previews": [preview],
        "builderReports": {name: read_json(REPORT_DIR / name) for name in ("slr-lowland-v155.json", "d-022-locations-v155.json")},
    }
    write_json(REPORT_DIR / "assets-v155-2.json", summary)
    print(json.dumps({name: {"features": item["featureCount"], "areaKm2": item["totalAreaKm2"], "gzipBytes": item["gzipBytes"], "invalid": item["invalidGeometryCount"]} for name, item in results.items()}, ensure_ascii=False))
    print("preview:", preview)


def main() -> None:
    plt.rcParams["font.family"] = ["Malgun Gothic", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False
    results: dict[str, Any] = {}
    previews: list[str] = []
    for asset in ASSETS:
        path = GEOMETRY_DIR / asset["file"]
        result = check_asset(path, asset["budgetGzip"])
        if result["duplicateIdCount"] or result["emptyGeometryCount"] or result["outsideVietnamBboxCount"]:
            raise SystemExit(f"{asset['file']}: structural check failed {result}")
        if result["featureCount"] != result["declaredFeatureCount"]:
            raise SystemExit(f"{asset['file']}: declared featureCount differs from the file")
        if not result["withinGzipBudget"]:
            raise SystemExit(f"{asset['file']}: gzip over budget")
        if asset["png"]:
            output = REPORT_DIR / asset["png"]
            render(asset, read_json(path), output)
            previews.append(output.relative_to(REPORT_DIR.parent.parent).as_posix())
            result["preview"] = previews[-1]
        result["builderReport"] = f"reports/v155/{asset['report']}"
        results[asset["file"]] = result

    draft_path = V2_ROOT / "spatial" / "pending-v155" / "b-017.json"
    draft = read_json(draft_path)
    manifest = read_json(GEOMETRY_DIR / "geometry-manifest.json")
    manifest_kinds = [item["kind"] for item in manifest["assets"]]
    builder_reports = {name: read_json(REPORT_DIR / name) for name in sorted({asset["report"] for asset in ASSETS})}
    summary = {
        "schema": "v155-assets-report-1",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "assets": results,
        "b017Draft": {
            "path": "public/data/vietnam/v2/spatial/pending-v155/b-017.json",
            "pending": draft["pending"],
            "publishedValueCount": draft["validation"]["publishedValueCount"],
            "matchedUnitCount": draft["validation"]["matchedUnitCount"],
            "geometryMissingUnitIds": draft["validation"]["geometryMissingUnitIds"],
            "joinMatchRate": builder_reports["aqueduct-basins-v155.json"]["validation"]["joinMatchRate"],
            "gzipBytes": gzip_size(draft_path),
        },
        "manifestKindsAppended": manifest_kinds[-5:],
        "previews": previews,
        "builderReports": builder_reports,
    }
    write_json(REPORT_DIR / "assets-v155.json", summary)
    print(json.dumps({name: {"features": item["featureCount"], "gzipBytes": item["gzipBytes"], "invalid": item["invalidGeometryCount"]} for name, item in results.items()}, ensure_ascii=False))
    print("previews:", previews)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--set", choices=["v155-1", "v155-2"], default="v155-1", help="v155-1 = P6a assets (default), v155-2 = SLR zones + D-022 draft")
    if parser.parse_args().set == "v155-2":
        main_v155_2()
    else:
        main()
