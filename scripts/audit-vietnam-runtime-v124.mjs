#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const V2_ROOT = resolve(PROJECT_ROOT, "public/data/vietnam/v2");

const SOURCE_PATHS = {
  app: resolve(PROJECT_ROOT, "src/App.tsx"),
  page: resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
  styles: resolve(
    PROJECT_ROOT,
    "src/styles/country-data-platform-v122.css"
  ),
  types: resolve(PROJECT_ROOT, "src/data/vietnam/vietnamTypesV124.ts"),
  loader: resolve(
    PROJECT_ROOT,
    "src/data/vietnam/vietnamDataLoaderV124.ts"
  ),
  provider: resolve(
    PROJECT_ROOT,
    "src/data/countries/vietnamCountryDataProviderV122.ts"
  ),
  facade: resolve(
    PROJECT_ROOT,
    "src/data/countries/countryDataFacadeV122.ts"
  ),
};

const REQUIRED_LAYER_IDS = [
  "A-023",
  "B-048",
  "C-025",
  "D-018",
  "D-023",
  "A-024",
  "B-021",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "C-016",
  "D-008",
];
const EXTERNAL_GEOMETRY_IDS = [
  "A-024",
  "B-021",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "C-016",
  "D-008",
];
const CHOROPLETH_IDS = [
  "B-021",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "C-016",
  "D-008",
];

const checks = [];

function addCheck(name, passed, actual, expected, details = undefined) {
  const result = {
    type: "check",
    name,
    status: passed ? "PASS" : "FAIL",
    actual,
    expected,
  };
  if (details !== undefined) result.details = details;
  checks.push(result);
}

