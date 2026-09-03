#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, readJson } from "./v125/audit-utils.mjs";
import { finishAuditV135, reportStatusV135 } from "./v135/audit-helpers.mjs";

const audit = new AuditV125("release:v135");

// V135 keeps the V134 boundary: functional data, DOM and build gates block the
// release, screenshot capture stays in the separate non-blocking visual QA job.
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
  { name: "V135_FINDER_CARD", command: "npm run audit:finder-card:v135" },
  { name: "V135_TEMPORAL_DEPTH", command: "npm run audit:temporal-depth:v135" },
  { name: "V135_DETAIL_HIERARCHY", command: "npm run audit:detail-hierarchy:v135" },
  { name: "V135_MAP_GUIDE", command: "npm run audit:map-guide:v135" },
  { name: "V135_MAP_ACCESS", command: "npm run audit:map-access:v135" },
  { name: "V135_MAP_COMPARE", command: "npm run audit:map-compare:v135" },
  { name: "V135_PUBLIC_SCREEN", command: "npm run audit:public-screen:v135" },
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
  finderCard: "reports/v135/finder-card-audit-v135.json",
  temporalDepth: "reports/v135/temporal-depth-audit-v135.json",
  detailHierarchy: "reports/v135/detail-hierarchy-audit-v135.json",
  mapGuide: "reports/v135/map-guide-audit-v135.json",
  mapAccess: "reports/v135/map-access-audit-v135.json",
  mapCompare: "reports/v135/map-compare-audit-v135.json",
  publicScreen: "reports/v135/public-screen-audit-v135.json",
};
const reports = Object.fromEntries(
  Object.entries(reportPaths).map(([key, path]) => [key, readJson(resolve(PROJECT_ROOT, path))])
);
const statuses = Object.fromEntries(
  Object.entries(reports).map(([key, entry]) => [key, reportStatusV135(entry)])
);
const allCommandsPassed =
  commandResults.length === commands.length &&
  commandResults.every((item) => item.exitCode === 0);

const finderCard = reports.finderCard.value || {};
const temporal = reports.temporalDepth.value || {};
const detail = reports.detailHierarchy.value || {};
const mapAccess = reports.mapAccess.value || {};
const mapGuide = reports.mapGuide.value || {};
const mapCompare = reports.mapCompare.value || {};

audit.check("FRAMEWORK_ELEMENTS", reports.glossary.value?.frameworkElements === 152, reports.glossary.value?.frameworkElements, 152);
audit.check("ACCOUNTED_ELEMENTS", reports.glossary.value?.accountedElements === 152, reports.glossary.value?.accountedElements, 152);

audit.check("V130_REGRESSION", ["v130ProjectScope", "v130Dedup", "v130Geography"].every((key) => statuses[key] === "PASS"), { projectScope: statuses.v130ProjectScope, dedup: statuses.v130Dedup, geography: statuses.v130Geography }, "PASS");
audit.check("V131_REGRESSION", ["v131Naming", "v131Cards"].every((key) => statuses[key] === "PASS"), { naming: statuses.v131Naming, cards: statuses.v131Cards }, "PASS");
audit.check("V132_REGRESSION", ["v132Composition", "v132Portfolio", "v132MapTooltip", "v132Benchmark"].every((key) => statuses[key] === "PASS"), { composition: statuses.v132Composition, portfolio: statuses.v132Portfolio, mapTooltip: statuses.v132MapTooltip, benchmark: statuses.v132Benchmark }, "PASS");
audit.check("V133_REGRESSION", ["v133MapFocus", "v133MapPopup", "v133LayerDistinction", "generatedData", "ciContract"].every((key) => statuses[key] === "PASS"), { focus: statuses.v133MapFocus, popup: statuses.v133MapPopup, layerDistinction: statuses.v133LayerDistinction, generatedData: statuses.generatedData, ciContract: statuses.ciContract }, "PASS");
audit.check("V134_REGRESSION", ["glossary", "oda", "drought", "publicCopy", "visualContract"].every((key) => statuses[key] === "PASS"), { glossary: statuses.glossary, oda: statuses.oda, drought: statuses.drought, publicCopy: statuses.publicCopy, visualContract: statuses.visualContract }, "PASS");

audit.check("FINDER_INTERNAL_METADATA_COUNT", finderCard.finderInternalMetadataCount === 0, finderCard.finderInternalMetadataCount ?? null, 0);
audit.check("FINDER_DUPLICATE_MEASURE_TITLE_COUNT", finderCard.finderDuplicateMeasureTitleCount === 0, finderCard.finderDuplicateMeasureTitleCount ?? null, 0);

