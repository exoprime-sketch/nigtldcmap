#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  captureElementPng,
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { mapUrlV129 } from "./v129/audit-helpers.mjs";
import {
  PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131,
  V131_SCREENSHOT_ROOT,
  finishAuditV131,
  screenshotEvidenceV131,
  sourceTextV131,
  validScreenshotV131,
} from "./v131/audit-helpers.mjs";

const audit = new AuditV125("map-copy:v131");
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const layers = Array.isArray(mapResult.value?.layers)
  ? mapResult.value.layers.filter(
      (layer) => layer?.active !== false && layer?.enabled !== false
    )
  : [];
const mapFeatureOrScopeCount = layers.reduce(
  (sum, layer) => sum + Number(layer.featureCount || 0),
  0
);
const interactionResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/map-interaction-audit-v129.json")
);
const spatialSummaryResult = readJson(
  resolve(PROJECT_ROOT, "reports/v130/spatial-summary-v130.json")
);
const projectScopeResult = readJson(
  resolve(PROJECT_ROOT, "reports/v130/project-scope-audit-result-v130.json")
);
const dedupResult = readJson(
  resolve(PROJECT_ROOT, "reports/v130/map-dedup-audit-result-v130.json")
);
const mapSource = sourceTextV131([
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
]);
const SCREENSHOTS = [
  "map-point-tooltip.png",
  "map-regional-project.png",
  "map-selected-feature.png",
];
mkdirSync(V131_SCREENSHOT_ROOT, { recursive: true });

function checkFromReport(report, name) {
  return report?.checks?.find((check) => check?.name === name) || null;
}

const interactions =
  checkFromReport(interactionResult.value, "ALL_LAYER_TOOLTIP_AND_CLICK")?.actual
    ?.interactionResults || [];
const tooltipPlaceholders = interactions.filter((row) =>
  PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131.some((placeholder) =>
    String(row?.tooltipText || "")
      .normalize("NFC")
      .toLocaleLowerCase("en-US")
      .includes(placeholder.toLocaleLowerCase("en-US"))
  )
);
const v130ScopeSummary = projectScopeResult.value?.summary || {};
const v130DedupSummary = dedupResult.value?.summary || {};

audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);
audit.check("FINAL_MAP_LAYERS", layers.length === 12, layers.length, 12);
audit.check("FINAL_MAP_FEATURE_OR_SCOPE_COUNT", mapFeatureOrScopeCount === 2900, mapFeatureOrScopeCount, 2900);
audit.check(
  "MAP_TITLE_RESOLVER_WIRING",
  mapSource.includes("resolvePublicEntityTitleV131") &&
    mapSource.includes("resolvePublicMapEntityTitleV131") &&
    mapSource.includes("selectedEntityTitleResolutionV131") &&
    mapSource.includes("nameNote"),
  {
    resolver: mapSource.includes("resolvePublicEntityTitleV131"),
    mapResolver: mapSource.includes("resolvePublicMapEntityTitleV131"),
    selectedResolution: mapSource.includes("selectedEntityTitleResolutionV131"),
    nameNote: mapSource.includes("nameNote"),
  },
  {
    resolver: true,
    mapResolver: true,
    selectedResolution: true,
    nameNote: true,
  }
);
audit.check("MAP_TOOLTIP_PLACEHOLDER_TITLE_COUNT", tooltipPlaceholders.length === 0, tooltipPlaceholders.length, 0, tooltipPlaceholders);
audit.check(
  "MAP_ALL_LAYER_TOOLTIP_CLICK_BASELINE",
  interactionResult.value?.status === "PASS" && interactions.length === 12 && interactions.every((row) => row.tooltip && row.detail),
  {
    reportStatus: interactionResult.value?.status,
    checked: interactions.length,
    failures: interactions.filter((row) => !row.tooltip || !row.detail),
  },
  { reportStatus: "PASS", checked: 12, failures: [] }
);
audit.check(
  "V130_REGIONAL_SCOPE_REGRESSION",
  spatialSummaryResult.value?.mapSelectedElements === 12 &&
    spatialSummaryResult.value?.mapFeatureOrScopeCount === 2900 &&
    v130ScopeSummary.status === "PASS" &&
    v130ScopeSummary.greaterMekongDisplayMode === "regional-scope",
  {
    mapSelectedElements: spatialSummaryResult.value?.mapSelectedElements,
    mapFeatureOrScopeCount: spatialSummaryResult.value?.mapFeatureOrScopeCount,
    projectScope: v130ScopeSummary.status,
    greaterMekong: v130ScopeSummary.greaterMekongDisplayMode,
  },
  {
    mapSelectedElements: 12,
    mapFeatureOrScopeCount: 2900,
    projectScope: "PASS",
    greaterMekong: "regional-scope",
  }
);
audit.check(
  "D023_DUPLICATE_MAP_REPRESENTATION",
  v130DedupSummary.status === "PASS" &&
    Number(v130DedupSummary.duplicateVisibleCountAfter || 0) === 0 &&
    !layers.some((layer) => layer.elementId === "D-023"),
  {
    auditStatus: v130DedupSummary.status,
    visibleAfter: v130DedupSummary.duplicateVisibleCountAfter,
    d023Layer: layers.some((layer) => layer.elementId === "D-023"),
  },
  { auditStatus: "PASS", visibleAfter: 0, d023Layer: false }
);

