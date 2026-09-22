"""Shared pieces of the V155 OpenStreetMap extraction builders.

The builders read the Geofabrik Viet Nam extract with pyosmium and never
touch a coordinate: every published vertex is an OSM node location. This
module holds the pinned source description, the province lookup used to tag
features with the 2025 34-unit and pre-2025 63-unit codes, and the JSON
helpers, so the two builders stay small and agree on provenance.
"""

from __future__ import annotations

import gzip
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from typing import Any

from pyproj import Geod
from shapely.geometry import shape
from shapely.ops import unary_union
from shapely.strtree import STRtree
from shapely.validation import make_valid


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
V2_ROOT = REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2"
GEOMETRY_DIR = V2_ROOT / "geometry"
REPORT_DIR = REPOSITORY_ROOT / "reports" / "v155"
MANIFEST_NAME = "geometry-manifest.json"
DEFAULT_PBF = REPOSITORY_ROOT / "_source" / "vietnam" / "v155" / "osm" / "vietnam-260921.osm.pbf"

# Geofabrik serves `vietnam-latest.osm.pbf` as a redirect to a dated file; the
# dated name is what gets pinned so a rebuild reads the same extract.
SOURCE_NAME = "OpenStreetMap contributors"
SOURCE_EXTRACT = "Geofabrik vietnam-260921.osm.pbf"
SOURCE_PAGE_URL = "https://download.geofabrik.de/asia/vietnam.html"
SOURCE_LATEST_URL = "https://download.geofabrik.de/asia/vietnam-latest.osm.pbf"
SOURCE_DATED_URL = "https://download.geofabrik.de/asia/vietnam-260921.osm.pbf"
SOURCE_MD5 = "8e8faf2eff113b67f28059c3b4a5c677"
SOURCE_BYTES = 329_083_173
SOURCE_LAST_MODIFIED = "2026-09-21T22:41:35Z"
LICENSE = "ODbL-1.0"
LICENSE_URL = "https://opendatacommons.org/licenses/odbl/1-0/"
ATTRIBUTION = (
    "© OpenStreetMap contributors, Open Database License (ODbL) 1.0; "
    "extract: Geofabrik vietnam-260921.osm.pbf (2026-09-21)"
)
ACCURACY_NOTICE = (
    "OpenStreetMap is volunteer-mapped: coverage, tagging and names vary by area "
    "and date. Geometry is shown for orientation, not for engineering or cadastral use."
)
CRS_NOTE = "OGC:CRS84 (longitude, latitude; equivalent datum to EPSG:4326)"

