import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const srcRoot = path.join(root, "src");
const dataRoot = path.join(root, "public", "data", "vietnam", "v1");
const allowedExtensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".css"];
const ignoredDirectories = new Set(["node_modules", "build", ".git"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function resolveRelativeImport(importer, specifier) {
  const base = path.resolve(path.dirname(importer), specifier);
  const candidates = [
    base,
    ...allowedExtensions.map((ext) => `${base}${ext}`),
    ...allowedExtensions.map((ext) => path.join(base, `index${ext}`)),
  ];
  return (
    candidates.find(
      (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ) || null
  );
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), "utf8"));
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256(file) {
  return sha256Buffer(fs.readFileSync(file));
}

function readVerifiedShard(file, shardInfo) {
  const fileBytes = fs.readFileSync(file);
  const encoding = shardInfo.encoding || "identity-json";
  const normalizedTransport =
    encoding === "gzip-base64-v1"
      ? Buffer.from(fileBytes.toString("utf8").replace(/\s+/g, ""), "utf8")
      : fileBytes;

  const failures = [];
  if (normalizedTransport.length !== shardInfo.byteSize) {
    failures.push({
      stage: "transport-size",
      actual: normalizedTransport.length,
      expected: shardInfo.byteSize,
    });
  }
  const transportChecksum = sha256Buffer(normalizedTransport);
  if (transportChecksum !== shardInfo.checksumSha256) {
    failures.push({
      stage: "transport-checksum",
      actual: transportChecksum,
      expected: shardInfo.checksumSha256,
    });
  }

  let content = normalizedTransport;
  if (encoding === "gzip-base64-v1") {
    const compressed = Buffer.from(
      normalizedTransport.toString("utf8"),
      "base64"
    );
    if (
      Number.isFinite(shardInfo.compressedByteSize) &&
      compressed.length !== shardInfo.compressedByteSize
    ) {
      failures.push({
        stage: "compressed-size",
        actual: compressed.length,
        expected: shardInfo.compressedByteSize,
      });
    }
    const compressedChecksum = sha256Buffer(compressed);
    if (
      shardInfo.compressedChecksumSha256 &&
      compressedChecksum !== shardInfo.compressedChecksumSha256
    ) {
      failures.push({
        stage: "compressed-checksum",
        actual: compressedChecksum,
        expected: shardInfo.compressedChecksumSha256,
      });
    }
    try {
      content = zlib.gunzipSync(compressed);
    } catch (error) {
      failures.push({ stage: "decompression", error: String(error) });
      return { payload: null, failures };
    }
  }

  if (
    Number.isFinite(shardInfo.contentByteSize) &&
    content.length !== shardInfo.contentByteSize
  ) {
    failures.push({
      stage: "content-size",
      actual: content.length,
      expected: shardInfo.contentByteSize,
    });
  }
  const contentChecksum = sha256Buffer(content);
  if (
    shardInfo.contentChecksumSha256 &&
    contentChecksum !== shardInfo.contentChecksumSha256
  ) {
    failures.push({
      stage: "content-checksum",
      actual: contentChecksum,
      expected: shardInfo.contentChecksumSha256,
    });
  }

  try {
    return { payload: JSON.parse(content.toString("utf8")), failures };
  } catch (error) {
    failures.push({ stage: "json", error: String(error) });
    return { payload: null, failures };
  }
}

const projectFiles = walk(root).filter(
  (file) => !file.split(path.sep).some((part) => ignoredDirectories.has(part))
);
const dotPrefixedPaths = projectFiles
  .map((file) => path.relative(root, file))
  .filter((relative) =>
    relative.split(path.sep).some((part) => part.startsWith("."))
  );
const sourceFiles = walk(srcRoot).filter((file) =>
  /\.(?:ts|tsx|js|jsx)$/.test(file)
);
const importPattern =
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g;
const missingImports = [];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  let match;
  while ((match = importPattern.exec(text))) {
    if (!resolveRelativeImport(file, match[1])) {
      missingImports.push({
        file: path.relative(root, file),
        specifier: match[1],
      });
    }
  }
}

