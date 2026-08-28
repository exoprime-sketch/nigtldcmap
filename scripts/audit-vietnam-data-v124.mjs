#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const V2_ROOT = resolve(PROJECT_ROOT, "public/data/vietnam/v2");
const SOURCE_ZIP = resolve(
  PROJECT_ROOT,
  process.env.VIETNAM_V124_SOURCE_ZIP ||
    "_source/vietnam/v124/vietnam-data(4).zip"
);

const REQUIRED_V2_FILES = [
  "manifest.json",
  "catalog.json",
  "framework-coverage.json",
  "quality-report.json",
  "publication-decisions.json",
  "rights-matrix.json",
  "asset-integrity.json",
  "map-index.json",
];

const checks = [];

function addCheck(name, passed, actual, expected, details = undefined) {
  const entry = {
    type: "check",
    name,
    status: passed ? "PASS" : "FAIL",
    actual,
    expected,
  };
  if (details !== undefined) entry.details = details;
  checks.push(entry);
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  };
  visit(root);
  return files.sort((a, b) => a.localeCompare(b, "en"));
}

function parseJsonFile(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }
  return undefined;
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function findNamedValues(value, names, results = []) {
  if (!value || typeof value !== "object") return results;
  if (Array.isArray(value)) {
    for (const item of value) findNamedValues(item, names, results);
    return results;
  }
  for (const [key, child] of Object.entries(value)) {
    if (names.has(key)) results.push(child);
    if (child && typeof child === "object") {
      findNamedValues(child, names, results);
    }
  }
  return results;
}

function elementArray(document) {
  if (!document || typeof document !== "object") return [];
  if (Array.isArray(document)) {
    return document.filter(
      (item) => item && typeof item === "object" && item.elementId
    );
  }
  if (Array.isArray(document.elements)) return document.elements;
  if (document.elements && typeof document.elements === "object") {
    return Object.values(document.elements).filter(
      (item) => item && typeof item === "object"
    );
  }
  if (Array.isArray(document.items)) {
    return document.items.filter(
      (item) => item && typeof item === "object" && item.elementId
    );
  }
  return [];
}

function countZipWorkbooks(path) {
  if (!existsSync(path)) return { count: 0, error: "source ZIP missing" };
  try {
    const bytes = readFileSync(path);
    const minimumEocdSize = 22;
    const firstPossibleEocd = Math.max(0, bytes.length - 65_535 - minimumEocdSize);
    let eocdOffset = -1;
    for (let offset = bytes.length - minimumEocdSize; offset >= firstPossibleEocd; offset -= 1) {
      if (bytes.readUInt32LE(offset) === 0x06054b50) {
        eocdOffset = offset;
        break;
      }
    }
    if (eocdOffset < 0) return { count: 0, error: "ZIP EOCD missing" };

    const entryCount = bytes.readUInt16LE(eocdOffset + 10);
    let offset = bytes.readUInt32LE(eocdOffset + 16);
    let workbookCount = 0;
    let visitedEntries = 0;
    while (visitedEntries < entryCount) {
      if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) {
        return { count: workbookCount, error: "invalid ZIP central directory" };
      }
      const nameLength = bytes.readUInt16LE(offset + 28);
      const extraLength = bytes.readUInt16LE(offset + 30);
      const commentLength = bytes.readUInt16LE(offset + 32);
      const name = bytes
        .subarray(offset + 46, offset + 46 + nameLength)
        .toString("utf8")
        .normalize("NFC");
      const basename = name.split("/").pop() || "";
      if (/\.xlsx$/iu.test(name) && !basename.startsWith("~$")) workbookCount += 1;
      offset += 46 + nameLength + extraLength + commentLength;
      visitedEntries += 1;
    }
    return { count: workbookCount, entries: entryCount };
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

function collectApprovedIds(document) {
  const ids = new Set();
  const visit = (value, key = "") => {
    if (!value) return;
    if (Array.isArray(value)) {
      if (/approvedElementIds|authorizedElementIds/iu.test(key)) {
        for (const item of value) {
          if (typeof item === "string") ids.add(item);
          else if (item && typeof item.elementId === "string") ids.add(item.elementId);
        }
      } else {
        for (const item of value) visit(item, key);
      }
      return;
    }
    if (typeof value !== "object") return;
    for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
  };
  visit(document);
  return [...ids].sort((a, b) => a.localeCompare(b, "en"));
}

function collectElementRecords(document) {
  const records = new Map();
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value.elementId === "string") {
      const existing = records.get(value.elementId) || [];
      existing.push(value);
      records.set(value.elementId, existing);
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(document);
  return records;
}

function hasBlockingMarker(value, kind) {
  const keyPattern =
    kind === "rights"
      ? /^(rightsBlocked|redistributionBlocked|publicationRightsBlocked)$/iu
      : /^(privacyBlocked|piiRedacted|publicationPrivacyBlocked)$/iu;
  const valuePattern =
    kind === "rights"
      ? /(?:metadata-only-)?rights-blocked|redistribution-blocked/iu
      : /privacy-blocked|pii-redacted/iu;
  let blocked = false;
  const visit = (node, key = "") => {
    if (blocked || node === null || node === undefined) return;
    if (keyPattern.test(key) && (node === true || String(node).toLowerCase() === "true")) {
      blocked = true;
      return;
    }
    if (typeof node === "string" && valuePattern.test(node)) {
      blocked = true;
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item, key);
    } else if (typeof node === "object") {
      for (const [childKey, child] of Object.entries(node)) visit(child, childKey);
    }
  };
  visit(value);
  return blocked;
}

