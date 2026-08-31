#!/usr/bin/env node

import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
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
import {
  finishAuditV129,
  mapUrlV129,
  normalizeTextV129,
  sourceTextV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("map-interaction:v129");
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const adm1Result = readJson(resolve(V2_ROOT, "geometry/vnm-adm1-63.geojson"));
const transmissionResult = readJson(
  resolve(V2_ROOT, "geometry/vnm-transmission-network.geojson")
);
const mapSource = sourceTextV129([
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
  resolve(PROJECT_ROOT, "src/data/visualization/publicMapWorkspaceV126.ts"),
]);
const packs = loadPackPayloads();
const layers = Array.isArray(mapResult.value?.layers)
  ? mapResult.value.layers.filter(
      (layer) => layer?.active !== false && layer?.enabled !== false
    )
  : [];
const featureCount = layers.reduce(
  (sum, layer) => sum + Number(layer?.featureCount || 0),
  0
);
const adm1Features = Array.isArray(adm1Result.value?.features)
  ? adm1Result.value.features
  : [];
const adm1Codes = new Set(
  adm1Features.map((feature) => feature?.properties?.adm1Code).filter(Boolean)
);
const PUBLIC_LAYER_TITLES = new Map([
  ["A-023", "발전소"],
  ["A-024", "베트남 송전망"],
  ["B-021", "지역 취약성"],
  ["B-031", "산림 총면적"],
  ["B-032", "수관 피복률"],
  ["B-033", "연간 산림손실"],
  ["B-034", "산림 탄소"],
  ["B-048", "주요 광산"],
  ["C-016", "재생에너지 지역계획"],
  ["C-025", "탄소크레딧 사업"],
  ["D-008", "지역 기후예산"],
  ["D-018", "적응기금 사업"],
  ["D-023", "국제협력·기후재원 사업"],
]);

audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);
audit.check("ADM1_JSON", adm1Result.error === null, adm1Result.error, null);
audit.check(
  "TRANSMISSION_JSON",
  transmissionResult.error === null,
  transmissionResult.error,
  null
);
audit.check("PACK_INTEGRITY", packs.errors.length === 0, packs.errors, []);

const selectorContractFailures = [];
const legendContractFailures = [];
for (const layer of layers) {
  const variables = Array.isArray(layer?.selectors?.variables)
    ? layer.selectors.variables
    : [];
  if (
    !layer?.elementId ||
    !normalizeTextV129(layer?.publicShortTitle || layer?.label) ||
    !normalizeTextV129(layer?.source) ||
    !normalizeTextV129(layer?.sourceYear || layer?.latestYear) ||
    variables.length === 0 ||
    variables.some(
      (variable) =>
        !normalizeTextV129(variable?.key) ||
        !normalizeTextV129(variable?.label) ||
        !normalizeTextV129(variable?.unit)
    )
  ) {
    selectorContractFailures.push(layer?.elementId || "unknown");
  }
  if (
    !normalizeTextV129(layer?.legend?.title || layer?.legendTitle) ||
    !normalizeTextV129(layer?.spatialCoverage) ||
    !Array.isArray(layer?.tooltipFields) ||
    layer.tooltipFields.length === 0
  ) {
    legendContractFailures.push(layer?.elementId || "unknown");
  }
}

const pointLayerIds = new Set(["A-023", "B-048", "C-025", "D-018", "D-023"]);
const pointAssetReconciliation = [];
const pointRecordIndex = new Map();
for (const elementId of pointLayerIds) {
  const layer = layers.find((item) => item.elementId === elementId);
  const records = payloadRecords(packs.elements.get(elementId)?.entities);
  const eligible = records.filter(
    (record) =>
      record?.mapEligible === true &&
      Number.isFinite(Number(record?.latitude)) &&
      Number.isFinite(Number(record?.longitude))
  );
  const duplicateRecordIds = eligible
    .map((record) => record?.recordId)
    .filter((recordId, index, values) => !recordId || values.indexOf(recordId) !== index);
  for (const record of eligible) {
    if (record?.recordId) pointRecordIndex.set(record.recordId, record);
  }
  if (
    !layer ||
    eligible.length !== Number(layer.featureCount) ||
    duplicateRecordIds.length > 0
  ) {
    pointAssetReconciliation.push({
      elementId,
      expected: Number(layer?.featureCount || 0),
      eligible: eligible.length,
      duplicateRecordIds,
    });
  }
}

