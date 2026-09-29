"""Split oversized element packs out of the published V124 bundle index.

`build_public_v2.py` decides pack membership with `_plan_packs`: an element
whose own serialized payload exceeds `SOLO_PACK_CONTENT_BYTES` is pulled out
of its 8-element slice into its own pack, placed right after that slice's
pack. This script applies that rule to the already-published
`packs/bundle-index-v124.json` asset without re-running the full ETL (which
would re-derive every element from the source ZIP). It:

  1. Decodes every existing pack (`_decode_envelope` checks both hashes) to
     recover each element's real payload and measure its serialized size.
  2. Runs `_plan_packs` over all 152 elements to get the target pack layout.
  3. For each *old* pack whose element set does not match the plan's entry
     for the same shard id, re-envelopes the planned replacement shard(s)
     from the payloads it already decoded, writes the new pack file(s), and
     deletes the old pack file. Every pack whose element set already matches
     the plan is left completely untouched -- not even rewritten -- so its
     bytes on disk do not change.
  4. Rewrites `packs/bundle-index-v124.json` and updates `manifest.json`'s
     `packCount`/`shardCount`.

It is a bug, not a feature, if any element's payload comes out different
after this repack: the invariant this script exists to prove is that
splitting a pack cannot change what is inside it. The printed summary reports
a before/after payload sha256 for all 152 elements and the run fails if any
of them disagree.

Run:

    python -m tools.etl.repack_packs_v151_2 --data public/data/vietnam/v2
"""

from __future__ import annotations

import argparse
import json
import pathlib
from typing import Any

from .build_public_v2 import (
    RUNTIME_VERSION,
    SCHEMA_VERSION,
    _asset_url,
    _decode_envelope,
    _envelope,
    _json_bytes,
    _plan_packs,
    _sha256,
    _write_json,
)

BUNDLE_INDEX_RELATIVE_PATH = "packs/bundle-index-v124.json"
MANIFEST_RELATIVE_PATH = "manifest.json"

# The logical field order `build_public_v2.py`'s `bundle_index = {...}`
# literal is written in. `_write_json`'s pretty mode sorts keys alphabetically
# on disk regardless (as the current file already is), so this only documents
# intent; it does not change the bytes written.
INDEX_KEY_ORDER = [
    "schemaVersion",
    "runtimeVersion",
    "assetLayoutVersion",
    "elementCount",
    "packCount",
    "totals",
    "packs",
    "elements",
]


def _ordered(mapping: dict[str, Any], order: list[str]) -> dict[str, Any]:
    ordered = {key: mapping[key] for key in order if key in mapping}
    for key, value in mapping.items():
        if key not in ordered:
            ordered[key] = value
    return ordered


def _public_dir(data_dir: pathlib.Path) -> pathlib.Path:
    # data_dir is .../public/data/vietnam/v2 ; public/ is three levels up.
    return data_dir.parents[2]


