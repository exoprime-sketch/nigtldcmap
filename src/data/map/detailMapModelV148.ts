import type { CountryMapLayerV122 } from "../countries/countryDataTypesV122";
import type { DataFinderSelectorStateV125 } from "../../types/dataFinderV125";
import { dataFinderSelectorFromMapV125, resolveMapSelectorBindingV125 } from "../visualization/mapSelectorBindingsV125";
import { publicRegionScenarioContractV138 } from "../visualization/publicRegionScenarioContractV138";
import targets from "../visualization/publicMapTargetsV138.json";

export type DetailMapSelectionV148 = { variable: string; period: string; note: string };

/** The full map must receive the slice actually visible in the small map,
 * including an explicitly disclosed fallback, not an unavailable chart year. */
export function detailMapHandoffV148(layer: CountryMapLayerV122, slice: { variable: string; period: string }, selection: DataFinderSelectorStateV125) {
  const filters = Object.fromEntries(layer.filters.map((f) => [f.field, selection.dimensions[f.field] || f.defaultValue || "all"]));
  const state = dataFinderSelectorFromMapV125(layer.elementId, slice, filters);
  return { ...state, dimensions: { ...state.dimensions, __mapElementId: layer.elementId, __mapVariable: slice.variable, __mapPeriod: slice.period } };
}

/** Join the detail's explicit source column to the map's explicit measure.
 * No label similarity or nearest-year substitution. A full-series/all-scenario
 * chart has more than one slice; its map names the one slice it displays. */
export function detailMapSelectionV148(layer: CountryMapLayerV122, selection: DataFinderSelectorStateV125): DetailMapSelectionV148 {
  const bound = resolveMapSelectorBindingV125(layer.elementId, selection, layer.selectors);
  const build = targets.targets.find((t) => t.elementId === layer.elementId)?.build as {
    measures?: Array<{ key: string; sourceKey?: string }>;
    scenarioKey?: string; defaultScenario?: string; defaultMeasure?: string;
  } | undefined;
  const sourceMeasure = selection.dimensions.regionMeasure || publicRegionScenarioContractV138(layer.elementId)?.defaultMeasure;
  const measure = build?.measures?.find((m) => m.sourceKey === sourceMeasure)?.key;
  const scenario = selection.dimensions.scenario;
  const candidate = measure ? (build?.scenarioKey ? `${measure}--${scenario && scenario !== "__all__" ? scenario : build.defaultScenario}` : measure) : bound.variable;
  const exact = layer.selectors.variables.find((v) => v.key === candidate);
  const variable = exact || layer.selectors.variables.find((v) => v.key === layer.selectors.defaultVariable) || layer.selectors.variables[0];
  const periods = variable?.periods || layer.selectors.periods;
  const requested = selection.period || (selection.year !== null ? String(selection.year) : bound.period);
  const period = requested && periods.includes(requested) ? requested
    : periods.includes(layer.selectors.defaultPeriod) ? layer.selectors.defaultPeriod : periods[periods.length - 1] || "";
  const notes: string[] = [];
  if (build?.scenarioKey && (!scenario || scenario === "__all__")) notes.push("아래 지도는 표시한 시나리오 한 개의 지역 분포입니다.");
  if (requested && !periods.includes(requested) && layer.dataUrl) notes.push(`선택 시점의 지도자료가 없어 ${period} 자료를 표시합니다.`);
  if (candidate && !exact && layer.dataUrl) notes.push("선택 항목의 지도자료가 없어 아래에 명시한 항목을 표시합니다.");
  if (!layer.dataUrl && bound.reason) notes.push("이 지도는 상세 차트의 집계가 아닌, 수록 대상의 위치를 보여줍니다.");
  return { variable: variable?.key || "locations", period, note: notes.join(" ") };
}

export function finiteMapValueV148(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapColorV148(value: number | null, min: number, max: number): string {
  if (value === null) return "#edf1ef";
  if (min < 0 && max > 0) {
    const t = Math.min(1, Math.abs(value) / Math.max(Math.abs(min), Math.abs(max)));
    return value < 0 ? `hsl(25 65% ${92 - 52 * t}%)` : `hsl(178 55% ${92 - 62 * t}%)`;
  }
  const t = max === min ? 0.6 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  return `hsl(170 52% ${91 - 62 * t}%)`;
}

type Coordinate = [number, number];
export function coordinatePairsV148(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return [];
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    return Number.isFinite(value[0]) && Number.isFinite(value[1]) ? [[value[0], value[1]]] : [];
  }
  return value.flatMap(coordinatePairsV148);
}

/** A small local equirectangular overview, explicitly not a distance tool. */
export function overviewProjectionV148(coordinates: Coordinate[], width = 580, height = 350) {
  const positions = coordinates.length ? coordinates : [[102, 8], [110, 24]];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of positions) {
    const x = p[0] * Math.cos(17 * Math.PI / 180), y = -p[1];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
  const scale = Math.min((width - 28) / spanX, (height - 28) / spanY);
  const ox = (width - spanX * scale) / 2, oy = (height - spanY * scale) / 2;
  return ([lon, lat]: Coordinate): Coordinate => [(lon * Math.cos(17 * Math.PI / 180) - minX) * scale + ox, (-lat - minY) * scale + oy];
}

export function geometryPathV148(geometry: { type: string; coordinates: unknown }, project: (p: Coordinate) => Coordinate): string {
  const sequence = (v: unknown, close: boolean) => coordinatePairsV148(v).map((p, i) => `${i ? "L" : "M"}${project(p).map((n) => n.toFixed(2)).join(",")}`).join(" ") + (close ? " Z" : "");
  const c = geometry.coordinates as unknown[];
  if (!Array.isArray(c)) return "";
  if (geometry.type === "Polygon") return c.map((ring) => sequence(ring, true)).join(" ");
  if (geometry.type === "MultiPolygon") return c.flatMap((p) => (p as unknown[]).map((ring) => sequence(ring, true))).join(" ");
  if (geometry.type === "LineString") return sequence(c, false);
  if (geometry.type === "MultiLineString") return c.map((line) => sequence(line, false)).join(" ");
  return "";
}
