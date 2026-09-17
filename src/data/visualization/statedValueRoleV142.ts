/**
 * What a row's stated value is, before anyone draws it.
 *
 * C-011 delivered emergency numbers (113 · 114 · 115), notice months
 * (2020 · 2023 · 11 · 3) and one homicide rate (1.54) in the same 값 column,
 * and the register comparison drew all eight on one axis under "단위 미기재"
 * (V141). A value is compared only when it is a measurement: a number whose
 * unit is stated, or whose indicator is defined as dimensionless. Phone
 * numbers, dates, identifiers, grades and free text keep their own role and
 * are never summed, averaged or drawn as bars (V142).
 */

export type StatedValueRoleV142 =
  | "measure"
  | "telephone"
  | "date"
  | "identifier"
  | "url"
  | "categorical"
  | "text"
  | "number-without-unit";

export interface StatedValueInputV142 {
  raw: unknown;
  /** The unit the row itself states (statedUnit / nationalMeasureUnit / a reviewed literal). */
  unit?: string | null;
  /** The measure the row itself names (지표명 / 전국_지표명). */
  measureName?: string | null;
  /** The unit of the row's indicator, from the element's semantics. */
  indicatorUnit?: string | null;
  indicatorUnitFamily?: string | null;
  /** 속성4_시점 / 기준연도 as delivered. */
  period?: unknown;
  title?: string | null;
  elementId?: string | null;
}

export interface StatedValueClassificationV142 {
  role: StatedValueRoleV142;
  /** The numeric value when the role is measure; null otherwise. */
  value: number | null;
  unit: string;
  /** Measurement identity; a shared unit alone is insufficient evidence. */
  measureKey: string | null;
  period: string | null;
  reason: string;
}

/** Indicator units that name something other than a measurement. */
const TELEPHONE_UNITS_V142 = /^(?:전화|전화번호|연락처|tel\.?|phone)$/iu;
const DATE_UNITS_V142 = /^(?:공지일|년월|연월|날짜|일자|연도|년도|발령일|date|year|month)$/iu;
const URL_UNITS_V142 = /^(?:url|링크|link)$/iu;
const IDENTIFIER_UNITS_V142 = /^(?:번호|식별번호|식별자|코드|id|identifier|code)$/iu;
const CATEGORICAL_UNITS_V142 = /^(?:등급|등급\(.*\)|경보색상|구분|상태|유형|분류|level|grade|category|status)$/iu;
/** Units under which an empty-unit number still is a measurement, when the indicator defines it. */
const DIMENSIONLESS_UNITS_V142 = /^(?:지수|점|점수|비|비\(倍\)|배|비율|index|score|ratio)$/iu;

/**
 * Elements and measure names whose empty unit means "dimensionless" by
 * definition. Listed explicitly: an empty unit on its own never makes a value
 * comparable. Nothing is registered yet; add a `${elementId}|${measureName}`
 * entry with the source definition beside it when a delivery states one.
 */
export const DIMENSIONLESS_MEASURE_DEFINITIONS_V142: ReadonlySet<string> = new Set<string>([]);

const TELEPHONE_TITLE_V142 = /신고|긴급|앰뷸런스|구급|대사관|영사관|연락처|전화|핫라인|hotline/u;
const IDENTIFIER_TITLE_V142 = /번호$|\bID$|코드$|code$/iu;

function textOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).normalize("NFC").replace(/\s+/gu, " ").trim();
}

