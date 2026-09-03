#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const PACKAGE_PATH = resolve(PROJECT_ROOT, "package.json");
const CI_PATH = resolve(PROJECT_ROOT, ".github/workflows/ci.yml");
const PAGES_PATH = resolve(PROJECT_ROOT, ".github/workflows/pages.yml");
const VISUAL_QA_PATH = resolve(PROJECT_ROOT, ".github/workflows/visual-qa.yml");
const REPORT_PATH = resolve(
  PROJECT_ROOT,
  "reports/v134/visual-qa-contract-v134.json"
);

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const packageJson = JSON.parse(readText(PACKAGE_PATH));
const scripts = packageJson.scripts || {};
const ci = readText(CI_PATH);
const pages = readText(PAGES_PATH);
const visualQa = readText(VISUAL_QA_PATH);
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

function referencedNpmScripts(command) {
  return [...String(command || "").matchAll(/\bnpm\s+run\s+([\w:.-]+)/gu)].map(
    (match) => match[1]
  );
}

function referencedNodeScripts(command) {
  return [
    ...String(command || "").matchAll(
      /\bnode\s+(?:\.\/)?(scripts\/[\w./-]+\.mjs)\b/gu
    ),
  ].map((match) => match[1]);
}

function npmScriptClosure(entryName) {
  const seen = new Set();
  const missing = new Set();
  const commands = [];
  const nodePaths = new Set();

  function visit(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const command = scripts[name];
    if (typeof command !== "string") {
      missing.add(name);
      return;
    }
    commands.push({ name, command });
    for (const path of referencedNodeScripts(command)) nodePaths.add(path);
    for (const dependency of referencedNpmScripts(command)) visit(dependency);
  }

  visit(entryName);
  return {
    names: [...seen],
    missing: [...missing],
    commands,
    nodePaths: [...nodePaths],
  };
}

const finalizeClosure = npmScriptClosure("finalize:v134");
const releaseSourceCandidates = new Set([
  ...finalizeClosure.nodePaths.filter((path) =>
    /(?:release|finalize)[\w-]*v134\.mjs$/u.test(path)
  ),
  "scripts/audit-vietnam-release-v134.mjs",
]);
const releaseSources = [...releaseSourceCandidates]
  .map((path) => ({ path, source: readText(resolve(PROJECT_ROOT, path)) }))
  .filter((item) => item.source);
const blockingContractText = [
  ...finalizeClosure.commands.map((item) => item.command),
  ...releaseSources.map((item) => item.source),
].join("\n");
const mapPopupAuditSource = readText(
  resolve(PROJECT_ROOT, "scripts/audit-vietnam-map-popup-v133.mjs")
);

const requiredPackageScripts = {
  "audit:visual-qa-contract:v134":
    "node scripts/audit-vietnam-visual-qa-contract-v134.mjs",
  "capture:screenshots:v134":
    "node scripts/capture-vietnam-v134-screenshots.mjs",
};
const packageScriptMismatches = Object.entries(requiredPackageScripts)
  .filter(([name, expected]) => scripts[name] !== expected)
  .map(([name, expected]) => ({ name, actual: scripts[name] || null, expected }));
check(
  "V134_VISUAL_QA_SCRIPT_CONTRACT",
  packageScriptMismatches.length === 0,
  Object.keys(requiredPackageScripts).length - packageScriptMismatches.length,
  Object.keys(requiredPackageScripts).length,
  packageScriptMismatches
);

const releaseScreenshotReferences = [
  ...blockingContractText.matchAll(
    /(?:npm\s+run\s+capture:screenshots[\w:.-]*|node\s+(?:\.\/)?scripts\/capture-[\w./-]*screenshots[\w./-]*\.mjs)/gu
  ),
].map((match) => match[0]);
check(
  "SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER",
  releaseScreenshotReferences.length === 0,
  releaseScreenshotReferences.length > 0,
  false,
  releaseScreenshotReferences
);