const spatialLayerIds = new Set([
  "B-021",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "C-016",
  "D-008",
]);
const spatialOrphans = [];
const zeroImputations = [];
for (const elementId of spatialLayerIds) {
  const result = readJson(
    resolve(V2_ROOT, `spatial/layers/${elementId.toLowerCase()}.json`)
  );
  const rows = Array.isArray(result.value?.values) ? result.value.values : [];
  const observationIds = new Set(
    payloadRecords(packs.elements.get(elementId)?.observations)
      .map((record) => record?.recordId)
      .filter(Boolean)
  );
  if (result.error) {
    spatialOrphans.push({ elementId, error: result.error });
    continue;
  }
  for (const row of rows) {
    if (
      !adm1Codes.has(row?.adm1Code) ||
      !row?.sourceRecordId ||
      !observationIds.has(row.sourceRecordId) ||
      !normalizeTextV129(row?.variable) ||
      !normalizeTextV129(row?.variableLabel) ||
      !normalizeTextV129(row?.unit)
    ) {
      spatialOrphans.push({
        elementId,
        adm1Code: row?.adm1Code || null,
        sourceRecordId: row?.sourceRecordId || null,
        variable: row?.variable || null,
      });
    }
    if (row?.imputed === true) {
      zeroImputations.push({ elementId, sourceRecordId: row?.sourceRecordId });
    }
  }
}

const transmissionFeatures = Array.isArray(transmissionResult.value?.features)
  ? transmissionResult.value.features
  : [];
const transmissionOrphans = transmissionFeatures.filter((feature) => {
  const properties = feature?.properties || {};
  return (
    feature?.geometry?.type !== "MultiLineString" ||
    !feature?.id ||
    properties.featureId !== feature.id ||
    properties.elementId !== "A-024" ||
    properties.isSynthetic !== false ||
    !Number.isFinite(Number(properties.voltageKv)) ||
    !normalizeTextV129(properties.status) ||
    !Number.isFinite(Number(properties.lengthKm)) ||
    !normalizeTextV129(properties.source) ||
    !Number.isFinite(Number(properties.sourceYear))
  );
});
const orphanFeatureCount =
  pointAssetReconciliation.reduce(
    (sum, item) => sum + Math.abs(item.expected - item.eligible) + item.duplicateRecordIds.length,
    0
  ) +
  spatialOrphans.length +
  transmissionOrphans.length;

