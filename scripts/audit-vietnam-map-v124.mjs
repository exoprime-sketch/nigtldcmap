#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const V2_ROOT = resolve(PROJECT_ROOT, "public/data/vietnam/v2");
const GEOMETRY_ROOT = resolve(V2_ROOT, "geometry");
const SPATIAL_LAYER_ROOT = resolve(V2_ROOT, "spatial/layers");

const PATHS = {
  manifest: resolve(V2_ROOT, "manifest.json"),
  mapIndex: resolve(V2_ROOT, "map-index.json"),
  integrity: resolve(V2_ROOT, "asset-integrity.json"),
  adm1: resolve(GEOMETRY_ROOT, "vnm-adm1-63.geojson"),
  aliases: resolve(GEOMETRY_ROOT, "vnm-adm1-aliases.json"),
  geometryManifest: resolve(GEOMETRY_ROOT, "geometry-manifest.json"),
  transmission: resolve(GEOMETRY_ROOT, "vnm-transmission-network.geojson"),
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

const FULL_ADM1_LAYER_IDS = ["B-031", "B-032", "B-033", "B-034"];
const PARTIAL_ADM1_LAYER_IDS = ["C-016", "D-008"];
const CHOROPLETH_LAYER_IDS = [
  "B-021",
  ...FULL_ADM1_LAYER_IDS,
  ...PARTIAL_ADM1_LAYER_IDS,
];
const EXPECTED_RENDERERS = {
  "A-023": new Set(["point", "cluster"]),
  "B-048": new Set(["point", "cluster"]),
  "C-025": new Set(["point", "cluster"]),
  "D-018": new Set(["point", "cluster"]),
  "D-023": new Set(["point", "cluster"]),
  "A-024": new Set(["line"]),
  "B-021": new Set(["admin1-choropleth", "region-choropleth", "choropleth"]),
  "B-031": new Set(["admin1-choropleth", "choropleth"]),
  "B-032": new Set(["admin1-choropleth", "choropleth"]),
  "B-033": new Set(["admin1-choropleth", "choropleth"]),
  "B-034": new Set(["admin1-choropleth", "choropleth"]),
  "C-016": new Set(["partial-choropleth", "admin1-choropleth", "choropleth"]),
  "D-008": new Set(["partial-choropleth", "admin1-choropleth", "choropleth"]),
};

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

function readJson(path) {
  if (!existsSync(path)) return { value: null, error: "missing" };
  try {
    const text = readFileSync(path, "utf8");
    if (/^\s*(?:<!doctype\s+html|<html)/iu.test(text)) {
      return { value: null, error: "HTML response body" };
    }
    return { value: JSON.parse(text), error: null };
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

function finiteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return undefined;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = finiteNumber(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function firstString(...values) {
  for (const value of values) {
    if (nonEmptyString(value)) return value.trim();
  }
  return undefined;
}

function visitObjects(value, callback, path = []) {
  if (!value || typeof value !== "object") return;
  callback(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitObjects(item, callback, [...path, index]));
    return;
  }
  Object.entries(value).forEach(([key, child]) =>
    visitObjects(child, callback, [...path, key])
  );
}

function namedValues(value, names) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const values = [];
  visitObjects(value, (node) => {
    if (Array.isArray(node)) return;
    Object.entries(node).forEach(([key, child]) => {
      if (wanted.has(key.toLowerCase())) values.push(child);
    });
  });
  return values;
}

function firstDeepString(value, names) {
  return namedValues(value, names).find(nonEmptyString);
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
  const prefix = `${publicRoot}${sep}`.toLowerCase();
  return path.toLowerCase().startsWith(prefix) ? path : null;
}

function collectLocalAssetUrls(value) {
  const urls = new Set();
  visitObjects(value, (node) => {
    if (Array.isArray(node)) return;
    Object.entries(node).forEach(([key, child]) => {
      if (
        /(?:url|path|asset|geometry|data)$/iu.test(key) &&
        nonEmptyString(child) &&
        child.startsWith("/data/")
      ) {
        urls.add(child);
      }
    });
  });
  return [...urls].sort((a, b) => a.localeCompare(b, "en"));
}

function normalizedIdentity(value) {
  return String(value ?? "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[’']/gu, "")
    .replace(/[._\-–—/()\s]+/gu, " ");
}

function featureCode(feature) {
  const properties = feature?.properties || {};
  return firstString(
    properties.adm1Code,
    properties.adm1_code,
    properties.provinceCode,
    properties.code,
    properties.shapeID,
    properties.GID_1,
    feature?.id
  );
}

function featureName(feature) {
  const properties = feature?.properties || {};
  return firstString(
    properties.canonicalName,
    properties.nameEn,
    properties.name,
    properties.NAME_1,
    properties.shapeName,
    properties.provinceName,
    properties.nameKo
  );
}

function allCoordinatesWithinVietnam(value) {
  let positionCount = 0;
  let invalidCount = 0;
  const visit = (node) => {
    if (!Array.isArray(node)) return;
    if (validPosition(node)) {
      positionCount += 1;
      // The verified ADM1 source includes Vietnam's offshore island polygons.
      if (node[0] < 100 || node[0] > 120 || node[1] < 5 || node[1] > 25) {
        invalidCount += 1;
      }
      return;
    }
    node.forEach(visit);
  };
  visit(value);
  return { positionCount, invalidCount };
}

function validPosition(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

function samePosition(left, right) {
  return validPosition(left) && validPosition(right) && left[0] === right[0] && left[1] === right[1];
}

function ringArea(ring) {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    sum +=
      ring[index][0] * ring[index + 1][1] -
      ring[index + 1][0] * ring[index][1];
  }
  return Math.abs(sum / 2);
}

function validateRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  if (!ring.every(validPosition)) return false;
  if (!samePosition(ring[0], ring[ring.length - 1])) return false;
  return ringArea(ring) > Number.EPSILON;
}

function validatePolygonCoordinates(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.every(validateRing)
  );
}

function validateAdm1Geometry(geometry) {
  if (!geometry || typeof geometry !== "object") return false;
  if (geometry.type === "Polygon") {
    return validatePolygonCoordinates(geometry.coordinates);
  }
  if (geometry.type === "MultiPolygon") {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length > 0 &&
      geometry.coordinates.every(validatePolygonCoordinates)
    );
  }
  return false;
}

