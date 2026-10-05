"""V158-B1: public data tree for a country delivered without an earlier projection.

Viet Nam's builder (``tools/etl/build_public_v2.py``) starts from its V1
projection and keeps Viet Nam-only derivations; a second country has neither,
and must not inherit Viet Nam's records. This builder reads only the country's
own staged delivery and writes ``public/data/<code>/v2`` in the file layout and
record schemas the app already reads for Viet Nam (catalog, manifest, packs with
``packs/bundle-index-v124.json``, search index, source registry, downloads,
coverage, rights), so the country can later be switched on with the same code.
It imports the Viet Nam builder's pure helpers and calls nothing else of it.

Everything country-specific comes from ``tools/etl/countries/<code>/country.json``
and ``public/data/countries.json``; the framework (152 elements, their labels and
categories) from the delivery's own ``db_framework`` sheet. Elements the delivery
does not carry are listed as ``not-provided`` with no records - nothing is
filled in. Values are displayed as delivered; a record is offered for download
only when its indicator's metadata says ``download_allowed = 가능`` (owner
decision 2026-09-29, ``publication-decision-20260929.json``).

    python -B tools/etl/countries/bgd/build_country_v2.py --country bgd [--out .staging/<dir>]

Run ``stage_source.py`` and the credential redaction on the staged copy first.
The ``geometry/`` folder belongs to ``boundaries_adm2_dissolve.py`` and is left
in place; the asset integrity file covers it, so run this builder last.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import pathlib
import re
import shutil
import sys
import unicodedata
from copy import deepcopy
from typing import Any, Iterable, Mapping

REPO = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO))

from tools.etl import build_public_v2 as v2  # noqa: E402  (pure helpers only)
from tools.etl.download_zip_v158 import write_element_zip, zip_download_asset  # noqa: E402
from tools.etl import collection_scope_v165, public_text_v163  # noqa: E402
from tools.etl.download_delivery_v137 import (  # noqa: E402
    DELIVERY_EXTERNAL,
    NullObjectStorageAdapter,
    build_manifest as build_download_manifest,
    describe_asset as describe_download_asset,
)
from tools.etl.normalization import canonical_json, is_placeholder, nfc_text  # noqa: E402
from tools.etl.source_zip import analyze_source_dir  # noqa: E402

SCHEMA_VERSION = v2.SCHEMA_VERSION
RUNTIME_VERSION = v2.RUNTIME_VERSION
PACK_ELEMENT_COUNT = v2.PACK_ELEMENT_COUNT
SOLO_PACK_CONTENT_BYTES = v2.SOLO_PACK_CONTENT_BYTES

# Paths this builder owns inside the output tree. geometry/ is not one of them.
# tech_ids values that mean "no technology" in the delivery.
NO_TECHNOLOGY_V158 = frozenset({"해당없음", "해당 없음", "없음"})

OWNED_FILES = (
    "catalog.json",
    "manifest.json",
    "framework-coverage.json",
    "quality-report.json",
    "publication-decisions.json",
    "rights-matrix.json",
    "map-index.json",
    "presentation-v158.json",
    "asset-integrity.json",
)
OWNED_DIRS = ("packs", "downloads")

# Columns every delivered observation/entity row has in the shared template.
STANDARD_OBSERVATION_KEYS = {
    "element_id", "indicator_id", "country_iso3", "year", "period", "value",
    "missing_reason_code", "note", "source_row",
}
STANDARD_ENTITY_KEYS = {
    "element_id", "indicator_id", "country_iso3", "lat", "lon", "geometry_type",
    "crs", "note", "missing_reason_code", "source_row", "attributes",
}
# The element's name as the row restates it: one value per element, kept on the
# catalog row instead of on every record.
ELEMENT_NAME_KEY = "element_name"

# 2_meta_info column -> indicator key, the names the Viet Nam indicators use.
META_TO_INDICATOR = {
    "element_en": "labelEn",
    "accessed_date": "accessedDate",
    "api_endpoint": "apiEndpoint",
    "api_params": "apiParams",
    "유의사항": "caveat",
    "citation_locator": "citationLocator",
    "comparability_flag": "comparabilityFlag",
    "crs": "crs",
    "data_owner": "dataOwner",
    "산출방식": "derivationMethod",
    "산출유형": "derivationType",
    "download_allowed": "downloadAllowed",
    "last_updated": "lastUpdated",
    "license_url": "licenseUrl",
    "missing_note": "missingNote",
    "missing_reason_code": "missingReasonCode",
    "redistribution_allowed": "redistributionAllowed",
    "source_grade": "sourceGrade",
    "source_series_id": "sourceSeriesId",
    "spatial_resolution": "spatialResolution",
    "time_interval": "timeInterval",
    "update_frequency": "updateFrequency",
    "verified_by": "verifiedBy",
}
# Columns without a Viet Nam indicator key: kept verbatim under extraMeta.
META_EXTRA = ("variable_id", "country_coverage", "검색어_사전", "기술_분류_기준", "중복_제거_방법")
# Columns _indicators_from_workbook already maps, or that are row bookkeeping.
META_HANDLED = {
    "element_id", "indicator_id", "element_kr", "unit", "source_org", "source_url",
    "license_code", "attribution_text", "time_range", "reference_year", "data_type",
    "unit_detail", "spatial_unit", "tech_ids", "source_row",
}
DOWNLOAD_ALLOWED_VALUE = "가능"


# --------------------------------------------------------------------------- config
def _read_json(path: pathlib.Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_country(code: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    config = _read_json(REPO / "tools/etl/countries" / code.lower() / "country.json")
    registry = _read_json(REPO / "public/data/countries.json")
    rows = registry.get("countries", registry) if isinstance(registry, dict) else registry
    entry = next((row for row in rows if row.get("iso3") == config["iso3"]), None)
    if entry is None:
        raise SystemExit(f"COUNTRY_NOT_IN_REGISTRY: {config['iso3']}")
    decision = _read_json(REPO / config["publicationDecisions"]["allData"])
    if decision.get("countryIso3") != config["iso3"]:
        raise SystemExit("DECISION_COUNTRY_MISMATCH")
    return config, entry, decision


def _registry_ts_values(path: pathlib.Path, *fields: str) -> dict[str, dict[str, str]]:
    """elementId -> {field: value} from a TypeScript array of object literals."""
    text = path.read_text(encoding="utf-8")
    result: dict[str, dict[str, str]] = {}
    for match in re.finditer(r"\{([^{}]*?elementId:\s*\"([A-E]-\d{3})\"[^{}]*?)\}", text, flags=re.S):
        body, element_id = match.group(1), match.group(2)
        values = {}
        for field in fields:
            found = re.search(rf"\b{field}:\s*\"([^\"]*)\"", body)
            if found:
                values[field] = found.group(1)
        result[element_id] = values
    return result


def _slugs(path: pathlib.Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    return {m.group(1): m.group(2) for m in re.finditer(r"\"([A-E]-\d{3})\":\s*\"([^\"]+)\"", text)}


# --------------------------------------------------------------------------- region names
_WRAPPER = re.compile(r"^[\s\"'“”‘’(\[{,.;:\-–—]+|[\s\"'“”‘’)\]},.;:\-–—]+$")
_VI_PREFIX = re.compile(r"^(?:tỉnh|thành phố|thanh pho|tp\.?|t\.p\.?|thị xã|thị trấn|huyện|quận|phường|xã)\s+")
_EN_PREFIX = re.compile(r"^(?:province of|city of)\s+")
_EN_SUFFIX = re.compile(r"\s+(?:provinces?|city|municipality|division|district|commune|ward|town)$")


def region_key(raw: Any) -> str:
    """Python twin of regionNameKeyV161 (src/data/geo/regionNameV161.ts)."""
    text = _WRAPPER.sub("", unicodedata.normalize("NFC", str(raw if raw is not None else ""))).lower()
    while True:
        stripped = _EN_SUFFIX.sub("", _EN_PREFIX.sub("", _VI_PREFIX.sub("", text)))
        if stripped == text:
            break
        text = stripped
    text = "".join(ch for ch in unicodedata.normalize("NFD", text) if not unicodedata.combining(ch))
    text = text.replace("đ", "d")
    return re.sub(r"[^a-z0-9]+", "", text)


class RegionNames:
    """Korean region names from src/data/geo/regionNamesV161.json (label form)."""

    def __init__(self, iso3: str, country_entry: Mapping[str, Any]) -> None:
        document = _read_json(REPO / "src/data/geo/regionNamesV161.json")
        block = document["countries"].get(iso3) or {"levels": [], "entries": []}
        self.levels: list[str] = list(block["levels"])
        self.index: dict[str, dict[str, str]] = {level: {} for level in self.levels}
        for entry in block["entries"]:
            # V162: a name still under review never reaches a public file, as on
            # the screen (formatRegionName shows the local spelling instead).
            if entry.get("reviewStatus") != "confirmed":
                continue
            for key in entry["keys"]:
                self.index.setdefault(entry["level"], {}).setdefault(key, entry["ko"])
        self.country_keys = {region_key(country_entry.get("nameEn")), region_key(country_entry.get("iso3"))}
        self.country_ko = str(country_entry.get("nameKo") or "")

    def korean(self, raw: Any, level: str | None) -> str:
        """The label form of formatRegionName; the country itself by its registry name."""
        key = region_key(raw)
        if not key:
            return ""
        if key in self.country_keys:
            return self.country_ko
        for candidate in ([level] if level in self.index else self.levels):
            ko = self.index.get(candidate, {}).get(key)
            if ko:
                return ko
        return unicodedata.normalize("NFC", str(raw)).strip()


# --------------------------------------------------------------------------- helpers
def _text(value: Any) -> str:
    return "" if value is None else nfc_text(str(value)).strip()


def _unique(values: Iterable[Any]) -> list[str]:
    seen: dict[str, None] = {}
    for value in values:
        text = _text(value)
        if text and not is_placeholder(text):
            seen.setdefault(text, None)
    return list(seen)


def _plan_packs(sorted_ids: list[str], payloads: Mapping[str, Any], prefix: str) -> list[tuple[str, list[str]]]:
    """v2._plan_packs with the country's pack prefix (same slicing and solo rule)."""
    plan: list[tuple[str, list[str]]] = []
    for shard_number, start in enumerate(range(0, len(sorted_ids), PACK_ELEMENT_COUNT), start=1):
        slice_ids = sorted_ids[start : start + PACK_ELEMENT_COUNT]
        slice_shard_id = f"{prefix}-pack-{shard_number:03d}"
        remaining, solo = [], []
        for element_id in slice_ids:
            content = v2._json_bytes(payloads[element_id], pretty=False)
            (solo if len(content) > SOLO_PACK_CONTENT_BYTES else remaining).append(element_id)
        if remaining:
            plan.append((slice_shard_id, remaining))
        for element_id in solo:
            plan.append((f"{slice_shard_id}-{element_id.lower()}", [element_id]))
    return plan


