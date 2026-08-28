import type { VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import type {
  E012MeasureKeyV125,
  E012OccupationV125,
  E012RankedOccupationV125,
  E012SexV125,
  IndicatorSemanticV125,
  RecordSemanticV125,
  SemanticMeasureV125,
  SemanticObservationV125,
  SemanticUnitFamilyV125,
} from "./semanticTypesV125";

export const E012_MEASURE_KEYS_V125: E012MeasureKeyV125[] = [
  "employment_rate",
  "employed_persons",
  "average_monthly_wage",
  "occupation_employment_count",
  "occupation_employment_share",
  "occupation_female_share",
  "occupation_wage",
];

export const E012_OCCUPATIONS_V125: Array<{
  value: E012RankedOccupationV125;
  labelKo: string;
  sourceCode: string;
  sortOrder: number;
}> = [
  { value: "manager", labelKo: "관리자", sourceCode: "mgr", sortOrder: 1 },
  { value: "professional", labelKo: "전문가", sourceCode: "prof", sortOrder: 2 },
  { value: "technician", labelKo: "기술공·준전문가", sourceCode: "tech", sortOrder: 3 },
  { value: "clerk", labelKo: "사무직", sourceCode: "clerk", sortOrder: 4 },
  { value: "service_sales", labelKo: "서비스·판매직", sourceCode: "service", sortOrder: 5 },
  { value: "skilled_agriculture", labelKo: "농림어업 숙련직", sourceCode: "agri", sortOrder: 6 },
  { value: "craft", labelKo: "기능원·관련직", sourceCode: "craft", sortOrder: 7 },
  { value: "machine_operator", labelKo: "장치·기계 조작·조립원", sourceCode: "operator", sortOrder: 8 },
  { value: "elementary", labelKo: "단순노무직", sourceCode: "elem", sortOrder: 9 },
  { value: "other", labelKo: "기타·미정의", sourceCode: "other", sortOrder: 10 },
];

export const E012_OCCUPATION_OPTIONS_V125: Array<{
  value: E012OccupationV125;
  labelKo: string;
  sourceCode: string;
  sortOrder: number;
}> = [
  { value: "all", labelKo: "전체 직군", sourceCode: "all", sortOrder: 0 },
  ...E012_OCCUPATIONS_V125,
];

export const E012_SEXES_V125: Array<{
  value: E012SexV125;
  labelKo: string;
  sortOrder: number;
}> = [
  { value: "total", labelKo: "전체", sortOrder: 0 },
  { value: "male", labelKo: "남성", sortOrder: 1 },
  { value: "female", labelKo: "여성", sortOrder: 2 },
];

const E012_MEASURES: Record<E012MeasureKeyV125, Omit<SemanticMeasureV125, "unit">> = {
  employment_rate: {
    key: "employment_rate",
    labelKo: "고용률",
    unitFamily: "percent",
    aggregation: "rate",
    denominator: "생산가능인구",
  },
  employed_persons: {
    key: "employed_persons",
    labelKo: "총 취업자 수",
    unitFamily: "count",
    aggregation: "sum",
  },
  average_monthly_wage: {
    key: "average_monthly_wage",
    labelKo: "평균 월임금",
    unitFamily: "currency-per-period",
    aggregation: "mean",
  },
  occupation_employment_count: {
    key: "occupation_employment_count",
    labelKo: "직군별 종사자 수",
    unitFamily: "count",
    aggregation: "sum",
  },
  occupation_employment_share: {
    key: "occupation_employment_share",
    labelKo: "고용 구성비",
    unitFamily: "percent",
    aggregation: "share",
    denominator: "해당 성별 전체 취업자",
  },
  occupation_female_share: {
    key: "occupation_female_share",
    labelKo: "직군 내 여성 비중",
    unitFamily: "percent",
    aggregation: "share",
    denominator: "해당 직군 전체 취업자",
  },
  occupation_wage: {
    key: "occupation_wage",
    labelKo: "직군별 월평균 임금",
    unitFamily: "currency-per-period",
    aggregation: "mean",
  },
};

const occupationBySourceCode = new Map(
  E012_OCCUPATION_OPTIONS_V125.map((item) => [item.sourceCode, item])
);
const sexByValue = new Map(E012_SEXES_V125.map((item) => [item.value, item]));

function e012Measure(key: E012MeasureKeyV125, unit: string): SemanticMeasureV125 {
  return { ...E012_MEASURES[key], unit };
}

function e012FixedSemantic(
  indicatorId: string,
  measureKey: E012MeasureKeyV125,
  unit: string,
  fixedDimensions: Record<string, string>,
  fixedDimensionLabels: Record<string, string>
): IndicatorSemanticV125 {
  const measure = e012Measure(measureKey, unit);
  const dimensionPart = Object.entries(fixedDimensions)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
  const labelPart = Object.values(fixedDimensionLabels).filter(Boolean).join(" · ");
  const displayLabel = labelPart ? `${measure.labelKo} · ${labelPart}` : measure.labelKo;
  const seriesKey = `${measure.key}|${unit}|${dimensionPart}`;
  return {
    indicatorId,
    measure,
    dimensions: fixedDimensions,
    dimensionLabels: fixedDimensionLabels,
    displayLabel,
    seriesKey,
    axisGroupKey: `${measure.key}|${unit}`,
    sourceLabel: displayLabel,
    sourceNote: null,
    sourceProvenance: null,
    inferenceMethod: "explicit-override",
  };
}

/**
 * E-012 is intentionally decoded from a closed indicator-id grammar. The
 * source note is validated by the V125 build and is never reparsed in React.
 */
export function getE012IndicatorSemanticV125(
  indicatorId: string,
  unitValue?: string | null
): IndicatorSemanticV125 {
  const unit = unitValue || "—";
  if (indicatorId === "E-012_employment_rate") {
    return e012FixedSemantic(indicatorId, "employment_rate", unit, {}, {});
  }
  if (indicatorId === "E-012_employed_persons") {
    return e012FixedSemantic(indicatorId, "employed_persons", unit, {}, {});
  }
  if (/^E-012_avg_monthly_wage_(lcu|usd)$/.test(indicatorId)) {
    const currency = indicatorId.endsWith("_usd") ? "USD" : "VND";
    return e012FixedSemantic(
      indicatorId,
      "average_monthly_wage",
      unit,
      { currency },
      { currency }
    );
  }
  if (indicatorId === "E-012_industry_employment_share") {
    return e012FixedSemantic(
      indicatorId,
      "occupation_employment_share",
      unit,
      { occupation: "all", sex: "total", classification: "industry" },
      { occupation: "전체 직군", sex: "전체", classification: "산업부문" }
    );
  }

  const patterns: Array<{
    pattern: RegExp;
    measure: E012MeasureKeyV125;
    defaultSex?: E012SexV125;
  }> = [
    {
      pattern: /^E-012_occupation_employment_(all|mgr|prof|tech|clerk|service|agri|craft|operator|elem|other)_(total|male|female)$/,
      measure: "occupation_employment_count",
    },
    {
      pattern: /^E-012_occupation_employment_share_(all|mgr|prof|tech|clerk|service|agri|craft|operator|elem|other)_(total|male|female)$/,
      measure: "occupation_employment_share",
    },
    {
      pattern: /^E-012_occupation_female_share_(all|mgr|prof|tech|clerk|service|agri|craft|operator|elem|other)$/,
      measure: "occupation_female_share",
      defaultSex: "female",
    },
    {
      pattern: /^E-012_occupation_wage_(all|mgr|prof|tech|clerk|service|agri|craft|operator|elem|other)_(total|male|female)$/,
      measure: "occupation_wage",
    },
  ];

  for (const candidate of patterns) {
    const match = indicatorId.match(candidate.pattern);
    if (!match) continue;
    const occupation = occupationBySourceCode.get(match[1]);
    const sexValue = (candidate.defaultSex || match[2]) as E012SexV125;
    const sex = sexByValue.get(sexValue);
    if (!occupation || !sex) break;
    return e012FixedSemantic(
      indicatorId,
      candidate.measure,
      unit,
      { occupation: occupation.value, sex: sex.value },
      { occupation: occupation.labelKo, sex: sex.labelKo }
    );
  }

  throw new Error(`E-012 semantic grammar does not recognize ${indicatorId}`);
}

function mergeObservationSemantic(
  observation: VietnamObservationV124,
  indicatorSemantic: IndicatorSemanticV125,
  recordSemantic?: RecordSemanticV125
): SemanticObservationV125 {
  const dimensions: Record<string, string> = {
    ...indicatorSemantic.dimensions,
    ...(recordSemantic?.dimensions || {}),
  };
  const dimensionLabels: Record<string, string> = {
    ...indicatorSemantic.dimensionLabels,
    ...(recordSemantic?.dimensionLabels || {}),
  };
  if (observation.year !== null && observation.year !== undefined) {
    dimensions.year = String(observation.year);
    dimensionLabels.year = String(observation.year);
  }
  if (observation.period) {
    dimensions.period = observation.period;
    dimensionLabels.period = observation.period;
  }
  return {
    ...observation,
    semanticMeasure: indicatorSemantic.measure,
    dimensions,
    dimensionLabels,
    displayLabel: recordSemantic?.displayLabel || indicatorSemantic.displayLabel,
    seriesKey: recordSemantic?.seriesKey || indicatorSemantic.seriesKey,
  };
}

export function buildSemanticObservationsV125(
  observations: VietnamObservationV124[],
  indicatorSemantics: IndicatorSemanticV125[],
  recordSemantics: RecordSemanticV125[] = []
): SemanticObservationV125[] {
  const byIndicator = new Map(
    indicatorSemantics.map((semantic) => [semantic.indicatorId, semantic])
  );
  const byRecord = new Map(
    recordSemantics.map((semantic) => [semantic.recordId, semantic])
  );
  return observations.map((observation) => {
    const semantic = byIndicator.get(observation.indicatorId);
    if (!semantic) {
      throw new Error(`Missing V125 semantics for ${observation.indicatorId}`);
    }
    return mergeObservationSemantic(
      observation,
      semantic,
      byRecord.get(observation.recordId)
    );
  });
}

export function buildE012SemanticObservationsV125(
  observations: VietnamObservationV124[]
): SemanticObservationV125[] {
  const semanticByIndicator = new Map<string, IndicatorSemanticV125>();
  observations.forEach((observation) => {
    if (!semanticByIndicator.has(observation.indicatorId)) {
      semanticByIndicator.set(
        observation.indicatorId,
        getE012IndicatorSemanticV125(observation.indicatorId, observation.unit)
      );
    }
  });
  return buildSemanticObservationsV125(
    observations,
    Array.from(semanticByIndicator.values())
  );
}

export function inferUnitFamilyV125(unitValue?: string | null): SemanticUnitFamilyV125 {
  const unit = (unitValue || "").toLowerCase();
  if (!unit || unit === "—" || unit === "-") return "other";
  if (unit.includes("%") || unit.includes("percent")) return "percent";
  if (/co2|co₂|co₂e|co2e|ghg|carbon/.test(unit)) return "emissions";
  if (/mw|gw|kw/.test(unit) && !/mwh|gwh|kwh/.test(unit)) return "capacity";
  if (/mwh|gwh|kwh|twh|\btj\b|\bpj\b|toe/.test(unit)) return "energy";
  if (/ha|km²|km2|m²|m2/.test(unit)) return "area";
  if (/vnd|usd|us\$|\$|đồng|dong/.test(unit)) {
    return /month|monthly|월|day|일|year|yr|년/.test(unit)
      ? "currency-per-period"
      : "currency";
  }
  if (/명|건|개|persons?|people|count|facilit/.test(unit)) return "count";
  if (/score|점|index|rank/.test(unit)) return "score";
  return "other";
}
