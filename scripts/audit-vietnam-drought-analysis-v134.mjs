#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
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

const audit = new AuditV125("drought-analysis:v134");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const payloads = loadPackPayloads();
const observations = payloadRecords(payloads.elements.get("B-005")?.observations);
const scenarioIds = ["B-005_spei12_ssp245", "B-005_spei12_ssp585"];
const historicalId = "B-005_spei12_historical";
const speiRows = observations.filter(
  (row) =>
    [historicalId, ...scenarioIds].includes(row?.indicatorId) &&
    typeof row?.value === "number" &&
    Number.isFinite(row.value) &&
    Number.isFinite(Number(row.year))
);
const scenarioRows = speiRows.filter((row) => scenarioIds.includes(row.indicatorId));
const allYears = [...new Set(speiRows.map((row) => Number(row.year)))].sort((a, b) => a - b);
const scenarioYears = [...new Set(scenarioRows.map((row) => Number(row.year)))].sort((a, b) => a - b);
const observedScenarios = scenarioIds.filter((id) => scenarioRows.some((row) => row.indicatorId === id));
const comparisonYears = [2050, 2075, 2100];
const missingComparison = comparisonYears.flatMap((year) =>
  scenarioIds.filter((id) => !scenarioRows.some((row) => row.indicatorId === id && Number(row.year) === year))
    .map((id) => ({ year, indicatorId: id }))
);

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("B005_SOURCE_PAYLOAD", payloads.errors.length === 0 && observations.length === 503, { errors: payloads.errors, rows: observations.length }, { errors: [], rows: 503 });
audit.check("B005_SPEI_YEAR_RANGE", allYears[0] === 1951 && allYears.at(-1) === 2100, [allYears[0], allYears.at(-1)], [1951, 2100]);
audit.check("B005_SCENARIO_YEAR_RANGE", scenarioYears[0] === 2015 && scenarioYears.at(-1) === 2100, [scenarioYears[0], scenarioYears.at(-1)], [2015, 2100]);
audit.check("B005_SCENARIO_COUNT", observedScenarios.length === 2, observedScenarios, scenarioIds);
audit.check("B005_COMPARISON_VALUES", missingComparison.length === 0, missingComparison, []);

const componentPath = resolve(PROJECT_ROOT, "src/components/data/public/SpeiDroughtScenarioAnalysisV134.tsx");
const routerPath = resolve(PROJECT_ROOT, "src/components/data/public/PublicDataAnalysisRouterV126.tsx");
const source = [componentPath, routerPath]
  .filter(existsSync)
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
audit.check("B005_SPECIALIZED_RENDERER", /SpeiDroughtScenarioAnalysisV134/u.test(source) && /B-005/u.test(source), "SpeiDroughtScenarioAnalysisV134 + B-005", "wired");
audit.check("B005_NO_ARBITRARY_BAND", /data-fake-threshold="false"/u.test(source), true, true);
audit.check("B005_ZERO_REFERENCE_CONTRACT", /data-zero-reference="true"/u.test(source) && /b005-spei-zero-reference/u.test(source), true, true);

let server = null;
let browser = null;
let runtimeFailure = null;
let snapshot = null;
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before drought audit");
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
  await navigate(browser.cdp, detailUrlV134(server.url, "B-005"));
  await waitForValue(
    browser.cdp,
    "Boolean(document.querySelector('[data-testid=\"b005-specialized-analysis\"]'))",
    { timeoutMs: 30_000 }
  );
  snapshot = await evaluateValue(
    browser.cdp,
    [
      "(() => {",
      "const root = document.querySelector('[data-testid=\"b005-specialized-analysis\"]');",
      "const text = String(root?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();",
      "const comparison = root?.querySelector('[data-testid=\"b005-selected-year-comparison\"]');",
      "return {",
      "mounted: Boolean(root),",
      "meaning: Boolean(root?.querySelector('[data-testid=\"b005-spei-meaning\"]')) && text.includes('강수량') && text.includes('잠재증발산') && text.includes('평년보다 건조') && text.includes('평년보다 습윤'),",
      "zeroReference: Boolean(root?.querySelector('[data-testid=\"b005-spei-zero-reference\"]')),",
      "scenarioTrend: Boolean(root?.querySelector('[data-testid=\"b005-scenario-trend\"]')) && text.includes('SSP2-4.5') && text.includes('SSP5-8.5'),",
      "scenarioCount: Number(root?.getAttribute('data-scenario-count') || 0),",
      "yearButtons: [...(comparison?.querySelectorAll('button') || [])].map((node) => node.textContent?.trim()),",
      "comparisonRows: comparison?.querySelectorAll('[role=\"listitem\"]').length || 0,",
      "zeroImputationCopy: text.includes('미공개') && /미공개[^\\n]*0/u.test(text),",
      "arbitraryQualitative: /다소\\s*(?:건조|습윤)|심각한\\s*가뭄/u.test(text),",
      "internalCodeVisible: /B-005_spei|recordId|indicatorId|sourceRow|sourceSheet/u.test(text)",
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

audit.check("B005_RUNTIME_MOUNT", runtimeFailure === null && snapshot?.mounted === true, { runtimeFailure, snapshot }, { runtimeFailure: null, mounted: true });
audit.check("B005_SPEI_MEANING_VISIBLE", snapshot?.meaning === true, snapshot?.meaning, true);
audit.check("B005_ZERO_REFERENCE", snapshot?.zeroReference === true, snapshot?.zeroReference, true);
audit.check("B005_SCENARIO_TREND", snapshot?.scenarioTrend === true && snapshot?.scenarioCount === 2, { trend: snapshot?.scenarioTrend, scenarioCount: snapshot?.scenarioCount }, { trend: true, scenarioCount: 2 });
audit.check("B005_SELECTED_YEAR_COMPARISON", snapshot?.comparisonRows === 2 && comparisonYears.every((year) => snapshot?.yearButtons?.includes(String(year) + "년")), { rows: snapshot?.comparisonRows, buttons: snapshot?.yearButtons }, { rows: 2, buttons: ["2050년", "2075년", "2100년"] });
audit.check("B005_ZERO_IMPUTATION", snapshot?.zeroImputationCopy === false, snapshot?.zeroImputationCopy, false);
audit.check("B005_ARBITRARY_THRESHOLD", snapshot?.arbitraryQualitative === false, snapshot?.arbitraryQualitative, false);
audit.check("B005_INTERNAL_CODE_VISIBLE", snapshot?.internalCodeVisible === false, snapshot?.internalCodeVisible, false);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV134(audit, "drought-analysis-audit-v134.json", {
  speiYearRange: allYears.length ? String(allYears[0]) + "–" + String(allYears.at(-1)) : null,
  scenarioYearRange: scenarioYears.length ? String(scenarioYears[0]) + "–" + String(scenarioYears.at(-1)) : null,
  speiScenarioCount: observedScenarios.length,
  runtimeFailure,
});