const sourceInteractionContract = {
  publicPopup: /cdp-map-public-popup/gu.test(mapSource),
  pointHover: /map\.on\("mouseenter",\s*ids\.pointHit/gu.test(mapSource),
  pointMove: /map\.on\("mousemove",\s*ids\.pointHit/gu.test(mapSource),
  pointClick: /map\.on\("click",\s*ids\.pointHit/gu.test(mapSource),
  lineOrPolygonHover: /map\.on\("mouseenter",\s*interactiveLayerId/gu.test(mapSource),
  lineOrPolygonMove: /map\.on\("mousemove",\s*interactiveLayerId/gu.test(mapSource),
  lineOrPolygonClick: /map\.on\("click",\s*interactiveLayerId/gu.test(mapSource),
  selectedDetail: /data-testid="map-feature-detail"/gu.test(mapSource),
  selectedRole: /data-selected-layer-role/gu.test(mapSource),
  contextBadge: /map-selected-context-badge/gu.test(mapSource),
  activeLegend: /map-active-layer-legend-item/gu.test(mapSource),
  symbolShape: /data-symbol-shape/gu.test(mapSource),
  keyboardNavigation: /map-keyboard-feature-navigation/gu.test(mapSource),
  keyboardSelect: /map-keyboard-feature-select/gu.test(mapSource),
};

function expectedKind(layer) {
  const renderer = String(layer?.renderer || layer?.mapMode || "");
  if (/line/u.test(renderer)) return "line";
  if (/choropleth/u.test(renderer)) return "adm1";
  return "point";
}

function layerStateExpression(elementId) {
  return `(() => {
    const root = document.querySelector('[data-testid="map-public-content"]');
    const card = document.querySelector('.cdp-layer-card[data-map-element=${JSON.stringify(elementId)}]');
    const legend = [...document.querySelectorAll('[data-testid="map-active-layer-legend-item"]')]
      .find((node) => node.getAttribute('data-element-id') === ${JSON.stringify(elementId)});
    const current = document.querySelector('[data-testid="map-current-analysis"]');
    const summary = document.querySelector('[data-testid="map-national-summary"]');
    return {
      primary: root?.getAttribute('data-primary-element'),
      cardRole: card?.getAttribute('data-map-layer-role'),
      cardTitle: card?.querySelector('.cdp-layer-card__heading strong')?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
      legend: legend ? {
        role: legend.getAttribute('data-layer-role'),
        shape: legend.getAttribute('data-symbol-shape'),
        variable: legend.getAttribute('data-variable'),
        unit: legend.getAttribute('data-unit'),
        text: legend.textContent?.replace(/\\s+/gu, ' ').trim() || '',
      } : null,
      legendCount: document.querySelectorAll('[data-testid="map-active-layer-legend-item"]').length,
      currentText: current?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
      summaryText: summary?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
      loading: /불러오는 중/u.test(document.querySelector('.cdp-map-overlay-card')?.textContent || ''),
    };
  })()`;
}

async function activateLayer(cdp, elementId) {
  const activated = await evaluateValue(
    cdp,
    `(() => {
      const card = document.querySelector('.cdp-layer-card[data-map-element=${JSON.stringify(elementId)}]');
      const button = [...(card?.querySelectorAll('button') || [])]
        .find((node) => ['분석하기', '분석 중'].includes(node.textContent?.trim()));
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!activated) throw new Error(`${elementId} primary action unavailable`);
  await waitForValue(
    cdp,
    `(() => {
      const value = (${layerStateExpression(elementId)});
      return value.primary === ${JSON.stringify(elementId)} && value.cardRole === 'primary' &&
        value.legend?.role === 'primary' && value.legend.shape && value.legend.variable &&
        value.legend.unit && value.currentText && value.summaryText && !value.loading;
    })()`,
    { timeoutMs: 35_000 }
  );
  return evaluateValue(cdp, layerStateExpression(elementId));
}

function selectedExpression(expectedTitle, expectedRole) {
  return `(() => {
    const normalize = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const panel = document.querySelector('[data-testid="map-selected-feature-panel"]');
    const detail = panel?.querySelector('[data-testid="map-feature-detail"]');
    if (!detail || panel?.getAttribute('data-selected-layer-role') !== ${JSON.stringify(expectedRole)}) return false;
    const row = [...detail.querySelectorAll('.cdp-evidence-row')]
      .find((node) => normalize(node.querySelector('span')?.textContent) === '데이터명');
    return normalize(row?.querySelector('strong')?.textContent).includes(${JSON.stringify(expectedTitle)});
  })()`;
}

async function renderedSurface(cdp, kind, role) {
  return evaluateValue(
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
        const blockers = [...document.querySelectorAll('.cdp-map-overlay-card, .cdp-map-legend, .maplibregl-control-container > div')]
          .flatMap((node) => {
            const box = node.getBoundingClientRect();
            return visible(node) ? [{ left: box.left, right: box.right, top: box.top, bottom: box.bottom }] : [];
          });
        return { type: 'canvas', left: rect.left, top: rect.top, width: rect.width, height: rect.height, blockers };
      }
      const selector = ${JSON.stringify(kind)} === 'line'
        ? '.cdp-map-fallback__line.is-${role}'
        : ${JSON.stringify(kind)} === 'point'
        ? '.cdp-map-fallback__point.is-${role}'
        : '.cdp-map-fallback__choropleth.is-${role}';
      const node = document.querySelector(selector);
      if (!visible(node)) return null;
      const rect = node.getBoundingClientRect();
      return { type: 'fallback', left: rect.left, top: rect.top, width: rect.width, height: rect.height, title: node.querySelector('title')?.textContent || '' };
    })()`
  );
}

async function dispatchClick(cdp, x, y) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

async function hoverAt(cdp, x, y, expectedTitle) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
    button: "none",
    buttons: 0,
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 8));
  return evaluateValue(
    cdp,
    `(() => {
      const popup = document.querySelector('.cdp-map-public-popup');
      const text = popup?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
      return { visible: Boolean(popup && text.includes(${JSON.stringify(expectedTitle)})), text };
    })()`
  );
}

async function sameLayerHoverTexts(cdp, layer) {
  const title = PUBLIC_LAYER_TITLES.get(layer.elementId) ||
    normalizeTextV129(layer.publicShortTitle || layer.label);
  const surface = await renderedSurface(cdp, expectedKind(layer), "primary");
  if (!surface || surface.type !== "canvas") return [];
  const texts = [];
  const seen = new Set();
  const step = 24;
  for (let y = surface.top + step / 2; y < surface.top + surface.height - step / 2; y += step) {
    for (let x = surface.left + step / 2; x < surface.left + surface.width - step / 2; x += step) {
      if (surface.blockers.some((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom)) continue;
      const hover = await hoverAt(cdp, x, y, title);
      const text = normalizeTextV129(hover.text);
      if (!hover.visible || !text || seen.has(text)) continue;
      seen.add(text);
      texts.push(text);
      if (texts.length >= 2) return texts;
    }
  }
  return texts;
}

async function dispatchKeyboardKey(cdp, key) {
  const contract = {
    Enter: { code: "Enter", keyCode: 13 },
    " ": { code: "Space", keyCode: 32 },
    ArrowRight: { code: "ArrowRight", keyCode: 39 },
  }[key];
  if (!contract) throw new Error(`unsupported keyboard key: ${key}`);
  await cdp.send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key,
    code: contract.code,
    windowsVirtualKeyCode: contract.keyCode,
    nativeVirtualKeyCode: contract.keyCode,
  });
  if (key === "Enter") {
    await cdp.send("Input.dispatchKeyEvent", {
      type: "char",
      key,
      code: contract.code,
      text: "\r",
      unmodifiedText: "\r",
      windowsVirtualKeyCode: contract.keyCode,
      nativeVirtualKeyCode: contract.keyCode,
    });
  }
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code: contract.code,
    windowsVirtualKeyCode: contract.keyCode,
    nativeVirtualKeyCode: contract.keyCode,
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 35));
}

