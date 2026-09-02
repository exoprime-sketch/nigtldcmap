#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  catalogElements,
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
import { detailUrlV134, finishAuditV134 } from "./v134/audit-helpers.mjs";

const audit = new AuditV125("oda-analysis:v134");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const semanticResult = readJson(resolve(SEMANTIC_ROOT, "elements/d-011.json"));
const semantic = semanticResult.value || {};
const payloads = loadPackPayloads();
const observations = payloadRecords(payloads.elements.get("D-011")?.observations);
const populated = observations.filter(
  (row) => typeof row?.value === "number" && Number.isFinite(row.value) && Number.isFinite(Number(row.year))
);
const totalRows = populated.filter(
  (row) => row.indicatorId === "D-011_oda_disbursement_official_donors"
);
const providerIndicators = (semantic.indicators || []).filter(
  (indicator) => indicator?.dimensions?.detail === "대베트남 ODA 총지출액(개별)"
);
const subProviderIndicators = (semantic.indicators || []).filter(
  (indicator) => indicator?.dimensions?.detail === "대베트남 ODA 총지출액(개별(하위기구))"
);
const subProviderIndicatorIds = new Set(
  subProviderIndicators.map((indicator) => indicator.indicatorId)
);
const populatedSubProviderRows = populated.filter((row) =>
  subProviderIndicatorIds.has(row.indicatorId)
);
const years = [...new Set(totalRows.map((row) => Number(row.year)))].sort((a, b) => a - b);
const providerCount = providerIndicators.length;

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("D011_SOURCE_PAYLOAD", payloads.errors.length === 0 && observations.length === 400, { errors: payloads.errors, rows: observations.length }, { errors: [], rows: 400 });
audit.check("D011_PROVIDER_COUNT", providerCount > 0, providerCount, "> 0");
audit.check("D011_SUB_PROVIDER_COUNT", subProviderIndicators.length === 28, subProviderIndicators.length, 28);
audit.check("D011_POPULATED_RECONCILIATION", populated.length === 354, populated.length, 354);
audit.check("D011_TOTAL_YEAR_RANGE", years.length >= 2 && years[0] === 2020 && years.at(-1) === 2024, years, [2020, 2021, 2022, 2023, 2024]);
audit.check("D011_TOTAL_SERIES", totalRows.length === years.length, totalRows.length, years.length);

const componentPath = resolve(PROJECT_ROOT, "src/components/data/public/OdaProviderAnalysisV134.tsx");
const routerPath = resolve(PROJECT_ROOT, "src/components/data/public/PublicDataAnalysisRouterV126.tsx");
const registryPath = resolve(PROJECT_ROOT, "src/data/visualization/publicVisualizationRegistryV126.ts");
const source = [componentPath, routerPath, registryPath]
  .filter(existsSync)
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
audit.check("D011_SPECIALIZED_RENDERER", /OdaProviderAnalysisV134/u.test(source) && /D-011/u.test(source), "OdaProviderAnalysisV134 + D-011", "wired");
audit.check("D011_PROVIDER_RANKING_CONTRACT", /data-provider-ranking="true"/u.test(source) && /PROVIDER_LIMIT_V134\s*=\s*10/u.test(source), true, true);
audit.check("D011_TOTAL_TREND_CONTRACT", /testId="d011-total-trend"/u.test(source), true, true);
audit.check("D011_PROVIDER_TREND_CONTRACT", /testId="d011-provider-trend"/u.test(source), true, true);

