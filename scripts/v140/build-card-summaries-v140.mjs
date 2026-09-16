/**
 * Card summaries for the 152 public datasets (V140).
 *
 * Reads the public packs and the semantic contracts once and writes
 * `public/data/vietnam/v2/home/card-summaries-v140.json`: for every element,
 * the question its card answers, the one figure it leads with (in the same
 * measure / dimension / year keys the detail screen's selector uses, so the
 * card can hand its selection to the detail), a small analysis that fits the
 * data's shape, and the basis of the count. The eight home cards are taken
 * from the home preview asset so the two screens never disagree.
 *
 * Shapes, chosen by what the data can honestly support:
 *   line          a series with three or more years
 *   level         one or two values, no trend drawn
 *   composition   exclusive parts of one denominator (allow-listed elements)
 *   bars          a comparison across categories, provinces or scenarios
 *   spatial       a distribution across the 63 provinces (median, range, top)
 *   facts         what a register or document set carries, in words
 *   status        the five elements that publish no values yet
 *
 * Usage: node scripts/v140/build-card-summaries-v140.mjs [--data public/data/vietnam/v2]
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadPacks,
  loadSemantics,
  semanticRows,
  defaultMeasureKey,
  seriesOf,
  yearsOf,
  latestPoint,
  isNumeric,
  formatNumber,
  median,
  quantile,
  readJson,
  text,
  numberOf,
  TOTAL_LIKE,
} from "./card-model-v140.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", process.env.VIETNAM_DATA_ROOT || "public/data/vietnam/v2"));
const OUT_PATH = resolve(DATA, "home/card-summaries-v140.json");
const REVIEW_PATH = resolve(ROOT, "reports/v140/card-summaries-review-v140.md");
const REPORT_PATH = resolve(ROOT, "reports/v140/card-summaries-build-v140.json");

const packs = loadPacks(DATA);
const { byElement: semanticByElement, contractByElement } = loadSemantics(DATA);
const catalog = readJson(resolve(DATA, "catalog.json")).elements;
const manifest = readJson(resolve(DATA, "manifest.json"));
const homePreview = readJson(resolve(DATA, "home/home-preview-v139.json"));
const mapTargets = readJson(resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json")).targets;
const mapIndex = readJson(resolve(DATA, "map-index.json"));
const mapConnected = new Set(mapIndex.layers.filter((layer) => layer.active !== false && layer.enabled !== false).map((layer) => layer.elementId));

// The detail screen's reviewed default measures, read from the registry so
// the card opens on what the screen opens on.
const registrySource = readFileSync(resolve(ROOT, "src/data/visualization/publicVisualizationRegistryV126.ts"), "utf8");
const REVIEWED_DEFAULT_MEASURE = Object.fromEntries(
  [...registrySource.matchAll(/"([A-E]-\d{3})": "(measure-[0-9a-f]+)"/gu)].map((match) => [match[1], match[2]])
);

const warnings = [];
const warn = (elementId, message) => warnings.push({ elementId, message });

// ------------------------------------------------------------------ overrides
/**
 * Reviewed choices where the generic rule would lead with the wrong thing.
 * `measure` matches the contract measure's label (and unit when given);
 * `series` picks one series by its dimension labels; `year` pins a year.
 */