function validateLineCoordinates(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    coordinates.every(validPosition)
  );
}

function validateLineGeometry(geometry) {
  if (!geometry || typeof geometry !== "object") return false;
  if (geometry.type === "LineString") {
    return validateLineCoordinates(geometry.coordinates);
  }
  if (geometry.type === "MultiLineString") {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length > 0 &&
      geometry.coordinates.every(validateLineCoordinates)
    );
  }
  return false;
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

function layerUrl(layer, kind) {
  const keyNames =
    kind === "geometry"
      ? ["geometryUrl", "geojsonUrl", "boundaryUrl"]
      : ["dataUrl", "valuesUrl", "joinDataUrl", "spatialDataUrl"];
  for (const key of keyNames) {
    const direct = layer?.[key];
    if (nonEmptyString(direct)) return direct;
    const spatial = layer?.spatialAsset?.[key];
    if (nonEmptyString(spatial)) return spatial;
    const asset = layer?.assetRef?.[key];
    if (nonEmptyString(asset)) return asset;
  }
  return undefined;
}

function spatialLayerDocument(elementId, layer) {
  const dataUrl = layerUrl(layer, "data");
  const resolved = resolvePublicAsset(dataUrl);
  if (resolved) return { ...readJson(resolved), path: resolved, url: dataUrl };
  const conventional = resolve(
    SPATIAL_LAYER_ROOT,
    `${elementId.toLowerCase()}.json`
  );
  return { ...readJson(conventional), path: conventional, url: null };
}

function coverageEntries(value) {
  const entries = [];
  const arrayKeys = new Set([
    "coveragebyselection",
    "selectioncoverage",
    "joincoverage",
    "selections",
  ]);
  visitObjects(value, (node, path) => {
    if (Array.isArray(node)) {
      const key = String(path[path.length - 1] ?? "").toLowerCase();
      if (arrayKeys.has(key)) {
        node.forEach((item) => {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            entries.push(item);
          }
        });
      }
      return;
    }
    const expected = firstNumber(
      node.expectedCount,
      node.requiredCount,
      node.expectedProvinceCount,
      node.totalProvinceCount,
      node.adm1FeatureCount
    );
    const matched = firstNumber(
      node.matchedCount,
      node.joinedCount,
      node.matchedProvinceCount,
      node.populatedProvinceCount
    );
    if (expected !== undefined && matched !== undefined) entries.push(node);
  });
  return [...new Set(entries)];
}

