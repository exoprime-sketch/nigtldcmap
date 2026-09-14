"""Derive C-016's renewable capacity targets from the delivered entity sheet.

C-016 is 입찰·개발 일정 and PDP8's renewable capacity allocation. The final
delivery moved it out of the observation sheet and into entity attribute
columns, so the previous projection was retained and the element was recorded as
blocking promotion (``ENTITY_FORM_NOT_YET_DERIVED``). This module is that
missing derivation.

Five things the delivery keeps apart, and this keeps apart too:

*   **기술** - the plan allocates to seven named technologies (옥상태양광,
    집중형 태양광, 육상·근해 풍력, 바이오매스발전, 폐기물발전, 소수력, 양수발전
    …). Each is its own variable; they are never added together.
*   **지역 단위** - of the 817 delivered rows, 639 publish a province target,
    84 are one of the plan's own regions (권역) and 57 are national. A province
    choropleth carries only the province rows. A 권역 subtotal is not spread
    across its provinces and a national total is not spread across the country:
    neither is a province value, and inventing one would be redistribution.
*   **기간** - 2025-2030 and 2031-2035 are separate periods of the same plan,
    not a series to interpolate.
*   **하한·상한** - the plan states a range. 하한(min) and 상한(max) are separate
    values of the same target and are never averaged into one number.
*   **계획판본** - every value carries the decision it comes from
    (Quyết định 768/QĐ-TTg, 2025-04-15). A value from one plan version is never
    added to a value from another, even when the technology and region match.

What this does **not** do: it does not turn a 목표용량 into 설치용량. Every value
here is a target the plan sets, labelled as one.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

from .b034_facts_v137 import build_region_crosswalk, normalize_place

ELEMENT_ID = "C-016"

# The plan's capacity allocation tables. Everything else in the sheet - the
# schedule, the investor-selection rules, the procuring entity, the internal
# consistency check - is national narrative, not a map value.
CAPACITY_INDICATORS = {
    "C-016_re_capacity_target_vanban_chinhphu": "Phụ lục II · Bảng 2",
    "C-016_re_capacity_target_datafiles_chinhphu_2": "Phụ lục II · Bảng 4",
}

PLAN_VERSION = "Quyết định 768/QĐ-TTg (2025-04-15) · 개정 PDP8 Phụ lục II"
CAPACITY_UNIT = "MW"

# The delivery writes centrally-governed cities as "TP. Đà Nẵng"; the alias
# table already folds "thành phố" and "tỉnh", so the abbreviation is folded the
# same way. This changes the name form only - it never maps one province onto
# another's boundary.
_UNIT_PREFIX = re.compile(r"^(tp|thanh pho|tinh|province|city)\s+")

# The delivery writes a range end as "하한(min)" / "상한(max)". Matching a bare
# "min" anywhere in the description labelled every Hồ Chí Minh row as a lower
# bound - ten province targets, silently split into a variable of their own.
_BOUND_PATTERNS = (
    (re.compile(r"하한|\(\s*min\s*\)", re.IGNORECASE), "min", "하한(min)"),
    (re.compile(r"상한|\(\s*max\s*\)", re.IGNORECASE), "max", "상한(max)"),
)

_REGION_NOTE = re.compile(r"권역\s*[:：]\s*(.+)$")


def _text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _fold(name: str) -> str:
    folded = normalize_place(name)
    previous = None
    while folded != previous:
        previous = folded
        folded = _UNIT_PREFIX.sub("", folded).strip()
    return folded


def _number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = _text(value).replace(",", "")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _bound(description: str) -> tuple[str | None, str]:
    """Which end of the plan's range this row states."""

    for pattern, key, label in _BOUND_PATTERNS:
        if pattern.search(description):
            return key, label
    return None, "단일값"


def _slug(value: str) -> str:
    folded = normalize_place(value)
    return re.sub(r"[^a-z0-9]+", "-", folded).strip("-") or "value"


