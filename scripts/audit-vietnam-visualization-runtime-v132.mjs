#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  AuditV125,
  PROJECT_ROOT,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV129 } from "./v129/audit-helpers.mjs";
import {
  V132_GENERATED_AT,
  V132_REPORT_ROOT,
  finishAuditV132,
  writeCsvV132,
  writeJsonV132,
} from "./v132/audit-helpers.mjs";

const audit = new AuditV125("visualization-runtime:v132");
const generatorPath = resolve(PROJECT_ROOT, "scripts/generate-v132-visualization-reports.mjs");
await import(`${pathToFileURL(generatorPath).href}?runtime=${Date.now()}`);
const contractResult = readJson(
  resolve(V132_REPORT_ROOT, "final-public-visualization-contract-v132.json")
);
const contracts = Array.isArray(contractResult.value?.elements)
  ? contractResult.value.elements
  : [];

const TIME_RENDERERS = new Set([
  "score-trend",
  "kpi-trend",
  "multi-metric-trend",
  "composition-trend",
  "stacked-emissions",
  "scenario-comparison",
  "seasonality",
  "spatial-analysis",
]);

function snapshotExpression(contract) {
  return `(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    const primary = root?.querySelector('[data-testid="public-analysis-primary"]');
    const raw = root?.querySelector('details[data-testid="public-raw-data"], details[data-testid="public-observation-table"], details[data-testid="public-entity-table"]');
    const source = root?.querySelector('[data-testid="public-source-panel"], .pav126-source');
    const primaryTop = primary?.getBoundingClientRect().top ?? null;
    const rawTop = raw?.getBoundingClientRect().top ?? null;
    const statusOnly = Boolean(root?.querySelector('[data-testid="public-status-only"]'));
    const interactiveChart = Boolean(primary?.querySelector('[data-chart-interaction-v127="true"], svg[role="img"], [data-visualization-chart]'));
    const specialized = {
      a002: Boolean(primary?.querySelector('[data-testid="a002-cpia-analysis"]')),
      a016: Boolean(primary?.querySelector('[data-testid="a016-energy-analysis-v132"]')),
      d005: Boolean(primary?.querySelector('[data-testid="d005-specialized-renderer"]')),
      e008: Boolean(primary?.querySelector('[data-testid="e008-research-analysis-v132"]')),
      e012: Boolean(primary?.querySelector('[data-testid="e012-semantic-preview"]')),
    };
    const compositionTime = Boolean(primary?.querySelector('[data-testid="composition-time-analysis-v132"], [data-testid="a016-absolute-trend"]'));
    const emissionsAnalysis = Boolean(primary?.querySelector('[data-testid="emissions-analysis-v132"]'));
    const emissionsTotalTrend = Boolean(primary?.querySelector('[data-testid="emissions-total-trend-v132"]'));
    const emissionsBreakdown = Boolean(primary?.querySelector('[data-testid="emissions-breakdown-trend-v132"]'));
    const emissionsLatestComposition = Boolean(primary?.querySelector('[data-testid="emissions-latest-composition-v132"]'));
    const portfolioSummary = Boolean(primary?.querySelector('[data-testid="portfolio-analysis-summary-v132"]'));
    const portfolioFilters = Boolean(primary?.querySelector('[data-testid="portfolio-list-filters-v132"]'));
    const entityList = primary?.querySelector('[data-testid="public-entity-card-grid-v131"], [data-testid="portfolio-entity-list-v132"], [data-testid="e008-list"]');
    const entityListTop = entityList?.getBoundingClientRect().top ?? null;
    const summaryNode = primary?.querySelector('[data-testid="portfolio-analysis-summary-v132"], [data-testid="e008-kpis"]');
    const summaryTop = summaryNode?.getBoundingClientRect().top ?? null;
    const internal = [...(root?.querySelectorAll('h1,h2,h3,h4,h5,[aria-label],button,label') || [])]
      .map((node) => String(node.textContent || node.getAttribute('aria-label') || ''))
      .filter((text) => /(?:recordId|indicatorId|sourceSheet|sourceRow|renderer|semantic|MultiLineString|MapLibre)/iu.test(text));
    const primaryText = String(primary?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const headings = [...(primary?.querySelectorAll('h2,h3,h4') || [])]
      .map((node) => String(node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim())
      .filter(Boolean);
    const selectorLabels = [...(primary?.querySelectorAll('label') || [])]
      .map((node) => String(node.childNodes?.[0]?.textContent || node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim())
      .filter(Boolean);
    const testIds = [...(primary?.querySelectorAll('[data-testid]') || [])]
      .map((node) => node.getAttribute('data-testid'))
      .filter(Boolean);
    return {
      elementId: ${JSON.stringify(contract.elementId)},
      renderer: ${JSON.stringify(contract.assignedPrimaryRenderer)},
      ready: root?.getAttribute('data-analysis-state') === 'ready',
      primary: Boolean(primary) && primaryText.length > 0,
      primaryTextLength: primaryText.length,
      rawAfterAnalysis: !raw || (primaryTop !== null && rawTop !== null && rawTop > primaryTop),
      source: Boolean(source) || /자료 제공기관|공식 원문/u.test(String(root?.textContent || '')),
      download: /다운로드/u.test(String(document.body?.textContent || '')),
      statusOnly,
      interactiveChart,
      specialized,
      compositionTime,
      emissionsAnalysis,
      emissionsTotalTrend,
      emissionsBreakdown,
      emissionsLatestComposition,
      portfolioSummary,
      portfolioFilters,
      entityList: Boolean(entityList),
      listAfterSummary: entityListTop === null || (summaryTop !== null && summaryTop < entityListTop),
      internalTokenCount: internal.length,
      headings,
      selectorLabels,
      selectorCount: primary?.querySelectorAll('select,input[type="search"],input[type="text"]').length || 0,
      chartCount: primary?.querySelectorAll('svg[role="img"],[data-chart-interaction-v127="true"],[data-visualization-chart]').length || 0,
      testIds,
      alert: String(root?.querySelector('[role="alert"]')?.textContent || ''),
    };
  })()`;
}