function normalizedCoverage(entry) {
  const expected = firstNumber(
    entry.expectedCount,
    entry.requiredCount,
    entry.expectedProvinceCount,
    entry.totalProvinceCount,
    entry.adm1FeatureCount
  );
  const matched = firstNumber(
    entry.matchedCount,
    entry.joinedCount,
    entry.matchedProvinceCount,
    entry.populatedProvinceCount
  );
  const missing = firstNumber(
    entry.missingCount,
    entry.missingProvinceCount,
    Array.isArray(entry.missingProvinceIds)
      ? entry.missingProvinceIds.length
      : undefined,
    Array.isArray(entry.missingProvinces) ? entry.missingProvinces.length : undefined
  );
  const failures = firstNumber(
    entry.failureCount,
    entry.joinFailureCount,
    Array.isArray(entry.failures) ? entry.failures.length : undefined,
    Array.isArray(entry.unmatched) ? entry.unmatched.length : undefined,
    0
  );
  return { expected, matched, missing, failures };
}

function regionMappings(value) {
  let best = [];
  visitObjects(value, (node, path) => {
    const key = String(path[path.length - 1] ?? "").toLowerCase();
    if (
      Array.isArray(node) &&
      ["regionmapping", "regionmappings", "regionprovincemapping", "regions"].includes(key) &&
      node.length > best.length
    ) {
      best = node;
    }
    if (
      !Array.isArray(node) &&
      node &&
      typeof node === "object" &&
      ["regionmapping", "regionmappings", "regionprovincemapping"].includes(key)
    ) {
      const converted = Object.entries(node).map(([region, provinces]) => ({
        region,
        provinces,
      }));
      if (converted.length > best.length) best = converted;
    }
  });
  return best;
}

function mappingProvinceValues(mapping) {
  const candidates = [
    mapping?.provinceIds,
    mapping?.provinceCodes,
    mapping?.adm1Codes,
    mapping?.provinces,
  ];
  const selected = candidates.find(Array.isArray);
  return (selected || [])
    .map((value) =>
      typeof value === "string"
        ? value
        : firstString(
            value?.adm1Code,
            value?.provinceCode,
            value?.code,
            value?.canonicalName,
            value?.name
          )
    )
    .filter(nonEmptyString);
}

function fakeGeometryFindings(value, label) {
  const findings = [];
  visitObjects(value, (node, path) => {
    if (Array.isArray(node)) return;
    const marker = firstNumber(node.fakeGeometryCount, node.syntheticGeometryCount);
    if (marker !== undefined && marker > 0) {
      findings.push({ label, path: path.join("."), count: marker });
    }
    if (
      node.fakeGeometry === true ||
      node.isSynthetic === true ||
      node.synthetic === true ||
      node.inventedGeometry === true ||
      node.centroidConnection === true ||
      /^(synthetic|invented|placeholder|centroid-connected)$/iu.test(
        String(node.geometryProvenance || "")
      )
    ) {
      findings.push({ label, path: path.join("."), marker: true });
    }
  });
  return findings;
}

function zeroImputationFindings(value, label) {
  const findings = [];
  visitObjects(value, (node, path) => {
    if (Array.isArray(node)) return;
    const count = firstNumber(node.zeroImputationCount, node.zeroFillCount);
    if (count !== undefined && count > 0) {
      findings.push({ label, path: path.join("."), count });
    }
    const imputed =
      node.imputed === true ||
      node.isImputed === true ||
      node.missingValueWasImputed === true;
    const valueNumber = firstNumber(node.value, node.numericValue, node.metricValue);
    if (
      (imputed && valueNumber === 0) ||
      node.missingValueWasZeroFilled === true ||
      /^(zero|zero-fill|zero-imputation)$/iu.test(String(node.imputationMethod || ""))
    ) {
      findings.push({ label, path: path.join("."), marker: true });
    }
  });
  return findings;
}

function sourceContract(value) {
  return {
    source: firstDeepString(value, [
      "sourceTitle",
      "sourceName",
      "sourceOrganization",
      "boundaryId",
      "source",
      "name",
    ]),
    sourceUrl: firstDeepString(value, [
      "sourceUrl",
      "sourceDatasetUrl",
      "sourceResourceUrl",
      "downloadUrl",
      "homepage",
    ]),
    version: firstDeepString(value, [
      "sourceVersion",
      "sourceCommit",
      "sourceBuildDate",
      "sourceDataUpdateDate",
      "version",
      "release",
      "sourceYear",
    ]) || firstNumber(...namedValues(value, ["sourceYear", "year"])),
    license: firstDeepString(value, [
      "license",
      "licenseCode",
      "licenseName",
      "sourceBoundaryLicense",
      "geoBoundariesDerivativeLicense",
    ]),
    attribution: firstDeepString(value, ["attribution", "attributionText", "credit"]),
  };
}

