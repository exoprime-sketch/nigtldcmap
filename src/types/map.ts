import { resolveCountryElementIdV122 } from "../data/countries/countryDataFacadeV122";

export type MapLayerId =
  | "populationTotal"
  | "urbanizationShare"
  | "populationGrowth"
  | "gdpCurrent"
  | "gdpGrowth"
  | "gdpPerCapita"
  | "electricityGap"
  | "cleanCookingGap"
  | "renewableElectricityShare"
  | "gridLosses"
  | "heatIndexHi35"
  | "solarPvout"
  | "solarGhi"
  | "povertyNational"
  | "povertyExtreme"
  | "agricultureShare"
  | "industryShare"
  | "manufacturingShare"
  | "servicesShare"
  | "unemploymentTotal"
  | "unemploymentYouth"
  | "giniIndex"
  | "gcfFundedActivityFinancing"
  | "gcfFundedActivityCount"
  | "gcfReadinessFinancing"
  | "gcfReadinessCount"
  | "ndcRenewableEnergy"
  | "ndcPowerGrid"
  | "ndcEnergyEfficiency"
  | "ndcWater";

export type MapOverlayId =
  | "none"
  | "gcfFundedActivityCount"
  | "gcfFundedActivityFinancing"
  | "gcfReadinessCount"
  | "gcfReadinessFinancing";

export type MapPolicyOverlayId = "none" | "ndcSubmissionRecency";

export type CountryScope = "priority" | "low-middle-income" | "all";

/**
 * v86 지도 상태
 *
 * - activeLayerKeys: 이용자가 켠 누적 레이어 순서
 * - layerOpacities: 레이어별 투명도
 * - layerYears: 시계열/연도형 레이어별 기준연도
 * - focusLayerKey: 국가비교·상세·협력검토로 넘길 현재 초점 레이어
 *
 * legacy layer/overlay/policyOverlay/year 필드는 과거 공유 URL 호환용으로 유지한다.
 * v86부터 실제 지도 값 계산은 전역 year가 아니라 layerYears를 우선 사용한다.
 */
export interface MapViewState {
  layer: MapLayerId;
  overlay: MapOverlayId;
  policyOverlay: MapPolicyOverlayId;
  scope: CountryScope;
  region: string;
  year: number | null;
  countryIso3: string | null;
  baseOpacity: number;
  overlayOpacity: number;
  policyOpacity: number;
  activeLayerKeys: string[];
  layerOpacities: Record<string, number>;
  layerYears: Record<string, number | null>;
  focusLayerKey: string | null;
  /** V126 public workspace: at most one dataset drives analysis and legend. */
  primaryLayerId: string | null;
  /** V126 public workspace: at most two lower-priority reference datasets. */
  contextLayerIds: string[];
  /** Optional deterministic public workspace preset restored from the URL. */
  mapPresetId: string | null;
}

export const DEFAULT_MAP_VIEW_STATE: MapViewState = {
  // v103: 지도 첫 진입은 "아무 레이어도 선택하지 않은 상태"가 기본이다.
  // legacy layer 필드는 공유 URL 호환을 위해 값만 유지하며, 실제 활성 여부는
  // activeLayerKeys로만 판단한다.
  layer: "electricityGap",
  overlay: "none",
  policyOverlay: "none",
  scope: "priority",
  region: "all",
  year: null,
  countryIso3: null,
  baseOpacity: 0.58,
  overlayOpacity: 0.72,
  policyOpacity: 0.95,
  activeLayerKeys: [],
  layerOpacities: {},
  layerYears: {},
  focusLayerKey: null,
  primaryLayerId: null,
  contextLayerIds: [],
  mapPresetId: null,
};

const MAP_LAYER_IDS = new Set<MapLayerId>([
  "populationTotal",
  "urbanizationShare",
  "populationGrowth",
  "gdpCurrent",
  "gdpGrowth",
  "gdpPerCapita",
  "electricityGap",
  "cleanCookingGap",
  "renewableElectricityShare",
  "gridLosses",
  "heatIndexHi35",
  "solarPvout",
  "solarGhi",
  "povertyNational",
  "povertyExtreme",
  "agricultureShare",
  "industryShare",
  "manufacturingShare",
  "servicesShare",
  "unemploymentTotal",
  "unemploymentYouth",
  "giniIndex",
  "gcfFundedActivityFinancing",
  "gcfFundedActivityCount",
  "gcfReadinessFinancing",
  "gcfReadinessCount",
  "ndcRenewableEnergy",
  "ndcPowerGrid",
  "ndcEnergyEfficiency",
  "ndcWater",
]);