function numberOf(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const trimmed = textOf(value).replace(/,/gu, "");
  if (!/^[-+]?\d+(?:\.\d+)?$/u.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** "(84) 24-3771-0404", "+84-24-2220-2828", "02-123-4567": grouped digits with separators. */
function looksLikeTelephone(text: string): boolean {
  if (!/^[+(]?\d/u.test(text)) return false;
  const digits = text.replace(/\D/gu, "");
  if (digits.length < 7 || digits.length > 15) return false;
  return /^\(?\+?\d{1,4}\)?[\s().-]*\d[\d\s().-]*$/u.test(text) && /[\s().-]/u.test(text);
}

/** "2026-07-13", "2026-07", "2026.07.13", "2026/07". */
function looksLikeDate(text: string): boolean {
  return /^(?:19|20|21)\d{2}[-./](?:0?[1-9]|1[0-2])(?:[-./](?:0?[1-9]|[12]\d|3[01]))?$/u.test(text);
}

function looksLikeUrl(text: string): boolean {
  // A host name ends in a letter-only label; "1.54" is a decimal.
  return /^(?:https?:\/\/|www\.)/iu.test(text) || /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?$/iu.test(text);
}

/**
 * A bare number that restates its own period is a date, not a quantity:
 * "발령 개시 · 2020 · 2020-03" and "최근 조정 관련 공지 · 11 · 2023-11".
 */
function numberIsPartOfPeriod(value: number, period: string): boolean {
  if (!period || !Number.isInteger(value)) return false;
  const parts = period.match(/\d+/gu) || [];
  if (parts.length === 0) return false;
  const [year, month, day] = parts;
  if (value >= 1900 && value <= 2100 && Number(year) === value) return true;
  if (month !== undefined && value >= 1 && value <= 12 && Number(month) === value) return true;
  if (day !== undefined && value >= 1 && value <= 31 && Number(day) === value) return true;
  return false;
}

export function classifyStatedValueV142(input: StatedValueInputV142): StatedValueClassificationV142 {
  const indicatorUnit = textOf(input.indicatorUnit);
  const indicatorUnitFamily = textOf(input.indicatorUnitFamily);
  // A row that states no unit of its own still measures something when its
  // indicator is defined with one (C-011's homicide rate: 건/10만명). A
  // text-family indicator unit ("전화", "등급") is a kind, not a unit.
  const indicatorMeasureUnit =
    indicatorUnit && indicatorUnitFamily && indicatorUnitFamily !== "text" && !TELEPHONE_UNITS_V142.test(indicatorUnit) && !DATE_UNITS_V142.test(indicatorUnit) && !URL_UNITS_V142.test(indicatorUnit) && !CATEGORICAL_UNITS_V142.test(indicatorUnit)
      ? indicatorUnit
      : "";
  const unit = textOf(input.unit) || indicatorMeasureUnit;
  const measureName = textOf(input.measureName) || null;
  const period = textOf(input.period) || null;
  const title = textOf(input.title);
  const raw = input.raw;
  const text = textOf(raw);
  const number = numberOf(raw);
  const measureKey = measureName;
  const result = (role: StatedValueRoleV142, reason: string, value: number | null = null): StatedValueClassificationV142 => ({
    role,
    value,
    unit,
    measureKey,
    period,
    reason,
  });

  if (raw === null || raw === undefined || text === "") return result("text", "no value");

  // The value's own shape comes first: an indicator's unit describes the
  // column's kind ("전화" on C-011's contact block), and the same block also
  // carries notice dates, links and sentences.
  if (looksLikeUrl(text)) return result("url", "value is a link");
  if (looksLikeDate(text)) return result("date", "value is a date");
  if (typeof raw === "string" && looksLikeTelephone(text)) return result("telephone", "value is a telephone number");
  if (TELEPHONE_UNITS_V142.test(unit)) return result("telephone", "row unit identifies a telephone");
  if (DATE_UNITS_V142.test(unit)) return result("date", "row unit identifies a date");
  if (IDENTIFIER_UNITS_V142.test(unit) || IDENTIFIER_UNITS_V142.test(indicatorUnit)) return result("identifier", "unit identifies a code");
  if (URL_UNITS_V142.test(unit)) return result("url", "row unit identifies a link");

  if (number === null) {
    // URL-family columns can also contain narrative observations. Only an
    // actual address is a link (already checked above), not every row in it.
    if (DATE_UNITS_V142.test(indicatorUnit) || DATE_UNITS_V142.test(unit)) return result("date", "indicator unit is a date");
    if (CATEGORICAL_UNITS_V142.test(indicatorUnit) || CATEGORICAL_UNITS_V142.test(unit)) return result("categorical", "indicator unit is a grade or class");
    return result("text", "value is not a number");
  }

  // A number under a telephone indicator or a contact heading is a number to dial.
  const dialable = Number.isInteger(number) && number >= 100 && number <= 999999999999999;
  if (dialable && !unit && (TELEPHONE_UNITS_V142.test(indicatorUnit) || TELEPHONE_TITLE_V142.test(title))) {
    return result("telephone", "number under a telephone indicator or contact heading");
  }
  if (!unit && DIMENSIONLESS_UNITS_V142.test(indicatorUnit) && measureName) return result("measure", "indicator defined as dimensionless", number);
  if (!unit && (DATE_UNITS_V142.test(indicatorUnit) || (period && numberIsPartOfPeriod(number, period)))) {
    return result("date", "number states a date or restates the row's period");
  }
  if (!unit && IDENTIFIER_TITLE_V142.test(title)) return result("identifier", "number under an identifier heading");
  if (CATEGORICAL_UNITS_V142.test(indicatorUnit) || CATEGORICAL_UNITS_V142.test(unit)) return result("categorical", "graded value");

  if (unit) return result("measure", DIMENSIONLESS_UNITS_V142.test(unit) ? "number with a stated dimensionless unit" : "number with a stated unit", number);
  if (DIMENSIONLESS_UNITS_V142.test(indicatorUnit) && measureName) return result("measure", "indicator defined as dimensionless", number);
  if (input.elementId && measureName && DIMENSIONLESS_MEASURE_DEFINITIONS_V142.has(`${input.elementId}|${measureName}`)) {
    return result("measure", "registered dimensionless measure", number);
  }
  return result("number-without-unit", "number without a stated unit is not compared");
}

export interface ComparableStatedValueV142 {
  recordId: string;
  title: string;
  value: number;
  unit: string;
  measureKey: string | null;
  period: string | null;
}

/**
 * The rows a register comparison may draw together: measurements sharing one
 * measure, one unit and one period (or no period at all). Rows of the same
 * measure at different periods are a trend, not a comparison, and stay out.
 */
export function comparableStatedValuesV142<T extends ComparableStatedValueV142>(rows: T[], minimum = 3): T[] {
  const groups = new Map<string, T[]>();
  rows.forEach((row) => {
    if (!row.measureKey || !row.unit || !Number.isFinite(row.value)) return;
    const key = `${row.measureKey || ""}|${row.unit}|${row.period || ""}`;
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  // The largest group only: two different measures side by side would be the
  // same mistake with a different unit string.
  const largest = [...groups.values()].sort((a, b) => b.length - a.length)[0] || [];
  return largest.length < minimum ? [] : largest;
}
