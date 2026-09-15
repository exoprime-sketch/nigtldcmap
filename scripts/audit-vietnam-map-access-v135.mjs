#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import {
  MINE_TOOLTIP_CONTENT_PATTERN_SOURCE_V135,
  activateMapDatasetV135,
  finishAuditV135,
  hoverMapFeatureForTooltipV135,
  mapUrlV135,
  normalizeTextV135,
  mapIndexV138,
  toggleMapCompanionV138,
} from "./v135/audit-helpers.mjs";

const audit = new AuditV125("map-access:v135");
// Every active layer the index publishes has to be reachable from the list.
const expectedLayers = mapIndexV138()
  .layers.filter((layer) => layer.active !== false && layer.enabled !== false)
  .map((layer) => layer.elementId);
const mapSource = readFileSync(resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"), "utf8");
const panelSource = readFileSync(resolve(PROJECT_ROOT, "src/hooks/useResizableMapPanelsV129.ts"), "utf8");

function layoutExpression() {
  return `(() => {
    const left = document.querySelector('[data-testid="map-layer-panel"]')?.getBoundingClientRect();
    const map = document.querySelector('.cdp-map-canvas-wrap')?.getBoundingClientRect();
    const separator = document.querySelector('[data-testid="map-left-panel-separator"]')?.getBoundingClientRect();
    const root = document.querySelector('[data-testid="map-public-content"]');
    return {
      left: left ? { width: left.width, left: left.left, right: left.right } : null,
      map: map ? { width: map.width, left: map.left, right: map.right } : null,
      separator: separator ? { width: separator.width, left: separator.left, top: separator.top, height: separator.height } : null,
      stored: Object.entries(localStorage).filter(([key]) => /map|panel|width/iu.test(key)),
      contextCount: Number(root?.getAttribute('data-context-layer-count') || 0),
      primary: root?.getAttribute('data-primary-element') || '',
    };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
let inventory = null;
let resize = null;
let contextMaximumObserved = 0;
let tooltipText = "";
let mineTooltipDiagnostics = null;
let mineActivationDiagnostics = null;
let contextActivationDiagnostics = null;
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before map access audit");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1920, 1100);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-available="true"]').length === ${expectedLayers.length}`,
    { timeoutMs: 35_000 }
  );
  inventory = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-all-data-v135"]');
      // V138: each dataset is a checkbox with a label; a disabled box is a
      // target without a layer and is not counted as an accessible layer.
      const layers = [...document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-available="true"]')].map((node) => {
        const input = node.querySelector('[data-testid="map-all-data-layer-v135"]');
        return {
          elementId: node.getAttribute('data-map-element') || '',
          text: String(node.querySelector('.cdp-map-catalog-v138__label')?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim(),
          interactive: input instanceof HTMLInputElement && !input.disabled && Boolean(input.labels?.length),
        };
      });
      const groups = [...(root?.querySelectorAll('[data-map-group-v135], h3') || [])]
        .map((node) => String(node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim())
        .filter(Boolean);
      return {
        present: Boolean(root),
        layers,
        groups,
        presetCount: document.querySelectorAll('[data-testid="map-analysis-preset"]').length,
        countryActionCount: [...document.querySelectorAll('a, button')]
          .filter((node) => /국가정보\\s*보기/u.test(String(node.textContent || ''))).length,
      };
    })()`
  );

  await evaluateValue(browser.cdp, `localStorage.clear(); true`);
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-left-panel-separator"]'))`, { timeoutMs: 20_000 });
  const before = await evaluateValue(browser.cdp, layoutExpression());
  const center = before?.separator ? {
    x: before.separator.left + before.separator.width / 2,
    y: before.separator.top + Math.min(100, before.separator.height / 2),
  } : null;
  if (!center) throw new Error("left panel separator unavailable");
  await browser.cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: center.x, y: center.y, button: "left", buttons: 1, clickCount: 1 });
  await browser.cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: center.x + 145, y: center.y, button: "left", buttons: 1 });
  await browser.cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: center.x + 145, y: center.y, button: "left", buttons: 0, clickCount: 1 });
  await new Promise((resolveWait) => setTimeout(resolveWait, 180));
  const after = await evaluateValue(browser.cdp, layoutExpression());
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-left-panel-separator"]'))`, { timeoutMs: 20_000 });
  const restored = await evaluateValue(browser.cdp, layoutExpression());
  resize = { before, after, restored };

  contextActivationDiagnostics = await activateMapDatasetV135(browser.cdp, {
    elementId: "A-023",
    evaluateValue,
    waitForValue,
    timeoutMs: 35_000,
  });
  if (!contextActivationDiagnostics.failure) {
    // V138: two more datasets ticked beside the power plants must both stay.
    for (const elementId of ["B-031", "C-016"]) {
      await toggleMapCompanionV138(browser.cdp, { elementId, evaluateValue, waitForValue });
      const count = await evaluateValue(browser.cdp, `Number(document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-layer-count') || 0)`);
      contextMaximumObserved = Math.max(contextMaximumObserved, Number(count || 0));
    }
  }

  mineActivationDiagnostics = await activateMapDatasetV135(browser.cdp, {
    elementId: "B-048",
    evaluateValue,
    waitForValue,
    timeoutMs: 35_000,
    requireFeatureControls: true,
  });
  if (!mineActivationDiagnostics.failure) {
    mineTooltipDiagnostics = await hoverMapFeatureForTooltipV135(browser.cdp, {
      elementId: "B-048",
      contentPattern: MINE_TOOLTIP_CONTENT_PATTERN_SOURCE_V135,
      evaluateValue,
      waitForValue,
      timeoutMs: 15_000,
    });
    tooltipText = normalizeTextV135(mineTooltipDiagnostics.tooltipText);
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const actualLayerIds = inventory?.layers?.map((row) => row.elementId).filter(Boolean) || [];
const missingLayers = expectedLayers.filter((elementId) => !actualLayerIds.includes(elementId));
const nonInteractive = inventory?.layers?.filter((row) => !row.interactive) || [];
const resizePass = Boolean(
  resize?.before?.left?.width >= 260 &&
  resize?.after?.left?.width >= 420 &&
  resize?.after?.left?.width > resize?.before?.left?.width + 80 &&
  resize?.after?.map?.width < resize?.before?.map?.width - 70 &&
  Math.abs(resize?.restored?.left?.width - resize?.after?.left?.width) <= 3 &&
  resize?.before?.separator?.width >= 10
);
const staticResizeContract = /map\.resize\(\)/u.test(`${mapSource}\n${panelSource}`) && /localStorage/u.test(panelSource) && /setPointerCapture/u.test(panelSource);
const tooltipUiLabels = tooltipText.match(/주\s*분석\s*데이터|함께\s*보기|보조\s*데이터/gu) || [];

audit.check("MAP_LAYER_COUNT", actualLayerIds.length === expectedLayers.length && expectedLayers.length >= 12, actualLayerIds.length, expectedLayers.length);
audit.check("ALL_MAP_LAYER_ACCESS_COUNT", missingLayers.length === 0 && nonInteractive.length === 0, { actualLayerIds, missingLayers, nonInteractive }, { count: expectedLayers.length, missingLayers: [], nonInteractive: [] });
audit.check("MAP_PRESET_COUNT", inventory?.presetCount === 5, inventory?.presetCount ?? 0, 5);
audit.check("MAP_ALL_DATA_GROUP_COUNT", (inventory?.groups?.length || 0) >= 5, inventory?.groups || [], ">=5");
audit.check("LEFT_PANEL_POINTER_RESIZE_PASS", resizePass, resize, "left >=420px, map width changed, persisted");
audit.check("MAP_RESIZE_CALL_CONTRACT", staticResizeContract, { staticResizeContract }, true);
audit.check("MULTI_SELECT_KEEPS_COMPANIONS", contextMaximumObserved >= 2, contextMaximumObserved, ">= 2 companions kept");
audit.check("MAP_COUNTRY_INFO_BUTTON_COUNT", inventory?.countryActionCount === 0, inventory?.countryActionCount ?? null, 0);
audit.check("MAP_TOOLTIP_UI_STATE_LABEL_COUNT", tooltipUiLabels.length === 0, tooltipUiLabels, []);
audit.check(
  "MAP_MINE_ACTIVATION",
  mineActivationDiagnostics !== null &&
    mineActivationDiagnostics.failure === null &&
    mineActivationDiagnostics.controlFound === true &&
    mineActivationDiagnostics.clickDispatched === true &&
    mineActivationDiagnostics.primaryAfter === "B-048" &&
    String(mineActivationDiagnostics.renderedMapSymbols || "")
      .split(",")
      .some((entry) => entry.startsWith("B-048|primary|")),
  mineActivationDiagnostics,
  {
    controlFound: true,
    clickDispatched: true,
    primaryAfter: "B-048",
    renderedMapSymbols: "B-048|primary|…",
  }
);
audit.check(
  "MAP_MINE_TOOLTIP",
  Boolean(tooltipText) &&
    /광산|광종|석탄|금|구리|보크사이트|철/u.test(tooltipText) &&
    Boolean(mineTooltipDiagnostics?.targetName) &&
    tooltipText.includes(mineTooltipDiagnostics.targetName),
  { tooltipText, diagnostics: mineTooltipDiagnostics },
  "meaningful mine tooltip"
);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV135(audit, "map-access-audit-v135.json", {
  mapLayerCount: actualLayerIds.length,
  allMapLayerAccessCount: actualLayerIds.length - missingLayers.length,
  mapPresetCount: inventory?.presetCount || 0,
  leftPanelPointerResizePass: resizePass,
  companionsObserved: contextMaximumObserved,
  mapTooltipUiStateLabelCount: tooltipUiLabels.length,
  mineActivationDiagnostics,
  contextActivationDiagnostics,
  mineTooltipDiagnostics,
  runtimeFailure,
});