function rendererSatisfied(contract, result) {
  if (!result?.ready || !result?.primary || !result?.rawAfterAnalysis || !result?.source || !result?.download || result?.alert) {
    return false;
  }
  if (result.internalTokenCount > 0) return false;
  if (contract.assignedPrimaryRenderer === "status-only") {
    return result.statusOnly && !result.interactiveChart;
  }
  const specializedKey = {
    "A-002": "a002",
    "A-016": "a016",
    "D-005": "d005",
    "E-008": "e008",
    "E-012": "e012",
  }[contract.elementId];
  if (specializedKey && !result.specialized?.[specializedKey]) return false;
  if (
    contract.assignedPrimaryRenderer === "composition-trend" &&
    !specializedKey &&
    !result.compositionTime
  ) return false;
  if (
    contract.assignedPrimaryRenderer === "stacked-emissions" &&
    !(result.emissionsAnalysis && result.emissionsTotalTrend && result.emissionsBreakdown && result.emissionsLatestComposition)
  ) return false;
  if (
    contract.assignedPrimaryRenderer === "portfolio-dashboard" &&
    result.entityList &&
    (!result.portfolioSummary || !result.portfolioFilters || !result.listAfterSummary)
  ) return false;
  if (TIME_RENDERERS.has(contract.assignedPrimaryRenderer) && /전체 추이/u.test(contract.yearBehavior)) {
    return result.interactiveChart || result.compositionTime || Boolean(specializedKey);
  }
  return true;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const routeResults = [];
const routeFailures = [];
const trendWithoutVisual = [];
const compositionWithoutTime = [];
const statusOnlyFake = [];
const responsiveFailures = [];
const representativeFailures = [];
const representativeViewportResults = [];
const brokenAssets = [];
const htmlForJson = [];
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (!response?.url?.startsWith(server.origin)) return;
    const pathname = new URL(response.url).pathname;
    if (Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
    if (/\.(?:json|geojson)(?:$|\?)/u.test(pathname) && /text\/html/iu.test(String(response.mimeType || ""))) {
      htmlForJson.push({ url: response.url, mimeType: response.mimeType });
    }
  });
  await setViewport(browser.cdp, 1440, 1100);
  for (const contract of contracts) {
    try {
      await navigate(browser.cdp, detailUrlV129(server.url, contract.elementId));
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
        { timeoutMs: 25_000 }
      );
      const result = await evaluateValue(browser.cdp, snapshotExpression(contract));
      const verified = rendererSatisfied(contract, result);
      routeResults.push({ ...result, verified });
      if (!verified) routeFailures.push({ contract, result });
      if (
        TIME_RENDERERS.has(contract.assignedPrimaryRenderer) &&
        /전체 추이/u.test(contract.yearBehavior) &&
        !(result.interactiveChart || result.compositionTime || contract.specializedRenderer)
      ) {
        trendWithoutVisual.push(contract.elementId);
      }
      if (
        contract.assignedPrimaryRenderer === "composition-trend" &&
        !contract.specializedRenderer &&
        /전체 추이/u.test(contract.yearBehavior) &&
        !result.compositionTime
      ) {
        compositionWithoutTime.push(contract.elementId);
      }
      if (contract.assignedPrimaryRenderer === "status-only" && result.interactiveChart) {
        statusOnlyFake.push(contract.elementId);
      }
    } catch (error) {
      routeFailures.push({
        contract,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const responsiveRoutes = [
    "A-002", "A-003", "A-005", "A-010", "A-016", "A-017", "A-018",
    "A-023", "B-004", "B-021", "B-033", "B-034", "C-016", "C-019",
    "D-005", "D-018", "E-008", "E-012", "E-018", "E-019", "E-020",
  ];
  for (const width of [390, 768, 1024, 1440, 1920]) {
    await setViewport(browser.cdp, width, 1000);
    for (const elementId of responsiveRoutes) {
      await navigate(browser.cdp, detailUrlV129(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
        { timeoutMs: 25_000 }
      );
      const overflow = await evaluateValue(
        browser.cdp,
        `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth`
      );
      const viewportResult = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          const primary = root?.querySelector('[data-testid="public-analysis-primary"]');
          return {
            ready: root?.getAttribute('data-analysis-state') === 'ready',
            primary: Boolean(primary) && String(primary.textContent || '').trim().length > 0,
            alert: String(root?.querySelector('[role="alert"]')?.textContent || ''),
            chartOrAnalysis: Boolean(primary?.querySelector('[data-testid="public-primary-visualization"],[data-testid="d005-specialized-renderer"],svg[role="img"],[data-testid*="analysis"],[data-testid*="trend"],[data-testid*="timeline"],[data-testid*="scorecard"],[data-testid*="portfolio"]')),
          };
        })()`
      );
      const evidence = { elementId, width, overflow: Number(overflow || 0), ...viewportResult };
      representativeViewportResults.push(evidence);
      if (Number(overflow || 0) > 1) responsiveFailures.push(evidence);
      if (
        !viewportResult?.ready ||
        !viewportResult?.primary ||
        viewportResult?.alert ||
        !viewportResult?.chartOrAnalysis
      ) representativeFailures.push(evidence);
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const resultById = new Map(routeResults.map((row) => [row.elementId, row]));
const runtimeElements = contracts.map((contract) => {
  const result = resultById.get(contract.elementId) || null;
  const runtimeVerified = Boolean(result?.verified);
  return {
    ...contract,
    firstVisibleAnalysis: result?.headings?.[0] || contract.firstVisibleAnalysis,
    runtimeReviewResult: runtimeVerified ? "verified-in-production-dom" : "fail",
    runtimeVerified,
    runtimeEvidence: result
      ? {
          headings: result.headings,
          selectorLabels: result.selectorLabels,
          selectorCount: result.selectorCount,
          chartCount: result.chartCount,
          testIds: result.testIds,
          statusOnly: result.statusOnly,
          sourceVisible: result.source,
          downloadVisible: result.download,
          rawAfterAnalysis: result.rawAfterAnalysis,
        }
      : null,
  };
});
const runtimeSummary = {
  frameworkElementCount: runtimeElements.length,
  accountedElementCount: runtimeElements.length,
  runtimeVerifiedCount: runtimeElements.filter((row) => row.runtimeVerified).length,
  runtimeFailureCount: runtimeElements.filter((row) => !row.runtimeVerified).length,
  specializedRendererCount: runtimeElements.filter((row) => row.specializedRenderer).length,
  runtimeEvidenceSource: "local-production-build-dom",
};
const runtimeReviewColumns = [
  "elementId", "publicTitle", "assignedPrimaryRenderer", "firstVisibleAnalysis",
  "secondaryVisualization", "rawOrEntityListPosition", "measureCount", "measures",
  "dimensionCount", "dimensions", "units", "yearRange", "selectors",
  "interpretation", "mapLinkage", "runtimeReviewResult", "runtimeVerified",
];
const finalContractColumns = [
  "elementId", "publicTitle", "primaryPublicQuestion", "primaryVisualization",
  "secondaryVisualization", "selectableDimensions", "yearBehavior", "unitBehavior",
  "mapBehavior", "listTableBehavior", "benchmarkReference", "runtimeVerified",
];
writeCsvV132(
  resolve(V132_REPORT_ROOT, "element-visualization-runtime-review-v132.csv"),
  runtimeReviewColumns,
  runtimeElements
);
writeCsvV132(
  resolve(V132_REPORT_ROOT, "final-public-visualization-contract-v132.csv"),
  finalContractColumns,
  runtimeElements
);
writeJsonV132(resolve(V132_REPORT_ROOT, "element-visualization-runtime-review-v132.json"), {
  schemaVersion: "v132-runtime-review-2",
  generatedAt: V132_GENERATED_AT,
  summary: runtimeSummary,
  elements: runtimeElements,
});
writeJsonV132(resolve(V132_REPORT_ROOT, "final-public-visualization-contract-v132.json"), {
  schemaVersion: "v132-final-public-visualization-contract-2",
  generatedAt: V132_GENERATED_AT,
  benchmarkBasis: contractResult.value?.benchmarkBasis || [],
  summary: runtimeSummary,
  elements: runtimeElements,
});

audit.check("FINAL_CONTRACT_COUNT", contracts.length === 152, contracts.length, 152);
audit.check(
  "RUNTIME_VISUALIZATION_VERIFIED",
  runtimeFailure === null && routeResults.length === 152 && routeFailures.length === 0,
  { runtimeFailure, checked: routeResults.length, failures: routeFailures.slice(0, 30) },
  { runtimeFailure: null, checked: 152, failures: [] }
);
audit.check("TREND_DATA_WITHOUT_TREND_VISUAL", trendWithoutVisual.length === 0, trendWithoutVisual, []);
audit.check("COMPOSITION_WITHOUT_TIME_ANALYSIS", compositionWithoutTime.length === 0, compositionWithoutTime, []);
audit.check("STATUS_ONLY_FAKE_VISUALIZATION", statusOnlyFake.length === 0, statusOnlyFake, []);
audit.check("RAW_LIST_AFTER_ANALYSIS", routeResults.every((row) => row.rawAfterAnalysis), routeResults.filter((row) => !row.rawAfterAnalysis).map((row) => row.elementId), []);
audit.check("RESPONSIVE_HORIZONTAL_OVERFLOW", responsiveFailures.length === 0, responsiveFailures, []);
audit.check(
  "REPRESENTATIVE_BROWSER_QA",
  representativeViewportResults.length === 105 && representativeFailures.length === 0,
  { checked: representativeViewportResults.length, failures: representativeFailures },
  { checked: 105, failures: [] }
);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("HTML_FOR_JSON", htmlForJson.length === 0, htmlForJson, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV132(audit, "visualization-runtime-audit-v132.json", {
  runtimeVisualizationVerifiedCount: routeResults.filter((row) => row.verified).length,
  runtimeVisualizationFailureCount: routeFailures.length,
  trendDataWithoutTrendVisualCount: trendWithoutVisual.length,
  compositionWithoutTimeAnalysisCount: compositionWithoutTime.length,
  statusOnlyFakeVisualizationCount: statusOnlyFake.length,
  responsiveFailureCount: responsiveFailures.length,
  representativeFailureCount: representativeFailures.length,
  representativeViewportCheckCount: representativeViewportResults.length,
  representativeViewportResults,
  brokenAssetCount: brokenAssets.length,
  htmlForJsonCount: htmlForJson.length,
  consoleErrorCount: browser?.runtimeErrors?.length || 0,
  runtimeFailure,
  routeResults,
});
