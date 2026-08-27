"""CLI for deterministic V124 source-workbook analysis."""

from __future__ import annotations

import argparse
import json
import pathlib

from .source_zip import analyze_source_zip


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", dest="zip_path", required=True, help="Path to vietnam-data(4).zip")
    parser.add_argument("--out", dest="output_path", required=True, help="Destination JSON path")
    parser.add_argument("--catalog", dest="catalog_path", help="Optional v1 catalog for framework IDs")
    parser.add_argument(
        "--include-records",
        action="store_true",
        help="Include all normalized observation/entity/metadata rows in the analysis JSON",
    )
    return parser


def main() -> int:
    args = _parser().parse_args()
    analysis = analyze_source_zip(
        args.zip_path,
        catalog_path=args.catalog_path,
        include_records=args.include_records,
    )
    output = pathlib.Path(args.output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(analysis, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(analysis["totals"], ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