audit.check("SINGLE_YEAR_TIME_SERIES_COUNT", temporal.singleYearTimeSeriesCount === 0, temporal.singleYearTimeSeriesCount ?? null, 0);
audit.check("TWO_YEAR_GENERIC_TREND_COUNT", temporal.twoYearGenericTrendCount === 0, temporal.twoYearGenericTrendCount ?? null, 0);
audit.check("ONE_POINT_CHART_COUNT", temporal.onePointChartCount === 0, temporal.onePointChartCount ?? null, 0);

audit.check("DETAIL_METADATA_BEFORE_ANALYSIS_COUNT", detail.detailMetadataBeforeAnalysisCount === 0, detail.detailMetadataBeforeAnalysisCount ?? null, 0);
audit.check("RAW_MATRIX_AS_PRIMARY_COUNT", detail.rawMatrixAsPrimaryCount === 0, detail.rawMatrixAsPrimaryCount ?? null, 0);

audit.check("MAP_LAYER_COUNT", mapAccess.mapLayerCount === 12, mapAccess.mapLayerCount ?? null, 12);
audit.check("ALL_MAP_LAYER_ACCESS_COUNT", mapAccess.allMapLayerAccessCount === 12, mapAccess.allMapLayerAccessCount ?? null, 12);
audit.check("MAP_PRESET_COUNT", mapAccess.mapPresetCount === 5, mapAccess.mapPresetCount ?? null, 5);
audit.check("LEFT_PANEL_POINTER_RESIZE_PASS", mapAccess.leftPanelPointerResizePass === true, mapAccess.leftPanelPointerResizePass ?? null, true);
audit.check("NORMAL_CONTEXT_LAYER_MAX", Number(mapAccess.normalContextLayerMaxObserved) <= 1, mapAccess.normalContextLayerMaxObserved ?? null, 1);
audit.check("MAP_TOOLTIP_UI_STATE_LABEL_COUNT", mapAccess.mapTooltipUiStateLabelCount === 0, mapAccess.mapTooltipUiStateLabelCount ?? null, 0);

audit.check("MAP_GUIDE_DEFAULT_OPEN", mapGuide.mapGuideDefaultOpen === false, mapGuide.mapGuideDefaultOpen ?? null, false);
audit.check("MAP_POLICY_PARAGRAPH_COUNT", mapGuide.mapPolicyParagraphCount === 0, mapGuide.mapPolicyParagraphCount ?? null, 0);
audit.check("MAP_COUNTRY_INFO_BUTTON_COUNT", mapGuide.mapCountryInfoButtonCount === 0 && mapAccess.mapLayerCount === 12, { guide: mapGuide.mapCountryInfoButtonCount ?? null }, 0);

audit.check("COMPARE_RUNTIME_ERROR_COUNT", mapCompare.compareRuntimeErrorCount === 0, mapCompare.compareRuntimeErrorCount ?? null, 0);
audit.check("COMPARE_SIDE_BY_SIDE_DESKTOP", mapCompare.compareSideBySideDesktop === true, mapCompare.compareSideBySideDesktop ?? null, true);
audit.check("COMPARE_STACKED_MOBILE", mapCompare.compareStackedMobile === true, mapCompare.compareStackedMobile ?? null, true);

audit.check("V135_PUBLIC_SCREEN", statuses.publicScreen === "PASS", statuses.publicScreen, "PASS");

audit.check("SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER", !commands.some((entry) => /screenshot|capture:/iu.test(entry.command)), commands.map((entry) => entry.command), "no screenshot command");
audit.check("FUNCTIONAL_BROWSER_AUDIT_IS_RELEASE_BLOCKER", ["V133_MAP_POPUP", "V134_GLOSSARY", "V135_MAP_COMPARE", "V135_TEMPORAL_DEPTH"].every((name) => commands.some((entry) => entry.name === name)), commands.map((entry) => entry.name), "V133/V134/V135 functional DOM audits");
audit.check("REMAINING_BLOCKERS", allCommandsPassed, commandResults.filter((item) => item.exitCode !== 0), []);

finishAuditV135(audit, "release-audit-v135.json", {
  commandResults,
  reportStatuses: statuses,
  frameworkElements: 152,
  accountedElements: 152,
  screenshotCaptureIsReleaseBlocker: false,
  functionalBrowserAuditIsReleaseBlocker: true,
  remainingBlockers: allCommandsPassed ? 0 : 1,
});
