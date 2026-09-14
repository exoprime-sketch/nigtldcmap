#!/usr/bin/env node
/**
 * Nothing oversized reaches the repository, and every download resolves.
 *
 * The all-data projection produces 869 MB of download files, four of them past
 * GitHub's 100 MB per-file limit. The delivery manifest decides per asset
 * whether it ships from the repository or from object storage; this checks that
 * the decision was actually honoured on disk, so a promotion cannot quietly put
 * a 130 MB file back under public/.
 *
 * Two modes, because the same tree means different things in each place:
 *   --mode staging     a build directory. External assets are expected to be
 *                      here - this is where an upload would read them from -
 *                      and NOT_UPLOADED is reported, not failed.
 *   --mode repository  a tree destined for public/. An external asset present
 *                      here is the mistake this exists to prevent, and an
 *                      external asset with no serving URL breaks the download.
 *
 *   node scripts/v137/check-download-delivery-v137.mjs --data public/data/vietnam/v2 --mode repository
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", "public/data/vietnam/v2"));
const MODE = opt("--mode", "repository");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)}MB`;

function main() {
  const manifestPath = resolve(DATA, "downloads/delivery-manifest.json");
  if (!existsSync(manifestPath)) {
    console.error(`DELIVERY_MANIFEST_MISSING: ${manifestPath}`);
    return 2;
  }
  const manifest = readJson(manifestPath);
  const limit = Number(manifest.repositoryMaxBytes);
  const problems = [];

  for (const asset of manifest.assets || []) {
    const path = resolve(DATA, "downloads", asset.fileName);
    const present = existsSync(path);
    if (asset.deliveryMode === "repository") {
      if (!present) {
        problems.push({ kind: "REPOSITORY_ASSET_MISSING", asset: asset.fileName });
        continue;
      }
      const size = statSync(path).size;
      if (size !== asset.byteSize) {
        problems.push({
          kind: "REPOSITORY_ASSET_SIZE_CHANGED",
          asset: asset.fileName,
          manifest: mb(asset.byteSize),
          onDisk: mb(size),
        });
      }
      if (size >= limit) {
        problems.push({ kind: "OVERSIZED_IN_REPOSITORY", asset: asset.fileName, size: mb(size) });
      }
    } else if (MODE === "repository") {
      if (present) {
        // An external asset sitting in a tree bound for public/ is exactly the
        // mistake this exists to prevent.
        problems.push({
          kind: "EXTERNAL_ASSET_PRESENT_IN_REPOSITORY_TREE",
          asset: asset.fileName,
          size: mb(statSync(path).size),
        });
      }
      if (asset.uploadState !== "UPLOADED" || !asset.url) {
        problems.push({
          kind: "EXTERNAL_ASSET_NOT_SERVED",
          asset: asset.fileName,
          uploadState: asset.uploadState,
        });
      }
    } else if (!present) {
      // In a staging build the file has to be here, or there is nothing to
      // upload.
      problems.push({ kind: "EXTERNAL_ASSET_MISSING_FROM_BUILD", asset: asset.fileName });
    }
  }

  // The catalog must point at the same places the manifest does.
  const catalog = readJson(resolve(DATA, "catalog.json"));
  const byKey = new Map(
    (manifest.assets || []).map((asset) => [`${asset.elementId}:${asset.format}`, asset])
  );
  for (const element of catalog.elements || []) {
    for (const asset of element.downloadAssets || []) {
      const row = byKey.get(`${element.elementId}:${asset.format}`);
      if (!row) {
        problems.push({ kind: "CATALOG_ASSET_NOT_IN_MANIFEST", asset: `${element.elementId}:${asset.format}` });
        continue;
      }
      if (asset.url !== row.url) {
        problems.push({
          kind: "CATALOG_URL_DISAGREES_WITH_MANIFEST",
          asset: `${element.elementId}:${asset.format}`,
          catalog: asset.url,
          manifest: row.url,
        });
      }
    }
  }

  const result = {
    dataRoot: DATA,
    mode: MODE,
    repositoryMaxBytes: limit,
    assetCount: manifest.assetCount,
    repositoryAssetCount: manifest.repositoryAssetCount,
    externalAssetCount: manifest.externalAssetCount,
    pendingUploadCount: manifest.pendingUploadCount,
    externalDeliveryState:
      manifest.externalAssetCount === 0
        ? "NONE_REQUIRED"
        : manifest.pendingUploadCount === manifest.externalAssetCount
          ? "NOT_UPLOADED"
          : "PARTIALLY_UPLOADED",
    status: problems.length ? "FAIL" : "PASS",
    problems,
  };
  console.log(JSON.stringify(result, null, 2));
  return problems.length ? 1 : 0;
}

process.exit(main());
