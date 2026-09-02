#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, readJson } from "./v125/audit-utils.mjs";
import { finishAuditV134 } from "./v134/audit-helpers.mjs";

const audit = new AuditV125("release:v134");

// Functional data, browser and build gates are blocking. Screenshot generation
// is intentionally absent and runs in the separate visual QA workflow.
const commands = [
  { name: "PRODUCTION_BUILD_FOR_RUNTIME", command: "npm run build" },
  { name: "V133_GENERATED_DATA", command: "npm run audit:generated-data:v133" },
  { name: "V133_CI_CONTRACT", command: "npm run audit:ci-contract:v133" },
  { name: "V130_PROJECT_SCOPE", command: "npm run audit:project-scope:v130" },
  { name: "V130_MAP_DEDUP", command: "npm run audit:map-dedup:v130" },
  { name: "V130_SEMANTIC_GEOGRAPHY", command: "npm run audit:map-semantic-geography:v130" },
  { name: "V131_PUBLIC_NAMING", command: "npm run audit:public-naming:v131" },
  { name: "V131_ENTITY_CARDS", command: "npm run audit:entity-cards:v131" },
  { name: "V132_COMPOSITION", command: "npm run audit:composition:v132" },
  { name: "V132_PORTFOLIO", command: "npm run audit:portfolio-analysis:v132" },
  { name: "V132_MAP_TOOLTIP", command: "npm run audit:map-tooltip:v132" },
  { name: "V132_BENCHMARK_FIT", command: "npm run audit:benchmark-fit:v132" },
  { name: "V133_MAP_FOCUS", command: "npm run audit:map-focus:v133" },
  { name: "V133_MAP_POPUP", command: "npm run audit:map-popup:v133" },
  { name: "V133_LAYER_DISTINCTION", command: "npm run audit:map-layer-distinction:v133" },
  { name: "V134_GLOSSARY", command: "npm run audit:glossary:v134" },
  { name: "V134_ODA_ANALYSIS", command: "npm run audit:oda-analysis:v134" },
  { name: "V134_DROUGHT_ANALYSIS", command: "npm run audit:drought-analysis:v134" },
  { name: "V134_PUBLIC_COPY", command: "npm run audit:public-copy:v134" },
  { name: "V134_VISUAL_QA_CONTRACT", command: "npm run audit:visual-qa-contract:v134" },
];

const commandResults = [];
for (const entry of commands) {
  const result = spawnSync(entry.command, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const record = {
    name: entry.name,
    command: entry.command,
    exitCode: result.status,
    signal: result.signal,
    error: result.error?.message || null,
  };
  commandResults.push(record);
  audit.check(entry.name, result.status === 0, record, { exitCode: 0 });
  if (result.status !== 0) break;
}

const reportPaths = {
  generatedData: "reports/v133/generated-data-audit-v133.json",
  ciContract: "reports/v133/ci-contract-v133.json",
  v130ProjectScope: "reports/v130/project-scope-audit-result-v130.json",
  v130Dedup: "reports/v130/map-dedup-audit-result-v130.json",
  v130Geography: "reports/v130/map-semantic-geography-audit-result-v130.json",
  v131Naming: "reports/v131/public-naming-audit-v131.json",
  v131Cards: "reports/v131/entity-card-audit-v131.json",
  v132Composition: "reports/v132/composition-audit-v132.json",
  v132Portfolio: "reports/v132/portfolio-analysis-audit-v132.json",
  v132MapTooltip: "reports/v132/map-tooltip-audit-v132.json",
  v132Benchmark: "reports/v132/benchmark-fit-audit-v132.json",
  v133MapFocus: "reports/v133/map-focus-audit-v133.json",
  v133MapPopup: "reports/v133/map-popup-audit-v133.json",
  v133LayerDistinction: "reports/v133/map-layer-distinction-audit-v133.json",
  glossary: "reports/v134/glossary-audit-v134.json",
  oda: "reports/v134/oda-analysis-audit-v134.json",
  drought: "reports/v134/drought-analysis-audit-v134.json",
  publicCopy: "reports/v134/public-copy-audit-v134.json",
  visualContract: "reports/v134/visual-qa-contract-v134.json",
};
const reports = Object.fromEntries(
  Object.entries(reportPaths).map(([key, path]) => [key, readJson(resolve(PROJECT_ROOT, path))])
);
function status(entry) {
  return entry?.error || entry?.value?.status || entry?.value?.summary?.status || "missing";
}
const statuses = Object.fromEntries(Object.entries(reports).map(([key, entry]) => [key, status(entry)]));
const allCommandsPassed =
  commandResults.length === commands.length &&
  commandResults.every((item) => item.exitCode === 0);

audit.check(
  "FRAMEWORK_ELEMENTS",
  reports.glossary.value?.frameworkElements === 152,
  reports.glossary.value?.frameworkElements,
  152
);
audit.check(
  "ACCOUNTED_ELEMENTS",
  reports.glossary.value?.accountedElements === 152,
  reports.glossary.value?.accountedElements,
  152
);
audit.check("V130_REGRESSION", ["v130ProjectScope", "v130Dedup", "v130Geography"].every((key) => statuses[key] === "PASS"), { projectScope: statuses.v130ProjectScope, dedup: statuses.v130Dedup, geography: statuses.v130Geography }, "PASS");
audit.check("V131_REGRESSION", ["v131Naming", "v131Cards"].every((key) => statuses[key] === "PASS"), { naming: statuses.v131Naming, cards: statuses.v131Cards }, "PASS");
audit.check("V132_REGRESSION", ["v132Composition", "v132Portfolio", "v132MapTooltip", "v132Benchmark"].every((key) => statuses[key] === "PASS"), { composition: statuses.v132Composition, portfolio: statuses.v132Portfolio, mapTooltip: statuses.v132MapTooltip, benchmark: statuses.v132Benchmark }, "PASS");
audit.check("V133_MAP_REGRESSION", ["v133MapFocus", "v133MapPopup", "v133LayerDistinction"].every((key) => statuses[key] === "PASS"), { focus: statuses.v133MapFocus, popup: statuses.v133MapPopup, layerDistinction: statuses.v133LayerDistinction }, "PASS");
audit.check("V134_COMPREHENSION", ["glossary", "oda", "drought", "publicCopy", "visualContract"].every((key) => statuses[key] === "PASS"), { glossary: statuses.glossary, oda: statuses.oda, drought: statuses.drought, publicCopy: statuses.publicCopy, visualContract: statuses.visualContract }, "PASS");
audit.check("SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER", !commands.some((entry) => /screenshot|capture:/iu.test(entry.command)), commands.map((entry) => entry.command), "no screenshot command");
audit.check("FUNCTIONAL_BROWSER_AUDIT_IS_RELEASE_BLOCKER", commands.some((entry) => entry.name === "V133_MAP_POPUP") && commands.some((entry) => entry.name === "V134_GLOSSARY"), commands.map((entry) => entry.name), "map popup and V134 functional DOM audits");
audit.check("REMAINING_BLOCKER", allCommandsPassed, commandResults.filter((item) => item.exitCode !== 0), []);

finishAuditV134(audit, "release-audit-v134.json", {
  commandResults,
  reportStatuses: statuses,
  frameworkElements: 152,
  accountedElements: 152,
  screenshotCaptureIsReleaseBlocker: false,
  functionalBrowserAuditIsReleaseBlocker: true,
  remainingBlockers: allCommandsPassed ? 0 : 1,
});
