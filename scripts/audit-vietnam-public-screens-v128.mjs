#!/usr/bin/env node

import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
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

const audit = new AuditV125("public-screens:v128");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const acceptanceResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);
const acceptanceRows = Array.isArray(acceptanceResult.value)
  ? acceptanceResult.value
  : Array.isArray(acceptanceResult.value?.elements)
  ? acceptanceResult.value.elements
  : [];
const acceptanceById = new Map(acceptanceRows.map((row) => [row.elementId, row]));

const USER_STATUS_BY_INTERNAL = {
  actual: "데이터 제공",
  "public-authorized": "데이터 제공",
  partial: "일부 데이터 제공",
  "schema-only": "입력 양식",
  "data-entry-planned": "입력 예정",
  "not-collected": "원자료 미수집",
};
const USER_STATUS_KEY_BY_INTERNAL = {
  actual: "data-provided",
  "public-authorized": "data-provided",
  partial: "partially-provided",
  "schema-only": "input-template",
  "data-entry-planned": "planned",
  "not-collected": "source-not-collected",
};
const TECHNICAL_VISIBLE_TOKENS = [
  ".xlsx",
  "sourceSheet",
  "sourceRow",
  "recordId",
  "indicatorId",
  "apiParams",
  "packUrl",
  "shardId",
  "sha256",
  "MultiLineString",
  "MapLibre",
  "renderer",
  "downloadEligible",
  "redistributionAllowed",
  "publicationDecision",
  "semantic",
  "V124",
  "V125",
  "V126",
  "V127",
];
const TECHNICAL_DOM_TOKENS = [
  "source-file",
  "source_file",
  "sourceFile",
  "source-sheet",
  "source_sheet",
  "sourceSheet",
  "source-row",
  "source_row",
  "sourceRow",
  "record-id",
  "record_id",
  "recordId",
  "indicator-id",
  "indicator_id",
  "indicatorId",
  "api-params",
  "api_params",
  "apiParams",
  "pack-url",
  "pack_url",
  "packUrl",
  "shard-id",
  "shard_id",
  "shardId",
  "sha256",
  "publication-decision",
  "publication_decision",
  "publicationDecision",
];
const INTERNAL_STATUS_PATTERN = /(?:^|[\s·|/,(])(?:actual|partial|public-authorized|schema-only|data-entry-planned|not-collected)(?=$|[\s·|/),])/iu;
const DATA_BEARING = new Set(["actual-records", "partial-records"]);

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("ACCEPTANCE_MATRIX_JSON", acceptanceResult.error === null, acceptanceResult.error, null);
audit.check("PUBLIC_SCREEN_ELEMENT_CONTRACT", catalog.length === 152, catalog.length, 152);

function expectedDownloadLabel(element) {
  if (
    DATA_BEARING.has(element.dataPresenceStatus) &&
    element.downloadAllowed === true &&
    Number(element.downloadableRecordCount || 0) > 0
  ) {
    return "다운로드 가능";
  }
  return DATA_BEARING.has(element.dataPresenceStatus)
    ? "화면에서만 제공"
    : "다운로드 자료 없음";
}