let server = null;
let browser = null;
let runtimeFailure = null;
let snapshot = null;
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before ODA audit");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });
  await navigate(browser.cdp, detailUrlV134(server.url, "D-011"));
  await waitForValue(
    browser.cdp,
    "Boolean(document.querySelector('[data-testid=\"d011-specialized-analysis\"]'))",
    { timeoutMs: 30_000 }
  );
  snapshot = await evaluateValue(
    browser.cdp,
    [
      "(() => {",
      "const root = document.querySelector('[data-testid=\"d011-specialized-analysis\"]');",
      "const detailTableNode = root?.querySelector('[data-testid=\"d011-provider-table\"]');",
      "if (detailTableNode instanceof HTMLDetailsElement) detailTableNode.open = true;",
      "const text = String(root?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();",
      "const options = [...(root?.querySelectorAll('[data-testid=\"d011-provider-selector\"] option') || [])];",
      "return {",
      "mounted: Boolean(root),",
      "providerOptionCount: options.length,",
      "totalTrend: Boolean(root?.querySelector('[data-testid=\"d011-total-trend\"]')),",
      "rankingCount: root?.querySelectorAll('.osa134__ranking [role=\"listitem\"]').length || 0,",
      "providerTrend: Boolean(root?.querySelector('[data-testid=\"d011-provider-trend\"]')),",
      "detailTable: Boolean(root?.querySelector('[data-testid=\"d011-provider-table\"]')),",
      "detailTableRowCount: root?.querySelectorAll('[data-testid=\"d011-provider-table\"] tbody tr').length || 0,",
      "detailTableGlossaryControlCount: detailTableNode?.querySelectorAll('[data-public-term-v134]').length || 0,",
      "populatedRowCount: Number(root?.getAttribute('data-populated-row-count') || 0),",
      "subProviderRowCount: Number(root?.getAttribute('data-sub-provider-row-count') || 0),",
      "oecdVisible: text.includes('OECD'),",
      "yearRangeVisible: text.includes('2020–2024') || text.includes('2020-2024'),",
      "rawCategoryCodeVisible: /(?:^|\\s)1\\s*·\\s*2\\s*·\\s*3(?:\\s|$)/u.test(text) || text.includes('분류 레코드'),",
      "internalCodeVisible: /D-011_oda_|recordId|indicatorId|sourceRow|sourceSheet/u.test(text)",
      "};",
      "})()",
    ].join("\n")
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check("D011_RUNTIME_MOUNT", runtimeFailure === null && snapshot?.mounted === true, { runtimeFailure, snapshot }, { runtimeFailure: null, mounted: true });
audit.check("D011_PROVIDER_RANKING", Number(snapshot?.rankingCount || 0) >= 10, snapshot?.rankingCount || 0, ">= 10");
audit.check("D011_TOTAL_TREND", snapshot?.totalTrend === true, snapshot?.totalTrend, true);
audit.check("D011_PROVIDER_TREND", snapshot?.providerTrend === true, snapshot?.providerTrend, true);
audit.check("D011_PROVIDER_SELECTOR", snapshot?.providerOptionCount === providerCount, snapshot?.providerOptionCount, providerCount);
audit.check("D011_PUBLIC_ROW_RECONCILIATION", snapshot?.detailTableRowCount === populated.length && snapshot?.populatedRowCount === populated.length && snapshot?.subProviderRowCount === populatedSubProviderRows.length, snapshot, { detailTableRowCount: populated.length, populatedRowCount: populated.length, subProviderRowCount: populatedSubProviderRows.length });
audit.check("D011_PUBLIC_METADATA", snapshot?.oecdVisible === true && snapshot?.yearRangeVisible === true && snapshot?.detailTable === true, snapshot, "OECD + 2020–2024 + detail table");
audit.check("D011_RAW_CATEGORY_CODE_VISIBLE", snapshot?.rawCategoryCodeVisible === false, snapshot?.rawCategoryCodeVisible, false);
audit.check("D011_INTERNAL_CODE_VISIBLE", snapshot?.internalCodeVisible === false, snapshot?.internalCodeVisible, false);
audit.check("D011_DETAIL_TABLE_GLOSSARY_CONTROL_DENSITY", Number(snapshot?.detailTableGlossaryControlCount || 0) > 0 && Number(snapshot?.detailTableGlossaryControlCount || 0) <= 4, snapshot?.detailTableGlossaryControlCount || 0, "1–4 adjacent help controls; no per-row repetition");
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV134(audit, "oda-analysis-audit-v134.json", {
  odaProviderCount: providerCount,
  odaYearRange: years.length ? String(years[0]) + "–" + String(years.at(-1)) : null,
  totalObservationCount: totalRows.length,
  runtimeFailure,
});
