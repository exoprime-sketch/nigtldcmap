#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const REPORT_PATH = resolve(PROJECT_ROOT, "reports/v133/ci-contract-v133.json");
const CI_PATH = resolve(PROJECT_ROOT, ".github/workflows/ci.yml");
const GITATTRIBUTES_PATH = resolve(PROJECT_ROOT, ".gitattributes");
const PACKAGE_PATH = resolve(PROJECT_ROOT, "package.json");
const GENERATED_AUDIT_PATH = resolve(
  PROJECT_ROOT,
  "scripts/audit-vietnam-generated-data-v133.mjs"
);

const checks = [];
function check(name, passed, actual, expected, details = undefined) {
  const row = {
    name,
    status: passed ? "PASS" : "FAIL",
    actual,
    expected,
  };
  if (details !== undefined) row.details = details;
  checks.push(row);
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const ci = readFileSync(CI_PATH, "utf8");
const gitAttributes = readFileSync(GITATTRIBUTES_PATH, "utf8");
const packageJson = JSON.parse(readFileSync(PACKAGE_PATH, "utf8"));
const generatedAudit = readFileSync(GENERATED_AUDIT_PATH, "utf8");

const requiredScripts = {
  "audit:source-local:v133": "node scripts/audit-vietnam-source-local-v133.mjs",
  "generate:asset-integrity:v133":
    "node scripts/generate-vietnam-asset-integrity-v133.mjs",
  "audit:generated-data:v133":
    "node scripts/audit-vietnam-generated-data-v133.mjs",
  "audit:ci-contract:v133": "node scripts/audit-vietnam-ci-contract-v133.mjs",
  "audit:release-ci:v133":
    "npm run audit:generated-data:v133 && npm run audit:ci-contract:v133",
};
const scriptMismatches = Object.entries(requiredScripts)
  .filter(([name, command]) => packageJson?.scripts?.[name] !== command)
  .map(([name, command]) => ({
    name,
    actual: packageJson?.scripts?.[name] ?? null,
    expected: command,
  }));
check(
  "V133_CI_SCRIPT_CONTRACT",
  scriptMismatches.length === 0,
  Object.keys(requiredScripts).length - scriptMismatches.length,
  Object.keys(requiredScripts).length,
  scriptMismatches
);

// V150-1: ci.yml runs the same V136 gate through
// audit-vietnam-release-v136.mjs --group static (which builds) / --group
// browser --shard k/4 / --results-dir (summary judgement). The sharded form is
// the current gate as much as the single `npm run finalize:v136` line.
const shardedGate =
  /audit-vietnam-release-v136\.mjs\s+--group\s+static\b/u.test(ci) &&
  /audit-vietnam-release-v136\.mjs\s+--group\s+browser\s+--shard\b/u.test(ci) &&
  /audit-vietnam-release-v136\.mjs\s+--results-dir\b/u.test(ci);
const ciContract = {
  finalize: /npm run finalize:v136/u.test(ci) || shardedGate,
  build: /npm run build/u.test(ci) || shardedGate,
  currentGateName: /Run V136 blocking release gate/u.test(ci),
  currentReports: /reports\/v136\//u.test(ci),
  screenshotCaptureSeparated: !/capture:screenshots:v13[0-9]/u.test(ci),
  noLegacyGate: !/finalize:v12[0-9]|finalize:v13[0-5]\b|blocking V128 release gate/iu.test(ci),
  noLocalSourceAudit: !/audit:source-local:v133|_source\//u.test(ci),
};
check(
  "CI_WORKFLOW_CURRENT_RELEASE_GATE",
  Object.values(ciContract).every(Boolean),
  ciContract,
  Object.fromEntries(Object.keys(ciContract).map((key) => [key, true]))
);

// V158 (user decision 2026-09-29): production is Vercel only and the GitHub
// Pages workflow was deleted. No workflow may publish to GitHub Pages again.
const WORKFLOW_DIR = resolve(PROJECT_ROOT, ".github/workflows");
const pagesDeployingWorkflows = readdirSync(WORKFLOW_DIR)
  .filter((name) => /\.ya?ml$/u.test(name))
  .filter((name) =>
    /actions\/(?:deploy-pages|upload-pages-artifact|configure-pages)@/u.test(
      readFileSync(resolve(WORKFLOW_DIR, name), "utf8")
    )
  );
const pagesWorkflowRetired =
  !existsSync(resolve(WORKFLOW_DIR, "pages.yml")) && pagesDeployingWorkflows.length === 0;
check(
  "PAGES_WORKFLOW_RETIRED",
  pagesWorkflowRetired,
  { pagesWorkflowRetired, pagesDeployingWorkflows },
  { pagesWorkflowRetired: true, pagesDeployingWorkflows: [] }
);

const generatedAuditSourceIndependent =
  !/VIETNAM_V124_SOURCE_ZIP|vietnam-data\(4\)\.zip/u.test(generatedAudit);
check(
  "SOURCE_ZIP_REQUIRED_IN_CI",
  generatedAuditSourceIndependent &&
    ciContract.noLocalSourceAudit,
  false,
  false,
  { generatedAuditSourceIndependent }
);

const trackedSourceFiles = gitOutput(["ls-files", "--", "_source"])
  .split(/\r?\n/u)
  .filter(Boolean);
check(
  "SOURCE_ZIP_TRACKED",
  trackedSourceFiles.length === 0,
  trackedSourceFiles.length > 0,
  false,
  trackedSourceFiles
);

const ignoredRule = gitOutput([
  "check-ignore",
  "--no-index",
  "--verbose",
  "--",
  "_source/vietnam/v124/vietnam-data(4).zip",
]);
check(
  "SOURCE_ZIP_IGNORE_CONTRACT",
  ignoredRule.length > 0,
  Boolean(ignoredRule),
  true,
  { rule: ignoredRule || null }
);

const worldAssetLfContract = /^public\/data\/world-countries\.geojson\s+text\s+eol=lf\s*$/mu.test(
  gitAttributes
);
check(
  "WORLD_COUNTRIES_CANONICAL_EOL",
  worldAssetLfContract,
  worldAssetLfContract ? "text eol=lf" : "missing",
  "text eol=lf"
);

const failed = checks.filter((row) => row.status === "FAIL");
const report = {
  schemaVersion: "v133",
  audit: "ci-release-contract",
  checks,
  summary: {
    status: failed.length === 0 ? "PASS" : "FAIL",
    passed: checks.length - failed.length,
    failed: failed.length,
    total: checks.length,
    failedChecks: failed.map((row) => row.name),
  },
};
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
for (const row of checks) console.log(JSON.stringify({ type: "check", ...row }));
console.log(JSON.stringify({ type: "summary", ...report.summary }));
process.exitCode = failed.length === 0 ? 0 : 1;
