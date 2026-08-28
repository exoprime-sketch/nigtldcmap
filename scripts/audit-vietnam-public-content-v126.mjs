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
  launchHeadlessBrowser,
  navigate,
  startStaticBuildServer,
  waitForValue,
  evaluateValue,
  setViewport,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("public-content:v126");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("PUBLIC_DETAIL_ROUTE_TARGET_COUNT", catalog.length === 152, catalog.length, 152);

const PUBLIC_DOM_FORBIDDEN = [
  ".xlsx",
  "SDMX flat",
  "INDICATOR=",
  "COMP_BREAKDOWN",
  "REF_AREA=",
  "sourceFile",
  "source-file",
  "source_file",
  "sourceSheet",
  "source-sheet",
  "source_sheet",
  "sourceRow",
  "source-row",
  "source_row",
  "recordId",
  "record-id",
  "record_id",
  "indicatorId",
  "indicator-id",
  "indicator_id",
  "sourceSeriesId",
  "source-series-id",
  "source_series_id",
  "apiEndpoint",
  "api-endpoint",
  "api_endpoint",
  "apiParams",
  "api-params",
  "api_params",
  "rawAttributes",
  "raw-attributes",
  "raw_attributes",
  "packUrl",
  "pack-url",
  "pack_url",
  "shardId",
  "shard-id",
  "shard_id",
  "sha256",
  "publicationDecisionId",
  "publication-decision-id",
  "publication_decision_id",
  "data-v125-",
  "data-v126-",
  "data-public-renderer",
  "data-renderer=",
];
const INTERNAL_PROVENANCE = [
  "sourceFileOriginal",
  "sourceFileDecoded",
  "sourceFile",
  "source-file",
  "source_file",
  "sourceSheet",
  "source-sheet",
  "source_sheet",
  "sourceRow",
  "source-row",
  "source_row",
  "sourceSeriesId",
  "source-series-id",
  "source_series_id",
  "indicatorId",
  "indicator-id",
  "indicator_id",
  "recordId",
  "record-id",
  "record_id",
  "apiEndpoint",
  "api-endpoint",
  "api_endpoint",
  "apiParams",
  "api-params",
  "api_params",
  "rawAttributes",
  "raw-attributes",
  "raw_attributes",
  "packUrl",
  "pack-url",
  "pack_url",
  "shardId",
  "shard-id",
  "shard_id",
  "sha256",
  "publicationDecisionId",
  "publication-decision-id",
  "publication_decision_id",
  "generatorVersion",
  "etlVersion",
];
const ANALYSIS_BODY_FORBIDDEN = [
  "MultiLineString",
  "geometry",
  "MapLibre",
  "renderer",
];
const GENERIC_DEVELOPER_COPY = [
  "V124",
  "V125",
  "semantic",
  "의미 계약",
  "의미 보존 시각화",
  "renderer",
  "측정항목·분류 차원별 시각화",
  "원자료 관측범위",
  "technical provenance",
];