def _status(workbook: Mapping[str, Any] | None) -> tuple[str, str, str | None]:
    if workbook is None:
        return "not-provided", "not-provided", "not-provided"
    if workbook.get("normalizationResult") == "quarantined":
        return "quarantined", "quarantined", "format-error"
    if int(workbook.get("publicPopulatedRowCount", 0)) > 0:
        missing = int(workbook.get("observationMissingRowCount", 0)) + int(workbook.get("entityMissingRowCount", 0))
        return ("partial", "partial-records", None) if missing else ("actual", "actual-records", None)
    if workbook.get("normalizationResult") == "schema-only":
        return "schema-only", "no-populated-record", "schema-only"
    return "data-entry-planned", "no-populated-record", "explicit-placeholder-only"


def _element_rights(meta_rows: list[Mapping[str, Any]]) -> dict[str, Any]:
    """Element rights summary in the Viet Nam catalog form, from the meta rows."""
    display = _unique(row.get("redistribution_allowed") for row in meta_rows)
    download = _unique(row.get("download_allowed") for row in meta_rows)
    if not meta_rows:
        status = "not-in-package"
    elif display and download and set(display) == {DOWNLOAD_ALLOWED_VALUE} and set(download) == {DOWNLOAD_ALLOWED_VALUE}:
        status = "public"
    elif {"확인필요", "불가"} & set(display + download):
        status = "mixed-or-restricted"
    else:
        status = "limited"
    return {
        "status": status,
        "redistributionAllowedValues": display,
        "downloadAllowedValues": download,
        "licenses": _unique(row.get("license_code") for row in meta_rows),
        "attributionTexts": _unique(row.get("attribution_text") for row in meta_rows),
    }


def _indicator_rights(meta_rows: list[Mapping[str, Any]], decision_ref: Mapping[str, Any]) -> dict[str, Any]:
    """Per-indicator posture: displayed always, downloadable only when the source says so."""
    by_indicator: dict[str, dict[str, Any]] = {}
    grouped: dict[str, list[Mapping[str, Any]]] = {}
    for row in meta_rows:
        grouped.setdefault(_text(row.get("indicator_id")), []).append(row)
    for indicator_id, rows in grouped.items():
        downloadable = any(_text(row.get("download_allowed")) == DOWNLOAD_ALLOWED_VALUE for row in rows)
        notes = _unique([*(row.get("license_code") for row in rows), *(row.get("attribution_text") for row in rows)])
        by_indicator[indicator_id] = {
            "rightsStatus": "public" if downloadable else "limited",
            "rightsNote": " · ".join(notes) or None,
            "downloadEligible": downloadable,
            "publicationDecision": dict(decision_ref),
        }
    default = {
        "rightsStatus": "limited",
        "rightsNote": None,
        "downloadEligible": False,
        "publicationDecision": dict(decision_ref),
    }
    return {"byIndicator": by_indicator, "default": default, **default}


