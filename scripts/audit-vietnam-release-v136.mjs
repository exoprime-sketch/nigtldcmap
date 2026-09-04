#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, readJson } from "./v125/audit-utils.mjs";
import { finishAuditV136, reportStatusV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("release:v136");

// V136 keeps the V134 boundary: functional data, DOM and build gates block the
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
  { name: "V136_PUBLIC_TEXT", command: "npm run audit:public-text:v136" },
  { name: "V136_DUPLICATE_COPY", command: "npm run audit:duplicate-copy:v136" },
  { name: "V136_MAP_LIST_UI", command: "npm run audit:map-list-ui:v136" },
  { name: "V136_MAP_COPY", command: "npm run audit:map-copy:v136" },
  { name: "V136_PUBLIC_CONTROLS", command: "npm run audit:public-controls:v136" },
  { name: "V136_FINDER_SCROLL", command: "npm run audit:finder-scroll:v136" },
  { name: "V136_2_GENERIC_DETAIL_PUBLIC", command: "npm run audit:generic-detail-public:v136-2" },
  { name: "V136_HUMAN_REVIEW", command: "npm run audit:human-review:v136" },
  { name: "V136_WORKFLOW", command: "npm run audit:workflow:v136" },
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
  generatedData: "reports/v133/generated-data-audit-v133.json",
  ciContract: "reports/v133/ci-contract-v133.json",
  glossary: "reports/v134/glossary-audit-v134.json",
  oda: "reports/v134/oda-analysis-audit-v134.json",
  drought: "reports/v134/drought-analysis-audit-v134.json",
  publicCopy: "reports/v134/public-copy-audit-v134.json",
  visualContract: "reports/v134/visual-qa-contract-v134.json",
  v135FinderCard: "reports/v135/finder-card-audit-v135.json",
  v135TemporalDepth: "reports/v135/temporal-depth-audit-v135.json",
  v135DetailHierarchy: "reports/v135/detail-hierarchy-audit-v135.json",
  v135MapGuide: "reports/v135/map-guide-audit-v135.json",
  v135MapAccess: "reports/v135/map-access-audit-v135.json",
  v135MapCompare: "reports/v135/map-compare-audit-v135.json",
  v135PublicScreen: "reports/v135/public-screen-audit-v135.json",
  publicText: "reports/v136/public-text-audit-v136.json",
  duplicateCopy: "reports/v136/duplicate-copy-audit-v136.json",
  mapListUi: "reports/v136/map-list-ui-audit-v136.json",
  mapCopy: "reports/v136/map-copy-audit-v136.json",
  publicControls: "reports/v136/public-controls-audit-v136.json",
  finderScroll: "reports/v136/finder-scroll-audit-v136.json",
  genericDetailPublic: "reports/v136/generic-detail-public-audit-v136-2.json",
  humanReview: "reports/v136/human-review-audit-v136.json",
  workflow: "reports/v136/workflow-audit-v136.json",
};
const reports = Object.fromEntries(
  Object.entries(reportPaths).map(([key, path]) => [key, readJson(resolve(PROJECT_ROOT, path))])
);
const statuses = Object.fromEntries(
  Object.entries(reports).map(([key, entry]) => [key, reportStatusV136(entry)])
);
const allCommandsPassed =
  commandResults.length === commands.length &&
  commandResults.every((item) => item.exitCode === 0);

const text = reports.publicText.value || {};
const duplicate = reports.duplicateCopy.value || {};
const listUi = reports.mapListUi.value || {};
const controls = reports.publicControls.value || {};
const scroll = reports.finderScroll.value || {};
const review = reports.humanReview.value || {};
const workflow = reports.workflow.value || {};
const mapAccess = reports.v135MapAccess.value || {};
const mapGuide = reports.v135MapGuide.value || {};
const glossary = reports.glossary.value || {};

const group = (keys) => keys.every((key) => statuses[key] === "PASS");

audit.check("FRAMEWORK_ELEMENTS", glossary.frameworkElements === 152, glossary.frameworkElements, 152);
audit.check("ACCOUNTED_ELEMENTS", glossary.accountedElements === 152, glossary.accountedElements, 152);
audit.check("PUBLIC_ROUTE_COUNT", Number(text.publicRouteCount) >= 157, text.publicRouteCount ?? null, ">=157");

