/**
 * V151-2: the 34-unit boundary policy a map layer carries, and the province a
 * point feature sits in.
 *
 * The map's default outline is the 2025-07-01 34-unit system while every
 * published value is still keyed to the 63 provinces its source used. The
 * policy says how - or whether - a layer's values may be shown per 34-unit,
 * so the runtime never has to guess. It is declared on the target contract
 * (`build.boundaryPolicy34`, or `build.patch.boundaryPolicy34` for ETL layers)
 * and copied onto `map-index.json` by the build; nobody edits map-index by
 * hand.
 *
 *   sum                 areas, losses, MW, budgets: exact under a merge
 *   area-weighted-mean  intensive statistics (rates, areal means)
 *   member-max/-min     kept in the vocabulary; no indicator uses them today
 *   range-only          percentile/median statistics: no single 34 value
 *   count-sum           document counts per province
 *   membership-or       a unit takes part if any member does
 *   native-34           the source already publishes per 34-unit
 *   six-region-only     B-021 draws on its own six-region asset
 *   none                points and lines: only the popup names the unit
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const BOUNDARY_POLICY_SCHEMA = "boundary-policy-v151-2";
export const BOUNDARY_POLICY_KINDS = [
  "sum",
  "area-weighted-mean",
  "member-max",
  "member-min",
  "range-only",
  "count-sum",
  "membership-or",
  "native-34",
  "six-region-only",
  "none",
];
const AGGREGATING_KINDS = new Set([
  "sum",
  "area-weighted-mean",
  "member-max",
  "member-min",
  "count-sum",
  "membership-or",
  "native-34",
]);

// A percentile, median or rank statistic has no defensible single value for
// a merged unit; averaging two provinces' 90th percentiles is not a 90th
// percentile. The build refuses to publish such a variable under any policy
// but range-only.
const QUANTILE_LABEL = /분위|중앙값|상위\s*\d+\s*%|하위\s*\d+\s*%|백분위|순위/u;

const NOTES = {
  sum: "34개 성·시 값은 구성 성·시 값의 합계이며 일부 결측이면 부분 결측으로 표시합니다.",
  "area-weighted-mean": "34개 성·시 값은 구성 성·시 값의 면적가중평균이며 팝업에 구성 범위를 함께 표시합니다.",
  "member-max": "34개 성·시 값은 구성 성·시 값 중 최대값입니다.",
  "member-min": "34개 성·시 값은 구성 성·시 값 중 최소값입니다.",
  "range-only": "분위·순위형 지표는 34개 단일값을 만들지 않으며 구성 범위만 표시합니다.",
  "count-sum": "34개 성·시 값은 구성 성·시 문서 수의 합계입니다.",
  "membership-or": "구성 성·시 중 하나라도 참여하면 34개 단위를 참여로 표시합니다.",
  "native-34": "원자료가 개편 후 34개 성·시 기준으로 발표한 값을 34개 경계에 직접 표시합니다.",
  "six-region-only": "GDL 6개 권역 값을 권역 경계에 표시하며 행정경계 기준과 무관합니다.",
  none: "지점·선 자료는 합산하지 않으며 팝업에 소재 성·시(34개 기준)를 표시합니다.",
};

function valueSystemFor(kind, target) {
  if (kind === "six-region-only") return "gdl-six-region";
  if (kind === "native-34" || target?.build?.regionSystem === "post-2025-34") return "post-2025-34";
  return "pre-2025-63";
}

/**
 * Resolve and validate the policy for one built layer.
 *
 * @param target  the contract target (with `build.boundaryPolicy34` or `build.patch.boundaryPolicy34`)
 * @param layer   the map-index layer as built so far (needs renderer, geometryTypes, selectors.variables)
 * @param measureKeys  the measure keys the policy may name per variable
 */
export function boundaryPolicyForLayer(target, layer, measureKeys) {
  const declared = target.build?.boundaryPolicy34 || target.build?.patch?.boundaryPolicy34 || null;
  const isArea =
    layer.renderer === "admin1-choropleth" ||
    layer.renderer === "partial-choropleth" ||
    (layer.geometryTypes || []).some((type) => /polygon/iu.test(type) && layer.renderer !== "regional-scope");
  if (!declared) {
    if (isArea) {
      throw new Error(`${target.elementId}: an area layer needs build.boundaryPolicy34 in the target contract`);
    }
    return { schema: BOUNDARY_POLICY_SCHEMA, kind: "none", note: NOTES.none, valueSystem: "pre-2025-63" };
  }
  if (!BOUNDARY_POLICY_KINDS.includes(declared.kind)) {
    throw new Error(`${target.elementId}: unknown boundaryPolicy34 kind ${declared.kind}`);
  }
  const byVariable = {};
  for (const [measureKey, kind] of Object.entries(declared.byMeasureKey || {})) {
    if (!BOUNDARY_POLICY_KINDS.includes(kind)) {
      throw new Error(`${target.elementId}: unknown byMeasureKey kind ${kind} for ${measureKey}`);
    }
    if (measureKeys && !measureKeys.includes(measureKey)) {
      throw new Error(`${target.elementId}: byMeasureKey names ${measureKey}, which is not a measure of this layer`);
    }
    byVariable[measureKey] = kind;
  }
  for (const option of layer.selectors?.variables || []) {
    const key = option.measureKey || String(option.key || "").replace(/--[a-z0-9]+$/u, "");
    const kind = byVariable[key] || declared.kind;
    if (QUANTILE_LABEL.test(option.label || "") && kind !== "range-only" && kind !== "none") {
      throw new Error(
        `${target.elementId}: "${option.label}" is a quantile/rank statistic and may only carry range-only, not ${kind}`
      );
    }
  }
  return {
    schema: BOUNDARY_POLICY_SCHEMA,
    kind: declared.kind,
    ...(Object.keys(byVariable).length ? { byVariable } : {}),
    note: NOTES[declared.kind],
    valueSystem: valueSystemFor(declared.kind, target),
  };
}

