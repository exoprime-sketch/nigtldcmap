/**
 * Lightweight legacy map-runtime contracts.
 *
 * Keeping these constants outside the MapLibre page prevents the startup QA
 * bundle from pulling the complete renderer into the initial application
 * chunk. The page re-exports them for older imports, while release QA imports
 * this dependency-free module directly.
 */
export const MAP_LAYER_IDS_RUNTIME_V115 = [
  "v115-country-fill",
  "v115-country-outline",
  "v115-country-selected",
  "v115-focus-fill",
  "v115-focus-bubble",
  "v115-focus-line",
  "v115-focus-raster",
  "v115-focus-outline",
  "v115-point-clusters",
  "v115-point-cluster-count",
  "v115-point-unclustered",
  "v115-tna-bubbles",
  "v115-ctcn-bubbles",
  "v115-gcf-bubbles",
  "v115-af-bubbles",
  "v115-climate-fund-bubbles",
  "v115-mdb-bubbles",
] as const;

export const MAP_SOURCE_IDS_RUNTIME_V115 = [
  "v115-country-source",
  "v115-aggregate-source",
  "v115-focus-source",
  "v115-point-source",
] as const;

export const MAP_RUNTIME_POLICY_V115 = {
  mapInstance: "single-instance",
  syntheticDefaultVisible: false,
  syntheticCatalogAvailableByDefault: false,
  syntheticActivation: "disabled-on-vietnam-actual-route",
  syntheticQueryRequired: false,
  inventedActualCoordinates: false,
  actualAndSyntheticMixing: false,
  basePolygonMaxActive: 1,
  rasterMaxActive: 1,
  nullToZero: false,
  multiCountryEqualAllocation: false,
  financeConceptAggregation: false,
  automaticTechnologyInference: false,
} as const;

export const MAP_LAYER_IDS_RUNTIME_V116 = [
  ...MAP_LAYER_IDS_RUNTIME_V115,
  "v116-demand-bubble",
  "v116-demand-label",
  "v116-oda-halo",
  "v116-regional-fill",
  "v116-regional-outline",
  "v116-regional-selected",
] as const;

export const MAP_SOURCE_IDS_RUNTIME_V116 = [
  ...MAP_SOURCE_IDS_RUNTIME_V115,
  "v116-regional-source",
] as const;

export const MAP_RUNTIME_POLICY_V116 = {
  mapInstance: "single-instance",
  visualEncodingSingleMeaning: true,
  bubbleAreaProportional: true,
  syntheticRegionalValuesNeverActual: true,
  nationalToRegionalFabrication: false,
  subnationalBoundaryProvider: "actual-source-only",
  basePolygonMaxActive: 1,
  rasterMaxActive: 1,
  regionalActualOverridesCountry: true,
  zoomDependentAutomaticDrilldown: "actual-only",
  nullToZero: false,
  multiCountryEqualAllocation: false,
  financeConceptAggregation: false,
  automaticTechnologyInference: false,
  inventedActualCoordinates: false,
  actualAndSyntheticMixing: false,
} as const;
