import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import type {
  GeoJSONSource,
  MapLayerMouseEvent,
  Popup as MapLibrePopup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  loadCountryElementEntitiesV122,
  loadCountryMapIndexV122,
  publicCountryDataErrorMessageV122,
} from "../data/countries/countryDataFacadeV122";
import {
  getCountryDataProviderV122,
  hasCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "../data/countries/countryDataProviderRegistryV122";
import type {
  CountryEntityV122,
  CountryMapLayerV122,
} from "../data/countries/countryDataTypesV122";
import {
  loadVietnamSpatialGeoJsonV124,
  loadVietnamSpatialLayerV124,
} from "../data/vietnam/vietnamDataLoaderV124";
import type {
  VietnamMapGeoJsonV124,
} from "../data/vietnam/vietnamDataLoaderV124";
import type {
  VietnamSpatialLayerAssetV124,
} from "../data/vietnam/vietnamTypesV124";
import type { DataFinderSelectorStateV125 } from "../types/dataFinderV125";
import {
  dataFinderSelectorFromMapV125,
  mapPeriodSelectorLabelV125,
  mapVariableSelectorLabelV125,
  resolveMapSelectorBindingV125,
  resolveMapSemanticPresentationV125,
  semanticDimensionValueLabelV125,
} from "../data/visualization/mapSelectorBindingsV125";
import { getElementVisualizationSummaryV125 } from "../data/visualization/elementVisualizationRegistryV125";
import {
  PUBLIC_MAP_SPATIAL_TYPE_COPY_V126,
  PUBLIC_MAP_WORKSPACE_LIMITS_V126,
  PUBLIC_MAP_WORKSPACE_PRESETS_V126,
  createPublicMapWorkspaceStateV126,
  isPublicMapWorkspacePresetIdV126,
  publicMapAccuracyNoticeV126,
  publicMapLayerCopyV126,
  publicMapLayerTitleV126,
} from "../data/visualization/publicMapWorkspaceV126";
import type { PublicMapWorkspacePresetIdV126 } from "../data/visualization/publicMapWorkspaceV126";
import { formatPublicNumberV126 } from "../data/visualization/publicNumberFormatV126";
import { publicTextV126 } from "../data/visualization/publicFieldPolicyV126";
import { resolvePublicEntityTitleV131 } from "../data/visualization/publicEntityTitleV131";
import {
  getPublicIndicatorInterpretationV129,
  getPublicIndicatorVariablePresentationV129,
} from "../data/interpretation/publicIndicatorInterpretationV129";
import { loadWorldCountryBoundaries } from "../data/map/worldCountryBoundaries";
import type { WorldCountryBoundaryGeometry } from "../data/map/worldCountryBoundaries";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import type { MapViewState } from "../types/map";
import {
  fieldLabelV121,
  formatValueV121,
  isHttpUrlV121,
} from "../utils/vietnamActualV121";
import { publicAssetUrlV128 } from "../utils/publicAssetUrlV128";
import MapPanelSeparatorV129 from "../components/map/MapPanelSeparatorV129";
import MapDataGuideV130 from "../components/map/MapDataGuideV130";
import { useResizableMapPanelsV129 } from "../hooks/useResizableMapPanelsV129";
import "../styles/country-data-platform-v122.css";
import "../styles/map-layout-v129.css";

interface RealMapExplorerPageProps {
  onOpenElement: (
    elementId: string,
    countryIso3: string,
    selectorState?: DataFinderSelectorStateV125
  ) => void;
  onOpenCountry: (iso3: string) => void;
  onOpenDataFinder: () => void;
  onOpenDownload: (
    elementId: string | null,
    countryIso3: string | null
  ) => void;
  initialState: MapViewState;
  onStateChange: (state: MapViewState) => void;
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

type LoadStatus = "idle" | "loading" | "ready" | "error";

const MAP_STYLE: any = {
  version: 8,
  sources: {
    "country-boundaries": {
      type: "geojson",
      data: publicAssetUrlV128("data/world-countries.geojson"),
      attribution: "Natural Earth · 로컬 국가 경계",
    },
  },
  layers: [
    {
      id: "cdp-base-background",
      type: "background",
      paint: { "background-color": "#e7efeb" },
    },
    {
      id: "cdp-country-fill",
      type: "fill",
      source: "country-boundaries",
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "cdp-country-outline",
      type: "line",
      source: "country-boundaries",
      paint: {
        "line-color": "#587168",
        "line-width": 1.1,
        "line-opacity": 0.82,
      },
    },
  ],
};

const LAYER_COLORS: Record<string, string> = {
  "A-023": "#176a4b",
  "A-024": "#c94f37",
  "B-021": "#7a4ca5",
  "B-031": "#2c7a43",
  "B-032": "#4b9a5d",
  "B-033": "#d17832",
  "B-034": "#315b50",
  "B-048": "#855b20",
  "C-016": "#d39c19",
  "C-025": "#7053a3",
  "D-008": "#287e91",
  "D-018": "#226f96",
  "D-023": "#b05e2e",
};

const A023_FUEL_COLORS_V126: Record<string, string> = {
  "가스": "#377eb8",
  "가스·석유": "#4f6f8f",
  "바이오매스": "#5a9d55",
  "석유": "#6b7280",
  "석탄": "#3f3f46",
  "수력": "#2f8fc1",
  "태양광": "#e8a317",
  "폐기물": "#8c6bb1",
  "풍력": "#27a5a5",
  "(미표기)": "#8a9a93",
};

const VIETNAM_SOURCE_REGION_LABELS_V126: Record<string, string> = {
  "Central Highlands": "중부고원",
  "Mekong River Delta": "메콩강 삼각주",
  "North Central Coast and South Central Coast": "북중부·남중부 해안",
  "North East, North West": "동북부·서북부",
  "Red River Delta": "홍강 삼각주",
  "South East": "동남부",
};

function publicVietnamSourceRegionV126(value: string | undefined): string {
  if (!value) return "미표기 권역";
  return VIETNAM_SOURCE_REGION_LABELS_V126[value] || publicTextV126(value) || "미표기 권역";
}

const VNM_ADM1_GEOMETRY_URL_V126 =
  publicAssetUrlV128("data/vietnam/v2/geometry/vnm-adm1-63.geojson");
const VNM_ADM1_BASE_SOURCE_V126 = "cdp-vietnam-adm1-reference";
const VNM_ADM1_BASE_OUTLINE_V126 = "cdp-vietnam-adm1-reference-outline";

const FALLBACK_VIEWBOX_WIDTH = 1000;
const FALLBACK_VIEWBOX_HEIGHT = 700;
const SPATIAL_VALUE_SERIES_CACHE_V125 = new WeakMap<
  VietnamSpatialLayerAssetV124,
  Map<string, VietnamSpatialLayerAssetV124["values"]>
>();

type FallbackBounds = readonly [
  readonly [number, number],
  readonly [number, number]
];

function isLngLatCoordinate(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function projectFallbackCoordinate(
  coordinate: readonly [number, number],
  bounds: FallbackBounds
): { x: number; y: number } {
  const [[west, south], [east, north]] = bounds;
  const width = Math.max(east - west, Number.EPSILON);
  const height = Math.max(north - south, Number.EPSILON);
  return {
    x: ((coordinate[0] - west) / width) * FALLBACK_VIEWBOX_WIDTH,
    y: ((north - coordinate[1]) / height) * FALLBACK_VIEWBOX_HEIGHT,
  };
}

function fallbackRingToPath(
  ring: unknown,
  bounds: FallbackBounds
): string {
  if (!Array.isArray(ring)) return "";
  const coordinates = ring.filter(isLngLatCoordinate);
  if (coordinates.length < 3) return "";
  return `${coordinates
    .map((coordinate, index) => {
      const { x, y } = projectFallbackCoordinate(coordinate, bounds);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ")} Z`;
}

function geometryToFallbackPath(
  geometry: WorldCountryBoundaryGeometry | { type: string; coordinates: unknown },
  bounds: FallbackBounds
): string {
  if (!Array.isArray(geometry.coordinates)) return "";
  const polygons: unknown[] =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates;
  return polygons
    .flatMap((polygon) => (Array.isArray(polygon) ? polygon : []))
    .map((ring) => fallbackRingToPath(ring, bounds))
    .filter(Boolean)
    .join(" ");
}

function geometryToFallbackLinePath(
  geometry: { type: string; coordinates: unknown },
  bounds: FallbackBounds
): string {
  if (!Array.isArray(geometry.coordinates)) return "";
  const lines: unknown[] =
    geometry.type === "LineString"
      ? [geometry.coordinates]
      : geometry.type === "MultiLineString"
      ? geometry.coordinates
      : [];
  return lines
    .map((line) => {
      if (!Array.isArray(line)) return "";
      const coordinates = line.filter(isLngLatCoordinate);
      if (coordinates.length < 2) return "";
      return coordinates
        .map((coordinate, index) => {
          const { x, y } = projectFallbackCoordinate(coordinate, bounds);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ");
    })
    .filter(Boolean)
    .join(" ");
}

function rendererOf(layer: CountryMapLayerV122) {
  return layer.renderer || (layer.cluster ? "cluster" : "point");
}

function publicMapCoverageTextV126(layer: CountryMapLayerV122): string {
  if (layer.elementId === "A-023") return "발전소 위치 1,889개";
  if (layer.elementId === "A-024") return "송전망 구간 606개";
  const safe = publicTextV126(layer.spatialCoverage) || "";
  if (!safe) return "공개 위치자료 범위";
  return safe
    .replace(/출처 좌표가 있는\s*([\d,]+)개\s*피처/gu, "위치자료 $1건")
    .replace(/([\d,]+)개\s*피처/gu, "위치자료 $1건")
    .replace(/피처/gu, "위치자료");
}

function isExternalSpatialLayer(layer: CountryMapLayerV122): boolean {
  return [
    "line",
    "admin1-choropleth",
    "partial-choropleth",
    "regional-scope",
  ].includes(
    rendererOf(layer)
  );
}

function optionalFiniteNumberV130(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function colorForValue(
  value: number,
  minimum: number,
  maximum: number,
  endColor = "#106f4e"
): string {
  const ratio = maximum === minimum ? 0.62 : (value - minimum) / (maximum - minimum);
  const clamped = Math.max(0, Math.min(1, ratio));
  const start = [230, 242, 234];
  const normalizedEnd = endColor.replace(/^#/u, "");
  const end = [0, 2, 4].map((offset) =>
    Number.parseInt(normalizedEnd.slice(offset, offset + 2), 16)
  );
  const channels = start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * clamped)
  );
  return `rgb(${channels.join(",")})`;
}

// Compatibility re-exports for legacy consumers. Release QA imports the
// dependency-free module directly so MapLibre remains outside the entry chunk.
export {
  MAP_LAYER_IDS_RUNTIME_V115,
  MAP_LAYER_IDS_RUNTIME_V116,
  MAP_RUNTIME_POLICY_V115,
  MAP_RUNTIME_POLICY_V116,
  MAP_SOURCE_IDS_RUNTIME_V115,
  MAP_SOURCE_IDS_RUNTIME_V116,
} from "../data/map/mapRuntimeContractsV116";

interface LayerHandlers {
  interactiveLayerId: string;
  additionalInteractiveLayerId?: string;
  clusterLayerId?: string;
  onClick: (event: MapLayerMouseEvent) => void;
  onEnter: (event: MapLayerMouseEvent) => void;
  onMove?: (event: MapLayerMouseEvent) => void;
  onPointLeave: () => void;
  onClusterClick?: (event: MapLayerMouseEvent) => void;
  onClusterEnter?: (event: MapLayerMouseEvent) => void;
  onClusterMove?: (event: MapLayerMouseEvent) => void;
  onClusterLeave?: () => void;
}

interface SpatialRuntimeAsset {
  geometry: VietnamMapGeoJsonV124;
  data?: VietnamSpatialLayerAssetV124;
}

interface SpatialSelection {
  elementId: string;
  adm1Code?: string;
  adm1Name: string;
  value?: number | null;
  unit?: string | null;
  period?: string;
  variableLabel?: string;
  selectionKey?: string;
  properties: Record<string, unknown>;
}

type PublicMapLayerRoleV129 = "primary" | "context";

type PublicMapSymbolShapeV129 =
  | "area"
  | "circle"
  | "diamond"
  | "line"
  | "square";

interface PublicMapLegendIdentityV129 {
  color: string;
  elementId: string;
  role: PublicMapLayerRoleV129;
  shape: PublicMapSymbolShapeV129;
  title: string;
  unit: string;
  variable: string;
}

interface KeyboardMapFeatureV129 {
  elementId: string;
  label: string;
  record?: CountryEntityV122;
  role: PublicMapLayerRoleV129;
  spatial?: SpatialSelection;
}

interface FallbackMapTooltipV129 {
  detail: string;
  leftPercent: number;
  title: string;
  topPercent: number;
}

interface PublicMapSummaryRowV126 {
  label: string;
  value: string;
  derived?: boolean;
}

interface LayerSelectorState {
  variable: string;
  period: string;
}

function runtimeKey(countryIso3: string, elementId: string): string {
  return `${countryIso3}:${elementId}`;
}

function layerRuntimeIds(countryIso3: string, elementId: string) {
  const suffix = `${countryIso3}-${elementId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return {
    source: `v122-source-${suffix}`,
    point: `v122-point-${suffix}`,
    pointHit: `v126-point-hit-${suffix}`,
    pointSelection: `v130-point-selection-${suffix}`,
    cluster: `v122-cluster-${suffix}`,
    clusterCount: `v126-cluster-count-${suffix}`,
    pointSymbol: `v129-point-symbol-${suffix}`,
    line: `v124-line-${suffix}`,
    lineHit: `v126-line-hit-${suffix}`,
    fill: `v124-fill-${suffix}`,
    outline: `v124-outline-${suffix}`,
    selection: `v126-selection-${suffix}`,
  };
}

function moveMapDataLayersV126(
  map: MapLibreMap,
  countryIso3: string,
  orderedElementIds: string[]
): void {
  orderedElementIds.forEach((elementId) => {
    const ids = layerRuntimeIds(countryIso3, elementId);
    [
      ids.fill,
      ids.outline,
      ids.cluster,
      ids.clusterCount,
      ids.point,
      ids.pointSymbol,
      ids.pointSelection,
      ids.line,
      ids.pointHit,
      ids.lineHit,
      ids.selection,
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) map.moveLayer(layerId);
    });
  });
}

function isTopmostActiveFeatureV129(
  map: MapLibreMap,
  point: MapLayerMouseEvent["point"],
  countryIso3: string,
  activeElementIds: string[],
  elementId: string
): boolean {
  const ownerByLayer = new Map<string, string>();
  const candidates = activeElementIds.flatMap((activeElementId) => {
    const ids = layerRuntimeIds(countryIso3, activeElementId);
    const interactiveLayerId = [ids.pointHit, ids.lineHit, ids.fill].find((id) =>
      Boolean(map.getLayer(id))
    );
    return [interactiveLayerId, map.getLayer(ids.cluster) ? ids.cluster : null].filter(
      (id): id is string => Boolean(id)
    ).filter((id) => {
      if (!map.getLayer(id)) return false;
      ownerByLayer.set(id, activeElementId);
      return true;
    });
  });
  if (!candidates.length) return true;
  const topFeature = map.queryRenderedFeatures(point, { layers: candidates })[0];
  if (!topFeature) return true;
  return ownerByLayer.get(topFeature.layer.id) === elementId;
}

function selectorForLayer(
  layer: CountryMapLayerV122,
  selected: LayerSelectorState | undefined
): LayerSelectorState {
  const variable =
    selected?.variable || layer.selectors?.defaultVariable || "locations";
  const option = layer.selectors?.variables.find((row) => row.key === variable);
  const periods = option?.periods || layer.selectors?.periods || [];
  const requestedPeriod = selected?.period || layer.selectors?.defaultPeriod;
  return {
    variable,
    period:
      requestedPeriod && periods.includes(requestedPeriod)
        ? requestedPeriod
        : periods[periods.length - 1] || "미표기",
  };
}

function selectorForLayerFromSharedSelectionV125(
  layer: CountryMapLayerV122,
  shared: DataFinderSelectorStateV125
): LayerSelectorState {
  const binding = resolveMapSelectorBindingV125(
    layer.elementId,
    shared,
    layer.selectors
  );
  const variable =
    binding.variable &&
    layer.selectors.variables.some((option) => option.key === binding.variable)
      ? binding.variable
      : layer.selectors.defaultVariable;
  return selectorForLayer(layer, {
    variable,
    period:
      binding.period || layer.selectors.defaultPeriod,
  });
}

function sharedSelectorKeyV125(
  selection: DataFinderSelectorStateV125
): string {
  return JSON.stringify({
    measure: selection.measure,
    sex: selection.sex,
    year: selection.year,
    period: selection.period,
    dimensions: Object.entries(selection.dimensions).sort(([left], [right]) =>
      left.localeCompare(right)
    ),
  });
}

function choroplethFeatureCollection(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  selector: LayerSelectorState
): {
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  minimum: number;
  maximum: number;
} {
  const values = asset.data
    ? spatialValuesForSelectorV125(asset.data, selector)
    : [];
  const valueByCode = new Map(values.map((row) => [row.adm1Code, row]));
  const numericValues = values.map((row) => row.value).filter(Number.isFinite);
  const minimum = numericValues.length ? Math.min(...numericValues) : 0;
  const maximum = numericValues.length ? Math.max(...numericValues) : 1;
  return {
    minimum,
    maximum,
    collection: {
      type: "FeatureCollection",
      features: asset.geometry.features.map((feature) => {
        const adm1Code = String(feature.properties?.adm1Code || "");
        const value = valueByCode.get(adm1Code);
        return {
          type: "Feature" as const,
          id: adm1Code,
          geometry: feature.geometry as GeoJSON.Geometry,
          properties: {
            ...feature.properties,
            elementId: layer.elementId,
            adm1Code,
            adm1Name: value?.adm1Name || feature.properties?.name || adm1Code,
            value: value?.value ?? null,
            hasValue: Boolean(value),
            unit: value?.unit || "",
            period: selector.period,
            variable: selector.variable,
            variableLabel:
              value?.variableLabel ||
              layer.selectors.variables.find((row) => row.key === selector.variable)
                ?.label ||
              layer.publicShortTitle,
            sourceRegion: value?.sourceRegion || "",
            sourceSpatialUnit: value?.sourceSpatialUnit || "admin1",
            selectionKey: adm1Code,
          },
        };
      }),
    },
  };
}

function spatialValuesForSelectorV125(
  data: VietnamSpatialLayerAssetV124,
  selector: LayerSelectorState
): VietnamSpatialLayerAssetV124["values"] {
  let index = SPATIAL_VALUE_SERIES_CACHE_V125.get(data);
  if (!index) {
    index = new Map();
    data.values.forEach((row) => {
      const key = `${row.variable}\u0000${row.period}`;
      const records = index!.get(key);
      if (records) records.push(row);
      else index!.set(key, [row]);
    });
    SPATIAL_VALUE_SERIES_CACHE_V125.set(data, index);
  }
  return index.get(`${selector.variable}\u0000${selector.period}`) || [];
}

function lineFeatureCollection(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  selector: LayerSelectorState,
  filters: Record<string, string>
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  const features = asset.geometry.features.filter((feature) => {
    if (
      selector.variable !== "all" &&
      String(feature.properties?.voltageKv || feature.properties?.voltage) !==
        selector.variable
    ) {
      return false;
    }
    return layer.filters.every((filter) => {
      if (filter.field === "voltageKv") return true;
      const selected = filters[`${layer.elementId}:${filter.field}`] || "all";
      return (
        selected === "all" ||
        String(feature.properties?.[filter.field] ?? "") === selected
      );
    });
  });
  return {
    type: "FeatureCollection",
    features: features.map((feature, index) => ({
      type: "Feature" as const,
      id: feature.id ?? index,
      properties: {
        ...feature.properties,
        elementId: layer.elementId,
        selectionKey: String(feature.id ?? index),
      },
      geometry: feature.geometry as GeoJSON.Geometry,
    })),
  };
}

function featureCollection(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: records
      .filter(
        (
          record
        ): record is CountryEntityV122 & {
          latitude: number;
          longitude: number;
        } =>
          record.mapEligible &&
          typeof record.latitude === "number" &&
          typeof record.longitude === "number"
      )
      .map((record) => {
        const attrs = record.normalizedAttributes || {};
        const titleResolution = resolvePublicMapEntityTitleV131(record, layer);
        const properties: Record<string, string | number | boolean | null> = {
          recordId: record.recordId,
          elementId: record.elementId,
          countryIso3: layer.countryIso3,
          name: titleResolution.title,
          nameNote: titleResolution.secondaryNote,
          entityType: record.entityType,
          referenceYear:
            record.provenance.referenceYear || layer.latestYear || null,
          sourceOrg: record.provenance.sourceOrg || null,
          selectionKey: record.recordId,
        };
        layer.tooltipFields.forEach((field) => {
          const value = field === "name" ? properties.name : attrs[field];
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[field] = value as string | number | boolean;
          }
        });
        layer.filters.forEach((filter) => {
          const value = attrs[filter.field];
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[filter.field] = value as string | number | boolean;
          }
        });
        return {
          type: "Feature" as const,
          id: record.recordId,
          geometry: {
            type: "Point" as const,
            coordinates: [record.longitude, record.latitude],
          },
          properties,
        };
      }),
  };
}

function filterRecords(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122,
  filters: Record<string, string>
): CountryEntityV122[] {
  return records.filter((record) =>
    layer.filters.every((filter) => {
      const selected = filters[`${layer.elementId}:${filter.field}`] || "all";
      if (selected === "all") return true;
      const value = record.normalizedAttributes?.[filter.field];
      return String(value ?? "") === selected;
    })
  );
}

function selectedFilterDimensionsV125(
  layer: CountryMapLayerV122,
  filters: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    layer.filters.flatMap((filter) => {
      if (filter.field === "voltageKv") return [];
      const selected = filters[`${layer.elementId}:${filter.field}`] || "all";
      return selected === "all" ? [] : [[filter.field, selected]];
    })
  );
}

function medianV126(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function countByPublicFieldV126(
  rows: CountryEntityV122[],
  field: string,
  fallback = "미표기"
): Array<[string, number]> {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const raw = row.normalizedAttributes?.[field];
    const label = publicTextV126(raw) || fallback;
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries()).sort(
    ([leftLabel, leftCount], [rightLabel, rightCount]) =>
      rightCount - leftCount || leftLabel.localeCompare(rightLabel, "ko")
  );
}

function publicMapFeatureNameV126(value: unknown, fallback: string): string {
  return publicTextV126(value) || fallback;
}

function publicMapEntityTitleV131(
  entity: CountryEntityV122,
  layer: CountryMapLayerV122
): string {
  return resolvePublicMapEntityTitleV131(entity, layer).title;
}

function resolvePublicMapEntityTitleV131(
  entity: CountryEntityV122,
  layer: CountryMapLayerV122
) {
  const elementTitle = publicMapLayerTitleV126(
    layer.elementId,
    layer.publicShortTitle
  );
  return resolvePublicEntityTitleV131(entity, { elementTitle });
}

function publicTransmissionSegmentTitleV131(
  properties: Record<string, unknown>
): string {
  const voltage = publicTextV126(
    properties.voltageKv ?? properties.voltage
  );
  return voltage ? `${voltage} kV 송전선로` : "송전망 구간";
}

function publicMapSymbolShapeV129(
  layer: CountryMapLayerV122
): PublicMapSymbolShapeV129 {
  const renderer = rendererOf(layer);
  if (renderer === "line") return "line";
  if (
    renderer === "admin1-choropleth" ||
    renderer === "partial-choropleth" ||
    renderer === "regional-scope"
  ) {
    return "area";
  }
  if (["B-048", "D-018"].includes(layer.elementId)) return "diamond";
  if (["C-025", "D-023"].includes(layer.elementId)) return "square";
  return "circle";
}

function createPublicMapPopupContentV129(
  title: string,
  lines: string[]
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "cdp-map-public-popup";
  const heading = document.createElement("strong");
  heading.textContent = title;
  root.appendChild(heading);
  lines.filter(Boolean).slice(0, 3).forEach((line) => {
    const row = document.createElement("span");
    row.textContent = line;
    root.appendChild(row);
  });
  return root;
}

function ensurePublicPointSymbolImageV129(
  map: MapLibreMap,
  imageId: string,
  shape: PublicMapSymbolShapeV129,
  color: string
): void {
  if (shape === "circle" || map.hasImage(imageId)) return;
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, size, size);
  context.fillStyle = color;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2.4;
  context.beginPath();
  if (shape === "diamond") {
    context.moveTo(size / 2, 2);
    context.lineTo(size - 2, size / 2);
    context.lineTo(size / 2, size - 2);
    context.lineTo(2, size / 2);
  } else {
    context.rect(3, 3, size - 6, size - 6);
  }
  context.closePath();
  context.fill();
  context.stroke();
  map.addImage(imageId, context.getImageData(0, 0, size, size), {
    pixelRatio: 2,
  });
}

function resolveInitialCountry(initialCountryIso3: string | null): string {
  const requested = initialCountryIso3?.toUpperCase() || "";
  if (requested) return requested;
  return listCountryDataProvidersV122()[0]?.countryIso3 || "";
}

function sameStringArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export default function RealMapExplorerPage({
  onOpenElement,
  onOpenCountry,
  onOpenDataFinder,
  onOpenDownload,
  initialState,
  onStateChange,
  selectorState: sharedSelectorState,
  onSelectorStateChange,
}: RealMapExplorerPageProps) {
  const sharedSelectorKey = sharedSelectorKeyV125(sharedSelectorState);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const popupOwnerRef = useRef<string | null>(null);
  const handlersRef = useRef<Record<string, LayerHandlers>>({});
  const mountedKeysRef = useRef<Set<string>>(new Set());
  const renderSignaturesRef = useRef<Record<string, string>>({});
  const recordIndexRef = useRef<Map<string, CountryEntityV122>>(new Map());
  const loadControllersRef = useRef<Map<string, AbortController>>(new Map());
  const [countryIso3, setCountryIso3] = useState(() =>
    resolveInitialCountry(initialState.countryIso3)
  );
  const [baseMapStatus, setBaseMapStatus] = useState<LoadStatus>("loading");
  const [fallbackBoundaryStatus, setFallbackBoundaryStatus] =
    useState<LoadStatus>("loading");
  const [fallbackBoundaryPath, setFallbackBoundaryPath] = useState("");
  const [mapIndexStatus, setMapIndexStatus] = useState<LoadStatus>("idle");
  const [mapIndexError, setMapIndexError] = useState("");
  const [mapIndexReloadNonce, setMapIndexReloadNonce] = useState(0);
  const [externalStateHydrated, setExternalStateHydrated] = useState(false);
  const [layers, setLayers] = useState<CountryMapLayerV122[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>(() => {
    const primary =
      initialState.primaryLayerId || initialState.focusLayerKey || null;
    if (!primary) return [];
    const contexts = (
      initialState.contextLayerIds.length
        ? initialState.contextLayerIds
        : initialState.activeLayerKeys.filter((id) => id !== primary)
    )
      .filter((id) => id !== primary)
      .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers);
    return [primary, ...contexts];
  });
  const [focusId, setFocusId] = useState<string | null>(
    () =>
      initialState.primaryLayerId ||
      initialState.focusLayerKey ||
      initialState.activeLayerKeys[initialState.activeLayerKeys.length - 1] ||
      null
  );
  const [recordsByElement, setRecordsByElement] = useState<
    Record<string, CountryEntityV122[]>
  >({});
  const [spatialByElement, setSpatialByElement] = useState<
    Record<string, SpatialRuntimeAsset>
  >({});
  const [selectorByElement, setSelectorByElement] = useState<
    Record<string, LayerSelectorState>
  >({});
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<CountryEntityV122 | null>(null);
  const [selectedSpatial, setSelectedSpatial] =
    useState<SpatialSelection | null>(null);
  const [keyboardFeatureIndexV129, setKeyboardFeatureIndexV129] = useState(0);
  const [selectedPresetId, setSelectedPresetId] =
    useState<PublicMapWorkspacePresetIdV126 | null>(() =>
      isPublicMapWorkspacePresetIdV126(initialState.mapPresetId)
        ? initialState.mapPresetId
        : null
    );
  const [roleNotice, setRoleNotice] = useState("");
  const [fallbackTooltipV129, setFallbackTooltipV129] =
    useState<FallbackMapTooltipV129 | null>(null);
  const [adm1OutlineStatus, setAdm1OutlineStatus] =
    useState<LoadStatus>("idle");
  const [adm1Boundary, setAdm1Boundary] =
    useState<VietnamMapGeoJsonV124 | null>(null);
  const [layerPanelOpen, setLayerPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 768
  );
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(true);
  const resizeMapAfterPanelChangeV129 = useCallback(() => {
    mapRef.current?.resize();
  }, []);
  const resizablePanelsV129 = useResizableMapPanelsV129({
    leftPanelOpen: layerPanelOpen,
    rightPanelOpen: analysisPanelOpen,
    onMapResize: resizeMapAfterPanelChangeV129,
  });

  const primaryLayerId =
    focusId && activeIds.includes(focusId) ? focusId : null;
  const contextLayerIds = useMemo(
    () =>
      activeIds
        .filter((id) => id !== primaryLayerId)
        .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers),
    [activeIds, primaryLayerId]
  );
  const renderOrderedActiveIds = useMemo(
    () => {
      const ids = [
        ...contextLayerIds,
        ...(primaryLayerId ? [primaryLayerId] : []),
      ];
      const visualRank = (elementId: string) => {
        const layer = layers.find((item) => item.elementId === elementId);
        const renderer = layer ? rendererOf(layer) : "point";
        const isArea =
          renderer === "admin1-choropleth" ||
          renderer === "partial-choropleth" ||
          renderer === "regional-scope";
        const isPrimary = elementId === primaryLayerId;
        if (isArea) return isPrimary ? 0 : 1;
        return isPrimary ? 3 : 2;
      };
      return ids.sort((left, right) => visualRank(left) - visualRank(right));
    },
    [contextLayerIds, layers, primaryLayerId]
  );

  const provider = getCountryDataProviderV122(countryIso3);
  const fallbackBounds: FallbackBounds = provider?.mapView.bounds || [
    [-180, -85],
    [180, 85],
  ];

  const fallbackPoints = useMemo(() => {
    const points: Array<{
      color: string;
      elementId: string;
      record: CountryEntityV122;
      x: number;
      y: number;
    }> = [];
    if (baseMapStatus === "ready") return points;
    renderOrderedActiveIds.forEach((elementId) => {
      (recordsByElement[elementId] || []).forEach((record) => {
        if (
          !record.mapEligible ||
          typeof record.longitude !== "number" ||
          typeof record.latitude !== "number"
        ) {
          return;
        }
        const position = projectFallbackCoordinate(
          [record.longitude, record.latitude],
          fallbackBounds
        );
        points.push({
          color: LAYER_COLORS[elementId] || "#176a4b",
          elementId,
          record,
          ...position,
        });
      });
    });
    return points;
  }, [baseMapStatus, fallbackBounds, recordsByElement, renderOrderedActiveIds]);

  const fallbackSpatial = useMemo(() => {
    const fills: Array<{
      adm1Code: string;
      elementId: string;
      fill: string;
      name: string;
      path: string;
      period: string;
      properties: Record<string, unknown>;
      sourceRegion: string;
      sourceSpatialUnit: string;
      value: number | null;
      unit: string;
      variable: string;
    }> = [];
    const lines: Array<{
      color: string;
      elementId: string;
      featureCount: number;
      path: string;
      period: string;
      variable: string;
    }> = [];
    const regionalPoints: Array<{
      color: string;
      elementId: string;
      name: string;
      period: string;
      properties: Record<string, unknown>;
      selectionKey: string;
      variable: string;
      x: number;
      y: number;
    }> = [];
    if (baseMapStatus === "ready") return { fills, lines, regionalPoints };
    renderOrderedActiveIds.forEach((elementId) => {
      const layer = layers.find((item) => item.elementId === elementId);
      const asset = spatialByElement[elementId];
      if (!layer || !asset) return;
      const selector = selectorForLayer(layer, selectorByElement[elementId]);
      if (rendererOf(layer) === "line") {
        const collection = lineFeatureCollection(layer, asset, selector, filters);
        const path = collection.features
          .map((feature) =>
            geometryToFallbackLinePath(
              feature.geometry as { type: string; coordinates: unknown },
              fallbackBounds
            )
          )
          .filter(Boolean)
          .join(" ");
        if (path) {
          lines.push({
            color: LAYER_COLORS[elementId] || "#b64d36",
            elementId,
            featureCount: collection.features.length,
            path,
            period: selector.period,
            variable: selector.variable,
          });
        }
        return;
      }
      if (rendererOf(layer) === "regional-scope") {
        asset.geometry.features.forEach((feature, featureIndex) => {
            const properties = feature.properties || {};
            if (
              properties.geometryRole === "activity-site" &&
              feature.geometry?.type === "Point"
            ) {
              const coordinates = feature.geometry.coordinates as number[];
              if (
                coordinates.length >= 2 &&
                Number.isFinite(coordinates[0]) &&
                Number.isFinite(coordinates[1])
              ) {
                regionalPoints.push({
                  color: LAYER_COLORS[elementId] || "#226f96",
                  elementId,
                  name: publicMapFeatureNameV126(
                    properties.activitySiteLabel || properties.name,
                    "세부 활동지역"
                  ),
                  period: selector.period,
                  properties: properties as Record<string, unknown>,
                  selectionKey: String(
                    properties.selectionKey || feature.id || featureIndex
                  ),
                  variable: selector.variable,
                  ...projectFallbackCoordinate(
                    [coordinates[0], coordinates[1]],
                    fallbackBounds
                  ),
                });
              }
              return;
            }
            if (properties.geometryRole !== "regional-scope") return;
            const path = geometryToFallbackPath(
              feature.geometry as { type: string; coordinates: unknown },
              fallbackBounds
            );
            if (!path) return;
            fills.push({
              adm1Code: String(
                properties.selectionKey || feature.id || featureIndex
              ),
              elementId,
              fill: LAYER_COLORS[elementId] || "#226f96",
              name: publicMapFeatureNameV126(
                properties.projectTitle || properties.name,
                "지역 협력사업"
              ),
              path,
              period: selector.period,
              properties: properties as Record<string, unknown>,
              sourceRegion: "",
              sourceSpatialUnit: "multi-country-regional",
              value: optionalFiniteNumberV130(properties.approvedAmount),
              unit: "USD",
              variable: selector.variable,
            });
          });
        return;
      }
      const result = choroplethFeatureCollection(layer, asset, selector);
      result.collection.features.forEach((feature) => {
        const properties = feature.properties || {};
        const value =
          typeof properties.value === "number" ? properties.value : null;
        const path = geometryToFallbackPath(
          feature.geometry as { type: string; coordinates: unknown },
          fallbackBounds
        );
        if (!path) return;
        fills.push({
          adm1Code: String(properties.adm1Code || ""),
          elementId,
          fill:
            value === null
              ? "rgba(0, 0, 0, 0)"
              : colorForValue(
                  value,
                  result.minimum,
                  result.maximum,
                  LAYER_COLORS[elementId] || "#106f4e"
                ),
          name: String(properties.adm1Name || properties.name || ""),
          path,
          period: selector.period,
          properties: properties as Record<string, unknown>,
          sourceRegion: String(properties.sourceRegion || ""),
          sourceSpatialUnit: String(properties.sourceSpatialUnit || "admin1"),
          value,
          unit: String(properties.unit || ""),
          variable: selector.variable,
        });
      });
    });
    return { fills, lines, regionalPoints };
  }, [
    baseMapStatus,
    fallbackBounds,
    filters,
    layers,
    renderOrderedActiveIds,
    selectorByElement,
    spatialByElement,
  ]);

  const fallbackAdm1Paths = useMemo(
    () =>
      (adm1Boundary?.features || [])
        .map((feature) => ({
          code: String(feature.properties?.adm1Code || feature.id || ""),
          name: publicMapFeatureNameV126(
            feature.properties?.name,
            "성·시"
          ),
          path: geometryToFallbackPath(
            feature.geometry as { type: string; coordinates: unknown },
            fallbackBounds
          ),
        }))
        .filter((row) => Boolean(row.path)),
    [adm1Boundary, fallbackBounds]
  );

  useEffect(() => {
    const requested = initialState.countryIso3?.toUpperCase() || "";
    if (!requested) return;
    setCountryIso3((current) => (current === requested ? current : requested));
  }, [initialState.countryIso3]);

  useEffect(() => {
    let cancelled = false;
    const current = getCountryDataProviderV122(countryIso3);
    setFallbackBoundaryStatus("loading");
    setFallbackBoundaryPath("");

    if (!current?.mapView.bounds) {
      setFallbackBoundaryStatus("error");
      return () => {
        cancelled = true;
      };
    }

    void loadWorldCountryBoundaries()
      .then((collection) => {
        if (cancelled) return;
        const feature = collection.features.find(
          (candidate) => candidate.properties.iso3 === countryIso3
        );
        const path = feature
          ? geometryToFallbackPath(feature.geometry, current.mapView.bounds!)
          : "";
        if (!path) throw new Error(`로컬 국가 경계 누락: ${countryIso3}`);
        setFallbackBoundaryPath(path);
        setFallbackBoundaryStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.warn("Local map fallback boundary unavailable", reason);
        setFallbackBoundaryStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  useEffect(() => {
    let cancelled = false;
    setAdm1Boundary(null);
    if (countryIso3 !== "VNM") {
      setAdm1OutlineStatus("idle");
      return () => {
        cancelled = true;
      };
    }
    setAdm1OutlineStatus("loading");
    void loadVietnamSpatialGeoJsonV124(VNM_ADM1_GEOMETRY_URL_V126)
      .then((collection) => {
        if (cancelled) return;
        setAdm1Boundary(collection);
        setAdm1OutlineStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.error("Vietnam administrative boundary load failed", reason);
        setAdm1OutlineStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  useEffect(() => {
    let cancelled = false;
    setExternalStateHydrated(false);
    setLayers([]);
    setRecordsByElement({});
    setSpatialByElement({});
    setSelectorByElement({});
    setLoadingIds([]);
    setLayerErrors({});
    setFilters({});
    setSelected(null);
    setSelectedSpatial(null);
    setActiveIds([]);
    setFocusId(null);
    setSelectedPresetId(null);
    setRoleNotice("");

    if (!hasCountryDataProviderV122(countryIso3)) {
      setMapIndexStatus("error");
      setMapIndexError("현재 지도 데이터가 없습니다");
      return () => {
        cancelled = true;
      };
    }

    setMapIndexStatus("loading");
    setMapIndexError("");
    void loadCountryMapIndexV122(countryIso3)
      .then((nextLayers) => {
        if (cancelled) return;
        setLayers(nextLayers);
        setMapIndexStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.error("Country map index load failed", reason);
        setMapIndexStatus("error");
        setMapIndexError(
          publicCountryDataErrorMessageV122(
            reason,
            "지도 데이터 목록을 불러오지 못했습니다"
          )
        );
      });

    return () => {
      cancelled = true;
    };
  }, [countryIso3, mapIndexReloadNonce]);

  useEffect(() => {
    if (mapIndexStatus !== "ready") return;
    setSelectorByElement(
      Object.fromEntries(
        layers.map((layer) => [
          layer.elementId,
          selectorForLayerFromSharedSelectionV125(
            layer,
            sharedSelectorState
          ),
        ])
      )
    );
    setFilters(
      Object.fromEntries(
        layers.flatMap((layer) =>
          layer.filters.flatMap((filter) => {
            const selected = sharedSelectorState.dimensions[filter.field];
            return selected && filter.values.includes(selected)
              ? [[`${layer.elementId}:${filter.field}`, selected]]
              : [];
          })
        )
      )
    );
  }, [layers, mapIndexStatus, sharedSelectorKey]);

  const externalActiveLayerKey = initialState.activeLayerKeys.join("|");
  const externalContextLayerKey = initialState.contextLayerIds.join("|");

  useEffect(() => {
    if (mapIndexStatus !== "ready") return;
    const requestedCountry = initialState.countryIso3?.toUpperCase() || "";
    if (requestedCountry && requestedCountry !== countryIso3) return;

    const available = new Set(layers.map((layer) => layer.elementId));
    const requestedPrimary =
      initialState.primaryLayerId || initialState.focusLayerKey || null;
    const nextFocus =
      requestedPrimary && available.has(requestedPrimary)
        ? requestedPrimary
        : null;
    const requestedContexts = initialState.contextLayerIds.length
      ? initialState.contextLayerIds
      : initialState.activeLayerKeys.filter((id) => id !== nextFocus);
    const nextContexts = requestedContexts
      .filter((id) => available.has(id) && id !== nextFocus)
      .filter((id, index, values) => values.indexOf(id) === index)
      .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers);
    const nextActive = nextFocus ? [nextFocus, ...nextContexts] : [];

    setActiveIds((current) =>
      sameStringArray(current, nextActive) ? current : nextActive
    );
    setFocusId((current) => (current === nextFocus ? current : nextFocus));
    const restoredPresetId = isPublicMapWorkspacePresetIdV126(
      initialState.mapPresetId
    )
      ? initialState.mapPresetId
      : null;
    setSelectedPresetId(restoredPresetId);
    if (restoredPresetId) {
      const workspace = createPublicMapWorkspaceStateV126(restoredPresetId);
      setSelectorByElement((current) => ({
        ...current,
        [workspace.primary.elementId]: {
          variable: workspace.primary.variable,
          period: workspace.primary.period,
        },
        ...Object.fromEntries(
          workspace.context.map((item) => [
            item.elementId,
            { variable: item.variable, period: item.period },
          ])
        ),
      }));
    }
    setExternalStateHydrated(true);
  }, [
    countryIso3,
    externalActiveLayerKey,
    externalContextLayerKey,
    initialState.countryIso3,
    initialState.focusLayerKey,
    initialState.mapPresetId,
    initialState.primaryLayerId,
    layers,
    mapIndexStatus,
  ]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    setBaseMapStatus("loading");
    let pendingMap: MapLibreMap | null = null;
    try {
      pendingMap = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: provider?.mapView.center || [20, 15],
        zoom: provider?.mapView.zoom || 1.5,
        attributionControl: false,
      });
      pendingMap.addControl(new maplibregl.NavigationControl(), "top-right");
      pendingMap.addControl(
        new maplibregl.ScaleControl({ unit: "metric" }),
        "bottom-right"
      );
    } catch (reason) {
      console.error("MapLibre initialization failed", reason);
      try {
        pendingMap?.remove();
      } catch {
        // The partially initialized renderer has no remaining user state.
      }
      setBaseMapStatus("error");
      mapRef.current = null;
      return;
    }
    if (!pendingMap) return;
    const map = pendingMap;
    mapRef.current = map;

    let ready = false;
    const markReady = () => {
      ready = true;
      setBaseMapStatus("ready");
      const current = getCountryDataProviderV122(countryIso3);
      if (current?.mapView.bounds) {
        map.fitBounds(current.mapView.bounds, {
          padding: 44,
          duration: 0,
        });
      }
      window.setTimeout(() => map.resize(), 0);
    };
    const handleError = (event: any) => {
      console.error("MapLibre runtime error", event.error || event);
      if (!ready && !map.isStyleLoaded()) setBaseMapStatus("error");
    };
    const handleStyleLoad = () => {
      if (!ready && map.isStyleLoaded()) markReady();
    };
    map.on("load", markReady);
    map.on("style.load", handleStyleLoad);
    map.on("error", handleError);

    const timeout = window.setTimeout(() => {
      if (!ready) setBaseMapStatus("error");
    }, 12000);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => map.resize())
        : null;
    if (containerRef.current) resizeObserver?.observe(containerRef.current);

    return () => {
      window.clearTimeout(timeout);
      resizeObserver?.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      popupOwnerRef.current = null;
      map.off("load", markReady);
      map.off("style.load", handleStyleLoad);
      map.off("error", handleError);
      map.remove();
      mapRef.current = null;
    };
  }, []); // one MapLibre instance

  useEffect(() => {
    const map = mapRef.current;
    if (!map || baseMapStatus !== "ready") return;
    if (countryIso3 !== "VNM" || !adm1Boundary) {
      if (map.getLayer(VNM_ADM1_BASE_OUTLINE_V126)) {
        map.removeLayer(VNM_ADM1_BASE_OUTLINE_V126);
      }
      if (map.getSource(VNM_ADM1_BASE_SOURCE_V126)) {
        map.removeSource(VNM_ADM1_BASE_SOURCE_V126);
      }
      return;
    }
    const existing = map.getSource(
      VNM_ADM1_BASE_SOURCE_V126
    ) as GeoJSONSource | undefined;
    if (existing) {
      existing.setData(adm1Boundary as GeoJSON.FeatureCollection);
      return;
    }
    map.addSource(VNM_ADM1_BASE_SOURCE_V126, {
      type: "geojson",
      data: adm1Boundary as GeoJSON.FeatureCollection,
      attribution:
        '<a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries VNM ADM1</a> · CC BY 4.0',
    });
    map.addLayer({
      id: VNM_ADM1_BASE_OUTLINE_V126,
      type: "line",
      source: VNM_ADM1_BASE_SOURCE_V126,
      paint: {
        "line-color": "#2f6f59",
        "line-width": 0.8,
        "line-opacity": 0.42,
      },
    });
  }, [adm1Boundary, baseMapStatus, countryIso3]);

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      baseMapStatus !== "ready" ||
      !provider ||
      !externalStateHydrated
    ) {
      return;
    }
    const primaryLayer = primaryLayerId
      ? layers.find((layer) => layer.elementId === primaryLayerId)
      : null;
    if (
      primaryLayer &&
      (isExternalSpatialLayer(primaryLayer)
        ? !spatialByElement[primaryLayer.elementId]
        : !recordsByElement[primaryLayer.elementId])
    ) {
      return;
    }
    const restoreCountryExtent = () => {
      map.resize();
      if (provider.mapView.bounds) {
        map.fitBounds(provider.mapView.bounds, { padding: 44, duration: 0 });
      } else {
        map.easeTo({
          center: provider.mapView.center,
          zoom: provider.mapView.zoom,
          duration: 0,
        });
      }
    };
    const animationFrame = window.requestAnimationFrame(restoreCountryExtent);
    const settledLayoutTimer = window.setTimeout(restoreCountryExtent, 160);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settledLayoutTimer);
    };
  }, [
    baseMapStatus,
    externalStateHydrated,
    layers,
    primaryLayerId,
    provider,
    recordsByElement,
    spatialByElement,
  ]);

  useEffect(() => {
    const activeRuntimeKeys = new Set(
      activeIds.map((elementId) => runtimeKey(countryIso3, elementId))
    );
    loadControllersRef.current.forEach((controller, key) => {
      if (activeRuntimeKeys.has(key)) return;
      controller.abort();
      loadControllersRef.current.delete(key);
    });

    activeIds.forEach((elementId) => {
      const layer = layers.find((item) => item.elementId === elementId);
      if (!layer || layer.enabled === false || loadingIds.includes(elementId)) {
        return;
      }
      const externalSpatial = isExternalSpatialLayer(layer);
      if (
        (externalSpatial && spatialByElement[elementId]) ||
        (!externalSpatial && recordsByElement[elementId])
      ) {
        return;
      }
      setLoadingIds((current) => [...current, elementId]);
      setLayerErrors((current) => {
        const next = { ...current };
        delete next[elementId];
        return next;
      });
      const requestKey = runtimeKey(countryIso3, elementId);
      const controller = new AbortController();
      loadControllersRef.current.get(requestKey)?.abort();
      loadControllersRef.current.set(requestKey, controller);
      const request = externalSpatial
        ? countryIso3 === "VNM" && layer.geometryUrl
          ? Promise.all([
              // All Admin-1 layers share the loader's resolved JSON cache.
              // The unique A-024 transmission geometry remains abortable.
              loadVietnamSpatialGeoJsonV124(
                layer.geometryUrl,
                layer.geometryUrl.endsWith("vnm-adm1-63.geojson")
                  ? undefined
                  : controller.signal
              ),
              layer.dataUrl
                ? loadVietnamSpatialLayerV124(layer.dataUrl, controller.signal)
                : Promise.resolve(undefined),
            ]).then(([geometry, data]) => {
              if (controller.signal.aborted) return;
              setSpatialByElement((current) => ({
                ...current,
                [elementId]: { geometry, data },
              }));
            })
          : Promise.reject(
              new Error(
                layer.disabledReason || "이 레이어의 공간자료 경로가 없습니다"
              )
            )
        : loadCountryElementEntitiesV122(countryIso3, elementId).then(
            (payload) => {
              if (controller.signal.aborted) return;
              setRecordsByElement((current) => ({
                ...current,
                [elementId]: payload.records,
              }));
            }
          );
      void request
        .catch((reason: unknown) => {
          if (
            controller.signal.aborted ||
            (reason instanceof DOMException && reason.name === "AbortError")
          ) {
            return;
          }
          console.error("Country map layer load failed", reason);
          setLayerErrors((current) => ({
            ...current,
            [elementId]: publicCountryDataErrorMessageV122(
              reason,
              "선택한 데이터 레이어를 불러오지 못했습니다"
            ),
          }));
        })
        .finally(() => {
          if (loadControllersRef.current.get(requestKey) === controller) {
            loadControllersRef.current.delete(requestKey);
          }
          setLoadingIds((current) => current.filter((id) => id !== elementId));
        });
    });
  }, [
    activeIds,
    countryIso3,
    layers,
    loadingIds,
    recordsByElement,
    spatialByElement,
  ]);

  useEffect(
    () => () => {
      loadControllersRef.current.forEach((controller) => controller.abort());
      loadControllersRef.current.clear();
    },
    []
  );

  useEffect(() => {
    const index = new Map<string, CountryEntityV122>();
    (Object.values(recordsByElement) as CountryEntityV122[][]).forEach((rows) =>
      rows.forEach((row) => index.set(`${row.elementId}:${row.recordId}`, row))
    );
    recordIndexRef.current = index;
  }, [recordsByElement]);

  useEffect(() => {
    if (mapIndexStatus !== "ready" || !externalStateHydrated) return;
    const nextOpacities = Object.fromEntries(
      activeIds.map((id) => [id, initialState.layerOpacities[id] ?? 0.78])
    );
    const nextYears: Record<string, number | null> = Object.fromEntries(
      activeIds.map((id) => {
        const selectedPeriod = selectorByElement[id]?.period;
        const parsedYear = selectedPeriod
          ? Number.parseInt(selectedPeriod.slice(0, 4), 10)
          : initialState.layerYears[id] ?? null;
        return [id, Number.isFinite(parsedYear) ? parsedYear : null];
      })
    );
    onStateChange({
      ...initialState,
      countryIso3: countryIso3 || null,
      activeLayerKeys: activeIds,
      focusLayerKey: focusId,
      primaryLayerId,
      contextLayerIds,
      mapPresetId: selectedPresetId,
      layerOpacities: nextOpacities,
      layerYears: nextYears,
    });
  }, [
    activeIds,
    countryIso3,
    externalStateHydrated,
    focusId,
    mapIndexStatus,
    onStateChange,
    primaryLayerId,
    contextLayerIds,
    selectedPresetId,
    selectorByElement,
  ]); // initialState is intentionally reconciled through explicit fields

  useEffect(() => {
    const map = mapRef.current;
    if (!map || baseMapStatus !== "ready") return;

    (Array.from(mountedKeysRef.current) as string[]).forEach((key) => {
      const [mountedCountry, ...elementParts] = key.split(":");
      const elementId = elementParts.join(":");
      if (mountedCountry === countryIso3 && activeIds.includes(elementId))
        return;
      removeLayerFromMap(map, mountedCountry, elementId, handlersRef.current);
      mountedKeysRef.current.delete(key);
      delete renderSignaturesRef.current[key];
    });

    renderOrderedActiveIds.forEach((elementId) => {
      const layer = layers.find((item) => item.elementId === elementId);
      if (!layer || layer.enabled === false) return;
      const ids = layerRuntimeIds(countryIso3, elementId);
      const renderer = rendererOf(layer);
      const color = LAYER_COLORS[elementId] || "#176a4b";
      const isPrimary = elementId === primaryLayerId;
      const contextIndex = isPrimary
        ? -1
        : contextLayerIds.indexOf(elementId);
      const roleOpacity = isPrimary ? 0.88 : 0.36;

      if (
        renderer === "line" ||
        renderer === "admin1-choropleth" ||
        renderer === "partial-choropleth" ||
        renderer === "regional-scope"
      ) {
        const asset = spatialByElement[elementId];
        if (!asset) return;
        const selector = selectorForLayer(layer, selectorByElement[elementId]);
        const variablePresentationV129 =
          getPublicIndicatorVariablePresentationV129(
            elementId,
            selector.variable
          );
        const isRegionalScope = renderer === "regional-scope";
        const choropleth =
          renderer === "line" || isRegionalScope
            ? null
            : choroplethFeatureCollection(layer, asset, selector);
        const data =
          renderer === "line"
            ? lineFeatureCollection(layer, asset, selector, filters)
            : isRegionalScope
            ? (asset.geometry as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>)
            : choropleth!.collection;
        const renderKey = runtimeKey(countryIso3, elementId);
        const renderSignature = JSON.stringify({
          renderer,
          selector,
          filters: selectedFilterDimensionsV125(layer, filters),
          featureCount: data.features.length,
          role: isPrimary ? "primary" : "context",
        });
        const existing = map.getSource(ids.source) as GeoJSONSource | undefined;
        const fillColor = isRegionalScope
          ? color
          : choropleth
          ? ([
              "case",
              ["==", ["get", "hasValue"], false],
              "rgba(0, 0, 0, 0)",
              choropleth.minimum === choropleth.maximum
                ? color
                : [
                    "interpolate",
                    ["linear"],
                    ["to-number", ["get", "value"]],
                    choropleth.minimum,
                    "#e6f2ea",
                    choropleth.maximum,
                    color,
                  ],
            ] as any)
          : color;
        if (existing) {
          if (renderSignaturesRef.current[renderKey] === renderSignature) return;
          removeLayerFromMap(map, countryIso3, elementId, handlersRef.current);
          mountedKeysRef.current.delete(renderKey);
          delete renderSignaturesRef.current[renderKey];
        }

        map.addSource(ids.source, { type: "geojson", data });
        let interactiveLayerId = ids.line;
        let additionalInteractiveLayerId: string | undefined;
        if (renderer === "line") {
          const voltageWidth = isPrimary
            ? ([
                "interpolate",
                ["linear"],
                ["zoom"],
                4,
                [
                  "match",
                  ["get", "voltageKv"],
                  110,
                  1.5,
                  220,
                  2.2,
                  500,
                  3,
                  1.3,
                ],
                9,
                [
                  "match",
                  ["get", "voltageKv"],
                  110,
                  3,
                  220,
                  4.2,
                  500,
                  5.6,
                  2.8,
                ],
              ] as any)
            : 1.15;
          map.addLayer({
            id: ids.line,
            type: "line",
            source: ids.source,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": [
                "match",
                ["get", "voltageKv"],
                110,
                "#e59b32",
                220,
                "#d35a3d",
                500,
                "#8b2635",
                color,
              ] as any,
              "line-width": voltageWidth,
              "line-opacity": roleOpacity,
            },
          });
          map.addLayer({
            id: ids.lineHit,
            type: "line",
            source: ids.source,
            paint: {
              "line-color": "#000000",
              "line-width": isPrimary ? 16 : 14,
              "line-opacity": 0.001,
            },
          });
          map.addLayer({
            id: ids.selection,
            type: "line",
            source: ids.source,
            filter: ["==", ["get", "selectionKey"], "__none__"],
            paint: {
              "line-color": "#fff3a6",
              "line-width": isPrimary ? 6 : 5,
              "line-opacity": 0.96,
            },
          });
          interactiveLayerId = ids.lineHit;
        } else if (isRegionalScope) {
          interactiveLayerId = ids.fill;
          additionalInteractiveLayerId = ids.pointHit;
          const scopeFilter = [
            "==",
            ["get", "geometryRole"],
            "regional-scope",
          ] as any;
          const activityFilter = [
            "==",
            ["get", "geometryRole"],
            "activity-site",
          ] as any;
          map.addLayer({
            id: ids.fill,
            type: "fill",
            source: ids.source,
            filter: scopeFilter,
            paint: {
              "fill-color": color,
              "fill-opacity": isPrimary ? 0.2 : 0.08,
            },
          });
          map.addLayer({
            id: ids.outline,
            type: "line",
            source: ids.source,
            filter: scopeFilter,
            paint: {
              "line-color": color,
              "line-width": isPrimary ? 2.6 : 1.8,
              "line-opacity": isPrimary ? 0.92 : 0.58,
              "line-dasharray": [3, 2],
            },
          });
          map.addLayer({
            id: ids.point,
            type: "circle",
            source: ids.source,
            filter: activityFilter,
            paint: {
              "circle-color": color,
              "circle-radius": isPrimary ? 7 : 4.5,
              "circle-opacity": isPrimary ? 0.94 : 0.56,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": isPrimary ? 2 : 1,
            },
          });
          map.addLayer({
            id: ids.pointHit,
            type: "circle",
            source: ids.source,
            filter: activityFilter,
            paint: {
              "circle-color": "#000000",
              "circle-radius": 14,
              "circle-opacity": 0.001,
            },
          });
          map.addLayer({
            id: ids.pointSelection,
            type: "circle",
            source: ids.source,
            filter: ["==", ["get", "selectionKey"], "__none__"],
            paint: {
              "circle-color": color,
              "circle-radius": isPrimary ? 10 : 8,
              "circle-opacity": 1,
              "circle-stroke-color": "#f0a51a",
              "circle-stroke-width": 4,
            },
          });
          map.addLayer({
            id: ids.selection,
            type: "line",
            source: ids.source,
            filter: ["==", ["get", "selectionKey"], "__none__"],
            paint: {
              "line-color": "#f0a51a",
              "line-width": isPrimary ? 4 : 3,
              "line-opacity": 1,
            },
          });
        } else {
          interactiveLayerId = ids.fill;
          map.addLayer({
            id: ids.fill,
            type: "fill",
            source: ids.source,
            paint: {
              "fill-color": fillColor,
              "fill-opacity": isPrimary ? 0.76 : 0,
            },
          });
          map.addLayer({
            id: ids.outline,
            type: "line",
            source: ids.source,
            paint: {
              "line-color": isPrimary ? "#48665a" : color,
              "line-width": isPrimary
                ? 0.95
                : contextIndex === 0
                ? 3.4
                : 1.8,
              "line-opacity": isPrimary
                ? 0.82
                : contextIndex === 0
                ? 0.55
                : 0.88,
              ...(isPrimary
                ? {}
                : {
                    "line-dasharray":
                      contextIndex === 0 ? [1, 1.5] : [4, 2],
                  }),
            },
          });
          if (!isPrimary) {
            map.addLayer({
              id: ids.lineHit,
              type: "line",
              source: ids.source,
              paint: {
                "line-color": "#000000",
                "line-width": 14,
                "line-opacity": 0.001,
              },
            });
            interactiveLayerId = ids.lineHit;
          }
          map.addLayer({
            id: ids.selection,
            type: "line",
            source: ids.source,
            filter: ["==", ["get", "selectionKey"], "__none__"],
            paint: {
              "line-color": "#f0a51a",
              "line-width": isPrimary ? 3.4 : 4.2,
              "line-opacity": 1,
            },
          });
        }

        const onClick = (event: MapLayerMouseEvent) => {
          if (
            !isTopmostActiveFeatureV129(
              map,
              event.point,
              countryIso3,
              renderOrderedActiveIds,
              elementId
            )
          ) {
            return;
          }
          const properties = (event.features?.[0]?.properties || {}) as Record<
            string,
            unknown
          >;
          const rawLineLength = properties.lengthKm ?? properties.length;
          const lineLength =
            rawLineLength === null ||
            rawLineLength === undefined ||
            rawLineLength === ""
              ? Number.NaN
              : Number(rawLineLength);
          const approvedAmount = optionalFiniteNumberV130(
            properties.approvedAmount
          );
          const value =
            renderer === "line" && Number.isFinite(lineLength)
              ? lineLength
              : isRegionalScope
              ? approvedAmount
              : typeof properties.value === "number"
              ? properties.value
              : null;
          setSelected(null);
          setSelectedSpatial({
            elementId,
            adm1Code: String(properties.adm1Code || "") || undefined,
            adm1Name:
              renderer === "line"
                ? publicTransmissionSegmentTitleV131(properties)
                : isRegionalScope
                ? publicMapFeatureNameV126(
                    properties.projectTitle || properties.name,
                    "지역 협력사업"
                  )
                : publicMapFeatureNameV126(
                    properties.adm1Name || properties.name,
                    "성·시"
                  ),
            value,
            unit:
              renderer === "line"
                ? String(properties.unit || "km")
                : isRegionalScope
                ? "USD"
                : variablePresentationV129?.unit || String(properties.unit || ""),
            period: String(properties.period || layer.sourceYear || ""),
            variableLabel:
              renderer === "line"
                ? "송전망 선로"
                : isRegionalScope
                ? publicMapFeatureNameV126(
                    properties.displayLabel,
                    "지역 협력사업"
                  )
                : variablePresentationV129?.label ||
                  publicMapFeatureNameV126(
                    properties.variableLabel,
                    publicMapLayerTitleV126(elementId, layer.publicShortTitle)
                  ),
            selectionKey: String(
              properties.selectionKey || properties.adm1Code || ""
            ),
            properties,
          });
          if (!isPrimary) {
            setRoleNotice(
              `선택한 보조 데이터 · ${publicMapLayerTitleV126(
                elementId,
                layer.publicShortTitle
              )}`
            );
          }
          setAnalysisPanelOpen(true);
        };
        const popupOwnerKey = `${runtimeKey(countryIso3, elementId)}:${interactiveLayerId}`;
        const onEnter = (event: MapLayerMouseEvent) => {
          if (
            !isTopmostActiveFeatureV129(
              map,
              event.point,
              countryIso3,
              renderOrderedActiveIds,
              elementId
            )
          ) {
            return;
          }
          map.getCanvas().style.cursor = "pointer";
          const properties = event.features?.[0]?.properties || {};
          const rawLength = properties.lengthKm ?? properties.length;
          const parsedLength =
            rawLength === null || rawLength === undefined || rawLength === ""
              ? null
              : Number(rawLength);
          const publicUnit =
            variablePresentationV129?.unit || String(properties.unit || "");
          const formattedAreaValue = properties.hasValue
            ? `${formatPublicNumberV126(
                Number(properties.value),
                publicUnit
              )}${
                elementId === "B-021" && selector.variable === "gvi-6"
                  ? " / 100"
                  : publicUnit
                  ? ` ${publicUnit}`
                  : ""
              }`
            : "결측";
          const participantCount = optionalFiniteNumberV130(
            properties.participantCount
          );
          const featureLabel =
            renderer === "line"
              ? `${properties.voltageKv || properties.voltage || ""} kV · ${
                  parsedLength !== null && Number.isFinite(parsedLength)
                    ? `${formatPublicNumberV126(parsedLength, "km")} km`
                    : "길이 미표기"
                }`
              : isRegionalScope
              ? `${publicMapFeatureNameV126(
                  properties.displayLabel,
                  "지역 협력사업"
                )} · ${
                  participantCount === null
                    ? "참여국 수 미표기"
                    : `${participantCount}개 참여국`
                }`
              : `${publicMapFeatureNameV126(
                  properties.adm1Name || properties.name,
                  "성·시"
                )} · ${variablePresentationV129?.label || "현재 값"} ${formattedAreaValue}`;
          const sourceRegion = publicVietnamSourceRegionV126(
            publicTextV126(properties.sourceRegion) || undefined
          );
          popupRef.current?.remove();
          popupOwnerRef.current = popupOwnerKey;
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10,
          })
            .setLngLat(event.lngLat)
            .setDOMContent(
              createPublicMapPopupContentV129(
                publicMapLayerTitleV126(elementId, layer.publicShortTitle),
                [
                  featureLabel,
                  isRegionalScope
                    ? publicMapFeatureNameV126(
                        properties.activitySiteLabel || properties.participatingCountries,
                        "참여국 범위"
                      )
                    : variablePresentationV129?.directionLabel || "",
                  isRegionalScope
                    ? `베트남 참여 ${publicMapFeatureNameV126(
                        properties.vietnamParticipation,
                        "포함"
                      )}`
                    : publicTextV126(properties.sourceRegion)
                    ? `${sourceRegion} 권역의 값 · 성 단위 독립 추정값이 아님`
                    : isPrimary
                    ? "주 분석 데이터"
                    : "보조 데이터",
                ]
              )
            )
            .addTo(map);
        };
        const onPointLeave = () => {
          if (popupOwnerRef.current !== popupOwnerKey) return;
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
          popupRef.current = null;
          popupOwnerRef.current = null;
        };
        map.on("click", interactiveLayerId, onClick);
        map.on("mouseenter", interactiveLayerId, onEnter);
        map.on("mousemove", interactiveLayerId, onEnter);
        map.on("mouseleave", interactiveLayerId, onPointLeave);
        if (additionalInteractiveLayerId) {
          map.on("click", additionalInteractiveLayerId, onClick);
          map.on("mouseenter", additionalInteractiveLayerId, onEnter);
          map.on("mousemove", additionalInteractiveLayerId, onEnter);
          map.on("mouseleave", additionalInteractiveLayerId, onPointLeave);
        }
        const key = runtimeKey(countryIso3, elementId);
        handlersRef.current[key] = {
          interactiveLayerId,
          additionalInteractiveLayerId,
          onClick,
          onEnter,
          onMove: onEnter,
          onPointLeave,
        };
        renderSignaturesRef.current[key] = renderSignature;
        mountedKeysRef.current.add(key);
        return;
      }

      const records = recordsByElement[elementId];
      if (!records) return;
      const filteredRecords = filterRecords(records, layer, filters);
      const data = featureCollection(filteredRecords, layer);
      const renderKey = runtimeKey(countryIso3, elementId);
      const renderSignature = JSON.stringify({
        filters: selectedFilterDimensionsV125(layer, filters),
        recordCount: filteredRecords.length,
        role: isPrimary ? "primary" : "context",
      });
      const existing = map.getSource(ids.source) as GeoJSONSource | undefined;
      if (existing) {
        if (renderSignaturesRef.current[renderKey] === renderSignature) return;
        removeLayerFromMap(map, countryIso3, elementId, handlersRef.current);
        mountedKeysRef.current.delete(renderKey);
        delete renderSignaturesRef.current[renderKey];
      }

      map.addSource(ids.source, {
        type: "geojson",
        data,
        cluster: layer.cluster,
        clusterMaxZoom: 13,
        clusterRadius: isPrimary ? 46 : 28,
      });
      if (layer.cluster) {
        map.addLayer({
          id: ids.cluster,
          type: "circle",
          source: ids.source,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": color,
            "circle-opacity": isPrimary ? 0.84 : 0.34,
            "circle-radius": [
              "step",
              ["get", "point_count"],
              isPrimary ? 17 : 11,
              100,
              isPrimary ? 22 : 14,
              750,
              isPrimary ? 29 : 18,
            ],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": isPrimary ? 2 : 1,
          },
        });
        map.addLayer({
          id: ids.clusterCount,
          type: "symbol",
          source: ids.source,
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": isPrimary ? 12 : 10,
          },
          paint: {
            "text-color": isPrimary ? "#ffffff" : "#284b3e",
            "text-opacity": isPrimary ? 1 : 0.72,
          },
        });
      }
      const pointColor =
        elementId === "A-023" && isPrimary
          ? ([
              "match",
              ["get", "fuelType"],
              ...Object.entries(A023_FUEL_COLORS_V126).flatMap(
                ([fuel, fuelColor]) => [fuel, fuelColor]
              ),
              color,
            ] as any)
          : color;
      const pointRadius =
        elementId === "A-023" && isPrimary
          ? ([
              "interpolate",
              ["linear"],
              ["to-number", ["get", "capacityMw"], 0],
              0,
              4,
              100,
              5.5,
              500,
              7.5,
              1000,
              10,
            ] as any)
          : isPrimary
          ? 7
          : 4.2;
      const pointSymbolShape = publicMapSymbolShapeV129(layer);
      const pointSymbolImageId = `cdp-v129-${elementId
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")}-${pointSymbolShape}`;
      ensurePublicPointSymbolImageV129(
        map,
        pointSymbolImageId,
        pointSymbolShape,
        color
      );
      map.addLayer({
        id: ids.point,
        type: "circle",
        source: ids.source,
        ...(layer.cluster
          ? { filter: ["!", ["has", "point_count"]] as any }
          : {}),
        paint: {
          "circle-color": pointColor,
          "circle-radius": pointRadius,
          "circle-opacity":
            pointSymbolShape === "circle" ? (isPrimary ? 0.88 : 0.4) : 0,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": isPrimary ? 1.5 : 0.8,
        },
      });
      map.addLayer({
        id: ids.pointHit,
        type: "circle",
        source: ids.source,
        ...(layer.cluster
          ? { filter: ["!", ["has", "point_count"]] as any }
          : {}),
        paint: {
          "circle-color": "#000000",
          "circle-radius": isPrimary ? 14 : 12,
          "circle-opacity": 0.001,
        },
      });
      if (pointSymbolShape !== "circle") {
        map.addLayer({
          id: ids.pointSymbol,
          type: "symbol",
          source: ids.source,
          ...(layer.cluster
            ? { filter: ["!", ["has", "point_count"]] as any }
            : {}),
          layout: {
            "icon-allow-overlap": true,
            "icon-image": pointSymbolImageId,
            "icon-size": isPrimary ? 1 : 0.78,
          },
          paint: {
            "icon-opacity": isPrimary ? 0.9 : 0.45,
          },
        });
      }
      map.addLayer({
        id: ids.selection,
        type: "circle",
        source: ids.source,
        filter: ["==", ["get", "selectionKey"], "__none__"],
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-radius": isPrimary ? 12 : 10,
          "circle-stroke-color": "#f0a51a",
          "circle-stroke-width": 3.5,
        },
      });

      const onPointClick = (event: MapLayerMouseEvent) => {
        if (
          !isTopmostActiveFeatureV129(
            map,
            event.point,
            countryIso3,
            renderOrderedActiveIds,
            elementId
          )
        ) {
          return;
        }
        const recordId = String(
          event.features?.[0]?.properties?.recordId || ""
        );
        const record =
          recordIndexRef.current.get(`${elementId}:${recordId}`) || null;
        if (!record) {
          setRoleNotice("선택한 위치의 세부정보를 확인할 수 없습니다.");
          return;
        }
        setSelected(record);
        setSelectedSpatial(null);
        if (!isPrimary) {
          setRoleNotice(
            `선택한 보조 데이터 · ${publicMapLayerTitleV126(
              elementId,
              layer.publicShortTitle
            )}`
          );
        }
        setAnalysisPanelOpen(true);
      };
      const pointPopupOwnerKey = `${runtimeKey(countryIso3, elementId)}:${ids.pointHit}`;
      const clusterPopupOwnerKey = `${runtimeKey(countryIso3, elementId)}:${ids.cluster}`;
      const onPointEnter = (event: MapLayerMouseEvent) => {
        if (
          !isTopmostActiveFeatureV129(
            map,
            event.point,
            countryIso3,
            renderOrderedActiveIds,
            elementId
          )
        ) {
          return;
        }
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const coordinates = [...feature.geometry.coordinates] as [
          number,
          number
        ];
        const name = publicMapFeatureNameV126(
          feature.properties?.name,
          publicMapLayerTitleV126(elementId, layer.publicShortTitle)
        );
        popupRef.current?.remove();
        popupOwnerRef.current = pointPopupOwnerKey;
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
          .setLngLat(coordinates)
          .setDOMContent(
            createPublicMapPopupContentV129(
              publicMapLayerTitleV126(elementId, layer.publicShortTitle),
              [
                name,
                publicTextV126(feature.properties?.nameNote) || "",
                isPrimary ? "주 분석 데이터" : "보조 데이터",
              ]
            )
          )
          .addTo(map);
      };
      const onPointLeave = () => {
        if (popupOwnerRef.current !== pointPopupOwnerKey) return;
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
        popupRef.current = null;
        popupOwnerRef.current = null;
      };
      const onClusterClick = layer.cluster
        ? (event: MapLayerMouseEvent) => {
            if (
              !isTopmostActiveFeatureV129(
                map,
                event.point,
                countryIso3,
                renderOrderedActiveIds,
                elementId
              )
            ) {
              return;
            }
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            const count = Number(feature.properties?.point_count || 0);
            setSelected(null);
            setSelectedSpatial({
              elementId,
              adm1Name: `${publicMapLayerTitleV126(
                elementId,
                layer.publicShortTitle
              )} 위치 묶음`,
              value: count,
              unit: "개 위치",
              period: String(layer.sourceYear || ""),
              variableLabel: "위치 수",
              selectionKey: `cluster:${feature.properties?.cluster_id || ""}`,
              properties: { category: "위치 묶음" },
            });
            if (!isPrimary) {
              setRoleNotice(
                `선택한 보조 데이터 · ${publicMapLayerTitleV126(
                  elementId,
                  layer.publicShortTitle
                )}`
              );
            }
            setAnalysisPanelOpen(true);
            map.easeTo({
              center: feature.geometry.coordinates as [number, number],
              zoom: Math.min(map.getZoom() + 2, 14),
            });
          }
        : undefined;
      const onClusterEnter = layer.cluster
        ? (event: MapLayerMouseEvent) => {
            if (
              !isTopmostActiveFeatureV129(
                map,
                event.point,
                countryIso3,
                renderOrderedActiveIds,
                elementId
              )
            ) {
              return;
            }
            map.getCanvas().style.cursor = "pointer";
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            const count = Number(feature.properties?.point_count || 0);
            popupRef.current?.remove();
            popupOwnerRef.current = clusterPopupOwnerKey;
            popupRef.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 12,
            })
              .setLngLat(feature.geometry.coordinates as [number, number])
              .setDOMContent(
                createPublicMapPopupContentV129(
                  publicMapLayerTitleV126(elementId, layer.publicShortTitle),
                  [
                    `위치 ${count.toLocaleString()}개 묶음`,
                    "누르면 지도를 확대합니다",
                  ]
                )
              )
              .addTo(map);
          }
        : undefined;
      const onClusterLeave = layer.cluster
        ? () => {
            if (popupOwnerRef.current !== clusterPopupOwnerKey) return;
            map.getCanvas().style.cursor = "";
            popupRef.current?.remove();
            popupRef.current = null;
            popupOwnerRef.current = null;
          }
        : undefined;
      map.on("click", ids.pointHit, onPointClick);
      map.on("mouseenter", ids.pointHit, onPointEnter);
      map.on("mousemove", ids.pointHit, onPointEnter);
      map.on("mouseleave", ids.pointHit, onPointLeave);
      if (onClusterClick) map.on("click", ids.cluster, onClusterClick);
      if (onClusterEnter) map.on("mouseenter", ids.cluster, onClusterEnter);
      if (onClusterEnter) map.on("mousemove", ids.cluster, onClusterEnter);
      if (onClusterLeave) map.on("mouseleave", ids.cluster, onClusterLeave);
      const key = runtimeKey(countryIso3, elementId);
      handlersRef.current[key] = {
        interactiveLayerId: ids.pointHit,
        clusterLayerId: layer.cluster ? ids.cluster : undefined,
        onClick: onPointClick,
        onEnter: onPointEnter,
        onMove: onPointEnter,
        onPointLeave,
        onClusterClick,
        onClusterEnter,
        onClusterMove: onClusterEnter,
        onClusterLeave,
      };
      renderSignaturesRef.current[key] = renderSignature;
      mountedKeysRef.current.add(key);
    });
    moveMapDataLayersV126(map, countryIso3, renderOrderedActiveIds);
  }, [
    activeIds,
    baseMapStatus,
    countryIso3,
    filters,
    layers,
    primaryLayerId,
    recordsByElement,
    renderOrderedActiveIds,
    selectorByElement,
    spatialByElement,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || baseMapStatus !== "ready") return;
    activeIds.forEach((elementId) => {
      const ids = layerRuntimeIds(countryIso3, elementId);
      if (!map.getLayer(ids.selection)) return;
      const selectionKey =
        selectedSpatial?.elementId === elementId
          ? selectedSpatial.selectionKey || selectedSpatial.adm1Code || ""
          : selected?.elementId === elementId
          ? selected.recordId
          : "";
      map.setFilter(ids.selection, [
        "==",
        ["get", "selectionKey"],
        selectionKey || "__none__",
      ]);
      if (map.getLayer(ids.pointSelection)) {
        map.setFilter(ids.pointSelection, [
          "all",
          ["==", ["get", "geometryRole"], "activity-site"],
          ["==", ["get", "selectionKey"], selectionKey || "__none__"],
        ]);
      }
      if (selectionKey) {
        map.moveLayer(ids.selection);
        if (map.getLayer(ids.pointSelection)) map.moveLayer(ids.pointSelection);
      }
    });
  }, [
    activeIds,
    baseMapStatus,
    countryIso3,
    selected,
    selectedSpatial,
  ]);

  const groupedLayers = useMemo(() => {
    const groups = new Map<string, CountryMapLayerV122[]>();
    layers.forEach((layer) =>
      groups.set(layer.category, [...(groups.get(layer.category) || []), layer])
    );
    return Array.from(groups.entries());
  }, [layers]);

  const focusedLayer =
    layers.find((layer) => layer.elementId === focusId) || null;
  const focusedSelector = focusedLayer
    ? selectorForLayer(focusedLayer, selectorByElement[focusedLayer.elementId])
    : null;
  const focusedVariable =
    focusedLayer && focusedSelector
      ? focusedLayer.selectors.variables.find(
          (row) => row.key === focusedSelector.variable
        ) || null
      : null;
  const focusedVariablePresentationV129 =
    focusedLayer && focusedSelector
      ? getPublicIndicatorVariablePresentationV129(
          focusedLayer.elementId,
          focusedSelector.variable
        )
      : null;
  const focusedInterpretationV129 =
    focusedLayer && focusedSelector
      ? getPublicIndicatorInterpretationV129(
          focusedLayer.elementId,
          focusedSelector.variable
        )
      : null;
  const focusedHandoff = focusedLayer
    ? resolveMapSelectorBindingV125(
        focusedLayer.elementId,
        sharedSelectorState,
        focusedLayer.selectors
      )
    : null;
  const focusedHandoffPublicReason = publicTextV126(focusedHandoff?.reason);
  const focusedFilterDimensions = focusedLayer
    ? selectedFilterDimensionsV125(focusedLayer, filters)
    : {};
  const focusedSemanticSummary = focusedLayer
    ? getElementVisualizationSummaryV125(focusedLayer.elementId)
    : null;
  const focusedSemantic =
    focusedLayer && focusedSelector
      ? resolveMapSemanticPresentationV125(
          focusedLayer.elementId,
          focusedSelector,
          focusedLayer.selectors,
          focusedFilterDimensions,
          focusedSemanticSummary?.measureLabels[0] || focusedLayer.publicShortTitle
        )
      : null;
  const focusedSeriesCoverage =
    focusedLayer && focusedSelector
      ? spatialByElement[focusedLayer.elementId]?.data?.seriesCoverage.find(
          (row) =>
            row.variable === focusedSelector.variable &&
            row.period === focusedSelector.period
        ) || null
      : null;
  const focusedCoverage = focusedLayer
    ? focusedLayer.elementId === "A-024"
      ? "송전망 구간 606개"
      : focusedLayer.elementId === "A-023"
      ? "발전소 위치 1,889개"
      : focusedSeriesCoverage
      ? `${focusedSeriesCoverage.matchedCount}/63개 성·시 값 보유`
      : publicMapCoverageTextV126(focusedLayer)
    : "";
  const focusedMissingReason = focusedLayer
    ? focusedSeriesCoverage && focusedSeriesCoverage.missingCount > 0
      ? `${focusedSeriesCoverage.missingCount}개 성·시 원천 미제공 · 0으로 대체하지 않음`
      : focusedLayer.missingRegions.length
      ? focusedLayer.missingRegions.join(" · ")
      : "없음"
    : "";
  const focusedPublicCopy = focusedLayer
    ? publicMapLayerCopyV126({
        elementId: focusedLayer.elementId,
        renderer: rendererOf(focusedLayer),
        title: focusedLayer.publicShortTitle,
        accuracyNotice: focusedLayer.accuracyNotice,
      })
    : null;
  const focusedAccuracyNotice = focusedLayer
    ? publicMapAccuracyNoticeV126(
        focusedLayer.elementId,
        rendererOf(focusedLayer),
        focusedLayer.accuracyNotice
      )
    : "";
  const activeLegendIdentitiesV129 = useMemo(() => {
    const ordered = [
      ...(primaryLayerId ? [primaryLayerId] : []),
      ...contextLayerIds,
    ];
    return ordered.flatMap((elementId): PublicMapLegendIdentityV129[] => {
      const layer = layers.find((item) => item.elementId === elementId);
      if (!layer) return [];
      const selector = selectorForLayer(layer, selectorByElement[elementId]);
      const variable =
        layer.selectors.variables.find((item) => item.key === selector.variable) ||
        null;
      const variablePresentation = getPublicIndicatorVariablePresentationV129(
        layer.elementId,
        selector.variable
      );
      return [
        {
          color: LAYER_COLORS[elementId] || "#48665a",
          elementId,
          role: elementId === primaryLayerId ? "primary" : "context",
          shape: publicMapSymbolShapeV129(layer),
          title: publicMapLayerTitleV126(elementId, layer.publicShortTitle),
          unit: variablePresentation?.unit || variable?.unit || layer.unit,
          variable:
            variablePresentation?.label || variable?.label || layer.legend.title,
        },
      ];
    });
  }, [
    contextLayerIds,
    layers,
    primaryLayerId,
    selectorByElement,
  ]);
  const focusedAnalysisV126 = useMemo(() => {
    const summaryRows: PublicMapSummaryRowV126[] = [];
    const empty = {
      summaryRows,
      minimum: null as number | null,
      median: null as number | null,
      maximum: null as number | null,
      dataRegionCount: 0,
      missingRegionCount: 0,
      unit: "",
    };
    if (!focusedLayer || !focusedSelector) return empty;
    const renderer = rendererOf(focusedLayer);
    const publicTitle = publicMapLayerTitleV126(
      focusedLayer.elementId,
      focusedLayer.publicShortTitle
    );
    if (renderer === "regional-scope") {
      const features = spatialByElement[focusedLayer.elementId]?.geometry.features || [];
      const projectIds = new Set(
        features.map((feature) => String(feature.properties?.recordId || feature.id || ""))
      );
      const scopeCount = features.filter(
        (feature) => feature.properties?.geometryRole === "regional-scope"
      ).length;
      const activitySiteCount = features.filter(
        (feature) => feature.properties?.geometryRole === "activity-site"
      ).length;
      summaryRows.push(
        { label: "지역 협력사업", value: `${projectIds.size.toLocaleString()}건` },
        { label: "참여국 범위", value: `${scopeCount.toLocaleString()}개 범위` },
        { label: "검증된 세부 활동지역", value: `${activitySiteCount.toLocaleString()}곳` },
        { label: "베트남 참여", value: "2개 사업 모두 포함" }
      );
      return { ...empty, summaryRows, unit: "사업" };
    }
    if (renderer === "line") {
      const asset = spatialByElement[focusedLayer.elementId];
      if (!asset) return empty;
      const features = lineFeatureCollection(
        focusedLayer,
        asset,
        focusedSelector,
        filters
      ).features;
      const voltageCounts = new Map<string, number>();
      features.forEach((feature) => {
        const voltage = String(
          feature.properties?.voltageKv || feature.properties?.voltage || "미표기"
        );
        voltageCounts.set(voltage, (voltageCounts.get(voltage) || 0) + 1);
      });
      summaryRows.push({ label: "총 송전망 구간", value: `${features.length.toLocaleString()}개` });
      Array.from(voltageCounts.entries())
        .sort(([left], [right]) => Number(right) - Number(left))
        .forEach(([voltage, count]) =>
          summaryRows.push({
            label: `${voltage} kV`,
            value: `${count.toLocaleString()}개 구간`,
          })
        );
      summaryRows.push({
        label: "기준연도",
        value: String(focusedLayer.sourceYear || focusedSelector.period),
      });
      return { ...empty, summaryRows, unit: "구간" };
    }
    if (renderer === "admin1-choropleth" || renderer === "partial-choropleth") {
      const asset = spatialByElement[focusedLayer.elementId];
      const values = asset?.data
        ? spatialValuesForSelectorV125(asset.data, focusedSelector)
        : [];
      const sourceIsRegional =
        focusedLayer.elementId === "B-021" &&
        values.some((row) => row.sourceSpatialUnit === "region");
      const analysisValues = sourceIsRegional
        ? Array.from(
            new Map(
              values.map((row) => [
                row.sourceRecordId || row.sourceRegion || row.adm1Code,
                row,
              ])
            ).values()
          )
        : values;
      const ordered = [...analysisValues].sort(
        (left, right) => left.value - right.value
      );
      const numbers = ordered.map((row) => row.value).filter(Number.isFinite);
      const minimum = numbers.length ? numbers[0] : null;
      const maximum = numbers.length ? numbers[numbers.length - 1] : null;
      const middle = medianV126(numbers);
      const unit =
        focusedVariablePresentationV129?.unit ||
        ordered[0]?.unit ||
        focusedVariable?.unit ||
        focusedLayer.unit;
      const missingRegionCount = Math.max(0, 63 - ordered.length);
      summaryRows.push({
        label: sourceIsRegional ? "자료가 있는 권역" : "자료가 있는 지역",
        value: sourceIsRegional
          ? `${ordered.length}/6개 권역`
          : `${ordered.length}/63개 성·시`,
      });
      if (minimum !== null) {
        summaryRows.push(
          {
            label: "최솟값",
            value: `${formatPublicNumberV126(minimum, unit)} ${unit}`.trim(),
          },
          {
            label: "중앙값(파생)",
            value: `${formatPublicNumberV126(middle, unit)} ${unit}`.trim(),
            derived: true,
          },
          {
            label: "최댓값",
            value: `${formatPublicNumberV126(maximum, unit)} ${unit}`.trim(),
          },
          {
            label: sourceIsRegional ? "하위 권역" : "하위 지역",
            value: `${
              sourceIsRegional
                ? publicVietnamSourceRegionV126(ordered[0]?.sourceRegion)
                : publicMapFeatureNameV126(ordered[0]?.adm1Name, "미표기")
            } · ${formatPublicNumberV126(ordered[0]?.value, unit)} ${unit}`.trim(),
          },
          {
            label: sourceIsRegional ? "상위 권역" : "상위 지역",
            value: `${
              sourceIsRegional
                ? publicVietnamSourceRegionV126(
                    ordered[ordered.length - 1]?.sourceRegion
                  )
                : publicMapFeatureNameV126(
                    ordered[ordered.length - 1]?.adm1Name,
                    "미표기"
                  )
            } · ${formatPublicNumberV126(
              ordered[ordered.length - 1]?.value,
              unit
            )} ${unit}`.trim(),
          }
        );
      }
      summaryRows.push({
        label: sourceIsRegional ? "미제공 권역" : "미제공 지역",
        value: sourceIsRegional
          ? `${Math.max(0, 6 - ordered.length)}개 권역`
          : `${missingRegionCount}개 성·시`,
      });
      return {
        summaryRows,
        minimum,
        median: middle,
        maximum,
        dataRegionCount: values.length,
        missingRegionCount: Math.max(0, 63 - values.length),
        unit,
      };
    }
    const records = filterRecords(
      recordsByElement[focusedLayer.elementId] || [],
      focusedLayer,
      filters
    ).filter((row) => row.mapEligible);
    summaryRows.push({
      label: focusedLayer.elementId === "A-023" ? "총 발전소" : `총 ${publicTitle}`,
      value: `${records.length.toLocaleString()}건`,
    });
    const primaryGroupField =
      focusedLayer.elementId === "A-023"
        ? "fuelType"
        : focusedLayer.filters[0]?.field;
    if (primaryGroupField) {
      countByPublicFieldV126(records, primaryGroupField)
        .forEach(([label, count]) =>
          summaryRows.push({ label, value: `${count.toLocaleString()}건` })
        );
    }
    if (focusedLayer.elementId === "A-023") {
      countByPublicFieldV126(records, "capacityBand").forEach(([label, count]) =>
        summaryRows.push({
          label: `용량 ${label}`,
          value: `${count.toLocaleString()}건`,
        })
      );
    }
    summaryRows.push({
      label: "위치자료 보유",
      value: `${records.filter((row) => row.mapEligible).length.toLocaleString()}건`,
    });
    return { ...empty, summaryRows, unit: "건" };
  }, [
    filters,
    focusedLayer,
    focusedSelector,
    focusedVariable,
    focusedVariablePresentationV129,
    recordsByElement,
    spatialByElement,
  ]);
  const selectedLayer = selected
    ? layers.find((layer) => layer.elementId === selected.elementId) || null
      : null;
  const selectedEntityTitleResolutionV131 =
    selected && selectedLayer
      ? resolvePublicMapEntityTitleV131(selected, selectedLayer)
      : null;
  const selectedOwningLayer = selectedSpatial
    ? layers.find((layer) => layer.elementId === selectedSpatial.elementId) || null
    : selectedLayer;
  const selectedOwningSelector = selectedOwningLayer
    ? selectorForLayer(
        selectedOwningLayer,
        selectorByElement[selectedOwningLayer.elementId]
      )
    : null;
  const selectedOwningVariable =
    selectedOwningLayer && selectedOwningSelector
      ? selectedOwningLayer.selectors.variables.find(
          (row) => row.key === selectedOwningSelector.variable
        ) || null
      : null;
  const selectedOwningVariablePresentationV129 =
    selectedOwningLayer && selectedOwningSelector
      ? getPublicIndicatorVariablePresentationV129(
          selectedOwningLayer.elementId,
          selectedOwningSelector.variable
        )
      : null;
  const selectedOwningSemanticSummary = selectedOwningLayer
    ? getElementVisualizationSummaryV125(selectedOwningLayer.elementId)
    : null;
  const selectedOwningSemantic =
    selectedOwningLayer && selectedOwningSelector
      ? resolveMapSemanticPresentationV125(
          selectedOwningLayer.elementId,
          selectedOwningSelector,
          selectedOwningLayer.selectors,
          selectedFilterDimensionsV125(selectedOwningLayer, filters),
          selectedOwningSemanticSummary?.measureLabels[0] ||
            selectedOwningLayer.publicShortTitle
        )
      : null;
  const selectedOwningSeriesCoverage =
    selectedOwningLayer && selectedOwningSelector
      ? spatialByElement[
          selectedOwningLayer.elementId
        ]?.data?.seriesCoverage.find(
          (row) =>
            row.variable === selectedOwningSelector.variable &&
            row.period === selectedOwningSelector.period
        ) || null
      : null;
  const selectedOwningCoverage = selectedOwningLayer
    ? selectedOwningLayer.elementId === "A-024"
      ? "송전망 구간 606개"
      : selectedOwningLayer.elementId === "A-023"
      ? "발전소 위치 1,889개"
      : selectedOwningSeriesCoverage
      ? `${selectedOwningSeriesCoverage.matchedCount}/63개 성·시 값 보유`
      : publicMapCoverageTextV126(selectedOwningLayer)
    : "";
  const selectedFeatureRoleV129: PublicMapLayerRoleV129 | null =
    selectedOwningLayer?.elementId === primaryLayerId
      ? "primary"
      : selectedOwningLayer && contextLayerIds.includes(selectedOwningLayer.elementId)
      ? "context"
      : null;
  const selectedOwningMissingReason = selectedOwningLayer
    ? selectedOwningSeriesCoverage && selectedOwningSeriesCoverage.missingCount > 0
      ? `${selectedOwningSeriesCoverage.missingCount}개 성·시 원천 미제공`
      : selectedOwningLayer.missingRegions.length
      ? selectedOwningLayer.missingRegions.join(" · ")
      : "없음"
    : "";
  const selectedB021RegionRankV129 = (() => {
    if (
      selectedOwningLayer?.elementId !== "B-021" ||
      !selectedOwningSelector ||
      selectedOwningSelector.variable !== "gvi-6" ||
      !selectedSpatial
    ) {
      return "";
    }
    const selectedRegion = publicTextV126(
      selectedSpatial.properties.sourceRegion
    );
    const asset = spatialByElement[selectedOwningLayer.elementId];
    if (!selectedRegion || !asset?.data) return "";
    const byRegion = new Map<string, number>();
    spatialValuesForSelectorV125(asset.data, selectedOwningSelector).forEach(
      (row) => {
        if (row.sourceRegion && Number.isFinite(row.value)) {
          byRegion.set(row.sourceRegion, row.value);
        }
      }
    );
    const ordered = Array.from(byRegion.entries()).sort(
      ([, left], [, right]) => right - left
    );
    const rank = ordered.findIndex(([region]) => region === selectedRegion);
    return rank >= 0
      ? `베트남 ${ordered.length}개 권역 중 ${rank + 1}위 · 현재 값이 큰 순서`
      : "";
  })();
  const keyboardMapFeaturesV129 = useMemo<KeyboardMapFeatureV129[]>(() => {
    const features: KeyboardMapFeatureV129[] = [];
    renderOrderedActiveIds.forEach((elementId) => {
      const layer = layers.find((item) => item.elementId === elementId);
      if (!layer) return;
      const role: PublicMapLayerRoleV129 =
        elementId === primaryLayerId ? "primary" : "context";
      const title = publicMapLayerTitleV126(elementId, layer.publicShortTitle);
      const renderer = rendererOf(layer);
      if (renderer === "point" || renderer === "cluster") {
        filterRecords(recordsByElement[elementId] || [], layer, filters)
          .filter(
            (record) =>
              record.mapEligible &&
              typeof record.longitude === "number" &&
              typeof record.latitude === "number"
          )
          .forEach((record) => {
            const name = publicMapEntityTitleV131(record, layer);
            features.push({
              elementId,
              label: `${title} · ${name}`,
              record,
              role,
            });
          });
        return;
      }
      const asset = spatialByElement[elementId];
      if (!asset) return;
      const selector = selectorForLayer(layer, selectorByElement[elementId]);
      const presentation = getPublicIndicatorVariablePresentationV129(
        elementId,
        selector.variable
      );
      const collection =
        renderer === "line"
          ? lineFeatureCollection(layer, asset, selector, filters)
          : renderer === "regional-scope"
          ? asset.geometry
          : choroplethFeatureCollection(layer, asset, selector).collection;
      collection.features.forEach((feature, featureIndex) => {
        const properties = (feature.properties || {}) as Record<string, unknown>;
        const rawLength = properties.lengthKm ?? properties.length;
        const lineLength =
          rawLength === null || rawLength === undefined || rawLength === ""
            ? Number.NaN
            : Number(rawLength);
        const name =
          renderer === "line"
            ? publicTransmissionSegmentTitleV131(properties)
            : renderer === "regional-scope"
            ? `${publicMapFeatureNameV126(
                properties.displayLabel,
                "지역 협력사업"
              )} · ${publicMapFeatureNameV126(
                properties.activitySiteLabel || properties.projectTitle,
                "참여국 범위"
              )}`
            : publicMapFeatureNameV126(
                properties.adm1Name || properties.name,
                "성·시"
              );
        features.push({
          elementId,
          label: `${title} · ${name}`,
          role,
          spatial: {
            elementId,
            adm1Code: String(properties.adm1Code || "") || undefined,
            adm1Name: name,
            value:
              renderer === "line" && Number.isFinite(lineLength)
                ? lineLength
                : renderer === "regional-scope"
                ? optionalFiniteNumberV130(properties.approvedAmount)
                : typeof properties.value === "number"
                ? properties.value
                : null,
            unit:
              renderer === "line"
                ? String(properties.unit || "km")
                : renderer === "regional-scope"
                ? "USD"
                : presentation?.unit || String(properties.unit || ""),
            period: String(properties.period || layer.sourceYear || ""),
            variableLabel:
              renderer === "line"
                ? "송전망 선로"
                : renderer === "regional-scope"
                ? publicMapFeatureNameV126(
                    properties.displayLabel,
                    "지역 협력사업"
                  )
                : presentation?.label ||
                  publicMapFeatureNameV126(properties.variableLabel, title),
            selectionKey: String(
              properties.selectionKey ||
                properties.adm1Code ||
                feature.id ||
                featureIndex
            ),
            properties,
          },
        });
      });
    });
    return features;
  }, [
    filters,
    layers,
    primaryLayerId,
    recordsByElement,
    renderOrderedActiveIds,
    selectorByElement,
    spatialByElement,
  ]);

  useEffect(() => {
    setKeyboardFeatureIndexV129(0);
  }, [keyboardMapFeaturesV129]);

  const keyboardMapFeatureV129 =
    keyboardMapFeaturesV129[
      Math.min(keyboardFeatureIndexV129, keyboardMapFeaturesV129.length - 1)
    ] || null;

  function moveKeyboardFeatureV129(direction: -1 | 1) {
    if (keyboardMapFeaturesV129.length === 0) return;
    setKeyboardFeatureIndexV129((current) =>
      (current + direction + keyboardMapFeaturesV129.length) %
      keyboardMapFeaturesV129.length
    );
  }

  function selectKeyboardFeatureV129() {
    if (!keyboardMapFeatureV129) return;
    if (keyboardMapFeatureV129.record) {
      setSelected(keyboardMapFeatureV129.record);
      setSelectedSpatial(null);
    } else if (keyboardMapFeatureV129.spatial) {
      setSelected(null);
      setSelectedSpatial(keyboardMapFeatureV129.spatial);
    }
    setRoleNotice(
      keyboardMapFeatureV129.role === "context"
        ? `선택한 보조 데이터 · ${publicMapLayerTitleV126(
            keyboardMapFeatureV129.elementId,
            keyboardMapFeatureV129.label
          )}`
        : "키보드로 지도 항목을 선택했습니다."
    );
    setAnalysisPanelOpen(true);
  }
  const analysisActionLayerV129 = selectedOwningLayer || focusedLayer;

  function semanticStateForLayerV125(
    layer: CountryMapLayerV122
  ): DataFinderSelectorStateV125 {
    const selector = selectorForLayer(layer, selectorByElement[layer.elementId]);
    return dataFinderSelectorFromMapV125(
      layer.elementId,
      selector,
      selectedFilterDimensionsV125(layer, filters)
    );
  }

  function openLayerDetailV125(layer: CountryMapLayerV122): void {
    const state = semanticStateForLayerV125(layer);
    const regionContext: Record<string, string> =
      selectedSpatial?.elementId === layer.elementId && selectedSpatial.adm1Name
        ? { region: selectedSpatial.adm1Name }
        : {};
    onOpenElement(layer.elementId, countryIso3, {
      ...state,
      dimensions: { ...state.dimensions, ...regionContext },
    });
  }

  function publishMapSelectorStateV125(
    layer: CountryMapLayerV122,
    selector: LayerSelectorState,
    nextFilters: Record<string, string> = filters
  ): void {
    onSelectorStateChange(
      dataFinderSelectorFromMapV125(
        layer.elementId,
        selector,
        selectedFilterDimensionsV125(layer, nextFilters)
      )
    );
  }

  function changeCountry(nextCountryIso3: string) {
    if (nextCountryIso3 === countryIso3) return;
    setCountryIso3(nextCountryIso3);
    setActiveIds([]);
    setFocusId(null);
    setSelected(null);
    setSelectedSpatial(null);
    setSelectedPresetId(null);
    setRoleNotice("");
  }

  function activatePrimaryLayerV126(
    elementId: string,
    preservePreset = false
  ) {
    const layer = layers.find((item) => item.elementId === elementId);
    if (!layer || layer.enabled === false) return;
    const nextContexts = contextLayerIds
      .filter((id) => id !== elementId)
      .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers);
    setActiveIds([elementId, ...nextContexts]);
    setFocusId(elementId);
    if (!preservePreset) setSelectedPresetId(null);
    setRoleNotice("");
    onSelectorStateChange(semanticStateForLayerV125(layer));
    setSelected(null);
    setSelectedSpatial(null);
    fitSelectedCountry();
  }

  function toggleContextLayerV126(elementId: string) {
    const layer = layers.find((item) => item.elementId === elementId);
    if (!layer || layer.enabled === false) return;
    if (!primaryLayerId) {
      setRoleNotice("먼저 '분석하기'로 주 분석 데이터를 선택하세요.");
      return;
    }
    if (elementId === primaryLayerId) {
      setRoleNotice("현재 주 분석 데이터는 보조 표시로 중복할 수 없습니다.");
      return;
    }
    if (contextLayerIds.includes(elementId)) {
      setActiveIds([
        primaryLayerId,
        ...contextLayerIds.filter((id) => id !== elementId),
      ]);
      if (
        selected?.elementId === elementId ||
        selectedSpatial?.elementId === elementId
      ) {
        setSelected(null);
        setSelectedSpatial(null);
      }
      setSelectedPresetId(null);
      setRoleNotice("보조 표시를 해제했습니다.");
      return;
    }
    if (
      contextLayerIds.length >= PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers
    ) {
      setRoleNotice("보조 데이터는 최대 2개까지 표시할 수 있습니다.");
      return;
    }
    setActiveIds([primaryLayerId, ...contextLayerIds, elementId]);
    setSelectedPresetId(null);
    setRoleNotice("보조 데이터로 표시했습니다.");
    setSelected(null);
    setSelectedSpatial(null);
  }

  function applyPresetV126(presetId: PublicMapWorkspacePresetIdV126) {
    const workspace = createPublicMapWorkspaceStateV126(presetId);
    const available = new Set(
      layers.filter((layer) => layer.enabled !== false).map((layer) => layer.elementId)
    );
    if (!available.has(workspace.primary.elementId)) {
      setRoleNotice("이 분석 프리셋의 주 데이터를 사용할 수 없습니다.");
      return;
    }
    const contexts = workspace.context
      .filter((item) => available.has(item.elementId))
      .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers);
    const nextSelectors = {
      ...selectorByElement,
      [workspace.primary.elementId]: {
        variable: workspace.primary.variable,
        period: workspace.primary.period,
      },
      ...Object.fromEntries(
        contexts.map((item) => [
          item.elementId,
          { variable: item.variable, period: item.period },
        ])
      ),
    };
    setSelectorByElement(nextSelectors);
    setFilters({});
    setActiveIds([
      workspace.primary.elementId,
      ...contexts.map((item) => item.elementId),
    ]);
    setFocusId(workspace.primary.elementId);
    setSelectedPresetId(presetId);
    setSelected(null);
    setSelectedSpatial(null);
    setRoleNotice(`${PUBLIC_MAP_WORKSPACE_PRESETS_V126.find((item) => item.id === presetId)?.labelKo || "분석"} 프리셋을 적용했습니다.`);
    const primaryLayer = layers.find(
      (layer) => layer.elementId === workspace.primary.elementId
    );
    if (primaryLayer) {
      onSelectorStateChange(
        dataFinderSelectorFromMapV125(
          primaryLayer.elementId,
          nextSelectors[primaryLayer.elementId],
          {}
        )
      );
    }
    fitSelectedCountry();
  }

  function clearWorkspaceV126() {
    setActiveIds([]);
    setFocusId(null);
    setSelected(null);
    setSelectedSpatial(null);
    setSelectedPresetId(null);
    setRoleNotice("분석 데이터를 지웠습니다. 프리셋을 선택해 시작하세요.");
  }

  function retryLayer(elementId: string) {
    setLayerErrors((current) => {
      const next = { ...current };
      delete next[elementId];
      return next;
    });
    setRecordsByElement((current) => {
      const next = { ...current };
      delete next[elementId];
      return next;
    });
    if (!activeIds.includes(elementId)) activatePrimaryLayerV126(elementId);
  }

  function changeLayerVariable(layer: CountryMapLayerV122, variable: string) {
    const option = layer.selectors.variables.find((row) => row.key === variable);
    const periods = option?.periods || layer.selectors.periods;
    const nextSelector = {
      variable,
      period:
        periods.includes(layer.selectors.defaultPeriod)
          ? layer.selectors.defaultPeriod
          : periods[periods.length - 1] || "미표기",
    };
    setSelectorByElement((current) => ({
      ...current,
      [layer.elementId]: nextSelector,
    }));
    publishMapSelectorStateV125(layer, nextSelector);
    setSelected(null);
    setSelectedSpatial(null);
    setSelectedPresetId(null);
  }

  function changeLayerPeriod(layer: CountryMapLayerV122, period: string) {
    const current = selectorForLayer(layer, selectorByElement[layer.elementId]);
    const nextSelector = { ...current, period };
    setSelectorByElement((selectors) => ({
      ...selectors,
      [layer.elementId]: nextSelector,
    }));
    publishMapSelectorStateV125(layer, nextSelector);
    setSelected(null);
    setSelectedSpatial(null);
    setSelectedPresetId(null);
  }

  function changeLayerFilterV125(
    layer: CountryMapLayerV122,
    field: string,
    value: string
  ): void {
    const nextFilters = {
      ...filters,
      [`${layer.elementId}:${field}`]: value,
    };
    setFilters(nextFilters);
    publishMapSelectorStateV125(
      layer,
      selectorForLayer(layer, selectorByElement[layer.elementId]),
      nextFilters
    );
    setSelected(null);
    setSelectedSpatial(null);
    setSelectedPresetId(null);
  }

  function fitSelectedCountry() {
    const current = getCountryDataProviderV122(countryIso3);
    const map = mapRef.current;
    if (!current || !map) return;
    if (current.mapView.bounds) {
      map.fitBounds(current.mapView.bounds, { padding: 44, duration: 350 });
    } else {
      map.easeTo({
        center: current.mapView.center,
        zoom: current.mapView.zoom,
      });
    }
  }

  return (
    <div
      className="cdp-map-page"
      data-testid="map-public-content"
      data-primary-layer-count={primaryLayerId ? 1 : 0}
      data-context-layer-count={contextLayerIds.length}
      data-primary-element={primaryLayerId || "none"}
      data-context-elements={contextLayerIds.join(",") || "none"}
      data-map-preset={selectedPresetId || "none"}
      data-left-panel-width={Math.round(resizablePanelsV129.leftPanelWidth)}
      data-right-panel-width={Math.round(resizablePanelsV129.rightPanelWidth)}
      data-left-panel-effective-width={Math.round(
        resizablePanelsV129.effectiveLeftPanelWidth
      )}
      data-right-panel-effective-width={Math.round(
        resizablePanelsV129.effectiveRightPanelWidth
      )}
      data-map-minimum-width={resizablePanelsV129.mapMinimumWidth}
      data-right-panel-auto-collapsed={
        resizablePanelsV129.rightAutoCollapsed ? "true" : "false"
      }
      data-left-panel-compact={resizablePanelsV129.leftCompact ? "true" : "false"}
    >
      <div
        ref={resizablePanelsV129.layoutRef}
        className={`cdp-map-layout ${
          resizablePanelsV129.isResizing ? "is-resizing" : ""
        }`}
        data-testid="map-resizable-layout"
        data-resizing={resizablePanelsV129.isResizing ? "true" : "false"}
        style={resizablePanelsV129.layoutStyle}
      >
        <aside
          id="map-layer-panel-v129"
          className={`cdp-map-sidebar ${layerPanelOpen ? "is-open" : "is-collapsed"} ${
            resizablePanelsV129.leftCompact ? "is-compact" : ""
          }`}
          data-testid="map-layer-panel"
        >
          <div className="cdp-map-panel-header">
            <div>
              <h1>데이터 지도</h1>
              <p>주 분석 데이터 1개와 보조 데이터 2개를 함께 보세요.</p>
            </div>
            <button
              type="button"
              className="cdp-map-panel-toggle"
              aria-expanded={layerPanelOpen}
              aria-label={layerPanelOpen ? "데이터 목록 접기" : "데이터 목록 열기"}
              onClick={() => setLayerPanelOpen((current) => !current)}
            >
              {layerPanelOpen ? "접기" : "데이터 목록"}
            </button>
          </div>

          <label className="cdp-field">
            <span className="cdp-field__label">국가</span>
            <select
              className="cdp-select"
              value={countryIso3}
              onChange={(event) => changeCountry(event.target.value)}
            >
              {PRIORITY_COUNTRIES.map((country) => (
                <option
                  key={country.iso3}
                  value={country.iso3}
                  disabled={!hasCountryDataProviderV122(country.iso3)}
                >
                  {country.nameKo}
                  {!hasCountryDataProviderV122(country.iso3)
                    ? " · 준비 중"
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="cdp-action-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="cdp-button cdp-button--secondary"
              onClick={fitSelectedCountry}
              disabled={!provider}
            >
              전체 범위 보기
            </button>
            <button
              type="button"
              className="cdp-button cdp-button--secondary"
              onClick={clearWorkspaceV126}
            >
              모두 지우기
            </button>
          </div>

          <section className="cdp-map-presets" aria-labelledby="map-preset-title">
            <h2 id="map-preset-title">분석 프리셋</h2>
            {!primaryLayerId && (
              <p className="cdp-map-preset-guide" role="note">
                배경지도와 63개 성·시 경계가 준비됐습니다. 아래
                프리셋을 선택하거나 데이터 카드에서 분석을 시작하세요.
              </p>
            )}
            <div className="cdp-map-preset-scroll">
              {PUBLIC_MAP_WORKSPACE_PRESETS_V126.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`cdp-map-preset-card ${
                    selectedPresetId === preset.id ? "is-active" : ""
                  }`}
                  data-testid="map-analysis-preset"
                  data-preset-id={preset.id}
                  aria-pressed={selectedPresetId === preset.id}
                  onClick={() => applyPresetV126(preset.id)}
                >
                  <strong>{preset.labelKo}</strong>
                  <span>{preset.descriptionKo}</span>
                </button>
              ))}
            </div>
          </section>

          {roleNotice && (
            <p className="cdp-map-role-notice" role="status">
              {roleNotice}
            </p>
          )}

          <MapDataGuideV130
            layers={layers}
            onOpenDataFinder={onOpenDataFinder}
          />

          {baseMapStatus === "error" && (
            <div className="cdp-alert" role="status">
              <strong>대체 경계지도를 표시하고 있습니다</strong>
              <span>
                기본 지도를 사용할 수 없어 로컬 국가·성시 경계로 분석을
                계속합니다
              </span>
            </div>
          )}
          {mapIndexError && (
            <div className="cdp-alert cdp-alert--error" role="alert">
              <strong>{mapIndexError}</strong>
              {provider && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary cdp-button--compact"
                  onClick={() =>
                    setMapIndexReloadNonce((current) => current + 1)
                  }
                >
                  다시 시도
                </button>
              )}
            </div>
          )}
          {mapIndexStatus === "loading" && (
            <p className="cdp-muted">지도 데이터 목록을 불러오는 중입니다</p>
          )}

          {groupedLayers.map(([category, items]) => (
            <section key={category} className="cdp-map-layer-group">
              <h2>{category}</h2>
              {items.map((layer) => {
                const copy = publicMapLayerCopyV126({
                  elementId: layer.elementId,
                  renderer: rendererOf(layer),
                  title: layer.publicShortTitle,
                  accuracyNotice: layer.accuracyNotice,
                });
                const role =
                  primaryLayerId === layer.elementId
                    ? "primary"
                    : contextLayerIds.includes(layer.elementId)
                    ? "context"
                    : "inactive";
                const hasLimit =
                  layer.enabled === false ||
                  copy.spatialType === "admin1-partial" ||
                  layer.elementId === "A-024";
                return (
                  <article
                    key={layer.elementId}
                    className={`cdp-layer-card is-${role} ${
                      layer.enabled === false ? "is-disabled" : ""
                    }`}
                    data-map-layer-role={role}
                    data-map-element={layer.elementId}
                  >
                    <div className="cdp-layer-card__heading">
                      <strong>{copy.titleKo}</strong>
                      {role !== "inactive" && (
                        <span className={`cdp-layer-role-badge is-${role}`}>
                          {role === "primary" ? "주 분석" : "보조 표시"}
                        </span>
                      )}
                    </div>
                    <dl className="cdp-layer-card__facts">
                      <div>
                        <dt>자료연도</dt>
                        <dd>{layer.latestYear || layer.sourceYear || "미표기"}</dd>
                      </div>
                      <div>
                        <dt>공간표현</dt>
                        <dd>{copy.spatialTypeLabelKo}</dd>
                      </div>
                      <div>
                        <dt>커버리지</dt>
                        <dd>
                          {publicMapCoverageTextV126(layer)}
                        </dd>
                      </div>
                    </dl>
                    {hasLimit && (
                      <span className="cdp-layer-limit-badge">해석 유의사항 있음</span>
                    )}
                    {layer.enabled === false && (
                      <p className="cdp-layer-card__disabled-reason">
                        지도 표현 미제공 · {copy.accuracyNoticeKo}
                      </p>
                    )}
                    <div className="cdp-layer-card__actions">
                      <button
                        type="button"
                        className="cdp-button cdp-button--primary cdp-button--compact"
                        onClick={() => activatePrimaryLayerV126(layer.elementId)}
                        disabled={layer.enabled === false}
                        aria-pressed={role === "primary"}
                      >
                        {role === "primary" ? "분석 중" : "분석하기"}
                      </button>
                      <button
                        type="button"
                        className="cdp-button cdp-button--secondary cdp-button--compact"
                        onClick={() => toggleContextLayerV126(layer.elementId)}
                        disabled={layer.enabled === false || role === "primary"}
                        aria-pressed={role === "context"}
                      >
                        {role === "context" ? "보조 해제" : "보조 표시"}
                      </button>
                    </div>
                    {layerErrors[layer.elementId] && (
                      <span className="cdp-layer-error">
                        {layerErrors[layer.elementId]}
                        {" · "}
                        <button
                          type="button"
                          onClick={() => retryLayer(layer.elementId)}
                        >
                          다시 시도
                        </button>
                      </span>
                    )}
                  </article>
                );
              })}
            </section>
          ))}

          {focusedLayer && focusedSelector && (
            <section
              className="cdp-map-layer-group cdp-map-selector-panel"
              data-testid="map-primary-controls"
            >
              <h2>{focusedPublicCopy?.titleKo} 표시 설정</h2>
              {focusedHandoffPublicReason && (
                <p
                  className="cdp-map-selector-notice"
                  role="note"
                  data-testid="map-selector-handoff-notice"
                >
                  {focusedHandoffPublicReason}
                </p>
              )}
              {focusedSemantic && (
                <p className="cdp-map-selector-notice" role="note">
                  <strong>
                    {focusedVariablePresentationV129?.label ||
                      focusedSemantic.measureLabel}
                  </strong>
                  {" · "}
                  {focusedVariablePresentationV129?.directionLabel ||
                    focusedSemantic.indicatorLabel}
                </p>
              )}
              <label className="cdp-field" style={{ marginBottom: 9 }}>
                <span className="cdp-field__label">
                  {mapVariableSelectorLabelV125(focusedLayer.elementId)}
                </span>
                <select
                  className="cdp-select"
                  data-testid="map-layer-variable-select"
                  value={focusedSelector.variable}
                  onChange={(event) =>
                    changeLayerVariable(focusedLayer, event.target.value)
                  }
                >
                  {focusedLayer.selectors.variables.map((option) => (
                    <option key={option.key} value={option.key}>
                      {getPublicIndicatorVariablePresentationV129(
                        focusedLayer.elementId,
                        option.key
                      )?.label || option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cdp-field" style={{ marginBottom: 9 }}>
                <span className="cdp-field__label">
                  {mapPeriodSelectorLabelV125(focusedLayer.elementId)}
                </span>
                <select
                  className="cdp-select"
                  data-testid="map-layer-period-select"
                  value={focusedSelector.period}
                  onChange={(event) =>
                    changeLayerPeriod(focusedLayer, event.target.value)
                  }
                >
                  {(focusedVariable?.periods || focusedLayer.selectors.periods).map(
                    (period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    )
                  )}
                </select>
              </label>
              <dl className="cdp-map-layer-meta">
                <div>
                  <dt>측정항목</dt>
                  <dd>
                    {focusedVariablePresentationV129?.label ||
                      focusedSemantic?.measureLabel ||
                      focusedLayer.legend.title}
                  </dd>
                </div>
                <div>
                  <dt>단위</dt>
                  <dd>
                    {focusedVariablePresentationV129?.unit ||
                      focusedSemantic?.unit ||
                      focusedVariable?.unit ||
                      focusedLayer.unit}
                  </dd>
                </div>
                <div>
                  <dt>공간 커버리지</dt>
                  <dd data-testid="map-primary-coverage">{focusedCoverage}</dd>
                </div>
                <div>
                  <dt>결측지역</dt>
                  <dd data-testid="map-primary-missing-reason">
                    {focusedMissingReason}
                  </dd>
                </div>
                <div>
                  <dt>출처</dt>
                  <dd>{focusedLayer.source}</dd>
                </div>
                <div>
                  <dt>정확도 한계</dt>
                  <dd>{focusedAccuracyNotice}</dd>
                </div>
              </dl>
              {focusedLayer.elementId === "D-008" && (
                <p data-testid="d008-coverage-warning" role="note">
                  값 보유 3/63개 성·시 · 미자료 60개 성·시는
                  투명하게 표시하며 0으로 대체하지 않습니다.
                </p>
              )}
              {focusedLayer.elementId === "A-024" && (
                <p data-testid="a024-accuracy-notice" role="note">
                  송전망 구간 606개 · {focusedAccuracyNotice}
                </p>
              )}
            </section>
          )}

          {focusedLayer && focusedLayer.filters.length > 0 && (
            <section className="cdp-map-layer-group">
              <h2>{focusedLayer.publicShortTitle} 필터</h2>
              {focusedLayer.filters
                .filter(
                  (filter) =>
                    !(
                      rendererOf(focusedLayer) === "line" &&
                      filter.field === "voltageKv"
                    )
                )
                .map((filter) => (
                <label
                  key={filter.field}
                  className="cdp-field"
                  style={{ marginBottom: 9 }}
                >
                  <span className="cdp-field__label">{filter.label}</span>
                  <select
                    className="cdp-select"
                    data-testid={`map-layer-filter-${filter.field}`}
                    value={
                      filters[`${focusedLayer.elementId}:${filter.field}`] ||
                      "all"
                    }
                    onChange={(event) =>
                      changeLayerFilterV125(
                        focusedLayer,
                        filter.field,
                        event.target.value
                      )
                    }
                  >
                    <option value="all">전체</option>
                    {filter.values.map((value) => (
                      <option key={value} value={value}>
                        {semanticDimensionValueLabelV125(filter.field, value)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </section>
          )}
        </aside>

        <MapPanelSeparatorV129
          controls="map-layer-panel-v129"
          side="left"
          {...resizablePanelsV129.leftSeparator}
        />

        <main className="cdp-map-canvas-wrap" aria-label="데이터 지도">
          <div
            className="cdp-map-fallback"
            data-status={fallbackBoundaryStatus}
          >
            <svg
              className="cdp-map-fallback__svg"
              viewBox={`0 0 ${FALLBACK_VIEWBOX_WIDTH} ${FALLBACK_VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label="베트남 로컬 경계 대체 지도"
            >
              <g className="cdp-map-fallback__grid" aria-hidden="true">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                  (value) => (
                    <line
                      key={`vertical-${value}`}
                      x1={value}
                      y1="0"
                      x2={value}
                      y2={FALLBACK_VIEWBOX_HEIGHT}
                    />
                  )
                )}
                {[100, 200, 300, 400, 500, 600].map((value) => (
                  <line
                    key={`horizontal-${value}`}
                    x1="0"
                    y1={value}
                    x2={FALLBACK_VIEWBOX_WIDTH}
                    y2={value}
                  />
                ))}
              </g>
              {fallbackBoundaryPath ? (
                <path
                  className="cdp-map-fallback__country"
                  d={fallbackBoundaryPath}
                  fillRule="evenodd"
                />
              ) : (
                <path
                  className="cdp-map-fallback__country-placeholder"
                  d="M365 80 L640 110 L720 260 L650 555 L470 625 L300 470 L285 225 Z"
                />
              )}
              <g
                className="cdp-map-fallback__adm1-reference"
                data-testid="map-adm1-base-outline"
                aria-label="베트남 63개 성·시 기준 경계"
              >
                {fallbackAdm1Paths.map((row) => (
                  <path key={row.code} d={row.path} fill="none">
                    <title>{row.name}</title>
                  </path>
                ))}
              </g>
              {fallbackSpatial.fills.map((feature) => {
                const isPrimary = feature.elementId === primaryLayerId;
                const layer = layers.find(
                  (item) => item.elementId === feature.elementId
                );
                const selector = layer
                  ? selectorForLayer(
                      layer,
                      selectorByElement[feature.elementId]
                    )
                  : null;
                const variablePresentation =
                  getPublicIndicatorVariablePresentationV129(
                    feature.elementId,
                    feature.variable
                  );
                const publicTitle = publicMapLayerTitleV126(
                  feature.elementId,
                  layer?.publicShortTitle || "지도 데이터"
                );
                const isRegionalScope =
                  layer && rendererOf(layer) === "regional-scope";
                const publicUnit = variablePresentation?.unit || feature.unit;
                const publicValue =
                  feature.value === null
                    ? "결측"
                    : `${formatPublicNumberV126(feature.value, publicUnit)}${
                        feature.elementId === "B-021" &&
                        feature.variable === "gvi-6"
                          ? " / 100"
                          : publicUnit
                          ? ` ${publicUnit}`
                          : ""
                      }`;
                const isSelected =
                  selectedSpatial?.elementId === feature.elementId &&
                  selectedSpatial.selectionKey === feature.adm1Code;
                const selectFeature = () => {
                  setSelected(null);
                  setSelectedSpatial({
                    elementId: feature.elementId,
                    adm1Code: feature.adm1Code,
                    adm1Name: feature.name,
                    value: feature.value,
                    unit: publicUnit,
                    period: selector?.period || feature.period,
                    variableLabel:
                      isRegionalScope
                        ? publicMapFeatureNameV126(
                            feature.properties.displayLabel,
                            "지역 협력사업"
                          )
                        : variablePresentation?.label || layer?.publicShortTitle,
                    selectionKey: feature.adm1Code,
                    properties: {
                      ...feature.properties,
                      sourceRegion: feature.sourceRegion,
                      sourceSpatialUnit: feature.sourceSpatialUnit,
                    },
                  });
                  if (!isPrimary) {
                    setRoleNotice(`선택한 보조 데이터 · ${publicTitle}`);
                  }
                  setAnalysisPanelOpen(true);
                };
                const showTooltip = () =>
                  setFallbackTooltipV129({
                    detail: isRegionalScope
                      ? `${feature.name} · ${
                          typeof feature.properties.participantCount === "number"
                            ? `${feature.properties.participantCount}개 참여국`
                            : "참여국 범위"
                        } · 베트남 참여 ${publicMapFeatureNameV126(
                          feature.properties.vietnamParticipation,
                          "포함"
                        )}`
                      : `${feature.name} · ${
                          variablePresentation?.label || "현재 값"
                        } ${publicValue}`,
                    leftPercent: 50,
                    title: publicTitle,
                    topPercent: 48,
                  });
                return (
                  <path
                    key={`${feature.elementId}:${feature.adm1Code}`}
                    className={`cdp-map-fallback__choropleth ${
                      isPrimary ? "is-primary" : "is-context"
                    } ${isSelected ? "is-selected" : ""}`}
                    data-testid={
                      isPrimary ? "map-selectable-adm1-feature" : undefined
                    }
                    data-selected-adm1={isSelected ? "true" : undefined}
                    data-element-id={feature.elementId}
                    data-layer-role={isPrimary ? "primary" : "context"}
                    data-symbol-shape="area"
                    role="button"
                    tabIndex={0}
                    aria-label={`${publicTitle} · ${feature.name} · ${publicValue}`}
                    d={feature.path}
                    fill={feature.fill}
                    stroke={
                      isPrimary
                        ? undefined
                        : LAYER_COLORS[feature.elementId] || "#48665a"
                    }
                    strokeWidth={
                      isPrimary
                        ? undefined
                        : contextLayerIds.indexOf(feature.elementId) === 0
                        ? 3.4
                        : 1.8
                    }
                    strokeDasharray={
                      isPrimary
                        ? undefined
                        : contextLayerIds.indexOf(feature.elementId) === 0
                        ? "1 1.5"
                        : "4 2"
                    }
                    fillRule="evenodd"
                    onClick={selectFeature}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      selectFeature();
                    }}
                    onFocus={showTooltip}
                    onBlur={() => setFallbackTooltipV129(null)}
                    onMouseEnter={showTooltip}
                    onMouseLeave={() => setFallbackTooltipV129(null)}
                  >
                    <title>
                      {publicTitle} · {feature.name} · {publicValue}
                    </title>
                  </path>
                );
              })}
              {fallbackSpatial.regionalPoints.map((point) => {
                const isPrimary = point.elementId === primaryLayerId;
                const layer = layers.find(
                  (item) => item.elementId === point.elementId
                );
                const publicTitle = publicMapLayerTitleV126(
                  point.elementId,
                  layer?.publicShortTitle || "지도 데이터"
                );
                const projectTitle = publicMapFeatureNameV126(
                  point.properties.projectTitle || point.properties.name,
                  "지역 협력사업"
                );
                const isSelected =
                  selectedSpatial?.elementId === point.elementId &&
                  selectedSpatial.selectionKey === point.selectionKey;
                const selectPoint = () => {
                  const approvedAmount = optionalFiniteNumberV130(
                    point.properties.approvedAmount
                  );
                  setSelected(null);
                  setSelectedSpatial({
                    elementId: point.elementId,
                    adm1Name: projectTitle,
                    value: approvedAmount,
                    unit: "USD",
                    period: point.period,
                    variableLabel: publicMapFeatureNameV126(
                      point.properties.displayLabel,
                      "세부 활동지역"
                    ),
                    selectionKey: point.selectionKey,
                    properties: point.properties,
                  });
                  if (!isPrimary) {
                    setRoleNotice(`선택한 보조 데이터 · ${publicTitle}`);
                  }
                  setAnalysisPanelOpen(true);
                };
                const showTooltip = () =>
                  setFallbackTooltipV129({
                    detail: `${point.name} · ${projectTitle}`,
                    leftPercent: Math.max(
                      8,
                      Math.min(72, (point.x / FALLBACK_VIEWBOX_WIDTH) * 100)
                    ),
                    title: publicTitle,
                    topPercent: Math.max(
                      14,
                      Math.min(90, (point.y / FALLBACK_VIEWBOX_HEIGHT) * 100)
                    ),
                  });
                return (
                  <g
                    key={`${point.elementId}:${point.selectionKey}:${point.name}`}
                    className={`cdp-map-fallback__feature-control cdp-map-fallback__point-control ${
                      isPrimary ? "is-primary" : "is-context"
                    } ${isSelected ? "is-selected" : ""}`}
                    data-testid="map-selectable-regional-activity"
                    data-layer-role={isPrimary ? "primary" : "context"}
                    data-symbol-shape="diamond"
                    role="button"
                    tabIndex={0}
                    aria-label={`${publicTitle} · ${point.name} · ${projectTitle}`}
                    onClick={selectPoint}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      selectPoint();
                    }}
                    onFocus={showTooltip}
                    onBlur={() => setFallbackTooltipV129(null)}
                    onMouseEnter={showTooltip}
                    onMouseLeave={() => setFallbackTooltipV129(null)}
                  >
                    <circle
                      className="cdp-map-fallback__point-hit"
                      cx={point.x}
                      cy={point.y}
                      r={14}
                      fill="transparent"
                    />
                    <rect
                      className="cdp-map-fallback__point"
                      x={point.x - (isSelected ? 6 : 4.5)}
                      y={point.y - (isSelected ? 6 : 4.5)}
                      width={isSelected ? 12 : 9}
                      height={isSelected ? 12 : 9}
                      rx={1}
                      fill={point.color}
                      stroke={isSelected ? "#f0a51a" : "#ffffff"}
                      strokeWidth={isSelected ? 3 : 1.5}
                      transform={`rotate(45 ${point.x} ${point.y})`}
                      pointerEvents="none"
                    />
                    <title>{`${publicTitle} · ${point.name}`}</title>
                  </g>
                );
              })}
              {fallbackSpatial.lines.map((line) => {
                const isPrimary = line.elementId === primaryLayerId;
                const lineLayer = layers.find(
                  (item) => item.elementId === line.elementId
                );
                const publicTitle = publicMapLayerTitleV126(
                  line.elementId,
                  lineLayer?.publicShortTitle || "지도 데이터"
                );
                const isSelected =
                  selectedSpatial?.elementId === line.elementId;
                const selectLine = () => {
                  const selectedStatus =
                    filters[`${line.elementId}:status`] || "all";
                  setSelected(null);
                  setSelectedSpatial({
                    elementId: line.elementId,
                    adm1Name:
                      line.variable === "all"
                        ? "송전망 전체 구간"
                        : `${line.variable} kV 송전망 구간`,
                    value: line.featureCount,
                    unit: "개 구간",
                    period: line.period,
                    variableLabel: "송전망 구간",
                    selectionKey: `network:${line.elementId}`,
                    properties: {
                      ...(line.variable === "all"
                        ? {}
                        : { voltageKv: line.variable }),
                      ...(selectedStatus === "all"
                        ? {}
                        : { status: selectedStatus }),
                    },
                  });
                  if (!isPrimary) {
                    setRoleNotice(`선택한 보조 데이터 · ${publicTitle}`);
                  }
                  setAnalysisPanelOpen(true);
                };
                const showTooltip = () =>
                  setFallbackTooltipV129({
                    detail: `송전망 구간 ${line.featureCount.toLocaleString()}개 · ${line.period}`,
                    leftPercent: 50,
                    title: publicTitle,
                    topPercent: 48,
                  });
                return (
                  <g
                    key={line.elementId}
                    className="cdp-map-fallback__feature-control"
                    data-testid={
                      isPrimary ? "map-selectable-network" : undefined
                    }
                    data-element-id={line.elementId}
                    data-layer-role={isPrimary ? "primary" : "context"}
                    data-symbol-shape="line"
                    role="button"
                    tabIndex={0}
                    aria-label={`${publicTitle} · 송전망 구간 ${line.featureCount.toLocaleString()}개`}
                    onClick={selectLine}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      selectLine();
                    }}
                    onFocus={showTooltip}
                    onBlur={() => setFallbackTooltipV129(null)}
                    onMouseEnter={showTooltip}
                    onMouseLeave={() => setFallbackTooltipV129(null)}
                  >
                    <path
                      className={`cdp-map-fallback__line ${
                        isPrimary ? "is-primary" : "is-context"
                      } ${isSelected ? "is-selected" : ""}`}
                      d={line.path}
                      fill="none"
                      stroke={line.color}
                      pointerEvents="none"
                    />
                    <path
                      className="cdp-map-fallback__line-hit"
                      d={line.path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={16}
                      aria-hidden="true"
                    />
                    <title>{publicTitle}</title>
                  </g>
                );
              })}
              {fallbackPoints.map((point) => {
                const isPrimary = point.elementId === primaryLayerId;
                const pointLayer = layers.find(
                  (item) => item.elementId === point.elementId
                );
                const pointShape = pointLayer
                  ? publicMapSymbolShapeV129(pointLayer)
                  : "circle";
                const publicTitle = publicMapLayerTitleV126(
                  point.elementId,
                  pointLayer?.publicShortTitle || "지도 데이터"
                );
                const titleResolution = pointLayer
                  ? resolvePublicMapEntityTitleV131(point.record, pointLayer)
                  : null;
                const publicName = titleResolution?.title || "지도 데이터";
                const isSelected =
                  selected?.elementId === point.elementId &&
                  selected.recordId === point.record.recordId;
                const radius = isSelected ? 6 : isPrimary ? 4.5 : 3.5;
                const pointShapeClassName = `cdp-map-fallback__point ${
                  isPrimary ? "is-primary" : "is-context"
                } ${isSelected ? "is-selected" : ""}`;
                const selectPoint = () => {
                  setSelected(point.record);
                  setSelectedSpatial(null);
                  if (!isPrimary) {
                    setRoleNotice(`선택한 보조 데이터 · ${publicTitle}`);
                  }
                  setAnalysisPanelOpen(true);
                };
                const showTooltip = () =>
                  setFallbackTooltipV129({
                    detail: titleResolution?.secondaryNote
                      ? `${publicName} · ${titleResolution.secondaryNote}`
                      : publicName,
                    leftPercent: Math.max(
                      8,
                      Math.min(
                        72,
                        (point.x / FALLBACK_VIEWBOX_WIDTH) * 100
                      )
                    ),
                    title: publicTitle,
                    topPercent: Math.max(
                      14,
                      Math.min(
                        90,
                        (point.y / FALLBACK_VIEWBOX_HEIGHT) * 100
                      )
                    ),
                  });
                return (
                  <g
                    key={`${point.elementId}:${point.record.recordId}`}
                    className={`cdp-map-fallback__feature-control cdp-map-fallback__point-control ${
                      isPrimary ? "is-primary" : "is-context"
                    } ${isSelected ? "is-selected" : ""}`}
                    data-testid={
                      isPrimary ? "map-selectable-location" : undefined
                    }
                    data-element-id={point.elementId}
                    data-layer-role={isPrimary ? "primary" : "context"}
                    data-symbol-shape={pointShape}
                    role="button"
                    tabIndex={0}
                    aria-label={`${publicTitle} · ${publicName}`}
                    opacity={isPrimary ? 0.86 : 0.38}
                    onClick={selectPoint}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      selectPoint();
                    }}
                    onFocus={showTooltip}
                    onBlur={() => setFallbackTooltipV129(null)}
                    onMouseEnter={showTooltip}
                    onMouseLeave={() => setFallbackTooltipV129(null)}
                  >
                    <circle
                      className="cdp-map-fallback__point-hit"
                      cx={point.x}
                      cy={point.y}
                      r={9}
                      fill="transparent"
                      aria-hidden="true"
                    />
                    {pointShape === "square" ? (
                      <rect
                        className={pointShapeClassName}
                        x={point.x - radius}
                        y={point.y - radius}
                        width={radius * 2}
                        height={radius * 2}
                        rx={0.8}
                        fill={point.color}
                        pointerEvents="none"
                      />
                    ) : pointShape === "diamond" ? (
                      <rect
                        className={pointShapeClassName}
                        x={point.x - radius * 0.78}
                        y={point.y - radius * 0.78}
                        width={radius * 1.56}
                        height={radius * 1.56}
                        rx={0.5}
                        fill={point.color}
                        pointerEvents="none"
                        transform={`rotate(45 ${point.x} ${point.y})`}
                      />
                    ) : (
                      <circle
                        className={pointShapeClassName}
                        cx={point.x}
                        cy={point.y}
                        r={radius}
                        fill={point.color}
                        pointerEvents="none"
                      />
                    )}
                    <title>{publicTitle} · {publicName}</title>
                  </g>
                );
              })}
            </svg>
            {fallbackTooltipV129 && (
              <div
                className="cdp-map-fallback__tooltip"
                data-testid="map-feature-tooltip"
                role="status"
                style={{
                  left: `${fallbackTooltipV129.leftPercent}%`,
                  top: `${fallbackTooltipV129.topPercent}%`,
                }}
              >
                <strong>{fallbackTooltipV129.title}</strong>
                <span>{fallbackTooltipV129.detail}</span>
              </div>
            )}
          <span className="cdp-map-fallback__attribution">
              Natural Earth · 국가 외곽선 | geoBoundaries · 베트남 63개
              성·시 (CC BY 4.0)
          </span>
          </div>
          <div
            ref={containerRef}
            className={`cdp-map-canvas ${
              baseMapStatus === "ready" ? "is-visible" : "is-suspended"
            }`}
          />
          <span className="cdp-map-public-attribution">
            <a
              href="https://www.naturalearthdata.com/"
              target="_blank"
              rel="noreferrer"
            >
              Natural Earth
            </a>{" "}
            · 국가 외곽선 |{" "}
            <a
              href="https://www.geoboundaries.org/"
              target="_blank"
              rel="noreferrer"
            >
              geoBoundaries
            </a>{" "}
            · 베트남 63개 성·시 (CC BY 4.0)
          </span>
          <div className="cdp-map-status-badge">
            {baseMapStatus === "ready"
              ? "지도 사용 가능"
              : fallbackBoundaryStatus === "ready"
              ? "대체 경계지도 표시 중"
              : "지도 준비 중"}
          </div>
          <div className="cdp-map-overlay-card">
            <strong>
              {focusedLayer
                ? focusedPublicCopy?.titleKo
                : "분석 프리셋을 선택하세요"}
            </strong>
            <div>
              {focusedLayer
                ? loadingIds.includes(focusedLayer.elementId)
                  ? "불러오는 중입니다"
                  : "선로·시설·지역을 선택하면 세부정보를 볼 수 있습니다"
                : "배경지도와 베트남 63개 성·시 경계가 준비되어 있습니다"}
            </div>
            {baseMapStatus === "ready" && keyboardMapFeatureV129 ? (
              <div
                aria-label="키보드 지도 항목 탐색"
                className="cdp-map-keyboard-feature-nav"
                data-testid="map-keyboard-feature-navigation"
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    moveKeyboardFeatureV129(-1);
                  } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    moveKeyboardFeatureV129(1);
                  }
                }}
                role="group"
              >
                <button
                  aria-label="이전 지도 항목"
                  onClick={() => moveKeyboardFeatureV129(-1)}
                  type="button"
                >
                  ←
                </button>
                <button
                  aria-label={`${keyboardMapFeatureV129.label} 선택`}
                  data-testid="map-keyboard-feature-select"
                  onClick={selectKeyboardFeatureV129}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    selectKeyboardFeatureV129();
                  }}
                  title="Enter 또는 Space로 세부정보 보기"
                  type="button"
                >
                  <span>{keyboardMapFeatureV129.label}</span>
                  <small aria-live="polite">
                    {keyboardFeatureIndexV129 + 1} / {keyboardMapFeaturesV129.length}
                  </small>
                </button>
                <button
                  aria-label="다음 지도 항목"
                  onClick={() => moveKeyboardFeatureV129(1)}
                  type="button"
                >
                  →
                </button>
              </div>
            ) : null}
          </div>
          {focusedLayer && (
            <div className="cdp-map-legend" data-testid="map-dynamic-legend">
              <div className="cdp-map-legend__header">
                <strong>{focusedPublicCopy?.titleKo}</strong>
                <span>주 분석</span>
              </div>
              <div
                className="cdp-map-active-legend"
                data-testid="map-active-layer-legend"
              >
                <strong>현재 표시 데이터</strong>
                <ul>
                  {activeLegendIdentitiesV129.map((item) => (
                    <li
                      key={item.elementId}
                      data-element-id={item.elementId}
                      data-layer-role={item.role}
                      data-symbol-shape={item.shape}
                      data-unit={item.unit}
                      data-variable={item.variable}
                      data-testid="map-active-layer-legend-item"
                    >
                      <i
                        className={`cdp-map-symbol cdp-map-symbol--${item.shape}`}
                        style={{ "--cdp-map-symbol-color": item.color } as any}
                        aria-hidden="true"
                        data-testid="map-layer-legend-item"
                      />
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.role === "primary" ? "주 분석" : "보조"} ·{" "}
                          {item.variable} · {item.unit}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <dl className="cdp-map-legend__facts">
                <div>
                  <dt>측정항목</dt>
                  <dd>
                    {focusedVariablePresentationV129?.label ||
                      focusedSemantic?.measureLabel ||
                      focusedLayer.legend.title}
                  </dd>
                </div>
                <div>
                  <dt>단위</dt>
                  <dd data-testid="map-legend-unit">
                    {focusedVariablePresentationV129?.unit ||
                      focusedSemantic?.unit ||
                      focusedVariable?.unit ||
                      focusedLayer.unit}
                  </dd>
                </div>
                <div>
                  <dt>기준연도·기간</dt>
                  <dd>{focusedSelector?.period || focusedLayer.sourceYear || "미표기"}</dd>
                </div>
                <div>
                  <dt>공간 커버리지</dt>
                  <dd>{focusedCoverage}</dd>
                </div>
              </dl>
              {focusedLayer.elementId === "A-024" ? (
                <div className="cdp-map-legend__network" aria-label="전압별 선 표현">
                  {focusedAnalysisV126.summaryRows
                    .filter((row) => /^\d+ kV$/u.test(row.label))
                    .map((row) => (
                      <div key={row.label}>
                        <i
                          style={{
                            background:
                              row.label.startsWith("500")
                                ? "#8b2635"
                                : row.label.startsWith("220")
                                ? "#d35a3d"
                                : "#e59b32",
                            height: row.label.startsWith("500")
                              ? 5
                              : row.label.startsWith("220")
                              ? 4
                              : 3,
                          }}
                        />
                        <span>{row.label}</span>
                        <small>{row.value}</small>
                      </div>
                    ))}
                  <p>실선은 운영 중인 공개 구간을 뜻합니다.</p>
                </div>
              ) : focusedLayer.elementId === "A-023" ? (
                <div
                  className="cdp-map-legend__power"
                  aria-label="발전원 색상과 설비용량 크기"
                >
                  <strong>발전원 색상</strong>
                  <ul>
                    {Object.entries(A023_FUEL_COLORS_V126).map(
                      ([fuel, fuelColor]) => (
                        <li key={fuel}>
                          <i style={{ background: fuelColor }} />
                          <span>{fuel}</span>
                        </li>
                      )
                    )}
                  </ul>
                  <strong>설비용량 크기</strong>
                  <div className="cdp-map-legend__capacity">
                    {[
                      ["10 MW 미만", 6],
                      ["10~99 MW", 8],
                      ["100~499 MW", 11],
                      ["500 MW 이상", 14],
                    ].map(([label, size]) => (
                      <span key={String(label)}>
                        <i
                          style={{
                            width: Number(size),
                            height: Number(size),
                          }}
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                  <p>묶음 숫자는 포함된 발전소 수를 뜻합니다.</p>
                </div>
              ) : rendererOf(focusedLayer) === "regional-scope" ? (
                <div className="cdp-map-legend__explanation">
                  <span>점선 경계·옅은 면: 사업 참여지역</span>
                  <span>점: 원문에서 검증된 세부 활동지역</span>
                  <p>국가 대표좌표는 실제 사업 위치로 표시하지 않습니다.</p>
                </div>
              ) : rendererOf(focusedLayer) === "admin1-choropleth" ||
                rendererOf(focusedLayer) === "partial-choropleth" ? (
                <div className="cdp-map-legend__scale">
                  <span className="cdp-map-legend__gradient" aria-label="낮은 값에서 높은 값">
                    <i
                      style={{
                        background:
                          focusedAnalysisV126.minimum !== null &&
                          focusedAnalysisV126.minimum === focusedAnalysisV126.maximum
                            ? LAYER_COLORS[focusedLayer.elementId] || "#106f4e"
                            : `linear-gradient(90deg, #e6f2ea, ${
                                LAYER_COLORS[focusedLayer.elementId] || "#106f4e"
                              })`,
                      }}
                    />
                  </span>
                  <div>
                    <span>
                      {focusedAnalysisV126.minimum === null
                        ? "값 없음"
                        : `${formatPublicNumberV126(
                            focusedAnalysisV126.minimum,
                            focusedAnalysisV126.unit
                          )} ${focusedAnalysisV126.unit}`.trim()}
                    </span>
                    <span>
                      {focusedAnalysisV126.maximum === null
                        ? "값 없음"
                        : `${formatPublicNumberV126(
                            focusedAnalysisV126.maximum,
                            focusedAnalysisV126.unit
                          )} ${focusedAnalysisV126.unit}`.trim()}
                    </span>
                  </div>
                  <p>
                    값 보유 {focusedAnalysisV126.dataRegionCount}개 · 결측 {focusedAnalysisV126.missingRegionCount}개
                  </p>
                </div>
              ) : (
                <div className="cdp-map-legend__explanation">
                  <span>색상: 자료 유형</span>
                  <span>묶음 숫자: 포함된 위치 수</span>
                </div>
              )}
              {focusedMissingReason && focusedMissingReason !== "없음" && (
                <p className="cdp-map-legend__missing">
                  결측: {focusedMissingReason}
                </p>
              )}
            </div>
          )}
        </main>

        <MapPanelSeparatorV129
          controls="map-analysis-panel-v129"
          side="right"
          {...resizablePanelsV129.rightSeparator}
        />

        <aside
          id="map-analysis-panel-v129"
          className={`cdp-map-evidence ${
            resizablePanelsV129.analysisPanelVisuallyOpen
              ? "is-open"
              : "is-collapsed"
          } ${resizablePanelsV129.rightAutoCollapsed ? "is-auto-collapsed" : ""}`}
          data-testid="map-analysis-panel"
        >
          <div className="cdp-map-panel-header">
            <div>
              <h2>지도 분석</h2>
              <p>전국 현황과 선택한 항목을 함께 확인하세요.</p>
            </div>
            <button
              type="button"
              className="cdp-map-panel-toggle"
              aria-expanded={resizablePanelsV129.analysisPanelVisuallyOpen}
              aria-label={
                resizablePanelsV129.analysisPanelVisuallyOpen
                  ? "지도 분석 접기"
                  : "지도 분석 열기"
              }
              onClick={() => {
                if (resizablePanelsV129.rightAutoCollapsed) {
                  setLayerPanelOpen(false);
                  setAnalysisPanelOpen(true);
                  return;
                }
                setAnalysisPanelOpen((current) => !current);
              }}
            >
              {resizablePanelsV129.analysisPanelVisuallyOpen ? "접기" : "분석 보기"}
            </button>
          </div>

          {focusedLayer && focusedSelector ? (
            <div className="cdp-map-analysis-sections">
              <section data-testid="map-current-analysis">
                <h3>현재 분석</h3>
                <div className="cdp-evidence-grid">
                  <Evidence label="데이터명" value={focusedPublicCopy?.titleKo || ""} />
                  <Evidence
                    label="측정항목"
                    value={
                      focusedVariablePresentationV129?.label ||
                      focusedSemantic?.measureLabel ||
                      focusedLayer.legend.title
                    }
                  />
                  <Evidence
                    label="선택 변수"
                    value={
                      focusedVariablePresentationV129?.label ||
                      focusedSemantic?.indicatorLabel ||
                      focusedVariable?.label ||
                      ""
                    }
                  />
                  <Evidence label="기준연도·기간" value={focusedSelector.period} />
                  <Evidence
                    label="단위"
                    value={
                      focusedVariablePresentationV129?.unit ||
                      focusedSemantic?.unit ||
                      focusedVariable?.unit ||
                      focusedLayer.unit
                    }
                  />
                  {focusedVariablePresentationV129?.directionLabel && (
                    <Evidence
                      label="값 해석"
                      value={focusedVariablePresentationV129.directionLabel}
                    />
                  )}
                  {focusedVariablePresentationV129?.aggregationNotice && (
                    <Evidence
                      label="비교·공간단위"
                      value={focusedVariablePresentationV129.aggregationNotice}
                    />
                  )}
                  <Evidence label="공간 커버리지" value={focusedCoverage} />
                </div>
              </section>

              {focusedInterpretationV129?.explanationRequired &&
                focusedInterpretationV129.meaningBullets.length > 0 && (
                  <section
                    data-testid="map-indicator-meaning-v129"
                    data-direction={focusedInterpretationV129.direction}
                    data-scale={
                      focusedInterpretationV129.scale
                        ? `${focusedInterpretationV129.scale.minimum}-${focusedInterpretationV129.scale.maximum}`
                        : "not-applicable"
                    }
                  >
                    <h3>지표 읽는 법</h3>
                    <ul className="cdp-map-meaning-list">
                      {focusedInterpretationV129.meaningBullets
                        .slice(0, 4)
                        .map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                    </ul>
                  </section>
                )}

              <section data-testid="map-national-summary">
                <h3>전국 요약</h3>
                <div className="cdp-map-summary-list">
                  {focusedAnalysisV126.summaryRows.map((row, index) => (
                    <div key={`${row.label}:${index}`}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
                {focusedAnalysisV126.summaryRows.some((row) => row.derived) && (
                  <p className="cdp-map-derived-note">
                    중앙값은 값이 있는
                    {focusedLayer.elementId === "B-021" ? " 권역" : " 지역"}을
                    오름차순으로 정렬해 가운데 값을 계산한 파생
                    통계입니다.
                  </p>
                )}
              </section>

              <section
                data-testid="map-selected-feature-panel"
                className="cdp-map-selected-panel"
                data-selected-layer-role={selectedFeatureRoleV129 || "none"}
              >
                <h3>선택한 시설·선로·지역 범위</h3>
                {selectedFeatureRoleV129 === "context" && (
                  <span
                    className="cdp-map-selected-role-badge"
                    data-testid="map-selected-context-badge"
                  >
                    선택한 보조 데이터
                  </span>
                )}
                {selectedSpatial &&
                selectedOwningLayer &&
                rendererOf(selectedOwningLayer) === "regional-scope" ? (
                  <div
                    data-testid="map-feature-detail"
                    data-regional-project-detail="true"
                    data-regional-project="true"
                  >
                    <span className="cdp-map-regional-badge">지역 협력사업</span>
                    <h4>
                      {publicMapFeatureNameV126(
                        selectedSpatial.properties.projectTitle ||
                          selectedSpatial.adm1Name,
                        "지역 협력사업"
                      )}
                    </h4>
                    <div className="cdp-evidence-grid">
                      <Evidence
                        label="데이터명"
                        value={publicMapLayerTitleV126(
                          selectedOwningLayer.elementId,
                          selectedOwningLayer.publicShortTitle
                        )}
                      />
                      <Evidence
                        label="사업 참여지역"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.participatingCountries,
                          "참여국 미표기"
                        )}
                      />
                      <Evidence
                        label="사업분야"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.sectorKo ||
                            selectedSpatial.properties.sector,
                          "미표기"
                        )}
                      />
                      <Evidence
                        label="베트남 참여"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.vietnamParticipation,
                          "포함"
                        )}
                      />
                      <Evidence
                        label="상태"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.status,
                          "미표기"
                        )}
                      />
                      <Evidence
                        label="승인액"
                        value={
                          optionalFiniteNumberV130(
                            selectedSpatial.properties.approvedAmount
                          ) === null
                            ? "미표기"
                            : `USD ${formatPublicNumberV126(
                                optionalFiniteNumberV130(
                                  selectedSpatial.properties.approvedAmount
                                ) as number,
                                "USD"
                              )}`
                        }
                      />
                      <Evidence
                        label="수행기관"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.implementingEntity,
                          "미표기"
                        )}
                      />
                      <Evidence
                        label="세부 활동지역"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.verifiedActivityAreas,
                          "원천 미제공"
                        )}
                      />
                      <Evidence
                        label="공간 표현"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.scopeExplanation,
                          "참여국의 지역 협력범위"
                        )}
                      />
                      <Evidence
                        label="좌표 처리"
                        value={`원천 ${
                          optionalFiniteNumberV130(
                            selectedSpatial.properties.sourceCoordinateCount
                          ) ?? "미표기"
                        }개 · 지점 표시 ${
                          optionalFiniteNumberV130(
                            selectedSpatial.properties.displayedCoordinateCount
                          ) ?? "미표기"
                        }개`}
                      />
                      <Evidence
                        label="공간 해석 유의"
                        value={publicMapFeatureNameV126(
                          selectedSpatial.properties.publicSpatialNotice,
                          selectedOwningLayer.publicSpatialNotice
                        )}
                      />
                    </div>
                    {isHttpUrlV121(
                      String(selectedSpatial.properties.officialSource || "")
                    ) && (
                      <a
                        className="cdp-button cdp-button--secondary cdp-button--compact"
                        href={String(
                          selectedSpatial.properties.officialSource || ""
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        공식 출처
                      </a>
                    )}
                  </div>
                ) : selectedSpatial && selectedOwningLayer ? (
                  <div data-testid="map-feature-detail">
                    <h4>{publicMapFeatureNameV126(selectedSpatial.adm1Name, "선택 항목")}</h4>
                    <div className="cdp-evidence-grid">
                      <Evidence
                        label="데이터명"
                        value={publicMapLayerTitleV126(
                          selectedOwningLayer.elementId,
                          selectedOwningLayer.publicShortTitle
                        )}
                      />
                      <Evidence
                        label="측정항목"
                        value={
                          selectedOwningVariablePresentationV129?.label ||
                          selectedSpatial.variableLabel ||
                          selectedOwningSemantic?.measureLabel ||
                          selectedOwningLayer.legend.title
                        }
                      />
                      <Evidence
                        label="값"
                        value={
                          selectedSpatial.value === null ||
                          selectedSpatial.value === undefined
                            ? "원천 미제공"
                            : formatPublicNumberV126(
                                selectedSpatial.value,
                                selectedSpatial.unit || ""
                              ) +
                              (selectedOwningLayer.elementId === "B-021" &&
                              selectedOwningSelector?.variable === "gvi-6"
                                ? " / 100"
                                : "")
                        }
                      />
                      <Evidence
                        label="단위"
                        value={
                          selectedOwningVariablePresentationV129?.unit ||
                          selectedSpatial.unit ||
                          selectedOwningSemantic?.unit ||
                          selectedOwningVariable?.unit ||
                          selectedOwningLayer.unit
                        }
                      />
                      <Evidence
                        label="기준연도·기간"
                        value={
                          selectedSpatial.period ||
                          selectedOwningSelector?.period ||
                          ""
                        }
                      />
                      {selectedOwningVariablePresentationV129?.directionLabel && (
                        <Evidence
                          label="값 해석"
                          value={
                            selectedOwningVariablePresentationV129.directionLabel
                          }
                        />
                      )}
                      {selectedOwningVariablePresentationV129?.aggregationNotice &&
                        !publicTextV126(
                          selectedSpatial.properties.sourceRegion
                        ) && (
                          <Evidence
                            label="비교·공간단위"
                            value={
                              selectedOwningVariablePresentationV129.aggregationNotice
                            }
                          />
                        )}
                      {selectedSpatial.adm1Code && (
                        <Evidence label="지역" value={selectedSpatial.adm1Name} />
                      )}
                      {publicTextV126(selectedSpatial.properties.sourceRegion) && (
                        <Evidence
                          label="비교·공간단위"
                          value={`${publicVietnamSourceRegionV126(
                            publicTextV126(selectedSpatial.properties.sourceRegion) ||
                              undefined
                          )} 권역의 값 · 성 단위 독립 추정값이 아님`}
                        />
                      )}
                      {selectedB021RegionRankV129 && (
                        <Evidence
                          label="권역 비교"
                          value={selectedB021RegionRankV129}
                        />
                      )}
                      {Object.entries(selectedSpatial.properties)
                        .filter(
                          ([key, value]) =>
                            ["voltageKv", "status", "lengthKm"].includes(key) &&
                            value !== null &&
                            value !== undefined &&
                            value !== ""
                        )
                        .map(([key, value]) => (
                          <Evidence
                            key={key}
                            label={
                              key === "voltageKv"
                                ? "전압"
                                : key === "lengthKm"
                                ? "구간 길이"
                                : "운영 상태"
                            }
                            value={
                              key === "voltageKv"
                                ? `${formatValueV121(value)} kV`
                                : key === "lengthKm"
                                ? `${formatValueV121(value)} km`
                                : String(value) === "existing"
                                ? "운영 중"
                                : publicTextV126(formatValueV121(value)) || "미표기"
                            }
                          />
                        ))}
                      <Evidence label="출처" value={publicTextV126(selectedOwningLayer.source) || ""} />
                      <Evidence
                        label="공간 정확도"
                        value={publicMapAccuracyNoticeV126(
                          selectedOwningLayer.elementId,
                          rendererOf(selectedOwningLayer),
                          selectedOwningLayer.accuracyNotice
                        )}
                      />
                      <Evidence
                        label="자료 커버리지"
                        value={selectedOwningCoverage}
                      />
                      <Evidence
                        label="결측 여부"
                        value={
                          selectedSpatial.value === null ||
                          selectedSpatial.value === undefined
                            ? `원천 미제공 · ${selectedOwningMissingReason}`
                            : "값 보유"
                        }
                      />
                    </div>
                  </div>
                ) : selected && selectedLayer ? (
                  <div data-testid="map-feature-detail">
                    <h4>{selectedEntityTitleResolutionV131?.title}</h4>
                    <div className="cdp-evidence-grid">
                      {selectedEntityTitleResolutionV131?.secondaryNote && (
                        <Evidence
                          label="개별 명칭"
                          value={selectedEntityTitleResolutionV131.secondaryNote}
                        />
                      )}
                      <Evidence
                        label="데이터명"
                        value={publicMapLayerTitleV126(
                          selectedLayer.elementId,
                          selectedLayer.publicShortTitle
                        )}
                      />
                      <Evidence
                        label="측정항목"
                        value={
                          selectedOwningVariablePresentationV129?.label ||
                          selectedOwningSemantic?.measureLabel ||
                          selectedLayer.legend.title
                        }
                      />
                      <Evidence
                        label="기준연도"
                        value={selected.provenance.referenceYear || String(selectedLayer.latestYear || "미표기")}
                      />
                      <Evidence label="값" value="1" />
                      <Evidence
                        label="단위"
                        value={
                          selectedOwningVariablePresentationV129?.unit ||
                          selectedOwningSemantic?.unit ||
                          selectedOwningVariable?.unit ||
                          "개"
                        }
                      />
                      {selectedLayer.tooltipFields.map((field) => {
                        if (field === "name") return null;
                        const value = selected.normalizedAttributes?.[field];
                        const hasSourceValue =
                          value !== null &&
                          value !== undefined &&
                          !(typeof value === "string" && value.trim() === "");
                        if (!hasSourceValue) return null;
                        const hasNumericValue =
                          (typeof value === "number" && Number.isFinite(value)) ||
                          (typeof value === "string" &&
                            value.trim() !== "" &&
                            Number.isFinite(Number(value)));
                        const safeValue =
                          field === "capacityMw" && hasNumericValue
                            ? `${formatPublicNumberV126(Number(value), "MW")} MW`
                            : publicTextV126(formatValueV121(value));
                        if (!safeValue) return null;
                        return (
                          <Evidence
                            key={field}
                            label={fieldLabelV121(field)}
                            value={safeValue}
                          />
                        );
                      })}
                      <Evidence
                        label="출처"
                        value={publicTextV126(selected.provenance.sourceOrg) || ""}
                      />
                      <Evidence
                        label="공간 정확도"
                        value={publicMapAccuracyNoticeV126(
                          selectedLayer.elementId,
                          rendererOf(selectedLayer),
                          selectedLayer.accuracyNotice
                        )}
                      />
                      <Evidence
                        label="자료 커버리지"
                        value={selectedOwningCoverage}
                      />
                      <Evidence
                        label="결측 여부"
                        value={(() => {
                          const missingLabels = selectedLayer.tooltipFields
                            .filter((field) => field !== "name")
                            .filter((field) => {
                              const fieldValue =
                                field === "referenceYear"
                                  ? selected.provenance.referenceYear ??
                                    selected.normalizedAttributes?.[field]
                                  : selected.normalizedAttributes?.[field];
                              return (
                                fieldValue === null ||
                                fieldValue === undefined ||
                                (typeof fieldValue === "string" && fieldValue.trim() === "")
                              );
                            })
                            .map((field) => fieldLabelV121(field));
                          return missingLabels.length > 0
                            ? `원천 미제공: ${missingLabels.join(" · ")}`
                            : "표시 항목 값 보유";
                        })()}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="cdp-evidence-empty">
                    지도에서 선로·시설·지역을 선택하면 세부정보를 확인할 수 있습니다.
                  </p>
                )}
              </section>

              {analysisActionLayerV129 && (
              <div className="cdp-action-row cdp-map-analysis-actions">
                <button
                  type="button"
                  className="cdp-button cdp-button--primary"
                  onClick={() => openLayerDetailV125(analysisActionLayerV129)}
                >
                  데이터 상세
                </button>
                {analysisActionLayerV129.downloadStatus === "available" && (
                  <button
                    type="button"
                    className="cdp-button cdp-button--secondary"
                    onClick={() =>
                      onOpenDownload(analysisActionLayerV129.elementId, countryIso3)
                    }
                  >
                    다운로드
                  </button>
                )}
                {analysisActionLayerV129.sourceUrls?.[0] &&
                  isHttpUrlV121(analysisActionLayerV129.sourceUrls[0]) && (
                    <a
                      className="cdp-button cdp-button--secondary"
                      href={analysisActionLayerV129.sourceUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      공식 출처
                    </a>
                )}
              </div>
              )}
            </div>
          ) : (
            <div className="cdp-evidence-empty">
              <h3>분석을 시작하세요</h3>
              <p>프리셋을 선택하면 전국 요약과 상세정보가 여기에 표시됩니다.</p>
              {provider && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary"
                  onClick={() => onOpenCountry(countryIso3)}
                >
                  국가정보 보기
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Evidence({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="cdp-evidence-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function removeLayerFromMap(
  map: MapLibreMap,
  countryIso3: string,
  elementId: string,
  handlers: Record<string, LayerHandlers>
) {
  const ids = layerRuntimeIds(countryIso3, elementId);
  const key = runtimeKey(countryIso3, elementId);
  const handler = handlers[key];
  if (handler) {
    if (map.getLayer(handler.interactiveLayerId)) {
      map.off("click", handler.interactiveLayerId, handler.onClick);
      map.off("mouseenter", handler.interactiveLayerId, handler.onEnter);
      if (handler.onMove) {
        map.off("mousemove", handler.interactiveLayerId, handler.onMove);
      }
      map.off("mouseleave", handler.interactiveLayerId, handler.onPointLeave);
    }
    if (
      handler.additionalInteractiveLayerId &&
      map.getLayer(handler.additionalInteractiveLayerId)
    ) {
      map.off("click", handler.additionalInteractiveLayerId, handler.onClick);
      map.off(
        "mouseenter",
        handler.additionalInteractiveLayerId,
        handler.onEnter
      );
      if (handler.onMove) {
        map.off(
          "mousemove",
          handler.additionalInteractiveLayerId,
          handler.onMove
        );
      }
      map.off(
        "mouseleave",
        handler.additionalInteractiveLayerId,
        handler.onPointLeave
      );
    }
    if (
      handler.clusterLayerId &&
      handler.onClusterClick &&
      map.getLayer(handler.clusterLayerId)
    ) {
      map.off("click", handler.clusterLayerId, handler.onClusterClick);
    }
    if (handler.clusterLayerId && map.getLayer(handler.clusterLayerId)) {
      if (handler.onClusterEnter) {
        map.off("mouseenter", handler.clusterLayerId, handler.onClusterEnter);
      }
      if (handler.onClusterMove) {
        map.off("mousemove", handler.clusterLayerId, handler.onClusterMove);
      }
      if (handler.onClusterLeave) {
        map.off("mouseleave", handler.clusterLayerId, handler.onClusterLeave);
      }
    }
    delete handlers[key];
  }
  [
    ids.selection,
    ids.pointSelection,
    ids.clusterCount,
    ids.pointHit,
    ids.pointSymbol,
    ids.point,
    ids.cluster,
    ids.lineHit,
    ids.line,
    ids.fill,
    ids.outline,
  ].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(ids.source)) map.removeSource(ids.source);
}
