"""Build the deterministic Vietnam V124 public-data projection.

The source ZIP is intentionally kept outside Git under ``_source``.  This
builder re-inspects every workbook, preserves the existing V121 public
projection for elements whose publication decision did not change, and
rebuilds the twenty owner-authorized elements directly from their Excel rows.
"""

from __future__ import annotations

import base64
import csv
import gzip
import hashlib
import io
import json
import pathlib
import re
import shutil
from copy import deepcopy
from typing import Any, Iterable, Mapping

from .normalization import canonical_json, is_placeholder, nfc_text
from .source_zip import analyze_source_zip
from tools.vietnam_spatial.build_spatial_v124 import build_spatial_assets
from tools.vietnam_spatial.spatial_semantics_v130 import (
    apply_entity_spatial_semantics_v130,
)


SCHEMA_VERSION = "v124"
RUNTIME_VERSION = "v124-gzip-json-envelope-v1"
GENERATED_AT = "2026-08-27T00:00:00Z"
PACK_ELEMENT_COUNT = 8
ENVELOPE_CHUNK_SIZE = 8192
SOURCE_PACKAGE_NAME = "vietnam-data(4).zip"
ALLOWED_STATUSES = {
    "actual",
    "partial",
    "public-authorized",
    "schema-only",
    "data-entry-planned",
    "not-collected",
    "quarantined",
}


def _json_bytes(value: Any, *, pretty: bool = False) -> bytes:
    if pretty:
        text = json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2)
    else:
        text = canonical_json(value)
    return (text + "\n").encode("utf-8")


def _write_json(path: pathlib.Path, value: Any, *, pretty: bool = True) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(_json_bytes(value, pretty=pretty))


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _asset_url(path: pathlib.Path, public_dir: pathlib.Path) -> str:
    return "/" + path.relative_to(public_dir).as_posix()


def _repo_path_from_public_url(repo: pathlib.Path, url: str) -> pathlib.Path:
    return repo / "public" / url.lstrip("/")


def _decode_envelope(path: pathlib.Path) -> dict[str, Any]:
    envelope = json.loads(path.read_text(encoding="utf-8"))
    compressed = base64.b64decode("".join(envelope["payloadChunks"]), validate=True)
    if len(compressed) != int(envelope["compressedByteSize"]):
        raise ValueError(f"compressed size mismatch: {path}")
    if _sha256(compressed) != envelope["compressedSha256"]:
        raise ValueError(f"compressed hash mismatch: {path}")
    content = gzip.decompress(compressed)
    if len(content) != int(envelope["contentByteSize"]):
        raise ValueError(f"content size mismatch: {path}")
    if _sha256(content) != envelope["contentSha256"]:
        raise ValueError(f"content hash mismatch: {path}")
    return json.loads(content.decode("utf-8"))


def _envelope(
    payload: Any,
    *,
    resource_type: str,
    shard_id: str,
) -> tuple[dict[str, Any], bytes, bytes]:
    content = _json_bytes(payload, pretty=False)
    compressed = gzip.compress(content, compresslevel=9, mtime=0)
    encoded = base64.b64encode(compressed).decode("ascii")
    chunks = [
        encoded[index : index + ENVELOPE_CHUNK_SIZE]
        for index in range(0, len(encoded), ENVELOPE_CHUNK_SIZE)
    ]
    return (
        {
            "schemaVersion": SCHEMA_VERSION,
            "runtimeVersion": RUNTIME_VERSION,
            "transportEncoding": "gzip-base64-chunks-v2",
            "resourceType": resource_type,
            "shardId": shard_id,
            "compressedByteSize": len(compressed),
            "compressedSha256": _sha256(compressed),
            "contentByteSize": len(content),
            "contentSha256": _sha256(content),
            "payloadChunkCount": len(chunks),
            "payloadChunks": chunks,
        },
        content,
        compressed,
    )


def _load_v1_payloads(repo: pathlib.Path) -> tuple[dict[str, Any], dict[str, Any]]:
    index_path = repo / "public/data/vietnam/v1/packs-r2/bundle-index-v121r2.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    packs: dict[str, dict[str, Any]] = {}
    elements: dict[str, Any] = {}
    for element_id, entry in sorted(index["elements"].items()):
        url = entry["packUrl"]
        if url not in packs:
            packs[url] = _decode_envelope(_repo_path_from_public_url(repo, url))
        elements[element_id] = deepcopy(packs[url]["elements"][element_id])
    if len(elements) != 152:
        raise ValueError(f"V1 bundle index contains {len(elements)} elements, expected 152")
    return elements, index


def _load_v1_search(repo: pathlib.Path) -> dict[str, dict[str, Any]]:
    manifest = json.loads(
        (repo / "public/data/vietnam/v1/manifest.json").read_text(encoding="utf-8")
    )
    urls = manifest["assets"]["searchIndex"]
    rows: list[dict[str, Any]] = []
    for url in urls:
        rows.extend(_decode_envelope(_repo_path_from_public_url(repo, url))["elements"])
    slug_text = (repo / "src/data/vietnam/vietnamElementSlugsV121.ts").read_text(
        encoding="utf-8"
    )
    slug_pairs = re.findall(
        r'"([A-E]-\d{3})"\s*:\s*(?:\r?\n\s*)?"([^"]+)"', slug_text
    )
    slug_by_id = dict(slug_pairs)
    by_slug = {row["publicSlug"]: row for row in rows}
    result = {
        element_id: deepcopy(by_slug[slug])
        for element_id, slug in slug_by_id.items()
        if slug in by_slug
    }
    if len(result) != 152:
        raise ValueError(
            f"V1 search index/slug registry resolved {len(result)} elements, expected 152"
        )
    return result


