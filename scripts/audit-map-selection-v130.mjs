#!/usr/bin/env node

import {
  createAudit,
  publicJson,
  reportJson,
} from "./lib/v130-spatial-audit-utils.mjs";

const { check, finish } = createAudit(
  "MAP_SELECTION_V130",
  "map-selection-audit-result-v130.json"
);
const manifest = publicJson("manifest.json");
const mapIndex = publicJson("map-index.json");
const inventory = reportJson("map-selection-152-v130.json");
const rows = inventory.elements || [];
const requiredFields = [
  "elementId",
  "publicTitle",
  "mapSelected",
  "currentMapLayer",
  "spatialDataExists",
  "geometryType",
  "spatialScopeType",
  "coordinateMeaning",
  "aggregationLevel",
  "sourceSpatialUnit",
  "targetSpatialUnit",
  "spatialSemanticsVerified",
  "mapBenefit",
  "exclusionReason",
  "finalMapDisposition",
];
const scopeTypes = new Set([
  "facility-site",
  "project-site",
  "multi-site",
  "admin1",
  "region",
  "country",
  "multi-country-regional",
  "network",
  "raster",
  "unknown",
]);
const meanings = new Set([
  "verified-physical-site",
  "verified-activity-site",
  "verified-network-geometry",
  "source-region-value",
  "project-country-scope",
  "first-source-coordinate",
  "representative-coordinate",
  "centroid",
  "unknown",
]);
const dispositions = new Set([
  "point",
  "multi-point",
  "line",
  "admin1",
  "regional-scope",
  "panel-only",
  "excluded",
]);

check("FRAMEWORK_ELEMENTS", manifest.frameworkElements === 152, manifest.frameworkElements, 152);
check("ACCOUNTED_ELEMENTS", manifest.accountedElements === 152, manifest.accountedElements, 152);
check("MAP_SELECTION_INVENTORY_ROWS", rows.length === 152, rows.length, 152);
check(
  "MAP_SELECTED_ELEMENTS",
  rows.filter((row) => row.mapSelected).length === mapIndex.activeMapLayerCount,
  rows.filter((row) => row.mapSelected).length,
  mapIndex.activeMapLayerCount
);
check(
  "MAP_SELECTION_EXPLAINED",
  rows.every((row) => row.mapSelected || String(row.exclusionReason || "").trim()),
  `${rows.filter((row) => row.mapSelected || String(row.exclusionReason || "").trim()).length}/152`,
  "152/152"
);
const missingFields = rows.flatMap((row) =>
  requiredFields
    .filter((field) => row[field] === undefined || row[field] === null)
    .map((field) => `${row.elementId}:${field}`)
);
check("INVENTORY_REQUIRED_FIELDS", missingFields.length === 0, missingFields.length, 0, missingFields);
const enumFailures = rows.filter(
  (row) =>
    !scopeTypes.has(row.spatialScopeType) ||
    !meanings.has(row.coordinateMeaning) ||
    !dispositions.has(row.finalMapDisposition)
);
check("INVENTORY_ENUM_VALUES", enumFailures.length === 0, enumFailures.length, 0, enumFailures);
check(
  "SELECTED_SEMANTICS_VERIFIED",
  rows.filter((row) => row.mapSelected && !row.spatialSemanticsVerified).length === 0,
  rows.filter((row) => row.mapSelected && !row.spatialSemanticsVerified).length,
  0
);
check(
  "FINAL_MAP_COUNTS_RECONCILED",
  manifest.mapLayerCount === mapIndex.activeMapLayerCount &&
    manifest.mapFeatureCount === mapIndex.mapFeatureCount,
  {
    manifestLayers: manifest.mapLayerCount,
    indexLayers: mapIndex.activeMapLayerCount,
    manifestFeatures: manifest.mapFeatureCount,
    indexFeatures: mapIndex.mapFeatureCount,
  },
  "manifest = map-index"
);
check(
  "REGIONAL_PROJECT_ASSET_DECLARED",
  manifest.assets?.regionalProjectGeometry ===
    "/data/vietnam/v2/spatial/projects/d-018-regional.geojson",
  manifest.assets?.regionalProjectGeometry,
  "/data/vietnam/v2/spatial/projects/d-018-regional.geojson"
);
finish({
  mapSelectedElements: mapIndex.activeMapLayerCount,
  mapFeatureOrScopeCount: mapIndex.mapFeatureCount,
});
