"""What each download file is, and where it is served from.

Every asset carries its own facts - element, format, record count, byte size,
SHA-256 - so a reader, an integrity check and a future uploader all read the
same record. That is written whether or not the file ships from the repository.

**Where they ship from, decided by measurement rather than by alarm.**

The all-data projection first produced 869 MB of downloads with four JSON files
past 100 MiB, and 100 MiB is a hard limit on a single Git object. Two changes
fixed that without touching a single value:

*   Compact serialization. The download JSON was pretty-printed; the same keys,
    the same order and the same values without indentation are about 20%
    smaller.
*   Row-constant fields stated once. ``publicationDecision`` and ``rightsNote``
    were byte-identical on all 33,232 rows of B-004 - 17 MiB of verbatim
    repetition - and ``recordDefaults`` now carries them once for the file.

Measured after both, on the full delivery:

===================  ==========  ==========  ==========
file                 pretty      compact     + defaults
===================  ==========  ==========  ==========
b-004.json           137 MB      106.7 MiB   81.1 MiB
b-005.json           122 MB       95.6 MiB   75.1 MiB
b-006.json           130 MB      100.1 MiB   82.3 MiB
b-007.json           128 MB       98.6 MiB   80.1 MiB
===================  ==========  ==========  ==========

No file is over 100 MiB, so no Git object limit is in reach. The whole 664 MiB
tree compresses to **34.2 MiB** as Git objects - this data is repetitive JSON
and CSV, and deflate takes 95% of it - which is nothing against the 2 GB push
limit, and takes the repository from 180 MB to about 214 MB against a 10 GB
guideline. Shipping it as static data in the repository is the simpler thing and
it is comfortably practical, so that is what happens: ``deliveryMode`` is
``repository`` for every asset.

``ObjectStorageAdapter`` stays because the threshold is a real rule rather than
an assumption - if a future delivery does produce a single object over 100 MiB,
that asset is marked external and reported NOT_UPLOADED rather than silently
breaking a push. Nothing is uploaded today and nothing needs to be.
"""

from __future__ import annotations

import hashlib
import os
import pathlib
from dataclasses import dataclass
from typing import Any, Iterable, Mapping, Protocol

# The actual constraint: a single Git object above 100 MiB cannot be pushed.
# It is not a limit on the repository or on the tree, and treating it as one led
# to routing 777 MB out to object storage that never needed to leave. After
# compaction the largest asset is 82.3 MiB, so nothing crosses this.
REPOSITORY_MAX_BYTES = 100 * 1024 * 1024

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
