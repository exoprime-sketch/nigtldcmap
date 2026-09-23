import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDatasetUsageV149 } from "../data/publicUsageV149";
import { PROVINCE_KO_V150 } from "../data/map/mapBackdropV150";
import {
  applyMapBackdropV151,
  backdropAttributionV151,
  backdropKindLabelV151,
  backdropOwnsCityLabelsV151,
  BACKDROP_SOURCE_PREFIX_V151,
  MAP_BACKDROP_KINDS_V151,
  MAP_BACKDROP_STORAGE_KEY_V151,
  readMapBackdropKindV151,
  removeMapBackdropV151,
  warmBackdropV151,
  type MapBackdropKindV151,
} from "../data/map/mapBackdropV151";
import { addKoreanMapLabelsV151, KOREAN_LABEL_LAYER_IDS_V151 } from "../data/map/mapLabelsV151";
import {
  aggregateTo34V151,
  boundaryPolicyNoticeV151,
  formerProvinceLabelV151,
  isAggregatingKindV151,
  memberRangeByUnitV151,
  memberSummaryV151,
  parentUnitForV151,
  parseMemberSummaryV151,
  policyKindForVariableV151,
  type BoundaryPolicyKindV151,
} from "../data/map/boundaryPolicyV151";
import {
  ADM1_34_GEOMETRY_PATH_V151,
  ADM1_34_UNITS_V151,
  BOUNDARY_SYSTEM_STORAGE_KEY_V151,
  COUNTRY_OUTLINE_PATH_V151,
  DEFAULT_BOUNDARY_SYSTEM_V151,
  PROVINCE_KO_34_V151,
  REGION_6_GEOMETRY_PATH_V151,
  boundaryGeometryPathV151,
  boundarySystemLabelV151,
  boundarySystemV151,
  boundaryValueNoticeV151,
} from "../data/map/adminBoundaryV151";
import type { BoundarySystemV151 } from "../data/map/adminBoundaryV151";
import "../styles/map-readability-v150.css";
import { isPublicMapFactV143, hasPublicMapFactValueV143 } from "../data/visualization/publicMapCopyV143";
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
  loadVietnamLocationsV151,
  loadVietnamSpatialGeoJsonV124,
  loadVietnamSpatialLayerV124,
} from "../data/vietnam/vietnamDataLoaderV124";
import type {
  VietnamMapGeoJsonV124,
} from "../data/vietnam/vietnamDataLoaderV124";
import type { VietnamMapFactFieldV137, VietnamMapFilterV121 } from "../data/vietnam/vietnamTypesV121";
import { POWER_PLANT_SOURCES_V141 } from "../data/map/powerPlantFactsV141";
import { prepareLayerRecordsV138, attributeText, type PreparedLayerRecordsV138 } from "../data/map/prepareLayerRecordsV148";
import { mapFactsV148, mapIndicatorSourceV148, mapSourceLineV148, publicMapFieldsV148, powerCapacitySummaryV148 } from "../data/map/mapPresentationV148";
import { createMapFeaturePopupV148 } from "../components/map/mapFeaturePopupV148";
import { powerPlantPeriodForSourceV142 } from "../data/visualization/mapSelectorBindingsV125";
import type {
  VietnamLocationSidecarV151,
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
  PUBLIC_MAP_TARGET_CATEGORIES_V138,
  PUBLIC_MAP_TARGETS_V138,
  PUBLIC_MAP_WORKSPACE_LIMITS_V126,
  PUBLIC_MAP_WORKSPACE_PRESETS_V126,
  createPublicMapWorkspaceStateV126,
  isPublicMapWorkspacePresetIdV126,
  publicMapAccuracyNoticeV126,
  publicMapDataFunctionV135,
  publicMapDataItemSummaryV136,
  publicMapLayerCopyV126,
  publicMapLayerTitleV126,
  publicMapPresetContextCandidatesV133,
  publicMapTargetV138,
} from "../data/visualization/publicMapWorkspaceV126";
import type { PublicMapWorkspacePresetIdV126 } from "../data/visualization/publicMapWorkspaceV126";
import {
  MAP_PENDING_LABEL_V140,
  MAP_PENDING_SUMMARY_V140,
  summarizeMapAvailabilityV140,
} from "../data/map/mapAvailabilityV140";
import { formatPublicNumberV126 } from "../data/visualization/publicNumberFormatV126";
import { mapOverlapSummariesV145 } from "../data/map/publicMapOverlapV145";
import { createMapOverlapPopupV145 } from "../components/map/mapOverlapPopupV145";
import {
  publicSourceOrganizationV136_1,
  publicTextV126,
} from "../data/visualization/publicFieldPolicyV126";
import { resolvePublicEntityTitleV131 } from "../data/visualization/publicEntityTitleV131";
import {
  getPublicIndicatorInterpretationV129,
  getPublicIndicatorVariablePresentationV129,
} from "../data/interpretation/publicIndicatorInterpretationV129";
import { loadVietnamCountryOutlineV151, loadWorldCountryBoundaries } from "../data/map/worldCountryBoundaries";
import type { WorldCountryBoundaryGeometry } from "../data/map/worldCountryBoundaries";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import type { MapCameraV151, MapViewState } from "../types/map";
import {
  fieldLabelV121,
  formatValueV121,
  isHttpUrlV121,
} from "../utils/vietnamActualV121";
import { publicAssetUrlV128 } from "../utils/publicAssetUrlV128";
import MapPanelSeparatorV129 from "../components/map/MapPanelSeparatorV129";
import MapDataGuideV130 from "../components/map/MapDataGuideV130";
import MapComparisonWorkspaceV135 from "../components/map/MapComparisonWorkspaceV135";
import type {
  MapComparisonDatasetV135,
  MapComparisonSideV135,
} from "../components/map/MapComparisonWorkspaceV135";
import {
  PublicTermExpandedTextV134,
  PublicTermHelpV134,
  PublicTermTextV134,
} from "../components/help/PublicTermV134";
import { tokenizePublicTermsV134 } from "../utils/publicTermTokenizerV134";
import { InteractiveTimeSeriesChartV127 } from "../components/charts/InteractiveTimeSeriesChartV127";
import type { TimeSeriesV127 } from "../types/chartInteractionV127";
import { useResizableMapPanelsV129 } from "../hooks/useResizableMapPanelsV129";
import "../styles/country-data-platform-v122.css";
import "../styles/map-layout-v129.css";
import "../styles/map-comparison-v135.css";
import "../styles/map-catalog-v138.css";
import "../styles/map-overlap-v145.css";
import "../styles/map-presentation-v148.css";

interface RealMapExplorerPageProps {
  onOpenElement: (
    elementId: string,
    countryIso3: string,
    selectorState?: DataFinderSelectorStateV125
  ) => void;
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

// V151-2: Viet Nam is drawn from its own dissolved outline; the Natural Earth
// world file only supplies the neighbouring countries.
const NOT_VIETNAM_FILTER_V151 = ["!=", ["get", "iso3"], "VNM"];
const MAP_STYLE: any = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    "country-boundaries": {
      type: "geojson",
      data: publicAssetUrlV128("data/world-countries.geojson"),
      attribution: "Natural Earth · 로컬 국가 경계",
    },
    "vnm-country-outline": {
      type: "geojson",
      data: publicAssetUrlV128(COUNTRY_OUTLINE_PATH_V151),
      attribution: "국가 외곽선: geoBoundaries VNM ADM1(개편 전 63개 성·시) 병합",
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
      filter: NOT_VIETNAM_FILTER_V151,
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "cdp-country-outline",
      type: "line",
      source: "country-boundaries",
      filter: NOT_VIETNAM_FILTER_V151,
      paint: {
        "line-color": "#587168",
        "line-width": 1.1,
        "line-opacity": 0.82,
      },
    },
    // Above the neighbours' coarse outlines so none of them shows inside Viet Nam.
    {
      id: "cdp-vnm-country-fill",
      type: "fill",
      source: "vnm-country-outline",
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "cdp-vnm-country-outline",
      type: "line",
      source: "vnm-country-outline",
      paint: {
        "line-color": "#3f5a52",
        "line-width": 1.3,
        "line-opacity": 0.9,
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
  // V138 targets. Climate layers share one hue family, resources another, so
  // the legend reads by category even when several are drawn together.
  "A-025": "#5b4a8a",
  "B-003": "#b8542b",
  "B-004": "#c2662f",
  "B-005": "#a8722b",
  "B-006": "#b23a3a",
  "B-007": "#2a6fa8",
  "B-008": "#1f6f8b",
  "B-012": "#8c2f39",
  "B-023": "#2b7f9b",
  "B-025": "#2d6b8a",
  "B-028": "#1f5f86",
  "B-029": "#3f7d3a",
  "B-030": "#3b8a4f",
  "B-037": "#5a7d2f",
  "B-039": "#2f6f8f",
  "B-040": "#9a4c2c",
  "B-041": "#c98a17",
  "B-042": "#3b6fa5",
  "C-009": "#6b4f9e",
  "C-010": "#4f6f9e",
  "C-012": "#7a5c2e",
  "C-013": "#8a4f7a",
  "C-019": "#5a3d7a",
  "C-022": "#6d4d8f",
  "C-024": "#2f7a5a",
  "E-004": "#1f6b6b",
  "E-005": "#2a7a86",
  "E-006": "#7a5a1f",
  "E-018": "#9a3c62",
  "E-019": "#a24d2a",
};

/**
 * V138: the record set a point layer draws, after the contract's own rules.
 *
 * The map index states, per layer, which rows describe the same feature (five
 * sea-level stations behind 1,575 projection rows), which rows fall outside
 * the country (an investor's Washington head office), and which rows the
 * layer excludes by status (an office never opened, a company that withdrew).
 * Applying those rules here, once, keeps the feature count the reader sees
 * equal to the count the build reported.
 */

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

/** What one value of a region-level layer describes: a GDL region, or a post-2025 province. */
/**
 * What one clicked point on this layer is. "선택 시설" on B-025 called a river
 * basin's representative point a facility; the noun follows the dataset.
 */
function selectedFeatureNounV139(layer: CountryMapLayerV122): string {
  const nouns: Record<string, string> = {
    "B-025": "유역",
    "B-023": "관측지점",
    "B-028": "관측지점",
    "B-008": "관측소",
    "B-012": "재해",
    "B-048": "광산",
    "A-023": "발전소",
    "A-025": "시설·후보지",
    "E-004": "기관",
    "E-005": "기관",
    "E-006": "기관",
    "E-019": "기관",
    "E-018": "사업지",
  };
  return nouns[layer.elementId] || layer.featureIdentity?.label || "시설";
}

/**
 * V151-2: the popup line that explains a value under the 34-unit outline.
 * Aggregated feature: "구성 n개 중 m개 값 있음 · min~max[ · 부분 결측]".
 * Range-only province: its parent unit and the spread of the sibling values.
 */
function boundaryPopupLineV151(properties: Record<string, unknown>, unit: string): string {
  const format = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? formatPublicNumberV126(value, unit) : "결측";
  const summary = parseMemberSummaryV151(properties.memberSummary);
  if (summary) {
    const single = summary.memberCount === 1;
    const range =
      summary.valueCount > 1 && summary.min !== null && summary.max !== null && summary.min !== summary.max
        ? ` · 구성 범위 ${format(summary.min)}~${format(summary.max)}${unit ? ` ${unit}` : ""}`
        : "";
    const coverage = single
      ? ""
      : summary.valueCount === summary.memberCount
        ? `구성 ${summary.memberCount}개 성·시`
        : `구성 ${summary.memberCount}개 성·시 중 ${summary.valueCount}개 값 있음`;
    const flags = summary.partial ? " · 부분 결측" : summary.conflict ? " · 구성 값 불일치" : "";
    switch (summary.kind) {
      case "native-34":
        return `개편 후 34개 기준 원자료 값${single ? "" : ` · ${coverage}`}${flags}`;
      case "sum":
        return single ? "개편에서 합쳐지지 않은 성·시" : `${coverage} 합계${range}${flags}`;
      case "count-sum":
        return single ? "" : `${coverage} 문서 수 합계${flags}`;
      case "membership-or":
        return single ? "" : `${coverage} 중 참여 ${summary.valueCount}개${flags}`;
      case "area-weighted-mean":
        return single ? "개편에서 합쳐지지 않은 성·시" : `${coverage} 면적가중평균${range}${flags}`;
      default:
        return single ? "" : `${coverage}${range}${flags}`;
    }
  }
  const parentName = publicTextV126(properties.parentUnitName);
  if (parentName && properties.policyKind === "range-only") {
    const count = Number(properties.parentValueCount || 0);
    const total = Number(properties.parentMemberCount || 0);
    if (!count) return `${parentName}(34개 기준) · 구성 성·시 값 없음`;
    return `${parentName}(34개 기준) 구성 범위 ${format(properties.parentMin)}~${format(properties.parentMax)}${
      unit ? ` ${unit}` : ""
    } · ${total}개 중 ${count}개 값`;
  }
  return "";
}

/**
 * V151-2: the extent of one layer's drawable data - polygons with a value, or
 * located points - as [[west, south], [east, north]], or null when nothing
 * is loaded yet.
 */
function layerBoundsV151(
  layer: CountryMapLayerV122,
  spatialByElement: Record<string, SpatialRuntimeAsset>,
  recordsByElement: Record<string, CountryEntityV122[]>
): [[number, number], [number, number]] | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  const extend = (lng: number, lat: number) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  };
  const walk = (node: unknown) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number") {
      extend(Number(node[0]), Number(node[1]));
      return;
    }
    node.forEach(walk);
  };
  const asset = spatialByElement[layer.elementId];
  if (asset) {
    asset.geometry.features.forEach((feature) => walk(feature.geometry.coordinates));
  } else {
    (recordsByElement[layer.elementId] || []).forEach((record) => {
      if (typeof record.longitude === "number" && typeof record.latitude === "number") {
        extend(record.longitude, record.latitude);
      }
    });
  }
  if (!Number.isFinite(west) || !Number.isFinite(north)) return null;
  return [
    [west, south],
    [east, north],
  ];
}

/**
 * A layer's extent clipped to the country's own map view: the province
 * assets carry offshore islands 5° east of the mainland, which would otherwise
 * drag the camera out to sea.
 */
function clipToCountryBoundsV151(
  bounds: [[number, number], [number, number]] | null,
  country: [[number, number], [number, number]] | null | undefined
): [[number, number], [number, number]] | null {
  if (!bounds) return null;
  if (!country) return bounds;
  const west = Math.max(bounds[0][0], country[0][0]);
  const south = Math.max(bounds[0][1], country[0][1]);
  const east = Math.min(bounds[1][0], country[1][0]);
  const north = Math.min(bounds[1][1], country[1][1]);
  if (west >= east || south >= north) return country;
  return [
    [west, south],
    [east, north],
  ];
}

function boundsIntersectV151(
  a: [[number, number], [number, number]],
  b: { getWest(): number; getSouth(): number; getEast(): number; getNorth(): number }
): boolean {
  return !(a[1][0] < b.getWest() || a[0][0] > b.getEast() || a[1][1] < b.getSouth() || a[0][1] > b.getNorth());
}

/** V151-2: whether an aggregated area feature (34-unit or six-region) contains a province. */
function fillHasMemberV151(properties: Record<string, unknown>, code: string): boolean {
  if (!code) return false;
  const raw = properties.memberAdm1Codes;
  let members: string[] = [];
  if (Array.isArray(raw)) members = raw.map(String);
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      members = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      members = raw.split(",").map((item) => item.trim());
    }
  }
  if (!members.length) return false;
  // The probe may itself be a 34-unit code (an aggregated statistical point);
  // it sits inside the area when any of its member provinces does.
  const probeCodes = ADM1_34_UNITS_V151.find((unit) => unit.unitCode === code)?.memberAdm1Codes || [code];
  return probeCodes.some((member) => members.includes(member));
}

function regionUnitLabelV138(layer: CountryMapLayerV122): string {
  if (layer.elementId === "B-021") return "권역";
  if (layer.aggregationLevel === "post-2025-34-unit") return "개편 후 성·시";
  return "권역";
}

function publicVietnamSourceRegionV126(value: string | undefined): string {
  if (!value) return "미표기 권역";
  return VIETNAM_SOURCE_REGION_LABELS_V126[value] || publicTextV126(value) || "미표기 권역";
}

const VNM_ADM1_GEOMETRY_URL_V126 =
  publicAssetUrlV128("data/vietnam/v2/geometry/vnm-adm1-63.geojson");
/** V151: the reference outline follows the chosen vintage; values do not. */
function vnmAdm1ReferenceUrlV151(system: BoundarySystemV151): string {
  return publicAssetUrlV128(boundaryGeometryPathV151(system));
}
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

/**
 * V135 comparison workspace DOM contract. Each pane is an equal primary view;
 * panning or zooming one pane synchronizes (동기화) the other to the same extent.
 */
export const MAP_COMPARE_PANE_TEST_IDS_V135 = [
  "map-compare-pane-a",
  "map-compare-pane-b",
] as const;

function rendererOf(layer: CountryMapLayerV122) {
  return layer.renderer || (layer.cluster ? "cluster" : "point");
}

