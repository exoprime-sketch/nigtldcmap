"""V162: decide which file to adopt when one delivery holds several workbooks for
the same element code (user rule, 2026-09-30).

Rule, applied in order:
1. A `_C-012추가` file that adds C-012 rows over the others is adopted first.
2. A file whose data rows include every other file's rows (cell by cell) is adopted.
3. Otherwise the file with the most records is adopted.
The files not adopted are 'superseded'. Where the same record (same key)
carries different values across files, the adopted file's values are used and
the difference is listed as a conflict.

Data rows are the rows of the '1.1' (observation) and '1.2' (entity) sheets
from row 4 on, whose first cell is an element code. Cells are compared as
trimmed text.

    python scripts/v162/resolve-duplicates-v162.py --source <delivery dir> --country vnm --out reports/v162/duplicates-vnm-v162.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import openpyxl

parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True)
parser.add_argument("--country", required=True)
parser.add_argument("--out", required=True)
args = parser.parse_args()
SOURCE = Path(args.source)
CODE = re.compile(r"^([A-E]-\d{3})(?:_(.*))?\.xlsx$")


def text(value) -> str:
    return "" if value is None else str(value).strip()


def data_rows(path: Path) -> dict[str, list[tuple]]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    out: dict[str, list[tuple]] = {}
    for ws in wb.worksheets:
        kind = "observation" if ws.title.startswith("1.1") else "entity" if ws.title.startswith("1.2") else None
        if not kind:
            continue
        rows = []
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i < 3 or not row:
                continue
            cells = tuple(text(c) for c in row)
            if not re.match(r"^[A-E]-\d{3}$", cells[0] if cells else ""):
                continue
            # Trailing empty cells differ between otherwise equal rows.
            while cells and cells[-1] == "":
                cells = cells[:-1]
            rows.append(cells)
        out[kind] = rows
    return out


def key_column(kind: str, files: list[dict]) -> int | None:
    """The column that identifies a record: unique within every file and shared
    most across files (a project id, a record key). None when no column is."""
    best, best_overlap = None, -1
    width = max((len(r) for f in files for r in f["rows"].get(kind, [])), default=0)
    for i in range(3, width):
        values = [[r[i] if i < len(r) else "" for r in f["rows"].get(kind, [])] for f in files]
        if any(len(v) != len(set(v)) or "" in v for v in values if v):
            continue
        sets = [set(v) for v in values if v]
        overlap = len(set.intersection(*sets)) if len(sets) > 1 else 0
        if overlap > best_overlap:
            best, best_overlap = i, overlap
    return best


def record_key(kind: str, row: tuple, column: int | None) -> tuple:
    if column is None:
        return tuple(row)
    return (row[0], row[2] if len(row) > 2 else "", row[column] if column < len(row) else "")


def row_contains(big: tuple, small: tuple) -> bool:
    """Every cell of `small` is inside the same cell of `big` (a note that only
    gained text still counts as included)."""
    return all((small[i] in (big[i] if i < len(big) else "")) for i in range(len(small)) if small[i])


def file_contains(big: dict, small: dict) -> bool:
    for kind, rows in small["rows"].items():
        pool = list(big["rows"].get(kind, []))
        for row in rows:
            if row in pool:
                pool.remove(row)
                continue
            match = next((i for i, cand in enumerate(pool) if cand[:3] == row[:3] and row_contains(cand, row)), None)
            if match is None:
                return False
            pool.pop(match)
    return True


groups: dict[str, list[Path]] = defaultdict(list)
for path in sorted(SOURCE.glob("*.xlsx")):
    if path.name.startswith("~$"):
        continue
    match = CODE.match(path.name)
    if match:
        groups[match.group(1)].append(path)

decisions = []
for element_id, paths in sorted(groups.items()):
    if len(paths) < 2:
        continue
    files = []
    for path in paths:
        rows = data_rows(path)
        flat = {(kind, row) for kind, items in rows.items() for row in items}
        files.append({
            "path": path, "name": unicodedata.normalize("NFC", path.name), "rows": rows, "set": flat,
            "records": sum(len(v) for v in rows.values()),
            "c012Rows": sum(1 for kind, row in flat if "C-012" in " ".join(row)),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        })
    others = lambda f: [g for g in files if g is not f]
    rule, chosen = None, None
    contains = {f["name"]: [g["name"] for g in others(f) if file_contains(f, g)] for f in files}
    supersets = [f for f in files if len(contains[f["name"]]) == len(files) - 1]
    c012 = [f for f in files if "C-012추가" in f["name"]]
    if len(c012) == 1:
        addition = c012[0]
        base = [g for g in others(addition) if "C-012" not in g["name"] and not re.search(r" \(\d+\)\.xlsx$", g["name"])]
        adds_rows = bool(base) and addition["records"] > max(g["records"] for g in base)
        if adds_rows:
            # A file that includes the addition cell by cell (it only gained notes) wins over it.
            wider = [f for f in supersets if f is not addition]
            rule, chosen = ("superset-of-c012-addition", wider[0]) if wider else ("c012-addition", addition)
    if not chosen and supersets:
        rule, chosen = "superset", max(supersets, key=lambda f: (f["records"], f["name"]))
    if not chosen:
        rule, chosen = "most-records", max(files, key=lambda f: (f["records"], f["name"]))

    # Same record, different values: the adopted file's values are used.
    conflicts = []
    adopted_by_key = {}
    key_columns = {kind: key_column(kind, files) for kind in ("observation", "entity")}
    for kind, items in chosen["rows"].items():
        for row in items:
            adopted_by_key[(kind, record_key(kind, row, key_columns[kind]))] = row
    missing_from_adopted = []
    for other in others(chosen):
        for kind, items in other["rows"].items():
            for row in items:
                key = (kind, record_key(kind, row, key_columns[kind]))
                mine = adopted_by_key.get(key)
                if mine is None:
                    missing_from_adopted.append({"file": other["name"], "kind": kind, "key": list(key[1])})
                elif mine != row:
                    diff = [i for i in range(max(len(mine), len(row))) if (mine[i] if i < len(mine) else "") != (row[i] if i < len(row) else "")]
                    grew = row_contains(mine, row)
                    conflicts.append({"file": other["name"], "kind": kind, "key": list(key[1]), "columns": diff[:12],
                                      "type": "text-extended-in-adopted" if grew else "value-conflict",
                                      "adopted": [mine[i] if i < len(mine) else "" for i in diff[:6]],
                                      "other": [row[i] if i < len(row) else "" for i in diff[:6]]})
    decisions.append({
        "elementId": element_id,
        "rule": rule,
        "keyColumns": key_columns,
        "adopted": chosen["name"],
        "superseded": [f["name"] for f in others(chosen)],
        "files": [{"name": f["name"], "records": f["records"],
                   "observation": len(f["rows"].get("observation", [])), "entity": len(f["rows"].get("entity", [])),
                   "c012Rows": f["c012Rows"], "sha256": f["sha256"],
                   "containsAllOthers": len(contains[f["name"]]) == len(files) - 1, "containsCellLevel": contains[f["name"]]} for f in files],
        "conflicts": conflicts[:200],
        "conflictCount": len(conflicts),
        "valueConflictCount": sum(1 for c in conflicts if c["type"] == "value-conflict"),
        "recordsOnlyInSuperseded": missing_from_adopted[:200],
        "recordsOnlyInSupersededCount": len(missing_from_adopted),
    })

out = Path(args.out)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"schema": "duplicates-v162", "country": args.country, "source": str(SOURCE), "decisions": decisions}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
for d in decisions:
    print(json.dumps({k: d[k] for k in ("elementId", "rule", "adopted", "superseded", "conflictCount", "valueConflictCount", "recordsOnlyInSupersededCount")}
                     | {"files": [(f["name"][-30:], f["records"], f["containsAllOthers"], f["c012Rows"]) for f in d["files"]]}, ensure_ascii=False))