const jsonFiles = walk(dataRoot).filter((file) => file.endsWith(".json"));
const malformedJson = [];
const emptyJson = [];
const parsedJson = new Map();
for (const file of jsonFiles) {
  const text = fs.readFileSync(file, "utf8").trim();
  if (!text) {
    emptyJson.push(path.relative(root, file));
    continue;
  }
  try {
    parsedJson.set(file, JSON.parse(text));
  } catch (error) {
    malformedJson.push({
      file: path.relative(root, file),
      error: String(error),
    });
  }
}

const manifest = readJson("manifest.json");
const quality = readJson("quality-report.json");
const catalog = readJson("catalog.json");
const mapIndex = readJson("map-index.json");
const coverage = readJson("framework-coverage.json");
const bundleIndex = readJson("bundle-index.json");
const sourceRegistryPath = path.join(dataRoot, "source-registry.json");
const bundlesDir = path.join(dataRoot, "bundles");
const oldElementsDir = path.join(dataRoot, "elements");

const expectedShardUrls = new Set(bundleIndex.shards.map((row) => row.url));
const actualShardFiles = fs.existsSync(bundlesDir)
  ? fs
      .readdirSync(bundlesDir)
      .filter((name) => fs.statSync(path.join(bundlesDir, name)).isFile())
  : [];
const actualShardUrls = new Set(
  actualShardFiles.map((name) => `/data/vietnam/v1/bundles/${name}`)
);
const missingShards = [...expectedShardUrls].filter(
  (url) => !actualShardUrls.has(url)
);
const unreferencedShards = [...actualShardUrls].filter(
  (url) => !expectedShardUrls.has(url)
);
const checksumMismatches = [];
const elementAssignments = new Map();
const restrictedRawFields = [];
let observationCount = 0;
let entityCount = 0;
let metadataCount = 0;