audit.check("INTERNAL_PUBLIC_TOKEN_COUNT", text.internalPublicTokenCount === 0, text.internalPublicTokenCount ?? null, 0);
audit.check("DUPLICATE_VISIBLE_COPY_COUNT", duplicate.duplicateVisibleCopyCount === 0, duplicate.duplicateVisibleCopyCount ?? null, 0);
audit.check("AWKWARD_GENERIC_COPY_COUNT", text.awkwardGenericCopyCount === 0, text.awkwardGenericCopyCount ?? null, 0);

audit.check("MAP_LAYER_COUNT", mapAccess.mapLayerCount === 12, mapAccess.mapLayerCount ?? null, 12);
audit.check("ALL_MAP_LAYER_ACCESS_COUNT", mapAccess.allMapLayerAccessCount === 12, mapAccess.allMapLayerAccessCount ?? null, 12);
audit.check("MAP_PRESET_COUNT", mapAccess.mapPresetCount === 5, mapAccess.mapPresetCount ?? null, 5);
audit.check("MAP_DATA_ITEM_COUNT", listUi.mapDataItemCount === 12, listUi.mapDataItemCount ?? null, 12);
audit.check("MAP_NATIVE_BULLET_COUNT", listUi.mapNativeBulletCount === 0 && controls.mapNativeBulletCount === 0, { list: listUi.mapNativeBulletCount, controls: controls.mapNativeBulletCount }, 0);
audit.check("MAP_NATIVE_BUTTON_STYLE_COUNT", listUi.mapNativeButtonStyleCount === 0 && controls.mapNativeButtonStyleCount === 0, { list: listUi.mapNativeButtonStyleCount, controls: controls.mapNativeButtonStyleCount }, 0);
audit.check("MAP_ITEM_DUPLICATE_TITLE_COUNT", listUi.mapItemDuplicateTitleCount === 0, listUi.mapItemDuplicateTitleCount ?? null, 0);
audit.check("MAP_GUIDE_DEFAULT_OPEN", mapGuide.mapGuideDefaultOpen === false, mapGuide.mapGuideDefaultOpen ?? null, false);
audit.check("LEFT_PANEL_POINTER_RESIZE_PASS", mapAccess.leftPanelPointerResizePass === true, mapAccess.leftPanelPointerResizePass ?? null, true);
audit.check("MAP_COMPARE_RESULT", statuses.v135MapCompare === "PASS", statuses.v135MapCompare, "PASS");
audit.check("VISIBLE_ACRONYM_WITHOUT_GLOSSARY", glossary.visibleAcronymWithoutGlossaryCount === 0, glossary.visibleAcronymWithoutGlossaryCount ?? null, 0);

audit.check("V130_REGRESSION", group(["v130ProjectScope", "v130Dedup", "v130Geography"]), { projectScope: statuses.v130ProjectScope, dedup: statuses.v130Dedup, geography: statuses.v130Geography }, "PASS");
audit.check("V131_REGRESSION", group(["v131Naming", "v131Cards"]), { naming: statuses.v131Naming, cards: statuses.v131Cards }, "PASS");
audit.check("V132_REGRESSION", group(["v132Composition", "v132Portfolio", "v132MapTooltip", "v132Benchmark"]), { composition: statuses.v132Composition, portfolio: statuses.v132Portfolio, mapTooltip: statuses.v132MapTooltip, benchmark: statuses.v132Benchmark }, "PASS");
audit.check("V133_REGRESSION", group(["v133MapFocus", "v133MapPopup", "v133LayerDistinction", "generatedData", "ciContract"]), { focus: statuses.v133MapFocus, popup: statuses.v133MapPopup, layerDistinction: statuses.v133LayerDistinction }, "PASS");
audit.check("V134_REGRESSION", group(["glossary", "oda", "drought", "publicCopy", "visualContract"]), { glossary: statuses.glossary, oda: statuses.oda, drought: statuses.drought, publicCopy: statuses.publicCopy, visualContract: statuses.visualContract }, "PASS");
audit.check("V135_REGRESSION", group(["v135FinderCard", "v135TemporalDepth", "v135DetailHierarchy", "v135MapGuide", "v135MapAccess", "v135MapCompare", "v135PublicScreen"]), { finderCard: statuses.v135FinderCard, temporalDepth: statuses.v135TemporalDepth, detailHierarchy: statuses.v135DetailHierarchy, mapGuide: statuses.v135MapGuide, mapAccess: statuses.v135MapAccess, mapCompare: statuses.v135MapCompare, publicScreen: statuses.v135PublicScreen }, "PASS");
audit.check("V136_REGRESSION", group(["publicText", "duplicateCopy", "mapListUi", "mapCopy", "publicControls"]), { publicText: statuses.publicText, duplicateCopy: statuses.duplicateCopy, mapListUi: statuses.mapListUi, mapCopy: statuses.mapCopy, publicControls: statuses.publicControls }, "PASS");