function integrityEntries(value) {
  if (!value || typeof value !== "object") return [];
  const entries = [];
  visitObjects(value, (node) => {
    if (Array.isArray(node)) return;
    const url = firstString(node.url, node.path, node.assetUrl);
    const sha256 = firstString(node.sha256, node.hash);
    if (url && /^[a-f0-9]{64}$/iu.test(sha256 || "")) {
      entries.push({ url, sha256: sha256.toLowerCase() });
    }
  });
  return entries;
}

const parsed = Object.fromEntries(
  Object.entries(PATHS).map(([key, path]) => [key, readJson(path)])
);

for (const [key, result] of Object.entries(parsed)) {
  addCheck(
    `JSON_${key.toUpperCase()}`,
    result.error === null,
    result.error || "valid JSON",
    "valid JSON",
    { path: PATHS[key] }
  );
}

const manifest = parsed.manifest.value;
const mapIndex = parsed.mapIndex.value;
const integrity = parsed.integrity.value;
const adm1 = parsed.adm1.value;
const aliases = parsed.aliases.value;
const geometryManifest = parsed.geometryManifest.value;
const transmission = parsed.transmission.value;
const layers = Array.isArray(mapIndex?.layers) ? mapIndex.layers : [];
const activeLayers = layers.filter(isActiveLayer);
const activeByElement = new Map(
  activeLayers.map((layer) => [String(layer.elementId), layer])
);

addCheck(
  "MAP_SCHEMA_VERSION",
  mapIndex?.schemaVersion === "v124" && manifest?.schemaVersion === "v124",
  { mapIndex: mapIndex?.schemaVersion, manifest: manifest?.schemaVersion },
  { mapIndex: "v124", manifest: "v124" }
);
addCheck(
  "ACTIVE_MAP_LAYERS",
  activeLayers.length >= 13,
  activeLayers.length,
  ">= 13",
  { elementIds: activeLayers.map((layer) => layer.elementId) }
);

const missingRequired = REQUIRED_LAYER_IDS.filter(
  (elementId) => !activeByElement.has(elementId)
);
addCheck(
  "REQUIRED_ACTIVE_MAP_LAYERS",
  missingRequired.length === 0,
  REQUIRED_LAYER_IDS.length - missingRequired.length,
  REQUIRED_LAYER_IDS.length,
  { missing: missingRequired }
);

const duplicateLayerIds = layers
  .map((layer) => layer.layerId)
  .filter((id, index, all) => id && all.indexOf(id) !== index);
const duplicateElementIds = layers
  .map((layer) => layer.elementId)
  .filter((id, index, all) => id && all.indexOf(id) !== index);
addCheck(
  "DUPLICATE_MAP_LAYER_COUNT",
  duplicateLayerIds.length === 0 && duplicateElementIds.length === 0,
  duplicateLayerIds.length + duplicateElementIds.length,
  0,
  { layerIds: duplicateLayerIds, elementIds: duplicateElementIds }
);

const rendererFailures = REQUIRED_LAYER_IDS.flatMap((elementId) => {
  const layer = activeByElement.get(elementId);
  if (!layer) return [{ elementId, actual: null }];
  const renderer = rendererOf(layer);
  return EXPECTED_RENDERERS[elementId].has(renderer)
    ? []
    : [{ elementId, actual: renderer }];
});
addCheck(
  "MAP_RENDERER_CONTRACTS",
  rendererFailures.length === 0,
  rendererFailures.length,
  0,
  rendererFailures
);

const requiredGroups = [
  "에너지·인프라",
  "산림·토지",
  "기후·위험",
  "물·자원",
  "국제사업·재원",
];
const actualGroups = new Set(
  activeLayers.map((layer) => layer.group || layer.category).filter(nonEmptyString)
);
const missingGroups = requiredGroups.filter((group) => !actualGroups.has(group));
addCheck(
  "MAP_LAYER_GROUPS",
  missingGroups.length === 0,
  requiredGroups.length - missingGroups.length,
  requiredGroups.length,
  { missing: missingGroups, actual: [...actualGroups] }
);

const adm1Features = Array.isArray(adm1?.features) ? adm1.features : [];
addCheck(
  "ADM1_FEATURE_COUNT",
  adm1?.type === "FeatureCollection" && adm1Features.length === 63,
  adm1Features.length,
  63
);

