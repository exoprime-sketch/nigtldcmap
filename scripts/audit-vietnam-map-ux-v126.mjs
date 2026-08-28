#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import ts from "typescript";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  readJson,
  readText,
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

const audit = new AuditV125("map-ux:v126");

function paethPredictor(left, above, upperLeft) {
  const value = left + above - upperLeft;
  const leftDistance = Math.abs(value - left);
  const aboveDistance = Math.abs(value - above);
  const upperLeftDistance = Math.abs(value - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function pngVisualStats(bytes) {
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error("map screenshot is not PNG");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!width || !height || bitDepth !== 8 || !channels || idat.length === 0) {
    throw new Error(`unsupported PNG ${width}x${height} depth=${bitDepth} type=${colorType}`);
  }
  const inflated = inflateSync(Buffer.concat(idat));
  const rowBytes = width * channels;
  const pixels = Buffer.alloc(rowBytes * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * rowBytes;
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= channels ? pixels[rowOffset + x - channels] : 0;
      const above = y > 0 ? pixels[rowOffset - rowBytes + x] : 0;
      const upperLeft = y > 0 && x >= channels
        ? pixels[rowOffset - rowBytes + x - channels]
        : 0;
      const reconstructed =
        filter === 0
          ? raw
          : filter === 1
          ? raw + left
          : filter === 2
          ? raw + above
          : filter === 3
          ? raw + Math.floor((left + above) / 2)
          : filter === 4
          ? raw + paethPredictor(left, above, upperLeft)
          : Number.NaN;
      if (!Number.isFinite(reconstructed)) throw new Error(`unsupported PNG filter ${filter}`);
      pixels[rowOffset + x] = reconstructed & 0xff;
    }
    sourceOffset += rowBytes;
  }

  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 80_000)));
  const colors = new Map();
  let sampleCount = 0;
  let luminanceSum = 0;
  let luminanceSquareSum = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = y * rowBytes + x * channels;
      if (channels === 4 && pixels[index + 3] === 0) continue;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const key = `${red >> 4}:${green >> 4}:${blue >> 4}`;
      colors.set(key, (colors.get(key) || 0) + 1);
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      luminanceSum += luminance;
      luminanceSquareSum += luminance * luminance;
      sampleCount += 1;
    }
  }
  const mean = sampleCount ? luminanceSum / sampleCount : 0;
  const luminanceVariance = sampleCount
    ? luminanceSquareSum / sampleCount - mean * mean
    : 0;
  const dominantCount = Math.max(0, ...colors.values());
  const nonDominantPixelRatio = sampleCount
    ? 1 - dominantCount / sampleCount
    : 0;
  return {
    width,
    height,
    sampleCount,
    quantizedColorCount: colors.size,
    luminanceVariance: Number(luminanceVariance.toFixed(2)),
    nonDominantPixelRatio: Number(nonDominantPixelRatio.toFixed(4)),
    painted:
      colors.size >= 12 &&
      luminanceVariance >= 25 &&
      nonDominantPixelRatio >= 0.02,
  };
}
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const adm1Result = readJson(resolve(V2_ROOT, "geometry/vnm-adm1-63.geojson"));
const geometryManifestResult = readJson(
  resolve(V2_ROOT, "geometry/geometry-manifest.json")
);
const workspaceSource = readText(
  resolve(PROJECT_ROOT, "src/data/visualization/publicMapWorkspaceV126.ts")
);
const mapPageSource = readText(
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx")
);

audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);
audit.check("ADM1_GEOJSON", adm1Result.error === null, adm1Result.error, null);
audit.check(
  "GEOMETRY_MANIFEST_JSON",
  geometryManifestResult.error === null,
  geometryManifestResult.error,
  null
);
audit.check(
  "PUBLIC_MAP_WORKSPACE_SOURCE",
  workspaceSource.error === null,
  workspaceSource.error,
  null
);
audit.check(
  "PUBLIC_MAP_PAGE_SOURCE",
  mapPageSource.error === null,
  mapPageSource.error,
  null
);

const layers = Array.isArray(mapResult.value?.layers) ? mapResult.value.layers : [];
const activeLayers = layers.filter(
  (layer) => layer?.active !== false && layer?.enabled !== false
);
const mapFeatureCount = activeLayers.reduce(
  (sum, layer) => sum + Number(layer?.featureCount || 0),
  0
);
const adm1FeatureCount = Array.isArray(adm1Result.value?.features)
  ? adm1Result.value.features.length
  : 0;
const adm1ManifestAsset = (geometryManifestResult.value?.assets || []).find(
  (asset) => asset?.kind === "adm1-boundary"
);

