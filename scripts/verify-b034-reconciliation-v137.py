#!/usr/bin/env python3
"""Independent reconciliation for the B-034 entity derivation.

Expected values are read straight out of the workbook cells here, with this
file's own header handling - it does not import the derivation or the pipeline's
workbook parser. If both sides shared a code path, agreement would only prove
the code agrees with itself.

Negative controls run against a temporary copy of the workbook. The delivery is
never written to.
"""

from __future__ import annotations

import json
import pathlib
import shutil
import sys
import tempfile

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tools.vietnam_etl.b034_facts_v137 import derive_b034_facts  # noqa: E402
from tools.vietnam_etl.workbook_parser import parse_workbook_bytes  # noqa: E402

WORKBOOK = ROOT / "베트남데이터" / "file" / "B-034.xlsx"
ALIASES = ROOT / "public/data/vietnam/v2/geometry/vnm-adm1-aliases.json"
BOUNDARY = ROOT / "public/data/vietnam/v2/geometry/vnm-adm1-63.geojson"
OUT = ROOT / "reports/final-data-integration"

# Bound to the printed label, matching the derivation's contract but read here
# from the sheet independently.
MEASURE_BY_LABEL = {
    "지상부 탄소저장량(Mg C)": ("b034-agb-carbon-stock", "Mg C", 2000, 2000),
    "지상부 탄소밀도(Mg C/ha)": ("b034-agb-carbon-density", "Mg C/ha", 2000, 2000),
    "산림탄소 총배출(Mg CO2e/yr)": ("b034-forest-carbon-gross-emissions", "Mg CO2e/yr", 2001, 2024),
    "산림탄소 총흡수(Mg CO2/yr)": ("b034-forest-carbon-gross-removals", "Mg CO2/yr", 2001, 2024),
    "산림탄소 순플럭스(Mg CO2e/yr)": ("b034-forest-carbon-net-flux", "Mg CO2e/yr", 2001, 2024),
}


def read_expected(path: pathlib.Path) -> dict[tuple[str, str], dict]:
    """Read province rows straight from the cells, keyed by GADM id + measure."""
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook["1.2_entity(레코드형)"]
    rows = list(sheet.iter_rows(values_only=True))
    workbook.close()

    field_row, label_row = rows[1], rows[2]
    columns = {}
    for index, (field, label) in enumerate(zip(field_row, label_row)):
        columns[str(label).strip() if label else ""] = index
        columns.setdefault(str(field).strip() if field else "", index)

    indicator_col = columns.get("구분자", 2)
    key_col = columns["레코드 키"]
    expected: dict[tuple[str, str], dict] = {}
    for row_index, row in enumerate(rows[3:], start=4):
        if not row or not row[0]:
            continue
        if not str(row[indicator_col] or "").endswith("_adm1"):
            continue
        gadm = str(row[key_col] or "").strip()
        for label, (measure_id, unit, start, end) in MEASURE_BY_LABEL.items():
            column = columns.get(label)
            if column is None:
                continue
            raw = row[column]
            if raw is None or str(raw).strip() == "":
                continue
            expected[(gadm, measure_id)] = {
                "value": float(raw),
                "unit": unit,
                "periodStart": start,
                "periodEnd": end,
                "sourceRow": row_index,
            }
    return expected


def derive(path: pathlib.Path) -> list[dict]:
    workbook = parse_workbook_bytes(path.read_bytes(), path.name, include_records=True)
    workbook["sourcePackage"] = "베트남데이터/file"
    aliases = json.loads(ALIASES.read_text(encoding="utf-8"))
    return derive_b034_facts(workbook, aliases)["facts"]