const invalidAdm1 = adm1Features
  .map((feature, index) => ({
    index,
    code: featureCode(feature),
    name: featureName(feature),
    type: feature?.geometry?.type,
    valid: validateAdm1Geometry(feature?.geometry),
  }))
  .filter((item) => !item.valid || !item.code || !item.name);
addCheck(
  "ADM1_GEOMETRY_VALIDITY",
  adm1Features.length === 63 && invalidAdm1.length === 0,
  invalidAdm1.length,
  0,
  invalidAdm1.slice(0, 20)
);

const adm1CoordinateBounds = allCoordinatesWithinVietnam(
  adm1Features.map((feature) => feature?.geometry?.coordinates)
);
const adm1BoundarySystemFailures = adm1Features.filter(
  (feature) => feature?.properties?.boundarySystem !== "pre-2025-63"
);
const manifestAdm1Validation = adm1?.metadata?.validation || {};
const manifestAdm1Valid =
  manifestAdm1Validation.featureCount === 63 &&
  manifestAdm1Validation.emptyGeometryCount === 0 &&
  manifestAdm1Validation.duplicateProvinceCount === 0 &&
  manifestAdm1Validation.invalidGeometryCount === 0 &&
  manifestAdm1Validation.fakeGeometryCount === 0 &&
  manifestAdm1Validation.geometryValidity === "pass";
addCheck(
  "ADM1_PRE_2025_BOUNDARY_CONTRACT",
  adm1BoundarySystemFailures.length === 0 &&
    adm1CoordinateBounds.positionCount > 0 &&
    adm1CoordinateBounds.invalidCount === 0 &&
    manifestAdm1Valid,
  {
    wrongBoundarySystem: adm1BoundarySystemFailures.length,
    coordinates: adm1CoordinateBounds.positionCount,
    outOfVietnamBounds: adm1CoordinateBounds.invalidCount,
    manifestValidation: manifestAdm1Valid,
  },
  {
    wrongBoundarySystem: 0,
    coordinates: "> 0",
    outOfVietnamBounds: 0,
    manifestValidation: true,
  }
);

const adm1Codes = adm1Features.map((feature) => normalizedIdentity(featureCode(feature)));
const adm1Names = adm1Features.map((feature) => normalizedIdentity(featureName(feature)));
const duplicateAdm1Codes = adm1Codes.filter(
  (value, index, all) => value && all.indexOf(value) !== index
);
const duplicateAdm1Names = adm1Names.filter(
  (value, index, all) => value && all.indexOf(value) !== index
);
addCheck(
  "ADM1_DUPLICATE_PROVINCE_COUNT",
  duplicateAdm1Codes.length === 0 && duplicateAdm1Names.length === 0,
  duplicateAdm1Codes.length + duplicateAdm1Names.length,
  0,
  { codes: duplicateAdm1Codes, names: duplicateAdm1Names }
);

const adm1Source = sourceContract({
  geojson: adm1?.metadata || adm1?.source || {},
  manifest: geometryManifest,
});
const adm1SourceMissing = Object.entries(adm1Source)
  .filter(([, value]) => value === undefined)
  .map(([key]) => key);
addCheck(
  "ADM1_SOURCE_LICENSE_ATTRIBUTION",
  adm1SourceMissing.length === 0,
  adm1SourceMissing.length,
  0,
  { missing: adm1SourceMissing, metadata: adm1Source }
);

const aliasSchemaValid =
  aliases &&
  typeof aliases === "object" &&
  !Array.isArray(aliases) &&
  (Array.isArray(aliases.canonicalProvinces) ||
    Array.isArray(aliases.aliases) ||
    (aliases.aliases && typeof aliases.aliases === "object") ||
    (aliases.aliasToCanonical && typeof aliases.aliasToCanonical === "object"));
const aliasEntries = Array.isArray(aliases?.aliases) ? aliases.aliases : [];
const aliasCodes = aliasEntries.map((entry) => normalizedIdentity(entry?.adm1Code));
const canonicalAdm1Codes = new Set(adm1Codes);
const invalidAliasCodes = aliasCodes.filter(
  (code) => !code || !canonicalAdm1Codes.has(code)
);
const duplicateAliasCodes = aliasCodes.filter(
  (code, index, all) => code && all.indexOf(code) !== index
);
const aliasCoverageValid =
  aliasEntries.length === 63 &&
  invalidAliasCodes.length === 0 &&
  duplicateAliasCodes.length === 0;
