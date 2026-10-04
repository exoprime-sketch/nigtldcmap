import { displayUnitV150 } from "../visualization/unitDisplayV150";
import { publicScaledNumberV136_2 } from "../../utils/publicNumberScaleV136_2";
import { isSourceSubtotalV164, isTotalCategoryV164, localizedEnergyCategoryV164 } from "../visualization/energyCategoryV164";
import { publicGasNameV163 } from "../visualization/seriesLabelV163";
import { visualizationContractV153 } from "../visualization/publicVisualizationContractV153";
import { PROVINCE_KO_V150 } from "../map/mapBackdropV150";
import { PROVINCE_KO_34_V151 } from "../map/adminBoundaryV151";
import { formatRegionName } from "../geo/regionNameV161";
import { CLIMATE_TECHNOLOGIES } from "../climateTechnologyCatalog";
import type { DisplayTypeV159 } from "../spec/specTypesV159";
import type {
  S1CountryObservationV159,
  S2RegionObservationV159,
  S3LocatedEntityV159,
  S4EntityV159,
  StructureRowsV159,
} from "./structureTypesV159";

/**
 * The region's name as a reader should see it, or null when the platform cannot
 * name it. A region key ("VN-45", "VN34-SG") is an internal identifier: it is
 * resolved through the province dictionary, and never printed as it stands.
 */
function regionDisplayNameV159(row: {
  regionName?: string | null;
  regionKey?: string | null;
  regionSystem?: string | null;
}, country = "VNM"): string | null {
  const stated = String(row.regionName ?? "").trim();
  // V162 (P12-B): the row's own boundary system picks the dictionary level
  // (63 pre-2025 provinces or the 34 units) for a name both lists share.
  const level = row.regionSystem === "adm1-34" || row.regionSystem === "adm1-63" ? row.regionSystem : undefined;
  if (stated && !/^VN3?4?-?[0-9A-Z]{2}$/u.test(stated)) {
    return formatRegionName({ country, raw: stated, level });
  }
  const key = String(row.regionKey ?? "").trim();
  const korean = PROVINCE_KO_V150[key] || PROVINCE_KO_34_V151[key];
  return korean ? formatRegionName({ country: "VNM", raw: korean }) : null;
}

export interface DecisionPointV159 {
  key: string;
  label: string;
  value: string;
  detail?: string;
}

export interface DecisionPointsOptsV159 {
  /** Contract-listed indicator ids for the element's headline series, in priority order. */
  headlineIndicatorIds?: string[];
  countryIso3: string;
  /**
   * Spec v8: a fixed reference country (typology referenceCountryIso3, E-017
   * Korea). A ③ element without technology rows then reads that country
   * against the other delivered subjects: its level, its rank, the gap to the
   * top subject.
   */
  referenceCountryIso3?: string | null;
  /** How a subject code prints (e.g. EUU → 유럽연합(EU)); the code itself otherwise. */
  countryLabel?: (iso3: string) => string;
  /**
   * V164: the indicator ids the page's first chart actually draws (the page
   * reads them from `data-indicator-id`). When given, the headline is chosen
   * among them so the card and the chart name the same series.
   */
  drawnIndicatorIds?: readonly string[];
  /** V164: "today" as YYYY-MM-DD; defaults to the current date. Nothing dated after it is "latest" or "approved". */
  asOfDate?: string;
}

/**
 * Fixed points per display type (docs/plan/V159_데이터유형화_명세.md §1 "판단
 * 포인트" column). Every rule reads only what the rows already carry: no
 * point estimates a missing input, and a point whose inputs are absent is
 * left out of the returned list rather than shown empty or zero-filled.
 *
 * | type | points | hidden when |
 * |---|---|---|
 * | U1 | 최신값·연도 · 최근 5년 방향 · 10개국 중 순위 | rank: fewer than 2 countries have the headline indicator at its latest year |
 * | U2 | 상위/하위 3개 지역 · 전국 대비 | fewer than six distinct named regions / no national row (전국 대비 only) |
 * | U3 | 값이 큰 기술 상위 3 · 기술별 값·출처연도 | no rows carry a techId |
 * | U3 (reference country, v8) | 기준국 수준 · N개국 중 순위 · 최고국과 격차 | no tech rows and fewer than 2 subjects at the latest year |
 * | U3·S4 records (v8, decisionPointsU3RecordsV159) | 총 건수(구분별) · 건수 상위 기술 분야 3 | no record carries a technology field |
 * | U4 | 개체 수 · 규모 합계 · 분류 구성 | 합계: populated sizes use more than one unit; placeholder rows are not entities |
 * | U5 | 건수 · 총액 · 기관 상위 3 · 최근 승인 | 총액: populated amounts use more than one currency; 기관·최근 승인: fewer than half of the records state them |
 * | U6 | 최신 개정 · 상태 · 적용지역 · 인센티브 유무 | 적용지역: no row carries a region tag; 인센티브: no row text names one |
 */
