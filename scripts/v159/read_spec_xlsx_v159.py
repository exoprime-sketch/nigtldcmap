"""Dump the V159 framework workbook sheets as raw JSON rows.

Reads only; no value is rewritten. The Node importer
(`import-dataset-spec-v159.mjs`) owns every transformation rule so the
rules live in one reviewable place.
"""
from __future__ import annotations

import datetime as _dt
import json
import sys
import warnings

import openpyxl

SHEETS = {
    "spec": "▲데이터_명세서_260907",
    "useCases": "▲활용사례_260922",
    "framework": "▲Framework_260907",
    "matrix": "▲국가별_충족매트릭스_260907",
}


def _cell(value):
    if isinstance(value, (_dt.datetime, _dt.date)):
        return value.strftime("%Y-%m-%d")
    return value


def main() -> None:
    path = sys.argv[1]
    warnings.filterwarnings("ignore", category=UserWarning)
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    out = {}
    for key, title in SHEETS.items():
        if title not in wb.sheetnames:
            raise SystemExit(f"sheet missing: {title}")
        out[key] = [[_cell(v) for v in row] for row in wb[title].iter_rows(values_only=True)]
    sys.stdout.reconfigure(encoding="utf-8")
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
