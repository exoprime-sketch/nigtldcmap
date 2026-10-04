import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { useState } from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type {
  ElementIndicatorSemanticsV125,
  ElementVisualizationContractV125,
  IndicatorSemanticV125,
  SemanticMeasureSummaryV125,
  SemanticRendererV125,
} from "../../../data/visualization/semanticTypesV125";
import type { VietnamEntityV124, VietnamObservationV124 } from "../../../data/vietnam/vietnamTypesV124";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 } from "../../../types/dataFinderV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import SemanticArchetypePreviewV125 from "./SemanticArchetypePreviewV125";

// The renderer below the selectors is covered by its own tests; here it only
// reports the rows it was handed.
jest.mock("./SemanticContractRendererV125", () => ({
  __esModule: true,
  default: (props: { rows: unknown[]; entities: unknown[] }) => (
    <div data-testid="renderer-stub" data-rows={props.rows.length} data-entities={props.entities.length} />
  ),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3 (WP-F): a selector offers what leads to a value. The elements and
 * numbers below are test inputs shaped like the review's cases (A-004 years,
 * A-022 measures, D-009 raw-key measures, B-013 detail values, B-038 technology).
 */
type Spec = {
  id: string;
  measure: string;
  unit?: string;
  dims?: Record<string, string>;
  /** [year, value] */
  values: Array<[number | null, number | null]>;
};

function indicator(spec: Spec): IndicatorSemanticV125 {
  const dims = spec.dims || {};
  return {
    indicatorId: spec.id,
    measure: { key: `m-${spec.measure}`, labelKo: spec.measure, unit: spec.unit || "%", unitFamily: "other" },
    dimensions: dims,
    dimensionLabels: dims,
    displayLabel: spec.measure,
    seriesKey: `m-${spec.measure}|${spec.id}`,
    axisGroupKey: `m-${spec.measure}`,
    sourceLabel: "test",
    inferenceMethod: "deterministic-source-structure",
  };
}

function fixture(specs: Spec[], renderer: SemanticRendererV125 = "structured-table", elementId = "T-001") {
  const indicators = specs.map(indicator);
  const observations = specs.flatMap((spec) =>
    spec.values.map(([year, value], index) => ({
      countryIso3: "VNM",
      elementId,
      indicatorId: spec.id,
      recordId: `${spec.id}-${index}`,
      year,
      period: null,
      value,
      rawValue: value,
      unit: spec.unit || "%",
      provenance: {},
      loadStatus: "published",
    }))
  ) as unknown as VietnamObservationV124[];
  const measures: SemanticMeasureSummaryV125[] = [];
  for (const item of indicators) {
    if (measures.some((measure) => measure.key === item.measure.key)) continue;
    const own = observations.filter((row) => indicators.find((i) => i.indicatorId === row.indicatorId)?.measure.key === item.measure.key);
    measures.push({ ...item.measure, indicatorCount: 1, recordCount: own.length });
  }
  const dimensionKeys = Array.from(new Set(indicators.flatMap((item) => Object.keys(item.dimensions))));
  const dimensions = dimensionKeys.map((key) => {
    const values = Array.from(new Set(indicators.flatMap((item) => (item.dimensions[key] ? [item.dimensions[key]] : []))));
    return { key, labelKo: key === "detail" ? "세부 분류" : "분류", values, valueCount: values.length };
  });
  const contract = {
    elementId,
    dataPresenceStatus: "actual-records",
    observationCount: observations.length,
    entityCount: 0,
    populatedRecordCount: observations.length,
    missingRecordCount: 0,
    yearRange: { start: null, end: null },
    noDataReason: null,
    primaryRenderer: renderer,
    secondaryRenderer: "structured-table",
    measures,
    dimensions,
    selectors: [],
    unitFamilies: ["other"],
    primaryLabelFields: [],
    tooltipFields: [],
    tableColumns: [],
    mapLinkage: { enabled: false, mapMode: "none", featureCount: 0, stateParameters: [] },
    comparisonPolicy: "",
    missingDataPolicy: "",
    currentVisualizationIssue: "",
    contractStatus: "archetype",
  } as ElementVisualizationContractV125;
  const semantics = {
    schemaVersion: "v125",
    generatedAt: "2026-10-04",
    elementId,
    indicatorCount: indicators.length,
    observationCount: observations.length,
    entityCount: 0,
    measures,
    dimensions,
    indicators,
    recordSemanticsMode: "sparse-overrides",
    records: [],
  } as ElementIndicatorSemanticsV125;
  return { contract, semantics, observations };
}

let host: HTMLDivElement;
let root: Root;
let lastState: DataFinderSelectorStateV125 | null = null;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  lastState = null;
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function Harness(props: {
  data: ReturnType<typeof fixture>;
  entities?: VietnamEntityV124[];
  initial?: Partial<DataFinderSelectorStateV125>;
}) {
  const [state, setState] = useState<DataFinderSelectorStateV125>({ ...EMPTY_DATA_FINDER_SELECTOR_STATE_V125, ...props.initial });
  return (
    <SemanticArchetypePreviewV125
      contract={props.data.contract}
      semantics={props.data.semantics}
      observations={props.data.observations}
      entities={props.entities || []}
      countryNameKo="베트남"
      selectorState={state}
      onSelectorStateChange={(next) => {
        lastState = next;
        setState(next);
      }}
    />
  );
}

function render(data: ReturnType<typeof fixture>, extra: { entities?: VietnamEntityV124[]; initial?: Partial<DataFinderSelectorStateV125> } = {}) {
  act(() => root.render(<Harness data={data} {...extra} />));
}

const optionTexts = (selector: string) =>
  Array.from(host.querySelectorAll(`${selector} option`)).map((option) => option.textContent || "");
const select = (label: string) => host.querySelector(`select[aria-label="${label}"]`) as HTMLSelectElement | null;
const choose = (element: HTMLSelectElement, value: string) =>
  act(() => {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });

describe("selectors offer what leads to a value (V164-3)", () => {
  test("연도: a year whose rows hold no value is not offered", () => {
    render(fixture([{ id: "I1", measure: "빈곤율", values: [[2022, 5], [2021, null], [2020, 4], [2019, null], [2018, 3]] }]));
    expect(optionTexts('select[data-testid="v125-year-select"]')).toEqual(["2022", "2020", "2018"]);
  });

  test("연도: every year stays when none has a value", () => {
    render(fixture([{ id: "I1", measure: "빈곤율", values: [[2022, null], [2021, null]] }]));
    expect(optionTexts('select[data-testid="v125-year-select"]')).toEqual(["2022", "2021"]);
  });

  test("연도: an old URL's empty year gives way to the latest year with a value", () => {
    render(fixture([{ id: "I1", measure: "빈곤율", values: [[2022, 5], [2021, null], [2020, 4]] }]), { initial: { year: 2021 } });
    expect(lastState?.year).toBe(2022);
  });

  test("항목: a measure without any value is not offered (A-022 SAIDI/SAIFI)", () => {
    render(
      fixture([
        { id: "I1", measure: "전기 연결 대기일수", unit: "일", values: [[2022, 20]] },
        { id: "I2", measure: "전력 접근율", unit: "%", values: [[2022, 98]] },
        { id: "I3", measure: "SAIDI", unit: "분/고객", values: [[2022, null]] },
        { id: "I4", measure: "SAIFI", unit: "회/고객", values: [[2022, null]] },
      ])
    );
    expect(optionTexts('select[data-testid="v125-measure-select"]')).toEqual(["전기 연결 대기일수 · 일", "전력 접근율 · %"]);
  });

  test("항목: a measure named by its column key is not offered while a named one exists (D-009)", () => {
    render(
      fixture([
        { id: "I1", measure: "기후대응 정부 예산", unit: "%", values: [[2020, 1]] },
        { id: "I2", measure: "기후대응 정부 예산 규모", unit: "USD", values: [[2020, 2]] },
        { id: "I3", measure: "D-009_environmental_protection_expenditure_lcu", unit: "LCU", values: [[2020, 3]] },
      ])
    );
    const texts = optionTexts('select[data-testid="v125-measure-select"]');
    expect(texts).toHaveLength(2);
    expect(texts.join(" ")).not.toMatch(/D-009_|_expenditure/u);
  });

  test("세부 분류: only the values that lead to a value are offered (B-013 CBAM 합계/비료/시멘트)", () => {
    render(
      fixture([
        { id: "I1", measure: "수출액", dims: { detail: "철강" }, values: [[2022, 5]] },
        { id: "I2", measure: "수출액", dims: { detail: "전력" }, values: [[2022, 7]] },
        { id: "I3", measure: "수출액", dims: { detail: "비료" }, values: [[2022, null]] },
        { id: "I4", measure: "수출액", dims: { detail: "시멘트" }, values: [[2022, null]] },
      ])
    );
    expect(optionTexts('select[data-public-dimension-key="detail"]')).toEqual(["전체", "철강", "전력"]);
  });

  test("세부 분류: one value with a number is stated as a value, not a selector", () => {
    render(
      fixture([
        { id: "I1", measure: "수출액", dims: { detail: "철강" }, values: [[2022, 5]] },
        { id: "I2", measure: "수출액", dims: { detail: "비료" }, values: [[2022, null]] },
      ])
    );
    expect(host.querySelector('select[data-public-dimension-key="detail"]')).toBeNull();
    expect(host.querySelector('[data-public-dimension-key="detail"] strong')?.textContent).toBe("철강");
  });

  test("분류 × 세부 분류: a detail the chosen category has no value for is not offered", () => {
    const data = fixture([
      { id: "I1", measure: "예산", dims: { category: "가", detail: "x" }, values: [[2022, 1]] },
      { id: "I2", measure: "예산", dims: { category: "가", detail: "y" }, values: [[2022, 2]] },
      { id: "I3", measure: "예산", dims: { category: "나", detail: "z" }, values: [[2022, 3]] },
      { id: "I4", measure: "예산", dims: { category: "나", detail: "w" }, values: [[2022, 4]] },
    ]);
    render(data, { initial: { dimensions: { category: "가" } } });
    expect(optionTexts('select[data-public-dimension-key="detail"]')).toEqual(["전체", "x", "y"]);
    // the category list itself keeps both (judged against the detail, which is not chosen)
    expect(optionTexts('select[data-public-dimension-key="category"]')).toEqual(["전체", "가", "나"]);
  });

  test("a selection the measure's rows do not carry is dropped, not kept as an empty filter", () => {
    const data = fixture([
      { id: "I1", measure: "예산", dims: { category: "가" }, values: [[2022, 1]] },
      { id: "I2", measure: "예산", dims: { category: "나" }, values: [[2022, 2]] },
    ]);
    render(data, { initial: { dimensions: { category: "다" } } });
    expect(lastState?.dimensions.category).toBeUndefined();
  });

  test("a measure the rows in hand lack (the page was narrowed to a technology) gives way to one they carry (B-038)", () => {
    const data = fixture([
      { id: "I1", measure: "농업잔재", unit: "Mt", values: [[2024, 108.8]] },
      { id: "I2", measure: "임업잔재", unit: "Mt", values: [[2024, 3.2]] },
    ]);
    // the delivery knows 1인당 폐기물, but the narrowed rows do not carry it
    data.contract.measures.push({ key: "m-1인당 폐기물", labelKo: "1인당 폐기물", unit: "kg", unitFamily: "other", indicatorCount: 1, recordCount: 4 });
    render(data, { initial: { measure: "m-1인당 폐기물" } });
    expect(lastState?.measure).toBe("m-농업잔재");
    expect(host.textContent).not.toContain("표시할 값이 없습니다");
    expect(host.querySelector('[data-testid="renderer-stub"]')?.getAttribute("data-rows")).toBe("1");
  });

  test("a measure the delivery knows stays chosen only when there is nothing else to show", () => {
    const data = fixture([{ id: "I1", measure: "농업잔재", unit: "Mt", values: [[2024, null]] }]);
    data.contract.measures.push({ key: "m-없는항목", labelKo: "없는 항목", unit: "kg", unitFamily: "other", indicatorCount: 1, recordCount: 4 });
    render(data, { initial: { measure: "m-없는항목" } });
    // one measure with rows exists, so it is the one shown
    expect(lastState?.measure).toBe("m-농업잔재");
  });

  test("changing a selector still works on what is offered", () => {
    render(fixture([{ id: "I1", measure: "빈곤율", values: [[2022, 5], [2021, null], [2020, 4]] }]));
    const year = select("연도 선택");
    expect(year).not.toBeNull();
    choose(year as HTMLSelectElement, "2020");
    expect(lastState?.year).toBe(2020);
  });
});

describe("one selection line for a portfolio screen (V164-3)", () => {
  const entity = (id: string) =>
    ({
      elementId: "D-023",
      recordId: id,
      entityType: "entity",
      name: id,
      normalizedAttributes: { 사업명: id },
      rawAttributes: {},
      provenance: {},
    }) as unknown as VietnamEntityV124;
  const data = (renderer: SemanticRendererV125, elementId: string) =>
    fixture(
      [
        { id: "I1", measure: "승인액", unit: "USD 백만", values: [[2025, 5]] },
        { id: "I2", measure: "승인 건수", unit: "건", values: [[2025, 9]] },
      ],
      renderer,
      elementId
    );

  test("the register's analysis selectors are not drawn above the workspace's own line", () => {
    render(data("portfolio", "D-023"), { entities: [entity("a"), entity("b")] });
    expect(host.querySelector('[data-testid="public-selector"]')).toBeNull();
    // the records still reach the renderer, unfiltered
    expect(host.querySelector('[data-testid="renderer-stub"]')?.getAttribute("data-entities")).toBe("2");
  });

  test("a portfolio element with no entity records keeps its selectors", () => {
    render(data("portfolio", "D-023"), { entities: [] });
    expect(host.querySelector('[data-testid="public-selector"]')).not.toBeNull();
  });

  test("any other screen keeps its selectors", () => {
    render(data("category-comparison", "A-004"), { entities: [entity("a")] });
    expect(host.querySelector('[data-testid="public-selector"]')).not.toBeNull();
  });

  test("a stale dimension choice does not narrow the workspace's records", () => {
    const entities = [entity("a"), entity("b")];
    (entities[0] as unknown as { normalizedAttributes: Record<string, string> }).normalizedAttributes.기금 = "GCF";
    (entities[1] as unknown as { normalizedAttributes: Record<string, string> }).normalizedAttributes.기금 = "GEF";
    render(data("portfolio", "D-023"), { entities, initial: { dimensions: { 기금: "GCF" } } });
    expect(host.querySelector('[data-testid="renderer-stub"]')?.getAttribute("data-entities")).toBe("2");
  });
});