def _indicators(workbook: Mapping[str, Any], observations: list[Mapping[str, Any]]) -> list[dict[str, Any]]:
    base = {"meta": {"indicators": [], "fieldDefinitions": []}}
    indicators = v2._indicators_from_workbook(workbook, base, observations)
    first_row: dict[str, Mapping[str, Any]] = {}
    for row in workbook.get("metadata") or []:
        first_row.setdefault(_text(row.get("indicator_id")), row)
    for indicator in indicators:
        row = first_row.get(indicator["indicatorId"])
        indicator["elementId"] = workbook["elementId"]
        if not row:
            continue
        for column, key in META_TO_INDICATOR.items():
            value = row.get(column)
            indicator[key] = None if value in (None, "") else value
        # V158: the delivery writes "해당없음" in tech_ids for an indicator tied to
        # no technology; that is no technology, as in Viet Nam's catalog, not a
        # technology called "해당없음" (it surfaced as a dimension on screen).
        indicator["technologyIds"] = [
            tid for tid in v2.normalize_technology_ids_v153(row.get("tech_ids")) if tid not in NO_TECHNOLOGY_V158
        ]
        indicator["extraMeta"] = {column: row.get(column) for column in META_EXTRA if row.get(column) not in (None, "")}
        unknown = sorted(set(row) - META_HANDLED - set(META_TO_INDICATOR) - set(META_EXTRA))
        for column in unknown:
            if row.get(column) not in (None, ""):
                indicator["extraMeta"][column] = row.get(column)
        indicator["provenance"] = {
            "sourceFileOriginal": workbook["archiveName"],
            "sourceSheet": "2_meta_info",
            "sourceRow": int(row.get("source_row") or 0),
        }
    return indicators


def _observation_extras(workbook: Mapping[str, Any], observations: list[dict[str, Any]], indicators: list[dict[str, Any]]) -> list[str]:
    """Columns beyond the template: constant per indicator -> extraMeta, else per record."""
    raw_rows = workbook.get("observations") or []
    extra_keys = sorted({key for row in raw_rows for key in row} - STANDARD_OBSERVATION_KEYS - {ELEMENT_NAME_KEY})
    by_id = {row["indicatorId"]: row for row in indicators}
    per_indicator: dict[str, dict[str, set[str]]] = {}
    for row in raw_rows:
        values = per_indicator.setdefault(_text(row.get("indicator_id")), {})
        for key in extra_keys:
            value = row.get(key)
            values.setdefault(key, set()).add(canonical_json(value))
    varying: set[str] = set()
    for indicator_id, values in per_indicator.items():
        for key, seen in values.items():
            if len(seen) == 1:
                value = json.loads(next(iter(seen)))
                if value not in (None, "") and not is_placeholder(value) and indicator_id in by_id:
                    by_id[indicator_id].setdefault("extraMeta", {})[key] = value
            else:
                varying.add(key)
    if varying:
        for record, raw in zip(observations, raw_rows):
            attributes = {key: raw.get(key) for key in sorted(varying) if raw.get(key) not in (None, "") and not is_placeholder(raw.get(key))}
            if attributes:
                record["sourceAttributes"] = attributes
    return extra_keys


def _entity_extras(workbook: Mapping[str, Any], entities: list[dict[str, Any]], field_definitions: list[dict[str, str]]) -> list[str]:
    """Template-external entity columns kept as attributes (the Viet Nam helper drops them)."""
    raw_rows = workbook.get("entities") or []
    extra_keys = sorted({key for row in raw_rows for key in row} - STANDARD_ENTITY_KEYS - {ELEMENT_NAME_KEY})
    kept = [key for key in extra_keys if any(row.get(key) not in (None, "") and not is_placeholder(row.get(key)) for row in raw_rows)]
    used = {item["normalizedKey"] for item in field_definitions}
    for key in kept:
        normalized = key if key not in used else f"source_{key}"
        used.add(normalized)
        field_definitions.append({"sourceField": key, "label": key, "normalizedKey": normalized})
    mapping = {item["sourceField"]: item["normalizedKey"] for item in field_definitions if item["sourceField"] in kept}
    for record, raw in zip(entities, raw_rows):
        for key in kept:
            record["normalizedAttributes"][mapping[key]] = raw.get(key)
            record["rawAttributes"][key] = raw.get(key)
    return kept


# --------------------------------------------------------------------------- downloads
def _download_csv(element: Mapping[str, Any], observations: list[Any], entities: list[Any], names: RegionNames, region_columns: list[str], separator: str = "") -> bytes:
    """The Viet Nam CSV (same columns, same order) plus 지역명_한글 at the end."""
    columns = [
        "element_id", "element_label", "record_type", "record_id", "indicator_id", "country_iso3",
        "year", "period_start", "period_end", "period", "statistic_type", "source_year_label",
        "value", "unit", "name", "latitude", "longitude", "attributes_json", "missing_reason_code",
        # V163-DL: no delivery workbook file/sheet/row columns in the public CSV.
        "note", "source_org", "source_url", "license_code",
        "publication_decision_id", "지역명_한글",
    ]
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    decision_id = (element.get("publicationDecision") or {}).get("decisionId")

    def common(row: Mapping[str, Any], record_type: str) -> dict[str, Any]:
        provenance = row.get("provenance") or {}
        return {
            "element_id": element["elementId"],
            "element_label": element["elementLabel"],
            "record_type": record_type,
            "record_id": row.get("recordId"),
            "indicator_id": row.get("indicatorId"),
            "country_iso3": row.get("countryIso3"),
            "name": v2._csv_safe(row.get("name")),
            "missing_reason_code": row.get("missingReasonCode"),
            "note": v2._csv_safe(row.get("note")),
            "source_org": provenance.get("sourceOrg"),
            "source_url": provenance.get("sourceUrl"),
            "license_code": provenance.get("licenseCode"),
            "source_file": provenance.get("sourceFileDecoded"),
            "source_sheet": provenance.get("sourceSheet"),
            "source_row": provenance.get("sourceRow"),
            "publication_decision_id": decision_id,
        }

    for row in observations:
        writer.writerow({**common(row, "observation"), **v2._temporal_columns(row), "value": v2._csv_safe(row.get("value")), "unit": row.get("unit")})
    for row in entities:
        attributes = row.get("normalizedAttributes") or {}
        writer.writerow(
            {
                **common(row, "entity"),
                "latitude": row.get("latitude"),
                "longitude": row.get("longitude"),
                "attributes_json": v2._csv_safe(attributes),
                "지역명_한글": v2._csv_safe(region_label(attributes, names, region_columns, separator)),
            }
        )
    return ("\ufeff" + stream.getvalue()).encode("utf-8")


def region_label(attributes: Mapping[str, Any], names: RegionNames, region_columns: list[str], separator: str = "") -> str:
    """Korean name of the row's region: the first declared romanised column that has a value.

    A cell that lists several places with the declared separator is read part by
    part and joined back with the same separator; a part the dictionary does not
    know stays as written.
    """
    level_hint = _text(attributes.get("행정단위")).lower()
    level = {"division": "division", "district": "district"}.get(level_hint)
    for column in region_columns:
        value = attributes.get(column)
        if value is None or is_placeholder(value) or not _text(value):
            continue
        text = _text(value)
        if separator and separator in text:
            parts = [part.strip() for part in text.split(separator) if part.strip()]
            return f" {separator} ".join(names.korean(part, level) for part in parts)
        return names.korean(text, level)
    return ""


