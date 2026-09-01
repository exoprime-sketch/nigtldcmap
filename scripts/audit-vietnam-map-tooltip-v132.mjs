#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
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
import { mapUrlV129 } from "./v129/audit-helpers.mjs";
import { finishAuditV132 } from "./v132/audit-helpers.mjs";

const audit = new AuditV125("map-tooltip:v132");
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const layers = Array.isArray(mapResult.value?.layers)
  ? mapResult.value.layers.filter((layer) => layer?.active !== false && layer?.enabled !== false)
  : [];
const mapFeatureOrScopeCount = layers.reduce(
  (sum, layer) => sum + Number(layer.featureCount || 0),
  0
);
const mapSource = readFileSync(resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"), "utf8");
const mapCopyResult = readJson(resolve(PROJECT_ROOT, "reports/v131/map-copy-audit-v131.json"));
const mapCopySummary = mapCopyResult.value?.summary || {};
const a023DownloadResult = readJson(
  resolve(V2_ROOT, "downloads/a-023.json")
);
const a023Entities = Array.isArray(a023DownloadResult.value?.entities)
  ? a023DownloadResult.value.entities
  : [];

function layerReadyExpression(elementId) {
  return `(() => {
    const root = document.querySelector('[data-testid="map-public-content"]');
    const overlay = document.querySelector('.cdp-map-overlay-card');
    return root?.getAttribute('data-primary-element') === ${JSON.stringify(elementId)} && !/불러오는 중/u.test(overlay?.textContent || '');
  })()`;
}

async function activateLayer(cdp, elementId) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const card = document.querySelector('.cdp-layer-card[data-map-element=${JSON.stringify(elementId)}]');
      const button = [...(card?.querySelectorAll('button') || [])].find((node) => ['분석하기', '분석 중'].includes(node.textContent?.trim()));
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`${elementId} layer action unavailable`);
  await waitForValue(cdp, layerReadyExpression(elementId), { timeoutMs: 35_000 });
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-keyboard-feature-select"]'))`,
    { timeoutMs: 25_000 }
  );
}

let server = null;
let browser = null;
let runtimeFailure = null;
let a023Result = null;
let b033Result = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 12`,
    { timeoutMs: 35_000 }
  );

  await activateLayer(browser.cdp, "A-023");
  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-keyboard-feature-select"]')?.click()`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="a023-map-selected-key-facts-v132"]'))`,
    { timeoutMs: 10_000 }
  );
  a023Result = await evaluateValue(
    browser.cdp,
    `(() => {
      const detail = document.querySelector('[data-testid="map-feature-detail"]');
      const facts = document.querySelector('[data-testid="a023-map-selected-key-facts-v132"]');
      const title = detail?.querySelector('h4')?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
      const text = facts?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
      return {
        title,
        text,
        meaningfulTitle: Boolean(title) && !/^(?:발전소|\\(미표기\\)|미표기|명칭 미기재)$/u.test(title),
        fuel: /발전원/u.test(text),
        capacity: /용량/u.test(text),
        status: /상태/u.test(text),
        year: /자료연도/u.test(text),
      };
    })()`
  );

  await activateLayer(browser.cdp, "B-033");
  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-keyboard-feature-select"]')?.click()`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="b033-map-region-trend-v132"]'))`,
    { timeoutMs: 10_000 }
  );
  b033Result = await evaluateValue(
    browser.cdp,
    `(() => {
      const node = document.querySelector('[data-testid="b033-map-region-trend-v132"]');
      return {
        region: node?.getAttribute('data-region-name') || '',
        count: Number(node?.getAttribute('data-region-record-count') || 0),
        unit: node?.getAttribute('data-region-unit') || '',
        chart: Boolean(node?.querySelector('[data-chart-interaction-v127="true"]')),
        tableRows: node?.querySelectorAll('tbody tr').length || 0,
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const selectedA023SourceRecord = a023Entities.find(
  (entity) =>
    String(entity?.name || "").normalize("NFC").trim() ===
    String(a023Result?.title || "").normalize("NFC").trim()
);
const selectedA023StatusAvailable = Boolean(
  selectedA023SourceRecord?.normalizedAttributes?.status
);
const a023KeyFactsComplete = Boolean(
  a023Result?.fuel &&
  a023Result?.capacity &&
  a023Result?.year &&
  (!selectedA023StatusAvailable || a023Result?.status)
);

audit.check("FINAL_MAP_LAYERS", layers.length === 12, layers.length, 12);
audit.check("FINAL_MAP_FEATURE_OR_SCOPE_COUNT", mapFeatureOrScopeCount === 2900, mapFeatureOrScopeCount, 2900);
audit.check(
  "V130_MAP_REGRESSION",
  Number(mapCopySummary.finalMapLayerCount || 0) === 12 &&
    Number(mapCopySummary.finalMapFeatureOrScopeCount || 0) === 2900 &&
    mapCopySummary.v130RegressionResult === "PASS",
  mapCopySummary,
  { finalMapLayerCount: 12, finalMapFeatureOrScopeCount: 2900, v130RegressionResult: "PASS" }
);
audit.check(
  "A023_TOOLTIP_PUBLIC_TITLE_RESOLVER",
  mapSource.includes("resolvePublicMapEntityTitleV131") &&
    mapSource.includes('testId: "a023-map-tooltip-v132"') &&
    mapSource.includes("publicPowerPlantFactsV132"),
  {
    resolver: mapSource.includes("resolvePublicMapEntityTitleV131"),
    tooltipHook: mapSource.includes('testId: "a023-map-tooltip-v132"'),
    facts: mapSource.includes("publicPowerPlantFactsV132"),
  },
  { resolver: true, tooltipHook: true, facts: true }
);
audit.check(
  "MAP_PLACEHOLDER_PRIMARY_TITLE",
  runtimeFailure === null && a023Result?.meaningfulTitle === true,
  { runtimeFailure, a023Result },
  { runtimeFailure: null, meaningfulTitle: true }
);
audit.check(
  "MAP_TOOLTIP_MISSING_KEY_FACTS",
  a023KeyFactsComplete,
  { ...a023Result, sourceStatusAvailable: selectedA023StatusAvailable },
  { fuel: true, capacity: true, status: "when source provides it", year: true }
);
audit.check(
  "B033_MAP_REGION_TREND",
  runtimeFailure === null &&
    Boolean(b033Result?.region) &&
    Number(b033Result?.count || 0) === 25 &&
    Boolean(b033Result?.unit) &&
    b033Result?.chart === true &&
    Number(b033Result?.tableRows || 0) === 25,
  { runtimeFailure, b033Result },
  { region: "named ADM1", count: 25, unit: "source unit", chart: true, tableRows: 25 }
);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV132(audit, "map-tooltip-audit-v132.json", {
  mapLayerCount: layers.length,
  mapFeatureOrScopeCount,
  mapPlaceholderPrimaryTitleCount: a023Result?.meaningfulTitle === true ? 0 : 1,
  mapTooltipMissingKeyFactsCount:
    a023KeyFactsComplete ? 0 : 1,
  a023TooltipResult: a023Result?.meaningfulTitle ? "PASS" : "FAIL",
  b033MapTrendResult: b033Result?.chart && b033Result?.count === 25 ? "PASS" : "FAIL",
  v130RegressionResult: mapCopySummary.v130RegressionResult || "FAIL",
  runtimeFailure,
});
