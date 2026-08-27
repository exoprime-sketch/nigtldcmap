"""Build the verified pre-2025 Viet Nam ADM1 63-unit boundary asset.

The pinned geoBoundaries source contains 64 source shapes because Con Dao is
stored separately from Ba Ria-Vung Tau. Both shapes carry the same ADM1 code
(`VN-43`). This builder groups source shapes by their ADM1 code and preserves
all source coordinates in a MultiPolygon; it never synthesizes coordinates.

Install the validation dependency before running:

    python -m pip install -r tools/vietnam_spatial/requirements-adm1.txt
    python tools/vietnam_spatial/build_adm1.py
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

from shapely.geometry import shape
from shapely.validation import explain_validity


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = REPOSITORY_ROOT / "public" / "data" / "vietnam" / "v2" / "geometry"
DEFAULT_CANONICAL_DIR = REPOSITORY_ROOT / "tools" / "vietnam_spatial" / "source"

SOURCE_COMMIT = "9469f09"
SOURCE_URL = (
    "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/"
    f"{SOURCE_COMMIT}/releaseData/gbOpen/VNM/ADM1/"
    "geoBoundaries-VNM-ADM1.geojson"
)
SOURCE_METADATA_URL = (
    "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/"
    f"{SOURCE_COMMIT}/releaseData/gbOpen/VNM/ADM1/"
    "geoBoundaries-VNM-ADM1-metaData.json"
)
SOURCE_API_URL = "https://www.geoboundaries.org/api/current/gbOpen/VNM/ADM1/"
SOURCE_SHA256 = "25dbc2fec9862016710118fc98042d3e803830c72361c91c4e864ae668fa9541"

EXPECTED_SOURCE_FEATURE_COUNT = 64
EXPECTED_OUTPUT_FEATURE_COUNT = 63
EXPECTED_DUPLICATE_CODE = "VN-43"
EXPECTED_DUPLICATE_NAMES = {"Bà Rịa–Vũng Tàu", "Côn Đảo"}

CANONICAL_NAME_OVERRIDES = {
    "VN-43": "Bà Rịa–Vũng Tàu",
    "VN-HN": "Hà Nội",
    "VN-SG": "Hồ Chí Minh",
}

MANUAL_ALIASES: dict[str, list[str]] = {
    "VN-43": [
        "Bà Rịa - Vũng Tàu",
        "Bà Rịa – Vũng Tàu",
        "Ba Ria Vung Tau",
        "Ba Ria-Vung Tau",
        "Vung Tau",
    ],
    "VN-33": ["Dak Lak", "Dac Lac", "Đắc Lắk"],
    "VN-72": ["Dak Nong", "Dac Nong", "Đắc Nông"],
    "VN-DN": ["Da Nang", "Danang", "Thành phố Đà Nẵng"],
    "VN-HP": ["Hai Phong", "Haiphong", "Thành phố Hải Phòng"],
    "VN-HN": ["Ha Noi", "Hanoi", "Thành phố Hà Nội"],
    "VN-CT": ["Can Tho", "Thành phố Cần Thơ"],
    "VN-SG": [
        "Ho Chi Minh",
        "Ho Chi Minh City",
        "HCMC",
        "TP Ho Chi Minh",
        "TP. Hồ Chí Minh",
        "Thành phố Hồ Chí Minh",
        "Sai Gon",
        "Saigon",
    ],
    "VN-26": [
        "Thua Thien Hue",
        "Thừa Thiên-Huế",
        "Thua Thien-Hue",
        "Huế",
        "Hue",
    ],
}


def normalize_text(value: str) -> str:
    """Return the deterministic name key used by map-data joins."""

    value = unicodedata.normalize("NFC", value).strip().replace("Đ", "D").replace("đ", "d")
    value = "".join(
        character
        for character in unicodedata.normalize("NFD", value)
        if unicodedata.category(character) != "Mn"
    )
    value = unicodedata.normalize("NFC", value).casefold()
    return " ".join(re.findall(r"[a-z0-9]+", value))


def _download_source() -> bytes:
    request = urllib.request.Request(
        SOURCE_URL,
        headers={"User-Agent": "nigtldcmap-v124-spatial-builder/1.0"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = response.read()
    digest = hashlib.sha256(payload).hexdigest()
    if digest != SOURCE_SHA256:
        raise RuntimeError(f"Pinned ADM1 source hash mismatch: {digest}")
    return payload


def _polygon_parts(geometry: dict[str, Any]) -> list[list[Any]]:
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return list(geometry["coordinates"])
    raise ValueError(f"Unexpected ADM1 geometry type: {geometry['type']}")


def _validated_geometry(geometry: dict[str, Any], label: str) -> None:
    candidate = shape(geometry)
    if candidate.is_empty:
        raise ValueError(f"Empty geometry: {label}")
    if candidate.geom_type not in {"Polygon", "MultiPolygon"}:
        raise ValueError(f"Unsupported geometry type for {label}: {candidate.geom_type}")
    if not candidate.is_valid:
        raise ValueError(f"Invalid geometry for {label}: {explain_validity(candidate)}")


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def _unique_preserving_order(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        clean = unicodedata.normalize("NFC", value).strip()
        if clean and clean not in seen:
            seen.add(clean)
            result.append(clean)
    return result


def build(output_dir: Path, canonical_dir: Path) -> tuple[Path, Path, Path, Path]:
    source_bytes = _download_source()
    source = json.loads(source_bytes.decode("utf-8"))
    source_features = source.get("features", [])
    if len(source_features) != EXPECTED_SOURCE_FEATURE_COUNT:
        raise ValueError(f"Expected 64 source features, found {len(source_features)}")

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    source_invalid: list[str] = []
    for feature in source_features:
        properties = feature.get("properties") or {}
        source_code = str(properties.get("shapeISO") or "").strip()
        source_name = unicodedata.normalize("NFC", str(properties.get("shapeName") or "")).strip()
        if not source_code or not source_name:
            raise ValueError("Source ADM1 feature is missing shapeISO or shapeName")
        try:
            _validated_geometry(feature["geometry"], f"{source_code} {source_name}")
        except ValueError:
            source_invalid.append(f"{source_code}:{source_name}")
            raise
        grouped[source_code].append(feature)

    duplicated_codes = {code: rows for code, rows in grouped.items() if len(rows) > 1}
    if set(duplicated_codes) != {EXPECTED_DUPLICATE_CODE}:
        raise ValueError(f"Unexpected duplicate ADM1 codes: {sorted(duplicated_codes)}")
    duplicate_names = {
        unicodedata.normalize("NFC", str(row["properties"]["shapeName"])).strip()
        for row in duplicated_codes[EXPECTED_DUPLICATE_CODE]
    }
    if duplicate_names != EXPECTED_DUPLICATE_NAMES:
        raise ValueError(f"Unexpected VN-43 source shapes: {sorted(duplicate_names)}")
    if len(grouped) != EXPECTED_OUTPUT_FEATURE_COUNT:
        raise ValueError(f"Expected 63 unique ADM1 codes, found {len(grouped)}")

    output_features: list[dict[str, Any]] = []
    alias_records: list[dict[str, Any]] = []
    lookup: dict[str, str] = {}

    for adm1_code in sorted(grouped):
        rows = grouped[adm1_code]
        source_names = _unique_preserving_order(
            str(row["properties"]["shapeName"]) for row in rows
        )
        source_shape_ids = sorted(str(row["properties"]["shapeID"]) for row in rows)
        canonical_name = CANONICAL_NAME_OVERRIDES.get(adm1_code, source_names[0])
        canonical_name = unicodedata.normalize("NFC", canonical_name).strip()

        parts: list[list[Any]] = []
        for row in rows:
            parts.extend(_polygon_parts(row["geometry"]))
        if len(parts) == 1:
            output_geometry: dict[str, Any] = {"type": "Polygon", "coordinates": parts[0]}
        else:
            output_geometry = {"type": "MultiPolygon", "coordinates": parts}
        _validated_geometry(output_geometry, f"{adm1_code} {canonical_name}")

        output_features.append(
            {
                "type": "Feature",
                "id": adm1_code,
                "properties": {
                    "adm1Code": adm1_code,
                    "boundarySystem": "pre-2025-63",
                    "name": canonical_name,
                    "normalizedName": normalize_text(canonical_name),
                    "sourceShapeCount": len(rows),
                    "sourceShapeIds": source_shape_ids,
                    "sourceShapeNames": source_names,
                },
                "geometry": output_geometry,
            }
        )

        generated_aliases = [
            canonical_name,
            *source_names,
            normalize_text(canonical_name),
            f"Tỉnh {canonical_name}",
            f"Province {canonical_name}",
            *MANUAL_ALIASES.get(adm1_code, []),
        ]
        aliases = _unique_preserving_order(generated_aliases)
        normalized_aliases = sorted({normalize_text(alias) for alias in aliases})
        for key in normalized_aliases:
            existing = lookup.get(key)
            if existing and existing != adm1_code:
                raise ValueError(f"Alias collision for {key!r}: {existing} and {adm1_code}")
            lookup[key] = adm1_code
        alias_records.append(
            {
                "adm1Code": adm1_code,
                "canonicalName": canonical_name,
                "normalizedKey": normalize_text(canonical_name),
                "variants": aliases,
            }
        )

    normalized_names = [feature["properties"]["normalizedName"] for feature in output_features]
    duplicate_province_count = len(normalized_names) - len(set(normalized_names))
    if duplicate_province_count:
        raise ValueError(f"Duplicate canonical province names: {duplicate_province_count}")

    geometry_type_counts = {
        geometry_type: sum(
            feature["geometry"]["type"] == geometry_type for feature in output_features
        )
        for geometry_type in ("Polygon", "MultiPolygon")
    }
    attribution = (
        "geoBoundaries (William & Mary geoLab), VNM ADM1, boundary year 2008, "
        "build 2023-12-12; Runfola et al. (2020), PLOS ONE 15(4): e0231866."
    )
    metadata = {
        "schemaVersion": "v124-adm1-geometry-1",
        "countryIso3": "VNM",
        "adminLevel": "ADM1",
        "boundarySystem": "pre-2025-63",
        "boundaryYearRepresented": "2008",
        "crs": "EPSG:4326",
        "source": {
            "name": "geoBoundaries VNM ADM1",
            "boundaryId": "VNM-ADM1-63759600",
            "sourceCommit": SOURCE_COMMIT,
            "sourceBuildDate": "2023-12-12",
            "sourceDataUpdateDate": "2023-01-19",
            "sourceUrl": SOURCE_URL,
            "metadataUrl": SOURCE_METADATA_URL,
            "apiUrl": SOURCE_API_URL,
            "sourceSha256": SOURCE_SHA256,
            "sourceFeatureCount": EXPECTED_SOURCE_FEATURE_COUNT,
        },
        "license": {
            "sourceBoundaryLicense": "Public Domain",
            "geoBoundariesDerivativeLicense": "CC-BY-4.0",
            "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
            "attributionRequired": True,
        },
        "attribution": attribution,
        "accuracyNotice": (
            "The boundary is representative of the 2008 63-unit ADM1 system and is intended "
            "for thematic joins, not cadastral or legal boundary determination. Côn Đảo is "
            "preserved as actual source geometry and grouped with Bà Rịa–Vũng Tàu by their "
            "shared source ADM1 code VN-43."
        ),
        "transformation": {
            "method": "group-exact-source-polygons-by-shared-adm1-code",
            "mergedAdm1Code": EXPECTED_DUPLICATE_CODE,
            "mergedSourceNames": sorted(EXPECTED_DUPLICATE_NAMES),
            "coordinateSynthesisCount": 0,
        },
        "validation": {
            "featureCount": len(output_features),
            "polygonCount": geometry_type_counts["Polygon"],
            "multiPolygonCount": geometry_type_counts["MultiPolygon"],
            "emptyGeometryCount": 0,
            "duplicateProvinceCount": duplicate_province_count,
            "invalidGeometryCount": 0,
            "sourceInvalidGeometryCount": len(source_invalid),
            "fakeGeometryCount": 0,
            "geometryValidity": "pass",
            "validator": "Shapely 2.1.2 (GEOS is_valid)",
        },
    }

    geojson = {
        "type": "FeatureCollection",
        "name": "vnm-adm1-63-pre-2025",
        "metadata": metadata,
        "features": output_features,
    }
    aliases_document = {
        "schemaVersion": "v124-adm1-aliases-1",
        "countryIso3": "VNM",
        "boundarySystem": "pre-2025-63",
        "canonicalKey": "adm1Code",
        "normalization": "Unicode NFC; Vietnamese tone removal; đ→d; case-fold; alphanumeric spaces",
        "sourceAsset": "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
        "aliases": alias_records,
        "lookup": dict(sorted(lookup.items())),
        "validation": {
            "provinceCount": len(alias_records),
            "lookupKeyCount": len(lookup),
            "duplicateAliasCount": 0,
            "unmappedProvinceCount": 0,
        },
    }

    geojson_path = output_dir / "vnm-adm1-63.geojson"
    aliases_path = output_dir / "vnm-adm1-aliases.json"
    canonical_geojson_path = canonical_dir / "vnm-adm1-63-source.geojson"
    canonical_aliases_path = canonical_dir / "vnm-adm1-aliases-source.json"
    _write_json(geojson_path, geojson)
    _write_json(aliases_path, aliases_document)
    _write_json(canonical_geojson_path, geojson)
    _write_json(canonical_aliases_path, aliases_document)
    return geojson_path, aliases_path, canonical_geojson_path, canonical_aliases_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for vnm-adm1-63.geojson and vnm-adm1-aliases.json",
    )
    parser.add_argument(
        "--canonical-dir",
        type=Path,
        default=DEFAULT_CANONICAL_DIR,
        help="Tracked canonical source directory used to reconstruct public/data/vietnam/v2",
    )
    args = parser.parse_args()
    geojson_path, aliases_path, canonical_geojson_path, canonical_aliases_path = build(
        args.output_dir.resolve(), args.canonical_dir.resolve()
    )
    print(f"ADM1_FEATURE_COUNT={EXPECTED_OUTPUT_FEATURE_COUNT}")
    print("ADM1_GEOMETRY_VALIDITY=PASS")
    print("ADM1_EMPTY_GEOMETRY_COUNT=0")
    print("ADM1_DUPLICATE_PROVINCE_COUNT=0")
    print("ADM1_FAKE_GEOMETRY_COUNT=0")
    print(f"ADM1_GEOJSON={geojson_path}")
    print(f"ADM1_ALIASES={aliases_path}")
    print(f"ADM1_CANONICAL_GEOJSON={canonical_geojson_path}")
    print(f"ADM1_CANONICAL_ALIASES={canonical_aliases_path}")


if __name__ == "__main__":
    main()