export function decisionPointsV159(
  displayType: DisplayTypeV159,
  rows: StructureRowsV159,
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  switch (displayType) {
    case "U1":
      return rows.structure === "S1" ? decisionPointsU1(rows.rows, opts) : [];
    case "U2":
      return rows.structure === "S2" ? decisionPointsU2(rows.rows, opts) : [];
    case "U3":
      return rows.structure === "S1" ? decisionPointsU3(rows.rows, opts) : [];
    case "U4":
      return rows.structure === "S3" ? decisionPointsU4(rows.rows) : [];
    case "U5":
      return rows.structure === "S4" ? decisionPointsU5(rows.rows, opts) : [];
    case "U6":
      return rows.structure === "S4" ? decisionPointsU6(rows.rows, opts) : [];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Number and unit wording
// ---------------------------------------------------------------------------

const EOK = 100_000_000;
const JO = 1_000_000_000_000;

/**
 * V164: a reader's figure, not the stored one. At 100 and above the whole
 * number is enough; 10-100 keeps one decimal, 1-10 two, and a value below 1 three
 * significant digits (0.0027 stays 0.0027). The exact value is still in the
 * table and the download.
 */
function plainNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  const options: Intl.NumberFormatOptions =
    abs >= 100
      ? { maximumFractionDigits: 0 }
      : abs >= 10
      ? { maximumFractionDigits: 1 }
      : abs >= 1
      ? { maximumFractionDigits: 2 }
      : { maximumSignificantDigits: 3 };
  return value.toLocaleString("ko-KR", options);
}

/**
 * V164: "10억 USD" and "십억 US$" are a billion in the unit's own wording; read
 * as plain currency so 0.98 reads 9.8억 USD instead of "0.98 10억 USD".
 */
function normalizedMeasure(value: number, unit: string | null | undefined): { value: number; unit: string | null } {
  const raw = String(unit ?? "").trim();
  const billion = raw.match(/^(?:10억|십억)\s*(USD|US\$|달러|BDT|VND|KRW)$/iu);
  if (billion) {
    const currency = /^us\$$/iu.test(billion[1]) ? "USD" : billion[1];
    return { value: value * 1_000_000_000, unit: currency };
  }
  return { value, unit: unit ?? null };
}

function formatNumber(value: number, unit?: string | null): string {
  const measure = normalizedMeasure(value, unit);
  // V164: a twelve-digit figure is read with its Korean scale word (4,563억); the
  // exact value stays in the table and the download.
  const scaled = publicScaledNumberV136_2(measure.value, measure.unit);
  if (scaled.scaled) {
    const abs = Math.abs(measure.value);
    const [divisor, suffix] = abs >= JO ? ([JO, "조"] as const) : abs >= EOK ? ([EOK, "억"] as const) : ([10_000, "만"] as const);
    return `${plainNumber(measure.value / divisor)}${suffix}`;
  }
  return plainNumber(measure.value);
}

function isNumeric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// Units read as the rest of the site prints them (V150 aliases: "USD_2017/인"
// → a readable unit), never as the raw delivery code.
function publicUnit(unit: string | null | undefined): string {
  const measure = normalizedMeasure(0, unit);
  // "조 m³ (tcm)": the bracketed abbreviation repeats the scale word before it.
  return displayUnitV150(measure.unit).replace(/^(조 m³|조 ft³)\s*\((?:tcm|tcf)\)$/iu, "$1");
}

function unitSuffix(unit: string | null | undefined): string {
  const shown = publicUnit(unit);
  return shown ? ` ${shown}` : "";
}

/** A rank is read "19위"; its number is not a quantity. */
function isRankUnit(unit: string | null | undefined): boolean {
  return /^(순위|위)$/u.test(String(unit ?? "").trim());
}

function measureText(value: number, unit: string | null | undefined): string {
  if (isRankUnit(unit)) return `${plainNumber(value)}위`;
  return `${formatNumber(value, unit)}${unitSuffix(normalizedMeasure(value, unit).unit)}`;
}

function periodTextV164(row: S1CountryObservationV159): string {
  const range = String(row.period || "").match(/^\s*(\d{4})\s*[-–~]\s*(\d{4})\s*$/u) ||
    String(row.label || "").match(/(\d{4})\s*[-–~]\s*(\d{4})\s*평년/u);
  return range && range[1] !== range[2] ? `${range[1]}–${range[2]}년` : `${row.year}년`;
}

function asOfV164(opts: { asOfDate?: string }): { date: string; year: number } {
  const date = opts.asOfDate && /^\d{4}-\d{2}-\d{2}$/u.test(opts.asOfDate) ? opts.asOfDate : new Date().toISOString().slice(0, 10);
  return { date, year: Number(date.slice(0, 4)) };
}

/** "…기준" already says it; a second "기준" is not added. */
function withBasis(text: string): string {
  return /기준$/u.test(text) ? text : `${text} 기준`;
}

// ---------------------------------------------------------------------------
// Headline series (U1, U2, reference country)
// ---------------------------------------------------------------------------

// A total over the parts ("종합 점수", "합계", "Overall"). "종합재난관리" is a topic, not a total.
const STRONG_COMPOSITE_PATTERN = /종합(?:\s*(?:점수|지수|순위|지표|값|평가|성과|위험|리스크|등급|점))?(?![가-힣])|총계|합계|overall|\btotal\b|\(대표값\)/iu;
// "· 전체" after a group name usually means "all of the group", a weaker signal than a total.
// ("연 평년강수" is the year's figure among twelve monthly ones.)
const WEAK_COMPOSITE_PATTERN = /(?:^|[^가-힣])(?:전체(?![가-힣 ]*(?:기간|구간))|연\s*평년)/u;
// A confidence bound, a standard error or a supporting sub-indicator is not the value itself.
const AUXILIARY_PATTERN = /신뢰구간|하한|상한|표준\s*오차|\blower\b|\bupper\b|confidence|보조지표/iu;
// A plan or a target is not the realised figure.
const PLANNED_PATTERN = /계획액|계획|목표|\bplan(?:ned)?\b|\btarget\b/iu;

/**
 * Series the first chart draws that no general rule can tell from its siblings.
 * Chosen against the V164 screen review; each names the chart's own series.
 */
const HEADLINE_OVERRIDES_V164: ReadonlyArray<{ elementId: string; countryIso3?: string; indicator: RegExp }> = [
  // D-006 BGD: the chart draws the environmental-tax revenue as % of GDP, not the zero-filled local-currency sub-series.
  { elementId: "D-006", countryIso3: "BGD", indicator: /_environmental_tax_revenue_pct_gdp$/u },
  // D-010: the chart draws the explicit subsidies in USD.
  { elementId: "D-010", indicator: /_explicit_total_usd$/u },
  // A-004 (V164-3): the main chart opens on the international extreme-poverty rate;
  // the national-line rate is the comparison block's series.
  { elementId: "A-004", indicator: /_poverty_rate_extreme_intl$/u },
];

/** A unit compared without its qualifiers: "점(0~100)" is a 점, "USD_2017" a USD. */
function baseUnit(unit: string | null | undefined): string {
  return String(unit ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/gu, "")
    .replace(/_\d{4}/gu, "")
    .replace(/\s+/gu, "")
    // V164-3: "MtCO₂e" (contract) and "Mt CO2eq" (delivery) are one unit.
    .replace(/[₀-₉]/gu, (digit) => String(digit.charCodeAt(0) - 0x2080))
    .replace(/co2-?eq?\b/gu, "co2e");
}

interface SeriesV164 {
  id: string;
  label: string;
  unit: string | null;
  count: number;
  latestYear: number;
  order: number;
}

function seriesOf(rows: readonly S1CountryObservationV159[], countryIso3: string): SeriesV164[] {
  const numeric = rows.filter((row) => isNumeric(row.value));
  // The subject's own series; another delivered subject's only when the subject has none.
  const own = numeric.filter((row) => row.countryIso3 === countryIso3);
  const pool = own.length > 0 ? own : numeric;
  const byId = new Map<string, SeriesV164>();
  for (const row of pool) {
    const found = byId.get(row.indicatorId);
    if (found) {
      found.count += 1;
      found.latestYear = Math.max(found.latestYear, row.year ?? -Infinity);
    } else {
      byId.set(row.indicatorId, { id: row.indicatorId, label: row.label, unit: row.unit, count: 1, latestYear: row.year ?? -Infinity, order: byId.size });
    }
  }
  return [...byId.values()];
}

/**
 * The series a card leads with, in this order of trust: the one the page's
 * first chart draws; a curated chart series; a total ("종합", "합계") in the
 * chart's unit; the contract's cross-country comparison series when its unit is
 * the chart's; any series in the chart's unit; a value over a rank; then the
 * series with the most readings. A confidence bound is never the headline and a
 * plan only when nothing else is.
 */
function pickHeadlineIndicatorId(
  rows: readonly S1CountryObservationV159[],
  opts: Pick<DecisionPointsOptsV159, "headlineIndicatorIds" | "countryIso3" | "drawnIndicatorIds">
): string | null {
  for (const id of opts.headlineIndicatorIds || []) {
    if (rows.some((row) => row.indicatorId === id && isNumeric(row.value))) return id;
  }
  const series = seriesOf(rows, opts.countryIso3);
  if (series.length === 0) return null;
  // The ids read from the page are every series any chart in the analysis
  // draws - folded charts included (A-010's mass charts in Gg) - so they
  // break ties after the chart's unit and the comparison key instead of
  // narrowing the choice first (V164-3: A-010 headline went to F-gas in Gg).
  const drawn = new Set(opts.drawnIndicatorIds || []);
  const elementId = rows[0]?.elementId || "";
  const curated = HEADLINE_OVERRIDES_V164.filter(
    (item) => item.elementId === elementId && (!item.countryIso3 || item.countryIso3 === opts.countryIso3)
  );
  for (const item of curated) {
    const hit = series.find((entry) => item.indicator.test(entry.id));
    if (hit) return hit.id;
  }
  const contract = visualizationContractV153(elementId);
  // The chart's unit decides only when some series carries it.
  const chartUnit = baseUnit(contract?.primary?.unit);
  const primaryUnit = series.some((item) => baseUnit(item.unit) === chartUnit) ? chartUnit : "";
  // The V158 comparison key sits in the same contract JSON (the V153 row type does not list it).
  const compareId = (contract as { countryCompare?: { compareKey?: { indicatorId?: string } } } | null)?.countryCompare?.compareKey?.indicatorId || null;
  const sameUnit = (item: SeriesV164) => primaryUnit !== "" && baseUnit(item.unit) === primaryUnit;
  const unitOk = (item: SeriesV164) => primaryUnit === "" || sameUnit(item);
  const score = (item: SeriesV164): number[] => {
    const text = `${item.label} ${item.id}`;
    return [
      AUXILIARY_PATTERN.test(text) ? 0 : 1,
      unitOk(item) ? (STRONG_COMPOSITE_PATTERN.test(item.label) ? 2 : WEAK_COMPOSITE_PATTERN.test(item.label) ? 1 : 0) : 0,
      compareId === item.id && unitOk(item) ? 1 : 0,
      sameUnit(item) ? 1 : 0,
      drawn.has(item.id) ? 1 : 0,
      isRankUnit(item.unit) ? 0 : 1,
      PLANNED_PATTERN.test(item.label) ? 0 : 1,
      item.count,
      item.latestYear,
      -item.order,
    ];
  };
  // Lexicographic: the first score that differs decides.
  const outranks = (a: number[], b: number[]) => {
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) return a[index] > b[index];
    }
    return false;
  };
  let best: SeriesV164 | null = null;
  let bestScore: number[] = [];
  for (const item of series) {
    const current = score(item);
    if (best === null || outranks(current, bestScore)) {
      best = item;
      bestScore = current;
    }
  }
  return best ? best.id : null;
}

