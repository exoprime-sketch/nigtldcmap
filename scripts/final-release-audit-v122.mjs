import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const srcRoot = path.join(root, "src");
const publicRoot = path.join(root, "public");
const dataRoot = path.join(publicRoot, "data", "vietnam", "v1");
const packsRoot = path.join(dataRoot, "packs-r2");
const allowedExtensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".css"];
const ignoredDirectories = new Set(["node_modules", "build", ".git"]);
const publicPageRelatives = [
  "pages/DataExplorerPage.tsx",
  "pages/CountryDataElementPage.tsx",
  "pages/RealMapExplorerPage.tsx",
  "pages/DownloadPage.tsx",
  "pages/CountryComparePage.tsx",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function isDotPrefixed(relativePath) {
  return relativePath.split("/").some((part) => part.startsWith("."));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function publicFileFromUrl(url) {
  return path.join(publicRoot, String(url).replace(/^\//, ""));
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

function verifyEnvelope(url, expectedType) {
  const file = publicFileFromUrl(url);
  const failures = [];
  if (!fs.existsSync(file)) {
    return {
      url,
      file,
      payload: null,
      envelope: null,
      fileByteSize: 0,
      failures: [{ stage: "missing" }],
    };
  }
  const fileBytes = fs.readFileSync(file);
  if (fileBytes.length === 0) {
    return {
      url,
      file,
      payload: null,
      envelope: null,
      fileByteSize: 0,
      failures: [{ stage: "empty" }],
    };
  }
  const text = fileBytes.toString("utf8");
  if (/^\s*(?:<!doctype html|<html)/i.test(text)) {
    return {
      url,
      file,
      payload: null,
      envelope: null,
      fileByteSize: fileBytes.length,
      failures: [{ stage: "html-fallback" }],
    };
  }

  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch (error) {
    return {
      url,
      file,
      payload: null,
      envelope: null,
      fileByteSize: fileBytes.length,
      failures: [{ stage: "envelope-json", error: String(error) }],
    };
  }

  if (
    envelope.schemaVersion !== "v121" ||
    envelope.runtimeVersion !== "v121r2-json-envelope" ||
    envelope.transportEncoding !== "gzip-base64-chunks-v2" ||
    envelope.resourceType !== expectedType ||
    !Array.isArray(envelope.payloadChunks) ||
    envelope.payloadChunks.length === 0 ||
    envelope.payloadChunkCount !== envelope.payloadChunks.length
  ) {
    failures.push({ stage: "envelope-schema" });
  }

  const invalidChunks = (envelope.payloadChunks || []).filter(
    (chunk) =>
      typeof chunk !== "string" ||
      chunk.length === 0 ||
      chunk.length > 8192 ||
      chunk.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(chunk)
  );
  if (invalidChunks.length > 0) {
    failures.push({ stage: "payload-chunks", count: invalidChunks.length });
  }

  let compressed = Buffer.alloc(0);
  try {
    compressed = Buffer.concat(
      (envelope.payloadChunks || []).map((chunk) =>
        Buffer.from(chunk, "base64")
      )
    );
  } catch (error) {
    failures.push({ stage: "base64", error: String(error) });
  }

  if (compressed.length !== envelope.compressedByteSize) {
    failures.push({
      stage: "compressed-size",
      actual: compressed.length,
      expected: envelope.compressedByteSize,
    });
  }
  const compressedHash = sha256Buffer(compressed);
  if (compressedHash !== envelope.compressedSha256) {
    failures.push({
      stage: "compressed-hash",
      actual: compressedHash,
      expected: envelope.compressedSha256,
    });
  }

  let content = Buffer.alloc(0);
  try {
    content = zlib.gunzipSync(compressed);
  } catch (error) {
    failures.push({ stage: "decompression", error: String(error) });
  }
  if (content.length !== envelope.contentByteSize) {
    failures.push({
      stage: "content-size",
      actual: content.length,
      expected: envelope.contentByteSize,
    });
  }
  const contentHash = sha256Buffer(content);
  if (contentHash !== envelope.contentSha256) {
    failures.push({
      stage: "content-hash",
      actual: contentHash,
      expected: envelope.contentSha256,
    });
  }

  let payload = null;
  try {
    payload = JSON.parse(content.toString("utf8"));
  } catch (error) {
    failures.push({ stage: "content-json", error: String(error) });
  }

  return {
    url,
    file,
    fileByteSize: fileBytes.length,
    envelope,
    payload,
    compressedByteSize: compressed.length,
    contentByteSize: content.length,
    failures,
  };
}

function extractCdpClasses(text) {
  return new Set(text.match(/\bcdp-[a-z0-9_-]+\b/g) || []);
}

function countTextMatches(text, patterns) {
  return patterns.flatMap((pattern) => {
    const regex =
      pattern instanceof RegExp
        ? new RegExp(
            pattern.source,
            pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
          )
        : null;
    if (regex) {
      return [...text.matchAll(regex)].map((match) => ({
        pattern: String(pattern),
        match: match[0],
      }));
    }
    return text.includes(pattern) ? [{ pattern, match: pattern }] : [];
  });
}

const allProjectFiles = walk(root).filter(
  (file) => !file.split(path.sep).some((part) => ignoredDirectories.has(part))
);
const projectRelativeFiles = allProjectFiles.map(relative);
const dotPrefixedPaths = projectRelativeFiles.filter(isDotPrefixed);
const codeSandboxFiles = projectRelativeFiles.filter(
  (file) => !isDotPrefixed(file)
);
const sourceFiles = walk(srcRoot).filter((file) =>
  /\.(?:ts|tsx|js|jsx)$/.test(file)
);
const publicJsonFiles = walk(publicRoot).filter((file) =>
  file.endsWith(".json")
);

const importPattern =
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/g;
const missingImports = [];
for (const file of sourceFiles) {
  const text = readText(file);
  let match;
  while ((match = importPattern.exec(text))) {
    if (!resolveRelativeImport(file, match[1])) {
      missingImports.push({ file: relative(file), specifier: match[1] });
    }
  }
}

const malformedJson = [];
const emptyJson = [];
const htmlSavedAsJson = [];
for (const file of publicJsonFiles) {
  const bytes = fs.readFileSync(file);
  const text = bytes.toString("utf8");
  if (!text.trim()) {
    emptyJson.push(relative(file));
    continue;
  }
  if (/^\s*(?:<!doctype html|<html)/i.test(text)) {
    htmlSavedAsJson.push(relative(file));
    continue;
  }
  try {
    JSON.parse(text);
  } catch (error) {
    malformedJson.push({ file: relative(file), error: String(error) });
  }
}

const manifest = readJson(path.join(dataRoot, "manifest.json"));
const quality = readJson(path.join(dataRoot, "quality-report.json"));
const catalog = readJson(path.join(dataRoot, "catalog.json"));
const mapIndex = readJson(path.join(dataRoot, "map-index.json"));
const coverage = readJson(path.join(dataRoot, "framework-coverage.json"));
const integrity = readJson(path.join(dataRoot, "asset-integrity.json"));
const bundleIndex = readJson(path.join(packsRoot, "bundle-index-v121r2.json"));

const expectedPackUrls = new Set(
  (bundleIndex.packs || []).map((row) => row.packUrl)
);
const actualElementPackUrls = new Set(
  fs.existsSync(packsRoot)
    ? fs
        .readdirSync(packsRoot)
        .filter((name) => /^vnm-pack-.*\.json$/.test(name))
        .map((name) => `/data/vietnam/v1/packs-r2/${name}`)
    : []
);
const missingPacks = [...expectedPackUrls].filter(
  (url) => !actualElementPackUrls.has(url)
);
const unreferencedPacks = [...actualElementPackUrls].filter(
  (url) => !expectedPackUrls.has(url)
);

const packResults = [];
const packFailures = [];
const elementAssignments = new Map();
const recordIds = new Set();
const duplicateRecordIds = [];
const restrictedRawFields = [];
const provenanceMissing = [];
let metadataCount = 0;
let observationCount = 0;
let entityCount = 0;
let downloadableRecordCount = 0;
let d015 = null;

for (const packInfo of bundleIndex.packs || []) {
  const verified = verifyEnvelope(packInfo.packUrl, "element-shard");
  packResults.push({
    shardId: packInfo.shardId,
    packUrl: packInfo.packUrl,
    fileByteSize: verified.fileByteSize,
    failures: verified.failures,
  });
  if (verified.failures.length > 0) {
    packFailures.push({
      shardId: packInfo.shardId,
      packUrl: packInfo.packUrl,
      failures: verified.failures,
    });
  }
  const envelope = verified.envelope;
  if (
    envelope &&
    (envelope.shardId !== packInfo.shardId ||
      envelope.compressedByteSize !== packInfo.compressedByteSize ||
      envelope.compressedSha256 !== packInfo.compressedSha256 ||
      envelope.contentByteSize !== packInfo.contentByteSize ||
      envelope.contentSha256 !== packInfo.contentSha256)
  ) {
    packFailures.push({
      shardId: packInfo.shardId,
      packUrl: packInfo.packUrl,
      failures: [{ stage: "index-envelope-mismatch" }],
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
    const metadataRows = item.meta?.indicators || [];
    const observations = item.observations?.records || [];
    const entities = item.entities?.records || [];
    metadataCount += metadataRows.length;
    observationCount += observations.length;
    entityCount += entities.length;
    if (elementId === "D-015") d015 = item;

    for (const record of [...observations, ...entities]) {
      if (recordIds.has(record.recordId))
        duplicateRecordIds.push(record.recordId);
      recordIds.add(record.recordId);
      if (!record.provenance) provenanceMissing.push(record.recordId);
      if (record.downloadEligible === true) downloadableRecordCount += 1;
    }
    for (const record of observations) {
      if (
        record.rightsStatus === "display-limited" &&
        record.rawValue != null
      ) {
        restrictedRawFields.push({
          elementId,
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
          elementId,
          recordId: record.recordId,
          field: "rawAttributes",
        });
      }
    }
  }
}

const missingElementAssignments = Object.keys(
  bundleIndex.elements || {}
).filter((id) => !elementAssignments.has(id));
const duplicatedElementAssignments = [...elementAssignments.entries()].filter(
  ([, count]) => count !== 1
);

const sourceUrls = Array.isArray(manifest.assets.sourceRegistry)
  ? manifest.assets.sourceRegistry
  : [manifest.assets.sourceRegistry];
const searchUrls = Array.isArray(manifest.assets.searchIndex)
  ? manifest.assets.searchIndex
  : [manifest.assets.searchIndex];
const sourceResults = sourceUrls
  .filter(Boolean)
  .map((url) => verifyEnvelope(url, "source-registry"));
const searchResults = searchUrls
  .filter(Boolean)
  .map((url) => verifyEnvelope(url, "search-index"));
const auxiliaryEnvelopeFailures = [
  ...sourceResults.flatMap((row) => row.failures),
  ...searchResults.flatMap((row) => row.failures),
];
const sourceRegistryRecordCount = sourceResults.reduce(
  (sum, row) =>
    sum +
    Number(
      row.payload?.recordCount ||
        row.payload?.records?.length ||
        row.payload?.sources?.length ||
        0
    ),
  0
);
const searchRows = searchResults.flatMap((row) => row.payload?.elements || []);
const searchInternalCodeMatches = searchRows.filter((row) =>
  /\b[A-E]-\d{3}\b/.test(
    `${row.publicSlug || ""} ${row.searchText || ""} ${(
      row.keywords || []
    ).join(" ")}`
  )
);

const publicPageFiles = publicPageRelatives.map((file) =>
  path.join(srcRoot, file)
);
const publicPageText = publicPageFiles.map(readText).join("\n");
const elementDetailText = readText(
  path.join(srcRoot, "pages", "CountryDataElementPage.tsx")
);
const appText = readText(path.join(srcRoot, "App.tsx"));
const mapTypeText = readText(path.join(srcRoot, "types", "map.ts"));
const mapPageText = readText(
  path.join(srcRoot, "pages", "RealMapExplorerPage.tsx")
);
const downloadPageText = readText(
  path.join(srcRoot, "pages", "DownloadPage.tsx")
);
const providerRegistryText = readText(
  path.join(srcRoot, "data", "countries", "countryDataProviderRegistryV122.ts")
);
const providerFacadeText = readText(
  path.join(srcRoot, "data", "countries", "countryDataFacadeV122.ts")
);
const providerTypesText = readText(
  path.join(srcRoot, "data", "countries", "countryDataTypesV122.ts")
);
const cssFile = path.join(srcRoot, "styles", "country-data-platform-v122.css");
const cssText = readText(cssFile);

const mapStyleIdsThatAreNotCssClasses = new Set([
  "cdp-base-background",
  "cdp-country-fill",
  "cdp-country-outline",
  "cdp-country-selected-fill",
  "cdp-country-selected-outline",
  "cdp-country-boundaries",
  "cdp-fallback-water",
  "cdp-fallback-shadow",
]);
const usedCdpClasses = new Set(
  publicPageFiles
    .flatMap((file) => [...extractCdpClasses(readText(file))])
    .filter((className) => !mapStyleIdsThatAreNotCssClasses.has(className))
);
const definedCdpClasses = extractCdpClasses(cssText);
const usedButUndefinedCssClasses = [...usedCdpClasses].filter(
  (className) => !definedCdpClasses.has(className)
);

const bannedPublicLiterals = [
  "베트남 데이터 지도",
  "베트남 전체보기",
  "베트남 국가정보",
  "베트남 실제 시계열",
  "VIETNAM ACTUAL DATA",
  "ACTUAL DATA DOWNLOAD",
  "VIETNAM ACTUAL MAP",
  "파일크기 불일치",
  "SHA-256 불일치",
  "HTML fallback",
  "DecompressionStream",
  "bundle index",
  "공개 레코드",
  "베트남 149개 원자료 파일과 152개 데이터 요소를 연결했습니다",
  "검증된 좌표가 있는 데이터만 표시합니다",
  "지도에서 실제 위치를 선택하면 원자료에 수록된 속성만 표시합니다",
  "데이터 한계",
  "출처·유의사항",
];
const bannedPublicLiteralHits = bannedPublicLiterals.filter((term) =>
  publicPageText.includes(term)
);
const removedExplorerFilterLabels = [
  "데이터 상태",
  "데이터 유형",
  "공간단위",
  "다운로드 가능 여부",
  "지도표현",
];
const explorerText = readText(
  path.join(srcRoot, "pages", "DataExplorerPage.tsx")
);
const removedExplorerFilterHits = removedExplorerFilterLabels.filter((term) =>
  explorerText.includes(`>${term}<`)
);
const publicMethodologyTokens = [
  "item.caveat",
  "item.missingNote",
  "row.note",
  "데이터 한계",
  "출처·유의사항",
];
const publicMethodologyTokenHits = publicMethodologyTokens.filter((term) =>
  elementDetailText.includes(term)
);
const multiSeriesChartReady =
  elementDetailText.includes("smoothMonotonePathV122") &&
  elementDetailText.includes("buildChartGroupsV122") &&
  elementDetailText.includes("CHART_SERIES_COLORS_V122") &&
  elementDetailText.includes('className="cdp-chart-legend"') &&
  elementDetailText.includes('className="cdp-chart-tooltip"') &&
  elementDetailText.includes("onPointerEnter") &&
  !elementDetailText.includes("<polyline");
const chartCssReady = [
  ".cdp-chart-groups",
  ".cdp-chart-legend",
  ".cdp-chart__series.is-muted",
  ".cdp-chart__hit-line",
  ".cdp-chart-tooltip",
].every((selector) => cssText.includes(selector));

const commonPageCountryHardcodes = countTextMatches(publicPageText, [
  "베트남 데이터 지도",
  "베트남 전체보기",
  "베트남 국가정보",
  "베트남 실제 시계열",
]);
const hardcodedVnmPublicActionPatterns = [
  /onOpen(?:Element|MapElement|Download)\([^\n]*["']VNM["']/g,
  /countryIso3\s*:\s*["']VNM["']/g,
  /setDownloadCountryIso3\(["']VNM["']\)/g,
  /setSelectedCountryIso3\(["']VNM["']\)/g,
  /\ball\s*\?\s*["']VNM["']/g,
];
const hardcodedVnmPublicActions = countTextMatches(
  `${appText}\n${publicPageText}`,
  hardcodedVnmPublicActionPatterns
);

const directVietnamLoaderImports = publicPageFiles.flatMap((file) => {
  const text = readText(file);
  return [
    ...text.matchAll(
      /from\s+["'][^"']*data\/vietnam\/vietnamDataLoaderV121["']/g
    ),
  ].map((match) => ({ file: relative(file), match: match[0] }));
});

const runtimeScanFiles = [...sourceFiles, ...publicJsonFiles].filter(
  (file) => !relative(file).startsWith("scripts/")
);
const oldRuntimeReferences = [];
for (const file of runtimeScanFiles) {
  const text = readText(file);
  const matches = [];
  if (text.includes(".vnb64")) matches.push(".vnb64");
  if (text.includes("/data/vietnam/v1/bundles/")) matches.push("/bundles/");
  if (/vnm-v121-shard-\d+\.json/.test(text)) matches.push("old-json-shard");
  if (text.includes("gzip-base64-v1")) matches.push("gzip-base64-v1");
  if (matches.length > 0)
    oldRuntimeReferences.push({ file: relative(file), matches });
}

const allReferencedAssetUrls = new Set();
const assetUrlPattern = /["'](\/data\/[^"']+?\.json)["']/g;
for (const file of [...sourceFiles, ...publicJsonFiles]) {
  const text = readText(file);
  for (const match of text.matchAll(assetUrlPattern)) {
    allReferencedAssetUrls.add(match[1]);
  }
}
const missingReferencedAssets = [...allReferencedAssetUrls]
  .filter((url) => !fs.existsSync(publicFileFromUrl(url)))
  .sort();

const mapDefaultFlags = (mapIndex.layers || []).filter(
  (layer) => layer.defaultPrimary === true || layer.defaultOverlay === true
);
const mapBaseConfigured =
  mapPageText.includes("const MAP_STYLE") &&
  mapPageText.includes("/data/world-countries.geojson") &&
  mapPageText.includes("new maplibregl.Map") &&
  mapPageText.includes("try {") &&
  mapPageText.includes('map.on("load"') &&
  mapPageText.includes('map.on("style.load"') &&
  mapPageText.includes('map.on("error"') &&
  mapPageText.includes("new ResizeObserver");
const mapOfflineFallbackReady =
  mapPageText.includes("geometryToFallbackPath") &&
  mapPageText.includes("fallbackBoundaryStatus") &&
  mapPageText.includes('className="cdp-map-fallback"') &&
  mapPageText.includes("/data/world-countries.geojson") &&
  cssText.includes(".cdp-map-fallback") &&
  cssText.includes(".cdp-map-canvas.is-suspended");
const mapExternalTileDependency0 =
  !mapPageText.includes("tile.openstreetmap.org") &&
  !mapPageText.includes("tiles.openfreemap.org");
const mapGlyphDependency0 =
  !mapPageText.includes('type: "symbol"') &&
  !mapPageText.includes('"text-field"');
const mapDefaultActiveLayers0 =
  mapDefaultFlags.length === 0 &&
  mapTypeText.includes("activeLayerKeys: []") &&
  !mapPageText.includes("nextLayers[0]") &&
  !mapPageText.includes("defaultPrimary") &&
  !mapPageText.includes("defaultOverlay");
const mapPublicSlugContract =
  appText.includes("publicMapStateKeyV122") &&
  appText.includes("publicCountryElementTokenV122") &&
  mapTypeText.includes("resolveCountryElementIdV122") &&
  !mapTypeText.includes("resolveElementIdAcrossProvidersV122");
const mapOpenActionActivatesLayer =
  /function\s+openElementOnMap[\s\S]*?activeLayerKeys:\s*\[elementId\][\s\S]*?focusLayerKey:\s*elementId/.test(
    appText
  );
const mapStateRestoresMultipleLayers =
  mapPageText.includes("initialState.activeLayerKeys.filter") &&
  mapPageText.includes("sameStringArray") &&
  mapPageText.includes("externalActiveLayerKey");

const providerFilePaths = [
  "src/data/countries/countryDataTypesV122.ts",
  "src/data/countries/countryDataProviderRegistryV122.ts",
  "src/data/countries/countryDataFacadeV122.ts",
  "src/data/countries/vietnamCountryDataProviderV122.ts",
];
const providerFilesPresent = providerFilePaths.every((file) =>
  fs.existsSync(path.join(root, file))
);
const registeredProviderCount =
  (providerRegistryText.match(/VietnamCountryDataProviderV122/g) || []).length >
  0
    ? 1
    : 0;
const providerContractPresent =
  providerTypesText.includes("export interface CountryDataProviderV122") &&
  providerFacadeText.includes("loadCatalogForCountrySelectionV122") &&
  providerFacadeText.includes("loadCountryMapIndexV122") &&
  providerFacadeText.includes("loadCountryElementBundleV122");
const allSelectionAggregatesProviders =
  providerFacadeText.includes('normalized === "ALL"') &&
  providerFacadeText.includes("listCountryDataProvidersV122()") &&
  !providerFacadeText.includes('normalized === "ALL" ? "VNM"');

const hardcodedVietnamFilename = /vietnam_\$?\{|vietnam_[a-z0-9]/i.test(
  downloadPageText
);
const downloadRightsGatePresent =
  downloadPageText.includes('redistributionAllowed === "가능"') &&
  downloadPageText.includes('downloadAllowed === "가능"') &&
  downloadPageText.includes("row.downloadEligible");
const downloadEmptyFileBlocked =
  downloadPageText.includes("선택한 조건에 맞는 다운로드 자료가 없습니다") ||
  downloadPageText.includes("다운로드할 수 있는 레코드가 없습니다") ||
  downloadPageText.includes("다운로드할 데이터가 없습니다");
const dynamicDownloadFilename =
  downloadPageText.includes("countryPublicSlug") &&
  downloadPageText.includes("safePublicFilenamePartV122");

const finalProjectFileCount = codeSandboxFiles.length;
const codesandboxLimit = 500;
const codesandboxFileHeadroom = codesandboxLimit - finalProjectFileCount;
const expectedFinalCount = Number(integrity.finalProjectFileCount || 0);
const expectedHeadroom = Number(integrity.codesandboxFileHeadroom || 0);

const checks = {
  platformReleaseV122:
    manifest.platformRelease === "v122" &&
    mapIndex.platformRelease === "v122" &&
    providerTypesText.includes('PLATFORM_RELEASE_V122 = "v122"'),
  dataSchemaVersionV121:
    manifest.schemaVersion === "v121" &&
    manifest.dataSchemaVersion === "v121" &&
    quality.schemaVersion === "v121",
  countryRuntimeV1:
    manifest.countryRuntimeVersion === "country-data-runtime-v1" &&
    providerTypesText.includes('"country-data-runtime-v1"'),
  runtimeVersionR2:
    manifest.runtimeVersion === "v121r2-json-envelope" &&
    bundleIndex.runtimeVersion === "v121r2-json-envelope",
  assetLayoutR2:
    manifest.assetLayoutVersion === "gzip-base64-json-envelope-v2" &&
    bundleIndex.assetLayoutVersion === "gzip-base64-json-envelope-v2",
  manifestIndexLoaderContract:
    manifest.assets.bundleIndex ===
      "/data/vietnam/v1/packs-r2/bundle-index-v121r2.json" &&
    fs.existsSync(path.join(packsRoot, "bundle-index-v121r2.json")) &&
    readText(
      path.join(srcRoot, "data", "vietnam", "vietnamDataLoaderV121.ts")
    ).includes("/data/vietnam/v1/packs-r2/bundle-index-v121r2.json"),
  referencedAssetsExist: missingReferencedAssets.length === 0,
  unresolvedRelativeImports0: missingImports.length === 0,
  malformedJson0: malformedJson.length === 0,
  emptyJson0: emptyJson.length === 0,
  htmlSavedAsJson0: htmlSavedAsJson.length === 0,
  finalProjectFiles440OrLess: finalProjectFileCount <= 440,
  finalProjectFiles450OrLess: finalProjectFileCount <= 450,
  codesandboxHeadroom60OrMore: codesandboxFileHeadroom >= 60,
  integrityFileCountMatches:
    expectedFinalCount === finalProjectFileCount &&
    expectedHeadroom === codesandboxFileHeadroom,
  oldRuntimeReferences0: oldRuntimeReferences.length === 0,
  workbookFiles149: manifest.workbookFiles === 149,
  frameworkElements152: manifest.frameworkElements === 152,
  accountedElements152:
    manifest.accountedElements === 152 && manifest.unexplainedElements === 0,
  catalogElements152: catalog.elements?.length === 152,
  coverageElements152: coverage.elements?.length === 152,
  bundleIndexElements152:
    bundleIndex.elementCount === 152 &&
    Object.keys(bundleIndex.elements || {}).length === 152,
  packCount19: bundleIndex.packCount === 19 && bundleIndex.packs?.length === 19,
  packFilesComplete:
    missingPacks.length === 0 && unreferencedPacks.length === 0,
  packIntegrity0:
    packFailures.length === 0 && auxiliaryEnvelopeFailures.length === 0,
  elementAssignmentsComplete:
    missingElementAssignments.length === 0 &&
    duplicatedElementAssignments.length === 0,
  metadata7390: metadataCount === 7390,
  publicObservations32128: observationCount === 32128,
  publicEntities5305: entityCount === 5305,
  publicRuntimeRows44823:
    metadataCount + observationCount + entityCount === 44823,
  rawRowBalance45582:
    bundleIndex.totals?.rawSourceRows?.total === 45582 &&
    bundleIndex.totals?.nonPublicRecordRows?.total === 759,
  duplicateRecordIds0: duplicateRecordIds.length === 0,
  provenanceMissing0:
    provenanceMissing.length === 0 && quality.summary?.provenanceMissing === 0,
  nullToZero0: quality.summary?.nullToZeroConversions === 0,
  d015LoadReady:
    d015?.meta?.indicators?.length === 10 &&
    d015?.observations?.recordCount === 9 &&
    d015?.entities?.recordCount === 650,
  mapLayers13: mapIndex.layers?.length === 13,
  mapFeatures3020:
    mapIndex.layers?.reduce(
      (sum, row) => sum + Number(row.featureCount || 0),
      0
    ) === 3020,
  spatialRegistry152: mapIndex.spatialRegistry?.length === 152,
  spatialRegistryUnassigned0:
    Number(mapIndex.registrySummary?.unassigned || 0) === 0,
  mapPublishedLayers13:
    Number(mapIndex.registrySummary?.publishedLayers || 0) === 13,
  nationalSpatialFabrication0:
    mapIndex.policies?.nationalAggregationSpatialFabrication === false &&
    mapIndex.policies?.rasterFromNationalSummary === false &&
    mapIndex.policies?.conceptualCoordinatesAsFacilities === false,
  mapBaseConfigured,
  mapOfflineFallbackReady,
  mapExternalTileDependency0,
  mapGlyphDependency0,
  mapDefaultActiveLayers0,
  mapPublicSlugContract,
  mapOpenActionActivatesLayer,
  mapStateRestoresMultipleLayers,
  providerFilesPresent,
  providerContractPresent,
  registeredCountryProviders1: registeredProviderCount === 1,
  allSelectionAggregatesProviders,
  directVietnamLoaderImports0: directVietnamLoaderImports.length === 0,
  hardcodedVnmPublicActions0: hardcodedVnmPublicActions.length === 0,
  publicCountryHardcodes0: commonPageCountryHardcodes.length === 0,
  usedButUndefinedCssClasses0: usedButUndefinedCssClasses.length === 0,
  bannedPublicLiterals0: bannedPublicLiteralHits.length === 0,
  publicMethodologyNotes0: publicMethodologyTokenHits.length === 0,
  multiSeriesChartReady,
  chartCssReady,
  removedExplorerFilters0: removedExplorerFilterHits.length === 0,
  rightsGate:
    quality.checks?.publicAssetsRightsGated === true &&
    downloadRightsGatePresent,
  restrictedRawFields0:
    restrictedRawFields.length === 0 &&
    quality.checks?.restrictedRawFieldsOmitted === true,
  sourceRegistryLoaded:
    sourceResults.length === 1 && sourceRegistryRecordCount > 0,
  searchIndexElements152: searchRows.length === 152,
  searchInternalCodes0: searchInternalCodeMatches.length === 0,
  downloadableRecordsPresent: downloadableRecordCount > 0,
  hardcodedVietnamFilename0: !hardcodedVietnamFilename,
  dynamicDownloadFilename,
  downloadEmptyFileBlocked,
};

const failed = Object.entries(checks)
  .filter(([, pass]) => !pass)
  .map(([name]) => name);

const result = {
  platformRelease: "v122",
  dataSchemaVersion: "v121",
  countryRuntimeVersion: "country-data-runtime-v1",
  runtimeVersion: "v121r2-json-envelope",
  assetLayoutVersion: "gzip-base64-json-envelope-v2",
  generatedAt: new Date().toISOString(),
  status: failed.length === 0 ? "PASS" : "FAIL",
  p0Failures: failed.length,
  checks,
  facts: {
    finalProjectFileCount,
    physicalProjectFileCount: allProjectFiles.length,
    dotPrefixedPaths,
    codesandboxLimit,
    codesandboxFileHeadroom,
    publicJsonFiles: publicJsonFiles.length,
    packFiles: actualElementPackUrls.size,
    bundleIndexElements: Object.keys(bundleIndex.elements || {}).length,
    metadataCount,
    observationCount,
    entityCount,
    runtimeRows: metadataCount + observationCount + entityCount,
    sourceRegistryRecordCount,
    searchIndexRows: searchRows.length,
    mapFoundationVersion: mapIndex.mapFoundationVersion || null,
    spatialRegistryElements: mapIndex.spatialRegistry?.length || 0,
    mapLayerCount: mapIndex.layers?.length || 0,
    mapFeatureCount:
      mapIndex.layers?.reduce(
        (sum, row) => sum + Number(row.featureCount || 0),
        0
      ) || 0,
    registeredCountryProviders: registeredProviderCount,
    availableDataCountries: registeredProviderCount ? ["VNM"] : [],
    mapDefaultActiveLayers: mapDefaultFlags.length,
    mapRenderer: "local-maplibre-with-svg-fallback",
    mapExternalTileDependency: false,
    mapGlyphDependency: false,
    downloadableRecordCount,
    missingImports,
    malformedJson,
    emptyJson,
    htmlSavedAsJson,
    missingPacks,
    unreferencedPacks,
    packFailures,
    auxiliaryEnvelopeFailures,
    missingElementAssignments,
    duplicatedElementAssignments,
    duplicateRecordIds,
    provenanceMissing,
    restrictedRawFields,
    missingReferencedAssets,
    oldRuntimeReferences,
    directVietnamLoaderImports,
    hardcodedVnmPublicActions,
    commonPageCountryHardcodes,
    usedCdpClasses: [...usedCdpClasses].sort(),
    definedCdpClasses: [...definedCdpClasses].sort(),
    usedButUndefinedCssClasses,
    bannedPublicLiteralHits,
    publicMethodologyTokenHits,
    multiSeriesChartReady,
    chartCssReady,
    removedExplorerFilterHits,
    searchInternalCodeMatches,
    packResults,
  },
  failed,
};

console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exitCode = 1;
