#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  readJson,
} from "./v125/audit-utils.mjs";

const audit = new AuditV125("release:v128");
const npmCliCandidates = [
  process.env.npm_execpath,
  resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
  process.env.APPDATA
    ? resolve(process.env.APPDATA, "npm/node_modules/npm/bin/npm-cli.js")
    : null,
].filter((candidate) => typeof candidate === "string" && candidate.length > 0);
const npmCliPath = npmCliCandidates.find((candidate) => existsSync(candidate)) || null;
const npmExecutable = npmCliPath
  ? process.execPath
  : process.platform === "win32"
  ? "npm.cmd"
  : "npm";
const npmArgumentPrefix = npmCliPath ? [npmCliPath] : [];

const STEPS = [
  ["v127-regression", ["run", "finalize:v127"], true],
  ["data-acceptance:v128", ["run", "audit:data-acceptance:v128"], true],
  ["home:v128", ["run", "audit:home:v128"], true],
  ["routes:v128", ["run", "audit:routes:v128"], true],
  ["download-reconciliation:v128", ["run", "audit:download-reconciliation:v128"], true],
  ["public-screens:v128", ["run", "audit:public-screens:v128"], true],
  ["production-build", ["run", "build"], false],
];

function parseJsonLines(text) {
  return String(text || "")
    .split(/\r?\n/u)
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function runStep(label, args, expectsAuditSummary) {
  const startedAt = Date.now();
  const result = spawnSync(npmExecutable, [...npmArgumentPrefix, ...args], {
    cwd: PROJECT_ROOT,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell: npmCliPath === null && process.platform === "win32",
    timeout: 60 * 60 * 1000,
    windowsHide: true,
  });
  const summaries = parseJsonLines(result.stdout).filter(
    (entry) => entry?.type === "summary"
  );
  return {
    label,
    args,
    expectsAuditSummary,
    exitCode: result.status,
    signal: result.signal,
    error: result.error instanceof Error ? result.error.message : null,
    summary: summaries[summaries.length - 1] || null,
    durationMs: Date.now() - startedAt,
    stdoutTail: String(result.stdout || "").split(/\r?\n/u).filter(Boolean).slice(-20),
    stderrTail: String(result.stderr || "").split(/\r?\n/u).filter(Boolean).slice(-30),
  };
}

const results = [];
for (const [label, args, expectsAuditSummary] of STEPS) {
  const result = runStep(label, args, expectsAuditSummary);
  results.push(result);
  const passed =
    result.exitCode === 0 &&
    result.error === null &&
    (!expectsAuditSummary ||
      (result.summary?.status === "PASS" && Number(result.summary?.failed || 0) === 0));
  audit.check(
    `STEP_${label.replace(/[^a-z0-9]+/giu, "_").toUpperCase()}`,
    passed,
    {
      exitCode: result.exitCode,
      status: result.summary?.status ?? (expectsAuditSummary ? null : "PASS"),
      failed: result.summary?.failed ?? null,
      durationMs: result.durationMs,
      error: result.error,
    },
    { exitCode: 0, status: "PASS", failed: expectsAuditSummary ? 0 : null },
    passed
      ? undefined
      : {
          failedChecks: result.summary?.failedChecks || [],
          stdout: result.stdoutTail,
          stderr: result.stderrTail,
          signal: result.signal,
        }
  );
  if (!passed) break;
}

const manifestResult = readJson(resolve(V2_ROOT, "manifest.json"));
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const acceptanceResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);
const downloadResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-download-reconciliation-v128.json")
);
const manifest = manifestResult.value || {};
const catalog = catalogElements(catalogResult.value);
const acceptanceRows = Array.isArray(acceptanceResult.value)
  ? acceptanceResult.value
  : Array.isArray(acceptanceResult.value?.elements)
  ? acceptanceResult.value.elements
  : [];
