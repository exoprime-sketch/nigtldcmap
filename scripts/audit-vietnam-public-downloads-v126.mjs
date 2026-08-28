#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  catalogElements,
  loadPackPayloads,
  parseCsv,
  payloadRecords,
  readJson,
  readText,
} from "./v125/audit-utils.mjs";

const audit = new AuditV125("public-downloads:v126");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const policyPath = resolve(
  PROJECT_ROOT,
  "src/data/visualization/publicFieldPolicyV126.ts"
);
const policySource = readText(policyPath);
const downloadPageSource = readText(resolve(PROJECT_ROOT, "src/pages/DownloadPage.tsx"));
const packs = loadPackPayloads();

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("PUBLIC_FIELD_POLICY_SOURCE", policySource.error === null, policySource.error, null);
audit.check("PACK_PAYLOADS", packs.errors.length === 0, packs.errors.length, 0, packs.errors);

function compileCommonJs(source, fileName) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length > 0) {
    throw new Error(
      errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
        .join("; ")
    );
  }
  const moduleRecord = { exports: {} };
  new Function("exports", "module", "require", result.outputText)(
    moduleRecord.exports,
    moduleRecord,
    (specifier) => {
      throw new Error(`unexpected runtime import: ${specifier}`);
    }
  );
  return moduleRecord.exports;
}

let policyApi = null;
let policyCompileError = null;
try {
  if (!policySource.value) throw new Error(policySource.error || "policy source unavailable");
  policyApi = compileCommonJs(policySource.value, "publicFieldPolicyV126.ts");
} catch (error) {
  policyCompileError = error instanceof Error ? error.message : String(error);
}

const requiredExports = [
  "toPublicObservationRowsV126",
  "toPublicEntityRowsV126",
  "publicRowsToCsvV126",
  "publicRowsToJsonV126",
  "publicDownloadRowsHaveTechnicalFieldsV126",
  "publicDownloadRowCountV126",
  "approvedEntityAttributesV126",
  "isDefaultPublicDownloadAssetV126",
];
const missingExports = requiredExports.filter(
  (name) => typeof policyApi?.[name] !== "function"
);
audit.check(
  "PUBLIC_PROJECTION_API",
  policyCompileError === null && missingExports.length === 0,
  { compileError: policyCompileError, missingExports },
  { compileError: null, missingExports: [] }
);

const technicalNames = new Set(
  (policyApi?.TECHNICAL_PROVENANCE_FIELDS_V126 || [])
    .map((key) => String(key).replace(/[^a-z0-9]/giu, "").toLowerCase())
);
const explicitlyForbiddenNames = [
  "source_file",
  "source_sheet",
  "source_row",
  "attributes_json",
  "publication_decision_id",
  "indicator_id",
  "record_id",
  "api_params",
  "raw_attributes",
  "pack_url",
  "shard_id",
  "sha256",
].map((key) => key.replace(/[^a-z0-9]/giu, "").toLowerCase());
for (const key of explicitlyForbiddenNames) technicalNames.add(key);

function normalizedKey(key) {
  return String(key).replace(/[^a-z0-9]/giu, "").toLowerCase();
}

function recursiveTechnicalKeys(value, path = "$") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => recursiveTechnicalKeys(item, `${path}[${index}]`));
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPath = `${path}.${key}`;
    return [
      ...(technicalNames.has(normalizedKey(key)) ? [nextPath] : []),
      ...recursiveTechnicalKeys(nested, nextPath),
    ];
  });
}

const forbiddenSerializedPatterns = [
  [".xlsx", /\.xlsx\b/iu],
  ["SDMX flat", /SDMX\s+flat/iu],
  ["INDICATOR=", /INDICATOR\s*=/iu],
  ["COMP_BREAKDOWN", /COMP_BREAKDOWN/iu],
  ["REF_AREA=", /REF_AREA\s*=/iu],
  ["technical field name", /\b(?:sourceFile(?:Original|Decoded)?|sourceSheet|sourceRow|sourceSeriesId|recordId|indicatorId|apiEndpoint|apiParams|packUrl|shardId|sha256|publicationDecisionId|rawAttributes)\b/iu],
  ["workbook row locator", /(?:워크시트|시트)\s+\d+(?:\s*[–—-]\s*\d+)?행/iu],
  ["original row locator", /\[?\s*원본\s+\d+(?:(?:\s*[–—~\-·]\s*)\d+)*\s*행\s*\]?/iu],
  ["original location label", /원본\s*(?:파일|시트|행|위치)/iu],
];

function serializedForbiddenTokens(text) {
  return forbiddenSerializedPatterns
    .filter(([, pattern]) => pattern.test(String(text)))
    .map(([name]) => name);
}