function publicMapCoverageTextV126(layer: CountryMapLayerV122): string {
  if (layer.elementId === "A-023") return "발전소 좌표 레코드(두 출처, 중복 미통합)";
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
  /** V151-2: set when the selected feature is a 34-unit aggregate. */
  unitCode?: string;
  memberAdm1Codes?: string[];
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
  | "triangle"
  | "line"
  | "square";

interface PublicMapLegendIdentityV129 {
  /** V138: selected, but its drawing is switched off. */
  hidden?: boolean;
  /** V138: a hollow symbol marks rows placed at a representative point. */
  hasApproximate?: boolean;
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

interface MapOverlapChoiceV133 {
  elementId: string;
  label: string;
  layerId: string;
  priority: number;
  properties: Record<string, unknown>;
  role: PublicMapLayerRoleV129;
  selectionKey: string;
}

interface MapHitPriorityV133 {
  contextLayerIds: string[];
  lastContextElementId: string | null;
  primaryElementId: string | null;
  selectedElementId: string | null;
  selectedSelectionKey: string | null;
}

interface StatisticalRepresentativePointV133 {
  color: string;
  elementId: string;
  name: string;
  period: string;
  properties: Record<string, unknown>;
  selectionKey: string;
  unit: string;
  value: number;
  variable: string;
  x: number;
  y: number;
}

interface PublicPowerPlantFactsV132 {
  capacity: string | null;
  fuel: string | null;
  status: string | null;
  year: string | null;
}

interface SelectedRegionTrendV132 {
  measureLabel: string;
  scenarioSeries: boolean;
  region: string;
  rows: Array<{ period: string; value: number }>;
  series: TimeSeriesV127[];
  unit: string;
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

/**
 * Read-only observation handle for the candidate QA harness.
 *
 * Attached only when the page is served from the local verification server, so
 * it cannot appear on the deployed site, and it is not reachable from any menu.
 * Everything it exposes is a read of what MapLibre has already rendered:
 * queryRenderedFeatures and project. It holds no setter, touches no React
 * state, and cannot put the page into a "selected" or "loaded" state - a test
 * that wants a selection has to drive the real control like a user would.
 *
 * It exists because asserting that the thing under the pointer is the thing the
 * panel then describes needs the renderer's own idea of what is on screen and
 * where. Without it a map test can only confirm that a click was dispatched.
 */
function attachMapObserverV137(map: MapLibreMap, countryIso3: string): void {
  const host =
    typeof window === "undefined" ? "" : String(window.location.hostname || "");
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]") return;

  const hitLayerIds = (elementId: string): string[] => {
    const ids = layerRuntimeIds(countryIso3, elementId);
    return [ids.pointHit, ids.lineHit, ids.fill, ids.cluster].filter((layerId) =>
      Boolean(map.getLayer(layerId))
    );
  };
  const identify = (feature: maplibregl.MapGeoJSONFeature) => {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    return {
      layerId: feature.layer.id,
      geometryType: feature.geometry?.type ?? null,
      selectionKey: String(
        properties.selectionKey ??
          properties.recordId ??
          properties.adm1Code ??
          properties.cluster_id ??
          feature.id ??
          ""
      ),
      name: String(properties.name ?? properties.label ?? properties.title ?? ""),
      adm1Code: String(properties.adm1Code ?? ""),
      isCluster: Boolean(properties.cluster),
      properties,
    };
  };

  const observer = {
    ready: () => map.isStyleLoaded() && map.areTilesLoaded(),
    /**
     * Where the camera is, and whether it is still moving.
     *
     * Tiles can be loaded while a fitBounds is still easing, so a probe taken
     * on ready() alone can resolve a screen point that the camera then moves
     * out from under - which is how a run hovered a point it had resolved for
     * Lai Châu and read Lào Cai.
     */
    camera: () => {
      const center = map.getCenter();
      return {
        lng: center.lng,
        lat: center.lat,
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        moving: map.isMoving(),
      };
    },
    canvasRect: () => {
      const rect = map.getCanvas().getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    },
    layersFor: hitLayerIds,
    /**
     * Style layers with their visibility, so a runner can confirm the V150
     * backdrop and Korean label layers exist and toggle. Read-only.
     */
    styleLayers: () =>
      (map.getStyle()?.layers || []).map((layer) => ({
        id: layer.id,
        type: layer.type,
        source: "source" in layer ? String(layer.source || "") : "",
        visibility: map.getLayoutProperty(layer.id, "visibility") || "visible",
      })),
    /** Names carried by a GeoJSON source (the V150 Korean place labels). Read-only. */
    sourceNames: (sourceId: string) =>
      map.getSource(sourceId)
        ? map.querySourceFeatures(sourceId).map((feature) => String(feature.properties?.name ?? ""))
        : [],
    /** Where a source coordinate currently lands on screen. Read-only. */
    project: (lng: number, lat: number) => {
      const rect = map.getCanvas().getBoundingClientRect();
      const point = map.project([lng, lat]);
      return {
        x: rect.left + point.x,
        y: rect.top + point.y,
        insideCanvas:
          point.x >= 0 && point.y >= 0 && point.x <= rect.width && point.y <= rect.height,
      };
    },
    /** Every feature of this element MapLibre currently has rendered. */
    renderedFeatures: (elementId: string) => {
      const layers = hitLayerIds(elementId);
      if (!layers.length) return [];
      const seen = new Set<string>();
      return map
        .queryRenderedFeatures({ layers })
        .map(identify)
        .filter((item) => {
          if (!item.selectionKey || seen.has(item.selectionKey)) return false;
          seen.add(item.selectionKey);
          return true;
        });
    },
    /** What is actually under this viewport CSS point. */
    queryAt: (x: number, y: number, elementId?: string) => {
      const rect = map.getCanvas().getBoundingClientRect();
      const point: [number, number] = [x - rect.left, y - rect.top];
      const layers = elementId ? hitLayerIds(elementId) : undefined;
      if (elementId && !layers?.length) return [];
      return map
        .queryRenderedFeatures(point, layers ? { layers } : undefined)
        .map(identify);
    },
    /**
     * A viewport point that genuinely lands on the named feature, found by
     * probing the renderer rather than by trusting a centroid: a centroid can
     * fall in a hole, outside a concave province, or off a line entirely.
     * Returns null when the feature is on the map but no probed point hits it.
     */
    hitPointFor: (elementId: string, selectionKey: string, step = 12) => {
      const layers = hitLayerIds(elementId);
      if (!layers.length) return null;
      const rect = map.getCanvas().getBoundingClientRect();
      const describe = (element: Element | null) =>
        element
          ? element.tagName.toLowerCase() +
            (element.className && typeof element.className === "string"
              ? `.${element.className.split(/\s+/)[0]}`
              : "")
          : null;
      let covered: { x: number; y: number; occludedBy: string | null } | null = null;
      const topmostAt = (x: number, y: number) => {
        const under = map.queryRenderedFeatures([x, y], { layers }).map(identify);
        return Boolean(under.length && under[0].selectionKey === selectionKey);
      };
      const describeAt = (x: number, y: number) => {
        const viewportX = rect.left + x;
        const viewportY = rect.top + y;
        const topmost =
          typeof document === "undefined"
            ? null
            : document.elementFromPoint(viewportX, viewportY);
        return {
          x: viewportX,
          y: viewportY,
          occludedBy:
            !topmost || topmost === map.getCanvas() ? null : describe(topmost),
        };
      };
      // A point feature is a few pixels across, so a grid scan can step right
      // over it. Ask the renderer where this feature is and try that first;
      // the scan below stays as the fallback for lines and polygons.
      const drawn = map
        .queryRenderedFeatures({ layers })
        .find((feature) => identify(feature).selectionKey === selectionKey);
      const geometry = drawn?.geometry;
      if (geometry && geometry.type === "Point") {
        const [lng, lat] = geometry.coordinates as [number, number];
        const projected = map.project([lng, lat]);
        if (
          projected.x >= 0 &&
          projected.y >= 0 &&
          projected.x <= rect.width &&
          projected.y <= rect.height &&
          topmostAt(projected.x, projected.y)
        ) {
          const at = describeAt(projected.x, projected.y);
          if (!at.occludedBy) return at;
          covered = at;
        }
      }
      for (let y = 4; y < rect.height - 4; y += step) {
        for (let x = 4; x < rect.width - 4; x += step) {
          // The target has to be the feature the renderer puts on top here,
          // not merely one of several under the pointer. On a province border
          // several polygons answer the same point, and the app - like any
          // reader - gets the topmost one; probing for mere presence handed
          // back border pixels where the neighbour wins, so a run hovered
          // Lai Châu's outline and read Lào Cai's value.
          if (!topmostAt(x, y)) continue;
          const at = describeAt(x, y);
          if (!at.occludedBy) return at;
          // Keep the first covered hit, but carry on looking. A feature is only
          // genuinely unreachable when every point that lands on it is behind
          // some panel or header - reporting the first covered point as an
          // occlusion defect would flag a province merely because its northern
          // tip happens to sit under the legend.
          if (!covered) covered = at;
        }
      }
      return covered;
    },
  };
  (window as unknown as Record<string, unknown>).__nigtMapObserverV137 = observer;
  // V151-2: the raw instance for the label/viewport runners (localhost only, like the observer).
  (window as unknown as Record<string, unknown>).__cdpMapV151 = map;
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
  elementId: string,
  priority?: MapHitPriorityV133
): boolean {
  const candidates = mapHitCandidatesV133(
    map,
    point,
    countryIso3,
    activeElementIds,
    priority
  );
  return !candidates.length || candidates[0].elementId === elementId;
}

/**
 * What tells one overlapping feature from another in the picker.
 *
 * Line features carry no name, so the old label fell back to the layer title -
 * and four transmission segments crossing at one pixel all read "베트남 송전망",
 * beside a popup that had already printed that title. A reader could not tell
 * the four choices apart, let alone pick the right one. Voltage and length are
 * what the source distinguishes these by; the feature id is the last resort,
 * and it is still an answer rather than the same words four times.
 */
function overlapChoiceLabelV137(
  elementId: string,
  properties: Record<string, unknown>,
  selectionKey: string
): string {
  // The most specific thing first. A project's activity site and its
  // participation range are two different choices at the same spot, and both
  // carry the project title - listing that title three times gave the reader
  // three identical rows to choose between.
  const role = publicTextV126(properties.displayLabel);
  const site = publicTextV126(properties.activitySiteLabel);
  if (site) return role ? `${role} · ${site}` : site;
  const named = publicTextV126(
    properties.name || properties.projectTitle || properties.adm1Name
  );
  if (named) return role && role !== named ? `${role} · ${named}` : named;
  if (role) return role;
  // The source stores voltage as a number, and publicTextV126 returns null for
  // anything that is not a string - which is why the voltage silently vanished
  // from these labels and left four segments distinguished only by length.
  const rawVoltage = properties.voltageKv ?? properties.voltage;
  const voltage =
    rawVoltage === null || rawVoltage === undefined || rawVoltage === ""
      ? ""
      : String(rawVoltage);
  const rawLength = properties.lengthKm ?? properties.length;
  const length = Number(rawLength);
  const parts = [
    voltage ? `${voltage} kV` : "",
    Number.isFinite(length) ? `${formatPublicNumberV126(length, "km")} km` : "",
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return selectionKey || publicMapLayerTitleV126(elementId);
}

function mapHitCandidatesV133(
  map: MapLibreMap,
  point: MapLayerMouseEvent["point"],
  countryIso3: string,
  activeElementIds: string[],
  priority?: MapHitPriorityV133
): MapOverlapChoiceV133[] {
  const ownerByLayer = new Map<string, string>();
  const interactiveLayers = activeElementIds.flatMap((activeElementId) => {
    const ids = layerRuntimeIds(countryIso3, activeElementId);
    return [ids.pointHit, ids.lineHit, ids.fill, ids.cluster]
      .filter((layerId) => Boolean(map.getLayer(layerId)))
      .map((layerId) => {
        ownerByLayer.set(layerId, activeElementId);
        return layerId;
      });
  });
  if (!interactiveLayers.length) return [];
  const seen = new Set<string>();
  return map
    .queryRenderedFeatures(point, { layers: interactiveLayers })
    .flatMap((feature): MapOverlapChoiceV133[] => {
      const elementId = ownerByLayer.get(feature.layer.id);
      if (!elementId) return [];
      const properties = (feature.properties || {}) as Record<string, unknown>;
      const selectionKey = String(
        properties.selectionKey ||
          properties.recordId ||
          properties.adm1Code ||
          properties.cluster_id ||
          feature.id ||
          ""
      );
      const dedupKey = `${elementId}:${selectionKey}`;
      if (seen.has(dedupKey)) return [];
      seen.add(dedupKey);
      const role: PublicMapLayerRoleV129 =
        elementId === priority?.primaryElementId ? "primary" : "context";
      const selected =
        elementId === priority?.selectedElementId &&
        selectionKey === priority?.selectedSelectionKey;
      const contextIndex = priority?.contextLayerIds.indexOf(elementId) ?? -1;
      const hitPriority = selected
        ? 0
        : role === "primary"
        ? 100
        : elementId === priority?.lastContextElementId
        ? 200
        : 300 + (contextIndex < 0 ? 99 : contextIndex);
      const label = overlapChoiceLabelV137(elementId, properties, selectionKey);
      return [
        {
          elementId,
          label,
          layerId: feature.layer.id,
          priority: hitPriority,
          properties,
          role,
          selectionKey,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.priority - right.priority ||
        left.elementId.localeCompare(right.elementId) ||
        left.selectionKey.localeCompare(right.selectionKey)
    );
}

function representativeCoordinateV133(
  geometry: GeoJSON.Geometry
): [number, number] | null {
  const coordinates: Array<[number, number]> = [];
  const collect = (value: unknown): void => {
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      typeof value[0] === "number" &&
      Number.isFinite(value[0]) &&
      typeof value[1] === "number" &&
      Number.isFinite(value[1])
    ) {
      coordinates.push([value[0], value[1]]);
      return;
    }
    if (Array.isArray(value)) value.forEach(collect);
  };
  collect((geometry as { coordinates?: unknown }).coordinates);
  if (!coordinates.length) return null;
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return [
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
  ];
}

function statisticalRepresentativePointsV133(
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: collection.features.flatMap((feature, index) => {
      if (!feature.properties?.hasValue) return [];
      const coordinate = representativeCoordinateV133(feature.geometry);
      if (!coordinate) return [];
      const selectionKey = String(
        feature.properties?.selectionKey || feature.properties?.adm1Code || index
      );
      return [
        {
          type: "Feature" as const,
          id: feature.id ?? selectionKey,
          geometry: { type: "Point" as const, coordinates: coordinate },
          properties: {
            ...feature.properties,
            selectionKey,
            coordinateMeaning: "statistical-representative-point",
            publicSpatialNotice:
              "성·시 단위 통계를 구분하기 위한 대표점이며 실제 사업 위치가 아닙니다.",
          },
        },
      ];
    }),
  };
}

function uniqueB021RegionRankV133(
  data: VietnamSpatialLayerAssetV124 | undefined,
  selector: LayerSelectorState,
  sourceRegion: string
): string {
  if (!data || selector.variable !== "gvi-6" || !sourceRegion) return "";
  const byRegion = new Map<string, number>();
  spatialValuesForSelectorV125(data, selector).forEach((row) => {
    if (row.sourceRegion && Number.isFinite(row.value)) {
      byRegion.set(row.sourceRegion, row.value);
    }
  });
  if (byRegion.size !== 6) return "";
  const ordered = Array.from(byRegion.entries()).sort(
    ([leftRegion, leftValue], [rightRegion, rightValue]) =>
      rightValue - leftValue || leftRegion.localeCompare(rightRegion)
  );
  const rank = ordered.findIndex(([region]) => region === sourceRegion);
  return rank >= 0 ? `베트남 6개 권역 중 ${rank + 1}위` : "";
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

/** The variable key a measure and a scenario map to, or the measure's first variable. */
function variableKeyForGroupV138(
  layer: CountryMapLayerV122,
  measureKey: string,
  scenario: string | null
): string {
  const variables = layer.selectors.variables;
  const exact = variables.find(
    (option) =>
      option.measureKey === measureKey && (option.scenario || null) === (scenario || null)
  );
  if (exact) return exact.key;
  const sameMeasure = variables.find((option) => option.measureKey === measureKey);
  return sameMeasure?.key || layer.selectors.defaultVariable;
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
            sourceIndicatorId: value?.sourceIndicatorId || "",
            sourceSpatialUnit: value?.sourceSpatialUnit || "admin1",
            selectionKey: adm1Code,
          },
        };
      }),
    },
  };
}

/** V151-2: what the outline toggle and the layer's policy resolve to for one render. */
type BoundaryRenderModeV151 = "63" | "34" | "region-6";

interface BoundaryRenderContextV151 {
  system: BoundarySystemV151;
  geometry34: VietnamMapGeoJsonV124 | null;
  region6: VietnamMapGeoJsonV124 | null;
}

interface ChoroplethCollectionV151 {
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  minimum: number;
  maximum: number;
  mode: BoundaryRenderModeV151;
  kind: BoundaryPolicyKindV151;
}

function areaKm2ByAdm1CodeV151(geometry34: VietnamMapGeoJsonV124 | null): Record<string, number> | null {
  if (!geometry34) return null;
  const areas: Record<string, number> = {};
  for (const feature of geometry34.features) {
    const members = feature.properties?.memberAreaKm2;
    if (!members || typeof members !== "object") continue;
    for (const [code, km2] of Object.entries(members as Record<string, unknown>)) {
      if (typeof km2 === "number" && Number.isFinite(km2)) areas[code] = km2;
    }
  }
  return Object.keys(areas).length ? areas : null;
}

function variableLabelForSelectorV151(layer: CountryMapLayerV122, selector: LayerSelectorState, fallback?: string): string {
  return (
    fallback ||
    layer.selectors.variables.find((row) => row.key === selector.variable)?.label ||
    layer.publicShortTitle
  );
}

/**
 * The choropleth collection the map draws, after the boundary policy.
 *
 * - 63-unit outline: the source rows as published (unchanged behaviour).
 * - 34-unit outline + aggregating policy: one feature per 34-unit carrying the
 *   aggregated value and a `memberSummary` for the popup and the panel.
 * - 34-unit outline + range-only: still the 63 features, each decorated with
 *   its parent unit and the member range - no single 34 value is invented.
 * - six-region-only (B-021): the six GDL regions, whatever the toggle says.
 */