const OVERRIDES = {
  "A-004": { measure: { label: "빈곤율" } },
  "A-005": { kind: "bars", note: "제조업은 광공업·건설의 일부이므로 구성으로 합치지 않음" },
  "A-011": { kind: "composition", excludeTotal: true },
  "A-016": { kind: "composition", excludeTotal: true },
  "A-018": { kind: "bars", excludeTotal: true, series: { exclude: /^(Total|Fossil fuels|Solar energy|Wind energy|Bioenergy)[(]/u }, note: "상위 합계 항목(화석연료·태양에너지·풍력·바이오에너지 합계)은 제외하고 하위 기술만 비교" },
  "B-001": { kind: "bars", year: "first", scopeLabel: "월별 평년값(1991–2020)" },
  "A-014": { measure: { label: "SDG Index 종합점수" } },
  "A-017": { kind: "bars", series: { match: /\(기준값\)/u }, year: "first", note: "기준값 · 상한·하한은 상세" },
  "B-002": { kind: "bars" },
  "B-010": { measure: { label: "CRI 종합 순위" } },
  "B-013": { kind: "bars", excludeTotal: true },
  "B-015": { kind: "bars", excludeTotal: true },
  "B-018": { series: { match: /^SSP2$/u } },
  "B-019": { series: { match: /^SSP2$/u } },
  "B-020": { series: { match: /INFORM 종합/u } },
  "B-021": { measure: { label: "GVI 취약성 지수" }, series: { match: /전국/u } },
  "B-022": { kind: "bars" },
  "B-036": { kind: "bars" },
  "B-043": { kind: "bars" },
  "B-045": { kind: "bars" },
  "D-005": { measureLabel: "예산 배분 구조", kind: "composition", series: { match: /대표값/u } },
  "D-008": { kind: "bars" },
  "D-011": { series: { match: TOTAL_LIKE }, measureLabel: "총 ODA", headlineLabel: "공식 공여자 총계 · 지출액 · 2024년 불변가격" },
  "D-013": { kind: "bars", series: { match: /차원\(dimension\) 점수/u } },
  "D-018": { kind: "bars", headlineSeries: /베트남 단독/u },
  "E-010": { measure: { label: "GERD" } },
  // The detail's 총 취업자 수 KPI is the all-occupation total (2024, 천명); the
  // 백만명 series stops at 2023 and would open the detail on a year with no
  // occupation rows.
  // Five countries' ranks in rows that differ only by country: the card
  // compares them and leads with Korea's place (lower rank is better).
  "E-017": { kind: "countries", measure: { label: "기후기술 수준 순위" }, lead: "KOR", ascending: true },
  "E-012": { measure: { label: "직군별 종사자 수" }, series: { match: /^전체 직군$/u }, headlineLabel: "총 취업자 수 · 전체 직군 · 전체 성별", measureLabel: "총 취업자 수" },
};

/** Parts of one denominator, reviewed: composition is drawn only here. */
const COMPOSITION_ALLOWED = new Set(["A-011", "A-016", "D-005"]);

/**
 * Elements whose detail is a specialised component with its own selection
 * keys (PublicDataAnalysisRouterV126): the generic contract dimensions
 * (category/detail) mean nothing there, so the card hands over only what the
 * component reads.
 */
const SPECIALISED_SELECTION = {
  "A-016": (selection) => ({ ...selection, dimensions: {} }),
  "D-005": (selection) => ({ ...selection, dimensions: { budgetBasis: "total-climate" } }),
  "D-011": (selection) => ({ ...selection, dimensions: {} }),
  "E-012": (selection) => ({ ...selection, dimensions: {} }),
};

/** Entity registers: what one row is, and the attribute the card compares across. */
const ENTITY_RULES = {
  "A-013": { unit: "연계 항목", kind: "facts" },
  "A-025": { unit: "시설", kind: "facts", nameFrom: (row) => (row.note || "").match(/\[시설명:\s*([^\]]+)\]/u)?.[1] || row.name },
  "A-029": { unit: "문서", kind: "facts" },
  "B-008": { unit: "관측소", kind: "stations" },
  "B-012": { unit: "재해 사건", groupBy: "재해유형", kind: "bars" },
  "B-017": { unit: "평가구역", kind: "grades", gradeKey: "기준_물스트레스_Baseline_Water_Stress_등급" },
  "B-023": { unit: "관측지점", kind: "facts", distinctBy: "지점_유역명" },
  "B-025": { unit: "유역", kind: "bars", valueKey: "베트남_내_면적_km_GIS_산출", labelKey: "유역명_국문", valueUnit: "km²" },
  "B-028": { unit: "관측지점", kind: "facts", distinctBy: "지점_유역명" },
  "B-048": { unit: "광산", kind: "facts", nameFrom: (row) => `${row.normalizedAttributes?.광산명 || row.name} (${row.normalizedAttributes?.광종 || ""})` },
  "C-001": { unit: "항목", kind: "facts" },
  "C-002": { unit: "항목", kind: "facts" },
  "C-003": { unit: "항목", kind: "facts" },
  "C-004": { unit: "항목", kind: "facts" },
  "C-005": { unit: "항목", kind: "facts" },
  "C-006": { unit: "항목", kind: "facts" },
  "C-007": { unit: "활동", kind: "facts" },
  "C-008": { unit: "이니셔티브", kind: "facts" },
  "C-009": { unit: "법령·문서", kind: "documents" },
  "C-010": { unit: "법령·문서", kind: "documents" },
  "C-011": { unit: "항목", kind: "facts" },
  "C-012": { unit: "항목", kind: "facts", note: "개편 후 34개 성·시 단위 값 · 63개로 합산·순위화하지 않음" },
  "C-013": { unit: "항목", kind: "facts" },
  "C-014": { unit: "항목", kind: "facts" },
  "C-015": { unit: "원문 링크", kind: "facts" },
  "C-017": { unit: "항목", kind: "facts" },
  "C-018": { unit: "항목", kind: "facts" },
  "C-019": { unit: "항목", kind: "facts", note: "명부의 시설 수는 34개 단위 · 성·시로 합산하지 않음" },
  "C-022": { unit: "항목", kind: "facts", note: "같은 명부의 업종별 수 · 합산하지 않음" },
  "C-024": { unit: "항목", kind: "facts" },
  "C-025": { unit: "프로젝트", groupBy: "standard", kind: "bars" },
  "D-012": { unit: "기업", groupBy: "기술분야", kind: "bars" },
  "D-014": { unit: "사업", groupBy: "원조유형", kind: "bars", individualOnly: true },
  "D-015": { unit: "사업", groupBy: "상태", kind: "bars", individualOnly: true },
  "D-016": { unit: "사업", groupBy: "기관유형", kind: "bars", individualOnly: true },
  "D-017": { unit: "공고", kind: "facts" },
  "D-019": { unit: "기술지원 요청", groupBy: "기술유형", kind: "bars" },
  "D-020": { unit: "사업", kind: "facts" },
  "D-021": { unit: "사업", groupBy: "활동상태", kind: "bars", individualOnly: true },
  "D-022": { unit: "사업", groupBy: "투자_유형", kind: "bars" },
  "D-024": { unit: "투자 건", kind: "facts", individualOnly: true },
  "D-025": { unit: "사업", groupBy: "투자유형", kind: "bars" },
  "D-026": { unit: "보증", groupBy: "보증_유형", kind: "bars" },
  "E-001": { unit: "기관", kind: "facts" },
  "E-002": { unit: "기관", kind: "facts" },
  "E-003": { unit: "기관", kind: "facts", distinctBy: "orgName" },
  "E-004": { unit: "현지사무소", groupBy: "orgType", kind: "bars", currentOnly: "recordStatus" },
  "E-005": { unit: "기관", groupBy: "city", kind: "bars" },
  "E-006": { unit: "기관", groupBy: "city", kind: "bars" },
  "E-007": { unit: "항목", groupBy: "category", kind: "bars" },
  "E-008": { unit: "논문·특허", kind: "facts" },
  "E-014": { unit: "협정", kind: "facts" },
  "E-015": { unit: "협력체계", kind: "facts" },
  "E-016": { unit: "부문", kind: "facts" },
  "E-018": { unit: "기업", groupBy: "진출_상태", kind: "bars" },
  // The detail lists installed offices and, apart, the organisations the
  // source found to have none; the same verdict fields decide here.
  "E-019": { unit: "현지 사무소", kind: "facts", notInstalled: { keys: ["좌표_정밀도_출처", "recordStatus", "field_6b3e1e90"], pattern: /사무소 미설치|미운영|업무 종료|대상 아님|미설치/u }, notInstalledLabel: "사무소 없는 기관" },
  // Seven rows are seven uses of three programmes (the detail's identity
  // rule: the programme name before " — ").
  "E-020": { unit: "활용 사례", kind: "facts", identity: { key: "field_01856451", split: /\s+—\s+/u, label: "지원제도" } },
};

/** Province-value layers whose card is a distribution across the 63 provinces. */
// The detail's subject-country labels (SUBJECT_COUNTRY_LABELS_V138).
const COUNTRY_KO = { KOR: "한국", CHN: "중국", JPN: "일본", USA: "미국", EUU: "유럽연합", VNM: "베트남" };

const REGIONAL_LAYERS = new Set(["B-026", "B-029", "B-030", "B-037", "B-039", "B-040", "B-041", "B-042"]);
// Province-attribute deliveries the detail shows as a 63-province distribution
// (PublicRegionScenarioSummaryV138) but whose map target names no measure:
// the attribute the detail opens on.
const REGIONAL_ENTITY_MEASURE = {
  "B-026": { sourceKey: "우세_유향_비율", label: "우세 유향 비율", unit: "%" },
};
const REGION_SCENARIO = { "B-003": { observed: true }, "B-004": {}, "B-005": {}, "B-006": {}, "B-007": {} };

// ------------------------------------------------------------------ helpers
const catalogById = new Map(catalog.map((item) => [item.elementId, item]));
const mapTargetById = new Map(mapTargets.map((target) => [target.elementId, target]));

/**
 * The provider of what the card shows: the source organisation the pack's
 * indicator metadata states for the rows the card used, not the first two
 * names of the catalogue's organisation list (which put Global Solar Atlas
 * on the CMIP6 temperature card).
 */
function providerFor(pack, indicatorIds, item) {
  const metas = (pack?.meta?.indicators || []).filter((indicator) => indicatorIds.includes(indicator.indicatorId));
  const names = [...new Set(metas.map((indicator) => text(indicator.sourceOrg).split(/\s+·\s+경계\s+/u)[0]).filter(Boolean))];
  const catalogue = item.sourceOrganizations || [];
  // A register with one indicator per organisation (E-004: 19 offices) names
  // its collector, the catalogue's organisation, not "ADB 외 18개".
  if (names.length === 0) {
    return catalogue.length > 2 ? `${catalogue.slice(0, 2).join(" · ")} 외 ${catalogue.length - 2}개 기관` : catalogue.join(" · ") || "제공기관 확인";
  }
  if (names.length > 3) return `기관별 공식 출처 ${names.length}개(상세 자료정보 참조)`;
  return names.join(" · ");
}