# --------------------------------------------------------------------------- build
def build(code: str, out_override: str | None = None) -> dict[str, Any]:
    config, entry, decision = load_country(code)
    iso3 = config["iso3"]
    # V163: working notes taken out of public text fields (internal report only).
    public_text_log_v163: list[dict[str, Any]] = []
    data_root = str(entry["dataRoot"]).rstrip("/")
    prefix = str(config["packPrefix"])
    generated_at = f"{decision['approvedAt']}T00:00:00Z"
    public_dir = REPO / "public"
    out = (REPO / (out_override or config["output"])).resolve()
    expected = (public_dir / data_root.lstrip("/")).resolve()
    if out_override:
        # A staging tree mirrors the public layout: .staging/<name>/public/data/<code>/v2.
        if not out.is_relative_to((REPO / ".staging").resolve()):
            raise SystemExit(f"--out must be under .staging/: {out}")
        public_dir = out.parents[len(pathlib.PurePosixPath(data_root.lstrip("/")).parts) - 1]
        if public_dir.name != "public" or (public_dir / data_root.lstrip("/")).resolve() != out:
            raise SystemExit(f"--out must end in public{data_root}: {out}")
    elif out != expected:
        raise SystemExit(f"output {out} does not match the registry data root {expected}")

    staging = (REPO / config["source"]["staging"]).resolve()
    staged = _read_json(REPO / config["source"]["manifest"])
    region_config = _read_json(REPO / config["regionColumns"])
    region_columns = list(region_config["romanisedColumns"])
    region_separator = str(region_config.get("listSeparator") or "")
    names = RegionNames(iso3, entry)
    registry = _registry_ts_values(REPO / "src/data/vietnam/vietnamElementUseRegistryV121.ts", "detailTemplate", "mapMode")
    slugs = _slugs(REPO / "src/data/vietnam/vietnamElementSlugsV121.ts")

    analysis = analyze_source_dir(staging, include_records=True)
    totals = analysis["totals"]
    if analysis["embeddedFrameworkVariantCount"] != 1:
        raise SystemExit("FRAMEWORK_VARIANTS: the workbooks disagree on the framework")
    if analysis["extraWorkbookElementIds"] or analysis["duplicateWorkbookElementIds"]:
        raise SystemExit("UNEXPECTED_WORKBOOKS")
    if totals["workbookCount"] != staged["workbookCount"]:
        raise SystemExit("STAGED_COUNT_MISMATCH")
    if totals["credentialValueRemovedCount"]:
        raise SystemExit("CREDENTIALS_STILL_PRESENT: run the redaction on the staged copy")
    workbooks = {row["elementId"]: row for row in analysis["workbooks"]}
    for book in analysis["workbooks"]:
        book["sourcePackage"] = f"{pathlib.PurePosixPath(config['source']['directory']).parent.name}/{config['source']['delivery']}"
        for section in ("observations", "entities", "metadata"):
            for row in book.get(section) or []:
                country = _text(row.get("country_iso3")).upper()
                if section != "metadata" and country != iso3:
                    raise SystemExit(f"FOREIGN_ROW: {book['elementId']} {section} row {row.get('source_row')} is {country or 'blank'}")
    framework_rows = next(book["framework"] for book in analysis["workbooks"] if book.get("framework"))
    framework = {row["element_id"]: row for row in framework_rows}
    framework_ids = sorted(framework)
    if framework_ids != sorted(analysis["frameworkElementIds"]):
        raise SystemExit("FRAMEWORK_IDS_MISMATCH")

    decision_ref = {
        "decisionId": decision["decisionId"],
        "approvedAt": decision["approvedAt"],
        "approvedByRole": decision["approvedByRole"],
        "decision": decision["decision"],
        "displayAllowed": bool(decision["displayAllowed"]),
        "downloadAllowed": bool(decision["downloadAllowed"]),
        "contactFieldsAllowed": bool(decision["contactFieldsAllowed"]),
        "sourceLicensePreserved": bool(decision["sourceLicensePreserved"]),
        "sourceAttributionRequired": bool(decision["sourceAttributionRequired"]),
    }
    # V158 (user decision 2026-09-30): the exclusions common to every country
    # (plus any of the country's own) - the same loader and the same catalog
    # shape as Viet Nam's builder.
    exclusions = v2.load_exclusion_decisions(REPO, config)

    if out.exists():
        for name in OWNED_FILES:
            (out / name).unlink(missing_ok=True)
        for name in OWNED_DIRS:
            if (out / name).exists():
                shutil.rmtree(out / name)
    (out / "packs").mkdir(parents=True, exist_ok=True)
    (out / "downloads").mkdir(parents=True, exist_ok=True)

    payloads: dict[str, dict[str, Any]] = {}
    catalog: list[dict[str, Any]] = []
    coverage: list[dict[str, Any]] = []
    rights_rows: list[dict[str, Any]] = []
    source_rows: dict[str, dict[str, Any]] = {}
    column_accounting: dict[str, Any] = {}
    row_exclusions_v162: dict[str, Any] = {}
    for element_id in framework_ids:
        frame = framework[element_id]
        workbook = workbooks.get(element_id)
        status, presence, empty_reason = _status(workbook)
        meta_rows = list(workbook.get("metadata") or []) if workbook else []
        observations: list[dict[str, Any]] = []
        entities: list[dict[str, Any]] = []
        indicators: list[dict[str, Any]] = []
        field_definitions: list[dict[str, str]] = []
        rights_summary = _element_rights(meta_rows)
        if workbook is not None:
            rights = _indicator_rights(meta_rows, decision_ref)
            indicators = _indicators(workbook, [])
            base = {"meta": {"indicators": indicators, "fieldDefinitions": []}}
            observations = v2._authorized_observations(workbook, base, decision, rights)
            field_definitions = v2._safe_field_definitions(workbook, {"meta": {"fieldDefinitions": []}})
            entities = v2._authorized_entities(workbook, base, decision, field_definitions, rights)
            for record in observations + entities:
                record["recordId"] = f"{prefix}-" + record["recordId"].split("-", 1)[1]
                record["countryIso3"] = iso3
            indicators = _indicators(workbook, observations)
            observation_extras = _observation_extras(workbook, observations, indicators)
            entity_extras = _entity_extras(workbook, entities, field_definitions)
            # V162: declared non-public source rows, the same rule file as every
            # country (config/data-publication/row-exclusions-v162.json).
            entities, excluded_by_rule = v2._apply_row_exclusions_v162(
                element_id, entities, field_definitions, v2._load_row_exclusions_v162(REPO)
            )
            if excluded_by_rule:
                row_exclusions_v162[element_id] = excluded_by_rule
            column_accounting[element_id] = {
                "observationExtraColumns": observation_extras,
                "entityExtraColumns": entity_extras,
                "elementNameValues": _unique(row.get(ELEMENT_NAME_KEY) for row in (workbook.get("observations") or []) + (workbook.get("entities") or [])),
            }
            for row in meta_rows:
                identity = {
                    "sourceOrg": row.get("source_org"), "sourceUrl": row.get("source_url"),
                    "sourceSeriesId": row.get("source_series_id"), "licenseCode": row.get("license_code"),
                    "licenseUrl": row.get("license_url"), "attributionText": row.get("attribution_text"),
                    "apiEndpoint": row.get("api_endpoint"), "apiParams": row.get("api_params"),
                    "sourceGrade": row.get("source_grade"),
                }
                source_id = "src-" + hashlib.sha256(canonical_json({"country": iso3, **identity}).encode("utf-8")).hexdigest()[:20]
                source = source_rows.setdefault(source_id, {**identity, "sourceId": source_id, "sourceUrlNote": None, "citationLocators": [], "elementIds": [], "indicatorIds": []})
                for key, value in (("citationLocators", row.get("citation_locator")), ("elementIds", element_id), ("indicatorIds", row.get("indicator_id"))):
                    text = _text(value)
                    if text and text not in source[key]:
                        source[key].append(text)
        downloadable = [row for row in observations + entities if row.get("downloadEligible")]
        download_allowed = bool(downloadable)
        populated_indicators = {
            row.get("indicatorId")
            for row in observations + entities
            if row.get("indicatorId")
            and (row.get("value") is not None or any(not is_placeholder(v) for v in (row.get("normalizedAttributes") or {}).values()))
        }
        row_accounting = {
            "normalizedObservationRows": int(workbook.get("observationRowCount", 0)) if workbook else 0,
            "normalizedEntityRows": int(workbook.get("entityRowCount", 0)) if workbook else 0,
            "metadataRows": int(workbook.get("metadataRowCount", 0)) if workbook else 0,
            "nonstandardRows": (int(workbook.get("supplementalSourceRowCount", 0)) + int(workbook.get("placeholderRowCount", 0))) if workbook else 0,
            "templateRows": int(workbook.get("templateRowCount", 0)) if workbook else 0,
            "placeholderRows": int(workbook.get("placeholderRowCount", 0)) if workbook else 0,
            "publicPopulatedRows": int(workbook.get("publicPopulatedRowCount", 0)) if workbook else 0,
        }
        use = registry.get(element_id, {})
        collection = _text(frame.get("2026_수집여부")).upper()
        element = {
            "elementId": element_id,
            "elementLabel": _text(frame.get("요소")),
            "categoryCode": _text(frame.get("대분류_cd")),
            "categoryLabel": _text(frame.get("대분류_kr")),
            "sectionCode": _text(frame.get("중분류_cd")),
            "sectionLabel": _text(frame.get("중분류_kr")),
            "groupCode": _text(frame.get("세분류_cd")),
            "groupLabel": _text(frame.get("세분류_kr")),
            "detailTemplate": use.get("detailTemplate"),
            "mapMode": use.get("mapMode") if workbook is not None else "not-applicable",
            "mapFeatureCount": 0,
            "publicStatus": status,
            "dataPresenceStatus": presence,
            "emptyReason": empty_reason,
            "displayAllowed": status != "quarantined",
            "downloadAllowed": download_allowed,
            "observationCount": len(observations),
            "entityCount": len(entities),
            "downloadableRecordCount": len(downloadable),
            "availableIndicatorCount": len(populated_indicators),
            "indicatorCount": len(indicators),
            "packageStatus": "provided" if workbook is not None else "not-provided",
            "packageReason": (
                "요소별 Excel 파일 제공"
                if workbook is not None
                else f"{config['source']['delivery']} 입고분에 원자료 없음" + (" · 수집 예정(프레임워크 2026 수집 대상)" if collection == "Y" else " · 2026 수집 대상 아님" if collection == "N" else "")
            ),
            "referenceYears": [str(year) for year in (workbook.get("years") or [])] if workbook else [],
            "latestYear": workbook.get("latestYear") if workbook else None,
            "dataTypes": list(workbook.get("dataTypes") or []) if workbook else [],
            "spatialUnits": list(workbook.get("spatialUnits") or []) if workbook else [],
            "sourceOrganizations": list(workbook.get("sourceOrganizations") or []) if workbook else [],
            "sourceUrls": list(workbook.get("sourceUrls") or []) if workbook else [],
            "technologyIds": v2.normalize_technology_ids_v153([tid for ind in indicators for tid in ind.get("technologyIds") or []]),
            "hasWarnings": bool(workbook and workbook.get("warnings")),
            "qualityIssueCount": int((workbook or {}).get("duplicateDetection", {}).get("duplicateCount", 0)) + int((workbook or {}).get("excelErrorCellCount", 0)),
            "nonstandardRowCount": row_accounting["nonstandardRows"],
            "rights": rights_summary,
            "assetRef": {"provider": prefix, "elementId": element_id, "section": "bundle"},
            "sourceWorkbook": {"exists": workbook is not None, "fileName": workbook.get("archiveName") if workbook else None},
            "rowAccounting": row_accounting,
            "publicationDecision": dict(decision_ref),
            "countryElementLabels": column_accounting.get(element_id, {}).get("elementNameValues", []),
            "collectionPlanned": {"Y": True, "N": False}.get(collection),
        }
        exclusion = exclusions.get(element_id)
        if exclusion:
            # As in Viet Nam's catalog: the offer is withdrawn (no download is
            # offered), the files and the measured status stay, and the public
            # notice travels with the decision.
            element["publicStatus"] = "excluded"
            element["downloadAllowed"] = False
            element["exclusion"] = {
                "reason": str(exclusion.get("reason") or ""),
                "basis": str(exclusion.get("basis") or ""),
                "decidedAt": str(exclusion.get("decidedAt") or ""),
                "publicNotice": str(exclusion.get("publicNotice") or ""),
                "measuredStatus": status,
                "measuredPresence": presence,
            }
        if download_allowed:
            token = element_id.lower()
            # V158: one deterministic ZIP per element (tools/etl/download_zip_v158.py).
            element["downloadAssets"] = [zip_download_asset(f"{data_root}/downloads", token, len(downloadable))]
        else:
            element["downloadAssets"] = None
        meta = {
            "schemaVersion": SCHEMA_VERSION,
            "element": element,
            "indicators": indicators,
            "rights": deepcopy(rights_summary),
            "publicationDecision": dict(decision_ref),
            "fieldDefinitions": field_definitions,
            "rowAccounting": row_accounting,
            "package": {
                "sourcePackage": workbook.get("sourcePackage") if workbook else None,
                "sourceFileOriginal": workbook.get("archiveName") if workbook else "",
                "sourceFileDecoded": workbook.get("archiveName") if workbook else "",
            },
            "sourceRegistryIds": sorted(sid for sid, row in source_rows.items() if element_id in row["elementIds"]),
        }
        payloads[element_id] = {
            "meta": meta,
            "observations": {"schemaVersion": SCHEMA_VERSION, "elementId": element_id, "recordCount": len(observations), "records": observations},
            "entities": {"schemaVersion": SCHEMA_VERSION, "elementId": element_id, "recordCount": len(entities), "records": entities},
        }
        public_text_v163.sanitize_payload(payloads[element_id], element_id=element_id, country=iso3, log=public_text_log_v163)
        public_text_v163.sanitize_payload(element, element_id=element_id, country=iso3, log=public_text_log_v163)
        catalog.append(element)
        coverage.append(
            {
                "elementId": element_id,
                "workbookExists": workbook is not None,
                "sourceWorkbook": workbook.get("archiveName") if workbook else None,
                "publicStatus": status,
                "dataPresenceStatus": presence,
                "emptyReason": empty_reason,
                "observationRows": row_accounting["normalizedObservationRows"],
                "entityRows": row_accounting["normalizedEntityRows"],
                "metadataRows": row_accounting["metadataRows"],
                "templateRows": row_accounting["templateRows"],
                "placeholderRows": row_accounting["placeholderRows"],
                "publicPopulatedRows": row_accounting["publicPopulatedRows"],
                "publishedObservationRows": len(observations),
                "publishedEntityRows": len(entities),
                "accounted": True,
            }
        )
        rights_rows.append(
            {
                "elementId": element_id,
                "sourceRights": deepcopy(rights_summary),
                "publicationDecision": dict(decision_ref),
                "displayAllowed": element["displayAllowed"],
                "downloadAllowed": download_allowed,
                "rightsBlocked": False,
                "privacyBlocked": False,
                "contactFieldsPublished": bool(decision_ref["contactFieldsAllowed"] and workbook is not None),
            }
        )

    # Downloads (built from the exact public projection), then sizes back onto the catalog.
    download_assets = []
    for element in catalog:
        if not element["downloadAssets"]:
            continue
        payload = payloads[element["elementId"]]
        obs_rows, ent_rows = v2._download_rows(payload)
        token = element["elementId"].lower()
        obs_defaults, obs_out = v2._hoist_record_defaults(obs_rows)
        ent_defaults, ent_out = v2._hoist_record_defaults(ent_rows)
        document: dict[str, Any] = {
            "schemaVersion": SCHEMA_VERSION,
            "downloadSchemaVersion": v2.DOWNLOAD_SCHEMA_VERSION,
            "generatedAt": generated_at,
            "countryIso3": iso3,
            "element": element,
            "indicators": payload["meta"]["indicators"],
            "observations": obs_out,
            "entities": ent_out,
        }
        if obs_defaults or ent_defaults:
            document["recordDefaults"] = {
                "note": "이 값들은 파일의 모든 레코드에 동일하게 적용됩니다. 레코드마다 반복해 싣지 않고 여기에 한 번만 싣습니다. 각 레코드를 읽을 때 그대로 합쳐 사용하세요.",
                "appliesTo": "observations, entities",
                "mergeRule": "record = { ...recordDefaults[section], ...record }",
                "observations": obs_defaults,
                "entities": ent_defaults,
            }
        # V163-DL: the download is a cleaned copy (workbook provenance dropped,
        # working notes out of every text field); the pack keeps its records.
        document = public_text_v163.download_document_v163(document, element_id=element["elementId"], country=iso3, log=public_text_log_v163)
        download_source_v163 = public_text_v163._source_name(document, iso3)
        zip_path = write_element_zip(
            out / "downloads",
            token,
            v2._json_bytes(document, pretty=False),
            _download_csv(
                document["element"],
                public_text_v163.download_rows_v163(obs_rows, element_id=element["elementId"], country=iso3, source_name=download_source_v163, log=public_text_log_v163),
                public_text_v163.download_rows_v163(ent_rows, element_id=element["elementId"], country=iso3, source_name=download_source_v163, log=public_text_log_v163),
                names, region_columns, region_separator,
            ),
            element["downloadAssets"][0],
        )
        download_assets.append(describe_download_asset(element["elementId"], "ZIP", "application/zip", int(element["downloadableRecordCount"]), zip_path, f"{data_root}/downloads/{zip_path.name}"))
    download_manifest = build_download_manifest(download_assets, out / "downloads", NullObjectStorageAdapter())
    v2._write_json(out / "downloads" / "delivery-manifest.json", download_manifest)
    delivery = {(row["elementId"], row["format"]): row for row in download_manifest["assets"]}
    for element in catalog:
        for asset in element.get("downloadAssets") or []:
            row = delivery.get((element["elementId"], asset["format"]))
            if not row:
                continue
            asset["deliveryMode"] = row["deliveryMode"]
            asset["byteSize"] = row["byteSize"]
            asset["sha256"] = row["sha256"]
            asset["uploadState"] = row["uploadState"]
            if row["deliveryMode"] == DELIVERY_EXTERNAL:
                asset["url"] = row["url"]
                asset["repositoryUrl"] = row["repositoryUrl"]

    # V165-2 (user decision 2026-10-05): the 2026 collection scope, the same rule
    # as Viet Nam (config/data-publication/collection-scope-v165.json). An
    # absent workbook is already "not-provided"; this reaches a delivered
    # template without populated rows.
    collection_scope_v165.apply_collection_scope_v165(catalog, coverage, repo=REPO)

    # Packs and the bundle index (the file name the loader expects stays v124).
    bundle_elements: dict[str, Any] = {}
    bundle_packs: list[dict[str, Any]] = []
    for shard_id, element_ids in _plan_packs(sorted(payloads), payloads, prefix):
        shard_payload = {
            "schemaVersion": SCHEMA_VERSION,
            "runtimeVersion": RUNTIME_VERSION,
            "assetLayoutVersion": "sharded-element-bundles-v2",
            "shardId": shard_id,
            "elementIds": element_ids,
            "elements": {element_id: payloads[element_id] for element_id in element_ids},
        }
        envelope, content, compressed = v2._envelope(shard_payload, resource_type="element-shard", shard_id=shard_id)
        pack_path = out / "packs" / f"{shard_id}-{v2._sha256(compressed)[:8]}.json"
        v2._write_json(pack_path, envelope, pretty=False)
        pack_url = v2._asset_url(pack_path, public_dir)
        sizes = {
            "envelopeByteSize": pack_path.stat().st_size,
            "compressedByteSize": len(compressed),
            "compressedSha256": v2._sha256(compressed),
            "contentByteSize": len(content),
            "contentSha256": v2._sha256(content),
        }
        bundle_packs.append(
            {
                "shardId": shard_id,
                "packUrl": pack_url,
                **sizes,
                "elementIds": element_ids,
                "metaCount": sum(len(payloads[item]["meta"]["indicators"]) for item in element_ids),
                "observationCount": sum(payloads[item]["observations"]["recordCount"] for item in element_ids),
                "entityCount": sum(payloads[item]["entities"]["recordCount"] for item in element_ids),
            }
        )
        for element_id in element_ids:
            element = next(row for row in catalog if row["elementId"] == element_id)
            bundle_elements[element_id] = {
                "elementId": element_id,
                "shardId": shard_id,
                "packUrl": pack_url,
                "metaCount": len(payloads[element_id]["meta"]["indicators"]),
                "observationCount": payloads[element_id]["observations"]["recordCount"],
                "entityCount": payloads[element_id]["entities"]["recordCount"],
                **sizes,
                "packageStatus": element["packageStatus"],
                "publicStatus": element["publicStatus"],
            }
    bundle_index = {
        "schemaVersion": SCHEMA_VERSION,
        "runtimeVersion": RUNTIME_VERSION,
        "assetLayoutVersion": "gzip-base64-json-envelope-v2",
        "elementCount": len(bundle_elements),
        "packCount": len(bundle_packs),
        "totals": {
            "meta": sum(len(p["meta"]["indicators"]) for p in payloads.values()),
            "observations": sum(p["observations"]["recordCount"] for p in payloads.values()),
            "entities": sum(p["entities"]["recordCount"] for p in payloads.values()),
        },
        "packs": bundle_packs,
        "elements": bundle_elements,
    }
    bundle_index_path = out / "packs/bundle-index-v124.json"
    v2._write_json(bundle_index_path, bundle_index)

    # Search index and source registry, both from this delivery only.
    search_rows = []
    for element in catalog:
        indicator_labels = [
            label
            for indicator in payloads[element["elementId"]]["meta"]["indicators"]
            for label in (indicator.get("labelKo"), indicator.get("labelEn"))
            if label
        ]
        parts = [
            element["elementLabel"], element["categoryLabel"], element["sectionLabel"], element["groupLabel"],
            *element["sourceOrganizations"], *element["countryElementLabels"], *indicator_labels,
        ]
        search_rows.append(
            {
                "elementId": element["elementId"],
                "publicSlug": slugs.get(element["elementId"], element["elementId"].lower()),
                "searchText": nfc_text(" ".join(str(part) for part in parts if part)).lower(),
                "keywords": sorted(set(_unique([element["elementLabel"], element["categoryLabel"], element["sectionLabel"], element["groupLabel"], *element["sourceOrganizations"]]))),
            }
        )
    search_envelope, _, search_compressed = v2._envelope(
        {"schemaVersion": SCHEMA_VERSION, "runtimeVersion": RUNTIME_VERSION, "elements": search_rows},
        resource_type="search-index",
        shard_id=f"{prefix}-search",
    )
    search_path = out / "packs" / f"search-index-v124-{v2._sha256(search_compressed)[:8]}.json"
    v2._write_json(search_path, search_envelope, pretty=False)
    sources = [dict(sorted(row.items())) for _, row in sorted(source_rows.items(), key=lambda item: (str(item[1].get("sourceOrg") or ""), item[0]))]
    source_envelope, _, source_compressed = v2._envelope(
        {"runtimeVersion": RUNTIME_VERSION, "schemaVersion": SCHEMA_VERSION, "sources": sources},
        resource_type="source-registry",
        shard_id=f"{prefix}-source-registry",
    )
    source_path = out / "packs" / f"source-registry-v124-{v2._sha256(source_compressed)[:8]}.json"
    v2._write_json(source_path, source_envelope, pretty=False)

    # Accounting files.
    status_counts: dict[str, int] = {}
    for element in catalog:
        status_counts[element["publicStatus"]] = status_counts.get(element["publicStatus"], 0) + 1
    status_counts = dict(sorted(status_counts.items()))
    core_rows = totals["observationRowCount"] + totals["entityRowCount"] + totals["metadataRowCount"]
    original_total = core_rows + int(totals["supplementalSourceRowCount"]) + int(totals["placeholderRowCount"])
    nonstandard_rows = original_total - core_rows
    row_balance = {
        "sourceOriginalRows": original_total,
        "processedCoreRows": core_rows,
        "processedNonstandardRows": nonstandard_rows,
        "processedRows": core_rows + nonstandard_rows,
        "supplementalSourceRows": totals["supplementalSourceRowCount"],
        "explicitPlaceholderRows": totals["placeholderRowCount"],
        "formOrAuxiliaryRows": nonstandard_rows - (totals["supplementalSourceRowCount"] + totals["placeholderRowCount"]),
        "matches": True,
    }
    framework_coverage = {
        "schemaVersion": SCHEMA_VERSION,
        "frameworkElementCount": len(framework_ids),
        "sourceWorkbookCount": totals["workbookCount"],
        "accountedElementCount": len(coverage),
        "unexplainedElementCount": 0,
        "unexplainedElementIds": [],
        "elements": coverage,
    }
    quality_report = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": generated_at,
        "summary": {
            **totals,
            # V162: declared non-public source rows (config/data-publication/row-exclusions-v162.json).
            "rowExclusions": row_exclusions_v162,
            "authorizedElementCount": 0,
            "authorizedObservationRows": 0,
            "authorizedEntityRows": 0,
            "authorizedRowsFound": 0,
            "authorizedRowsPublished": 0,
            "authorizedRowsSuppressed": 0,
            "authorizedWithoutPopulatedRows": [],
            "providedButUnexplainedEmptyCount": 0,
            "rowBalance": row_balance,
        },
        "sourceZip": analysis["sourceZip"],
        "workbooks": [
            {key: value for key, value in book.items() if key not in {"observations", "entities", "metadata", "framework", "entityAttributeLabels", "supplementalSourceRows", "sourcePackage"}}
            for book in analysis["workbooks"]
        ],
    }
    publication_decisions = {"schemaVersion": SCHEMA_VERSION, "decisions": [decision], "authorizedElementCount": 0}
    rights_matrix = {
        "schemaVersion": SCHEMA_VERSION,
        "authorizedElementCount": 0,
        "authorizedRightsBlockedCount": 0,
        "authorizedPrivacyBlockedCount": 0,
        "elements": rights_rows,
    }
    geometry_manifest_path = out / "geometry" / "geometry-manifest.json"
    adm1_asset = str(entry.get("adm", {}).get("level1", {}).get("asset") or "")
    map_index = {
        "activeMapLayerCount": 0,
        "countryIso3": iso3,
        "dataSchemaVersion": SCHEMA_VERSION,
        "generatedAt": generated_at,
        "geometryManifest": v2._asset_url(geometry_manifest_path, public_dir) if geometry_manifest_path.is_file() else None,
        "mapFeatureCount": 0,
        "platformRelease": config["version"],
        "schemaVersion": SCHEMA_VERSION,
        "mapTargetContract": None,
        "layers": [],
    }
    for row in rights_rows:
        public_text_v163.sanitize_payload(row, element_id=str(row.get("elementId") or ""), country=iso3, log=public_text_log_v163)
    # V163-DL: the quality report is a public file too (not drawn on any screen).
    quality_report = public_text_v163.sanitize_download_v163(quality_report, country=iso3, source_name=None, element_id="quality-report", log=public_text_log_v163)
    public_text_v163.write_internal_report(public_text_log_v163, iso3)
    v2._write_json(out / "catalog.json", {"schemaVersion": SCHEMA_VERSION, "elements": catalog})
    v2._write_json(out / "framework-coverage.json", framework_coverage)
    v2._write_json(out / "quality-report.json", quality_report)
    v2._write_json(out / "publication-decisions.json", publication_decisions)
    v2._write_json(out / "rights-matrix.json", rights_matrix)
    v2._write_json(out / "map-index.json", map_index)
    # V158-B2: which entity columns hold region names, for the screens. A column
    # listed here is shown as "한글명 (로마자)" and never with a non-Latin local
    # name; the delivered value itself stays as it is in the packs.
    v2._write_json(
        out / "presentation-v158.json",
        {
            "schemaVersion": "country-presentation-v158",
            "countryIso3": iso3,
            "regionColumns": region_columns,
            "listSeparator": region_separator,
        },
    )

    assets = {
        "catalog": f"{data_root}/catalog.json",
        "frameworkCoverage": f"{data_root}/framework-coverage.json",
        "qualityReport": f"{data_root}/quality-report.json",
        "publicationDecisions": f"{data_root}/publication-decisions.json",
        "rightsMatrix": f"{data_root}/rights-matrix.json",
        "assetIntegrity": f"{data_root}/asset-integrity.json",
        "mapIndex": f"{data_root}/map-index.json",
    }
    if geometry_manifest_path.is_file():
        assets["geometryManifest"] = v2._asset_url(geometry_manifest_path, public_dir)
    if adm1_asset and (public_dir / adm1_asset.lstrip("/")).is_file():
        assets["adm1Geometry"] = adm1_asset
    assets.update(
        {
            "spatialLayers": [],
            "bundleIndex": v2._asset_url(bundle_index_path, public_dir),
            "searchIndex": [v2._asset_url(search_path, public_dir)],
            "sourceRegistry": v2._asset_url(source_path, public_dir),
        }
    )
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "runtimeVersion": RUNTIME_VERSION,
        "assetLayoutVersion": "gzip-base64-json-envelope-v2",
        "generatedAt": generated_at,
        "country": {"iso3": iso3, "nameKo": entry.get("nameKo"), "nameEn": entry.get("nameEn")},
        "sourcePackage": _source_package_v162(config),
        "sourcePackageSha256": analysis["sourceZip"]["sha256"].lower(),
        # V162: the home's 데이터 기준일 is the date this country's source arrived.
        "provenance": {"sourceDeliveredAt": _delivered_at_v162(config)},
        "workbookFiles": totals["workbookCount"],
        "frameworkElements": len(framework_ids),
        "accountedElements": len(coverage),
        "unexplainedElements": 0,
        "authorizedElementCount": 0,
        "authorizedRows": {"observations": 0, "entities": 0, "found": 0, "published": 0, "suppressed": 0, "withoutPopulatedRows": []},
        "rawRows": {
            "observations": totals["observationRowCount"],
            "entities": totals["entityRowCount"],
            "metadata": totals["metadataRowCount"],
            "normalizedCoreRows": core_rows,
            "nonstandardRows": nonstandard_rows,
            "total": original_total,
        },
        "rowBalance": row_balance,
        "publicStatusCounts": status_counts,
        "mapLayerCount": 0,
        "mapFeatureCount": 0,
        # Counts the offer: an excluded element keeps its files but is not offered.
        "downloadableElementCount": sum(
            bool(row.get("downloadAssets")) and row.get("publicStatus") != "excluded" for row in catalog
        ),
        "downloadDelivery": {
            key: download_manifest[key]
            for key in ("assetCount", "repositoryAssetCount", "externalAssetCount", "externalByteTotal", "uploadedCount", "pendingUploadCount", "adapter", "adapterConfigured")
        },
        "bundleIndexElements": len(bundle_elements),
        "packCount": len(bundle_packs),
        "shardCount": len(bundle_packs),
        "assets": assets,
    }
    v2._write_json(out / "manifest.json", manifest)

    # Asset integrity last (it excludes itself); geometry/ is covered too.
    shared = REPO / "public" / "data" / "world-countries.geojson"
    rows = []
    paths = [item for item in out.rglob("*") if item.is_file() and item.name != "asset-integrity.json"] + [shared]

    def url_of(path: pathlib.Path) -> str:
        return v2._asset_url(path, REPO / "public" if path == shared else public_dir)

    for path in sorted(paths, key=url_of):
        data = path.read_bytes()
        rows.append({"url": url_of(path), "bytes": len(data), "sha256": v2._sha256(data)})
    v2._write_json(out / "asset-integrity.json", {"schemaVersion": SCHEMA_VERSION, "algorithm": "SHA-256", "assetCount": len(rows), "assets": rows})

    # Every URL the manifest and catalog point at must resolve.
    def urls(value: Any) -> Iterable[str]:
        if isinstance(value, str) and value.startswith(f"{data_root}/"):
            yield value
        elif isinstance(value, Mapping):
            for item in value.values():
                yield from urls(item)
        elif isinstance(value, list):
            for item in value:
                yield from urls(item)

    missing = sorted({url for url in urls({"manifest": manifest, "catalog": catalog}) if not (public_dir / url.lstrip("/")).is_file()})
    if missing:
        raise SystemExit(f"BROKEN_GENERATED_URLS: {missing}")

    return {
        "countryIso3": iso3,
        "output": str(out.relative_to(REPO)),
        "frameworkElements": len(framework_ids),
        "delivered": totals["workbookCount"],
        "notProvided": sum(row["publicStatus"] == "not-provided" for row in catalog),
        "statusCounts": status_counts,
        "records": {"observations": bundle_index["totals"]["observations"], "entities": bundle_index["totals"]["entities"], "indicators": bundle_index["totals"]["meta"]},
        "rowBalance": row_balance,
        "packs": len(bundle_packs),
        "downloadableElements": manifest["downloadableElementCount"],
        "sources": len(sources),
        "assetCount": len(rows),
        "columnAccounting": column_accounting,
        "rowExclusions": row_exclusions_v162,
    }



def _source_package_v162(config: dict) -> str:
    """"방글라데시데이터/20260930": the delivery folder and its date, whether the
    folder is dated (…/방글라데시데이터/20260923) or not (…/방글라데시데이터)."""
    directory = pathlib.PurePosixPath(str(config["source"]["directory"]))
    delivery = str(config["source"]["delivery"])
    folder = directory.parent.name if directory.name == delivery else directory.name
    return f"{folder}/{delivery}"

def _delivered_at_v162(config: dict) -> str | None:
    """country.json source.delivery ("20260930") as YYYY-MM-DD."""
    stated = str((config.get("source") or {}).get("delivery") or "")
    return f"{stated[:4]}-{stated[4:6]}-{stated[6:8]}" if re.fullmatch(r"\d{8}", stated) else None

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--country", required=True)
    parser.add_argument("--out", default=None, help="write under .staging/ instead (determinism check)")
    parser.add_argument("--summary", default=None, help="write the build summary JSON here")
    args = parser.parse_args()
    summary = build(args.country, args.out)
    text = json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.summary:
        pathlib.Path(args.summary).write_text(text, encoding="utf-8")
    brief = {key: summary[key] for key in summary if key != "columnAccounting"}
    print(json.dumps(brief, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
