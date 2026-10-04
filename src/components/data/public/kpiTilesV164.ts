import type { CardSummaryV140 } from "../../../data/cardSummariesV140";
import type { DecisionPointV159 } from "../../../data/structure/decisionPointsV159";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { periodSpanTileTextV164 } from "../../../data/visualization/dataPeriodV164";
import type { PeriodSpanV164 } from "../../../data/visualization/dataPeriodV164";
import { splitCdmActivitiesV164, withDirectoryKeysV164 } from "../../../data/visualization/directoryEntitiesV164";
import { directoryCountsV142 } from "../semantic/SemanticContractRendererV125";
import { regionScenarioShapeV138, stationNameCountV164, stationRowsV164 } from "./PublicRegionScenarioSummaryV138";

/**
 * V164-3 (R1): guards for the headline figure of the 데이터 설명 core-figure
 * strip. The strip prints the card summary's headline - a generated asset that
 * knows nothing of the screen it sits on - so it could state "0개 항목", a
 * count the page's own list does not reach, or a value of another series than
 * the one the 판단 포인트 and the chart show. Each helper here either corrects
 * the headline from the records the screen itself loaded or says it cannot be
 * kept; none of them estimates a value.
 */

export interface HeadlineV164 {
  value: string;
  label: string;
}

const SEGMENT_SEPARATOR_V164 = " · ";
const COUNT_UNITS_V164 = "곳|개|건|명|종|회";
/** Kinds whose headline is a measured value (a count headline is judged by its own rule). */
const VALUE_KINDS_V164 = new Set(["line", "level", "bars", "spatial", "spatial-trend", "composition"]);
/** The 판단 포인트 whose values are the screen's measured figures - what a headline value must be one of. */
// A total of the list's records (총액) is not a series value: a yearly figure never equals it.
const COMPARABLE_POINT_LABEL_V164 = /^(?:최신값|전망값|상위|하위|기준국 수준)/u;
// A long-run normal ("2,176 mm (1991–2020년)") is the period's average, not the series of a monthly extreme.
const NORMAL_PERIOD_VALUE_V164 = /\(\s*\d{4}\s*[–~-]\s*\d{4}\s*년?\s*\)/u;
const SERIES_POINT_LABEL_V164 = /^(?:최신값|전망값)/u;
const COUNT_POINT_LABEL_V164 = /^건수$/u;
const COUNT_POINT_LABELS_EXCLUDED_V164 = /^(?:건수|개체 수)$/u;

/** The numbers a text states: "293,088~295,646 MW" -> [293088, 295646]. */
export function numbersInTextV164(text: string | null | undefined): number[] {
  // The delivery and the 판단 포인트 both print a negative with the minus sign (U+2212) or a hyphen.
  return (String(text ?? "").replace(/\u2212/gu, "-").match(/-?\d[\d,]*(?:\.\d+)?/gu) || [])
    .map((token) => Number(token.replace(/,/gu, "")))
    .filter((value) => Number.isFinite(value));
}

function sameNumberV164(left: number, right: number): boolean {
  const gap = Math.abs(left - right);
  return gap <= 1e-9 || gap <= Math.abs(right) * 0.005;
}

// ---------------------------------------------------------------------------
// Zero counts
// ---------------------------------------------------------------------------

/** "0개 항목", "0개", "0곳": a count of nothing is not a core figure. */
export function isZeroCountV164(value: string): boolean {
  return new RegExp(`^0\\s*(?:${COUNT_UNITS_V164})(?:\\s+\\S.*)?$`, "u").test(value.trim());
}

const ZERO_COUNT_SEGMENT_V164 = new RegExp(`(?:^|[^\\d.,])0\\s*(?:${COUNT_UNITS_V164}|년)`, "u");
const COUNT_SEGMENT_V164 = new RegExp(`^(.*?)\\s*([1-9]\\d{0,2}(?:,\\d{3})*|[1-9]\\d*)\\s*(${COUNT_UNITS_V164})$`, "u");

function segmentsOfV164(label: string): string[] {
  return label.split(SEGMENT_SEPARATOR_V164).map((part) => part.trim()).filter(Boolean);
}

