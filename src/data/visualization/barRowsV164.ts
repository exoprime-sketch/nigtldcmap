import { gradeRankV164, koreanCategoryV164 } from "./publicCategoryLabelV164";

/**
 * V164-3 (WP-E): what a bar or a legend of the semantic renderer says about its rows.
 *
 * Pure functions on the slice of an observation row they read, so the renderer
 * stays a thin caller and every rule is tested on its own:
 * - which dimension names a bar (a value that is the same on every row names nothing),
 * - what the bar axis is called (the contract's axis unless the rows contradict it),
 * - which measures of one unit must not share a bar scale (an average and a total),
 * - how a climatology is dated ("1991-2020 평년", not "1991"),
 * - legend text without a delivery key and with Korean names for known classifications.
 *
 * Nothing here invents a value or a name: text is chosen, cut or translated from
 * the dictionary, never composed from guesses.
 */

/** The slice of an observation row these helpers read. */
export interface BarRowShapeV164 {
  dimensions?: Record<string, string> | null;
  dimensionLabels?: Record<string, string> | null;
  period?: string | null;
  year?: number | null;
  displayLabel?: string | null;
  indicatorId?: string | null;
  semanticMeasure?: { labelKo?: string | null } | null;
}

/** The dimensions a bar can be named after, in the order they are preferred. */
export const CATEGORY_LABEL_KEYS_V164: readonly string[] = ["category", "scenario", "technology", "region", "province", "detail", "sex"];

function dimensionValueV164(row: BarRowShapeV164, key: string): string {
  return String(row.dimensionLabels?.[key] || row.dimensions?.[key] || "");
}

/**
 * The label keys of a set of rows, constants last.
 *
 * A dimension that holds the same value on every row cannot tell the bars apart:
 * BGD A-024 carried technology "24" on all three rows and named each bar after
 * that technology instead of after its own detail, and VNM B-009 and BGD B-013
 * did the same with technology "30,35" and "범용". A key that varies comes before
 * one that does not; among keys of the same kind the preferred order stays.
 * One row has nothing to vary against, so the preferred order is kept.
 */
export function categoryLabelKeysV164(rows: readonly BarRowShapeV164[]): string[] {
  if (rows.length < 2) return [...CATEGORY_LABEL_KEYS_V164];
  const varying: string[] = [];
  const constant: string[] = [];
  for (const key of CATEGORY_LABEL_KEYS_V164) {
    const seen = new Set(rows.map((row) => dimensionValueV164(row, key)));
    (seen.size > 1 ? varying : constant).push(key);
  }
  return [...varying, ...constant];
}

/** The first key of `keys` the row has a value for, or null when it has none. */
export function categoryLabelSourceV164(row: BarRowShapeV164, keys: readonly string[] = CATEGORY_LABEL_KEYS_V164): string | null {
  return keys.find((key) => dimensionValueV164(row, key) !== "") ?? null;
}

/** What each source of a bar label calls the axis. Kept in step with publicDimensionLabelV126. */
const SOURCE_AXIS_V164: Readonly<Record<string, string>> = {
  category: "분류",
  scenario: "시나리오",
  technology: "기술",
  region: "지역",
  province: "성·시",
  detail: "세부 분류",
  sex: "성별",
  occupation: "직군",
  __countryIso3__: "국가",
  // The bar is named by the row's own indicator label.
  measure: "지표",
};

