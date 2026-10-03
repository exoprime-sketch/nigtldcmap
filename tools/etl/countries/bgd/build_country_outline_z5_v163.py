"""Build Bangladesh's display-only national outline (z5), the BGD counterpart of
Viet Nam's `vnm-country-outline-z5.geojson` (tools/vietnam_spatial/build_country_outline_v151_2.py).

Input is the committed full-detail outline `bgd-country-outline.geojson`, itself the
unary union of the 8 published divisions, so no coordinate is synthesized here.
The z5 copy is a Douglas-Peucker simplification (preserve_topology) for low zoom
levels only - the base map draws it in place of the coarse Natural Earth polygon,
which does not line up with the division boundaries. It is never used for area or
boundary analysis. Island parts below MIN_PART_KM2 after simplification are
dropped as slivers; the tolerance and drop count are recorded in the manifest.

Run: python tools/etl/countries/bgd/build_country_outline_z5_v163.py
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from pyproj import Geod
from shapely.geometry import MultiPolygon, Polygon, mapping, shape

ROOT = Path(__file__).resolve().parents[4]
GEOMETRY = ROOT / "public/data/bgd/v2/geometry"
SOURCE = GEOMETRY / "bgd-country-outline.geojson"
TARGET = GEOMETRY / "bgd-country-outline-z5.geojson"
MANIFEST = GEOMETRY / "geometry-manifest.json"
TOLERANCE_DEG = 0.005
MIN_PART_KM2 = 2.0
GEOD = Geod(ellps="WGS84")


def area_km2(geometry) -> float:
    return abs(GEOD.geometry_area_perimeter(geometry)[0]) / 1e6


def main() -> None:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    full = shape(source["features"][0]["geometry"])
    simplified = full.simplify(TOLERANCE_DEG, preserve_topology=True)
    parts = list(simplified.geoms) if isinstance(simplified, MultiPolygon) else [simplified]
    kept = [part for part in parts if area_km2(part) >= MIN_PART_KM2]
    dropped = len(parts) - len(kept)
    result = MultiPolygon(kept) if len(kept) > 1 else kept[0]
    if not result.is_valid:
        raise SystemExit("simplified outline is not valid")
    area_change_pct = (area_km2(result) - area_km2(full)) / area_km2(full) * 100
    feature = {
        "type": "Feature",
        "id": "BGD",
        "properties": {"iso3": "BGD", "nameEn": "Bangladesh", "display": "z5"},
        "geometry": mapping(result),
    }
    # Six decimals (~0.1 m) is far below the simplification tolerance.
    text = json.dumps({"type": "FeatureCollection", "features": [feature]}, separators=(",", ":"))
    text = json.dumps(json.loads(text, parse_float=lambda v: round(float(v), 6)), separators=(",", ":"))
    TARGET.write_text(text + "\n", encoding="utf-8")
    digest = hashlib.sha256(TARGET.read_bytes()).hexdigest()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    outline = next(asset for asset in manifest["assets"] if asset["kind"] == "country-outline")
    entry = {
        "attribution": outline["attribution"],
        "derivedFrom": {
            "asset": outline["url"],
            "method": f"shapely simplify(tolerance={TOLERANCE_DEG} deg, preserve_topology) of the full outline; parts < {MIN_PART_KM2} km2 dropped",
            "sha256": outline["sha256"],
        },
        "displayOnly": True,
        "droppedSliverParts": dropped,
        "featureCount": 1,
        "geometryTypes": [result.geom_type],
        "kind": "country-outline-z5",
        "license": outline["license"],
        "sha256": digest,
        "simplificationToleranceDeg": TOLERANCE_DEG,
        "source": outline["source"],
        "url": "/data/bgd/v2/geometry/bgd-country-outline-z5.geojson",
        "validation": {
            "areaChangePctSimplified": round(area_change_pct, 4),
            "keptParts": len(kept),
            "synthesizedVertices": 0,
            "valid": True,
            "validator": "Shapely (GEOS is_valid) + pyproj Geod area",
        },
        "version": "v163",
    }
    manifest["assets"] = [asset for asset in manifest["assets"] if asset["kind"] != "country-outline-z5"] + [entry]
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"bytes": TARGET.stat().st_size, "parts": len(parts), "kept": len(kept), "dropped": dropped, "areaChangePct": round(area_change_pct, 4)}))


if __name__ == "__main__":
    main()
