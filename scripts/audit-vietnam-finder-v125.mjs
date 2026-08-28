#!/usr/bin/env node

import { existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import ts from "typescript";
import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  arrayDifference,
  catalogElements,
  loadPackPayloads,
  parseCsv,
  payloadRecords,
  publicUrlToPath,
  readJson,
  readText,
  uniqueStrings,
  visualizationContracts,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("finder:v125");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const contractsResult = readJson(
  resolve(SEMANTIC_ROOT, "element-visualization-contracts-v125.json")
);
const semanticsResult = readJson(
  resolve(SEMANTIC_ROOT, "indicator-semantics-v125.json")
);
const bundleIndexResult = readJson(
  resolve(V2_ROOT, "packs/bundle-index-v124.json")
);

for (const [name, result] of [
  ["CATALOG_JSON", catalogResult],
  ["VISUALIZATION_CONTRACTS_JSON", contractsResult],
  ["INDICATOR_SEMANTICS_JSON", semanticsResult],
  ["BUNDLE_INDEX_JSON", bundleIndexResult],
]) {
  audit.check(name, result.error === null, result.error, null);
}

const catalog = catalogElements(catalogResult.value);
const contracts = visualizationContracts(contractsResult.value);
const contractById = new Map(contracts.map((contract) => [contract.elementId, contract]));
const catalogIds = catalog.map((element) => element.elementId).sort();
const indexIds = Object.keys(bundleIndexResult.value?.elements || {}).sort();
const routeIdFailures = catalogIds.filter((id) => !/^[A-E]-\d{3}$/u.test(id));
const missingBundleIds = arrayDifference(catalogIds, indexIds);
const unknownBundleIds = arrayDifference(indexIds, catalogIds);

audit.check("FINDER_CATALOG_COUNT", catalog.length === 152, catalog.length, 152);
audit.check(
  "FINDER_ROUTE_ELEMENT_IDS",
  routeIdFailures.length === 0,
  routeIdFailures.length,
  0,
  routeIdFailures
);
audit.check(
  "FINDER_ROUTE_ASSET_COVERAGE",
  missingBundleIds.length === 0 && unknownBundleIds.length === 0,
  { missing: missingBundleIds.length, unknown: unknownBundleIds.length },
  { missing: 0, unknown: 0 },
  { missingBundleIds, unknownBundleIds }
);

const packData = loadPackPayloads();
const routePayloadFailures = catalog.flatMap((element) => {
  const payload = packData.elements.get(element.elementId);
  if (!payload) return [{ elementId: element.elementId, error: "payload missing" }];
  const payloadElement = payload.meta?.element;
  const failures = [];
  if (payloadElement?.elementId !== element.elementId) failures.push("meta.elementId");
  if (!Array.isArray(payload.meta?.indicators)) failures.push("meta.indicators");
  const observations = payloadRecords(payload.observations);
  const entities = payloadRecords(payload.entities);
  if (!Array.isArray(payload.observations) && !Array.isArray(payload.observations?.records)) {
    failures.push("observations");
  }
  if (!Array.isArray(payload.entities) && !Array.isArray(payload.entities?.records)) {
    failures.push("entities");
  }
  if (observations.length !== Number(element.observationCount || 0)) {
    failures.push("observationCount");
  }
  if (entities.length !== Number(element.entityCount || 0)) {
    failures.push("entityCount");
  }
  return failures.length ? [{ elementId: element.elementId, failures }] : [];
});
audit.check(
  "DETAIL_ROUTE_PAYLOADS_RENDERABLE",
  packData.errors.length === 0 && routePayloadFailures.length === 0,
  {
    renderable: 152 - routePayloadFailures.length,
    packErrors: packData.errors.length,
  },
  { renderable: 152, packErrors: 0 },
  { packErrors: packData.errors, routePayloadFailures: routePayloadFailures.slice(0, 50) }
);

const primaryRendererFailures = [];
const noDataRendererFailures = [];
for (const element of catalog) {
  const contract = contractById.get(element.elementId);
  if (!contract) {
    primaryRendererFailures.push({ elementId: element.elementId, error: "contract missing" });
    continue;
  }
  const populated =
    ["actual-records", "partial-records"].includes(element.dataPresenceStatus) &&
    Number(element.observationCount || 0) + Number(element.entityCount || 0) > 0;
  if (populated && (!contract.primaryRenderer || contract.primaryRenderer === "status-only")) {
    primaryRendererFailures.push({
      elementId: element.elementId,
      renderer: contract.primaryRenderer ?? null,
    });
  }
  if (!populated && contract.primaryRenderer !== "status-only") {
    noDataRendererFailures.push({
      elementId: element.elementId,
      dataPresenceStatus: element.dataPresenceStatus,
      renderer: contract.primaryRenderer,
    });
  }
}
audit.check(
  "POPULATED_PRIMARY_RENDERER_COUNT",
  primaryRendererFailures.length === 0,
  primaryRendererFailures.length,
  0,
  primaryRendererFailures
);
audit.check(
  "NO_DATA_FAKE_CHART_COUNT",
  noDataRendererFailures.length === 0,
  noDataRendererFailures.length,
  0,
  noDataRendererFailures
);

const presentationMetadataFailures = [];
for (const element of catalog) {
  const recordCount = Number(element.observationCount || 0) + Number(element.entityCount || 0);
  if (recordCount <= 0) continue;
  const contract = contractById.get(element.elementId);
  const tableColumns = uniqueStrings(contract?.tableColumns);
  const tooltipFields = uniqueStrings(contract?.tooltipFields);
  const visibleFields = new Set([...tableColumns, ...tooltipFields]);
  const missing = [];
  if (!Array.isArray(element.sourceOrganizations) || element.sourceOrganizations.length === 0) {
    missing.push("source metadata");
  }
  if (element.latestYear === null || element.latestYear === undefined) {
    missing.push("latest year metadata");
  }
  if (Number(element.observationCount || 0) > 0) {
    if (!uniqueStrings(contract?.measures).length) missing.push("measures");
    if (!uniqueStrings(contract?.unitFamilies).length) missing.push("unitFamilies");
    for (const key of ["value", "unit", "year", "source"]) {
      if (!visibleFields.has(key)) missing.push(`visible:${key}`);
    }
    if (!visibleFields.has("measure") && !visibleFields.has("displayLabel")) {
      missing.push("visible:measure");
    }
  } else {
    if (!visibleFields.has("source")) missing.push("visible:source");
  }
  if (missing.length) presentationMetadataFailures.push({ elementId: element.elementId, missing });
}
audit.check(
  "SOURCE_YEAR_UNIT_PRESENTATION",
  presentationMetadataFailures.length === 0,
  presentationMetadataFailures.length,
  0,
  presentationMetadataFailures.slice(0, 100)
);

function jsonDownloadRecordCount(document) {
  if (!document || typeof document !== "object") return null;
  if (Array.isArray(document.records)) return document.records.length;
  if (Array.isArray(document.observations) || Array.isArray(document.entities)) {
    return (document.observations?.length || 0) + (document.entities?.length || 0);
  }
  return null;
}

const downloadFailures = [];
let downloadReferences = 0;
for (const element of catalog) {
  const assets = Array.isArray(element.downloadAssets) ? element.downloadAssets : [];
  if (!element.downloadAllowed && assets.length > 0) {
    downloadFailures.push({ elementId: element.elementId, error: "assets exposed when download disallowed" });
  }
  if (
    element.downloadAllowed &&
    Number(element.downloadableRecordCount || 0) > 0 &&
    assets.length === 0
  ) {
    downloadFailures.push({ elementId: element.elementId, error: "download assets missing" });
  }
  for (const asset of assets) {
    downloadReferences += 1;
    const path = publicUrlToPath(asset.url);
    if (!path || !existsSync(path) || !statSync(path).isFile()) {
      downloadFailures.push({ elementId: element.elementId, url: asset.url, error: "missing" });
      continue;
    }
    try {
      const text = readText(path);
      if (text.error || text.value === null || text.value.trimStart().startsWith("<!doctype")) {
        throw new Error(text.error || "HTML/empty response asset");
      }
      const format = String(asset.format || "").toUpperCase();
      let records = null;
      if (format === "JSON") records = jsonDownloadRecordCount(JSON.parse(text.value));
      if (format === "CSV") records = parseCsv(text.value).length;
      if (records === null) throw new Error("unsupported download format");
      if (records !== Number(asset.recordCount)) {
        throw new Error(`record count ${records} != ${asset.recordCount}`);
      }
      if (records !== Number(element.downloadableRecordCount)) {
        throw new Error(
          `record count ${records} != element ${element.downloadableRecordCount}`
        );
      }
    } catch (error) {
      downloadFailures.push({
        elementId: element.elementId,
        url: asset.url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
audit.check(
  "PUBLIC_DOWNLOAD_REFERENCES_VALID",
  downloadReferences > 0 && downloadFailures.length === 0,
  { checked: downloadReferences, failed: downloadFailures.length },
  { checked: "> 0", failed: 0 },
  downloadFailures.slice(0, 100)
);

const appSource = readText(resolve(PROJECT_ROOT, "src/App.tsx"));
const detailSource = readText(resolve(PROJECT_ROOT, "src/pages/CountryDataElementPage.tsx"));
const explorerSource = readText(resolve(PROJECT_ROOT, "src/pages/DataExplorerPage.tsx"));
const providerSource = readText(
  resolve(PROJECT_ROOT, "src/data/countries/vietnamCountryDataProviderV122.ts")
);
const finderStateSource = readText(
  resolve(PROJECT_ROOT, "src/types/dataFinderV125.ts")
);
const e012ComponentPath = resolve(
  PROJECT_ROOT,
  "src/components/data/semantic/OccupationEmploymentWagePreviewV125.tsx"
);
const e012Source = readText(e012ComponentPath);
const combinedNavigationSource = [
  appSource.value,
  detailSource.value,
  finderStateSource.value,
]
  .filter(Boolean)
  .join("\n");

const routeSourceChecks = {
  providerLoadsCatalog: /loadCatalog\s*\(/u.test(providerSource.value || ""),
  providerLoadsElement: /loadElementBundle/u.test(providerSource.value || ""),
  detailLoadsCountryElement: /loadCountryElementBundleV122/u.test(detailSource.value || ""),
  detailRendersV125: /V125|semantic/iu.test(detailSource.value || ""),
  appRestoresElement: /resolveCountryElementIdV122/u.test(appSource.value || ""),
};
audit.check(
  "DETAIL_ROUTE_SOURCE_CONTRACT",
  Object.values(routeSourceChecks).every(Boolean),
  routeSourceChecks,
  Object.fromEntries(Object.keys(routeSourceChecks).map((key) => [key, true]))
);

const urlStateChecks = {
  readsMeasure: /\.get\(["']measure["']\)/u.test(combinedNavigationSource),
  readsSex: /\.get\(["']sex["']\)/u.test(combinedNavigationSource),
  readsYear: /\.get\(["']year["']\)/u.test(combinedNavigationSource),
  readsPeriod: /\.get\(["']period["']\)/u.test(combinedNavigationSource),
  readsDynamicDimensions:
    /DIMENSION_PARAM_PREFIX_V125/u.test(finderStateSource.value || "") &&
    /params\.forEach/u.test(finderStateSource.value || ""),
  writesMeasure: /\.set\(["']measure["']/u.test(combinedNavigationSource),
  writesSex: /\.set\(["']sex["']/u.test(combinedNavigationSource),
  writesYear: /\.set\(["']year["']/u.test(combinedNavigationSource),
  writesPeriod: /\.set\(["']period["']/u.test(combinedNavigationSource),
  writesDynamicDimensions:
    /Object\.entries\(state\.dimensions\)/u.test(finderStateSource.value || "") &&
    /DIMENSION_PARAM_PREFIX_V125/u.test(finderStateSource.value || ""),
  browserHistory:
    /history\.(?:pushState|replaceState)/u.test(combinedNavigationSource) ||
    /history\s*\[[^\]]+\]/u.test(combinedNavigationSource),
  commonSelectionContract:
    /SemanticSelectionV125|DataFinderSelectionV125|DataFinderSelectorStateV125|VisualizationSelectionV125|E012VisualizationSelectionV125/u.test(
      combinedNavigationSource
    ),
  mapReceivesSelection:
    /onOpenMapElement[\s\S]{0,300}(?:selection|selector|measure|sex|year)/iu.test(
      combinedNavigationSource
    ),
};
audit.check(
  "URL_SELECTOR_RESTORATION_CONTRACT",
  Object.values(urlStateChecks).every(Boolean),
  urlStateChecks,
  Object.fromEntries(Object.keys(urlStateChecks).map((key) => [key, true]))
);

async function startFinderUrlStateHarnessV125() {
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end("<!doctype html><html><body>V125 URL state audit</body></html>");
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise((resolveClose) => server.close(resolveClose));
    throw new Error("finder URL state harness address unavailable");
  }
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

let urlStateBrowserResult = null;
let urlStateBrowserFailure = null;
let urlStateHarness = null;
let urlStateBrowser = null;
try {
  if (finderStateSource.error || !finderStateSource.value) {
    throw new Error(finderStateSource.error || "dataFinderV125 source unavailable");
  }
  const compiledStateModule = ts.transpileModule(finderStateSource.value, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: "dataFinderV125.ts",
    reportDiagnostics: true,
  });
  const transpileErrors = (compiledStateModule.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (transpileErrors.length > 0) {
    throw new Error(
      `dataFinderV125 transpile failed: ${transpileErrors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
        .join("; ")}`
    );
  }
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(
    compiledStateModule.outputText,
    "utf8"
  ).toString("base64")}`;
  urlStateHarness = await startFinderUrlStateHarnessV125();
  urlStateBrowser = await launchHeadlessBrowser();
  await navigate(urlStateBrowser.cdp, urlStateHarness.url);
  urlStateBrowserResult = await evaluateValue(
    urlStateBrowser.cdp,
    `(async () => {
      const api = await import(${JSON.stringify(moduleUrl)});
      const category = ${JSON.stringify("바이오매스발전(điện sinh khối)")};
      const decomposedCategory = category.normalize('NFD');
      const initialState = {
        measure: 'measure-05aa50767eb1',
        sex: 'total',
        year: 2031,
        period: '2031-2035',
        dimensions: {
          category: decomposedCategory,
          'region-code': 'VNM-01',
          scenario_path: 'SSP2-4.5',
          'bad.key': 'must-not-appear'
        }
      };
      const firstParams = new URLSearchParams('view=data&country=VNM&element=C-016');
      api.appendDataFinderSelectorParamsV125(firstParams, initialState);
      history.replaceState(null, '', '?' + firstParams.toString() + '#element-detail');
      const restored = api.parseDataFinderSelectorStateV125(
        new URLSearchParams(location.search)
      );

      const updatedState = {
        ...restored,
        period: '2025-2030',
        dimensions: {
          ...restored.dimensions,
          scenario_path: 'SSP1-2.6'
        }
      };
      const secondParams = new URLSearchParams('view=data&country=VNM&element=C-016');
      api.appendDataFinderSelectorParamsV125(secondParams, updatedState);
      history.replaceState(null, '', '?' + secondParams.toString() + '#element-detail');
      const roundTrip = api.parseDataFinderSelectorStateV125(
        new URLSearchParams(location.search)
      );
      return {
        restored,
        roundTrip,
        location: {
          search: location.search,
          hash: location.hash,
          period: new URLSearchParams(location.search).get('period'),
          category: new URLSearchParams(location.search).get('dim.category'),
          regionCode: new URLSearchParams(location.search).get('dim.region-code'),
          scenarioPath: new URLSearchParams(location.search).get('dim.scenario_path'),
          invalidDimension: new URLSearchParams(location.search).get('dim.bad.key')
        }
      };
    })()`
  );
  urlStateBrowserResult.runtimeErrorCount = urlStateBrowser.runtimeErrors.length;
  urlStateBrowserResult.runtimeErrors = urlStateBrowser.runtimeErrors.slice(0, 20);
} catch (error) {
  urlStateBrowserFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (urlStateBrowser) await urlStateBrowser.close();
  if (urlStateHarness) await urlStateHarness.close();
}

const expectedDynamicDimensions = {
  category: "바이오매스발전(điện sinh khối)",
  "region-code": "VNM-01",
  scenario_path: "SSP2-4.5",
};
const expectedUpdatedDimensions = {
  ...expectedDynamicDimensions,
  scenario_path: "SSP1-2.6",
};
const urlStateBrowserPass =
  urlStateBrowserFailure === null &&
  urlStateBrowserResult?.runtimeErrorCount === 0 &&
  urlStateBrowserResult?.restored?.measure === "measure-05aa50767eb1" &&
  urlStateBrowserResult?.restored?.sex === "total" &&
  urlStateBrowserResult?.restored?.year === 2031 &&
  urlStateBrowserResult?.restored?.period === "2031-2035" &&
  JSON.stringify(urlStateBrowserResult?.restored?.dimensions) ===
    JSON.stringify(expectedDynamicDimensions) &&
  urlStateBrowserResult?.roundTrip?.period === "2025-2030" &&
  JSON.stringify(urlStateBrowserResult?.roundTrip?.dimensions) ===
    JSON.stringify(expectedUpdatedDimensions) &&
  urlStateBrowserResult?.location?.hash === "#element-detail" &&
  urlStateBrowserResult?.location?.period === "2025-2030" &&
  urlStateBrowserResult?.location?.category === expectedDynamicDimensions.category &&
  urlStateBrowserResult?.location?.regionCode === "VNM-01" &&
  urlStateBrowserResult?.location?.scenarioPath === "SSP1-2.6" &&
  urlStateBrowserResult?.location?.invalidDimension === null;
audit.check(
  "URL_PERIOD_DYNAMIC_DIMENSION_BROWSER_ROUND_TRIP",
  urlStateBrowserPass,
  { failure: urlStateBrowserFailure, result: urlStateBrowserResult },
  {
    restoredPeriod: "2031-2035",
    updatedPeriod: "2025-2030",
    dynamicDimensions: expectedUpdatedDimensions,
    invalidDimension: null,
    hash: "#element-detail",
    runtimeErrorCount: 0,
  }
);

const finderCardChecks = {
  recordCount:
    /observationCount|entityCount|recordCount|레코드/u.test(explorerSource.value || ""),
  yearRange: /referenceYears|yearRange|기준연도/u.test(explorerSource.value || ""),
  measures: /measures|측정항목/u.test(explorerSource.value || ""),
  dimensions: /dimensions|분류 차원|분류차원/u.test(explorerSource.value || ""),
  spatial: /hasMapData|mapFeatureCount|공간/u.test(explorerSource.value || ""),
  download: /hasDownloadableData|downloadAllowed|다운로드/u.test(
    explorerSource.value || ""
  ),
};
audit.check(
  "DATA_FINDER_CARD_SEMANTIC_SUMMARY",
  Object.values(finderCardChecks).every(Boolean),
  finderCardChecks,
  Object.fromEntries(Object.keys(finderCardChecks).map((key) => [key, true]))
);

const e012DomMarkers = [
  "e012-semantic-preview",
  "e012-kpis",
  "e012-measure-select",
  "e012-sex-select",
  "e012-year-select",
  "e012-ranked-bars",
  "e012-employment-wage-scatter",
  "e012-sex-comparison",
  "e012-raw-table",
  "e012-wage-missing-notice",
];
const missingE012Markers = e012DomMarkers.filter(
  (marker) => !String(e012Source.value || "").includes(marker)
);
const e012AccessibilityChecks = {
  componentExists: e012Source.error === null,
  markers: missingE012Markers.length === 0,
  ariaLabels: /aria-label/u.test(e012Source.value || ""),
  keyboardPoints:
    /tabIndex=\{?0\}?/u.test(e012Source.value || "") &&
    /data-occupation/u.test(e012Source.value || ""),
  noTechnicalRecordIds: !/data-record-id/u.test(e012Source.value || ""),
  rawTableDefaultClosed: /data-testid="public-raw-table"/u.test(
    e012Source.value || ""
  ),
};
audit.check(
  "E012_DETAIL_DOM_CONTRACT",
  Object.values(e012AccessibilityChecks).every(Boolean),
  { ...e012AccessibilityChecks, missingMarkers: missingE012Markers },
  {
    componentExists: true,
    markers: true,
    ariaLabels: true,
    keyboardPoints: true,
    noTechnicalRecordIds: true,
    rawTableDefaultClosed: true,
    missingMarkers: [],
  }
);

const requiredQaIds = [
  "A-005",
  "A-010",
  "B-033",
  "B-034",
  "C-016",
  "C-019",
  "D-023",
  "E-007",
  "E-008",
  "E-012",
  "E-014",
  "E-018",
  "E-019",
  "E-020",
];
const missingQaContracts = requiredQaIds.filter((id) => !contractById.has(id));
audit.check(
  "REQUIRED_QA_ELEMENT_CONTRACTS",
  missingQaContracts.length === 0,
  requiredQaIds.length - missingQaContracts.length,
  requiredQaIds.length,
  missingQaContracts
);

const statusCounts = {};
for (const element of catalog) {
  statusCounts[element.publicStatus] = (statusCounts[element.publicStatus] || 0) + 1;
}
audit.finish({
  routeCount: catalog.length - routePayloadFailures.length,
  populatedRendererFailures: primaryRendererFailures.length,
  noDataFakeChartCount: noDataRendererFailures.length,
  downloadReferences,
  urlSelectorRestoration:
    Object.values(urlStateChecks).every(Boolean) ? "PASS" : "FAIL",
  statusCounts,
});
