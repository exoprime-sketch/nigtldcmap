/**
 * V164: the wording of the detail page's small map (DetailLocationMapV148), as pure functions.
 *
 * The small map used to say things the data does not:
 * - every line layer was "송전선 경로" with a 110/220/500 kV legend (the road and rail network, A-027, has no voltage);
 * - its title carried the layer's default selector period ("2024") over a register spanning 1952-2024,
 *   or a delivery year ("2026") over observations of 1997-2024;
 * - "8개 주 기준" under seven coloured divisions, with no word on the eighth.
 *
 * Nothing here reads a file or the DOM; the component hands in what it loaded.
 */

type PropertiesV164 = { properties?: Record<string, unknown> | null };

/** A line layer is drawn by voltage when its segments carry one; otherwise it is a route network. */
export type LineMapKindV164 = "voltage" | "route";

const voltageOf = (feature: PropertiesV164): number => Number(feature.properties?.voltageKv ?? feature.properties?.voltage);

export function lineMapKindV164(features: ReadonlyArray<PropertiesV164>): LineMapKindV164 {
  return features.some((feature) => Number.isFinite(voltageOf(feature)) && voltageOf(feature) > 0) ? "voltage" : "route";
}

export function lineMapTitleV164(kind: LineMapKindV164): string {
  return kind === "voltage" ? "송전선 경로" : "노선 위치";
}

/** A line segment's name in the selection list when it has none of its own ("110 kV 선로 3", "철도 구간 3"). */
export function lineFeatureFallbackLabelV164(properties: Record<string, unknown> | null | undefined, categoryFields: readonly string[], index: number): string {
  const props = properties || {};
  const kv = Number(props.voltageKv ?? props.voltage);
  if (Number.isFinite(kv) && kv > 0) return `${kv} kV 선로 ${index + 1}`;
  const category = categoryFields.map((field) => props[field]).find((value) => typeof value === "string" && value !== "");
  return `${category ? `${category} ` : "노선 "}구간 ${index + 1}`;
}

/** Does a line segment belong to the variable the map is showing ("all", a voltage, or a class such as "철도")? */
export function lineMatchesVariableV164(feature: PropertiesV164, variable: string, categoryFields: readonly string[]): boolean {
  if (variable === "all") return true;
  if (String(feature.properties?.voltageKv ?? feature.properties?.voltage) === variable) return true;
  return categoryFields.some((field) => String(feature.properties?.[field] ?? "") === variable);
}

/**
 * How many segments each class has ("고속도로 868", "철도 217"), counted over the layer's own filter
 * field. Empty when no segment carries a text value in any of the fields.
 */