def reconcile(expected: dict, facts: list[dict]) -> dict:
    derived = {}
    duplicates = []
    for fact in facts:
        key = (fact["sourceRegionKey"], fact["measureId"])
        if key in derived:
            duplicates.append(key)
        derived[key] = fact

    unaccounted = sorted(set(expected) - set(derived))
    orphans = sorted(set(derived) - set(expected))
    mismatches = []
    for key in sorted(set(expected) & set(derived)):
        want, got = expected[key], derived[key]
        if float(got["value"]) != want["value"]:
            mismatches.append({"key": key, "field": "value", "expected": want["value"], "got": got["value"]})
        if got["unit"] != want["unit"]:
            mismatches.append({"key": key, "field": "unit", "expected": want["unit"], "got": got["unit"]})
        if got["periodStart"] != want["periodStart"] or got["periodEnd"] != want["periodEnd"]:
            mismatches.append({
                "key": key, "field": "period",
                "expected": [want["periodStart"], want["periodEnd"]],
                "got": [got["periodStart"], got["periodEnd"]],
            })
        if (float(got["value"]) < 0) != (want["value"] < 0):
            mismatches.append({"key": key, "field": "sign"})
        if int(got["provenance"]["sourceRow"]) != want["sourceRow"]:
            mismatches.append({"key": key, "field": "sourceRow",
                               "expected": want["sourceRow"], "got": got["provenance"]["sourceRow"]})
    return {
        "expectedCellCount": len(expected),
        "derivedFactCount": len(derived),
        "unaccountedSourceCells": unaccounted,
        "orphanDerivedFacts": orphans,
        "duplicateKeys": duplicates,
        "mismatches": mismatches,
        "pass": not (unaccounted or orphans or duplicates or mismatches),
    }


def check_geography(facts: list[dict]) -> dict:
    boundary = json.loads(BOUNDARY.read_text(encoding="utf-8"))
    codes = {f["properties"]["adm1Code"] for f in boundary["features"]}
    with_geometry = {
        f["properties"]["adm1Code"]
        for f in boundary["features"]
        if f.get("geometry") and f["geometry"].get("coordinates")
    }
    joined = {fact.get("adm1Code") for fact in facts if fact.get("adm1Code")}
    gadm_to_code: dict[str, set] = {}
    for fact in facts:
        gadm_to_code.setdefault(fact["sourceRegionKey"], set()).add(fact.get("adm1Code"))
    ambiguous = {k: sorted(v) for k, v in gadm_to_code.items() if len(v) != 1}
    code_to_gadm: dict[str, set] = {}
    for gadm, codes_for in gadm_to_code.items():
        code_to_gadm.setdefault(next(iter(codes_for)), set()).add(gadm)
    collisions = {k: sorted(v) for k, v in code_to_gadm.items() if len(v) != 1}
    return {
        "boundaryFeatureCount": len(boundary["features"]),
        "boundarySystem": boundary["features"][0]["properties"].get("boundarySystem"),
        "featuresWithGeometry": len(with_geometry),
        "joinedRegionCount": len(joined),
        "unjoinedFacts": sum(1 for fact in facts if not fact.get("adm1Code")),
        "codesMissingFromBoundary": sorted(joined - codes),
        "gadmKeysMappingToSeveralCodes": ambiguous,
        "codesClaimedBySeveralGadmKeys": collisions,
        "pass": bool(joined) and not (joined - codes) and not ambiguous and not collisions,
    }


# Two kinds of control. A corruption of the data must be caught; a harmless
# restructuring of the sheet must leave the output identical. Treating the
# second kind as "must fail" would reward a derivation that reads by column
# position, which is exactly what must not happen.
DETECT_CASES = (
    ("value removed", "clear_one_value"),
    ("sign flipped", "flip_sign"),
    ("unit changed", "change_unit"),
    ("region key swapped", "swap_region"),
    ("observation duplicated", "duplicate_row"),
    ("middle column removed", "drop_middle_column"),
)
INVARIANT_CASES = (
    ("column order changed", "swap_columns"),
    ("기준연도 column overwritten with 2000", "collapse_period"),
)