function choroplethFeatureCollectionV151(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  selector: LayerSelectorState,
  context: BoundaryRenderContextV151
): ChoroplethCollectionV151 {
  const kind = policyKindForVariableV151(layer.boundaryPolicy, selector.variable);
  const values = asset.data ? spatialValuesForSelectorV125(asset.data, selector) : [];
  const variableLabel = variableLabelForSelectorV151(layer, selector, values[0]?.variableLabel);
  const unit = values[0]?.unit || "";

  if (kind === "six-region-only" && context.region6) {
    const byRegion = new Map<string, VietnamSpatialLayerAssetV124["values"][number]>();
    for (const row of values) {
      if (row.sourceRegion && !byRegion.has(row.sourceRegion)) byRegion.set(row.sourceRegion, row);
    }
    const numeric = [...byRegion.values()].map((row) => row.value).filter(Number.isFinite);
    return {
      mode: "region-6",
      kind,
      minimum: numeric.length ? Math.min(...numeric) : 0,
      maximum: numeric.length ? Math.max(...numeric) : 1,
      collection: {
        type: "FeatureCollection",
        features: context.region6.features.map((feature) => {
          const regionKey = String(feature.properties?.regionKey || feature.properties?.name || "");
          const row = byRegion.get(regionKey);
          return {
            type: "Feature" as const,
            id: regionKey,
            geometry: feature.geometry as GeoJSON.Geometry,
            properties: {
              ...feature.properties,
              elementId: layer.elementId,
              adm1Code: regionKey,
              adm1Name: String(feature.properties?.nameKo || regionKey),
              value: row?.value ?? null,
              hasValue: Boolean(row),
              unit: row?.unit || unit,
              period: selector.period,
              variable: selector.variable,
              variableLabel: row?.variableLabel || variableLabel,
              sourceRegion: regionKey,
              sourceIndicatorId: row?.sourceIndicatorId || "",
              sourceSpatialUnit: "region",
              selectionKey: regionKey,
              boundarySystem: "gdl-six-region",
              policyKind: kind,
            },
          };
        }),
      },
    };
  }

  const areas = areaKm2ByAdm1CodeV151(context.geometry34);
  const canAggregate =
    context.system === "post-2025-34" &&
    isAggregatingKindV151(kind) &&
    context.geometry34 !== null &&
    (kind !== "area-weighted-mean" || areas !== null);
  if (canAggregate && context.geometry34) {
    const adm1NameByCode: Record<string, string> = {};
    for (const feature of asset.geometry.features) {
      const code = String(feature.properties?.adm1Code || "");
      if (code) adm1NameByCode[code] = String(feature.properties?.name || code);
    }
    const rows = aggregateTo34V151(values, kind, {
      areaKm2ByAdm1Code: areas || undefined,
      adm1NameByCode,
    });
    const byUnit = new Map(rows.map((row) => [row.unitCode, row]));
    const numeric = rows.map((row) => row.value).filter((value): value is number => typeof value === "number");
    return {
      mode: "34",
      kind,
      minimum: numeric.length ? Math.min(...numeric) : 0,
      maximum: numeric.length ? Math.max(...numeric) : 1,
      collection: {
        type: "FeatureCollection",
        features: context.geometry34.features.map((feature) => {
          const unitCode = String(feature.properties?.unitCode || "");
          const row = byUnit.get(unitCode);
          const value = row?.value ?? null;
          return {
            type: "Feature" as const,
            id: unitCode,
            geometry: feature.geometry as GeoJSON.Geometry,
            properties: {
              ...feature.properties,
              elementId: layer.elementId,
              unitCode,
              // Compatibility key: every selection and panel path keys on adm1Code.
              adm1Code: unitCode,
              adm1Name: row?.unitName || String(feature.properties?.name || unitCode),
              value,
              hasValue: value !== null,
              unit: row?.unit || unit,
              period: selector.period,
              variable: selector.variable,
              variableLabel,
              sourceRegion: "",
              sourceIndicatorId: row?.sourceIndicatorId || "",
              sourceSpatialUnit: "post-2025-34-unit",
              selectionKey: unitCode,
              boundarySystem: "post-2025-34",
              policyKind: kind,
              memberSummary: row ? memberSummaryV151(row) : "",
              partial: row?.partial ?? false,
            },
          };
        }),
      },
    };
  }

  const base = choroplethFeatureCollection(layer, asset, selector);
  if (context.system !== "post-2025-34" || kind !== "range-only") {
    return { ...base, mode: "63", kind };
  }
  // Range-only under the 34 outline: keep every province, name its parent
  // unit and the spread of its siblings so the popup can say "구성 범위".
  const rangeByUnit = memberRangeByUnitV151(values);
  return {
    ...base,
    mode: "63",
    kind,
    collection: {
      type: "FeatureCollection",
      features: base.collection.features.map((feature) => {
        const adm1Code = String(feature.properties?.adm1Code || "");
        const parent = parentUnitForV151(adm1Code);
        const range = parent ? rangeByUnit.get(parent.unitCode) : undefined;
        return {
          ...feature,
          properties: {
            ...feature.properties,
            policyKind: kind,
            parentUnitCode: parent?.unitCode || "",
            parentUnitName: parent?.nameKo || "",
            parentMin: range?.min ?? null,
            parentMax: range?.max ?? null,
            parentValueCount: range?.valueCount ?? 0,
            parentMemberCount: range?.memberCount ?? (parent?.memberAdm1Codes.length || 0),
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
      const selected = selectedFilterValueV141(layer, filter, filters);
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

/**
 * The facts a layer publishes, and where each one lives in the source.
 *
 * The map index carries this contract per element because the delivery names
 * its columns differently for every one of them. Layers built before the
 * contract existed fall back to their tooltipFields, so nothing regresses while
 * the rest of the tree catches up.
 */
function layerFactFieldsV137(
  layer: CountryMapLayerV122
): VietnamMapFactFieldV137[] {
  const declared = layer.factFields;
  if (declared && declared.length) return publicMapFieldsV148(layer);
  return layer.tooltipFields
    .filter((field) => field !== "name" && isPublicMapFactV143(fieldLabelV121(field)))
    .map((field) => ({ key: field, label: fieldLabelV121(field), sources: [field] }));
}

/** The first value the source actually delivers for this fact. */
function factValueV137(
  fact: VietnamMapFactFieldV137,
  attributes: Record<string, unknown>
): unknown {
  for (const key of fact.sources) {
    const value = attributes[key];
    if (!hasPublicMapFactValueV143(value)) continue;
    const mapped = fact.valueMap?.[String(value).trim().toLowerCase()];
    return mapped ?? value;
  }
  return null;
}

/** The label a reader sees for a fact key, never a raw source column name. */
function factLabelV137(layer: CountryMapLayerV122, key: string): string {
  return layer.factFields?.find((fact) => fact.key === key)?.label || layer.fieldLabels?.[key] || fieldLabelV121(key);
}

/**
 * The first few facts a popup states about one feature, in contract order.
 *
 * A mine's popup used to carry only its name, so the reader had to open the
 * panel to learn it is a nickel mine - the one thing the source leads with.
 * Two facts is what fits beside the name without turning the popup into a
 * second panel; the rest stay in 자료정보 on the right.
 */
function popupFactLinesV137(
  layer: CountryMapLayerV122,
  properties: Record<string, unknown>,
  limit = 2
): string[] {
  const lines: string[] = [];
  for (const fact of layerFactFieldsV137(layer)) {
    if (lines.length >= limit) break;
    const value = properties[fact.key];
    if (!hasPublicMapFactValueV143(value)) continue;
    const numeric = Number(value);
    const shown =
      fact.unit && Number.isFinite(numeric)
        ? `${formatPublicNumberV126(numeric, fact.unit)} ${fact.unit}`
        : publicTextV126(formatValueV121(value));
    if (!shown) continue;
    lines.push(`${factLabelV137(layer, fact.key)} ${shown}`);
  }
  return lines;
}

/** V151-2: where a point sits, worded for the outline on screen. */
function pointLocationLabelV151(
  hit: VietnamLocationSidecarV151["byRecordId"][string] | undefined,
  system: BoundarySystemV151
): string | null {
  if (hit === undefined) return null;
  if (hit === null) return "소재지 미확정(성·시 경계 밖)";
  if (system === "post-2025-34" && hit.unitCode) {
    const unitName = PROVINCE_KO_34_V151[hit.unitCode] || hit.adm1Name;
    return `${unitName} ${formerProvinceLabelV151(hit.adm1Code)}`.trim();
  }
  return `${PROVINCE_KO_V150[hit.adm1Code] || hit.adm1Name}(개편 전 63개 기준)`;
}

function featureCollection(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122,
  prepared: PreparedLayerRecordsV138 = prepareLayerRecordsV138(records, layer),
  location?: { sidecar: VietnamLocationSidecarV151 | undefined; system: BoundarySystemV151 }
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
            record.provenance.referenceYear || null,
          sourceOrg: mapIndicatorSourceV148(record.indicatorId, record.provenance.sourceOrg || "") || null,
          selectionKey: record.recordId,
          approximate: prepared.approximateRecordIds.has(record.recordId),
          memberCount: prepared.membersByRecordId.get(record.recordId)?.length || 1,
        };
        if (location?.sidecar) {
          const hit = location.sidecar.byRecordId[record.recordId];
          properties.adm1Code = hit?.adm1Code ?? null;
          properties.unitCode = hit?.unitCode ?? null;
          properties.locationLabelV151 = pointLocationLabelV151(hit, location.system);
        }
        // Facts come from the layer's own contract, which names the source key
        // each one lives under. Reading a fixed field name instead is what left
        // Ban Phuc's popup with no 광종: the mineral is in attrs["광종"], while
        // the layer asked for attrs["mineral"].
        layerFactFieldsV137(layer).forEach((fact) => {
          const value = factValueV137(fact, attrs);
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[fact.key] = value as string | number | boolean;
          }
        });
        layer.tooltipFields.forEach((field) => {
          const value = field === "name" ? properties.name : attrs[field];
          if (properties[field] !== undefined) return;
          if (["string", "number", "boolean"].includes(typeof value)) {
            properties[field] = value as string | number | boolean;
          }
        });
        layer.filters.forEach((filter) => {
          if (properties[filter.field] !== undefined) return;
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

/** The filter's current value: the reader's choice, else the contract's default, else all. */
function selectedFilterValueV141(
  layer: CountryMapLayerV122,
  filter: VietnamMapFilterV121,
  filters: Record<string, string>
): string {
  return filters[`${layer.elementId}:${filter.field}`] || filter.defaultValue || "all";
}

/**
 * The period a layer's values refer to, as shown beside its title and in
 * 자료정보. A-023 carries two registries with different reference years, so
 * one "2026" would date the 2021 WRI rows wrongly; the label follows the
 * source filter.
 */
function layerPeriodLabelV141(
  layer: CountryMapLayerV122,
  filters: Record<string, string>,
  fallback: string,
  short = false
): string {
  if (layer.elementId !== "A-023") return fallback;
  const sourceFilter = layer.filters.find((filter) => filter.field === "sourceKey");
  const choice = sourceFilter ? selectedFilterValueV141(layer, sourceFilter, filters) : "all";
  if (choice === "wri" || choice === "osm") return short ? POWER_PLANT_SOURCES_V141[choice].shortLabel : POWER_PLANT_SOURCES_V141[choice].label;
  return `${POWER_PLANT_SOURCES_V141.wri.shortLabel} · ${POWER_PLANT_SOURCES_V141.osm.shortLabel} 추출`;
}

/** The reference year the layer's displayed values carry; A-023's follows the chosen registry (V142). */
function layerDisplayedPeriodV142(
  layer: CountryMapLayerV122,
  filters: Record<string, string>,
  fallback: string
): string {
  if (layer.elementId !== "A-023") return fallback;
  const sourceFilter = layer.filters.find((filter) => filter.field === "sourceKey");
  const choice = sourceFilter ? selectedFilterValueV141(layer, sourceFilter, filters) : "all";
  return powerPlantPeriodForSourceV142(choice);
}

function filterRecords(
  records: CountryEntityV122[],
  layer: CountryMapLayerV122,
  filters: Record<string, string>
): CountryEntityV122[] {
  return prepareLayerRecordsV138(records, layer).records.filter((record) =>
    layer.filters.every((filter) => {
      const selected = selectedFilterValueV141(layer, filter, filters);
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
      const selected = selectedFilterValueV141(layer, filter, filters);
      // A filter with a default keeps an explicit "all" (A-023's both-source
      // view), otherwise restoring the state would fall back to the default.
      if (selected === "all") return filter.defaultValue ? [[filter.field, "all"]] : [];
      return [[filter.field, selected]];
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

const UNAVAILABLE_MAP_FACT_V132 =
  /^(?:\(?\s*(?:미기재|미표기|미공개|미확인|미상)\s*\)?|해당\s*없음|unknown|n\/?a|null|undefined|[-—–])$/iu;

function publicMapFactV132(value: unknown): string | null {
  const text = publicTextV126(value);
  return text && !UNAVAILABLE_MAP_FACT_V132.test(text) ? text : null;
}

function publicPowerPlantStatusV132(value: unknown): string | null {
  const status = publicMapFactV132(value);
  if (!status) return null;
  const normalized = status.toLocaleLowerCase("en-US");
  if (/^(?:existing|operating|operational|in operation|active)$/u.test(normalized)) {
    return "운영";
  }
  if (/^(?:construction|under construction)$/u.test(normalized)) return "건설 중";
  if (/^(?:planned|proposed)$/u.test(normalized)) return "계획";
  if (/^(?:retired|decommissioned|closed)$/u.test(normalized)) return "운영 종료";
  return status;
}

function publicPowerPlantFactsV132(
  properties: Record<string, unknown>
): PublicPowerPlantFactsV132 {
  const rawCapacity = properties.capacityMw ?? properties.mw;
  const capacity =
    rawCapacity !== null &&
    rawCapacity !== undefined &&
    rawCapacity !== "" &&
    Number.isFinite(Number(rawCapacity))
      ? `${formatPublicNumberV126(Number(rawCapacity), "MW")} MW`
      : null;
  return {
    capacity,
    fuel: publicMapFactV132(properties.fuelType ?? properties.primaryFuel),
    status: publicPowerPlantStatusV132(properties.status),
    year: publicMapFactV132(properties.referenceYear),
  };
}

function publicPowerPlantTooltipLinesV132(
  properties: Record<string, unknown>,
  layerTitle: string,
  isPrimary: boolean
): string[] {
  const facts = publicPowerPlantFactsV132(properties);
  return [
    `${layerTitle}${isPrimary ? "" : " · 보조 데이터"}`,
    [facts.fuel ? `발전원 ${facts.fuel}` : "", facts.capacity ? `용량 ${facts.capacity}` : ""]
      .filter(Boolean)
      .join(" · "),
    [facts.status ? `상태 ${facts.status}` : "", facts.year ? `자료연도 ${facts.year}` : ""]
      .filter(Boolean)
      .join(" · "),
  ].filter(Boolean);
}

function summarizeMapHitsV145(hits: MapOverlapChoiceV133[], layers: CountryMapLayerV122[], filters: Record<string, string>) {
  return mapOverlapSummariesV145(hits.map((hit) => {
    const layer = layers.find((item) => item.elementId === hit.elementId);
    const p = hit.properties;
    const presentation = getPublicIndicatorVariablePresentationV129(hit.elementId, String(p.variable || ""));
    const sourceRegion = publicTextV126(p.sourceRegion);
    const facts = hit.elementId === "A-023"
      ? publicPowerPlantTooltipLinesV132(p, "", true)
          .filter((line) => !line.startsWith("자료연도 "))
          .map((line) => line.replace(/ · 자료연도 .+$/u, ""))
      : layer ? popupFactLinesV137(layer, p, 3) : [];
    return {
      ...hit,
      title: publicMapLayerTitleV126(hit.elementId, layer?.publicShortTitle),
      facts,
      unit: presentation?.unit,
      measure: presentation?.label,
      period: layer ? layerDisplayedPeriodV142(layer, filters, String(layer.sourceYear || "")) : "",
      regionNote: sourceRegion && layer
        ? `${publicVietnamSourceRegionV126(sourceRegion)} · ${regionUnitLabelV138(layer)} 값`
        : undefined,
    };
  }));
}

function publicTransmissionSegmentTitleV131(
  properties: Record<string, unknown>
): string {
  // Same numeric-voltage trap as the overlap label: the asset stores 110, 220
  // and 500 as numbers, so a text-only normalizer dropped every one of them and
  // every segment was titled "송전망 구간".
  const raw = properties.voltageKv ?? properties.voltage;
  const voltage = raw === null || raw === undefined || raw === "" ? "" : String(raw);
  return voltage ? `${voltage} kV 송전선로` : "송전망 구간";
}

function publicMapSymbolShapeV129(
  layer: CountryMapLayerV122
): PublicMapSymbolShapeV129 {
  const renderer = rendererOf(layer);
  if (renderer === "line") return "line";
  // Adaptation Fund activity sites use the same diamond in the map and
  // legend; regional participation areas remain visible behind the symbol.
  if (layer.elementId === "D-018") return "diamond";
  if (
    renderer === "admin1-choropleth" ||
    renderer === "partial-choropleth" ||
    renderer === "regional-scope"
  ) {
    return "area";
  }
  if (["B-048", "D-018"].includes(layer.elementId)) return "diamond";
  if (["C-025", "D-023"].includes(layer.elementId)) return "square";
  // V138 point families: stations and hydrological sites as triangles,
  // organisations and offices as squares, events and facilities as circles.
  if (["B-008", "B-023", "B-028", "B-025"].includes(layer.elementId)) return "triangle";
  if (["E-004", "E-005", "E-006", "E-018", "E-019"].includes(layer.elementId)) {
    return "square";
  }
  return "circle";
}

function createPublicMapPopupContentV129(
  title: string,
  lines: string[],
  options?: {
    attributes?: Record<string, string>;
    legacyTestId?: string;
    testId?: string;
  }
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "cdp-map-public-popup";
  if (options?.testId) root.setAttribute("data-testid", options.testId);
  Object.entries(options?.attributes || {}).forEach(([name, value]) => {
    root.setAttribute(`data-${name}`, value);
  });
  const appendPublicText = (node: HTMLElement, value: string) => {
    tokenizePublicTermsV134(value, { firstOccurrenceOnly: false }).forEach(
      (token) => {
        if (token.type === "text") {
          node.appendChild(document.createTextNode(token.value));
          return;
        }
        const term = document.createElement("span");
        term.setAttribute("data-public-term-v134", token.entry.id);
        term.setAttribute("data-public-term-mode", "visible-expansion");
        term.appendChild(document.createTextNode(token.value));
        const expansion = document.createElement("span");
        expansion.className = "public-term-visible-expansion-v134";
        expansion.setAttribute("data-public-term-expansion-v134", "true");
        expansion.textContent = `(${token.entry.koreanName})`;
        term.appendChild(expansion);
        node.appendChild(term);
      }
    );
  };
  const heading = document.createElement("strong");
  appendPublicText(heading, title);
  root.appendChild(heading);
  lines.filter(Boolean).slice(0, 5).forEach((line) => {
    const row = document.createElement("span");
    appendPublicText(row, line);
    root.appendChild(row);
  });
  if (options?.legacyTestId) {
    const legacyContract = document.createElement("span");
    legacyContract.hidden = true;
    legacyContract.setAttribute("aria-hidden", "true");
    legacyContract.setAttribute("data-testid", options.legacyTestId);
    Object.entries(options.attributes || {}).forEach(([name, value]) => {
      legacyContract.setAttribute(`data-${name}`, value);
    });
    legacyContract.textContent = [title, ...lines.filter(Boolean)].join(" ");
    root.appendChild(legacyContract);
  }
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
  } else if (shape === "triangle") {
    context.moveTo(size / 2, 2);
    context.lineTo(size - 2, size - 3);
    context.lineTo(2, size - 3);
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
  // URL-driven hydration must not fight state the user just changed on screen,
  // so external state is applied once per genuinely new external signature.
  const appliedHydrationRefV135 = useRef<string>("");
  const [countryIso3, setCountryIso3] = useState(() =>
    resolveInitialCountry(initialState.countryIso3)
  );
  const [baseMapStatus, setBaseMapStatus] = useState<LoadStatus>("loading");
  // V151-2: which backdrop (지형/위성/도로·지명/없음) sits under the data layers.
  // The v150 on/off preference is migrated on first read.
  const [backdropKindV151, setBackdropKindV151] = useState<MapBackdropKindV151>(() =>
    readMapBackdropKindV151(typeof localStorage === "undefined" ? null : localStorage)
  );
  const [backdropStatusV151, setBackdropStatusV151] = useState<"loading" | "ready" | "fallback" | "none">(
    "loading"
  );
  const [backdropFirstTileMsV151, setBackdropFirstTileMsV151] = useState<number | null>(null);
  const backdropFellBackRef = useRef(false);
  const mapCreatedAtRef = useRef<number>(0);
  // V151-2: the camera the reader is looking at. Published to the URL as
  // `view=`; only the two auto-fit cases below may move it programmatically.
  const [cameraV151, setCameraV151] = useState<MapCameraV151 | null>(initialState.camera);
  const autoFitCountryRef = useRef<string | null>(null);
  const previousActiveCountRef = useRef<number>(initialState.activeLayerKeys.length);
  // Tile requests start with the page, not after the style settles: the map's
  // own requests for the same URLs then come from the HTTP cache.
  useEffect(() => {
    if (countryIso3 === "VNM") warmBackdropV151(backdropKindV151);
  }, [backdropKindV151, countryIso3]);
  // V151: which province vintage the reference outline and Korean labels draw.
  // It never changes a value; the published values keep their source's vintage.
  const [boundarySystemV151State, setBoundarySystemV151State] =
    useState<BoundarySystemV151>(() => {
      try {
        return boundarySystemV151(
          localStorage.getItem(BOUNDARY_SYSTEM_STORAGE_KEY_V151)
        );
      } catch {
        return DEFAULT_BOUNDARY_SYSTEM_V151;
      }
    });
  const [fallbackBoundaryStatus, setFallbackBoundaryStatus] =
    useState<LoadStatus>("loading");
  const [fallbackBoundaryPath, setFallbackBoundaryPath] = useState("");
  const [mapIndexStatus, setMapIndexStatus] = useState<LoadStatus>("idle");
  const [mapIndexError, setMapIndexError] = useState("");
  const [mapIndexReloadNonce, setMapIndexReloadNonce] = useState(0);
  const [externalStateHydrated, setExternalStateHydrated] = useState(false);
  const [layers, setLayers] = useState<CountryMapLayerV122[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>(() => {
    if (
      initialState.comparisonMode &&
      initialState.comparisonLayerIds.length === 2
    ) {
      return initialState.comparisonLayerIds.slice(0, 2);
    }
    const primary =
      initialState.primaryLayerId || initialState.focusLayerKey || null;
    // V138: every dataset the URL names stays selected. Nothing is dropped to
    // fit a companion limit; the colour map is one of them, the rest are drawn
    // beside it.
    const contexts = (
      initialState.contextLayerIds.length
        ? initialState.contextLayerIds
        : initialState.activeLayerKeys.filter((id) => id !== primary)
    )
      .filter((id) => id !== primary)
      .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers);
    return primary ? [primary, ...contexts] : contexts;
  });
  // Selected datasets whose drawing is switched off. They stay in the
  // selection and the legend says so; nothing is silently deselected.
  const [hiddenIdsV138, setHiddenIdsV138] = useState<string[]>(
    () => initialState.hiddenLayerIds || []
  );
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
  const [renderedMapElementIdsV133, setRenderedMapElementIdsV133] = useState<
    string[]
  >([]);
  const [layerErrors, setLayerErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<CountryEntityV122 | null>(null);
  const [selectedSpatial, setSelectedSpatial] =
    useState<SpatialSelection | null>(null);
  const [overlapChoicesV133, setOverlapChoicesV133] = useState<
    MapOverlapChoiceV133[]
  >([]);
  const [lastEnabledContextIdV133, setLastEnabledContextIdV133] = useState<
    string | null
  >(
    () =>
      initialState.contextLayerIds[
        initialState.contextLayerIds.length - 1
      ] || null
  );
  const [financeTypeV133, setFinanceTypeV133] = useState<
    "adaptation" | "carbon"
  >("adaptation");
  const [comparisonModeV135, setComparisonModeV135] = useState(
    () => initialState.comparisonMode
  );
  const [comparisonLayerIdsV135, setComparisonLayerIdsV135] = useState<
    [string, string]
  >(() => {
    const restored = initialState.comparisonLayerIds;
    return restored.length === 2
      ? [restored[0], restored[1]]
      : ["D-018", "C-025"];
  });
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
  // V151-2: the 34-unit and six-region outlines the value layers aggregate
  // onto. Loaded once per country so the boundary toggle never refetches.
  const [adm1Geometry34V151, setAdm1Geometry34V151] =
    useState<VietnamMapGeoJsonV124 | null>(null);
  const [region6GeometryV151, setRegion6GeometryV151] =
    useState<VietnamMapGeoJsonV124 | null>(null);
  const [locationsByElementV151, setLocationsByElementV151] = useState<
    Record<string, VietnamLocationSidecarV151>
  >({});
  const boundaryContextV151 = useMemo<BoundaryRenderContextV151>(
    () => ({
      system: boundarySystemV151State,
      geometry34: adm1Geometry34V151,
      region6: region6GeometryV151,
    }),
    [boundarySystemV151State, adm1Geometry34V151, region6GeometryV151]
  );
  const [layerPanelOpen, setLayerPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 768
  );
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(true);
  // At 768 and below the list is a drawer that collapses to its header. A
  // drawer collapsed while scrolled kept its scroll offset, so the header row
  // - the only thing left visible - was clipped under the top edge.
  const layerPanelRefV138 = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!layerPanelOpen) layerPanelRefV138.current?.scrollTo({ top: 0 });
  }, [layerPanelOpen]);
  // The legend floats over the map, and at 1440 it sits on top of every point
  // of the first transmission segment (MAP-002): 25 of 25 of that line's screen
  // points had the legend above them, so hover and click never reached it. It
  // stays open by default - a map coloured by fuel or by value is unreadable
  // without it - but a reader can now put it away, the way the two side panels
  // already allow.
  // The legend opens by itself only where it does not cover the map: below
  // 1200px it starts folded and the reader opens it (V141).
  const [legendOpen, setLegendOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1200
  );
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
      comparisonModeV135
        ? []
        : activeIds
            .filter((id) => id !== primaryLayerId)
            .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers),
    [activeIds, comparisonModeV135, primaryLayerId]
  );
  const mapHitPriorityRefV133 = useRef<MapHitPriorityV133>({
    contextLayerIds: [],
    lastContextElementId: null,
    primaryElementId: null,
    selectedElementId: null,
    selectedSelectionKey: null,
  });
  mapHitPriorityRefV133.current = {
    contextLayerIds,
    lastContextElementId: lastEnabledContextIdV133,
    primaryElementId: primaryLayerId,
    selectedElementId: selectedSpatial?.elementId || selected?.elementId || null,
    selectedSelectionKey:
      selectedSpatial?.selectionKey || selected?.recordId || null,
  };
  useEffect(() => {
    // A hover summary is valid only for the active primary/comparison set.
    // Clear both render paths when that set changes so a previous analysis
    // cannot remain over the newly selected preset.
    setFallbackTooltipV129(null);
    setOverlapChoicesV133([]);
    popupRef.current?.remove();
    popupRef.current = null;
    popupOwnerRef.current = null;
  }, [contextLayerIds, primaryLayerId, selectedPresetId, selectorByElement, filters]);
  const overlapSummariesV145 = summarizeMapHitsV145(overlapChoicesV133, layers, filters);
  const renderOrderedActiveIds = useMemo(
    () => {
      const ids = [
        ...contextLayerIds,
        ...(primaryLayerId ? [primaryLayerId] : []),
      ].filter((id) => !hiddenIdsV138.includes(id));
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
    [contextLayerIds, hiddenIdsV138, layers, primaryLayerId]
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
    renderOrderedActiveIds.forEach((elementId) => {
      const layer = layers.find((item) => item.elementId === elementId);
      // Keep small verified point sets hydrated under the live canvas so the
      // fallback can take over immediately. Large clustered sets (notably
      // 1,889 power plants) stay canvas-only while the live map is healthy.
      if (baseMapStatus === "ready" && layer?.cluster) return;
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
  }, [
    baseMapStatus,
    fallbackBounds,
    layers,
    recordsByElement,
    renderOrderedActiveIds,
  ]);

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
    const statisticalPoints: StatisticalRepresentativePointV133[] = [];
    // Keep the lightweight area/network fallback model hydrated underneath
    // the interactive canvas. If the canvas becomes unavailable after load,
    // the same verified selections and keyboard detail remain immediately
    // usable without a second data request.
    renderOrderedActiveIds.forEach((elementId) => {
      const layer = layers.find((item) => item.elementId === elementId);
      const asset = spatialByElement[elementId];
      if (!layer || !asset) return;
      const selector = selectorForLayer(layer, selectorByElement[elementId]);
      const isBudgetContext =
        elementId === "D-008" && elementId !== primaryLayerId;
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
      const result = choroplethFeatureCollectionV151(layer, asset, selector, boundaryContextV151);
      if (isBudgetContext) {
        statisticalRepresentativePointsV133(result.collection).features.forEach(
          (feature, featureIndex) => {
            const properties = (feature.properties || {}) as Record<
              string,
              unknown
            >;
            const value = optionalFiniteNumberV130(properties.value);
            if (value === null) return;
            const coordinates = feature.geometry.coordinates;
            statisticalPoints.push({
              color: LAYER_COLORS[elementId] || "#287e91",
              elementId,
              name: publicMapFeatureNameV126(
                properties.adm1Name || properties.name,
                "성·시"
              ),
              period: selector.period,
              properties,
              selectionKey: String(
                properties.selectionKey || properties.adm1Code || featureIndex
              ),
              unit: String(properties.unit || "VND"),
              value,
              variable: selector.variable,
              ...projectFallbackCoordinate(
                coordinates as [number, number],
                fallbackBounds
              ),
            });
          }
        );
        return;
      }
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
    return { fills, lines, regionalPoints, statisticalPoints };
  }, [
    baseMapStatus,
    boundaryContextV151,
    fallbackBounds,
    filters,
    layers,
    primaryLayerId,
    renderOrderedActiveIds,
    selectorByElement,
    spatialByElement,
  ]);

  const fallbackAdm1Paths = useMemo(
    () =>
      (adm1Boundary?.features || [])
        .map((feature) => ({
          // V151: the 34-unit asset carries `unitCode`, the 63-unit `adm1Code`.
          code: String(
            feature.properties?.unitCode ||
              feature.properties?.adm1Code ||
              feature.id ||
              ""
          ),
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

    // V151-2: Viet Nam's SVG fallback outline comes from the dissolved
    // province asset, the same shape the MapLibre canvas draws.
    void (countryIso3 === "VNM"
      ? loadVietnamCountryOutlineV151().then((feature) => ({ type: "FeatureCollection" as const, features: [feature] }))
      : loadWorldCountryBoundaries())
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
    void loadVietnamSpatialGeoJsonV124(
      vnmAdm1ReferenceUrlV151(boundarySystemV151State)
    )
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
  }, [countryIso3, boundarySystemV151State]);

  useEffect(() => {
    let cancelled = false;
    setAdm1Geometry34V151(null);
    setRegion6GeometryV151(null);
    if (countryIso3 !== "VNM") {
      return () => {
        cancelled = true;
      };
    }
    void loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(ADM1_34_GEOMETRY_PATH_V151))
      .then((collection) => {
        if (!cancelled) setAdm1Geometry34V151(collection);
      })
      .catch((reason: unknown) => {
        console.error("Vietnam 34-unit boundary load failed", reason);
      });
    void loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(REGION_6_GEOMETRY_PATH_V151))
      .then((collection) => {
        if (!cancelled) setRegion6GeometryV151(collection);
      })
      .catch((reason: unknown) => {
        console.error("Vietnam six-region boundary load failed", reason);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  useEffect(() => {
    try {
      localStorage.setItem(
        BOUNDARY_SYSTEM_STORAGE_KEY_V151,
        boundarySystemV151State
      );
    } catch {
      /* optional preference */
    }
  }, [boundarySystemV151State]);

  useEffect(() => {
    let cancelled = false;
    setExternalStateHydrated(false);
    // The workspace is being rebuilt for a freshly loaded layer set, so the URL
    // state has to be applied again. Without clearing the marker the hydration
    // effect still recognises the signature it applied before this reset and
    // skips, which silently drops a shared comparison link back to the normal
    // map once the reset lands after hydration.
    appliedHydrationRefV135.current = "";
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
    // Opening a shared comparison link renders the workspace from the URL on
    // the first paint. Clearing the flag unconditionally here tore it back down
    // until hydration restored it, so the reader saw the comparison, then the
    // normal map, then the comparison again. Honour the URL's intent instead;
    // changeCountry still turns comparison off explicitly.
    setComparisonModeV135(
      initialState.comparisonMode && initialState.comparisonLayerIds.length === 2
    );
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
            return selected && (filter.values.includes(selected) || (selected === "all" && filter.defaultValue))
              ? [[`${layer.elementId}:${filter.field}`, selected]]
              : [];
          })
        )
      )
    );
  }, [layers, mapIndexStatus, sharedSelectorKey]);

  useEffect(() => {
    if (comparisonModeV135) return;
    const map = mapRef.current;
    if (!map) return;
    const frame = window.requestAnimationFrame(() => map.resize());
    return () => window.cancelAnimationFrame(frame);
  }, [comparisonModeV135]);

  useEffect(() => {
    if (!comparisonModeV135) return;
    const pair = [comparisonLayerIdsV135[0], comparisonLayerIdsV135[1]].filter(
      Boolean
    );
    setActiveIds((current) => (sameStringArray(current, pair) ? current : pair));
    setFocusId((current) => (current === pair[0] ? current : pair[0] || null));
  }, [comparisonLayerIdsV135, comparisonModeV135]);

  const externalActiveLayerKey = initialState.activeLayerKeys.join("|");
  const externalContextLayerKey = initialState.contextLayerIds.join("|");
  const externalComparisonLayerKey = initialState.comparisonLayerIds.join("|");
  const externalLayerSelectorKey = JSON.stringify(initialState.layerSelectors);

  useEffect(() => {
    if (mapIndexStatus !== "ready") return;
    const requestedCountry = initialState.countryIso3?.toUpperCase() || "";
    if (requestedCountry && requestedCountry !== countryIso3) return;

    // While the comparison workspace is open it owns its own dataset pair. The
    // URL echo of a pane change always trails the change itself, so hydrating
    // from it here would race the user and strand a pane without its data.
    // The initial pair is seeded from the URL when this page mounts, and
    // closeComparisonV135 is the only path that leaves the workspace.
    if (comparisonModeV135) {
      setExternalStateHydrated(true);
      return;
    }

    const hydrationSignature = [
      countryIso3,
      layers.length,
      externalActiveLayerKey,
      externalComparisonLayerKey,
      externalContextLayerKey,
      externalLayerSelectorKey,
      initialState.comparisonMode ? "compare" : "normal",
      initialState.primaryLayerId || "",
      initialState.focusLayerKey || "",
      initialState.mapPresetId || "",
    ].join("::");
    if (appliedHydrationRefV135.current === hydrationSignature) return;
    appliedHydrationRefV135.current = hydrationSignature;

    const available = new Set(layers.map((layer) => layer.elementId));
    const requestedPrimary =
      initialState.primaryLayerId || initialState.focusLayerKey || null;
    const requestedComparisonIds = initialState.comparisonLayerIds
      .filter((id) => available.has(id))
      .filter((id, index, values) => values.indexOf(id) === index)
      .slice(0, 2);
    const restoreComparison =
      initialState.comparisonMode && requestedComparisonIds.length === 2;
    const nextFocus = restoreComparison
      ? requestedComparisonIds[0]
      :
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
    const nextActive = restoreComparison
      ? requestedComparisonIds
      : nextFocus
      ? [nextFocus, ...nextContexts]
      : [];

    setActiveIds((current) =>
      sameStringArray(current, nextActive) ? current : nextActive
    );
    setFocusId((current) => (current === nextFocus ? current : nextFocus));
    setComparisonModeV135(restoreComparison);
    if (restoreComparison) {
      setComparisonLayerIdsV135([
        requestedComparisonIds[0],
        requestedComparisonIds[1],
      ]);
    }
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
    setSelectorByElement((current) => {
      const restored = Object.fromEntries(
        Object.entries(initialState.layerSelectors).flatMap(
          ([elementId, selection]) => {
            const layer = layers.find((item) => item.elementId === elementId);
            if (!layer) return [];
            const variable = layer.selectors.variables.find(
              (item) => item.key === selection.variable
            );
            const periods = variable?.periods || layer.selectors.periods;
            if (!variable || !periods.includes(selection.period)) return [];
            return [[elementId, selection]];
          }
        )
      );
      return { ...current, ...restored };
    });
    setExternalStateHydrated(true);
  }, [
    comparisonModeV135,
    countryIso3,
    externalActiveLayerKey,
    externalComparisonLayerKey,
    externalContextLayerKey,
    externalLayerSelectorKey,
    initialState.comparisonMode,
    initialState.countryIso3,
    initialState.focusLayerKey,
    initialState.mapPresetId,
    initialState.primaryLayerId,
    initialState.layerSelectors,
    layers,
    mapIndexStatus,
  ]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    setBaseMapStatus("loading");
    let pendingMap: MapLibreMap | null = null;
    try {
      mapCreatedAtRef.current = performance.now();
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
    attachMapObserverV137(map, countryIso3);

    let ready = false;
    const markReady = () => {
      ready = true;
      setBaseMapStatus("ready");
      const current = getCountryDataProviderV122(countryIso3);
      if (initialState.camera) {
        // A shared or reloaded link opens where the reader left it.
        map.jumpTo({
          center: [initialState.camera.lng, initialState.camera.lat],
          zoom: initialState.camera.zoom,
          bearing: initialState.camera.bearing,
        });
        autoFitCountryRef.current = countryIso3;
      } else if (current?.mapView.bounds) {
        map.fitBounds(current.mapView.bounds, {
          padding: 44,
          duration: 0,
        });
      }
      window.setTimeout(() => map.resize(), 0);
    };
    const publishCamera = () => {
      const center = map.getCenter();
      setCameraV151({ lng: center.lng, lat: center.lat, zoom: map.getZoom(), bearing: map.getBearing() });
    };
    map.on("moveend", publishCamera);
    const handleError = (event: any) => {
      if (String(event.sourceId || "").startsWith(BACKDROP_SOURCE_PREFIX_V151)) {
        return; // Optional background failure must not disable local analytical layers; the backdrop effect handles it.
      }
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
      map.off("moveend", publishCamera);
      map.remove();
      mapRef.current = null;
    };
  }, []); // one MapLibre instance

  useEffect(() => {
    const map = mapRef.current;
    if (!map || baseMapStatus !== "ready") return;
    const controller = new AbortController();
    const kind = backdropKindV151;
    try { localStorage.setItem(MAP_BACKDROP_STORAGE_KEY_V151, kind); } catch { /* optional preference */ }
    setBackdropFirstTileMsV151(null);
    setBackdropStatusV151(kind === "none" ? "none" : "loading");
    let errorCount = 0;
    let firstTileSeen = false;
    const fallBack = () => {
      if (firstTileSeen || controller.signal.aborted || backdropFellBackRef.current) return;
      backdropFellBackRef.current = true;
      setBackdropStatusV151("fallback");
      setBackdropKindV151("none");
    };
    // Without a single tile after this budget, and with failures on record,
    // the backdrop steps aside; the data layers were never waiting on it.
    const fallbackTimer = kind === "none" ? null : window.setTimeout(() => {
      if (errorCount >= 3) fallBack();
    }, 5000);
    void applyMapBackdropV151(map, kind, {
      boundarySystem: boundarySystemV151State,
      signal: controller.signal,
      startedAt: mapCreatedAtRef.current || performance.now(),
      onFirstTile: ({ elapsedMs }) => {
        firstTileSeen = true;
        setBackdropFirstTileMsV151(Math.round(elapsedMs));
        setBackdropStatusV151("ready");
        try {
          performance.mark(`cdp-backdrop-first-tile:${kind}`);
          performance.measure("cdp-backdrop-first-tile", { start: mapCreatedAtRef.current, duration: elapsedMs });
        } catch { /* diagnostics only */ }
      },
      onError: () => {
        errorCount += 1;
        if (errorCount >= 3) fallBack();
      },
    }).then(() => {
      if (controller.signal.aborted) return;
      // Warm the HTTP cache for the Viet Nam extent (no-op if the mount already did).
      warmBackdropV151(kind);
    });
    return () => {
      controller.abort();
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      removeMapBackdropV151(map);
    };
  }, [baseMapStatus, backdropKindV151, boundarySystemV151State]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || baseMapStatus !== "ready") return;
    // V151-2: province labels (grey, polylabel anchors) and city labels (marker
    // + bold) are separate tiers; a centrally-run city gets one label only.
    addKoreanMapLabelsV151(map, adm1Boundary, { showCities: !backdropOwnsCityLabelsV151(backdropKindV151) });
    const keepLabelsAboveData = () => {
      const ids = [...KOREAN_LABEL_LAYER_IDS_V151];
      const all = map.getStyle().layers;
      if (all?.[all.length - 1]?.id !== ids[ids.length - 1]) ids.forEach(id => { if (map.getLayer(id)) map.moveLayer(id); });
    };
    map.on("idle", keepLabelsAboveData);
    return () => { map.off("idle", keepLabelsAboveData); };
  }, [adm1Boundary, backdropKindV151, baseMapStatus]);

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
    // V151-2: the 34-unit outline is the primary reference and reads heavier
    // than the 63 pre-reform provinces, which are a toggle.
    const is34 = adm1Boundary.features[0]?.properties?.boundarySystem === "post-2025-34";
    const lineWidth = is34 ? 1.6 : 0.8;
    const lineOpacity = is34 ? 0.7 : 0.42;
    const existing = map.getSource(
      VNM_ADM1_BASE_SOURCE_V126
    ) as GeoJSONSource | undefined;
    if (existing) {
      existing.setData(adm1Boundary as GeoJSON.FeatureCollection);
      if (map.getLayer(VNM_ADM1_BASE_OUTLINE_V126)) {
        map.setPaintProperty(VNM_ADM1_BASE_OUTLINE_V126, "line-width", lineWidth);
        map.setPaintProperty(VNM_ADM1_BASE_OUTLINE_V126, "line-opacity", lineOpacity);
      }
      return;
    }
    map.addSource(VNM_ADM1_BASE_SOURCE_V126, {
      type: "geojson",
      data: adm1Boundary as GeoJSON.FeatureCollection,
      attribution:
        '<a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries VNM ADM1</a> · CC BY 4.0 · 2025-07-01 34개 통합 대응',
    });
    // Below any data layer already mounted (re-entering Viet Nam), above the backdrop.
    const firstDataLayer = map.getStyle().layers?.find((entry) => /^v1\d\d-/u.test(entry.id))?.id;
    map.addLayer(
      {
        id: VNM_ADM1_BASE_OUTLINE_V126,
        type: "line",
        source: VNM_ADM1_BASE_SOURCE_V126,
        paint: {
          "line-color": "#2f6f59",
          "line-width": lineWidth,
          "line-opacity": lineOpacity,
        },
      },
      firstDataLayer
    );
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
    // V151-2: auto-fit happens once per country on first entry (or once for
    // the dataset the reader arrived with). Ticking, hiding, re-ranking or
    // re-selecting layers afterwards never moves the camera; the "전체 범위
    // 보기" button is the only other way back to the national extent.
    if (autoFitCountryRef.current === countryIso3) return;
    autoFitCountryRef.current = countryIso3;
    const targetBounds =
      primaryLayer && initialState.focusLayerKey === primaryLayer.elementId
        ? clipToCountryBoundsV151(
            layerBoundsV151(primaryLayer, spatialByElement, recordsByElement),
            provider.mapView.bounds as [[number, number], [number, number]] | undefined
          )
        : null;
    const restoreCountryExtent = () => {
      map.resize();
      if (targetBounds) {
        map.fitBounds(targetBounds, { padding: 44, duration: 0 });
      } else if (provider.mapView.bounds) {
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
    countryIso3,
    externalStateHydrated,
    initialState.focusLayerKey,
    layers,
    primaryLayerId,
    provider,
    recordsByElement,
    spatialByElement,
  ]);

  useDatasetUsageV149("map", primaryLayerId, countryIso3 === "VNM" && baseMapStatus === "ready" && externalStateHydrated && !!primaryLayerId && !!(recordsByElement[primaryLayerId] || spatialByElement[primaryLayerId]));

  // V151-2 auto-fit case (b): the first layer ticked from an empty selection
  // lies wholly outside the viewport - otherwise the camera stays put.
  useEffect(() => {
    const map = mapRef.current;
    const previousCount = previousActiveCountRef.current;
    previousActiveCountRef.current = activeIds.length;
    if (!map || baseMapStatus !== "ready" || !externalStateHydrated) return;
    if (previousCount !== 0 || activeIds.length !== 1) return;
    const layer = layers.find((entry) => entry.elementId === activeIds[0]);
    if (!layer) return;
    const bounds = clipToCountryBoundsV151(
      layerBoundsV151(layer, spatialByElement, recordsByElement),
      provider?.mapView.bounds as [[number, number], [number, number]] | undefined
    );
    if (!bounds) {
      // Data not loaded yet: let the next run (same 0 -> 1 transition) decide.
      previousActiveCountRef.current = 0;
      return;
    }
    if (!boundsIntersectV151(bounds, map.getBounds())) {
      map.fitBounds(bounds, { padding: 44, duration: 350 });
    }
  }, [activeIds, baseMapStatus, externalStateHydrated, layers, provider, recordsByElement, spatialByElement]);

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
                layer.disabledReason || "이 데이터는 지도에 표시할 위치자료가 없습니다"
              )
            )
        : Promise.all([
            loadCountryElementEntitiesV122(countryIso3, elementId),
            // V151-2: the province each point falls in; optional, never blocks the layer.
            layer.locationsUrl
              ? loadVietnamLocationsV151(layer.locationsUrl, controller.signal).catch(
                  (reason: unknown) => {
                    console.warn("Point location sidecar unavailable", reason);
                    return undefined;
                  }
                )
              : Promise.resolve(undefined),
          ]).then(([payload, sidecar]) => {
            if (controller.signal.aborted) return;
            setRecordsByElement((current) => ({
              ...current,
              [elementId]: payload.records,
            }));
            if (sidecar) {
              setLocationsByElementV151((current) => ({ ...current, [elementId]: sidecar }));
            }
          });
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
              "선택한 지도 데이터를 불러오지 못했습니다"
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
      hiddenLayerIds: hiddenIdsV138.filter((id) => activeIds.includes(id)),
      mapPresetId: selectedPresetId,
      layerOpacities: nextOpacities,
      layerYears: nextYears,
      comparisonMode: comparisonModeV135,
      comparisonLayerIds: comparisonModeV135
        ? [comparisonLayerIdsV135[0], comparisonLayerIdsV135[1]]
        : [],
      layerSelectors: Object.fromEntries(
        activeIds
          .map((id) => [id, selectorByElement[id]] as const)
          .filter(([, selection]) => Boolean(selection))
      ),
      camera: cameraV151,
    });
  }, [
    activeIds,
    cameraV151,
    comparisonLayerIdsV135,
    comparisonModeV135,
    countryIso3,
    externalStateHydrated,
    focusId,
    hiddenIdsV138,
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
        const isBudgetContext = elementId === "D-008" && !isPrimary;
        const choropleth =
          renderer === "line" || isRegionalScope
            ? null
            : choroplethFeatureCollectionV151(layer, asset, selector, boundaryContextV151);
        const data =
          renderer === "line"
            ? lineFeatureCollection(layer, asset, selector, filters)
            : isRegionalScope
            ? (asset.geometry as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>)
            : isBudgetContext
            ? statisticalRepresentativePointsV133(choropleth!.collection)
            : choropleth!.collection;
        const renderKey = runtimeKey(countryIso3, elementId);
        const renderSignature = JSON.stringify({
          renderer,
          selector,
          filters: selectedFilterDimensionsV125(layer, filters),
          featureCount: data.features.length,
          role: isPrimary ? "primary" : "context",
          boundary: choropleth ? `${choropleth.mode}:${choropleth.kind}` : boundaryContextV151.system,
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
        } else if (isBudgetContext) {
          interactiveLayerId = ids.pointHit;
          const valueRadius =
            choropleth && choropleth.minimum !== choropleth.maximum
              ? ([
                  "interpolate",
                  ["linear"],
                  ["to-number", ["get", "value"]],
                  choropleth.minimum,
                  7,
                  choropleth.maximum,
                  20,
                ] as any)
              : 12;
          map.addLayer({
            id: ids.point,
            type: "circle",
            source: ids.source,
            paint: {
              "circle-color": color,
              "circle-radius": valueRadius,
              "circle-opacity": 0.58,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });
          map.addLayer({
            id: ids.pointHit,
            type: "circle",
            source: ids.source,
            paint: {
              "circle-color": "#000000",
              "circle-radius": ["max", valueRadius, 14] as any,
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
              "circle-radius": ["+", valueRadius, 4] as any,
              "circle-stroke-color": "#f0a51a",
              "circle-stroke-width": 3.5,
            },
          });
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
              "circle-opacity": 0,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": isPrimary ? 2 : 1,
            },
          });
          const regionalActivitySymbolId = "cdp-v133-d018-activity-diamond";
          ensurePublicPointSymbolImageV129(
            map,
            regionalActivitySymbolId,
            "diamond",
            color
          );
          map.addLayer({
            id: ids.pointSymbol,
            type: "symbol",
            source: ids.source,
            filter: activityFilter,
            layout: {
              "icon-allow-overlap": true,
              "icon-image": regionalActivitySymbolId,
              "icon-size": isPrimary ? 1 : 0.78,
            },
            paint: { "icon-opacity": isPrimary ? 0.96 : 0.64 },
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
              elementId,
              mapHitPriorityRefV133.current
            )
          ) {
            return;
          }
          const overlapHits = mapHitCandidatesV133(
            map,
            event.point,
            countryIso3,
            renderOrderedActiveIds,
            mapHitPriorityRefV133.current
          );
          if (overlapHits.length > 1) {
            setOverlapChoicesV133(overlapHits);
            popupRef.current?.remove();
            popupRef.current = null;
            return;
          }
          setOverlapChoicesV133([]);
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
          const memberSummary = parseMemberSummaryV151(properties.memberSummary);
          setSelectedSpatial({
            elementId,
            adm1Code: String(properties.adm1Code || "") || undefined,
            unitCode: String(properties.unitCode || "") || undefined,
            memberAdm1Codes: memberSummary?.members.map((member) => member.adm1Code),
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
              elementId,
              mapHitPriorityRefV133.current
            )
          ) {
            return;
          }
          map.getCanvas().style.cursor = "pointer";
          const overlapHits = mapHitCandidatesV133(
            map,
            event.point,
            countryIso3,
            renderOrderedActiveIds,
            mapHitPriorityRefV133.current
          );
          if (overlapHits.length > 1) {
            popupRef.current?.remove();
            popupOwnerRef.current = popupOwnerKey;
            popupRef.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 10,
            })
              .setLngLat(event.lngLat)
              .setDOMContent(
                createMapOverlapPopupV145(summarizeMapHitsV145(overlapHits, layers, filters))
              )
              .addTo(map);
            return;
          }
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
          const sourceRegionKey = publicTextV126(properties.sourceRegion) || "";
          const gviRegionRank = uniqueB021RegionRankV133(
            asset.data,
            selector,
            sourceRegionKey
          );
          const isGvi = elementId === "B-021" && selector.variable === "gvi-6";
          const boundaryLineV151 = boundaryPopupLineV151(properties, publicUnit);
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
                isGvi
                  ? publicMapFeatureNameV126(
                      properties.adm1Name || properties.name,
                      "성·시"
                    )
                  : publicMapLayerTitleV126(elementId, layer.publicShortTitle),
                isGvi
                  ? [
                      `지역 취약성(GVI) · ${selector.period}`,
                      formattedAreaValue,
                      "높을수록 취약",
                      `[권역값] ${sourceRegion}`,
                      gviRegionRank,
                    ]
                  : [
                      featureLabel,
                      isBudgetContext
                        ? "성·시 단위 통계 · 원 크기 = 예산"
                        : isRegionalScope
                        ? publicMapFeatureNameV126(
                            properties.activitySiteLabel ||
                              properties.participatingCountries,
                            "참여국 범위"
                          )
                        : variablePresentationV129?.directionLabel || "",
                      isBudgetContext
                        ? "실제 사업 위치가 아닌 통계 대표점"
                        : isRegionalScope
                        ? `베트남 참여 ${publicMapFeatureNameV126(
                            properties.vietnamParticipation,
                            "포함"
                          )}`
                        : publicTextV126(properties.sourceRegion)
                        ? `[${regionUnitLabelV138(layer)} 값] ${sourceRegion}`
                        : isPrimary
                        ? "선택 데이터"
                        : "함께 보기",
                      boundaryLineV151,
                    ],
                {
                  attributes: {
                    "element-id": elementId,
                    "selection-key": String(
                      properties.selectionKey ??
                        properties.adm1Code ??
                        properties.featureId ??
                        ""
                    ),
                  },
                  testId: "map-hover-popup-v133",
                }
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
      const data = featureCollection(
        filteredRecords,
        layer,
        prepareLayerRecordsV138(records, layer),
        { sidecar: locationsByElementV151[elementId], system: boundaryContextV151.system }
      );
      const renderKey = runtimeKey(countryIso3, elementId);
      const renderSignature = JSON.stringify({
        filters: selectedFilterDimensionsV125(layer, filters),
        recordCount: filteredRecords.length,
        boundary: boundaryContextV151.system,
        located: Boolean(locationsByElementV151[elementId]),
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
            // The glyph server (V150 backdrop) serves Noto Sans; MapLibre's
            // default Open Sans stack is not there and would 404 every cluster.
            "text-font": ["Noto Sans Regular"],
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
          // A row placed at a city or district centre is drawn hollow, so a
          // reader never takes a representative point for a building.
          "circle-opacity": [
            "case",
            ["==", ["get", "approximate"], true],
            pointSymbolShape === "circle" ? 0.12 : 0,
            pointSymbolShape === "circle" ? (isPrimary ? 0.88 : 0.4) : 0,
          ] as any,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "approximate"], true],
            color,
            "#ffffff",
          ] as any,
          "circle-stroke-width": [
            "case",
            ["==", ["get", "approximate"], true],
            pointSymbolShape === "circle" ? 2 : 0,
            isPrimary ? 1.5 : 0.8,
          ] as any,
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
            "icon-opacity": [
              "case",
              ["==", ["get", "approximate"], true],
              isPrimary ? 0.45 : 0.25,
              isPrimary ? 0.9 : 0.45,
            ] as any,
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
            elementId,
            mapHitPriorityRefV133.current
          )
        ) {
          return;
        }
        const overlapHits = mapHitCandidatesV133(
          map,
          event.point,
          countryIso3,
          renderOrderedActiveIds,
          mapHitPriorityRefV133.current
        );
        if (overlapHits.length > 1) {
          setOverlapChoicesV133(overlapHits);
          popupRef.current?.remove();
          popupRef.current = null;
          return;
        }
        setOverlapChoicesV133([]);
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
            elementId,
            mapHitPriorityRefV133.current
          )
        ) {
          return;
        }
        map.getCanvas().style.cursor = "pointer";
        const overlapHits = mapHitCandidatesV133(
          map,
          event.point,
          countryIso3,
          renderOrderedActiveIds,
          mapHitPriorityRefV133.current
        );
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
        const layerTitle = publicMapLayerTitleV126(
          elementId,
          layer.publicShortTitle
        );
        popupRef.current?.remove();
        popupOwnerRef.current = pointPopupOwnerKey;
        if (overlapHits.length > 1) {
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10,
          })
            .setLngLat(coordinates)
            .setDOMContent(
              createMapOverlapPopupV145(summarizeMapHitsV145(overlapHits, layers, filters))
            )
            .addTo(map);
          return;
        }
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
          .setLngLat(coordinates)
          .setDOMContent(
            createMapFeaturePopupV148({
              elementId,
              selectionKey: String(feature.properties?.selectionKey ?? feature.properties?.recordId ?? ""),
              title: name,
              dataset: layerTitle,
              primary: isPrimary,
              facts: mapFactsV148(layer, (feature.properties || {}) as Record<string, unknown>)
                .filter((fact) => fact.key !== "sourceLabel"),
              source: mapSourceLineV148((feature.properties || {}) as Record<string, unknown>),
              note:
                [
                  feature.properties?.approximate ? "소재 지역의 대표 위치" : "",
                  publicTextV126(feature.properties?.locationLabelV151)
                    ? `소재 ${publicTextV126(feature.properties?.locationLabelV151)}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined,
            })
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
                elementId,
                mapHitPriorityRefV133.current
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
                elementId,
                mapHitPriorityRefV133.current
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
    const nextRenderedElementIds = renderOrderedActiveIds.filter((elementId) =>
      mountedKeysRef.current.has(runtimeKey(countryIso3, elementId))
    );
    setRenderedMapElementIdsV133((current) =>
      current.length === nextRenderedElementIds.length &&
      current.every((elementId, index) => elementId === nextRenderedElementIds[index])
        ? current
        : nextRenderedElementIds
    );
  }, [
    activeIds,
    baseMapStatus,
    boundaryContextV151,
    countryIso3,
    filters,
    layers,
    locationsByElementV151,
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

  // V138: the seven-category catalogue. Rows come from the 43-target contract
  // in its own order; a target without a layer stays visible with its reason.
  const mapTargetGroupsV138 = useMemo(() => {
    const layerByElement = new Map(layers.map((layer) => [layer.elementId, layer]));
    return PUBLIC_MAP_TARGET_CATEGORIES_V138.map((category) => ({
      category,
      rows: PUBLIC_MAP_TARGETS_V138.filter((target) => target.category === category).map(
        (target) => ({ target, layer: layerByElement.get(target.elementId) || null })
      ),
    })).filter((group) => group.rows.length > 0);
  }, [layers]);
  // V140: the list's counts come from the map index, the same file the home
  // counts from, so "지도 자료 N개" is one number on every screen. Targets
  // the contract names but the index does not carry are counted as pending.
  const mapAvailabilityV140 = useMemo(
    () => summarizeMapAvailabilityV140(layers),
    [layers]
  );
  const [openCategoriesV138, setOpenCategoriesV138] = useState<Set<string>>(
    () => new Set<string>()
  );
  const [openInfoV138, setOpenInfoV138] = useState<string | null>(null);
  // A category holding a selected dataset opens on its own, once, so a shared
  // URL lands on the datasets it names. The reader's own folding is kept.
  const openedForSelectionRefV138 = useRef<string | null>(null);
  useEffect(() => {
    const signature = activeIds.join(",");
    if (openedForSelectionRefV138.current === signature) return;
    openedForSelectionRefV138.current = signature;
    const targetsByElement = new Map(
      PUBLIC_MAP_TARGETS_V138.map((target) => [target.elementId, target.category])
    );
    setOpenCategoriesV138((current) => {
      const next = new Set(current);
      activeIds.forEach((id) => {
        const category = targetsByElement.get(id);
        if (category) next.add(category);
      });
      if (next.size === 0 && PUBLIC_MAP_TARGET_CATEGORIES_V138.length) {
        next.add(PUBLIC_MAP_TARGET_CATEGORIES_V138[0]);
      }
      return next;
    });
  }, [activeIds]);
  // Area datasets in the selection: only one of them can colour the map.
  const colourCandidatesV138 = useMemo(
    () =>
      activeIds
        .map((id) => layers.find((layer) => layer.elementId === id))
        .filter((layer): layer is CountryMapLayerV122 => {
          if (!layer) return false;
          const renderer = rendererOf(layer);
          return (
            renderer === "admin1-choropleth" ||
            renderer === "partial-choropleth"
          );
        }),
    [activeIds, layers]
  );

  // V135 dedicated comparison workspace. Two datasets are treated as equal
  // primary views here; the normal map still allows at most one companion.
  const comparisonLayerOptionsV135 = useMemo(
    () =>
      layers
        .filter((layer) => layer.enabled !== false)
        .map((layer) => ({
          elementId: layer.elementId,
          title: publicMapLayerTitleV126(
            layer.elementId,
            layer.publicShortTitle
          ),
        })),
    [layers]
  );

  const buildComparisonDatasetV135 = useCallback(
    (elementId: string, color: string): MapComparisonDatasetV135 | null => {
      const layer = layers.find((item) => item.elementId === elementId);
      if (!layer) return null;
      const renderer = rendererOf(layer);
      const selector = selectorForLayer(layer, selectorByElement[elementId]);
      const asset = spatialByElement[elementId];
      const records = recordsByElement[elementId];
      let geoJson: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null = null;
      let valueDomain: { maximum: number; minimum: number } | undefined;

      if (renderer === "point" || renderer === "cluster") {
        if (!records) return null;
        geoJson = featureCollection(
          records,
          layer
        ) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
      } else if (renderer === "line") {
        if (!asset) return null;
        geoJson = lineFeatureCollection(layer, asset, selector, {});
      } else if (renderer === "regional-scope") {
        if (!asset) return null;
        geoJson = asset.geometry as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
      } else {
        if (!asset) return null;
        const result = choroplethFeatureCollectionV151(layer, asset, selector, boundaryContextV151);
        geoJson = result.collection;
        valueDomain = { maximum: result.maximum, minimum: result.minimum };
      }
      if (!geoJson) return null;

      const variableOption = layer.selectors.variables.find(
        (option) => option.key === selector.variable
      );
      const presentation = getPublicIndicatorVariablePresentationV129(
        elementId,
        selector.variable
      );
      return {
        color,
        coverage: publicMapCoverageTextV126(layer),
        elementId,
        geoJson,
        renderer,
        selector,
        source: publicSourceOrganizationV136_1(layer.source) || "출처 미표기",
        title: publicMapLayerTitleV126(elementId, layer.publicShortTitle),
        unit: presentation?.unit || variableOption?.unit || layer.unit || "",
        valueDomain,
        variableLabel: publicTextV126(variableOption?.label) || "값",
        variableOptions: layer.selectors.variables.map((option) => ({
          key: option.key,
          label: publicTextV126(option.label) || option.key,
          periods: option.periods,
          unit: option.unit,
        })),
      };
    },
    [boundaryContextV151, layers, recordsByElement, selectorByElement, spatialByElement]
  );

  const comparisonBoundsV135 = useMemo(
    (): [[number, number], [number, number]] => [
      [fallbackBounds[0][0], fallbackBounds[0][1]],
      [fallbackBounds[1][0], fallbackBounds[1][1]],
    ],
    [fallbackBounds]
  );

  const comparisonDatasetsV135 = useMemo(
    (): [MapComparisonDatasetV135 | null, MapComparisonDatasetV135 | null] => [
      buildComparisonDatasetV135(comparisonLayerIdsV135[0], "#176a4b"),
      buildComparisonDatasetV135(comparisonLayerIdsV135[1], "#8a4b12"),
    ],
    [buildComparisonDatasetV135, comparisonLayerIdsV135]
  );

  function openComparisonV135(elementIdA: string, elementIdB: string) {
    const pair: [string, string] = [elementIdA, elementIdB];
    setComparisonLayerIdsV135(pair);
    setComparisonModeV135(true);
    setSelected(null);
    setSelectedSpatial(null);
    setOverlapChoicesV133([]);
    setLastEnabledContextIdV133(null);
    setRoleNotice("두 데이터를 나란히 비교합니다.");
  }

  function closeComparisonV135() {
    const [primaryElement] = comparisonLayerIdsV135;
    setComparisonModeV135(false);
    setActiveIds(primaryElement ? [primaryElement] : []);
    setFocusId(primaryElement || null);
    setSelected(null);
    setSelectedSpatial(null);
    setRoleNotice("일반 지도로 돌아왔습니다.");
  }

  function changeComparisonDatasetV135(
    side: MapComparisonSideV135,
    elementId: string
  ) {
    // Both panes can change inside one batch, so the pair is updated
    // functionally and the active layers are derived from it below. Assigning
    // activeIds here instead would let the second pane overwrite the first.
    setComparisonLayerIdsV135((current) =>
      side === "a" ? [elementId, current[1]] : [current[0], elementId]
    );
    setSelected(null);
    setSelectedSpatial(null);
  }

  function changeComparisonSelectorV135(
    side: MapComparisonSideV135,
    patch: { period?: string; variable?: string }
  ) {
    const elementId = side === "a"
      ? comparisonLayerIdsV135[0]
      : comparisonLayerIdsV135[1];
    const layer = layers.find((item) => item.elementId === elementId);
    if (!layer) return;
    setSelectorByElement((current) => {
      const active = selectorForLayer(layer, current[elementId]);
      const variable = patch.variable || active.variable;
      const option = layer.selectors.variables.find(
        (row) => row.key === variable
      );
      const periods = option?.periods || layer.selectors.periods;
      const requested = patch.period || active.period;
      return {
        ...current,
        [elementId]: {
          variable,
          period: periods.includes(requested) ? requested : periods[0] || "",
        },
      };
    });
  }

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
  // V151-2: the rule the focused layer follows under the current outline.
  const focusedBoundaryPolicyKindV151: BoundaryPolicyKindV151 | null =
    focusedLayer && focusedSelector
      ? policyKindForVariableV151(focusedLayer.boundaryPolicy, focusedSelector.variable)
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
      const records = recordsByElement[elementId];
      const hasApproximate = Boolean(
        layer.approximateLocation &&
          records &&
          prepareLayerRecordsV138(records, layer).approximateRecordIds.size > 0
      );
      return [
        {
          color: LAYER_COLORS[elementId] || "#48665a",
          elementId,
          role: elementId === primaryLayerId ? "primary" : "context",
          shape:
            elementId === "D-008" && elementId !== primaryLayerId
              ? "circle"
              : publicMapSymbolShapeV129(layer),
          title: publicMapLayerTitleV126(elementId, layer.publicShortTitle),
          unit: layer.countNoun || variablePresentation?.unit || variable?.unit || layer.unit,
          variable:
            layer.analysisItemLabel ||
            (layer.layerId.startsWith("vnm-v138-") ? variable?.label : null) ||
            variablePresentation?.label ||
            variable?.label ||
            layer.legend.title,
          hidden: hiddenIdsV138.includes(elementId),
          hasApproximate,
        },
      ];
    });
  }, [
    contextLayerIds,
    hiddenIdsV138,
    layers,
    primaryLayerId,
    recordsByElement,
    selectorByElement,
  ]);
  const selectedPresetV133 = selectedPresetId
    ? PUBLIC_MAP_WORKSPACE_PRESETS_V126.find(
        (preset) => preset.id === selectedPresetId
      ) || null
    : null;
  const selectedPresetContextCandidatesV133 = useMemo(
    () =>
      selectedPresetId
        ? publicMapPresetContextCandidatesV133(selectedPresetId)
            .map((candidate) => ({
              ...candidate,
              layer:
                layers.find(
                  (layer) => layer.elementId === candidate.elementId
                ) || null,
            }))
            .filter((candidate) => Boolean(candidate.layer))
        : [],
    [layers, selectedPresetId]
  );
  const financeSummaryV133 = useMemo(() => {
    const adaptationFeatures =
      spatialByElement["D-018"]?.geometry.features || [];
    const adaptationProjects = new Map<string, Record<string, unknown>>();
    adaptationFeatures.forEach((feature, index) => {
      const properties = (feature.properties || {}) as Record<string, unknown>;
      const key = String(properties.recordId || feature.id || index);
      if (!adaptationProjects.has(key)) adaptationProjects.set(key, properties);
    });
    const adaptationAmount = Array.from(adaptationProjects.values()).reduce(
      (sum, row) => sum + (optionalFiniteNumberV130(row.approvedAmount) || 0),
      0
    );
    const carbonRows = (recordsByElement["C-025"] || []).filter(
      (record) => record.mapEligible
    );
    const currentType = financeTypeV133;
    return {
      amount:
        currentType === "adaptation" && adaptationAmount > 0
          ? `USD ${formatPublicNumberV126(adaptationAmount, "USD")}`
          : "원천의 사업별 금액 범위",
      count:
        currentType === "adaptation"
          ? adaptationProjects.size
          : carbonRows.length,
      verifiedSpatialCount:
        currentType === "adaptation"
          ? adaptationProjects.size
          : carbonRows.length,
    };
  }, [financeTypeV133, recordsByElement, spatialByElement]);
  const focusedAnalysisV126 = useMemo(() => {
    const summaryRows: PublicMapSummaryRowV126[] = [];
    const empty = {
      summaryRows,
      capacityRows: [] as ReturnType<typeof powerCapacitySummaryV148>,
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
      const sourceValues = asset?.data
        ? spatialValuesForSelectorV125(asset.data, focusedSelector)
        : [];
      // V151-2: under the 34-unit outline the panel describes the values the
      // map draws (the aggregated 34 units), not the 63 source rows.
      const renderedV151 = asset
        ? choroplethFeatureCollectionV151(focusedLayer, asset, focusedSelector, boundaryContextV151)
        : null;
      const aggregated34 = renderedV151?.mode === "34";
      const values: VietnamSpatialLayerAssetV124["values"] = aggregated34
        ? renderedV151!.collection.features
            .filter((feature) => feature.properties?.hasValue)
            .map((feature) => {
              const properties = feature.properties || {};
              return {
                adm1Code: String(properties.adm1Code || ""),
                adm1Name: String(properties.adm1Name || ""),
                variable: focusedSelector.variable,
                variableLabel: String(properties.variableLabel || ""),
                period: focusedSelector.period,
                value: Number(properties.value),
                unit: String(properties.unit || ""),
                sourceIndicatorId: null,
                sourceRecordId: null,
                sourceSpatialUnit: "admin1" as const,
                imputed: false as const,
              };
            })
        : sourceValues;
      const unitTotalV151 = aggregated34 ? 34 : 63;
      const unitTotalLabelV151 = aggregated34 ? "34개 성·시(2025-07-01 시행)" : "63개 성·시(개편 전 기준)";
      const sourceIsRegional = values.some(
        (row) => row.sourceSpatialUnit === "region"
      );
      const regionUnitLabel = regionUnitLabelV138(focusedLayer);
      const regionTotal =
        focusedLayer.elementId === "B-021"
          ? 6
          : asset?.data?.validation.sourceRegionCount || 34;
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
      const ordered = analysisValues.filter((row) => Number.isFinite(row.value)).sort(
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
      const missingRegionCount = Math.max(0, unitTotalV151 - ordered.length);
      summaryRows.push({
        label: sourceIsRegional ? `자료가 있는 ${regionUnitLabel}` : "자료가 있는 지역",
        value: sourceIsRegional
          ? `${ordered.length}/${regionTotal}개 ${regionUnitLabel}`
          : `${ordered.length}/${unitTotalLabelV151}`,
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
            label: "값이 가장 작은 지역",
            value: `${
              sourceIsRegional
                ? publicVietnamSourceRegionV126(ordered[0]?.sourceRegion)
                : publicMapFeatureNameV126(ordered[0]?.adm1Name, "미표기")
            } · ${formatPublicNumberV126(ordered[0]?.value, unit)} ${unit}`.trim(),
          },
          {
            label: "값이 가장 큰 지역",
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
        label: sourceIsRegional ? `미제공 ${regionUnitLabel}` : "미제공 지역",
        value: sourceIsRegional
          ? `${Math.max(0, regionTotal - ordered.length)}개 ${regionUnitLabel}`
          : `${missingRegionCount}개 성·시`,
      });
      return {
        capacityRows: empty.capacityRows,
        summaryRows,
        minimum,
        median: middle,
        maximum,
        dataRegionCount: values.length,
        missingRegionCount: sourceIsRegional
          ? Math.max(0, regionTotal - ordered.length)
          : Math.max(0, unitTotalV151 - values.length),
        unit,
      };
    }
    const records = filterRecords(
      recordsByElement[focusedLayer.elementId] || [],
      focusedLayer,
      filters
    ).filter((row) => row.mapEligible);
    const allRecords = recordsByElement[focusedLayer.elementId] || [];
    const prepared = prepareLayerRecordsV138(allRecords, focusedLayer);
    const noun = focusedLayer.countNoun || "건";
    const featureNoun = focusedLayer.featureIdentity?.label || publicTitle;
    if (focusedLayer.elementId === "A-023") {
      // Three different numbers, each named: the rows the two registries
      // deliver, the rows with a coordinate, and how many of those each
      // registry contributes. They are not merged into one "발전소 수" because
      // WRI and OSM share no identifier; identical coordinates alone do not
      // prove one plant.
      const sourceFilter = focusedLayer.filters.find((filter) => filter.field === "sourceKey");
      const sourceChoice = sourceFilter ? selectedFilterValueV141(focusedLayer, sourceFilter, filters) : "all";
      const shownSource =
        sourceChoice === "wri" || sourceChoice === "osm"
          ? `${POWER_PLANT_SOURCES_V141[sourceChoice].label} 기준`
          : "두 출처 함께 · 같은 시설이 두 번 표시될 수 있음";
      summaryRows.push({ label: "자료 출처", value: shownSource });
      const withCapacity = records.filter((row) => typeof row.normalizedAttributes?.capacityMw === "number");
      if (sourceChoice === "all") {
        summaryRows.push(
          { label: "WRI 2021 표시", value: `${records.filter((r) => r.indicatorId === "A-023_power_plant_registry").length.toLocaleString()}곳` },
          { label: "OSM 2026 표시", value: `${records.filter((r) => r.indicatorId !== "A-023_power_plant_registry").length.toLocaleString()}곳` },
          { label: "비교 기준", value: "같은 시설이 두 출처에 포함될 수 있어 시설 수와 용량을 합산하지 않습니다." }
        );
      } else {
        const capacityRows = powerCapacitySummaryV148(records);
        summaryRows.push(
          { label: "현재 표시 시설", value: `${records.length.toLocaleString()}곳` },
          { label: "수록 설비용량 합계", value: `${formatPublicNumberV126(capacityRows.reduce((sum, r) => sum + r.capacity, 0), "MW")} MW` },
          { label: "용량 집계 대상", value: `${withCapacity.length.toLocaleString()}곳 · 용량 미기재 ${records.length - withCapacity.length}곳` }
        );
        return { ...empty, summaryRows, unit: "곳", capacityRows };
      }
      return { ...empty, summaryRows, unit: "곳" };
    }
    summaryRows.push({
      label: `${featureNoun} 수(지도 표시)`,
      value: `${records.length.toLocaleString()}${noun}`,
    });
    if (focusedLayer.featureIdentity && focusedLayer.memberRowCount) {
      summaryRows.push({
        label: focusedLayer.featureIdentity.memberLabel
          ? `${focusedLayer.featureIdentity.memberLabel} 행`
          : "원천 행",
        value: `${focusedLayer.memberRowCount.toLocaleString()}행`,
      });
    }
    const memberRows = [...prepared.membersByRecordId.values()].reduce(
      (sum, group) => sum + group.length,
      0
    );
    const notShown = allRecords.length - memberRows;
    if (notShown > 0) {
      summaryRows.push({
        label: "지도 미표시 행",
        value: `${notShown.toLocaleString()}행 (좌표 없음·범위 밖·제외 상태)`,
      });
    }
    // Two different reasons a delivered row is not on the map, each named:
    // E-018 has nine companies whose row carries no coordinate, and "필터로
    // 가려진 8곳" said a filter the reader never set was hiding them.
    const eligible = prepared.records.filter((row) => row.mapEligible);
    if (eligible.length < prepared.records.length) {
      summaryRows.push({
        label: "위치자료 미확보(지도 표시 제외)",
        value: `${(prepared.records.length - eligible.length).toLocaleString()}${noun}`,
      });
    }
    if (records.length < eligible.length) {
      summaryRows.push({
        label: "필터로 가려진 수",
        value: `${(eligible.length - records.length).toLocaleString()}${noun}`,
      });
    }
    if (prepared.approximateRecordIds.size > 0) {
      summaryRows.push({
        label: "근사 위치(속 빈 기호)",
        value: `${prepared.approximateRecordIds.size.toLocaleString()}${noun}`,
      });
    }
    const primaryGroupField = focusedLayer.filters[0]?.field;
    if (primaryGroupField) {
      const labels = focusedLayer.filters[0]?.valueLabels || {};
      countByPublicFieldV126(records, primaryGroupField)
        .forEach(([label, count]) =>
          summaryRows.push({ label: labels[label] || label, value: `${count.toLocaleString()}${noun}` })
        );
    }
    return { ...empty, summaryRows, unit: noun };
  }, [
    boundaryContextV151,
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
  // Points of the selected regional project (its verified activity sites).
  const selectedProjectSitePointsV139 = (() => {
    if (!selectedSpatial || !selectedOwningLayer) return 0;
    const features = spatialByElement[selectedOwningLayer.elementId]?.geometry?.features;
    if (!Array.isArray(features)) return 0;
    const name = String(selectedSpatial.properties.name || "");
    return features.filter(
      (feature) =>
        feature?.geometry?.type === "Point" && String(feature?.properties?.name || "") === name
    ).length;
  })();
  const selectedFeatureRoleV129: PublicMapLayerRoleV129 | null =
    selectedOwningLayer?.elementId === primaryLayerId
      ? "primary"
      : selectedOwningLayer && contextLayerIds.includes(selectedOwningLayer.elementId)
      ? "context"
      : null;
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
    const rank = uniqueB021RegionRankV133(
      asset.data,
      selectedOwningSelector,
      selectedRegion
    );
    return rank ? `${rank} · 현재 값이 큰 순서` : "";
  })();
  // The selected province's own series, for any area layer that carries more
  // than one period. B-033 had this; the climate layers, whose whole point is
  // change over time, did not. A layer crossed with scenarios draws one line
  // per scenario for the chosen measure, historical included, never joined.
  const selectedB033TrendV132 = useMemo<SelectedRegionTrendV132 | null>(() => {
    if (
      !selectedSpatial?.adm1Code ||
      !selectedOwningLayer ||
      selectedOwningLayer.elementId !== selectedSpatial.elementId ||
      !selectedOwningSelector
    ) {
      return null;
    }
    const renderer = rendererOf(selectedOwningLayer);
    if (renderer !== "admin1-choropleth" && renderer !== "partial-choropleth") {
      return null;
    }
    const data = spatialByElement[selectedOwningLayer.elementId]?.data;
    if (!data) return null;
    const groups = selectedOwningLayer.selectors.variableGroups;
    const currentOption = selectedOwningLayer.selectors.variables.find(
      (option) => option.key === selectedOwningSelector.variable
    );
    const variableKeys =
      groups && currentOption?.measureKey
        ? selectedOwningLayer.selectors.variables
            .filter((option) => option.measureKey === currentOption.measureKey)
            .map((option) => option.key)
        : [selectedOwningSelector.variable];
    const measureLabel = groups
      ? groups.measures.find((measure) => measure.key === currentOption?.measureKey)?.label ||
        currentOption?.label ||
        "값"
      : getPublicIndicatorVariablePresentationV129(
          selectedOwningLayer.elementId,
          selectedOwningSelector.variable
        )?.label ||
        currentOption?.label ||
        "값";
    // V151-2: a selected 34-unit aggregate gets the same rule applied per
    // period, so its trend is the aggregated series, never a member's.
    const trendKind = policyKindForVariableV151(selectedOwningLayer.boundaryPolicy, selectedOwningSelector.variable);
    let sourceRows: VietnamSpatialLayerAssetV124["values"] = data.values;
    if (selectedSpatial.unitCode) {
      if (!isAggregatingKindV151(trendKind)) return null;
      const areas = areaKm2ByAdm1CodeV151(adm1Geometry34V151) || undefined;
      if (trendKind === "area-weighted-mean" && !areas) return null;
      const memberSet = new Set(selectedSpatial.memberAdm1Codes || []);
      const buckets = new Map<string, VietnamSpatialLayerAssetV124["values"]>();
      for (const row of data.values) {
        if (!memberSet.has(row.adm1Code) || !variableKeys.includes(row.variable)) continue;
        const key = `${row.variable}|${row.period}`;
        const list = buckets.get(key) || [];
        list.push(row);
        buckets.set(key, list);
      }
      sourceRows = [];
      for (const rows of buckets.values()) {
        const aggregated = aggregateTo34V151(rows, trendKind, { areaKm2ByAdm1Code: areas }).find(
          (row) => row.unitCode === selectedSpatial.unitCode
        );
        if (aggregated && aggregated.value !== null) {
          sourceRows.push({ ...rows[0], adm1Code: selectedSpatial.adm1Code, value: aggregated.value });
        }
      }
    }
    const rowsByVariable = new Map<string, Array<{ period: string; value: number; unit: string }>>();
    let unit = "";
    sourceRows.forEach((row) => {
      if (
        row.adm1Code !== selectedSpatial.adm1Code ||
        !variableKeys.includes(row.variable) ||
        !Number.isFinite(row.value) ||
        !/^\d{4}$/u.test(row.period)
      ) {
        return;
      }
      const rowUnit = publicMapFactV132(row.unit) || unit;
      if (!unit) unit = rowUnit;
      if (rowUnit !== unit) return;
      const list = rowsByVariable.get(row.variable) || [];
      if (!list.some((item) => item.period === row.period)) {
        list.push({ period: row.period, value: row.value, unit: rowUnit });
      }
      rowsByVariable.set(row.variable, list);
    });
    const allRows = [...rowsByVariable.values()].flat();
    const distinctPeriods = new Set(allRows.map((row) => row.period));
    if (distinctPeriods.size < 2) return null;
    const scenarioLabel = (key: string) =>
      groups?.scenarios.find((scenario) => scenario.key === key)?.label || key;
    const markers = ["circle", "square", "diamond", "triangle", "cross"] as const;
    const series: TimeSeriesV127[] = [...rowsByVariable]
      .map(([variable, rows], index) => {
        const option = selectedOwningLayer.selectors.variables.find((item) => item.key === variable);
        const sorted = [...rows].sort((left, right) => Number(left.period) - Number(right.period));
        return {
          id: variable,
          label: option?.scenario ? scenarioLabel(option.scenario) : measureLabel,
          unit: unit || option?.unit || "",
          color: option?.scenario ? undefined : LAYER_COLORS[selectedOwningLayer.elementId],
          marker: markers[index % markers.length],
          linePattern: option?.scenario === "historical" ? ("dash" as const) : ("solid" as const),
          points: sorted.map((row) => ({
            id: `${selectedSpatial.adm1Code}:${variable}:${row.period}`,
            x: Number(row.period),
            xLabel: `${row.period}년`,
            value: row.value,
          })),
        };
      })
      .filter((item) => item.points.length > 0);
    const tableRows = [...new Map(
      allRows
        .sort((left, right) => Number(left.period) - Number(right.period))
        .map((row) => [row.period, { period: row.period, value: row.value }])
    ).values()];
    return {
      region: selectedSpatial.adm1Name,
      rows: tableRows,
      unit: unit || currentOption?.unit || "",
      measureLabel,
      scenarioSeries: Boolean(groups),
      series,
    };
  }, [
    adm1Geometry34V151,
    selectedOwningLayer,
    selectedOwningSelector,
    selectedSpatial,
    spatialByElement,
  ]);
  // The province's document or project rows behind a count, from the layer asset.
  // V151-2: the members behind a selected 34-unit aggregate, or null.
  const selectedMemberSummaryV151 = useMemo(
    () => (selectedSpatial ? parseMemberSummaryV151(selectedSpatial.properties.memberSummary) : null),
    [selectedSpatial]
  );
  const selectedMemberRecordsV138 = useMemo(() => {
    if (!selectedSpatial?.adm1Code || !selectedOwningLayer) return [];
    const data = spatialByElement[selectedOwningLayer.elementId]?.data;
    // V151-2: a 34-unit selection gathers the documents of every member
    // province; a document filed under two members is still one document.
    const codes = selectedSpatial.memberAdm1Codes?.length
      ? selectedSpatial.memberAdm1Codes
      : [selectedSpatial.adm1Code];
    const seen = new Set<string>();
    const merged: NonNullable<VietnamSpatialLayerAssetV124["memberRecords"]>[string] = [];
    for (const code of codes) {
      for (const record of data?.memberRecords?.[code] || []) {
        const key = `${record.recordId}|${record.label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(
          codes.length > 1
            ? { ...record, label: `${record.label} ${formerProvinceLabelV151(code)}`.trim() }
            : record
        );
      }
    }
    return merged;
  }, [selectedOwningLayer, selectedSpatial, spatialByElement]);
  // The rows a selected point feature stands for (identity groups).
  const selectedMembersV138 = useMemo<CountryEntityV122[]>(() => {
    if (!selected || !selectedLayer) return [];
    const records = recordsByElement[selectedLayer.elementId] || [];
    const prepared = prepareLayerRecordsV138(records, selectedLayer);
    return prepared.membersByRecordId.get(selected.recordId) || [selected];
  }, [recordsByElement, selected, selectedLayer]);
  const selectedApproximateV138 = useMemo(() => {
    if (!selected || !selectedLayer) return false;
    const records = recordsByElement[selectedLayer.elementId] || [];
    return prepareLayerRecordsV138(records, selectedLayer).approximateRecordIds.has(
      selected.recordId
    );
  }, [recordsByElement, selected, selectedLayer]);
  // Hydrological sites: each member row is one named indicator with its own unit.
  const selectedMemberFactsV138 = useMemo(() => {
    const contract = selectedLayer?.memberFacts;
    if (!contract || !selectedMembersV138.length) return [];
    return selectedMembersV138
      .map((record) => {
        const attributes = (record.normalizedAttributes || {}) as Record<string, unknown>;
        const label = publicTextV126(attributes[contract.labelKey]) || "";
        const rawValue = attributes[contract.valueKey];
        const unit = publicTextV126(attributes[contract.unitKey]) || "";
        const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
        const value =
          rawValue === null || rawValue === undefined || rawValue === ""
            ? "자료 미제공"
            : Number.isFinite(numericValue)
              ? `${formatPublicNumberV126(numericValue, unit)} ${unit}`.trim()
              : `${publicTextV126(formatValueV121(rawValue)) || ""} ${unit}`.trim();
        const year = attributes["기준연도"] || record.provenance.referenceYear;
        return label ? { label: year ? `${label} · ${year}년` : label, value } : null;
      })
      .filter((row): row is { label: string; value: string } => Boolean(row));
  }, [selectedLayer, selectedMembersV138]);
  const [memberSeriesQuantileV138, setMemberSeriesQuantileV138] = useState("50");
  // Sea-level stations: one line per scenario at the chosen quantile.
  const selectedMemberSeriesV138 = useMemo(() => {
    const contract = selectedLayer?.memberSeries;
    if (!contract || selectedMembersV138.length < 2 || !selected) return null;
    const quantiles = [...new Set(
      selectedMembersV138.map((record) =>
        attributeText((record.normalizedAttributes || {})[contract.quantileKey])
      )
    )]
      .filter(Boolean)
      .sort((left, right) => Number(left) - Number(right));
    const quantile = quantiles.includes(memberSeriesQuantileV138)
      ? memberSeriesQuantileV138
      : quantiles.includes("50")
        ? "50"
        : quantiles[0];
    const byScenario = new Map<string, Array<{ year: number; value: number }>>();
    const confidence = new Set<string>();
    selectedMembersV138.forEach((record) => {
      const attributes = (record.normalizedAttributes || {}) as Record<string, unknown>;
      if (attributeText(attributes[contract.quantileKey]) !== quantile) return;
      const year = Number(attributeText(attributes[contract.periodKey]));
      const value = typeof attributes[contract.valueKey] === "number"
        ? (attributes[contract.valueKey] as number)
        : Number(attributeText(attributes[contract.valueKey]));
      if (!Number.isFinite(year) || !Number.isFinite(value)) return;
      const scenario = attributeText(attributes[contract.scenarioKey]) || "전체";
      if (contract.confidenceKey) {
        const level = attributeText(attributes[contract.confidenceKey]);
        if (level) confidence.add(level);
      }
      const list = byScenario.get(scenario) || [];
      list.push({ year, value });
      byScenario.set(scenario, list);
    });
    const markers = ["circle", "square", "diamond", "triangle", "cross"] as const;
    const series: TimeSeriesV127[] = [...byScenario]
      .sort((left, right) => left[0].localeCompare(right[0], "en"))
      .map(([scenario, points], index) => ({
        id: scenario,
        label: scenario,
        unit: contract.unit,
        marker: markers[index % markers.length],
        linePattern: "solid" as const,
        points: points
          .sort((left, right) => left.year - right.year)
          .map((point) => ({
            id: `${scenario}:${point.year}`,
            x: point.year,
            xLabel: `${point.year}년`,
            value: point.value,
          })),
      }));
    if (!series.length) return null;
    const title = selectedEntityTitleResolutionV131?.title || selected.name || "관측소";
    return {
      title,
      unit: contract.unit,
      measureLabel: "상대해수면 상승(2005년 기준)",
      quantiles,
      series,
      note: `관측소별 상대해수면 전망입니다. 기준면은 1995–2014 평균(2005년 기준)이며 침수 범위가 아닙니다. 분위는 모형 불확실성 범위이고${
        confidence.size ? ` 신뢰수준 ${[...confidence].join("·")}` : ""
      } · 원천 IPCC AR6 해수면 전망 도구.`,
    };
  }, [memberSeriesQuantileV138, selected, selectedEntityTitleResolutionV131, selectedLayer, selectedMembersV138]);
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
          : choroplethFeatureCollectionV151(layer, asset, selector, boundaryContextV151).collection;
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
            unitCode: String(properties.unitCode || "") || undefined,
            memberAdm1Codes: parseMemberSummaryV151(properties.memberSummary)?.members.map((member) => member.adm1Code),
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
    boundaryContextV151,
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
    setHiddenIdsV138([]);
    setFocusId(null);
    setSelected(null);
    setSelectedSpatial(null);
    setSelectedPresetId(null);
    setComparisonModeV135(false);
    setRoleNotice("");
    setOverlapChoicesV133([]);
    setLastEnabledContextIdV133(null);
  }

  function activatePrimaryLayerV126(
    elementId: string,
    preservePreset = false
  ) {
    const layer = layers.find((item) => item.elementId === elementId);
    if (!layer || layer.enabled === false) return;
    // V138: making a dataset the colour map keeps every other selection.
    const nextContexts = activeIds.filter((id) => id !== elementId);
    setActiveIds([elementId, ...nextContexts]);
    setHiddenIdsV138((current) => current.filter((id) => id !== elementId));
    setFocusId(elementId);
    if (!preservePreset) setSelectedPresetId(null);
    setRoleNotice("");
    onSelectorStateChange(semanticStateForLayerV125(layer));
    setSelected(null);
    setSelectedSpatial(null);
    setOverlapChoicesV133([]);
    // V151-2: changing the colour map keeps the reader's viewport.
  }

  /**
   * V138 selection toggle. A ticked dataset joins the selection; the first
   * ticked one - or the first area dataset, so a colour map is never hidden
   * under points - becomes the colour map. Unticking removes exactly that
   * dataset; nothing else is dropped to make room.
   */
  function toggleContextLayerV126(elementId: string) {
    const layer = layers.find((item) => item.elementId === elementId);
    if (!layer || layer.enabled === false) return;
    if (activeIds.includes(elementId)) {
      const remaining = activeIds.filter((id) => id !== elementId);
      setActiveIds(remaining);
      setHiddenIdsV138((current) => current.filter((id) => id !== elementId));
      if (primaryLayerId === elementId) {
        setFocusId(nextColourCandidateV138(remaining));
      }
      setLastEnabledContextIdV133(
        remaining.filter((id) => id !== primaryLayerId).slice(-1)[0] || null
      );
      if (
        selected?.elementId === elementId ||
        selectedSpatial?.elementId === elementId
      ) {
        setSelected(null);
        setSelectedSpatial(null);
      }
      setSelectedPresetId(null);
      setRoleNotice(
        `${publicMapLayerTitleV126(elementId, layer.publicShortTitle)} 선택을 해제했습니다.`
      );
      return;
    }
    const next = [...activeIds, elementId];
    setActiveIds(next);
    if (!primaryLayerId) {
      setFocusId(elementId);
      onSelectorStateChange(semanticStateForLayerV125(layer));
    } else {
      setLastEnabledContextIdV133(elementId);
    }
    setSelectedPresetId(null);
    setSelected(null);
    setSelectedSpatial(null);
    setRoleNotice(
      primaryLayerId
        ? `${publicMapLayerTitleV126(elementId, layer.publicShortTitle)}을(를) 함께 표시합니다. 색상 지도는 그대로 ${publicMapLayerTitleV126(
            primaryLayerId,
            layers.find((item) => item.elementId === primaryLayerId)?.publicShortTitle
          )}입니다.`
        : `${publicMapLayerTitleV126(elementId, layer.publicShortTitle)}을(를) 색상 지도로 표시합니다.`
    );
    // At 768 and below the list is a drawer over the whole map; the first pick
    // hands the map back, later picks keep the list open for more ticks.
    if (
      !primaryLayerId &&
      typeof window !== "undefined" &&
      window.innerWidth <= 768
    ) {
      setLayerPanelOpen(false);
    }
  }

  /** The colour map after its dataset is unticked: an area dataset first, else the first remaining. */
  function nextColourCandidateV138(remaining: string[]): string | null {
    const isArea = (id: string) => {
      const layer = layers.find((item) => item.elementId === id);
      const renderer = layer ? rendererOf(layer) : "point";
      return (
        renderer === "admin1-choropleth" ||
        renderer === "partial-choropleth" ||
        renderer === "regional-scope"
      );
    };
    return remaining.find(isArea) || remaining[0] || null;
  }

  /** Switch a selected dataset's drawing off or on without touching the selection. */
  function toggleLayerVisibilityV138(elementId: string) {
    if (!activeIds.includes(elementId)) return;
    setHiddenIdsV138((current) =>
      current.includes(elementId)
        ? current.filter((id) => id !== elementId)
        : [...current, elementId]
    );
    if (
      selected?.elementId === elementId ||
      selectedSpatial?.elementId === elementId
    ) {
      setSelected(null);
      setSelectedSpatial(null);
    }
  }


  function clearWorkspaceV126() {
    setActiveIds([]);
    setHiddenIdsV138([]);
    setFocusId(null);
    setSelected(null);
    setSelectedSpatial(null);
    setSelectedPresetId(null);
    setOverlapChoicesV133([]);
    setLastEnabledContextIdV133(null);
    setRoleNotice("선택을 해제했습니다. 데이터 목록에서 자료를 선택하세요.");
  }

  function applyFinanceTypeV133(type: "adaptation" | "carbon") {
    const primaryElement = type === "adaptation" ? "D-018" : "C-025";
    const primaryLayer = layers.find(
      (layer) => layer.elementId === primaryElement && layer.enabled !== false
    );
    if (!primaryLayer) {
      setRoleNotice("선택한 사업 유형의 지도 자료를 불러올 수 없습니다.");
      return;
    }
    setFinanceTypeV133(type);
    setActiveIds([primaryElement]);
    setHiddenIdsV138([]);
    setFocusId(primaryElement);
    setSelectedPresetId("CLIMATE_FINANCE_PROJECTS");
    setLastEnabledContextIdV133(null);
    setSelected(null);
    setSelectedSpatial(null);
    setOverlapChoicesV133([]);
    onSelectorStateChange(semanticStateForLayerV125(primaryLayer));
    setRoleNotice(
      `${type === "adaptation" ? "적응기금" : "탄소크레딧"} 사업을 선택 데이터로 표시합니다.`
    );
  }

  function openFinanceComparisonV135() {
    const primaryElement =
      financeTypeV133 === "adaptation" ? "D-018" : "C-025";
    const comparisonElement =
      financeTypeV133 === "adaptation" ? "C-025" : "D-018";
    openComparisonV135(primaryElement, comparisonElement);
  }

  function selectOverlapChoiceV133(choice: MapOverlapChoiceV133) {
    const layer = layers.find((item) => item.elementId === choice.elementId);
    if (!layer) return;
    const recordId = String(choice.properties.recordId || "");
    const record = recordId
      ? recordIndexRef.current.get(`${choice.elementId}:${recordId}`) || null
      : null;
    if (record) {
      setSelected(record);
      setSelectedSpatial(null);
    } else {
      const selector = selectorForLayer(
        layer,
        selectorByElement[layer.elementId]
      );
      const presentation = getPublicIndicatorVariablePresentationV129(
        layer.elementId,
        selector.variable
      );
      const renderer = rendererOf(layer);
      const properties = choice.properties;
      const length = optionalFiniteNumberV130(
        properties.lengthKm ?? properties.length
      );
      const approved = optionalFiniteNumberV130(properties.approvedAmount);
      const value =
        renderer === "line"
          ? length
          : renderer === "regional-scope"
          ? approved
          : optionalFiniteNumberV130(
              properties.value ?? properties.point_count
            );
      setSelected(null);
      setSelectedSpatial({
        elementId: choice.elementId,
        adm1Code: publicTextV126(properties.adm1Code) || undefined,
        adm1Name: choice.label,
        value,
        unit:
          renderer === "line"
            ? "km"
            : renderer === "regional-scope"
            ? "USD"
            : presentation?.unit || publicTextV126(properties.unit),
        period:
          publicTextV126(properties.period) ||
          selector.period ||
          String(layer.sourceYear || ""),
        variableLabel:
          presentation?.label ||
          publicTextV126(properties.variableLabel) ||
          publicMapLayerTitleV126(layer.elementId, layer.publicShortTitle),
        selectionKey: choice.selectionKey,
        properties,
      });
    }
    if (choice.role === "context") {
      setRoleNotice(
        `선택한 함께 보기 · ${publicMapLayerTitleV126(
          choice.elementId,
          layer.publicShortTitle
        )}`
      );
    }
    setOverlapChoicesV133([]);
    setAnalysisPanelOpen(true);
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
    const currentPeriod = selectorForLayer(
      layer,
      selectorByElement[layer.elementId]
    ).period;
    const nextSelector = {
      variable,
      // Switching the measure keeps the year a reader already chose whenever
      // the new measure has it; a climate map should not jump back to 2050.
      period: periods.includes(currentPeriod)
        ? currentPeriod
        : periods.includes(layer.selectors.defaultPeriod)
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
      data-rendered-map-elements={
        renderedMapElementIdsV133.join(",") || "none"
      }
      data-rendered-map-symbols={
        activeLegendIdentitiesV129
          .filter((item) => renderedMapElementIdsV133.includes(item.elementId))
          .map((item) => `${item.elementId}|${item.role}|${item.shape}`)
          .join(",") || "none"
      }
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
      {comparisonModeV135 && (
        <MapComparisonWorkspaceV135
          bounds={comparisonBoundsV135}
          datasets={comparisonDatasetsV135}
          layerOptions={comparisonLayerOptionsV135}
          onClose={closeComparisonV135}
          onDatasetChange={changeComparisonDatasetV135}
          onPeriodChange={(side, period) =>
            changeComparisonSelectorV135(side, { period })
          }
          onVariableChange={(side, variable) =>
            changeComparisonSelectorV135(side, { variable })
          }
          selectedElementIds={comparisonLayerIdsV135}
        />
      )}
      <div
        ref={resizablePanelsV129.layoutRef}
        className={`cdp-map-layout ${
          resizablePanelsV129.isResizing ? "is-resizing" : ""
        }`}
        hidden={comparisonModeV135}
        data-testid="map-resizable-layout"
        data-resizing={resizablePanelsV129.isResizing ? "true" : "false"}
        style={resizablePanelsV129.layoutStyle}
      >
        <aside
          id="map-layer-panel-v129"
          ref={layerPanelRefV138}
          className={`cdp-map-sidebar ${layerPanelOpen ? "is-open" : "is-collapsed"} ${
            resizablePanelsV129.leftCompact ? "is-compact" : ""
          }`}
          data-testid="map-layer-panel"
        >
          <div className="cdp-map-panel-header">
            <div>
              <h1>데이터 지도</h1>
              <p>자료를 여러 개 체크해 함께 볼 수 있습니다. 지역 색상 지도는 한 자료만 칠합니다.</p>
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


          <section
            className="cdp-map-catalog-v138"
            data-testid="map-all-data-v135"
            data-selected-count={activeIds.length}
            data-target-count={PUBLIC_MAP_TARGETS_V138.length}
            data-hidden-count={hiddenIdsV138.length}
            aria-labelledby="map-all-data-title-v135"
          >
            <header className="cdp-map-catalog-v138__header">
              <div>
                <h2 id="map-all-data-title-v135">지도 데이터</h2>
                <p
                  className="cdp-map-catalog-v138__lede"
                  data-testid="map-catalog-status-v138"
                  data-map-connected-count={mapAvailabilityV140.connectedCount}
                  data-map-pending-count={mapAvailabilityV140.pendingCount}
                >
                  {mapIndexStatus === "ready"
                    ? `${mapAvailabilityV140.connectedCount}개 자료 · 선택 ${activeIds.length}개`
                    : `지도 자료 · 선택 ${activeIds.length}개`}
                  {mapIndexStatus === "ready" && mapAvailabilityV140.pendingCount > 0
                    ? ` · ${MAP_PENDING_LABEL_V140} ${mapAvailabilityV140.pendingCount}개`
                    : ""}
                  {primaryLayerId
                    ? ` · 색상·분석 기준: ${publicMapLayerTitleV126(
                        primaryLayerId,
                        layers.find((layer) => layer.elementId === primaryLayerId)
                          ?.publicShortTitle
                      )}`
                    : ""}
                </p>
              </div>
              <div className="cdp-map-catalog-v138__actions">
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary cdp-button--compact"
                  aria-expanded={
                    openCategoriesV138.size === PUBLIC_MAP_TARGET_CATEGORIES_V138.length
                  }
                  onClick={() =>
                    setOpenCategoriesV138(
                      openCategoriesV138.size === PUBLIC_MAP_TARGET_CATEGORIES_V138.length
                        ? new Set()
                        : new Set(PUBLIC_MAP_TARGET_CATEGORIES_V138)
                    )
                  }
                >
                  {openCategoriesV138.size === PUBLIC_MAP_TARGET_CATEGORIES_V138.length
                    ? "모두 접기"
                    : "모두 펼치기"}
                </button>
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary cdp-button--compact"
                  onClick={clearWorkspaceV126}
                  disabled={activeIds.length === 0}
                >
                  선택 해제
                </button>
              </div>
            </header>
            {colourCandidatesV138.length > 1 && (
              <div
                className="cdp-map-catalog-v138__colour"
                data-testid="map-colour-source-v138"
                role="group"
                aria-label="현재 색상 표시 자료"
              >
                <span>지역 색상 지도 {colourCandidatesV138.length}개를 골랐습니다. 색은 한 자료만 칠하고, 나머지는 외곽선과 클릭값으로 남습니다.</span>
                <label className="cdp-field">
                  <span className="cdp-field__label">현재 색상 표시</span>
                  <select
                    className="cdp-select"
                    value={primaryLayerId || ""}
                    onChange={(event) => activatePrimaryLayerV126(event.target.value)}
                  >
                    {colourCandidatesV138.map((layer) => (
                      <option key={layer.elementId} value={layer.elementId}>
                        {publicMapLayerTitleV126(layer.elementId, layer.publicShortTitle)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {mapTargetGroupsV138.map(({ category, rows }) => {
              const open = openCategoriesV138.has(category);
              const selectedCount = rows.filter((row) =>
                activeIds.includes(row.target.elementId)
              ).length;
              const pendingCount =
                mapIndexStatus === "ready"
                  ? rows.filter((row) => !row.layer || row.layer.enabled === false).length
                  : 0;
              const groupId = `map-catalog-group-${category.replace(/[^0-9A-Za-z가-힣]+/gu, "-")}`;
              return (
                <div
                  key={category}
                  className={`cdp-map-catalog-v138__group ${open ? "is-open" : ""}`}
                  data-map-group-v135={category}
                  data-map-group-selected={selectedCount}
                >
                  <button
                    type="button"
                    className="cdp-map-catalog-v138__group-toggle"
                    data-testid="map-catalog-group-toggle-v138"
                    aria-expanded={open}
                    aria-controls={groupId}
                    onClick={() =>
                      setOpenCategoriesV138((current) => {
                        const next = new Set(current);
                        if (next.has(category)) next.delete(category);
                        else next.add(category);
                        return next;
                      })
                    }
                  >
                    <span className="cdp-map-catalog-v138__group-name">{category}</span>
                    <span className="cdp-map-catalog-v138__group-count">
                      {rows.length}개
                      {pendingCount > 0 ? ` · ${MAP_PENDING_LABEL_V140} ${pendingCount}` : ""}
                      {selectedCount > 0 ? ` · 선택 ${selectedCount}` : ""}
                    </span>
                  </button>
                  <ul id={groupId} className="cdp-map-catalog-v138__list" hidden={!open}>
                    {rows.map(({ target, layer }) => {
                      const elementId = target.elementId;
                      const available = Boolean(layer && layer.enabled !== false);
                      const indexPending = mapIndexStatus !== "ready" && !layer;
                      const checked = activeIds.includes(elementId);
                      const isPrimary = primaryLayerId === elementId;
                      const hidden = hiddenIdsV138.includes(elementId);
                      const infoOpen = openInfoV138 === elementId;
                      const renderer = layer ? rendererOf(layer) : null;
                      const isArea =
                        renderer === "admin1-choropleth" ||
                        renderer === "partial-choropleth" ||
                        renderer === "regional-scope";
                      const title = publicMapLayerTitleV126(
                        elementId,
                        layer?.publicShortTitle || target.publicName
                      );
                      const role = isPrimary
                        ? "primary"
                        : checked
                          ? "context"
                          : "inactive";
                      const inputId = `map-catalog-check-${elementId.toLowerCase()}`;
                      return (
                        <li
                          key={elementId}
                          className={`cdp-map-catalog-v138__item is-${role} ${
                            available ? "" : "is-unavailable"
                          } ${hidden ? "is-hidden" : ""}`}
                          data-map-element={elementId}
                          data-map-layer-role={role}
                          data-map-available={available ? "true" : indexPending ? "pending" : "false"}
                          data-map-drawn={checked && !hidden ? "true" : "false"}
                        >
                          <div className="cdp-map-catalog-v138__row">
                            <input
                              id={inputId}
                              type="checkbox"
                              className="cdp-map-catalog-v138__check"
                              data-testid="map-all-data-layer-v135"
                              data-element-id={elementId}
                              data-map-element={elementId}
                              checked={checked}
                              disabled={!available}
                              aria-describedby={`${inputId}-summary`}
                              onChange={() => toggleContextLayerV126(elementId)}
                            />
                            <label htmlFor={inputId} className="cdp-map-catalog-v138__label">
                              {/* A label cannot hold the glossary's button trigger, so
                                  acronyms in the row are glossed in place. */}
                              <strong>
                                <PublicTermExpandedTextV134 text={title} firstOccurrenceOnly />
                              </strong>
                              <small id={`${inputId}-summary`}>
                                <PublicTermExpandedTextV134
                                  text={
                                    available
                                      ? `${publicMapDataItemSummaryV136(elementId)} · ${
                                          layer
                                            ? layerPeriodLabelV141(layer, filters, String(layer.latestYear || layer.sourceYear || target.period), true)
                                            : target.period
                                        }`
                                      : indexPending
                                        ? "지도 목록을 불러오는 중"
                                        : MAP_PENDING_SUMMARY_V140
                                  }
                                  firstOccurrenceOnly
                                />
                              </small>
                            </label>
                            {!available && !indexPending && (
                              <span
                                className="cdp-map-catalog-v138__pending"
                                data-testid="map-catalog-pending-v140"
                              >
                                {MAP_PENDING_LABEL_V140}
                              </span>
                            )}
                            <button
                              type="button"
                              className="cdp-map-catalog-v138__info"
                              aria-expanded={infoOpen}
                              aria-label={`${title} 자료 정보`}
                              onClick={() =>
                                setOpenInfoV138((current) =>
                                  current === elementId ? null : elementId
                                )
                              }
                            >
                              i
                            </button>
                          </div>
                          {checked && (
                            <div className="cdp-map-catalog-v138__controls">
                              {isPrimary ? (
                                <span className="cdp-layer-role-badge is-primary">
                                  {isArea ? "색상 지도 · 분석 기준" : "분석 기준"}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="cdp-button cdp-button--secondary cdp-button--compact"
                                  data-testid="map-context-toggle-v133"
                                  data-map-element={elementId}
                                  data-layer-role="context"
                                  aria-pressed={false}
                                  onClick={() => activatePrimaryLayerV126(elementId)}
                                >
                                  {isArea ? "색상 지도로" : "분석 기준으로"}
                                </button>
                              )}
                              <button
                                type="button"
                                className="cdp-button cdp-button--secondary cdp-button--compact"
                                data-testid="map-layer-visibility-v138"
                                data-map-element={elementId}
                                aria-pressed={!hidden}
                                onClick={() => toggleLayerVisibilityV138(elementId)}
                              >
                                {hidden ? "표시 켜기" : "표시 끄기"}
                              </button>
                              {hidden && (
                                <span className="cdp-map-catalog-v138__hidden">선택됨 · 지도 표시 꺼짐</span>
                              )}
                              {isArea && !isPrimary && !hidden && (
                                <span className="cdp-map-catalog-v138__hidden">외곽선·클릭값으로 표시</span>
                              )}
                            </div>
                          )}
                          {infoOpen && (
                            <dl className="cdp-map-catalog-v138__facts" data-testid="map-catalog-info-v138">
                              <div>
                                <dt>지도 표시</dt>
                                <dd><PublicTermTextV134 text={target.displaySpatialUnit} /></dd>
                              </div>
                              <div>
                                <dt>원자료 공간단위</dt>
                                <dd><PublicTermTextV134 text={target.sourceSpatialUnit} /></dd>
                              </div>
                              <div>
                                <dt>선택 항목</dt>
                                <dd><PublicTermTextV134 text={target.selectableVariables} /></dd>
                              </div>
                              <div>
                                <dt>단위·기간</dt>
                                <dd><PublicTermTextV134 text={`${target.unit} · ${target.period}`} /></dd>
                              </div>
                              <div>
                                <dt>유의사항</dt>
                                <dd><PublicTermTextV134 text={target.limitation} /></dd>
                              </div>
                              {!available && (
                                <div>
                                  <dt>{MAP_PENDING_LABEL_V140} 사유</dt>
                                  <dd data-testid="map-catalog-unavailable-reason-v138">
                                    {layer?.disabledReason || target.build.reason || "위치·경계 자료가 확인되지 않았습니다."}
                                    {target.build.requiredAsset
                                      ? ` 필요한 자료: ${target.build.requiredAsset}`
                                      : ""}
                                  </dd>
                                </div>
                              )}
                              <div>
                                <dt>상세 화면</dt>
                                <dd>
                                  <button
                                    type="button"
                                    className="cdp-link-button"
                                    onClick={() => onOpenElement(elementId, countryIso3)}
                                  >
                                    {title} 분석 화면 열기
                                  </button>
                                </dd>
                              </div>
                            </dl>
                          )}
                          {layerErrors[elementId] && (
                            <span className="cdp-layer-error">
                              {layerErrors[elementId]}
                              {" · "}
                              <button type="button" onClick={() => retryLayer(elementId)}>
                                다시 시도
                              </button>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            <button
              type="button"
              className="cdp-button cdp-button--secondary cdp-map-all-data-v135__compare"
              data-testid="map-compare-open-v135"
              onClick={() =>
                openComparisonV135(
                  comparisonLayerIdsV135[0],
                  comparisonLayerIdsV135[1]
                )
              }
            >
              비교해서 보기
            </button>
          </section>

          {selectedPresetV133 && primaryLayerId && (
            <section
              className="cdp-map-focus-summary-v133"
              data-testid="map-focus-summary-v133"
              data-primary-layer-count="1"
              data-default-context-count={
                selectedPresetContextCandidatesV133.every(
                  (candidate) =>
                    !contextLayerIds.includes(candidate.elementId)
                )
                  ? "0"
                  : contextLayerIds.length
              }
            >
              <h2>{selectedPresetV133.labelKo}</h2>
              <div className="cdp-map-focus-summary-v133__primary">
                <span>선택 데이터</span>
                <strong>
                  {publicMapLayerTitleV126(
                    primaryLayerId,
                    layers.find((layer) => layer.elementId === primaryLayerId)
                      ?.publicShortTitle
                  )}
                </strong>
                <small>표시 중</small>
              </div>
              {selectedPresetContextCandidatesV133.length > 0 && (
                <div className="cdp-map-focus-summary-v133__contexts">
                  <span>함께 보기</span>
                  {selectedPresetContextCandidatesV133.map((candidate) => {
                    const enabled = contextLayerIds.includes(
                      candidate.elementId
                    );
                    return (
                      <button
                        key={candidate.elementId}
                        type="button"
                        data-testid="map-context-toggle-v133"
                        data-map-element={candidate.elementId}
                        data-layer-role="context"
                        aria-pressed={enabled}
                        onClick={() =>
                          toggleContextLayerV126(candidate.elementId)
                        }
                      >
                        <span>
                          {publicMapLayerTitleV126(
                            candidate.elementId,
                            candidate.layer?.publicShortTitle
                          )}
                        </span>
                        <small>{enabled ? "표시 중" : "꺼짐"}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {selectedPresetId === "CLIMATE_FINANCE_PROJECTS" && (
            <section
              className="cdp-map-finance-v133"
              data-testid="map-finance-type-selector-v133"
              data-finance-primary={financeTypeV133}
            >
              <h2>기후재원 사업</h2>
              <span className="cdp-map-finance-v133__label">사업 유형</span>
              <div className="cdp-map-finance-v133__types" role="group" aria-label="기후재원 사업 유형">
                <button
                  type="button"
                  data-finance-type="adaptation"
                  aria-pressed={financeTypeV133 === "adaptation"}
                  onClick={() => applyFinanceTypeV133("adaptation")}
                >
                  적응기금
                </button>
                <button
                  type="button"
                  data-finance-type="carbon"
                  aria-pressed={financeTypeV133 === "carbon"}
                  onClick={() => applyFinanceTypeV133("carbon")}
                >
                  탄소크레딧
                </button>
              </div>
              <button
                type="button"
                className="cdp-map-finance-v133__compare"
                data-testid="map-compare-open-v135"
                onClick={openFinanceComparisonV135}
              >
                비교해서 보기
              </button>
              <dl className="cdp-map-finance-v133__summary">
                <div>
                  <dt>사업 수</dt>
                  <dd>{financeSummaryV133.count.toLocaleString()}건</dd>
                </div>
                <div>
                  <dt>승인·발행 관련 핵심금액</dt>
                  <dd>{financeSummaryV133.amount}</dd>
                </div>
                <div>
                  <dt>위치 또는 참여범위 확인</dt>
                  <dd>{financeSummaryV133.verifiedSpatialCount.toLocaleString()}건</dd>
                </div>
              </dl>
              <p>
                {financeTypeV133 === "adaptation"
                  ? "◇ 적응기금 사업·지역 협력범위"
                  : "■ 검증된 탄소크레딧 사업 위치"}
              </p>
            </section>
          )}

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
              {focusedSemantic && !focusedLayer.analysisItemLabel && (
                <p className="cdp-map-selector-notice" role="note">
                  <strong>
                    <PublicTermTextV134
                      text={
                        focusedVariablePresentationV129?.label ||
                        (focusedLayer.layerId.startsWith("vnm-v138-")
                          ? focusedVariable?.label
                          : null) ||
                        focusedSemantic.measureLabel
                      }
                    />
                  </strong>
                  {" · "}
                  <PublicTermTextV134
                    text={
                      focusedVariablePresentationV129?.directionLabel ||
                      (focusedLayer.layerId.startsWith("vnm-v138-")
                        ? `${focusedLayer.mapTargetV138?.displaySpatialUnit || ""} · ${focusedVariable?.unit || ""}`
                        : focusedSemantic.indicatorLabel)
                    }
                  />
                </p>
              )}
              {focusedLayer.selectors.variableGroups ? (
                <>
                  <label className="cdp-field" style={{ marginBottom: 9 }}>
                    <span className="cdp-field__label">
                      {focusedLayer.selectors.variableGroups.measureLabel}
                    </span>
                    <select
                      className="cdp-select"
                      data-testid="map-layer-variable-select"
                      value={focusedVariable?.measureKey || ""}
                      onChange={(event) =>
                        changeLayerVariable(
                          focusedLayer,
                          variableKeyForGroupV138(
                            focusedLayer,
                            event.target.value,
                            focusedVariable?.scenario || null
                          )
                        )
                      }
                    >
                      {focusedLayer.selectors.variableGroups.measures.map((measure) => (
                        <option key={measure.key} value={measure.key}>
                          {measure.label} ({measure.unit})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="cdp-field" style={{ marginBottom: 9 }}>
                    <span className="cdp-field__label">
                      {focusedLayer.selectors.variableGroups.scenarioLabel}
                    </span>
                    <select
                      className="cdp-select"
                      data-testid="map-layer-scenario-select"
                      value={focusedVariable?.scenario || ""}
                      onChange={(event) =>
                        changeLayerVariable(
                          focusedLayer,
                          variableKeyForGroupV138(
                            focusedLayer,
                            focusedVariable?.measureKey || "",
                            event.target.value
                          )
                        )
                      }
                    >
                      {focusedLayer.selectors.variableGroups.scenarios.map((scenario) => (
                        <option key={scenario.key} value={scenario.key}>
                          {scenario.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="cdp-map-selector-notice" role="note">
                    과거 모형(historical)은 관측이 아니라 모형이 재현한 값이며, SSP 계열은 시나리오별 전망입니다. 같은 지도에서 성·시 간 차이를 비교하고, 연도별 변화는 상세 화면 추이에서 확인하세요.
                  </p>
                </>
              ) : (
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
              )}
              {focusedLayer.elementId === "A-023" ? (
                // The year is the chosen registry's, not a selectable period:
                // WRI GPPD 2021, OSM 2026, or both. One fixed "2026" dated
                // the 2021 rows wrongly (V142).
                <div className="cdp-field" style={{ marginBottom: 9 }}>
                  <span className="cdp-field__label">자료연도</span>
                  <strong data-testid="map-layer-period-derived" data-period={layerDisplayedPeriodV142(focusedLayer, filters, focusedSelector.period)}>
                    {layerDisplayedPeriodV142(focusedLayer, filters, focusedSelector.period)} · {layerPeriodLabelV141(focusedLayer, filters, "")}
                  </strong>
                  <small className="cdp-field__hint">출처 필터에 따라 정해집니다. 두 출처를 함께 보면 시설마다 자료연도가 다릅니다.</small>
                </div>
              ) : (
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
              )}
              <PublicTermHelpV134
                text={[
                  focusedVariablePresentationV129?.label ||
                    focusedSemantic?.measureLabel ||
                    focusedVariable?.label ||
                    focusedLayer.legend.title,
                  focusedVariablePresentationV129?.unit ||
                    focusedSemantic?.unit ||
                    focusedVariable?.unit ||
                    focusedLayer.unit,
                  layerDisplayedPeriodV142(focusedLayer, filters, focusedSelector.period),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <dl className="cdp-map-layer-meta">
                <div>
                  <dt>항목</dt>
                  <dd>
                    <PublicTermTextV134
                      text={
                        focusedLayer.analysisItemLabel ||
                        focusedVariablePresentationV129?.label ||
                        (focusedLayer.layerId.startsWith("vnm-v138-")
                          ? focusedVariable?.label
                          : null) ||
                        focusedSemantic?.measureLabel ||
                        focusedLayer.legend.title
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt>단위</dt>
                  <dd>
                    <PublicTermTextV134
                      text={
                        focusedLayer.countNoun
                          ? `${focusedLayer.countNoun}(개수) · 값 단위는 항목별`
                          : focusedVariablePresentationV129?.unit ||
                            focusedSemantic?.unit ||
                            focusedVariable?.unit ||
                            focusedLayer.unit
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt>출처</dt>
                  <dd><PublicTermTextV134 text={focusedLayer.source} /></dd>
                </div>
              </dl>
              {focusedLayer.elementId === "D-008" && (
                <p data-testid="d008-coverage-warning" role="note">
                  원자료의 개편 전 63개 성·시 중 3개에 값이 있으며, 값이 없는
                  성·시는 투명하게 표시하고 0으로 대체하지 않습니다. 34개
                  경계에서는 구성 성·시 값의 합계를 표시합니다.
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
                    value={selectedFilterValueV141(focusedLayer, filter, filters)}
                    onChange={(event) =>
                      changeLayerFilterV125(
                        focusedLayer,
                        filter.field,
                        event.target.value
                      )
                    }
                  >
                    <option value="all">{filter.allLabel || "전체"}</option>
                    {filter.values.map((value) => (
                      <option key={value} value={value}>
                        {filter.valueLabels?.[value] ||
                          semanticDimensionValueLabelV125(filter.field, value)}
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

        <main
          className="cdp-map-canvas-wrap"
          aria-label="데이터 지도"
          data-backdrop-kind={backdropKindV151}
          data-backdrop-status={backdropStatusV151}
          data-backdrop-first-tile-ms={backdropFirstTileMsV151 === null ? undefined : backdropFirstTileMsV151}
        >
          <div
            className="cdp-map-fallback"
            data-status={fallbackBoundaryStatus}
          >
            <svg
              className="cdp-map-fallback__svg"
              viewBox={`0 0 ${FALLBACK_VIEWBOX_WIDTH} ${FALLBACK_VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-hidden={baseMapStatus === "ready" ? true : undefined}
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
                aria-label={`베트남 ${boundarySystemLabelV151(
                  boundarySystemV151State
                )} 기준 경계`}
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
                const isGvi =
                  feature.elementId === "B-021" &&
                  feature.variable === "gvi-6";
                const gviRank =
                  isGvi && layer && selector
                    ? uniqueB021RegionRankV133(
                        spatialByElement[feature.elementId]?.data,
                        selector,
                        feature.sourceRegion
                      )
                    : "";
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
                  const memberSummary = parseMemberSummaryV151(feature.properties.memberSummary);
                  setSelectedSpatial({
                    elementId: feature.elementId,
                    adm1Code: feature.adm1Code,
                    unitCode: String(feature.properties.unitCode || "") || undefined,
                    memberAdm1Codes: memberSummary?.members.map((member) => member.adm1Code),
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
                    detail: isGvi
                      ? `지역 취약성(GVI) · ${
                          selector?.period || feature.period
                        } · ${publicValue} · 높을수록 취약 · [권역값] ${publicVietnamSourceRegionV126(
                          feature.sourceRegion
                        )}${gviRank ? ` · ${gviRank}` : ""}`
                      : isRegionalScope
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
                    title: isGvi ? feature.name : publicTitle,
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
                    tabIndex={baseMapStatus === "ready" ? -1 : 0}
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
                    data-element-id={point.elementId}
                    data-layer-role={isPrimary ? "primary" : "context"}
                    data-symbol-shape="diamond"
                    role="button"
                    tabIndex={baseMapStatus === "ready" ? -1 : 0}
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
              {fallbackSpatial.statisticalPoints.map((point) => {
                const layer = layers.find(
                  (item) => item.elementId === point.elementId
                );
                const publicTitle = publicMapLayerTitleV126(
                  point.elementId,
                  layer?.publicShortTitle || "지도 데이터"
                );
                const values = fallbackSpatial.statisticalPoints.map(
                  (item) => item.value
                );
                const minimum = Math.min(...values);
                const maximum = Math.max(...values);
                const radius =
                  minimum === maximum
                    ? 12
                    : 7 + ((point.value - minimum) / (maximum - minimum)) * 13;
                const isSelected =
                  selectedSpatial?.elementId === point.elementId &&
                  selectedSpatial.selectionKey === point.selectionKey;
                const formattedValue = `${formatPublicNumberV126(
                  point.value,
                  point.unit
                )} ${point.unit}`;
                const selectPoint = () => {
                  // V151-2: the coloured area may be a 34-unit or a six-region
                  // aggregate; the point's province is then one of its members.
                  const pointCode = publicTextV126(point.properties.adm1Code) || "";
                  const overlappingPrimary = fallbackSpatial.fills.find(
                    (feature) =>
                      feature.elementId === primaryLayerId &&
                      (feature.adm1Code === pointCode || fillHasMemberV151(feature.properties, pointCode))
                  );
                  if (overlappingPrimary) {
                    setOverlapChoicesV133([
                      {
                        elementId: overlappingPrimary.elementId,
                        label: overlappingPrimary.name,
                        layerId: "fallback-primary-area",
                        priority: 100,
                        properties: {
                          ...overlappingPrimary.properties,
                          value: overlappingPrimary.value,
                          unit: overlappingPrimary.unit,
                          period: overlappingPrimary.period,
                          selectionKey: overlappingPrimary.adm1Code,
                        },
                        role: "primary",
                        selectionKey: overlappingPrimary.adm1Code,
                      },
                      {
                        elementId: point.elementId,
                        label: point.name,
                        layerId: "fallback-statistical-point",
                        priority: 200,
                        properties: point.properties,
                        role: "context",
                        selectionKey: point.selectionKey,
                      },
                    ]);
                    return;
                  }
                  setSelected(null);
                  setSelectedSpatial({
                    elementId: point.elementId,
                    adm1Code:
                      publicTextV126(point.properties.adm1Code) || undefined,
                    adm1Name: point.name,
                    value: point.value,
                    unit: point.unit,
                    period: point.period,
                    variableLabel: publicMapFeatureNameV126(
                      point.properties.variableLabel,
                      "성·시 기후예산"
                    ),
                    selectionKey: point.selectionKey,
                    properties: point.properties,
                  });
                  setRoleNotice(`선택한 함께 보기 · ${publicTitle}`);
                  setAnalysisPanelOpen(true);
                };
                const showTooltip = () =>
                  setFallbackTooltipV129({
                    detail: `${point.name} · ${formattedValue} · 성·시 단위 통계`,
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
                    key={`${point.elementId}:${point.selectionKey}`}
                    className={`cdp-map-fallback__feature-control cdp-map-fallback__point-control is-context ${
                      isSelected ? "is-selected" : ""
                    }`}
                    data-testid="map-budget-statistical-point-v133"
                    data-element-id={point.elementId}
                    data-layer-role="context"
                    data-map-element={point.elementId}
                    data-symbol-shape="circle"
                    role="button"
                    tabIndex={baseMapStatus === "ready" ? -1 : 0}
                    aria-label={`${publicTitle} · ${point.name} · ${formattedValue} · 성·시 단위 통계`}
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
                      r={Math.max(14, radius)}
                      fill="transparent"
                    />
                    <circle
                      className="cdp-map-fallback__point"
                      cx={point.x}
                      cy={point.y}
                      r={radius}
                      fill={point.color}
                      fillOpacity={0.58}
                      stroke={isSelected ? "#f0a51a" : "#ffffff"}
                      strokeWidth={isSelected ? 3 : 2}
                      pointerEvents="none"
                    />
                    <title>{`${publicTitle} · ${point.name} · ${formattedValue}`}</title>
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
                    tabIndex={baseMapStatus === "ready" ? -1 : 0}
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
                const powerPlantFacts =
                  point.elementId === "A-023"
                    ? publicPowerPlantFactsV132({
                        ...(point.record.normalizedAttributes || {}),
                        referenceYear: point.record.provenance.referenceYear,
                      })
                    : null;
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
                    detail:
                      point.elementId === "A-023" && powerPlantFacts
                        ? [
                            powerPlantFacts.fuel
                              ? `발전원 ${powerPlantFacts.fuel}`
                              : "",
                            powerPlantFacts.capacity
                              ? `용량 ${powerPlantFacts.capacity}`
                              : "",
                            powerPlantFacts.status
                              ? `상태 ${powerPlantFacts.status}`
                              : "",
                            powerPlantFacts.year
                              ? `자료연도 ${powerPlantFacts.year}`
                              : "",
                            isPrimary ? "" : "보조 데이터",
                          ]
                            .filter(Boolean)
                            .join(" · ") || publicTitle
                        : titleResolution?.secondaryNote
                        ? `${publicName} · ${titleResolution.secondaryNote}`
                        : publicName,
                    leftPercent: Math.max(
                      8,
                      Math.min(
                        72,
                        (point.x / FALLBACK_VIEWBOX_WIDTH) * 100
                      )
                    ),
                    title:
                      point.elementId === "A-023" ? publicName : publicTitle,
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
                    tabIndex={baseMapStatus === "ready" ? -1 : 0}
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
          <span className="cdp-map-fallback__attribution">
              Natural Earth · 국가 외곽선 | geoBoundaries · 베트남{" "}
              {boundarySystemLabelV151(boundarySystemV151State)} (CC BY 4.0)
          </span>
          </div>
          <div
            ref={containerRef}
            className={`cdp-map-canvas ${
              baseMapStatus === "ready" ? "is-visible" : "is-suspended"
            }`}
          />
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
              <strong>
                <PublicTermExpandedTextV134 text={fallbackTooltipV129.title} />
              </strong>
              <span>
                <PublicTermExpandedTextV134 text={fallbackTooltipV129.detail} />
              </span>
            </div>
          )}
          <span className="cdp-map-public-attribution">
            {backdropAttributionV151(backdropKindV151).lines.map((line) => (
              <span key={line} data-testid="map-backdrop-attribution-v151">{line} | </span>
            ))}
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
            · 베트남 {boundarySystemLabelV151(boundarySystemV151State)} (CC BY
            4.0)
          </span>
          {/* V151: one stack, so the boundary picker keeps its place when the
              backdrop card grows to show its error message. */}
          <div className="cdp-map-control-stack-v151">
          <div className="cdp-map-backdrop-v150 cdp-map-backdrop-v151" data-backdrop-kind={backdropKindV151}>
            <fieldset>
              <legend>배경지도</legend>
              {MAP_BACKDROP_KINDS_V151.map((kind) => (
                <label key={kind}>
                  <input
                    type="radio"
                    name="cdp-map-backdrop-v151"
                    value={kind}
                    checked={backdropKindV151 === kind}
                    onChange={() => {
                      backdropFellBackRef.current = false;
                      setBackdropKindV151(kind);
                    }}
                  />
                  {backdropKindLabelV151(kind)}
                </label>
              ))}
            </fieldset>
            {backdropStatusV151 === "fallback" && (
              <span role="status">배경지도 타일을 불러오지 못해 &lsquo;없음&rsquo;으로 전환했습니다. 데이터와 경계는 계속 볼 수 있습니다.</span>
            )}
          </div>
          <div
            className="cdp-map-boundary-system-v151"
            data-boundary-system={boundarySystemV151State}
          >
            <fieldset>
              <legend>행정경계 기준</legend>
              {(["post-2025-34", "pre-2025-63"] as const).map((system) => (
                <label key={system}>
                  <input
                    checked={boundarySystemV151State === system}
                    name="cdp-map-boundary-system-v151"
                    onChange={() => setBoundarySystemV151State(system)}
                    type="radio"
                    value={system}
                  />
                  {boundarySystemLabelV151(system)}
                </label>
              ))}
            </fieldset>
            <p
              data-testid="map-boundary-value-notice-v151"
              data-boundary-policy={focusedBoundaryPolicyKindV151 || "none"}
            >
              {focusedLayer?.boundaryPolicy
                ? boundaryPolicyNoticeV151(
                    boundarySystemV151State,
                    focusedLayer.boundaryPolicy,
                    focusedBoundaryPolicyKindV151 || undefined
                  )
                : boundaryValueNoticeV151(boundarySystemV151State)}
            </p>
          </div>
          </div>
          <div className="cdp-map-status-badge">
            {baseMapStatus === "ready"
              ? "지도 사용 가능"
              : fallbackBoundaryStatus === "ready"
              ? "대체 경계지도 표시 중"
              : "지도 준비 중"}
          </div>
          <div className="cdp-map-overlay-card">
            <strong>
              <PublicTermTextV134
                text={
                  focusedLayer
                    ? focusedPublicCopy?.titleKo || ""
                    : "지도 데이터를 선택하세요"
                }
              />
            </strong>
            <div>
              {focusedLayer
                ? loadingIds.includes(focusedLayer.elementId)
                  ? "불러오는 중입니다"
                  : "선로·시설·지역을 선택하면 세부정보를 볼 수 있습니다"
                : `배경지도와 베트남 ${boundarySystemLabelV151(
                    boundarySystemV151State
                  )} 경계가 준비되어 있습니다`}
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
          {overlapChoicesV133.length > 1 && (
            <section
              className="cdp-map-overlap-picker-v133"
              data-testid="map-overlap-picker-v133"
              data-overlap-count={overlapChoicesV133.length}
              aria-label="겹친 지도 데이터 선택"
            >
              <div>
                <strong>이 위치의 데이터</strong>
                <button
                  type="button"
                  aria-label="선택 목록 닫기"
                  onClick={() => setOverlapChoicesV133([])}
                >
                  닫기
                </button>
              </div>
              <p>확인할 데이터를 선택하세요.</p>
              <ul>
                {overlapSummariesV145.map((summary) => {
                  const choice = overlapChoicesV133.find((hit) => hit.elementId === summary.elementId && hit.selectionKey === summary.selectionKey)!;
                  return (
                  <li key={`${choice.elementId}:${choice.selectionKey}`}>
                    <button
                      type="button"
                      data-map-element={choice.elementId}
                      // Which feature this choice stands for. The panel already
                      // publishes the selected key; the picker did not, so the
                      // only way to choose a known feature was to count list
                      // positions.
                      data-selection-key={choice.selectionKey}
                      data-layer-role={choice.role}
                      data-hit-priority={choice.priority}
                      onClick={() => selectOverlapChoiceV133(choice)}
                    >
                      <span>
                        {choice.role === "primary"
                          ? "주 분석"
                          : "함께 보기"}
                      </span>
                      <strong>
                        <PublicTermExpandedTextV134 text={summary.title} />
                      </strong>
                      {summary.value && <b className="cdp-map-overlap-value-v145"><PublicTermExpandedTextV134 text={summary.value} /></b>}
                      <small><PublicTermExpandedTextV134 text={summary.place} /></small>
                      {summary.context && <small><PublicTermExpandedTextV134 text={summary.context} /></small>}
                      {summary.facts.slice(0, 2).map((fact) => <small key={fact}><PublicTermExpandedTextV134 text={fact} /></small>)}
                    </button>
                  </li>
                  );
                })}
              </ul>
            </section>
          )}
          {focusedLayer && (
            <div
              className={`cdp-map-legend ${legendOpen ? "is-open" : "is-collapsed"}`}
              data-testid="map-dynamic-legend"
            >
              <div className="cdp-map-legend__header">
                <strong>
                  <PublicTermTextV134 text={focusedPublicCopy?.titleKo || ""} />
                </strong>
                <span>주 분석</span>
                <button
                  type="button"
                  className="cdp-map-panel-toggle cdp-map-legend__toggle"
                  data-testid="map-legend-toggle-v137"
                  aria-expanded={legendOpen}
                  aria-label={legendOpen ? "범례 접기" : "범례 펼치기"}
                  onClick={() => setLegendOpen((current) => !current)}
                >
                  {legendOpen ? "범례 접기" : "범례"}
                </button>
              </div>
              <dl className="cdp-map-legend__facts">
                <div>
                  <dt>항목</dt>
                  <dd>
                    <PublicTermTextV134
                      text={
                        focusedVariablePresentationV129?.label ||
                        focusedSemantic?.measureLabel ||
                        focusedLayer.legend.title
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt>단위</dt>
                  <dd data-testid="map-legend-unit">
                    <PublicTermTextV134
                      text={
                        focusedVariablePresentationV129?.unit ||
                        focusedSemantic?.unit ||
                        focusedVariable?.unit ||
                        focusedLayer.unit
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt>자료연도</dt>
                  <dd>{focusedLayer.elementId === "A-023" ? `${layerDisplayedPeriodV142(focusedLayer, filters, "")} · ${layerPeriodLabelV141(focusedLayer, filters, "")}` : layerPeriodLabelV141(focusedLayer, filters, String(focusedSelector?.period || focusedLayer.sourceYear || "미기재"))}</dd>
                </div>
              </dl>
              <div
                className="cdp-map-active-legend"
                data-testid="map-compact-legend-v133"
                data-active-layer-count={activeLegendIdentitiesV129.length}
              >
                <strong>현재 표시 중</strong>
                <ul>
                  {activeLegendIdentitiesV129.map((item) => (
                    <li
                      key={item.elementId}
                      data-element-id={item.elementId}
                      data-layer-role={item.role}
                      data-symbol-shape={item.shape}
                      data-unit={item.unit}
                      data-variable={item.variable}
                      data-drawn={item.hidden ? "false" : "true"}
                      data-testid="map-active-layer-legend-item"
                      className={item.hidden ? "is-hidden" : undefined}
                    >
                      <i
                        className={`cdp-map-symbol cdp-map-symbol--${item.shape}`}
                        style={{ "--cdp-map-symbol-color": item.color } as any}
                        aria-hidden="true"
                        data-testid="map-layer-legend-item"
                      />
                      <span>
                        <strong>
                          <PublicTermTextV134 text={item.title} />
                        </strong>
                        <small>
                          {item.hidden
                            ? "선택됨 · 지도 표시 꺼짐"
                            : item.role === "primary"
                              ? item.shape === "area"
                                ? "색상 지도 · 분석 기준"
                                : "분석 기준"
                              : item.shape === "area"
                                ? "함께 보기 · 외곽선·클릭값"
                                : "함께 보기"} ·{" "}
                          <PublicTermTextV134
                            text={`${item.variable} · ${item.unit}`}
                          />
                          {item.elementId === "D-008" &&
                          item.role === "context"
                            ? " · 원 크기 = 예산"
                            : ""}
                          {item.hasApproximate ? " · 속 빈 기호 = 근사 위치" : ""}
                        </small>
                      </span>
                      <button
                        type="button"
                        className="cdp-map-active-legend__toggle"
                        data-testid={
                          item.role === "context"
                            ? "map-context-toggle-v133"
                            : "map-primary-toggle-v133"
                        }
                        data-map-element={item.elementId}
                        data-layer-role={item.role}
                        aria-label={`${item.title} ${item.hidden ? "표시 켜기" : "표시 끄기"}`}
                        aria-pressed={!item.hidden}
                        onClick={() => toggleLayerVisibilityV138(item.elementId)}
                      >
                        {item.hidden ? "표시 켜기" : "표시 끄기"}
                      </button>
                    </li>
                  ))}
                </ul>
                {activeLegendIdentitiesV129.some(
                  (item) => item.elementId === "D-008" && item.role === "context"
                ) && (
                  <p data-testid="map-budget-context-disclosure-v133">
                    ○ 지역 기후예산 · 성·시 단위 통계 대표점이며
                    실제 사업 위치가 아닙니다.
                  </p>
                )}
              </div>
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
                    값 있음 {focusedAnalysisV126.dataRegionCount}개 · 결측 {focusedAnalysisV126.missingRegionCount}개
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
              <p>선택한 대상의 정보와 자료 내 분포를 확인하세요.</p>
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
              {/* V140: what the reader selected comes first (CSS order on
                  the grid); this metadata block is the 자료정보 of the
                  analysis and sits last, folded once a feature is selected. */}
              <section data-testid="map-current-analysis" className="cdp-map-current-analysis-v140">
                <details>
                  <summary><h3>자료정보 · 현재 분석</h3></summary>
                <div className="cdp-evidence-grid">
                  <Evidence label="데이터명" value={focusedPublicCopy?.titleKo || ""} />
                  <Evidence
                    label="항목"
                    value={
                      focusedLayer.analysisItemLabel ||
                      focusedVariablePresentationV129?.label ||
                      (focusedLayer.layerId.startsWith("vnm-v138-")
                        ? focusedVariable?.label
                        : null) ||
                      focusedSemantic?.measureLabel ||
                      focusedLayer.legend.title
                    }
                  />
                  {/* Both rows fall back to the same presentation label, so
                      whenever one is set they printed the same string twice
                      under two headings. The selected variable is only worth a
                      row of its own when it says something the item did not. */}
                  {(() => {
                    const item =
                      focusedLayer.analysisItemLabel ||
                      focusedVariablePresentationV129?.label ||
                      focusedSemantic?.measureLabel ||
                      focusedLayer.legend.title;
                    const variable =
                      focusedVariablePresentationV129?.label ||
                      focusedSemantic?.indicatorLabel ||
                      focusedVariable?.label ||
                      "";
                    if (!variable || variable === item) return null;
                    return <Evidence label="선택 변수" value={variable} />;
                  })()}
                  <Evidence label="자료연도" value={layerDisplayedPeriodV142(focusedLayer, filters, focusedSelector.period)} />
                  <Evidence
                    label="단위"
                    value={
                      focusedLayer.countNoun
                        ? `${focusedLayer.countNoun}(개수) · 값 단위는 항목별`
                        : focusedVariablePresentationV129?.unit ||
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
                </div>
                </details>
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
                          <li key={bullet}><PublicTermTextV134 text={bullet} /></li>
                        ))}
                    </ul>
                  </section>
                )}

              <section data-testid="map-national-summary">
                <h3>{["admin1-choropleth", "partial-choropleth"].includes(rendererOf(focusedLayer)) ? "지역별 비교" : "현재 표시 자료 요약"}</h3>
                <p className="map148-summary-context">{focusedPublicCopy?.titleKo} · {layerDisplayedPeriodV142(focusedLayer, filters, focusedSelector.period)}{focusedVariable && focusedVariable.key !== "locations" ? ` · ${focusedVariablePresentationV129?.label || focusedVariable.label}` : ""}</p>
                <div className="cdp-map-summary-list">
                  {focusedAnalysisV126.summaryRows.filter((row) => !/행$|지도 미표시|위치자료 미확보|필터로 가려진|근사 위치/u.test(row.label)).map((row, index) => (
                    <div key={`${row.label}:${index}`}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
                {focusedAnalysisV126.summaryRows.some((row) => /행$|지도 미표시|위치자료 미확보|필터로 가려진|근사 위치/u.test(row.label)) && <details className="map148-secondary">
                  <summary>자료 범위 확인</summary>
                  <dl>{focusedAnalysisV126.summaryRows.filter((row) => /행$|지도 미표시|위치자료 미확보|필터로 가려진|근사 위치/u.test(row.label)).map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
                </details>}
                {focusedAnalysisV126.capacityRows.length > 0 && <figure className="map148-capacity">
                  <table data-testid="map-fuel-capacity-v148">
                    <caption>발전원별 시설 수·설비용량</caption>
                    <thead><tr><th scope="col">발전원</th><th scope="col">시설</th><th scope="col">설비용량(MW)</th></tr></thead>
                    <tbody>{focusedAnalysisV126.capacityRows.map((row) => <tr key={row.label}>
                      <th scope="row">{row.label}</th><td>{row.count}</td><td>{row.knownCapacity ? formatPublicNumberV126(row.capacity, "MW") : "미기재"}
                        <span className="map148-capacity-bar" aria-hidden="true"><b style={{ width: `${row.capacity / Math.max(1, ...focusedAnalysisV126.capacityRows.map((r) => r.capacity)) * 100}%` }} /></span>
                      </td>
                    </tr>)}</tbody>
                  </table>
                  <p className="map148-summary-context">선택한 출처에 수록된 시설 기준입니다. 국가 전체의 설비용량을 뜻하지는 않습니다.</p>
                </figure>}
                {focusedAnalysisV126.summaryRows.some((row) => row.derived) && (
                  <p className="cdp-map-derived-note">
                    중앙값은 값이 있는
                    {focusedLayer.spatialScopeType === "region"
                      ? ` ${regionUnitLabelV138(focusedLayer)}`
                      : " 지역"}
                    의 값을 오름차순으로 정렬해 가운데 값을 계산한 파생
                    통계입니다.
                  </p>
                )}
              </section>

              {/* The panel names which record it is describing, so a second
                  facility sharing a name is never read as the one that was
                  clicked. Identity only - nothing writes these back. */}
              <section
                data-testid="map-selected-feature-panel"
                className="cdp-map-selected-panel"
                data-selected-layer-role={selectedFeatureRoleV129 || "none"}
                data-selected-detail-contract="map-selected-detail-v133"
                data-selected-element-id={
                  selectedOwningLayer?.elementId || ""
                }
                data-selected-key={
                  selectedSpatial?.selectionKey || selected?.recordId || ""
                }
              >
                <h3>
                  {selectedOwningLayer
                    ? rendererOf(selectedOwningLayer) === "regional-scope" ||
                      ["C-025", "D-018"].includes(
                        selectedOwningLayer.elementId
                      )
                      ? "선택 사업"
                      : selectedSpatial?.adm1Code
                      ? "선택 지역"
                      : selectedOwningLayer.elementId === "A-024"
                      ? "선택 선로"
                      : `선택 ${selectedFeatureNounV139(selectedOwningLayer)}`
                    : "지도에서 자료를 선택하세요"}
                </h3>
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
                          selectedSpatial.properties.status === "Project Under Implementation" ? "사업 이행 중" : selectedSpatial.properties.status,
                          "미표기"
                        )}
                      />
                      {/* When the project was approved and how long it runs:
                          the scope polygon carried no time at all (V141). */}
                      <Evidence
                        label="승인일·사업기간"
                        value={[
                          publicMapFactV132(
                            (recordsByElement["D-018"] || []).find(
                              (row) => row.recordId === selectedSpatial.properties.recordId
                            )?.normalizedAttributes?.["승인일"]
                          )
                            ? `승인 ${publicMapFactV132(
                                (recordsByElement["D-018"] || []).find(
                                  (row) => row.recordId === selectedSpatial.properties.recordId
                                )?.normalizedAttributes?.["승인일"]
                              )}`
                            : "",
                          publicMapFactV132(selectedSpatial.properties.projectPeriod)
                            ? `기간 ${publicMapFactV132(selectedSpatial.properties.projectPeriod)}`
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      />
                      {/* The fund states the amount with its currency
                          ("7,000,000 USD"); a text amount is shown as stated,
                          a bare number as USD. */}
                      <Evidence
                        label="사업 전체 승인액"
                        value={
                          optionalFiniteNumberV130(
                            selectedSpatial.properties.approvedAmount
                          ) !== null
                            ? `USD ${formatPublicNumberV126(
                                optionalFiniteNumberV130(
                                  selectedSpatial.properties.approvedAmount
                                ) as number,
                                "USD"
                              )}`
                            : publicMapFactV132(selectedSpatial.properties.approvedAmount) || "미표기"
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
                      {/* The scope polygon carries no point of its own; the
                          project's verified activity sites are the points
                          drawn beside it, and that is what is counted. */}
                      <Evidence label="확인된 활동지역" value={`${selectedProjectSitePointsV139}곳`} />
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
                        label="항목"
                        value={
                          publicTextV126(selectedSpatial.properties.variableLabel) ||
                          selectedSpatial.variableLabel ||
                          selectedOwningVariablePresentationV129?.label ||
                          selectedOwningSemantic?.measureLabel ||
                          selectedOwningLayer.legend.title
                        }
                      />
                      {selectedOwningLayer.elementId !== "A-024" && <Evidence
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
                      />}
                      {selectedOwningLayer.elementId !== "A-024" && <Evidence
                        label="단위"
                        value={
                          selectedOwningVariablePresentationV129?.unit ||
                          selectedSpatial.unit ||
                          selectedOwningSemantic?.unit ||
                          selectedOwningVariable?.unit ||
                          selectedOwningLayer.unit
                        }
                      />}
                      <Evidence
                        label="자료연도"
                        value={
                          selectedOwningLayer.elementId === "A-023"
                            ? layerDisplayedPeriodV142(selectedOwningLayer, filters, selectedOwningSelector?.period || "")
                            : selectedSpatial.period ||
                              selectedOwningSelector?.period ||
                              selectedOwningLayer.selectors?.defaultPeriod ||
                              String(selectedOwningLayer.latestYear || "")
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
                        <Evidence
                          label="지역"
                          value={
                            selectedSpatial.unitCode
                              ? `${selectedSpatial.adm1Name} · 2025-07-01 시행 34개 성·시 기준`
                              : selectedSpatial.adm1Name
                          }
                        />
                      )}
                      {selectedMemberSummaryV151 && selectedOwningLayer && (
                        <>
                          <Evidence
                            label="집계 방식"
                            value={boundaryPolicyNoticeV151(
                              boundarySystemV151State,
                              selectedOwningLayer.boundaryPolicy,
                              selectedMemberSummaryV151.kind
                            )}
                          />
                          <Evidence
                            label="구성 성·시"
                            value={`${selectedMemberSummaryV151.memberCount}개 중 ${selectedMemberSummaryV151.valueCount}개 값 있음${
                              selectedMemberSummaryV151.partial ? " · 부분 결측" : ""
                            }${selectedMemberSummaryV151.conflict ? " · 구성 값 불일치" : ""} — ${selectedMemberSummaryV151.members
                              .map(
                                (member) =>
                                  `${publicMapFeatureNameV126(member.adm1Name, member.adm1Code)} ${
                                    member.value === null
                                      ? "결측"
                                      : formatPublicNumberV126(member.value, selectedSpatial.unit || "")
                                  }`
                              )
                              .join(" · ")}`}
                          />
                        </>
                      )}
                      {publicTextV126(selectedSpatial.properties.sourceRegion) && (
                        <>
                          <Evidence
                            label="비교·공간단위"
                            value={`${publicVietnamSourceRegionV126(
                              publicTextV126(
                                selectedSpatial.properties.sourceRegion
                              ) || undefined
                            )} ${selectedOwningLayer ? regionUnitLabelV138(selectedOwningLayer) : "권역"}의 값 · 개편 전 성·시 단위 독립값이 아님`}
                          />
                          <Evidence
                            label="자료 설명"
                            value={
                              selectedOwningLayer?.aggregationLevel === "post-2025-34-unit"
                                ? (() => {
                                    const unit = publicVietnamSourceRegionV126(
                                      publicTextV126(selectedSpatial.properties.sourceRegion) || undefined
                                    );
                                    // "Lai Châu은(는) 2025년 개편으로 Lai Châu에 속합니다" said
                                    // nothing: a province the reorganisation left alone is its
                                    // own unit.
                                    return unit === selectedSpatial.adm1Name
                                      ? `${selectedSpatial.adm1Name}은(는) 2025년 개편 후에도 같은 이름의 성·시로 유지됩니다. 값은 개편 후 단위 기준입니다.`
                                      : `${selectedSpatial.adm1Name}은(는) 2025년 개편으로 ${unit}에 속합니다. 값은 개편 후 ${unit} 전체의 값이며 소속 성·시에 같은 값을 표시합니다.`;
                                  })()
                                : `${selectedSpatial.adm1Name}의 개별 추정값이 아니라 ${publicVietnamSourceRegionV126(
                                    publicTextV126(
                                      selectedSpatial.properties.sourceRegion
                                    ) || undefined
                                  )} 권역의 값을 표시합니다.`
                            }
                          />
                        </>
                      )}
                      {selectedB021RegionRankV129 && (
                        <Evidence
                          label="권역 비교"
                          value={selectedB021RegionRankV129}
                        />
                      )}
                      {selectedOwningLayer.elementId === "D-008" &&
                        selectedFeatureRoleV129 === "context" && (
                          <Evidence
                            label="공간단위"
                            value="성·시 단위 통계 대표점 · 실제 사업 위치가 아님"
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
                                ? `${formatPublicNumberV126(Number(value), "km")} km`
                                : String(value) === "existing"
                                ? "운영 중"
                                : publicTextV126(formatValueV121(value)) || "미표기"
                            }
                          />
                        ))}
                      <Evidence label="출처" value={mapIndicatorSourceV148(String(selectedSpatial.properties.sourceIndicatorId || ""), selectedSpatial.adm1Code ? "" : selectedOwningLayer.source)} />
                      {/* What the symbol stands for on the ground (V138 map contract). */}
                      <Evidence
                        label="지도 표시"
                        value={`${publicMapTargetV138(selectedOwningLayer.elementId)?.displaySpatialUnit || "기호"} · ${
                          selectedSpatial.adm1Code
                            ? "성·시 경계 값"
                            : rendererOf(selectedOwningLayer) === "line"
                            ? "선로 경로 좌표"
                            : "위치 좌표"
                        }`}
                      />
                    </div>
                    {selectedOwningLayer.sharedObjectsWith && selectedMemberRecordsV138.length === 0 && (
                      <p className="cdp-map-region-trend-v132__notice" data-testid="map-shared-register-note-v138">
                        {selectedOwningLayer.sharedObjectKind === "document"
                          ? `같은 문서가 ${publicMapLayerTitleV126(selectedOwningLayer.sharedObjectsWith)}에도 수록되어 있으며 두 자료를 함께 켜도 문서 수를 더하지 않습니다.`
                          : `${publicMapLayerTitleV126(selectedOwningLayer.sharedObjectsWith)}와(과) 같은 대상시설 명부를 다른 기준(지역별·업종별)으로 본 값이며 두 자료를 함께 켜도 시설 수를 더하지 않습니다.`}
                      </p>
                    )}
                    {selectedMemberRecordsV138.length > 0 && (
                      <section
                        className="cdp-map-member-records-v138"
                        data-testid="map-member-records-v138"
                        data-record-count={selectedMemberRecordsV138.length}
                      >
                        <h5>
                          {selectedOwningLayer.sharedObjectKind === "document"
                            ? "이 지역의 문서"
                            : "이 지역의 수록 자료"}{" "}
                          {selectedMemberRecordsV138.length.toLocaleString()}건
                        </h5>
                        <ul>
                          {selectedMemberRecordsV138.map((row) => (
                            <li key={row.recordId}>
                              <strong>{row.label}</strong>
                              {row.region ? ` · ${row.region}` : ""}
                              {row.date ? ` · ${row.date}` : ""}
                              {row.status ? ` · ${row.status}` : ""}
                              {row.value ? ` · ${row.value}` : ""}
                              {row.url && isHttpUrlV121(row.url) && (
                                <>
                                  {" · "}
                                  <a href={row.url} target="_blank" rel="noreferrer">
                                    공식 원문
                                  </a>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                        {selectedOwningLayer.sharedObjectsWith && (
                          <p className="cdp-map-region-trend-v132__notice">
                            {selectedOwningLayer.sharedObjectKind === "document"
                              ? `같은 문서가 ${publicMapLayerTitleV126(selectedOwningLayer.sharedObjectsWith)}에도 수록되어 있으며 두 자료를 함께 켜도 문서 수를 더하지 않습니다.`
                              : `${publicMapLayerTitleV126(selectedOwningLayer.sharedObjectsWith)}와(과) 같은 시설 명부를 다른 기준으로 본 값이며 시설 수를 더하지 않습니다.`}
                          </p>
                        )}
                      </section>
                    )}
                    {selectedB033TrendV132 && (
                      <section
                        className="cdp-map-region-trend-v132"
                        data-testid="b033-map-region-trend-v132"
                        data-region-name={selectedB033TrendV132.region}
                        data-region-record-count={selectedB033TrendV132.rows.length}
                        data-region-unit={selectedB033TrendV132.unit}
                      >
                        <InteractiveTimeSeriesChartV127
                          ariaLabel={`${selectedB033TrendV132.region} ${selectedB033TrendV132.measureLabel} 추이`}
                          className="cdp-map-region-trend-v132__chart"
                          formatValue={(value) =>
                            formatPublicNumberV126(
                              value,
                              selectedB033TrendV132.unit
                            )
                          }
                          height={270}
                          series={selectedB033TrendV132.series}
                          sharedYearTooltip={selectedB033TrendV132.scenarioSeries}
                          showDelta={false}
                          testId="map-b033-region-trend-chart"
                          title={`${selectedB033TrendV132.region} ${selectedB033TrendV132.measureLabel} 추이`}
                          tooltipMode="nearest-point"
                          unit={selectedB033TrendV132.unit}
                          xAxisTitle="연도"
                          yAxisTitle={`${selectedB033TrendV132.measureLabel} (${selectedB033TrendV132.unit})`}
                          zoom={{
                            enabled: selectedB033TrendV132.rows.length > 8,
                            minimumSpan: 4,
                            showRangeBrush: false,
                          }}
                        />
                        <p className="cdp-map-region-trend-v132__notice">
                          {selectedB033TrendV132.scenarioSeries
                            ? "지도에서 선택한 성·시의 값을 시나리오별로 잇습니다. 과거 모형(historical, 점선)과 SSP 전망은 서로 잇지 않습니다. 지도는 5년 간격 연도이며 전체 연도는 데이터 상세에서 확인합니다."
                            : "지도에서 선택한 지역의 공개 관측값만 연결해 표시합니다."}
                        </p>
                        <details className="cdp-map-region-trend-v132__table">
                          <summary>연도별 값 표</summary>
                          <div>
                            <table>
                              <caption>{selectedB033TrendV132.region} {selectedB033TrendV132.measureLabel}</caption>
                              <thead>
                                <tr>
                                  <th scope="col">연도</th>
                                  <th scope="col">값</th>
                                  <th scope="col">단위</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedB033TrendV132.rows.map((row) => (
                                  <tr key={row.period}>
                                    <th scope="row">{row.period}</th>
                                    <td>
                                      {formatPublicNumberV126(
                                        row.value,
                                        selectedB033TrendV132.unit
                                      )}
                                    </td>
                                    <td>{selectedB033TrendV132.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </section>
                    )}
                  </div>
                ) : selected && selectedLayer ? (
                  <div
                    data-testid="map-feature-detail"
                    data-a023-key-facts={
                      selectedLayer.elementId === "A-023" ? "true" : undefined
                    }
                  >
                    <h4>{selectedEntityTitleResolutionV131?.title}</h4>
                    {selectedApproximateV138 && <p className="cdp-map-region-trend-v132__notice">{["B-023", "B-025", "B-028"].includes(selected.elementId) ? "유역의 대표 위치입니다. 유역 경계나 영향 범위를 나타내지 않습니다." : "소재 지역을 나타내는 점이며, 건물 위치는 아닙니다."}</p>}
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
                      <div className="cdp-map-a023-key-facts-v132"
                        data-testid={selected.elementId === "A-023" ? "a023-map-selected-key-facts-v132" : "map-selected-facts-v148"}>
                        {mapFactsV148(selectedLayer, selected.normalizedAttributes || {})
                          .filter((fact) => !["sourceLabel", "referenceYear"].includes(fact.key))
                          .map((fact) => <Evidence key={fact.key} label={fact.label} value={fact.value} />)}
                        <Evidence label="자료연도" value={["B-023", "B-028"].includes(selected.elementId) ? "관측값별 시점 참조" : String(selected.provenance.referenceYear || selectedLayer.selectors?.defaultPeriod || selectedLayer.latestYear || "")} />
                      </div>
                      {selectedMemberFactsV138.map((fact) => (
                        <Evidence
                          key={fact.label}
                          label={fact.label}
                          value={fact.value}
                        />
                      ))}
                      {/* The row's source line carries the compiler's column
                          note ("attr_19 참조"); the organisations stay. */}
                      <Evidence
                        label="출처"
                        value={mapIndicatorSourceV148(selected.indicatorId, selected.provenance.sourceOrg || "")}
                      />
                      <Evidence label="지도 표시" value={`${publicMapTargetV138(selected.elementId)?.displaySpatialUnit || "기호"} · 위치 좌표`} />
                    </div>
                    {selectedMemberSeriesV138 && (
                      <section
                        className="cdp-map-region-trend-v132"
                        data-testid="map-member-series-v138"
                        data-station-name={selectedMemberSeriesV138.title}
                        data-series-count={selectedMemberSeriesV138.series.length}
                      >
                        <label className="cdp-field" style={{ marginBottom: 6 }}>
                          <span className="cdp-field__label">분위(불확실성 범위)</span>
                          <select
                            className="cdp-select"
                            data-testid="map-member-series-quantile-v138"
                            value={memberSeriesQuantileV138}
                            onChange={(event) => setMemberSeriesQuantileV138(event.target.value)}
                          >
                            {selectedMemberSeriesV138.quantiles.map((quantile) => (
                              <option key={quantile} value={quantile}>
                                {quantile === "50" ? "중앙값(50분위)" : `${quantile}분위`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <InteractiveTimeSeriesChartV127
                          ariaLabel={`${selectedMemberSeriesV138.title} 시나리오별 전망`}
                          className="cdp-map-region-trend-v132__chart"
                          formatValue={(value) =>
                            formatPublicNumberV126(value, selectedMemberSeriesV138.unit)
                          }
                          height={270}
                          series={selectedMemberSeriesV138.series}
                          sharedYearTooltip
                          showDelta={false}
                          testId="map-member-series-chart-v138"
                          title={`${selectedMemberSeriesV138.title} · 시나리오별 ${selectedMemberSeriesV138.measureLabel}`}
                          unit={selectedMemberSeriesV138.unit}
                          xAxisTitle="연도"
                          yAxisTitle={`${selectedMemberSeriesV138.measureLabel} (${selectedMemberSeriesV138.unit})`}
                          zoom={{ enabled: false }}
                        />
                        <p className="cdp-map-region-trend-v132__notice">
                          {selectedMemberSeriesV138.note}
                        </p>
                      </section>
                    )}
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
              <p>지도 데이터를 선택하면 지역별 비교와 상세정보가 표시됩니다.</p>
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
      <span>
        <PublicTermTextV134 text={label} />
      </span>
      <strong>
        {isHttpUrlV121(value) ? <a href={value} target="_blank" rel="noreferrer">공식 원문</a> : <PublicTermTextV134 text={value} />}
      </strong>
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
