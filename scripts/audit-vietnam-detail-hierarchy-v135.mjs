#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, V2_ROOT, catalogElements, readJson } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV135, finishAuditV135 } from "./v135/audit-helpers.mjs";

const audit = new AuditV125("detail-hierarchy:v135");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);

let server = null;
let browser = null;
let runtimeFailure = null;
const routes = [];
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before detail hierarchy audit");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });
  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    try {
      await navigate(browser.cdp, detailUrlV135(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `(() => {
        const root = document.querySelector('[data-testid="public-analysis-root"]');
        if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
        return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
      })()`,
        { timeoutMs: 20_000 }
      );
      const snapshot = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          const primary = root?.querySelector('[data-testid="public-analysis-primary"]');
          const metadata = root?.querySelector('[data-testid="detail-metadata-v135"]');
          const raw = root?.querySelector('[data-testid="public-observation-table-v126"], [data-testid="public-entity-table-v126"], details[data-raw-table]');
          const ghg = root?.querySelector('[data-testid="ghg-sector-gas-analysis-v135"]');
          const text = String(root?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
          const before = (left, right) => Boolean(left && right && (left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING));
          const portfolioSummary = root?.querySelector('[data-testid*="portfolio-summary"], [data-testid*="portfolio-analysis"], [data-public-portfolio-summary-v135]');
          const portfolioList = root?.querySelector('[data-testid*="portfolio-list"], [data-testid*="entity-list"], [data-public-portfolio-list-v135]');
          return {
            title: String(root?.querySelector('h1, [data-testid="public-data-title"]')?.textContent || '').trim(),
            primary: Boolean(primary),
            metadata: Boolean(metadata),
            primaryBeforeMetadata: before(primary, metadata),
            primaryBeforeRaw: raw ? before(primary, raw) : true,
            portfolioSummary: Boolean(portfolioSummary),
            portfolioList: Boolean(portfolioList),
            portfolioSummaryBeforeList: portfolioSummary && portfolioList ? before(portfolioSummary, portfolioList) : true,
            ghgPresent: Boolean(ghg),
            rawMatrixPrimary: ghg?.getAttribute('data-raw-matrix-primary') || null,
            genericRawMatrixHeading: /분류별\\s*근거\\s*매트릭스/u.test(text),
            alert: String(root?.querySelector('[role="alert"]')?.textContent || '').trim(),
          };
        })()`
      );
      routes.push({ elementId, ...snapshot });
    } catch (error) {
      routes.push({ elementId, error: error instanceof Error ? error.message : String(error) });
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const routeFailures = routes.filter((row) => row.error || row.alert);
const blankTitles = routes.filter((row) => !row.title);
const missingPrimary = routes.filter((row) => !row.primary);
const missingMetadata = routes.filter((row) => !row.metadata);
const metadataBeforeAnalysis = routes.filter((row) => row.metadata && !row.primaryBeforeMetadata);
const rawBeforeAnalysis = routes.filter((row) => !row.primaryBeforeRaw);
const rawMatrixAsPrimary = routes.filter((row) => row.genericRawMatrixHeading || row.rawMatrixPrimary === "true");
const portfolioListBeforeSummary = routes.filter(
  (row) => /^D-(?:0(?:1[2-9]|2[0-6]))$/u.test(row.elementId) && row.portfolioList && !row.portfolioSummaryBeforeList
);
const ghg = routes.find((row) => row.elementId === "C-002");

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("DETAIL_ROUTE_RUNTIME_COVERAGE", runtimeFailure === null && routes.length === 152 && routeFailures.length === 0, { runtimeFailure, routeCount: routes.length, routeFailures }, { routeCount: 152, routeFailures: [] });
audit.check("DETAIL_PUBLIC_TITLE_COVERAGE", blankTitles.length === 0, blankTitles, []);
audit.check("DETAIL_PRIMARY_ANALYSIS_COVERAGE", missingPrimary.length === 0, missingPrimary, []);
audit.check("DETAIL_METADATA_MARKER_COVERAGE", missingMetadata.length === 0, missingMetadata, []);
audit.check("DETAIL_METADATA_BEFORE_ANALYSIS_COUNT", metadataBeforeAnalysis.length === 0, metadataBeforeAnalysis, []);
audit.check("RAW_TABLE_BEFORE_ANALYSIS_COUNT", rawBeforeAnalysis.length === 0, rawBeforeAnalysis, []);
audit.check("RAW_MATRIX_AS_PRIMARY_COUNT", rawMatrixAsPrimary.length === 0, rawMatrixAsPrimary, []);
audit.check("PORTFOLIO_LIST_BEFORE_SUMMARY_COUNT", portfolioListBeforeSummary.length === 0, portfolioListBeforeSummary, []);
audit.check("GHG_ANALYTICAL_HIERARCHY", ghg?.ghgPresent === true && ghg?.rawMatrixPrimary === "false", ghg || null, { ghgPresent: true, rawMatrixPrimary: "false" });
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV135(audit, "detail-hierarchy-audit-v135.json", {
  inspectedRoutes: routes.length,
  detailMetadataBeforeAnalysisCount: metadataBeforeAnalysis.length,
  rawMatrixAsPrimaryCount: rawMatrixAsPrimary.length,
  portfolioListBeforeSummaryCount: portfolioListBeforeSummary.length,
  runtimeFailure,
});
