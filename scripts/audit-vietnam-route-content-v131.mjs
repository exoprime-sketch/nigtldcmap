#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  captureElementPng,
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV129 } from "./v129/audit-helpers.mjs";
import {
  PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131,
  PUBLIC_TECHNICAL_TOKENS_V131,
  V131_SCREENSHOT_ROOT,
  finishAuditV131,
  screenshotEvidenceV131,
  validScreenshotV131,
} from "./v131/audit-helpers.mjs";

const audit = new AuditV125("route-content:v131");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const semanticFitResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/visualization-semantic-fit-v129.json")
);
const fitSummary = semanticFitResult.value?.summary || {};
const statusOnlyIds = new Set(
  (Array.isArray(semanticFitResult.value?.elements)
    ? semanticFitResult.value.elements
    : []
  )
    .filter((row) => row?.visualizationFitResult === "status-only")
    .map((row) => row.elementId)
);
const acceptanceResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);
const acceptanceRows = Array.isArray(acceptanceResult.value?.elements)
  ? acceptanceResult.value.elements
  : Array.isArray(acceptanceResult.value)
  ? acceptanceResult.value
  : [];
const titleByElement = new Map(
  acceptanceRows.map((row) => [row.elementId, String(row.publicTitle || "").normalize("NFC").trim()])
);

const SCREENSHOTS = [
  "home.png",
  "finder.png",
  "detail-investment-cards.png",
  "detail-project-portfolio.png",
  "detail-directory.png",
  "detail-a002.png",
  "detail-d005.png",
  "detail-e012.png",
  "mobile-cards.png",
];
mkdirSync(V131_SCREENSHOT_ROOT, { recursive: true });

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check(
  "VISUALIZATION_FIT_BASELINE",
  Number(fitSummary.visualizationFitCount || 0) === 152 &&
    Number(fitSummary.visualizationFitFailureCount || 0) === 0,
  {
    fit: fitSummary.visualizationFitCount,
    failure: fitSummary.visualizationFitFailureCount,
    fitCounts: fitSummary.fitCounts,
  },
  {
    fit: 152,
    failure: 0,
    fitCounts: {
      fit: 75,
      "fit-with-caveat": 69,
      "specialized-required": 3,
      "status-only": 5,
      fail: 0,
    },
  }
);

