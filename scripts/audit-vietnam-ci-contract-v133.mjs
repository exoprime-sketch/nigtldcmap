#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const REPORT_PATH = resolve(PROJECT_ROOT, "reports/v133/ci-contract-v133.json");
const CI_PATH = resolve(PROJECT_ROOT, ".github/workflows/ci.yml");
const PAGES_PATH = resolve(PROJECT_ROOT, ".github/workflows/pages.yml");
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
const pages = readFileSync(PAGES_PATH, "utf8");
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

const ciContract = {
  finalize: /npm run finalize:v134/u.test(ci),
  build: /npm run build/u.test(ci),
  currentGateName: /Run V134 blocking release gate/u.test(ci),
  currentReports: /reports\/v134\//u.test(ci),
  screenshotCaptureSeparated: !/capture:screenshots:v134/u.test(ci),
  noLegacyGate: !/finalize:v128|blocking V128 release gate/iu.test(ci),
  noLocalSourceAudit: !/audit:source-local:v133|_source\//u.test(ci),
};
check(
  "CI_WORKFLOW_CURRENT_RELEASE_GATE",
  Object.values(ciContract).every(Boolean),
  ciContract,
  Object.fromEntries(Object.keys(ciContract).map((key) => [key, true]))
);

const pagesContract = {
  finalize: /npm run finalize:v134/u.test(pages),
  build: /npm run build/u.test(pages),
  publicUrl: /PUBLIC_URL/u.test(pages),
  deploy: /actions\/deploy-pages@/u.test(pages),
  smoke: /Smoke deployed production site|Smoke deployed URL/u.test(pages),
  currentReports: /reports\/v134\//u.test(pages),
  screenshotCaptureSeparated: !/capture:screenshots:v134/u.test(pages),
  noLegacyGate: !/finalize:v128|blocking V128 release gate/iu.test(pages),
  noLocalSourceAudit: !/audit:source-local:v133|_source\//u.test(pages),
};
check(
  "PAGES_WORKFLOW_CURRENT_RELEASE_GATE",
  Object.values(pagesContract).every(Boolean),
  pagesContract,
  Object.fromEntries(Object.keys(pagesContract).map((key) => [key, true]))
);

const generatedAuditSourceIndependent =
  !/VIETNAM_V124_SOURCE_ZIP|vietnam-data\(4\)\.zip/u.test(generatedAudit);
check(
  "SOURCE_ZIP_REQUIRED_IN_CI",
  generatedAuditSourceIndependent &&
    ciContract.noLocalSourceAudit &&
    pagesContract.noLocalSourceAudit,
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