export function lineCategoryCountsV164(
  features: ReadonlyArray<PropertiesV164>,
  categoryFields: readonly string[],
  order: readonly string[] = []
): Array<{ label: string; count: number }> {
  const field = categoryFields.find((candidate) => features.some((feature) => typeof feature.properties?.[candidate] === "string" && feature.properties[candidate] !== ""));
  if (!field) return [];
  const counts = new Map<string, number>();
  for (const feature of features) {
    const value = feature.properties?.[field];
    if (typeof value !== "string" || !value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  const rank = (label: string) => {
    const index = order.indexOf(label);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => rank(a.label) - rank(b.label) || b.count - a.count);
}

interface RecordLikeV164 {
  normalizedAttributes?: Record<string, unknown> | null;
  /** A map asset's flat feature properties (another country's point files carry no normalizedAttributes). */
  properties?: Record<string, unknown> | null;
  provenance?: { referenceYear?: unknown } | null;
}

const YEAR_ATTRIBUTES_V164 = ["기준연도", "연도", "자료연도"];
const DATE_ATTRIBUTES_V164 = ["시작일", "발생일", "startDate"];
const YEAR_PATTERN_V164 = /^(\d{4})(?!\d)/u;

/** The year a record states for itself: its reference year, else the year of its start date. */
export function recordYearV164(record: RecordLikeV164): number | null {
  const attributes = record.normalizedAttributes || record.properties || {};
  for (const key of [...YEAR_ATTRIBUTES_V164, ...DATE_ATTRIBUTES_V164]) {
    const match = String(attributes[key] ?? "").trim().match(YEAR_PATTERN_V164);
    if (match) {
      const year = Number(match[1]);
      if (year >= 1800 && year <= 2200) return year;
    }
  }
  const stated = String(record.provenance?.referenceYear ?? "").trim().match(YEAR_PATTERN_V164);
  if (stated) {
    const year = Number(stated[1]);
    if (year >= 1800 && year <= 2200) return year;
  }
  return null;
}

/** The first and last year the drawn records state; null when none states one. */
export function recordYearSpanV164(records: ReadonlyArray<RecordLikeV164>): { first: number; last: number } | null {
  let first = Infinity;
  let last = -Infinity;
  for (const record of records) {
    const year = recordYearV164(record);
    if (year === null) continue;
    first = Math.min(first, year);
    last = Math.max(last, year);
  }
  return Number.isFinite(first) ? { first, last } : null;
}

/**
 * Event and observation registers: their title says the years the drawn records cover ("1952–2024"),
 * not the layer's selector period ("2024"). A projection layer (B-008's 2100) keeps its own period.
 */
const RECORD_YEAR_SPAN_ELEMENTS_V164: ReadonlySet<string> = new Set(["B-012", "B-023", "B-028"]);

export function usesRecordYearSpanV164(elementId: string): boolean {
  return RECORD_YEAR_SPAN_ELEMENTS_V164.has(elementId);
}

/**
 * Layers whose records state no year and whose selector period is only the delivery year
 * (HydroBASINS basins: the file carries no reference year). Keyed "ISO3:element".
 */
export const NO_REFERENCE_YEAR_LAYERS_V164: ReadonlySet<string> = new Set(["VNM:B-025"]);

/**
 * The period a point layer's title shows: the span of the years its drawn records state, else the
 * layer's selector period - except where that period is only a delivery year ("" then). A joined
 * layer (national figures on the host's mines) says what the year belongs to.
 */
export function pointPeriodLabelV164(input: {
  span: { first: number; last: number } | null;
  selectorPeriod: string;
  /** The selector period is a delivery year, not a year of the data. */
  selectorPeriodIsDeliveryYear?: boolean;
  /** National figures drawn on another layer's sites (B-044/B-046/B-047 on B-048's mines). */
  joinedToHostSites?: boolean;
}): string {
  const { span, selectorPeriod, selectorPeriodIsDeliveryYear, joinedToHostSites } = input;
  if (span) return span.first === span.last ? String(span.first) : `${span.first}–${span.last}`;
  if (!selectorPeriod || selectorPeriodIsDeliveryYear) return "";
  return joinedToHostSites ? `광산 위치 기준 ${selectorPeriod}` : selectorPeriod;
}

/**
 * "8개 주(Division) 중 7개에 값 있음 · 값 없음: 마이멘싱" - said when a level-1 map has fewer values
 * than units. Empty when every unit has one (or there is nothing to count).
 */
export function regionCoverageCaptionV164(input: { valued: number; total: number; unitWord: string; missing: readonly string[] }): string {
  const { valued, total, unitWord, missing } = input;
  if (total <= 0 || valued >= total) return "";
  const names = missing.filter(Boolean);
  return `${total}개 ${unitWord} 중 ${valued}개에 값 있음${names.length ? ` · 값 없음: ${names.join(", ")}` : ""}`;
}

/** The note under a map whose layer has nothing to place (an empty map says nothing). */
export const NO_SITES_NOTE_V164 = "이 자료에는 지도에 표시할 위치가 없습니다. 값과 내용은 이 화면의 차트·표와 상세 데이터에서 확인할 수 있습니다.";