function layerReadyExpression(elementId) {
  return `(() => {
    const root = document.querySelector('[data-testid="map-public-content"]');
    const loading = /\ubd88\ub7ec\uc624\ub294 \uc911/u.test(document.querySelector('.cdp-map-overlay-card')?.textContent || '');
    return root?.getAttribute('data-primary-element') === ${JSON.stringify(elementId)} && !loading;
  })()`;
}

async function activateLayer(cdp, elementId) {
  const activated = await evaluateValue(
    cdp,
    `(() => {
      const card = document.querySelector('.cdp-layer-card[data-map-element=${JSON.stringify(elementId)}]');
      const button = [...(card?.querySelectorAll('button') || [])].find((node) =>
        ['\ubd84\uc11d\ud558\uae30', '\ubd84\uc11d \uc911'].includes(node.textContent?.trim())
      );
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!activated) throw new Error(`${elementId} layer action unavailable`);
  await waitForValue(cdp, layerReadyExpression(elementId), { timeoutMs: 35_000 });
}

async function mapCanvasSurface(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const canvas = document.querySelector('.cdp-map-canvas.is-visible canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const blockers = [...document.querySelectorAll('.cdp-map-overlay-card, .cdp-map-legend, .maplibregl-control-container > div')].map((node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      });
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, blockers };
    })()`
  );
}

