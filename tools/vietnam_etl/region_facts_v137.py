"""Derive province analysis facts for the forest-extent family.

B-031, B-032 and B-033 share B-034's shape - one row per province with the
measures spread across attribute columns - but not its meaning, so each gets its
own contract rather than inheriting carbon rules. B-033 in particular carries a
real per-year dimension in its own column, so its values are annual observations
and not a mean.

Region resolution and label binding are reused from the B-034 module; the
measure definitions are what differ.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

from .b034_facts_v137 import (
    THRESHOLD_RE,
    _matches_label,
    _number,
    _resolve_region,
    _text,
    _unit_from_label,
    build_region_crosswalk,
)

# Each entry binds one printed column label to a measure. Nothing is positional.
REGION_CONTRACTS: dict[str, dict[str, Any]] = {
    "B-031": {
        "indicatorSuffix": "_adm1",
        "measures": (
            {
                "sourceLabel": "분석대상 면적(ha)",
                "measureId": "b031-analysis-area",
                "indicatorPrefix": "B-031_prov_area_",
                "publicLabel": "성(省)별 분석대상 면적",
                "quantityType": "area",
                "statisticType": "point-in-time",
                "period": "2000",
            },
            {
                "sourceLabel": "수관 면적 2000(ha)",
                "measureId": "b031-tree-cover-area-2000",
                "indicatorPrefix": "B-031_prov_ext2000_",
                "publicLabel": "성(省)별 수관 면적(2000)",
                "quantityType": "area",
                "statisticType": "point-in-time",
                "period": "2000",
            },
            {
                "sourceLabel": "수관 면적 2010(ha)",
                "measureId": "b031-tree-cover-area-2010",
                "indicatorPrefix": "B-031_prov_ext2010_",
                "publicLabel": "성(省)별 수관 면적(2010)",
                "quantityType": "area",
                "statisticType": "point-in-time",
                "period": "2010",
            },
        ),
    },
    "B-032": {
        "indicatorSuffix": "_adm1",
        "measures": (
            {
                "sourceLabel": "수관 피복률(%)",
                "measureId": "b032-canopy-cover",
                "indicatorPrefix": "B-032_canopy_cover_prov_30_",
                "publicLabel": "성(省)별 수관 피복률",
                "quantityType": "ratio",
                "statisticType": "point-in-time",
                "period": "2010",
                # The denominator is printed per row and travels with the value;
                # a percentage without it cannot be compared across sources.
                "denominatorField": "분모_기준",
            },
        ),
    },
    "B-033": {
        "indicatorSuffix": "_adm1_year",
        "measures": (
            {
                "sourceLabel": "수관 손실(ha)",
                "measureId": "b033-annual-tree-cover-loss",
                "indicatorPrefix": "B-033_tree_cover_loss_prov_",
                "publicLabel": "연간 수관 손실 — 성(省) 단위",
                "quantityType": "area",
                "statisticType": "annual",
                # Real per-year observations; the year is its own column.
                "periodField": "연도",
            },
        ),
    },
}


def derive_region_facts(
    element_id: str,
    workbook: Mapping[str, Any],
    alias_payload: Mapping[str, Any],
) -> dict[str, Any]:
    contract = REGION_CONTRACTS.get(element_id)
    if not contract:
        return {"facts": [], "skipped": [], "unmatchedRegions": [], "nationalRows": []}

    crosswalk = build_region_crosswalk(alias_payload)
    label_to_attr = {
        _text(value): key
        for key, value in (workbook.get("entityAttributeLabels") or {}).items()
    }
    facts: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    national: list[dict[str, Any]] = []
    unmatched: list[str] = []
    source_package = _text(workbook.get("sourcePackage"))
    archive = _text(workbook.get("archiveName"))

    for entity in workbook.get("entities") or []:
        attributes = entity.get("attributes") or {}
        indicator = _text(entity.get("indicator_id"))
        if not indicator.endswith(contract["indicatorSuffix"]):
            national.append({"indicatorId": indicator, "classification": _text(attributes.get("구분"))})
            continue

        region, adm1 = _resolve_region(attributes, crosswalk)
        if not adm1:
            unmatched.append(region["regionNameRoman"] or region["sourceRegionKey"])
        classification = " ".join(
            _text(attributes.get(key)) for key in ("수관밀도_임계_%", "구분")
        )
        threshold_match = THRESHOLD_RE.search(classification) or re.search(
            r"^\s*(\d{2})\s*$", _text(attributes.get("수관밀도_임계_%"))
        )
        threshold = f"{threshold_match.group(1)}%" if threshold_match else None

        for measure in contract["measures"]:
            key = next(
                (k for k in attributes if _matches_label(k, measure["sourceLabel"])), None
            )
            if key is None:
                skipped.append(
                    {"elementId": element_id, "reason": "SOURCE_FIELD_ABSENT",
                     "sourceLabel": measure["sourceLabel"],
                     "sourceRow": int(entity.get("source_row") or 0)}
                )
                continue
            raw = attributes.get(key)
            if raw is None or _text(raw) == "":
                skipped.append(
                    {"elementId": element_id, "reason": "MISSING_VALUE",
                     "sourceLabel": measure["sourceLabel"],
                     "sourceRow": int(entity.get("source_row") or 0),
                     "regionKey": region["sourceRegionKey"]}
                )
                continue

            if measure.get("periodField"):
                period = _text(attributes.get(measure["periodField"]))
                if not period:
                    skipped.append(
                        {"elementId": element_id, "reason": "PERIOD_UNRESOLVED",
                         "sourceLabel": measure["sourceLabel"],
                         "sourceRow": int(entity.get("source_row") or 0)}
                    )
                    continue
            else:
                period = measure["period"]

            year = int(period) if period.isdigit() else None
            facts.append(
                {
                    "elementId": element_id,
                    "measureId": measure["measureId"],
                    "indicatorPrefix": measure["indicatorPrefix"],
                    "publicLabel": measure["publicLabel"],
                    "sourceField": label_to_attr.get(measure["sourceLabel"], key),
                    "sourceLabel": measure["sourceLabel"],
                    "value": _number(raw),
                    "unit": _unit_from_label(measure["sourceLabel"]),
                    "quantityType": measure["quantityType"],
                    "statisticType": measure["statisticType"],
                    "referenceYear": year,
                    "period": period,
                    "threshold": threshold,
                    "denominatorBasis": (
                        _text(attributes.get(measure["denominatorField"]))
                        if measure.get("denominatorField")
                        else None
                    ),
                    "spatialUnit": "admin1",
                    "sourceNote": _text(entity.get("note")),
                    **region,
                    "provenance": {
                        "sourcePackage": source_package,
                        "sourceFile": archive,
                        "sourceSheet": "1.2_entity(레코드형)",
                        "sourceRow": int(entity.get("source_row") or 0),
                        "sourceField": label_to_attr.get(measure["sourceLabel"], key),
                    },
                }
            )

    return {
        "facts": facts,
        "skipped": skipped,
        "unmatchedRegions": sorted(set(unmatched)),
        "nationalRows": national,
    }
