#!/usr/bin/env node

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

const audit = new AuditV125("map-public-content:v126");
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const layers = Array.isArray(mapResult.value?.layers) ? mapResult.value.layers : [];
const activeLayers = layers.filter(
  (layer) => layer?.active !== false && layer?.enabled !== false
);

audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);
audit.check("MAP_LAYER_TARGET_COUNT", activeLayers.length === 13, activeLayers.length, 13);

const PUBLIC_MAP_DOM_FORBIDDEN = [
  ".xlsx",
  "sourceSheet",
  "source-sheet",
  "source_sheet",
  "sourceRow",
  "source-row",
  "source_row",
  "recordId",
  "record-id",
  "record_id",
  "indicatorId",
  "indicator-id",
  "indicator_id",
  "apiParams",
  "api-params",
  "api_params",
  "MultiLineString",
  "geometry",
  "MapLibre",
  "renderer",
  "sourceId",
  "source-id",
  "source_id",
  "source ID",
  "소스 ID",
  "layerId",
  "layer-id",
  "layer_id",
  "layer ID",
  "레이어 ID",
];
const MISLEADING_UNSERVED_COPY = [
  "미공급지역",
  "미공급 지역",
  "전력망 및 미공급지역",
  "전력망[위치, 미공급 지역]",
];
const PRESET_PRIMARY_PUBLIC_CONTRACT = {
  POWER_INFRASTRUCTURE: { element: "A-024", title: "베트남 송전망", kind: "line" },
  RENEWABLE_PLANNING: { element: "C-016", title: "재생에너지 지역계획", kind: "adm1" },
  FOREST_CHANGE: { element: "B-033", title: "연간 산림손실", kind: "adm1" },
  CLIMATE_VULNERABILITY: { element: "B-021", title: "지역 취약성", kind: "adm1" },
  CLIMATE_FINANCE_PROJECTS: {
    element: "D-023",
    title: "국제협력·기후재원 사업",
    kind: "point",
  },
};

let server = null;
let browser = null;
let runtimeFailure = null;
let inspectedSurfaceCount = 0;
let focusedLayerCount = 0;
let inspectedPresetCount = 0;
let selectedFeatureSurfaceCount = 0;
let runtimeErrorCount = null;
let runtimeErrors = [];
let adm1AttributionPresent = null;
const selectedFeatureInteractions = [];
const forbiddenHits = [];
const misleadingHits = [];
const englishAccuracyHits = [];
const inspectionFailures = [];

function mergeHits(target, hits, surface) {
  for (const hit of hits || []) target.push({ surface, ...hit });
}

function primaryStateExpression(expectedElement, expectedTitle, presetId = null) {
  return `(() => {
    const normalize = (value) => String(value || '').replace(/\\s+/gu, ' ').trim();
    const expected = ${JSON.stringify(expectedTitle)};
    const expectedElement = ${JSON.stringify(expectedElement)};
    const presetId = ${JSON.stringify(presetId)};
    const preset = presetId
      ? [...document.querySelectorAll('[data-testid="map-analysis-preset"]')]
          .find((node) => node.getAttribute('data-preset-id') === presetId)
      : null;
    const root = document.querySelector('[data-testid="map-public-content"]');
    const primaryCards = [...document.querySelectorAll('.cdp-layer-card[data-map-layer-role="primary"]')];
    const primary = primaryCards[0] || null;
    const primaryTitle = normalize(primary?.querySelector('.cdp-layer-card__heading strong, strong')?.textContent);
    const primaryAction = [...(primary?.querySelectorAll('button') || [])]
      .find((node) => ['분석 중', '분석하기'].includes(normalize(node.textContent)));
    const current = document.querySelector('[data-testid="map-current-analysis"]');
    const currentName = [...(current?.querySelectorAll('.cdp-evidence-row') || [])]
      .find((row) => normalize(row.querySelector('span')?.textContent) === '데이터명')
      ?.querySelector('strong')?.textContent;
    const legendTitle = document.querySelector('[data-testid="map-dynamic-legend"] .cdp-map-legend__header strong')?.textContent;
    return Boolean(
      (!preset || preset.getAttribute('aria-pressed') === 'true') &&
      root?.getAttribute('data-primary-element') === expectedElement &&
      (!presetId || root?.getAttribute('data-map-preset') === presetId) &&
      primaryCards.length === 1 &&
      primary?.getAttribute('data-map-element') === expectedElement &&
      primaryTitle === expected &&
      primaryAction?.getAttribute('aria-pressed') === 'true' &&
      normalize(currentName) === expected &&
      normalize(legendTitle) === expected
    );
  })()`;
}