const downloadSummary = downloadResult.value?.summary || downloadResult.value || {};
const blockedAcceptance = acceptanceRows.filter(
  (row) => row.finalDisposition === "blocked-by-error" || row.acceptanceResult === "FAIL"
);
const unexplainedDownloadDisabled = Number(
  downloadSummary.unexplainedDownloadDisabledCount ??
    downloadSummary.unexplainedDisabledCount ??
    NaN
);
const downloadGenerationErrors = Number(
  downloadSummary.downloadGenerationErrorCount ??
    downloadSummary.generationErrorCount ??
    NaN
);

audit.check(
  "RELEASE_DATA_CONTRACT",
  manifestResult.error === null &&
    catalogResult.error === null &&
    acceptanceResult.error === null &&
    Number(manifest.frameworkElements) === 152 &&
    Number(manifest.accountedElements) === 152 &&
    Number(manifest.unexplainedElements) === 0 &&
    catalog.length === 152 &&
    acceptanceRows.length === 152 &&
    blockedAcceptance.length === 0,
  {
    errors: {
      manifest: manifestResult.error,
      catalog: catalogResult.error,
      acceptance: acceptanceResult.error,
    },
    frameworkElements: manifest.frameworkElements,
    accountedElements: manifest.accountedElements,
    unexplainedElements: manifest.unexplainedElements,
    catalogElements: catalog.length,
    acceptedElements: acceptanceRows.length,
    blockedAcceptance: blockedAcceptance.length,
  },
  {
    errors: { manifest: null, catalog: null, acceptance: null },
    frameworkElements: 152,
    accountedElements: 152,
    unexplainedElements: 0,
    catalogElements: 152,
    acceptedElements: 152,
    blockedAcceptance: 0,
  },
  blockedAcceptance.slice(0, 152)
);
audit.check(
  "RELEASE_DOWNLOAD_CONTRACT",
  downloadResult.error === null &&
    Number.isFinite(unexplainedDownloadDisabled) &&
    unexplainedDownloadDisabled === 0 &&
    Number.isFinite(downloadGenerationErrors) &&
    downloadGenerationErrors === 0,
  {
    error: downloadResult.error,
    unexplainedDownloadDisabled,
    downloadGenerationErrors,
  },
  { error: null, unexplainedDownloadDisabled: 0, downloadGenerationErrors: 0 }
);

const buildIndexPath = resolve(PROJECT_ROOT, "build/index.html");
let productionAssets = false;
if (existsSync(buildIndexPath)) {
  const index = readFileSync(buildIndexPath, "utf8");
  productionAssets =
    /static\/js\/(?:main\.)?[^"']+\.js/u.test(index) &&
    /static\/css\/(?:main\.)?[^"']+\.css/u.test(index);
}
audit.check(
  "PRODUCTION_BUILD_ASSETS",
  productionAssets,
  { indexExists: existsSync(buildIndexPath), assets: productionAssets },
  { indexExists: true, assets: true }
);

const resultByLabel = new Map(results.map((result) => [result.label, result]));
const componentFailureCount = audit.checks.filter(
  (check) => check.name.startsWith("STEP_") && check.status === "FAIL"
).length;
const releaseFailureCount = audit.checks.filter((check) => check.status === "FAIL").length;

audit.finish({
  releaseGate: componentFailureCount === 0 && releaseFailureCount === 0 ? "PASS" : "FAIL",
  requestedStepCount: STEPS.length,
  completedStepCount: results.length,
  componentFailureCount,
  releaseCheckFailureCount: releaseFailureCount,
  v127Regression:
    resultByLabel.get("v127-regression")?.exitCode === 0 &&
    resultByLabel.get("v127-regression")?.summary?.status === "PASS"
      ? "PASS"
      : "FAIL",
  dataAcceptanceAudit: resultByLabel.get("data-acceptance:v128")?.summary?.status ?? null,
  homeAudit: resultByLabel.get("home:v128")?.summary?.status ?? null,
  routeAudit: resultByLabel.get("routes:v128")?.summary?.status ?? null,
  downloadAudit: resultByLabel.get("download-reconciliation:v128")?.summary?.status ?? null,
  publicScreenAudit: resultByLabel.get("public-screens:v128")?.summary?.status ?? null,
  productionBuild: resultByLabel.get("production-build")?.exitCode === 0 ? "PASS" : "FAIL",
});
