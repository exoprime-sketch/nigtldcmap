#!/usr/bin/env python3
"""V158: the Viet Nam derived assets that lagged their generators, as a table.

Compares the committed version (git HEAD) of each generated file with the
working tree after the generators were re-run, element by element and field by
field, and writes the result as Markdown and JSON. Read-only: it never runs a
generator itself.

    python scripts/v158/derived-sync-table-v158.py --out reports/v158/derived-sync-vnm-v158
"""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FILES = {
    "semantic-contracts": "public/data/vietnam/v2/semantic/element-visualization-contracts-v125.json",
    "dataset-directory-public": "public/data/vietnam/v2/dataset-directory.json",
    "dataset-directory-src": "src/data/datasetDirectoryV149.json",
}


def head_json(rel):
    raw = subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=ROOT, capture_output=True, check=True).stdout
    return json.loads(raw.decode("utf-8"))


def work_json(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def rows_by_element(document):
    if isinstance(document, list):
        return {row.get("elementId"): row for row in document}
    for key in ("contracts", "items", "elements", "datasets"):
        rows = document.get(key) if isinstance(document, dict) else None
        if isinstance(rows, list):
            return {row.get("elementId"): row for row in rows}
        if isinstance(rows, dict):
            return rows
    raise ValueError("no element rows")


def diff_paths(before, after, path=""):
    """Leaf paths whose value differs, with the two values."""
    if isinstance(before, dict) and isinstance(after, dict):
        out = []
        for key in sorted(set(before) | set(after)):
            out += diff_paths(before.get(key), after.get(key), f"{path}.{key}" if path else key)
        return out
    if isinstance(before, list) and isinstance(after, list) and len(before) == len(after):
        out = []
        for index, (left, right) in enumerate(zip(before, after)):
            out += diff_paths(left, right, f"{path}[{index}]")
        return out
    return [] if before == after else [(path, before, after)]


def short(value, limit=70):
    text = json.dumps(value, ensure_ascii=False)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    report = {"schema": "derived-sync-vnm-v158", "files": {}}
    lines = ["# 베트남 파생 자산 동기화 대조표 (V158)", "", "커밋본(HEAD) ↔ 생성기 재실행 결과, 요소·필드 단위.", ""]
    for label, rel in FILES.items():
        before, after = rows_by_element(head_json(rel)), rows_by_element(work_json(rel))
        changed = {}
        for element_id in sorted(set(before) | set(after)):
            paths = diff_paths(before.get(element_id), after.get(element_id))
            if paths:
                changed[element_id] = [{"path": p, "before": b, "after": a} for p, b, a in paths]
        head_doc, work_doc = head_json(rel), work_json(rel)
        top = []
        if isinstance(head_doc, dict):
            for key in sorted(set(head_doc) | set(work_doc)):
                if key in ("contracts", "items", "elements", "datasets"):
                    continue
                if head_doc.get(key) != work_doc.get(key):
                    top.append({"field": key, "before": head_doc.get(key), "after": work_doc.get(key)})
        report["files"][rel] = {"elements": len(after), "changedElements": len(changed), "topLevel": top, "changes": changed}
        lines += [f"## {label} — `{rel}`", "", f"요소 {len(after)}개 중 {len(changed)}개 변경", ""]
        if top:
            lines += ["최상위 필드: " + " · ".join(f"`{row['field']}` {short(row['before'], 40)} → {short(row['after'], 40)}" for row in top), ""]
        if changed:
            lines += ["| 요소 | 필드 | 커밋본 | 재생성 |", "|---|---|---|---|"]
            for element_id, rows in changed.items():
                for row in rows:
                    lines.append(
                        f"| {element_id} | `{row['path']}` | {short(row['before'])} | {short(row['after'])} |"
                    )
            lines.append("")
    out = ROOT / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.with_suffix(".json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    out.with_suffix(".md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"type": "summary", **{k: v["changedElements"] for k, v in report["files"].items()}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