def mutate(path: pathlib.Path, case: str) -> None:
    workbook = openpyxl.load_workbook(path)
    sheet = workbook["1.2_entity(레코드형)"]
    labels = {str(c.value).strip(): c.column for c in sheet[3] if c.value}
    net = labels["산림탄소 순플럭스(Mg CO2e/yr)"]
    key = labels["레코드 키"]
    if case == "clear_one_value":
        sheet.cell(row=4, column=net).value = None
    elif case == "flip_sign":
        cell = sheet.cell(row=4, column=net)
        cell.value = -float(cell.value)
    elif case == "change_unit":
        sheet.cell(row=3, column=net).value = "산림탄소 순플럭스(Mg C/yr)"
    elif case == "collapse_period":
        # The derivation must not take its period from this column.
        for row in range(4, 67):
            sheet.cell(row=row, column=labels["기준연도"]).value = 2000
    elif case == "swap_region":
        sheet.cell(row=4, column=key).value = "VNM.63_1"
    elif case == "duplicate_row":
        values = [c.value for c in sheet[4]]
        sheet.insert_rows(5)
        for index, value in enumerate(values, start=1):
            sheet.cell(row=5, column=index).value = value
    elif case == "swap_columns":
        emissions = labels["산림탄소 총배출(Mg CO2e/yr)"]
        for row in range(3, 67):
            a, b = sheet.cell(row=row, column=net), sheet.cell(row=row, column=emissions)
            a.value, b.value = b.value, a.value
    elif case == "drop_middle_column":
        sheet.delete_cols(labels["산림탄소 총흡수(Mg CO2/yr)"])
    workbook.save(path)


def _outcome(tmp: pathlib.Path, case: str, baseline_expected: dict) -> tuple[bool, str]:
    copy = tmp / f"{case}.xlsx"
    shutil.copy2(WORKBOOK, copy)
    mutate(copy, case)
    try:
        facts = derive(copy)
        outcome = reconcile(baseline_expected, facts)
        return (
            not outcome["pass"],
            f"unaccounted={len(outcome['unaccountedSourceCells'])} "
            f"orphan={len(outcome['orphanDerivedFacts'])} "
            f"dup={len(outcome['duplicateKeys'])} "
            f"mismatch={len(outcome['mismatches'])}",
        )
    except Exception as error:  # a raised error is also a detection
        return True, f"{type(error).__name__}: {error}"


def run_negative(tmp: pathlib.Path) -> list[dict]:
    baseline_expected = read_expected(WORKBOOK)
    results = []
    for name, case in DETECT_CASES:
        changed, detail = _outcome(tmp, case, baseline_expected)
        results.append({"case": name, "kind": "detect", "ok": changed, "detail": detail})
    for name, case in INVARIANT_CASES:
        changed, detail = _outcome(tmp, case, baseline_expected)
        results.append({"case": name, "kind": "invariant", "ok": not changed, "detail": detail})

    # Contract-level control: if the derivation dated the flux measures to the
    # element's reference_year instead of the period the sheet's note states,
    # the independent expectation must catch it.
    from tools.vietnam_etl import b034_facts_v137 as module

    original = module.PROVINCE_MEASURE_CONTRACT
    module.PROVINCE_MEASURE_CONTRACT = tuple(
        {**item, "periodStart": 2000, "periodEnd": 2000}
        if item["statisticType"] == "annual-mean"
        else item
        for item in original
    )
    try:
        outcome = reconcile(baseline_expected, derive(WORKBOOK))
        results.append({
            "case": "flux period wrongly set to 2000 in the contract",
            "kind": "detect",
            "ok": not outcome["pass"],
            "detail": f"mismatch={len(outcome['mismatches'])}",
        })
    finally:
        module.PROVINCE_MEASURE_CONTRACT = original
    return results


def main() -> int:
    expected = read_expected(WORKBOOK)
    facts = derive(WORKBOOK)
    result = reconcile(expected, facts)
    geography = check_geography(facts)
    with tempfile.TemporaryDirectory() as tmpdir:
        negatives = run_negative(pathlib.Path(tmpdir))

    report = {
        "workbook": "베트남데이터/file/B-034.xlsx",
        "reconciliation": result,
        "geography": geography,
        "negativeControls": negatives,
        "negativeControlsAllOk": all(item["ok"] for item in negatives),
        "pass": result["pass"] and geography["pass"] and all(i["ok"] for i in negatives),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "b034-reconciliation-v137.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2)[:2600])
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
