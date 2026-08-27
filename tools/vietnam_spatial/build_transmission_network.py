"""Build the verified Vietnam A-024 transmission-line GeoJSON for V124.

The World Bank/ENERGYDATA.INFO resource contains the actual 2016 line
coordinates digitized from the source network map.  It must not be replaced by
lines inferred from the start points stored in the public workbook projection.

The upstream GeoJSON currently has a literal ``System.IO.MemoryStream`` suffix
after the valid JSON document.  The byte-for-byte source hash is pinned here;
only that known suffix is removed during decoding.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import math
import os
import tempfile
import urllib.request
from pathlib import Path
from typing import Any, Iterable, Sequence


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_CACHE = (
    REPO_ROOT
    / "_source"
    / "vietnam"
    / "v124"
    / "spatial"
    / "transmissionlinekv.geojson"
)
DEFAULT_VENDORED_SOURCE = (
    Path(__file__).resolve().parent
    / "source"
    / "vnm-transmission-network-source.geojson.gz"
)
DEFAULT_OUTPUT = (
    REPO_ROOT
    / "public"
    / "data"
    / "vietnam"
    / "v2"
    / "geometry"
    / "vnm-transmission-network.geojson"
)

SOURCE_DATASET_URL = (
    "https://energydata.info/dataset/vietnam-electricity-transmission-network-2016"
)
SOURCE_RESOURCE_URL = (
    "https://datacatalogfiles.worldbank.org/ddh-published/0042329/1/"
    "DR0053028/transmissionlinekv.geojson"
)
SOURCE_RESOURCE_PAGE = (
    "https://energydata.info/dataset/vietnam-electricity-transmission-network-2016/"
    "resource/9770a72f-e548-4cd8-8664-3d46693b8177"
)
SOURCE_RESOURCE_ID = "9770a72f-e548-4cd8-8664-3d46693b8177"
SOURCE_SHA256 = "5afa4f4e630ad27e3601dccbc36bf1312d7b7af801c397b09bf917d9269155c7"
SOURCE_DOCUMENT_SHA256 = (
    "75bb82054b3643337602bcbf67a0d7a9d2753e939f5fdc7c016dbb22fcde1815"
)
VENDORED_SOURCE_SHA256 = (
    "155c2b5c84c205c77b52bfe701997301f0cd6eed917ca2463b4e2da648aec7ff"
)
EXPECTED_FEATURE_COUNT = 606
EXPECTED_TRAILING_MARKER = "System.IO.MemoryStream"

SOURCE_NAME = "World Bank Group / ENERGYDATA.INFO"
SOURCE_TITLE = "Vietnam - Electricity Transmission Network"
SOURCE_YEAR = 2016
SOURCE_VERSION = "2016 network; source resource last modified 2018-11-14"
LICENSE = "CC-BY-4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
ATTRIBUTION = (
    "World Bank Group / ENERGYDATA.INFO, Vietnam - Electricity Transmission "
    "Network (2016), CC BY 4.0"
)
ACCURACY_NOTICE = (
    "Digitized from a georeferenced PDF. The source warns of isolated horizontal "
    "and vertical displacement of 2–10 km; use only for approximate visualization, "
    "not high-accuracy engineering or routing."
)


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def fetch_source(cache_path: Path, *, refresh: bool) -> bytes:
    if cache_path.exists() and not refresh:
        return cache_path.read_bytes()

    request = urllib.request.Request(
        SOURCE_RESOURCE_URL,
        headers={"User-Agent": "nigtldcmap-v124-spatial-builder/1.0"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = response.read()

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=cache_path.parent, delete=False, prefix="transmission-", suffix=".tmp"
    ) as handle:
        handle.write(payload)
        temporary_path = Path(handle.name)
    os.replace(temporary_path, cache_path)
    return payload


def decode_pinned_geojson(payload: bytes) -> dict[str, Any]:
    source_hash = sha256_bytes(payload)
    if source_hash != SOURCE_SHA256:
        raise ValueError(
            "World Bank source payload hash changed: "
            f"expected {SOURCE_SHA256}, received {source_hash}"
        )

    text = payload.decode("utf-8-sig")
    document, end = json.JSONDecoder().raw_decode(text)
    trailing_text = text[end:].strip()
    if trailing_text != EXPECTED_TRAILING_MARKER:
        raise ValueError(
            "Unexpected content after the upstream GeoJSON document: "
            f"{trailing_text!r}"
        )
    if document.get("type") != "FeatureCollection":
        raise ValueError("Source is not a GeoJSON FeatureCollection")
    document_hash = sha256_bytes(canonical_json(document).encode("utf-8"))
    if document_hash != SOURCE_DOCUMENT_SHA256:
        raise ValueError(
            "Valid source GeoJSON document hash changed: "
            f"expected {SOURCE_DOCUMENT_SHA256}, received {document_hash}"
        )
    return document


def vendored_source_document(source: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": source["type"],
        "name": "world-bank-vietnam-transmission-network-2016-source",
        "crs": source.get("crs"),
        "metadata": {
            "schemaVersion": "v124-spatial-source-1",
            "sourceTitle": SOURCE_TITLE,
            "source": SOURCE_NAME,
            "sourceDatasetUrl": SOURCE_DATASET_URL,
            "sourceResourceUrl": SOURCE_RESOURCE_URL,
            "sourceResourcePage": SOURCE_RESOURCE_PAGE,
            "sourceResourceId": SOURCE_RESOURCE_ID,
            "sourceYear": SOURCE_YEAR,
            "sourceVersion": SOURCE_VERSION,
            "sourcePayloadSha256": SOURCE_SHA256,
            "sourceDocumentSha256": SOURCE_DOCUMENT_SHA256,
            "license": LICENSE,
            "licenseUrl": LICENSE_URL,
            "attribution": ATTRIBUTION,
            "accuracyNotice": ACCURACY_NOTICE,
            "featureCount": len(source["features"]),
            "geometryProvenance": "source-provided-line",
            "isSynthetic": False,
        },
        "features": source["features"],
    }


def write_vendored_source(path: Path, source: dict[str, Any]) -> None:
    document = vendored_source_document(source)
    payload = (
        json.dumps(
            document,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        + "\n"
    ).encode("utf-8")
    compressed = gzip.compress(payload, compresslevel=9, mtime=0)
    compressed_hash = sha256_bytes(compressed)
    if compressed_hash != VENDORED_SOURCE_SHA256:
        raise ValueError(
            "Deterministic source capsule changed: "
            f"expected {VENDORED_SOURCE_SHA256}, received {compressed_hash}"
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=path.parent, delete=False, prefix=f"{path.stem}-", suffix=".tmp"
    ) as handle:
        handle.write(compressed)
        temporary_path = Path(handle.name)
    os.replace(temporary_path, path)


def read_vendored_source(path: Path) -> dict[str, Any]:
    compressed = path.read_bytes()
    compressed_hash = sha256_bytes(compressed)
    if compressed_hash != VENDORED_SOURCE_SHA256:
        raise ValueError(
            "Vendored transmission source hash changed: "
            f"expected {VENDORED_SOURCE_SHA256}, received {compressed_hash}"
        )
    try:
        document = json.loads(gzip.decompress(compressed).decode("utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError(f"Could not decode vendored transmission source: {path}") from error

    metadata = document.get("metadata", {})
    if metadata.get("sourceDocumentSha256") != SOURCE_DOCUMENT_SHA256:
        raise ValueError("Vendored transmission source has an unexpected source hash")
    if metadata.get("license") != LICENSE or metadata.get("sourceYear") != SOURCE_YEAR:
        raise ValueError("Vendored transmission source lost its license or version metadata")
    if metadata.get("featureCount") != EXPECTED_FEATURE_COUNT:
        raise ValueError("Vendored transmission source has an unexpected feature count")

    source = {
        "type": document.get("type"),
        "crs": document.get("crs"),
        "features": document.get("features"),
    }
    document_hash = sha256_bytes(canonical_json(source).encode("utf-8"))
    if document_hash != SOURCE_DOCUMENT_SHA256:
        raise ValueError(
            "Vendored transmission geometry differs from the pinned World Bank source"
        )
    return source


def iter_lines(geometry: dict[str, Any]) -> Iterable[Sequence[Sequence[float]]]:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geometry_type == "LineString":
        yield coordinates
    elif geometry_type == "MultiLineString":
        yield from coordinates
    else:
        raise ValueError(f"Unsupported transmission geometry type: {geometry_type!r}")


def validate_geometry(geometry: Any, feature_index: int) -> tuple[int, list[float]]:
    if not isinstance(geometry, dict):
        raise ValueError(f"Feature {feature_index} has no geometry")

    point_count = 0
    unique_points: set[tuple[float, float]] = set()
    bounds = [math.inf, math.inf, -math.inf, -math.inf]
    line_count = 0
    for line in iter_lines(geometry):
        line_count += 1
        if not isinstance(line, list) or len(line) < 2:
            raise ValueError(f"Feature {feature_index} contains a line with fewer than 2 points")
        line_unique_points: set[tuple[float, float]] = set()
        for coordinate in line:
            if not isinstance(coordinate, list) or len(coordinate) < 2:
                raise ValueError(f"Feature {feature_index} contains a malformed coordinate")
            longitude = float(coordinate[0])
            latitude = float(coordinate[1])
            if not math.isfinite(longitude) or not math.isfinite(latitude):
                raise ValueError(f"Feature {feature_index} contains a non-finite coordinate")
            if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
                raise ValueError(f"Feature {feature_index} contains an out-of-range coordinate")
            point = (longitude, latitude)
            line_unique_points.add(point)
            unique_points.add(point)
            bounds[0] = min(bounds[0], longitude)
            bounds[1] = min(bounds[1], latitude)
            bounds[2] = max(bounds[2], longitude)
            bounds[3] = max(bounds[3], latitude)
            point_count += 1
        if len(line_unique_points) < 2:
            raise ValueError(f"Feature {feature_index} contains a zero-length line")

    if line_count == 0 or len(unique_points) < 2:
        raise ValueError(f"Feature {feature_index} has empty line geometry")
    return point_count, bounds


def vincenty_distance_km(
    first: Sequence[float], second: Sequence[float]
) -> float:
    """Return the WGS84 ellipsoidal distance between two lon/lat points."""

    semi_major = 6_378_137.0
    flattening = 1 / 298.257_223_563
    semi_minor = (1 - flattening) * semi_major
    longitude_delta = math.radians(float(second[0]) - float(first[0]))
    reduced_first = math.atan(
        (1 - flattening) * math.tan(math.radians(float(first[1])))
    )
    reduced_second = math.atan(
        (1 - flattening) * math.tan(math.radians(float(second[1])))
    )
    sin_first, cos_first = math.sin(reduced_first), math.cos(reduced_first)
    sin_second, cos_second = math.sin(reduced_second), math.cos(reduced_second)
    longitude = longitude_delta

    for _ in range(200):
        sin_longitude = math.sin(longitude)
        cos_longitude = math.cos(longitude)
        sin_sigma = math.sqrt(
            (cos_second * sin_longitude) ** 2
            + (
                cos_first * sin_second
                - sin_first * cos_second * cos_longitude
            )
            ** 2
        )
        if sin_sigma == 0:
            return 0.0
        cos_sigma = (
            sin_first * sin_second
            + cos_first * cos_second * cos_longitude
        )
        sigma = math.atan2(sin_sigma, cos_sigma)
        sin_alpha = cos_first * cos_second * sin_longitude / sin_sigma
        cos_sq_alpha = 1 - sin_alpha**2
        cos_two_sigma_midpoint = (
            cos_sigma - 2 * sin_first * sin_second / cos_sq_alpha
            if cos_sq_alpha
            else 0.0
        )
        coefficient = (
            flattening
            / 16
            * cos_sq_alpha
            * (4 + flattening * (4 - 3 * cos_sq_alpha))
        )
        previous_longitude = longitude
        longitude = longitude_delta + (
            (1 - coefficient)
            * flattening
            * sin_alpha
            * (
                sigma
                + coefficient
                * sin_sigma
                * (
                    cos_two_sigma_midpoint
                    + coefficient
                    * cos_sigma
                    * (-1 + 2 * cos_two_sigma_midpoint**2)
                )
            )
        )
        if abs(longitude - previous_longitude) <= 1e-12:
            break
    else:
        raise ValueError("Vincenty distance did not converge")

    u_squared = (
        cos_sq_alpha
        * (semi_major**2 - semi_minor**2)
        / semi_minor**2
    )
    series_a = 1 + u_squared / 16_384 * (
        4096 + u_squared * (-768 + u_squared * (320 - 175 * u_squared))
    )
    series_b = u_squared / 1024 * (
        256 + u_squared * (-128 + u_squared * (74 - 47 * u_squared))
    )
    delta_sigma = (
        series_b
        * sin_sigma
        * (
            cos_two_sigma_midpoint
            + series_b
            / 4
            * (
                cos_sigma * (-1 + 2 * cos_two_sigma_midpoint**2)
                - series_b
                / 6
                * cos_two_sigma_midpoint
                * (-3 + 4 * sin_sigma**2)
                * (-3 + 4 * cos_two_sigma_midpoint**2)
            )
        )
    )
    return semi_minor * series_a * (sigma - delta_sigma) / 1000


def geometry_length_km(geometry: dict[str, Any]) -> float:
    return sum(
        vincenty_distance_km(first, second)
        for line in iter_lines(geometry)
        for first, second in zip(line, line[1:])
    )


def normalize(source: dict[str, Any]) -> dict[str, Any]:
    source_features = source.get("features")
    if not isinstance(source_features, list):
        raise ValueError("Source FeatureCollection has no features array")
    if len(source_features) != EXPECTED_FEATURE_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_FEATURE_COUNT} source lines, found {len(source_features)}"
        )

    normalized_features: list[dict[str, Any]] = []
    geometry_hashes: set[str] = set()
    geometry_types: set[str] = set()
    voltage_values: set[int] = set()
    collection_bounds = [math.inf, math.inf, -math.inf, -math.inf]
    coordinate_count = 0
    total_length_km = 0.0

    for feature_index, source_feature in enumerate(source_features, start=1):
        if not isinstance(source_feature, dict) or source_feature.get("type") != "Feature":
            raise ValueError(f"Source feature {feature_index} is malformed")
        geometry = source_feature.get("geometry")
        feature_coordinate_count, feature_bounds = validate_geometry(
            geometry, feature_index
        )
        geometry_hash = sha256_bytes(canonical_json(geometry).encode("utf-8"))
        if geometry_hash in geometry_hashes:
            raise ValueError(f"Duplicate transmission geometry at feature {feature_index}")
        geometry_hashes.add(geometry_hash)
        geometry_types.add(geometry["type"])
        coordinate_count += feature_coordinate_count
        for bound_index, value in enumerate(feature_bounds):
            if bound_index < 2:
                collection_bounds[bound_index] = min(
                    collection_bounds[bound_index], value
                )
            else:
                collection_bounds[bound_index] = max(
                    collection_bounds[bound_index], value
                )

        raw_voltage = source_feature.get("properties", {}).get("Voltage")
        voltage = int(raw_voltage)
        if voltage not in {110, 220, 500}:
            raise ValueError(
                f"Unexpected voltage {raw_voltage!r} at feature {feature_index}"
            )
        voltage_values.add(voltage)
        length_km = round(geometry_length_km(geometry), 6)
        if length_km <= 0:
            raise ValueError(f"Feature {feature_index} has non-positive length")
        total_length_km += length_km

        feature_id = f"A-024-WB2016-{feature_index:04d}"
        normalized_features.append(
            {
                "type": "Feature",
                "id": feature_id,
                "properties": {
                    "elementId": "A-024",
                    "featureId": feature_id,
                    "voltage": voltage,
                    "voltageUnit": "kV",
                    "voltageKv": voltage,
                    "status": "existing",
                    "length": length_km,
                    "lengthUnit": "km",
                    "lengthKm": length_km,
                    "lengthMethod": "WGS84 Vincenty geodesic",
                    "sourceYear": SOURCE_YEAR,
                    "source": SOURCE_NAME,
                    "sourceUrl": SOURCE_DATASET_URL,
                    "sourceResourceId": SOURCE_RESOURCE_ID,
                    "license": LICENSE,
                    "attribution": ATTRIBUTION,
                    "accuracyNotice": ACCURACY_NOTICE,
                    "geometryProvenance": "source-provided-line",
                    "isSynthetic": False,
                    "sourceFeatureIndex": feature_index,
                    "sourceGeometrySha256": geometry_hash,
                },
                "geometry": geometry,
            }
        )

    return {
        "type": "FeatureCollection",
        "name": "vnm-transmission-network",
        "bbox": [round(value, 9) for value in collection_bounds],
        "metadata": {
            "schemaVersion": "v124-spatial-1",
            "elementId": "A-024",
            "title": "Vietnam electricity transmission network",
            "description": "Verified source-provided 2016 transmission line geometry.",
            "sourceTitle": SOURCE_TITLE,
            "source": SOURCE_NAME,
            "sourceDatasetUrl": SOURCE_DATASET_URL,
            "sourceResourceUrl": SOURCE_RESOURCE_URL,
            "sourceResourcePage": SOURCE_RESOURCE_PAGE,
            "sourceResourceId": SOURCE_RESOURCE_ID,
            "sourceYear": SOURCE_YEAR,
            "sourceVersion": SOURCE_VERSION,
            "sourceSha256": SOURCE_SHA256,
            "sourceDocumentSha256": SOURCE_DOCUMENT_SHA256,
            "vendoredSourceSha256": VENDORED_SOURCE_SHA256,
            "sourcePayloadNotice": (
                "The pinned upstream payload ends with the non-JSON marker "
                f"{EXPECTED_TRAILING_MARKER!r}; the valid leading JSON document was decoded."
            ),
            "license": LICENSE,
            "licenseUrl": LICENSE_URL,
            "attribution": ATTRIBUTION,
            "accuracyNotice": ACCURACY_NOTICE,
            "crs": "OGC:CRS84 (longitude, latitude; equivalent datum to EPSG:4326)",
            "featureCount": len(normalized_features),
            "geometryTypes": sorted(geometry_types),
            "coordinateCount": coordinate_count,
            "emptyGeometryCount": 0,
            "invalidGeometryCount": 0,
            "duplicateGeometryCount": 0,
            "fakeGeometryCount": 0,
            "actualLineGeometry": True,
            "voltageValuesKv": sorted(voltage_values),
            "totalLengthKm": round(total_length_km, 3),
            "lengthMethod": "WGS84 Vincenty geodesic",
            "generatedAt": "2026-08-27",
        },
        "features": normalized_features,
    }


def write_json(path: Path, document: dict[str, Any]) -> None:
    payload = (
        json.dumps(
            document,
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    ).encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=path.parent, delete=False, prefix=f"{path.stem}-", suffix=".tmp"
    ) as handle:
        handle.write(payload)
        temporary_path = Path(handle.name)
    os.replace(temporary_path, path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build the verified V124 A-024 transmission GeoJSON."
    )
    parser.add_argument(
        "--source-file",
        type=Path,
        help="Pinned raw World Bank payload; defaults to the tracked offline source.",
    )
    parser.add_argument(
        "--vendored-source", type=Path, default=DEFAULT_VENDORED_SOURCE
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Download the pinned World Bank source even when the ignored cache exists.",
    )
    parser.add_argument(
        "--update-vendored-source",
        action="store_true",
        help="Rewrite the deterministic tracked source capsule from the pinned raw payload.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    vendored_source_path = args.vendored_source.resolve()
    if args.source_file is not None or args.refresh or not vendored_source_path.exists():
        source_file = (
            args.source_file.resolve()
            if args.source_file is not None
            else DEFAULT_SOURCE_CACHE.resolve()
        )
        payload = fetch_source(source_file, refresh=args.refresh)
        source = decode_pinned_geojson(payload)
        if args.update_vendored_source or not vendored_source_path.exists():
            write_vendored_source(vendored_source_path, source)
    else:
        source = read_vendored_source(vendored_source_path)
    output = normalize(source)
    write_json(args.output.resolve(), output)
    metadata = output["metadata"]
    print(
        json.dumps(
            {
                "result": "PASS",
                "output": str(args.output.resolve()),
                "featureCount": metadata["featureCount"],
                "geometryTypes": metadata["geometryTypes"],
                "emptyGeometryCount": metadata["emptyGeometryCount"],
                "duplicateGeometryCount": metadata["duplicateGeometryCount"],
                "fakeGeometryCount": metadata["fakeGeometryCount"],
                "totalLengthKm": metadata["totalLengthKm"],
                "sourceSha256": metadata["sourceSha256"],
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