const COUNTRY_NAME_PARTS = /^(?:베트남|방글라데시|한국|전국)$/u;

/** Words the delivery leaves in English or as a working prefix, in public wording. */
function publicSeriesWords(text: string): string {
  return publicGasNameV163(text)
    // A working prefix such as "[산출 투입·참고자료]" is not part of the series' name.
    .replace(/^\[[^\]]*\]\s*/u, "")
    // A source-language gloss ("(quyết toán)") is not needed beside the Korean name.
    .replace(/\s*\((?=[^)]*[à-ỹ])[^)]*\)/gu, "")
    .replace(/\(Percentile Rank\)/iu, "(백분위)")
    .replace(/\(Estimate\)/iu, "(추정치)")
    .replace(/^Official donors$/u, "공여자 전체(Official donors)")
    .trim();
}

/**
 * The series part of a delivered label "<measure> · <series> — <description>",
 * without the country name that closes many of them. When several series carry
 * one name (`ambiguous`), the description after " — " tells them apart.
 */
function headlineSeriesText(label: string | null | undefined, ambiguous = false): string {
  const parts = String(label || "").split(" — ").map((part) => part.trim());
  const headParts = parts[0].split(" · ").map((part) => part.trim()).filter(Boolean);
  const kept = headParts.filter((part) => !COUNTRY_NAME_PARTS.test(part));
  const series = kept.length > 1 ? kept[kept.length - 1] : "";
  const title = kept[0] ?? headParts[headParts.length - 1] ?? "";
  const tail = parts.slice(1).join(" · ").trim();
  // A bare "종합" or "전체" names nothing without the measure it belongs to.
  const generic = /^(?:종합|전체|합계|총계|총합)$/u.test(series);
  const firstWord = title.split(/[\s·]/u)[0];
  const withTitle = (text: string) => (title && title.length <= 14 && firstWord && !text.includes(firstWord) ? `${title} · ${text}` : text);
  if (ambiguous && tail) return publicSeriesWords(series ? `${series} · ${tail}` : withTitle(tail));
  return publicSeriesWords(generic ? withTitle(series) : series || title);
}