GEOD = Geod(ellps="WGS84")


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFC", value).strip().replace("Đ", "D").replace("đ", "d")
    value = "".join(
        character
        for character in unicodedata.normalize("NFD", value)
        if unicodedata.category(character) != "Mn"
    )
    value = unicodedata.normalize("NFC", value).casefold()
    return " ".join(re.findall(r"[a-z0-9]+", value))


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any, *, indent: int | None = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=indent, allow_nan=False) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def md5_path(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def gzip_size(path: Path) -> int:
    return len(gzip.compress(path.read_bytes(), compresslevel=9, mtime=0))


def verify_pbf(path: Path) -> dict[str, Any]:
    """Refuse to build from an extract other than the pinned one."""

    if not path.exists():
        raise FileNotFoundError(
            f"{path} is missing; download {SOURCE_DATED_URL} (md5 {SOURCE_MD5}) into _source first"
        )
    size = path.stat().st_size
    if size != SOURCE_BYTES:
        raise ValueError(f"PBF size {size} differs from the pinned {SOURCE_BYTES}")
    md5 = md5_path(path)
    if md5 != SOURCE_MD5:
        raise ValueError(f"PBF md5 {md5} differs from the pinned {SOURCE_MD5}")
    return {
        "path": str(path.relative_to(REPOSITORY_ROOT)),
        "bytes": size,
        "md5": md5,
        "sha256": sha256_path(path),
        "extract": SOURCE_EXTRACT,
        "datedUrl": SOURCE_DATED_URL,
        "latestUrl": SOURCE_LATEST_URL,
        "pageUrl": SOURCE_PAGE_URL,
        "lastModified": SOURCE_LAST_MODIFIED,
    }


def geodesic_length_km(coordinates: list[tuple[float, float]]) -> float:
    if len(coordinates) < 2:
        return 0.0
    lons = [point[0] for point in coordinates]
    lats = [point[1] for point in coordinates]
    return GEOD.line_length(lons, lats) / 1000


def geodesic_area_km2(geometry: Any) -> float:
    if geometry.is_empty:
        return 0.0
    if geometry.geom_type == "Polygon":
        polygons = [geometry]
    elif geometry.geom_type == "MultiPolygon":
        polygons = list(geometry.geoms)
    else:
        return 0.0
    total = 0.0
    for polygon in polygons:
        outer, _ = GEOD.geometry_area_perimeter(polygon.exterior)
        total += abs(outer)
        for interior in polygon.interiors:
            inner, _ = GEOD.geometry_area_perimeter(interior)
            total -= abs(inner)
    return total / 1_000_000


class ProvinceLookup:
    """Point-in-polygon lookup against both published boundary systems."""

    def __init__(self, geometry_dir: Path = GEOMETRY_DIR) -> None:
        self.units34 = self._load(
            geometry_dir / "vnm-adm1-34.geojson", code_key="unitCode", name_key="name"
        )
        self.units63 = self._load(
            geometry_dir / "vnm-adm1-63.geojson", code_key="adm1Code", name_key="name"
        )
        self.tree34 = STRtree([unit["geometry"] for unit in self.units34])
        self.tree63 = STRtree([unit["geometry"] for unit in self.units63])
        self.country = make_valid(unary_union([unit["geometry"] for unit in self.units63]))
        # About 2 km in degrees at Viet Nam's latitudes: wide enough to keep a
        # border road whose OSM nodes sit just outside the boundary asset.
        self.country_buffered = self.country.buffer(0.02)

    @staticmethod
    def _load(path: Path, *, code_key: str, name_key: str) -> list[dict[str, Any]]:
        units = []
        for feature in read_json(path)["features"]:
            geometry = shape(feature["geometry"])
            units.append(
                {
                    "code": feature["properties"][code_key],
                    "name": feature["properties"][name_key],
                    "geometry": geometry if geometry.is_valid else make_valid(geometry),
                }
            )
        return units

    def locate(self, point: Any) -> dict[str, Any]:
        result: dict[str, Any] = {
            "adm1Code34": None,
            "adm1Name34": None,
            "adm1Code": None,
            "adm1Name": None,
        }
        hits = self.tree34.query(point, predicate="within")
        if len(hits):
            unit = self.units34[int(hits[0])]
            result["adm1Code34"], result["adm1Name34"] = unit["code"], unit["name"]
        hits = self.tree63.query(point, predicate="within")
        if len(hits):
            unit = self.units63[int(hits[0])]
            result["adm1Code"], result["adm1Name"] = unit["code"], unit["name"]
        return result

    def touches_country(self, geometry: Any) -> bool:
        return self.country_buffered.intersects(geometry)


def append_manifest_entry(geometry_dir: Path, entry: dict[str, Any]) -> None:
    """Append (never sort) so a parallel PR's entries survive a rebase."""

    manifest_path = geometry_dir / MANIFEST_NAME
    manifest = read_json(manifest_path)
    kept = [item for item in manifest["assets"] if item.get("kind") != entry["kind"]]
    manifest["assets"] = kept + [entry]
    write_json(manifest_path, manifest)


def base_manifest_entry(*, kind: str, url: str, path: Path, feature_count: int, geometry_types: list[str], source: dict[str, Any]) -> dict[str, Any]:
    return {
        "accuracyNotice": ACCURACY_NOTICE,
        "attribution": ATTRIBUTION,
        "featureCount": feature_count,
        "geometryTypes": sorted(geometry_types),
        "kind": kind,
        "license": LICENSE,
        "licenseUrl": LICENSE_URL,
        "sha256": sha256_path(path),
        "source": {
            "name": SOURCE_NAME,
            "extract": SOURCE_EXTRACT,
            "datedUrl": SOURCE_DATED_URL,
            "pageUrl": SOURCE_PAGE_URL,
            "md5": source["md5"],
            "sha256": source["sha256"],
            "lastModified": SOURCE_LAST_MODIFIED,
        },
        "url": url,
        "version": "OSM extract 2026-09-21",
    }
