#!/usr/bin/env node

import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, V2_ROOT, readJson } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import {
  activeLayersV133,
  containsForbiddenPublicMapTokenV133,
  finishAuditV133,
  mapUrlV133,
  normalizeTextV133,
  readSourceV133,
} from "./v133/audit-helpers.mjs";

const audit = new AuditV125("map-layer-distinction:v133");
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const layers = activeLayersV133(mapResult.value);
const source = readSourceV133([
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
  resolve(PROJECT_ROOT, "src/data/visualization/publicMapWorkspaceV126.ts"),
  resolve(PROJECT_ROOT, "src/styles/country-data-platform-v122.css"),
]);
const layerContractFailures = layers
  .filter((layer) => {
    const variables = Array.isArray(layer?.selectors?.variables) ? layer.selectors.variables : [];
    return (
      !normalizeTextV133(layer?.elementId) ||
      !normalizeTextV133(layer?.publicShortTitle || layer?.label) ||
      !normalizeTextV133(layer?.source) ||
      !normalizeTextV133(layer?.sourceYear || layer?.latestYear) ||
      !normalizeTextV133(layer?.legend?.title || layer?.legendTitle) ||
      variables.length === 0 ||
      variables.some(
        (item) =>
          !normalizeTextV133(item?.key) ||
          !normalizeTextV133(item?.label) ||
          !normalizeTextV133(item?.unit)
      )
    );
  })
  .map((layer) => layer?.elementId || "unknown");

async function selectPreset(cdp, presetId, expectedPrimary) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const button = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id=${JSON.stringify(presetId)}]');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`preset unavailable: ${presetId}`);
  await waitForValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      return root?.getAttribute('data-primary-element') === ${JSON.stringify(expectedPrimary)} &&
        root?.getAttribute('data-context-layer-count') === '0';
    })()`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('.cdp-map-fallback__svg [data-element-id=${JSON.stringify(expectedPrimary)}]'))`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    cdp,
    `(() => (document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-rendered-map-symbols') || '').split(',').some((item) => item.startsWith(${JSON.stringify(`${expectedPrimary}|`)})))()`,
    { timeoutMs: 35_000 }
  );
}

async function toggleContext(cdp, elementId) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const explicit = document.querySelector('[data-testid="map-context-toggle-v133"][data-map-element=${JSON.stringify(elementId)}]');
      const card = document.querySelector('.cdp-layer-card[data-map-element=${JSON.stringify(elementId)}]');
      const fallback = [...(card?.querySelectorAll('button') || [])].find((node) => /함께 보기|보조 표시/u.test(node.textContent || ''));
      const button = explicit || fallback;
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`context unavailable: ${elementId}`);
  await waitForValue(
    cdp,
    `(() => (document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements') || '').split(',').includes(${JSON.stringify(elementId)}))()`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('.cdp-map-fallback__svg [data-element-id=${JSON.stringify(elementId)}]'))`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    cdp,
    `(() => (document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-rendered-map-symbols') || '').split(',').some((item) => item.startsWith(${JSON.stringify(`${elementId}|`)})))()`,
    { timeoutMs: 35_000 }
  );
}

