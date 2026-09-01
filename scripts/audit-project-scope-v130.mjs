#!/usr/bin/env node

import {
  createAudit,
  loadElement,
  publicJson,
  reportJson,
} from "./lib/v130-spatial-audit-utils.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROJECT_ROOT } from "./lib/v130-spatial-audit-utils.mjs";

const { check, finish } = createAudit(
  "PROJECT_SCOPE_V130",
  "project-scope-audit-result-v130.json"
);
const d018 = loadElement("D-018").entities.records;
const d023 = loadElement("D-023").entities.records;
const c025 = loadElement("C-025").entities.records;
const projectAudit = reportJson("project-point-layers-audit-v130.json");
const regionalAsset = publicJson("spatial/projects/d-018-regional.geojson");
const mapIndex = publicJson("map-index.json");
const catalog = publicJson("catalog.json");
const semanticContracts = publicJson(
  "semantic/element-visualization-contracts-v125.json"
);
const d018Layer = mapIndex.layers.find((layer) => layer.elementId === "D-018");
const d023Catalog = catalog.elements.find((element) => element.elementId === "D-023");
const d023Contract = semanticContracts.contracts.find(
  (contract) => contract.elementId === "D-023"
);
const entityNameSource = [
  "src/utils/vietnamActualV121.ts",
  "src/data/visualization/publicEntityTitleV131.ts",
]
  .map((path) => readFileSync(resolve(PROJECT_ROOT, path), "utf8"))
  .join("\n");
const greater = d018.find((entity) =>
  String(entity.name || "").toLowerCase().includes("groundwater resources in the greater mekong subregion")
);
const regional = d018.filter(
  (entity) => entity.spatialScopeType === "multi-country-regional"
);
const regionalAsPoint = d018.filter(
  (entity) =>
    entity.spatialScopeType === "multi-country-regional" &&
    typeof entity.latitude === "number" &&
    typeof entity.longitude === "number"
);
const countryFakeSite = [...d018, ...d023, ...c025].filter(
  (entity) =>
    entity.mapEligible &&
    entity.spatialScopeType === "country" &&
    !["verified-physical-site", "verified-activity-site"].includes(
      entity.coordinateMeaning
    )
);
const visiblePoints = [...c025, ...d018, ...d023].filter(
  (entity) =>
    entity.mapEligible &&
    typeof entity.latitude === "number" &&
    typeof entity.longitude === "number"
);
const unknownVisiblePoints = visiblePoints.filter(
  (entity) => entity.coordinateMeaning === "unknown"
);
const greaterFeatures = regionalAsset.features.filter(
  (feature) => feature.properties?.recordId === greater?.recordId
);

check("D018_PROJECT_COUNT", d018.length === 4, d018.length, 4);
check("D018_REGIONAL_PROJECTS", regional.length === 2, regional.length, 2);
check(
  "D018_SPATIAL_PROJECT_JOIN",
  d018Layer?.join?.requiredCount === 2 &&
    d018Layer?.join?.matchedCount === 2 &&
    d018Layer?.featureCount === 4,
  { join: d018Layer?.join, featureCount: d018Layer?.featureCount },
  { requiredCount: 2, matchedCount: 2, featureCount: 4 }
);
check(
  "D018_NO_STALE_FILTER",
  Array.isArray(d018Layer?.filters) && d018Layer.filters.length === 0,
  d018Layer?.filters,
  []
);
check(
  "GREATER_MEKONG_SCOPE",
  greater?.spatialScopeType === "multi-country-regional" &&
    JSON.stringify(greater.scopeCountries) === JSON.stringify(["KHM", "LAO", "THA", "VNM"]),
  {
    scope: greater?.spatialScopeType,
    countries: greater?.scopeCountries,
  },
  { scope: "multi-country-regional", countries: ["KHM", "LAO", "THA", "VNM"] }
);
check(
  "GREATER_MEKONG_SOURCE_COORDINATE_COUNT",
  greater?.sourceCoordinateCount === 4,
  greater?.sourceCoordinateCount,
  4
);
check(
  "GREATER_MEKONG_DISPLAY_MODE",
  greater?.displayedCoordinateCount === 0 &&
    greaterFeatures.length === 1 &&
    greaterFeatures[0]?.geometry?.type === "MultiPolygon",
  {
    displayedCoordinates: greater?.displayedCoordinateCount,
    geometryTypes: greaterFeatures.map((feature) => feature.geometry?.type),
  },
  "one participating-country MultiPolygon; zero project-site points"
);
check("POINT_WITH_UNKNOWN_MEANING", unknownVisiblePoints.length === 0, unknownVisiblePoints.length, 0);
check("REGIONAL_PROJECT_AS_SINGLE_POINT", regionalAsPoint.length === 0, regionalAsPoint.length, 0);
check("COUNTRY_PROJECT_AS_FAKE_SITE", countryFakeSite.length === 0, countryFakeSite.length, 0);
check(
  "FIRST_COORDINATE_AS_PROJECT_LOCATION",
  [...d018, ...d023].filter(
    (entity) => entity.mapEligible && entity.coordinateMeaning === "first-source-coordinate"
  ).length === 0,
  [...d018, ...d023].filter(
    (entity) => entity.mapEligible && entity.coordinateMeaning === "first-source-coordinate"
  ).length,
  0
);
check(
  "D023_PANEL_ONLY",
  d023.filter((entity) => entity.mapEligible).length === 0 &&
    d023Catalog?.mapMode === "panel-only" &&
    d023Catalog?.mapFeatureCount === 0 &&
    d023Contract?.mapLinkage?.enabled === false &&
    d023Contract?.mapLinkage?.mapMode === "panel-only",
  {
    mapEligibleEntities: d023.filter((entity) => entity.mapEligible).length,
    catalogMapMode: d023Catalog?.mapMode,
    catalogMapFeatureCount: d023Catalog?.mapFeatureCount,
    semanticMapLinkage: d023Contract?.mapLinkage,
  },
  "entities disabled; catalog and semantic contract panel-only"
);
const c025VisibleNameFailures = c025.filter(
  (entity) =>
    entity.mapEligible &&
    (!String(entity.normalizedAttributes?.standard || "").trim() ||
      !String(entity.normalizedAttributes?.projectId || "").trim())
);
check(
  "C025_VISIBLE_PUBLIC_NAME",
  c025VisibleNameFailures.length === 0 &&
    /publicSourceIdentifierV131/u.test(entityNameSource) &&
    /standard[\s\S]{0,900}등록사업/u.test(entityNameSource) &&
    /projectId/u.test(entityNameSource) &&
    /publicEntityTitleV131/u.test(entityNameSource),
  c025VisibleNameFailures.length,
  0,
  c025VisibleNameFailures.slice(0, 10).map((entity) => entity.recordId)
);
const c025FalseReasons = projectAudit.records.filter(
  (row) =>
    row.elementId === "C-025" &&
    !row.mapEligible &&
    /검증된 원천 좌표/u.test(String(row.reason || ""))
);
check(
  "C025_NONSPATIAL_REASON_ACCURATE",
  c025FalseReasons.length === 0,
  c025FalseReasons.length,
  0
);
check(
  "ALL_PROJECT_RECORDS_CLASSIFIED",
  projectAudit.recordCount === c025.length + d018.length + d023.length &&
    projectAudit.records.every((row) => row.classification && row.finalMapDisposition),
  projectAudit.recordCount,
  c025.length + d018.length + d023.length
);
finish({
  d018ProjectCount: d018.length,
  d018RegionalProjectCount: regional.length,
  greaterMekongDisplayMode: "regional-scope",
});