function readText(path) {
  if (!existsSync(path)) return { value: "", error: "missing" };
  try {
    return { value: readFileSync(path, "utf8"), error: null };
  } catch (error) {
    return {
      value: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function readJson(path) {
  const result = readText(path);
  if (result.error) return { value: null, error: result.error };
  if (/^\s*(?:<!doctype\s+html|<html)/iu.test(result.value)) {
    return { value: null, error: "HTML response body" };
  }
  try {
    return { value: JSON.parse(result.value), error: null };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function resolvePublicAsset(reference) {
  if (!nonEmptyString(reference)) return null;
  let pathname = reference.trim().split(/[?#]/u, 1)[0];
  try {
    if (/^https?:\/\//iu.test(pathname)) pathname = new URL(pathname).pathname;
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!pathname.startsWith("/data/")) return null;
  const path = resolve(PROJECT_ROOT, "public", pathname.slice(1));
  const publicRoot = resolve(PROJECT_ROOT, "public");
  return path.toLowerCase().startsWith(`${publicRoot}${sep}`.toLowerCase())
    ? path
    : null;
}

function layerUrl(layer, kind) {
  const keys =
    kind === "geometry"
      ? ["geometryUrl", "geojsonUrl", "boundaryUrl"]
      : ["dataUrl", "valuesUrl", "joinDataUrl", "spatialDataUrl"];
  for (const key of keys) {
    for (const container of [layer, layer?.spatialAsset, layer?.assetRef]) {
      if (nonEmptyString(container?.[key])) return container[key];
    }
  }
  return undefined;
}

function rendererOf(layer) {
  return String(
    layer?.renderer || layer?.visualization?.renderer || layer?.mapMode || ""
  ).toLowerCase();
}

function isActiveLayer(layer) {
  const status = String(layer?.spatialStatus || layer?.status || "").toLowerCase();
  return (
    layer?.active !== false &&
    layer?.enabled !== false &&
    layer?.disabled !== true &&
    ![
      "disabled",
      "unavailable",
      "requires-geometry",
      "requires-raw-grid",
    ].includes(status)
  );
}

function sourceHasAll(source, patterns) {
  return patterns.every((pattern) => pattern.test(source));
}

const sources = Object.fromEntries(
  Object.entries(SOURCE_PATHS).map(([key, path]) => [key, readText(path)])
);
for (const [key, result] of Object.entries(sources)) {
  addCheck(
    `RUNTIME_SOURCE_${key.toUpperCase()}`,
    result.error === null,
    result.error || "present",
    "present",
    { path: SOURCE_PATHS[key] }
  );
}

const appSource = sources.app.value;
const pageSource = sources.page.value;
const stylesSource = sources.styles.value;
const typeSource = sources.types.value;
const loaderSource = sources.loader.value;
const providerSource = sources.provider.value;
const facadeSource = sources.facade.value;
const combinedRuntimeSource = [
  pageSource,
  loaderSource,
  providerSource,
  facadeSource,
  typeSource,
].join("\n");

const manifestResult = readJson(resolve(V2_ROOT, "manifest.json"));
const mapIndexResult = readJson(resolve(V2_ROOT, "map-index.json"));
const manifest = manifestResult.value;
const mapIndex = mapIndexResult.value;
const layers = Array.isArray(mapIndex?.layers) ? mapIndex.layers : [];
const activeLayers = layers.filter(isActiveLayer);
const activeByElement = new Map(
  activeLayers.map((layer) => [String(layer.elementId), layer])
);

addCheck(
  "V124_RUNTIME_ASSET_SCHEMA",
  manifestResult.error === null &&
    mapIndexResult.error === null &&
    manifest?.schemaVersion === "v124" &&
    mapIndex?.schemaVersion === "v124",
  {
    manifestError: manifestResult.error,
    mapIndexError: mapIndexResult.error,
    manifestSchema: manifest?.schemaVersion,
    mapIndexSchema: mapIndex?.schemaVersion,
  },
  { manifestSchema: "v124", mapIndexSchema: "v124" }
);

const missingLayerIds = REQUIRED_LAYER_IDS.filter(
  (elementId) => !activeByElement.has(elementId)
);
addCheck(
  "RUNTIME_ACTIVE_LAYER_COUNT",
  activeLayers.length >= 13 && missingLayerIds.length === 0,
  activeLayers.length,
  ">= 13",
  { missing: missingLayerIds }
);

const v2LoaderContract = sourceHasAll(loaderSource, [
  /\/data\/vietnam\/v2\/manifest\.json/u,
  /\/data\/vietnam\/v2\/map-index\.json/u,
  /loadVietnamMapIndexV124/u,
  /ASSET_HTML_FALLBACK/u,
  /content-type/iu,
  /JSON\.parse/u,
]);
addCheck(
  "V124_LOADER_CONTRACT",
  v2LoaderContract,
  v2LoaderContract,
  true,
  {
    manifestUrl: loaderSource.includes("/data/vietnam/v2/manifest.json"),
    mapIndexUrl: loaderSource.includes("/data/vietnam/v2/map-index.json"),
    htmlGuard: loaderSource.includes("ASSET_HTML_FALLBACK"),
  }
);

const providerContract = sourceHasAll(providerSource, [
  /providerId:\s*["']vietnam-v124["']/u,
  /dataSchemaVersion:\s*["']v124["']/u,
  /loadVietnamMapIndexV124/u,
]);
addCheck("V124_PROVIDER_CONTRACT", providerContract, providerContract, true);

const mapRouteImport =
  /import\s+RealMapExplorerPage\s+from\s+["'].+RealMapExplorerPage["']/u.test(
    appSource
  ) ||
  /RealMapExplorerPage\s*=\s*lazy\(\(\)\s*=>\s*import\(["'].+RealMapExplorerPage["']\)\)/u.test(
    appSource
  );
const routeMounted = mapRouteImport && /<RealMapExplorerPage\b/u.test(appSource);
addCheck("MAP_PAGE_MOUNTED", routeMounted, routeMounted, true);

const fallbackMarkup = sourceHasAll(pageSource, [
  /className=["']cdp-map-page["']/u,
  /className=["']cdp-map-layout["']/u,
  /className=["']cdp-map-canvas-wrap["']/u,
  /cdp-map-canvas/u,
  /className=["']cdp-map-fallback["']/u,
  /className=["']cdp-map-fallback__svg["']/u,
  /loadWorldCountryBoundaries/u,
  /fallbackBoundaryStatus/u,
]);
const fallbackStyles = sourceHasAll(stylesSource, [
  /\.cdp-map-canvas-wrap\s*\{/u,
  /\.cdp-map-canvas\s*\{/u,
  /\.cdp-map-fallback\s*\{/u,
  /\.cdp-map-fallback__svg\s*\{/u,
  /\.cdp-map-canvas\.is-suspended\s*\{/u,
  /z-index:\s*1\s*;/u,
  /height:\s*100%\s*;/u,
]);
addCheck(
  "V1231_MAP_FALLBACK_PRESERVED",
  fallbackMarkup && fallbackStyles,
  { markup: fallbackMarkup, styles: fallbackStyles },
  { markup: true, styles: true }
);

const mapLibreRecoveryContract = sourceHasAll(pageSource, [
  /new\s+maplibregl\.Map\s*\(/u,
  /MapLibre initialization failed/u,
  /MapLibre runtime error/u,
  /baseMapStatus/u,
  /is-suspended/u,
]);
addCheck(
  "MAPLIBRE_RECOVERY_CONTRACT",
  mapLibreRecoveryContract,
  mapLibreRecoveryContract,
  true
);

const rendererPatterns = {
  point: /type:\s*["']circle["']/u,
  cluster: /cluster(?:MaxZoom|Radius|:\s*(?:layer\.)?cluster)/u,
  line: /type:\s*["']line["']/u,
  fill: /type:\s*["']fill["']/u,
};
const rendererResults = Object.fromEntries(
  Object.entries(rendererPatterns).map(([name, pattern]) => [
    name,
    pattern.test(combinedRuntimeSource),
  ])
);
addCheck(
  "MAP_RENDERER_IMPLEMENTATIONS",
  Object.values(rendererResults).every(Boolean),
  rendererResults,
  { point: true, cluster: true, line: true, fill: true }
);

const rendererRouting =
  /admin1-choropleth/u.test(combinedRuntimeSource) &&
  /partial-choropleth/u.test(combinedRuntimeSource) &&
  /rendererOf|\.renderer/u.test(combinedRuntimeSource);
addCheck("MAP_RENDERER_ROUTING", rendererRouting, rendererRouting, true);

const typeContract = sourceHasAll(typeSource, [
  /renderer/u,
  /geometryUrl/u,
  /dataUrl/u,
  /admin1-choropleth/u,
  /partial-choropleth/u,
]);
addCheck("V124_SPATIAL_TYPE_CONTRACT", typeContract, typeContract, true);

const runtimeAssetFailures = [];
for (const elementId of EXTERNAL_GEOMETRY_IDS) {
  const layer = activeByElement.get(elementId);
  if (!layer) {
    runtimeAssetFailures.push({ elementId, error: "active layer missing" });
    continue;
  }
  const geometryUrl = layerUrl(layer, "geometry");
  const dataUrl = layerUrl(layer, "data");
  const requiredUrls = [geometryUrl];
  if (CHOROPLETH_IDS.includes(elementId)) requiredUrls.push(dataUrl);
  for (const url of requiredUrls) {
    const path = resolvePublicAsset(url);
    if (!path || !existsSync(path) || !statSync(path).isFile()) {
      runtimeAssetFailures.push({ elementId, url: url || null, error: "missing" });
      continue;
    }
    const parsed = readJson(path);
    if (parsed.error) {
      runtimeAssetFailures.push({ elementId, url, error: parsed.error });
    }
  }
}
addCheck(
  "RUNTIME_SPATIAL_ASSET_URLS",
  runtimeAssetFailures.length === 0,
  runtimeAssetFailures.length,
  0,
  runtimeAssetFailures
);

const invalidRuntimeUrls = EXTERNAL_GEOMETRY_IDS.flatMap((elementId) => {
  const layer = activeByElement.get(elementId);
  if (!layer) return [];
  return [layerUrl(layer, "geometry"), layerUrl(layer, "data")]
    .filter(Boolean)
    .filter((url) => !String(url).startsWith("/data/vietnam/v2/"))
    .map((url) => ({ elementId, url }));
});
addCheck(
  "V2_SINGLE_SOURCE_MAP_URLS",
  invalidRuntimeUrls.length === 0,
  invalidRuntimeUrls.length,
  0,
  invalidRuntimeUrls
);

const spatialFetchContract =
  /geometryUrl/u.test(combinedRuntimeSource) &&
  /dataUrl/u.test(combinedRuntimeSource) &&
  /(load|fetch).*(?:Spatial|GeoJson|GeoJSON|geometry)/su.test(
    combinedRuntimeSource
  );
addCheck(
  "RUNTIME_SPATIAL_FETCH_CONTRACT",
  spatialFetchContract,
  spatialFetchContract,
  true
);

const uiContractTerms = {
  selector: /(selectors|variableSelector|yearSelector|metricSelector)/u,
  legend: /legend/u,
  unit: /(?:unit|단위)/u,
  source: /(?:sourceOrganizations|출처)/u,
  sourceYear: /(?:sourceYear|latestYear|기준연도)/u,
  coverage: /(?:spatialCoverage|coverageNote|공간 커버리지)/u,
  missing: /(?:missingRegions|missingProvince|결측)/u,
  accuracy: /(?:accuracyNotice|정확도)/u,
  detail: /(?:detailUrl|onOpenElement|상세)/u,
  download: /(?:downloadStatus|onOpenDownload|다운로드)/u,
};
const uiContract = Object.fromEntries(
  Object.entries(uiContractTerms).map(([key, pattern]) => [
    key,
    pattern.test(`${pageSource}\n${JSON.stringify(layers)}`),
  ])
);
addCheck(
  "MAP_LAYER_UI_CONTRACT",
  Object.values(uiContract).every(Boolean),
  uiContract,
  Object.fromEntries(Object.keys(uiContract).map((key) => [key, true]))
);

const groups = new Set(
  activeLayers.map((layer) => layer.group || layer.category).filter(nonEmptyString)
);
const requiredGroups = [
  "에너지·인프라",
  "산림·토지",
  "기후·위험",
  "물·자원",
  "국제사업·재원",
];
const missingGroups = requiredGroups.filter((group) => !groups.has(group));
addCheck(
  "MAP_UI_LAYER_GROUPS",
  missingGroups.length === 0,
  requiredGroups.length - missingGroups.length,
  requiredGroups.length,
  { missing: missingGroups }
);

const disabledLayerContract =
  /disabled/u.test(pageSource) &&
  /(?:disabledReason|unavailableReason|spatialReason|accuracyNotice)/u.test(
    combinedRuntimeSource
  );
addCheck(
  "UNAVAILABLE_LAYER_REASON_CONTRACT",
  disabledLayerContract,
  disabledLayerContract,
  true
);

const importLines = pageSource
  .split(/\r?\n/u)
  .filter((line) => /^\s*import\b/u.test(line));
const syntheticImports = importLines.filter((line) =>
  /(?:syntheticMapData|regionalSyntheticData|syntheticGeometry)/iu.test(line)
);
addCheck(
  "SYNTHETIC_RUNTIME_IMPORT_COUNT",
  syntheticImports.length === 0,
  syntheticImports.length,
  0,
  syntheticImports
);

const a023 = activeByElement.get("A-023");
addCheck(
  "RUNTIME_A023_FEATURE_COUNT",
  Number(a023?.featureCount) === 1889,
  a023?.featureCount ?? null,
  1889
);

const a024 = activeByElement.get("A-024");
const a024RuntimeContract =
  rendererOf(a024) === "line" &&
  layerUrl(a024, "geometry") ===
    "/data/vietnam/v2/geometry/vnm-transmission-network.geojson";
addCheck(
  "RUNTIME_A024_LINE_CONTRACT",
  a024RuntimeContract,
  {
    renderer: rendererOf(a024),
    geometryUrl: layerUrl(a024, "geometry") || null,
  },
  {
    renderer: "line",
    geometryUrl:
      "/data/vietnam/v2/geometry/vnm-transmission-network.geojson",
  }
);

const choroplethRuntimeFailures = CHOROPLETH_IDS.flatMap((elementId) => {
  const layer = activeByElement.get(elementId);
  if (!layer) return [{ elementId, error: "active layer missing" }];
  const renderer = rendererOf(layer);
  const validRenderer = [
    "admin1-choropleth",
    "partial-choropleth",
    "region-choropleth",
    "choropleth",
  ].includes(renderer);
  const geometryUrl = layerUrl(layer, "geometry");
  const dataUrl = layerUrl(layer, "data");
  const missing = [];
  if (!validRenderer) missing.push("renderer");
  if (
    geometryUrl !== "/data/vietnam/v2/geometry/vnm-adm1-63.geojson"
  ) {
    missing.push("geometryUrl");
  }
  if (
    dataUrl !==
    `/data/vietnam/v2/spatial/layers/${elementId.toLowerCase()}.json`
  ) {
    missing.push("dataUrl");
  }
  return missing.length > 0
    ? [{ elementId, renderer, geometryUrl, dataUrl, missing }]
    : [];
});
addCheck(
  "RUNTIME_CHOROPLETH_CONTRACTS",
  choroplethRuntimeFailures.length === 0,
  choroplethRuntimeFailures.length,
  0,
  choroplethRuntimeFailures
);

const fallbackWorldAsset = resolve(
  PROJECT_ROOT,
  "public/data/world-countries.geojson"
);
const fallbackWorldResult = readJson(fallbackWorldAsset);
addCheck(
  "FALLBACK_WORLD_COUNTRIES_ASSET",
  fallbackWorldResult.error === null &&
    fallbackWorldResult.value?.type === "FeatureCollection",
  fallbackWorldResult.error || fallbackWorldResult.value?.type,
  "FeatureCollection"
);

for (const check of checks) console.log(JSON.stringify(check));
const failed = checks.filter((check) => check.status === "FAIL");
console.log(
  JSON.stringify({
    type: "summary",
    status: failed.length === 0 ? "PASS" : "FAIL",
    passed: checks.length - failed.length,
    failed: failed.length,
    total: checks.length,
    activeMapLayers: activeLayers.length,
    mapPageMounted: routeMounted,
    fallbackPreserved: fallbackMarkup && fallbackStyles,
    failedChecks: failed.map((check) => check.name),
  })
);
process.exitCode = failed.length === 0 ? 0 : 1;