function allSame(values: readonly number[]): boolean {
  return values.length > 0 && values.every((value) => value === values[0]);
}

// ---------------------------------------------------------------------------
// U1
// ---------------------------------------------------------------------------

/** A series is a projection when the delivery says so or most of its readings lie after today. */
function isProjectionSeries(rows: readonly S1CountryObservationV159[], asOfYear: number): boolean {
  const dated = rows.filter((row) => row.year !== null);
  if (dated.length === 0) return false;
  if (dated.filter((row) => row.valueKind === "projection").length * 2 > dated.length) return true;
  return dated.filter((row) => (row.year as number) > asOfYear).length * 2 > dated.length;
}

function decisionPointsU1(
  rows: readonly S1CountryObservationV159[],
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  const headlineId = pickHeadlineIndicatorId(rows, opts);
  if (!headlineId) return [];
  const asOf = asOfV164(opts);
  const points: DecisionPointV159[] = [];

  const allReadings = rows
    .filter((row) => row.indicatorId === headlineId && row.countryIso3 === opts.countryIso3 && row.year !== null)
    .filter((row) => row.value !== null && row.value !== undefined && row.value !== "");
  const projection = isProjectionSeries(allReadings, asOf.year);
  // V164: in an actual series a reading dated after today is a plan, not the latest value.
  const subjectRows = (projection ? allReadings : allReadings.filter((row) => (row.year as number) <= asOf.year))
    .sort((a, b) => (b.year as number) - (a.year as number));
  const latest = subjectRows[0];
  const rank = latest ? isRankUnit(latest.unit) : false;

  if (latest) {
    const displayValue = isNumeric(latest.value) ? measureText(latest.value, latest.unit) : String(latest.value);
    // V163-T2: when the subject has several numeric series (A-010 four gases),
    // a bare number reads as the element total - name the series it belongs to.
    const subjectSeries = new Set(
      rows
        .filter((row) => row.countryIso3 === opts.countryIso3 && isNumeric(row.value))
        .map((row) => row.indicatorId)
    );
    const seriesLabel = headlineSeriesText(latest.label);
    // V164: when several series share that name (D-005 감축: 부처·성·경상·대표값), the
    // series' own description after " — " says which one the value is.
    const sameName = new Set(
      rows
        .filter((row) => row.countryIso3 === opts.countryIso3 && isNumeric(row.value) && headlineSeriesText(row.label) === seriesLabel)
        .map((row) => row.indicatorId)
    );
    const seriesText = headlineSeriesText(latest.label, sameName.size > 1);
    const detail = subjectSeries.size > 1 && seriesText ? withBasis(seriesText) : undefined;
    if (projection) {
      // V164: a projection is a forecast for its year, not the latest value.
      points.push({
        key: "latest-value",
        label: `전망값(${periodTextV164(latest)})`,
        value: displayValue,
        ...(detail ? { detail } : {}),
      });
    } else {
      points.push({
        key: "latest-value",
        label: "최신값·연도",
        // V164: a climatology ("1991-2020" 평년값) is dated by its period, not its first year.
        value: `${displayValue} (${periodTextV164(latest)})`,
        ...(detail ? { detail } : {}),
      });
    }
  }

  if (latest && isNumeric(latest.value) && latest.year !== null) {
    const numericRows = subjectRows.filter((row) => isNumeric(row.value));
    // A series that never moves (one long-run average repeated for every year) has no direction.
    const constant = numericRows.length >= 6 && allSame(numericRows.map((row) => row.value as number));
    let earlier: S1CountryObservationV159 | undefined;
    let span = 0;
    if (projection) {
      // From the first year of the projection to its last.
      const first = numericRows[numericRows.length - 1];
      if (first && (first.year as number) < (latest.year as number)) {
        earlier = first;
        span = (latest.year as number) - (first.year as number);
      }
    } else if (!constant) {
      // The row five years before the latest, else the nearest to it; the label says the real span.
      for (const offset of [5, 4, 6, 3, 7]) {
        const found = numericRows.find((row) => row.year === (latest.year as number) - offset);
        if (found) {
          earlier = found;
          span = offset;
          break;
        }
      }
    }
    if (earlier && isNumeric(earlier.value)) {
      const delta = (latest.value as number) - (earlier.value as number);
      // A rank number falls when the rank improves: 24위 → 19위 is a rise.
      const direction = delta === 0 ? "변화 없음" : rank ? (delta < 0 ? "순위 상승" : "순위 하락") : delta > 0 ? "증가" : "감소";
      points.push({
        key: "five-year-direction",
        label: projection ? "전망 방향" : span === 5 ? "최근 5년 방향" : "최근 변화",
        value: direction,
        detail: `${earlier.year}년 ${measureText(earlier.value as number, latest.unit)} → ${latest.year}년 ${measureText(latest.value as number, latest.unit)}`,
      });
    }
  }

  if (latest && latest.year !== null && !rank && !projection) {
    const sameYear = rows.filter(
      (row) => row.indicatorId === headlineId && row.year === latest.year && isNumeric(row.value)
    );
    const distinctCountries = new Set(sameYear.map((row) => row.countryIso3));
    if (distinctCountries.size >= 2) {
      const ranked = [...sameYear].sort((a, b) => (b.value as number) - (a.value as number));
      const position = ranked.findIndex((row) => row.countryIso3 === opts.countryIso3) + 1;
      if (position > 0) {
        points.push({
          key: "country-rank",
          label: "10개국 중 순위",
          value: `${position}위`,
          detail: `자료 보유 ${distinctCountries.size}개국 중 (프레임워크 10개국 대상)`,
        });
      }
    }
  }

  return points;
}

// ---------------------------------------------------------------------------
// U2
// ---------------------------------------------------------------------------

const NATIONAL_NAME = /^(?:전국|national|nationwide|total|all|합계|전체)\b/iu;

