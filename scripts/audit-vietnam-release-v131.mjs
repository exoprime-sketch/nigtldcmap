#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  readJson,
} from "./v125/audit-utils.mjs";
import { finishAuditV131 } from "./v131/audit-helpers.mjs";

const audit = new AuditV125("release:v131");
const commands = [
  { name: "V130_RELEASE_REGRESSION", command: "npm run finalize:v130" },
  { name: "PUBLIC_NAMING_V131", command: "npm run audit:public-naming:v131" },
  { name: "ENTITY_CARDS_V131", command: "npm run audit:entity-cards:v131" },
  { name: "MAP_COPY_V131", command: "npm run audit:map-copy:v131" },
  { name: "ROUTE_CONTENT_V131", command: "npm run audit:route-content:v131" },
  { name: "PRODUCTION_BUILD", command: "npm run build" },
];

const commandResults = [];
for (const entry of commands) {
  const result = spawnSync(entry.command, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
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

const naming = readJson(resolve(PROJECT_ROOT, "reports/v131/public-naming-audit-v131.json"));
const cards = readJson(resolve(PROJECT_ROOT, "reports/v131/entity-card-audit-v131.json"));
const mapCopy = readJson(resolve(PROJECT_ROOT, "reports/v131/map-copy-audit-v131.json"));
const routes = readJson(resolve(PROJECT_ROOT, "reports/v131/route-content-audit-v131.json"));
const semanticFit = readJson(resolve(PROJECT_ROOT, "reports/v129/visualization-semantic-fit-v129.json"));
const spatial = readJson(resolve(PROJECT_ROOT, "reports/v130/spatial-summary-v130.json"));

audit.check(
  "V131_REPORTS_PASS",
  [naming.value, cards.value, mapCopy.value, routes.value].every(
    (report) => report?.status === "PASS"
  ),
  {
    naming: naming.value?.status || naming.error,
    cards: cards.value?.status || cards.error,
    mapCopy: mapCopy.value?.status || mapCopy.error,
    routes: routes.value?.status || routes.error,
  },
  { naming: "PASS", cards: "PASS", mapCopy: "PASS", routes: "PASS" }
);
audit.check(
  "VISUALIZATION_FIT_152",
  semanticFit.value?.summary?.visualizationFitCount === 152 &&
    semanticFit.value?.summary?.visualizationFitFailureCount === 0,
  semanticFit.value?.summary?.fitCounts,
  {
    fit: 75,
    "fit-with-caveat": 69,
    "specialized-required": 3,
    "status-only": 5,
    fail: 0,
  }
);
audit.check(
  "FINAL_MAP_CONTRACT",
  spatial.value?.mapSelectedElements === 12 &&
    spatial.value?.mapFeatureOrScopeCount === 2900,
  {
    layers: spatial.value?.mapSelectedElements,
    featureOrScopeCount: spatial.value?.mapFeatureOrScopeCount,
  },
  { layers: 12, featureOrScopeCount: 2900 }
);
audit.check(
  "REMAINING_BLOCKER",
  commandResults.every((result) => result.exitCode === 0) &&
    [naming.value, cards.value, mapCopy.value, routes.value].every(
      (report) => report?.status === "PASS"
    ),
  0,
  0
);

finishAuditV131(audit, "release-audit-v131.json", {
  commandResults,
  frameworkElements: 152,
  accountedElements: 152,
  visualizationFit: "152/152",
  statusOnlyElements: 5,
  finalMapLayers: 12,
  finalMapFeatureOrScopeCount: 2900,
  remainingBlockers: commandResults.every((result) => result.exitCode === 0)
    ? 0
    : 1,
});
