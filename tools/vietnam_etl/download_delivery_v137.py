"""Where each download file is delivered from, and how a reader is told.

The all-data publication grew the download tree from 85 MB to 869 MB. Four JSON
files are over 100 MB each (B-004 137 MB, B-006 130 MB, B-007 128 MB, B-005
122 MB), which is past GitHub's hard per-file limit, so the repository cannot be
the delivery path for them - and a 700 MB repository is not a good delivery path
for the rest either.

This module separates two things the build used to conflate:

*   **What the file is** - element, format, record count, byte size, SHA-256.
    That is a fact about the projection and is written for every asset whether
    or not it ships from the repository.
*   **Where it is served from** - a repository path under /data, or an external
    object store. That is a deployment decision, and it is recorded per asset
    rather than assumed.

Nothing here uploads anything by itself. ``ObjectStorageAdapter`` describes what
an uploader has to provide; ``NullObjectStorageAdapter`` is what runs when no
credentials are configured, and it reports every oversized asset as
NOT_UPLOADED rather than pretending a URL exists. A manifest produced without an
adapter is still complete and still says, per file, exactly what would have to
be uploaded.
"""

from __future__ import annotations

import hashlib
import os
import pathlib
from dataclasses import dataclass
from typing import Any, Iterable, Mapping, Protocol

# Files at or above this size are not delivered from the repository.
#
# Chosen so the repository's download tree stays about the size it already is
# (85 MB committed today, 91 MB at this threshold) rather than merely under
# GitHub's 100 MB per-file limit. Measured across the all-data projection:
#
#     threshold    repository            external
#         4 MB     275 files /  91 MB    19 files / 777 MB
#         8 MB     282 files / 132 MB    12 files / 736 MB
#        40 MB     287 files / 240 MB     7 files / 628 MB
#
# A per-file limit alone would still have tripled the repository. The point is
# the aggregate, so the threshold is set on that.
REPOSITORY_MAX_BYTES = 4 * 1024 * 1024

MANIFEST_SCHEMA = "nigt-download-delivery-1"

DELIVERY_REPOSITORY = "repository"
DELIVERY_EXTERNAL = "external-object-storage"

UPLOAD_NOT_ATTEMPTED = "NOT_UPLOADED"
UPLOAD_DONE = "UPLOADED"


@dataclass(frozen=True)
class DownloadAsset:
    """One generated download file, described independently of where it lives."""

    element_id: str
    fmt: str
    file_name: str
    media_type: str
    record_count: int
    byte_size: int
    sha256: str
    repository_url: str

    @property
    def delivery_mode(self) -> str:
        return (
            DELIVERY_REPOSITORY
            if self.byte_size < REPOSITORY_MAX_BYTES
            else DELIVERY_EXTERNAL
        )


class ObjectStorageAdapter(Protocol):
    """What an uploader has to provide for an external download to be served.

    An implementation is expected to be idempotent on ``sha256``: an asset whose
    digest is already stored must not be uploaded again, so a rebuild that
    changes nothing costs nothing.
    """

    name: str

    def configured(self) -> bool:
        """True when this adapter has everything it needs to upload."""

    def public_url(self, asset: DownloadAsset) -> str:
        """The URL the asset would be served from, whether or not it is there."""

    def upload(self, asset: DownloadAsset, path: pathlib.Path) -> str:
        """Store the file and return its public URL."""


class NullObjectStorageAdapter:
    """The adapter that runs when nothing is configured.

    It can still answer what the URL *would* be, because the URL shape belongs
    to the contract rather than to the credentials. What it cannot do is claim
    a file is served: every external asset comes back NOT_UPLOADED.
    """

    name = "null"

    def __init__(self, base_url: str | None = None) -> None:
        self._base_url = (base_url or os.environ.get("VIETNAM_DOWNLOAD_BASE_URL", "")).rstrip("/")

    def configured(self) -> bool:
        return False

    def public_url(self, asset: DownloadAsset) -> str:
        if not self._base_url:
            return ""
        # Content-addressed, so a re-published file never collides with the one
        # a cached page is still pointing at.
        return f"{self._base_url}/vietnam/v2/downloads/{asset.sha256[:12]}/{asset.file_name}"

    def upload(self, asset: DownloadAsset, path: pathlib.Path) -> str:
        raise RuntimeError(
            "NullObjectStorageAdapter cannot upload. Configure an adapter, or "
            "read the manifest and upload the assets it lists."
        )


def describe_asset(
    element_id: str,
    fmt: str,
    media_type: str,
    record_count: int,
    path: pathlib.Path,
    repository_url: str,
) -> DownloadAsset:
    payload = path.read_bytes()
    return DownloadAsset(
        element_id=element_id,
        fmt=fmt,
        file_name=path.name,
        media_type=media_type,
        record_count=int(record_count),
        byte_size=len(payload),
        sha256=hashlib.sha256(payload).hexdigest(),
        repository_url=repository_url,
    )


def build_manifest(
    assets: Iterable[DownloadAsset],
    downloads_dir: pathlib.Path,
    adapter: ObjectStorageAdapter | None = None,
) -> dict[str, Any]:
    """Describe every download asset and where it is delivered from."""

    adapter = adapter or NullObjectStorageAdapter()
    rows: list[dict[str, Any]] = []
    uploaded = 0
    for asset in sorted(assets, key=lambda item: (item.element_id, item.fmt)):
        mode = asset.delivery_mode
        row: dict[str, Any] = {
            "elementId": asset.element_id,
            "format": asset.fmt,
            "fileName": asset.file_name,
            "mediaType": asset.media_type,
            "recordCount": asset.record_count,
            "byteSize": asset.byte_size,
            "sha256": asset.sha256,
            "deliveryMode": mode,
            "repositoryUrl": asset.repository_url,
        }
        if mode == DELIVERY_REPOSITORY:
            row["url"] = asset.repository_url
            row["uploadState"] = "NOT_REQUIRED"
        else:
            candidate = adapter.public_url(asset)
            if adapter.configured():
                row["url"] = adapter.upload(asset, downloads_dir / asset.file_name)
                row["uploadState"] = UPLOAD_DONE
                uploaded += 1
            else:
                # No credentials: say what would be served and that it is not.
                row["url"] = candidate or None
                row["uploadState"] = UPLOAD_NOT_ATTEMPTED
        rows.append(row)

    external = [row for row in rows if row["deliveryMode"] == DELIVERY_EXTERNAL]
    return {
        "schema": MANIFEST_SCHEMA,
        "repositoryMaxBytes": REPOSITORY_MAX_BYTES,
        "adapter": adapter.name,
        "adapterConfigured": adapter.configured(),
        "assetCount": len(rows),
        "repositoryAssetCount": len(rows) - len(external),
        "externalAssetCount": len(external),
        "externalByteTotal": sum(row["byteSize"] for row in external),
        "uploadedCount": uploaded,
        "pendingUploadCount": sum(1 for row in external if row["uploadState"] == UPLOAD_NOT_ATTEMPTED),
        "note": (
            "deliveryMode says where a file is served from. An asset marked "
            "external is deliberately not in the repository; its uploadState "
            "says whether it has actually been stored. A build without an "
            "adapter still records size, digest and record count for every "
            "asset, so the upload can be done later from this manifest alone."
        ),
        "assets": rows,
    }


def external_file_names(manifest: Mapping[str, Any]) -> list[str]:
    return [
        str(row["fileName"])
        for row in manifest.get("assets", [])
        if row.get("deliveryMode") == DELIVERY_EXTERNAL
    ]