audit.check("ACTIVE_MAP_LAYERS", activeLayers.length === 13, activeLayers.length, 13);
audit.check("MAP_FEATURE_COUNT", mapFeatureCount === 2904, mapFeatureCount, 2904);
audit.check("ADM1_FEATURE_COUNT", adm1FeatureCount === 63, adm1FeatureCount, 63);
const adm1SourceContract = {
  canonicalUrl:
    adm1ManifestAsset?.url === "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
  manifestFeatureCount: Number(adm1ManifestAsset?.featureCount || 0),
  attributionRequired:
    adm1ManifestAsset?.license?.attributionRequired === true,
  geoBoundariesAttribution: /geoBoundaries/iu.test(
    String(adm1ManifestAsset?.attribution || "")
  ),
  mapAddsCanonicalSource:
    /VNM_ADM1_BASE_SOURCE_V126/gu.test(mapPageSource.value || "") &&
    /map\.addSource\(VNM_ADM1_BASE_SOURCE_V126/gu.test(mapPageSource.value || "") &&
    /map\.addLayer\(\{[\s\S]*?id:\s*VNM_ADM1_BASE_OUTLINE_V126[\s\S]*?source:\s*VNM_ADM1_BASE_SOURCE_V126/gu.test(
      mapPageSource.value || ""
    ),
};
audit.check(
  "ADM1_CANONICAL_BASE_SOURCE",
  adm1SourceContract.canonicalUrl &&
    adm1SourceContract.manifestFeatureCount === 63 &&
    adm1SourceContract.attributionRequired &&
    adm1SourceContract.geoBoundariesAttribution &&
    adm1SourceContract.mapAddsCanonicalSource,
  adm1SourceContract,
  {
    canonicalUrl: true,
    manifestFeatureCount: 63,
    attributionRequired: true,
    geoBoundariesAttribution: true,
    mapAddsCanonicalSource: true,
  }
);

function compileWorkspace(source) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: "publicMapWorkspaceV126.ts",
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length) {
    throw new Error(
      errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
        .join("; ")
    );
  }
  const record = { exports: {} };
  new Function("exports", "module", "require", result.outputText)(
    record.exports,
    record,
    (specifier) => {
      if (/publicFieldPolicyV126/u.test(String(specifier))) {
        return {
          publicTextV126(value) {
            return typeof value === "string" && value.trim() ? value.trim() : null;
          },
        };
      }
      throw new Error(`unexpected runtime import: ${specifier}`);
    }
  );
  return record.exports;
}

let workspaceApi = null;
let workspaceCompileError = null;
try {
  if (workspaceSource.error || !workspaceSource.value) {
    throw new Error(workspaceSource.error || "workspace source missing");
  }
  workspaceApi = compileWorkspace(workspaceSource.value);
} catch (error) {
  workspaceCompileError = error instanceof Error ? error.message : String(error);
}

const presets = Array.isArray(workspaceApi?.PUBLIC_MAP_WORKSPACE_PRESETS_V126)
  ? workspaceApi.PUBLIC_MAP_WORKSPACE_PRESETS_V126
  : [];
const presetContractFailures = presets.flatMap((preset) => {
  const failures = [];
  if (!preset?.id || !preset?.labelKo) failures.push("identity");
  if (!preset?.primary?.elementId) failures.push("primary");
  if (!activeLayers.some((layer) => layer.elementId === preset?.primary?.elementId)) {
    failures.push("primary layer unavailable");
  }
  if (!Array.isArray(preset?.context) || preset.context.length > 2) {
    failures.push("context limit");
  }
  const ids = [preset?.primary?.elementId, ...(preset?.context || []).map((item) => item.elementId)];
  if (ids.filter(Boolean).length !== new Set(ids.filter(Boolean)).size) {
    failures.push("duplicate layer");
  }
  for (const context of preset?.context || []) {
    if (!activeLayers.some((layer) => layer.elementId === context?.elementId)) {
      failures.push(`context layer unavailable: ${context?.elementId || "missing"}`);
    }
  }
  return failures.length ? [{ presetId: preset?.id || null, failures }] : [];
});
audit.check(
  "MAP_ANALYSIS_PRESET_MODEL",
  workspaceCompileError === null && presets.length >= 5 && presetContractFailures.length === 0,
  {
    compileError: workspaceCompileError,
    count: presets.length,
    failures: presetContractFailures.length,
  },
  { compileError: null, count: ">= 5", failures: 0 },
  presetContractFailures
);

function publicLayerTitle(elementId) {
  const layer = activeLayers.find((item) => item.elementId === elementId);
  if (typeof workspaceApi?.publicMapLayerTitleV126 === "function") {
    return workspaceApi.publicMapLayerTitleV126(
      elementId,
      layer?.publicShortTitle || layer?.title || null
    );
  }
  return layer?.publicShortTitle || layer?.title || elementId;
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
    const primaryCard = primaryCards[0] || null;
    const primaryTitle = normalize(primaryCard?.querySelector('.cdp-layer-card__heading strong, strong')?.textContent);
    const primaryAction = [...(primaryCard?.querySelectorAll('button') || [])]
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
      primaryCard?.getAttribute('data-map-element') === expectedElement &&
      primaryTitle === expected &&
      primaryAction?.getAttribute('aria-pressed') === 'true' &&
      normalize(currentName) === expected &&
      normalize(legendTitle) === expected
    );
  })()`;
}

async function applyPresetAndWait(
  cdp,
  presetId,
  expectedElement,
  expectedTitle
) {
  let lastFailure = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const clicked = await evaluateValue(
      cdp,
      `(() => {
        const button = [...document.querySelectorAll('[data-testid="map-analysis-preset"]')]
          .find((node) => node.getAttribute('data-preset-id') === ${JSON.stringify(presetId)});
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`
    );
    if (!clicked) throw new Error(`map preset ${presetId} unavailable`);
    try {
      await waitForValue(
        cdp,
        primaryStateExpression(expectedElement, expectedTitle, presetId),
        { timeoutMs: attempt === 2 ? 30_000 : 6_000 }
      );
      return presetId;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`map preset ${presetId} did not reach exact primary state: ${lastFailure}`);
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
    const expected = ${JSON.stringify(expectedTitle)};
    const detail = document.querySelector('[data-testid="map-selected-feature-panel"] [data-testid="map-feature-detail"]');
    if (!detail) return false;
    const datasetName = [...detail.querySelectorAll('.cdp-evidence-row')]
      .find((row) => normalize(row.querySelector('span')?.textContent) === '데이터명')
      ?.querySelector('strong')?.textContent;
    return normalize(datasetName) === expected;
  })()`;

  const clickAt = async (x, y) => {
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

async function verifyA023ClusterAndPoint(cdp) {
  const activated = await evaluateValue(
    cdp,
    `(() => {
      const card = document.querySelector('.cdp-layer-card[data-map-element="A-023"]');
      const button = [...(card?.querySelectorAll('button') || [])]
        .find((node) => ['분석하기', '분석 중'].includes(node.textContent?.trim()));
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!activated) throw new Error("A-023 primary action unavailable");
  await waitForValue(cdp, primaryStateExpression("A-023", "발전소"), {
    timeoutMs: 30_000,
  });
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
  await new Promise((resolveWait) => setTimeout(resolveWait, 400));
  const canvas = await evaluateValue(
    cdp,
    `(() => {
      const host = document.querySelector('.cdp-map-canvas.is-visible');
      const node = host?.querySelector('canvas');
      if (!node) return null;
      const hostStyle = getComputedStyle(host);
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (hostStyle.visibility === 'hidden' || Number(hostStyle.opacity || 1) <= 0 ||
          style.display === 'none' || style.visibility === 'hidden' ||
          rect.width <= 300 || rect.height <= 400) return null;
      const scale = document.querySelector('.maplibregl-ctrl-scale');
      const scaleRect = scale?.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        scaleBefore: (scale?.textContent?.trim() || '') + ':' + (scaleRect?.width || 0),
      };
    })()`
  );
  if (!canvas || canvas.scaleBefore === ":0") {
    throw new Error("A-023 MapLibre canvas or scale unavailable");
  }
  const clickAt = async (x, y) => {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1,
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1,
    });
  };
  const positions = [];
  const step = 20;
  for (let y = canvas.top + step / 2; y < canvas.top + canvas.height - step / 2; y += step) {
    for (let x = canvas.left + step / 2; x < canvas.left + canvas.width - step / 2; x += step) {
      positions.push({
        x,
        y,
        distance: Math.hypot(
          x - (canvas.left + canvas.width / 2),
          y - (canvas.top + canvas.height / 2)
        ),
      });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  let clusterClicksTried = 0;
  let scaleAfter = canvas.scaleBefore;
  for (const position of positions) {
    await clickAt(position.x, position.y);
    clusterClicksTried += 1;
    if (clusterClicksTried % 8 !== 0) continue;
    await new Promise((resolveWait) => setTimeout(resolveWait, 180));
    scaleAfter = await evaluateValue(
      cdp,
      `(() => {
        const scale = document.querySelector('.maplibregl-ctrl-scale');
        const rect = scale?.getBoundingClientRect();
        return (scale?.textContent?.trim() || '') + ':' + (rect?.width || 0);
      })()`
    );
    if (scaleAfter !== canvas.scaleBefore) break;
  }
  if (scaleAfter === canvas.scaleBefore) {
    throw new Error("A-023 cluster click did not change map scale");
  }

  for (let count = 0; count < 8; count += 1) {
    const zoomButton = await evaluateValue(
      cdp,
      `(() => {
        const button = document.querySelector('.maplibregl-ctrl-zoom-in');
        const rect = button?.getBoundingClientRect();
        return rect && rect.width > 0 && rect.height > 0
          ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          : null;
      })()`
    );
    if (!zoomButton) throw new Error("MapLibre zoom control unavailable");
    await clickAt(zoomButton.x, zoomButton.y);
    await new Promise((resolveWait) => setTimeout(resolveWait, 140));
  }
  const pointSelection = await clickRenderedPrimaryFeature(
    cdp,
    "발전소",
    "point"
  );
  const capacityPresentation = await evaluateValue(
    cdp,
    `(() => {
      const detail = document.querySelector('[data-testid="map-feature-detail"]');
      if (!detail) return null;
      const normalize = (value) => String(value || '').replace(/\\s+/gu, ' ').trim();
      const rows = [...detail.querySelectorAll('.cdp-evidence-row')].map((row) => ({
        label: normalize(row.querySelector('span')?.textContent),
        value: normalize(row.querySelector('strong')?.textContent),
      }));
      const capacityValue = rows.find((row) => row.label === '설비용량(MW)')?.value || null;
      const missingValue = rows.find((row) => row.label === '결측 여부')?.value || '';
      const missingCapacity = /원천 미제공[^]*설비용량/u.test(missingValue);
      return {
        facilityName: normalize(detail.querySelector('h4')?.textContent) || null,
        capacityValue,
        missingValue,
        missingCapacity,
        missingCapacityRenderedAsZero:
          missingCapacity && /(?:^|\\s)0(?:\\.0+)?\\s*MW(?:$|\\s)/iu.test(normalize(detail.textContent)),
      };
    })()`
  );
  return {
    clusterMode: activeLayers.find((layer) => layer.elementId === "A-023")?.cluster === true,
    featureCount: Number(
      activeLayers.find((layer) => layer.elementId === "A-023")?.featureCount || 0
    ),
    scaleBefore: canvas.scaleBefore,
    scaleAfter,
    clusterClicksTried,
    clusterZoomObserved: scaleAfter !== canvas.scaleBefore,
    pointSelection,
    capacityPresentation,
  };
}

let server = null;
let browser = null;
let runtimeFailure = null;
let runtimeResult = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  const mapUrl = new URL(server.url);
  mapUrl.searchParams.set("view", "map");
  mapUrl.searchParams.set("country", "VNM");
  mapUrl.hash = "map";
  const mapReadyExpression = `(() => {
    const root = document.querySelector('[data-testid="public-map-root"], .cdp-map-page');
    const presets = document.querySelectorAll('[data-testid="map-analysis-preset"]');
    const layerCards = document.querySelectorAll('[data-map-element]');
    const wrap = document.querySelector('.cdp-map-canvas-wrap');
    return Boolean(root && presets.length >= 5 && layerCards.length >= 13 &&
      wrap && wrap.getBoundingClientRect().height > 400);
  })()`;
  let mapReady = false;
  let mapReadyFailure = null;
  let mapReadyDiagnostic = null;
  for (let attempt = 0; attempt < 2 && !mapReady; attempt += 1) {
    await navigate(browser.cdp, mapUrl.toString());
    try {
      await waitForValue(browser.cdp, mapReadyExpression, { timeoutMs: 40_000 });
      mapReady = true;
    } catch (error) {
      mapReadyFailure = error instanceof Error ? error.message : String(error);
      mapReadyDiagnostic = await evaluateValue(
        browser.cdp,
        `(() => ({
          href: location.href,
          title: document.title,
          readyState: document.readyState,
          mapRoot: Boolean(document.querySelector('[data-testid="public-map-root"], .cdp-map-page')),
          presetCount: document.querySelectorAll('[data-testid="map-analysis-preset"]').length,
          layerCardCount: document.querySelectorAll('[data-map-element]').length,
          alert: document.querySelector('[role="alert"]')?.textContent?.replace(/\\s+/gu, ' ').trim() || null,
          bodyText: document.body?.textContent?.replace(/\\s+/gu, ' ').trim().slice(0, 240) || null,
        }))()`
      );
    }
  }
  if (!mapReady) {
    throw new Error(
      `map workspace unavailable after retry: ${mapReadyFailure}; diagnostic=${JSON.stringify(mapReadyDiagnostic)}`
    );
  }

  const presetCount = await evaluateValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-analysis-preset"]').length`
  );
  const presetSnapshots = [];
  for (let index = 0; index < presetCount; index += 1) {
    const presetModel = presets[index];
    const expectedTitle = publicLayerTitle(presetModel?.primary?.elementId);
    const clickResult = await applyPresetAndWait(
      browser.cdp,
      presetModel?.id,
      presetModel?.primary?.elementId,
      expectedTitle
    );
    const snapshot = await evaluateValue(
      browser.cdp,
      `(() => {
        const button = document.querySelectorAll('[data-testid="map-analysis-preset"]')[${index}];
        const legend = document.querySelector('[data-testid="map-dynamic-legend"], .cdp-map-legend');
        const primaryNodes = [...document.querySelectorAll('[data-map-layer-priority="primary"], [data-map-layer-role="primary"]')];
        const contextNodes = [...document.querySelectorAll('[data-map-layer-priority="context"], [data-map-layer-role="context"]')];
        const root = document.querySelector('[data-testid="map-public-content"]');
        const normalize = (value) => String(value || '').replace(/\\s+/gu, ' ').trim();
        const active = (node) => {
          if (['primary', 'context'].includes(node.getAttribute('data-map-layer-priority')) ||
              ['primary', 'context'].includes(node.getAttribute('data-map-layer-role'))) return true;
          const input = node.matches('input') ? node : node.querySelector('input');
          return input ? Boolean(input.checked) : node.getAttribute('data-active') === 'true' || node.classList.contains('is-active');
        };
        const primaryTitle = normalize(primaryNodes[0]?.querySelector('.cdp-layer-card__heading strong, strong')?.textContent);
        const current = document.querySelector('[data-testid="map-current-analysis"]');
        const currentName = [...(current?.querySelectorAll('.cdp-evidence-row') || [])]
          .find((row) => normalize(row.querySelector('span')?.textContent) === '데이터명')
          ?.querySelector('strong')?.textContent;
        const legendTitle = document.querySelector('[data-testid="map-dynamic-legend"] .cdp-map-legend__header strong')?.textContent;
        return {
          presetId: button?.getAttribute('data-preset-id') || button?.textContent?.trim() || null,
          expectedTitle: ${JSON.stringify(expectedTitle)},
          expectedElement: ${JSON.stringify(presetModel?.primary?.elementId || null)},
          expectedContexts: ${JSON.stringify(
            (presetModel?.context || []).map((item) => item.elementId)
          )},
          primaryElement: root?.getAttribute('data-primary-element') || null,
          contextElements: (root?.getAttribute('data-context-elements') || '').split(',').filter(Boolean),
          activePreset: root?.getAttribute('data-map-preset') || null,
          primaryTitle,
          currentName: normalize(currentName),
          legendTitle: normalize(legendTitle),
          presetPressed: button?.getAttribute('aria-pressed') === 'true',
          primaryCount: primaryNodes.filter(active).length,
          contextCount: contextNodes.filter(active).length,
          legendText: legend?.textContent?.replace(/\\s+/g, ' ').trim() || '',
          legendUnit: legend?.querySelector('[data-testid="map-legend-unit"], [data-map-legend-unit]')?.textContent?.trim() || null,
          variable: document.querySelector('[data-testid="map-layer-variable-select"]')?.value || null,
          period: document.querySelector('[data-testid="map-layer-period-select"]')?.value || null,
        };
      })()`
    );
    presetSnapshots.push(snapshot);
  }

  const powerPreset = presets.find(
    (preset) => preset.id === "POWER_INFRASTRUCTURE"
  );
  const powerTitle = publicLayerTitle(
    powerPreset?.primary?.elementId || "A-024"
  );
  await applyPresetAndWait(
    browser.cdp,
    "POWER_INFRASTRUCTURE",
    powerPreset?.primary?.elementId || "A-024",
    powerTitle
  );
  await setViewport(browser.cdp, 390, 844);
  await waitForValue(
    browser.cdp,
    `window.innerWidth === 390 && window.innerHeight === 844`,
    { timeoutMs: 10_000 }
  );
  const mobileDrawerClosed = await evaluateValue(
    browser.cdp,
    `(() => {
      const toggle = document.querySelector('button[aria-label="데이터 목록 접기"]');
      if (toggle instanceof HTMLButtonElement) toggle.click();
      return !document.querySelector('button[aria-label="데이터 목록 접기"]');
    })()`
  );
  if (!mobileDrawerClosed) {
    await waitForValue(
      browser.cdp,
      `!document.querySelector('button[aria-label="데이터 목록 접기"]')`,
      { timeoutMs: 10_000 }
    );
  }
  await waitForValue(
    browser.cdp,
    `(() => {
      const visible = (node) => {
        if (!(node instanceof Element)) return false;
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
      };
      return visible(document.querySelector('.cdp-map-canvas-wrap')) &&
        visible(document.querySelector('[data-testid="map-dynamic-legend"]')) &&
        visible(document.querySelector('[data-testid="map-current-analysis"]'));
    })()`,
    { timeoutMs: 10_000 }
  );
  const mobileScreenshot = await browser.cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const mobileScreenshotBytes = Buffer.from(mobileScreenshot.data, "base64");
  const mobileVisualStats = pngVisualStats(mobileScreenshotBytes);
  writeFileSync(
    resolve(PROJECT_ROOT, "reports/v126/screenshots/map-mobile-power.png"),
    mobileScreenshotBytes
  );
  await setViewport(browser.cdp, 1440, 1100);
  await waitForValue(browser.cdp, `window.innerWidth === 1440`, {
    timeoutMs: 10_000,
  });

  const forestPreset = presets.find((preset) => preset.id === "FOREST_CHANGE");
  const forestTitle = publicLayerTitle(forestPreset?.primary?.elementId || "B-033");
  await applyPresetAndWait(
    browser.cdp,
    "FOREST_CHANGE",
    forestPreset?.primary?.elementId || "B-033",
    forestTitle
  );
  const featureSelection = await clickRenderedPrimaryFeature(
    browser.cdp,
    forestTitle,
    "adm1"
  );

  const responsiveSnapshots = [];
  for (const width of [390, 768, 1024]) {
    await setViewport(browser.cdp, width, 1100);
    await waitForValue(
      browser.cdp,
      `window.innerWidth === ${width} && Boolean(document.querySelector('[data-testid="map-public-content"]'))`,
      { timeoutMs: 10_000 }
    );
    const snapshot = await evaluateValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-testid="map-public-content"]');
        const wrap = document.querySelector('.cdp-map-canvas-wrap');
        const rootRect = root?.getBoundingClientRect();
        const wrapRect = wrap?.getBoundingClientRect();
        const style = wrap ? getComputedStyle(wrap) : null;
        return {
          expectedWidth: ${width},
          viewportWidth: window.innerWidth,
          rootWidth: rootRect?.width || 0,
          mapWidth: wrapRect?.width || 0,
          mapHeight: wrapRect?.height || 0,
          mapDisplay: style?.display || null,
          mapVisibility: style?.visibility || null,
          horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        };
      })()`
    );
    responsiveSnapshots.push(snapshot);
  }
  await setViewport(browser.cdp, 1440, 1100);
  await waitForValue(browser.cdp, `window.innerWidth === 1440`, { timeoutMs: 10_000 });
  const a023Interaction = await verifyA023ClusterAndPoint(browser.cdp);
  const a023DetailFocused = await evaluateValue(
    browser.cdp,
    `(() => {
      const scroller = document.querySelector('.cdp-map-evidence');
      const detail = document.querySelector('[data-testid="map-feature-detail"]');
      if (!(scroller instanceof HTMLElement) || !(detail instanceof HTMLElement)) return false;
      const scrollerRect = scroller.getBoundingClientRect();
      const detailRect = detail.getBoundingClientRect();
      scroller.scrollTop += detailRect.top - scrollerRect.top - 96;
      return true;
    })()`
  );
  if (!a023DetailFocused) throw new Error("A-023 selected feature detail unavailable for screenshot");
  await waitForValue(
    browser.cdp,
    `(() => {
      const scroller = document.querySelector('.cdp-map-evidence');
      const detail = document.querySelector('[data-testid="map-feature-detail"]');
      if (!(scroller instanceof HTMLElement) || !(detail instanceof HTMLElement)) return false;
      const outer = scroller.getBoundingClientRect();
      const inner = detail.getBoundingClientRect();
      return inner.top >= outer.top && inner.top < outer.bottom && inner.bottom > outer.top;
    })()`,
    { timeoutMs: 10_000 }
  );
  await captureElementPng(
    browser.cdp,
    ".cdp-map-layout",
    resolve(PROJECT_ROOT, "reports/v126/screenshots/map-powerplant-selected.png")
  );
  const fittedCountry = await evaluateValue(
    browser.cdp,
    `(() => {
      const button = [...document.querySelectorAll('button')]
        .find((node) => node.textContent?.trim() === '전체 범위 보기');
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!fittedCountry) throw new Error("country extent action unavailable");
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));

  runtimeResult = await evaluateValue(
    browser.cdp,
    `(() => {
      const wrap = document.querySelector('.cdp-map-canvas-wrap');
      const fallback = document.querySelector('.cdp-map-fallback');
      const canvas = document.querySelector('.cdp-map-canvas');
      const selectedPanel = document.querySelector('[data-testid="map-selected-feature-panel"] [data-testid="map-feature-detail"]');
      const baseOutline = document.querySelector('[data-testid="map-adm1-base-outline"]');
      const baseOutlinePaths = [...(baseOutline?.querySelectorAll(':scope > path') || [])];
      const rect = wrap?.getBoundingClientRect();
      const isVisible = (node) => {
        if (!node) return false;
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0 && box.width > 0 && box.height > 0;
      };
      const nestedCanvas = canvas?.querySelector('canvas');
      const fallbackPixels = isVisible(fallback) &&
        Boolean(fallback.querySelector('.cdp-map-fallback__country[d]'));
      const canvasPixels = isVisible(canvas) && isVisible(nestedCanvas) &&
        canvas.classList.contains('is-visible');
      const panelText = selectedPanel?.textContent?.replace(/\\s+/g, ' ').trim() || '';
      const evidenceRows = [...(selectedPanel?.querySelectorAll('.cdp-evidence-row') || [])]
        .map((row) => ({
          label: row.querySelector('span')?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
          value: row.querySelector('strong')?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
        }));
      const hasMeasuredValue = evidenceRows.some((row) =>
        row.value && /^(?:값|설비용량|전압|구간 길이|지역|운영 상태)/u.test(row.label)
      );
      const hasUnit = evidenceRows.some((row) =>
        row.label === '단위' ||
        /(?:\\b(?:MW|kV|km|ha|tCO2e)\\b|%|위치자료|개 구간)/iu.test(row.label + ' ' + row.value)
      );
      const styleOf = (node) => {
        if (!node) return null;
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return {
          display: style.display,
          visibility: style.visibility,
          opacity: Number(style.opacity || 1),
          zIndex: style.zIndex,
          position: style.position,
          width: box.width,
          height: box.height,
        };
      };
      const baseNames = baseOutlinePaths
        .map((path) => path.querySelector('title')?.textContent?.trim() || '')
        .filter(Boolean);
      return {
        dimensions: { width: rect?.width || 0, height: rect?.height || 0 },
        fallbackPixels,
        canvasPixels,
        domHasMapPixels: Boolean(fallbackPixels || canvasPixels),
        activeSurface: canvasPixels ? 'maplibre-canvas' : fallbackPixels ? 'svg-fallback' : null,
        surfaceStyles: {
          wrap: styleOf(wrap),
          canvas: styleOf(canvas),
          nestedCanvas: styleOf(nestedCanvas),
          fallback: styleOf(fallback),
        },
        selectedPanel: Boolean(selectedPanel),
        selectedPanelText: panelText,
        selectedPanelFields: {
          value: hasMeasuredValue,
          unit: hasUnit,
          source: /출처|자료 제공기관/u.test(panelText),
          period: /기준연도|기준기간|자료연도/u.test(panelText),
        },
        adm1BaseOutline: {
          mounted: Boolean(baseOutline),
          pathCount: baseOutlinePaths.length,
          uniqueNameCount: new Set(baseNames).size,
          sourceLabel: baseOutline?.getAttribute('aria-label') || '',
        },
        attributionText: [
          ...document.querySelectorAll('.cdp-map-fallback__attribution, .maplibregl-ctrl-attrib'),
        ].map((node) => node.textContent?.replace(/\\s+/gu, ' ').trim() || '')
          .filter(Boolean)
          .join(' · '),
      };
    })()`
  );
  const screenshotClip = await evaluateValue(
    browser.cdp,
    `(() => {
      const rect = document.querySelector('.cdp-map-canvas-wrap')?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: Math.max(0, rect.left + window.scrollX + rect.width * 0.18),
        y: Math.max(0, rect.top + window.scrollY + rect.height * 0.16),
        width: Math.max(1, rect.width * 0.64),
        height: Math.max(1, rect.height * 0.62),
      };
    })()`
  );
  if (!screenshotClip) throw new Error("map screenshot clip unavailable");
  const screenshot = await browser.cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { ...screenshotClip, scale: 1 },
  });
  runtimeResult.visualStats = pngVisualStats(
    Buffer.from(screenshot.data, "base64")
  );
  runtimeResult.blankMap = !(
    runtimeResult.dimensions?.width > 300 &&
    runtimeResult.dimensions?.height > 400 &&
    runtimeResult.domHasMapPixels === true &&
    runtimeResult.visualStats.painted === true
  );
  runtimeResult.featureSelection = featureSelection;
  runtimeResult.a023Interaction = a023Interaction;
  runtimeResult.mobileVisualStats = mobileVisualStats;
  runtimeResult.responsiveSnapshots = responsiveSnapshots;
  runtimeResult.presetCount = presetCount;
  runtimeResult.presetSnapshots = presetSnapshots;
  runtimeResult.runtimeErrorCount = browser.runtimeErrors.length;
  runtimeResult.runtimeErrors = browser.runtimeErrors.slice(0, 20);
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const presetSnapshots = runtimeResult?.presetSnapshots || [];
const primaryLimitFailures = presetSnapshots.filter((item) => item.primaryCount > 1 || item.primaryCount < 1);
const contextLimitFailures = presetSnapshots.filter((item) => item.contextCount > 2);
const primaryIdentityFailures = presetSnapshots.filter(
  (item) =>
    item.presetPressed !== true ||
    !item.expectedTitle ||
    item.primaryElement !== item.expectedElement ||
    item.activePreset !== item.presetId ||
    JSON.stringify(item.contextElements || []) !==
      JSON.stringify(item.expectedContexts || []) ||
    item.primaryTitle !== item.expectedTitle ||
    item.currentName !== item.expectedTitle ||
    item.legendTitle !== item.expectedTitle
);
const responsiveSnapshots = runtimeResult?.responsiveSnapshots || [];
const responsiveFailures = responsiveSnapshots.filter(
  (item) =>
    item.viewportWidth !== item.expectedWidth ||
    item.rootWidth <= 0 ||
    item.mapWidth <= 300 ||
    item.mapHeight <= 400 ||
    item.mapDisplay === "none" ||
    item.mapVisibility === "hidden" ||
    item.horizontalOverflow > 1
);
const surfaceStyles = runtimeResult?.surfaceStyles || {};
const numericZIndex = (value) => {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
};
const activeSurfaceStyleValid =
  runtimeResult?.activeSurface === "maplibre-canvas"
    ? surfaceStyles.canvas?.display !== "none" &&
      surfaceStyles.canvas?.visibility !== "hidden" &&
      surfaceStyles.canvas?.opacity > 0 &&
      surfaceStyles.nestedCanvas?.width > 300 &&
      surfaceStyles.nestedCanvas?.height > 400 &&
      numericZIndex(surfaceStyles.canvas?.zIndex) >=
        numericZIndex(surfaceStyles.fallback?.zIndex)
    : runtimeResult?.activeSurface === "svg-fallback"
    ? surfaceStyles.fallback?.display !== "none" &&
      surfaceStyles.fallback?.visibility !== "hidden" &&
      surfaceStyles.fallback?.opacity > 0 &&
      surfaceStyles.fallback?.width > 300 &&
      surfaceStyles.fallback?.height > 400
    : false;