addCheck(
  "ADM1_ALIAS_SCHEMA",
  Boolean(aliasSchemaValid && aliasCoverageValid),
  {
    schema: Boolean(aliasSchemaValid),
    canonicalEntries: aliasEntries.length,
    invalidCodes: invalidAliasCodes.length,
    duplicateCodes: duplicateAliasCodes.length,
  },
  {
    schema: true,
    canonicalEntries: 63,
    invalidCodes: 0,
    duplicateCodes: 0,
  }
);

const transmissionFeatures = Array.isArray(transmission?.features)
  ? transmission.features
  : [];
const invalidLineFeatures = [];
const invalidLineProperties = [];
for (const [index, feature] of transmissionFeatures.entries()) {
  if (!validateLineGeometry(feature?.geometry)) {
    invalidLineFeatures.push({ index, type: feature?.geometry?.type });
  }
  const properties = feature?.properties || {};
  const missing = [];
  if (finiteNumber(properties.voltage) === undefined) missing.push("voltage");
  if (!nonEmptyString(properties.status)) missing.push("status");
  if (finiteNumber(properties.length) === undefined) missing.push("length");
  if (finiteNumber(properties.sourceYear) === undefined) missing.push("sourceYear");
  if (!nonEmptyString(properties.source)) missing.push("source");
  if (!nonEmptyString(properties.accuracyNotice)) missing.push("accuracyNotice");
  if (properties.geometryProvenance !== "source-provided-line") {
    missing.push("geometryProvenance=source-provided-line");
  }
  if (properties.isSynthetic !== false) missing.push("isSynthetic=false");
  if (missing.length > 0) invalidLineProperties.push({ index, missing });
}
const transmissionSource = sourceContract({
  geojson: transmission?.metadata || transmission || {},
  manifest: geometryManifest,
});
const missingTransmissionSource = Object.entries(transmissionSource)
  .filter(([, value]) => value === undefined)
  .map(([key]) => key);
const actualTransmission =
  transmission?.type === "FeatureCollection" &&
  transmissionFeatures.length > 0 &&
  invalidLineFeatures.length === 0 &&
  invalidLineProperties.length === 0 &&
  transmission?.metadata?.actualLineGeometry === true &&
  transmission?.metadata?.featureCount === transmissionFeatures.length &&
  transmission?.metadata?.emptyGeometryCount === 0 &&
  transmission?.metadata?.invalidGeometryCount === 0 &&
  transmission?.metadata?.duplicateGeometryCount === 0 &&
  transmission?.metadata?.fakeGeometryCount === 0;
addCheck(
  "A024_ACTUAL_LINE_GEOMETRY",
  actualTransmission,
  {
    features: transmissionFeatures.length,
    invalidGeometry: invalidLineFeatures.length,
    invalidProperties: invalidLineProperties.length,
  },
  { features: "> 0", invalidGeometry: 0, invalidProperties: 0 },
  {
    geometry: invalidLineFeatures.slice(0, 20),
    properties: invalidLineProperties.slice(0, 20),
  }
);
addCheck(
  "A024_SOURCE_LICENSE_ATTRIBUTION",
  missingTransmissionSource.length === 0,
  missingTransmissionSource.length,
  0,
  { missing: missingTransmissionSource, metadata: transmissionSource }
);

const a023Count = firstNumber(activeByElement.get("A-023")?.featureCount);
addCheck("A023_FEATURE_COUNT", a023Count === 1889, a023Count ?? null, 1889);

const layerDocuments = new Map();
for (const elementId of CHOROPLETH_LAYER_IDS) {
  const document = spatialLayerDocument(elementId, activeByElement.get(elementId));
  layerDocuments.set(elementId, document);
  addCheck(
    `SPATIAL_ASSET_${elementId.replace("-", "")}`,
    document.error === null &&
      document.value?.schemaVersion === "v124" &&
      document.value?.elementId === elementId,
    document.error || {
      schemaVersion: document.value?.schemaVersion,
      elementId: document.value?.elementId,
    },
    { schemaVersion: "v124", elementId },
    { path: document.path, url: document.url }
  );
}