async function legendSnapshot(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const legendRoot = document.querySelector('[data-testid="map-compact-legend-v133"], [data-testid="map-active-layer-legend"]');
      const items = [...document.querySelectorAll('[data-testid="map-active-layer-legend-item"]')].map((node) => ({
        elementId: node.getAttribute('data-element-id') || '',
        role: node.getAttribute('data-layer-role') || '',
        shape: node.getAttribute('data-symbol-shape') || '',
        unit: node.getAttribute('data-unit') || '',
        text: (node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim(),
        hasToggle: Boolean(node.querySelector('button, input[type="checkbox"]')),
      }));
      const renderedByIdentity = new Map();
      for (const node of document.querySelectorAll('.cdp-map-fallback__svg [data-element-id][data-layer-role][data-symbol-shape]')) {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) <= 0) continue;
        const item = {
          elementId: node.getAttribute('data-element-id') || '',
          role: node.getAttribute('data-layer-role') || '',
          shape: node.getAttribute('data-symbol-shape') || '',
          interactiveSymbol: node.classList.contains('cdp-map-fallback__feature-control'),
        };
        renderedByIdentity.set([item.elementId, item.role, item.shape].join('|'), item);
      }
      return {
        primaryElement: root?.getAttribute('data-primary-element') || '',
        contextElements: root?.getAttribute('data-context-elements') || '',
        legendText: (legendRoot?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim(),
        hoverPopupText: ([...document.querySelectorAll('[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"]')]
          .map((node) => node.textContent || '')
          .join(' '))
          .normalize('NFC')
          .replace(/\\s+/gu, ' ')
          .trim(),
        items,
        rendered: [...renderedByIdentity.values()],
        renderedPointSymbols: [...renderedByIdentity.values()].filter((item) => item.interactiveSymbol),
        renderedMapSymbols: (root?.getAttribute('data-rendered-map-symbols') || '')
          .split(',')
          .filter((value) => value && value !== 'none')
          .map((value) => {
            const [elementId, role, shape] = value.split('|');
            return { elementId, role, shape };
          }),
      };
    })()`
  );
}

async function selectFinanceType(cdp, type) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const explicit = document.querySelector('[data-testid="map-finance-type-selector-v133"] [data-finance-type=${JSON.stringify(type)}]');
      const candidates = [...document.querySelectorAll('[data-testid="map-finance-type-selector-v133"] button, [data-testid="map-finance-type-selector-v133"] input')];
      const fallback = candidates.find((node) => (node.textContent || node.getAttribute('aria-label') || '').includes(${JSON.stringify(type === "carbon" ? "탄소크레딧" : "적응기금")}));
      const target = explicit || fallback;
      if (target instanceof HTMLInputElement) target.click();
      else if (target instanceof HTMLButtonElement) target.click();
      else return false;
      return true;
    })()`
  );
  if (!clicked) throw new Error(`finance type unavailable: ${type}`);
  await waitForValue(
    cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === ${JSON.stringify(type === "carbon" ? "C-025" : "D-018")}`,
    { timeoutMs: 35_000 }
  );
  const expectedElementId = type === "carbon" ? "C-025" : "D-018";
  await waitForValue(
    cdp,
    `(() => (document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-rendered-map-symbols') || '').split(',').some((item) => item.startsWith(${JSON.stringify(`${expectedElementId}|primary|`)})))()`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('.cdp-map-fallback__feature-control[data-element-id=${JSON.stringify(expectedElementId)}][data-symbol-shape]'))`,
    { timeoutMs: 35_000 }
  );
}

const climateStates = [];
let server = null;
let browser = null;
let runtimeFailure = null;
let climateSnapshot = null;
let financeAdaptation = null;
let financeCarbon = null;
let financeCompare = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV133(server.url));
  await waitForValue(browser.cdp, `document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 12`, {
    timeoutMs: 35_000,
  });

  await selectPreset(browser.cdp, "CLIMATE_VULNERABILITY", "B-021");
  for (const companionId of ["D-008", "D-018"]) {
    await toggleContext(browser.cdp, companionId);
    climateStates.push(await legendSnapshot(browser.cdp));
  }
  climateSnapshot = climateStates[climateStates.length - 1];

  await selectPreset(browser.cdp, "CLIMATE_FINANCE_PROJECTS", "D-018");
  financeAdaptation = await legendSnapshot(browser.cdp);
  financeAdaptation.summaryText = await evaluateValue(
    browser.cdp,
    `(() => (document.querySelector('[data-testid="map-finance-summary-v133"], [data-testid="map-finance-type-selector-v133"], [data-testid="map-national-summary"]')?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim())()`
  );

  await selectFinanceType(browser.cdp, "carbon");
  financeCarbon = await legendSnapshot(browser.cdp);
  const compareClicked = await evaluateValue(
    browser.cdp,
    `(() => {
      const explicit = document.querySelector('[data-testid="map-compare-open-v135"]');
      const fallback = [...document.querySelectorAll('button')].find((node) => /비교해서 보기/u.test(node.textContent || ''));
      const button = explicit || fallback;
      if (!(button instanceof HTMLElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!compareClicked) throw new Error("finance compare action unavailable");
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-comparison-workspace-v135"]'))`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    browser.cdp,
    `(() => {
      const pane = (side) => document.querySelector('[data-testid="map-compare-pane-' + side + '"]');
      return pane('a')?.getAttribute('data-map-ready') === 'true' &&
        pane('b')?.getAttribute('data-map-ready') === 'true';
    })()`,
    { timeoutMs: 45_000 }
  );
  financeCompare = await evaluateValue(
    browser.cdp,
    `(() => {
      const pane = (side) => {
        const node = document.querySelector('[data-testid="map-compare-pane-' + side + '"]');
        const swatch = node?.querySelector('[data-testid="map-comparison-legend-' + side + '"] i');
        return {
          elementId: node?.getAttribute('data-element-id') || '',
          ready: node?.getAttribute('data-map-ready') || '',
          legendText: String(node?.querySelector('[data-testid="map-comparison-legend-' + side + '"]')?.textContent || '')
            .normalize('NFC').replace(/\\s+/gu, ' ').trim(),
          color: swatch ? getComputedStyle(swatch).backgroundColor : '',
        };
      };
      return { a: pane('a'), b: pane('b') };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const climateById = new Map(
  climateStates.flatMap((state) => state?.items || []).map((item) => [item.elementId, item])
);
const climateLegendIdentities = new Set(
  (climateSnapshot?.items || []).map((item) => [item.elementId, item.role].join("|"))
);
const climateRenderedIdentities = climateSnapshot?.rendered || [];
const climateLiveIdentities = climateSnapshot?.renderedMapSymbols || [];
const renderedSymbolsWithoutLegend = climateRenderedIdentities.filter(
  (item) => !climateLegendIdentities.has([item.elementId, item.role].join("|"))
);
const incompleteLegendItems = (climateSnapshot?.items || []).filter(
  (item) => !item.text || !item.shape || !item.unit
);
const visibleSymbolWithoutLegend = renderedSymbolsWithoutLegend.length + incompleteLegendItems.length;
const liveSymbolsWithoutLegend = climateLiveIdentities.filter(
  (item) => !climateLegendIdentities.has([item.elementId, item.role].join("|"))
);
const legendWithoutLiveSymbol = (climateSnapshot?.items || []).filter(
  (item) =>
    !climateLiveIdentities.some(
      (rendered) =>
        rendered.elementId === item.elementId &&
        rendered.role === item.role &&
        rendered.shape === item.shape
    )
);
const climateShapesPass =
  climateById.get("B-021")?.role === "primary" &&
  ["area", "polygon"].includes(climateById.get("B-021")?.shape) &&
  climateById.get("D-008")?.role === "context" &&
  climateById.get("D-008")?.shape === "circle" &&
  climateById.get("D-018")?.role === "context" &&
  ["diamond", "regional-scope"].includes(climateById.get("D-018")?.shape);
const adaptationOnly =
  financeAdaptation?.primaryElement === "D-018" &&
  !financeAdaptation?.contextElements?.includes("C-025") &&
  financeAdaptation?.items?.length === 1 &&
  financeAdaptation.items[0]?.elementId === "D-018" &&
  financeAdaptation.items[0]?.role === "primary" &&
  financeAdaptation.items[0]?.shape === "diamond" &&
  !/GVI|지역 취약성|Quảng Bình/u.test(financeAdaptation?.hoverPopupText || "") &&
  financeAdaptation?.renderedMapSymbols?.some(
    (item) => item.elementId === "D-018" && item.role === "primary" && item.shape === "diamond"
  ) &&
  financeAdaptation?.renderedPointSymbols?.length === 1 &&
  financeAdaptation.renderedPointSymbols[0]?.elementId === "D-018" &&
  financeAdaptation.renderedPointSymbols[0]?.role === "primary" &&
  financeAdaptation.renderedPointSymbols[0]?.shape === "diamond";
const carbonOnly =
  financeCarbon?.primaryElement === "C-025" &&
  !financeCarbon?.contextElements?.includes("D-018") &&
  financeCarbon?.items?.length === 1 &&
  financeCarbon.items[0]?.elementId === "C-025" &&
  financeCarbon.items[0]?.role === "primary" &&
  financeCarbon.items[0]?.shape === "square" &&
  !/GVI|지역 취약성|Quảng Bình/u.test(financeCarbon?.hoverPopupText || "") &&
  financeCarbon?.renderedMapSymbols?.some(
    (item) => item.elementId === "C-025" && item.role === "primary" && item.shape === "square"
  ) &&
  financeCarbon?.renderedPointSymbols?.length === 1 &&
  financeCarbon.renderedPointSymbols[0]?.elementId === "C-025" &&
  financeCarbon.renderedPointSymbols[0]?.role === "primary" &&
  financeCarbon.renderedPointSymbols[0]?.shape === "square";
const comparePair = [financeCompare?.a?.elementId, financeCompare?.b?.elementId]
  .filter(Boolean)
  .sort()
  .join(",");
const comparePass =
  comparePair === "C-025,D-018" &&
  financeCompare?.a?.ready === "true" &&
  financeCompare?.b?.ready === "true" &&
  Boolean(financeCompare?.a?.color) &&
  Boolean(financeCompare?.b?.color) &&
  financeCompare.a.color !== financeCompare.b.color &&
  Boolean(financeCompare?.a?.legendText) &&
  Boolean(financeCompare?.b?.legendText) &&
  financeCompare.a.legendText !== financeCompare.b.legendText;
const financeSummaryPass = /사업 수/u.test(financeAdaptation?.summaryText || "") &&
  /금액/u.test(financeAdaptation?.summaryText || "") &&
  /위치|참여범위/u.test(financeAdaptation?.summaryText || "");

audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);
audit.check("MAP_LAYER_COUNT", layers.length === 12, layers.length, 12);
audit.check("MAP_LAYER_PUBLIC_CONTRACT", layerContractFailures.length === 0, layerContractFailures, []);
audit.check("D023_DUPLICATE_MAP_FEATURE", !layers.some((layer) => layer.elementId === "D-023"), layers.filter((layer) => layer.elementId === "D-023").length, 0);
audit.check(
  "CLIMATE_LAYER_VISUAL_DISTINCTION",
  climateSnapshot !== null && climateShapesPass,
  { runtimeFailure, climateSnapshot },
  { "B-021": "primary area", "D-008": "context circle", "D-018": "context diamond" }
);
audit.check(
  "VISIBLE_MAP_SYMBOL_WITHOUT_LEGEND",
  climateSnapshot !== null &&
    visibleSymbolWithoutLegend === 0 &&
    liveSymbolsWithoutLegend.length === 0 &&
    legendWithoutLiveSymbol.length === 0 &&
    climateSnapshot?.items?.length === 2 &&
    new Set(climateRenderedIdentities.map((item) => item.elementId)).size === 2,
  {
    runtimeFailure,
    visibleSymbolWithoutLegend,
    incompleteLegendItems,
    renderedSymbolsWithoutLegend,
    liveSymbolsWithoutLegend,
    legendWithoutLiveSymbol,
    items: climateSnapshot?.items || [],
    rendered: climateRenderedIdentities,
  },
  0
);
audit.check(
  "COMPACT_LEGEND_PUBLIC_COPY",
  /주 분석/u.test(climateSnapshot?.legendText || "") && /함께 보기/u.test(climateSnapshot?.legendText || "") &&
    containsForbiddenPublicMapTokenV133(climateSnapshot?.legendText || "").length === 0,
  { text: climateSnapshot?.legendText, tokens: containsForbiddenPublicMapTokenV133(climateSnapshot?.legendText || "") },
  "Korean primary/compare legend without developer tokens"
);
audit.check("FINANCE_ADAPTATION_ONLY_DEFAULT", adaptationOnly, financeAdaptation, "D-018 only");
audit.check("FINANCE_CARBON_ONLY_SELECTION", carbonOnly, financeCarbon, "C-025 only");
audit.check("FINANCE_COMPARE_DISTINCT_SYMBOLS", comparePass, financeCompare, "two comparison panes with distinct colours and legends");
audit.check("FINANCE_PORTFOLIO_SUMMARY", financeSummaryPass, financeAdaptation?.summaryText || "", "project count, amount, verified location/scope count");
audit.check(
  "FINANCE_TYPE_SELECTOR_CONTRACT",
  /map-finance-type-selector-v133/u.test(source) && /적응기금/u.test(source) && /탄소크레딧/u.test(source),
  {
    selector: /map-finance-type-selector-v133/u.test(source),
    adaptation: /적응기금/u.test(source),
    carbon: /탄소크레딧/u.test(source),
  },
  { selector: true, adaptation: true, carbon: true }
);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV133(audit, "map-layer-distinction-audit-v133.json", {
  mapLayerCount: layers.length,
  visibleMapSymbolWithoutLegend: visibleSymbolWithoutLegend,
  climateSnapshot,
  financeAdaptation,
  financeCarbon,
  financeCompare,
  runtimeFailure,
});
