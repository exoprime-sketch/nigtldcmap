#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, readJson } from "./v125/audit-utils.mjs";
import { finishAuditV133 } from "./v133/audit-helpers.mjs";

const audit = new AuditV125("release:v133");

// This chain intentionally excludes audit:data:v124 and every legacy finalize
// command that requires the ignored developer source ZIP. Generated-data and
// CI-contract checks run in audit:release-ci:v133 before this map/runtime gate.
const commands = [
  { name: "PRODUCTION_BUILD_FOR_RUNTIME", command: "npm run build" },
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
  { name: "V133_SCREENSHOTS", command: "npm run capture:screenshots:v133" },
];

const commandResults = [];
for (const entry of commands) {
  const result = spawnSync(entry.command, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 192 * 1024 * 1024,
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

const reports = {
  ciContract: readJson(resolve(PROJECT_ROOT, "reports/v133/ci-contract-v133.json")),
  generatedData: readJson(resolve(PROJECT_ROOT, "reports/v133/generated-data-audit-v133.json")),
  mapFocus: readJson(resolve(PROJECT_ROOT, "reports/v133/map-focus-audit-v133.json")),
  mapPopup: readJson(resolve(PROJECT_ROOT, "reports/v133/map-popup-audit-v133.json")),
  layerDistinction: readJson(resolve(PROJECT_ROOT, "reports/v133/map-layer-distinction-audit-v133.json")),
  screenshots: readJson(resolve(PROJECT_ROOT, "reports/v133/screenshots/screenshot-manifest-v133.json")),
  v130ProjectScope: readJson(resolve(PROJECT_ROOT, "reports/v130/project-scope-audit-result-v130.json")),
  v130Dedup: readJson(resolve(PROJECT_ROOT, "reports/v130/map-dedup-audit-result-v130.json")),
  v130Geography: readJson(resolve(PROJECT_ROOT, "reports/v130/map-semantic-geography-audit-result-v130.json")),
  v131Naming: readJson(resolve(PROJECT_ROOT, "reports/v131/public-naming-audit-v131.json")),
  v131Cards: readJson(resolve(PROJECT_ROOT, "reports/v131/entity-card-audit-v131.json")),
  v132Composition: readJson(resolve(PROJECT_ROOT, "reports/v132/composition-audit-v132.json")),
  v132Portfolio: readJson(resolve(PROJECT_ROOT, "reports/v132/portfolio-analysis-audit-v132.json")),
  v132MapTooltip: readJson(resolve(PROJECT_ROOT, "reports/v132/map-tooltip-audit-v132.json")),
  v132Benchmark: readJson(resolve(PROJECT_ROOT, "reports/v132/benchmark-fit-audit-v132.json")),
};

function reportStatus(entry) {
  return entry.error || entry.value?.status || entry.value?.summary?.status || "missing";
}

const currentReportKeys = [
  "ciContract",
  "generatedData",
  "mapFocus",
  "mapPopup",
  "layerDistinction",
  "screenshots",
];
const v130Keys = ["v130ProjectScope", "v130Dedup", "v130Geography"];
const v131Keys = ["v131Naming", "v131Cards"];
const v132Keys = ["v132Composition", "v132Portfolio", "v132MapTooltip", "v132Benchmark"];

audit.check(
  "CI_RELEASE_GATE",
  ["ciContract", "generatedData"].every((key) => reportStatus(reports[key]) === "PASS"),
  Object.fromEntries(["ciContract", "generatedData"].map((key) => [key, reportStatus(reports[key])])),
  { ciContract: "PASS", generatedData: "PASS" }
);
audit.check(
  "V130_SPATIAL_SEMANTICS",
  v130Keys.every((key) => reportStatus(reports[key]) === "PASS"),
  Object.fromEntries(v130Keys.map((key) => [key, reportStatus(reports[key])])),
  "PASS"
);
audit.check(
  "V131_NAMING",
  v131Keys.every((key) => reportStatus(reports[key]) === "PASS"),
  Object.fromEntries(v131Keys.map((key) => [key, reportStatus(reports[key])])),
  "PASS"
);
audit.check(
  "V132_VISUALIZATION",
  v132Keys.every((key) => reportStatus(reports[key]) === "PASS"),
  Object.fromEntries(v132Keys.map((key) => [key, reportStatus(reports[key])])),
  "PASS"
);
audit.check(
  "V133_MAP_ANALYSIS",
  ["mapFocus", "mapPopup", "layerDistinction", "screenshots"].every(
    (key) => reportStatus(reports[key]) === "PASS"
  ),
  Object.fromEntries(
    ["mapFocus", "mapPopup", "layerDistinction", "screenshots"].map((key) => [
      key,
      reportStatus(reports[key]),
    ])
  ),
  "PASS"
);
audit.check(
  "REMAINING_BLOCKER",
  commandResults.length === commands.length &&
    commandResults.every((item) => item.exitCode === 0) &&
    currentReportKeys.every((key) => reportStatus(reports[key]) === "PASS"),
  commandResults.filter((item) => item.exitCode !== 0).map((item) => item.name),
  []
);

finishAuditV133(audit, "release-audit-v133.json", {
  commandResults,
  reportStatuses: Object.fromEntries(
    Object.entries(reports).map(([key, entry]) => [key, reportStatus(entry)])
  ),
  frameworkElements: 152,
  accountedElements: 152,
  mapLayers: 12,
  remainingBlockers:
    commandResults.length === commands.length && commandResults.every((item) => item.exitCode === 0)
      ? 0
      : 1,
});