function populatedRows(element) {
  const observations = firstFiniteNumber(
    element.observationCount,
    element.observations?.recordCount,
    element.rowAccounting?.normalizedObservationRows,
    element.counts?.observations
  );
  const entities = firstFiniteNumber(
    element.entityCount,
    element.entities?.recordCount,
    element.rowAccounting?.normalizedEntityRows,
    element.counts?.entities
  );
  if (observations !== undefined || entities !== undefined) {
    return (observations || 0) + (entities || 0);
  }
  return firstFiniteNumber(
    element.populatedRecordCount,
    element.actualRowCount,
    element.dataRowCount,
    element.publicRecordCount
  );
}

function explicitEmptyReason(element) {
  const candidates = [
    element.emptyReason,
    element.dataPresenceReason,
    element.notCollectedReason,
    element.quarantineReason,
    element.reason,
    element.packageReason,
    element.warning,
    element.warnings,
  ];
  return candidates.some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.some((item) => String(item).trim().length > 0);
    return false;
  });
}

function resolveAssetReference(reference) {
  if (typeof reference !== "string" || reference.trim() === "") return null;
  let value = reference.trim().split("#", 1)[0].split("?", 1)[0];
  try {
    if (/^https?:\/\//iu.test(value)) value = new URL(value).pathname;
    value = decodeURIComponent(value);
  } catch {
    return null;
  }
  let candidate;
  if (value.startsWith("/data/")) {
    candidate = resolve(PROJECT_ROOT, "public", value.slice(1));
  } else if (/^public[\\/]/iu.test(value)) {
    candidate = resolve(PROJECT_ROOT, value);
  } else if (/^data[\\/]/iu.test(value)) {
    candidate = resolve(PROJECT_ROOT, "public", value);
  } else {
    candidate = resolve(V2_ROOT, value);
  }
  const rootPrefix = `${PROJECT_ROOT}${sep}`.toLowerCase();
  const normalized = candidate.toLowerCase();
  if (normalized !== PROJECT_ROOT.toLowerCase() && !normalized.startsWith(rootPrefix)) {
    return null;
  }
  return candidate;
}

function collectV2AssetUrls(value, result = new Set()) {
  if (typeof value === "string") {
    if (/^(?:https?:\/\/[^/]+)?\/data\/vietnam\/v2\//iu.test(value)) {
      result.add(value);
    }
    return result;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectV2AssetUrls(item, result);
  } else if (value && typeof value === "object") {
    for (const child of Object.values(value)) collectV2AssetUrls(child, result);
  }
  return result;
}

function collectDownloadReferences(value, result = new Set()) {
  if (typeof value === "string") {
    if (
      /^(?:https?:\/\/[^/]+)?\/data\/vietnam\/v2\/downloads\//iu.test(value) ||
      /^(?:\.\/)?downloads\//iu.test(value)
    ) {
      result.add(value);
    }
    return result;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectDownloadReferences(item, result);
  } else if (value && typeof value === "object") {
    for (const child of Object.values(value)) collectDownloadReferences(child, result);
  }
  return result;
}

function collectIntegrityEntries(document) {
  const entries = [];
  const seen = new Set();
  const looksLikeReference = (value) =>
    typeof value === "string" &&
    (/[/\\]/u.test(value) || /\.[a-z0-9]{1,8}$/iu.test(value));
  const add = (reference, hash) => {
    if (typeof reference !== "string" || typeof hash !== "string") return;
    if (!/^[a-f0-9]{64}$/iu.test(hash.trim())) return;
    const identity = `${reference}\u0000${hash.toLowerCase()}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    entries.push({ reference, sha256: hash.toLowerCase() });
  };
  const visit = (value, parentReference = undefined) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, parentReference);
      return;
    }
    const reference =
      value.url ||
      value.path ||
      value.assetUrl ||
      value.assetPath ||
      value.asset ||
      value.file ||
      value.relativePath ||
      value.href ||
      (looksLikeReference(parentReference) ? parentReference : undefined);
    const hash =
      value.sha256 || value.fileSha256 || value.assetSha256 || value.hash;
    add(reference, hash);
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === "string" && /^[a-f0-9]{64}$/iu.test(child)) {
        if (looksLikeReference(key)) add(key, child);
      } else {
        visit(child, key);
      }
    }
  };
  visit(document);
  return entries;
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

const allFiles = walkFiles(V2_ROOT);
const jsonFiles = allFiles.filter((path) => extname(path).toLowerCase() === ".json");
const parsedDocuments = new Map();
const malformedJson = [];
for (const path of jsonFiles) {
  try {
    parsedDocuments.set(path, JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    malformedJson.push({
      file: relative(PROJECT_ROOT, path).replaceAll("\\", "/"),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const requiredMissing = REQUIRED_V2_FILES.filter(
  (name) => !existsSync(resolve(V2_ROOT, name))
);
addCheck(
  "REQUIRED_V2_FILES",
  requiredMissing.length === 0,
  REQUIRED_V2_FILES.length - requiredMissing.length,
  REQUIRED_V2_FILES.length,
  { missing: requiredMissing }
);

addCheck(
  "MALFORMED_JSON_COUNT",
  malformedJson.length === 0,
  malformedJson.length,
  0,
  malformedJson
);

const loadDocument = (name) =>
  parsedDocuments.get(resolve(V2_ROOT, name)) ||
  parseJsonFile(resolve(V2_ROOT, name));

const manifest = loadDocument("manifest.json");
const catalog = loadDocument("catalog.json");
const frameworkCoverage = loadDocument("framework-coverage.json");
const qualityReport = loadDocument("quality-report.json");
const publicationDecisions = loadDocument("publication-decisions.json");
const rightsMatrix = loadDocument("rights-matrix.json");
const assetIntegrity = loadDocument("asset-integrity.json");

const sourceZipResult = countZipWorkbooks(SOURCE_ZIP);
addCheck(
  "SOURCE_WORKBOOK_COUNT",
  sourceZipResult.count === 149 && !sourceZipResult.error,
  sourceZipResult.count,
  149,
  sourceZipResult.error ? { error: sourceZipResult.error } : { zipEntries: sourceZipResult.entries }
);

const catalogElements = elementArray(catalog);
const coverageElements = elementArray(frameworkCoverage);
const manifestFrameworkCount = firstFiniteNumber(
  manifest?.frameworkElements,
  manifest?.frameworkElementCount,
  manifest?.summary?.frameworkElements,
  manifest?.summary?.frameworkElementCount
);
const frameworkSignals = [
  manifestFrameworkCount,
  catalogElements.length || undefined,
  coverageElements.length || undefined,
].filter((value) => value !== undefined);
addCheck(
  "FRAMEWORK_ELEMENT_COUNT",
  frameworkSignals.length >= 2 && frameworkSignals.every((value) => value === 152),
  {
    manifest: manifestFrameworkCount ?? null,
    catalog: catalogElements.length,
    coverage: coverageElements.length,
  },
  152
);

const explicitlyUnexplainedCoverage = coverageElements.filter(
  (element) =>
    element?.unexplained === true ||
    element?.accounted === false ||
    String(element?.packageStatus || element?.status || "").toLowerCase() ===
      "unexplained"
);
const calculatedAccounted = coverageElements.length
  ? coverageElements.length - explicitlyUnexplainedCoverage.length
  : undefined;
const manifestAccounted = firstFiniteNumber(
  manifest?.accountedElements,
  manifest?.accountedElementCount,
  manifest?.summary?.accountedElements,
  manifest?.summary?.accountedElementCount,
  ...findNamedValues(frameworkCoverage, new Set(["accountedElements", "accountedElementCount"]))
);
const accountedSignals = [manifestAccounted, calculatedAccounted].filter(
  (value) => value !== undefined
);
addCheck(
  "ACCOUNTED_ELEMENT_COUNT",
  accountedSignals.length > 0 && accountedSignals.every((value) => value === 152),
  { manifest: manifestAccounted ?? null, calculated: calculatedAccounted ?? null },
  152
);

const unexplainedSignals = [
  firstFiniteNumber(
    manifest?.unexplainedElements,
    manifest?.unexplainedElementCount,
    manifest?.summary?.unexplainedElements,
    manifest?.summary?.unexplainedElementCount,
    ...findNamedValues(
      frameworkCoverage,
      new Set(["unexplainedElements", "unexplainedElementCount"])
    )
  ),
  explicitlyUnexplainedCoverage.length,
].filter((value) => value !== undefined);
addCheck(
  "UNEXPLAINED_ELEMENT_COUNT",
  unexplainedSignals.length > 0 && unexplainedSignals.every((value) => value === 0),
  unexplainedSignals,
  0,
  { elementIds: explicitlyUnexplainedCoverage.map((item) => item.elementId) }
);

const catalogIds = catalogElements
  .map((element) => element?.elementId)
  .filter((id) => typeof id === "string");
const duplicateElementIds = [...new Set(
  catalogIds.filter((id, index) => catalogIds.indexOf(id) !== index)
)].sort((a, b) => a.localeCompare(b, "en"));
addCheck(
  "DUPLICATE_ELEMENT_COUNT",
  duplicateElementIds.length === 0 && catalogIds.length === catalogElements.length,
  duplicateElementIds.length,
  0,
  { elementIds: duplicateElementIds, missingIds: catalogElements.length - catalogIds.length }
);

const approvedIds = collectApprovedIds(publicationDecisions);
addCheck(
  "AUTHORIZED_ELEMENT_COUNT",
  approvedIds.length === 20,
  approvedIds.length,
  20,
  { elementIds: approvedIds }
);

const catalogById = new Map(catalogElements.map((element) => [element.elementId, element]));
const rightsRecords = collectElementRecords(rightsMatrix);
const authorizedMissingFromCatalog = approvedIds.filter((id) => !catalogById.has(id));
addCheck(
  "AUTHORIZED_ELEMENTS_IN_CATALOG",
  authorizedMissingFromCatalog.length === 0 && approvedIds.length === 20,
  approvedIds.length - authorizedMissingFromCatalog.length,
  20,
  { missing: authorizedMissingFromCatalog }
);

const rightsBlockedIds = [];
const privacyBlockedIds = [];
const unauthorizedStatusIds = [];
const unauthorizedDisplayIds = [];
for (const id of approvedIds) {
  const records = [catalogById.get(id), ...(rightsRecords.get(id) || [])].filter(Boolean);
  if (records.some((record) => hasBlockingMarker(record, "rights"))) {
    rightsBlockedIds.push(id);
  }
  if (records.some((record) => hasBlockingMarker(record, "privacy"))) {
    privacyBlockedIds.push(id);
  }
  const catalogElement = catalogById.get(id);
  if (
    catalogElement &&
    [
      "metadata-only",
      "metadata-only-rights-blocked",
      "privacy-blocked",
      "pii-redacted",
      "redistribution-blocked",
    ].includes(String(catalogElement.publicStatus || "").toLowerCase())
  ) {
    unauthorizedStatusIds.push(id);
  }
  if (
    catalogElement &&
    (catalogElement.displayAllowed !== true || catalogElement.downloadAllowed !== true)
  ) {
    unauthorizedDisplayIds.push(id);
  }
}
addCheck(
  "AUTHORIZED_RIGHTS_BLOCKED_COUNT",
  rightsBlockedIds.length === 0,
  rightsBlockedIds.length,
  0,
  { elementIds: rightsBlockedIds }
);
addCheck(
  "AUTHORIZED_PRIVACY_BLOCKED_COUNT",
  privacyBlockedIds.length === 0,
  privacyBlockedIds.length,
  0,
  { elementIds: privacyBlockedIds }
);
addCheck(
  "AUTHORIZED_SUPPRESSED_STATUS_COUNT",
  unauthorizedStatusIds.length === 0,
  unauthorizedStatusIds.length,
  0,
  { elementIds: unauthorizedStatusIds }
);
addCheck(
  "AUTHORIZED_DISPLAY_DOWNLOAD_DISABLED_COUNT",
  unauthorizedDisplayIds.length === 0,
  unauthorizedDisplayIds.length,
  0,
  { elementIds: unauthorizedDisplayIds }
);

const allowedEmptyStatuses = new Set([
  "schema-only",
  "data-entry-planned",
  "not-collected",
  "quarantined",
]);
const providedUnexplainedEmpty = catalogElements.filter((element) => {
  if (String(element?.packageStatus || "").toLowerCase() !== "provided") return false;
  const rows = populatedRows(element);
  if (rows === undefined || rows > 0) return false;
  const status = String(
    element?.publicStatus || element?.dataPresenceStatus || ""
  ).toLowerCase();
  return !allowedEmptyStatuses.has(status) || !explicitEmptyReason(element);
});
addCheck(
  "PROVIDED_UNEXPLAINED_EMPTY_COUNT",
  providedUnexplainedEmpty.length === 0,
  providedUnexplainedEmpty.length,
  0,
  {
    elementIds: providedUnexplainedEmpty.map((element) => element.elementId),
  }
);

const rowBalance = manifest?.rowBalance || qualityReport?.rowBalance || {};
const originalRows = firstFiniteNumber(
  rowBalance.originalRows,
  rowBalance.sourceRows,
  manifest?.rawRows?.total,
  qualityReport?.summary?.originalRows,
  qualityReport?.summary?.originalDataRows
);
const processedRows = firstFiniteNumber(
  rowBalance.processedRows,
  rowBalance.accountedRows,
  qualityReport?.summary?.processedRows
);
const rowBalanceFlag = firstBoolean(
  rowBalance.matches,
  rowBalance.pass,
  manifest?.checks?.rowBalance,
  qualityReport?.checks?.rowBalance,
  qualityReport?.checks?.rowBalancePass,
  qualityReport?.summary?.rowBalanceMatches,
  qualityReport?.summary?.rowBalancePass
);
const rowNumbersMatch =
  originalRows !== undefined &&
  processedRows !== undefined &&
  originalRows === processedRows;
addCheck(
  "ROW_BALANCE",
  rowBalanceFlag === true && rowNumbersMatch,
  { matches: rowBalanceFlag ?? null, originalRows, processedRows },
  { matches: true, originalRows: "= processedRows" }
);

const integrityEntries = collectIntegrityEntries(assetIntegrity);
const integrityFailures = [];
for (const entry of integrityEntries) {
  const path = resolveAssetReference(entry.reference);
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    integrityFailures.push({ reference: entry.reference, error: "missing" });
    continue;
  }
  const actualHash = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actualHash !== entry.sha256) {
    integrityFailures.push({
      reference: entry.reference,
      expected: entry.sha256,
      actual: actualHash,
    });
  }
}
addCheck(
  "ASSET_HASH_PASS",
  integrityEntries.length > 0 && integrityFailures.length === 0,
  { checked: integrityEntries.length, failed: integrityFailures.length },
  { checked: "> 0", failed: 0 },
  integrityFailures
);

const v2AssetUrls = new Set();
for (const document of parsedDocuments.values()) collectV2AssetUrls(document, v2AssetUrls);
const brokenAssetUrls = [...v2AssetUrls]
  .filter((url) => {
    const path = resolveAssetReference(url);
    return !path || !existsSync(path) || !statSync(path).isFile();
  })
  .sort((a, b) => a.localeCompare(b, "en"));
addCheck(
  "BROKEN_ASSET_URL_COUNT",
  v2AssetUrls.size > 0 && brokenAssetUrls.length === 0,
  brokenAssetUrls.length,
  0,
  { checked: v2AssetUrls.size, urls: brokenAssetUrls }
);

const downloadReferences = new Set();
for (const document of parsedDocuments.values()) {
  collectDownloadReferences(document, downloadReferences);
}
const brokenDownloads = [...downloadReferences]
  .filter((reference) => {
    const path = resolveAssetReference(reference);
    return !path || !existsSync(path) || !statSync(path).isFile();
  })
  .sort((a, b) => a.localeCompare(b, "en"));
addCheck(
  "PUBLIC_DOWNLOAD_REFERENCES_VALID",
  downloadReferences.size > 0 && brokenDownloads.length === 0,
  { checked: downloadReferences.size, broken: brokenDownloads.length },
  { checked: "> 0", broken: 0 },
  brokenDownloads
);

const sourceRelativePath = relative(PROJECT_ROOT, SOURCE_ZIP).replaceAll("\\", "/");
const trackedOutput = gitOutput(["ls-files", "--", sourceRelativePath]);
const sourceTracked = typeof trackedOutput === "string" && trackedOutput.length > 0;
addCheck(
  "SOURCE_ZIP_NOT_TRACKED",
  existsSync(SOURCE_ZIP) && !sourceTracked,
  sourceTracked,
  false,
  { path: sourceRelativePath, exists: existsSync(SOURCE_ZIP) }
);

const ignoredOutput = gitOutput([
  "check-ignore",
  "--no-index",
  "--verbose",
  "--",
  sourceRelativePath,
]);
addCheck(
  "SOURCE_ZIP_IGNORED",
  existsSync(SOURCE_ZIP) && typeof ignoredOutput === "string" && ignoredOutput.length > 0,
  Boolean(ignoredOutput),
  true,
  { path: sourceRelativePath, rule: ignoredOutput || null }
);

for (const check of checks) console.log(JSON.stringify(check));
const failed = checks.filter((check) => check.status === "FAIL");
const summary = {
  type: "summary",
  status: failed.length === 0 ? "PASS" : "FAIL",
  passed: checks.length - failed.length,
  failed: failed.length,
  total: checks.length,
  failedChecks: failed.map((check) => check.name),
};
console.log(JSON.stringify(summary));
process.exitCode = failed.length === 0 ? 0 : 1;