/** Korean names for the attributes a card compares across; a key is never shown. */
const GROUP_LABELS = {
  orgType: "기관 유형",
  orgCategory: "기관 구분",
  city: "도시",
  category: "분류",
  recordStatus: "자료 상태",
  standard: "등록 표준",
  status: "상태",
  재해유형: "재해 유형",
  기술유형: "기술 유형",
  원조유형: "원조 유형",
  기관유형: "기관 유형",
  기술분야: "기술 분야",
  투자유형: "투자 유형",
  투자_유형: "투자 유형",
  진출_상태: "진출 상태",
  보증_유형: "보증 유형",
  활동상태: "활동 상태",
  상태: "상태",
};
function groupLabelOf(contract, key) {
  const fromContract = contract.dimensions.find((dimension) => dimension.key === key)?.label;
  const candidate = GROUP_LABELS[key] || (fromContract && fromContract !== key ? fromContract : null) || key.replace(/_/gu, " ");
  if (/^[a-z]+[A-Z]|^[a-z_]+$/u.test(candidate)) warn(contract.elementId, `group label still a key: ${candidate}`);
  return candidate;
}

function periodOf(item, years) {
  if (years && years.length) {
    if (years[0] === years[years.length - 1]) return `${years[0]}년`;
    // A few scattered years are named, not written as a span a reader
    // would take for a continuous series (D-005: 2010·2013·2020).
    const consecutive = years.every((year, index) => index === 0 || year - years[index - 1] <= 1);
    if (years.length <= 4 && !consecutive) return `${years.join("·")}년`;
    return `${years[0]}–${years[years.length - 1]}년`;
  }
  const reference = (item.referenceYears || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (reference.length > 1) return `${reference[0]}–${reference[reference.length - 1]}년`;
  if (item.latestYear) return `${item.latestYear}년`;
  return "기준기간 없음";
}

function unitShort(unit) {
  return text(unit).replace(/\s*\(.*?\)\s*$/u, "");
}

function pickSeries(series, override) {
  if (!series.length) return null;
  if (override?.series?.match) {
    const matched = series.find((s) => Object.values(s.labels).some((label) => override.series.match.test(label)));
    if (matched) return matched;
  }
  const totalLike = series.find((s) => Object.values(s.labels).some((label) => TOTAL_LIKE.test(label)));
  if (totalLike && series.length > 1) return totalLike;
  return [...series].sort((a, b) => yearsOf(b.rows).length - yearsOf(a.rows).length || b.rows.length - a.rows.length)[0];
}

function seriesLabel(series) {
  const labels = Object.entries(series.labels)
    .filter(([key]) => !["entityType", "year", "period", "technology"].includes(key))
    .map(([, value]) => value)
    .filter((value) => value && value !== "베트남" && !/^\d+(\s*·\s*\d+)*$/u.test(value))
    // A dimension that carries the indicator's full description is not a
    // label; the reader gets it on the detail screen.
    .filter((value) => value.length <= 28);
  return [...new Set(labels)].join(" · ");
}

/**
 * The selection in the detail's own keys. Only dimensions the detail offers
 * as a choice are handed over: the archetype drops a dimension with a single
 * value and never offers `technology`, so passing them would read as "not
 * kept". A period that is just the year is the year.
 */
function selectionFor(measureKey, series, year, period, contract) {
  const selectable = new Set(
    (contract?.dimensions || [])
      .filter((dimension) => !["entityType", "year", "period", "sex", "technology"].includes(dimension.key) && dimension.values.length > 1)
      .map((dimension) => dimension.key)
  );
  const dimensions = Object.fromEntries(
    Object.entries(series?.dimensions || {}).filter(([key]) => selectable.has(key))
  );
  const yearLike = period && /^\d{4}$/u.test(String(period)) ? Number(period) : null;
  return {
    measure: measureKey,
    sex: series?.dimensions?.sex || null,
    year: year ?? yearLike ?? null,
    period: period && yearLike === null ? period : null,
    dimensions,
  };
}

// ------------------------------------------------------------------ observation cards
function observationCard(elementId, item, pack, contract, override) {
  const rows = semanticRows(pack.observations.records, semanticByElement.get(elementId));
  let measureKey = defaultMeasureKey(contract, rows, REVIEWED_DEFAULT_MEASURE[elementId]);
  if (override?.measure) {
    const wanted = contract.measures.find(
      (measure) => measure.labelKo === override.measure.label && (!override.measure.unit || measure.unit === override.measure.unit) && rows.some((row) => row.measure.key === measure.key && isNumeric(row))
    );
    if (wanted) measureKey = wanted.key;
    else warn(elementId, `override measure not found: ${override.measure.label}`);
  }
  const measure = contract.measures.find((m) => m.key === measureKey);
  if (!measure) return null;
  const measureRows = rows.filter((row) => row.measure.key === measureKey);
  const numericRows = measureRows.filter(isNumeric);
  const series = seriesOf(measureRows);
  const unit = unitShort(measure.unit);
  const kind = override?.kind;

  // A comparison across countries (rows told apart by countryIso3, not by a
  // dimension), leading with the platform's own country.
  if (kind === "countries") {
    const year = yearsOf(numericRows).at(-1);
    const parts = numericRows
      .filter((row) => row.year === year)
      .map((row) => ({ label: COUNTRY_KO[row.countryIso3] || row.countryIso3, value: row.value, iso3: row.countryIso3 }))
      .sort((a, b) => (override.ascending ? a.value - b.value : b.value - a.value));
    const lead = parts.find((part) => part.iso3 === override.lead) || parts[0];
    return {
      kind: "bars",
      headline: { value: `${formatNumber(lead.value)} ${unit}`, label: `${lead.label} · ${measure.labelKo} · ${parts.length}개국 중 · ${year}년${override.ascending ? " · 값이 작을수록 우수" : ""}` },
      preview: { parts: parts.map(({ label, value }) => ({ label, value })), unit, scope: `${parts.length}개국 비교 · ${year}년`, omitted: 0 },
      period: periodOf(item, yearsOf(numericRows)),
      selection: selectionFor(measureKey, null, year ?? null, null, contract),
      basis: { unit: "관측값", rule: `${measure.labelKo}(${unit}) ${year}년 ${parts.length}개국 값 비교 · 대표값은 한국` },
      measure: { key: measureKey, label: measure.labelKo, unit },
      headlineIndicatorIds: [...new Set(numericRows.map((row) => row.indicatorId))],
      leadCountry: override.lead,
    };
  }

  // A composition or a comparison across the series at one year.
  if (kind === "composition" || kind === "bars") {
    const candidates = override?.series?.match ? series.filter((s) => Object.values(s.labels).some((label) => override.series.match.test(label))) : series;
    const usable = candidates.filter(
      (s) =>
        s.rows.some(isNumeric) &&
        !(override?.excludeTotal && Object.values(s.labels).some((label) => TOTAL_LIKE.test(label))) &&
        !(override?.series?.exclude && Object.values(s.labels).some((label) => override.series.exclude.test(label)))
    );
    const years = yearsOf(usable.flatMap((s) => s.rows));
    const year = override?.year === "first" ? years[0] : years[years.length - 1];
    // Parts are told apart by the dimension that differs between them; a
    // dimension every part shares (the measure's own description) is noise.
    const varyingKeys = Object.keys(usable[0]?.labels || {}).filter(
      (key) =>
        !["entityType", "year", "period", "technology"].includes(key) &&
        new Set(usable.map((s) => s.labels[key])).size > 1 &&
        usable.some((s) => !/^\d+(\s*·\s*\d+)*$/u.test(String(s.labels[key] || "")))
    );
    // When both a short category and its long description vary, the short
    // one is the name; the description repeats it.
    // …but only a key every part carries: D-018's 베트남 단독사업 series has no
    // "detail", so choosing it would leave that part unnamed.
    const complete = varyingKeys.filter((key) => usable.every((s) => String(s.labels[key] || "").trim()));
    const shortest = [...(complete.length ? complete : varyingKeys)].sort(
      (a, b) => usable.reduce((sum, s) => sum + String(s.labels[a] || "").length, 0) - usable.reduce((sum, s) => sum + String(s.labels[b] || "").length, 0)
    )[0];
    const varying = new Set(shortest ? [shortest] : []);
    const parts = usable
      .map((s) => {
        const row = s.rows.find((r) => isNumeric(r) && (Number.isFinite(year) ? r.year === year : true));
        const labels = Object.fromEntries(Object.entries(s.labels).filter(([key]) => varying.size === 0 || varying.has(key)));
        return row ? { label: partLabel({ ...s, labels }, override), value: row.value, indicatorIds: [...new Set(s.rows.map((r) => r.indicatorId))] } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
    if (parts.length < 2) return levelOrLine(elementId, item, contract, measure, series, override, rows);
    const shown = parts.slice(0, 6);
    const total = parts.reduce((sum, part) => sum + part.value, 0);
    const top = (override?.headlineSeries && parts.find((part) => override.headlineSeries.test(part.label))) || parts[0];
    const scope = override?.scopeLabel || (Number.isFinite(year) ? `${year}년` : (usable[0]?.rows[0]?.period || periodOf(item)));
    return {
      kind: kind === "composition" && COMPOSITION_ALLOWED.has(elementId) ? "composition" : "bars",
      headline: kind === "composition" && COMPOSITION_ALLOWED.has(elementId)
        ? { value: `${formatNumber(top.value)} ${unit}`, label: `${top.label} · ${scope}${parts.length > 1 ? ` · ${parts.length}개 부분 합계 ${formatNumber(total)} ${unit}` : ""}` }
        : { value: `${formatNumber(top.value)} ${unit}`, label: `${measure.labelKo}${override?.headlineSeries ? "" : " 최대"} · ${top.label} · ${scope}` },
      preview: { parts: shown.map(({ label, value }) => ({ label, value })), unit, scope, omitted: parts.length - shown.length, total: kind === "composition" ? total : null },
      // The rows behind the headline: the named part when one is named, else
      // every compared part (the headline is their maximum).
      headlineIndicatorIds: override?.headlineSeries ? top.indicatorIds : [...new Set(parts.flatMap((part) => part.indicatorIds))],
      period: periodOf(item, yearsOf(numericRows)),
      // A comparison across parts hands over only what every part shares
      // (the "(기준값)" bound, the "차원 점수" level), never the category that
      // varies between them: fixing it would open the detail on one part.
      selection: selectionFor(
        measureKey,
        override?.series?.match ? { dimensions: Object.fromEntries(Object.entries(usable[0]?.dimensions || {}).filter(([key, value]) => usable.every((s) => s.dimensions?.[key] === value))) } : null,
        Number.isFinite(year) ? year : null,
        null,
        contract
      ),
      basis: { unit: "관측값", rule: `${measure.labelKo}(${unit})을 ${scope} 기준으로 ${parts.length}개 항목에서 비교${override?.excludeTotal ? " · 합계 행 제외" : ""}${override?.note ? ` · ${override.note}` : ""}` },
      measure: { key: measureKey, label: override?.measureLabel || measure.labelKo, unit },
    };
  }
  return levelOrLine(elementId, item, contract, measure, series, override, rows);
}

function partLabel(series, override) {
  const label = seriesLabel(series);
  const cleaned = override?.series?.match
    ? label.replace(override.series.match, "").replace(/\(\s*\)/gu, "").replace(/\s*·\s*$/u, "").replace(/^\s*·\s*/u, "").trim()
    : label;
  return cleaned || label;
}

function levelOrLine(elementId, item, contract, measure, series, override, rows) {
  const unit = unitShort(measure.unit);
  const provinceSeries = series.filter((s) => s.rows.some(isNumeric) && !Object.values(s.labels).some((label) => TOTAL_LIKE.test(label)));
  if (provinceSeries.length >= 20 && yearsOf(provinceSeries.flatMap((s) => s.rows)).length <= 1 && !override?.kind) {
    // One value per province, one year: a distribution, not a trend.
    const parts = provinceSeries
      .map((s) => ({ label: seriesLabel(s), value: latestPoint(s.rows)?.value ?? s.rows.find(isNumeric)?.value, series: s }))
      .filter((part) => Number.isFinite(part.value))
      .sort((a, b) => b.value - a.value);
    const values = parts.map((part) => part.value);
    const point = latestPoint(parts[0].series.rows) || parts[0].series.rows.find(isNumeric);
    const scope = Number.isFinite(point?.year) ? `${point.year}년` : point?.period || periodOf(item);
    return {
      kind: "spatial",
      headline: { value: `${formatNumber(parts[0].value)} ${unit}`, label: `${measure.labelKo} 최대 · ${parts[0].label} · ${parts.length}개 성·시 중 · ${scope}` },
      preview: { parts: parts.slice(0, 5).map(({ label, value }) => ({ label, value })), unit, scope: `${measure.labelKo} 상위 5개 성·시`, median: median(values), range: { min: quantile(values, 0), p10: quantile(values, 0.1), p90: quantile(values, 0.9), max: quantile(values, 1) }, provinces: parts.length },
      period: periodOf(item, yearsOf(provinceSeries.flatMap((s) => s.rows))),
      selection: selectionFor(measure.key, parts[0].series, Number.isFinite(point?.year) ? point.year : null, point?.period || null, contract),
      basis: { unit: "성·시 값", rule: `${measure.labelKo}(${unit}) ${parts.length}개 성·시 값 · ${scope} · 최대값과 중앙값·10~90분위 · 합산하지 않음` },
      measure: { key: measure.key, label: measure.labelKo, unit },
    };
  }
  const chosen = pickSeries(series, override);
  if (!chosen) return null;
  const numeric = chosen.rows.filter(isNumeric);
  if (!numeric.length) {
    // A text-valued measure: the register's facts.
    return textFactsCard(elementId, item, measure, chosen.rows);
  }
  const years = yearsOf(numeric);
  const latest = latestPoint(numeric) || numeric[numeric.length - 1];
  const label = seriesLabel(chosen);
  const scopeYear = Number.isFinite(latest.year) ? `${latest.year}년` : latest.period || "";
  const selection = selectionFor(measure.key, series.length > 1 ? chosen : null, Number.isFinite(latest.year) ? latest.year : null, latest.period || null, contract);
  const measureLabel = override?.measureLabel || measure.labelKo;
  const base = {
    headline: { value: `${formatNumber(latest.value)} ${unit}`, label: override?.headlineLabel ? `${override.headlineLabel} · ${scopeYear}` : [measureLabel !== label ? measureLabel : null, label, scopeYear].filter(Boolean).join(" · ") },
    period: periodOf(item, years),
    selection,
    measure: { key: measure.key, label: measureLabel, unit },
  };
  if (years.length >= 3) {
    const points = years.map((year) => ({ year, value: numeric.find((row) => row.year === year).value }));
    const first = points[0];
    return {
      ...base,
      kind: "line",
      preview: { points, unit, seriesLabel: label, first, latest: { year: latest.year, value: latest.value } },
      basis: { unit: "관측값", rule: `${measure.labelKo}(${unit}) ${label ? `${label} 계열 · ` : ""}${years.length}개 연도 · 최신 ${latest.year}년 값을 대표값으로` },
    };
  }
  const others = numeric.filter((row) => row !== latest).slice(0, 2).map((row) => ({ label: row.year ? `${row.year}년` : row.period || "", value: row.value }));
  return {
    ...base,
    kind: "level",
    preview: { unit, seriesLabel: label, others, note: years.length === 2 ? "두 시점 값 · 추이로 그리지 않음" : years.length === 1 ? "단일 시점 값" : "기간 단위 값" },
    basis: { unit: "관측값", rule: `${measure.labelKo}(${unit}) ${label ? `${label} · ` : ""}${years.length <= 1 ? "단일 시점" : "두 시점"}이므로 추이를 그리지 않음` },
  };
}

function textFactsCard(elementId, item, measure, rows) {
  const populated = rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "");
  const facts = populated
    .slice(0, 3)
    .map((row) => ({ label: seriesLabel({ labels: row.dimensionLabels }) || row.displayLabel, value: String(row.value).slice(0, 60) }));
  // A register of a few stated facts leads with the first statement, which
  // the detail prints as it is; a count of statements is not on the detail.
  const lead = facts[0];
  const leadIsStatement = Boolean(lead) && !/^[\d.,\s]+$/u.test(lead.value);
  return {
    kind: "facts",
    headline: lead && leadIsStatement && populated.length <= 3
      ? { value: lead.value.length > 28 ? `${lead.value.slice(0, 27)}…` : lead.value, label: `${lead.label || measure.labelKo} · 기재 항목 ${populated.length}개` }
      : { value: `${populated.length}개 항목`, label: `${measure.labelKo} · 값이 문장으로 기재된 자료` },
    preview: { facts, more: Math.max(0, populated.length - facts.length) },
    period: periodOf(item),
    selection: selectionFor(measure.key, null, null, null, null),
    basis: { unit: "항목", rule: "수치가 아닌 기재 내용을 그대로 보임" },
    measure: { key: measure.key, label: measure.labelKo, unit: measure.unit },
  };
}

// ------------------------------------------------------------------ entity cards
function entityCard(elementId, item, pack, contract, rule) {
  // The detail excludes the source's total/explanatory rows (레코드구분=집계)
  // from every list and sum; the card counts the same base.
  // …and the sheet's own "수집현황 v5.29 분류" method row, which the detail's
  // evidence matrix drops (isCompilerMethodRowV139).
  const isMethodRow = (row) => [row.name, row.normalizedAttributes?.["속성1_레코드명"]].some((name) => /^수집현황(?:\s*v[\d.]+)?(?:\s*분류)?$/u.test(text(name)));
  const entities = pack.entities.records.filter((row) => text(row.normalizedAttributes?.레코드구분) !== "집계" && !isMethodRow(row));
  const aggregateRows = pack.entities.records.length - entities.length;
  const aggregateNote = aggregateRows ? ` · 원천의 집계·설명 행 ${aggregateRows}건 제외` : "";
  let rows = entities;
  if (rule.individualOnly) {
    const individual = entities.filter((row) => text(row.normalizedAttributes?.레코드구분) === "개별");
    if (individual.length) rows = individual;
  }
  if (rule.currentOnly) {
    const current = entities.filter((row) => text(row.normalizedAttributes?.[rule.currentOnly]) === "현행");
    if (current.length) rows = current;
  }
  const nameOf = rule.nameFrom || ((row) => row.name);
  const distinct = rule.distinctBy ? new Set(rows.map((row) => text(row.normalizedAttributes?.[rule.distinctBy] || row.name))).size : rows.length;
  // Installed offices vs. organisations the source found to have none (E-019).
  if (rule.notInstalled) {
    const notInstalled = rows.filter((row) => rule.notInstalled.keys.some((key) => rule.notInstalled.pattern.test(String(row.normalizedAttributes?.[key] ?? ""))));
    const installed = rows.filter((row) => !notInstalled.includes(row));
    return {
      kind: "facts",
      headline: { value: `${formatNumber(installed.length)}곳`, label: `${rule.unit} · ${rule.notInstalledLabel} ${notInstalled.length}곳은 별도 · ${periodOf(item, yearsFromEntities(rows))}` },
      preview: { facts: installed.slice(0, 3).map((row) => ({ label: text(nameOf(row)), value: "" })), more: Math.max(0, installed.length - 3), note: notInstalled.length ? `${rule.notInstalledLabel}: ${notInstalled.map((row) => text(nameOf(row))).join(", ")}` : undefined },
      period: periodOf(item, yearsFromEntities(rows)),
      selection: { measure: null, sex: null, year: null, period: null, dimensions: {} },
      basis: { unit: rule.unit, rule: `원천이 '사무소 미설치'로 표시한 기관은 사무소로 세지 않음 · 사무소 ${installed.length}곳 + 없는 기관 ${notInstalled.length}곳 = 원천 ${rows.length}행`, count: { installed: installed.length, notInstalled: notInstalled.length, rows: rows.length } },
      measure: null,
    };
  }
  // Rows are uses of a smaller set of programmes (E-020).
  if (rule.identity) {
    const identities = [...new Set(rows.map((row) => text(row.normalizedAttributes?.[rule.identity.key]).split(rule.identity.split)[0].trim()).filter(Boolean))];
    return {
      kind: "facts",
      headline: { value: `${formatNumber(identities.length)}개`, label: `${rule.identity.label} · ${rule.unit} ${rows.length}건 · ${periodOf(item, yearsFromEntities(rows))}` },
      preview: { facts: identities.slice(0, 3).map((name) => ({ label: name, value: `${rows.filter((row) => text(row.normalizedAttributes?.[rule.identity.key]).split(rule.identity.split)[0].trim() === name).length}건` })), more: Math.max(0, identities.length - 3) },
      period: periodOf(item, yearsFromEntities(rows)),
      selection: { measure: null, sex: null, year: null, period: null, dimensions: {} },
      basis: { unit: rule.identity.label, rule: `${rule.identity.label} 1개 = 같은 제도명(' — ' 앞) · 원천 ${rows.length}행은 ${rule.unit}로 셈`, count: { identities: identities.length, rows: rows.length } },
      measure: null,
    };
  }
  const period = periodOf(item, yearsFromEntities(rows));
  const selection = { measure: null, sex: null, year: null, period: null, dimensions: {} };

  if (rule.kind === "bars" && rule.groupBy) {
    const counts = new Map();
    let unlabelled = 0;
    for (const row of rows) {
      const value = text(row.normalizedAttributes?.[rule.groupBy]);
      if (!value) { unlabelled += 1; continue; }
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    const parts = [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const groupLabel = groupLabelOf(contract, rule.groupBy);
    if (parts.length >= 2) {
      return {
        kind: "bars",
        headline: { value: `${formatNumber(distinct)}${countSuffix(rule.unit)}`, label: `${rule.unit} 수 · ${period}${rule.individualOnly ? " · 개별 사업 행 기준" : ""}` },
        preview: { parts: parts.slice(0, 6), unit: `${rule.unit} 수`, scope: `${groupLabel}별`, omitted: parts.length - Math.min(parts.length, 6), unlabelled },
        period,
        selection: { ...selection, dimensions: {} },
        basis: { unit: rule.unit, rule: `${rule.unit} 1건 = 원천 1행${rule.individualOnly ? "(레코드구분=개별)" : ""}${rule.currentOnly ? "(현행 행만)" : ""}${aggregateNote} · ${groupLabel}별 건수${unlabelled ? ` · ${groupLabel} 미기재 ${unlabelled}건` : ""}`, count: { rows: rows.length, sourceRows: pack.entities.records.length } },
        measure: null,
      };
    }
  }
  if (rule.kind === "bars" && rule.valueKey) {
    const parts = rows
      .map((row) => ({ label: text(row.normalizedAttributes?.[rule.labelKey] || row.name), value: Number(row.normalizedAttributes?.[rule.valueKey]) }))
      .filter((part) => Number.isFinite(part.value) && !TOTAL_LIKE.test(part.label) && !/전국|합계/u.test(part.label))
      .sort((a, b) => b.value - a.value);
    return {
      kind: "bars",
      headline: { value: `${formatNumber(parts[0].value)} ${rule.valueUnit}`, label: `${parts[0].label} · ${rule.valueKey.replace(/_/gu, " ")} 최대` },
      preview: { parts: parts.slice(0, 6), unit: rule.valueUnit, scope: `${rule.unit}별`, omitted: parts.length - Math.min(parts.length, 6) },
      period,
      selection,
      basis: { unit: rule.unit, rule: `${rule.unit} ${rows.length}개의 ${rule.valueKey.replace(/_/gu, " ")} 비교` },
      measure: null,
    };
  }
  if (rule.kind === "documents") {
    // The same grouping the detail's document timeline uses: the source's
    // record-name column, falling back to the row name.
    const names = [...new Set(rows.map((row) => text(row.normalizedAttributes?.["속성1_레코드명"]) || text(row.name)).filter((name) => name && !/^[—–-]\s*/u.test(name)))];
    const years = yearsFromEntities(rows);
    const recent = names.slice(0, 3);
    return {
      kind: "facts",
      headline: { value: `${formatNumber(names.length)}건`, label: `${rule.unit} · 조항·속성 ${rows.length}행을 문서 단위로 묶음` },
      preview: { facts: recent.map((name) => ({ label: name, value: "" })), more: names.length - recent.length },
      period: years.length ? periodOf(item, years) : period,
      selection,
      basis: { unit: rule.unit, rule: "문서명이 같은 행을 1건으로 셈 · 행 수는 제도 수가 아님" },
      measure: null,
    };
  }
  if (rule.kind === "grades") {
    const counts = new Map();
    rows = rows.filter((row) => !/country/iu.test(text(row.normalizedAttributes?.행정단위)) && /basin_adm1/u.test(row.indicatorId || ""));
    for (const row of rows) {
      const grade = text(row.normalizedAttributes?.[rule.gradeKey]) || "미기재";
      counts.set(grade, (counts.get(grade) || 0) + 1);
    }
    const parts = [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const zones = new Set(rows.map((row) => text(row.normalizedAttributes?.["레코드_키"] || row.name))).size;
    return {
      kind: "bars",
      headline: { value: `${formatNumber(zones)}개 평가구역`, label: "기준 물 스트레스 등급별 구역 수 · Aqueduct 4.0 기준선" },
      preview: { parts: parts.slice(0, 6), unit: "구역 수", scope: "등급별", omitted: 0 },
      period,
      selection,
      basis: { unit: rule.unit, rule: "평가구역(유역×성×대수층) 1행 = 1구역 · 등급별 구역 수 · 성·시로 합치지 않음" },
      measure: null,
    };
  }
  if (rule.kind === "stations") {
    const stations = [...new Set(rows.map((row) => text(row.normalizedAttributes?.관측소명_베트남어 || row.name)))];
    const target = rows.filter((row) => text(row.normalizedAttributes?.시나리오) === "SSP2-4.5" && Number(row.normalizedAttributes?.분위수) === 50 && Number(row.normalizedAttributes?.연도) === 2100 && text(row.normalizedAttributes?.신뢰수준) !== "low");
    const parts = target.map((row) => ({ label: text(row.normalizedAttributes?.관측소명_베트남어), value: Number(row.normalizedAttributes?.["상대해수면_상승_m_2005년_기준"]) })).filter((part) => Number.isFinite(part.value)).sort((a, b) => b.value - a.value);
    return {
      kind: parts.length >= 2 ? "bars" : "facts",
      headline: parts.length ? { value: `${formatNumber(parts[0].value, 2)} m`, label: `${parts[0].label} · 2100년 상대해수면 상승(2005년 기준) · SSP2-4.5 중앙값` } : { value: `${stations.length}곳`, label: "관측소" },
      preview: { parts: parts.slice(0, 6), unit: "m", scope: "관측소별 · 2100년 · SSP2-4.5 중앙값", omitted: 0, facts: stations.map((name) => ({ label: name, value: "" })) },
      period,
      selection: { ...selection, dimensions: { scenario: "SSP2-4.5" } },
      basis: { unit: rule.unit, rule: "관측소 5곳 · IPCC AR6 상대해수면 전망 · 중앙값(50분위) · 시나리오·분위는 상세에서 선택" },
      measure: null,
    };
  }
  // facts: what the register holds. When rows are grouped (3 sites in 11
  // observation rows) the detail lists the rows, so the card leads with the
  // rows and states the group count beside them.
  const names = [...new Set(rows.map(nameOf).map(text).filter(Boolean))];
  return {
    kind: "facts",
    headline: rule.distinctBy
      ? { value: `${formatNumber(rows.length)}건`, label: `${rule.unit} ${formatNumber(distinct)}${countSuffix(rule.unit)}의 수록 행 · ${period}` }
      : { value: `${formatNumber(distinct)}${countSuffix(rule.unit)}`, label: `${rule.unit} · ${period}` },
    preview: { facts: names.slice(0, 3).map((name) => ({ label: name, value: "" })), more: Math.max(0, names.length - 3) },
    period,
    selection,
    basis: { unit: rule.unit, rule: `${rule.unit} 1건 = 원천 1행${rule.individualOnly ? "(레코드구분=개별)" : ""}${rule.currentOnly ? "(현행 행만)" : ""}${aggregateNote}${rule.distinctBy ? ` · ${rule.distinctBy.replace(/_/gu, " ")} 기준 중복 제거` : ""}${rule.note ? ` · ${rule.note}` : ""}`, count: { rows: rows.length, distinct, sourceRows: pack.entities.records.length } },
    measure: null,
  };
}

function countSuffix(unit) {
  if (/기관|기업|사무소/u.test(unit)) return "곳";
  if (/시설|광산|관측소|관측지점|유역/u.test(unit)) return "곳";
  return "건";
}

function yearsFromEntities(rows) {
  const years = new Set();
  for (const row of rows) {
    const candidates = [row.year, row.normalizedAttributes?.연도, row.normalizedAttributes?.기준연도, row.normalizedAttributes?.확인_연도, row.normalizedAttributes?.referenceYear, row.normalizedAttributes?.시작일, row.normalizedAttributes?.승인일, row.normalizedAttributes?.signedDate];
    for (const candidate of candidates) {
      const match = String(candidate ?? "").match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/u);
      if (match) years.add(Number(match[1]));
    }
  }
  return [...years].sort((a, b) => a - b);
}

// ------------------------------------------------------------------ provinces
function regionalCard(elementId, item, pack, contract) {
  const target = mapTargetById.get(elementId);
  const measures = REGIONAL_ENTITY_MEASURE[elementId] ? [REGIONAL_ENTITY_MEASURE[elementId]] : (target?.build?.measures || []).filter((measure) => measure.sourceKey);
  const all = pack.entities.records;
  const rows = all.filter((row) => !/^(전국|country)$/iu.test(text(row.normalizedAttributes?.행정단위)));
  const chosen = measures.find((measure) => rows.some((row) => numberOf(row.normalizedAttributes?.[measure.sourceKey]) !== null));
  if (!chosen) return null;
  const byProvince = new Map();
  for (const row of rows) {
    const value = numberOf(row.normalizedAttributes?.[chosen.sourceKey]);
    if (value === null) continue;
    // The detail names a province by its Vietnamese name, else the romanised
    // name split at case changes ("BinhThuan" → "Binh Thuan").
    const name = (text(row.normalizedAttributes?.["지역명_베트남어"]) || text(row.normalizedAttributes?.["지역명_로마자"] || row.normalizedAttributes?.["2025_개편_후_소속_34개_체계"] || row.name)).replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2");
    if (!byProvince.has(name)) byProvince.set(name, value);
  }
  const values = [...byProvince.values()];
  const parts = [...byProvince.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const unit = unitShort(chosen.unit);
  const period = target?.period || periodOf(item);
  const top = parts[0];
  return {
    kind: "spatial",
    // National series rows in these layers are separate indicators (yearly
    // proxies, wind roses), not a total of the province column; the card
    // leads with the largest province and states the distribution.
    headline: { value: `${formatNumber(top.value)} ${unit}`, label: `${chosen.label} 최대 · ${top.label} · ${byProvince.size}개 성·시 중 · ${period}` },
    preview: { parts: parts.slice(0, 5), unit, scope: `${chosen.label} 상위 5개 성·시`, median: median(values), range: { min: quantile(values, 0), p10: quantile(values, 0.1), p90: quantile(values, 0.9), max: quantile(values, 1) }, provinces: byProvince.size },
    period,
    // The province screen (PublicRegionScenarioSummaryV138) reads its measure
    // from dim.regionMeasure; B-040 opened on 심도 2km while the card showed 1km.
    selection: { measure: null, sex: null, year: null, period: null, dimensions: { regionMeasure: chosen.sourceKey } },
    basis: { unit: "성·시 값", rule: `${chosen.label}(${unit}) ${byProvince.size}개 성·시 값의 중앙값과 상위 5개 · 전국값은 원천이 제공할 때만` },
    measure: { key: chosen.sourceKey, label: chosen.label, unit },
  };
}

function regionScenarioCard(elementId, item, pack, contract, options) {
  const target = mapTargetById.get(elementId);
  const contractSource = readFileSync(resolve(ROOT, "src/data/visualization/publicRegionScenarioContractV138.ts"), "utf8");
  const block = contractSource.slice(contractSource.indexOf(`"${elementId}": {`));
  const defaultKey = block.match(/defaultMeasure:\s*"([^"]+)"/u)?.[1];
  const measures = (target?.build?.measures || []).filter((measure) => measure.sourceKey);
  const chosen = measures.find((measure) => measure.sourceKey === defaultKey) || { sourceKey: defaultKey, label: defaultKey, unit: "" };
  const rows = pack.entities.records.filter((row) => !/^(전국|country)$/iu.test(text(row.normalizedAttributes?.행정단위)) && numberOf(row.normalizedAttributes?.[chosen.sourceKey]) !== null);
  const scenarioOf = (row) => text(row.normalizedAttributes?.시나리오);
  const yearOf = (row) => Number(row.normalizedAttributes?.연도);
  const scenarios = [...new Set(rows.map(scenarioOf))].filter(Boolean);
  const scenario = options.observed ? null : (scenarios.find((s) => /245/u.test(s)) || scenarios[0]);
  const scenarioRows = scenario ? rows.filter((row) => scenarioOf(row) === scenario) : rows.filter((row) => !scenarioOf(row) || /hist/iu.test(scenarioOf(row)));
  const byYear = new Map();
  for (const row of scenarioRows) {
    const year = yearOf(row);
    if (!Number.isFinite(year)) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(numberOf(row.normalizedAttributes?.[chosen.sourceKey]));
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const points = years.map((year) => ({ year, value: median(byYear.get(year)) }));
  const unit = unitShort(chosen.unit || "");
  const historical = options.observed ? points : points.filter((point) => point.year <= 2014);
  const anchorYear = options.observed ? years[years.length - 1] : 2100;
  const anchor = points.find((point) => point.year === anchorYear) || points[points.length - 1];
  const anchorValues = byYear.get(anchor.year) || [];
  const scenarioLabel = scenario ? scenario.replace(/^ssp(\d)(\d)(\d)$/u, "SSP$1-$2.$3") : "관측 기반";
  return {
    kind: "spatial-trend",
    headline: { value: `${formatNumber(anchor.value, 1)} ${unit}`, label: `${chosen.label} · 63개 성·시 중앙값 · ${anchor.year}년${scenario ? ` · ${scenarioLabel}` : ""}` },
    preview: { points: points.filter((point, index) => index % Math.max(1, Math.floor(points.length / 40)) === 0 || point === anchor), unit, seriesLabel: `${scenarioLabel} · 성·시 중앙값`, range: { p10: quantile(anchorValues, 0.1), p90: quantile(anchorValues, 0.9) }, scenarios: scenarios.length, provinces: new Set(scenarioRows.map((row) => row.normalizedAttributes?.지역명_로마자 || row.name)).size, historicalUntil: options.observed ? null : 2014 },
    period: (() => {
      const allYears = rows.map(yearOf).filter(Number.isFinite);
      const minYear = Math.min(...allYears);
      const maxYear = Math.max(...allYears);
      return options.observed ? `${minYear}–${maxYear}년` : `${minYear}–${maxYear}년 (과거 모형 ${minYear}–2014 · 전망 2015–${maxYear})`;
    })(),
    selection: { measure: null, sex: null, year: anchor.year, period: null, dimensions: scenario ? { regionMeasure: chosen.sourceKey, scenario } : { regionMeasure: chosen.sourceKey } },
    basis: { unit: "성·시 값", rule: `${chosen.label} ${scenario ? `${scenarioLabel} 시나리오의 ` : ""}63개 성·시 값 중앙값 추이 · 10~90분위는 지역 간 분포이며 모형 불확실성이 아님${scenario ? " · 과거(historical)와 SSP 구간은 잇지 않음" : ""}` },
    measure: { key: chosen.sourceKey, label: chosen.label, unit },
  };
}

// ------------------------------------------------------------------ assemble
const cards = [];
const review = [];
for (const item of [...catalog].sort((a, b) => a.elementId.localeCompare(b.elementId))) {
  const elementId = item.elementId;
  const pack = packs.get(elementId);
  const contract = contractByElement.get(elementId);
  const observations = pack?.observations?.records || [];
  const entities = pack?.entities?.records || [];
  const homeCard = homePreview.cards.find((card) => card.elementId === elementId);
  let card = null;
  try {
    if (contract.primaryRenderer === "status-only" || (!observations.length && !entities.length)) {
      card = { kind: "status", headline: { value: "값 제공 전", label: item.publicStatus === "schema-only" ? "입력 양식만 있는 자료" : item.publicStatus === "data-entry-planned" ? "입력 예정 자료" : "원자료 미수집" }, preview: { note: ({ "not-collected": "원자료가 아직 수집되지 않아 값을 제공하지 않습니다", "schema-only": "입력 양식만 있어 실제 값이 없습니다", "data-entry-planned": "입력 예정 자료로 아직 값이 없습니다" })[contract.noDataReason] || "현재 값을 제공하지 않습니다" }, period: "—", selection: null, basis: { unit: "없음", rule: "값이 없어 수치·그래프를 만들지 않음" }, measure: null };
    } else if (homeCard) {
      card = {
        kind: homeCard.kind === "map" ? "map" : homeCard.kind === "signed-bars" ? "signed-bars" : homeCard.kind === "grouped-bars" ? "grouped-bars" : homeCard.kind,
        headline: homeCard.headline,
        preview: { home: true },
        period: homeCard.period,
        selection: homeCard.selection || null,
        basis: { unit: "홈과 동일", rule: "홈 주요 데이터와 같은 요약자산(home-preview-v139)" },
        // The measure the home card summarised, so the provenance names its
        // indicators rather than every indicator of the element.
        measure: homeCard.selection?.measure
          ? { key: homeCard.selection.measure, label: contract.measures.find((m) => m.key === homeCard.selection.measure)?.labelKo || "", unit: contract.measures.find((m) => m.key === homeCard.selection.measure)?.unit || "" }
          : null,
        fromHome: true,
      };
    } else if (REGION_SCENARIO[elementId]) {
      card = regionScenarioCard(elementId, item, pack, contract, REGION_SCENARIO[elementId]);
    } else if (observations.length && !(ENTITY_RULES[elementId] && !observations.some(isNumeric))) {
      card = observationCard(elementId, item, pack, contract, OVERRIDES[elementId]);
      if (!card && entities.length && ENTITY_RULES[elementId]) card = entityCard(elementId, item, pack, contract, ENTITY_RULES[elementId]);
    } else if (REGIONAL_LAYERS.has(elementId)) {
      card = regionalCard(elementId, item, pack, contract) || (ENTITY_RULES[elementId] ? entityCard(elementId, item, pack, contract, ENTITY_RULES[elementId]) : null);
    } else if (ENTITY_RULES[elementId]) {
      card = entityCard(elementId, item, pack, contract, ENTITY_RULES[elementId]);
    } else if (entities.length) {
      card = entityCard(elementId, item, pack, contract, { unit: "항목", kind: "facts" });
      warn(elementId, "entity element without a reviewed rule; facts card");
    }
  } catch (error) {
    warn(elementId, `builder failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!card) {
    warn(elementId, "no card could be built");
    card = { kind: "facts", headline: { value: "—", label: "요약 없음" }, preview: { facts: [] }, period: periodOf(item), selection: null, basis: { unit: "—", rule: "규칙 없음" }, measure: null };
  }
  const measureRows = card.measure?.key ? semanticRows(observations, semanticByElement.get(elementId)).filter((row) => row.measure?.key === card.measure.key) : [];
  const measureIndicatorIds = [...new Set(measureRows.map((row) => row.indicatorId))];
  // The rows the headline figure came from: the measure narrowed by every
  // dimension the card handed over, so a re-count from the download file
  // has one series to read.
  const handed = Object.entries(card.selection?.dimensions || {});
  const headlineRows = handed.length
    ? measureRows.filter((row) => handed.every(([key, value]) => row.dimensions?.[key] === value || row.dimensionLabels?.[key] === value))
    : measureRows;
  const headlineIndicatorIds = card.headlineIndicatorIds || [...new Set(headlineRows.map((row) => row.indicatorId))];
  delete card.headlineIndicatorIds;
  if (SPECIALISED_SELECTION[elementId] && card.selection) card.selection = SPECIALISED_SELECTION[elementId](card.selection);
  const usedIndicatorIds = measureIndicatorIds.length
    ? measureIndicatorIds
    : [...new Set([...observations.map((row) => row.indicatorId), ...entities.map((row) => row.indicatorId)].filter(Boolean))];
  const provider = homeCard ? homeCard.provider : providerFor(pack, usedIndicatorIds, item);
  const entry = {
    elementId,
    title: item.elementLabel,
    ...card,
    provider,
    mapConnected: mapConnected.has(elementId),
    downloadable: Boolean(item.downloadAllowed && (item.downloadableRecordCount || 0) > 0),
    provenance: { packUrl: pack?.packUrl || null, observationCount: observations.length, entityCount: entities.length, indicatorIds: usedIndicatorIds, headlineIndicatorIds: headlineIndicatorIds.length ? headlineIndicatorIds : undefined },
  };
  cards.push(entry);
  review.push(`| ${elementId} | ${card.kind} | ${card.headline.value} | ${card.headline.label} | ${card.period} | ${card.basis.rule} |`);
}

const output = {
  schemaVersion: "v140-card-summaries-1",
  dataSnapshot: manifest.generatedAt,
  generatedAt: new Date().toISOString(),
  generatedFrom: { bundleIndex: "packs/bundle-index-v124.json", semantics: "semantic/element-visualization-contracts-v125.json", homePreview: homePreview.schemaVersion },
  sourceHash: createHash("sha256").update(readFileSync(resolve(DATA, "packs/bundle-index-v124.json"))).digest("hex").slice(0, 16),
  cards,
};
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 1)}\n`);
mkdirSync(dirname(REVIEW_PATH), { recursive: true });
const kinds = cards.reduce((acc, card) => ({ ...acc, [card.kind]: (acc[card.kind] || 0) + 1 }), {});
writeFileSync(REVIEW_PATH, `# 152개 카드 요약 검토표 (V140)\n\n생성 ${output.generatedAt} · 데이터 ${output.dataSnapshot}\n\n종류별: ${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(" · ")}\n\n| 요소 | 종류 | 핵심값 | 설명 | 자료기간 | 집계 규칙 |\n| --- | --- | --- | --- | --- | --- |\n${review.join("\n")}\n\n## 경고\n\n${warnings.map((w) => `- ${w.elementId}: ${w.message}`).join("\n") || "없음"}\n`);
writeFileSync(REPORT_PATH, `${JSON.stringify({ generatedAt: output.generatedAt, cards: cards.length, kinds, warnings, bytes: Buffer.byteLength(JSON.stringify(output)) }, null, 2)}\n`);
console.log(JSON.stringify({ cards: cards.length, kinds, warnings: warnings.length, bytes: Buffer.byteLength(JSON.stringify(output)) }));