function semanticDocument(elementId) {
  const path = resolve(
    SEMANTIC_ROOT,
    "elements",
    `${elementId.toLowerCase()}.json`
  );
  if (!existsSync(path)) return { indicators: [], records: [] };
  const result = readJson(path);
  if (result.error) throw new Error(`${elementId} semantic JSON: ${result.error}`);
  return result.value || { indicators: [], records: [] };
}

const projectionFailures = [];
const csvFailures = [];
const jsonFailures = [];
const defaultAssetFailures = [];
let eligibleRecordCount = 0;
let projectedRecordCount = 0;
let checkedCsvCount = 0;
let checkedJsonCount = 0;
let elementsWithSafeRows = 0;

if (policyApi && missingExports.length === 0) {
  for (const element of catalog) {
    try {
      const payload = packs.elements.get(element.elementId);
      if (!payload) throw new Error("bundle payload missing");
      const observations = payloadRecords(payload.observations).filter(
        (row) => row.downloadEligible === true
      );
      const entities = payloadRecords(payload.entities).filter(
        (row) => row.downloadEligible === true
      );
      const metadata = Array.isArray(payload.meta?.indicators)
        ? payload.meta.indicators
        : [];
      const semantics = semanticDocument(element.elementId);
      const common = {
        element: {
          countryIso3: "VNM",
          publicTitle: element.elementLabel,
          publicStatus: element.publicStatus,
          downloadAllowed: element.downloadAllowed,
          raw: element,
        },
        metadataById: new Map(metadata.map((meta) => [meta.indicatorId, meta])),
        indicatorSemantics: Array.isArray(semantics.indicators)
          ? semantics.indicators
          : [],
        recordSemantics: Array.isArray(semantics.records) ? semantics.records : [],
      };
      const publicRows = [
        ...policyApi.toPublicObservationRowsV126({ ...common, observations }),
        ...policyApi.toPublicEntityRowsV126({ ...common, entities }),
      ];
      const expected = observations.length + entities.length;
      eligibleRecordCount += expected;
      projectedRecordCount += policyApi.publicDownloadRowCountV126(publicRows);
      if (publicRows.length > 0) elementsWithSafeRows += 1;

      const rowTechnicalPaths = recursiveTechnicalKeys(publicRows);
      if (
        publicRows.length !== expected ||
        policyApi.publicDownloadRowCountV126(publicRows) !== expected ||
        policyApi.publicDownloadRowsHaveTechnicalFieldsV126(publicRows) ||
        rowTechnicalPaths.length > 0
      ) {
        projectionFailures.push({
          elementId: element.elementId,
          expected,
          projected: publicRows.length,
          technicalPaths: rowTechnicalPaths.slice(0, 30),
        });
      }

      const csv = policyApi.publicRowsToCsvV126(publicRows);
      const csvRows = parseCsv(String(csv).replace(/^\uFEFF/u, ""));
      const csvHeaders = csvRows.length > 0
        ? Object.keys(csvRows[0])
        : String(csv).replace(/^\uFEFF/u, "").split(/\r?\n/u)[0].split(",");
      const forbiddenCsvHeaders = csvHeaders.filter((header) =>
        technicalNames.has(normalizedKey(header))
      );
      const forbiddenCsvValues = serializedForbiddenTokens(csv);
      checkedCsvCount += 1;
      if (
        csvRows.length !== publicRows.length ||
        forbiddenCsvHeaders.length > 0 ||
        forbiddenCsvValues.length > 0 ||
        !csvHeaders.includes("country") ||
        !csvHeaders.includes("element") ||
        !csvHeaders.includes("measure") ||
        !csvHeaders.includes("source_organization")
      ) {
        csvFailures.push({
          elementId: element.elementId,
          expected: publicRows.length,
          actual: csvRows.length,
          forbiddenHeaders: forbiddenCsvHeaders,
          forbiddenValues: forbiddenCsvValues,
          headers: csvHeaders,
        });
      }

      const jsonText = policyApi.publicRowsToJsonV126(publicRows);
      const jsonDocument = JSON.parse(jsonText);
      const jsonRows = Array.isArray(jsonDocument?.records) ? jsonDocument.records : null;
      const jsonTechnicalPaths = recursiveTechnicalKeys(jsonDocument);
      const forbiddenJsonValues = serializedForbiddenTokens(jsonText);
      checkedJsonCount += 1;
      if (
        !jsonRows ||
        jsonRows.length !== publicRows.length ||
        jsonTechnicalPaths.length > 0 ||
        forbiddenJsonValues.length > 0
      ) {
        jsonFailures.push({
          elementId: element.elementId,
          expected: publicRows.length,
          actual: jsonRows?.length ?? null,
          technicalPaths: jsonTechnicalPaths.slice(0, 30),
          forbiddenValues: forbiddenJsonValues,
        });
      }

      for (const asset of element.downloadAssets || []) {
        if (policyApi.isDefaultPublicDownloadAssetV126(asset.url) !== false) {
          defaultAssetFailures.push({ elementId: element.elementId, url: asset.url });
        }
      }
    } catch (error) {
      projectionFailures.push({
        elementId: element.elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function sourceFilesBelow(root) {
  if (!existsSync(root) || !statSync(root).isDirectory()) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return sourceFilesBelow(path);
    return /\.tsx?$/u.test(entry.name) ? [path] : [];
  });
}

const publicDownloadUiFiles = [
  resolve(PROJECT_ROOT, "src/pages/DownloadPage.tsx"),
  resolve(PROJECT_ROOT, "src/pages/CountryDataElementPage.tsx"),
  ...sourceFilesBelow(resolve(PROJECT_ROOT, "src/components/data/public")),
];
const legacyUiExposureFailures = publicDownloadUiFiles.flatMap((path) => {
  const source = readText(path);
  if (source.error || !source.value) return [{ path, error: source.error || "missing" }];
  const patterns = [
    /\/data\/vietnam\/v2\/downloads\//u,
    /downloadAssets[\s\S]{0,500}(?:href\s*=|asset\.url|\.url\s*[})])/u,
  ];
  return patterns.some((pattern) => pattern.test(source.value))
    ? [{ path, error: "legacy static download exposed by public UI" }]
    : [];
});

audit.check(
  "SAFE_DOWNLOAD_LINKS_VALID",
  elementsWithSafeRows > 0 &&
    defaultAssetFailures.length === 0 &&
    legacyUiExposureFailures.length === 0,
  {
    generatedElements: elementsWithSafeRows,
    exposedLegacyAssets: defaultAssetFailures.length,
    legacyUiExposures: legacyUiExposureFailures.length,
  },
  { generatedElements: "> 0", exposedLegacyAssets: 0, legacyUiExposures: 0 },
  [...defaultAssetFailures, ...legacyUiExposureFailures]
);
audit.check(
  "PUBLIC_DOWNLOAD_TECHNICAL_FIELD",
  projectionFailures.length === 0,
  projectionFailures.length,
  0,
  projectionFailures.slice(0, 152)
);
audit.check(
  "PUBLIC_CSV_SAFE_PROJECTION",
  checkedCsvCount === 152 && csvFailures.length === 0,
  { checked: checkedCsvCount, failed: csvFailures.length },
  { checked: 152, failed: 0 },
  csvFailures.slice(0, 152)
);
audit.check(
  "PUBLIC_JSON_SAFE_PROJECTION",
  checkedJsonCount === 152 && jsonFailures.length === 0,
  { checked: checkedJsonCount, failed: jsonFailures.length },
  { checked: 152, failed: 0 },
  jsonFailures.slice(0, 152)
);
audit.check(
  "PUBLIC_DOWNLOAD_ROW_RECONCILIATION",
  eligibleRecordCount === projectedRecordCount && projectionFailures.length === 0,
  { eligible: eligibleRecordCount, projected: projectedRecordCount },
  { difference: 0 }
);

const downloadSource = downloadPageSource.value || "";
const downloadUiContract = {
  sourceAvailable: downloadPageSource.error === null,
  csvAction: /data-testid=["']public-download-csv["']/u.test(downloadSource),
  jsonAction: /data-testid=["']public-download-json["']/u.test(downloadSource),
  observationProjection: /toPublicObservationRowsV126/u.test(downloadSource),
  entityProjection: /toPublicEntityRowsV126/u.test(downloadSource),
  safeCsvSerializer: /publicRowsToCsvV126/u.test(downloadSource),
  safeJsonSerializer: /publicRowsToJsonV126/u.test(downloadSource),
  noLegacyCsvSerializer: !/observationsToCsvV121|entitiesToCsvV121/u.test(downloadSource),
  noLegacyStaticDefaultLink: !/downloadAssets[\s\S]{0,500}(?:href|\.url)/u.test(downloadSource),
};
audit.check(
  "PUBLIC_DOWNLOAD_UI_SAFE_ACTIONS",
  Object.values(downloadUiContract).every(Boolean),
  downloadUiContract,
  Object.fromEntries(Object.keys(downloadUiContract).map((key) => [key, true]))
);

audit.finish({
  safeProjectionElements: elementsWithSafeRows,
  eligibleRecordCount,
  projectedRecordCount,
  rowReconciliation: eligibleRecordCount === projectedRecordCount ? "PASS" : "FAIL",
  publicDownloadTechnicalFieldCount:
    projectionFailures.length + csvFailures.length + jsonFailures.length,
  exposedLegacyStaticDownloadCount:
    defaultAssetFailures.length + legacyUiExposureFailures.length,
});
