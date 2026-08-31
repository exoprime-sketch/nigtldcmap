import { useEffect, useMemo, useRef, useState } from "react";
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
import { loadWorldCountryBoundaries } from "../data/map/worldCountryBoundaries";
import type { WorldCountryBoundaryGeometry } from "../data/map/worldCountryBoundaries";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import type { MapViewState } from "../types/map";
import {
  entityDisplayNameV121,
  fieldLabelV121,
  formatValueV121,
  isHttpUrlV121,
} from "../utils/vietnamActualV121";
import "../styles/country-data-platform-v122.css";

interface RealMapExplorerPageProps {
  onOpenElement: (
    elementId: string,
    countryIso3: string,
    selectorState?: DataFinderSelectorStateV125
  ) => void;
  onOpenCountry: (iso3: string) => void;
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
      data: "/data/world-countries.geojson",
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
  "/data/vietnam/v2/geometry/vnm-adm1-63.geojson";
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
  return ["line", "admin1-choropleth", "partial-choropleth"].includes(
    rendererOf(layer)
  );
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
  clusterLayerId?: string;
  onClick: (event: MapLayerMouseEvent) => void;
  onEnter: (event: MapLayerMouseEvent) => void;
  onPointLeave: () => void;
  onClusterClick?: (event: MapLayerMouseEvent) => void;
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
    cluster: `v122-cluster-${suffix}`,
    clusterCount: `v126-cluster-count-${suffix}`,
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
      ids.line,
      ids.pointHit,
      ids.lineHit,
      ids.selection,
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) map.moveLayer(layerId);
    });
  });
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
        const properties: Record<string, string | number | boolean | null> = {
          recordId: record.recordId,
          elementId: record.elementId,
          countryIso3: layer.countryIso3,
          name: entityDisplayNameV121(record),
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
  const [selectedPresetId, setSelectedPresetId] =
    useState<PublicMapWorkspacePresetIdV126 | null>(() =>
      isPublicMapWorkspacePresetIdV126(initialState.mapPresetId)
        ? initialState.mapPresetId
        : null
    );
  const [roleNotice, setRoleNotice] = useState("");
  const [adm1OutlineStatus, setAdm1OutlineStatus] =
    useState<LoadStatus>("idle");
  const [adm1Boundary, setAdm1Boundary] =
    useState<VietnamMapGeoJsonV124 | null>(null);
  const [layerPanelOpen, setLayerPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 768
  );
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(true);

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
          renderer === "admin1-choropleth" || renderer === "partial-choropleth";
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
      value: number | null;
      unit: string;
    }> = [];
    const lines: Array<{
      color: string;
      elementId: string;
      featureCount: number;
      path: string;
      period: string;
      variable: string;
    }> = [];
    if (baseMapStatus === "ready") return { fills, lines };
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
          value,
          unit: String(properties.unit || ""),
        });
      });
    });
    return { fills, lines };
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
        renderer === "partial-choropleth"
      ) {
        const asset = spatialByElement[elementId];
        if (!asset) return;
        const selector = selectorForLayer(layer, selectorByElement[elementId]);
        const choropleth =
          renderer === "line"
            ? null
            : choroplethFeatureCollection(layer, asset, selector);
        const data =
          renderer === "line"
            ? lineFeatureCollection(layer, asset, selector, filters)
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
        const fillColor = choropleth
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
          if (isPrimary) {
            map.addLayer({
              id: ids.lineHit,
              type: "line",
              source: ids.source,
              paint: {
                "line-color": "#000000",
                "line-width": 16,
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
                "line-width": 6,
                "line-opacity": 0.96,
              },
            });
            interactiveLayerId = ids.lineHit;
          }
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
          if (isPrimary) {
            map.addLayer({
              id: ids.selection,
              type: "line",
              source: ids.source,
              filter: ["==", ["get", "selectionKey"], "__none__"],
              paint: {
                "line-color": "#f0a51a",
                "line-width": 3.4,
                "line-opacity": 1,
              },
            });
          }
        }

        if (!isPrimary) {
          renderSignaturesRef.current[renderKey] = renderSignature;
          mountedKeysRef.current.add(renderKey);
          return;
        }

        const onClick = (event: MapLayerMouseEvent) => {
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
          const value =
            renderer === "line" && Number.isFinite(lineLength)
              ? lineLength
              : typeof properties.value === "number"
              ? properties.value
              : null;
          setSelected(null);
          setSelectedSpatial({
            elementId,
            adm1Code: String(properties.adm1Code || "") || undefined,
            adm1Name:
              renderer === "line"
                ? `${properties.voltageKv || properties.voltage || ""} kV 송전선로`
                : publicMapFeatureNameV126(
                    properties.adm1Name || properties.name,
                    "성·시"
                  ),
            value,
            unit: String(properties.unit || (renderer === "line" ? "km" : "")),
            period: String(properties.period || layer.sourceYear || ""),
            variableLabel:
              renderer === "line"
                ? "송전망 선로"
                : publicMapFeatureNameV126(
                    properties.variableLabel,
                    publicMapLayerTitleV126(elementId, layer.publicShortTitle)
                  ),
            selectionKey: String(
              properties.selectionKey || properties.adm1Code || ""
            ),
            properties,
          });
        };
        const onEnter = (event: MapLayerMouseEvent) => {
          map.getCanvas().style.cursor = "pointer";
          const properties = event.features?.[0]?.properties || {};
          const rawLength = properties.lengthKm ?? properties.length;
          const parsedLength =
            rawLength === null || rawLength === undefined || rawLength === ""
              ? null
              : Number(rawLength);
          const label =
            renderer === "line"
              ? `${properties.voltageKv || properties.voltage || ""} kV · ${
                  parsedLength !== null && Number.isFinite(parsedLength)
                    ? `${formatPublicNumberV126(parsedLength, "km")} km`
                    : "길이 미표기"
                }`
              : `${publicMapFeatureNameV126(
                  properties.adm1Name || properties.name,
                  "성·시"
                )} · ${
                  properties.hasValue
                    ? `${formatPublicNumberV126(
                        Number(properties.value),
                        String(properties.unit || "")
                      )} ${
                        properties.unit || ""
                      }`
                    : "결측"
                }`;
          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10,
          })
            .setLngLat(event.lngLat)
            .setText(label)
            .addTo(map);
        };
        const onPointLeave = () => {
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
        };
        map.on("click", interactiveLayerId, onClick);
        map.on("mouseenter", interactiveLayerId, onEnter);
        map.on("mouseleave", interactiveLayerId, onPointLeave);
        const key = runtimeKey(countryIso3, elementId);
        handlersRef.current[key] = {
          interactiveLayerId,
          onClick,
          onEnter,
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
          "circle-opacity": isPrimary ? 0.88 : 0.4,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": isPrimary ? 1.5 : 0.8,
        },
      });
      if (isPrimary) {
        map.addLayer({
          id: ids.pointHit,
          type: "circle",
          source: ids.source,
          ...(layer.cluster
            ? { filter: ["!", ["has", "point_count"]] as any }
            : {}),
          paint: {
            "circle-color": "#000000",
            "circle-radius": 14,
            "circle-opacity": 0.001,
          },
        });
        map.addLayer({
          id: ids.selection,
          type: "circle",
          source: ids.source,
          filter: ["==", ["get", "selectionKey"], "__none__"],
          paint: {
            "circle-color": "rgba(0,0,0,0)",
            "circle-radius": 12,
            "circle-stroke-color": "#f0a51a",
            "circle-stroke-width": 3.5,
          },
        });
      }

      if (!isPrimary) {
        renderSignaturesRef.current[renderKey] = renderSignature;
        mountedKeysRef.current.add(renderKey);
        return;
      }

      const onPointClick = (event: MapLayerMouseEvent) => {
        const recordId = String(
          event.features?.[0]?.properties?.recordId || ""
        );
        const record =
          recordIndexRef.current.get(`${elementId}:${recordId}`) || null;
        setSelected(record);
        setSelectedSpatial(null);
      };
      const onPointEnter = (event: MapLayerMouseEvent) => {
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
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
          .setLngLat(coordinates)
          .setText(name)
          .addTo(map);
      };
      const onPointLeave = () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      };
      const onClusterClick = layer.cluster
        ? (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== "Point") return;
            map.easeTo({
              center: feature.geometry.coordinates as [number, number],
              zoom: Math.min(map.getZoom() + 2, 14),
            });
          }
        : undefined;
      map.on("click", ids.pointHit, onPointClick);
      map.on("mouseenter", ids.pointHit, onPointEnter);
      map.on("mouseleave", ids.pointHit, onPointLeave);
      if (onClusterClick) map.on("click", ids.cluster, onClusterClick);
      const key = runtimeKey(countryIso3, elementId);
      handlersRef.current[key] = {
        interactiveLayerId: ids.pointHit,
        clusterLayerId: layer.cluster ? ids.cluster : undefined,
        onClick: onPointClick,
        onEnter: onPointEnter,
        onPointLeave,
        onClusterClick,
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
      const unit = ordered[0]?.unit || focusedVariable?.unit || focusedLayer.unit;
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
    recordsByElement,
    spatialByElement,
  ]);
  const selectedLayer = selected
    ? layers.find((layer) => layer.elementId === selected.elementId) || null
      : null;
  const selectedOwningLayer = selectedSpatial
    ? layers.find((layer) => layer.elementId === selectedSpatial.elementId) || null
    : selectedLayer;

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
    >
      <div className="cdp-map-layout">
        <aside
          className={`cdp-map-sidebar ${layerPanelOpen ? "is-open" : "is-collapsed"}`}
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
                  <strong>{focusedSemantic.measureLabel}</strong>
                  {" · "}
                  {focusedSemantic.indicatorLabel}
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
                      {option.label}
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
                  <dd>{focusedSemantic?.measureLabel || focusedLayer.legend.title}</dd>
                </div>
                <div>
                  <dt>단위</dt>
                  <dd>{focusedSemantic?.unit || focusedVariable?.unit || focusedLayer.unit}</dd>
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

        <main className="cdp-map-canvas-wrap" aria-label="데이터 지도">
          <div
            className="cdp-map-fallback"
            data-status={fallbackBoundaryStatus}
          >
            <svg
              className="cdp-map-fallback__svg"
              viewBox={`0 0 ${FALLBACK_VIEWBOX_WIDTH} ${FALLBACK_VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
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
                const isSelected =
                  isPrimary &&
                  selectedSpatial?.elementId === feature.elementId &&
                  selectedSpatial.selectionKey === feature.adm1Code;
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
                    onClick={() => {
                      if (!isPrimary) return;
                      const layer = layers.find(
                        (item) => item.elementId === feature.elementId
                      );
                      const selector = layer
                        ? selectorForLayer(
                            layer,
                            selectorByElement[feature.elementId]
                          )
                        : null;
                      setSelected(null);
                      setSelectedSpatial({
                        elementId: feature.elementId,
                        adm1Code: feature.adm1Code,
                        adm1Name: feature.name,
                        value: feature.value,
                        unit: feature.unit,
                        period: selector?.period,
                        variableLabel: layer?.publicShortTitle,
                        selectionKey: feature.adm1Code,
                        properties: {},
                      });
                    }}
                  >
                    <title>
                      {feature.name} · {feature.value === null
                        ? "결측"
                        : `${feature.value.toLocaleString()} ${feature.unit}`}
                    </title>
                  </path>
                );
              })}
              {fallbackSpatial.lines.map((line) => {
                const isPrimary = line.elementId === primaryLayerId;
                const isSelected =
                  isPrimary && selectedSpatial?.elementId === line.elementId;
                return (
                  <path
                    key={line.elementId}
                    className={`cdp-map-fallback__line ${
                      isPrimary ? "is-primary" : "is-context"
                    } ${isSelected ? "is-selected" : ""}`}
                    data-testid={
                      isPrimary ? "map-selectable-network" : undefined
                    }
                    d={line.path}
                    fill="none"
                    stroke={line.color}
                    onClick={() => {
                      if (!isPrimary) return;
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
                        variableLabel: "대체 지도 송전망 집계",
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
                    }}
                  >
                    <title>공식 공개자료 송전망</title>
                  </path>
                );
              })}
              {fallbackPoints.map((point) => {
                const isPrimary = point.elementId === primaryLayerId;
                const isSelected =
                  isPrimary && selected?.recordId === point.record.recordId;
                return (
                  <circle
                    key={`${point.elementId}:${point.record.recordId}`}
                    className={`cdp-map-fallback__point ${
                      isPrimary ? "is-primary" : "is-context"
                    } ${isSelected ? "is-selected" : ""}`}
                    data-testid={
                      isPrimary ? "map-selectable-location" : undefined
                    }
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 6 : isPrimary ? 4.5 : 3}
                    fill={point.color}
                    opacity={isPrimary ? 0.86 : 0.38}
                    onClick={() => {
                      if (!isPrimary) return;
                      setSelected(point.record);
                      setSelectedSpatial(null);
                    }}
                  >
                    <title>{entityDisplayNameV121(point.record)}</title>
                  </circle>
                );
              })}
            </svg>
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
          </div>
          {focusedLayer && (
            <div className="cdp-map-legend" data-testid="map-dynamic-legend">
              <div className="cdp-map-legend__header">
                <strong>{focusedPublicCopy?.titleKo}</strong>
                <span>주 분석</span>
              </div>
              <dl className="cdp-map-legend__facts">
                <div>
                  <dt>측정항목</dt>
                  <dd>{focusedSemantic?.measureLabel || focusedLayer.legend.title}</dd>
                </div>
                <div>
                  <dt>단위</dt>
                  <dd data-testid="map-legend-unit">
                    {focusedSemantic?.unit || focusedVariable?.unit || focusedLayer.unit}
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
              {contextLayerIds.length > 0 && (
                <div className="cdp-map-legend__context">
                  <strong>
                    보조 표시 {contextLayerIds.length}개 · 낮은 강조도
                  </strong>
                  <ul>
                    {contextLayerIds.map((elementId, contextIndex) => {
                      const contextLayer = layers.find(
                        (layer) => layer.elementId === elementId
                      );
                      if (!contextLayer) return null;
                      const contextCopy = publicMapLayerCopyV126({
                        elementId,
                        renderer: rendererOf(contextLayer),
                        title: contextLayer.publicShortTitle,
                        accuracyNotice: contextLayer.accuracyNotice,
                      });
                      const contextColor =
                        LAYER_COLORS[elementId] || "#48665a";
                      return (
                        <li key={elementId}>
                          <i
                            style={
                              contextCopy.spatialType === "location"
                                ? { background: contextColor }
                                : {
                                    borderTopColor: contextColor,
                                    borderTopWidth:
                                      contextIndex === 0 ? 4 : 2,
                                    borderTopStyle:
                                      contextIndex === 0 ? "dotted" : "dashed",
                                  }
                            }
                          />
                          <span>
                            {contextCopy.titleKo} · {contextCopy.spatialTypeLabelKo}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
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

        <aside
          className={`cdp-map-evidence ${
            analysisPanelOpen ? "is-open" : "is-collapsed"
          }`}
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
              aria-expanded={analysisPanelOpen}
              aria-label={analysisPanelOpen ? "지도 분석 접기" : "지도 분석 열기"}
              onClick={() => setAnalysisPanelOpen((current) => !current)}
            >
              {analysisPanelOpen ? "접기" : "분석 보기"}
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
                    value={focusedSemantic?.measureLabel || focusedLayer.legend.title}
                  />
                  <Evidence
                    label="선택 변수"
                    value={focusedSemantic?.indicatorLabel || focusedVariable?.label || ""}
                  />
                  <Evidence label="기준연도·기간" value={focusedSelector.period} />
                  <Evidence
                    label="단위"
                    value={focusedSemantic?.unit || focusedVariable?.unit || focusedLayer.unit}
                  />
                  <Evidence label="공간 커버리지" value={focusedCoverage} />
                </div>
              </section>

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
              >
                <h3>선택한 시설·선로·지역</h3>
                {selectedSpatial && selectedOwningLayer ? (
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
                          selectedSpatial.variableLabel ||
                          focusedSemantic?.measureLabel ||
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
                              )
                        }
                      />
                      <Evidence
                        label="단위"
                        value={
                          selectedSpatial.unit ||
                          focusedSemantic?.unit ||
                          focusedVariable?.unit ||
                          selectedOwningLayer.unit
                        }
                      />
                      <Evidence
                        label="기준연도·기간"
                        value={selectedSpatial.period || focusedSelector.period}
                      />
                      {selectedSpatial.adm1Code && (
                        <Evidence label="지역" value={selectedSpatial.adm1Name} />
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
                      <Evidence label="자료 커버리지" value={focusedCoverage} />
                      <Evidence
                        label="결측 여부"
                        value={
                          selectedSpatial.value === null ||
                          selectedSpatial.value === undefined
                            ? `원천 미제공 · ${focusedMissingReason}`
                            : "값 보유"
                        }
                      />
                    </div>
                  </div>
                ) : selected && selectedLayer ? (
                  <div data-testid="map-feature-detail">
                    <h4>{entityDisplayNameV121(selected)}</h4>
                    <div className="cdp-evidence-grid">
                      <Evidence
                        label="데이터명"
                        value={publicMapLayerTitleV126(
                          selectedLayer.elementId,
                          selectedLayer.publicShortTitle
                        )}
                      />
                      <Evidence
                        label="측정항목"
                        value={focusedSemantic?.measureLabel || selectedLayer.legend.title}
                      />
                      <Evidence
                        label="기준연도"
                        value={selected.provenance.referenceYear || String(selectedLayer.latestYear || "미표기")}
                      />
                      <Evidence label="값" value="1" />
                      <Evidence
                        label="단위"
                        value={
                          focusedSemantic?.unit ||
                          focusedVariable?.unit ||
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
                        value={publicMapCoverageTextV126(selectedLayer)}
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

              <div className="cdp-action-row cdp-map-analysis-actions">
                <button
                  type="button"
                  className="cdp-button cdp-button--primary"
                  onClick={() => openLayerDetailV125(focusedLayer)}
                >
                  데이터 상세
                </button>
                {focusedLayer.downloadStatus === "available" && (
                  <button
                    type="button"
                    className="cdp-button cdp-button--secondary"
                    onClick={() => onOpenDownload(focusedLayer.elementId, countryIso3)}
                  >
                    다운로드
                  </button>
                )}
                {focusedLayer.sourceUrls?.[0] &&
                  isHttpUrlV121(focusedLayer.sourceUrls[0]) && (
                    <a
                      className="cdp-button cdp-button--secondary"
                      href={focusedLayer.sourceUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      공식 출처
                    </a>
                  )}
              </div>
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
      map.off("mouseleave", handler.interactiveLayerId, handler.onPointLeave);
    }
    if (
      handler.clusterLayerId &&
      handler.onClusterClick &&
      map.getLayer(handler.clusterLayerId)
    ) {
      map.off("click", handler.clusterLayerId, handler.onClusterClick);
    }
    delete handlers[key];
  }
  [
    ids.selection,
    ids.clusterCount,
    ids.pointHit,
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
