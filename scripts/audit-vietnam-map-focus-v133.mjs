#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  MAP_FEATURE_FLOOR_V125,
  PROJECT_ROOT,
  V2_ROOT,
  mapFeatureCountIsSound,
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
import {
  activeLayersV133,
  finishAuditV133,
  mapFeatureOrScopeCountV133,
  mapUrlV133,
} from "./v133/audit-helpers.mjs";
import { mapTargetCountV138, toggleMapCompanionV138 } from "./v135/audit-helpers.mjs";

/**
 * V138 contract. A preset draws the combination its card names, so its
 * companions are on from the start; the reader's own selection is unbounded by
 * a companion limit; and still exactly one dataset colours the map, with every
 * other area dataset drawn as outline only.
 */
const EXPECTED_TARGETS = mapTargetCountV138();

const audit = new AuditV125("map-focus:v133");
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const layers = activeLayersV133(mapResult.value);
const featureOrScopeCount = mapFeatureOrScopeCountV133(layers);
const workspaceSource = readFileSync(
  resolve(PROJECT_ROOT, "src/data/visualization/publicMapWorkspaceV126.ts"),
  "utf8"
);
const mapSource = readFileSync(
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
  "utf8"
);
const presetIds = [
  "POWER_INFRASTRUCTURE",
  "RENEWABLE_PLANNING",
  "FOREST_CHANGE",
  "CLIMATE_VULNERABILITY",
  "CLIMATE_FINANCE_PROJECTS",
];

function presetReadyExpression(presetId) {
  return `(() => {
    const root = document.querySelector('[data-testid="map-public-content"]');
    const loading = document.querySelector('.cdp-map-overlay-card')?.textContent || '';
    const rendered = (root?.getAttribute('data-rendered-map-elements') || '').split(',').filter((id) => id && id !== 'none');
    const wanted = [root?.getAttribute('data-primary-element'), ...(root?.getAttribute('data-context-elements') || '').split(',')].filter((id) => id && id !== 'none');
    return root?.getAttribute('data-map-preset') === ${JSON.stringify(presetId)} &&
      root?.getAttribute('data-primary-layer-count') === '1' &&
      wanted.every((id) => rendered.includes(id)) &&
      !/불러오는 중/u.test(loading);
  })()`;
}

/** The companions each preset card names, read from the workspace source. */
function presetCompanionsFromSource(presetId) {
  const block = workspaceSource.slice(workspaceSource.indexOf(`id: "${presetId}"`));
  const start = block.indexOf("context: [");
  const contextBlock = block.slice(start, block.indexOf("],", start));
  return [...contextBlock.matchAll(/elementId:\s*"([A-E]-\d{3})"/gu)].map((match) => match[1]);
}

