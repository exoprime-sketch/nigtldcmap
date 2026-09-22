"""Build the B-017 WRI Aqueduct 4.0 assessment-unit geometry (V155-1).

Aqueduct 4.0 publishes its baseline annual indicators on polygons that are the
intersection of HydroBASINS level-6 basins, GADM 4.1 ADM1 provinces and
groundwater aquifers. ``string_id`` (``{pfaf_id}-{gid_1}-{aqid}``) names one
such unit and is also the record key of the published B-017 download, so the
join is exact and needs no fuzzy matching.

Outputs (all EPSG:4326 / OGC:CRS84, no coordinate is synthesized):

* ``geometry/vnm-aqueduct40-basins.geojson`` - the 443 Viet Nam units with
  their source vertices unchanged (the source is small enough to ship as is).
* ``geometry/vnm-aqueduct40-basins-l6.geojson`` - the same units dissolved by
  HydroBASINS ``pfaf_id`` (units without a basin, ``-9999``, are left out).
  Geometry only: no indicator value is aggregated to this level.
* ``spatial/pending-v155/b-017.json`` - a value draft in the
  ``v124-spatial-layer-1`` shape joined on ``stringId`` from the published
  B-017 download. It stays outside ``spatial/layers`` until P6b registers it.
* ``geometry-manifest.json`` - two entries appended at the end of ``assets``.
* ``reports/v155/aqueduct-basins-v155.json`` - the validation record.

The source polygons come from the Aqueduct 4.0 file geodatabase
(``Aq40_Y2023D07M05.gdb``, layer ``baseline_annual``). Because that archive is
1.7 GB unpacked it is never committed; the Viet Nam subset is vendored as a
deterministic capsule under ``tools/vietnam_spatial/source`` so the asset can
be rebuilt offline, exactly like the A-024 transmission source.

Run:

    python -m pip install -r tools/vietnam_spatial/requirements-v155.txt
    python tools/vietnam_spatial/build_aqueduct_basins_v155.py [--gdb PATH]
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import re
import time
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Any

from pyproj import Geod
from shapely import from_wkb
from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree
from shapely.validation import explain_validity, make_valid


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
V2_ROOT = REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2"
GEOMETRY_DIR = V2_ROOT / "geometry"
DOWNLOADS_DIR = V2_ROOT / "downloads"
PENDING_DIR = V2_ROOT / "spatial" / "pending-v155"
REPORT_DIR = REPOSITORY_ROOT / "reports" / "v155"
VENDORED_SOURCE = (
    Path(__file__).resolve().parent
    / "source"
    / "vnm-aqueduct40-baseline-annual-source.geojson.gz"
)
DEFAULT_GDB_GLOB = "_source/vietnam/v155/aqueduct/**/Aq40_Y2023D07M05.gdb"

UNIT_ASSET_NAME = "vnm-aqueduct40-basins.geojson"
L6_ASSET_NAME = "vnm-aqueduct40-basins-l6.geojson"
MANIFEST_NAME = "geometry-manifest.json"
DRAFT_LAYER_NAME = "b-017.json"
REPORT_NAME = "aqueduct-basins-v155.json"

ELEMENT_ID = "B-017"
BASIN_INDICATOR_ID = "B-017_aqueduct40_basin_adm1"
EXPECTED_UNIT_COUNT = 443
VIETNAM_BBOX = (102.0, 8.0, 110.0, 24.0)

SOURCE_NAME = "World Resources Institute (WRI) Aqueduct 4.0"
SOURCE_TITLE = "Aqueduct 4.0 Water Risk Framework - baseline annual"
SOURCE_RELEASE = "Y2023M07D05"
SOURCE_DATASET_URL = "https://www.wri.org/data/aqueduct-global-maps-40-data"
SOURCE_DOWNLOAD_URL = "https://files.wri.org/aqueduct/aqueduct-4-0-water-risk-data.zip"
SOURCE_ZIP_SHA256 = "bd3ed2bce88d6ff1b89191632ad134a2436e1e1d49599382f23a04d513624fc3"
SOURCE_ZIP_BYTES = 261_527_511
SOURCE_GDB = "Aqueduct40_waterrisk_download_Y2023M07D05/GDB/Aq40_Y2023D07M05.gdb"
SOURCE_LAYER = "baseline_annual"
SOURCE_UNIT_DEFINITION = (
    "HydroBASINS level-6 basin x GADM 4.1 ADM1 province x groundwater aquifer "
    "intersection polygon (Aqueduct 4.0 string_id)."
)
LICENSE = "CC-BY-4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
ATTRIBUTION = (
    "WRI Aqueduct 4.0 Water Risk Framework (Kuzma et al. 2023), baseline annual, "
    "release 2023-07-05, CC BY 4.0. Unit polygons derive from HydroBASINS "
    "(Lehner & Grill 2013) and GADM 4.1."
)
ACCURACY_NOTICE = (
    "Aqueduct 4.0 units follow GADM 4.1 province lines, which differ slightly "
    "from the geoBoundaries lines used by this platform, so unit edges do not "
    "coincide with the published province boundaries. Basins carry no official "
    "name; the label combines the HydroBASINS pfaf_id with the province."
)

# Everything the B-017 draft layer needs from the download, keyed by the
# variable key the layer contract proposes. Scores are 0-5 (Aqueduct's own
# normalised scale); labels are Aqueduct's category text.
VARIABLES: list[dict[str, str]] = [
    {
        "key": "overall-water-risk",
        "label": "종합 물 리스크(기본 가중)",
        "scoreAttr": "종합_물리스크_Overall_Water_Risk_기본가중_점수_0_5",
        "labelAttr": "종합_물리스크_Overall_Water_Risk_기본가중_등급",
        "rawAttr": "종합_물리스크_Overall_Water_Risk_기본가중_원값",
        "gdbField": "w_awr_def_tot_score",
    },
    {
        "key": "baseline-water-stress",
        "label": "기준 물 스트레스",
        "scoreAttr": "기준_물스트레스_Baseline_Water_Stress_점수_0_5",
        "labelAttr": "기준_물스트레스_Baseline_Water_Stress_등급",
        "rawAttr": "기준_물스트레스_Baseline_Water_Stress_원값",
        "gdbField": "bws_score",
    },
    {
        "key": "baseline-water-depletion",
        "label": "기준 물 고갈",
        "scoreAttr": "기준_물고갈_Baseline_Water_Depletion_점수_0_5",
        "labelAttr": "기준_물고갈_Baseline_Water_Depletion_등급",
        "rawAttr": "기준_물고갈_Baseline_Water_Depletion_원값",
        "gdbField": "bwd_score",
    },
    {
        "key": "interannual-variability",
        "label": "연간 변동성",
        "scoreAttr": "연간_변동성_Interannual_Variability_점수_0_5",
        "labelAttr": "연간_변동성_Interannual_Variability_등급",
        "rawAttr": "연간_변동성_Interannual_Variability_원값",
        "gdbField": "iav_score",
    },
    {
        "key": "seasonal-variability",
        "label": "계절 변동성",
        "scoreAttr": "계절_변동성_Seasonal_Variability_점수_0_5",
        "labelAttr": "계절_변동성_Seasonal_Variability_등급",
        "rawAttr": "계절_변동성_Seasonal_Variability_원값",
        "gdbField": "sev_score",
    },
    {
        "key": "groundwater-table-decline",
        "label": "지하수위 하강",
        "scoreAttr": "지하수위_하강_Groundwater_Table_Decline_점수_0_5",
        "labelAttr": "지하수위_하강_Groundwater_Table_Decline_등급",
        "rawAttr": "지하수위_하강_Groundwater_Table_Decline_원값",
        "gdbField": "gtd_score",
    },
    {
        "key": "riverine-flood-risk",
        "label": "하천 홍수 위험",
        "scoreAttr": "하천_홍수위험_Riverine_Flood_Risk_점수_0_5",
        "labelAttr": "하천_홍수위험_Riverine_Flood_Risk_등급",
        "rawAttr": "하천_홍수위험_Riverine_Flood_Risk_원값",
        "gdbField": "rfr_score",
    },
    {
        "key": "coastal-flood-risk",
        "label": "연안 홍수 위험",
        "scoreAttr": "연안_홍수위험_Coastal_Flood_Risk_점수_0_5",
        "labelAttr": "연안_홍수위험_Coastal_Flood_Risk_등급",
        "rawAttr": "연안_홍수위험_Coastal_Flood_Risk_원값",
        "gdbField": "cfr_score",
    },
    {
        "key": "drought-risk",
        "label": "가뭄 위험",
        "scoreAttr": "가뭄위험_Drought_Risk_점수_0_5",
        "labelAttr": "가뭄위험_Drought_Risk_등급",
        "rawAttr": "가뭄위험_Drought_Risk_원값",
        "gdbField": "drr_score",
    },
]
SOURCE_FIELDS = [
    "string_id",
    "aq30_id",
    "pfaf_id",
    "gid_1",
    "aqid",
    "gid_0",
    "name_0",
    "name_1",
    "area_km2",
] + [variable["gdbField"] for variable in VARIABLES]
PERIOD = "2023"
PERIOD_LABEL = "Aqueduct 4.0 기준연도 산출(2023-07-05 배포)"

# Membership in a 2025 34-unit province is decided by intersection share. GADM
# and geoBoundaries province lines disagree by slivers along every border, so
# anything under this share is a digitizing sliver, not membership.
MIN_ADM34_SHARE = 0.05
GEOD = Geod(ellps="WGS84")
SCORE_TOLERANCE = 1e-5


def normalize_text(value: str) -> str:
    """Deterministic name key shared with build_adm1_34_v151.py."""

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
    return hashlib.sha256(path.read_bytes()).hexdigest()


def gzip_size(path: Path) -> int:
    return len(gzip.compress(path.read_bytes(), compresslevel=9, mtime=0))


def geodesic_area_km2(geometry: Any) -> float:
    if geometry.is_empty:
        return 0.0
    if geometry.geom_type == "Polygon":
        polygons = [geometry]
    elif geometry.geom_type == "MultiPolygon":
        polygons = list(geometry.geoms)
    elif geometry.geom_type == "GeometryCollection":
        return sum(geodesic_area_km2(part) for part in geometry.geoms)
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


def polygon_only(geometry: Any) -> Any:
    """Drop the lines and points an intersection can leave behind."""

    if geometry.geom_type in {"Polygon", "MultiPolygon"}:
        return geometry
    if geometry.geom_type == "GeometryCollection":
        parts = [part for part in geometry.geoms if part.geom_type in {"Polygon", "MultiPolygon"}]
        return unary_union(parts) if parts else geometry.__class__()
    return geometry.__class__()


def vertices(geometry: dict[str, Any]) -> set[tuple[float, float]]:
    parts = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return {
        (float(point[0]), float(point[1]))
        for polygon in parts
        for ring in polygon
        for point in ring
    }


def none_if_missing(value: Any) -> Any:
    if value is None:
        return None
    text = str(value)
    return None if text in {"-9999", "None", ""} else text


# --------------------------------------------------------------------------
# Source acquisition
# --------------------------------------------------------------------------


def read_gdb(gdb_path: Path) -> list[dict[str, Any]]:
    import pyogrio.raw as raw  # imported lazily: only the GDB path needs GDAL

    meta, _, geometries, fields = raw.read(
        str(gdb_path),
        layer=SOURCE_LAYER,
        columns=SOURCE_FIELDS,
        where="gid_0 = 'VNM'",
        return_fids=True,
    )
    if meta["crs"] != "EPSG:4326":
        raise ValueError(f"Unexpected source CRS {meta['crs']!r}")
    names = list(meta["fields"])
    records: list[dict[str, Any]] = []
    for index, wkb in enumerate(geometries):
        properties = {}
        for column, name in enumerate(names):
            value = fields[column][index]
            if hasattr(value, "item"):
                value = value.item()
            if isinstance(value, float) and value != value:
                value = None
            properties[name] = value
        records.append({"properties": properties, "geometry": from_wkb(wkb)})
    return records


def source_capsule(records: list[dict[str, Any]], *, extracted_at: str) -> dict[str, Any]:
    features = [
        {
            "type": "Feature",
            "properties": record["properties"],
            "geometry": mapping(record["geometry"]),
        }
        for record in sorted(records, key=lambda item: item["properties"]["string_id"])
    ]
    return {
        "type": "FeatureCollection",
        "name": "wri-aqueduct40-baseline-annual-vnm-source",
        "metadata": {
            "schemaVersion": "v155-spatial-source-1",
            "sourceTitle": SOURCE_TITLE,
            "source": SOURCE_NAME,
            "sourceDatasetUrl": SOURCE_DATASET_URL,
            "sourceDownloadUrl": SOURCE_DOWNLOAD_URL,
            "sourceZipSha256": SOURCE_ZIP_SHA256,
            "sourceZipBytes": SOURCE_ZIP_BYTES,
            "sourceGdb": SOURCE_GDB,
            "sourceLayer": SOURCE_LAYER,
            "sourceRelease": SOURCE_RELEASE,
            "subset": "gid_0 = 'VNM' (all Viet Nam units, no bbox clip needed)",
            "extractedAt": extracted_at,
            "license": LICENSE,
            "licenseUrl": LICENSE_URL,
            "attribution": ATTRIBUTION,
            "featureCount": len(features),
            "geometryProvenance": "source-provided-polygon",
            "isSynthetic": False,
        },
        "features": features,
    }


def write_capsule(path: Path, capsule: dict[str, Any]) -> None:
    payload = (
        json.dumps(capsule, ensure_ascii=False, allow_nan=False, sort_keys=True, separators=(",", ":"))
        + "\n"
    ).encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(payload, compresslevel=9, mtime=0))


def read_capsule(path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    document = json.loads(gzip.decompress(path.read_bytes()).decode("utf-8"))
    metadata = document["metadata"]
    if metadata.get("sourceZipSha256") != SOURCE_ZIP_SHA256:
        raise ValueError("Vendored Aqueduct capsule points at a different source archive")
    records = [
        {"properties": feature["properties"], "geometry": shape(feature["geometry"])}
        for feature in document["features"]
    ]
    return records, metadata


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------


def load_download_rows(path: Path) -> dict[str, dict[str, Any]]:
    rows: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["indicator_id"] != BASIN_INDICATOR_ID:
                continue
            attributes = json.loads(row["attributes_json"])
            string_id = attributes["레코드_키_string_id"]
            if string_id in rows:
                raise ValueError(f"Duplicate string_id in the download: {string_id}")
            rows[string_id] = {"row": row, "attributes": attributes}
    return rows


def load_adm34(geometry_dir: Path) -> list[dict[str, Any]]:
    units = []
    for feature in read_json(geometry_dir / "vnm-adm1-34.geojson")["features"]:
        properties = feature["properties"]
        geometry = shape(feature["geometry"])
        units.append(
            {
                "unitCode": properties["unitCode"],
                "name": properties["name"],
                "normalizedName": properties["normalizedName"],
                "memberAdm1Codes": list(properties["memberAdm1Codes"]),
                "geometry": geometry if geometry.is_valid else make_valid(geometry),
            }
        )
    if len(units) != 34:
        raise ValueError(f"Expected 34 units in vnm-adm1-34.geojson, found {len(units)}")
    return units


def adm34_membership(
    geometry: Any, own_area_km2: float, units: list[dict[str, Any]], tree: STRtree
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    members: list[dict[str, Any]] = []
    slivers: list[dict[str, Any]] = []
    for index in tree.query(geometry, predicate="intersects"):
        unit = units[int(index)]
        overlap = polygon_only(geometry.intersection(unit["geometry"]))
        if overlap.is_empty:
            continue
        share = geodesic_area_km2(overlap) / own_area_km2 if own_area_km2 else 0.0
        entry = {"unitCode": unit["unitCode"], "name": unit["name"], "share": round(share, 6)}
        (members if share >= MIN_ADM34_SHARE else slivers).append(entry)
    members.sort(key=lambda item: (-item["share"], item["unitCode"]))
    slivers.sort(key=lambda item: (-item["share"], item["unitCode"]))
    return members, slivers


def build(args: argparse.Namespace) -> dict[str, Any]:
    started = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    geometry_dir: Path = args.geometry_dir
    capsule_path: Path = args.vendored_source

    gdb_path = args.gdb
    if gdb_path is None:
        matches = sorted(REPOSITORY_ROOT.glob(DEFAULT_GDB_GLOB))
        gdb_path = matches[0] if matches else None
    if gdb_path is not None and gdb_path.exists() and (args.refresh or not capsule_path.exists()):
        records = read_gdb(gdb_path)
        capsule = source_capsule(records, extracted_at=started)
        write_capsule(capsule_path, capsule)
        source_metadata = capsule["metadata"]
        source_mode = "gdb"
    else:
        if not capsule_path.exists():
            raise FileNotFoundError(
                "Neither the Aqueduct GDB nor the vendored capsule is available; "
                "pass --gdb or restore tools/vietnam_spatial/source"
            )
        records, source_metadata = read_capsule(capsule_path)
        source_mode = "vendored-capsule"
    if len(records) != EXPECTED_UNIT_COUNT:
        raise ValueError(f"Expected {EXPECTED_UNIT_COUNT} Viet Nam units, found {len(records)}")
    # Published assets are stamped with the capsule extraction time, not the
    # wall clock, so a rebuild from the same capsule is byte-identical.
    asset_generated_at = source_metadata.get("extractedAt", started)

    download = load_download_rows(args.download)
    aliases = read_json(geometry_dir / "vnm-adm1-aliases.json")
    lookup: dict[str, str] = aliases["lookup"]
    canonical_name = {
        item["adm1Code"]: item["canonicalName"] for item in aliases["aliases"]
    }
    adm34_units = load_adm34(geometry_dir)
    adm34_tree = STRtree([unit["geometry"] for unit in adm34_units])
    adm34_by_member: dict[str, dict[str, Any]] = {
        code: unit for unit in adm34_units for code in unit["memberAdm1Codes"]
    }

    validation: dict[str, Any] = {
        "sourceMode": source_mode,
        "sourceFeatureCount": len(records),
        "downloadUnitRowCount": len(download),
        "joinMatchedCount": 0,
        "joinUnmatchedSourceIds": [],
        "joinUnmatchedDownloadIds": [],
        "invalidSourceGeometries": [],
        "emptySourceGeometries": [],
        "publishedFeatureCount": 0,
        "duplicateIdCount": 0,
        "outsideBboxCount": 0,
        "adm1NameUnmatched": [],
        "adm34MismatchRows": [],
        "adm34SliverExclusions": 0,
        "adm34MultiMembershipCount": 0,
        "adm34NoMembershipUnits": [],
        "adm34PrimaryMethodCounts": {},
        "scoreMismatchCount": 0,
        "scoreMismatches": [],
        "simplificationToleranceDeg": 0,
        "syntheticVertexCount": 0,
    }

    features: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    bbox = [180.0, 90.0, -180.0, -90.0]
    valid_geometries: dict[str, Any] = {}
    source_vertices: set[tuple[float, float]] = set()

    for record in sorted(records, key=lambda item: item["properties"]["string_id"]):
        properties = record["properties"]
        geometry = record["geometry"]
        string_id = str(properties["string_id"])
        if string_id in seen_ids:
            validation["duplicateIdCount"] += 1
            raise ValueError(f"Duplicate string_id in the source: {string_id}")
        seen_ids.add(string_id)

        joined = download.get(string_id)
        if joined is None:
            validation["joinUnmatchedSourceIds"].append(string_id)
        else:
            validation["joinMatchedCount"] += 1

        if geometry.is_empty:
            # The source row exists (area_km2 attribute filled) but carries no
            # shape. Nothing is drawn for it; the value stays download-only.
            validation["emptySourceGeometries"].append(
                {
                    "stringId": string_id,
                    "gadmName1": str(properties["name_1"]),
                    "areaKm2Source": float(properties["area_km2"]),
                    "csvAdm34Name": joined["attributes"].get("2025_개편_후_소속_34개_체계") if joined else None,
                }
            )
            continue

        if not geometry.is_valid:
            validation["invalidSourceGeometries"].append(
                {"stringId": string_id, "reason": explain_validity(geometry)}
            )
            valid_geometry = make_valid(geometry)
        else:
            valid_geometry = geometry
        valid_geometries[string_id] = valid_geometry
        geometry_json = mapping(geometry)
        source_vertices |= vertices(geometry_json)

        minx, miny, maxx, maxy = geometry.bounds
        if minx < VIETNAM_BBOX[0] or miny < VIETNAM_BBOX[1] or maxx > VIETNAM_BBOX[2] or maxy > VIETNAM_BBOX[3]:
            validation["outsideBboxCount"] += 1
        bbox = [min(bbox[0], minx), min(bbox[1], miny), max(bbox[2], maxx), max(bbox[3], maxy)]

        name_1 = str(properties["name_1"])
        adm1_code = lookup.get(normalize_text(name_1))
        if adm1_code is None:
            validation["adm1NameUnmatched"].append(name_1)
            raise ValueError(f"GADM name_1 {name_1!r} matches no ADM1 alias")

        area_geodesic = geodesic_area_km2(valid_geometry)
        members, slivers = adm34_membership(valid_geometry, area_geodesic, adm34_units, adm34_tree)
        validation["adm34SliverExclusions"] += len(slivers)
        if len(members) > 1:
            validation["adm34MultiMembershipCount"] += 1
        crosswalk_unit = adm34_by_member[adm1_code]
        # Primary = largest geodesic share. Below the 5% threshold the list is
        # empty but the largest overlap is still the best geometric answer; a
        # unit that touches no 2025 boundary at all (offshore or tidal GADM
        # area) falls back to the crosswalk of its own GADM province.
        if members:
            primary, primary_method = members[0], "geometric"
        elif slivers:
            primary, primary_method = slivers[0], "geometric-below-threshold"
        else:
            primary = {"unitCode": crosswalk_unit["unitCode"], "name": crosswalk_unit["name"], "share": 0.0}
            primary_method = "crosswalk-fallback"
        if not members:
            validation["adm34NoMembershipUnits"].append(
                {"stringId": string_id, "areaKm2": round(area_geodesic, 3), "primary": primary, "method": primary_method}
            )
        validation["adm34PrimaryMethodCounts"][primary_method] = (
            validation["adm34PrimaryMethodCounts"].get(primary_method, 0) + 1
        )

        csv_adm34_name = joined["attributes"].get("2025_개편_후_소속_34개_체계") if joined else None
        if joined is not None:
            if normalize_text(csv_adm34_name or "") != normalize_text(primary["name"]) or (
                crosswalk_unit["unitCode"] != primary["unitCode"]
            ):
                validation["adm34MismatchRows"].append(
                    {
                        "stringId": string_id,
                        "gadmName1": name_1,
                        "areaKm2": round(area_geodesic, 3),
                        "csvAdm34Name": csv_adm34_name,
                        "crosswalkUnitCode": crosswalk_unit["unitCode"],
                        "geometricPrimary": primary,
                        "primaryMethod": primary_method,
                        "members": members,
                    }
                )
            for variable in VARIABLES:
                csv_score = joined["attributes"].get(variable["scoreAttr"])
                gdb_score = properties.get(variable["gdbField"])
                if gdb_score is not None and float(gdb_score) == -9999:
                    gdb_score = None  # Aqueduct's no-data sentinel; the download stores null
                if csv_score is None and gdb_score is None:
                    continue
                if csv_score is None or gdb_score is None or abs(float(csv_score) - float(gdb_score)) > SCORE_TOLERANCE:
                    validation["scoreMismatchCount"] += 1
                    if len(validation["scoreMismatches"]) < 20:
                        validation["scoreMismatches"].append(
                            {"stringId": string_id, "variable": variable["key"], "csv": csv_score, "gdb": gdb_score}
                        )

        pfaf_id = none_if_missing(properties["pfaf_id"])
        aq_id = none_if_missing(properties["aqid"])
        adm1_name = canonical_name[adm1_code]
        label = f"유역 {pfaf_id} · {adm1_name}" if pfaf_id else f"유역 미지정 · {adm1_name}"
        features.append(
            {
                "type": "Feature",
                "id": string_id,
                "properties": {
                    "elementId": ELEMENT_ID,
                    "stringId": string_id,
                    "aq30Id": none_if_missing(properties.get("aq30_id")),
                    "pfafId": pfaf_id,
                    "gid1": str(properties["gid_1"]),
                    "aqId": aq_id,
                    "adm1Code": adm1_code,
                    "adm1Name": adm1_name,
                    "gadmName1": name_1,
                    "label": label,
                    "areaKm2Source": round(float(properties["area_km2"]), 3),
                    "areaKm2Geodesic": round(area_geodesic, 3),
                    "adm1Codes34": [member["unitCode"] for member in members],
                    "adm1Code34Primary": primary["unitCode"],
                    "adm1Name34Primary": primary["name"],
                    "adm1Code34PrimaryShare": primary["share"],
                    "adm1Code34PrimaryMethod": primary_method,
                    "adm1Codes34Shares": {member["unitCode"]: member["share"] for member in members},
                    "sourceGeometryValid": geometry.is_valid,
                    "geometryProvenance": "source-provided-polygon",
                    "isSynthetic": False,
                    "license": LICENSE,
                    "attribution": ATTRIBUTION,
                },
                "geometry": geometry_json,
            }
        )

    validation["publishedFeatureCount"] = len(features)
    validation["joinUnmatchedDownloadIds"] = sorted(set(download) - seen_ids)
    validation["joinMatchRate"] = round(validation["joinMatchedCount"] / len(download), 6) if download else 0
    if validation["joinUnmatchedSourceIds"] or validation["joinUnmatchedDownloadIds"]:
        raise ValueError(
            "string_id join is not exact: "
            f"source-only {validation['joinUnmatchedSourceIds'][:5]}, "
            f"download-only {validation['joinUnmatchedDownloadIds'][:5]}"
        )

    unit_collection = {
        "type": "FeatureCollection",
        "name": "vnm-aqueduct40-basins",
        "bbox": [round(value, 9) for value in bbox],
        "metadata": {
            "schemaVersion": "v155-spatial-1",
            "elementId": ELEMENT_ID,
            "title": "Viet Nam Aqueduct 4.0 water-risk assessment units",
            "unitDefinition": SOURCE_UNIT_DEFINITION,
            "joinKey": "stringId",
            "sourceTitle": SOURCE_TITLE,
            "source": SOURCE_NAME,
            "sourceDatasetUrl": SOURCE_DATASET_URL,
            "sourceDownloadUrl": SOURCE_DOWNLOAD_URL,
            "sourceZipSha256": SOURCE_ZIP_SHA256,
            "sourceGdb": SOURCE_GDB,
            "sourceLayer": SOURCE_LAYER,
            "sourceRelease": SOURCE_RELEASE,
            "sourceExtractedAt": source_metadata.get("extractedAt"),
            "license": LICENSE,
            "licenseUrl": LICENSE_URL,
            "attribution": ATTRIBUTION,
            "accuracyNotice": ACCURACY_NOTICE,
            "crs": "OGC:CRS84 (longitude, latitude; equivalent datum to EPSG:4326)",
            "featureCount": len(features),
            "simplificationToleranceDeg": 0,
            "simplificationNotice": "Source vertices are published unchanged; the subset is small enough without simplification.",
            "adm34Rule": f"adm1Codes34 lists 2025 units whose geodesic overlap is at least {MIN_ADM34_SHARE:.0%} of the unit area; adm1Code34Primary is the largest share.",
            "geometryProvenance": "source-provided-polygon",
            "isSynthetic": False,
            "generatedAt": asset_generated_at,
        },
        "features": features,
    }
    unit_path = geometry_dir / UNIT_ASSET_NAME
    write_json(unit_path, unit_collection)

    # ---- level-6 basin dissolve (geometry only) --------------------------
    groups: dict[str, list[str]] = defaultdict(list)
    for feature in features:
        pfaf_id = feature["properties"]["pfafId"]
        if pfaf_id:
            groups[pfaf_id].append(feature["properties"]["stringId"])
    by_id = {feature["properties"]["stringId"]: feature for feature in features}
    l6_features: list[dict[str, Any]] = []
    l6_validation = {
        "basinCount": 0,
        "memberUnitCount": 0,
        "unitsWithoutBasin": sum(1 for feature in features if not feature["properties"]["pfafId"]),
        "invalidDissolveCount": 0,
        "syntheticVertexCount": 0,
        "areaDeltaPpmMax": 0.0,
        "usedMakeValidFor": [],
    }
    l6_bbox = [180.0, 90.0, -180.0, -90.0]
    for pfaf_id in sorted(groups):
        member_ids = sorted(groups[pfaf_id])
        originals = [shape(by_id[string_id]["geometry"]) for string_id in member_ids]
        dissolved = unary_union(originals)
        if not dissolved.is_valid:
            dissolved = unary_union([valid_geometries[string_id] for string_id in member_ids])
            l6_validation["usedMakeValidFor"].append(pfaf_id)
        dissolved = polygon_only(dissolved)
        if dissolved.is_empty or not dissolved.is_valid:
            l6_validation["invalidDissolveCount"] += 1
            raise ValueError(f"Dissolve for basin {pfaf_id} is invalid: {explain_validity(dissolved)}")
        dissolved_json = mapping(dissolved)
        synthetic = vertices(dissolved_json) - source_vertices
        l6_validation["syntheticVertexCount"] += len(synthetic)
        member_area = sum(geodesic_area_km2(valid_geometries[string_id]) for string_id in member_ids)
        dissolved_area = geodesic_area_km2(dissolved)
        delta_ppm = abs(dissolved_area - member_area) / member_area * 1_000_000 if member_area else 0.0
        l6_validation["areaDeltaPpmMax"] = max(l6_validation["areaDeltaPpmMax"], delta_ppm)
        members, _ = adm34_membership(dissolved, dissolved_area, adm34_units, adm34_tree)
        adm1_codes = sorted({by_id[string_id]["properties"]["adm1Code"] for string_id in member_ids})
        minx, miny, maxx, maxy = dissolved.bounds
        l6_bbox = [min(l6_bbox[0], minx), min(l6_bbox[1], miny), max(l6_bbox[2], maxx), max(l6_bbox[3], maxy)]
        l6_features.append(
            {
                "type": "Feature",
                "id": f"L6-{pfaf_id}",
                "properties": {
                    "elementId": ELEMENT_ID,
                    "pfafId": pfaf_id,
                    "label": f"유역 {pfaf_id}",
                    "memberStringIds": member_ids,
                    "memberCount": len(member_ids),
                    "adm1Codes": adm1_codes,
                    "adm1Codes34": [member["unitCode"] for member in members],
                    "adm1Code34Primary": members[0]["unitCode"] if members else None,
                    "areaKm2Geodesic": round(dissolved_area, 3),
                    "areaKm2SourceSum": round(
                        sum(by_id[string_id]["properties"]["areaKm2Source"] for string_id in member_ids), 3
                    ),
                    "clipNotice": "HydroBASINS lvl6 유역 중 베트남(GADM 4.1) 안쪽 부분만 포함합니다.",
                    "valuesAreAggregated": False,
                    "geometryProvenance": "dissolve-of-source-polygons",
                    "isSynthetic": False,
                },
                "geometry": dissolved_json,
            }
        )
        l6_validation["basinCount"] += 1
        l6_validation["memberUnitCount"] += len(member_ids)
    if l6_validation["syntheticVertexCount"]:
        raise ValueError(
            f"{l6_validation['syntheticVertexCount']} dissolved vertices are absent from the source units"
        )
    l6_validation["areaDeltaPpmMax"] = round(l6_validation["areaDeltaPpmMax"], 6)
    l6_collection = {
        "type": "FeatureCollection",
        "name": "vnm-aqueduct40-basins-l6",
        "bbox": [round(value, 9) for value in l6_bbox],
        "metadata": {
            "schemaVersion": "v155-spatial-1",
            "elementId": ELEMENT_ID,
            "title": "Viet Nam HydroBASINS level-6 basins (Aqueduct 4.0 units dissolved by pfaf_id)",
            "derivation": (
                "shapely.ops.unary_union of the Aqueduct 4.0 units sharing a pfaf_id; units "
                "without a basin (-9999) are excluded. Every vertex exists in the unit asset."
            ),
            "derivedFrom": f"/data/vietnam/v2/geometry/{UNIT_ASSET_NAME}",
            "joinKey": "pfafId",
            "valuesAreAggregated": False,
            "valuesNotice": "기하 전용 자산입니다. B-017 값은 평가구역(string_id) 단위로만 제공하며 유역 단위로 합산·평균하지 않습니다.",
            "license": LICENSE,
            "licenseUrl": LICENSE_URL,
            "attribution": ATTRIBUTION,
            "accuracyNotice": ACCURACY_NOTICE,
            "crs": "OGC:CRS84 (longitude, latitude; equivalent datum to EPSG:4326)",
            "featureCount": len(l6_features),
            "generatedAt": asset_generated_at,
        },
        "features": l6_features,
    }
    l6_path = geometry_dir / L6_ASSET_NAME
    write_json(l6_path, l6_collection)

    # ---- value draft ------------------------------------------------------
    values: list[dict[str, Any]] = []
    coverage: dict[str, dict[str, int]] = {
        variable["key"]: {"matched": 0, "missing": 0, "providedZero": 0} for variable in VARIABLES
    }
    for feature in features:
        string_id = feature["properties"]["stringId"]
        joined = download[string_id]
        attributes = joined["attributes"]
        for variable in VARIABLES:
            score = attributes.get(variable["scoreAttr"])
            category = attributes.get(variable["labelAttr"])
            if score is None:
                coverage[variable["key"]]["missing"] += 1
                continue
            if float(score) == 0:
                coverage[variable["key"]]["providedZero"] += 1
            coverage[variable["key"]]["matched"] += 1
            values.append(
                {
                    "stringId": string_id,
                    "pfafId": feature["properties"]["pfafId"],
                    "adm1Code": feature["properties"]["adm1Code"],
                    "adm1Code34Primary": feature["properties"]["adm1Code34Primary"],
                    "label": feature["properties"]["label"],
                    "imputed": False,
                    "period": PERIOD,
                    "sourceIndicatorId": BASIN_INDICATOR_ID,
                    "sourceRecordId": joined["row"]["record_id"],
                    "sourceSpatialUnit": "aqueduct40-unit",
                    "unit": "점",
                    "value": float(score),
                    "rawValue": attributes.get(variable["rawAttr"]),
                    "categoryLabel": category,
                    "variable": variable["key"],
                    "variableLabel": variable["label"],
                }
            )
    unmappable_ids = [item["stringId"] for item in validation["emptySourceGeometries"]]
    draft = {
        "assetSchemaVersion": "v124-spatial-layer-1",
        "pending": True,
        "pendingNotice": "P6b가 map-index에 등록하기 전까지 spatial/layers 밖에 둡니다. 값은 공개 다운로드 b-017.csv를 stringId로 조인한 것이며 집계·보정하지 않았습니다.",
        "boundarySystem": "aqueduct40-unit",
        "boundaryPolicy": "none",
        "countryIso3": "VNM",
        "coverageKind": "full",
        "elementId": ELEMENT_ID,
        "generatedAt": asset_generated_at,
        "geometryUrl": f"/data/vietnam/v2/geometry/{UNIT_ASSET_NAME}",
        "alternateGeometryUrl": f"/data/vietnam/v2/geometry/{L6_ASSET_NAME}",
        "joinKey": "stringId",
        "schemaVersion": "v124",
        "selectors": {
            "defaultPeriod": PERIOD,
            "defaultVariable": VARIABLES[0]["key"],
            "periods": [PERIOD],
            "periodLabels": {PERIOD: PERIOD_LABEL},
            "variables": [
                {
                    "key": variable["key"],
                    "label": variable["label"],
                    "maxFeatureCount": coverage[variable["key"]]["matched"],
                    "measureId": variable["gdbField"],
                    "periods": [PERIOD],
                    "unit": "점",
                    "scale": {"min": 0, "max": 5, "note": "Aqueduct 4.0 정규화 점수(0–5)"},
                }
                for variable in VARIABLES
            ],
        },
        "seriesCoverage": [
            {
                "expectedCount": len(download),
                "failureCount": 0,
                "matchedCount": coverage[variable["key"]]["matched"],
                "missingCount": coverage[variable["key"]]["missing"] + len(unmappable_ids),
                "geometryMissingCount": len(unmappable_ids),
                "period": PERIOD,
                "variable": variable["key"],
            }
            for variable in VARIABLES
        ],
        "source": {
            "attribution": [ATTRIBUTION],
            "licenses": [LICENSE],
            "organizations": [SOURCE_NAME],
            "urls": [SOURCE_DATASET_URL],
        },
        "validation": {
            "duplicateValueCount": 0,
            "expectedUnitCount": len(download),
            "fakeGeometryCount": 0,
            "joinFailureCount": 0,
            "geometryMissingUnitCount": len(unmappable_ids),
            "geometryMissingUnitIds": unmappable_ids,
            "geometryMissingNotice": "원천 GDB에 도형이 비어 있는 평가구역은 지도에 그리지 않으며 값은 다운로드에서만 제공합니다.",
            "matchedUnitCount": len(features),
            "maxSeriesFeatureCount": max(item["matched"] for item in coverage.values()),
            "missingUnitCount": 0,
            "providedZeroCount": sum(item["providedZero"] for item in coverage.values()),
            "publishedValueCount": len(values),
            "sourceValueCount": len(values),
            "suppressedValueCount": sum(item["missing"] for item in coverage.values()),
            "zeroImputationCount": 0,
        },
        "values": values,
    }
    draft_path = PENDING_DIR / DRAFT_LAYER_NAME
    write_json(draft_path, draft)

    # ---- manifest + report --------------------------------------------------
    unit_entry = {
        "accuracyNotice": ACCURACY_NOTICE,
        "attribution": ATTRIBUTION,
        "elementId": ELEMENT_ID,
        "featureCount": len(features),
        "geometryTypes": sorted({feature["geometry"]["type"] for feature in features}),
        "joinKey": "stringId",
        "kind": "aqueduct40-units",
        "license": LICENSE,
        "licenseUrl": LICENSE_URL,
        "sha256": sha256_path(unit_path),
        "source": {
            "downloadUrl": SOURCE_DOWNLOAD_URL,
            "datasetUrl": SOURCE_DATASET_URL,
            "extractedAt": source_metadata.get("extractedAt"),
            "gdb": SOURCE_GDB,
            "layer": SOURCE_LAYER,
            "name": SOURCE_NAME,
            "release": SOURCE_RELEASE,
            "subset": "gid_0 = 'VNM'",
            "zipSha256": SOURCE_ZIP_SHA256,
        },
        "unitDefinition": SOURCE_UNIT_DEFINITION,
        "url": f"/data/vietnam/v2/geometry/{UNIT_ASSET_NAME}",
        "validation": {
            "adm34MismatchCount": len(validation["adm34MismatchRows"]),
            "adm34MultiMembershipCount": validation["adm34MultiMembershipCount"],
            "adm34NoMembershipCount": len(validation["adm34NoMembershipUnits"]),
            "duplicateIdCount": 0,
            "emptySourceGeometryCount": len(validation["emptySourceGeometries"]),
            "emptySourceGeometryIds": [item["stringId"] for item in validation["emptySourceGeometries"]],
            "featureCount": len(features),
            "sourceFeatureCount": validation["sourceFeatureCount"],
            "geometryValidity": "pass" if not validation["invalidSourceGeometries"] else "source-invalid-preserved",
            "invalidSourceGeometryCount": len(validation["invalidSourceGeometries"]),
            "joinMatchRate": validation["joinMatchRate"],
            "joinMatchedCount": validation["joinMatchedCount"],
            "scoreMismatchCount": validation["scoreMismatchCount"],
            "simplificationToleranceDeg": 0,
            "validator": "Shapely 2.1.2 (GEOS is_valid) + pyproj Geod area",
        },
        "version": SOURCE_RELEASE,
    }
    l6_entry = {
        "accuracyNotice": ACCURACY_NOTICE,
        "attribution": ATTRIBUTION,
        "derivedFrom": {
            "asset": f"/data/vietnam/v2/geometry/{UNIT_ASSET_NAME}",
            "method": "shapely.ops.unary_union grouped by pfaf_id (-9999 excluded)",
            "sha256": unit_entry["sha256"],
        },
        "elementId": ELEMENT_ID,
        "featureCount": len(l6_features),
        "geometryTypes": sorted({feature["geometry"]["type"] for feature in l6_features}),
        "joinKey": "pfafId",
        "kind": "aqueduct40-basins-l6",
        "license": LICENSE,
        "licenseUrl": LICENSE_URL,
        "sha256": sha256_path(l6_path),
        "url": f"/data/vietnam/v2/geometry/{L6_ASSET_NAME}",
        "validation": {**l6_validation, "geometryValidity": "pass", "validator": "Shapely 2.1.2 (GEOS is_valid) + pyproj Geod area"},
        "valuesAreAggregated": False,
        "valuesNotice": l6_collection["metadata"]["valuesNotice"],
        "version": SOURCE_RELEASE,
    }
    if not args.skip_manifest:
        manifest_path = geometry_dir / MANIFEST_NAME
        manifest = read_json(manifest_path)
        kept = [item for item in manifest["assets"] if item.get("kind") not in {unit_entry["kind"], l6_entry["kind"]}]
        # Appended, not sorted: a parallel PR appends its own entries and a
        # rebase must keep both sides.
        manifest["assets"] = kept + [unit_entry, l6_entry]
        write_json(manifest_path, manifest)

    report = {
        "schema": "v155-asset-report-1",
        "asset": UNIT_ASSET_NAME,
        "generatedAt": started,
        "outputs": {
            UNIT_ASSET_NAME: {"bytes": unit_path.stat().st_size, "gzipBytes": gzip_size(unit_path), "sha256": unit_entry["sha256"], "bbox": unit_collection["bbox"]},
            L6_ASSET_NAME: {"bytes": l6_path.stat().st_size, "gzipBytes": gzip_size(l6_path), "sha256": l6_entry["sha256"], "bbox": l6_collection["bbox"]},
            f"spatial/pending-v155/{DRAFT_LAYER_NAME}": {"bytes": draft_path.stat().st_size, "gzipBytes": gzip_size(draft_path), "publishedValueCount": len(values)},
            "vendoredSource": {"path": capsule_path.relative_to(REPOSITORY_ROOT).as_posix(), "sha256": sha256_path(capsule_path)},
        },
        "validation": validation,
        "l6": l6_validation,
        "coverage": coverage,
        "source": unit_entry["source"],
    }
    write_json(REPORT_DIR / REPORT_NAME, report)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gdb", type=Path, help="Aqueduct 4.0 file geodatabase; defaults to the ignored _source cache")
    parser.add_argument("--vendored-source", type=Path, default=VENDORED_SOURCE)
    parser.add_argument("--refresh", action="store_true", help="Re-read the GDB and rewrite the vendored capsule")
    parser.add_argument("--geometry-dir", type=Path, default=GEOMETRY_DIR)
    parser.add_argument("--download", type=Path, default=DOWNLOADS_DIR / "b-017.csv")
    parser.add_argument("--skip-manifest", action="store_true")
    args = parser.parse_args()
    report = build(args)
    summary = {
        "status": "PASS",
        "joinMatched": f"{report['validation']['joinMatchedCount']}/{report['validation']['downloadUnitRowCount']}",
        "adm34Mismatch": len(report["validation"]["adm34MismatchRows"]),
        "scoreMismatch": report["validation"]["scoreMismatchCount"],
        "invalidSource": len(report["validation"]["invalidSourceGeometries"]),
        "emptySource": [item["stringId"] for item in report["validation"]["emptySourceGeometries"]],
        "published": report["validation"]["publishedFeatureCount"],
        "noMembership": len(report["validation"]["adm34NoMembershipUnits"]),
        "l6Basins": report["l6"]["basinCount"],
        "gzipBytes": {name: item.get("gzipBytes") for name, item in report["outputs"].items()},
    }
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