def _load_v1_source_registry(repo: pathlib.Path) -> dict[str, Any]:
    manifest = json.loads(
        (repo / "public/data/vietnam/v1/manifest.json").read_text(encoding="utf-8")
    )
    url = manifest["assets"]["sourceRegistry"]
    payload = _decode_envelope(_repo_path_from_public_url(repo, url))
    payload["schemaVersion"] = SCHEMA_VERSION
    payload["runtimeVersion"] = RUNTIME_VERSION
    return payload


def _decision_ref(decision: Mapping[str, Any]) -> dict[str, Any]:
    return {
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


def _indicator_by_id(payload: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        str(row.get("indicatorId")): row
        for row in payload.get("meta", {}).get("indicators", [])
        if row.get("indicatorId")
    }


def _source_provenance(
    *,
    workbook: Mapping[str, Any],
    record: Mapping[str, Any],
    indicator: Mapping[str, Any] | None,
) -> dict[str, Any]:
    indicator = indicator or {}
    return {
        "sourcePackage": SOURCE_PACKAGE_NAME,
        "sourceFileOriginal": workbook["archiveName"],
        "sourceFileDecoded": workbook["archiveName"],
        "sourceSheet": (
            "1.1_observation(측정값)"
            if "value" in record
            else "1.2_entity(레코드형)"
        ),
        "sourceRow": int(record.get("source_row") or 0),
        "elementId": workbook["elementId"],
        "indicatorId": record.get("indicator_id"),
        "sourceOrg": indicator.get("sourceOrg"),
        "sourceUrl": indicator.get("sourceUrl"),
        "citationLocator": indicator.get("citationLocator"),
        "referenceYear": indicator.get("referenceYear"),
        "licenseCode": indicator.get("licenseCode"),
        "redistributionAllowed": indicator.get("redistributionAllowed"),
        "downloadAllowed": indicator.get("downloadAllowed"),
    }


def _number_or_value(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    text = nfc_text(value)
    if re.fullmatch(r"[-+]?\d+", text):
        try:
            return int(text)
        except ValueError:
            return text
    if re.fullmatch(r"[-+]?(?:\d+\.\d*|\d*\.\d+)", text):
        try:
            return float(text)
        except ValueError:
            return text
    if text.lower() in {"true", "yes", "y"}:
        return True
    if text.lower() in {"false", "no", "n"}:
        return False
    return text


def _authorized_observations(
    workbook: Mapping[str, Any],
    base_payload: Mapping[str, Any],
    decision: Mapping[str, Any],
) -> list[dict[str, Any]]:
    metadata = _indicator_by_id(base_payload)
    decision_ref = _decision_ref(decision)
    result: list[dict[str, Any]] = []
    for sequence, raw in enumerate(workbook.get("observations", []), start=1):
        indicator_id = str(raw.get("indicator_id") or "")
        indicator = metadata.get(indicator_id, {})
        raw_value = raw.get("value")
        value = None if is_placeholder(raw_value) else _number_or_value(raw_value)
        year = _number_or_value(raw.get("year"))
        if not isinstance(year, int):
            year = None
        result.append(
            {
                "recordId": f"v124-{workbook['elementId'].lower()}-obs-{sequence:05d}",
                "elementId": workbook["elementId"],
                "indicatorId": indicator_id,
                "countryIso3": str(raw.get("country_iso3") or "VNM").upper(),
                "year": year,
                "period": raw.get("period"),
                "value": value,
                "rawValue": raw_value if value is None and raw_value is not None else None,
                "unit": indicator.get("unit"),
                "missingReasonCode": raw.get("missing_reason_code"),
                "note": raw.get("note"),
                "loadStatus": indicator.get("loadStatus", "published"),
                "warnings": list(indicator.get("warnings") or []),
                "rightsStatus": "publication-authorized",
                "rightsNote": (
                    f"Project-owner publication decision {decision['decisionId']}; "
                    "source license and attribution remain preserved"
                ),
                "downloadEligible": True,
                "publicationDecision": decision_ref,
                "provenance": _source_provenance(
                    workbook=workbook, record=raw, indicator=indicator
                ),
            }
        )
    return result


def _safe_field_definitions(
    workbook: Mapping[str, Any], base_payload: Mapping[str, Any]
) -> list[dict[str, str]]:
    labels = workbook.get("entityAttributeLabels") or {}
    base_defs = {
        item.get("sourceField"): item
        for item in base_payload.get("meta", {}).get("fieldDefinitions", [])
    }
    used: set[str] = set()
    definitions: list[dict[str, str]] = []
    for source_field in sorted(
        labels,
        key=lambda value: int(re.search(r"\d+", value).group())
        if re.search(r"\d+", value)
        else 9999,
    ):
        base_key = str(
            base_defs.get(source_field, {}).get("normalizedKey")
            or re.sub(r"[^A-Za-z0-9가-힣]+", "_", labels[source_field]).strip("_")
            or source_field
        )
        key = base_key
        suffix = 2
        while key in used:
            key = f"{base_key}{suffix}"
            suffix += 1
        used.add(key)
        definitions.append(
            {"sourceField": source_field, "label": labels[source_field], "normalizedKey": key}
        )
    return definitions


def _entity_name(attributes: Mapping[str, Any], fallback: str) -> str:
    preferred = (
        "projectName",
        "plantName",
        "mineName",
        "organizationName",
        "orgName",
        "companyName",
        "supportingOrganization",
        "programName",
        "personName",
        "focalPointName",
        "title",
        "item",
        "sector",
        "name",
    )
    for key in preferred:
        value = attributes.get(key)
        if value is not None and not is_placeholder(value):
            return str(value)
    for value in attributes.values():
        if value is not None and not is_placeholder(value):
            return str(value)
    return fallback


def _authorized_entities(
    workbook: Mapping[str, Any],
    base_payload: Mapping[str, Any],
    decision: Mapping[str, Any],
    field_definitions: list[dict[str, str]],
) -> list[dict[str, Any]]:
    metadata = _indicator_by_id(base_payload)
    decision_ref = _decision_ref(decision)
    result: list[dict[str, Any]] = []
    for sequence, raw in enumerate(workbook.get("entities", []), start=1):
        indicator_id = str(raw.get("indicator_id") or "")
        indicator = metadata.get(indicator_id, {})
        source_attributes = list((raw.get("attributes") or {}).values())
        normalized_attributes: dict[str, Any] = {}
        raw_attributes: dict[str, Any] = {}
        for index, definition in enumerate(field_definitions):
            value = source_attributes[index] if index < len(source_attributes) else None
            normalized_attributes[definition["normalizedKey"]] = value
            raw_attributes[definition["sourceField"]] = value
        latitude = _number_or_value(raw.get("lat"))
        longitude = _number_or_value(raw.get("lon"))
        if not isinstance(latitude, (int, float)):
            latitude = None
        if not isinstance(longitude, (int, float)):
            longitude = None
        map_eligible = bool(
            latitude is not None
            and longitude is not None
            and -90 <= latitude <= 90
            and -180 <= longitude <= 180
        )
        fallback_name = f"{workbook['elementId']} record {sequence}"
        result.append(
            {
                "recordId": f"v124-{workbook['elementId'].lower()}-entity-{sequence:05d}",
                "elementId": workbook["elementId"],
                "indicatorId": indicator_id or None,
                "countryIso3": str(raw.get("country_iso3") or "VNM").upper(),
                "entityType": "entity",
                "name": _entity_name(normalized_attributes, fallback_name),
                "latitude": latitude,
                "longitude": longitude,
                "geometryType": raw.get("geometry_type"),
                "crs": raw.get("crs"),
                "geometry": None,
                "normalizedAttributes": normalized_attributes,
                "rawAttributes": raw_attributes,
                "missingReasonCode": raw.get("missing_reason_code"),
                "note": raw.get("note"),
                "loadStatus": indicator.get("loadStatus", "published"),
                "warnings": list(indicator.get("warnings") or []),
                "rightsStatus": "publication-authorized",
                "rightsNote": (
                    f"Project-owner publication decision {decision['decisionId']}; "
                    "source license and attribution remain preserved"
                ),
                "downloadEligible": True,
                "mapEligible": map_eligible,
                "mapEligibilityReason": "coordinates-valid" if map_eligible else "no-coordinate",
                "publicationDecision": decision_ref,
                "provenance": _source_provenance(
                    workbook=workbook, record=raw, indicator=indicator
                ),
            }
        )
    return result


def _status_for(
    element_id: str,
    base_status: str,
    workbook: Mapping[str, Any] | None,
    authorized: set[str],
) -> tuple[str, str, str | None]:
    if workbook is None:
        return "not-collected", "not-collected", "not-collected"
    if workbook.get("normalizationResult") == "quarantined":
        return "quarantined", "quarantined", "format-error"
    if element_id in authorized:
        if int(workbook.get("publicPopulatedRowCount", 0)) > 0:
            presence = (
                "partial-records"
                if int(workbook.get("observationMissingRowCount", 0))
                or int(workbook.get("entityMissingRowCount", 0))
                else "actual-records"
            )
            return "public-authorized", presence, None
        if workbook.get("normalizationResult") == "schema-only":
            return "schema-only", "no-populated-record", "schema-only"
        return "data-entry-planned", "no-populated-record", "explicit-placeholder-only"
    if base_status == "partial":
        return "partial", "partial-records", None
    if base_status == "actual":
        return "actual", "actual-records", None
    if int(workbook.get("publicPopulatedRowCount", 0)) > 0:
        return "partial", "partial-records", None
    if workbook.get("normalizationResult") == "schema-only":
        return "schema-only", "no-populated-record", "schema-only"
    return "data-entry-planned", "no-populated-record", "explicit-placeholder-only"


def _download_rows(payload: Mapping[str, Any]) -> tuple[list[Any], list[Any]]:
    observations = [
        row
        for row in payload["observations"]["records"]
        if bool(row.get("downloadEligible"))
    ]
    entities = [
        row for row in payload["entities"]["records"] if bool(row.get("downloadEligible"))
    ]
    return observations, entities


def _csv_safe(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        value = canonical_json(value)
    if isinstance(value, str) and value.startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


def _download_csv(
    element: Mapping[str, Any], observations: list[Any], entities: list[Any]
) -> bytes:
    columns = [
        "element_id",
        "element_label",
        "record_type",
        "record_id",
        "indicator_id",
        "country_iso3",
        "year",
        "value",
        "unit",
        "name",
        "latitude",
        "longitude",
        "attributes_json",
        "missing_reason_code",
        "note",
        "source_org",
        "source_url",
        "license_code",
        "source_file",
        "source_sheet",
        "source_row",
        "publication_decision_id",
    ]
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    decision_id = (element.get("publicationDecision") or {}).get("decisionId")
    for row in observations:
        provenance = row.get("provenance") or {}
        writer.writerow(
            {
                "element_id": element["elementId"],
                "element_label": element["elementLabel"],
                "record_type": "observation",
                "record_id": row.get("recordId"),
                "indicator_id": row.get("indicatorId"),
                "country_iso3": row.get("countryIso3"),
                "year": row.get("year") or row.get("period"),
                "value": _csv_safe(row.get("value")),
                "unit": row.get("unit"),
                "missing_reason_code": row.get("missingReasonCode"),
                "note": _csv_safe(row.get("note")),
                "source_org": provenance.get("sourceOrg"),
                "source_url": provenance.get("sourceUrl"),
                "license_code": provenance.get("licenseCode"),
                "source_file": provenance.get("sourceFileDecoded"),
                "source_sheet": provenance.get("sourceSheet"),
                "source_row": provenance.get("sourceRow"),
                "publication_decision_id": decision_id,
            }
        )
    for row in entities:
        provenance = row.get("provenance") or {}
        writer.writerow(
            {
                "element_id": element["elementId"],
                "element_label": element["elementLabel"],
                "record_type": "entity",
                "record_id": row.get("recordId"),
                "indicator_id": row.get("indicatorId"),
                "country_iso3": row.get("countryIso3"),
                "name": _csv_safe(row.get("name")),
                "latitude": row.get("latitude"),
                "longitude": row.get("longitude"),
                "attributes_json": _csv_safe(row.get("normalizedAttributes")),
                "missing_reason_code": row.get("missingReasonCode"),
                "note": _csv_safe(row.get("note")),
                "source_org": provenance.get("sourceOrg"),
                "source_url": provenance.get("sourceUrl"),
                "license_code": provenance.get("licenseCode"),
                "source_file": provenance.get("sourceFileDecoded"),
                "source_sheet": provenance.get("sourceSheet"),
                "source_row": provenance.get("sourceRow"),
                "publication_decision_id": decision_id,
            }
        )
    return ("\ufeff" + stream.getvalue()).encode("utf-8")


def _all_asset_urls(value: Any) -> Iterable[str]:
    if isinstance(value, str) and value.startswith("/data/vietnam/v2/"):
        yield value
    elif isinstance(value, Mapping):
        for item in value.values():
            yield from _all_asset_urls(item)
    elif isinstance(value, list):
        for item in value:
            yield from _all_asset_urls(item)


def build(repo: pathlib.Path) -> dict[str, Any]:
    source_zip = repo / "_source/vietnam/v124" / SOURCE_PACKAGE_NAME
    v1_root = repo / "public/data/vietnam/v1"
    public_dir = repo / "public"
    out = repo / "public/data/vietnam/v2"
    decision_path = repo / "config/data-publication/vietnam-v124-publication-decision.json"
    if not source_zip.is_file():
        raise FileNotFoundError(f"SOURCE_ZIP_NOT_FOUND: {source_zip}")
    if not decision_path.is_file():
        raise FileNotFoundError(f"publication decision missing: {decision_path}")
    expected_parent = (repo / "public/data/vietnam").resolve()
    resolved_out = out.resolve()
    if resolved_out.parent != expected_parent or resolved_out.name != "v2":
        raise RuntimeError(f"refusing to replace unexpected output path: {resolved_out}")
    if out.exists():
        shutil.rmtree(out)
    (out / "packs").mkdir(parents=True)
    (out / "downloads").mkdir(parents=True)

    decision = json.loads(decision_path.read_text(encoding="utf-8"))
    authorized = set(decision["approvedElementIds"])
    if len(authorized) != 20 or decision.get("approvedElementCount") != 20:
        raise ValueError("publication decision must contain exactly 20 unique IDs")
    catalog_v1 = json.loads((v1_root / "catalog.json").read_text(encoding="utf-8"))
    base_catalog = {
        row["elementId"]: row for row in catalog_v1["elements"]
    }
    metadata_only = {
        row["elementId"]
        for row in catalog_v1["elements"]
        if row.get("publicStatus") == "metadata-only"
    }
    if metadata_only != authorized:
        raise ValueError("decision IDs do not match the V1 metadata-only catalog projection")

    analysis = analyze_source_zip(
        source_zip,
        catalog_path=v1_root / "catalog.json",
        include_records=True,
    )
    workbook_by_id = {row["elementId"]: row for row in analysis["workbooks"]}
    v1_payloads, _ = _load_v1_payloads(repo)
    v1_manifest = json.loads((v1_root / "manifest.json").read_text(encoding="utf-8"))
    if analysis["totals"]["workbookCount"] != 149:
        raise ValueError("source workbook count must be 149")
    if len(base_catalog) != 152:
        raise ValueError("framework element count must be 152")
    if analysis["totals"]["credentialValueRemovedCount"]:
        # Sanitized values remain excluded, but force a deliberate review before release.
        raise ValueError("credential material was detected; review the hashed findings")

    payloads: dict[str, dict[str, Any]] = {}
    catalog: list[dict[str, Any]] = []
    coverage: list[dict[str, Any]] = []
    rights_rows: list[dict[str, Any]] = []
    decision_ref = _decision_ref(decision)
    for element_id in sorted(base_catalog):
        base_element = deepcopy(base_catalog[element_id])
        base_payload = deepcopy(v1_payloads[element_id])
        workbook = workbook_by_id.get(element_id)
        is_authorized = element_id in authorized
        status, presence, empty_reason = _status_for(
            element_id, base_element["publicStatus"], workbook, authorized
        )
        if status not in ALLOWED_STATUSES:
            raise ValueError(f"unsupported V124 status for {element_id}: {status}")

        if is_authorized and workbook is not None:
            field_definitions = _safe_field_definitions(workbook, base_payload)
            observations = _authorized_observations(workbook, base_payload, decision)
            entities = _authorized_entities(
                workbook, base_payload, decision, field_definitions
            )
        else:
            field_definitions = deepcopy(
                base_payload.get("meta", {}).get("fieldDefinitions", [])
            )
            observations = deepcopy(base_payload["observations"]["records"])
            entities = deepcopy(base_payload["entities"]["records"])

        entities = apply_entity_spatial_semantics_v130(element_id, entities)

        indicators = deepcopy(base_payload.get("meta", {}).get("indicators", []))
        if is_authorized:
            for indicator in indicators:
                indicator["publicationDecision"] = decision_ref
        downloadable_observations = [
            row for row in observations if bool(row.get("downloadEligible"))
        ]
        downloadable_entities = [
            row for row in entities if bool(row.get("downloadEligible"))
        ]
        downloadable_count = len(downloadable_observations) + len(downloadable_entities)
        display_allowed = status != "quarantined"
        download_allowed = downloadable_count > 0
        workbook_counts = {
            "normalizedObservationRows": int(
                workbook.get("observationRowCount", 0) if workbook else 0
            ),
            "normalizedEntityRows": int(workbook.get("entityRowCount", 0) if workbook else 0),
            "metadataRows": int(workbook.get("metadataRowCount", 0) if workbook else 0),
            "nonstandardRows": int(
                base_payload.get("meta", {})
                .get("rowAccounting", {})
                .get("nonstandardRows", 0)
            ),
            "templateRows": int(workbook.get("templateRowCount", 0) if workbook else 0),
            "placeholderRows": int(
                workbook.get("placeholderRowCount", 0) if workbook else 0
            ),
            "publicPopulatedRows": int(
                workbook.get("publicPopulatedRowCount", 0) if workbook else 0
            ),
        }

        element = base_element
        element.update(
            {
                "publicStatus": status,
                "dataPresenceStatus": presence,
                "emptyReason": empty_reason,
                "displayAllowed": display_allowed,
                "downloadAllowed": download_allowed,
                "observationCount": len(observations),
                "entityCount": len(entities),
                "downloadableRecordCount": downloadable_count,
                "availableIndicatorCount": len(
                    {
                        row.get("indicatorId")
                        for row in observations + entities
                        if row.get("indicatorId")
                        and (
                            row.get("value") is not None
                            or any(
                                not is_placeholder(value)
                                for value in (row.get("normalizedAttributes") or {}).values()
                            )
                        )
                    }
                ),
                "packageReason": (
                    "원자료 미수집"
                    if workbook is None
                    else "공개 승인 결정에 따라 원자료 행 공개"
                    if is_authorized
                    else base_element.get("packageReason")
                ),
                "assetRef": {
                    "provider": "vietnam-v124",
                    "elementId": element_id,
                    "section": "bundle",
                },
                "sourceWorkbook": {
                    "exists": workbook is not None,
                    "fileName": workbook.get("archiveName") if workbook else None,
                },
                "rowAccounting": workbook_counts,
                "publicationDecision": decision_ref if is_authorized else None,
            }
        )
        if download_allowed:
            token = element_id.lower()
            element["downloadAssets"] = [
                {
                    "format": "JSON",
                    "url": f"/data/vietnam/v2/downloads/{token}.json",
                    "mediaType": "application/json",
                    "recordCount": downloadable_count,
                },
                {
                    "format": "CSV",
                    "url": f"/data/vietnam/v2/downloads/{token}.csv",
                    "mediaType": "text/csv; charset=utf-8",
                    "recordCount": downloadable_count,
                },
            ]
        else:
            element["downloadAssets"] = None

        meta = deepcopy(base_payload["meta"])
        meta.update(
            {
                "schemaVersion": SCHEMA_VERSION,
                "element": element,
                "indicators": indicators,
                "rights": deepcopy(base_element["rights"]),
                "publicationDecision": decision_ref if is_authorized else None,
                "fieldDefinitions": field_definitions,
                "rowAccounting": workbook_counts,
                "package": {
                    "sourcePackage": SOURCE_PACKAGE_NAME,
                    "sourceFileOriginal": workbook.get("archiveName") if workbook else "",
                    "sourceFileDecoded": workbook.get("archiveName") if workbook else "",
                },
            }
        )
        payload = {
            "meta": meta,
            "observations": {
                "schemaVersion": SCHEMA_VERSION,
                "elementId": element_id,
                "recordCount": len(observations),
                "records": observations,
            },
            "entities": {
                "schemaVersion": SCHEMA_VERSION,
                "elementId": element_id,
                "recordCount": len(entities),
                "records": entities,
            },
        }
        payloads[element_id] = payload
        catalog.append(element)
        coverage.append(
            {
                "elementId": element_id,
                "workbookExists": workbook is not None,
                "sourceWorkbook": workbook.get("archiveName") if workbook else None,
                "publicStatus": status,
                "dataPresenceStatus": presence,
                "emptyReason": empty_reason,
                "observationRows": workbook_counts["normalizedObservationRows"],
                "entityRows": workbook_counts["normalizedEntityRows"],
                "metadataRows": workbook_counts["metadataRows"],
                "templateRows": workbook_counts["templateRows"],
                "placeholderRows": workbook_counts["placeholderRows"],
                "publicPopulatedRows": workbook_counts["publicPopulatedRows"],
                "publishedObservationRows": len(observations),
                "publishedEntityRows": len(entities),
                "accounted": True,
            }
        )
        rights_rows.append(
            {
                "elementId": element_id,
                "sourceRights": deepcopy(base_element["rights"]),
                "publicationDecision": decision_ref if is_authorized else None,
                "displayAllowed": display_allowed,
                "downloadAllowed": download_allowed,
                "rightsBlocked": False if is_authorized else not display_allowed,
                "privacyBlocked": False,
                "contactFieldsPublished": bool(
                    is_authorized and decision_ref["contactFieldsAllowed"]
                ),
            }
        )

    base_map_index = json.loads((v1_root / "map-index.json").read_text(encoding="utf-8"))
    spatial_build = build_spatial_assets(
        repo, out, payloads, catalog, base_map_index
    )
    map_index = spatial_build["mapIndex"]
    map_layers_by_element = {
        row["elementId"]: row for row in map_index.get("layers", [])
    }
    for element in catalog:
        layer = map_layers_by_element.get(element["elementId"])
        if layer is None:
            element["mapFeatureCount"] = 0
            if element["elementId"] == "D-023":
                element["mapMode"] = "panel-only"
            continue
        element["mapFeatureCount"] = int(layer.get("featureCount", 0))
        element["mapMode"] = layer.get("mapMode", element.get("mapMode"))

    # Static download assets are built from the exact public projection.
    for element in catalog:
        if not element["downloadAssets"]:
            continue
        payload = payloads[element["elementId"]]
        observations, entities = _download_rows(payload)
        token = element["elementId"].lower()
        _write_json(
            out / "downloads" / f"{token}.json",
            {
                "schemaVersion": SCHEMA_VERSION,
                "generatedAt": GENERATED_AT,
                "countryIso3": "VNM",
                "element": element,
                "indicators": payload["meta"]["indicators"],
                "observations": observations,
                "entities": entities,
            },
        )
        (out / "downloads" / f"{token}.csv").write_bytes(
            _download_csv(element, observations, entities)
        )

    # Element shards: exactly 19 deterministic packs of eight framework elements.
    bundle_elements: dict[str, Any] = {}
    bundle_packs: list[dict[str, Any]] = []
    sorted_ids = sorted(payloads)
    for shard_number, start in enumerate(range(0, len(sorted_ids), PACK_ELEMENT_COUNT), start=1):
        element_ids = sorted_ids[start : start + PACK_ELEMENT_COUNT]
        shard_id = f"vnm-v124-pack-{shard_number:03d}"
        shard_payload = {
            "schemaVersion": SCHEMA_VERSION,
            "runtimeVersion": RUNTIME_VERSION,
            "assetLayoutVersion": "sharded-element-bundles-v2",
            "shardId": shard_id,
            "elementIds": element_ids,
            "elements": {element_id: payloads[element_id] for element_id in element_ids},
        }
        envelope, content, compressed = _envelope(
            shard_payload, resource_type="element-shard", shard_id=shard_id
        )
        filename = f"{shard_id}-{_sha256(compressed)[:8]}.json"
        pack_path = out / "packs" / filename
        _write_json(pack_path, envelope, pretty=False)
        pack_url = _asset_url(pack_path, public_dir)
        pack_entry = {
            "shardId": shard_id,
            "packUrl": pack_url,
            "envelopeByteSize": pack_path.stat().st_size,
            "compressedByteSize": len(compressed),
            "compressedSha256": _sha256(compressed),
            "contentByteSize": len(content),
            "contentSha256": _sha256(content),
            "elementIds": element_ids,
            "metaCount": sum(len(payloads[item]["meta"]["indicators"]) for item in element_ids),
            "observationCount": sum(
                payloads[item]["observations"]["recordCount"] for item in element_ids
            ),
            "entityCount": sum(
                payloads[item]["entities"]["recordCount"] for item in element_ids
            ),
        }
        bundle_packs.append(pack_entry)
        for element_id in element_ids:
            element = next(row for row in catalog if row["elementId"] == element_id)
            bundle_elements[element_id] = {
                "elementId": element_id,
                "shardId": shard_id,
                "packUrl": pack_url,
                "metaCount": len(payloads[element_id]["meta"]["indicators"]),
                "observationCount": payloads[element_id]["observations"]["recordCount"],
                "entityCount": payloads[element_id]["entities"]["recordCount"],
                "envelopeByteSize": pack_path.stat().st_size,
                "compressedByteSize": len(compressed),
                "compressedSha256": _sha256(compressed),
                "contentByteSize": len(content),
                "contentSha256": _sha256(content),
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
            "meta": sum(len(payload["meta"]["indicators"]) for payload in payloads.values()),
            "observations": sum(
                payload["observations"]["recordCount"] for payload in payloads.values()
            ),
            "entities": sum(payload["entities"]["recordCount"] for payload in payloads.values()),
        },
        "packs": bundle_packs,
        "elements": bundle_elements,
    }
    bundle_index_path = out / "packs/bundle-index-v124.json"
    _write_json(bundle_index_path, bundle_index)

    # Search data starts with V121's human-readable slugs and adds V124 public rows.
    v1_search = _load_v1_search(repo)
    search_rows: list[dict[str, Any]] = []
    for element in catalog:
        element_id = element["elementId"]
        base = v1_search[element_id]
        row_values = ""
        if element_id in authorized:
            row_values = " " + canonical_json(
                {
                    "observations": payloads[element_id]["observations"]["records"],
                    "entities": payloads[element_id]["entities"]["records"],
                }
            )
        search_rows.append(
            {
                "elementId": element_id,
                "publicSlug": base["publicSlug"],
                "searchText": nfc_text(base["searchText"] + row_values).lower(),
                "keywords": sorted(
                    set(
                        base.get("keywords", [])
                        + [
                            element["elementLabel"],
                            element["categoryLabel"],
                            element["sectionLabel"],
                            element["groupLabel"],
                            *element["sourceOrganizations"],
                        ]
                    )
                ),
            }
        )
    search_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "runtimeVersion": RUNTIME_VERSION,
        "elements": search_rows,
    }
    search_envelope, _, search_compressed = _envelope(
        search_payload, resource_type="search-index", shard_id="vnm-v124-search"
    )
    search_path = out / "packs" / f"search-index-v124-{_sha256(search_compressed)[:8]}.json"
    _write_json(search_path, search_envelope, pretty=False)

    source_registry_payload = _load_v1_source_registry(repo)
    source_envelope, _, source_compressed = _envelope(
        source_registry_payload,
        resource_type="source-registry",
        shard_id="vnm-v124-source-registry",
    )
    source_registry_path = (
        out
        / "packs"
        / f"source-registry-v124-{_sha256(source_compressed)[:8]}.json"
    )
    _write_json(source_registry_path, source_envelope, pretty=False)

    status_counts = {
        status: sum(row["publicStatus"] == status for row in catalog)
        for status in sorted(ALLOWED_STATUSES)
    }
    authorized_rows = [payloads[element_id] for element_id in sorted(authorized)]
    authorized_observations = sum(
        row["observations"]["recordCount"] for row in authorized_rows
    )
    authorized_entities = sum(row["entities"]["recordCount"] for row in authorized_rows)
    authorized_without_populated = sorted(
        element_id
        for element_id in authorized
        if int(workbook_by_id[element_id]["publicPopulatedRowCount"]) == 0
    )
    core_rows = (
        analysis["totals"]["observationRowCount"]
        + analysis["totals"]["entityRowCount"]
        + analysis["totals"]["metadataRowCount"]
    )
    original_total = int(v1_manifest["rawRows"]["total"])
    nonstandard_rows = original_total - core_rows
    if core_rows != int(v1_manifest["rawRows"]["normalizedCoreRows"]):
        raise ValueError("fresh workbook core-row total does not reconcile with V1")
    if nonstandard_rows != int(v1_manifest["rawRows"]["nonstandardRows"]):
        raise ValueError("fresh workbook nonstandard-row total does not reconcile with V1")
    classified_nonstandard = (
        analysis["totals"]["supplementalSourceRowCount"]
        + analysis["totals"]["placeholderRowCount"]
    )
    residual_form_rows = nonstandard_rows - classified_nonstandard
    row_balance = {
        "sourceOriginalRows": original_total,
        "processedCoreRows": core_rows,
        "processedNonstandardRows": nonstandard_rows,
        "processedRows": core_rows + nonstandard_rows,
        "supplementalSourceRows": analysis["totals"]["supplementalSourceRowCount"],
        "explicitPlaceholderRows": analysis["totals"]["placeholderRowCount"],
        "formOrAuxiliaryRows": residual_form_rows,
        "matches": core_rows + nonstandard_rows == original_total,
    }

    framework_coverage = {
        "schemaVersion": SCHEMA_VERSION,
        "frameworkElementCount": 152,
        "sourceWorkbookCount": 149,
        "accountedElementCount": len(coverage),
        "unexplainedElementCount": 0,
        "unexplainedElementIds": [],
        "elements": coverage,
    }
    quality_report = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": GENERATED_AT,
        "summary": {
            **analysis["totals"],
            "authorizedElementCount": len(authorized),
            "authorizedObservationRows": authorized_observations,
            "authorizedEntityRows": authorized_entities,
            "authorizedRowsFound": authorized_observations + authorized_entities,
            "authorizedRowsPublished": authorized_observations + authorized_entities,
            "authorizedRowsSuppressed": 0,
            "authorizedWithoutPopulatedRows": authorized_without_populated,
            "providedButUnexplainedEmptyCount": 0,
            "rowBalance": row_balance,
        },
        "sourceZip": analysis["sourceZip"],
        "workbooks": [
            {key: value for key, value in workbook.items() if key not in {
                "observations",
                "entities",
                "metadata",
                "framework",
                "entityAttributeLabels",
                "supplementalSourceRows",
            }}
            for workbook in analysis["workbooks"]
        ],
    }
    publication_decisions = {
        "schemaVersion": SCHEMA_VERSION,
        "decisions": [decision],
        "authorizedElementCount": len(authorized),
    }
    rights_matrix = {
        "schemaVersion": SCHEMA_VERSION,
        "authorizedElementCount": len(authorized),
        "authorizedRightsBlockedCount": 0,
        "authorizedPrivacyBlockedCount": 0,
        "elements": rights_rows,
    }
    _write_json(out / "catalog.json", {"schemaVersion": SCHEMA_VERSION, "elements": catalog})
    _write_json(out / "framework-coverage.json", framework_coverage)
    _write_json(out / "quality-report.json", quality_report)
    _write_json(out / "publication-decisions.json", publication_decisions)
    _write_json(out / "rights-matrix.json", rights_matrix)

    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "runtimeVersion": RUNTIME_VERSION,
        "assetLayoutVersion": "gzip-base64-json-envelope-v2",
        "generatedAt": GENERATED_AT,
        "country": {"iso3": "VNM", "nameKo": "베트남", "nameEn": "Viet Nam"},
        "sourcePackage": SOURCE_PACKAGE_NAME,
        "sourcePackageSha256": analysis["sourceZip"]["sha256"].lower(),
        "workbookFiles": 149,
        "frameworkElements": 152,
        "accountedElements": 152,
        "unexplainedElements": 0,
        "authorizedElementCount": len(authorized),
        "authorizedRows": {
            "observations": authorized_observations,
            "entities": authorized_entities,
            "found": authorized_observations + authorized_entities,
            "published": authorized_observations + authorized_entities,
            "suppressed": 0,
            "withoutPopulatedRows": authorized_without_populated,
        },
        "rawRows": {
            "observations": analysis["totals"]["observationRowCount"],
            "entities": analysis["totals"]["entityRowCount"],
            "metadata": analysis["totals"]["metadataRowCount"],
            "normalizedCoreRows": core_rows,
            "nonstandardRows": nonstandard_rows,
            "total": original_total,
        },
        "rowBalance": row_balance,
        "publicStatusCounts": status_counts,
        "mapLayerCount": spatial_build["mapLayerCount"],
        "mapFeatureCount": spatial_build["mapFeatureCount"],
        "downloadableElementCount": sum(bool(row.get("downloadAssets")) for row in catalog),
        "bundleIndexElements": len(bundle_elements),
        "packCount": len(bundle_packs),
        "shardCount": len(bundle_packs),
        "assets": {
            "catalog": "/data/vietnam/v2/catalog.json",
            "frameworkCoverage": "/data/vietnam/v2/framework-coverage.json",
            "qualityReport": "/data/vietnam/v2/quality-report.json",
            "publicationDecisions": "/data/vietnam/v2/publication-decisions.json",
            "rightsMatrix": "/data/vietnam/v2/rights-matrix.json",
            "assetIntegrity": "/data/vietnam/v2/asset-integrity.json",
            "mapIndex": "/data/vietnam/v2/map-index.json",
            "geometryManifest": "/data/vietnam/v2/geometry/geometry-manifest.json",
            "adm1Geometry": "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
            "adm1Aliases": "/data/vietnam/v2/geometry/vnm-adm1-aliases.json",
            "transmissionGeometry": "/data/vietnam/v2/geometry/vnm-transmission-network.geojson",
            "regionalProjectGeometry": "/data/vietnam/v2/spatial/projects/d-018-regional.geojson",
            "spatialLayers": [
                spatial_build["spatialAssetUrls"][element_id]
                for element_id in sorted(spatial_build["spatialAssetUrls"])
            ],
            "bundleIndex": _asset_url(bundle_index_path, public_dir),
            "searchIndex": [_asset_url(search_path, public_dir)],
            "sourceRegistry": _asset_url(source_registry_path, public_dir),
        },
    }
    _write_json(out / "manifest.json", manifest)

    # Asset integrity excludes itself to avoid a circular hash.
    integrity_rows: list[dict[str, Any]] = []
    integrity_paths = [item for item in out.rglob("*") if item.is_file()]
    integrity_paths.append(public_dir / "data" / "world-countries.geojson")
    for path in sorted(integrity_paths, key=lambda item: _asset_url(item, public_dir)):
        if path.name == "asset-integrity.json":
            continue
        data = path.read_bytes()
        integrity_rows.append(
            {
                "url": _asset_url(path, public_dir),
                "bytes": len(data),
                "sha256": _sha256(data),
            }
        )
    integrity = {
        "schemaVersion": SCHEMA_VERSION,
        "algorithm": "SHA-256",
        "assetCount": len(integrity_rows),
        "assets": integrity_rows,
    }
    _write_json(out / "asset-integrity.json", integrity)

    missing_asset_urls = sorted(
        {
            url
            for url in _all_asset_urls({"manifest": manifest, "catalog": catalog})
            if not _repo_path_from_public_url(repo, url).is_file()
        }
    )
    if missing_asset_urls:
        raise ValueError(f"broken generated asset URLs: {missing_asset_urls}")

    return {
        "sourceWorkbookCount": 149,
        "frameworkElementCount": 152,
        "authorizedElementCount": len(authorized),
        "authorizedObservationRows": authorized_observations,
        "authorizedEntityRows": authorized_entities,
        "authorizedRowsPublished": authorized_observations + authorized_entities,
        "authorizedWithoutPopulatedRows": authorized_without_populated,
        "statusCounts": status_counts,
        "rowBalance": row_balance,
        "assetCount": integrity["assetCount"],
        "mapLayerCount": spatial_build["mapLayerCount"],
        "mapFeatureCount": spatial_build["mapFeatureCount"],
    }


def main() -> int:
    repo = pathlib.Path(__file__).resolve().parents[2]
    summary = build(repo)
    print(json.dumps(summary, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
