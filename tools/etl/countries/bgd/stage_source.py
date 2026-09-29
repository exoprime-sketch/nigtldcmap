"""V158-B1: stage a country's delivery for the country builder.

Copies the delivery's workbooks (``*.xlsx`` directly in the delivery folder;
lock files, sync-state folders and anything else are left behind) into the
git-ignored staging folder declared in ``tools/etl/countries/<code>/country.json``
and writes a manifest with each file's size and SHA-256. The delivery folder is
only read: it stays the archive of what arrived. Credentials are removed later,
from the staged copy, by ``tools.etl.redact_source_credentials_v156``.

    python -B tools/etl/countries/bgd/stage_source.py --country bgd
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import shutil
import sys

REPO = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO))

from tools.etl.normalization import extract_element_id  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--country", required=True, help="country folder under tools/etl/countries")
    args = parser.parse_args()

    config_path = REPO / "tools/etl/countries" / args.country.lower() / "country.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    source = (REPO / config["source"]["directory"]).resolve()
    staging = (REPO / config["source"]["staging"]).resolve()
    manifest_path = (REPO / config["source"]["manifest"]).resolve()
    if not source.is_dir():
        raise SystemExit(f"DELIVERY_NOT_FOUND: {source}")
    # Only a folder under _source may be replaced; never the delivery itself.
    if "_source" not in staging.relative_to(REPO).parts:
        raise SystemExit(f"REFUSING_STAGING_OUTSIDE__source: {staging}")

    workbooks = sorted(
        path
        for path in source.glob("*.xlsx")
        if path.is_file() and not path.name.startswith(("~$", "._"))
    )
    if not workbooks:
        raise SystemExit(f"NO_WORKBOOK_IN_DELIVERY: {source}")
    ids = [extract_element_id(path.name) for path in workbooks]
    if None in ids:
        raise SystemExit("WORKBOOK_WITHOUT_ELEMENT_ID: " + ", ".join(p.name for p, i in zip(workbooks, ids) if i is None))
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if duplicates:
        raise SystemExit(f"DUPLICATE_ELEMENT_WORKBOOKS: {duplicates}")

    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    files = []
    for path, element_id in zip(workbooks, ids):
        data = path.read_bytes()
        (staging / path.name).write_bytes(data)
        files.append(
            {
                "elementId": element_id,
                "fileName": path.name,
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
            }
        )
    skipped = sorted(
        item.name for item in source.iterdir() if item.name not in {path.name for path in workbooks}
    )
    manifest = {
        "schemaVersion": "country-source-manifest-v158",
        "countryIso3": config["iso3"],
        "delivery": config["source"]["delivery"],
        "workbookCount": len(files),
        "files": files,
        "skippedEntries": skipped,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"staged": len(files), "skipped": skipped, "manifest": str(manifest_path.relative_to(REPO))}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