function routeSnapshotExpression(elementId, expectedTitle, statusOnly) {
  return `(() => {
    const normalize = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const lower = (value) => normalize(value).toLocaleLowerCase('en-US');
    const main = document.querySelector('main');
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    const primary = document.querySelector('[data-testid="public-analysis-primary"]');
    const publicTitle = document.querySelector('[data-testid="public-data-title"]');
    const primaryNodes = [
      document.querySelector('main h1'),
      publicTitle,
      ...document.querySelectorAll('[data-testid="public-entity-card-title"]')
    ].filter(Boolean);
    const primaryTitles = primaryNodes.map((node) => normalize(node.textContent));
    const placeholders = ${JSON.stringify(PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131)};
    const placeholderTitles = primaryTitles.filter((title) =>
      placeholders.some((value) => lower(title) === lower(value))
    );
    const visibleText = normalize(main?.innerText || '');
    const accessibleText = [...(main?.querySelectorAll('[aria-label], [title], [alt]') || [])]
      .map((node) => normalize(node.getAttribute('aria-label') || node.getAttribute('title') || node.getAttribute('alt')))
      .join(' ');
    const publicText = lower(visibleText + ' ' + accessibleText);
    const technicalTokens = ${JSON.stringify(PUBLIC_TECHNICAL_TOKENS_V131)}.filter((token) =>
      publicText.includes(token.toLocaleLowerCase('en-US'))
    );
    const h1 = normalize(document.querySelector('main h1')?.textContent);
    const fakeChartSelectors = [
      'svg[aria-label*="차트"]',
      '[data-testid="interactive-time-series-chart-v127"]',
      '.sv125-bar-list',
      '.sv125-composition'
    ];
    const fakeChartCount = ${statusOnly ? "fakeChartSelectors.reduce((sum, selector) => sum + document.querySelectorAll(selector).length, 0)" : "0"};
    return {
      elementId: ${JSON.stringify(elementId)},
      ready: root?.getAttribute('data-analysis-state') === 'ready',
      h1,
      titleMatch: h1 === ${JSON.stringify(expectedTitle)},
      publicTitle: normalize(publicTitle?.textContent),
      purpose: visibleText.includes('이 데이터로 확인할 수 있는 내용'),
      primaryContent: normalize(primary?.textContent).length > 0,
      source: visibleText.includes('자료 제공기관') || visibleText.includes('출처'),
      rawTable: visibleText.includes('원자료 보기'),
      download: visibleText.includes('다운로드'),
      placeholderTitles,
      blankPrimaryTitleCount: primaryTitles.filter((title) => !title).length,
      rawElementIdTitle: primaryTitles.some((title) => /^[A-E]-\\d{3}$/u.test(title)),
      technicalTokens,
      fakeChartCount,
      cardCount: document.querySelectorAll('[data-testid="public-entity-card-v131"]').length,
      alertText: normalize(document.querySelector('[role="alert"]')?.textContent),
    };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const routeFailures = [];
const routeResults = [];
const technicalHits = [];
const placeholderHits = [];
const blankTitleHits = [];
const rawTitleHits = [];
const statusOnlyFakeCharts = [];
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
    if (
      /\.(?:json|geojson)(?:$|\?)/u.test(pathname) &&
      /text\/html/iu.test(String(response.mimeType || ""))
    ) {
      htmlForJson.push({ url: response.url, mimeType: response.mimeType });
    }
  });
  await setViewport(browser.cdp, 1440, 1100);

  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    const expectedTitle =
      titleByElement.get(elementId) || String(element.elementLabel || "").normalize("NFC").trim();
    try {
      await navigate(browser.cdp, detailUrlV129(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
        { timeoutMs: 25_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        routeSnapshotExpression(elementId, expectedTitle, statusOnlyIds.has(elementId))
      );
      routeResults.push(result);
      const contentReady =
        result?.ready === true &&
        result?.titleMatch === true &&
        result?.purpose === true &&
        result?.primaryContent === true &&
        result?.source === true &&
        (statusOnlyIds.has(elementId) || result?.rawTable === true) &&
        result?.download === true &&
        !result?.alertText;
      if (!contentReady) routeFailures.push({ elementId, result });
      if (result?.technicalTokens?.length) technicalHits.push({ elementId, tokens: result.technicalTokens });
      if (result?.placeholderTitles?.length) placeholderHits.push({ elementId, titles: result.placeholderTitles });
      if (Number(result?.blankPrimaryTitleCount || 0) > 0) blankTitleHits.push({ elementId, count: result.blankPrimaryTitleCount });
      if (result?.rawElementIdTitle) rawTitleHits.push({ elementId });
      if (Number(result?.fakeChartCount || 0) > 0) statusOnlyFakeCharts.push({ elementId, count: result.fakeChartCount });
    } catch (error) {
      routeFailures.push({
        elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const captures = [
    { name: "home.png", url: `${server.url}/#home`, selector: "main", ready: "[data-v128-home]", width: 1440 },
    { name: "finder.png", url: `${server.url}/?country=VNM#explorer`, selector: "main", ready: ".cdp-card-grid", width: 1440 },
    { name: "detail-investment-cards.png", url: detailUrlV129(server.url, "E-018"), selector: "[data-testid='public-analysis-root']", ready: "[data-testid='public-entity-card-grid-v131']", width: 1440 },
    { name: "detail-project-portfolio.png", url: detailUrlV129(server.url, "D-023"), selector: "[data-testid='public-analysis-root']", ready: "[data-testid='public-entity-card-grid-v131']", width: 1440 },
    { name: "detail-directory.png", url: detailUrlV129(server.url, "E-019"), selector: "[data-testid='public-analysis-root']", ready: "[data-testid='public-entity-card-grid-v131']", width: 1440 },
    { name: "detail-a002.png", url: detailUrlV129(server.url, "A-002"), selector: "[data-testid='public-analysis-root']", ready: "[data-testid='a002-cpia-analysis']", width: 1440 },
    { name: "detail-d005.png", url: detailUrlV129(server.url, "D-005"), selector: "[data-testid='public-analysis-root']", ready: "[data-testid='d005-specialized-renderer']", width: 1440 },
    { name: "detail-e012.png", url: detailUrlV129(server.url, "E-012"), selector: "[data-testid='public-analysis-root']", ready: "[data-testid='e012-semantic-preview']", width: 1440 },
    { name: "mobile-cards.png", url: detailUrlV129(server.url, "E-018"), selector: "[data-testid='public-analysis-root']", ready: "[data-testid='public-entity-card-grid-v131']", width: 390 },
  ];
  for (const capture of captures) {
    await setViewport(browser.cdp, capture.width, capture.width === 390 ? 1000 : 1100);
    await navigate(browser.cdp, capture.url);
    await waitForValue(
      browser.cdp,
      `Boolean(document.querySelector(${JSON.stringify(capture.ready)}))`,
      { timeoutMs: 30_000 }
    );
    await captureElementPng(
      browser.cdp,
      capture.selector,
      resolve(V131_SCREENSHOT_ROOT, capture.name)
    );
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const screenshots = screenshotEvidenceV131(SCREENSHOTS);
const invalidScreenshots = screenshots.filter((item) => !validScreenshotV131(item));

audit.check("DETAIL_ROUTE_COUNT", runtimeFailure === null && routeResults.length === 152, routeResults.length, 152, { runtimeFailure });
audit.check("DETAIL_ROUTE_CONTENT", routeFailures.length === 0, routeFailures.length, 0, routeFailures.slice(0, 30));
audit.check("PUBLIC_PLACEHOLDER_PRIMARY_TITLE_COUNT", placeholderHits.length === 0, placeholderHits.length, 0, placeholderHits);
audit.check("PUBLIC_BLANK_PRIMARY_TITLE_COUNT", blankTitleHits.length === 0, blankTitleHits.length, 0, blankTitleHits);
audit.check("RAW_TECHNICAL_PRIMARY_LABEL_COUNT", rawTitleHits.length === 0, rawTitleHits.length, 0, rawTitleHits);
audit.check("STATUS_ONLY_FAKE_CHART_COUNT", statusOnlyFakeCharts.length === 0, statusOnlyFakeCharts.length, 0, statusOnlyFakeCharts);
audit.check("PUBLIC_TECHNICAL_TOKEN_COUNT", technicalHits.length === 0, technicalHits.length, 0, technicalHits.slice(0, 30));
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets.length, 0, brokenAssets);
audit.check("HTML_FOR_JSON", htmlForJson.length === 0, htmlForJson.length, 0, htmlForJson);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);
audit.check("SCREENSHOT_PNG", invalidScreenshots.length === 0, { screenshots, invalidScreenshots }, "nine valid PNG screenshots");

finishAuditV131(audit, "route-content-audit-v131.json", {
  detailRouteCount: routeResults.length,
  detailRouteFailureCount: routeFailures.length,
  publicPlaceholderPrimaryTitleCount: placeholderHits.length,
  publicBlankPrimaryTitleCount: blankTitleHits.length,
  publicTechnicalTokenCount: technicalHits.length,
  statusOnlyFakeChartCount: statusOnlyFakeCharts.length,
  screenshotCount: screenshots.length,
  runtimeFailure,
});
