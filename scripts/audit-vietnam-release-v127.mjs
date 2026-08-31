#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";

const audit = new AuditV125("release:v127");
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
  ["production-build", ["run", "build"], false],
  ["data:v124", ["run", "audit:data:v124"], true],
  ["map:v124", ["run", "audit:map:v124"], true],
  ["runtime:v124", ["run", "audit:runtime:v124"], true],
  ["semantic:v125", ["run", "audit:semantic:v125"], true],
  ["public-content:v126", ["run", "audit:public-content:v126"], true],
  ["finder-ux:v126", ["run", "audit:finder-ux:v126"], true],
  ["public-downloads:v126", ["run", "audit:public-downloads:v126"], true],
  ["map-ux:v126", ["run", "audit:map-ux:v126"], true],
  ["map-public-content:v126", ["run", "audit:map-public-content:v126"], true],
  ["cross-navigation:v126", ["run", "audit:cross-navigation:v126"], true],
  ["limitations:v127", ["run", "audit:limitations:v127"], true],
  ["data-summary:v127", ["run", "audit:data-summary:v127"], true],
  ["chart-interaction:v127", ["run", "audit:chart-interaction:v127"], true],
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
    maxBuffer: 128 * 1024 * 1024,
    shell: npmCliPath === null && process.platform === "win32",
    timeout: 30 * 60 * 1000,
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
    stdoutTail: String(result.stdout || "").split(/\r?\n/u).filter(Boolean).slice(-12),
    stderrTail: String(result.stderr || "").split(/\r?\n/u).filter(Boolean).slice(-20),
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

const resultByLabel = new Map(results.map((result) => [result.label, result]));
const limitations = resultByLabel.get("limitations:v127")?.summary || {};
const summary = resultByLabel.get("data-summary:v127")?.summary || {};
const chart = resultByLabel.get("chart-interaction:v127")?.summary || {};

audit.check(
  "V127_LIMITATION_GATES",
  limitations.status === "PASS" &&
    limitations.inspectedRoutes === 152 &&
    limitations.genericZeroImputationSentenceCount === 0 &&
    limitations.genericNoMissingReasonSentenceCount === 0 &&
    limitations.cpiaGenericScaleSentenceCount === 0 &&
    limitations.emptyLimitationPanelCount === 0 &&
    limitations.a002CoverageGapVisible === true &&
    limitations.a002SourceInconsistencyVisible === true &&
    limitations.rawSourceCaveatExposed === 0 &&
    limitations.rawSourceNoteExposed === 0 &&
    limitations.technicalProvenanceExposed === 0,
  limitations,
  {
    status: "PASS",
    inspectedRoutes: 152,
    genericZeroImputationSentenceCount: 0,
    genericNoMissingReasonSentenceCount: 0,
    cpiaGenericScaleSentenceCount: 0,
    emptyLimitationPanelCount: 0,
    a002CoverageGapVisible: true,
    a002SourceInconsistencyVisible: true,
    rawSourceCaveatExposed: 0,
    rawSourceNoteExposed: 0,
    technicalProvenanceExposed: 0,
  }
);
audit.check(
  "V127_DATA_SUMMARY_GATES",
  summary.status === "PASS" &&
    summary.accountedElements === 152 &&
    summary.a002PopulatedCount === 231 &&
    summary.a002MissingCount === 189 &&
    JSON.stringify(summary.a002YearRange) === JSON.stringify([2005, 2015]) &&
    summary.a002IndicatorCount === 21 &&
    summary.entitySummaryFailures === 0 &&
    summary.missingObservationCountedAsPopulated === 0 &&
    summary.dataSummary === "PASS",
  summary,
  {
    status: "PASS",
    accountedElements: 152,
    a002PopulatedCount: 231,
    a002MissingCount: 189,
    a002YearRange: [2005, 2015],
    a002IndicatorCount: 21,
    entitySummaryFailures: 0,
    missingObservationCountedAsPopulated: 0,
    dataSummary: "PASS",
  }
);
audit.check(
  "V127_CHART_INTERACTION_GATES",
  chart.status === "PASS" &&
    chart.timeSeriesElementsInspected === 11 &&
    chart.timeSeriesFailures === 0 &&
    chart.axisTitleFailures === 0 &&
    chart.unitLabelFailures === 0 &&
    chart.oneUnitPerAxisFailures === 0 &&
    chart.keyboardFailures === 0 &&
    chart.customTooltip === true &&
    chart.mobileTapTooltip === true &&
    chart.zoomIn === true &&
    chart.zoomOut === true &&
    chart.resetFullRange === true &&
    chart.cpiaFixedDomain === true &&
    chart.nonTimeSeriesInteractionFailures === 0 &&
    chart.forbiddenTooltipTokenCount === 0 &&
    chart.blankChartCount === 0,
  chart,
  {
    status: "PASS",
    timeSeriesElementsInspected: 11,
    failures: 0,
    interactions: "PASS",
    cpiaFixedDomain: true,
    oneUnitPerAxis: true,
  }
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

const stepFailures = audit.checks.filter(
  (check) => check.name.startsWith("STEP_") && check.status === "FAIL"
).length;
const releaseFailures = audit.checks.filter((check) => check.status === "FAIL").length;
audit.finish({
  releaseGate: stepFailures === 0 && releaseFailures === 0 ? "PASS" : "FAIL",
  requestedStepCount: STEPS.length,
  completedStepCount: results.length,
  componentFailureCount: stepFailures,
  releaseCheckFailureCount: releaseFailures,
  v126Regression: results
    .filter((result) => /:v12[4-6]$/u.test(result.label))
    .every((result) => result.exitCode === 0 && result.summary?.status === "PASS")
    ? "PASS"
    : "FAIL",
  limitationsAudit: limitations.status ?? null,
  dataSummaryAudit: summary.status ?? null,
  chartInteractionAudit: chart.status ?? null,
  productionBuild: resultByLabel.get("production-build")?.exitCode === 0 ? "PASS" : "FAIL",
});
