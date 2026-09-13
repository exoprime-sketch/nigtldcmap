#!/usr/bin/env node
/**
 * B-005 drought: does a reader get the delivered SPEI and CDD values, and only
 * those?
 *
 * The V134 form of this audit described the previous delivery, which published
 * B-005 as 503 observations under three pinned indicator ids
 * (B-005_spei12_historical / _ssp245 / _ssp585) and was drawn by a dedicated
 * SPEI component. The final delivery ships the same measurement as 31,688
 * province rows carrying scenario, year and measure in entity attributes, over
 * six scenarios and 1951-2100, and the screen reads it with the province
 * distribution renderer. Pinning the old ids made this audit fail on data that
 * is larger and more complete than what it was written for.
 *
 * So every expectation here is taken from the delivery itself: which measures
 * carry values, which scenarios those values exist for, and which years they
 * span. What stays fixed is what a reader must be able to do - see the SPEI
 * measure, read what it means, see each scenario the data holds - and what must
 * never appear: a value the source did not give, a qualitative band nobody
 * published, or an internal record key.
 */

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
const catalogElement = catalog.find((row) => row?.elementId === "B-005") || {};
const payloads = loadPackPayloads();
const b005 = payloads.elements.get("B-005") || {};
const observations = payloadRecords(b005.observations);
const entities = payloadRecords(b005.entities);
const publishedRows = observations.length + entities.length;
const declaredRows =
  Number(catalogElement.observationCount || 0) + Number(catalogElement.entityCount || 0);

/** Attribute names as the delivery prints them. */
const SPEI_KEY = "표준강수증발산지수_SPEI12";
const CDD_KEY = "연속_건조일수_CDD_일";
const SCENARIO_KEY = "시나리오";
const YEAR_KEY = "연도";
const REGION_KEY = "지역명_로마자";
const SCENARIO_LABELS = {
  historical: "과거 관측",
  ssp119: "SSP1-1.9",
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp370: "SSP3-7.0",
  ssp460: "SSP4-6.0",
  ssp585: "SSP5-8.5",
};

/** What the delivery actually holds for one measure column. */
function measureCoverage(key) {
  const scenarios = new Set();
  const years = new Set();
  const regions = new Set();
  let rows = 0;
  for (const entity of entities) {
    const attributes = entity?.normalizedAttributes || {};
    const value = attributes[key];
    if (value === null || value === undefined || value === "") continue;
    if (!Number.isFinite(Number(value))) continue;
    rows += 1;
    const scenario = String(attributes[SCENARIO_KEY] || "").toLowerCase();
    if (scenario) scenarios.add(scenario);
    const year = Number(attributes[YEAR_KEY]);
    if (Number.isFinite(year)) years.add(year);
    const region = String(attributes[REGION_KEY] || "").trim();
    if (region) regions.add(region);
  }
  const sortedYears = [...years].sort((left, right) => left - right);
  return {
    rows,
    scenarios: [...scenarios].sort((left, right) => left.localeCompare(right, "en")),
    firstYear: sortedYears[0] ?? null,
    lastYear: sortedYears.at(-1) ?? null,
    regionCount: regions.size,
  };
}

const spei = measureCoverage(SPEI_KEY);
const cdd = measureCoverage(CDD_KEY);
const speiScenarioLabels = spei.scenarios.map(
  (key) => SCENARIO_LABELS[key] || key
);
const speiProjectionScenarios = spei.scenarios.filter((key) => key !== "historical");

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check(
  "B005_SOURCE_PAYLOAD",
  payloads.errors.length === 0 && publishedRows > 0 && publishedRows === declaredRows,
  { errors: payloads.errors, rows: publishedRows },
  { errors: [], rows: declaredRows }
);
audit.check(
  "B005_SPEI_DELIVERED",
  spei.rows > 0 && spei.firstYear !== null && spei.lastYear !== null,
  { rows: spei.rows, years: [spei.firstYear, spei.lastYear] },
  { rows: "> 0", years: "stated by the delivery" }
);
audit.check(
  "B005_CDD_DELIVERED",
  cdd.rows > 0 && cdd.firstYear !== null && cdd.lastYear !== null,
  { rows: cdd.rows, years: [cdd.firstYear, cdd.lastYear] },
  { rows: "> 0", years: "stated by the delivery" }
);
audit.check(
  "B005_SCENARIO_COUNT",
  spei.scenarios.includes("historical") && speiProjectionScenarios.length >= 2,
  spei.scenarios,
  { historical: true, projections: ">= 2" }
);

