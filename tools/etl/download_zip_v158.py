"""V158: one deterministic ZIP per element for the static downloads.

Decision (user, 2026-09-30, docs/DEPLOYMENT_CAPACITY_V158.md section 7): each
element's download files are shipped pre-compressed in one ZIP. The files a
reader gets out of it are byte for byte the JSON and CSV the ETL wrote before;
only the container is new. The deployment shrinks about 33 times because the
downloads are repetitive JSON and CSV.

Deterministic: the same members give the same ZIP bytes on every run and every
platform - members sorted by name, the ZIP epoch (1980-01-01 00:00) as the
timestamp, a fixed "made by" system and file mode, deflate level 9, no extra
fields and no archive comment. The digest a catalog records therefore changes
only when a member does.
"""

from __future__ import annotations

import hashlib
import io
import pathlib
import zipfile
from typing import Iterable

ZIP_EPOCH = (1980, 1, 1, 0, 0, 0)
# "Made by" UNIX with a regular-file mode 0644: the value zipfile writes on
# Linux, fixed here so a Windows run writes the same bytes.
_CREATE_SYSTEM_UNIX = 3
_REGULAR_FILE_0644 = (0o100644 & 0xFFFF) << 16


def zip_bytes(members: Iterable[tuple[str, bytes]]) -> bytes:
    """The ZIP for these (name, bytes) members, deterministic."""
    ordered = sorted(members, key=lambda member: member[0])
    names = [name for name, _ in ordered]
    if len(set(names)) != len(names):
        raise ValueError(f"duplicate ZIP member names: {names}")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name, data in ordered:
            info = zipfile.ZipInfo(name, date_time=ZIP_EPOCH)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = _CREATE_SYSTEM_UNIX
            info.external_attr = _REGULAR_FILE_0644
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return buffer.getvalue()


def write_download_zip(path: pathlib.Path, members: Iterable[tuple[str, bytes]]) -> list[dict[str, object]]:
    """Write the ZIP and return what is inside it: name, size and SHA-256 per member."""
    materialized = sorted(members, key=lambda member: member[0])
    path.write_bytes(zip_bytes(materialized))
    return [
        {
            "fileName": name,
            "byteSize": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
        }
        for name, data in materialized
    ]


def read_download_zip(path: pathlib.Path) -> dict[str, bytes]:
    """The members of a download ZIP by name (for checks and tests)."""
    with zipfile.ZipFile(path) as archive:
        return {info.filename: archive.read(info.filename) for info in archive.infolist()}


def zip_download_asset(url_prefix: str, token: str, record_count: int) -> dict[str, object]:
    """The catalog entry for an element's download ZIP, before it is written.

    ``url_prefix`` is the country's published downloads directory, e.g.
    ``/data/vietnam/v2/downloads``. The members are listed in ZIP order (by
    name); their sizes and digests are filled in by ``write_element_zip``.
    """
    return {
        "format": "ZIP",
        "url": f"{url_prefix}/{token}.zip",
        "mediaType": "application/zip",
        "recordCount": record_count,
        "entries": [
            {"fileName": f"{token}.csv", "format": "CSV", "mediaType": "text/csv; charset=utf-8", "recordCount": record_count},
            {"fileName": f"{token}.json", "format": "JSON", "mediaType": "application/json", "recordCount": record_count},
        ],
    }


def write_element_zip(
    downloads_dir: pathlib.Path, token: str, json_bytes: bytes, csv_bytes: bytes, asset: dict[str, object]
) -> pathlib.Path:
    """Write ``<token>.zip`` and record each member's size and digest on the asset."""
    zip_path = downloads_dir / f"{token}.zip"
    facts = {
        row["fileName"]: row
        for row in write_download_zip(zip_path, [(f"{token}.json", json_bytes), (f"{token}.csv", csv_bytes)])
    }
    for entry in asset["entries"]:  # type: ignore[union-attr]
        entry["byteSize"] = facts[entry["fileName"]]["byteSize"]
        entry["sha256"] = facts[entry["fileName"]]["sha256"]
    return zip_path