export function isAggregatingKind(kind) {
  return AGGREGATING_KINDS.has(kind);
}

// ---------------------------------------------------------------- point in province

function pointInRing(lon, lat, ring) {
  // Ray casting; the ring is closed, so the last vertex repeats the first.
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lon, lat, polygon) {
  if (!pointInRing(lon, lat, polygon[0])) return false;
  for (let index = 1; index < polygon.length; index += 1) {
    if (pointInRing(lon, lat, polygon[index])) return false;
  }
  return true;
}

function bboxOf(coordinates) {
  const box = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity };
  const walk = (node) => {
    if (typeof node[0] === "number") {
      box.west = Math.min(box.west, node[0]);
      box.east = Math.max(box.east, node[0]);
      box.south = Math.min(box.south, node[1]);
      box.north = Math.max(box.north, node[1]);
      return;
    }
    for (const child of node) walk(child);
  };
  walk(coordinates);
  return box;
}

/**
 * A locator over the 63-province asset. `locate(lon, lat)` returns the
 * province the point falls in, or null when it is outside every polygon
 * (offshore stations, foreign offices). Nothing is snapped or guessed.
 */
export function createProvinceLocator(geometry63, geometry34) {
  const unitByMember = new Map();
  for (const feature of geometry34?.features || []) {
    const unitCode = String(feature.properties.unitCode);
    for (const code of feature.properties.memberAdm1Codes || []) unitByMember.set(String(code), unitCode);
  }
  const provinces = geometry63.features.map((feature) => {
    const polygons =
      feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];
    return {
      adm1Code: String(feature.properties.adm1Code),
      adm1Name: String(feature.properties.name),
      bbox: bboxOf(feature.geometry.coordinates),
      polygons,
    };
  });
  return {
    locate(lon, lat) {
      if (typeof lon !== "number" || typeof lat !== "number" || !Number.isFinite(lon) || !Number.isFinite(lat)) {
        return null;
      }
      for (const province of provinces) {
        const { bbox } = province;
        if (lon < bbox.west || lon > bbox.east || lat < bbox.south || lat > bbox.north) continue;
        if (province.polygons.some((polygon) => pointInPolygon(lon, lat, polygon))) {
          return {
            adm1Code: province.adm1Code,
            adm1Name: province.adm1Name,
            unitCode: unitByMember.get(province.adm1Code) || null,
          };
        }
      }
      return null;
    },
  };
}

export function loadProvinceLocator(dataRoot) {
  const geometry63 = JSON.parse(readFileSync(resolve(dataRoot, "geometry/vnm-adm1-63.geojson"), "utf8"));
  let geometry34 = null;
  try {
    geometry34 = JSON.parse(readFileSync(resolve(dataRoot, "geometry/vnm-adm1-34.geojson"), "utf8"));
  } catch {
    geometry34 = null;
  }
  return createProvinceLocator(geometry63, geometry34);
}

/**
 * Build the per-record location sidecar for a point layer. Only records with
 * a source coordinate are listed; a coordinate outside every province maps to
 * null so the popup can say so instead of naming a neighbour.
 */
export function buildLocationSidecar(elementId, records, locator) {
  const byRecordId = {};
  let located = 0;
  let outside = 0;
  let withoutCoordinate = 0;
  for (const record of records) {
    if (typeof record.latitude !== "number" || typeof record.longitude !== "number") {
      withoutCoordinate += 1;
      continue;
    }
    const hit = locator.locate(record.longitude, record.latitude);
    byRecordId[record.recordId] = hit;
    if (hit) located += 1;
    else outside += 1;
  }
  return {
    asset: {
      schemaVersion: "v151-2-locations-1",
      elementId,
      method: "point-in-polygon against vnm-adm1-63.geojson; unitCode via vnm-adm1-34.geojson membership",
      notice: "소재 성·시는 원자료 좌표를 개편 전 63개 경계에 대응한 결과이며 좌표를 이동·보정하지 않습니다. 경계 밖 좌표는 null입니다.",
      counts: { located, outside, withoutCoordinate },
      byRecordId,
    },
    counts: { located, outside, withoutCoordinate },
  };
}