/** "…NAZCA 등재 행위자 0곳 · 0년 확인": the parts that count nothing are left out of a label. */
export function withoutZeroCountsV164(label: string): string {
  return segmentsOfV164(label).filter((part) => !ZERO_COUNT_SEGMENT_V164.test(part)).join(SEGMENT_SEPARATOR_V164);
}

/**
 * A headline of "0개" whose label names a count that is not zero ("지원제도 ·
 * 활용 사례 9건 · 2007–2027년") leads with that count instead. The first part
 * of the label named the thing that was zero; it goes with it.
 */
export function promotedCountV164(label: string): HeadlineV164 | null {
  const parts = segmentsOfV164(label);
  for (let index = 1; index < parts.length; index += 1) {
    const match = COUNT_SEGMENT_V164.exec(parts[index]);
    if (!match || !match[1].trim()) continue;
    const rest = parts.filter((_, other) => other !== 0 && other !== index);
    return { value: `${match[2]}${match[3]}`, label: [match[1].trim(), ...rest].join(SEGMENT_SEPARATOR_V164) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 판단 포인트 agreement
// ---------------------------------------------------------------------------

/** Does the label itself state the count ("지원제도 · 활용 사례 7건" states 7)? */
function labelStatesCountV164(label: string, count: number): boolean {
  return segmentsOfV164(label).some((part) => {
    const match = COUNT_SEGMENT_V164.exec(part);
    return match !== null && Number(match[2].replace(/,/gu, "")) === count;
  });
}

/** The count a screen's 판단 포인트 states for its records ("건수 110건"), or null. */
export function decisionPointCountV164(points: ReadonlyArray<DecisionPointV159>): number | null {
  const point = points.find((item) => COUNT_POINT_LABEL_V164.test(item.label.trim()));
  const numbers = point ? numbersInTextV164(point.value) : [];
  return numbers.length > 0 ? numbers[0] : null;
}

/**
 * Does the headline value appear among the values the 판단 포인트 state? null
 * when the 판단 포인트 hold no measured figure to compare with (no judgement).
 */
export function headlineAgreesWithPointsV164(headlineValue: string, points: ReadonlyArray<DecisionPointV159>): boolean | null {
  const comparable = points.filter(
    (item) => COMPARABLE_POINT_LABEL_V164.test(item.label.trim()) && !NORMAL_PERIOD_VALUE_V164.test(item.value)
  );
  if (comparable.length === 0) return null;
  const stated = points
    .filter((item) => !COUNT_POINT_LABELS_EXCLUDED_V164.test(item.label.trim()))
    .flatMap((item) => numbersInTextV164(item.value));
  const own = numbersInTextV164(headlineValue);
  if (own.length === 0 || stated.length === 0) return null;
  return own.some((value) => stated.some((other) => sameNumberV164(value, other)));
}

/**
 * The figure the 판단 포인트 lead with, as a headline: "59.1 점 (2024년)" with
 * the detail "사회 통합(SI) 기준" reads 59.1 점 · 사회 통합(SI) · 2024년.
 */
export function pointHeadlineV164(points: ReadonlyArray<DecisionPointV159>): HeadlineV164 | null {
  for (const point of points) {
    if (!SERIES_POINT_LABEL_V164.test(point.label.trim())) continue;
    const match = /^(-?\d[\d,]*(?:\.\d+)?\s*[^\d()\s][^()]*?)\s*(?:\((\d{4})년\))?$/u.exec(point.value.trim());
    if (!match) continue;
    const year = match[2] || /\((\d{4})년\)/u.exec(point.label)?.[1] || "";
    const basis = String(point.detail || "").replace(/\s*기준$/u, "").trim();
    const label = [basis || point.label.replace(/\(\d{4}년\)/u, "").trim(), year && `${year}년`].filter(Boolean).join(SEGMENT_SEPARATOR_V164);
    return { value: match[1].trim(), label };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Counts of the page's own lists
// ---------------------------------------------------------------------------

/**
 * A directory headline counted against the directory the page draws. E-002 lists
 * one authority and eleven CDM activities in one sheet: the card said "12곳 기관",
 * the directory heading says one institution and sets the activities apart. E-003
 * lists five contact persons at three organisations: the card said "기관 2곳".
 * Null when the page's list gives no reason to change the headline.
 */
export function directoryHeadlineV164(headline: HeadlineV164, entities: readonly VietnamEntityV124[]): HeadlineV164 | null {
  if (entities.length === 0) return null;
  // Only a count of places ("12곳") or an organisation count in the label can be a directory's.
  if (!/곳$/u.test(headline.value.trim()) && !/기관\s*[\d,]+곳/u.test(headline.label)) return null;
  const keyed = entities.map(withDirectoryKeysV164);
  const { institutions, activities } = splitCdmActivitiesV164(keyed);
  const counts = directoryCountsV142(institutions);
  const organisations = counts.organisations.length;
  const stated = /^([\d,]+)곳$/u.exec(headline.value.trim());
  if (activities.length > 0 && stated && Number(stated[1].replace(/,/gu, "")) === entities.length) {
    const note = `CDM 전환 활동 ${activities.length.toLocaleString("ko-KR")}건은 별도`;
    const parts = segmentsOfV164(headline.label);
    parts.splice(Math.min(1, parts.length), 0, note);
    return { value: `${organisations.toLocaleString("ko-KR")}곳`, label: parts.join(SEGMENT_SEPARATOR_V164) };
  }
  const named = /기관\s*([\d,]+)곳/u.exec(headline.label);
  if (named && counts.contacts > organisations && Number(named[1].replace(/,/gu, "")) !== organisations) {
    return { value: headline.value, label: headline.label.replace(named[0], `기관 ${organisations.toLocaleString("ko-KR")}곳`) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Regions and stations
// ---------------------------------------------------------------------------

/** Above this many rows a region delivery is a scenario x year table, not a list of regions. */
const REGION_COUNT_ROW_LIMIT_V164 = 4000;

function regionShapeV164(entities: readonly VietnamEntityV124[]) {
  try {
    return regionScenarioShapeV138([...entities]);
  } catch {
    // Rows of two region systems: the summary itself refuses them.
    return null;
  }
}

/**
 * A spatial headline that cannot be the screen's: its label names a river-basin
 * code ("Hydro BASINS lvl6 4060025450"), counts "40개 주 중" where the screen
 * has 8 divisions (the basin rows were counted as divisions), or is a
 * tide-gauge value labelled as a median of the scenario.
 */
export function spatialHeadlineUnsupportedV164(card: CardSummaryV140, headline: HeadlineV164, entities: readonly VietnamEntityV124[]): boolean {
  if (card.kind !== "spatial" && card.kind !== "spatial-trend" && card.kind !== "bars") return false;
  if (/\d{7,}/u.test(headline.label)) return true;
  if (entities.length === 0) return false;
  if (card.kind === "bars" && stationRowsV164(entities)) return true;
  const stated = /([\d,]+)개\s*\S+\s*중/u.exec(headline.label);
  // A scenario delivery (regions x scenarios x years, tens of thousands of rows) states its regions
  // right; counting them again would cost the page seconds, so only the one-row-per-region lists are counted.
  if (!stated || entities.length > REGION_COUNT_ROW_LIMIT_V164) return false;
  try {
    const shape = regionShapeV164(entities);
    return Boolean(shape) && shape!.regions.length > 1 && shape!.regions.length !== Number(stated[1].replace(/,/gu, ""));
  } catch {
    // Rows that are not region rows at all: nothing to compare the label with.
    return false;
  }
}

/**
 * What a region or station list covers, counted from its own rows: the third
 * figure of a strip whose headline could not be kept. Null for any other list.
 */
export function coverageFigureV164(entities: readonly VietnamEntityV124[]): { value: string; label: string } | null {
  if (entities.length === 0) return null;
  // Tide gauges are filed by station name, with or without the unit each stands in.
  const stationCount = stationRowsV164(entities) ? stationNameCountV164(entities) : 0;
  if (stationCount >= 2) return { value: `${stationCount.toLocaleString("ko-KR")}곳`, label: "관측소 수" };
  try {
    const shape = regionShapeV164(entities);
    if (!shape || shape.regions.length < 2) return null;
    return { value: `${shape.regions.length.toLocaleString("ko-KR")}곳`, label: "대상 지역 수" };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The headline as a whole
// ---------------------------------------------------------------------------

export interface HeadlineContextV164 {
  decisionPoints?: ReadonlyArray<DecisionPointV159>;
  entities?: readonly VietnamEntityV124[];
}

/**
 * The headline the strip may print, or null. Order: a zero count, then the
 * screen's own lists (directory, regions, stations), then the 판단 포인트. The
 * period text is the caller's (it swaps the card's period for the screen's).
 */
export function guardedHeadlineV164(card: CardSummaryV140, context: HeadlineContextV164 = {}): HeadlineV164 | null {
  let headline: HeadlineV164 = { value: card.headline.value, label: card.headline.label };
  if (isZeroCountV164(headline.value)) {
    const promoted = promotedCountV164(headline.label);
    if (!promoted) return null;
    headline = promoted;
  }
  headline = { value: headline.value, label: withoutZeroCountsV164(headline.label) };

  const entities = context.entities || [];
  if (spatialHeadlineUnsupportedV164(card, headline, entities)) return null;
  const directory = directoryHeadlineV164(headline, entities);
  if (directory) headline = directory;

  const points = context.decisionPoints || [];
  if (points.length === 0) return headline;
  const countStated = /^([\d,]+)\s*(곳|개|건|명)$/u.exec(headline.value.trim());
  if (countStated) {
    const pointCount = decisionPointCountV164(points);
    // Only a count of the list's own records follows the list: a measured series (a developer count
    // read from a table) and a count the label sets apart from the records ("지원제도 · 활용 사례 7건":
    // the label states the records, the headline counts something else) stay as they are.
    if (
      pointCount !== null &&
      pointCount !== Number(countStated[1].replace(/,/gu, "")) &&
      !card.measure &&
      !labelStatesCountV164(headline.label, pointCount)
    ) {
      return { value: `${pointCount.toLocaleString("ko-KR")}${countStated[2]}`, label: headline.label };
    }
    return headline;
  }
  if (!VALUE_KINDS_V164.has(card.kind)) return headline;
  const agrees = headlineAgreesWithPointsV164(headline.value, points);
  if (agrees === false) return pointHeadlineV164(points);
  return headline;
}

// ---------------------------------------------------------------------------
// The period tile
// ---------------------------------------------------------------------------

export interface PeriodTileV164 {
  value: string;
  unit: string;
  label: string;
}

/**
 * A period the card states as bare years ("2016–2026년", "2025–2030년 · 집중형
 * 태양광"). Anything else - "1991–2020년 평년값", "1950–2100년 (과거 모형 …)", a
 * collection date - is the card's own wording and is kept as it is.
 */
const PLAIN_PERIOD_V164 = /^\s*\d{4}(?:\s*[–~-]\s*\d{4})?\s*년?(?:\s*·\s*[^\d\s].*)?\s*$/u;

function periodUnitV164(text: string): string {
  return /([가-힣]+)$/u.exec(text.trim())?.[1] || "년";
}

/**
 * The period the tile states, from the screen's own records instead of the
 * card: the element's period statement when it has one (the source line's
 * wording), else the span of the loaded records when the card's period is bare
 * years. The card's period counts the collection year of a list ("2016–2026년"
 * for a list of 2016) and the years of every indicator, so the tile and the
 * source line named two periods. Null: keep the card's period as it is.
 */
export function screenPeriodTileV164(
  cardPeriod: string,
  context: { statement?: { label: string; text: string } | null; span?: PeriodSpanV164 | null }
): PeriodTileV164 | null {
  if (context.statement) {
    return { value: context.statement.text, unit: periodUnitV164(context.statement.text), label: context.statement.label };
  }
  const span = context.span;
  if (!span) return null;
  if (/\d{4}/u.test(cardPeriod) && !PLAIN_PERIOD_V164.test(cardPeriod)) return null;
  return { value: periodSpanTileTextV164(span), unit: "년", label: "자료기간" };
}