def run(data_dir: pathlib.Path) -> dict[str, Any]:
    public_dir = _public_dir(data_dir)
    index_path = data_dir / BUNDLE_INDEX_RELATIVE_PATH
    manifest_path = data_dir / MANIFEST_RELATIVE_PATH

    index = json.loads(index_path.read_text(encoding="utf-8"))
    old_packs = {pack["shardId"]: pack for pack in index["packs"]}

    payloads: dict[str, Any] = {}
    payload_sha_before: dict[str, str] = {}
    element_old_shard: dict[str, str] = {}
    for pack in index["packs"]:
        pack_path = public_dir / pack["packUrl"].lstrip("/")
        decoded = _decode_envelope(pack_path)
        for element_id in pack["elementIds"]:
            payload = decoded["elements"][element_id]
            payloads[element_id] = payload
            payload_sha_before[element_id] = _sha256(_json_bytes(payload, pretty=False))
            element_old_shard[element_id] = pack["shardId"]

    sorted_ids = sorted(payloads)
    plan = _plan_packs(sorted_ids, payloads)
    planned_elements_by_shard = {shard_id: element_ids for shard_id, element_ids in plan}

    changed_old_shard_ids = sorted(
        shard_id
        for shard_id, old_pack in old_packs.items()
        if old_pack["elementIds"] != planned_elements_by_shard.get(shard_id)
    )

    new_bundle_packs: list[dict[str, Any]] = []
    new_bundle_elements: dict[str, Any] = {}
    written_pack_files: list[dict[str, Any]] = []
    removed_pack_files: list[str] = []

    for shard_id, element_ids in plan:
        # A planned shard needs rewriting if it IS one of the changed old
        # shards, or if it is a brand-new solo shard derived from one (its id
        # is "<changed-shard-id>-<element>").
        source_old_shard_id = shard_id
        if shard_id not in old_packs:
            # Solo shard: recover which changed slice it was split out of.
            prefix_matches = [
                candidate for candidate in changed_old_shard_ids if shard_id.startswith(candidate + "-")
            ]
            if len(prefix_matches) != 1:
                raise ValueError(f"Cannot trace new shard {shard_id!r} back to a changed slice")
            source_old_shard_id = prefix_matches[0]

        if source_old_shard_id not in changed_old_shard_ids:
            # Untouched pack: keep the existing index entries byte-identical.
            new_bundle_packs.append(old_packs[shard_id])
            for element_id in element_ids:
                new_bundle_elements[element_id] = index["elements"][element_id]
            continue

        shard_payload = {
            "schemaVersion": SCHEMA_VERSION,
            "runtimeVersion": RUNTIME_VERSION,
            "assetLayoutVersion": "sharded-element-bundles-v2",
            "shardId": shard_id,
            "elementIds": element_ids,
            "elements": {element_id: payloads[element_id] for element_id in element_ids},
        }
        envelope, content, compressed = _envelope(
            shard_payload, resource_type="element-shard", shard_id=shard_id
        )
        filename = f"{shard_id}-{_sha256(compressed)[:8]}.json"
        pack_path = data_dir / "packs" / filename
        _write_json(pack_path, envelope, pretty=False)
        pack_url = _asset_url(pack_path, public_dir)
        pack_entry = {
            "shardId": shard_id,
            "packUrl": pack_url,
            "envelopeByteSize": pack_path.stat().st_size,
            "compressedByteSize": len(compressed),
            "compressedSha256": _sha256(compressed),
            "contentByteSize": len(content),
            "contentSha256": _sha256(content),
            "elementIds": element_ids,
            "metaCount": sum(len(payloads[item]["meta"]["indicators"]) for item in element_ids),
            "observationCount": sum(
                payloads[item]["observations"]["recordCount"] for item in element_ids
            ),
            "entityCount": sum(payloads[item]["entities"]["recordCount"] for item in element_ids),
        }
        new_bundle_packs.append(pack_entry)
        written_pack_files.append({"shardId": shard_id, "packUrl": pack_url, "envelopeByteSize": pack_entry["envelopeByteSize"]})
        for element_id in element_ids:
            old_element_entry = index["elements"][element_id]
            new_bundle_elements[element_id] = {
                "elementId": element_id,
                "shardId": shard_id,
                "packUrl": pack_url,
                "metaCount": len(payloads[element_id]["meta"]["indicators"]),
                "observationCount": payloads[element_id]["observations"]["recordCount"],
                "entityCount": payloads[element_id]["entities"]["recordCount"],
                "envelopeByteSize": pack_path.stat().st_size,
                "compressedByteSize": len(compressed),
                "compressedSha256": _sha256(compressed),
                "contentByteSize": len(content),
                "contentSha256": _sha256(content),
                "packageStatus": old_element_entry["packageStatus"],
                "publicStatus": old_element_entry["publicStatus"],
            }

    for shard_id in changed_old_shard_ids:
        old_pack_path = public_dir / old_packs[shard_id]["packUrl"].lstrip("/")
        old_pack_path.unlink()
        removed_pack_files.append(old_packs[shard_id]["packUrl"])

    # Invariant check: repacking must not change what is inside any element.
    payload_sha_after: dict[str, str] = {}
    for element_id in sorted_ids:
        payload_sha_after[element_id] = _sha256(_json_bytes(payloads[element_id], pretty=False))
    mismatches = [
        element_id
        for element_id in sorted_ids
        if payload_sha_before[element_id] != payload_sha_after[element_id]
    ]
    if mismatches:
        raise ValueError(f"Payload sha256 changed for {mismatches} -- repack must be a no-op on content")

    old_pack_count = len(index["packs"])
    new_index_unordered = {
        "schemaVersion": index["schemaVersion"],
        "runtimeVersion": index["runtimeVersion"],
        "assetLayoutVersion": index["assetLayoutVersion"],
        "elementCount": len(new_bundle_elements),
        "packCount": len(new_bundle_packs),
        "totals": index["totals"],
        "packs": new_bundle_packs,
        "elements": new_bundle_elements,
    }
    new_index = _ordered(new_index_unordered, INDEX_KEY_ORDER)
    _write_json(index_path, new_index, pretty=True)

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["packCount"] = len(new_bundle_packs)
    manifest["shardCount"] = len(new_bundle_packs)
    _write_json(manifest_path, manifest, pretty=True)

    return {
        "status": "PASS",
        "packCountBefore": old_pack_count,
        "packCountAfter": len(new_bundle_packs),
        "elementCount": len(new_bundle_elements),
        "changedOldShardIds": changed_old_shard_ids,
        "removedPackFiles": sorted(removed_pack_files),
        "writtenPackFiles": written_pack_files,
        "payloadShaMismatchCount": len(mismatches),
        "elementPayloadShaChecked": len(sorted_ids),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=pathlib.Path, required=True)
    args = parser.parse_args()
    summary = run(args.data.resolve())
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