async function keyboardFeatureState(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const navigation = document.querySelector('[data-testid="map-keyboard-feature-navigation"]');
      const select = document.querySelector('[data-testid="map-keyboard-feature-select"]');
      const panel = document.querySelector('[data-testid="map-selected-feature-panel"]');
      return {
        navigation: Boolean(navigation),
        focused: document.activeElement === select,
        label: select?.getAttribute('aria-label') || '',
        counter: select?.querySelector('small')?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
        primary: document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element'),
        role: panel?.getAttribute('data-selected-layer-role') || '',
        detail: document.querySelector('[data-testid="map-feature-detail"]')?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
      };
    })()`
  );
}

async function exerciseRenderedFeature(cdp, layer, role = "primary") {
  const title = PUBLIC_LAYER_TITLES.get(layer.elementId) ||
    normalizeTextV129(layer.publicShortTitle || layer.label);
  const kind = expectedKind(layer);
  const surface = await renderedSurface(cdp, kind, role);
  if (!surface) throw new Error(`${layer.elementId} visible ${kind} surface unavailable`);
  if (surface.type === "fallback") {
    await dispatchClick(
      cdp,
      surface.left + surface.width / 2,
      surface.top + surface.height / 2
    );
    await waitForValue(cdp, selectedExpression(title, role), { timeoutMs: 10_000 });
    return {
      elementId: layer.elementId,
      role,
      kind,
      surface: "svg-fallback",
      tooltip: normalizeTextV129(surface.title).includes(title),
      detail: true,
      attempts: 1,
    };
  }
  const step = kind === "line" ? 10 : kind === "point" ? 16 : 38;
  const positions = [];
  const centerX = surface.left + surface.width / 2;
  const centerY = surface.top + surface.height / 2;
  for (let y = surface.top + step / 2; y < surface.top + surface.height - step / 2; y += step) {
    for (let x = surface.left + step / 2; x < surface.left + surface.width - step / 2; x += step) {
      if (
        surface.blockers.some(
          (box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
        )
      ) {
        continue;
      }
      positions.push({ x, y, distance: Math.hypot(x - centerX, y - centerY) });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  const boundedPositions = positions.slice(0, Math.min(positions.length, 1800));
  let hoverHitCount = 0;
  for (let index = 0; index < boundedPositions.length; index += 1) {
    const position = boundedPositions[index];
    const hover = await hoverAt(cdp, position.x, position.y, title);
    if (!hover.visible) continue;
    hoverHitCount += 1;
    await dispatchClick(cdp, position.x, position.y);
    const selectionDeadline = Date.now() + 1_200;
    let selected = false;
    while (Date.now() < selectionDeadline) {
      if (await evaluateValue(cdp, selectedExpression(title, role))) {
        selected = true;
        break;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 40));
    }
    if (selected) {
      return {
        elementId: layer.elementId,
        role,
        kind,
        surface: "map-canvas",
        tooltip: hover.visible,
        tooltipText: hover.text,
        detail: true,
        attempts: index + 1,
        hoverHitCount,
      };
    }
  }
  throw new Error(
    `${layer.elementId} rendered ${kind} hover/click failed after ${boundedPositions.length} bounded positions (${hoverHitCount} hover hits)`
  );
}

async function exerciseRenderedFeatureWithReadiness(cdp, layer, role = "primary") {
  let lastResult = null;
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    // Layer activation updates sources, event handlers and the country fit in
    // separate React/MapLibre frames. Verify only after those frames settle.
    await new Promise((resolveWait) => setTimeout(resolveWait, 180 * attempt));
    try {
      const result = await exerciseRenderedFeature(cdp, layer, role);
      lastResult = {
        ...result,
        readinessAttempt: attempt,
      };
      if (lastResult.tooltip === true && lastResult.detail === true) return lastResult;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  if (lastResult) return lastResult;
  throw new Error(lastError || `${layer.elementId} interaction readiness failed`);
}

let server = null;
let browser = null;
let runtimeFailure = null;
let runtimeStage = "not-started";
const activationResults = [];
const interactionResults = [];
let contextSelection = null;
let polygonStackSelection = null;
let sameLayerHoverChange = null;
let keyboardSelection = null;
try {
  runtimeStage = "map-load";
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-public-content"]'))`,
    { timeoutMs: 30_000 }
  );
  await waitForValue(
    browser.cdp,
    `(() => {
      const cards = [...document.querySelectorAll('.cdp-layer-card[data-map-element]')];
      return cards.length === 13 && cards.every((card) =>
        [...card.querySelectorAll('button')].some((button) =>
          ['분석하기', '분석 중'].includes(button.textContent?.trim()) && !button.disabled
        )
      );
    })()`,
    { timeoutMs: 35_000 }
  );
  for (const layer of layers) {
    runtimeStage = `activate:${layer.elementId}`;
    const state = await activateLayer(browser.cdp, layer.elementId);
    activationResults.push({ elementId: layer.elementId, ...state });
  }

  for (const layer of layers) {
    runtimeStage = `layer-interaction:${layer.elementId}`;
    await activateLayer(browser.cdp, layer.elementId);
    interactionResults.push(
      await exerciseRenderedFeatureWithReadiness(browser.cdp, layer, "primary")
    );
  }

  const presetApplied = await evaluateValue(
    browser.cdp,
    `(() => {
      const button = [...document.querySelectorAll('[data-testid="map-analysis-preset"]')]
        .find((node) => node.getAttribute('data-preset-id') === 'POWER_INFRASTRUCTURE');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!presetApplied) throw new Error("POWER_INFRASTRUCTURE preset unavailable");
  runtimeStage = "context-point";
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === 'A-024' && document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements')?.split(',').includes('A-023')`,
    { timeoutMs: 35_000 }
  );
  const contextLayer = layers.find((item) => item.elementId === "A-023");
  if (!contextLayer) throw new Error("A-023 context layer unavailable");
  contextSelection = await exerciseRenderedFeatureWithReadiness(
    browser.cdp,
    contextLayer,
    "context"
  );
  const preservedPrimary = await evaluateValue(
    browser.cdp,
    `(() => ({
      primary: document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element'),
      role: document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role'),
      badge: document.querySelector('[data-testid="map-selected-context-badge"]')?.textContent?.trim() || '',
    }))()`
  );
  contextSelection = { ...contextSelection, preservedPrimary };

  const climatePresetApplied = await evaluateValue(
    browser.cdp,
    `(() => {
      const button = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id="CLIMATE_VULNERABILITY"]');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!climatePresetApplied) throw new Error("CLIMATE_VULNERABILITY preset unavailable");
  runtimeStage = "polygon-primary-context";
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === 'B-021' && document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements')?.split(',').includes('D-008')`,
    { timeoutMs: 35_000 }
  );
  const vulnerabilityLayer = layers.find((item) => item.elementId === "B-021");
  const budgetLayer = layers.find((item) => item.elementId === "D-008");
  if (!vulnerabilityLayer || !budgetLayer) {
    throw new Error("CLIMATE_VULNERABILITY polygon layers unavailable");
  }
  const primaryPolygon = await exerciseRenderedFeatureWithReadiness(
    browser.cdp,
    vulnerabilityLayer,
    "primary"
  );
  const contextPolygon = await exerciseRenderedFeatureWithReadiness(
    browser.cdp,
    budgetLayer,
    "context"
  );
  const polygonPreservedPrimary = await evaluateValue(
    browser.cdp,
    `(() => ({
      primary: document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element'),
      role: document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role'),
      badge: document.querySelector('[data-testid="map-selected-context-badge"]')?.textContent?.trim() || '',
    }))()`
  );
  polygonStackSelection = {
    preset: "CLIMATE_VULNERABILITY",
    primaryPolygon,
    contextPolygon,
    preservedPrimary: polygonPreservedPrimary,
  };

  sameLayerHoverChange = await sameLayerHoverTexts(
    browser.cdp,
    vulnerabilityLayer
  );

  runtimeStage = "keyboard-focus";
  const keyboardFocused = await evaluateValue(
    browser.cdp,
    `(() => {
      const select = document.querySelector('[data-testid="map-keyboard-feature-select"]');
      if (!(select instanceof HTMLButtonElement)) return false;
      select.focus();
      return document.activeElement === select;
    })()`
  );
  const keyboardInitial = await keyboardFeatureState(browser.cdp);
  keyboardSelection = { focused: keyboardFocused, initial: keyboardInitial };
  runtimeStage = "keyboard-arrow-right";
  await dispatchKeyboardKey(browser.cdp, "ArrowRight");
  const keyboardMoved = await keyboardFeatureState(browser.cdp);
  keyboardSelection = { ...keyboardSelection, moved: keyboardMoved };
  runtimeStage = "keyboard-enter-primary";
  await dispatchKeyboardKey(browser.cdp, "Enter");
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role') === 'primary' && Boolean(document.querySelector('[data-testid="map-feature-detail"]'))`,
    { timeoutMs: 8_000 }
  );
  const keyboardPrimary = await keyboardFeatureState(browser.cdp);
  keyboardSelection = { ...keyboardSelection, primary: keyboardPrimary };
  let keyboardContextCandidate = await keyboardFeatureState(browser.cdp);
  runtimeStage = "keyboard-find-context";
  for (let attempt = 0; attempt < 180 && !/지역 기후예산/u.test(keyboardContextCandidate.label); attempt += 1) {
    await dispatchKeyboardKey(browser.cdp, "ArrowRight");
    keyboardContextCandidate = await keyboardFeatureState(browser.cdp);
  }
  if (!/지역 기후예산/u.test(keyboardContextCandidate.label)) {
    throw new Error("keyboard context feature candidate unavailable");
  }
  keyboardSelection = { ...keyboardSelection, contextCandidate: keyboardContextCandidate };
  runtimeStage = "keyboard-space-context";
  await dispatchKeyboardKey(browser.cdp, " ");
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === 'B-021' && document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role') === 'context' && document.querySelector('[data-testid="map-feature-detail"]')?.textContent?.includes('지역 기후예산') === true`,
    { timeoutMs: 8_000 }
  );
  const keyboardContext = await keyboardFeatureState(browser.cdp);
  keyboardSelection = { ...keyboardSelection, context: keyboardContext };
} catch (error) {
  runtimeFailure = `${runtimeStage}: ${error instanceof Error ? error.message : String(error)}`;
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const activationFailures = activationResults.filter((result) => {
  const layer = layers.find((item) => item.elementId === result.elementId);
  return (
    result.primary !== result.elementId ||
    result.cardRole !== "primary" ||
    result.legend?.role !== "primary" ||
    !result.legend?.shape ||
    !result.legend?.variable ||
    !result.legend?.unit ||
    result.legendCount < 1 ||
    result.legendCount > 3 ||
    !normalizeTextV129(result.cardTitle) ||
    !normalizeTextV129(result.legend?.text).includes(normalizeTextV129(result.cardTitle)) ||
    result.cardTitle !== PUBLIC_LAYER_TITLES.get(result.elementId) ||
    !result.currentText ||
    !result.summaryText
  );
});
const interactionFailures = interactionResults.filter(
  (result) => result.tooltip !== true || result.detail !== true
);
const contextPass =
  contextSelection?.tooltip === true &&
  contextSelection?.detail === true &&
  contextSelection?.preservedPrimary?.primary === "A-024" &&
  contextSelection?.preservedPrimary?.role === "context" &&
  /보조/u.test(contextSelection?.preservedPrimary?.badge || "");
const polygonStackPass =
  polygonStackSelection?.primaryPolygon?.tooltip === true &&
  polygonStackSelection?.primaryPolygon?.detail === true &&
  polygonStackSelection?.contextPolygon?.tooltip === true &&
  polygonStackSelection?.contextPolygon?.detail === true &&
  polygonStackSelection?.preservedPrimary?.primary === "B-021" &&
  polygonStackSelection?.preservedPrimary?.role === "context" &&
  /보조/u.test(polygonStackSelection?.preservedPrimary?.badge || "");
const sameLayerHoverPass =
  Array.isArray(sameLayerHoverChange) &&
  sameLayerHoverChange.length >= 2 &&
  new Set(sameLayerHoverChange).size >= 2;
const keyboardSelectionPass =
  keyboardSelection?.focused === true &&
  keyboardSelection?.initial?.navigation === true &&
  keyboardSelection?.initial?.focused === true &&
  keyboardSelection?.moved?.label !== keyboardSelection?.initial?.label &&
  keyboardSelection?.moved?.counter !== keyboardSelection?.initial?.counter &&
  keyboardSelection?.primary?.role === "primary" &&
  keyboardSelection?.primary?.primary === "B-021" &&
  /지역 취약성/u.test(keyboardSelection?.primary?.detail || "") &&
  /베트남\s*6개\s*권역\s*중\s*\d+위/u.test(keyboardSelection?.primary?.detail || "") &&
  keyboardSelection?.context?.role === "context" &&
  keyboardSelection?.context?.primary === "B-021" &&
  /지역 기후예산/u.test(keyboardSelection?.context?.detail || "");

audit.check("ACTIVE_MAP_LAYERS", layers.length === 13, layers.length, 13);
audit.check("MAP_FEATURE_COUNT", featureCount === 2904, featureCount, 2904);
audit.check("ADM1_FEATURE_COUNT", adm1Codes.size === 63, adm1Codes.size, 63);
audit.check(
  "MAP_SELECTOR_PUBLIC_CONTRACT",
  selectorContractFailures.length === 0,
  selectorContractFailures,
  []
);
audit.check(
  "ACTIVE_LAYER_LEGEND_CONTRACT",
  legendContractFailures.length === 0 && sourceInteractionContract.activeLegend && sourceInteractionContract.symbolShape,
  { failures: legendContractFailures, sourceInteractionContract },
  { failures: [], activeLegend: true, symbolShape: true }
);
audit.check(
  "POINT_RECORD_RECONCILIATION",
  pointAssetReconciliation.length === 0,
  pointAssetReconciliation,
  []
);
audit.check(
  "SPATIAL_RECORD_RECONCILIATION",
  spatialOrphans.length === 0 && zeroImputations.length === 0,
  { spatialOrphans: spatialOrphans.length, zeroImputations: zeroImputations.length },
  { spatialOrphans: 0, zeroImputations: 0 },
  { spatialOrphans, zeroImputations }
);
audit.check(
  "TRANSMISSION_FEATURE_RECONCILIATION",
  transmissionFeatures.length === 606 && transmissionOrphans.length === 0,
  { featureCount: transmissionFeatures.length, orphanCount: transmissionOrphans.length },
  { featureCount: 606, orphanCount: 0 }
);
audit.check("MAP_ORPHAN_FEATURE", orphanFeatureCount === 0, orphanFeatureCount, 0, {
  pointAssetReconciliation,
  spatialOrphans,
  transmissionOrphans: transmissionOrphans.map((feature) => feature?.id),
});
audit.check(
  "MAP_INTERACTION_SOURCE_CONTRACT",
  Object.values(sourceInteractionContract).every(Boolean),
  sourceInteractionContract,
  Object.fromEntries(Object.keys(sourceInteractionContract).map((key) => [key, true]))
);
audit.check(
  "ALL_LAYER_BROWSER_ACTIVATION_AND_LEGEND",
  runtimeFailure === null && activationResults.length === 13 && activationFailures.length === 0,
  { runtimeFailure, checked: activationResults.length, failures: activationFailures.length },
  { runtimeFailure: null, checked: 13, failures: 0 },
  activationFailures
);
audit.check(
  "ALL_LAYER_TOOLTIP_AND_CLICK",
  runtimeFailure === null && interactionResults.length === 13 && interactionFailures.length === 0,
  { runtimeFailure, interactionResults },
  { layers: 13, tooltip: true, detail: true }
);
audit.check(
  "CONTEXT_LAYER_SELECTION_DETAIL",
  runtimeFailure === null && contextPass,
  { runtimeFailure, contextSelection },
  { tooltip: true, detail: true, primaryPreserved: "A-024", selectedRole: "context" }
);
audit.check(
  "POLYGON_PRIMARY_CONTEXT_HIT_ORDER",
  runtimeFailure === null && polygonStackPass,
  { runtimeFailure, polygonStackSelection },
  {
    preset: "CLIMATE_VULNERABILITY",
    primaryPolygon: "B-021 tooltip/detail",
    contextPolygon: "D-008 tooltip/detail",
    primaryPreserved: "B-021",
  }
);
audit.check(
  "SAME_LAYER_HOVER_FEATURE_REFRESH",
  runtimeFailure === null && sameLayerHoverPass,
  { runtimeFailure, popupTexts: sameLayerHoverChange },
  { distinctPopupTexts: ">= 2", sameActiveLayer: "B-021" }
);
audit.check(
  "KEYBOARD_FEATURE_NAVIGATION",
  runtimeFailure === null && keyboardSelectionPass,
  { runtimeFailure, keyboardSelection },
  {
    navigation: true,
    arrowRightChangesCounterAndLabel: true,
    enterSelectsPrimary: true,
    spaceSelectsContext: true,
    primaryPreserved: "B-021",
  }
);
audit.check(
  "MAP_VISIBLE_FEATURE_WITHOUT_TOOLTIP",
  sourceInteractionContract.publicPopup &&
    sourceInteractionContract.pointHover &&
    sourceInteractionContract.lineOrPolygonHover &&
    interactionFailures.filter((item) => item.tooltip !== true).length === 0,
  interactionFailures.filter((item) => item.tooltip !== true),
  []
);
audit.check(
  "MAP_CLICKABLE_FEATURE_WITHOUT_DETAIL",
  sourceInteractionContract.selectedDetail &&
    sourceInteractionContract.pointClick &&
    sourceInteractionContract.lineOrPolygonClick &&
    interactionFailures.filter((item) => item.detail !== true).length === 0,
  interactionFailures.filter((item) => item.detail !== true),
  []
);
audit.check(
  "MAP_UNKNOWN_SYMBOL",
  legendContractFailures.length === 0 &&
    activationFailures.filter((item) => !item.legend?.shape).length === 0,
  activationFailures.filter((item) => !item.legend?.shape),
  []
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  (browser?.runtimeErrors?.length || 0) === 0,
  browser?.runtimeErrors || [],
  []
);

finishAuditV129(audit, "map-interaction-audit-v129.json", {
  mapLayerCount: layers.length,
  mapFeatureCount: featureCount,
  mapOrphanFeatureCount: orphanFeatureCount,
  mapUnknownSymbolCount:
    legendContractFailures.length + activationFailures.filter((item) => !item.legend?.shape).length,
  mapTooltipCoverage:
    runtimeFailure === null && interactionResults.length === 13 && interactionFailures.every((item) => item.tooltip)
      ? "13/13 browser hover"
      : "FAIL",
  mapClickDetailCoverage:
    runtimeFailure === null && interactionResults.length === 13 && interactionFailures.every((item) => item.detail)
      ? "13/13 browser click detail"
      : "FAIL",
  contextLayerSelection: contextPass ? "PASS" : "FAIL",
});