async function clickRenderedPrimaryFeature(cdp, expectedTitle, preferredKind) {
  await waitForValue(
    cdp,
    `(() => {
      const overlay = document.querySelector('.cdp-map-overlay-card');
      const summary = document.querySelector('[data-testid="map-national-summary"]');
      return Boolean(
        overlay && !/불러오는 중/u.test(overlay.textContent || '') &&
        summary?.textContent?.trim()
      );
    })()`,
    { timeoutMs: 35_000 }
  );
  const surface = await evaluateValue(
    cdp,
    `(() => {
      const visible = (node) => {
        if (!node) return false;
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
      };
      const host = document.querySelector('.cdp-map-canvas.is-visible');
      const canvas = host?.querySelector('canvas');
      if (visible(host) && visible(canvas)) {
        const rect = canvas.getBoundingClientRect();
        return { kind: 'canvas', left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      }
      const selector = ${JSON.stringify(preferredKind)} === 'line'
        ? '[data-testid="map-selectable-network"]'
        : ${JSON.stringify(preferredKind)} === 'point'
        ? '[data-testid="map-selectable-location"]'
        : '[data-testid="map-selectable-adm1-feature"]';
      const fallback = document.querySelector('.cdp-map-fallback');
      const feature = fallback?.querySelector(selector);
      if (visible(fallback) && visible(feature)) {
        const rect = feature.getBoundingClientRect();
        return { kind: 'fallback', left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      }
      return null;
    })()`
  );
  if (!surface) throw new Error(`visible ${preferredKind} map surface unavailable`);
  const selectedExpression = `(() => {
    const normalize = (value) => String(value || '').replace(/\\s+/gu, ' ').trim();
    const detail = document.querySelector('[data-testid="map-selected-feature-panel"] [data-testid="map-feature-detail"]');
    const name = [...(detail?.querySelectorAll('.cdp-evidence-row') || [])]
      .find((row) => normalize(row.querySelector('span')?.textContent) === '데이터명')
      ?.querySelector('strong')?.textContent;
    return normalize(name) === ${JSON.stringify(expectedTitle)};
  })()`;
  const clickAt = async (x, y) => {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1,
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1,
    });
  };
  if (surface.kind === "fallback") {
    await clickAt(surface.left + surface.width / 2, surface.top + surface.height / 2);
    await waitForValue(cdp, selectedExpression, { timeoutMs: 10_000 });
    return { surface: "visible-svg-fallback", clicks: 1 };
  }
  const step = preferredKind === "adm1" ? 34 : preferredKind === "line" ? 10 : 18;
  const positions = [];
  for (let y = surface.top + step / 2; y < surface.top + surface.height - step / 2; y += step) {
    for (let x = surface.left + step / 2; x < surface.left + surface.width - step / 2; x += step) {
      positions.push({
        x,
        y,
        distance: Math.hypot(
          x - (surface.left + surface.width / 2),
          y - (surface.top + surface.height / 2)
        ),
      });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  let clicks = 0;
  for (const position of positions) {
    await clickAt(position.x, position.y);
    clicks += 1;
    if (clicks % 24 === 0 && (await evaluateValue(cdp, selectedExpression))) {
      return { surface: "maplibre-canvas", clicks };
    }
  }
  if (await evaluateValue(cdp, selectedExpression)) {
    return { surface: "maplibre-canvas", clicks };
  }
  throw new Error(`actual ${preferredKind} canvas click did not select ${expectedTitle}`);
}

async function inspectMapSurface(surface) {
  const result = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"], [data-testid="public-map-root"], .cdp-map-page');
      if (!root) return { mounted: false };
      const normalize = (value) => String(value || '').normalize('NFC');
      const publicClone = root.cloneNode(true);
      publicClone.querySelectorAll('.cdp-map-canvas, script, style').forEach((node) => node.remove());
      const visible = (node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
      };
      const popupText = [...document.querySelectorAll('.maplibregl-popup')]
        .filter(visible)
        .map((node) => normalize(node.textContent))
        .filter(Boolean)
        .join(' ');
      const html = normalize(publicClone.outerHTML) + ' ' + popupText;
      const visibleText = normalize(root.innerText);
      const lowerHtml = html.toLocaleLowerCase('en-US');
      const lowerText = visibleText.toLocaleLowerCase('en-US');
      const forbidden = ${JSON.stringify(PUBLIC_MAP_DOM_FORBIDDEN)}.flatMap((token) =>
        lowerHtml.includes(token.toLocaleLowerCase('en-US')) ? [{ token }] : []
      );
      const misleading = ${JSON.stringify(MISLEADING_UNSERVED_COPY)}.flatMap((token) =>
        visibleText.includes(token) ? [{ token }] : []
      );
      for (const match of lowerText.matchAll(/\\b(?:unserved|underserved)\\s+areas?\\b/giu)) {
        misleading.push({ token: match[0] });
      }
      const accuracyCandidates = [...root.querySelectorAll('p, dd, dt, label, span, strong, small, [role="note"], [aria-label]')]
        .map((node) => normalize(node.getAttribute('aria-label') || node.textContent).replace(/\\s+/gu, ' ').trim())
        .filter(Boolean)
        .filter((text, index, all) => all.indexOf(text) === index)
        .filter((text) => /accuracy(?:\\s+notice)?|spatial\\s+accuracy|location\\s+accuracy|georeferenced/iu.test(text));
      const englishAccuracy = accuracyCandidates.flatMap((text) => {
        const asciiLetters = (text.match(/[A-Za-z]/gu) || []).length;
        const koreanLetters = (text.match(/[\uac00-\ud7a3]/gu) || []).length;
        return asciiLetters >= 8 && asciiLetters > koreanLetters
          ? [{ text, asciiLetters, koreanLetters }]
          : [];
      });
      return {
        mounted: true,
        forbidden,
        misleading,
        englishAccuracy,
        popupText,
      };
    })()`
  );
  if (!result?.mounted) throw new Error(`public map root missing at ${surface}`);
  inspectedSurfaceCount += 1;
  mergeHits(forbiddenHits, result.forbidden, surface);
  mergeHits(misleadingHits, result.misleading, surface);
  mergeHits(englishAccuracyHits, result.englishAccuracy, surface);
}

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  const mapUrl = new URL(server.url);
  mapUrl.searchParams.set("view", "map");
  mapUrl.searchParams.set("country", "VNM");
  mapUrl.hash = "map";
  await navigate(browser.cdp, mapUrl.toString());
  await waitForValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"], [data-testid="public-map-root"], .cdp-map-page');
      const viewButtons = [...document.querySelectorAll('.cdp-layer-card button')]
        .filter((node) => ['분석하기', '분석 중'].includes(node.textContent?.trim()));
      return Boolean(root && viewButtons.length === 13);
    })()`,
    { timeoutMs: 40_000 }
  );
  adm1AttributionPresent = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      return /geoBoundaries/iu.test(root?.innerText || '');
    })()`
  );
  await inspectMapSurface("initial");

  const layerButtonCount = await evaluateValue(
    browser.cdp,
    `(() => [...document.querySelectorAll('.cdp-layer-card button')]
      .filter((node) => ['분석하기', '분석 중'].includes(node.textContent?.trim())).length)()`
  );
  for (let index = 0; index < layerButtonCount; index += 1) {
    const layerIdentity = await evaluateValue(
      browser.cdp,
      `(() => {
        const buttons = [...document.querySelectorAll('.cdp-layer-card button')]
          .filter((node) => ['분석하기', '분석 중'].includes(node.textContent?.trim()));
        const button = buttons[${index}];
        if (!button || button.disabled) return null;
        const card = button.closest('.cdp-layer-card');
        const element = card?.getAttribute('data-map-element') || null;
        const title = card?.querySelector('.cdp-layer-card__heading strong, strong')?.textContent?.replace(/\\s+/gu, ' ').trim() || null;
        if (!element || !title) return null;
        button.click();
        return { element, title };
      })()`
    );
    if (!layerIdentity) {
      inspectionFailures.push({ surface: `layer-${index}`, error: "focus action unavailable" });
      continue;
    }
    try {
      await waitForValue(
        browser.cdp,
        primaryStateExpression(layerIdentity.element, layerIdentity.title),
        { timeoutMs: 20_000 }
      );
      await inspectMapSurface(`layer:${layerIdentity.element}:${layerIdentity.title}`);
      focusedLayerCount += 1;
    } catch (error) {
      inspectionFailures.push({
        surface: `layer:${layerIdentity.element}:${layerIdentity.title}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const presetCount = await evaluateValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-analysis-preset"]').length`
  );
  for (let index = 0; index < presetCount; index += 1) {
    const presetIdentity = await evaluateValue(
      browser.cdp,
      `(() => {
        const button = document.querySelectorAll('[data-testid="map-analysis-preset"]')[${index}];
        if (!button) return null;
        const identity = button.getAttribute('data-preset-id') || button.textContent?.trim() || 'preset-${index}';
        button.click();
        return identity;
      })()`
    );
    if (!presetIdentity) {
      inspectionFailures.push({ surface: `preset-${index}`, error: "preset action unavailable" });
      continue;
    }
    const presetContract = PRESET_PRIMARY_PUBLIC_CONTRACT[presetIdentity];
    if (!presetContract) {
      inspectionFailures.push({ surface: `preset:${presetIdentity}`, error: "public preset contract missing" });
      continue;
    }
    try {
      await waitForValue(
        browser.cdp,
        primaryStateExpression(
          presetContract.element,
          presetContract.title,
          presetIdentity
        ),
        { timeoutMs: 20_000 }
      );
      await inspectMapSurface(`preset:${presetIdentity}`);
      inspectedPresetCount += 1;
      const interaction = await clickRenderedPrimaryFeature(
        browser.cdp,
        presetContract.title,
        presetContract.kind
      );
      await inspectMapSurface(`preset-selected:${presetIdentity}`);
      selectedFeatureInteractions.push({
        presetId: presetIdentity,
        element: presetContract.element,
        title: presetContract.title,
        kind: presetContract.kind,
        ...interaction,
      });
      if (presetIdentity === "POWER_INFRASTRUCTURE") {
        await setViewport(browser.cdp, 1440, 1100);
        await captureElementPng(
          browser.cdp,
          ".cdp-map-layout",
          resolve(
            PROJECT_ROOT,
            "reports/v126/screenshots/map-transmission-selected-segment.png"
          )
        );
      }
      selectedFeatureSurfaceCount += 1;
    } catch (error) {
      inspectionFailures.push({
        surface: `preset:${presetIdentity}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  runtimeErrorCount = browser.runtimeErrors.length;
  runtimeErrors = browser.runtimeErrors.slice(0, 20);
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

function uniqueHits(hits) {
  const seen = new Set();
  return hits.filter((hit) => {
    const key = JSON.stringify(hit);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const uniqueForbiddenHits = uniqueHits(forbiddenHits);
const uniqueMisleadingHits = uniqueHits(misleadingHits);
const uniqueEnglishAccuracyHits = uniqueHits(englishAccuracyHits);
const selectedKinds = new Set(
  selectedFeatureInteractions.map((interaction) => interaction.kind)
);
const invalidInteractionCount = selectedFeatureInteractions.filter(
  (interaction) =>
    !["maplibre-canvas", "visible-svg-fallback"].includes(interaction.surface)
).length;

audit.check(
  "PUBLIC_MAP_SURFACES_INSPECTED",
  runtimeFailure === null &&
    focusedLayerCount === 13 &&
    inspectedPresetCount >= 5 &&
    selectedFeatureSurfaceCount >= 5 &&
    ["line", "point", "adm1"].every((kind) => selectedKinds.has(kind)) &&
    invalidInteractionCount === 0 &&
    inspectionFailures.length === 0,
  {
    focusedLayers: focusedLayerCount,
    presets: inspectedPresetCount,
    selectedFeatures: selectedFeatureSurfaceCount,
    selectedKinds: [...selectedKinds].sort(),
    invalidInteractions: invalidInteractionCount,
    surfaces: inspectedSurfaceCount,
    failures: inspectionFailures.length,
    runtimeFailure,
  },
  {
    focusedLayers: 13,
    presets: ">= 5",
    selectedFeatures: ">= 5",
    selectedKinds: ["adm1", "line", "point"],
    invalidInteractions: 0,
    failures: 0,
    runtimeFailure: null,
  },
  inspectionFailures.length ? inspectionFailures : selectedFeatureInteractions
);
audit.check(
  "PUBLIC_MAP_DOM_FORBIDDEN_TOKEN",
  uniqueForbiddenHits.length === 0,
  uniqueForbiddenHits.length,
  0,
  uniqueForbiddenHits.slice(0, 200)
);
audit.check(
  "MISLEADING_UNSERVED_WORDING",
  uniqueMisleadingHits.length === 0,
  uniqueMisleadingHits.length,
  0,
  uniqueMisleadingHits.slice(0, 200)
);
audit.check(
  "ENGLISH_ACCURACY_PRIMARY_UI",
  uniqueEnglishAccuracyHits.length === 0,
  uniqueEnglishAccuracyHits.length,
  0,
  uniqueEnglishAccuracyHits.slice(0, 200)
);
audit.check(
  "ADM1_PUBLIC_ATTRIBUTION",
  runtimeFailure === null && adm1AttributionPresent === true,
  { geoBoundaries: adm1AttributionPresent, runtimeFailure },
  { geoBoundaries: true, runtimeFailure: null }
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  runtimeFailure === null && runtimeErrorCount === 0,
  { count: runtimeErrorCount, runtimeFailure },
  { count: 0, runtimeFailure: null },
  runtimeErrors
);

audit.finish({
  inspectedMapLayerCount: focusedLayerCount,
  inspectedPresetCount,
  selectedFeatureSurfaceCount,
  selectedFeatureKinds: [...selectedKinds].sort(),
  selectedFeatureInteractions,
  publicMapDomForbiddenTokenCount: uniqueForbiddenHits.length,
  misleadingUnservedWordingCount: uniqueMisleadingHits.length,
  englishAccuracyPrimaryUiCount: uniqueEnglishAccuracyHits.length,
  adm1PublicAttribution: adm1AttributionPresent,
  uncaughtRuntimeError: runtimeErrorCount,
});