const MAP_OVERLAY_IDS = new Set<MapOverlayId>([
  "none",
  "gcfFundedActivityCount",
  "gcfFundedActivityFinancing",
  "gcfReadinessCount",
  "gcfReadinessFinancing",
]);

const MAP_POLICY_OVERLAY_IDS = new Set<MapPolicyOverlayId>([
  "none",
  "ndcSubmissionRecency",
]);

const COUNTRY_SCOPES = new Set<CountryScope>([
  "priority",
  "low-middle-income",
  "all",
]);

function parseOpacity(value: string | null, fallback: number): number {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0.15, parsed));
}

function parseOptionalYear(value: string | null): number | null {
  if (value === null || value.trim() === "" || value === "none") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeModernElementMapKey(
  value: string,
  countryIso3: string | null
): string | null {
  return resolveCountryElementIdV122(countryIso3, value);
}

function isModernElementMapKey(
  value: string,
  countryIso3: string | null
): boolean {
  return normalizeModernElementMapKey(value, countryIso3) !== null;
}

function isValidCatalogKey(value: string, countryIso3: string | null): boolean {
  if (isModernElementMapKey(value, countryIso3)) return true;
  const [mode, id] = value.split(":", 2);
  if (!mode || !id) return false;
  if (mode === "fill") return MAP_LAYER_IDS.has(id as MapLayerId);
  if (mode === "bubble") {
    return MAP_OVERLAY_IDS.has(id as MapOverlayId) && id !== "none";
  }
  if (mode === "point") {
    return (
      MAP_POLICY_OVERLAY_IDS.has(id as MapPolicyOverlayId) && id !== "none"
    );
  }
  return false;
}

function defaultOpacityForKey(key: string): number {
  if (key.startsWith("bubble:")) return 0.72;
  if (key.startsWith("point:")) return 0.95;
  return 0.58;
}

function uniqueValidKeys(
  values: string[],
  countryIso3: string | null
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const rawKey = value.trim();
    if (!rawKey) return;
    const key = normalizeModernElementMapKey(rawKey, countryIso3) ?? rawKey;
    if (seen.has(key) || !isValidCatalogKey(key, countryIso3)) return;
    seen.add(key);
    result.push(key);
  });
  return result;
}

function legacyKeys(
  layer: MapLayerId,
  overlay: MapOverlayId,
  policyOverlay: MapPolicyOverlayId
): string[] {
  const keys = [`fill:${layer}`];
  if (overlay !== "none") keys.push(`bubble:${overlay}`);
  if (policyOverlay !== "none") keys.push(`point:${policyOverlay}`);
  return keys;
}

