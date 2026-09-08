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
import os
import pathlib
import re
import shutil
from copy import deepcopy
from typing import Any, Iterable, Mapping

from .b034_facts_v137 import derive_b034_facts
from .region_facts_v137 import REGION_CONTRACTS, derive_region_facts
from .normalization import canonical_json, is_placeholder, nfc_text
from .source_zip import analyze_source_dir, analyze_source_zip
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
# Elements whose map assets are assembled by tools/vietnam_spatial. Their
# builders address values by indicator id, so an element here cannot be
# projected from an entity-only workbook until that derivation exists.
# Elements where the final delivery dropped an entire indicator that the
# previous projection published. Those records are retained alongside the new
# ones, keyed by indicator so the two populations stay separate.
#
# A-023 is the case that prompted this: the delivery carries 236 plants whose
# ids match the previously public registry subset exactly, 236 of 236, while the
# 1,727 OSM-derived records - which had no plant ids and were classified
# display-limited - are absent. The owner has since approved all data for
# publication, so those records are restored rather than dropped, under their own
# indicator and provenance. They are not merged into the registry: the id sets do
# not intersect, and 22 shared names would otherwise risk counting one plant
# twice.
RETAIN_MISSING_INDICATOR_ELEMENT_IDS = {"A-023"}

# Point and project layers. Their map assets are assembled from entity
# records rather than indicator-addressed observations, so an entity-only
# workbook is the shape they already expect.
# C-016 is deliberately absent: its map layer is assembled from
# indicator-addressed observations of provincial plan capacity, which the
# delivery now stores as generic 속성 columns. That needs its own contract
# (plan target vs schedule vs procuring entity are different things), so it
# stays blocked rather than shipping an empty layer.
# D-018 is absent for the same kind of reason: its layer asserts the two
# reviewed Mekong EbA activity sites, a checked fact the delivery no longer
# expresses in that shape. Relaxing the assertion would trade a verified
# claim for a passing build.
ENTITY_LAYER_ELEMENT_IDS = {"B-048", "C-025", "D-023"}

SPATIAL_ELEMENT_IDS = {
    "A-023", "A-024", "B-021", "B-031", "B-032", "B-033", "B-034",
    "B-048", "C-016", "C-025", "D-008", "D-018", "D-023",
}
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
        "sourcePackage": str(workbook.get("sourcePackage") or SOURCE_PACKAGE_NAME),
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


def _attribution_note(base_element: Mapping[str, Any]) -> str | None:
    """The source's own licence and attribution text, which survives any approval."""
    rights = base_element.get("rights") or {}
    parts: list[str] = []
    for value in rights.get("licenses") or []:
        if value and str(value) not in parts:
            parts.append(str(value))
    for value in rights.get("attributionTexts") or []:
        if value and str(value) not in parts:
            parts.append(str(value))
    return " · ".join(parts) or None