function decisionPointsU2(
  rows: readonly S2RegionObservationV159[],
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  const headlineId = pickHeadlineIndicatorId(rows, opts);
  if (!headlineId) return [];
  const indicatorRows = rows.filter((row) => row.indicatorId === headlineId && isNumeric(row.value));
  const isNational = (row: S2RegionObservationV159) =>
    row.regionKey === null || NATIONAL_NAME.test(String(row.regionName ?? "").trim());
  const regionalRows = indicatorRows.filter((row) => !isNational(row));
  if (regionalRows.length === 0) return [];
  // Rows with years: the latest year. Rows from one map-layer view carry a
  // period instead ("2021-2040", "1999–2018 장기평균") and are one view already.
  const years = regionalRows.map((row) => row.year).filter((year): year is number => year !== null);
  const latestYear = years.length ? Math.max(...years) : null;
  const atLatestYear = latestYear === null ? regionalRows : regionalRows.filter((row) => row.year === latestYear);
  if (atLatestYear.length === 0) return [];
  const basis = `${atLatestYear[0].label}${atLatestYear[0].period ? ` · ${atLatestYear[0].period}` : latestYear !== null ? ` · ${latestYear}년` : ""}`;

  // One boundary system (the one most rows use) and one row per named region: a
  // region listed twice is still one region.
  const systemCount = new Map<string, number>();
  for (const row of atLatestYear) systemCount.set(String(row.regionSystem), (systemCount.get(String(row.regionSystem)) || 0) + 1);
  const system = [...systemCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const named = new Map<string, S2RegionObservationV159>();
  for (const row of atLatestYear.filter((item) => String(item.regionSystem) === system)) {
    const name = regionDisplayNameV159(row, opts.countryIso3);
    if (name !== null && !named.has(name)) named.set(name, row);
  }
  // A top three and a bottom three that never overlap need six regions.
  if (named.size < 6) return [];
  const entries = [...named.entries()].sort((a, b) => (b[1].value as number) - (a[1].value as number));
  const values = entries.map(([, row]) => row.value as number);
  const distinct = new Set(values).size;
  // All equal, or a handful of values shared out to many provinces (a coarser region
  // system copied down), says nothing about which provinces lead.
  if (distinct < 2) return [];
  if (distinct <= 8 && allSame(values.slice(0, 3))) return [];

  const unit = entries[0][1].unit;
  const formatRegion = ([name, row]: [string, S2RegionObservationV159]) => `${name}: ${measureText(row.value as number, unit)}`;
  // When the value that closes the three is shared by more regions, the three shown are
  // some of those, and the card says so.
  const tiedAt = (value: number) => values.filter((item) => item === value).length;
  const tieNote = (shown: number[]) => {
    const edge = shown[shown.length - 1];
    const tied = tiedAt(edge);
    const inShown = shown.filter((item) => item === edge).length;
    return tied > inShown ? ` · 같은 값 ${tied}곳 중 ${inShown}곳` : "";
  };
  const top = entries.slice(0, 3);
  const bottom = entries.slice(-3).reverse();
  const points: DecisionPointV159[] = [
    { key: "top-regions", label: "상위 3개 지역", value: top.map(formatRegion).join(" · "), detail: `${basis}${tieNote(top.map(([, row]) => row.value as number))}` },
    { key: "bottom-regions", label: "하위 3개 지역", value: bottom.map(formatRegion).join(" · "), detail: `${basis}${tieNote(bottom.map(([, row]) => row.value as number))}` },
  ];

  const national = indicatorRows.find((row) => isNational(row) && row.year === latestYear);
  if (national && isNumeric(national.value)) {
    points.push({
      key: "national-comparison",
      label: "전국 대비",
      value: `전국 ${measureText(national.value as number, unit)} (${latestYear}년)`,
      detail: `최고 ${formatRegion(entries[0])} · 최저 ${formatRegion(entries[entries.length - 1])}`,
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// U3
// ---------------------------------------------------------------------------

const TECH_LABEL_BY_CODE = new Map(
  CLIMATE_TECHNOLOGIES.map((item, index) => [String(index + 1).padStart(2, "0"), item.nameKo])
);

function techLabel(row: S1CountryObservationV159): string {
  if (row.techIds.length > 0) {
    return row.techIds.map((code) => TECH_LABEL_BY_CODE.get(code) || code).join(", ");
  }
  return row.category || row.indicatorId;
}

const SCENARIO_WORD = /\((고|중|저) 시나리오\)/u;

interface TechEntryV164 {
  name: string;
  row: S1CountryObservationV159;
}

/**
 * The reading a ③ element names: the series' own category (the energy source,
 * the technology) with its qualifier ("대수력 >50MW") so two series of one
 * technology stay two entries; English clarifications in brackets are dropped.
 */
function techEntryName(row: S1CountryObservationV159): string {
  const parts = String(row.label || "").split(" — ");
  // "<measure> · <series> — <qualifier> — <definition>": the series follows the measure,
  // and a middle part is a qualifier.
  const afterMeasure = parts[0].includes(" · ") ? parts[0].split(" · ").slice(1).join(" · ").trim() : "";
  const qualifier = parts.length >= 3 ? parts[1].trim() : "";
  const base = localizedEnergyCategoryV164(afterMeasure || row.category || techLabel(row))
    .replace(SCENARIO_WORD, "")
    .replace(/\s*\([A-Za-z][A-Za-z ,.\-/&]*\)\s*$/u, "")
    .trim();
  return qualifier && !base.includes(qualifier) ? `${base} · ${qualifier}` : base;
}

function decisionPointsU3(
  rows: readonly S1CountryObservationV159[],
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  const asOf = asOfV164(opts);
  const explicit = opts.headlineIndicatorIds && opts.headlineIndicatorIds.length > 0 ? opts.headlineIndicatorIds : null;
  const scoped = explicit ? rows.filter((row) => explicit.includes(row.indicatorId)) : rows;
  // A technology reading: the subject's own, numeric, carrying a technology, and not a
  // sample bound (the chart draws the median, not the extremes of the sample).
  const candidates = scoped.filter(
    (row) =>
      row.countryIso3 === opts.countryIso3 &&
      isNumeric(row.value) &&
      row.techIds.length > 0 &&
      (row.bound === null || row.bound === "central" || row.bound === "median")
  );
  if (candidates.length === 0) return opts.referenceCountryIso3 ? decisionPointsReferenceCountry(rows, opts) : [];

  // The chart's unit when the contract names one and enough readings carry it; else the unit most readings use.
  const primaryUnit = explicit ? "" : baseUnit(visualizationContractV153(rows[0]?.elementId || "")?.primary?.unit);
  const unitCounts = new Map<string, number>();
  for (const row of candidates) unitCounts.set(baseUnit(row.unit), (unitCounts.get(baseUnit(row.unit)) || 0) + 1);
  const unitKey =
    primaryUnit && unitCounts.has(primaryUnit)
      ? primaryUnit
      : [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const sameUnit = candidates.filter((row) => baseUnit(row.unit) === unitKey);

  const latestYear = Math.max(...sameUnit.map((row) => row.year ?? -Infinity));
  if (!Number.isFinite(latestYear)) return [];
  const latestRows = sameUnit.filter((row) => row.year === latestYear);
  // V164: a delivered total or source subtotal (IRENA "Total non-renewable energy",
  // "Fossil fuels") sums other rows; it is not a technology of its own.
  const latestCategories = latestRows.map((row) => String(row.category || ""));
  const atLatestYear = latestRows.filter((row) =>
    !(row.category && (isTotalCategoryV164(row.category) || isSourceSubtotalV164(row.category, latestCategories)))
  );
  if (atLatestYear.length === 0) return [];

  // One reading per named entry. A scenario series reads at its middle scenario when
  // it has one; otherwise the largest reading stands.
  const groups = new Map<string, S1CountryObservationV159[]>();
  for (const row of atLatestYear) {
    const entry = techEntryName(row);
    groups.set(entry, [...(groups.get(entry) || []), row]);
  }
  const entries: TechEntryV164[] = [];
  for (const [name, group] of groups.entries()) {
    const middle = group.find((row) => /\(중 시나리오\)|_mid$/u.test(`${row.label}${row.indicatorId}`));
    const row = middle || [...group].sort((a, b) => (b.value as number) - (a.value as number))[0];
    entries.push({ name: middle ? `${name} (중 시나리오)` : name, row });
  }
  // One entry is not a ranking.
  if (entries.length < 2) return opts.referenceCountryIso3 ? decisionPointsReferenceCountry(rows, opts) : [];
  const sorted = entries.sort((a, b) => (b.row.value as number) - (a.row.value as number));
  const unit = sorted[0].row.unit;

  return [
    {
      key: "top-technologies",
      label: "값이 큰 기술 상위 3",
      value: sorted.slice(0, 3).map((entry) => `${entry.name}: ${measureText(entry.row.value as number, unit)}`).join(" · "),
    },
    {
      key: "technology-count",
      label: "기술별 값·출처연도",
      // A year after today is a forecast year, and says so.
      value: `${sorted.length}개 항목 · ${latestYear}년${latestYear > asOf.year ? " 전망" : ""} 기준`,
    },
  ];
}

/**
 * Spec v8 ③ with a reference country (E-017): the headline indicator at its
 * latest year across the delivered subjects. The rank is counted from the
 * values (largest first); the gap is to the largest value, in %p when the
 * unit is %.
 */
function decisionPointsReferenceCountry(
  rows: readonly S1CountryObservationV159[],
  opts: DecisionPointsOptsV159
): DecisionPointV159[] {
  const subject = opts.referenceCountryIso3;
  const headlineId = pickHeadlineIndicatorId(rows, opts);
  if (!subject || !headlineId) return [];
  const readings = rows.filter((row) => row.indicatorId === headlineId && isNumeric(row.value) && row.year !== null);
  if (readings.length === 0) return [];
  const latestYear = Math.max(...readings.map((row) => row.year as number));
  const byCountry = new Map<string, S1CountryObservationV159>();
  for (const row of readings) if (row.year === latestYear && !byCountry.has(row.countryIso3)) byCountry.set(row.countryIso3, row);
  const own = byCountry.get(subject);
  if (!own || byCountry.size < 2) return [];
  const sorted = [...byCountry.values()].sort((a, b) => (b.value as number) - (a.value as number));
  const label = (iso3: string) => (opts.countryLabel ? opts.countryLabel(iso3) : iso3);
  const unit = own.unit;
  const top = sorted[0];
  const gap = (top.value as number) - (own.value as number);
  // A gap between two percentages is in percentage points.
  const gapText = unit === "%" ? `${formatNumber(gap)}%p` : `${formatNumber(gap, unit)}${unitSuffix(unit)}`;
  return [
    { key: "reference-level", label: `${label(subject)} 수준`, value: `${measureText(own.value as number, unit)} (${latestYear}년)` },
    { key: "reference-rank", label: `${byCountry.size}개국 중 순위`, value: `${sorted.indexOf(own) + 1}위` },
    {
      key: "reference-gap",
      label: "최고국과 격차",
      value: top === own ? "최고국" : `${gapText} (${label(top.countryIso3)} ${measureText(top.value as number, unit)})`,
    },
  ];
}

/** One S4 record of a ③ element as the chart counts it: its kind and the technology fields the source assigned. */
export interface TechnologyRecordV159 {
  kind: string;
  technologies: string[];
}

/**
 * Spec v8 ③·S4 (E-008): how many records, split by kind, and the three
 * technology fields with the most records. A record assigned two fields
 * counts once in each, as in the chart. Hidden when no record carries a field.
 */
export function decisionPointsU3RecordsV159(records: readonly TechnologyRecordV159[]): DecisionPointV159[] {
  if (!records.some((record) => record.technologies.length > 0)) return [];
  const kinds = new Map<string, number>();
  const fields = new Map<string, number>();
  for (const record of records) {
    kinds.set(record.kind, (kinds.get(record.kind) || 0) + 1);
    for (const field of new Set(record.technologies)) fields.set(field, (fields.get(field) || 0) + 1);
  }
  const byCount = (a: [string, number], b: [string, number]) => b[1] - a[1] || a[0].localeCompare(b[0], "ko");
  const kindText = [...kinds.entries()].sort(byCount).map(([kind, count]) => `${kind} ${count.toLocaleString("ko-KR")}`).join(" · ");
  return [
    { key: "record-total", label: "총 건수", value: `${records.length.toLocaleString("ko-KR")}건${kinds.size > 1 ? ` (${kindText})` : ""}` },
    {
      key: "top-technology-fields",
      label: "건수 상위 기술 분야",
      value: [...fields.entries()].sort(byCount).slice(0, 3).map(([field, count]) => `${field} ${count.toLocaleString("ko-KR")}건`).join(" · "),
    },
  ];
}

// ---------------------------------------------------------------------------
// U4
// ---------------------------------------------------------------------------

/**
 * The delivery's own "this source has no record" row: no position, no size and no
 * class, named by its pack key ("A-025 record 1") or not named at all.
 */
function isPlaceholderEntity(row: S3LocatedEntityV159): boolean {
  const unnamed = !row.name || /^[A-Z]-\d{3}\s+record\s+\d+$/iu.test(row.name.trim());
  return unnamed && row.latitude === null && row.longitude === null && row.size === null && !row.classLabel && !row.owner;
}

// Classes the source writes in English ("solar", "Hydro") read in Korean, one spelling per class.
const CLASS_WORDS: Array<[RegExp, string]> = [
  [/^solar(?:\s*(?:pv|photovoltaic|power))?$/iu, "태양광"],
  [/^hydro(?:power)?$/iu, "수력"],
  [/^wind(?:\s*power)?$/iu, "풍력"],
  [/^(?:onshore\s*wind)$/iu, "육상풍력"],
  [/^(?:offshore\s*wind)$/iu, "해상풍력"],
  [/^bio(?:mass|energy|gas)?$/iu, "바이오에너지"],
  [/^coal$/iu, "석탄"],
  [/^(?:natural\s*)?gas$/iu, "가스"],
  [/^oil$/iu, "석유"],
  [/^nuclear$/iu, "원자력"],
  [/^geothermal$/iu, "지열"],
  [/^(?:waste|waste[- ]to[- ]energy)$/iu, "폐자원"],
  [/^diesel$/iu, "디젤"],
  [/^(?:storage|bess)$/iu, "저장"],
  [/^other$/iu, "기타"],
];

/** A class in Korean, or null when it is only an English raw key the platform cannot name. */
function publicClassLabel(label: string): string | null {
  const text = label.trim();
  const word = CLASS_WORDS.find(([pattern]) => pattern.test(text));
  if (word) return word[1];
  return /[가-힣]/u.test(text) ? text : null;
}

/** A national or overall row the delivery lists beside the units it sums ("전국 집계"). */
const AGGREGATE_ENTITY_V164 = /전국|합계|총계|\b(?:total|national|country)\b/iu;
/** Area units: polygons such as river basins nest and overlap, so their areas do not add up. */
const AREA_UNIT_V164 = /^(?:km|km2|km²|㎢|ha|m2|m²|acre)s?$/iu;

/**
 * V164-3: whether the sizes can be summed into one '규모 합계' without counting
 * anything twice. Not when the rows come from more than one list (A-023 VNM:
 * the same plant in two sources), when one row is the delivery's own total
 * (B-025 BGD: "전국 집계" beside 66 basins), or when the sizes are areas of
 * shapes that may overlap (B-025 VNM: a whole basin and its Viet Nam part).
 */
function sizesAddUpV164(sized: readonly S3LocatedEntityV159[]): boolean {
  if (new Set(sized.map((row) => row.indicatorId || "")).size > 1) return false;
  if (sized.some((row) => AGGREGATE_ENTITY_V164.test(`${row.name || ""} ${row.classLabel || ""}`))) return false;
  if (sized.some((row) => AREA_UNIT_V164.test((row.size?.unit || "").replace(/\s+/gu, "")))) return false;
  return true;
}

function decisionPointsU4(allRows: readonly S3LocatedEntityV159[]): DecisionPointV159[] {
  const rows = allRows.filter((row) => !isPlaceholderEntity(row));
  if (rows.length === 0) return [];
  const points: DecisionPointV159[] = [
    { key: "entity-count", label: "개체 수", value: `${rows.length.toLocaleString("ko-KR")}개` },
  ];

  const sized = rows.filter((row) => row.size !== null);
  if (sized.length > 0 && sizesAddUpV164(sized)) {
    const units = new Set(sized.map((row) => row.size?.unit ?? null));
    if (units.size === 1) {
      const total = sized.reduce((sum, row) => sum + (row.size?.value || 0), 0);
      points.push({ key: "size-total", label: "규모 합계", value: measureText(total, sized[0].size?.unit) });
    }
  }

  const classCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.classLabel) continue;
    const label = publicClassLabel(row.classLabel);
    if (label) classCounts.set(label, (classCounts.get(label) || 0) + 1);
  }
  if (classCounts.size > 0) {
    const top3 = [...classCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    points.push({
      key: "class-composition",
      label: "분류 구성",
      value: top3.map(([label, count]) => `${label} ${count.toLocaleString("ko-KR")}건`).join(" · "),
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// U5 / U6
// ---------------------------------------------------------------------------

/**
 * The records a list shows as its "전체 N건": the delivered individual records.
 * Aggregate and definition rows, and the legacy observation-derived rows no
 * list shows, are not counted. Hand-built rows without the V164 fields count as
 * individual; a delivery with no entity rows at all keeps what it has.
 */
function individualRecords(rows: readonly S4EntityV159[]): S4EntityV159[] {
  const delivered = rows.filter((row) => row.origin !== "observation");
  const pool = delivered.length > 0 ? delivered : rows;
  return pool.filter((row) => row.recordRole === undefined || row.recordRole === "individual");
}

/** Half of the records state it: a point built from fewer is not a reading of the list. */
function coversHalf(count: number, total: number): boolean {
  return total > 0 && count * 2 >= total;
}

// An organisation name with a bracketed short form ("… (World Bank)") prints as the short form once it is long.
function shortOrgName(org: string): string {
  const match = org.match(/^(.*)\(([^()]+)\)\s*$/u);
  return org.length > 45 && match ? match[2].trim() : org;
}

/** Latest exact date at or before today, among records whose date column the caller accepts. */
function latestDatedRow(
  rows: readonly S4EntityV159[],
  asOfDate: string,
  accepts: (row: S4EntityV159) => boolean
): { display: string; name: string | null } | null {
  let best: { time: number; display: string; name: string | null } | null = null;
  const limit = Date.parse(asOfDate);
  for (const row of rows) {
    if (!row.date || !accepts(row)) continue;
    const time = Date.parse(row.date);
    if (!Number.isFinite(time) || time > limit) continue;
    if (!best || time > best.time) best = { time, display: row.date, name: row.name ? row.name.replace(/\s+/gu, " ").trim() : null };
  }
  return best;
}

const APPROVAL_DATE_KEY = /승인|approv|^date$/iu;

function decisionPointsU5(allRows: readonly S4EntityV159[], opts: DecisionPointsOptsV159): DecisionPointV159[] {
  const rows = individualRecords(allRows);
  if (rows.length === 0) return [];
  const asOf = asOfV164(opts);
  const points: DecisionPointV159[] = [
    { key: "record-count", label: "건수", value: `${rows.length.toLocaleString("ko-KR")}건` },
  ];

  const amounted = rows.filter((row) => row.amount !== null);
  if (amounted.length > 0) {
    const currencies = new Set(amounted.map((row) => row.amount?.currency ?? null));
    if (currencies.size === 1 && amounted[0].amount?.currency) {
      const currency = amounted[0].amount.currency;
      const total = amounted.reduce((sum, row) => sum + (row.amount?.value || 0) * (row.amount?.scale ?? 1), 0);
      points.push({
        key: "amount-total",
        label: "총액",
        value: `${formatNumber(total, currency)} ${currency}`,
        // A sum over only some of the records says which ones.
        ...(amounted.length < rows.length ? { detail: `금액 기재 ${amounted.length.toLocaleString("ko-KR")}건 합계` } : {}),
      });
    }
  }

  const orgCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.org) continue;
    orgCounts.set(row.org, (orgCounts.get(row.org) || 0) + 1);
  }
  const withOrg = [...orgCounts.values()].reduce((sum, count) => sum + count, 0);
  if (orgCounts.size > 0 && coversHalf(withOrg, rows.length)) {
    const top3 = [...orgCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    points.push({ key: "top-orgs", label: "기관 상위 3", value: top3.map(([org, count]) => `${shortOrgName(org)} ${count.toLocaleString("ko-KR")}건`).join(" · ") });
  }

  // Individual projects only, with an approval date that has already happened.
  const withApprovalDate = rows.filter((row) => row.date && APPROVAL_DATE_KEY.test(String(row.dateKey ?? "date")));
  if (coversHalf(withApprovalDate.length, rows.length)) {
    const latest = latestDatedRow(rows, asOf.date, (row) => APPROVAL_DATE_KEY.test(String(row.dateKey ?? "date")));
    if (latest) {
      points.push({ key: "latest-approval", label: "최근 승인", value: latest.display, detail: latest.name || undefined });
    }
  }

  return points;
}

const ENGLISH_STATUS: Array<[RegExp, string]> = [
  [/^signed\s*\(not in force\)$/iu, "서명(미발효)"],
  [/^in force$/iu, "시행중"],
  [/^terminated$/iu, "종료"],
  [/^in negotiation$/iu, "협상 중"],
  [/^signed$/iu, "서명"],
];
// A status that is a reviewer's note rather than a status.
const STATUS_MEMO = /확인\s*필요|재확인|판독|미기입|자리표시|본문.*완결|검색|대조|원문 미확보/u;

/**
 * The status as a short name: the words before the first bracket or dash
 * ("시행중 (2000·2002·2010년 개정 반영)" → "시행중"), English statuses in Korean,
 * and null for a review note or a status with no Korean name.
 */
function publicStatus(raw: string): string | null {
  const text = raw.trim();
  const english = ENGLISH_STATUS.find(([pattern]) => pattern.test(text));
  if (english) return english[1];
  const head = text.split(/\s*[(（]|\s+[—–-]\s+/u)[0].trim();
  if (!head || STATUS_MEMO.test(head) || STATUS_MEMO.test(text.split(/\s+[—–-]\s+/u)[0])) return null;
  const mapped = ENGLISH_STATUS.find(([pattern]) => pattern.test(head));
  if (mapped) return mapped[1];
  return /[가-힣]/u.test(head) ? head : null;
}

function decisionPointsU6(allRows: readonly S4EntityV159[], opts: DecisionPointsOptsV159): DecisionPointV159[] {
  const rows = individualRecords(allRows);
  if (rows.length === 0) return [];
  const asOf = asOfV164(opts);
  const points: DecisionPointV159[] = [];

  // Only an exact date from a date column, never a year the delivery merely carries
  // (a collection year, the year an agreement was joined), and never one after today.
  const latest = latestDatedRow(rows, asOf.date, () => true);
  if (latest) {
    points.push({
      key: "latest-revision",
      label: "최신 개정",
      value: latest.name && latest.name !== latest.display ? `${latest.name} (${latest.display})` : latest.display,
    });
  }

  const statusCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.status) continue;
    const status = publicStatus(row.status);
    if (status) statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  }
  if (statusCounts.size > 0) {
    const sorted = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);
    const shown = sorted.slice(0, 4).map(([status, count]) => `${status} ${count.toLocaleString("ko-KR")}건`).join(" · ");
    const rest = sorted.length > 4 ? ` · 그 밖 ${sorted.length - 4}종` : "";
    points.push({ key: "status-breakdown", label: "상태", value: `${shown}${rest}` });
  }

  const taggedCount = rows.filter((row) => row.regionTags.length > 0).length;
  if (taggedCount > 0) {
    points.push({ key: "applicable-regions", label: "적용지역", value: `${taggedCount}건` });
  }

  const incentiveRows = rows.filter(
    (row) => (row.recordType && row.recordType.includes("인센티브")) || (row.description && row.description.includes("인센티브"))
  );
  if (incentiveRows.length > 0) {
    points.push({ key: "incentive-presence", label: "인센티브 유무", value: `있음 (${incentiveRows.length}건)` });
  }

  return points;
}
