#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import { finishAuditV129 } from "./v129/audit-helpers.mjs";

const audit = new AuditV125("release:v129");
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
  ["v128-release-regression", [resolve(PROJECT_ROOT, "scripts/audit-vietnam-release-v128.mjs")], true, true],
  ["deployment:v128", [resolve(PROJECT_ROOT, "scripts/audit-vietnam-deployment-v128.mjs")], true, true],
  ["security:v128", [resolve(PROJECT_ROOT, "scripts/audit-vietnam-security-v128.mjs")], true, true],
  ["performance:v128", [resolve(PROJECT_ROOT, "scripts/audit-vietnam-performance-v128.mjs")], true, true],
  ["interpretation:v129", ["run", "audit:interpretation:v129"], true],
  ["map-layout:v129", ["run", "audit:map-layout:v129"], true],
  ["map-interaction:v129", ["run", "audit:map-interaction:v129"], true],
  ["chart-polish:v129", ["run", "audit:chart-polish:v129"], true],
  ["specialized:v129", ["run", "audit:specialized:v129"], true],
  ["screenshots:v129", ["run", "capture:screenshots:v129"], true],
  ["production-build", ["run", "build"], false],
];
const RETRYABLE_STEPS = new Set([
  "interpretation:v129",
  "map-layout:v129",
  "map-interaction:v129",
  "chart-polish:v129",
  "specialized:v129",
  "screenshots:v129",
]);

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

function runStepOnce(label, args, expectsAuditSummary, directNode = false) {
  const startedAt = Date.now();
  const executable = directNode ? process.execPath : npmExecutable;
  const executableArgs = directNode ? args : [...npmArgumentPrefix, ...args];
  const result = spawnSync(executable, executableArgs, {
    cwd: PROJECT_ROOT,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell: npmCliPath === null && process.platform === "win32",
    timeout: 90 * 60 * 1000,
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
    stdoutTail: String(result.stdout || "").split(/\r?\n/u).filter(Boolean).slice(-24),
    stderrTail: String(result.stderr || "").split(/\r?\n/u).filter(Boolean).slice(-30),
  };
}

function stepPassed(result) {
  return (
    result.exitCode === 0 &&
    result.error === null &&
    (!result.expectsAuditSummary ||
      (result.summary?.status === "PASS" && Number(result.summary?.failed || 0) === 0))
  );
}

function runStep(label, args, expectsAuditSummary, directNode = false) {
  const maxAttempts = RETRYABLE_STEPS.has(label) ? 2 : 1;
  const attempts = [];
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = runStepOnce(label, args, expectsAuditSummary, directNode);
    attempts.push(result);
    if (stepPassed(result)) break;
  }
  const result = attempts[attempts.length - 1];
  return {
    ...result,
    attemptCount: attempts.length,
    durationMs: attempts.reduce((total, item) => total + item.durationMs, 0),
  };
}

const results = [];
for (const [label, args, expectsAuditSummary, directNode] of STEPS) {
  const result = runStep(label, args, expectsAuditSummary, directNode);
  results.push(result);
  const passed = stepPassed(result);
  audit.check(
    `STEP_${label.replace(/[^a-z0-9]+/giu, "_").toUpperCase()}`,
    passed,
    {
      exitCode: result.exitCode,
      status: result.summary?.status ?? (expectsAuditSummary ? null : "PASS"),
      failed: result.summary?.failed ?? null,
      durationMs: result.durationMs,
      attemptCount: result.attemptCount,
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

const reportContracts = [
  "interpretation-audit-v129.json",
  "map-layout-audit-v129.json",
  "map-interaction-audit-v129.json",
  "chart-polish-audit-v129.json",
  "specialized-audit-v129.json",
  "screenshot-manifest-v129.json",
].map((name) => {
  const path = resolve(PROJECT_ROOT, "reports/v129", name);
  if (!existsSync(path)) return { name, valid: false, error: "missing" };
  try {
    const report = JSON.parse(readFileSync(path, "utf8"));
    return {
      name,
      valid:
        report?.status === "PASS" &&
        report?.summary?.status === "PASS" &&
        Number(report?.summary?.failed || 0) === 0,
      error: null,
    };
  } catch (error) {
    return {
      name,
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});
audit.check(
  "V129_REPORT_CONTRACTS",
  reportContracts.every((report) => report.valid),
  reportContracts,
  reportContracts.map((report) => ({ name: report.name, valid: true, error: null }))
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
const stepFailureCount = audit.checks.filter(
  (check) => check.name.startsWith("STEP_") && check.status === "FAIL"
).length;
const releaseFailureCount = audit.checks.filter(
  (check) => check.status === "FAIL"
).length;

finishAuditV129(audit, "release-audit-v129.json", {
  releaseGate:
    stepFailureCount === 0 && releaseFailureCount === 0 ? "PASS" : "FAIL",
  requestedStepCount: STEPS.length,
  completedStepCount: results.length,
  stepFailureCount,
  releaseCheckFailureCount: releaseFailureCount,
  v128Regression:
    resultByLabel.get("v128-release-regression")?.exitCode === 0 ? "PASS" : "FAIL",
  interpretationAudit:
    resultByLabel.get("interpretation:v129")?.summary?.status ?? null,
  mapLayoutAudit: resultByLabel.get("map-layout:v129")?.summary?.status ?? null,
  mapInteractionAudit:
    resultByLabel.get("map-interaction:v129")?.summary?.status ?? null,
  chartPolishAudit:
    resultByLabel.get("chart-polish:v129")?.summary?.status ?? null,
  specializedAudit:
    resultByLabel.get("specialized:v129")?.summary?.status ?? null,
  screenshotAudit:
    resultByLabel.get("screenshots:v129")?.summary?.status ?? null,
  productionBuild:
    resultByLabel.get("production-build")?.exitCode === 0 ? "PASS" : "FAIL",
});