const routerPath = resolve(
  PROJECT_ROOT,
  "src/components/data/public/PublicDataAnalysisRouterV126.tsx"
);
const summaryPath = resolve(
  PROJECT_ROOT,
  "src/components/data/public/PublicRegionScenarioSummaryV137.tsx"
);
const source = [routerPath, summaryPath]
  .filter(existsSync)
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
audit.check(
  "B005_SCENARIO_RENDERER",
  /PublicRegionScenarioSummaryV137/u.test(source) &&
    /region-scenario-summary-v137/u.test(source),
  "PublicRegionScenarioSummaryV137 wired",
  "wired"
);
audit.check(
  "B005_NO_DERIVED_NATIONAL_MEAN",
  /성·시 값을 평균한 전국값은 만들지 않고/u.test(source),
  true,
  true
);

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
    "Boolean(document.querySelector('[data-testid=\"region-scenario-summary-v137\"]'))",
    { timeoutMs: 30_000 }
  );
  // The SPEI series is the one this element is named for, so it is read as a
  // reader would: pick it, then read what the screen says.
  const selected = await evaluateValue(
    browser.cdp,
    `(() => {
      const card = document.querySelector('[data-testid="region-scenario-summary-v137"]');
      const select = card?.querySelector('select');
      const option = [...(select?.options || [])].find((node) => /SPEI/iu.test(node.textContent || ''));
      if (!select || !option) return false;
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`
  );
  if (!selected) throw new Error("SPEI measure option unavailable on B-005");
  await waitForValue(
    browser.cdp,
    "/SPEI/iu.test(document.querySelector('[data-testid=\"region-scenario-summary-v137\"] caption')?.textContent || '')",
    { timeoutMs: 10_000 }
  );
  snapshot = await evaluateValue(
    browser.cdp,
    `(() => {
      const card = document.querySelector('[data-testid="region-scenario-summary-v137"]');
      const text = String(document.querySelector('main')?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const caption = String(card?.querySelector('caption')?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const scenarioCells = [...(card?.querySelectorAll('tbody th[scope="row"]') || [])]
        .map((node) => String(node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim());
      const regionCounts = [...(card?.querySelectorAll('tbody tr') || [])]
        .map((row) => Number(String(row.lastElementChild?.textContent || '').replace(/[^0-9]/gu, '')))
        .filter((value) => Number.isFinite(value) && value > 0);
      return {
        mounted: Boolean(card),
        caption,
        scenarioLabels: [...new Set(scenarioCells)],
        regionCounts: [...new Set(regionCounts)],
        meaning: text.includes('강수') && text.includes('증발') && text.includes('건조') && text.includes('습윤'),
        emptyClaim: /관측값이 없습니다|표시할 값이 없습니다/u.test(text),
        zeroImputationCopy: text.includes('미공개') && /미공개[^\\n]*0/u.test(text),
        arbitraryQualitative: /다소\\s*(?:건조|습윤)|심각한\\s*가뭄/u.test(text),
        internalCodeVisible: /B-005_spei|recordId|indicatorId|sourceRow|sourceSheet|VNM\\.\\d+_\\d+/u.test(text),
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const shownScenarios = snapshot?.scenarioLabels || [];
const missingScenarioLabels = speiScenarioLabels.filter(
  (label) => !shownScenarios.includes(label)
);

audit.check(
  "B005_RUNTIME_MOUNT",
  runtimeFailure === null && snapshot?.mounted === true && snapshot?.emptyClaim === false,
  { runtimeFailure, mounted: snapshot?.mounted, emptyClaim: snapshot?.emptyClaim },
  { runtimeFailure: null, mounted: true, emptyClaim: false }
);
audit.check(
  "B005_SPEI_MEASURE_ON_SCREEN",
  /SPEI/iu.test(snapshot?.caption || "") &&
    String(snapshot?.caption || "").includes(String(spei.firstYear)) &&
    String(snapshot?.caption || "").includes(String(spei.lastYear)),
  snapshot?.caption,
  `SPEI with ${spei.firstYear}~${spei.lastYear}`
);
audit.check("B005_SPEI_MEANING_VISIBLE", snapshot?.meaning === true, snapshot?.meaning, true);
audit.check(
  "B005_SCENARIO_TREND",
  missingScenarioLabels.length === 0,
  { shown: shownScenarios, missing: missingScenarioLabels },
  { shown: speiScenarioLabels, missing: [] }
);
audit.check(
  "B005_REGION_DISTRIBUTION",
  (snapshot?.regionCounts || []).length > 0 &&
    (snapshot?.regionCounts || []).every((count) => count <= spei.regionCount),
  { shown: snapshot?.regionCounts, delivered: spei.regionCount },
  { shown: `<= ${spei.regionCount}`, delivered: spei.regionCount }
);
audit.check("B005_ZERO_IMPUTATION", snapshot?.zeroImputationCopy === false, snapshot?.zeroImputationCopy, false);
audit.check("B005_ARBITRARY_THRESHOLD", snapshot?.arbitraryQualitative === false, snapshot?.arbitraryQualitative, false);
audit.check("B005_INTERNAL_CODE_VISIBLE", snapshot?.internalCodeVisible === false, snapshot?.internalCodeVisible, false);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV134(audit, "drought-analysis-audit-v134.json", {
  speiYearRange:
    spei.firstYear === null ? null : `${spei.firstYear}–${spei.lastYear}`,
  cddYearRange: cdd.firstYear === null ? null : `${cdd.firstYear}–${cdd.lastYear}`,
  speiScenarioCount: spei.scenarios.length,
  speiScenarioLabels,
  speiRegionCount: spei.regionCount,
  publishedRows,
  runtimeFailure,
});