export function parseMapViewState(params: URLSearchParams): MapViewState {
  const layerValue = params.get("layer") as MapLayerId | null;
  const overlayValue = params.get("overlay") as MapOverlayId | null;
  const policyOverlayValue = params.get(
    "policyOverlay"
  ) as MapPolicyOverlayId | null;
  const scopeValue = params.get("scope") as CountryScope | null;
  const yearValue = params.get("year");
  const parsedYear = yearValue ? Number(yearValue) : null;
  const countryValue = params.get("country");
  const countryIso3 = countryValue?.trim().toUpperCase() || null;

  const layer =
    layerValue && MAP_LAYER_IDS.has(layerValue)
      ? layerValue
      : DEFAULT_MAP_VIEW_STATE.layer;
  const overlay =
    overlayValue && MAP_OVERLAY_IDS.has(overlayValue)
      ? overlayValue
      : DEFAULT_MAP_VIEW_STATE.overlay;
  const policyOverlay =
    policyOverlayValue && MAP_POLICY_OVERLAY_IDS.has(policyOverlayValue)
      ? policyOverlayValue
      : DEFAULT_MAP_VIEW_STATE.policyOverlay;

  // v103: bare #map 진입에서는 legacy 기본 레이어를 자동으로 켜지 않는다.
  // 다만 과거 공유 URL처럼 layer/overlay/policyOverlay가 실제 query에 존재하면
  // layers 파라미터가 없어도 기존 의미를 보존해 legacy key로 복원한다.
  const hasExplicitLegacyState =
    params.has("layer") || params.has("overlay") || params.has("policyOverlay");
  const legacyActiveKeys = hasExplicitLegacyState
    ? legacyKeys(layer, overlay, policyOverlay)
    : [];
  const layersParam = params.get("layers");
  const explicitEmptyLayers = layersParam === "none";
  const activeLayerKeys = explicitEmptyLayers
    ? []
    : layersParam !== null
    ? uniqueValidKeys(layersParam.split(","), countryIso3)
    : uniqueValidKeys(legacyActiveKeys, countryIso3);
  const normalizedActiveKeys = activeLayerKeys;

  const opacityValues = params.get("layerOpacities")?.split(",") ?? [];
  const layerOpacities: Record<string, number> = {};
  normalizedActiveKeys.forEach((key, index) => {
    const legacyFallback =
      key === `fill:${layer}`
        ? parseOpacity(params.get("baseOpacity"), defaultOpacityForKey(key))
        : key === `bubble:${overlay}`
        ? parseOpacity(params.get("overlayOpacity"), defaultOpacityForKey(key))
        : key === `point:${policyOverlay}`
        ? parseOpacity(params.get("policyOpacity"), defaultOpacityForKey(key))
        : defaultOpacityForKey(key);
    layerOpacities[key] = parseOpacity(
      opacityValues[index] ?? null,
      legacyFallback
    );
  });

  // v86: layers와 같은 순서의 layerYears 값을 사용한다.
  // 과거 URL의 전역 year는 legacy 기준 fill 레이어의 fallback으로만 사용한다.
  const layerYearValues = params.get("layerYears")?.split(",") ?? [];
  const layerYears: Record<string, number | null> = {};
  normalizedActiveKeys.forEach((key, index) => {
    const explicit = parseOptionalYear(layerYearValues[index] ?? null);
    const legacyYear =
      key === `fill:${layer}` &&
      parsedYear !== null &&
      Number.isInteger(parsedYear)
        ? parsedYear
        : null;
    layerYears[key] = explicit ?? legacyYear;
  });

  const focusParam = params.get("focusLayer");
  const normalizedFocusParam = focusParam
    ? normalizeModernElementMapKey(focusParam, countryIso3) ?? focusParam
    : null;
  const focusLayerKey =
    normalizedFocusParam &&
    (normalizedActiveKeys.includes(normalizedFocusParam) ||
      isModernElementMapKey(normalizedFocusParam, countryIso3))
      ? normalizedFocusParam
      : normalizedActiveKeys[normalizedActiveKeys.length - 1] ?? null;

  const primaryParam = params.get("primaryLayer");
  const normalizedPrimaryParam = primaryParam
    ? normalizeModernElementMapKey(primaryParam, countryIso3) ?? primaryParam
    : null;
  const primaryLayerId =
    normalizedPrimaryParam &&
    isValidCatalogKey(normalizedPrimaryParam, countryIso3)
      ? normalizedPrimaryParam
      : focusLayerKey;
  const explicitContextIds = uniqueValidKeys(
    (params.get("contextLayers") || "").split(","),
    countryIso3
  );
  const contextLayerIds = (
    params.has("contextLayers")
      ? explicitContextIds
      : normalizedActiveKeys.filter((key) => key !== primaryLayerId)
  )
    .filter((key) => key !== primaryLayerId)
    .slice(0, 2);
  const roleActiveLayerKeys = primaryLayerId
    ? [primaryLayerId, ...contextLayerIds]
    : [];
  const mapPresetParam = params.get("mapPreset");
  const mapPresetId = new Set([
    "POWER_INFRASTRUCTURE",
    "RENEWABLE_PLANNING",
    "FOREST_CHANGE",
    "CLIMATE_VULNERABILITY",
    "CLIMATE_FINANCE_PROJECTS",
  ]).has(mapPresetParam || "")
    ? mapPresetParam
    : null;

  return {
    layer,
    overlay,
    policyOverlay,
    scope:
      scopeValue && COUNTRY_SCOPES.has(scopeValue)
        ? scopeValue
        : DEFAULT_MAP_VIEW_STATE.scope,
    region: params.get("region")?.trim() || DEFAULT_MAP_VIEW_STATE.region,
    year:
      parsedYear !== null && Number.isInteger(parsedYear)
        ? parsedYear
        : DEFAULT_MAP_VIEW_STATE.year,
    countryIso3,
    baseOpacity:
      layerOpacities[`fill:${layer}`] ?? DEFAULT_MAP_VIEW_STATE.baseOpacity,
    overlayOpacity:
      overlay !== "none"
        ? layerOpacities[`bubble:${overlay}`] ??
          DEFAULT_MAP_VIEW_STATE.overlayOpacity
        : DEFAULT_MAP_VIEW_STATE.overlayOpacity,
    policyOpacity:
      policyOverlay !== "none"
        ? layerOpacities[`point:${policyOverlay}`] ??
          DEFAULT_MAP_VIEW_STATE.policyOpacity
        : DEFAULT_MAP_VIEW_STATE.policyOpacity,
    activeLayerKeys: roleActiveLayerKeys,
    layerOpacities,
    layerYears,
    focusLayerKey: primaryLayerId,
    primaryLayerId,
    contextLayerIds,
    mapPresetId,
  };
}