const blockingFunctionalCommands = {
  generatedData: /\baudit:generated-data:v133\b/u.test(blockingContractText),
  mapFocus: /\baudit:map-focus:v133\b/u.test(blockingContractText),
  mapPopup: /\baudit:map-popup:v133\b/u.test(blockingContractText),
  mapLayerDistinction: /\baudit:map-layer-distinction:v133\b/u.test(
    blockingContractText
  ),
  mapClickDetail:
    /\baudit:map-popup:v133\b/u.test(blockingContractText) &&
    /CLICK_FEATURE_WITHOUT_DETAIL/u.test(mapPopupAuditSource),
};
check(
  "FUNCTIONAL_BROWSER_AUDIT_IS_RELEASE_BLOCKER",
  Object.values(blockingFunctionalCommands).every(Boolean),
  blockingFunctionalCommands,
  Object.fromEntries(
    Object.keys(blockingFunctionalCommands).map((name) => [name, true])
  )
);

const releaseWorkflowContract = (source, reportPath) => ({
  finalizeCurrentGate: /\brun:\s*npm\s+run\s+finalize:v135\s*$/mu.test(source),
  productionBuild: /\brun:\s*npm\s+run\s+build\s*$/mu.test(source),
  noScreenshotCapture:
    !/npm\s+run\s+capture:screenshots|capture-[\w./-]*screenshots/iu.test(
      source
    ),
  currentReports: reportPath ? /reports\/v135\//u.test(source) : true,
});
const ciContract = releaseWorkflowContract(ci, true);
const pagesContract = releaseWorkflowContract(pages, false);
check(
  "CI_BLOCKING_RELEASE_JOB",
  Object.values(ciContract).every(Boolean),
  ciContract,
  Object.fromEntries(Object.keys(ciContract).map((name) => [name, true]))
);
check(
  "PAGES_BLOCKING_RELEASE_JOB",
  Object.values(pagesContract).every(Boolean),
  pagesContract,
  Object.fromEntries(Object.keys(pagesContract).map((name) => [name, true]))
);

const captureStep = visualQa.match(
  /- name:\s*Capture V135 screenshots[\s\S]*?(?=\n\s{6}- name:|\n\s{4}\w|$)/u
)?.[0] || "";
const artifactStep = visualQa.match(
  /- name:\s*Upload V135 screenshot artifacts[\s\S]*?(?=\n\s{6}- name:|\n\s{4}\w|$)/u
)?.[0] || "";
const visualWorkflowContract = {
  separateWorkflow: visualQa.length > 0,
  productionBuild: /\brun:\s*npm\s+run\s+build\s*$/mu.test(visualQa),
  captureCurrentScreenshots: /\brun:\s*npm\s+run\s+capture:screenshots:v135\s*$/mu.test(
    captureStep
  ),
  captureContinuesOnError: /continue-on-error:\s*true/u.test(captureStep),
  artifactAlwaysUploaded: /if:\s*always\(\)/u.test(artifactStep),
  artifactPath: /path:\s*reports\/v135\/screenshots\//u.test(artifactStep),
  noFinalizeDependency: !/npm\s+run\s+finalize:v13[45]/u.test(visualQa),
};
check(
  "NON_BLOCKING_VISUAL_QA_WORKFLOW",
  Object.values(visualWorkflowContract).every(Boolean),
  visualWorkflowContract,
  Object.fromEntries(
    Object.keys(visualWorkflowContract).map((name) => [name, true])
  )
);

const captureExcludedFromFinalize =
  releaseScreenshotReferences.length === 0 &&
  ciContract.noScreenshotCapture &&
  pagesContract.noScreenshotCapture;
const functionalAuditBlocking =
  Object.values(blockingFunctionalCommands).every(Boolean) &&
  ciContract.finalizeCurrentGate &&
  pagesContract.finalizeCurrentGate;
const failed = checks.filter((row) => row.status === "FAIL");
const report = {
  schemaVersion: "v134-visual-qa-contract-1",
  generatedAt: new Date().toISOString(),
  audit: "visual-qa-contract:v134",
  checks,
  contract: {
    SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER: !captureExcludedFromFinalize,
    FUNCTIONAL_BROWSER_AUDIT_IS_RELEASE_BLOCKER: functionalAuditBlocking,
    releaseWorkflows: [".github/workflows/ci.yml", ".github/workflows/pages.yml"],
    visualQaWorkflow: ".github/workflows/visual-qa.yml",
    blockingEntryPoint: "npm run finalize:v135",
    nonBlockingEntryPoint: "npm run capture:screenshots:v135",
  },
  evidence: {
    finalizeClosure,
    releaseSourcePaths: releaseSources.map((item) => item.path),
    releaseScreenshotReferences,
    blockingFunctionalCommands,
    ciContract,
    pagesContract,
    visualWorkflowContract,
  },
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
