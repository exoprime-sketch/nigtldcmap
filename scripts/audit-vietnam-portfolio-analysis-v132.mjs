#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  loadPackPayloads,
  payloadRecords,
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
import { finishAuditV132 } from "./v132/audit-helpers.mjs";

const audit = new AuditV125("portfolio-analysis:v132");
const fitResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/visualization-semantic-fit-v129.json")
);
const fitRows = Array.isArray(fitResult.value?.elements) ? fitResult.value.elements : [];
const portfolioRendererIds = fitRows
  .filter((row) => row.primaryRenderer === "portfolio-dashboard")
  .map((row) => row.elementId);
const portfolioIds = [...new Set(["D-012", ...portfolioRendererIds])];
const pack = loadPackPayloads();
const dataSummary = portfolioIds.map((elementId) => {
  const payload = pack.elements.get(elementId);
  return {
    elementId,
    observationCount: payloadRecords(payload?.observations).filter(
      (row) => row.value !== null && row.value !== undefined && row.value !== ""
    ).length,
    entityCount: payloadRecords(payload?.entities).length,
  };
});
const entityBearingIds = new Set(
  dataSummary.filter((item) => item.entityCount > 0).map((item) => item.elementId)
);

let server = null;
let browser = null;
let runtimeFailure = null;
const routeResults = [];
const routeFailures = [];
let e008Result = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  for (const elementId of portfolioIds) {
    try {
      await navigate(browser.cdp, detailUrlV129(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
        { timeoutMs: 25_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          const summary = root?.querySelector('[data-testid="portfolio-analysis-summary-v132"]');
          const list = root?.querySelector('[data-testid="public-entity-card-grid-v131"], [data-testid="portfolio-entity-list-v132"]');
          const summaryTop = summary?.getBoundingClientRect().top ?? null;
          const listTop = list?.getBoundingClientRect().top ?? null;
          return {
            elementId: ${JSON.stringify(elementId)},
            summary: Boolean(summary),
            list: Boolean(list),
            summaryBeforeList: !list || (summaryTop !== null && listTop !== null && summaryTop < listTop),
            kpiCount: summary?.querySelectorAll('[data-portfolio-kpi]').length || 0,
            categorySummary: Boolean(summary?.querySelector('[data-portfolio-distribution]')),
            yearTrend: Boolean(summary?.querySelector('[data-testid="portfolio-year-trend-v132"]')),
            filterCount: list?.querySelectorAll('input, select').length || 0,
            filters: Boolean(list?.querySelector('[data-testid="portfolio-list-filters-v132"]')),
            alert: root?.querySelector('[role="alert"]')?.textContent || '',
          };
        })()`
      );
      routeResults.push(result);
      const requiresEntitySummary = entityBearingIds.has(elementId);
      if (
        result?.alert ||
        (requiresEntitySummary && (
          !result?.summary ||
          !result?.summaryBeforeList ||
          !result?.yearTrend ||
          !result?.filters ||
          Number(result?.filterCount || 0) < 3
        )) ||
        (!requiresEntitySummary && result?.list)
      ) {
        routeFailures.push(result);
      }
    } catch (error) {
      routeFailures.push({
        elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await navigate(browser.cdp, detailUrlV129(server.url, "E-008"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="e008-research-analysis-v132"]'))`,
    { timeoutMs: 25_000 }
  );
  e008Result = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="e008-research-analysis-v132"]');
      const ids = ['e008-kpis', 'e008-trend', 'e008-breakdown', 'e008-collaboration', 'e008-list'];
      const nodes = ids.map((id) => root?.querySelector('[data-testid="' + id + '"]'));
      const tops = nodes.map((node) => node?.getBoundingClientRect().top ?? null);
      return {
        sections: Object.fromEntries(ids.map((id, index) => [id, Boolean(nodes[index])])),
        ordered: tops.every((top) => top !== null) && tops.every((top, index) => index === 0 || top >= tops[index - 1]),
        filterCount: root?.querySelectorAll('input, select').length || 0,
        listItemCount: root?.querySelectorAll('[data-testid="e008-public-record"]')?.length || 0,
        internalTitleCount: [...(root?.querySelectorAll('h3, h4') || [])].filter((node) => /^(?:recordId|indicatorId|null|undefined)$/iu.test(node.textContent?.trim() || '')).length,
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check("PACK_PAYLOADS", pack.errors.length === 0, pack.errors, []);
audit.check("PORTFOLIO_ELEMENT_COUNT", portfolioIds.length >= 16, portfolioIds.length, ">= 16");
audit.check("D012_PORTFOLIO_ANALYSIS", portfolioIds.includes("D-012"), portfolioIds.includes("D-012"), true);
audit.check(
  "PORTFOLIO_DATA_ACCOUNTED",
  dataSummary.every((item) => item.observationCount > 0 || item.entityCount > 0),
  dataSummary.filter((item) => item.observationCount === 0 && item.entityCount === 0),
  []
);
audit.check(
  "PORTFOLIO_LIST_BEFORE_SUMMARY",
  runtimeFailure === null && routeResults.length === portfolioIds.length && routeFailures.length === 0,
  { runtimeFailure, checked: routeResults.length, failures: routeFailures },
  { runtimeFailure: null, checked: portfolioIds.length, failures: [] }
);
audit.check(
  "E008_ANALYSIS_BEFORE_LIST",
  e008Result?.ordered === true &&
    Object.values(e008Result?.sections || {}).every(Boolean) &&
    Number(e008Result?.filterCount || 0) >= 3,
  e008Result,
  {
    sections: {
      "e008-kpis": true,
      "e008-trend": true,
      "e008-breakdown": true,
      "e008-collaboration": true,
      "e008-list": true,
    },
    ordered: true,
    filterCount: ">= 3",
  }
);
audit.check(
  "RESEARCH_LIST_BEFORE_ANALYSIS",
  e008Result?.ordered === true,
  e008Result?.ordered,
  true
);
audit.check(
  "E008_PUBLIC_TITLE_POLICY",
  Number(e008Result?.internalTitleCount || 0) === 0,
  Number(e008Result?.internalTitleCount || 0),
  0
);
const v132ComponentSource = [
  "src/components/data/public/PublicPortfolioSummaryV132.tsx",
  "src/components/data/public/PublicPortfolioListV132.tsx",
  "src/components/data/public/ResearchPatentAnalysisV132.tsx",
].map((path) => readFileSync(resolve(PROJECT_ROOT, path), "utf8")).join("\n");
audit.check(
  "PUBLIC_FIELD_WHITELIST",
  !/\.normalizedAttributes\b/u.test(v132ComponentSource) &&
    /reviewedEntityAttributesV132/u.test(v132ComponentSource),
  {
    directNormalizedAttributeAccess: /\.normalizedAttributes\b/u.test(v132ComponentSource),
    reviewedProjectionUsed: /reviewedEntityAttributesV132/u.test(v132ComponentSource),
  },
  { directNormalizedAttributeAccess: false, reviewedProjectionUsed: true }
);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV132(audit, "portfolio-analysis-audit-v132.json", {
  portfolioElementCount: portfolioIds.length,
  entityBearingPortfolioElementCount: entityBearingIds.size,
  portfolioListBeforeSummaryCount: routeFailures.length,
  researchListBeforeAnalysisCount: e008Result?.ordered === true ? 0 : 1,
  e008Result: runtimeFailure === null && e008Result?.ordered === true ? "PASS" : "FAIL",
  runtimeFailure,
});