def _scope(region_raw: str, description: str) -> tuple[str, str]:
    """province / region / nation, plus the name the source used."""

    note_match = _REGION_NOTE.search(description)
    if note_match:
        return "region", note_match.group(1).strip()
    if "권역" in region_raw:
        return "region", region_raw
    if "nation" in region_raw.lower() or "전국" in region_raw:
        return "nation", region_raw
    return "province", region_raw


def derive_c016_facts(
    workbook: Mapping[str, Any], alias_payload: Mapping[str, Any]
) -> dict[str, Any]:
    crosswalk = build_region_crosswalk(alias_payload)
    facts: list[dict[str, Any]] = []
    national: list[dict[str, Any]] = []
    regional: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    unmatched: list[str] = []

    for entity in workbook.get("entities") or []:
        attributes = entity.get("attributes") or {}
        indicator = _text(entity.get("indicator_id"))
        source_row = int(entity.get("source_row") or 0)
        technology = _text(attributes.get("속성6_분류")) or _text(
            attributes.get("속성1_레코드명")
        )
        description = _text(attributes.get("속성23_설명"))
        region_raw = _text(attributes.get("속성20_지역_원문"))
        period = _text(attributes.get("속성4_시점"))
        raw_value = attributes.get("속성3_값")
        scope, region_name = _scope(region_raw, description)
        bound_key, bound_label = _bound(description)

        record = {
            "elementId": ELEMENT_ID,
            "indicatorId": indicator,
            "sourceRow": source_row,
            "recordName": _text(attributes.get("속성1_레코드명")),
            "technology": technology,
            "period": period,
            "bound": bound_key,
            "boundLabel": bound_label,
            "scope": scope,
            "regionSourceName": region_name,
            # Recorded, never used to place a value: the 2025 reform folded the
            # 63 units into 34, and matching on the successor would move a
            # province's target onto a boundary it was not allocated to.
            "region2025Name": _text(attributes.get("속성21_지역_현행")),
            "region2025PCode": _text(attributes.get("속성22_행정코드p_code")),
            "planVersion": PLAN_VERSION,
            "tableRef": CAPACITY_INDICATORS.get(indicator),
            "sourceUrl": _text(attributes.get("속성19_원문url")),
            "note": _text(entity.get("note")),
            "description": description,
            "rawValue": raw_value,
        }

        if indicator not in CAPACITY_INDICATORS:
            # Schedules, the procuring entity, the technology scope and the
            # plan's own consistency check. Published as national context, not
            # as a capacity value.
            national.append({**record, "kind": "narrative"})
            continue

        value = _number(raw_value)
        if value is None:
            skipped.append({**record, "reason": "NO_NUMERIC_VALUE"})
            continue
        if not period:
            skipped.append({**record, "reason": "PERIOD_UNRESOLVED"})
            continue

        if scope == "nation":
            national.append({**record, "kind": "capacity", "value": value, "unit": CAPACITY_UNIT})
            continue
        if scope == "region":
            regional.append({**record, "kind": "capacity", "value": value, "unit": CAPACITY_UNIT})
            continue

        match = crosswalk.get(_fold(region_name))
        if not match:
            unmatched.append(region_name)
            skipped.append({**record, "reason": "REGION_UNRESOLVED"})
            continue

        variable = _slug(technology)
        facts.append(
            {
                **record,
                "kind": "capacity",
                "value": value,
                "unit": CAPACITY_UNIT,
                "adm1Code": match["adm1Code"],
                "adm1Name": match["canonicalName"],
                "geographyVersion": "pre-2025-63",
                "variable": f"{variable}-{bound_key}" if bound_key else variable,
                "variableLabel": (
                    f"{technology} 계획용량 {bound_label}"
                    if bound_key
                    else f"{technology} 계획용량"
                ),
                "quantityType": "capacity",
                "statisticType": "plan-target",
            }
        )

    return {
        "facts": facts,
        "nationalRows": national,
        "regionalRows": regional,
        "skipped": skipped,
        "unmatchedRegions": sorted(set(unmatched)),
        "planVersion": PLAN_VERSION,
    }