const joinFailures = [];
for (const elementId of FULL_ADM1_LAYER_IDS) {
  const document = layerDocuments.get(elementId)?.value;
  const entries = coverageEntries({
    layer: activeByElement.get(elementId),
    data: document,
  }).map(normalizedCoverage);
  const failures = entries.filter(
    (entry) =>
      entry.expected !== 63 ||
      entry.matched !== 63 ||
      (entry.missing ?? 0) !== 0 ||
      (entry.failures ?? 0) !== 0
  );
  if (entries.length === 0 || failures.length > 0) {
    joinFailures.push({ elementId, entries, failures });
  }
  addCheck(
    `ADM1_JOIN_${elementId.replace("-", "")}`,
    entries.length > 0 && failures.length === 0,
    entries,
    "every selectable metric/year has 63/63 joins and 0 missing/failures"
  );
}

for (const elementId of PARTIAL_ADM1_LAYER_IDS) {
  const document = layerDocuments.get(elementId)?.value;
  const entries = coverageEntries({
    layer: activeByElement.get(elementId),
    data: document,
  }).map(normalizedCoverage);
  const failures = entries.filter(
    (entry) =>
      entry.expected !== 63 ||
      entry.matched === undefined ||
      entry.matched <= 0 ||
      entry.matched > 63 ||
      entry.missing !== 63 - entry.matched ||
      (entry.failures ?? 0) !== 0
  );
  if (entries.length === 0 || failures.length > 0) {
    joinFailures.push({ elementId, entries, failures });
  }
  addCheck(
    `ADM1_PARTIAL_JOIN_${elementId.replace("-", "")}`,
    entries.length > 0 && failures.length === 0,
    entries,
    "actual-value provinces only; explicit missing count; 0 failures"
  );
}

const b021Document = layerDocuments.get("B-021")?.value;
const mappings = regionMappings(b021Document);
const mappedProvinceValues = mappings.flatMap(mappingProvinceValues);
const normalizedMappedValues = mappedProvinceValues.map(normalizedIdentity);
const duplicateMappedProvinces = normalizedMappedValues.filter(
  (value, index, all) => value && all.indexOf(value) !== index
);
const canonicalValues = new Set([...adm1Codes, ...adm1Names]);
const unknownMappedProvinces = normalizedMappedValues.filter(
  (value) => !canonicalValues.has(value)
);
const b021MappingValid =
  mappings.length === 6 &&
  normalizedMappedValues.length === 63 &&
  duplicateMappedProvinces.length === 0 &&
  unknownMappedProvinces.length === 0;
if (!b021MappingValid) {
  joinFailures.push({
    elementId: "B-021",
    regions: mappings.length,
    provinces: normalizedMappedValues.length,
    duplicateMappedProvinces,
    unknownMappedProvinces,
  });
}
addCheck(
  "B021_EXPLICIT_REGION_MAPPING",
  b021MappingValid,
  {
    regions: mappings.length,
    provinces: normalizedMappedValues.length,
    duplicates: duplicateMappedProvinces.length,
    unknown: unknownMappedProvinces.length,
  },
  { regions: 6, provinces: 63, duplicates: 0, unknown: 0 }
);

addCheck(
  "ADM1_JOIN_FAILURES",
  joinFailures.length === 0,
  joinFailures.length,
  0,
  joinFailures
);

const selectorFailures = [
  ["B-033", ["year", "period"]],
  ["B-034", ["metric", "variable", "indicator"]],
  ["C-016", ["technology", "variable", "metric"]],
  ["D-008", ["year", "period", "variable", "metric"]],
].flatMap(([elementId, terms]) => {
  const value = JSON.stringify({
    layer: activeByElement.get(elementId),
    data: layerDocuments.get(elementId)?.value,
  }).toLowerCase();
  return terms.some((term) => value.includes(term))
    ? []
    : [{ elementId, expectedAny: terms }];
});
addCheck(
  "MAP_SELECTOR_CONTRACTS",
  selectorFailures.length === 0,
  selectorFailures.length,
  0,
  selectorFailures
);

const metadataFailures = REQUIRED_LAYER_IDS.flatMap((elementId) => {
  const layer = activeByElement.get(elementId);
  if (!layer) return [{ elementId, missing: ["layer"] }];
  const missing = [];
  if (!layer.legend || !nonEmptyString(layer.legend.title)) missing.push("legend");
  if (
    !Array.isArray(layer.sourceOrganizations) ||
    !layer.sourceOrganizations.some(nonEmptyString)
  ) {
    missing.push("sourceOrganizations");
  }
  if (
    !firstDeepString(layer, ["license", "licenseCode", "licenseName"]) &&
    !Array.isArray(layer.licenses)
  ) {
    missing.push("license");
  }
  if (!firstString(layer.accuracyNotice, layer.spatialAccuracyNotice, layer.coverageNote)) {
    missing.push("accuracyNotice");
  }
  if (!firstString(layer.detailUrl, layer.detailPath)) missing.push("detailUrl");
  if (
    layer.downloadStatus === undefined &&
    layer.downloadable === undefined &&
    layer.downloadableRecordCount === undefined
  ) {
    missing.push("downloadStatus");
  }
  return missing.length > 0 ? [{ elementId, missing }] : [];
});
addCheck(
  "MAP_LAYER_METADATA_CONTRACTS",
  metadataFailures.length === 0,
  metadataFailures.length,
  0,
  metadataFailures
);