/** The source that names most of the bars; ties keep the first one met. */
export function dominantSourceV164(sources: ReadonlyArray<string | null>): string {
  const counts = new Map<string, number>();
  for (const source of sources) {
    const key = source || "measure";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = "measure";
  let bestCount = -1;
  counts.forEach((count, key) => {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  });
  return best;
}

const TIME_AXIS_V164 = /연도|년도|기간|시점|분기|^월$/u;
const TECH_AXIS_V164 = /기술/u;
const TIME_LABEL_V164 = /(?:^|\D)(?:19|20)\d{2}(?:\D|$)|\d{1,2}월|분기|FY\s?\d{2}/iu;
const TECH_LABEL_V164 = /기술|발전|태양|풍력|수력|바이오|폐자원|지열|원자력|수소|저장|CCUS|연료전지|전기차|송배전/u;

/**
 * What the bars are, for the axis line above them.
 *
 * The contract names the axis its author expected ("연도", "발전기술"); the rows
 * decide whether that held. D-009 and E-009 are contracted as "연도" but draw one
 * bar per indicator, and BGD D-003 is contracted as "발전기술" but draws reduction
 * rates by category. Only that kind of contradiction is overridden - a time axis
 * whose bars are not dated, a technology axis whose bars are not technologies -
 * and the axis then reads what the bars are named after. Any other contract axis,
 * a generic "비교 항목" included, stands as the contract wrote it; with no contract
 * the axis is what the bars are named after.
 */
export function barAxisLabelV164(contractAxis: string | null | undefined, source: string | null, labels: readonly string[]): string {
  const derived = SOURCE_AXIS_V164[source || "measure"];
  const axis = String(contractAxis ?? "").trim();
  if (!axis) return derived || "비교 항목";
  if (!derived || labels.length === 0) return axis;
  const dated = labels.filter((label) => TIME_LABEL_V164.test(label)).length;
  if (TIME_AXIS_V164.test(axis) && dated * 2 < labels.length) return derived;
  const technical = labels.filter((label) => TECH_LABEL_V164.test(label)).length;
  if (TECH_AXIS_V164.test(axis) && source !== "technology" && technical * 2 < labels.length) return derived;
  return axis;
}

export type ScaleKindV164 = "all" | "average" | "total";

const AVERAGE_LABEL_V164 = /(?:^|[\s·(])(?:평균|중앙값)|\b(?:mean|median|avg)\b/iu;
const TOTAL_LABEL_V164 = /(?:^|[\s·(])(?:총|합계|누계|전체\s*합)|\btotal\b/iu;

/**
 * Bars of one unit that must not share a scale.
 *
 * A mean and a total can carry the same unit and be 10^6 apart (A-026: a mean
 * floor area of 150 m2 beside a total of 2.1 billion m2), so on a shared scale
 * the mean is no bar at all. When a unit group holds both an average-like and a
 * total-like label and the largest value is at least 100 times the smallest, the
 * averages are drawn on their own scale and the rest on theirs. Anything else,
 * different denominators of the same unit included (D-008), is left whole:
 * nothing in the data says those apart.
 */
export function splitScaleGroupsV164<T>(items: readonly T[], labelOf: (item: T) => string, valueOf: (item: T) => number): Array<{ kind: ScaleKindV164; items: T[] }> {
  const whole = [{ kind: "all" as ScaleKindV164, items: [...items] }];
  if (items.length < 2) return whole;
  const averages = items.filter((item) => AVERAGE_LABEL_V164.test(labelOf(item)));
  const totals = items.filter((item) => TOTAL_LABEL_V164.test(labelOf(item)) && !AVERAGE_LABEL_V164.test(labelOf(item)));
  if (averages.length === 0 || totals.length === 0) return whole;
  const magnitudes = items.map((item) => Math.abs(valueOf(item))).filter((value) => value > 0);
  if (magnitudes.length < 2 || Math.max(...magnitudes) < Math.min(...magnitudes) * 100) return whole;
  const rest = items.filter((item) => !averages.includes(item));
  return [
    { kind: "average", items: averages },
    { kind: "total", items: rest },
  ];
}

/** How a split group is told apart in its heading. */
export function scaleKindLabelV164(kind: ScaleKindV164): string {
  return kind === "average" ? "평균값" : kind === "total" ? "합계" : "";
}

const NORMALS_LABEL_V164 = /(\d{4})\s*[-–~]\s*(\d{4})\s*평년/u;
const PERIOD_RANGE_V164 = /^\s*(\d{4})\s*[-–~]\s*(\d{4})\s*$/u;

/** A climatology's span ("1991-2020 평년"), from the row's period or the label that names it. */
function periodRangeV164(row: BarRowShapeV164): { from: string; to: string; normals: boolean } | null {
  const labelled = [row.displayLabel, row.semanticMeasure?.labelKo, ...Object.values(row.dimensionLabels || {}), ...Object.values(row.dimensions || {})]
    .map((text) => NORMALS_LABEL_V164.exec(String(text ?? "")))
    .find((match): match is RegExpExecArray => match !== null);
  if (labelled && labelled[1] !== labelled[2]) return { from: labelled[1], to: labelled[2], normals: true };
  const range = PERIOD_RANGE_V164.exec(String(row.period ?? ""));
  if (range && range[1] !== range[2]) return { from: range[1], to: range[2], normals: Boolean(labelled) };
  return null;
}

/**
 * The time a row is dated by, as a bare phrase: "1991–2020 평년" for a climatology
 * (its year column holds only the first year of the span), "2025–2030" for a
 * period, otherwise the year, otherwise the period text.
 */
export function observationTimeTextV164(row: BarRowShapeV164): string {
  const range = periodRangeV164(row);
  if (range) return range.normals ? `${range.from}–${range.to} 평년` : `${range.from}–${range.to}`;
  return String(row.year || row.period || "");
}

/** The same with a year's "년": "2024년", "1991–2020 평년", "2025–2030년". */
export function observationYearTextV164(row: BarRowShapeV164): string {
  const text = observationTimeTextV164(row);
  return text !== "" && !/평년$/u.test(text) && /^\d{4}(?:–\d{4})?$/u.test(text) ? `${text}년` : text;
}

/** A segment that is a delivery key ("D006_carbon_tax_…", "EMP_TEMP_SEX_OCU_NB_A", "occupation_employment_share_armed_male"). */
const RAW_KEY_SEGMENT_V164 = /^(?:[A-Z]{1,3}-?\d{2,4}_[A-Za-z0-9_]+|[A-Z][A-Z0-9]*(?:_[A-Z0-9]+){2,}|[a-z][a-z0-9]*(?:_[a-z0-9]+){2,})$/u;

/**
 * A legend or bar label without the delivery's keys. The delivery appended its
 * own column and indicator keys to the readable label with " · "; the readable
 * part stays. Returns "" when nothing readable is left, so the caller falls back
 * to the measure's name.
 */
export function withoutRawKeysV164(label: string): string {
  const text = String(label ?? "");
  const parts = text.split(/\s+·\s+/u);
  const kept = parts.filter((part) => !RAW_KEY_SEGMENT_V164.test(part.trim()));
  if (kept.length === parts.length) return text;
  return kept.join(" · ").trim();
}

/** A trailing "(…)" or "[…]" of a segment, kept as it was while the name before it is translated. */
const SEGMENT_TAIL_V164 = /^(.*?)(\s*[[(][^\])]*[\])])$/u;

function koreanSegmentV164(segment: string): string {
  const trimmed = segment.trim();
  const whole = koreanCategoryV164(trimmed);
  if (whole !== trimmed) return segment.replace(trimmed, () => whole);
  const tail = SEGMENT_TAIL_V164.exec(trimmed);
  if (!tail || !tail[1].trim()) return segment;
  const base = koreanCategoryV164(tail[1].trim());
  return base === tail[1].trim() ? segment : segment.replace(trimmed, () => `${base}${tail[2]}`);
}

/**
 * A legend or bar label with its English classification values in Korean.
 * Each " · " or " — " segment is translated only when the whole segment is a
 * value the dictionary knows; a proper name (an institution, a project) and every
 * unknown value stay as delivered.
 */
export function koreanLegendLabelV164(label: string): string {
  return String(label ?? "")
    .split(/(\s+[·—]\s+)/u)
    .map((part, index) => (index % 2 === 1 ? part : koreanSegmentV164(part)))
    .join("");
}

/** Equal labels get " · 계열 N" so a legend never lists two entries a reader cannot tell apart. */
export function numberDuplicateLabelsV164(labels: readonly string[]): string[] {
  const total = new Map<string, number>();
  labels.forEach((label) => total.set(label, (total.get(label) || 0) + 1));
  const seen = new Map<string, number>();
  return labels.map((label) => {
    if ((total.get(label) || 0) < 2) return label;
    const index = (seen.get(label) || 0) + 1;
    seen.set(label, index);
    return `${label} · 계열 ${index}`;
  });
}

/** An indicator the delivery marked as an auxiliary source ("A-030_aux_kita_trade_total"). */
export function isAuxIndicatorV164(indicatorId: string | null | undefined): boolean {
  return /_aux_/u.test(String(indicatorId ?? ""));
}

/** A legend label that says it is the auxiliary source: "[보조] X" and "X" both read "X (보조 자료)". */
export function auxSeriesLabelV164(label: string): string {
  const base = String(label ?? "").replace(/^\s*\[보조\]\s*/u, "").trim();
  return /보조/u.test(base) ? base : `${base} (보조 자료)`;
}

/**
 * The place of a water-risk grade in a grade table: the six grades low to
 * extremely high by their own order, the arid class after them, "No Data" last,
 * anything else after that in the order it came.
 */
export function gradeOrderV164(grade: string): number {
  const rank = gradeRankV164(grade);
  if (rank !== null) return rank;
  const text = String(grade ?? "").trim().toLowerCase();
  if (text.startsWith("arid")) return 7;
  if (text === "no data" || text === "자료 없음") return 8;
  return 99;
}
