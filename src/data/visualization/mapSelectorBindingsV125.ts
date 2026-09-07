import type { DataFinderSelectorStateV125 } from "../../types/dataFinderV125";

export type MapSelectorHandoffStatusV125 =
  | "matched"
  | "element-only"
  | "default"
  | "unsupported-selector";

export type MapSelectorResolutionV125 = {
  variable: string | null;
  period: string | null;
  status: MapSelectorHandoffStatusV125;
  reason: string | null;
};

export type MapSelectorAvailabilityV125 = {
  variables: ReadonlyArray<{
    key: string;
    label?: string;
    unit?: string;
    periods: readonly string[];
  }>;
};

export type MapSelectorStateV125 = {
  variable: string;
  period: string;
};

export type MapSemanticPresentationV125 = {
  measureKey: string | null;
  measureLabel: string;
  indicatorLabel: string;
  unit: string;
  period: string;
  dimensions: Array<{ key: string; label: string; value: string }>;
};

type MapSelectorBindingV125 = {
  elementId: string;
  mapVariable: string;
  semanticMeasure?: string;
  dimensions?: Record<string, string>;
  fixedPeriod?: string;
  yearToPeriod?: Record<string, string>;
  allowedPeriods?: readonly string[];
  elementOnly?: boolean;
};

export const A024_LINE_MEASURE_V125 = "measure-d30e19e20b62";

/**
 * This is the checked, map-facing projection of the generated V125 semantic
 * contract. Keys are the immutable semantic measure keys used by Data Finder;
 * values are the same Korean labels published in that contract. The map never
 * derives a second label by trimming an indicator or note string.
 */
const SEMANTIC_MEASURE_LABELS_V125: Record<string, string> = {
  "measure-e5647010075d": "발전소 목록",
  "measure-d30e19e20b62": "송전망 선로 목록",
  "measure-ab1a3ae58df4": "GVI 취약성 지수",
  "measure-f43b900eeeb1": "구성지표",
  "measure-86da1cb1a3cb": "구성지표",
  "measure-6c98c31d75ee": "구성지표",
  "measure-41d1c0b7c82f": "구성지표",
  "measure-4dd1d8339506": "구성지표",
  "measure-8dab1a416248": "성(省)별 분석대상 면적",
  "measure-f359324070f1": "성(省)별 수관 면적(2000)",
  "measure-88bc7742d358": "성(省)별 수관 면적(2010)",
  "measure-15d5f8e7a89f": "성(省)별 수관 피복률",
  "measure-2d920961b8a8": "연간 수관 손실",
  "measure-7b34d12b5808": "산림탄소 순플럭스",
  "measure-cfc89d19fbf4": "성(省)별 산림탄소 순플럭스(연평균)",
  "measure-673b73a1af2c": "성(省)별 산림탄소 총배출(연평균)",
  "measure-a8111991c8e6": "성(省)별 산림탄소 총흡수(연평균)",
  "measure-8e10584d8321": "성(省)별 지상부 탄소밀도",
  "measure-20939584a8d3": "성(省)별 지상부 탄소저장량",
  "measure-d2cff1d4fccb": "지상부 탄소저장량",
  "measure-05aa50767eb1": "개정 PDP8 부록II 지역별 재생에너지 배분",
  "measure-9de10ab2d1fb": "주관 부처별 기후 예산 규모",
};

const ELEMENT_ONLY_MEASURES_V125: Record<string, string> = {
  "A-024": A024_LINE_MEASURE_V125,
};

const DIMENSION_LABELS_V125: Record<string, string> = {
  category: "기술",
  detail: "세부 분류",
  detail_2: "지역",
  region: "지역",
  scenario: "시나리오",
  sex: "성별",
  status: "상태",
  technology: "기술",
  voltageKv: "전압",
};

const NON_SEMANTIC_DIMENSION_KEYS_V125 = new Set(["year", "period"]);

function identityYearToPeriodV125(
  start: number,
  end: number
): Record<string, string> {
  return Object.fromEntries(
    Array.from({ length: end - start + 1 }, (_, index) => {
      const year = String(start + index);
      return [year, year];
    })
  );
}