const allDocumentsForQuality = [
  ["map-index", mapIndex],
  ["geometry-manifest", geometryManifest],
  ["adm1", adm1],
  ["transmission", transmission],
  ...[...layerDocuments.entries()].map(([elementId, document]) => [
    elementId,
    document.value,
  ]),
];
const fakeFindings = allDocumentsForQuality.flatMap(([label, value]) =>
  fakeGeometryFindings(value, label)
);
const zeroFindings = allDocumentsForQuality.flatMap(([label, value]) =>
  zeroImputationFindings(value, label)
);
addCheck(
  "FAKE_GEOMETRY_COUNT",
  fakeFindings.length === 0,
  fakeFindings.length,
  0,
  fakeFindings.slice(0, 50)
);
addCheck(
  "ZERO_IMPUTATION_COUNT",
  zeroFindings.length === 0,
  zeroFindings.length,
  0,
  zeroFindings.slice(0, 50)
);

const localAssetUrls = new Set([
  "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
  "/data/vietnam/v2/geometry/vnm-adm1-aliases.json",
  "/data/vietnam/v2/geometry/geometry-manifest.json",
  "/data/vietnam/v2/geometry/vnm-transmission-network.geojson",
  ...collectLocalAssetUrls(mapIndex),
  ...collectLocalAssetUrls(geometryManifest),
]);
const brokenAssets = [...localAssetUrls].flatMap((url) => {
  const path = resolvePublicAsset(url);
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    return [{ url, error: "missing" }];
  }
  const parsedAsset = readJson(path);
  return parsedAsset.error ? [{ url, error: parsedAsset.error }] : [];
});
addCheck(
  "MAP_ASSET_PATHS",
  brokenAssets.length === 0,
  { checked: localAssetUrls.size, broken: brokenAssets.length },
  { checked: ">= 4", broken: 0 },
  brokenAssets
);

const integrityByUrl = new Map(
  integrityEntries(integrity).map((entry) => [entry.url, entry.sha256])
);
const integrityFailures = [...localAssetUrls].flatMap((url) => {
  const path = resolvePublicAsset(url);
  const expectedHash = integrityByUrl.get(url);
  if (!path || !existsSync(path)) return [{ url, error: "missing" }];
  if (!expectedHash) return [{ url, error: "not registered" }];
  const actualHash = createHash("sha256")
    .update(readFileSync(path))
    .digest("hex");
  return actualHash === expectedHash
    ? []
    : [{ url, expectedHash, actualHash }];
});
addCheck(
  "MAP_ASSET_INTEGRITY",
  localAssetUrls.size >= 4 && integrityFailures.length === 0,
  { checked: localAssetUrls.size, failed: integrityFailures.length },
  { checked: ">= 4", failed: 0 },
  integrityFailures
);

const mapFeatureCount = activeLayers.reduce(
  (sum, layer) => sum + (firstNumber(layer.featureCount) || 0),
  0
);
addCheck(
  "MAP_FEATURE_COUNT",
  mapFeatureCount > 0 && manifest?.mapFeatureCount === mapFeatureCount,
  { calculated: mapFeatureCount, manifest: manifest?.mapFeatureCount ?? null },
  { calculated: "> 0", manifest: "= calculated" }
);
addCheck(
  "MANIFEST_MAP_LAYER_COUNT",
  manifest?.mapLayerCount === activeLayers.length,
  manifest?.mapLayerCount ?? null,
  activeLayers.length
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
    mapFeatureCount,
    adm1FeatureCount: adm1Features.length,
    transmissionFeatureCount: transmissionFeatures.length,
    adm1JoinFailures: joinFailures.length,
    fakeGeometryCount: fakeFindings.length,
    zeroImputationCount: zeroFindings.length,
    failedChecks: failed.map((check) => check.name),
  })
);
process.exitCode = failed.length === 0 ? 0 : 1;