const capacitySourceContract =
  mapPageSource.value?.includes('value.trim() !== ""') === true &&
  mapPageSource.value?.includes('field === "capacityMw" && hasNumericValue') === true &&
  mapPageSource.value?.includes('`원천 미제공: ${missingLabels.join(" · ")}`') === true;
const capacityPresentation =
  runtimeResult?.a023Interaction?.capacityPresentation || null;
const missingCapacityFalseZero =
  capacitySourceContract &&
  Boolean(capacityPresentation) &&
  capacityPresentation?.missingCapacityRenderedAsZero === false &&
  (capacityPresentation?.missingCapacity !== true ||
    capacityPresentation?.capacityValue === null);
const legendSignatures = new Set(
  presetSnapshots.map((item) => item.legendText).filter(Boolean)
);
audit.check(
  "PRIMARY_ACTIVE_LAYER_LIMIT",
  runtimeFailure === null &&
    presetSnapshots.length >= 5 &&
    primaryLimitFailures.length === 0 &&
    primaryIdentityFailures.length === 0,
  {
    checked: presetSnapshots.length,
    limitFailures: primaryLimitFailures.length,
    identityFailures: primaryIdentityFailures.length,
  },
  { checked: ">= 5", limitFailures: 0, identityFailures: 0, primary: "1 exact public title per preset" },
  [...primaryLimitFailures, ...primaryIdentityFailures]
);
audit.check(
  "CONTEXT_ACTIVE_LAYER_LIMIT",
  runtimeFailure === null && presetSnapshots.length >= 5 && contextLimitFailures.length === 0,
  { checked: presetSnapshots.length, failures: contextLimitFailures.length },
  { checked: ">= 5", failures: 0, context: "<= 2 per preset" },
  contextLimitFailures
);
audit.check(
  "MAP_ANALYSIS_PRESET_DOM",
  runtimeFailure === null && Number(runtimeResult?.presetCount || 0) >= 5,
  { count: runtimeResult?.presetCount ?? 0, runtimeFailure },
  { count: ">= 5", runtimeFailure: null }
);
audit.check(
  "DYNAMIC_MAP_LEGEND",
  runtimeFailure === null &&
    presetSnapshots.length >= 5 &&
    legendSignatures.size === presetSnapshots.length &&
    presetSnapshots.every(
      (item) =>
        item.legendText &&
        item.variable &&
        item.period &&
        item.legendTitle === item.expectedTitle
    ),
  {
    snapshots: presetSnapshots.length,
    uniqueLegendSignatures: legendSignatures.size,
    missingSelectorOrLegend: presetSnapshots.filter(
      (item) => !item.legendText || !item.variable || !item.period
    ).length,
    stalePrimaryOrLegend: primaryIdentityFailures.length,
  },
  { snapshots: ">= 5", uniqueLegendSignatures: "= snapshots", missingSelectorOrLegend: 0, stalePrimaryOrLegend: 0 },
  presetSnapshots
);
audit.check(
  "A023_CLUSTER_ZOOM_AND_POINT_SELECTION",
  runtimeFailure === null &&
    runtimeResult?.a023Interaction?.clusterMode === true &&
    runtimeResult?.a023Interaction?.featureCount === 1889 &&
    runtimeResult?.a023Interaction?.clusterZoomObserved === true &&
    ["maplibre-canvas"].includes(
      runtimeResult?.a023Interaction?.pointSelection?.surface
    ),
  { interaction: runtimeResult?.a023Interaction || null, runtimeFailure },
  {
    clusterMode: true,
    featureCount: 1889,
    clusterZoomObserved: true,
    pointSelection: "actual MapLibre canvas",
    runtimeFailure: null,
  }
);
audit.check(
  "A023_MISSING_CAPACITY_NOT_ZERO",
  runtimeFailure === null && missingCapacityFalseZero,
  {
    sourceContract: capacitySourceContract,
    presentation: capacityPresentation,
    missingCapacityFalseZero,
    runtimeFailure,
  },
  {
    sourceContract: true,
    missingCapacityRenderedAsZero: false,
    missingCapacityValueOmitted: true,
    runtimeFailure: null,
  }
);
audit.check(
  "MAP_FEATURE_SELECTION_PANEL",
  runtimeFailure === null &&
    runtimeResult?.selectedPanel === true &&
    Object.values(runtimeResult?.selectedPanelFields || {}).every(Boolean) &&
    ["maplibre-canvas", "visible-svg-fallback"].includes(
      runtimeResult?.featureSelection?.surface
    ),
  {
    selectedPanel: runtimeResult?.selectedPanel ?? false,
    fields: runtimeResult?.selectedPanelFields || null,
    actualInteraction: runtimeResult?.featureSelection || null,
    runtimeFailure,
  },
  { selectedPanel: true, fields: { value: true, unit: true, source: true, period: true }, actualInteraction: "visible renderer", runtimeFailure: null },
  runtimeResult?.selectedPanelText || undefined
);
audit.check(
  "ADM1_BASE_OUTLINE_63",
  runtimeFailure === null &&
    runtimeResult?.adm1BaseOutline?.mounted === true &&
    runtimeResult?.adm1BaseOutline?.pathCount === 63 &&
    runtimeResult?.adm1BaseOutline?.uniqueNameCount === 63 &&
    /63/u.test(runtimeResult?.adm1BaseOutline?.sourceLabel || ""),
  { outline: runtimeResult?.adm1BaseOutline || null, runtimeFailure },
  { mounted: true, pathCount: 63, uniqueNameCount: 63, sourceLabel: "contains 63", runtimeFailure: null }
);
audit.check(
  "ADM1_PUBLIC_ATTRIBUTION",
  runtimeFailure === null && /geoBoundaries/iu.test(runtimeResult?.attributionText || ""),
  { attribution: runtimeResult?.attributionText || null, runtimeFailure },
  { attribution: "contains geoBoundaries", runtimeFailure: null }
);
audit.check(
  "RESPONSIVE_MAP_LAYOUT",
  runtimeFailure === null &&
    responsiveSnapshots.length === 3 &&
    responsiveFailures.length === 0,
  { checked: responsiveSnapshots.length, failures: responsiveFailures.length, runtimeFailure },
  { widths: [390, 768, 1024], failures: 0, horizontalOverflow: 0, runtimeFailure: null },
  responsiveFailures.length ? responsiveFailures : responsiveSnapshots
);
audit.check(
  "MOBILE_POWER_SCREENSHOT_390X844",
  runtimeFailure === null &&
    runtimeResult?.mobileVisualStats?.width === 390 &&
    runtimeResult?.mobileVisualStats?.height === 844 &&
    runtimeResult?.mobileVisualStats?.painted === true,
  { visualStats: runtimeResult?.mobileVisualStats || null, runtimeFailure },
  { width: 390, height: 844, painted: true, runtimeFailure: null }
);
audit.check(
  "BLANK_MAP",
  runtimeFailure === null &&
    runtimeResult?.blankMap === false &&
    activeSurfaceStyleValid,
  {
    blankMap: runtimeResult?.blankMap ?? null,
    dimensions: runtimeResult?.dimensions || null,
    domHasMapPixels: runtimeResult?.domHasMapPixels ?? null,
    activeSurface: runtimeResult?.activeSurface ?? null,
    surfaceStyles,
    activeSurfaceStyleValid,
    visualStats: runtimeResult?.visualStats || null,
    runtimeFailure,
  },
  {
    blankMap: false,
    width: "> 300",
    height: "> 400",
    domHasMapPixels: true,
    activeSurface: "visible canvas or SVG fallback",
    activeSurfaceStyleValid: true,
    screenshotPainted: true,
    runtimeFailure: null,
  }
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  runtimeFailure === null && runtimeResult?.runtimeErrorCount === 0,
  { count: runtimeResult?.runtimeErrorCount ?? null, runtimeFailure },
  { count: 0, runtimeFailure: null },
  runtimeResult?.runtimeErrors || []
);