let server = null;
let browser = null;
let runtimeFailure = null;
const detailFailures = [];
const technicalTokenHits = [];
const blankPanelFailures = [];
const statusFailures = [];
const titleFailures = [];
const metadataFailures = [];
const responsiveFailures = [];
const accessibilityFailures = [];
const networkFailures = [];
let inspectedDetailCount = 0;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", (params) => {
    const response = params.response || {};
    const url = String(response.url || "");
    if (!/\.(?:json|geojson|csv)(?:[?#]|$)/iu.test(url)) return;
    const contentType = String(response.mimeType || response.headers?.["content-type"] || "");
    if (Number(response.status) !== 200 || (/\.(?:json|geojson)(?:[?#]|$)/iu.test(url) && /text\/html/iu.test(contentType))) {
      networkFailures.push({ url, status: response.status, contentType });
    }
  });

  for (const element of catalog) {
    const acceptance = acceptanceById.get(element.elementId) || {};
    const expectedTitle = acceptance.publicTitle || element.elementLabel;
    const expectedStatus = acceptance.userFacingStatus || USER_STATUS_BY_INTERNAL[element.publicStatus] || null;
    const expectedStatusKey = USER_STATUS_KEY_BY_INTERNAL[element.publicStatus] || null;
    const expectedDownload = expectedDownloadLabel(element);
    const expectedSources = Array.isArray(element.sourceOrganizations)
      ? element.sourceOrganizations.filter(Boolean)
      : [];
    const expectedPeriods = [
      ...(Array.isArray(element.referenceYears) ? element.referenceYears : []),
      element.latestYear,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const url = new URL(server.url);
    url.searchParams.set("view", "data");
    url.searchParams.set("country", "VNM");
    url.searchParams.set("element", element.elementId);
    url.hash = "element-detail";
    try {
      await navigate(browser.cdp, url.toString());
      await waitForValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          if (document.querySelector('[role="alert"]')) return true;
          return Boolean(root && root.getAttribute('data-analysis-state') === 'ready' && root.querySelector('[data-testid="public-data-title"]'));
        })()`,
        { timeoutMs: 20_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const analysisRoot = document.querySelector('[data-testid="public-analysis-root"]');
          const pageRoot = analysisRoot?.closest('main') || document.querySelector('main');
          const normalize = (value) => String(value || '').normalize('NFC');
          const text = normalize(pageRoot?.innerText);
          const html = normalize(pageRoot?.outerHTML);
          const lowerText = text.toLocaleLowerCase('en-US');
          const lowerHtml = html.toLocaleLowerCase('en-US');
          const visibleTechnical = ${JSON.stringify(TECHNICAL_VISIBLE_TOKENS)}.filter((token) =>
            lowerText.includes(token.toLocaleLowerCase('en-US'))
          );
          const domTechnical = ${JSON.stringify(TECHNICAL_DOM_TOKENS)}.filter((token) =>
            lowerHtml.includes(token.toLocaleLowerCase('en-US'))
          );
          const title = document.querySelector('.cdp-detail-hero h1')?.textContent?.trim() || '';
          const publicStatusNodes = [...document.querySelectorAll('[data-public-status]')];
          const downloadStatusNodes = [...document.querySelectorAll('[data-download-status]')];
          const panels = [...(analysisRoot?.querySelectorAll('section[data-testid], article[data-testid]') || [])];
          const blankPanels = panels.filter((panel) => {
            const panelText = panel.textContent?.trim() || '';
            return !panelText && !panel.querySelector('svg, canvas, table, a, button, img, [role="status"]');
          }).map((panel) => panel.getAttribute('data-testid'));
          const chartCount = analysisRoot?.querySelectorAll('svg[role="img"], canvas, [data-chart]').length || 0;
          const rawTable = analysisRoot?.querySelector('details[data-testid="public-raw-table"]');
          return {
            mounted: Boolean(analysisRoot),
            ready: analysisRoot?.getAttribute('data-analysis-state') === 'ready',
            elementId: analysisRoot?.getAttribute('data-element-id') || null,
            title,
            expectedTitle: ${JSON.stringify(expectedTitle)},
            publicStatuses: publicStatusNodes.map((node) => node.textContent?.trim() || '').filter(Boolean),
            publicStatusValues: publicStatusNodes.map((node) => node.getAttribute('data-public-status')).filter(Boolean),
            downloadStatuses: downloadStatusNodes.map((node) => node.textContent?.trim() || '').filter(Boolean),
            visibleTechnical,
            domTechnical,
            internalStatusVisible: ${INTERNAL_STATUS_PATTERN}.test(text),
            blankPanels,
            chartCount,
            rawTableClosed: !rawTable || rawTable.open === false,
            sourcePresent: ${JSON.stringify(expectedSources)}.length === 0 || ${JSON.stringify(expectedSources)}.some((source) => text.includes(normalize(source))),
            periodPresent: ${JSON.stringify(expectedPeriods)}.length === 0 || ${JSON.stringify(expectedPeriods)}.some((period) => text.includes(period)),
            sourcePanel: Boolean(analysisRoot?.querySelector('[data-testid="public-source-panel"]')),
            alert: document.querySelector('[role="alert"]')?.textContent?.trim() || null,
            textLength: text.trim().length,
          };
        })()`
      );
      inspectedDetailCount += 1;
      if (!result?.mounted || !result.ready || result.elementId !== element.elementId || result.alert) {
        detailFailures.push({ elementId: element.elementId, result });
        continue;
      }
      if (result.title !== expectedTitle) {
        titleFailures.push({ elementId: element.elementId, actual: result.title, expected: expectedTitle });
      }
      if (
        !expectedStatus ||
        !result.publicStatuses.includes(expectedStatus) ||
        result.publicStatusValues.some((value) => ![expectedStatus, expectedStatusKey].includes(value)) ||
        !result.downloadStatuses.includes(expectedDownload)
      ) {
        statusFailures.push({
          elementId: element.elementId,
          expectedStatus,
          expectedStatusKey,
          actualStatuses: result.publicStatuses,
          statusValues: result.publicStatusValues,
          expectedDownload,
          actualDownloads: result.downloadStatuses,
        });
      }
      for (const token of [...result.visibleTechnical, ...result.domTechnical]) {
        technicalTokenHits.push({ elementId: element.elementId, token });
      }
      if (result.internalStatusVisible) {
        technicalTokenHits.push({ elementId: element.elementId, token: "internal-public-status" });
      }
      if (result.blankPanels.length > 0 || result.textLength === 0) {
        blankPanelFailures.push({ elementId: element.elementId, panels: result.blankPanels });
      }
      const populated = DATA_BEARING.has(element.dataPresenceStatus);
      if (
        populated &&
        (!result.sourcePanel || !result.sourcePresent || !result.periodPresent || !result.rawTableClosed)
      ) {
        metadataFailures.push({
          elementId: element.elementId,
          sourcePanel: result.sourcePanel,
          source: result.sourcePresent,
          period: result.periodPresent,
          rawTableClosed: result.rawTableClosed,
        });
      }
      if (!populated && result.chartCount > 0) {
        blankPanelFailures.push({ elementId: element.elementId, error: "status-only element rendered a chart", chartCount: result.chartCount });
      }
    } catch (error) {
      detailFailures.push({
        elementId: element.elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const responsiveRoutes = [
    { name: "home", suffix: "/#home", selector: "[data-v128-home]" },
    { name: "finder", suffix: "/?country=VNM#explorer", selector: ".cdp-card-grid" },
    { name: "detail", suffix: "/?view=data&country=VNM&element=A-002#element-detail", selector: "[data-testid='public-analysis-root']" },
    { name: "map", suffix: "/?country=VNM#map", selector: ".cdp-map-page" },
    { name: "download", suffix: "/?country=VNM#download", selector: ".cdp-download-list" },
    { name: "guide", suffix: "/#guide", selector: "[data-v128-guide]" },
    { name: "not-found", suffix: "/#missing-v128-screen", selector: "[data-v128-not-found]" },
  ];
  for (const width of [390, 768, 1024, 1440]) {
    for (const route of responsiveRoutes) {
      try {
        await setViewport(browser.cdp, width, width === 390 ? 1000 : 1100);
        await navigate(browser.cdp, `${server.url}${route.suffix}`);
        await waitForValue(
          browser.cdp,
          `Boolean(document.querySelector(${JSON.stringify(route.selector)}))`,
          { timeoutMs: route.name === "map" ? 30_000 : 20_000 }
        );
        const result = await evaluateValue(
          browser.cdp,
          `(() => {
            const main = document.querySelector('main');
            const controls = [...(main?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])') || [])]
              .filter((node) => {
                const style = getComputedStyle(node);
                const rect = node.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
              });
            const unnamed = controls.filter((node) => {
              const id = node.getAttribute('id');
              const explicitLabel = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
              const wrappedLabel = node.closest('label');
              const name = node.getAttribute('aria-label') || node.getAttribute('aria-labelledby') ||
                explicitLabel?.textContent || wrappedLabel?.textContent || node.textContent || node.getAttribute('title') || node.getAttribute('placeholder');
              return !String(name || '').trim();
            }).length;
            const unlabeledForms = [...(main?.querySelectorAll('input:not([type="hidden"]), select, textarea') || [])]
              .filter((node) => {
                const id = node.getAttribute('id');
                return !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby') &&
                  !node.closest('label') && !(id && document.querySelector('label[for="' + CSS.escape(id) + '"]'));
              }).length;
            const imagesWithoutAlt = [...(main?.querySelectorAll('img') || [])].filter((node) => !node.hasAttribute('alt')).length;
            const text = String(main?.innerText || '').normalize('NFC');
            const visibleTechnical = ${JSON.stringify(TECHNICAL_VISIBLE_TOKENS)}.filter((token) =>
              text.toLocaleLowerCase('en-US').includes(token.toLocaleLowerCase('en-US'))
            );
            const allowedPublicStatuses = ['데이터 제공', '일부 데이터 제공', '입력 양식', '입력 예정', '원자료 미수집'];
            const allowedPublicStatusKeys = ['data-provided', 'partially-provided', 'input-template', 'planned', 'source-not-collected'];
            const publicStatusNodes = [...(main?.querySelectorAll('[data-public-status]') || [])];
            const invalidPublicStatuses = publicStatusNodes
              .map((node) => ({ label: node.textContent?.trim() || '', key: node.getAttribute('data-public-status') || '' }))
              .filter((status) => !allowedPublicStatuses.includes(status.label) || !allowedPublicStatusKeys.includes(status.key));
            const allowedDownloadStatuses = ['다운로드 가능', '화면에서만 제공', '다운로드 자료 없음'];
            const allowedDownloadStatusKeys = ['downloadable', 'display-only', 'no-download-data'];
            const downloadStatusNodes = [...(main?.querySelectorAll('[data-download-status]') || [])];
            const invalidDownloadStatuses = downloadStatusNodes
              .map((node) => ({ label: node.textContent?.trim() || '', key: node.getAttribute('data-download-status') || '' }))
              .filter((status) => !allowedDownloadStatuses.includes(status.label) || !allowedDownloadStatusKeys.includes(status.key));
            return {
              overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
              h1Count: main?.querySelectorAll('h1').length || 0,
              unnamed,
              unlabeledForms,
              imagesWithoutAlt,
              controlCount: controls.length,
              visibleTechnical,
              invalidPublicStatuses,
              invalidDownloadStatuses,
            };
          })()`
        );
        if (Number(result?.overflow || 0) > 1) responsiveFailures.push({ width, route: route.name, result });
        if (
          result?.h1Count !== 1 ||
          Number(result?.unnamed || 0) > 0 ||
          Number(result?.unlabeledForms || 0) > 0 ||
          Number(result?.imagesWithoutAlt || 0) > 0 ||
          Number(result?.controlCount || 0) === 0
        ) {
          accessibilityFailures.push({ width, route: route.name, result });
        }
        for (const token of result?.visibleTechnical || []) {
          technicalTokenHits.push({ width, route: route.name, token });
        }
        if (
          width === 1440 &&
          ((result?.invalidPublicStatuses || []).length > 0 ||
            (result?.invalidDownloadStatuses || []).length > 0)
        ) {
          statusFailures.push({
            route: route.name,
            publicStatuses: result.invalidPublicStatuses,
            downloadStatuses: result.invalidDownloadStatuses,
          });
        }
      } catch (error) {
        responsiveFailures.push({
          width,
          route: route.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check(
  "ELEMENT_DETAIL_SCREEN_COVERAGE",
  runtimeFailure === null && inspectedDetailCount === 152 && detailFailures.length === 0,
  { inspected: inspectedDetailCount, failures: detailFailures.length, runtimeFailure },
  { inspected: 152, failures: 0, runtimeFailure: null },
  detailFailures.slice(0, 152)
);
audit.check("TECHNICAL_PUBLIC_TOKEN", technicalTokenHits.length === 0, technicalTokenHits.length, 0, technicalTokenHits.slice(0, 200));
audit.check("UNEXPLAINED_BLANK_PANEL", blankPanelFailures.length === 0, blankPanelFailures.length, 0, blankPanelFailures.slice(0, 152));
audit.check("PUBLIC_STATUS_LABEL_CONSISTENCY", statusFailures.length === 0, statusFailures.length, 0, statusFailures.slice(0, 152));
audit.check("PUBLIC_TITLE_CONSISTENCY", titleFailures.length === 0, titleFailures.length, 0, titleFailures.slice(0, 152));
audit.check("SOURCE_AND_PERIOD_PRESENCE", metadataFailures.length === 0, metadataFailures.length, 0, metadataFailures.slice(0, 152));
audit.check("RESPONSIVE_LAYOUT", responsiveFailures.length === 0, responsiveFailures.length, 0, responsiveFailures);
audit.check("ACCESSIBILITY_SMOKE", accessibilityFailures.length === 0, accessibilityFailures.length, 0, accessibilityFailures);
audit.check("PUBLIC_ASSET_RESPONSE", networkFailures.length === 0, networkFailures.length, 0, networkFailures.slice(0, 200));
audit.check("UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

audit.finish({
  publicScreenAudit: runtimeFailure === null && audit.checks.every((check) => check.status === "PASS") ? "PASS" : "FAIL",
  inspectedElementDetails: inspectedDetailCount,
  elementDetailFailureCount: detailFailures.length,
  technicalPublicTokenCount: technicalTokenHits.length,
  unexplainedBlankPanelCount: blankPanelFailures.length,
  statusLabelFailureCount: statusFailures.length,
  titleConsistencyFailureCount: titleFailures.length,
  sourcePeriodFailureCount: metadataFailures.length,
  responsiveFailureCount: responsiveFailures.length,
  accessibilityFailureCount: accessibilityFailures.length,
  responsiveWidths: [390, 768, 1024, 1440],
});
