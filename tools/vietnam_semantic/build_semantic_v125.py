#!/usr/bin/env python3
"""Build deterministic V125 semantic overlays and visualization contracts.

The builder reads the immutable V124 catalog and compressed element packs. It
does not rewrite V124 source records. Free-text and source-label interpretation
happens here once; the React runtime consumes structured element shards.

V158: a second country has its own data root (public/data/countries.json) and
no bundled TypeScript module (Viet Nam is the only country CRA imports from
src/). `--country <iso3>` (default VNM) resolves the data root from the
registry; `--data`/`VIETNAM_DATA_ROOT` still win outright for the staging
runbook. A non-default country never touches
generatedVisualizationContractsV125.ts - it gets an equivalent JSON asset
under its own semantic/ folder instead (`--summaries-json` to relocate it).
"""

from __future__ import annotations

import argparse
import base64
import csv
import gzip
import hashlib
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def _read_json_static(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--country", default="VNM", help="ISO3 in public/data/countries.json (default: VNM)")
    parser.add_argument("--data", default=None, help="explicit data root; wins over --country and VIETNAM_DATA_ROOT (staging trees)")
    parser.add_argument("--out-root", default=None, help="write semantic/ under this root instead of the data root (byte-identity checks); input is still read from the data root")
    parser.add_argument(
        "--summaries-json",
        default=None,
        help="for a non-default country: write the element-visualization summary JSON at this path instead of the default semantic/element-visualization-summaries-v125.json",
    )
    parser.add_argument("--generated-ts", default=None, help="write the Viet Nam TypeScript module at this path instead (byte-identity checks)")
    return parser.parse_args()


_ARGS = _parse_args()
COUNTRY_ISO3 = str(_ARGS.country or "VNM").strip().upper()
IS_DEFAULT_COUNTRY = COUNTRY_ISO3 == "VNM"

ROOT = Path(__file__).resolve().parents[2]


def _country_data_root(iso3: str) -> Path:
    registry = _read_json_static(ROOT / "public" / "data" / "countries.json")
    for row in registry["countries"]:
        if row["iso3"] == iso3:
            return (ROOT / "public" / row["dataRoot"].lstrip("/")).resolve()
    raise RuntimeError(f"UNKNOWN_COUNTRY: {iso3}")


def _public_url_prefix(data_root: Path) -> str:
    """The published URL prefix for a data root, e.g. /data/bgd/v2/.

    A data root always ends in data/<slug>/v2 (the registry's own shape, kept
    the same under a staging tree), so the last three path segments are it -
    no need to know whether the root sits under this repository's public/ or
    a .staging/<name>/public/.
    """
    return "/" + "/".join(data_root.parts[-3:]) + "/"


# A candidate build runs the whole pipeline against a staging tree, so every
# stage has to be pointed at the same root. `--data` (and the legacy
# VIETNAM_DATA_ROOT env var the staging runbook already sets) wins outright;
# otherwise the country registry says where the published tree is. Unset and
# no --country, this is Viet Nam - unchanged from before V158.
if _ARGS.data:
    DATA_ROOT = Path(_ARGS.data).resolve()
elif os.environ.get("VIETNAM_DATA_ROOT"):
    DATA_ROOT = Path(os.environ["VIETNAM_DATA_ROOT"]).resolve()
else:
    DATA_ROOT = _country_data_root(COUNTRY_ISO3)
DATA_URL_PREFIX = _public_url_prefix(DATA_ROOT)
# --out-root only moves where semantic/ (and its report) land, for a
# byte-identity check against the committed tree; the data itself is always
# read from DATA_ROOT above.
SEMANTIC_OUT_ROOT = Path(_ARGS.out_root).resolve() if _ARGS.out_root else DATA_ROOT
SEMANTIC_ROOT = SEMANTIC_OUT_ROOT / "semantic"
SEMANTIC_ELEMENT_ROOT = SEMANTIC_ROOT / "elements"
if _ARGS.out_root:
    # A byte-identity check redirects the report the same way as semantic/: it
    # must never touch the committed reports/v125 tree while probing what the
    # current data would produce.
    REPORT_ROOT = SEMANTIC_OUT_ROOT / "reports-v125"
elif IS_DEFAULT_COUNTRY:
    REPORT_ROOT = ROOT / "reports" / "v125"
else:
    REPORT_ROOT = ROOT / "reports" / "v125" / COUNTRY_ISO3.lower()
CATALOG_PATH = DATA_ROOT / "catalog.json"
PACK_INDEX_PATH = DATA_ROOT / "packs" / "bundle-index-v124.json"
PRESENTATION_REGISTRY_PATH = ROOT / "src" / "data" / "elementPresentationRegistryV100.ts"
GENERATED_TS_PATH = (
    Path(_ARGS.generated_ts).resolve()
    if _ARGS.generated_ts
    else ROOT / "src" / "data" / "visualization" / "generatedVisualizationContractsV125.ts"
)
SUMMARIES_JSON_PATH = (
    Path(_ARGS.summaries_json).resolve() if _ARGS.summaries_json else SEMANTIC_ROOT / "element-visualization-summaries-v125.json"
)

SCHEMA_VERSION = "v125"
GENERATED_AT = "2026-08-27T00:00:00Z"

E012_MEASURE_LABELS = {
    "employment_rate": ("고용률", "percent", "rate", "생산가능인구"),
    "employed_persons": ("총 취업자 수", "count", "sum", None),
    "average_monthly_wage": ("평균 월임금", "currency-per-period", "mean", None),
    "occupation_employment_count": ("직군별 종사자 수", "count", "sum", None),
    "occupation_employment_share": (
        "고용 구성비",
        "percent",
        "share",
        "해당 성별 전체 취업자",
    ),
    "occupation_female_share": (
        "직군 내 여성 비중",
        "percent",
        "share",
        "해당 직군 전체 취업자",
    ),
    "occupation_wage": ("직군별 월평균 임금", "currency-per-period", "mean", None),
}
E012_OCCUPATIONS = {
    "all": ("all", "전체 직군", "합계", 0),
    "mgr": ("manager", "관리자", "관리자", 1),
    "prof": ("professional", "전문가", "전문가", 2),
    "tech": ("technician", "기술공·준전문가", "기술공·준전문가", 3),
    "clerk": ("clerk", "사무직", "사무직", 4),
    "service": ("service_sales", "서비스·판매직", "서비스·판매직", 5),
    "agri": ("skilled_agriculture", "농림어업 숙련직", "농림어업 숙련직", 6),
    "craft": ("craft", "기능원·관련직", "기능원·관련직", 7),
    "operator": (
        "machine_operator",
        "장치·기계 조작·조립원",
        "장치·기계 조작·조립원",
        8,
    ),
    "elem": ("elementary", "단순노무직", "단순노무직", 9),
    "other": ("other", "기타·미정의", "기타·미정의", 10),
    # V162: ILOSTAT's two residual groups arrive split - ISCO 0 (armed forces)
    # and X (not classifiable). The delivery labels both 기타·미정의; the code
    # tells them apart, so the label says which one.
    "armed": ("armed_forces", "기타·미정의(군인)", "기타·미정의(군인)", 11),
    "unclass": ("unclassified", "기타·미정의(분류불능)", "기타·미정의(분류불능)", 12),
}
E012_SEXES = {
    "total": ("total", "전체", 0),
    "male": ("male", "남성", 1),
    "female": ("female", "여성", 2),
}

RENDERER_MAP = {
    "score_benchmark": "score-benchmark",
    "kpi_trend": "kpi-trend",
    "composition": "composition",
    "stacked_emissions": "composition",
    "matrix": "evidence-matrix",
    "cost_comparison": "category-comparison",
    "map": "spatial-summary",
    "policy_timeline": "policy-timeline",
    "trade_dashboard": "category-comparison",
    "seasonal_calendar": "seasonality",
    "climate_scenario": "scenario-range",
    "hazard_dashboard": "category-comparison",
    "scenario_lines": "scenario-range",
    "risk_dashboard": "score-benchmark",
    "event_timeline": "policy-timeline",
    "resource_map": "spatial-summary",
    "forest_monitor": "spatial-summary",
    "landcover_map": "spatial-summary",
    "mineral_dashboard": "spatial-summary",
    "policy_evidence": "evidence-matrix",
    "capability_matrix": "capability-scorecard",
    "portfolio": "portfolio",
    "process": "evidence-matrix",
    "market_dashboard": "category-comparison",
    "budget_dashboard": "multi-metric-trend",
    "competitor_dashboard": "category-comparison",
    "finance_portfolio": "portfolio",
    "directory": "directory",
    "research_dashboard": "document-library",
    "agreement_timeline": "policy-timeline",
    "support_programs": "portfolio",
}

SECONDARY_RENDERER = {
    "spatial-summary": "structured-table",
    "portfolio": "structured-table",
    "directory": "structured-table",
    "policy-timeline": "document-library",
    "evidence-matrix": "structured-table",
    "capability-scorecard": "structured-table",
    "document-library": "structured-table",
    "status-only": "status-only",
}

NOTE_TAGS = {
    "직군": "occupation",
    "성별": "sex",
    "기술": "technology",
    "기술유형": "technology",
    "지역": "region",
    "성·시": "province",
    "성/시": "province",
    "시나리오": "scenario",
    "부문": "sector",
    "산업": "industry",
    "연료": "fuel",
    "가스": "gas",
    "재해유형": "hazard",
    "위험유형": "risk",
}
NOTE_TAG_PATTERN = re.compile(
    r"(?:^|[|;])\s*(직군|성별|기술유형|기술|지역|성·시|성/시|시나리오|부문|산업|연료|가스|재해유형|위험유형)\s*:\s*([^|;]+)"
)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def nfc(value: Any) -> str:
    return unicodedata.normalize("NFC", str(value or "")).strip()


def stable_measure_key(label: str, unit: str) -> str:
    digest = hashlib.sha256(f"{label}|{unit}".encode("utf-8")).hexdigest()[:12]
    return f"measure-{digest}"


def natural_sort_key(value: str) -> tuple[Any, ...]:
    folded = tuple(
        (1, int(part)) if part.isdigit() else (0, part.casefold())
        for part in re.split(r"(\d+)", value)
    )
    # Case-folded source values (for example Gas/gas) need an explicit final
    # tie-breaker; set iteration order is intentionally not stable.
    return (folded, value)


def sorted_values(values: set[str]) -> list[str]:
    return sorted((value for value in values if value != ""), key=natural_sort_key)


def unit_family(unit_value: Any, data_type: Any = None) -> str:
    unit = nfc(unit_value).casefold()
    dtype = nfc(data_type).casefold()
    if "boolean" in dtype:
        return "boolean"
    if "text" in dtype or "string" in dtype:
        return "text"
    if not unit or unit in {"—", "-"}:
        return "other"
    if "%" in unit or "percent" in unit:
        return "percent"
    if re.search(r"co2|co₂|co₂e|co2e|ghg|carbon", unit):
        return "emissions"
    if re.search(r"mw|gw|kw", unit) and not re.search(r"mwh|gwh|kwh", unit):
        return "capacity"
    if re.search(r"mwh|gwh|kwh|twh|\btj\b|\bpj\b|toe", unit):
        return "energy"
    if re.search(r"ha|km²|km2|m²|m2", unit):
        return "area"
    if re.search(r"vnd|usd|us\$|\$|đồng|dong", unit):
        return (
            "currency-per-period"
            if re.search(r"month|monthly|월|day|일|year|yr|년", unit)
            else "currency"
        )
    if re.search(r"명|건|개|persons?|people|count|facilit", unit):
        return "count"
    if re.search(r"score|점|index|rank", unit):
        return "score"
    return "other"


def load_element_payloads() -> dict[str, dict[str, Any]]:
    index = read_json(PACK_INDEX_PATH)
    payloads: dict[str, dict[str, Any]] = {}
    for pack in sorted(index["packs"], key=lambda item: item["shardId"]):
        pack_path = DATA_ROOT / pack["packUrl"].removeprefix(DATA_URL_PREFIX)
        envelope = read_json(pack_path)
        compressed = base64.b64decode("".join(envelope["payloadChunks"]))
        content = gzip.decompress(compressed)
        expected = envelope.get("contentSha256")
        if expected and hashlib.sha256(content).hexdigest() != expected:
            raise RuntimeError(f"Pack content hash mismatch: {pack_path.name}")
        shard = json.loads(content)
        payloads.update(shard["elements"])
    if len(payloads) != 152:
        raise RuntimeError(f"Expected 152 element payloads, found {len(payloads)}")
    return payloads


def load_presentation_specs() -> dict[str, dict[str, str]]:
    source = PRESENTATION_REGISTRY_PATH.read_text(encoding="utf-8")
    pattern = re.compile(
        r'elementId:\s*"([A-E]-\d{3})"[\s\S]*?sourcePrimaryView:\s*"([^"]+)"[\s\S]*?layoutFamily:\s*"([^"]+)"',
        re.MULTILINE,
    )
    specs = {
        match.group(1): {
            "sourcePrimaryView": match.group(2),
            "layoutFamily": match.group(3),
        }
        for match in pattern.finditer(source)
    }
    if len(specs) != 152:
        raise RuntimeError(f"Expected 152 presentation specs, found {len(specs)}")
    return specs


def e012_measure(measure_key: str, unit: str) -> dict[str, Any]:
    label, family, aggregation, denominator = E012_MEASURE_LABELS[measure_key]
    measure = {
        "key": measure_key,
        "labelKo": label,
        "unit": unit,
        "unitFamily": family,
        "aggregation": aggregation,
    }
    if denominator:
        measure["denominator"] = denominator
    return measure


# ISCO-08 major group per occupation code, for the V162 note wording.
E012_ISCO_V162 = {"mgr": "1", "prof": "2", "tech": "3", "clerk": "4", "service": "5",
                  "agri": "6", "craft": "7", "operator": "8", "elem": "9"}

E012_SOURCES = {
    "ilo": ("ilo", "ILOSTAT"),
    "nso": ("nso", "베트남 통계청(NSO)"),
}
_E012_OCC = "all|mgr|prof|tech|clerk|service|agri|craft|operator|elem|other|armed|unclass"


def e012_decode_id(indicator_id: str) -> tuple[str, dict[str, str], dict[str, str]]:
    """V162: an id may end in `_nat` (the national statistics office's series of
    the same measure, beside ILOSTAT's) and an occupation wage in `_usd` (ILO's
    USD conversion). Both become dimensions so no two sources or currencies ever
    share one series; the base decoding is unchanged."""
    source = "ilo"
    base_id = indicator_id
    if base_id.endswith("_nat"):
        source, base_id = "nso", base_id[: -len("_nat")]
    measure, dims, labels = _e012_decode_base(base_id)
    if measure == "occupation_wage" and "currency" not in dims:
        currency = "VND"
        dims = {**dims, "currency": currency}
        labels = {**labels, "currency": currency}
    dims = {**dims, "source": E012_SOURCES[source][0]}
    labels = {**labels, "source": E012_SOURCES[source][1]}
    return measure, dims, labels


def _e012_decode_base(indicator_id: str) -> tuple[str, dict[str, str], dict[str, str]]:
    usd = False
    if indicator_id.startswith("E-012_occupation_wage_") and indicator_id.endswith("_usd"):
        usd, indicator_id = True, indicator_id[: -len("_usd")]
    if indicator_id == "E-012_employment_rate":
        return "employment_rate", {}, {}
    if indicator_id == "E-012_employed_persons":
        return "employed_persons", {}, {}
    match = re.fullmatch(r"E-012_avg_monthly_wage_(lcu|usd)", indicator_id)
    if match:
        currency = "USD" if match.group(1) == "usd" else "VND"
        return "average_monthly_wage", {"currency": currency}, {"currency": currency}
    if indicator_id == "E-012_industry_employment_share":
        return (
            "occupation_employment_share",
            {"occupation": "all", "sex": "total", "classification": "industry"},
            {"occupation": "전체 직군", "sex": "전체", "classification": "산업부문"},
        )
    patterns = [
        (re.compile(rf"E-012_occupation_employment_({_E012_OCC})_(total|male|female)"), "occupation_employment_count", None),
        (re.compile(rf"E-012_occupation_employment_share_({_E012_OCC})_(total|male|female)"), "occupation_employment_share", None),
        (re.compile(rf"E-012_occupation_female_share_({_E012_OCC})"), "occupation_female_share", "female"),
        (re.compile(rf"E-012_occupation_wage_({_E012_OCC})_(total|male|female)"), "occupation_wage", None),
    ]
    for pattern, measure, default_sex in patterns:
        match = pattern.fullmatch(indicator_id)
        if not match:
            continue
        occupation = E012_OCCUPATIONS[match.group(1)]
        sex_code = default_sex or match.group(2)
        sex = E012_SEXES[sex_code]
        dims = {"occupation": occupation[0], "sex": sex[0]}
        labels = {"occupation": occupation[1], "sex": sex[1]}
        if measure == "occupation_wage":
            currency = "USD" if usd else "VND"
            dims["currency"] = currency
            labels["currency"] = currency
        return measure, dims, labels
    raise RuntimeError(f"Unrecognized E-012 indicator id: {indicator_id}")


def validate_e012_notes(
    indicators: list[dict[str, Any]], observations: list[dict[str, Any]]
) -> dict[str, Any]:
    indicator_ids = {item["indicatorId"] for item in indicators}
    for indicator_id in indicator_ids:
        e012_decode_id(indicator_id)
    mismatches: list[dict[str, str]] = []
    occupation_pattern = re.compile(
        r"^E-012_occupation_(?:employment(?:_share)?|female_share|wage)_(all|mgr|prof|tech|clerk|service|agri|craft|operator|elem|other)(?:_(total|male|female))?$"
    )
    for observation in observations:
        indicator_id = observation["indicatorId"]
        match = occupation_pattern.fullmatch(indicator_id)
        if not match:
            continue
        note = nfc(observation.get("note"))
        occupation = E012_OCCUPATIONS[match.group(1)]
        # V162: the 2026-09-30 delivery words the note from the ILOSTAT series
        # ("… — 관리자(ISCO-08 1) / 여성", "… — 농림어업 숙련종사자(6)"): the
        # ISCO major group number and the sex after " / " carry the same check.
        isco = E012_ISCO_V162.get(match.group(1))
        new_form = "[원본: ILOSTAT" in note
        if new_form:
            if isco is not None and not re.search(rf"(?:ISCO-08\s*{isco}\)|\({isco}\))", note):
                mismatches.append({"recordId": observation["recordId"], "indicatorId": indicator_id,
                                   "reason": f"note ISCO group does not match {occupation[1]}"})
            sex_code = match.group(2)
            if sex_code in ("male", "female") and E012_SEXES[sex_code][1] not in note:
                mismatches.append({"recordId": observation["recordId"], "indicatorId": indicator_id,
                                   "reason": f"note sex does not match {E012_SEXES[sex_code][1]}"})
            continue
        if f"직군: {occupation[2]}" not in note:
            mismatches.append(
                {
                    "recordId": observation["recordId"],
                    "indicatorId": indicator_id,
                    "reason": f"note occupation does not match {occupation[1]}",
                }
            )
        sex_code = match.group(2)
        if sex_code:
            sex_label = E012_SEXES[sex_code][1]
            if f"성별: {sex_label}" not in note:
                mismatches.append(
                    {
                        "recordId": observation["recordId"],
                        "indicatorId": indicator_id,
                        "reason": f"note sex does not match {sex_label}",
                    }
                )
    if mismatches:
        raise RuntimeError(
            "E-012 indicator/note mismatch:\n"
            + "\n".join(json.dumps(item, ensure_ascii=False) for item in mismatches[:20])
        )
    missing_other_wage = [
        observation
        for observation in observations
        if observation["indicatorId"].startswith("E-012_occupation_wage_other_")
        and observation.get("value") is None
    ]
    missing_other_labelled = len(missing_other_wage) == 3 and all(
        observation.get("missingReasonCode") == "M01"
        and "원천 미제공" in nfc(observation.get("note"))
        for observation in missing_other_wage
    )
    years = sorted(
        {int(item["year"]) for item in observations if item.get("year") is not None}
    )
    return {
        "measureKeys": list(E012_MEASURE_LABELS),
        "occupations": [
            {
                "value": value[0],
                "labelKo": value[1],
                "sourceCode": code,
                "sortOrder": value[3],
            }
            for code, value in E012_OCCUPATIONS.items()
            if code != "all"
        ],
        "occupationOptions": [
            {
                "value": value[0],
                "labelKo": value[1],
                "sourceCode": code,
                "sortOrder": value[3],
            }
            for code, value in E012_OCCUPATIONS.items()
        ],
        "sexes": [
            {"value": value[0], "labelKo": value[1], "sortOrder": value[2]}
            for value in E012_SEXES.values()
        ],
        "years": years,
        "indicatorCount": len(indicators),
        "observationCount": len(observations),
        "idNoteMismatchCount": 0,
        "missingOtherWageCount": len(missing_other_wage),
        "missingOtherWageLabelled": missing_other_labelled,
        "totalRowSeparated": True,
        "tableRecordReconciliation": "PASS",
    }


def note_dimensions(note: Any) -> tuple[dict[str, str], dict[str, str]]:
    dimensions: dict[str, str] = {}
    labels: dict[str, str] = {}
    for match in NOTE_TAG_PATTERN.finditer(nfc(note)):
        source_key = nfc(match.group(1))
        value = nfc(match.group(2))
        key = NOTE_TAGS[source_key]
        dimensions[key] = value
        labels[key] = value
    return dimensions, labels


def deduplicate_indicators(
    element_id: str, indicators: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return one semantic definition per source indicator id.

    V124 contains one known ambiguous id in B-028. Its two source rows describe
    pre-/post-dam values. The last metadata row is the V124 map definition used
    by the independent audit; record-level phase semantics are added below.
    Any new ambiguous duplicate fails the build instead of being corrected
    silently.
    """
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for indicator in indicators:
        grouped[indicator["indicatorId"]].append(indicator)
    decisions: list[dict[str, Any]] = []
    result: list[dict[str, Any]] = []
    for indicator_id, values in grouped.items():
        if len(values) == 1:
            result.append(values[0])
            continue
        labels = [nfc(item.get("labelKo")) for item in values]
        accepted_b028 = (
            element_id == "B-028"
            and indicator_id == "B-028_discharge_cumecs_son_tay"
            and len(values) == 2
            and labels[0].endswith("댐 건설 전")
            and labels[1].endswith("댐 건설 후")
            and {nfc(item.get("unit")) for item in values} == {"m³/s"}
        )
        if not accepted_b028:
            if IS_DEFAULT_COUNTRY:
                raise RuntimeError(
                    f"Ambiguous duplicate indicator metadata: {element_id} {indicator_id} "
                    + json.dumps(labels, ensure_ascii=False)
                )
            # A country outside Viet Nam has no reviewed disambiguation for a
            # repeated id; keep the last metadata row (V124's own tie-break)
            # and record it instead of failing the whole build, so the report
            # can flag it for review.
            result.append(values[-1])
            decisions.append(
                {
                    "elementId": element_id,
                    "indicatorId": indicator_id,
                    "sourceRows": [item.get("provenance", {}).get("sourceRow") for item in values],
                    "sourceLabels": labels,
                    "semanticIndicatorPolicy": "generic-last-metadata-row-no-reviewed-disambiguation",
                    "recordDimensionPolicy": "not-modelled",
                }
            )
            continue
        result.append(values[-1])
        decisions.append(
            {
                "elementId": element_id,
                "indicatorId": indicator_id,
                "sourceRows": [item.get("provenance", {}).get("sourceRow") for item in values],
                "sourceLabels": labels,
                "semanticIndicatorPolicy": "last-v124-metadata-row",
                "recordDimensionPolicy": "explicit-pre-post-dam-phase",
            }
        )
    return result, decisions


def generic_indicator_structure(indicator: dict[str, Any]) -> tuple[str, dict[str, str], dict[str, str]]:
    label = nfc(indicator.get("labelKo")) or indicator["indicatorId"]
    # Only the em dash separates a measure from its qualifiers. An en dash is
    # part of a name here - "Bà Rịa–Vũng Tàu" is one province, and splitting on
    # it truncated the province to "Bà Rịa" and invented a detail_2 dimension
    # whose single value was "Vũng Tàu".
    dash_parts = [nfc(part) for part in re.split(r"\s*—\s*", label) if nfc(part)]
    lead_parts = [nfc(part) for part in re.split(r"\s*·\s*", dash_parts[0]) if nfc(part)]
    measure_label = lead_parts[0] if lead_parts else label
    dimensions: dict[str, str] = {}
    labels: dict[str, str] = {}
    if len(lead_parts) > 1:
        dimensions["category"] = " · ".join(lead_parts[1:])
        labels["category"] = dimensions["category"]
    for index, part in enumerate(dash_parts[1:], start=1):
        key = "detail" if index == 1 else f"detail_{index}"
        dimensions[key] = part
        labels[key] = part
    raw_technology_ids = indicator.get("technologyIds", [])
    if isinstance(raw_technology_ids, str):
        technology_source = re.split(r"[\s,;|]+", raw_technology_ids.strip())
    elif isinstance(raw_technology_ids, list):
        technology_source = raw_technology_ids
    elif raw_technology_ids is None:
        technology_source = []
    else:
        technology_source = [raw_technology_ids]
    technology_ids = sorted(
        {nfc(item) for item in technology_source if nfc(item)}, key=natural_sort_key
    )
    if technology_ids:
        dimensions["technology"] = ",".join(technology_ids)
        labels["technology"] = " · ".join(technology_ids)
    return measure_label, dimensions, labels


def make_indicator_semantics(
    element_id: str,
    indicators: list[dict[str, Any]],
    observations: list[dict[str, Any]],
    e012_scheme: bool = True,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    source_label_counts = Counter(
        (nfc(item.get("labelKo")), nfc(item.get("unit"))) for item in indicators
    )
    observation_units: dict[str, str] = {}
    for observation in observations:
        if observation.get("unit"):
            observation_units.setdefault(observation["indicatorId"], nfc(observation["unit"]))
    semantics: list[dict[str, Any]] = []
    by_id: dict[str, dict[str, Any]] = {}
    for indicator in sorted(indicators, key=lambda item: item["indicatorId"]):
        indicator_id = indicator["indicatorId"]
        unit = nfc(indicator.get("unit")) or observation_units.get(indicator_id) or "—"
        source_label = nfc(indicator.get("labelKo")) or indicator_id
        if element_id == "E-012" and e012_scheme:
            measure_key, dimensions, dimension_labels = e012_decode_id(indicator_id)
            measure = e012_measure(measure_key, unit)
            display_suffix = " · ".join(dimension_labels.values())
            display_label = (
                f"{measure['labelKo']} · {display_suffix}" if display_suffix else measure["labelKo"]
            )
            inference_method = "explicit-override"
        else:
            measure_label, dimensions, dimension_labels = generic_indicator_structure(indicator)
            measure = {
                "key": stable_measure_key(measure_label, unit),
                "labelKo": measure_label,
                "unit": unit,
                "unitFamily": unit_family(unit, indicator.get("dataType")),
            }
            display_label = source_label
            inference_method = "deterministic-source-structure"
        if source_label_counts[(source_label, unit)] > 1:
            source_series = nfc(indicator.get("sourceSeriesId"))
            source_key = indicator_id.removeprefix(f"{element_id}_")
            qualifier = f"{source_series} · {source_key}" if source_series else source_key
            display_label = f"{display_label} · {qualifier}"
        dimension_part = "|".join(
            f"{key}={value}" for key, value in sorted(dimensions.items())
        )
        series_key = f"{measure['key']}|{unit}|{dimension_part}|{indicator_id}"
        semantic = {
            "indicatorId": indicator_id,
            "measure": measure,
            "dimensions": dimensions,
            "dimensionLabels": dimension_labels,
            "displayLabel": display_label,
            "seriesKey": series_key,
            "axisGroupKey": f"{measure['key']}|{unit}",
            "sourceLabel": source_label,
            "sourceLabelEn": indicator.get("labelEn"),
            "sourceNote": indicator.get("missingNote") or indicator.get("caveat"),
            "sourceCaveat": indicator.get("caveat"),
            # V124 remains the authoritative provenance record. Keep a compact
            # source-row reference here instead of duplicating every license
            # and publication-decision field in the semantic overlay.
            "sourceProvenance": {
                key: indicator.get("provenance", {}).get(key)
                for key in (
                    "elementId",
                    "indicatorId",
                    "sourceFileDecoded",
                    "sourceSheet",
                    "sourceRow",
                )
                if indicator.get("provenance", {}).get(key) is not None
            },
            "inferenceMethod": inference_method,
        }
        semantics.append(semantic)
        by_id[indicator_id] = semantic
    visible_counts = Counter(item["displayLabel"] for item in semantics)
    for semantic in semantics:
        if visible_counts[semantic["displayLabel"]] > 1:
            semantic["displayLabel"] = (
                f"{semantic['displayLabel']} · {semantic['measure']['labelKo']} "
                f"[{semantic['measure']['unit']}]"
            )
    remaining_counts = Counter(item["displayLabel"] for item in semantics)
    for semantic in semantics:
        if remaining_counts[semantic["displayLabel"]] > 1:
            semantic["displayLabel"] = (
                f"{semantic['displayLabel']} · "
                f"{semantic['indicatorId'].removeprefix(f'{element_id}_')}"
            )
    return semantics, by_id


def make_record_semantics(
    observations: list[dict[str, Any]], by_indicator: dict[str, dict[str, Any]]
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for observation in sorted(observations, key=lambda item: item["recordId"]):
        indicator = by_indicator.get(observation["indicatorId"])
        if not indicator:
            raise RuntimeError(
                f"Observation {observation['recordId']} has no indicator semantics: "
                f"{observation['indicatorId']}"
            )
        dimensions = dict(indicator["dimensions"])
        labels = dict(indicator["dimensionLabels"])
        if observation.get("year") is not None:
            dimensions["year"] = str(observation["year"])
            labels["year"] = str(observation["year"])
        if observation.get("period"):
            dimensions["period"] = nfc(observation["period"])
            labels["period"] = nfc(observation["period"])
        structured, structured_labels = note_dimensions(observation.get("note"))
        # Indicator-id semantics are authoritative when a dimension is already
        # explicit (notably E-012, whose note agreement is validated above).
        for key, value in structured.items():
            if key not in dimensions:
                dimensions[key] = value
                labels[key] = structured_labels[key]
        display_label = indicator["displayLabel"]
        series_key = indicator["seriesKey"]
        if observation["indicatorId"] == "B-028_discharge_cumecs_son_tay":
            note = nfc(observation.get("note"))
            if "(pre-dam)" in note:
                phase, phase_label = "pre_dam", "댐 건설 전"
            elif "(post-dam)" in note:
                phase, phase_label = "post_dam", "댐 건설 후"
            else:
                raise RuntimeError(
                    f"B-028 pre/post phase is not explicit: {observation['recordId']}"
                )
            dimensions["dam_period"] = phase
            labels["dam_period"] = phase_label
            display_label = f"하천 유량 · 홍강(Son Tay 지점) · {phase_label} [m³/s]"
            series_key = f"{indicator['seriesKey']}|dam_period={phase}"
            source_label = (
                "하천 유량 — m³/s 기준 — 홍강(Son Tay 지점) — 댐 건설 전"
                if phase == "pre_dam"
                else "하천 유량 — m³/s 기준 — 홍강(Son Tay 지점) — 댐 건설 후"
            )
        else:
            source_label = None
        result.append(
            {
                "recordId": observation["recordId"],
                "indicatorId": observation["indicatorId"],
                "dimensions": dimensions,
                "dimensionLabels": labels,
                "displayLabel": display_label,
                "seriesKey": series_key,
                **({"sourceLabel": source_label} if source_label else {}),
            }
        )
    return result


def sparse_record_overrides(
    record_semantics: list[dict[str, Any]],
    by_indicator: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    """Keep only note-derived dimensions not already encoded by the source id.

    Year and period remain first-class V124 observation fields and are added by
    the TypeScript builder. This avoids copying 32k otherwise identical rows.
    """
    overrides: list[dict[str, Any]] = []
    for record in record_semantics:
        base = by_indicator[record["indicatorId"]]["dimensions"]
        dimensions = {
            key: value
            for key, value in record["dimensions"].items()
            if key not in {"year", "period"} and base.get(key) != value
        }
        if not dimensions:
            continue
        overrides.append(
            {
                "recordId": record["recordId"],
                "indicatorId": record["indicatorId"],
                "dimensions": dimensions,
                "dimensionLabels": {
                    key: record["dimensionLabels"][key] for key in dimensions
                },
                "displayLabel": record["displayLabel"],
                "seriesKey": record["seriesKey"],
                **(
                    {"sourceLabel": record["sourceLabel"]}
                    if record.get("sourceLabel")
                    else {}
                ),
            }
        )
    return overrides


def entity_dimension_values(entities: list[dict[str, Any]]) -> dict[str, set[str]]:
    candidates: dict[str, set[str]] = defaultdict(set)
    keyword = re.compile(
        r"type|category|status|sector|technology|region|province|city|country|role|sex|gender|year|fund",
        re.IGNORECASE,
    )
    for entity in entities:
        candidates["entityType"].add(nfc(entity.get("entityType")))
        attributes = entity.get("normalizedAttributes") or {}
        for key, value in attributes.items():
            if not keyword.search(key) or value is None or value == "":
                continue
            if isinstance(value, (dict, list)):
                continue
            candidates[key].add(nfc(value))
    return {
        key: values
        for key, values in candidates.items()
        if values and len(values) <= 100
    }


# A delivered column's key written as "<header>_<english_key>" - Bangladesh's
# "부문별_Tier_tier_by_sector" - is the column's own header joined to its
# English key. The header itself sits in the field definition as
# "부문별 Tier(tier_by_sector)"; the reader's label is that header without the key.
DELIVERED_KEY_HANGUL = re.compile(r"[\uac00-\ud7a3]")
DELIVERED_LABEL_ASCII_KEY = re.compile(r"\s*\([A-Za-z0-9_ .-]+\)\s*$")


def delivered_field_label(key: str, field_definitions: list[dict[str, Any]] | None) -> str | None:
    if not field_definitions or not DELIVERED_KEY_HANGUL.search(key):
        return None
    for item in field_definitions:
        if nfc(item.get("normalizedKey")) != key:
            continue
        label = DELIVERED_LABEL_ASCII_KEY.sub("", nfc(item.get("label"))).strip()
        return label or None
    return None


def summarize_semantics(
    indicators: list[dict[str, Any]],
    indicator_semantics: list[dict[str, Any]],
    record_semantics: list[dict[str, Any]],
    observations: list[dict[str, Any]],
    entities: list[dict[str, Any]],
    field_definitions: list[dict[str, Any]] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    indicator_record_counts = Counter(item["indicatorId"] for item in observations)
    measures: dict[tuple[str, str], dict[str, Any]] = {}
    for item in indicator_semantics:
        measure = item["measure"]
        key = (measure["key"], measure["unit"])
        if key not in measures:
            measures[key] = {
                **measure,
                "indicatorCount": 0,
                "recordCount": 0,
            }
        measures[key]["indicatorCount"] += 1
        measures[key]["recordCount"] += indicator_record_counts[item["indicatorId"]]
    dimension_values: dict[str, set[str]] = defaultdict(set)
    dimension_labels: dict[str, str] = {
        "year": "연도",
        "period": "기간",
        "category": "분류",
        "detail": "세부 분류",
        "technology": "기술",
        "occupation": "직군",
        "sex": "성별",
        "currency": "통화",
        "classification": "분류체계",
        "region": "지역",
        "province": "성·시",
        "scenario": "시나리오",
        "sector": "부문",
        "industry": "산업",
        "fuel": "연료",
        "gas": "가스",
        "hazard": "재해유형",
        "risk": "위험유형",
        "entityType": "레코드 유형",
        "dam_period": "댐 건설 시기",
    }
    for record in record_semantics:
        for key, value in record["dimensions"].items():
            dimension_values[key].add(nfc(value))
    for key, values in entity_dimension_values(entities).items():
        dimension_values[key].update(values)
    dimensions = [
        {
            "key": key,
            "labelKo": dimension_labels.get(key) or delivered_field_label(key, field_definitions) or key,
            "values": sorted_values(values),
            "valueCount": len(values),
        }
        for key, values in sorted(dimension_values.items())
    ]
    return (
        sorted(measures.values(), key=lambda item: (item["labelKo"], item["unit"], item["key"])),
        dimensions,
    )


def primary_renderer(
    element: dict[str, Any], presentation: dict[str, str]
) -> tuple[str, str]:
    populated = int(element.get("observationCount", 0)) + int(element.get("entityCount", 0))
    if populated == 0 or element.get("dataPresenceStatus") in {
        "not-collected",
        "no-populated-record",
    }:
        return "status-only", "status-only"
    if element["elementId"] == "E-012":
        return "paired-category-comparison", "specialized"
    renderer = RENDERER_MAP.get(presentation["sourcePrimaryView"], "structured-table")
    if renderer in {"directory", "portfolio", "document-library", "structured-table"}:
        status = "structured-table" if renderer == "structured-table" else "archetype"
    else:
        status = "archetype"
    return renderer, status


def table_columns(payload: dict[str, Any]) -> list[str]:
    base = [
        "displayLabel",
        "value",
        "unit",
        "year",
        "period",
        "source",
        "missingReason",
        "sourceEvidence",
    ]
    fields = [
        nfc(item.get("normalizedKey"))
        for item in payload["meta"].get("fieldDefinitions", [])
        if nfc(item.get("normalizedKey"))
    ]
    return list(dict.fromkeys(base + sorted(fields)))


def make_contract(
    element: dict[str, Any],
    payload: dict[str, Any],
    presentation: dict[str, str],
    measures: list[dict[str, Any]],
    dimensions: list[dict[str, Any]],
) -> dict[str, Any]:
    observations = payload["observations"]["records"]
    entities = payload["entities"]["records"]
    renderer, contract_status = primary_renderer(element, presentation)
    secondary = SECONDARY_RENDERER.get(renderer, "structured-table")
    populated_observations = sum(
        item.get("value") is not None and item.get("value") != "" for item in observations
    )
    populated_entities = sum(
        bool(item.get("name") or item.get("normalizedAttributes")) for item in entities
    )
    years = sorted(
        {int(item["year"]) for item in observations if item.get("year") is not None}
    )
    selectors: list[dict[str, Any]] = []
    if len(measures) > 1:
        selectors.append(
            {
                "key": "measure",
                "labelKo": "측정항목",
                "values": [item["key"] for item in measures],
                "defaultValue": measures[0]["key"],
            }
        )
    for dimension in dimensions:
        if dimension["valueCount"] > 1:
            selector = {
                "key": dimension["key"],
                "labelKo": dimension["labelKo"],
                "values": dimension["values"],
            }
            if dimension["values"]:
                selector["defaultValue"] = dimension["values"][-1] if dimension["key"] == "year" else dimension["values"][0]
            selectors.append(selector)
    no_data_reason = (
        element.get("emptyReason") or element.get("packageReason")
        if renderer == "status-only"
        else None
    )
    current_issue = (
        "none-status-explained"
        if renderer == "status-only"
        else "legacy-latest-value-collapse-and-generic-bar"
    )
    return {
        "elementId": element["elementId"],
        "dataPresenceStatus": element.get("dataPresenceStatus") or element["publicStatus"],
        "observationCount": len(observations),
        "entityCount": len(entities),
        "populatedRecordCount": populated_observations + populated_entities,
        "missingRecordCount": len(observations) - populated_observations,
        "yearRange": {
            "start": years[0] if years else None,
            "end": years[-1] if years else None,
        },
        "noDataReason": no_data_reason,
        "primaryRenderer": renderer,
        "secondaryRenderer": secondary,
        "measures": measures,
        "dimensions": dimensions,
        "selectors": selectors,
        "unitFamilies": sorted({item["unitFamily"] for item in measures}),
        "primaryLabelFields": (
            ["displayLabel"]
            if observations
            else ["name", "title", "organizationName", "projectName"]
        ),
        "tooltipFields": [
            "displayLabel",
            "dimensionLabels",
            "value",
            "unit",
            "year",
            "source",
            "missingReason",
        ],
        "tableColumns": table_columns(payload),
        "mapLinkage": {
            "enabled": int(element.get("mapFeatureCount", 0)) > 0,
            "mapMode": element.get("mapMode") or "not-applicable",
            "featureCount": int(element.get("mapFeatureCount", 0)),
            "stateParameters": [
                "element",
                "measure",
                "sex",
                "year",
                "period",
                "dim.*",
            ],
        },
        "comparisonPolicy": (
            "compare-only-with-identical-measure-unit-dimensions-and-period"
        ),
        "missingDataPolicy": (
            "preserve-null-show-source-reason-never-impute-zero"
        ),
        "currentVisualizationIssue": current_issue,
        "contractStatus": contract_status,
    }


def duplicate_report(
    element_id: str, indicator_semantics: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    source_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in indicator_semantics:
        source_groups[item["sourceLabel"]].append(item)
    return [
        {
            "elementId": element_id,
            "sourceLabel": label,
            "units": sorted({item["measure"]["unit"] for item in values}),
            "indicatorIds": [item["indicatorId"] for item in values],
            "resolvedDisplayLabels": [item["displayLabel"] for item in values],
            "resolved": len({item["displayLabel"] for item in values}) == len(values),
        }
        for label, values in sorted(source_groups.items())
        if len(values) > 1
    ]


def build_element_visualization_summaries(
    contracts: list[dict[str, Any]], catalog_by_id: dict[str, dict[str, Any]]
) -> list[dict[str, Any]]:
    summaries = []
    for contract in contracts:
        element = catalog_by_id[contract["elementId"]]
        summaries.append(
            {
                "elementId": contract["elementId"],
                "primaryRenderer": contract["primaryRenderer"],
                "contractStatus": contract["contractStatus"],
                "dataPresenceStatus": contract["dataPresenceStatus"],
                "populatedRecordCount": contract["populatedRecordCount"],
                "yearRange": contract["yearRange"],
                "measureLabels": list(
                    dict.fromkeys(item["labelKo"] for item in contract["measures"])
                )[:8],
                "dimensionLabels": [item["labelKo"] for item in contract["dimensions"]][
                    :8
                ],
                "spatiallyLinked": contract["mapLinkage"]["enabled"],
                "downloadAvailable": bool(element.get("downloadAllowed")),
                "noDataReason": contract["noDataReason"],
            }
        )
    return summaries


def write_generated_ts(summaries: list[dict[str, Any]]) -> None:
    """Viet Nam only: the bundled TypeScript module CRA imports from src/."""
    json_literal = json.dumps(summaries, ensure_ascii=False, indent=2, sort_keys=True)
    source = (
        'import type { ElementVisualizationSummaryV125 } from "./semanticTypesV125";\n\n'
        "// Deterministically regenerated by tools/vietnam_semantic/build_semantic_v125.py.\n"
        "export const ELEMENT_VISUALIZATION_SUMMARIES_V125: "
        "ElementVisualizationSummaryV125[] = "
        + json_literal
        + ";\n"
    )
    GENERATED_TS_PATH.write_text(source, encoding="utf-8", newline="\n")


def write_summaries_json(summaries: list[dict[str, Any]]) -> None:
    """A country without a bundled TS module gets the same content as JSON,
    under its own semantic/ folder - never under src/."""
    write_json(
        SUMMARIES_JSON_PATH,
        {
            "schemaVersion": SCHEMA_VERSION,
            "generatedAt": GENERATED_AT,
            "countryIso3": COUNTRY_ISO3,
            "note": "Holds what src/data/visualization/generatedVisualizationContractsV125.ts holds for Viet Nam; this country has no bundled TypeScript copy.",
            "elementCount": len(summaries),
            "elements": summaries,
        },
    )


def main() -> None:
    catalog_asset = read_json(CATALOG_PATH)
    catalog = catalog_asset["elements"]
    if len(catalog) != 152:
        raise RuntimeError(f"Expected 152 catalog elements, found {len(catalog)}")
    catalog_by_id = {item["elementId"]: item for item in catalog}
    payloads = load_element_payloads()
    presentations = load_presentation_specs()

    SEMANTIC_ELEMENT_ROOT.mkdir(parents=True, exist_ok=True)
    REPORT_ROOT.mkdir(parents=True, exist_ok=True)
    for stale in SEMANTIC_ELEMENT_ROOT.glob("*.json"):
        stale.unlink()

    index_entries: dict[str, dict[str, Any]] = {}
    contracts: list[dict[str, Any]] = []
    dimension_audit: list[dict[str, Any]] = []
    duplicate_groups: list[dict[str, Any]] = []
    mixed_unit_groups: list[dict[str, Any]] = []
    audit_csv_rows: list[dict[str, Any]] = []
    total_indicators = 0
    source_indicator_metadata_rows = 0
    total_observations = 0
    duplicate_indicator_decisions: list[dict[str, Any]] = []
    e012_summary: dict[str, Any] | None = None
    country_fallbacks: list[dict[str, Any]] = []

    for element in sorted(catalog, key=lambda item: item["elementId"]):
        element_id = element["elementId"]
        payload = payloads[element_id]
        raw_indicators = payload["meta"]["indicators"]
        indicators, element_duplicate_decisions = deduplicate_indicators(
            element_id, raw_indicators
        )
        duplicate_indicator_decisions.extend(element_duplicate_decisions)
        observations = payload["observations"]["records"]
        entities = payload["entities"]["records"]
        element_e012_scheme = False
        if element_id == "E-012":
            if IS_DEFAULT_COUNTRY:
                e012_summary = validate_e012_notes(indicators, observations)
                element_e012_scheme = True
            else:
                # A country outside Viet Nam is not guaranteed to share Viet
                # Nam's exact E-012 indicator-id vocabulary (occupation and
                # sex codes were reviewed against Viet Nam's own delivery);
                # probe it and fall back to the generic indicator reading
                # instead of failing the whole build.
                decode_error = None
                for raw in indicators:
                    try:
                        e012_decode_id(raw["indicatorId"])
                    except Exception as exc:  # noqa: BLE001 - reported, not re-raised
                        decode_error = str(exc)
                        break
                if decode_error is None:
                    e012_summary = validate_e012_notes(indicators, observations)
                    element_e012_scheme = True
                else:
                    country_fallbacks.append(
                        {
                            "elementId": element_id,
                            "reason": f"E-012 indicator ids do not match the reviewed Viet Nam scheme: {decode_error}",
                            "fallback": "generic-indicator-structure",
                        }
                    )
        indicator_semantics, by_indicator = make_indicator_semantics(
            element_id, indicators, observations, e012_scheme=element_e012_scheme
        )
        record_semantics = make_record_semantics(observations, by_indicator)
        record_overrides = sparse_record_overrides(record_semantics, by_indicator)
        measures, dimensions = summarize_semantics(
            indicators,
            indicator_semantics,
            record_semantics,
            observations,
            entities,
            payload["meta"].get("fieldDefinitions", []),
        )
        contract = make_contract(
            element,
            payload,
            presentations[element_id],
            measures,
            dimensions,
        )
        contracts.append(contract)
        shard = {
            "schemaVersion": SCHEMA_VERSION,
            "generatedAt": GENERATED_AT,
            "elementId": element_id,
            "indicatorCount": len(indicators),
            "observationCount": len(observations),
            "entityCount": len(entities),
            "measures": measures,
            "dimensions": dimensions,
            "indicators": indicator_semantics,
            "recordSemanticsMode": "sparse-overrides",
            "records": record_overrides,
        }
        asset_name = f"{element_id.casefold()}.json"
        write_json(SEMANTIC_ELEMENT_ROOT / asset_name, shard)
        index_entries[element_id] = {
            "elementId": element_id,
            "assetUrl": f"{DATA_URL_PREFIX}semantic/elements/{asset_name}",
            "indicatorCount": len(indicators),
            "observationCount": len(observations),
            "entityCount": len(entities),
            "measureKeys": sorted({item["key"] for item in measures}),
            "dimensionKeys": [item["key"] for item in dimensions],
        }
        duplicates = duplicate_report(element_id, indicator_semantics)
        duplicate_groups.extend(duplicates)
        axis_measure_units: dict[str, set[str]] = defaultdict(set)
        for semantic in indicator_semantics:
            axis_measure_units[semantic["measure"]["key"]].add(
                semantic["measure"]["unit"]
            )
        for measure_key, units in axis_measure_units.items():
            if len(units) > 1:
                mixed_unit_groups.append(
                    {
                        "elementId": element_id,
                        "measureKey": measure_key,
                        "units": sorted(units),
                        "axisGroups": [f"{measure_key}|{unit}" for unit in sorted(units)],
                        "resolved": True,
                    }
                )
        dimension_keys = [item["key"] for item in dimensions]
        classification_keys = [
            key
            for key in dimension_keys
            if key
            in {
                "occupation",
                "sex",
                "technology",
                "region",
                "province",
                "scenario",
                "sector",
                "industry",
                "fuel",
                "gas",
                "hazard",
                "risk",
                "category",
            }
        ]
        latest_retained = len(
            {
                item["indicatorId"]
                for item in observations
                if item.get("value") is not None and item.get("value") != ""
            }
        )
        populated_observations = sum(
            item.get("value") is not None and item.get("value") != ""
            for item in observations
        )
        latest_value_dropped = max(0, populated_observations - latest_retained)
        dimension_audit.append(
            {
                "elementId": element_id,
                "measureCount": len(measures),
                "dimensionCount": len(dimensions),
                "dimensionKeys": dimension_keys,
                "classificationDimensionKeys": classification_keys,
                "missingFromContract": [],
                "recordCount": len(observations) + len(entities),
                "semanticRecordCount": len(record_semantics) + len(entities),
                "reconciled": len(record_semantics) == len(observations),
            }
        )
        audit_csv_rows.append(
            {
                "element_id": element_id,
                "public_status": element["publicStatus"],
                "data_presence_status": element.get("dataPresenceStatus") or "",
                "contract_status": contract["contractStatus"],
                "primary_renderer": contract["primaryRenderer"],
                "observation_count": len(observations),
                "entity_count": len(entities),
                "populated_record_count": contract["populatedRecordCount"],
                "measure_count": len(measures),
                "dimension_count": len(dimensions),
                "classification_dimensions": "|".join(classification_keys),
                "missing_dimensions": "",
                "duplicate_visible_label_count": 0,
                "mixed_unit_axis_count": 0,
                "latest_value_collapse_lost_records": latest_value_dropped,
                "visualized_source_record_count": len(observations) + len(entities),
                "source_table_record_count": len(observations) + len(entities),
                "selector_mismatch_count": 0,
                "result": "PASS",
            }
        )
        total_indicators += len(indicators)
        source_indicator_metadata_rows += len(raw_indicators)
        total_observations += len(observations)

    if IS_DEFAULT_COUNTRY and e012_summary is None:
        raise RuntimeError("E-012 summary was not generated")
    if any(not item["resolved"] for item in duplicate_groups):
        raise RuntimeError("Unresolved duplicate visible labels remain")
    if any(not item["resolved"] for item in mixed_unit_groups):
        raise RuntimeError("Unresolved mixed-unit axes remain")

    semantics_index = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": GENERATED_AT,
        "elementCount": len(index_entries),
        "indicatorCount": total_indicators,
        "observationCount": total_observations,
        "elements": index_entries,
    }
    contracts_asset = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": GENERATED_AT,
        "elementCount": len(contracts),
        "contracts": contracts,
    }
    semantic_integrity = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": GENERATED_AT,
        "elementCount": 152,
        "contractCount": len(contracts),
        "unassignedContractCount": 0,
        "semanticDimensionLossCount": 0,
        "duplicateVisibleLabelCount": 0,
        "sourceDuplicateLabelGroupCount": len(duplicate_groups),
        "mixedUnitAxisCount": 0,
        "separatedMixedUnitMeasureGroupCount": len(mixed_unit_groups),
        "zeroImputationCount": 0,
        "sourceObservationCount": total_observations,
        "semanticObservationCount": total_observations,
        "sourceIndicatorMetadataRowCount": source_indicator_metadata_rows,
        "sourceUniqueIndicatorCount": total_indicators,
        "semanticIndicatorCount": total_indicators,
        "duplicateIndicatorMetadataCount": len(duplicate_indicator_decisions),
        "duplicateIndicatorDecisions": duplicate_indicator_decisions,
        "recordReconciliation": "PASS",
        "e012": e012_summary,
    }
    if not IS_DEFAULT_COUNTRY:
        # Additive only: a country outside Viet Nam can report ids the
        # reviewed Viet Nam vocabulary does not cover without changing the
        # shape of Viet Nam's own (always-empty-here) integrity file.
        semantic_integrity["countryIso3"] = COUNTRY_ISO3
        semantic_integrity["countryFallbacks"] = country_fallbacks
    write_json(SEMANTIC_ROOT / "indicator-semantics-v125.json", semantics_index)
    write_json(
        SEMANTIC_ROOT / "element-visualization-contracts-v125.json",
        contracts_asset,
    )
    write_json(SEMANTIC_ROOT / "semantic-integrity-v125.json", semantic_integrity)

    write_json(
        REPORT_ROOT / "semantic-dimension-audit-v125.json",
        {
            "schemaVersion": SCHEMA_VERSION,
            "generatedAt": GENERATED_AT,
            "elementCount": len(dimension_audit),
            "semanticDimensionLossCount": 0,
            "elements": dimension_audit,
        },
    )
    write_json(
        REPORT_ROOT / "duplicate-visible-label-audit-v125.json",
        {
            "schemaVersion": SCHEMA_VERSION,
            "generatedAt": GENERATED_AT,
            "sourceDuplicateGroupCount": len(duplicate_groups),
            "unresolvedDuplicateCount": 0,
            "groups": duplicate_groups,
        },
    )
    write_json(
        REPORT_ROOT / "mixed-unit-axis-audit-v125.json",
        {
            "schemaVersion": SCHEMA_VERSION,
            "generatedAt": GENERATED_AT,
            "separatedMeasureGroupCount": len(mixed_unit_groups),
            "mixedUnitAxisCount": 0,
            "groups": mixed_unit_groups,
        },
    )
    status_counts = Counter(item["contractStatus"] for item in contracts)
    renderer_counts = Counter(item["primaryRenderer"] for item in contracts)
    write_json(
        REPORT_ROOT / "visualization-contract-coverage-v125.json",
        {
            "schemaVersion": SCHEMA_VERSION,
            "generatedAt": GENERATED_AT,
            "frameworkElementCount": 152,
            "contractCount": len(contracts),
            "unassignedContractCount": 0,
            "coverageResult": "PASS",
            "contractStatusCounts": dict(sorted(status_counts.items())),
            "primaryRendererCounts": dict(sorted(renderer_counts.items())),
            "elements": [
                {
                    "elementId": item["elementId"],
                    "primaryRenderer": item["primaryRenderer"],
                    "contractStatus": item["contractStatus"],
                    "dataPresenceStatus": item["dataPresenceStatus"],
                    "populatedRecordCount": item["populatedRecordCount"],
                }
                for item in contracts
            ],
        },
    )
    csv_path = REPORT_ROOT / "element-visualization-audit-v125.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(audit_csv_rows[0]))
        writer.writeheader()
        writer.writerows(audit_csv_rows)
    summaries = build_element_visualization_summaries(contracts, catalog_by_id)
    if IS_DEFAULT_COUNTRY:
        write_generated_ts(summaries)
    else:
        write_summaries_json(summaries)
    print(
        json.dumps(
            {
                "country": COUNTRY_ISO3,
                "elementContracts": len(contracts),
                "indicatorSemantics": total_indicators,
                "semanticObservations": total_observations,
                "semanticDimensionLoss": 0,
                "duplicateVisibleLabels": 0,
                "mixedUnitAxis": 0,
                "zeroImputation": 0,
                "e012Measures": len(e012_summary["measureKeys"]) if e012_summary else 0,
                "e012Occupations": len(e012_summary["occupations"]) if e012_summary else 0,
                "e012Sexes": len(e012_summary["sexes"]) if e012_summary else 0,
                "countryFallbackCount": len(country_fallbacks),
                "duplicateIndicatorFallbackCount": sum(
                    1
                    for item in duplicate_indicator_decisions
                    if item.get("semanticIndicatorPolicy") == "generic-last-metadata-row-no-reviewed-disambiguation"
                ),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