audit.finish({
  presetCount: runtimeResult?.presetCount ?? 0,
  primaryLayerLimitFailures: primaryLimitFailures.length,
  primaryLayerIdentityFailures: primaryIdentityFailures.length,
  contextLayerLimitFailures: contextLimitFailures.length,
  dynamicLegend: legendSignatures.size >= 5,
  featureSelection: runtimeResult?.selectedPanel === true,
  selectedFeaturePanel: runtimeResult?.selectedPanel === true,
  actualFeatureSelectionSurface: runtimeResult?.featureSelection?.surface ?? null,
  a023ClusterZoomObserved:
    runtimeResult?.a023Interaction?.clusterZoomObserved ?? null,
  a023PointSelectionSurface:
    runtimeResult?.a023Interaction?.pointSelection?.surface ?? null,
  a023MissingCapacityFalseZero: missingCapacityFalseZero,
  a023MissingCapacityObserved:
    capacityPresentation?.missingCapacity ?? null,
  adm1SelectionOutline:
    runtimeResult?.adm1BaseOutline?.pathCount === 63 &&
    runtimeResult?.adm1BaseOutline?.uniqueNameCount === 63,
  responsiveWidths: responsiveSnapshots.map((item) => item.viewportWidth),
  responsiveLayoutFailures: responsiveFailures.length,
  mobileScreenshotDimensions: runtimeResult?.mobileVisualStats
    ? [
        runtimeResult.mobileVisualStats.width,
        runtimeResult.mobileVisualStats.height,
      ]
    : null,
  blankMap: runtimeResult?.blankMap ?? null,
  uncaughtRuntimeError: runtimeResult?.runtimeErrorCount ?? null,
});
