"""Redact credential material from the staged source copy.

The 2026-09-22 Vietnam delivery documents its collection method in each
workbook's metadata sheet, and E-008's entry spelled out the OpenAlex query
including a live ``api_key=``. The ETL already strips such a value from
everything it publishes and then refuses to build, so that a person decides what
to do rather than a pipeline deciding silently
(``build_public_v2.py``: "credential material was detected").

This removes the secret from the *staged copy* the ETL reads
(``_source/vietnam/<version>/workbooks``) and keeps the surrounding text, so the
record still says which endpoint and parameters were used. The delivery folder
itself is never written to: it stays the archive of what arrived.

Patterns come from ``normalization`` so the detector and the redactor cannot
drift apart. Findings are reported as hashes and lengths - never as values.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import pathlib
import re
from typing import Any

from openpyxl import load_workbook

from tools.vietnam_etl.normalization import (  # single source of truth for what counts
    _CREDENTIAL_VALUE_PATTERNS,
)

PLACEHOLDER = "(자격증명 제거)"
# The first pattern is the ``name=value`` shape. Its only group is the secret;
# the parameter name is part of the match, so the prefix is taken from group 0.
#
# The replacement keeps the parameter name but drops the separator: the detector
# matches "name=<anything>", so a placeholder written as "api_key=<removed>"
# would be flagged as a credential all over again. "api_key(자격증명 제거)" says
# the same thing and reads as prose, not as an assignment.
KEY_VALUE_PATTERN = _CREDENTIAL_VALUE_PATTERNS[0]
WHOLE_MATCH_PATTERNS = _CREDENTIAL_VALUE_PATTERNS[1:]


def _redact(text: str) -> tuple[str, list[dict[str, Any]]]:
    """Return the text with secrets replaced, plus one finding per replacement."""

    findings: list[dict[str, Any]] = []

    def replace_key_value(match: re.Match[str]) -> str:
        secret = match.group(1)
        prefix = match.group(0)[: len(match.group(0)) - len(secret)]
        findings.append(
            {
                "parameter": prefix.strip().rstrip(":=").strip().lower(),
                "reason": "credential-value-pattern",
                "secretSha256": hashlib.sha256(secret.encode("utf-8")).hexdigest(),
                "secretLength": len(secret),
            }
        )
        return f"{prefix.strip().rstrip(':=').strip()}{PLACEHOLDER}"

    redacted = KEY_VALUE_PATTERN.sub(replace_key_value, text)
    for pattern in WHOLE_MATCH_PATTERNS:

        def replace_whole(match: re.Match[str]) -> str:
            findings.append(
                {
                    "parameter": None,
                    "reason": "credential-value-pattern",
                    "secretSha256": hashlib.sha256(match.group(0).encode("utf-8")).hexdigest(),
                    "secretLength": len(match.group(0)),
                }
            )
            return PLACEHOLDER

        redacted = pattern.sub(replace_whole, redacted)
    return redacted, findings


def redact_tree(workbooks: pathlib.Path, *, apply: bool) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    for path in sorted(workbooks.glob("*.xlsx")):
        book = load_workbook(path)
        file_findings: list[dict[str, Any]] = []
        for sheet in book.worksheets:
            for row in sheet.iter_rows():
                for cell in row:
                    if not isinstance(cell.value, str):
                        continue
                    redacted, findings = _redact(cell.value)
                    if not findings:
                        continue
                    for finding in findings:
                        file_findings.append(
                            {
                                **finding,
                                "sheet": sheet.title,
                                "row": cell.row,
                                "column": cell.column,
                                "cellSha256": hashlib.sha256(
                                    cell.value.encode("utf-8")
                                ).hexdigest(),
                            }
                        )
                    if apply:
                        cell.value = redacted
        if file_findings:
            if apply:
                book.save(path)
            files.append({"file": path.name, "redactions": file_findings})
        book.close()
    return {
        "schemaVersion": "v156",
        "generator": "tools/vietnam_etl/redact_source_credentials_v156.py",
        "generatedAt": _dt.datetime.now(_dt.timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z"),
        "workbooks": str(workbooks),
        "applied": apply,
        "placeholder": PLACEHOLDER,
        "totals": {
            "filesRedacted": len(files),
            "redactions": sum(len(row["redactions"]) for row in files),
        },
        "files": files,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workbooks", default="_source/vietnam/v156/workbooks")
    parser.add_argument("--report", default="reports/v156/source-credential-redaction-v156.json")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report findings without writing the workbooks",
    )
    args = parser.parse_args()

    repo = pathlib.Path(__file__).resolve().parents[2]
    workbooks = pathlib.Path(args.workbooks)
    if not workbooks.is_absolute():
        workbooks = repo / workbooks
    if not workbooks.is_dir():
        raise SystemExit(f"WORKBOOKS_NOT_FOUND: {workbooks}")
    # Refuse to write the delivery archive: only a staged copy may be redacted.
    if "_source" not in workbooks.parts:
        raise SystemExit(f"REFUSING_TO_WRITE_OUTSIDE_STAGED_SOURCE: {workbooks}")

    summary = redact_tree(workbooks, apply=not args.dry_run)
    report_path = pathlib.Path(args.report)
    if not report_path.is_absolute():
        report_path = repo / report_path
    # A dry run reports what a run would do; it must not overwrite the record of
    # what an earlier run actually removed.
    if args.dry_run:
        report_path = report_path.with_suffix(".dry-run.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"type": "summary", **summary["totals"], "applied": summary["applied"], "report": args.report}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