async function hoverPoint(cdp, expectedLayerTitle) {
  const surface = await mapCanvasSurface(cdp);
  if (!surface) throw new Error("map canvas unavailable");
  const centerX = surface.left + surface.width / 2;
  const centerY = surface.top + surface.height / 2;
  const positions = [];
  for (let y = surface.top + 8; y < surface.top + surface.height - 8; y += 16) {
    for (let x = surface.left + 8; x < surface.left + surface.width - 8; x += 16) {
      if (surface.blockers.some((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom)) continue;
      positions.push({ x, y, distance: Math.hypot(x - centerX, y - centerY) });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  for (const position of positions.slice(0, 1800)) {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: position.x,
      y: position.y,
      button: "none",
      buttons: 0,
    });
    const popup = await evaluateValue(
      cdp,
      `(() => {
        const node = document.querySelector('.cdp-map-public-popup');
        const title = node?.querySelector('strong')?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
        return { visible: Boolean(node && String(node.textContent || '').includes(${JSON.stringify(expectedLayerTitle)})), title };
      })()`
    );
    if (popup?.visible) return { ...position, title: popup.title };
  }
  throw new Error(`point hover unavailable: ${expectedLayerTitle}`);
}

async function clickAt(cdp, point) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: point.x,
    y: point.y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: point.x,
    y: point.y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

let server = null;
let browser = null;
let runtimeFailure = null;
let mapTooltipPlaceholderCount = 0;
let mapSelectedPlaceholderCount = 0;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-public-content"]'))`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    browser.cdp,
    `(() => {
      const cards = [...document.querySelectorAll('.cdp-layer-card[data-map-element]')];
      return cards.length === 12 && cards.every((card) =>
        [...card.querySelectorAll('button')].some((button) =>
          ['분석하기', '분석 중'].includes(button.textContent?.trim()) && !button.disabled
        )
      );
    })()`,
    { timeoutMs: 35_000 }
  );

  await activateLayer(browser.cdp, "C-025");
  const point = await hoverPoint(browser.cdp, "탄소크레딧 사업");
  const pointTooltipTitle = await evaluateValue(
    browser.cdp,
    `document.querySelector('.cdp-map-public-popup strong')?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || ''`
  );
  mapTooltipPlaceholderCount += PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131.filter(
    (placeholder) => String(pointTooltipTitle).toLocaleLowerCase("en-US") === placeholder.toLocaleLowerCase("en-US")
  ).length;
  await captureElementPng(
    browser.cdp,
    ".cdp-map-layout",
    resolve(V131_SCREENSHOT_ROOT, "map-point-tooltip.png")
  );
  await clickAt(browser.cdp, point);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-selected-feature-panel"] [data-testid="map-feature-detail"]'))`,
    { timeoutMs: 10_000 }
  );
  const selectedPointTitle = await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-selected-feature-panel"] h4')?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || ''`
  );
  mapSelectedPlaceholderCount += PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131.filter(
    (placeholder) => String(selectedPointTitle).toLocaleLowerCase("en-US") === placeholder.toLocaleLowerCase("en-US")
  ).length;
  await captureElementPng(
    browser.cdp,
    ".cdp-map-layout",
    resolve(V131_SCREENSHOT_ROOT, "map-selected-feature.png")
  );

  const presetClicked = await evaluateValue(
    browser.cdp,
    `(() => {
      const card = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id="CLIMATE_FINANCE_PROJECTS"]');
      if (!(card instanceof HTMLButtonElement)) return false;
      card.click();
      return true;
    })()`
  );
  if (!presetClicked) throw new Error("climate finance preset unavailable");
  await waitForValue(browser.cdp, layerReadyExpression("D-018"), { timeoutMs: 35_000 });
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-keyboard-feature-select"]'))`,
    { timeoutMs: 20_000 }
  );
  let found = false;
  for (let index = 0; index < 12; index += 1) {
    found = await evaluateValue(
      browser.cdp,
      `document.querySelector('[data-testid="map-keyboard-feature-select"]')?.textContent?.includes('Groundwater resources in the Greater Mekong') === true`
    );
    if (found) break;
    await evaluateValue(
      browser.cdp,
      `document.querySelector('[aria-label="다음 지도 항목"]')?.click()`
    );
  }
  if (!found) throw new Error("Greater Mekong regional scope unavailable");
  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-keyboard-feature-select"]')?.click()`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-regional-project-detail="true"]'))`,
    { timeoutMs: 10_000 }
  );
  const regionalTitle = await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-regional-project-detail="true"] h4')?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || ''`
  );
  mapSelectedPlaceholderCount += PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131.filter(
    (placeholder) => String(regionalTitle).toLocaleLowerCase("en-US") === placeholder.toLocaleLowerCase("en-US")
  ).length;
  await captureElementPng(
    browser.cdp,
    ".cdp-map-layout",
    resolve(V131_SCREENSHOT_ROOT, "map-regional-project.png")
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const screenshots = screenshotEvidenceV131(SCREENSHOTS);
const invalidScreenshots = screenshots.filter((item) => !validScreenshotV131(item));

audit.check("MAP_TOOLTIP_PLACEHOLDER_RUNTIME", runtimeFailure === null && mapTooltipPlaceholderCount === 0, mapTooltipPlaceholderCount, 0, { runtimeFailure });
audit.check("MAP_SELECTED_PANEL_PLACEHOLDER_TITLE_COUNT", runtimeFailure === null && mapSelectedPlaceholderCount === 0, mapSelectedPlaceholderCount, 0, { runtimeFailure });
audit.check("MAP_SCREENSHOTS", invalidScreenshots.length === 0, { screenshots, invalidScreenshots }, "three valid PNG screenshots");
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV131(audit, "map-copy-audit-v131.json", {
  finalMapLayerCount: layers.length,
  finalMapFeatureOrScopeCount: mapFeatureOrScopeCount,
  mapTooltipPlaceholderCount: mapTooltipPlaceholderCount + tooltipPlaceholders.length,
  mapSelectedPanelPlaceholderCount: mapSelectedPlaceholderCount,
  v130RegressionResult:
    v130ScopeSummary.status === "PASS" && v130DedupSummary.status === "PASS"
      ? "PASS"
      : "FAIL",
  runtimeFailure,
});