/**
 * Verified by joining V124 spatial sourceRecordId/sourceIndicatorId values to
 * the V125 semantic shards. These are exact tuples, never fuzzy label matches.
 */
const MAP_SELECTOR_BINDINGS_V125: MapSelectorBindingV125[] = [
  { elementId: "A-023", mapVariable: "locations", fixedPeriod: "2026", elementOnly: true },
  {
    elementId: "A-024",
    mapVariable: "all",
    fixedPeriod: "2016",
    elementOnly: true,
  },
  { elementId: "B-048", mapVariable: "locations", fixedPeriod: "2022", elementOnly: true },
  { elementId: "C-025", mapVariable: "locations", fixedPeriod: "2026", elementOnly: true },
  {
    elementId: "D-018",
    mapVariable: "regional-scope",
    fixedPeriod: "2026",
    elementOnly: true,
  },

  {
    elementId: "B-021",
    mapVariable: "gvi-6",
    semanticMeasure: "measure-ab1a3ae58df4",
    yearToPeriod: identityYearToPeriodV125(2000, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "1-gni",
    semanticMeasure: "measure-f43b900eeeb1",
    yearToPeriod: identityYearToPeriodV125(1990, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "361901f103f6",
    semanticMeasure: "measure-86da1cb1a3cb",
    yearToPeriod: identityYearToPeriodV125(1990, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "e7f52a81c079",
    semanticMeasure: "measure-6c98c31d75ee",
    dimensions: { detail: "도시화율" },
    yearToPeriod: identityYearToPeriodV125(1994, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "c823a6adab58",
    semanticMeasure: "measure-6c98c31d75ee",
    dimensions: { detail: "부양비" },
    yearToPeriod: identityYearToPeriodV125(1994, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "iwi-70",
    semanticMeasure: "measure-6c98c31d75ee",
    dimensions: { detail: "빈곤 가구 비율(IWI<70)" },
    yearToPeriod: identityYearToPeriodV125(1994, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "b9e9fdabb2df",
    semanticMeasure: "measure-6c98c31d75ee",
    dimensions: { detail: "상수도 보급 가구 비율" },
    yearToPeriod: identityYearToPeriodV125(2003, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "gdi",
    semanticMeasure: "measure-41d1c0b7c82f",
    dimensions: { detail: "성개발지수(GDI)" },
    yearToPeriod: identityYearToPeriodV125(1992, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "ac9d19fb3b52",
    semanticMeasure: "measure-6c98c31d75ee",
    dimensions: { detail: "전기 보급 가구 비율" },
    yearToPeriod: identityYearToPeriodV125(1994, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "sci",
    semanticMeasure: "measure-41d1c0b7c82f",
    dimensions: { detail: "종합 지방부패지수(SCI)" },
    yearToPeriod: identityYearToPeriodV125(1995, 2022),
  },
  {
    elementId: "B-021",
    mapVariable: "25",
    semanticMeasure: "measure-4dd1d8339506",
    dimensions: { detail: "평균 교육연수(25세 이상)" },
    yearToPeriod: identityYearToPeriodV125(1994, 2023),
  },
  {
    elementId: "B-021",
    mapVariable: "5d51cd2a3a0c",
    semanticMeasure: "measure-6c98c31d75ee",
    dimensions: { detail: "휴대폰 보유 가구 비율" },
    yearToPeriod: identityYearToPeriodV125(2003, 2023),
  },

  {
    elementId: "B-031",
    mapVariable: "analysis-area",
    semanticMeasure: "measure-8dab1a416248",
    fixedPeriod: "2000",
    yearToPeriod: { "2000": "2000" },
  },
  {
    elementId: "B-031",
    mapVariable: "tree-cover-area-2000",
    semanticMeasure: "measure-f359324070f1",
    fixedPeriod: "2000",
    yearToPeriod: { "2000": "2000" },
  },
  {
    elementId: "B-031",
    mapVariable: "tree-cover-area-2010",
    semanticMeasure: "measure-88bc7742d358",
    fixedPeriod: "2010",
    yearToPeriod: { "2010": "2010" },
  },
  {
    elementId: "B-032",
    mapVariable: "canopy-cover-30",
    semanticMeasure: "measure-15d5f8e7a89f",
    dimensions: { detail: "임계 30%" },
    yearToPeriod: {
      "2000": "2000",
      "2010": "2010",
    },
  },
  {
    elementId: "B-033",
    mapVariable: "annual-tree-cover-loss",
    semanticMeasure: "measure-2d920961b8a8",
    dimensions: { detail: "성(省) 단위" },
    yearToPeriod: identityYearToPeriodV125(2001, 2025),
  },
  {
    elementId: "B-034",
    mapVariable: "e9c042582276",
    semanticMeasure: "measure-7b34d12b5808",
    fixedPeriod: "2025",
    yearToPeriod: { "2025": "2025" },
  },
  {
    elementId: "B-034",
    mapVariable: "8fca7c8dd189",
    semanticMeasure: "measure-cfc89d19fbf4",
    fixedPeriod: "2025",
    yearToPeriod: { "2025": "2025" },
  },
  {
    elementId: "B-034",
    mapVariable: "5547c8507ecb",
    semanticMeasure: "measure-673b73a1af2c",
    fixedPeriod: "2025",
    yearToPeriod: { "2025": "2025" },
  },
  {
    elementId: "B-034",
    mapVariable: "7f74ea9db7ec",
    semanticMeasure: "measure-a8111991c8e6",
    fixedPeriod: "2025",
    yearToPeriod: { "2025": "2025" },
  },
  {
    elementId: "B-034",
    mapVariable: "eec89b0aa34e",
    semanticMeasure: "measure-8e10584d8321",
    fixedPeriod: "2000",
    yearToPeriod: { "2000": "2000" },
  },
  {
    elementId: "B-034",
    mapVariable: "ffa9327918a4",
    semanticMeasure: "measure-20939584a8d3",
    fixedPeriod: "2000",
    yearToPeriod: { "2000": "2000" },
  },
  {
    elementId: "B-034",
    mapVariable: "53b551c16b5c",
    semanticMeasure: "measure-d2cff1d4fccb",
    fixedPeriod: "2000",
    yearToPeriod: { "2000": "2000" },
  },

  ...[
    ["dien-sinh-khoi", "바이오매스발전(điện sinh khối)"],
    ["thuy-dien-nho", "소수력(thủy điện nhỏ)"],
    ["30mw-50mw", "수력 30MW초과~50MW미만"],
    ["thuy-dien-tich-nang", "양수발전(thủy điện tích năng)"],
    ["dmt-mai-nha", "옥상태양광(ĐMT mái nhà)"],
    ["dien-gio-tren-bo-va-gan-bo", "육상 근해 풍력(điện gió trên bờ và gần bờ)"],
    ["dmt-tap-trung", "집중형 태양광(ĐMT tập trung)"],
    ["dien-rac", "폐기물발전(điện rác)"],
  ].map(([mapVariable, category]) => ({
    elementId: "C-016",
    mapVariable,
    semanticMeasure: "measure-05aa50767eb1",
    dimensions: { category },
    yearToPeriod:
      mapVariable === "30mw-50mw"
        ? { "2025": "2025-2030" }
        : ({
            "2025": "2025-2030",
            "2031": "2031-2035",
          } as Record<string, string>),
  })),
  {
    elementId: "D-008",
    mapVariable: "provincial-climate-budget",
    semanticMeasure: "measure-9de10ab2d1fb",
    dimensions: { detail: "성 단위 기후변화 지출 누계" },
    fixedPeriod: "2010-2013",
    yearToPeriod: { "2013": "2010-2013" },
  },
];

export function resolveMapSelectorBindingV125(
  elementId: string,
  selection: DataFinderSelectorStateV125,
  availability?: MapSelectorAvailabilityV125
): MapSelectorResolutionV125 {
  const bindings = MAP_SELECTOR_BINDINGS_V125.filter(
    (binding) => binding.elementId === elementId
  );
  if (bindings.length === 0) {
    return {
      variable: null,
      period: selection.period || yearPeriodV125(selection.year),
      status: "default",
      reason: null,
    };
  }

  if (elementId === "A-024") {
    const voltage = selection.dimensions.voltageKv;
    const status = selection.dimensions.status;
    const requestsLineSelector = Boolean(
      selection.measure === A024_LINE_MEASURE_V125 || voltage || status
    );
    if (requestsLineSelector) {
      if (selection.measure && selection.measure !== A024_LINE_MEASURE_V125) {
        return unsupportedResolutionV125(
          "선택한 항목은 송전망 선 geometry와 연결되지 않습니다."
        );
      }
      if (voltage && !["all", "110", "220", "500"].includes(voltage)) {
        return unsupportedResolutionV125(
          `${voltage} kV는 검증된 송전망 전압 selector가 아닙니다.`
        );
      }
      if (status && !["all", "existing"].includes(status)) {
        return unsupportedResolutionV125(
          `${status} 상태는 현재 공간 원천에 존재하지 않습니다.`
        );
      }
      if (
        (selection.year !== null && selection.year !== 2016) ||
        (selection.period && selection.period !== "2016")
      ) {
        return unsupportedResolutionV125(
          "A-024 실제 송전망 geometry의 기준연도는 2016년입니다."
        );
      }
      const variable = voltage && voltage !== "all" ? voltage : "all";
      const availabilityReason = availabilityMismatchReasonV125(
        { elementId, mapVariable: variable, fixedPeriod: "2016" },
        "2016",
        availability
      );
      if (availabilityReason) return unsupportedResolutionV125(availabilityReason);
      return {
        variable,
        period: "2016",
        status: "matched",
        reason: null,
      };
    }
  }

  const elementOnly = bindings.find((binding) => binding.elementOnly);
  if (elementOnly) {
    const hasUnsupportedFilter = Boolean(
      selection.measure ||
        selection.sex ||
        (selection.year !== null &&
          String(selection.year) !== elementOnly.fixedPeriod) ||
        (selection.period && selection.period !== elementOnly.fixedPeriod) ||
        selectedDimensionEntriesV125(selection).length
    );
    return {
      variable: elementOnly.mapVariable,
      period: elementOnly.fixedPeriod || selection.period || yearPeriodV125(selection.year),
      status: "element-only",
      reason: hasUnsupportedFilter
        ? "이 공간 레이어는 요소 전체 위치만 제공하며 상세 분류 필터는 지원하지 않습니다."
        : null,
    };
  }

  const matching = bindings.filter((binding) =>
    bindingMatchesV125(binding, selection)
  );
  if (matching.length === 1) {
    const binding = matching[0];
    const periodResolution = resolvePeriodV125(binding, selection);
    if (periodResolution.reason) {
      return unsupportedResolutionV125(periodResolution.reason);
    }
    const availabilityReason = availabilityMismatchReasonV125(
      binding,
      periodResolution.period,
      availability
    );
    if (availabilityReason) {
      return unsupportedResolutionV125(availabilityReason);
    }
    return {
      variable: binding.mapVariable,
      period: periodResolution.period,
      status: "matched",
      reason: null,
    };
  }

  const hasSelection = Boolean(
    selection.measure ||
      selection.sex ||
      selection.year !== null ||
      selection.period ||
      selectedDimensionEntriesV125(selection).length
  );
  return {
    variable: null,
    period: hasSelection ? null : selection.period || yearPeriodV125(selection.year),
    status: hasSelection ? "unsupported-selector" : "default",
    reason: hasSelection ? unmatchedBindingReasonV125(bindings, selection) : null,
  };
}

/** Convert the current map selector into the exact Data Finder semantic state. */
export function dataFinderSelectorFromMapV125(
  elementId: string,
  mapSelector: MapSelectorStateV125,
  filterDimensions: Record<string, string> = {}
): DataFinderSelectorStateV125 {
  if (elementId === "A-024") {
    const dimensions: Record<string, string> = {};
    if (mapSelector.variable !== "all") {
      dimensions.voltageKv = mapSelector.variable;
    }
    Object.entries(filterDimensions).forEach(([key, value]) => {
      if (value && value !== "all") dimensions[key] = value;
    });
    return {
      measure: A024_LINE_MEASURE_V125,
      sex: null,
      year: 2016,
      period: "2016",
      dimensions,
    };
  }

  const candidates = MAP_SELECTOR_BINDINGS_V125.filter(
    (binding) =>
      binding.elementId === elementId && binding.mapVariable === mapSelector.variable
  );
  const binding =
    candidates.find((candidate) =>
      bindingSupportsPeriodV125(candidate, mapSelector.period)
    ) || candidates[0];
  const dimensions: Record<string, string> = {
    ...(binding?.dimensions || {}),
  };
  Object.entries(filterDimensions).forEach(([key, value]) => {
    if (value && value !== "all") dimensions[key] = value;
  });
  const year = semanticYearForPeriodV125(binding, mapSelector.period);
  const period = mapSelector.period && mapSelector.period !== "미표기"
    ? mapSelector.period
    : null;
  return {
    measure:
      binding?.semanticMeasure || ELEMENT_ONLY_MEASURES_V125[elementId] || null,
    sex: null,
    year,
    period,
    dimensions,
  };
}

/**
 * Build the shared semantic text shown by both map controls and feature detail.
 * The semantic measure key/label comes from the V125 projection above; the
 * indicator label and unit come from the verified V124 spatial selector tuple.
 */
export function resolveMapSemanticPresentationV125(
  elementId: string,
  selector: MapSelectorStateV125,
  availability: MapSelectorAvailabilityV125,
  filterDimensions: Record<string, string> = {},
  fallbackMeasureLabel = "지도 공간 레코드"
): MapSemanticPresentationV125 {
  const state = dataFinderSelectorFromMapV125(
    elementId,
    selector,
    filterDimensions
  );
  const option = availability.variables.find(
    (candidate) => candidate.key === selector.variable
  );
  return {
    measureKey: state.measure,
    measureLabel:
      (state.measure && SEMANTIC_MEASURE_LABELS_V125[state.measure]) ||
      fallbackMeasureLabel,
    indicatorLabel: option?.label || fallbackMeasureLabel,
    unit: option?.unit || "미표기",
    period: selector.period,
    dimensions: Object.entries(state.dimensions)
      .filter(([, value]) => Boolean(value))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        key,
        label: DIMENSION_LABELS_V125[key] || key,
        value: semanticDimensionValueLabelV125(key, value),
      })),
  };
}

export function mapVariableSelectorLabelV125(elementId: string): string {
  if (elementId === "A-024") return "전압";
  if (elementId === "B-034") return "탄소지표";
  if (elementId === "C-016") return "기술";
  return "항목";
}

export function mapPeriodSelectorLabelV125(elementId: string): string {
  if (elementId === "C-016" || elementId === "D-008") return "기간";
  return "기준연도";
}

export function semanticDimensionValueLabelV125(
  key: string,
  value: string
): string {
  if (key === "status" && value === "existing") return "기존·운영 중";
  if (key === "voltageKv" && value !== "all") return `${value} kV`;
  return value;
}

function bindingMatchesV125(
  binding: MapSelectorBindingV125,
  selection: DataFinderSelectorStateV125
): boolean {
  if (binding.semanticMeasure !== selection.measure) return false;
  const expected = Object.entries(binding.dimensions || {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const selected = selectedDimensionEntriesV125(selection);
  return (
    expected.length === selected.length &&
    expected.every(
      ([key, value], index) =>
        selected[index]?.[0] === key && selected[index]?.[1] === value
    )
  );
}

function resolvePeriodV125(
  binding: MapSelectorBindingV125,
  selection: DataFinderSelectorStateV125
): { period: string | null; reason: string | null } {
  const yearKey = selection.year === null ? null : String(selection.year);
  const mappedYear = yearKey ? binding.yearToPeriod?.[yearKey] : undefined;
  if (yearKey && binding.yearToPeriod && !mappedYear) {
    return {
      period: null,
      reason: `${selection.year}년은 선택한 공간 변수에서 지원하지 않아 지도 기본값을 표시합니다.`,
    };
  }
  if (selection.period && mappedYear && selection.period !== mappedYear) {
    return {
      period: null,
      reason: `${selection.year}년과 ${selection.period} 기간 조합은 검증된 공간 자료와 일치하지 않아 지도 기본값을 표시합니다.`,
    };
  }
  if (
    binding.fixedPeriod &&
    selection.period &&
    selection.period !== binding.fixedPeriod
  ) {
    return {
      period: null,
      reason: `${selection.period} 기간은 선택한 공간 변수에서 지원하지 않아 지도 기본값을 표시합니다.`,
    };
  }

  const period =
    selection.period || mappedYear || binding.fixedPeriod || yearKey || null;
  const allowedPeriods = new Set([
    ...(binding.allowedPeriods || []),
    ...Object.values(binding.yearToPeriod || {}),
    ...(binding.fixedPeriod ? [binding.fixedPeriod] : []),
  ]);
  if (period && allowedPeriods.size > 0 && !allowedPeriods.has(period)) {
    return {
      period: null,
      reason: `${period} 기간은 선택한 공간 변수에서 지원하지 않아 지도 기본값을 표시합니다.`,
    };
  }
  return { period, reason: null };
}

function availabilityMismatchReasonV125(
  binding: MapSelectorBindingV125,
  period: string | null,
  availability?: MapSelectorAvailabilityV125
): string | null {
  if (!availability) return null;
  const variable = availability.variables.find(
    (candidate) => candidate.key === binding.mapVariable
  );
  if (!variable) {
    return `${binding.mapVariable} 공간 변수가 현재 지도 자산에 없어 지도 기본값을 표시합니다.`;
  }
  if (period && !variable.periods.includes(period)) {
    return `${period} 기간은 ${binding.mapVariable} 공간 변수에서 지원하지 않아 지도 기본값을 표시합니다.`;
  }
  return null;
}

function selectedDimensionEntriesV125(
  selection: DataFinderSelectorStateV125
): Array<[string, string]> {
  const entries = Object.entries(selection.dimensions).filter(
    ([key]) => !NON_SEMANTIC_DIMENSION_KEYS_V125.has(key)
  );
  if (selection.sex) entries.push(["sex", selection.sex]);
  return entries.sort(([left], [right]) => left.localeCompare(right));
}

function unmatchedBindingReasonV125(
  bindings: MapSelectorBindingV125[],
  selection: DataFinderSelectorStateV125
): string {
  const selectedKeys = selectedDimensionEntriesV125(selection).map(([key]) => key);
  const measureBindings = bindings.filter(
    (binding) => binding.semanticMeasure === selection.measure
  );
  const declaredKeys = new Set(
    measureBindings.flatMap((binding) => Object.keys(binding.dimensions || {}))
  );
  const unsupportedKeys = selectedKeys.filter((key) => !declaredKeys.has(key));
  if (unsupportedKeys.length > 0) {
    return `지도에 연결되지 않은 분류(${unsupportedKeys.join(
      ", "
    )})는 적용하지 않고 지도 기본값을 표시합니다.`;
  }
  return "현재 항목·분류 조합은 지도에 연결된 공간자료와 맞지 않아 기본 화면을 표시합니다.";
}

function unsupportedResolutionV125(reason: string): MapSelectorResolutionV125 {
  return {
    variable: null,
    period: null,
    status: "unsupported-selector",
    reason,
  };
}

function bindingSupportsPeriodV125(
  binding: MapSelectorBindingV125,
  period: string
): boolean {
  if (binding.fixedPeriod) return binding.fixedPeriod === period;
  const periods = new Set([
    ...(binding.allowedPeriods || []),
    ...Object.values(binding.yearToPeriod || {}),
  ]);
  return periods.size === 0 || periods.has(period);
}

function semanticYearForPeriodV125(
  binding: MapSelectorBindingV125 | undefined,
  period: string
): number | null {
  if (binding?.yearToPeriod) {
    const exact = Object.entries(binding.yearToPeriod).find(
      ([, mappedPeriod]) => mappedPeriod === period
    )?.[0];
    if (exact && /^\d{4}$/.test(exact)) return Number(exact);
  }
  if (/^\d{4}$/.test(period)) return Number(period);
  if (period === "2010-2013") return 2013;
  if (period === "2025-2030") return 2025;
  if (period === "2031-2035") return 2031;
  return null;
}

function yearPeriodV125(year: number | null): string | null {
  return year === null ? null : String(year);
}