audit.check("FINDER_LOAD_MORE_VISIBLE_COUNT", scroll.finderLoadMoreVisibleCount === 0, scroll.finderLoadMoreVisibleCount ?? null, 0);
audit.check("FINDER_AUTO_LOAD_SEQUENCE", JSON.stringify(scroll.autoLoadSequence) === JSON.stringify([24, 48, 72, 96, 120, 144, 152]), scroll.autoLoadSequence ?? null, [24, 48, 72, 96, 120, 144, 152]);
audit.check("FINDER_DUPLICATE_CARD_COUNT", scroll.duplicateCardCount === 0, scroll.duplicateCardCount ?? null, 0);
audit.check("FINDER_HUMAN_REVIEW_COUNT", review.finderHumanReviewCount === 152, review.finderHumanReviewCount ?? null, 152);
audit.check("DETAIL_HUMAN_REVIEW_COUNT", review.detailHumanReviewCount === 152, review.detailHumanReviewCount ?? null, 152);
audit.check("MAP_DATASET_HUMAN_REVIEW_COUNT", review.mapDatasetHumanReviewCount === 12, review.mapDatasetHumanReviewCount ?? null, 12);
audit.check("UNRESOLVED_REWRITE_COUNT", review.unresolvedRewriteCount === 0, review.unresolvedRewriteCount ?? null, 0);
audit.check("UNRESOLVED_REMOVE_COUNT", review.unresolvedRemoveCount === 0, review.unresolvedRemoveCount ?? null, 0);
audit.check("V136_1_REGRESSION", statuses.finderScroll === "PASS" && statuses.humanReview === "PASS", { finderScroll: statuses.finderScroll, humanReview: statuses.humanReview }, "PASS");
audit.check("CI_CURRENT_RELEASE_GATE", workflow.ciCurrentGate === "finalize:v136", workflow.ciCurrentGate ?? null, "finalize:v136");
audit.check("PAGES_CURRENT_RELEASE_GATE", workflow.pagesCurrentGate === "finalize:v136", workflow.pagesCurrentGate ?? null, "finalize:v136");
audit.check("VISUAL_QA_CURRENT_CAPTURE", workflow.visualQaCurrentCapture === "capture:screenshots:v136", workflow.visualQaCurrentCapture ?? null, "capture:screenshots:v136");
audit.check("OLD_V135_CURRENT_GATE_COUNT", workflow.oldV135CurrentGateCount === 0, workflow.oldV135CurrentGateCount ?? null, 0);
audit.check("SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER", !commands.some((entry) => /screenshot|capture:/iu.test(entry.command)), commands.map((entry) => entry.command), "no screenshot command");
audit.check("REMAINING_BLOCKERS", allCommandsPassed, commandResults.filter((item) => item.exitCode !== 0), []);

finishAuditV136(audit, "release-audit-v136.json", {
  commandResults,
  reportStatuses: statuses,
  frameworkElements: glossary.frameworkElements ?? null,
  accountedElements: glossary.accountedElements ?? null,
  publicTextInventoryCount: text.publicTextInventoryCount ?? null,
  publicRouteCount: text.publicRouteCount ?? null,
  internalPublicTokenCount: text.internalPublicTokenCount ?? null,
  duplicateVisibleCopyCount: duplicate.duplicateVisibleCopyCount ?? null,
  mapDataItemCount: listUi.mapDataItemCount ?? null,
  screenshotCaptureIsReleaseBlocker: false,
  remainingBlockers: allCommandsPassed ? 0 : 1,
});