let server = null;
let browser = null;
let runtimeFailure = null;
const routeFailures = [];
const publicDomHits = [];
const sourcePanelHits = [];
const provenanceHits = [];
const developerCopyHits = [];
const analysisBodyHits = [];
let renderedRouteCount = 0;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1050);

  for (const element of catalog) {
    const populated = ["actual-records", "partial-records"].includes(
      element.dataPresenceStatus
    );
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
          const root = document.querySelector('[data-v126-public-analysis], [data-testid="public-analysis-root"]');
          if (document.querySelector('[role="alert"]')) return true;
          if (!root || !root.querySelector('[data-testid="public-data-title"]')) return false;
          if (!root.querySelector('[data-testid="public-analysis-primary"]')) return false;
          if (!root.querySelector('[data-testid="public-source-panel"]')) return false;
          return ${populated ? "Boolean(root.querySelector('details[data-testid=\"public-raw-table\"]'))" : "true"};
        })()`,
        { timeoutMs: 20_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-v126-public-analysis], [data-testid="public-analysis-root"]');
          if (!root) {
            return {
              mounted: false,
              alert: document.querySelector('[role="alert"]')?.textContent?.trim() || null,
            };
          }
          const normalize = (value) => String(value || '').normalize('NFC');
          const html = normalize(document.body.outerHTML);
          const visibleText = normalize(document.body.innerText);
          const sourcePanel = root.querySelector('[data-testid="public-source-panel"]');
          const sourceHtml = normalize(sourcePanel?.outerHTML);
          const analysisRoot = root.querySelector('[data-testid="public-analysis-primary"]') || root;
          const analysisText = normalize(analysisRoot.innerText);
          const match = (haystack, tokens) => tokens.filter((token) =>
            haystack.toLocaleLowerCase('en-US').includes(token.toLocaleLowerCase('en-US'))
          );
          return {
            mounted: true,
            elementId: root.getAttribute('data-element-id') ||
              root.getAttribute('data-v126-element-id') || null,
            title: root.querySelector('[data-testid="public-data-title"], h1, h2')?.textContent?.trim() || null,
            publicDomHits: match(html, ${JSON.stringify(PUBLIC_DOM_FORBIDDEN)}),
            sourcePanelHits: match(sourceHtml, ${JSON.stringify(PUBLIC_DOM_FORBIDDEN)}),
            provenanceHits: match(html, ${JSON.stringify(INTERNAL_PROVENANCE)}),
            internalIndicatorCodes: [...new Set(html.match(/[A-E]-\\d{3}_[A-Za-z0-9_]+/gu) || [])],
            technicalLocators: [...new Set(
              visibleText.match(/[^\\n]{0,80}(?:(?:워크시트|시트)\\s+\\d+(?:\\s*[–—~-]\\s*\\d+)?행|\\[?\\s*원본\\s+\\d+(?:(?:\\s*[–—~\\-·]\\s*)\\d+)*\\s*행\\s*\\]?)[^\\n]{0,80}/gu) || []
            )],
            sourceTechnicalLocators: [...new Set(
              normalize(sourcePanel?.innerText).match(/[^\\n]{0,80}(?:(?:워크시트|시트)\\s+\\d+(?:\\s*[–—~-]\\s*\\d+)?행|\\[?\\s*원본\\s+\\d+(?:(?:\\s*[–—~\\-·]\\s*)\\d+)*\\s*행\\s*\\]?)[^\\n]{0,80}/gu) || []
            )],
            developerCopyHits: match(visibleText, ${JSON.stringify(GENERIC_DEVELOPER_COPY)}),
            analysisBodyHits: match(analysisText, ${JSON.stringify(ANALYSIS_BODY_FORBIDDEN)}),
          };
        })()`
      );
      if (!result?.mounted) {
        routeFailures.push({ elementId: element.elementId, error: result?.alert || "public root missing" });
        continue;
      }
      const sourceTabActivation = await evaluateValue(
        browser.cdp,
        `(() => {
          const button = [...document.querySelectorAll('button')]
            .find((node) => node.textContent?.trim() === '출처·이용조건');
          if (!button) return false;
          button.click();
          return true;
        })()`
      );
      if (sourceTabActivation) {
        await waitForValue(
          browser.cdp,
          `Boolean(document.querySelector('.cdp-source-grid--detail'))`,
          { timeoutMs: 10_000 }
        );
        const sourceTabResult = await evaluateValue(
          browser.cdp,
          `(() => {
            const normalize = (value) => String(value || '').normalize('NFC');
            const panel = document.querySelector('.cdp-source-grid--detail')?.parentElement;
            const html = normalize(panel?.outerHTML);
            const visibleText = normalize(panel?.innerText);
            const match = (haystack, tokens) => tokens.filter((token) =>
              haystack.toLocaleLowerCase('en-US').includes(token.toLocaleLowerCase('en-US'))
            );
            return {
              forbidden: match(html, ${JSON.stringify(PUBLIC_DOM_FORBIDDEN)}),
              provenance: match(html, ${JSON.stringify(INTERNAL_PROVENANCE)}),
              developerCopy: match(visibleText, ${JSON.stringify(GENERIC_DEVELOPER_COPY)}),
              technicalLocators: [...new Set(
                visibleText.match(/[^\\n]{0,80}(?:워크시트|시트)\\s+\\d+(?:\\s*[–—-]\\s*\\d+)?행[^\\n]{0,80}/gu) || []
              )],
            };
          })()`
        );
        for (const token of sourceTabResult?.forbidden || []) {
          sourcePanelHits.push({ elementId: element.elementId, token, surface: "source-tab" });
          publicDomHits.push({ elementId: element.elementId, token, surface: "source-tab" });
        }
        for (const token of sourceTabResult?.provenance || []) {
          provenanceHits.push({ elementId: element.elementId, token, surface: "source-tab" });
        }
        for (const token of sourceTabResult?.developerCopy || []) {
          developerCopyHits.push({ elementId: element.elementId, token, surface: "source-tab" });
        }
        for (const token of sourceTabResult?.technicalLocators || []) {
          provenanceHits.push({ elementId: element.elementId, token, surface: "source-tab" });
          sourcePanelHits.push({ elementId: element.elementId, token, surface: "source-tab" });
        }
      }
      renderedRouteCount += 1;
      if (result.elementId && result.elementId !== element.elementId) {
        routeFailures.push({
          elementId: element.elementId,
          error: `rendered element mismatch: ${result.elementId}`,
        });
      }
      if (!result.title) routeFailures.push({ elementId: element.elementId, error: "title missing" });
      for (const token of result.publicDomHits || []) publicDomHits.push({ elementId: element.elementId, token });
      for (const token of result.sourcePanelHits || []) sourcePanelHits.push({ elementId: element.elementId, token });
      for (const token of result.provenanceHits || []) provenanceHits.push({ elementId: element.elementId, token });
      for (const token of result.internalIndicatorCodes || []) {
        publicDomHits.push({ elementId: element.elementId, token });
        provenanceHits.push({ elementId: element.elementId, token });
      }
      for (const token of result.technicalLocators || []) {
        publicDomHits.push({ elementId: element.elementId, token });
        provenanceHits.push({ elementId: element.elementId, token });
      }
      for (const token of result.sourceTechnicalLocators || []) {
        sourcePanelHits.push({ elementId: element.elementId, token });
      }
      for (const token of result.developerCopyHits || []) developerCopyHits.push({ elementId: element.elementId, token });
      for (const token of result.analysisBodyHits || []) analysisBodyHits.push({ elementId: element.elementId, token });
    } catch (error) {
      routeFailures.push({
        elementId: element.elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check(
  "PUBLIC_DETAIL_ROUTES_RENDERED",
  runtimeFailure === null && renderedRouteCount === 152 && routeFailures.length === 0,
  { rendered: renderedRouteCount, failed: routeFailures.length, runtimeFailure },
  { rendered: 152, failed: 0, runtimeFailure: null },
  routeFailures.slice(0, 152)
);
audit.check(
  "PUBLIC_DOM_FORBIDDEN_TOKEN",
  publicDomHits.length === 0,
  publicDomHits.length,
  0,
  publicDomHits.slice(0, 200)
);
audit.check(
  "PUBLIC_SOURCE_PANEL_FORBIDDEN_TOKEN",
  sourcePanelHits.length === 0,
  sourcePanelHits.length,
  0,
  sourcePanelHits.slice(0, 200)
);
audit.check(
  "INTERNAL_PROVENANCE_DOM",
  provenanceHits.length === 0,
  provenanceHits.length,
  0,
  provenanceHits.slice(0, 200)
);
audit.check(
  "GENERIC_DEVELOPER_COPY",
  developerCopyHits.length === 0,
  developerCopyHits.length,
  0,
  developerCopyHits.slice(0, 200)
);
audit.check(
  "ANALYSIS_BODY_IMPLEMENTATION_TERMS",
  analysisBodyHits.length === 0,
  analysisBodyHits.length,
  0,
  analysisBodyHits.slice(0, 200)
);

audit.finish({
  inspectedRoutes: renderedRouteCount,
  publicDomForbiddenTokenCount: publicDomHits.length,
  publicSourcePanelForbiddenTokenCount: sourcePanelHits.length,
  internalProvenanceDomCount: provenanceHits.length,
  genericDeveloperCopyCount: developerCopyHits.length,
  analysisBodyImplementationTermCount: analysisBodyHits.length,
});
