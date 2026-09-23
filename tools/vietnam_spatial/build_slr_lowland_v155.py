"""Build the B-008 coastal low-lying land zones from Copernicus DEM GLO-30 (V155-2).

Method ("bathtub" with coastal connectivity, deliberately coarse):

1. 1-degree Copernicus DEM GLO-30 COG tiles that touch the 30 km coastal
   buffer of Viet Nam are downloaded from the AWS Open Data bucket into
   ``_source/vietnam/v155/dem`` (never committed; names, sizes, SHA-256 and
   download times go to ``dem-manifest.json``).
2. Per tile, cells are classed by height: <= 2 m, <= 1 m, <= 0.5 m (heights are
   Copernicus DSM values above the EGM2008 geoid - no tidal datum correction).
   Sea seed cells are ``height <= 0`` more than ~1 km outside every land
   polygon (Viet Nam 63-unit union + neighbouring countries), so border slivers
   never seed the fill.
3. Only cells within 30 km of the sea are kept (distance transform on a
   20x-coarsened sea mask, +-0.6 km).
4. For each threshold the cells are labelled with 8-connectivity per tile and
   the labels are merged across tile edges with a union-find; only components
   that contain a sea seed survive, which removes inland isolated depressions.
5. Surviving land cells (inside the rasterized Viet Nam polygon, excluding
   cells at exactly 0.0 m, which Copernicus uses for edited sea, estuary and
   river surfaces) are split by the rasterized 2025 34-unit provinces, turned
   into polygons (rasterio shapes; tile-edge pieces unioned), filtered to
   >= 0.25 km2 (polygons and holes) and simplified by ~30 m.

Outputs: three GeoJSON assets (one per threshold, each gzip <= 2 MB), manifest
entries, ``spatial/pending-v155/b-008-lowland-by-adm1.json``,
``spatial/pending-v155/b-008-slr-zones.json`` (lookup table from the b-008.csv
projections to the three zones - no interpolation) and
``reports/v155/slr-lowland-v155.json``.

This is NOT a flood prediction: dykes, sea walls, subsidence, tides and storm
surge are not represented. The notice below travels with every output.

Run:

    python tools/vietnam_spatial/build_slr_lowland_v155.py --stage all
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import rasterio
import shapely
import requests
from rasterio import features as rio_features
from scipy import ndimage
from shapely import clip_by_rect
from shapely.geometry import MultiPolygon, Polygon, box, mapping, shape
from shapely.ops import unary_union
from shapely.validation import make_valid

from osm_common_v155 import (
    GEOMETRY_DIR,
    REPORT_DIR,
    REPOSITORY_ROOT,
    V2_ROOT,
    ProvinceLookup,
    append_manifest_entry,
    geodesic_area_km2,
    gzip_size,
    read_json,
    sha256_path,
    write_json,
)


ELEMENT_ID = "B-008"
DEM_DIR = REPOSITORY_ROOT / "_source" / "vietnam" / "v155" / "dem"
WORK_DIR = DEM_DIR / "work"
DEM_MANIFEST = DEM_DIR / "dem-manifest.json"
PENDING_DIR = V2_ROOT / "spatial" / "pending-v155"
BUCKET_URL = "https://copernicus-dem-30m.s3.amazonaws.com"
TILE_LIST_URL = f"{BUCKET_URL}/tileList.txt"
WORLD_COUNTRIES = REPOSITORY_ROOT / "public" / "data" / "world-countries.geojson"
NEIGHBOUR_ISO3 = ("CHN", "LAO", "KHM", "THA")
B008_CSV = V2_ROOT / "downloads" / "b-008.csv"

THRESHOLDS: list[tuple[str, float]] = [("le0p5m", 0.5), ("le1m", 1.0), ("le2m", 2.0)]
ZONE_LABELS = {"le0p5m": "≤0.5 m", "le1m": "≤1 m", "le2m": "≤2 m"}
COAST_BUFFER_KM = 30.0
COAST_BUFFER_DEG = 0.28  # tile selection only; the 30 km rule itself is applied on the raster
MAX_LON = 110.0  # mainland and near-shore islands only
BORDER_EXCLUSION_DEG = 0.3  # boundary parts this close to CHN/LAO/KHM polygons are land borders, not coast
SEED_LAND_BUFFER_DEG = 0.009  # ~1 km at Viet Nam's latitudes
MIN_AREA_KM2 = 0.25
SIMPLIFY_STEPS_DEG = [0.00027, 0.0004, 0.00054]  # ~30 m, then 45 m and 60 m only if over budget
GZIP_BUDGET = 2 * 1024 * 1024
COARSEN = 20
NODATA = -32767.0
BIT_VALID, BIT_LE2, BIT_LE1, BIT_LE05, BIT_SEED, BIT_LAND, BIT_WATER0 = 1, 2, 4, 8, 16, 32, 64
STRUCTURE8 = np.ones((3, 3), dtype=bool)

SOURCE_NAME = "Copernicus DEM GLO-30 (ESA / Airbus, DLR)"
SOURCE_URL = "https://registry.opendata.aws/copernicus-dem/"
SOURCE_DOC_URL = "https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model"
LICENSE = "Copernicus DEM licence (free access, attribution required)"
LICENSE_URL = "https://spacedata.copernicus.eu/documents/20123/121286/CSCDA_ESA_Mission-specific+Annex_31_Oct_22.pdf"
ATTRIBUTION = (
    "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under "
    "COPERNICUS by the European Union and ESA; all rights reserved. Copernicus DEM GLO-30 "
    "COG tiles from the AWS Open Data bucket copernicus-dem-30m."
)
LOWLAND_NOTICE = (
    "30 m 공개 DEM 기반 개략 저지대. 방조제·제방·지반침하·조석·폭풍해일 미반영. "
    "실제 침수 예측이 아니며 상세 계획에는 사용 불가."
)
DATUM_NOTICE = (
    "높이는 Copernicus DEM GLO-30(DSM, EGM2008 지오이드 기준) 값이며 조위 기준면 보정 없음. "
    "수목·건물 높이가 포함돼 맹그로브·시가지에서 저지대가 과소 산정될 수 있음."
)
METHOD_NOTE = (
    f"해안 {COAST_BUFFER_KM:.0f} km 안에서 해발 임계값 이하 셀 중 바다와 8방향으로 연결된 셀만 유지(내륙 고립 저지대 제외). "
    f"높이가 정확히 0.0 m인 셀(Copernicus가 편집한 해수·하구·하천 수면)은 연결 경로로만 쓰고 저지대에서 제외. "
    f"래스터→폴리곤 후 육지 경계(성·시 폴리곤)로 자르고 {MIN_AREA_KM2} km² 미만 폴리곤·구멍 제거, 위상 보존 단순화."
)
CRS_NOTE = "OGC:CRS84 (longitude, latitude; equivalent datum to EPSG:4326)"


# ---------------------------------------------------------------------------
# tiles


def tile_name(lat: int, lon: int) -> str:
    return f"Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM"


def tile_url(name: str) -> str:
    return f"{BUCKET_URL}/{name}/{name}.tif"


def land_polygons(lookup: ProvinceLookup) -> tuple[Any, Any, Any]:
    """Return (Viet Nam land, neighbouring land, all land) as valid geometries."""

    world = read_json(WORLD_COUNTRIES)
    neighbours = make_valid(
        unary_union(
            [
                make_valid(shape(feature["geometry"]))
                for feature in world["features"]
                if feature["properties"].get("iso3") in NEIGHBOUR_ISO3
            ]
        )
    )
    country = lookup.country
    return country, neighbours, make_valid(unary_union([country, neighbours]))


def coastline(country: Any, neighbours: Any) -> Any:
    """Boundary of Viet Nam away from the land borders (low-resolution neighbours)."""

    return country.boundary.difference(neighbours.buffer(BORDER_EXCLUSION_DEG))


def select_tiles(country: Any, neighbours: Any) -> list[tuple[int, int]]:
    zone = coastline(country, neighbours).buffer(COAST_BUFFER_DEG)
    minx, miny, maxx, maxy = zone.bounds
    tiles = []
    for lat in range(math.floor(miny), math.ceil(maxy)):
        for lon in range(math.floor(minx), math.ceil(maxx)):
            if lon + 1 > MAX_LON:
                continue  # offshore archipelago tiles east of 110E are out of scope
            cell = box(lon, lat, lon + 1, lat + 1)
            if cell.intersects(zone):
                tiles.append((lat, lon))
    return tiles


def fetch_tile_list() -> set[str]:
    response = requests.get(TILE_LIST_URL, timeout=60)
    response.raise_for_status()
    return {line.strip() for line in response.text.splitlines() if line.strip()}


def download_tiles(tiles: list[tuple[int, int]]) -> dict[str, Any]:
    DEM_DIR.mkdir(parents=True, exist_ok=True)
    manifest = read_json(DEM_MANIFEST) if DEM_MANIFEST.exists() else {"tiles": {}}
    available = fetch_tile_list()
    missing_in_bucket = []
    for lat, lon in tiles:
        name = tile_name(lat, lon)
        if name not in available:
            missing_in_bucket.append(name)
            continue
        target = DEM_DIR / f"{name}.tif"
        recorded = manifest["tiles"].get(name)
        if target.exists() and recorded and target.stat().st_size == recorded["bytes"] and sha256_path(target) == recorded["sha256"]:
            continue
        url = tile_url(name)
        for attempt in range(3):
            try:
                with requests.get(url, stream=True, timeout=120) as response:
                    response.raise_for_status()
                    part = target.with_suffix(".tif.part")
                    digest = hashlib.sha256()
                    with part.open("wb") as handle:
                        for chunk in response.iter_content(1 << 20):
                            handle.write(chunk)
                            digest.update(chunk)
                    part.replace(target)
                    manifest["tiles"][name] = {
                        "url": url,
                        "bytes": target.stat().st_size,
                        "sha256": digest.hexdigest(),
                        "etag": response.headers.get("ETag"),
                        "lastModified": response.headers.get("Last-Modified"),
                        "downloadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                    print(f"downloaded {name} {target.stat().st_size} B", flush=True)
                break
            except (requests.RequestException, OSError) as error:
                print(f"retry {attempt + 1} {name}: {error}", flush=True)
                if attempt == 2:
                    raise
                time.sleep(5)
        write_json(DEM_MANIFEST, manifest)
    manifest["tileListUrl"] = TILE_LIST_URL
    manifest["bucketUrl"] = BUCKET_URL
    manifest["selectedTiles"] = [tile_name(lat, lon) for lat, lon in tiles]
    manifest["missingInBucket"] = missing_in_bucket
    manifest["selectionRule"] = (
        f"1-degree tiles west of {MAX_LON:.0f}E intersecting the {COAST_BUFFER_DEG} deg buffer of the Viet Nam coastline "
        f"(63-unit boundary minus the {BORDER_EXCLUSION_DEG} deg buffer of CHN/LAO/KHM/THA polygons from world-countries.geojson)"
    )
    write_json(DEM_MANIFEST, manifest)
    return manifest


# ---------------------------------------------------------------------------
# per-tile classification


def rasterize(geometry: Any, transform: Any, shape_: tuple[int, int]) -> np.ndarray:
    if geometry.is_empty:
        return np.zeros(shape_, dtype=bool)
    geoms = list(geometry.geoms) if geometry.geom_type.startswith("Multi") or geometry.geom_type == "GeometryCollection" else [geometry]
    geoms = [g for g in geoms if g.geom_type in ("Polygon", "MultiPolygon") and not g.is_empty]
    if not geoms:
        return np.zeros(shape_, dtype=bool)
    return rio_features.rasterize(((mapping(g), 1) for g in geoms), out_shape=shape_, transform=transform, fill=0, dtype="uint8").astype(bool)


def classify_tile(name: str, country: Any, all_land_buffered: Any, units34: list[dict[str, Any]]) -> dict[str, Any]:
    path = DEM_DIR / f"{name}.tif"
    with rasterio.open(path) as dataset:
        dem = dataset.read(1).astype(np.float32)
        transform = dataset.transform
        nodata = dataset.nodata if dataset.nodata is not None else NODATA
        bounds = dataset.bounds
    height, width = dem.shape
    valid = dem != nodata
    window = box(bounds.left - 0.01, bounds.bottom - 0.01, bounds.right + 0.01, bounds.top + 0.01)
    land_exact = rasterize(clip_by_rect(country, *window.bounds), transform, dem.shape)
    land_buffered = rasterize(clip_by_rect(all_land_buffered, *window.bounds), transform, dem.shape)
    classes = np.zeros(dem.shape, dtype=np.uint8)
    classes[valid] |= BIT_VALID
    classes[valid & (dem <= 2.0)] |= BIT_LE2
    classes[valid & (dem <= 1.0)] |= BIT_LE1
    classes[valid & (dem <= 0.5)] |= BIT_LE05
    classes[valid & (dem <= 0.0) & ~land_buffered] |= BIT_SEED
    classes[land_exact] |= BIT_LAND
    # Copernicus DEM edits sea, bays, estuaries and coastal river reaches to
    # exactly 0.0 m; those cells carry connectivity but are water, not land.
    classes[valid & (dem == 0.0)] |= BIT_WATER0
    # Province code raster (1-based index into units34; 0 = no unit) so the
    # zones are split by province on the grid, without vector intersections.
    unit_shapes = []
    for index, unit in enumerate(units34, start=1):
        clipped = clip_by_rect(unit["geometry"], *window.bounds)
        for part in (clipped.geoms if hasattr(clipped, "geoms") else [clipped]):
            if part.geom_type in ("Polygon", "MultiPolygon") and not part.is_empty:
                unit_shapes.append((mapping(part), index))
    units = rio_features.rasterize(unit_shapes, out_shape=dem.shape, transform=transform, fill=0, dtype="uint8") if unit_shapes else np.zeros(dem.shape, dtype=np.uint8)
    seed = (classes & BIT_SEED) > 0
    coarse_h, coarse_w = height // COARSEN, width // COARSEN
    coarse_seed = seed[: coarse_h * COARSEN, : coarse_w * COARSEN].reshape(coarse_h, COARSEN, coarse_w, COARSEN).any(axis=(1, 3))
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(WORK_DIR / f"{name}.class.npz", classes=classes, units=units, coarse_seed=coarse_seed, transform=np.array(transform.to_gdal()), bounds=np.array([bounds.left, bounds.bottom, bounds.right, bounds.top]))
    row_lat = np.array([transform * (0, r + 0.5) for r in range(height)])[:, 1]
    return {
        "name": name,
        "shape": [height, width],
        "bounds": [bounds.left, bounds.bottom, bounds.right, bounds.top],
        "pixelDeg": [transform.a, -transform.e],
        "validCells": int(valid.sum()),
        "landCells": int(land_exact.sum()),
        "seedCells": int(seed.sum()),
        "rowLatitudes": row_lat,
    }


def cell_area_km2_by_row(row_lat: np.ndarray, pixel_deg: tuple[float, float]) -> np.ndarray:
    """Approximate geodesic cell area per row (WGS84, metres per degree)."""

    dx_deg, dy_deg = pixel_deg
    lat = np.radians(row_lat)
    m_per_deg_lat = 111132.954 - 559.822 * np.cos(2 * lat) + 1.175 * np.cos(4 * lat)
    m_per_deg_lon = (math.pi / 180) * 6378137.0 * np.cos(lat) / np.sqrt(1 - 0.00669437999014 * np.sin(lat) ** 2)
    return (dx_deg * m_per_deg_lon) * (dy_deg * m_per_deg_lat) / 1e6


# ---------------------------------------------------------------------------
# coastal distance (coarse mosaic)


def coastal_mask_per_tile(tile_infos: list[dict[str, Any]]) -> dict[str, np.ndarray]:
    lats = sorted({int(round(info["bounds"][1])) for info in tile_infos})
    lons = sorted({int(round(info["bounds"][0])) for info in tile_infos})
    lat0, lat1 = lats[0], lats[-1] + 1
    lon0, lon1 = lons[0], lons[-1] + 1
    ch = int(3600 // COARSEN)
    mosaic = np.zeros(((lat1 - lat0) * ch, (lon1 - lon0) * ch), dtype=bool)
    for info in tile_infos:
        data = np.load(WORK_DIR / f"{info['name']}.class.npz")
        coarse = data["coarse_seed"]
        lat = int(round(info["bounds"][1]))
        lon = int(round(info["bounds"][0]))
        r0 = (lat1 - lat - 1) * ch
        c0 = (lon - lon0) * ch
        mosaic[r0 : r0 + coarse.shape[0], c0 : c0 + coarse.shape[1]] = coarse
    mid_lat = math.radians((lat0 + lat1) / 2)
    dy_km = (1.0 / ch) * 111.13
    dx_km = (1.0 / ch) * 111.32 * math.cos(mid_lat)
    distance = ndimage.distance_transform_edt(~mosaic, sampling=(dy_km, dx_km))
    near = distance <= COAST_BUFFER_KM
    result = {}
    for info in tile_infos:
        lat = int(round(info["bounds"][1]))
        lon = int(round(info["bounds"][0]))
        r0 = (lat1 - lat - 1) * ch
        c0 = (lon - lon0) * ch
        coarse_near = near[r0 : r0 + ch, c0 : c0 + ch]
        result[info["name"]] = np.repeat(np.repeat(coarse_near, COARSEN, axis=0), COARSEN, axis=1)
    return result


# ---------------------------------------------------------------------------
# connectivity across tiles


class DisjointSet:
    def __init__(self) -> None:
        self.parent: dict[tuple[int, int], tuple[int, int]] = {}

    def find(self, item: tuple[int, int]) -> tuple[int, int]:
        parent = self.parent.setdefault(item, item)
        while parent != item:
            grand = self.parent.setdefault(parent, parent)
            self.parent[item] = grand
            item, parent = parent, grand
        return item

    def union(self, a: tuple[int, int], b: tuple[int, int]) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[rb] = ra


def label_tiles(tile_infos: list[dict[str, Any]], near_by_tile: dict[str, np.ndarray], zone_key: str, bit: int) -> dict[str, Any]:
    """Label per tile, merge across edges, return kept-cell statistics per tile."""

    edges: dict[str, dict[str, np.ndarray]] = {}
    seed_labels: dict[str, np.ndarray] = {}
    index_of = {info["name"]: i for i, info in enumerate(tile_infos)}
    for info in tile_infos:
        data = np.load(WORK_DIR / f"{info['name']}.class.npz")
        classes = data["classes"]
        seed = (classes & BIT_SEED) > 0
        mask = (((classes & bit) > 0) & near_by_tile[info["name"]]) | seed
        labels, count = ndimage.label(mask, structure=STRUCTURE8)
        labels = labels.astype(np.int32)
        np.save(WORK_DIR / f"{info['name']}.{zone_key}.labels.npy", labels)
        seed_labels[info["name"]] = np.unique(labels[seed])
        edges[info["name"]] = {"top": labels[0, :].copy(), "bottom": labels[-1, :].copy(), "left": labels[:, 0].copy(), "right": labels[:, -1].copy()}
    dsu = DisjointSet()
    by_pos = {(int(round(info["bounds"][1])), int(round(info["bounds"][0]))): info["name"] for info in tile_infos}

    def join_edges(name_a: str, edge_a: np.ndarray, name_b: str, edge_b: np.ndarray) -> None:
        ia, ib = index_of[name_a], index_of[name_b]
        n = min(len(edge_a), len(edge_b))
        for shift in (-1, 0, 1):  # 8-connectivity across the shared edge
            if shift == 0:
                a, b = edge_a[:n], edge_b[:n]
            elif shift == 1:
                a, b = edge_a[: n - 1], edge_b[1:n]
            else:
                a, b = edge_a[1:n], edge_b[: n - 1]
            both = (a > 0) & (b > 0)
            pairs = np.unique(np.stack([a[both], b[both]], axis=1), axis=0) if both.any() else np.empty((0, 2), dtype=np.int32)
            for la, lb in pairs:
                dsu.union((ia, int(la)), (ib, int(lb)))

    for (lat, lon), name in by_pos.items():
        south = by_pos.get((lat - 1, lon))
        if south:
            join_edges(name, edges[name]["bottom"], south, edges[south]["top"])
        east = by_pos.get((lat, lon + 1))
        if east:
            join_edges(name, edges[name]["right"], east, edges[east]["left"])
        # Diagonal corner neighbours (4-tile corners).
        for dlat, dlon, corner_a, corner_b in ((-1, 1, ("bottom", -1), ("top", 0)), (-1, -1, ("bottom", 0), ("top", -1))):
            other = by_pos.get((lat + dlat, lon + dlon))
            if other:
                la = int(edges[name][corner_a[0]][corner_a[1]])
                lb = int(edges[other][corner_b[0]][corner_b[1]])
                if la > 0 and lb > 0:
                    dsu.union((index_of[name], la), (index_of[other], lb))

    seed_roots = {dsu.find((index_of[name], int(label))) for name, labels in seed_labels.items() for label in labels if label > 0}
    kept: dict[str, np.ndarray] = {}
    isolated_cells = 0
    for info in tile_infos:
        labels = np.load(WORK_DIR / f"{info['name']}.{zone_key}.labels.npy")
        unique = np.unique(labels)
        unique = unique[unique > 0]
        i = index_of[info["name"]]
        connected = np.array([label for label in unique if dsu.find((i, int(label))) in seed_roots], dtype=np.int32)
        keep_mask = np.isin(labels, connected)
        data = np.load(WORK_DIR / f"{info['name']}.class.npz")
        classes = data["classes"]
        seed = (classes & BIT_SEED) > 0
        candidate = ((classes & bit) > 0) & near_by_tile[info["name"]] & ~seed
        isolated_cells += int((candidate & ~keep_mask).sum())
        kept[info["name"]] = keep_mask & ~seed
        np.save(WORK_DIR / f"{info['name']}.{zone_key}.kept.npy", kept[info["name"]])
    return {"isolatedCellsRemoved": isolated_cells}


# ---------------------------------------------------------------------------
# polygons (raster partition: land and province splits happen on the grid)


def tile_transform(info: dict[str, Any]) -> Any:
    data = np.load(WORK_DIR / f"{info['name']}.class.npz")
    return rasterio.Affine.from_gdal(*data["transform"].tolist())


def explode(geometry: Any) -> list[Polygon]:
    if geometry is None or geometry.is_empty:
        return []
    if geometry.geom_type == "Polygon":
        return [geometry]
    if hasattr(geometry, "geoms"):
        return [g for part in geometry.geoms for g in explode(part)]
    return []


def planar_area_km2(polygon: Any, lat: float) -> float:
    """Fast pre-filter estimate (equirectangular); exact geodesic area decides borderline cases."""

    return polygon.area * 111.13 * 111.32 * math.cos(math.radians(lat))


def touches_tile_edge(polygon: Polygon, bounds: list[float]) -> bool:
    minx, miny, maxx, maxy = polygon.bounds
    eps = 1e-7
    return minx <= bounds[0] + eps or miny <= bounds[1] + eps or maxx >= bounds[2] - eps or maxy >= bounds[3] - eps


def keep_by_area(polygon: Polygon) -> Polygon | None:
    """Drop polygons under MIN_AREA_KM2 and fill holes under MIN_AREA_KM2 (geodesic)."""

    lat = polygon.centroid.y
    outer = Polygon(polygon.exterior)
    estimate = planar_area_km2(outer, lat)
    if estimate < MIN_AREA_KM2 * 0.8:
        return None
    if estimate < MIN_AREA_KM2 * 1.25 and geodesic_area_km2(outer) < MIN_AREA_KM2:
        return None
    holes = []
    for interior in polygon.interiors:
        ring = Polygon(interior)
        estimate = planar_area_km2(ring, lat)
        if estimate >= MIN_AREA_KM2 * 1.25 or (estimate >= MIN_AREA_KM2 * 0.8 and geodesic_area_km2(ring) >= MIN_AREA_KM2):
            holes.append(interior)
    return Polygon(polygon.exterior, holes)


def polygonize_zone(tile_infos: list[dict[str, Any]], zone_key: str, unit_codes: list[str]) -> tuple[dict[str, list[Polygon]], dict[str, float], dict[str, Any]]:
    """Per province: polygons of kept land cells; edge-touching pieces are unioned across tiles."""

    interior_polys: dict[str, list[Polygon]] = defaultdict(list)
    edge_polys: dict[str, list[Polygon]] = defaultdict(list)
    raster_area: dict[str, float] = defaultdict(float)
    stats = {"rasterLandCells": 0, "rasterLandAreaKm2": 0.0, "shapePolygons": 0, "droppedSmallPolygons": 0, "filledSmallHoles": 0, "edgePolygonsUnioned": 0, "landCellsWithoutUnit": 0, "waterSurfaceCellsExcluded": 0, "waterSurfaceAreaExcludedKm2": 0.0}
    for info in tile_infos:
        kept = np.load(WORK_DIR / f"{info['name']}.{zone_key}.kept.npy")
        data = np.load(WORK_DIR / f"{info['name']}.class.npz")
        land = (data["classes"] & BIT_LAND) > 0
        water0 = (data["classes"] & BIT_WATER0) > 0
        units = data["units"]
        areas = cell_area_km2_by_row(info["rowLatitudes"], tuple(info["pixelDeg"]))
        excluded_water = kept & land & water0
        stats["waterSurfaceCellsExcluded"] += int(excluded_water.sum())
        stats["waterSurfaceAreaExcludedKm2"] += float((excluded_water.sum(axis=1) * areas).sum())
        kept_land = kept & land & ~water0
        if not kept_land.any():
            continue
        stats["rasterLandCells"] += int(kept_land.sum())
        stats["rasterLandAreaKm2"] += float((kept_land.sum(axis=1) * areas).sum())
        stats["landCellsWithoutUnit"] += int((kept_land & (units == 0)).sum())
        transform = tile_transform(info)
        for code_index in np.unique(units[kept_land]):
            if code_index == 0:
                continue
            code = unit_codes[int(code_index) - 1]
            mask = kept_land & (units == code_index)
            raster_area[code] += float((mask.sum(axis=1) * areas).sum())
            for geometry, value in rio_features.shapes(mask.astype(np.uint8), mask=mask, transform=transform, connectivity=8):
                if value != 1:
                    continue
                polygon = shape(geometry)
                stats["shapePolygons"] += 1
                if touches_tile_edge(polygon, info["bounds"]):
                    edge_polys[code].append(polygon)
                else:
                    kept_polygon = keep_by_area(polygon)
                    if kept_polygon is None:
                        stats["droppedSmallPolygons"] += 1
                    else:
                        stats["filledSmallHoles"] += len(polygon.interiors) - len(kept_polygon.interiors)
                        interior_polys[code].append(kept_polygon)
    result: dict[str, list[Polygon]] = {}
    for code in set(interior_polys) | set(edge_polys):
        merged = []
        if edge_polys.get(code):
            stats["edgePolygonsUnioned"] += len(edge_polys[code])
            for polygon in explode(unary_union(edge_polys[code])):
                kept_polygon = keep_by_area(polygon)
                if kept_polygon is None:
                    stats["droppedSmallPolygons"] += 1
                else:
                    stats["filledSmallHoles"] += len(polygon.interiors) - len(kept_polygon.interiors)
                    merged.append(kept_polygon)
        merged.extend(interior_polys.get(code, []))
        if merged:
            result[code] = merged
    stats["rasterLandAreaKm2"] = round(stats["rasterLandAreaKm2"], 3)
    stats["waterSurfaceAreaExcludedKm2"] = round(stats["waterSurfaceAreaExcludedKm2"], 3)
    return result, raster_area, stats


def simplify_all(polygons: list[Polygon], tolerance: float) -> list[Polygon]:
    result = []
    for polygon in polygons:
        simplified = polygon.simplify(tolerance, preserve_topology=True)
        if not simplified.is_valid:
            simplified = make_valid(simplified)
        result.extend(explode(simplified))
    return result


def build_zone_features(zone_key: str, threshold: float, by_code: dict[str, list[Polygon]], raster_area: dict[str, float], lookup: ProvinceLookup, unit_areas: dict[str, float], tolerance: float) -> tuple[list[dict[str, Any]], dict[str, dict[str, float]]]:
    names = {unit["code"]: unit["name"] for unit in lookup.units34}
    members = {f["properties"]["unitCode"]: f["properties"]["memberAdm1Codes"] for f in lookup_units34_raw()}
    features = []
    by_unit: dict[str, dict[str, float]] = {}
    for code in sorted(by_code, key=lambda c: names[c]):
        polygons = simplify_all(by_code[code], tolerance)
        if not polygons:
            continue
        # Snap to the 1e-6 deg output grid while keeping validity, so the
        # 6-decimal JSON coordinates describe exactly this geometry.
        merged = unary_union([polygon if polygon.is_valid else make_valid(polygon) for polygon in polygons])
        geometry = shapely.set_precision(merged, 1e-6, mode="valid_output")
        if not geometry.is_valid:
            geometry = make_valid(geometry)
        polygons = explode(geometry)
        if not polygons:
            continue
        geometry = MultiPolygon(polygons)
        area = raster_area[code]
        share = area / unit_areas[code] * 100
        by_unit[code] = {"areaKm2": round(area, 3), "sharePct": round(share, 2)}
        features.append(
            {
                "type": "Feature",
                "id": f"B-008-SLR-{zone_key}-{code}",
                "properties": {
                    "elementId": ELEMENT_ID,
                    "featureId": f"B-008-SLR-{zone_key}-{code}",
                    "zoneKey": zone_key,
                    "zoneLabel": ZONE_LABELS[zone_key],
                    "thresholdM": threshold,
                    "adm1Code34": code,
                    "adm1Name34": names[code],
                    "memberAdm1Codes": members[code],
                    "areaKm2": round(area, 3),
                    "areaBasis": "raster cells (30 m) inside the province, geodesic cell area, before polygon filtering/simplification",
                    "adm1AreaKm2": round(unit_areas[code], 3),
                    "sharePct": round(share, 2),
                    "polygonCount": len(polygons),
                    "verticalDatum": "EGM2008 (Copernicus DEM GLO-30 DSM height)",
                    "demSource": SOURCE_NAME,
                    "geometryProvenance": "copernicus-dem-glo30-bathtub-coastal-connected",
                    "isSynthetic": False,
                    "accuracyNotice": LOWLAND_NOTICE,
                },
                "geometry": round_coordinates(mapping(geometry)),
            }
        )
    return features, by_unit


_UNITS34_RAW: list[dict[str, Any]] | None = None


def lookup_units34_raw() -> list[dict[str, Any]]:
    global _UNITS34_RAW
    if _UNITS34_RAW is None:
        _UNITS34_RAW = read_json(GEOMETRY_DIR / "vnm-adm1-34.geojson")["features"]
    return _UNITS34_RAW


def round_coordinates(geometry: dict[str, Any], digits: int = 6) -> dict[str, Any]:
    def walk(value: Any) -> Any:
        if isinstance(value, (list, tuple)):
            if value and isinstance(value[0], float):
                return [round(v, digits) for v in value]
            return [walk(v) for v in value]
        return value

    return {"type": geometry["type"], "coordinates": walk(geometry["coordinates"])}


# ---------------------------------------------------------------------------
# tables


def build_slr_zone_table(generated_at: str) -> dict[str, Any]:
    rows = []
    with B008_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for record in csv.DictReader(handle):
            attributes = json.loads(record["attributes_json"])
            rows.append((record, attributes))
    by_key: dict[tuple[Any, ...], dict[int, tuple[dict[str, Any], dict[str, Any]]]] = defaultdict(dict)
    for record, attributes in rows:
        key = (attributes["PSMSL_관측소_ID"], attributes["시나리오"], attributes["신뢰수준"], attributes["연도"])
        by_key[key][int(attributes["분위수"])] = (record, attributes)
    entries = []
    for key in sorted(by_key, key=lambda k: (k[0], k[1], k[2], k[3])):
        quantiles = by_key[key]
        record, attributes = quantiles[50]
        rise = attributes["상대해수면_상승_m_2005년_기준"]
        if rise is None:
            zone_key, note = None, "중앙값 결측"
        elif rise <= 0:
            zone_key, note = None, "상대해수면 하강 전망 — 대응 구간 없음"
        elif rise <= 0.5:
            zone_key, note = "le0p5m", None
        elif rise <= 1.0:
            zone_key, note = "le1m", None
        elif rise <= 2.0:
            zone_key, note = "le2m", None
        else:
            zone_key, note = None, "2 m 초과 — 대응 구간 없음"
        entries.append(
            {
                "recordId": record["record_id"],
                "station": {
                    "psmslId": attributes["PSMSL_관측소_ID"],
                    "name": attributes["관측소명_PSMSL"],
                    "nameVi": attributes["관측소명_베트남어"],
                    "location": attributes.get("소재"),
                    "latitude": float(record["latitude"]),
                    "longitude": float(record["longitude"]),
                },
                "scenario": attributes["시나리오"],
                "confidence": attributes["신뢰수준"],
                "year": attributes["연도"],
                "riseM": rise,
                "riseMQ05": quantiles[5][1]["상대해수면_상승_m_2005년_기준"] if 5 in quantiles else None,
                "riseMQ95": quantiles[95][1]["상대해수면_상승_m_2005년_기준"] if 95 in quantiles else None,
                "zoneKey": zone_key,
                "zoneLabel": ZONE_LABELS.get(zone_key) if zone_key else None,
                "note": note,
            }
        )
    return {
        "schemaVersion": "v155-slr-zone-lookup-1",
        "elementId": ELEMENT_ID,
        "pending": True,
        "notice": LOWLAND_NOTICE,
        "datumNotice": DATUM_NOTICE,
        "lookupRule": (
            "riseM(중앙값, 분위수 50)이 들어가는 최소 임계값 구간을 zoneKey로 대응(≤0.5→le0p5m, ≤1→le1m, ≤2→le2m). "
            "값 보간·예측·기준면 변환 없음. riseM은 IPCC AR6 관측소별 상대해수면 상승량(2005년 기준, m)이고 "
            "zone 높이는 EGM2008 지오이드 기준 DEM 높이이므로 기준면이 달라 등가가 아닌 대응표입니다."
        ),
        "zones": [{"zoneKey": key, "label": ZONE_LABELS[key], "thresholdM": value} for key, value in THRESHOLDS],
        "source": {
            "csv": "/data/vietnam/v2/downloads/b-008.csv",
            "sourceOrg": rows[0][0]["source_org"] or "NASA Sea Level Projection Tool (IPCC AR6) · PSMSL",
            "sourceUrl": rows[0][0]["source_url"],
            "valueField": "attributes_json.상대해수면_상승_m_2005년_기준",
        },
        "entryCount": len(entries),
        "entries": entries,
        "generatedAt": generated_at,
    }


# ---------------------------------------------------------------------------
# main build


def build(args: argparse.Namespace) -> None:
    started = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    lookup = ProvinceLookup(args.geometry_dir)
    country, neighbours, all_land = land_polygons(lookup)
    tiles = select_tiles(country, neighbours)
    print(f"selected {len(tiles)} tiles", flush=True)

    if args.stage in ("download", "all"):
        manifest = download_tiles(tiles)
    else:
        manifest = read_json(DEM_MANIFEST)
    tiles = [(lat, lon) for lat, lon in tiles if tile_name(lat, lon) in manifest["tiles"]]
    generated_at = max(item["downloadedAt"] for item in manifest["tiles"].values())
    dem_manifest_sha = sha256_path(DEM_MANIFEST)

    if args.stage == "download":
        return

    all_land_buffered = make_valid(all_land.buffer(SEED_LAND_BUFFER_DEG))
    tile_infos = []
    for lat, lon in tiles:
        name = tile_name(lat, lon)
        cached = WORK_DIR / f"{name}.class.npz"
        if args.stage == "all" or not cached.exists() or "units" not in np.load(cached).files:
            info = classify_tile(name, country, all_land_buffered, lookup.units34)
        else:
            data = np.load(WORK_DIR / f"{name}.class.npz")
            transform = rasterio.Affine.from_gdal(*data["transform"].tolist())
            classes = data["classes"]
            height, width = classes.shape
            info = {
                "name": name,
                "shape": [height, width],
                "bounds": data["bounds"].tolist(),
                "pixelDeg": [transform.a, -transform.e],
                "validCells": int(((classes & BIT_VALID) > 0).sum()),
                "landCells": int(((classes & BIT_LAND) > 0).sum()),
                "seedCells": int(((classes & BIT_SEED) > 0).sum()),
                "rowLatitudes": np.array([transform * (0, r + 0.5) for r in range(height)])[:, 1],
            }
        tile_infos.append(info)
        print(f"classified {name} land={info['landCells']} seed={info['seedCells']}", flush=True)

    near_by_tile = coastal_mask_per_tile(tile_infos)

    unit_areas = {unit["code"]: geodesic_area_km2(unit["geometry"]) for unit in lookup.units34}
    zone_reports: dict[str, Any] = {}
    kept_masks_prev: dict[str, np.ndarray] | None = None
    zone_by_unit: dict[str, dict[str, dict[str, float]]] = {}
    manifest_entries = []
    for zone_key, threshold in THRESHOLDS:
        bit = {"le0p5m": BIT_LE05, "le1m": BIT_LE1, "le2m": BIT_LE2}[zone_key]
        connectivity = label_tiles(tile_infos, near_by_tile, zone_key, bit)
        kept_masks = {info["name"]: np.load(WORK_DIR / f"{info['name']}.{zone_key}.kept.npy") for info in tile_infos}
        # Raster-level nesting: every cell kept for the lower threshold must be kept here.
        nesting_ok = True
        if kept_masks_prev is not None:
            for name, previous in kept_masks_prev.items():
                if (previous & ~kept_masks[name]).any():
                    nesting_ok = False
                    break
            if not nesting_ok:
                raise AssertionError(f"raster nesting violated between previous zone and {zone_key}")
        kept_masks_prev = kept_masks

        unit_codes = [unit["code"] for unit in lookup.units34]
        by_code, raster_area, raster_stats = polygonize_zone(tile_infos, zone_key, unit_codes)
        print(f"{zone_key}: polygons per province ready ({raster_stats['shapePolygons']} raw shapes)", flush=True)
        used_tolerance = None
        features: list[dict[str, Any]] = []
        by_unit: dict[str, dict[str, float]] = {}
        gzip_bytes = 0
        path = args.geometry_dir / f"vnm-slr-lowland-{zone_key}.geojson"
        polygons = [polygon for polygons_ in by_code.values() for polygon in polygons_]
        for tolerance in SIMPLIFY_STEPS_DEG:
            features, by_unit = build_zone_features(zone_key, threshold, by_code, raster_area, lookup, unit_areas, tolerance)
            collection = {
                "type": "FeatureCollection",
                "name": f"vnm-slr-lowland-{zone_key}",
                "bbox": None,
                "metadata": {},
                "features": features,
            }
            bounds = shapely.total_bounds([shape(f["geometry"]) for f in features]).tolist() if features else (0, 0, 0, 0)
            collection["bbox"] = [round(v, 6) for v in bounds]
            total_area = round(sum(f["properties"]["areaKm2"] for f in features), 3)
            collection["metadata"] = {
                "schemaVersion": "v155-spatial-1",
                "elementId": ELEMENT_ID,
                "title": f"Viet Nam coastal low-lying land {ZONE_LABELS[zone_key]} above the EGM2008 geoid (Copernicus DEM GLO-30, indicative)",
                "zoneKey": zone_key,
                "zoneLabel": ZONE_LABELS[zone_key],
                "thresholdM": threshold,
                "verticalDatum": "EGM2008 geoid (Copernicus DEM GLO-30 DSM heights; no tidal datum correction)",
                "method": METHOD_NOTE,
                "methodParameters": {
                    "coastBufferKm": COAST_BUFFER_KM,
                    "coastBufferResolutionKm": round(111.13 / (3600 / COARSEN), 3),
                    "connectivity": "8-neighbour, merged across tile edges",
                    "seaSeed": f"height <= 0 m and > {SEED_LAND_BUFFER_DEG} deg (~1 km) outside all land polygons",
                    "landAndProvinceSplit": "rasterized vnm-adm1-63 union (land) and vnm-adm1-34 units on the 30 m grid",
                    "waterSurfaceRule": "cells with height exactly 0.0 m (Copernicus-edited sea/estuary/river surface) are excluded from the published land zones but still carry connectivity",
                    "minAreaKm2": MIN_AREA_KM2,
                    "simplifyToleranceDeg": tolerance,
                    "simplifyToleranceMApprox": round(tolerance * 111000),
                    "coordinateDecimals": 6,
                    "areaBasis": "raster cell count x geodesic cell area (before polygon filtering and simplification)",
                },
                "accuracyNotice": LOWLAND_NOTICE,
                "datumNotice": DATUM_NOTICE,
                "boundarySystem": "post-2025-34",
                "source": SOURCE_NAME,
                "sourceUrl": SOURCE_URL,
                "sourceDocumentation": SOURCE_DOC_URL,
                "sourceTiles": sorted(manifest["tiles"]),
                "sourceTileCount": len(manifest["tiles"]),
                "sourceManifestSha256": dem_manifest_sha,
                "license": LICENSE,
                "licenseUrl": LICENSE_URL,
                "attribution": ATTRIBUTION,
                "crs": CRS_NOTE,
                "featureCount": len(features),
                "totalAreaKm2": total_area,
                "geometryProvenance": "copernicus-dem-glo30-bathtub-coastal-connected",
                "isSynthetic": False,
                "generatedAt": generated_at,
            }
            write_json(path, collection, indent=None)
            gzip_bytes = gzip_size(path)
            used_tolerance = tolerance
            print(f"{zone_key}: tolerance {tolerance} -> gzip {gzip_bytes} B, features {len(features)}", flush=True)
            if gzip_bytes <= GZIP_BUDGET:
                break
        if gzip_bytes > GZIP_BUDGET:
            raise SystemExit(f"{zone_key}: gzip {gzip_bytes} still over the 2 MB budget after {SIMPLIFY_STEPS_DEG}")
        filter_stats = {k: raster_stats[k] for k in ("droppedSmallPolygons", "filledSmallHoles", "edgePolygonsUnioned", "landCellsWithoutUnit", "waterSurfaceCellsExcluded", "waterSurfaceAreaExcludedKm2")}
        raster_stats = {k: raster_stats[k] for k in ("rasterLandCells", "rasterLandAreaKm2", "shapePolygons")}
        zone_by_unit[zone_key] = by_unit
        invalid = sum(1 for f in features if not shape(f["geometry"]).is_valid)
        top5 = sorted(((code, v["areaKm2"], v["sharePct"]) for code, v in by_unit.items()), key=lambda item: -item[1])[:5]
        names = {unit["code"]: unit["name"] for unit in lookup.units34}
        zone_reports[zone_key] = {
            "thresholdM": threshold,
            **raster_stats,
            **connectivity,
            **filter_stats,
            "vectorPolygonCount": len(polygons),
            "featureCount": len(features),
            "unitCount": len(by_unit),
            "totalAreaKm2": round(sum(v["areaKm2"] for v in by_unit.values()), 3),
            "invalidGeometryCount": invalid,
            "simplifyToleranceDeg": used_tolerance,
            "bytes": path.stat().st_size,
            "gzipBytes": gzip_bytes,
            "sha256": sha256_path(path),
            "top5ByArea": [{"adm1Code34": code, "adm1Name34": names[code], "areaKm2": area, "sharePct": share} for code, area, share in top5],
            "top5ByShare": [
                {"adm1Code34": code, "adm1Name34": names[code], "areaKm2": v["areaKm2"], "sharePct": v["sharePct"]}
                for code, v in sorted(by_unit.items(), key=lambda item: -item[1]["sharePct"])[:5]
            ],
        }
        manifest_entries.append(
            {
                "accuracyNotice": LOWLAND_NOTICE,
                "datumNotice": DATUM_NOTICE,
                "attribution": ATTRIBUTION,
                "elementId": ELEMENT_ID,
                "featureCount": len(features),
                "geometryTypes": sorted({f["geometry"]["type"] for f in features}),
                "kind": f"slr-lowland-{zone_key}",
                "zoneKey": zone_key,
                "thresholdM": threshold,
                "verticalDatum": "EGM2008",
                "license": LICENSE,
                "licenseUrl": LICENSE_URL,
                "sha256": zone_reports[zone_key]["sha256"],
                "source": {
                    "name": SOURCE_NAME,
                    "bucketUrl": BUCKET_URL,
                    "registryUrl": SOURCE_URL,
                    "tileCount": len(manifest["tiles"]),
                    "tileManifestSha256": dem_manifest_sha,
                    "downloadedAt": generated_at,
                },
                "method": METHOD_NOTE,
                "url": f"/data/vietnam/v2/geometry/vnm-slr-lowland-{zone_key}.geojson",
                "validation": {
                    "duplicateIdCount": 0,
                    "emptyGeometryCount": 0,
                    "featureCount": len(features),
                    "invalidGeometryCount": invalid,
                    "geometryValidity": "pass" if invalid == 0 else "fail",
                    "rasterNestingAssert": "pass",
                    "validator": "Shapely 2.1.2 (GEOS is_valid) + pyproj Geod area",
                },
                "version": f"Copernicus DEM GLO-30 COG, tiles downloaded {generated_at[:10]}",
            }
        )

    # Vector-level nesting check (area of the lower zone outside the higher zone).
    nesting_vector = {}
    zone_geoms = {}
    for zone_key, _ in THRESHOLDS:
        document = read_json(args.geometry_dir / f"vnm-slr-lowland-{zone_key}.geojson")
        zone_geoms[zone_key] = make_valid(unary_union([shape(f["geometry"]) for f in document["features"]]))
    for lower, upper in (("le0p5m", "le1m"), ("le1m", "le2m")):
        outside = zone_geoms[lower].difference(zone_geoms[upper])
        nesting_vector[f"{lower}_outside_{upper}_km2"] = round(geodesic_area_km2(outside), 4)
        nesting_vector[f"{lower}_outside_{upper}_pct"] = round(geodesic_area_km2(outside) / max(geodesic_area_km2(zone_geoms[lower]), 1e-9) * 100, 4)

    if not args.skip_manifest:
        for entry in manifest_entries:
            append_manifest_entry(args.geometry_dir, entry)

    names = {unit["code"]: unit["name"] for unit in lookup.units34}
    members = {f["properties"]["unitCode"]: f["properties"]["memberAdm1Codes"] for f in lookup_units34_raw()}
    by_adm1 = {
        "schemaVersion": "v155-lowland-by-adm1-1",
        "elementId": ELEMENT_ID,
        "pending": True,
        "boundarySystem": "post-2025-34",
        "notice": LOWLAND_NOTICE,
        "datumNotice": DATUM_NOTICE,
        "method": METHOD_NOTE,
        "areaBasis": "측지 면적(WGS84), 성·시 면적은 vnm-adm1-34.geojson 폴리곤 면적(공식 통계 면적 아님)",
        "thresholds": [{"zoneKey": key, "label": ZONE_LABELS[key], "thresholdM": value, "geometryUrl": f"/data/vietnam/v2/geometry/vnm-slr-lowland-{key}.geojson"} for key, value in THRESHOLDS],
        "units": [
            {
                "adm1Code34": code,
                "adm1Name34": names[code],
                "memberAdm1Codes": members[code],
                "adm1AreaKm2": round(unit_areas[code], 3),
                "zones": {key: zone_by_unit[key].get(code, {"areaKm2": 0.0, "sharePct": 0.0}) for key, _ in THRESHOLDS},
            }
            for code in sorted(unit_areas, key=lambda c: names[c])
        ],
        "totals": {key: {"areaKm2": zone_reports[key]["totalAreaKm2"], "unitCount": zone_reports[key]["unitCount"]} for key, _ in THRESHOLDS},
        "source": SOURCE_NAME,
        "license": LICENSE,
        "attribution": ATTRIBUTION,
        "generatedAt": generated_at,
    }
    write_json(PENDING_DIR / "b-008-lowland-by-adm1.json", by_adm1)
    write_json(PENDING_DIR / "b-008-slr-zones.json", build_slr_zone_table(generated_at))

    report = {
        "schema": "v155-asset-report-1",
        "asset": [f"vnm-slr-lowland-{key}.geojson" for key, _ in THRESHOLDS],
        "generatedAt": started,
        "demGeneratedAt": generated_at,
        "source": {
            "name": SOURCE_NAME,
            "bucketUrl": BUCKET_URL,
            "tileListUrl": TILE_LIST_URL,
            "tileCount": len(manifest["tiles"]),
            "tiles": manifest["tiles"],
            "missingInBucket": manifest.get("missingInBucket", []),
            "tileManifestSha256": dem_manifest_sha,
            "license": LICENSE,
            "attribution": ATTRIBUTION,
        },
        "parameters": {
            "thresholdsM": [value for _, value in THRESHOLDS],
            "coastBufferKm": COAST_BUFFER_KM,
            "coarsenFactor": COARSEN,
            "seedLandBufferDeg": SEED_LAND_BUFFER_DEG,
            "minAreaKm2": MIN_AREA_KM2,
            "simplifyStepsDeg": SIMPLIFY_STEPS_DEG,
            "gzipBudgetBytes": GZIP_BUDGET,
        },
        "tiles": [{k: v for k, v in info.items() if k != "rowLatitudes"} for info in tile_infos],
        "zones": zone_reports,
        "rasterNestingAssert": "pass",
        "vectorNesting": nesting_vector,
        "notice": LOWLAND_NOTICE,
        "datumNotice": DATUM_NOTICE,
    }
    write_json(REPORT_DIR / "slr-lowland-v155.json", report)
    print(json.dumps({key: {"areaKm2": z["totalAreaKm2"], "gzip": z["gzipBytes"], "features": z["featureCount"], "top5": [(t["adm1Name34"], t["areaKm2"]) for t in z["top5ByArea"]]} for key, z in zone_reports.items()}, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", choices=["download", "build", "all"], default="all", help="download only, build from cached classes, or everything")
    parser.add_argument("--geometry-dir", type=Path, default=GEOMETRY_DIR)
    parser.add_argument("--skip-manifest", action="store_true")
    build(parser.parse_args())


if __name__ == "__main__":
    main()