async function selectPreset(cdp, presetId) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const button = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id=${JSON.stringify(presetId)}]');
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`preset action unavailable: ${presetId}`);
  await waitForValue(cdp, presetReadyExpression(presetId), { timeoutMs: 35_000 });
  return evaluateValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const legend = [...document.querySelectorAll('[data-testid="map-active-layer-legend-item"]')].map((node) => ({
        elementId: node.getAttribute('data-element-id') || '',
        role: node.getAttribute('data-layer-role') || '',
        shape: node.getAttribute('data-symbol-shape') || '',
        text: (node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim(),
      }));
      return {
        presetId: root?.getAttribute('data-map-preset') || '',
        primaryCount: Number(root?.getAttribute('data-primary-layer-count') || 0),
        contextCount: Number(root?.getAttribute('data-context-layer-count') || 0),
        primaryElement: root?.getAttribute('data-primary-element') || '',
        contextElements: root?.getAttribute('data-context-elements') || '',
        legend,
      };
    })()`
  );
}

async function toggleContext(cdp, elementId) {
  const isContext = await evaluateValue(
    cdp,
    `(document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements') || '').split(',').includes(${JSON.stringify(elementId)})`
  );
  if (!isContext) {
    await toggleMapCompanionV138(cdp, { elementId, evaluateValue, waitForValue });
  }
  await waitForValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      return (root?.getAttribute('data-context-elements') || '').split(',').includes(${JSON.stringify(elementId)}) &&
        (root?.getAttribute('data-rendered-map-elements') || '').split(',').includes(${JSON.stringify(elementId)});
    })()`,
    { timeoutMs: 35_000 }
  );
}

const legendShapesExpressionV135 = `(() => {
  const root = document.querySelector('[data-testid="map-public-content"]');
  const items = [...document.querySelectorAll('[data-testid="map-active-layer-legend-item"]')].map((node) => ({
    elementId: node.getAttribute('data-element-id') || '',
    role: node.getAttribute('data-layer-role') || '',
    shape: node.getAttribute('data-symbol-shape') || '',
  }));
  return {
    contextCount: Number(root?.getAttribute('data-context-layer-count') || 0),
    items,
  };
})()`;

let server = null;
let browser = null;
let runtimeFailure = null;
const presetSnapshots = [];
const companionShapeSnapshots = [];
const responsiveChecks = [];
let distinctionSnapshot = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV133(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-available="true"]').length === ${layers.length}`,
    { timeoutMs: 35_000 }
  );

  for (const presetId of presetIds) {
    presetSnapshots.push(await selectPreset(browser.cdp, presetId));
  }

  await selectPreset(browser.cdp, "CLIMATE_VULNERABILITY");
  for (const companionId of ["D-008", "D-018"]) {
    await toggleContext(browser.cdp, companionId);
    companionShapeSnapshots.push(
      await evaluateValue(browser.cdp, legendShapesExpressionV135)
    );
  }
  distinctionSnapshot = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const items = [...document.querySelectorAll('[data-testid="map-active-layer-legend-item"]')].map((node) => ({
        elementId: node.getAttribute('data-element-id') || '',
        role: node.getAttribute('data-layer-role') || '',
        shape: node.getAttribute('data-symbol-shape') || '',
        text: (node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim(),
      }));
      const rendered = [...document.querySelectorAll('.cdp-map-fallback [data-layer-role][data-symbol-shape]')]
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
        })
        .map((node) => ({
          elementId: node.getAttribute('data-element-id') || node.getAttribute('data-map-element') || '',
          role: node.getAttribute('data-layer-role') || '',
          shape: node.getAttribute('data-symbol-shape') || '',
          fill: getComputedStyle(node).fill || '',
          fillOpacity: Number(getComputedStyle(node).fillOpacity || 1),
          label: node.getAttribute('aria-label') || '',
        }));
      return {
        primaryCount: Number(root?.getAttribute('data-primary-layer-count') || 0),
        contextCount: Number(root?.getAttribute('data-context-layer-count') || 0),
        items,
        rendered,
      };
    })()`
  );

  for (const width of [390, 768, 1024, 1440, 1920]) {
    await setViewport(browser.cdp, width, width < 800 ? 900 : 1050);
    await new Promise((resolveWait) => setTimeout(resolveWait, 120));
    responsiveChecks.push(
      await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="map-public-content"]');
          const canvas = document.querySelector('.cdp-map-canvas-wrap');
          return {
            width: window.innerWidth,
            horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            rootExists: Boolean(root),
            canvasWidth: Math.round(canvas?.getBoundingClientRect().width || 0),
          };
        })()`
      )
    );
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

// A preset must draw what its card names: the primary and every companion
// that has a layer. Nothing more (no stray dataset) and nothing less.
const defaultContextFailures = presetSnapshots.filter((snapshot) => {
  const expected = presetCompanionsFromSource(snapshot.presetId).filter((id) =>
    layers.some((layer) => layer.elementId === id)
  );
  const actual = (snapshot.contextElements || "").split(",").filter((id) => id && id !== "none");
  return (
    snapshot.primaryCount !== 1 ||
    expected.length !== actual.length ||
    !expected.every((id) => actual.includes(id))
  );
});
const contextShapes = new Map(
  [
    ...companionShapeSnapshots.flatMap((snapshot) => snapshot?.items || []),
    ...(distinctionSnapshot?.items || []),
  ]
    .filter((item) => item.role === "context")
    .map((item) => [item.elementId, item.shape])
);
const polygonFillContextCount = [...contextShapes.values()].filter(
  (shape) => shape === "area" || shape === "polygon"
).length;
const renderedPolygonFillContextCount = new Set(
  (distinctionSnapshot?.rendered || [])
    .filter(
      (item) =>
        item.role === "context" &&
        (item.shape === "area" || item.shape === "polygon") &&
        item.fill !== "none" &&
        item.fill !== "transparent" &&
        item.fillOpacity > 0
    )
    .map((item) => item.elementId || `${item.role}:${item.shape}:${item.label}`)
).size;

audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);
audit.check(
  "MAP_LAYERS",
  layers.length === mapResult.value?.activeMapLayerCount && layers.length >= 12 && layers.length <= EXPECTED_TARGETS,
  { active: layers.length, declared: mapResult.value?.activeMapLayerCount ?? null, targets: EXPECTED_TARGETS },
  `declared count, between 12 and ${EXPECTED_TARGETS}`
);
// The exact feature count is a property of the delivery, not of the platform:
// publishing every authorised carbon-credit project took C-025 from 18 features
// to 262. What is asserted is that the index declares what its layers hold and
// that the total has not collapsed.
audit.check(
  "MAP_FEATURE_OR_SCOPE_COUNT",
  mapFeatureCountIsSound(mapResult.value?.mapFeatureCount, featureOrScopeCount),
  { declared: mapResult.value?.mapFeatureCount ?? null, actual: featureOrScopeCount },
  { declared: "equal to actual", actual: `>= ${MAP_FEATURE_FLOOR_V125}` }
);
audit.check(
  "PRESET_COUNT",
  presetSnapshots.length === 5 && new Set(presetSnapshots.map((item) => item.presetId)).size === 5,
  presetSnapshots.map((item) => item.presetId),
  presetIds
);
audit.check(
  "PRESET_DRAWS_NAMED_COMBINATION",
  runtimeFailure === null && defaultContextFailures.length === 0,
  { runtimeFailure, failures: defaultContextFailures },
  { runtimeFailure: null, failures: [] }
);
audit.check(
  "DEFAULT_CONTEXT_STATE_CONTRACT",
  /createPublicMapWorkspaceStateV126[\s\S]*?context\s*:\s*\[\s*\]/u.test(workspaceSource),
  /createPublicMapWorkspaceStateV126[\s\S]*?context\s*:\s*\[\s*\]/u.test(workspaceSource),
  true
);
audit.check(
  "PRIMARY_LAYER_MAX",
  /primaryLayers\s*:\s*1/u.test(workspaceSource) && presetSnapshots.every((item) => item.primaryCount <= 1),
  Math.max(0, ...presetSnapshots.map((item) => item.primaryCount)),
  1
);
// V138: the reader's selection is not trimmed to one companion. After the
// preset's own companions and both explicit toggles, every ticked dataset is
// still there.
const companionLimit = Number((workspaceSource.match(/contextLayers\s*:\s*(\d+)/u) || [])[1] || 0);
audit.check(
  "CONTEXT_SELECTION_KEPT",
  companionLimit >= EXPECTED_TARGETS - 1 &&
    Number(distinctionSnapshot?.contextCount || 0) >= 2 &&
    (distinctionSnapshot?.items || []).filter((item) => item.role === "context").length === Number(distinctionSnapshot?.contextCount || 0),
  { companionLimit, contextCount: distinctionSnapshot?.contextCount ?? null },
  { companionLimit: `>= ${EXPECTED_TARGETS - 1}`, contextCount: ">= 2, all in legend" }
);
audit.check(
  "SIMULTANEOUS_POLYGON_FILL_CONTEXT_COUNT",
  runtimeFailure === null && polygonFillContextCount === 0 && renderedPolygonFillContextCount === 0,
  {
    runtimeFailure,
    polygonFillContextCount,
    renderedPolygonFillContextCount,
    contextShapes: Object.fromEntries(contextShapes),
    rendered: distinctionSnapshot?.rendered || [],
  },
  { runtimeFailure: null, polygonFillContextCount: 0, renderedPolygonFillContextCount: 0 }
);
audit.check(
  "CLIMATE_CONTEXT_VISUAL_DISTINCTION",
  contextShapes.get("D-008") === "circle" && ["diamond", "regional-scope"].includes(contextShapes.get("D-018")),
  Object.fromEntries(contextShapes),
  { "D-008": "circle", "D-018": "diamond or regional-scope" }
);
audit.check(
  "RESPONSIVE_VIEWPORTS",
  responsiveChecks.length === 5 && responsiveChecks.every((item) => item.rootExists && item.canvasWidth > 0 && item.horizontalOverflow <= 2),
  responsiveChecks,
  "390/768/1024/1440/1920 with map canvas and no horizontal overflow"
);
audit.check(
  "MAP_FOCUS_PUBLIC_COPY",
  mapSource.includes("선택 데이터") && mapSource.includes("함께 보기") && mapSource.includes("표시 설정"),
  {
    primary: mapSource.includes("선택 데이터"),
    compare: mapSource.includes("함께 보기"),
    settings: mapSource.includes("표시 설정"),
  },
  { primary: true, compare: true, settings: true }
);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV133(audit, "map-focus-audit-v133.json", {
  mapLayerCount: layers.length,
  mapFeatureOrScopeCount: featureOrScopeCount,
  presetCombinationFailures: defaultContextFailures.length,
  primaryLayerMax: 1,
  companionLimit,
  simultaneousPolygonFillContextCount: polygonFillContextCount,
  renderedPolygonFillContextCount,
  presetSnapshots,
  distinctionSnapshot,
  responsiveChecks,
  runtimeFailure,
});
