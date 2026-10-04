import type {
  VietnamEntityV124,
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
} from "../vietnam/vietnamTypesV124";

/**
 * V164-3 (R1): the period a detail screen states for the data it draws.
 *
 * The source line ("자료기간 …") and the 자료기간 tile of 데이터 설명 used to read
 * two different fields - the line the loaded observations' years, the tile the
 * card summary's period - so one screen could state "2016" and "2016–2026년"
 * (BGD A-013), or "2099~2100" and "1950–2100년" (BGD B-006). Both now read the
 * span this module derives from the records the screen itself loaded.
 *
 * Order of trust (the first source that yields a year wins; nothing is joined
 * across sources):
 *   1. the years of the observations that carry a value;
 *   2. the year columns of the entity rows ("연도", "기준연도" … - the row's own
 *      year, never a project start or a target year);
 *   3. the indicators' stated time range ("1961-2016");
 *   4. the indicators' reference year.
 */
export interface PeriodSpanV164 {
  first: number;
  last: number;
}

export interface PeriodSourcesV164 {
  observations?: ReadonlyArray<Pick<VietnamObservationV124, "value" | "year" | "period">>;
  entities?: ReadonlyArray<Pick<VietnamEntityV124, "normalizedAttributes">>;
  indicators?: ReadonlyArray<Pick<VietnamIndicatorMetaV124, "timeRange" | "referenceYear">>;
}

const YEAR_TOKEN_V164 = /(?:19|20|21)\d{2}/gu;
/** Columns whose value is the year of the row itself. */
const ENTITY_YEAR_KEY_V164 = /^(?:연도|년도|year|기준연도|관측연도|회계연도|보고연도)$/iu;
/** Columns whose value is a period such as "1995-2014" (a climate normal). */
const ENTITY_PERIOD_KEY_V164 = /^(?:기간_평년|기간|period)$/iu;
const PURE_RANGE_V164 = /^\s*((?:19|20|21)\d{2})\s*[-–~]\s*((?:19|20|21)\d{2})\s*$/u;

/** The four-digit years a text states, in order. */
export function yearsInTextV164(value: unknown): number[] {
  if (value === null || value === undefined) return [];
  return (String(value).match(YEAR_TOKEN_V164) || []).map(Number);
}

function hasValueV164(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  return typeof value !== "number" || Number.isFinite(value);
}

function spanOfV164(years: readonly number[]): PeriodSpanV164 | null {
  // A loop, not Math.min(...years): a region delivery has tens of thousands of rows.
  let first = Infinity;
  let last = -Infinity;
  for (const year of years) {
    if (!Number.isFinite(year)) continue;
    if (year < first) first = year;
    if (year > last) last = year;
  }
  return first <= last ? { first, last } : null;
}

function observationYearsV164(observations: PeriodSourcesV164["observations"]): number[] {
  const years: number[] = [];
  for (const row of observations || []) {
    if (!hasValueV164(row.value)) continue;
    if (row.year) years.push(Number(row.year));
    else years.push(...yearsInTextV164(row.period));
  }
  return years;
}

function entityYearsV164(entities: PeriodSourcesV164["entities"]): number[] {
  const years: number[] = [];
  for (const entity of entities || []) {
    for (const [rawKey, value] of Object.entries(entity.normalizedAttributes || {})) {
      if (!hasValueV164(value)) continue;
      // The numbered-slot templates prefix a column with its slot ("속성3_연도").
      const key = rawKey.replace(/^속성\d+_?/u, "");
      if (ENTITY_YEAR_KEY_V164.test(key)) {
        // A year, or one cell holding a short run of years; a cell with a date keeps its year.
        years.push(...yearsInTextV164(value));
      } else if (ENTITY_PERIOD_KEY_V164.test(key)) {
        const range = PURE_RANGE_V164.exec(String(value));
        if (range) years.push(Number(range[1]), Number(range[2]));
      }
    }
  }
  return years;
}

/** The span of the data the loaded records state, or null when none states a year. */
export function dataPeriodSpanV164(sources: PeriodSourcesV164): PeriodSpanV164 | null {
  const fromObservations = spanOfV164(observationYearsV164(sources.observations));
  if (fromObservations) return fromObservations;
  const fromEntities = spanOfV164(entityYearsV164(sources.entities));
  if (fromEntities) return fromEntities;
  const indicators = sources.indicators || [];
  const fromRange = spanOfV164(indicators.flatMap((item) => yearsInTextV164(item.timeRange)));
  if (fromRange) return fromRange;
  return spanOfV164(indicators.flatMap((item) => yearsInTextV164(item.referenceYear)));
}

/** "2015~2026", or "2016" for one year: how the source line states a span. */
export function periodSpanLineTextV164(span: PeriodSpanV164): string {
  return span.first === span.last ? String(span.first) : `${span.first}~${span.last}`;
}

/** "2015–2026년", or "2016년": how the 자료기간 tile states a span. */
export function periodSpanTileTextV164(span: PeriodSpanV164): string {
  return span.first === span.last ? `${span.first}년` : `${span.first}–${span.last}년`;
}
