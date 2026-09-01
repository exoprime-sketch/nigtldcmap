#!/usr/bin/env node

import {
  createAudit,
  loadElement,
  PROJECT_ROOT,
  publicJson,
} from "./lib/v130-spatial-audit-utils.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const { check, finish } = createAudit(
  "MAP_SEMANTIC_GEOGRAPHY_V130",
  "map-semantic-geography-audit-result-v130.json"
);
const mapIndex = publicJson("map-index.json");
const geometryManifest = publicJson("geometry/geometry-manifest.json");
const d018Asset = publicJson("spatial/projects/d-018-regional.geojson");
const mapSource = readFileSync(
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
  "utf8"
);
const pointEntities = ["A-023", "B-048", "C-025"].flatMap((elementId) =>
  loadElement(elementId).entities.records.filter((entity) => entity.mapEligible)
);
const requiredLayerFields = [
  "spatialScopeType",
  "coordinateMeaning",
  "scopeCountries",
  "sourceCoordinateCount",
  "displayedCoordinateCount",
  "regionalProject",
  "aggregationLevel",
  "publicSpatialNotice",
];
const missingLayerFields = mapIndex.layers.flatMap((layer) =>
  requiredLayerFields
    .filter((field) => layer[field] === undefined || layer[field] === null)
    .map((field) => `${layer.elementId}:${field}`)
);
const pointMeaningFailures = pointEntities.filter(
  (entity) =>
    !entity.spatialSemanticsVerified ||
    !["verified-physical-site", "verified-activity-site"].includes(
      entity.coordinateMeaning
    )
);
const greaterFeatures = d018Asset.features.filter((feature) =>
  String(feature.properties?.projectTitle || "")
    .toLowerCase()
    .includes("groundwater resources in the greater mekong subregion")
);
const fakeGeometryCount =
  Number(mapIndex.layers.reduce((sum, layer) => sum + Number(layer.fakeGeometryCount || 0), 0)) +
  Number(geometryManifest.validation?.fakeGeometryCount || 0) +
  Number(d018Asset.metadata?.fakeGeometryCount || 0);
const zeroImputationCount = mapIndex.layers.reduce(
  (sum, layer) => sum + Number(layer.zeroImputationCount || 0),
  0
);
const transmissionLayer = mapIndex.layers.find(
  (layer) => layer.elementId === "A-024"
);

check("VISIBLE_FEATURE_WITHOUT_SPATIAL_SCOPE", missingLayerFields.length === 0, missingLayerFields.length, 0, missingLayerFields);
check("VISIBLE_POINT_SOURCE_EVIDENCE", pointMeaningFailures.length === 0, pointMeaningFailures.length, 0, pointMeaningFailures.slice(0, 20));
check(
  "TRANSMISSION_NETWORK_SPATIAL_MEANING",
  transmissionLayer?.spatialScopeType === "network" &&
    transmissionLayer?.coordinateMeaning === "verified-network-geometry" &&
    transmissionLayer?.sourceCoordinateCount === 6693 &&
    transmissionLayer?.displayedCoordinateCount === 6693,
  {
    spatialScopeType: transmissionLayer?.spatialScopeType,
    coordinateMeaning: transmissionLayer?.coordinateMeaning,
    sourceCoordinateCount: transmissionLayer?.sourceCoordinateCount,
    displayedCoordinateCount: transmissionLayer?.displayedCoordinateCount,
  },
  {
    spatialScopeType: "network",
    coordinateMeaning: "verified-network-geometry",
    sourceCoordinateCount: 6693,
    displayedCoordinateCount: 6693,
  }
);
check(
  "GREATER_MEKONG_NO_FALSE_POINT",
  greaterFeatures.length === 1 && greaterFeatures.every((feature) => feature.geometry?.type === "MultiPolygon"),
  greaterFeatures.map((feature) => feature.geometry?.type),
  ["MultiPolygon"]
);
check(
  "D018_REGIONAL_ASSET_CONTRACT",
  d018Asset.features.length === 4 &&
    d018Asset.features.filter((feature) => feature.properties?.geometryRole === "regional-scope").length === 2 &&
    d018Asset.features.filter((feature) => feature.properties?.geometryRole === "activity-site").length === 2,
  {
    total: d018Asset.features.length,
    scopes: d018Asset.features.filter((feature) => feature.properties?.geometryRole === "regional-scope").length,
    sites: d018Asset.features.filter((feature) => feature.properties?.geometryRole === "activity-site").length,
  },
  { total: 4, scopes: 2, sites: 2 }
);
const d018RoleMeaningFailures = d018Asset.features.filter((feature) => {
  const role = feature.properties?.geometryRole;
  const meaning = feature.properties?.coordinateMeaning;
  return (
    (role === "regional-scope" && meaning !== "project-country-scope") ||
    (role === "activity-site" && meaning !== "verified-activity-site")
  );
});
check(
  "D018_ROLE_MEANING",
  d018RoleMeaningFailures.length === 0,
  d018RoleMeaningFailures.length,
  0
);
const d018ManifestAsset = geometryManifest.assets?.find(
  (asset) => asset.elementId === "D-018"
);
check(
  "D018_SCOPE_PROVENANCE",
  Boolean(
    d018ManifestAsset?.source?.scopeBoundary &&
      d018ManifestAsset?.source?.projectEvidence &&
      d018ManifestAsset?.version &&
      d018ManifestAsset?.license &&
      d018ManifestAsset?.attribution
  ),
  d018ManifestAsset,
  "source/version/license/attribution"
);
const runtimeZeroCoercions = [
  /approvedAmount\s*\|\|\s*0/u,
  /participantCount\s*\|\|\s*0/u,
  /sourceCoordinateCount\s*\|\|\s*0/u,
  /displayedCoordinateCount\s*\|\|\s*0/u,
].filter((pattern) => pattern.test(mapSource));
check(
  "RUNTIME_MISSING_VALUE_NOT_ZERO",
  runtimeZeroCoercions.length === 0 && /optionalFiniteNumberV130/u.test(mapSource),
  runtimeZeroCoercions.map(String),
  []
);
check(
  "FALLBACK_REGIONAL_ROLE_COVERAGE",
  /regionalPoints/u.test(mapSource) &&
    /map-selectable-regional-activity/u.test(mapSource) &&
    /geometryRole\s*===\s*["']regional-scope["']/u.test(mapSource) &&
    /geometryRole\s*===\s*["']activity-site["']/u.test(mapSource),
  "runtime source",
  "scope and activity-site fallback renderers"
);
check("ZERO_IMPUTATION", zeroImputationCount === 0, zeroImputationCount, 0);
check("FAKE_GEOMETRY", fakeGeometryCount === 0, fakeGeometryCount, 0);
check(
  "D008_PUBLIC_TITLE_MATCHES_MAPPED_RECORDS",
  mapIndex.layers.find((layer) => layer.elementId === "D-008")?.publicShortTitle ===
    "성·시 기후변화 지출",
  mapIndex.layers.find((layer) => layer.elementId === "D-008")?.publicShortTitle,
  "성·시 기후변화 지출"
);
check(
  "FINAL_MAP_FEATURE_OR_SCOPE_COUNT",
  mapIndex.mapFeatureCount ===
    mapIndex.layers.reduce((sum, layer) => sum + Number(layer.featureCount || 0), 0),
  mapIndex.mapFeatureCount,
  mapIndex.layers.reduce((sum, layer) => sum + Number(layer.featureCount || 0), 0)
);
finish({
  visibleFeatureWithoutSpatialScope: missingLayerFields.length,
  zeroImputationCount,
  fakeGeometryCount,
});