def _element_rights(
    element_id: str,
    *,
    authorized: set[str],
    decision: Mapping[str, Any],
    base_element: Mapping[str, Any],
    base_payload: Mapping[str, Any],
    all_data_decision: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Publication posture for one element's records.

    Which source an element is rebuilt from and what may be published about it
    are separate questions. The owner decision covers exactly the twenty
    E-series elements; every other element publishes under the rights already
    recorded for it in the catalog, and rebuilding it from a newer workbook does
    not change that. Keeping these apart is what lets A-D take the new source
    without inheriting the E-series download allowance.
    """

    # The owner approved display and download for every element in the project on
    # 2026-09-08, so the earlier per-element judgements - display-limited,
    # metadata-only, download 불가 - no longer gate anything. They were internal
    # classifications, not licence terms, and the licence terms are carried
    # through unchanged in rightsNote.
    if all_data_decision and element_id in set(all_data_decision["approvedElementIds"]):
        return {
            "rightsStatus": "public",
            "rightsNote": _attribution_note(base_element),
            "downloadEligible": True,
            "publicationDecision": _decision_ref(all_data_decision),
        }

    if element_id in authorized:
        return {
            "rightsStatus": "publication-authorized",
            "rightsNote": (
                f"Project-owner publication decision {decision['decisionId']}; "
                "source license and attribution remain preserved"
            ),
            "downloadEligible": True,
            "publicationDecision": _decision_ref(decision),
        }

    # Rights vary by source series, not by element: 16 of the 152 elements
    # publish some indicators openly and others display-only, while within any
    # one indicator the posture is uniform. So they are resolved per indicator.
    # Taking the first record's posture and applying it to the whole element
    # would have opened A-023's 1,727 display-limited rows or closed its 236
    # public ones, depending only on row order.
    by_indicator: dict[str, dict[str, Any]] = {}
    for bucket in ("observations", "entities"):
        for record in base_payload.get(bucket, {}).get("records", []):
            indicator_id = str(record.get("indicatorId") or "")
            if not indicator_id or indicator_id in by_indicator:
                continue
            if record.get("rightsStatus"):
                by_indicator[indicator_id] = {
                    "rightsStatus": record["rightsStatus"],
                    "rightsNote": record.get("rightsNote"),
                    "downloadEligible": bool(record.get("downloadEligible")),
                    "publicationDecision": None,
                }

    rights = base_element.get("rights") or {}
    download_values = [str(value) for value in rights.get("downloadAllowedValues") or []]
    fallback = {
        "rightsStatus": str(rights.get("status") or "limited"),
        "rightsNote": None,
        # An indicator the previous projection never carried has no posture of
        # its own; it inherits the element's catalog rights rather than the
        # allowance of whichever row happened to be read first.
        "downloadEligible": bool(download_values) and "불가" not in download_values,
        "publicationDecision": None,
    }
    return {"byIndicator": by_indicator, "default": fallback, **fallback}


def _rights_for_indicator(
    rights: Mapping[str, Any], indicator_id: str
) -> Mapping[str, Any]:
    """The posture for one indicator, falling back to the element default."""
    by_indicator = rights.get("byIndicator")
    if by_indicator and indicator_id in by_indicator:
        return by_indicator[indicator_id]
    return rights.get("default", rights)


def _apply_rights(record: dict[str, Any], rights: Mapping[str, Any]) -> dict[str, Any]:
    record["rightsStatus"] = rights["rightsStatus"]
    record["rightsNote"] = rights["rightsNote"]
    record["downloadEligible"] = rights["downloadEligible"]
    if rights.get("publicationDecision"):
        record["publicationDecision"] = rights["publicationDecision"]
    return record


def _authorized_observations(
    workbook: Mapping[str, Any],
    base_payload: Mapping[str, Any],
    decision: Mapping[str, Any],
    rights: Mapping[str, Any] | None = None,
) -> list[dict[str, Any]]:
    metadata = _indicator_by_id(base_payload)
    decision_ref = _decision_ref(decision)
    rights = rights or {
        "rightsStatus": "publication-authorized",
        "rightsNote": (
            f"Project-owner publication decision {decision['decisionId']}; "
            "source license and attribution remain preserved"
        ),
        "downloadEligible": True,
        "publicationDecision": decision_ref,
    }
    result: list[dict[str, Any]] = []
    for sequence, raw in enumerate(workbook.get("observations", []), start=1):
        indicator_id = str(raw.get("indicator_id") or "")
        indicator = metadata.get(indicator_id, {})
        row_rights = _rights_for_indicator(rights, indicator_id)
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
                "rightsStatus": row_rights["rightsStatus"],
                "rightsNote": row_rights["rightsNote"],
                "downloadEligible": row_rights["downloadEligible"],
                **(
                    {"publicationDecision": row_rights["publicationDecision"]}
                    if row_rights.get("publicationDecision")
                    else {}
                ),
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
        # The final delivery labels its columns in Korean, so the normalized keys
        # are Korean too. Without these an entity falls through to "D-018 record
        # 1" and the map popup loses the only name the source provides.
        "명칭",
        "광산명",
        "사업명",
        "기관명",
        "속성1_레코드명",
        "레코드명",
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
    rights: Mapping[str, Any] | None = None,
) -> list[dict[str, Any]]:
    metadata = _indicator_by_id(base_payload)
    decision_ref = _decision_ref(decision)
    rights = rights or {
        "rightsStatus": "publication-authorized",
        "rightsNote": (
            f"Project-owner publication decision {decision['decisionId']}; "
            "source license and attribution remain preserved"
        ),
        "downloadEligible": True,
        "publicationDecision": decision_ref,
    }
    result: list[dict[str, Any]] = []
    for sequence, raw in enumerate(workbook.get("entities", []), start=1):
        indicator_id = str(raw.get("indicator_id") or "")
        indicator = metadata.get(indicator_id, {})
        row_rights = _rights_for_indicator(rights, indicator_id)
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
                "rightsStatus": row_rights["rightsStatus"],
                "rightsNote": row_rights["rightsNote"],
                "downloadEligible": row_rights["downloadEligible"],
                "mapEligible": map_eligible,
                "mapEligibilityReason": "coordinates-valid" if map_eligible else "no-coordinate",
                **(
                    {"publicationDecision": row_rights["publicationDecision"]}
                    if row_rights.get("publicationDecision")
                    else {}
                ),
                "provenance": _source_provenance(
                    workbook=workbook, record=raw, indicator=indicator
                ),
            }
        )
    return result


def _b034_projection(
    workbook: Mapping[str, Any],
    alias_payload: Mapping[str, Any],
    rights: Mapping[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    """Expand B-034's entity sheet into indicator-addressed observations.

    The map layers, the detail charts and the download all read observations
    keyed by indicator id, so the province facts are emitted in that shape
    rather than teaching every consumer about entity attributes. One entity row
    yields five facts, which is why the derived count is not the entity count.

    Indicator ids are built from the measure and the verified adm1 code, not
    from row order, so they stay stable if the sheet is reordered.
    """

    derived = derive_b034_facts(workbook, alias_payload)
    observations: list[dict[str, Any]] = []
    indicators: dict[str, dict[str, Any]] = {}
    for fact in derived["facts"]:
        adm1 = fact.get("adm1Code")
        if not adm1:
            continue
        measure_slug = fact["measureId"].replace("b034-", "").replace("-", "_")
        indicator_id = f"B-034_prov_{measure_slug}_{adm1.replace('-', '_').lower()}"
        period = (
            str(fact["periodStart"])
            if fact["periodStart"] == fact["periodEnd"]
            else f"{fact['periodStart']}–{fact['periodEnd']}"
        )
        statistic = "연평균" if fact["statisticType"] == "annual-mean" else None
        variable_label = (
            f"{fact['publicLabel']}({statistic})" if statistic else fact["publicLabel"]
        )
        indicators.setdefault(
            indicator_id,
            {
                "indicatorId": indicator_id,
                "labelKo": f"{variable_label} — {fact['regionLabel']}",
                "unit": fact["unit"],
                "loadStatus": "published",
                "warnings": [],
                "quantityType": fact["quantityType"],
                "statisticType": fact["statisticType"],
                "periodStart": fact["periodStart"],
                "periodEnd": fact["periodEnd"],
                "spatialUnit": fact["spatialUnit"],
                "threshold": fact["threshold"],
                "geographyVersion": fact["geographyVersion"],
                "signConvention": fact.get("signConvention"),
            },
        )
        row_rights = _rights_for_indicator(rights, indicator_id)
        observations.append(
            {
                "recordId": f"v137-b-034-{indicator_id.lower()}",
                "elementId": "B-034",
                "indicatorId": indicator_id,
                "countryIso3": "VNM",
                # Flux values are a 2001-2024 mean, so they carry a period and
                # no single year. Writing a year here would date the mean.
                "year": fact["referenceYear"],
                "period": period,
                "value": fact["value"],
                "rawValue": None,
                "unit": fact["unit"],
                "missingReasonCode": None,
                "note": fact.get("sourceNote"),
                "loadStatus": "published",
                "warnings": [],
                "rightsStatus": row_rights["rightsStatus"],
                "rightsNote": row_rights["rightsNote"],
                "downloadEligible": row_rights["downloadEligible"],
                "regionId": adm1,
                "regionLabel": fact["regionLabel"],
                "sourceRegionKey": fact["sourceRegionKey"],
                "sourceRegionKeySystem": fact["sourceRegionKeySystem"],
                "reorganised2025Parent": fact["reorganised2025Parent"],
                "threshold": fact["threshold"],
                "statisticType": fact["statisticType"],
                "provenance": fact["provenance"],
            }
        )
    return observations, list(indicators.values()), derived


def _region_projection(
    element_id: str,
    workbook: Mapping[str, Any],
    alias_payload: Mapping[str, Any],
    rights: Mapping[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    """Expand a province attribute sheet into indicator-addressed observations.

    Indicator ids follow the prefixes the spatial builders already address, so
    the map layers keep working without being taught a new shape, and the
    province suffix is the verified adm1 code rather than a row position.
    """

    derived = derive_region_facts(element_id, workbook, alias_payload)
    observations: list[dict[str, Any]] = []
    indicators: dict[str, dict[str, Any]] = {}
    for fact in derived["facts"]:
        adm1 = fact.get("adm1Code")
        if not adm1:
            continue
        suffix = adm1.replace("-", "_").lower()
        indicator_id = f"{fact['indicatorPrefix']}{suffix}"
        if fact["statisticType"] == "annual":
            # One indicator per province carrying a real year series.
            indicator_id = f"{fact['indicatorPrefix']}{suffix}"
        indicators.setdefault(
            indicator_id,
            {
                "indicatorId": indicator_id,
                "labelKo": f"{fact['publicLabel']} — {fact['regionLabel']}",
                "unit": fact["unit"],
                "loadStatus": "published",
                "warnings": [],
                "quantityType": fact["quantityType"],
                "statisticType": fact["statisticType"],
                "spatialUnit": fact["spatialUnit"],
                "threshold": fact["threshold"],
                "denominatorBasis": fact.get("denominatorBasis"),
                "geographyVersion": fact["geographyVersion"],
            },
        )
        row_rights = _rights_for_indicator(rights, indicator_id)
        observations.append(
            {
                "recordId": f"v137-{element_id.lower()}-{indicator_id.lower()}-{fact['period']}",
                "elementId": element_id,
                "indicatorId": indicator_id,
                "countryIso3": "VNM",
                "year": fact["referenceYear"],
                "period": fact["period"],
                "value": fact["value"],
                "rawValue": None,
                "unit": fact["unit"],
                "missingReasonCode": None,
                "note": fact.get("sourceNote"),
                "loadStatus": "published",
                "warnings": [],
                "rightsStatus": row_rights["rightsStatus"],
                "rightsNote": row_rights["rightsNote"],
                "downloadEligible": row_rights["downloadEligible"],
                "regionId": adm1,
                "regionLabel": fact["regionLabel"],
                "sourceRegionKey": fact["sourceRegionKey"],
                "sourceRegionKeySystem": fact["sourceRegionKeySystem"],
                "reorganised2025Parent": fact["reorganised2025Parent"],
                "threshold": fact["threshold"],
                "denominatorBasis": fact.get("denominatorBasis"),
                "statisticType": fact["statisticType"],
                "provenance": fact["provenance"],
            }
        )
    return observations, list(indicators.values()), derived


def _status_for(
    element_id: str,
    base_status: str,
    workbook: Mapping[str, Any] | None,
    authorized: set[str],
    *,
    base_presence: str = "",
    base_record_count: int = 0,
    retain_absent: bool = False,
) -> tuple[str, str, str | None]:
    if workbook is None:
        # For the V124 source a missing workbook means the element was never
        # collected. A replacement delivery is different: an element it does not
        # carry keeps whatever was already published, because "this delivery
        # omitted it" is not evidence that the data ceased to exist. The caller
        # sets retain_absent only when building from an override source.
        #
        # What it is retained *as* comes from the records actually carried
        # forward, not from the previous label: the twenty authorized elements
        # all sit at "metadata-only" in the V1 catalog, so that status cannot
        # stand in for whether the element has data.
        if retain_absent:
            if base_record_count > 0:
                retained = "public-authorized" if element_id in authorized else "actual"
                return retained, (base_presence or "actual-records"), None
            if element_id in authorized:
                return "data-entry-planned", "no-populated-record", "retained-source-absent"
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


def _temporal_columns(row: Mapping[str, Any]) -> dict[str, Any]:
    """Split a record's time information into year, period and statistic.

    A single-year observation fills `year`; a range fills `period_start` and
    `period_end` and leaves `year` empty, so nothing downstream can read a mean
    as a point observation. `period` keeps the source's own display form.
    """

    period = row.get("period")
    year = row.get("year")
    start = end = None
    if period is not None:
        text = str(period).strip()
        # The delivery writes ranges with an en dash; accept a hyphen too.
        parts = [part.strip() for part in re.split(r"[–~-]", text) if part.strip()]
        if len(parts) == 2 and all(part.isdigit() for part in parts):
            start, end = int(parts[0]), int(parts[1])
        elif text.isdigit():
            start = end = int(text)
    if isinstance(year, int) and start is None:
        start = end = year
    return {
        "year": year if isinstance(year, int) else "",
        "period_start": start if start is not None else "",
        "period_end": end if end is not None else "",
        "period": period if period is not None else "",
        "statistic_type": row.get("statisticType") or "",
        "source_year_label": row.get("sourceYearLabel") or "",
    }


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
        # Year and period are different facts. Folding a range into `year`
        # made a 2001-2024 mean look like an observation from a year called
        # "2001-2024", so they get their own columns and the source's own
        # wording is preserved separately.
        "year",
        "period_start",
        "period_end",
        "period",
        "statistic_type",
        "source_year_label",
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
                **_temporal_columns(row),
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
    # Three env overrides let the final source be built into a staging tree and
    # diffed before anything under public/ is touched. Unset, every one of them
    # keeps the original V124 behaviour byte for byte.
    source_dir_override = os.environ.get("VIETNAM_SOURCE_DIR", "").strip()
    output_override = os.environ.get("VIETNAM_V2_OUTPUT", "").strip()
    expected_workbooks = int(os.environ.get("VIETNAM_EXPECTED_WORKBOOKS", "149"))

    source_zip = repo / "_source/vietnam/v124" / SOURCE_PACKAGE_NAME
    source_dir = pathlib.Path(source_dir_override) if source_dir_override else None
    if source_dir is not None and not source_dir.is_absolute():
        source_dir = (repo / source_dir).resolve()
    v1_root = repo / "public/data/vietnam/v1"
    # Staging writes a whole mirror of the public tree somewhere outside public/,
    # so CRA never copies a candidate build into build/ and no asset URL can
    # carry a staging directory name. The filesystem root moves; the logical URL
    # prefix stays /data/vietnam/v2/... exactly as it will ship.
    staging_root = os.environ.get("VIETNAM_STAGING_ROOT", "").strip()
    if staging_root:
        staging_base = pathlib.Path(staging_root)
        if not staging_base.is_absolute():
            staging_base = (repo / staging_base).resolve()
        public_dir = staging_base / "public"
        out = public_dir / "data/vietnam/v2"
    else:
        public_dir = repo / "public"
        out = (
            pathlib.Path(output_override) if output_override else repo / "public/data/vietnam/v2"
        )
        if not out.is_absolute():
            out = (repo / out).resolve()
    decision_path = repo / "config/data-publication/vietnam-v124-publication-decision.json"
    if source_dir is not None:
        if not source_dir.is_dir():
            raise FileNotFoundError(f"SOURCE_DIR_NOT_FOUND: {source_dir}")
    elif not source_zip.is_file():
        raise FileNotFoundError(f"SOURCE_ZIP_NOT_FOUND: {source_zip}")
    if not decision_path.is_file():
        raise FileNotFoundError(f"publication decision missing: {decision_path}")
    resolved_out = out.resolve()
    # The output tree is deleted before it is rebuilt, so it must be either the
    # real v2 directory or a v2-staging sibling. Anything else - a parent, the
    # repo root, the read-only source - is refused.
    #
    # Staging stays under public/data/vietnam/ because the spatial builder
    # derives asset URLs relative to public/; a staging tree outside it produces
    # unresolvable URLs. The staging names are gitignored so they never ship.
    expected_parent = (repo / "public/data/vietnam").resolve()
    is_public_v2 = resolved_out.parent == expected_parent and resolved_out.name == "v2"
    is_staging = bool(staging_root) and resolved_out.is_relative_to(
        (repo / ".staging").resolve()
    )
    if not (is_public_v2 or is_staging):
        raise RuntimeError(f"refusing to replace unexpected output path: {resolved_out}")
    if out.exists():
        shutil.rmtree(out)
    (out / "packs").mkdir(parents=True)
    (out / "downloads").mkdir(parents=True)

    decision = json.loads(decision_path.read_text(encoding="utf-8"))
    all_data_decision_path = repo / "config/data-publication/vietnam-all-data-20260908.json"
    all_data_decision = (
        json.loads(all_data_decision_path.read_text(encoding="utf-8"))
        if all_data_decision_path.is_file()
        else None
    )
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

    if source_dir is not None:
        analysis = analyze_source_dir(
            source_dir,
            catalog_path=v1_root / "catalog.json",
            include_records=True,
        )
        # Elements the replacement delivery omits keep their previous workbook
        # rather than dropping to the much older V1 projection. Without this,
        # E-011/E-013/E-016/E-017 - present in the V124 ZIP but not in the final
        # folder - would silently lose their records. The merged workbooks are
        # listed in the summary so the carry-forward is visible, not implicit.
        carried_over: list[str] = []
        if source_zip.is_file():
            present = {row["elementId"] for row in analysis["workbooks"] if row.get("elementId")}
            previous = analyze_source_zip(
                source_zip,
                catalog_path=v1_root / "catalog.json",
                include_records=True,
            )
            for row in previous["workbooks"]:
                element_id = row.get("elementId")
                if element_id and element_id not in present:
                    analysis["workbooks"].append(row)
                    carried_over.append(str(element_id))
            if carried_over:
                analysis["workbooks"].sort(key=lambda row: str(row.get("elementId") or ""))
                analysis["carriedOverElementIds"] = sorted(carried_over)
                # Totals were computed over the replacement delivery alone, so
                # every count that feeds the row balance has to take the carried
                # workbooks into account as well.
                totals = analysis["totals"]
                totals["workbookCount"] = len(analysis["workbooks"])
                for key in (
                    "observationRowCount",
                    "observationPopulatedRowCount",
                    "observationMissingRowCount",
                    "entityRowCount",
                    "entityPopulatedRowCount",
                    "entityMissingRowCount",
                    "metadataRowCount",
                    "templateRowCount",
                    "placeholderRowCount",
                    "supplementalSourceRowCount",
                    "publicPopulatedRowCount",
                ):
                    totals[key] = sum(
                        int(row.get(key, 0) or 0) for row in analysis["workbooks"]
                    )
                totals["workbookElementCount"] = len(
                    {row["elementId"] for row in analysis["workbooks"] if row.get("elementId")}
                )
    else:
        analysis = analyze_source_zip(
            source_zip,
            catalog_path=v1_root / "catalog.json",
            include_records=True,
        )
    workbook_by_id = {row["elementId"]: row for row in analysis["workbooks"]}
    v1_payloads, _ = _load_v1_payloads(repo)
    v1_manifest = json.loads((v1_root / "manifest.json").read_text(encoding="utf-8"))
    if analysis["totals"]["workbookCount"] != expected_workbooks:
        raise ValueError(
            "source workbook count must be "
            f"{expected_workbooks}, got {analysis['totals']['workbookCount']}"
        )
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
    carried_over_ids = set(analysis.get("carriedOverElementIds") or [])
    adm1_aliases = json.loads(
        (repo / "public/data/vietnam/v2/geometry/vnm-adm1-aliases.json").read_text(
            encoding="utf-8"
        )
    )
    b034_derivation_summary: dict[str, Any] = {}
    retained_indicator_counts: dict[str, int] = {}
    region_derivation_summary: dict[str, Any] = {}
    source_selection_by_element: dict[str, str] = {}
    derivation_status_by_element: dict[str, str] = {}
    projection_origin_by_element: dict[str, str] = {}
    promotion_blockers: list[dict[str, Any]] = []
    for element_id in sorted(base_catalog):
        base_element = deepcopy(base_catalog[element_id])
        base_payload = deepcopy(v1_payloads[element_id])
        workbook = workbook_by_id.get(element_id)
        is_authorized = element_id in authorized
        status, presence, empty_reason = _status_for(
            element_id,
            base_element["publicStatus"],
            workbook,
            authorized,
            base_presence=str(base_element.get("dataPresenceStatus") or ""),
            base_record_count=(
                len(base_payload["observations"]["records"])
                + len(base_payload["entities"]["records"])
            ),
            retain_absent=source_dir is not None,
        )
        if status not in ALLOWED_STATUSES:
            raise ValueError(f"unsupported V124 status for {element_id}: {status}")

        # Source selection and publication policy are decided separately.
        #
        # The owner decision names twenty E-series elements, and that is a
        # statement about what may be published, not about which file an element
        # is built from. Gating regeneration on it meant A-D read the new source
        # and then published the V1 copy anyway: B-034 arrived with 246 province
        # entities and still shipped its old 498 observations.
        #
        # An element is rebuilt whenever the selected source actually carries
        # rows. A workbook that is only a template is not a reason to blank an
        # element, so those retain the previous projection and say so.
        derived_indicators: list[dict[str, Any]] = []
        rights = _element_rights(
            element_id,
            authorized=authorized,
            decision=decision,
            base_element=base_element,
            base_payload=base_payload,
            all_data_decision=all_data_decision,
        )
        # Only a replacement source re-projects beyond the authorized twenty.
        # The V124 build keeps its original rule so its output stays byte for
        # byte what it was; widening it there changed elements the decision never
        # covered and broke C-016's spatial values.
        if source_dir is None:
            workbook_has_rows = is_authorized and workbook is not None
        else:
            workbook_has_rows = bool(workbook) and (
                int(workbook.get("publicPopulatedRowCount", 0)) > 0
            )
        # The map layers for these elements read observations addressed by
        # indicator id. The final delivery moves that data into entity attribute
        # columns, which nothing derives analysis values from yet, so projecting
        # them now would publish an element whose map has no values. Until that
        # derivation exists they keep the previous projection and are recorded as
        # blocking promotion - visibly incomplete beats silently empty.
        # B-034 has a derivation now, so it is no longer in the pending set.
        # The other elements keep their block until each gets its own contract.
        spatial_observation_elements = (
            SPATIAL_ELEMENT_IDS
            - {"B-034"}
            - set(REGION_CONTRACTS)
            - ENTITY_LAYER_ELEMENT_IDS
        )
        if (
            workbook_has_rows
            and element_id in spatial_observation_elements
            and not workbook.get("observations")
            and base_payload["observations"]["records"]
        ):
            promotion_blockers.append(
                {
                    "elementId": element_id,
                    "reason": "ENTITY_FORM_NOT_YET_DERIVED",
                    "detail": (
                        "최종 원천이 관측 시트 대신 개체 속성 열에 값을 담고 있으나 "
                        "지도 분석값 파생이 아직 구현되지 않았다. 이전 투영을 유지한다."
                    ),
                    "newEntityRows": int(workbook.get("entityRowCount", 0)),
                    "previousObservationRows": len(base_payload["observations"]["records"]),
                }
            )
            workbook_has_rows = False
            derivation_status_by_element[element_id] = "PENDING_ENTITY_DERIVATION"

        # A replacement source may legitimately carry fewer records, but a large
        # drop is a question for the data owner, not something to absorb
        # silently. Flag it and let the element project, so the candidate build
        # shows the real figure while promotion stays blocked.
        coverage_candidate = workbook_has_rows and source_dir is not None
        if workbook is not None and workbook_has_rows:
            field_definitions = _safe_field_definitions(workbook, base_payload)
            if element_id in REGION_CONTRACTS and source_dir is not None:
                observations, derived_indicators, region_derived = _region_projection(
                    element_id, workbook, adm1_aliases, rights
                )
                region_derivation_summary[element_id] = {
                    "derivedFactCount": len(region_derived["facts"]),
                    "skippedCount": len(region_derived["skipped"]),
                    "unmatchedRegions": region_derived["unmatchedRegions"],
                    "nationalRowCount": len(region_derived["nationalRows"]),
                }
                entities = _authorized_entities(
                    workbook, base_payload, decision, field_definitions, rights
                )
            elif element_id == "B-034" and source_dir is not None:
                observations, derived_indicators, b034_derivation = _b034_projection(
                    workbook, adm1_aliases, rights
                )
                b034_derivation_summary = {
                    "entityCount": b034_derivation["entityCount"],
                    "derivedFactCount": len(b034_derivation["facts"]),
                    "provinceAliasRowCount": len(b034_derivation["provinceAliasRows"]),
                    "nationalRowCount": len(b034_derivation["nationalRows"]),
                    "skippedCount": len(b034_derivation["skipped"]),
                    "unmatchedRegions": b034_derivation["unmatchedRegions"],
                }
                # The entity rows stay as they are, so the map keeps its
                # polygons and the derived facts keep their lineage back to them.
                entities = _authorized_entities(
                    workbook, base_payload, decision, field_definitions, rights
                )
            else:
                observations = _authorized_observations(
                    workbook, base_payload, decision, rights
                )
                entities = _authorized_entities(
                    workbook, base_payload, decision, field_definitions, rights
                )
            if element_id in RETAIN_MISSING_INDICATOR_ELEMENT_IDS:
                new_indicator_ids = {
                    str(row.get("indicatorId") or "") for row in observations + entities
                }
                retained = [
                    deepcopy(row)
                    for row in base_payload["entities"]["records"]
                    + base_payload["observations"]["records"]
                    if str(row.get("indicatorId") or "") not in new_indicator_ids
                ]
                for row in retained:
                    _apply_rights(
                        row,
                        _rights_for_indicator(rights, str(row.get("indicatorId") or "")),
                    )
                    row["supplementarySource"] = "previous-projection"
                if retained:
                    entities.extend(row for row in retained if "latitude" in row)
                    observations.extend(row for row in retained if "latitude" not in row)
                    retained_indicator_counts[element_id] = len(retained)
            source_selection = (
                "CARRIED_OVER_PREVIOUS_WORKBOOK"
                if element_id in carried_over_ids
                else "FINAL_SOURCE"
            )
            projection_origin_by_element[element_id] = "FINAL_SOURCE"
            derivation_status_by_element.setdefault(element_id, "COMPLETE")
        else:
            field_definitions = deepcopy(
                base_payload.get("meta", {}).get("fieldDefinitions", [])
            )
            observations = deepcopy(base_payload["observations"]["records"])
            entities = deepcopy(base_payload["entities"]["records"])
            # Records carried over from the previous projection keep their
            # values, but not the publication verdict they were built under.
            # Without this, an element retained for an unrelated reason - its
            # workbook is a template, its derivation is pending - would still
            # refuse download because of a judgement the owner has since lifted.
            for record in observations + entities:
                _apply_rights(record, _rights_for_indicator(rights, str(record.get("indicatorId") or "")))
            projection_origin_by_element[element_id] = "PREVIOUS_BASELINE"
            # Which source was selected and whether it could be derived are
            # different facts. An element whose new workbook is full of data the
            # pipeline cannot transform yet is not a template-only source, and
            # reporting it as one hid nine elements behind a benign label.
            if workbook is None:
                source_selection = (
                    "NO_SOURCE" if element_id not in carried_over_ids else "CARRIED_OVER_PREVIOUS_WORKBOOK"
                )
                derivation_status_by_element.setdefault(element_id, "NO_SOURCE")
            elif derivation_status_by_element.get(element_id) == "PENDING_ENTITY_DERIVATION":
                source_selection = "FINAL_SOURCE"
            else:
                source_selection = "FINAL_SOURCE"
                derivation_status_by_element.setdefault(element_id, "TEMPLATE_ONLY")
        source_selection_by_element[element_id] = source_selection

        entities = apply_entity_spatial_semantics_v130(element_id, entities)

        # Compare what is actually published, not the raw row count. A wide
        # entity sheet expands into several facts per row, so raw rows would
        # report a drop where the published values grew.
        if coverage_candidate:
            previous_rows = len(base_payload["observations"]["records"]) + len(
                base_payload["entities"]["records"]
            )
            new_rows = len(observations) + len(entities)
            if previous_rows >= 50 and new_rows < previous_rows * 0.5:
                promotion_blockers.append(
                    {
                        "elementId": element_id,
                        "reason": "MATERIAL_COVERAGE_DROP",
                        "detail": (
                            "공개되는 값이 이전 대비 절반 미만이다. "
                            "원천의 실제 변경으로 확인되었으나 반영 여부는 확인이 필요하다."
                        ),
                        "previousRows": previous_rows,
                        "newRows": new_rows,
                    }
                )

        indicators = deepcopy(base_payload.get("meta", {}).get("indicators", []))
        if derived_indicators and source_dir is not None:
            # The derived measures define themselves; the V1 indicator list
            # described the previous shape and must not stand in for them.
            indicators = derived_indicators
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
        repo, out, payloads, catalog, base_map_index, public_dir=public_dir
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
    # An element the replacement source does not carry keeps its existing
    # projection (see the workbook lookup above, which already falls back), so
    # absence here is "retained", not "unpopulated".
    retained_without_workbook = sorted(
        element_id for element_id in authorized if element_id not in workbook_by_id
    )
    authorized_without_populated = sorted(
        element_id
        for element_id in authorized
        if element_id in workbook_by_id
        and int(workbook_by_id[element_id]["publicPopulatedRowCount"]) == 0
    )
    core_rows = (
        analysis["totals"]["observationRowCount"]
        + analysis["totals"]["entityRowCount"]
        + analysis["totals"]["metadataRowCount"]
    )
    # The V1 manifest records how many raw rows the V124 delivery contained.
    # A replacement source has its own row total, so anchoring to the V1
    # figure would make every derived count negative. Use the source that was
    # actually read.
    if source_dir is not None:
        original_total = core_rows + int(
            analysis["totals"]["supplementalSourceRowCount"]
        ) + int(analysis["totals"]["placeholderRowCount"])
    else:
        original_total = int(v1_manifest["rawRows"]["total"])
    nonstandard_rows = original_total - core_rows
    # These two totals pin the V124 source against the V1 manifest and must stay
    # exact for that source. A replacement source legitimately changes them, so
    # there the delta is reported rather than raised - the reconciliation report
    # is what justifies it, not a hard-coded expectation.
    core_row_delta = core_rows - int(v1_manifest["rawRows"]["normalizedCoreRows"])
    nonstandard_row_delta = nonstandard_rows - int(v1_manifest["rawRows"]["nonstandardRows"])
    if source_dir is None:
        if core_row_delta:
            raise ValueError("fresh workbook core-row total does not reconcile with V1")
        if nonstandard_row_delta:
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
        "sourceWorkbookCount": analysis["totals"]["workbookCount"],
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
    # world-countries.geojson is a shared asset that lives in the repo's public
    # tree and is not rebuilt here. A staging build reads it from there but still
    # reports it under its final /data/... URL.
    shared_assets = {repo / "public" / "data" / "world-countries.geojson"}
    integrity_paths.extend(shared_assets)

    def integrity_url(path: pathlib.Path) -> str:
        root = (repo / "public") if path in shared_assets else public_dir
        return _asset_url(path, root)

    for path in sorted(integrity_paths, key=integrity_url):
        if path.name == "asset-integrity.json":
            continue
        data = path.read_bytes()
        integrity_rows.append(
            {
                "url": integrity_url(path),
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

    # Generated URLs are logical and always /data/... ; resolve them against the
    # public root this build actually wrote into, falling back to the repo's own
    # public tree for shared assets a staging build does not regenerate.
    def asset_exists(url: str) -> bool:
        relative = url.lstrip("/")
        return (public_dir / relative).is_file() or (
            repo / "public" / relative
        ).is_file()

    missing_asset_urls = sorted(
        {
            url
            for url in _all_asset_urls({"manifest": manifest, "catalog": catalog})
            if not asset_exists(url)
        }
    )
    if missing_asset_urls:
        raise ValueError(f"broken generated asset URLs: {missing_asset_urls}")

    return {
        "sourceWorkbookCount": analysis["totals"]["workbookCount"],
        "sourceSelection": {
            value: sorted(
                key for key, item in source_selection_by_element.items() if item == value
            )
            for value in sorted(set(source_selection_by_element.values()))
        },
        "b034Derivation": b034_derivation_summary,
        "regionDerivation": region_derivation_summary,
        "retainedMissingIndicatorCounts": retained_indicator_counts,
        "promotionBlockers": promotion_blockers,
        "promotionBlocked": bool(promotion_blockers),
        "derivationStatus": {
            value: sorted(
                key for key, item in derivation_status_by_element.items() if item == value
            )
            for value in sorted(set(derivation_status_by_element.values()))
        },
        "projectionOriginCounts": {
            value: sum(1 for item in projection_origin_by_element.values() if item == value)
            for value in sorted(set(projection_origin_by_element.values()))
        },
        "sourceSelectionCounts": {
            value: sum(1 for item in source_selection_by_element.values() if item == value)
            for value in sorted(set(source_selection_by_element.values()))
        },
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
