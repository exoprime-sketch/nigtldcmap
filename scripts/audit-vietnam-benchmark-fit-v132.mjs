#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  BENCHMARKS_V132,
  V132_REPORT_ROOT,
  finishAuditV132,
  normalizeTextV132,
} from "./v132/audit-helpers.mjs";

const audit = new AuditV125("benchmark-fit:v132");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const finalContractResult = readJson(
  resolve(V132_REPORT_ROOT, "final-public-visualization-contract-v132.json")
);
const runtimeReviewResult = readJson(
  resolve(V132_REPORT_ROOT, "element-visualization-runtime-review-v132.json")
);
const benchmarkCsvPath = resolve(
  V132_REPORT_ROOT,
  "external-visualization-benchmark-v132.csv"
);
const screenshotManifestResult = readJson(
  resolve(V132_REPORT_ROOT, "screenshots/screenshot-manifest-v132.json")
);
const catalog = catalogElements(catalogResult.value);
const contracts = Array.isArray(finalContractResult.value?.elements)
  ? finalContractResult.value.elements
  : [];
const runtimeRows = Array.isArray(runtimeReviewResult.value?.elements)
  ? runtimeReviewResult.value.elements
  : [];
const contractIds = contracts.map((row) => row.elementId);
const runtimeIds = runtimeRows.map((row) => row.elementId);
const officialReferenceFailures = BENCHMARKS_V132.filter(
  (item) =>
    !/^https:\/\//u.test(item.officialUrl) ||
    !normalizeTextV132(item.analysisPattern) ||
    !normalizeTextV132(item.publicQuestion)
);
const contractFailures = contracts.filter(
  (row) =>
    !normalizeTextV132(row.primaryPublicQuestion) ||
    !normalizeTextV132(row.primaryVisualization) ||
    !normalizeTextV132(row.secondaryVisualization) ||
    !normalizeTextV132(row.yearBehavior) ||
    !normalizeTextV132(row.unitBehavior) ||
    !normalizeTextV132(row.mapBehavior) ||
    !normalizeTextV132(row.listTableBehavior) ||
    !normalizeTextV132(row.benchmarkReference) ||
    row.runtimeVerified !== true ||
    row.runtimeReviewResult !== "verified-in-production-dom" ||
    !row.runtimeEvidence ||
    !Array.isArray(row.runtimeEvidence.headings) ||
    (row.assignedPrimaryRenderer === "status-only"
      ? row.runtimeEvidence.statusOnly !== true
      : row.runtimeEvidence.headings.length === 0)
);
const missingCatalogIds = catalog
  .map((item) => item.elementId)
  .filter((elementId) => !contractIds.includes(elementId));
const unknownContractIds = contractIds.filter(
  (elementId) => !catalog.some((item) => item.elementId === elementId)
);
const duplicateContractIds = contractIds.filter(
  (elementId, index) => contractIds.indexOf(elementId) !== index
);

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("BENCHMARK_TYPE_COUNT", BENCHMARKS_V132.length === 7, BENCHMARKS_V132.length, 7);
audit.check(
  "BENCHMARK_OFFICIAL_REFERENCE",
  officialReferenceFailures.length === 0,
  officialReferenceFailures,
  []
);
audit.check(
  "BENCHMARK_MATRIX_CSV",
  existsSync(benchmarkCsvPath) && readFileSync(benchmarkCsvPath, "utf8").split(/\r?\n/u).filter(Boolean).length === 8,
  existsSync(benchmarkCsvPath)
    ? readFileSync(benchmarkCsvPath, "utf8").split(/\r?\n/u).filter(Boolean).length - 1
    : 0,
  7
);
audit.check(
  "FINAL_VISUALIZATION_CONTRACT_COVERAGE",
  contracts.length === 152 && missingCatalogIds.length === 0 && unknownContractIds.length === 0 && duplicateContractIds.length === 0,
  {
    contracts: contracts.length,
    missingCatalogIds,
    unknownContractIds,
    duplicateContractIds,
  },
  { contracts: 152, missingCatalogIds: [], unknownContractIds: [], duplicateContractIds: [] }
);
audit.check(
  "FINAL_VISUALIZATION_CONTRACT_FIELDS",
  contractFailures.length === 0,
  contractFailures.map((row) => row.elementId),
  []
);
audit.check(
  "RUNTIME_REVIEW_COVERAGE",
  runtimeRows.length === 152 && new Set(runtimeIds).size === 152,
  { rows: runtimeRows.length, unique: new Set(runtimeIds).size },
  { rows: 152, unique: 152 }
);
audit.check(
  "RUNTIME_VISUALIZATION_VERIFIED",
  contracts.filter((row) => row.runtimeVerified === true).length === 152,
  contracts.filter((row) => row.runtimeVerified === true).length,
  152,
  contracts.filter((row) => row.runtimeVerified !== true).map((row) => row.elementId)
);
audit.check(
  "SCREENSHOT_ACCEPTANCE",
  screenshotManifestResult.error === null &&
    screenshotManifestResult.value?.status === "PASS" &&
    screenshotManifestResult.value?.requiredCount === 10 &&
    screenshotManifestResult.value?.screenshotCount === 10 &&
    (screenshotManifestResult.value?.runtimeErrors || []).length === 0,
  screenshotManifestResult.error || screenshotManifestResult.value,
  { status: "PASS", requiredCount: 10, screenshotCount: 10, runtimeErrors: [] }
);

finishAuditV132(audit, "benchmark-fit-audit-v132.json", {
  frameworkElementCount: catalog.length,
  benchmarkTypeCount: BENCHMARKS_V132.length,
  finalVisualizationContractCount: contracts.length,
  runtimeVerifiedCount: contracts.filter((row) => row.runtimeVerified === true).length,
  screenshotCount: screenshotManifestResult.value?.screenshotCount || 0,
  remainingBlockers: contractFailures.length,
});
