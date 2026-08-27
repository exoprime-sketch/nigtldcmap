"""Batch analysis for the Vietnam V124 source ZIP."""

from __future__ import annotations

import hashlib
import json
import pathlib
import zipfile
from typing import Any

from .normalization import decode_zip_filename, extract_element_id, sha256_json
from .workbook_parser import parse_workbook_bytes


def _read_catalog_ids(catalog_path: pathlib.Path | None) -> list[str]:
    if catalog_path is None or not catalog_path.exists():
        return []
    payload = json.loads(catalog_path.read_text(encoding="utf-8"))
    if isinstance(payload, dict):
        elements = payload.get("elements", [])
    elif isinstance(payload, list):
        elements = payload
    else:
        elements = []
    return sorted(
        str(item.get("elementId") or item.get("id"))
        for item in elements
        if isinstance(item, dict) and (item.get("elementId") or item.get("id"))
    )


def _framework_from_workbook(parsed: dict[str, Any]) -> list[dict[str, Any]]:
    framework = parsed.get("framework")
    return framework if isinstance(framework, list) else []


def analyze_source_zip(
    zip_path: str | pathlib.Path,
    *,
    catalog_path: str | pathlib.Path | None = None,
    include_records: bool = False,
) -> dict[str, Any]:
    source_path = pathlib.Path(zip_path)
    catalog = pathlib.Path(catalog_path) if catalog_path else None
    zip_bytes = source_path.read_bytes()
    source_hash = hashlib.sha256(zip_bytes).hexdigest().upper()
    parsed_workbooks: list[dict[str, Any]] = []
    file_ids: list[str] = []
    framework: list[dict[str, Any]] = []
    framework_hashes: set[str] = set()
    with zipfile.ZipFile(source_path) as archive:
        entries = [entry for entry in archive.infolist() if not entry.is_dir()]
        entries.sort(key=lambda entry: (extract_element_id(entry.filename) or "", decode_zip_filename(entry.filename)))
        for entry in entries:
            parsed = parse_workbook_bytes(
                archive.read(entry),
                entry.filename,
                include_records=True,
            )
            parsed_workbooks.append(parsed)
            if parsed.get("elementId"):
                file_ids.append(str(parsed["elementId"]))
            workbook_framework = _framework_from_workbook(parsed)
            if workbook_framework:
                framework_hashes.add(sha256_json(workbook_framework))
                if not framework:
                    framework = workbook_framework

    framework_ids = sorted(str(item["element_id"]) for item in framework if item.get("element_id"))
    catalog_ids = _read_catalog_ids(catalog)
    expected_ids = catalog_ids or framework_ids
    file_id_set = set(file_ids)
    missing_ids = sorted(set(expected_ids) - file_id_set)
    extra_ids = sorted(file_id_set - set(expected_ids))
    duplicate_file_ids = sorted({item for item in file_ids if file_ids.count(item) > 1})

    totals = {
        "workbookCount": len(parsed_workbooks),
        "frameworkElementCount": len(expected_ids),
        "workbookElementCount": len(file_id_set),
        "missingWorkbookCount": len(missing_ids),
        "quarantinedWorkbookCount": sum(item.get("sourceCategory") == "E" for item in parsed_workbooks),
        "actualDataWorkbookCount": sum(item.get("sourceCategory") == "A" for item in parsed_workbooks),
        "schemaOnlyWorkbookCount": sum(item.get("sourceCategory") == "B" for item in parsed_workbooks),
        "placeholderOnlyWorkbookCount": sum(item.get("sourceCategory") == "C" for item in parsed_workbooks),
        "observationRowCount": sum(int(item.get("observationRowCount", 0)) for item in parsed_workbooks),
        "observationPopulatedRowCount": sum(
            int(item.get("observationPopulatedRowCount", 0)) for item in parsed_workbooks
        ),
        "observationMissingRowCount": sum(
            int(item.get("observationMissingRowCount", 0)) for item in parsed_workbooks
        ),
        "entityRowCount": sum(int(item.get("entityRowCount", 0)) for item in parsed_workbooks),
        "entityPopulatedRowCount": sum(
            int(item.get("entityPopulatedRowCount", 0)) for item in parsed_workbooks
        ),
        "entityMissingRowCount": sum(
            int(item.get("entityMissingRowCount", 0)) for item in parsed_workbooks
        ),
        "metadataRowCount": sum(int(item.get("metadataRowCount", 0)) for item in parsed_workbooks),
        "templateRowCount": sum(int(item.get("templateRowCount", 0)) for item in parsed_workbooks),
        "placeholderRowCount": sum(int(item.get("placeholderRowCount", 0)) for item in parsed_workbooks),
        "supplementalSourceRowCount": sum(
            int(item.get("supplementalSourceRowCount", 0)) for item in parsed_workbooks
        ),
        "publicPopulatedRowCount": sum(
            int(item.get("publicPopulatedRowCount", 0)) for item in parsed_workbooks
        ),
        "duplicateRecordCount": sum(
            int(item.get("duplicateDetection", {}).get("duplicateCount", 0))
            for item in parsed_workbooks
        ),
        "credentialValueRemovedCount": sum(
            int(item.get("credentialDetection", {}).get("removedCount", 0))
            for item in parsed_workbooks
        ),
    }
    totals["rowBalancePass"] = all(
        bool(item.get("rowBalance", {}).get("pass"))
        for item in parsed_workbooks
        if item.get("sourceCategory") != "E"
    )

    if not include_records:
        for workbook in parsed_workbooks:
            for key in (
                "observations",
                "entities",
                "metadata",
                "framework",
                "entityAttributeLabels",
                "supplementalSourceRows",
            ):
                workbook.pop(key, None)

    return {
        "schemaVersion": "v124-source-analysis-1",
        "normalizationVersion": "v124.1",
        "sourceZip": {
            "fileName": decode_zip_filename(source_path.name),
            "sha256": source_hash,
            "entryCount": len(parsed_workbooks),
        },
        "frameworkSource": "catalog" if catalog_ids else "embedded-db-framework",
        "frameworkElementIds": expected_ids,
        "missingWorkbookElementIds": missing_ids,
        "extraWorkbookElementIds": extra_ids,
        "duplicateWorkbookElementIds": duplicate_file_ids,
        "embeddedFrameworkVariantCount": len(framework_hashes),
        "totals": totals,
        "workbooks": parsed_workbooks,
    }
