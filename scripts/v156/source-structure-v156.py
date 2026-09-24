"""Structural scan of a staged delivery against the published catalog.

The value diff (``source-diff-v156.mjs``) needs a built tree on both sides. When
the ETL cannot finish - as it could not for the 2026-09-22 delivery, whose B-033
arrived with extra dimensions and broke the spatial builder's uniqueness rule -
there is no candidate tree to diff, and the question "what changed in the shape
of the delivery" still has to be answered.

This reads the staged workbooks with the ETL's own analyzer and compares the
shape (observation rows, entity rows, attribute labels, spatial units, years)
with what the published catalog states per element. It writes a report and never
touches the delivery or the public tree.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import pathlib
import sys
from typing import Any

# Run from anywhere: the ETL package lives at the repository root.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))

from tools.vietnam_etl.source_zip import analyze_source_dir  # noqa: E402


def _catalog_rows(catalog_path: pathlib.Path) -> dict[str, dict[str, Any]]:
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    return {row["elementId"]: row for row in catalog["elements"]}


def scan(repo: pathlib.Path, workbooks: pathlib.Path, catalog_path: pathlib.Path) -> dict[str, Any]:
    analysis = analyze_source_dir(
        workbooks,
        catalog_path=repo / "public/data/vietnam/v1/catalog.json",
        include_records=True,
    )
    published = _catalog_rows(catalog_path)
    elements: list[dict[str, Any]] = []
    for row in analysis["workbooks"]:
        element_id = row.get("elementId")
        if not element_id:
            continue
        before = published.get(element_id, {})
        observation_rows = int(row.get("observationRowCount", 0) or 0)
        entity_rows = int(row.get("entityRowCount", 0) or 0)
        published_observations = int(before.get("observationCount", 0) or 0)
        published_entities = int(before.get("entityCount", 0) or 0)
        # A delivery that moves an element between the two shapes changes which
        # renderer and which map join can read it at all.
        shape_before = (
            "observation" if published_observations and not published_entities
            else "entity" if published_entities and not published_observations
            else "mixed" if published_observations and published_entities
            else "empty"
        )
        shape_after = (
            "observation" if observation_rows and not entity_rows
            else "entity" if entity_rows and not observation_rows
            else "mixed" if observation_rows and entity_rows
            else "empty"
        )
        elements.append(
            {
                "elementId": element_id,
                "file": row.get("archiveName"),
                "shape": {"before": shape_before, "after": shape_after, "changed": shape_before != shape_after},
                "observationRows": {"published": published_observations, "delivered": observation_rows},
                "entityRows": {"published": published_entities, "delivered": entity_rows},
                "attributeLabels": sorted(row.get("entityAttributeLabels") or []),
                "spatialUnits": sorted(row.get("spatialUnits") or []),
                "latestYear": {"published": before.get("latestYear"), "delivered": row.get("latestYear")},
                "yearCount": len(row.get("years") or []),
                "sheetNames": row.get("sheetNames"),
                "warnings": row.get("warnings") or [],
                "errors": row.get("errors") or [],
                "hasCoordinates": bool(row.get("hasCoordinates")),
                "hasGeometry": bool(row.get("hasGeometry")),
                "carriedOver": False,
            }
        )
    delivered_ids = {row["elementId"] for row in elements}
    missing = sorted(set(published) - delivered_ids)
    report = {
        "schemaVersion": "v156",
        "generator": "scripts/v156/source-structure-v156.py",
        "generatedAt": _dt.datetime.now(_dt.timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z"),
        "workbooks": str(workbooks),
        "publishedCatalog": str(catalog_path),
        "totals": {
            "deliveredElements": len(elements),
            "publishedElements": len(published),
            "notDelivered": len(missing),
            "shapeChanged": sum(1 for row in elements if row["shape"]["changed"]),
            "observationRowsDropped": sum(
                1
                for row in elements
                if row["observationRows"]["published"] > 0 and row["observationRows"]["delivered"] == 0
            ),
            "entityRowsAppeared": sum(
                1
                for row in elements
                if row["entityRows"]["published"] == 0 and row["entityRows"]["delivered"] > 0
            ),
            "withErrors": sum(1 for row in elements if row["errors"]),
            "withWarnings": sum(1 for row in elements if row["warnings"]),
        },
        "notDelivered": missing,
        "elements": sorted(elements, key=lambda row: row["elementId"]),
    }
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workbooks", default="_source/vietnam/v156/workbooks")
    parser.add_argument("--catalog", default="public/data/vietnam/v2/catalog.json")
    parser.add_argument("--out", default="reports/v156/source-structure-v156.json")
    args = parser.parse_args()

    repo = pathlib.Path(__file__).resolve().parents[2]
    workbooks = pathlib.Path(args.workbooks)
    if not workbooks.is_absolute():
        workbooks = repo / workbooks
    catalog = pathlib.Path(args.catalog)
    if not catalog.is_absolute():
        catalog = repo / catalog

    report = scan(repo, workbooks, catalog)
    out = pathlib.Path(args.out)
    if not out.is_absolute():
        out = repo / out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"type": "summary", **report["totals"], "out": args.out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