for (const shardInfo of bundleIndex.shards) {
  const file = path.join(root, "public", shardInfo.url.replace(/^\//, ""));
  if (!fs.existsSync(file)) continue;
  const verified = readVerifiedShard(file, shardInfo);
  if (verified.failures.length > 0) {
    checksumMismatches.push({
      shardId: shardInfo.shardId,
      failures: verified.failures,
    });
  }
  const payload = verified.payload;
  if (!payload) continue;
  for (const elementId of payload.elementIds || []) {
    elementAssignments.set(
      elementId,
      (elementAssignments.get(elementId) || 0) + 1
    );
    const item = payload.elements?.[elementId];
    if (!item) continue;
    const observations = item.observations?.records || [];
    const entities = item.entities?.records || [];
    const indicators = item.meta?.indicators || [];
    observationCount += observations.length;
    entityCount += entities.length;
    metadataCount += indicators.length;
    for (const record of observations) {
      if (
        record.rightsStatus === "display-limited" &&
        record.rawValue != null
      ) {
        restrictedRawFields.push({
          shardId: shardInfo.shardId,
          recordId: record.recordId,
          field: "rawValue",
        });
      }
    }
    for (const record of entities) {
      if (
        record.rightsStatus === "display-limited" &&
        record.rawAttributes &&
        Object.keys(record.rawAttributes).length > 0
      ) {
        restrictedRawFields.push({
          shardId: shardInfo.shardId,
          recordId: record.recordId,
          field: "rawAttributes",
        });
      }
    }
  }
}

const missingElementAssignments = Object.keys(bundleIndex.elements).filter(
  (elementId) => !elementAssignments.has(elementId)
);
const duplicatedElementAssignments = [...elementAssignments.entries()].filter(
  ([, count]) => count !== 1
);
const d015Entry = bundleIndex.elements?.["D-015"];
let d015 = null;
if (d015Entry) {
  const file = path.join(root, "public", d015Entry.shardUrl.replace(/^\//, ""));
  if (fs.existsSync(file)) {
    const verified = readVerifiedShard(file, d015Entry);
    d015 = verified.payload?.elements?.["D-015"] || null;
  }
}

const allScannableFiles = [...sourceFiles, ...jsonFiles];
const oldElementUrlReferences = [];
for (const file of allScannableFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (text.includes("/data/vietnam/v1/elements/")) {
    oldElementUrlReferences.push(path.relative(root, file));
  }
}

const compatibilityPath = path.join(
  srcRoot,
  "data",
  "cooperation",
  "publicDetailCopyV120.ts"
);
const compatibilityText = fs.existsSync(compatibilityPath)
  ? fs.readFileSync(compatibilityPath, "utf8")
  : "";
const requiredExports = [
  "PUBLIC_DETAIL_BANNED_VISIBLE_TERMS_V120",
  "PUBLIC_DETAIL_COMMON_UI_COPY_V120",
  "PUBLIC_DETAIL_COPY_DEFINITIONS_V120",
  "PUBLIC_DETAIL_COPY_SUMMARY_V120",
  "PUBLIC_DETAIL_RUNTIME_POLICY_V120",
];
const actualRouteFiles = [
  "pages/DataExplorerPage.tsx",
  "pages/CountryDataElementPage.tsx",
  "pages/RealMapExplorerPage.tsx",
  "pages/DownloadPage.tsx",
  "pages/CountryComparePage.tsx",
].map((relative) => path.join(srcRoot, relative));
const demoImportPattern =
  /from\s+["'][^"']*(?:vietnamDemo|vietnamExplorer|DatasetExamplePreview|VietnamElementPreview|VietnamDataSpecificPreview)[^"']*["']/i;
const actualRouteDemoImports = actualRouteFiles
  .filter((file) => demoImportPattern.test(fs.readFileSync(file, "utf8")))
  .map((file) => path.relative(root, file));

const finalProjectFileCount = projectFiles.length;
const codesandboxLimit = 500;
const codesandboxFileHeadroom = codesandboxLimit - finalProjectFileCount;
const checks = {
  schemaVersionV121:
    manifest.schemaVersion === "v121" && quality.schemaVersion === "v121",
  assetLayoutSharded:
    manifest.assetLayoutVersion === "sharded-element-bundles-v1" &&
    bundleIndex.assetLayoutVersion === "sharded-element-bundles-v1",
  compatibilityModulePresent: fs.existsSync(compatibilityPath),
  compatibilityExports5: requiredExports.every((name) =>
    compatibilityText.includes(name)
  ),
  unresolvedRelativeImports0: missingImports.length === 0,
  malformedJson0: malformedJson.length === 0,
  emptyJson0: emptyJson.length === 0,
  dotPrefixedPaths0: dotPrefixedPaths.length === 0,
  finalProjectFiles440OrLess: finalProjectFileCount <= 440,
  codesandboxHeadroom60OrMore: codesandboxFileHeadroom >= 60,
  oldElementsDirectoryRemoved: !fs.existsSync(oldElementsDir),
  oldElementUrlReferences0: oldElementUrlReferences.length === 0,
  sourceRegistryNonEmpty:
    fs.existsSync(sourceRegistryPath) &&
    fs.statSync(sourceRegistryPath).size > 0,
  workbookFiles149: manifest.workbookFiles === 149,
  frameworkElements152: manifest.frameworkElements === 152,
  accountedElements152:
    manifest.accountedElements === 152 && manifest.unexplainedElements === 0,
  catalogElements152: catalog.elements?.length === 152,
  coverageElements152: coverage.elements?.length === 152,
  bundleIndexElements152:
    bundleIndex.elementCount === 152 &&
    Object.keys(bundleIndex.elements || {}).length === 152,
  shardCount19:
    bundleIndex.shardCount === 19 && bundleIndex.shards?.length === 19,
  gzipBase64Transport:
    bundleIndex.transportEncoding === "gzip-base64-v1" &&
    bundleIndex.shards?.every(
      (row) =>
        row.encoding === "gzip-base64-v1" &&
        row.url.endsWith(".vnb64") &&
        row.byteSize > 0 &&
        row.byteSize <= 400000
    ),
  shardFilesComplete:
    missingShards.length === 0 && unreferencedShards.length === 0,
  shardChecksums0: checksumMismatches.length === 0,
  elementAssignmentsComplete:
    missingElementAssignments.length === 0 &&
    duplicatedElementAssignments.length === 0,
  publicObservations32128: observationCount === 32128,
  publicEntities5305: entityCount === 5305,
  metadata7390: metadataCount === 7390,
  rowBalance:
    observationCount + entityCount + metadataCount ===
      manifest.rawRows.total -
        manifest.loadStatusCounts["metadata-only"] -
        manifest.loadStatusCounts.quarantined &&
    bundleIndex.totals.rawSourceRows.total === manifest.rawRows.total &&
    bundleIndex.totals.nonPublicRecordRows.total ===
      manifest.loadStatusCounts["metadata-only"] +
        manifest.loadStatusCounts.quarantined &&
    manifest.rowBalance?.matches === true &&
    quality.summary?.originalDataRows === quality.summary?.processedRows,
  provenanceMissing0: quality.summary?.provenanceMissing === 0,
  nullToZero0: quality.summary?.nullToZeroConversions === 0,
  duplicateRecordIds0: quality.summary?.duplicateRecordIds === 0,
  d015LoadReady:
    d015?.meta?.element?.elementId === "D-015" &&
    d015?.observations?.recordCount === 9 &&
    d015?.entities?.recordCount === 650,
  mapFeatures1917:
    mapIndex.layers?.reduce(
      (sum, row) => sum + Number(row.featureCount || 0),
      0
    ) === 1917,
  mapLayers5: mapIndex.layers?.length === 5,
  mapAssetRefs5: mapIndex.layers?.every(
    (row) =>
      row.assetRef?.provider === "vietnam-v121" &&
      row.assetRef?.elementId === row.elementId &&
      row.assetRef?.section === "entities"
  ),
  a024NoSyntheticLine: quality.checks?.a024NoSyntheticLine === true,
  b012RestrictedNotMapped:
    quality.checks?.b012RestrictedNotInMapPayload === true,
  rightsGate: quality.checks?.publicAssetsRightsGated === true,
  restrictedRawFields0:
    restrictedRawFields.length === 0 &&
    quality.checks?.restrictedRawFieldsOmitted === true,
  actualRouteDemoImports0: actualRouteDemoImports.length === 0,
};
const failed = Object.entries(checks)
  .filter(([, pass]) => !pass)
  .map(([name]) => name);
const result = {
  schemaVersion: "v121",
  assetLayoutVersion: "sharded-element-bundles-v1",
  generatedAt: new Date().toISOString(),
  status: failed.length === 0 ? "PASS" : "FAIL",
  checks,
  facts: {
    finalProjectFileCount,
    codesandboxLimit,
    codesandboxFileHeadroom,
    sourceFiles: sourceFiles.length,
    jsonFiles: jsonFiles.length,
    shardFiles: actualShardFiles.length,
    bundleIndexElements: Object.keys(bundleIndex.elements || {}).length,
    observationCount,
    entityCount,
    metadataCount,
    missingImports,
    malformedJson,
    emptyJson,
    dotPrefixedPaths,
    missingShards,
    unreferencedShards,
    checksumMismatches,
    missingElementAssignments,
    duplicatedElementAssignments,
    oldElementUrlReferences,
    actualRouteDemoImports,
    restrictedRawFields,
  },
  failed,
};
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exitCode = 1;
