#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  fileSha256,
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
// C-007 and C-008 left the portfolio renderer in V141: their attribute rows
// are read as participation statements, initiatives and actors
// (CooperationChecklistAnalysisV141), not as a project portfolio.
const NOT_PORTFOLIO_V141 = new Set(["C-007", "C-008"]);
const portfolioIds = [...new Set(["D-012", ...portfolioRendererIds])].filter((id) => !NOT_PORTFOLIO_V141.has(id));
// The screens are driven from the served build, so the expectations are read
// from the data that build holds. Reading public/data while driving build/ made
// this audit compare two different trees: it counted C-007 as having no entities
// in the older tree and then reported the screen that draws 32 of them.
const BUILD_ROOT = resolve(PROJECT_ROOT, "build");
const BUILD_DATA_ROOT = resolve(BUILD_ROOT, "data/vietnam/v2");
const pack = loadPackPayloads(BUILD_DATA_ROOT);

/** The build's data and the repository's data have to be the same bytes. */
const dataDifferences = ["packs/bundle-index-v124.json", "catalog.json", "manifest.json"]
  .map((file) => {
    const built = resolve(BUILD_DATA_ROOT, file);
    const published = resolve(V2_ROOT, file);
    if (!existsSync(built) || !existsSync(published)) {
      return { file, built: existsSync(built), published: existsSync(published) };
    }
    return fileSha256(built) === fileSha256(published) ? null : { file, sha: "differs" };
  })
  .filter(Boolean);

/**
 * Every four-digit year the element's own records contain.
 *
 * This answers one question: is a year the screen shows a year the source
 * states? A screen with no year trend is not failed for it - E-018 writes
 * "1999 설립 / 2020 진출" in a single cell and E-020 says only "연 1회 공모", and a
 * trend drawn from either would be a year the platform picked rather than one
 * the source reported. What must never happen is the opposite: a year on screen
 * that appears nowhere in the data.
 */
const yearsInRecords = new Map(
  portfolioIds.map((elementId) => {
    const payload = pack.elements.get(elementId);
    const years = new Set();
    for (const record of [
      ...payloadRecords(payload?.entities),
      ...payloadRecords(payload?.observations),
    ]) {
      for (const value of JSON.stringify(record).match(/(?:19|20)\d{2}/gu) || []) {
        years.add(value);
      }
    }
    return [elementId, years];
  })
);

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
  server = await startStaticBuildServer(BUILD_ROOT);
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
            yearRangeKpi: Boolean(summary?.querySelector('[data-portfolio-kpi="year-range"]')),
            // No backslash escapes here: this expression travels through a
            // template literal and a CDP payload, and a regex class did not
            // survive the trip - the check quietly matched nothing.
            shownYears: [...new Set([
              ...[...(summary?.querySelector('[data-testid="portfolio-year-trend-v132"]')?.querySelectorAll('*') || [])]
                .map((node) => (node.textContent || '').trim())
                .filter((text) => text.length === 4 && (text.startsWith('19') || text.startsWith('20')) && Number.isFinite(Number(text))),
              ...((summary?.querySelector('[data-portfolio-kpi="year-range"] strong')?.textContent || '')
                .split(/[^0-9]+/u)
                .filter((text) => text.length === 4 && (text.startsWith('19') || text.startsWith('20')) && Number.isFinite(Number(text)))),
            ])],
            filterCount: list?.querySelectorAll('input, select').length || 0,
            filters: Boolean(list?.querySelector('[data-testid="portfolio-list-filters-v132"]')),
            alert: root?.querySelector('[role="alert"]')?.textContent || '',
          };
        })()`
      );
      routeResults.push(result);
      const requiresEntitySummary = entityBearingIds.has(elementId);
      // A year trend is required where the delivery dates its records and
      // forbidden where it does not. The two are the same derivation, so the
      // trend and the 확인 기간 KPI have to agree with each other; a screen
      // showing one without the other is describing a year it does not have.
      const inconsistentYearSummary =
        Boolean(result?.yearTrend) !== Boolean(result?.yearRangeKpi);
      if (
        result?.alert ||
        (requiresEntitySummary && (
          !result?.summary ||
          !result?.summaryBeforeList ||
          !result?.filters ||
          Number(result?.filterCount || 0) < 3 ||
          inconsistentYearSummary
        )) ||
        (!requiresEntitySummary && result?.list)
      ) {
        routeFailures.push({ ...result, inconsistentYearSummary });
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
  "PORTFOLIO_DATA_SOURCE_MATCHES_BUILD",
  dataDifferences.length === 0,
  dataDifferences,
  []
);
const inventedYears = routeResults
  .map((result) => ({
    elementId: result.elementId,
    invented: (result.shownYears || []).filter(
      (year) => !(yearsInRecords.get(result.elementId) || new Set()).has(year)
    ),
  }))
  .filter((row) => row.invented.length > 0);
audit.check(
  "PORTFOLIO_YEAR_NOT_INVENTED",
  inventedYears.length === 0,
  inventedYears,
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
