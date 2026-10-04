import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { ReactElement } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { VisualizationContractRowV153 } from "../../../data/visualization/publicVisualizationContractV153";
import { AnalysisContractContextV153 } from "../public/analysisContractContextV153";
import {
  CategoryComparisonV125,
  SeasonalityPanelV125,
  TimelineGroupCountsV141,
  TrendUnitV125,
} from "./SemanticContractRendererV125";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3 (WP-E): the bar screens of the semantic renderer. The rows are test inputs
 * shaped like the delivered ones (BGD A-024, D-009, A-026, A-030; VNM B-001, B-012).
 */
type Rows = Parameters<typeof CategoryComparisonV125>[0]["rows"];

interface RowSpec {
  id: string;
  value: number;
  unit?: string;
  measure?: string;
  indicatorId?: string;
  displayLabel?: string;
  dimensions?: Record<string, string>;
  year?: number | null;
  period?: string | null;
  elementId?: string;
}

function row(spec: RowSpec): Rows[number] {
  const measure = spec.measure ?? "지표";
  return {
    recordId: spec.id,
    elementId: spec.elementId ?? "T-999",
    indicatorId: spec.indicatorId ?? "T-999-IND",
    countryIso3: "BGD",
    year: spec.year === undefined ? 2020 : spec.year,
    period: spec.period ?? null,
    value: spec.value,
    unit: spec.unit ?? "%",
    loadStatus: "loaded",
    warnings: [],
    rightsStatus: "open",
    rightsNote: "",
    downloadEligible: true,
    provenance: {},
    semanticMeasure: { key: `m-${measure}`, labelKo: measure, unit: spec.unit ?? "%", unitFamily: "percent" },
    dimensions: spec.dimensions ?? {},
    dimensionLabels: spec.dimensions ?? {},
    displayLabel: spec.displayLabel ?? measure,
    seriesKey: spec.id,
  } as unknown as Rows[number];
}

function contractOf(yAxis: string, elementId = "T-999"): VisualizationContractRowV153 {
  return { elementId, primary: { type: "category-bar", xAxis: "값", yAxis, unit: "%" } } as unknown as VisualizationContractRowV153;
}

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function render(element: ReactElement, contract: VisualizationContractRowV153 | null = null): void {
  act(() =>
    root.render(
      contract ? <AnalysisContractContextV153.Provider value={contract}>{element}</AnalysisContractContextV153.Provider> : element
    )
  );
}

const barNames = () => Array.from(host.querySelectorAll(".sv125-contract-bars > div > strong")).map((node) => node.textContent?.trim());
const barTexts = () => Array.from(host.querySelectorAll(".sv125-contract-bars > div > b")).map((node) => node.textContent);
const yAxis = () => host.querySelector("[data-chart-axes]")?.getAttribute("data-y-axis");
const articles = () => host.querySelectorAll("[data-testid='comparison-workspace-v143']");

describe("bar names", () => {
  test("a technology that is the same on every row does not name the bars (BGD A-024)", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 12, dimensions: { technology: "24", detail: "저압 배전망" } }),
          row({ id: "b", value: 8, dimensions: { technology: "24", detail: "중압 배전망" } }),
          row({ id: "c", value: 5, dimensions: { technology: "24", detail: "고압 송전망" } }),
        ]}
      />
    );
    expect(barNames()).toEqual(["저압 배전망", "중압 배전망", "고압 송전망"]);
  });

  test("an English classification value reads in Korean", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 12, dimensions: { category: "Mitigation" } }),
          row({ id: "b", value: 8, dimensions: { category: "Adaptation" } }),
        ]}
      />
    );
    expect(barNames()).toEqual(["감축", "적응"]);
  });
});

describe("bar axis", () => {
  test("an indicator axis replaces a contracted 연도 the bars do not carry (D-009, E-009)", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 40, measure: "재생에너지 비중" }),
          row({ id: "b", value: 25, measure: "석탄 비중" }),
          row({ id: "c", value: 12, measure: "가스 비중" }),
        ]}
      />,
      contractOf("연도", "D-009")
    );
    expect(yAxis()).toBe("지표");
    // the contract's own text stays on the node for the QA that compares the two
    expect(host.querySelector("[data-chart-axes]")?.getAttribute("data-contract-y-axis")).toBe("연도");
  });

  test("a classification axis replaces a contracted 발전기술 (BGD D-003)", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 30, dimensions: { category: "Mitigation" } }),
          row({ id: "b", value: 20, dimensions: { category: "Adaptation" } }),
        ]}
      />,
      contractOf("발전기술", "D-003")
    );
    expect(yAxis()).toBe("분류");
  });

  test("a contracted axis the bars agree with is kept", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 7, unit: "건", dimensions: { category: "홍수" } }),
          row({ id: "b", value: 3, unit: "건", dimensions: { category: "태풍" } }),
        ]}
      />,
      contractOf("재해 유형", "B-012")
    );
    expect(yAxis()).toBe("재해 유형");
  });

  test("a year axis whose bars are dated is kept", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 7, dimensions: { detail: "2019년" } }),
          row({ id: "b", value: 3, dimensions: { detail: "2020년" } }),
        ]}
      />,
      contractOf("연도")
    );
    expect(yAxis()).toBe("연도");
  });
});

describe("bar values and scale", () => {
  test("the bar says three significant digits and the table keeps the exact value", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 52.2795, measure: "가", unit: "%" }),
          row({ id: "b", value: 3.2147, measure: "나", unit: "%" }),
        ]}
      />
    );
    expect(barTexts()).toEqual(["52.3 %", "3.21 %"]);
    const table = host.querySelector("[data-testid='comparison-chart-table-v141-rows']")?.textContent || "";
    expect(table).toContain("52.2795");
  });

  test("a lone 0.1% is a sliver of 0-100, not a full bar (VNM D-009)", () => {
    render(<CategoryComparisonV125 rows={[row({ id: "a", value: 0.1, measure: "비중" })]} />);
    const fill = host.querySelector(".sv125-contract-bars i") as HTMLElement;
    expect(parseFloat(fill.style.width)).toBeLessThan(1);
  });

  test("a rank is written as a number with no bar (BGD D-013)", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 29, unit: "순위", measure: "에너지 전환 순위" }),
          row({ id: "b", value: 3, unit: "순위", measure: "투자 순위" }),
        ]}
      />
    );
    expect(barTexts()).toEqual(["29위", "3위"]);
    expect(host.querySelector(".sv125-contract-bars i")).toBeNull();
    expect(host.querySelectorAll(".sv125-contract-bars > div.sv164-rank-row")).toHaveLength(2);
  });

  test("a mean and a total of one unit are scaled apart (A-026)", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 150, unit: "m²", measure: "평균 지붕 면적" }),
          row({ id: "b", value: 2_100_000_000, unit: "m²", measure: "총 지붕 면적" }),
        ]}
      />
    );
    expect(articles()).toHaveLength(2);
    const headings = Array.from(host.querySelectorAll("h5")).map((node) => node.textContent || "");
    expect(headings.some((text) => text.includes("평균값"))).toBe(true);
    expect(headings.some((text) => text.includes("합계"))).toBe(true);
  });

  test("measures of one unit with no mean and no total stay on one scale", () => {
    render(
      <CategoryComparisonV125
        rows={[row({ id: "a", value: 150, unit: "m²", measure: "주거 면적" }), row({ id: "b", value: 2_100_000_000, unit: "m²", measure: "상업 면적" })]}
      />
    );
    expect(articles()).toHaveLength(1);
  });
});

describe("auxiliary rows (A-030)", () => {
  test("a main row and its auxiliary row are not drawn as two bars of one item", () => {
    render(
      <CategoryComparisonV125
        rows={[
          row({ id: "a", value: 100, unit: "백만 달러", measure: "총교역액", indicatorId: "A-030-IND-01" }),
          row({ id: "b", value: 98, unit: "백만 달러", measure: "총교역액", indicatorId: "A-030-IND-01_aux_kita", displayLabel: "[보조] 총교역액" }),
        ]}
      />
    );
    expect(barTexts()).toHaveLength(2);
    const aux = host.querySelector("[data-testid='aux-rows-v164']");
    expect(aux).not.toBeNull();
    expect(aux?.querySelector("summary")?.textContent).toContain("보조 자료 1개 보기");
    // the main bar is outside the disclosure
    const outside = Array.from(host.querySelectorAll(".sv125-contract-bars > div")).filter((node) => !aux?.contains(node));
    expect(outside).toHaveLength(1);
  });

  test("rows that are all auxiliary are drawn as they are", () => {
    render(
      <CategoryComparisonV125
        rows={[row({ id: "a", value: 98, measure: "총교역액", indicatorId: "A-030-IND-01_aux_kita" })]}
      />
    );
    expect(host.querySelector("[data-testid='aux-rows-v164']")).toBeNull();
    expect(barTexts()).toHaveLength(1);
  });
});

describe("trend legend", () => {
  const trendRows = (spec: Array<{ key: string; indicatorId: string; displayLabel: string; values: number[] }>) =>
    spec.flatMap(({ key, indicatorId, displayLabel, values }) =>
      values.map((value, index) =>
        row({
          id: `${key}-${index}`,
          value,
          unit: "백만 달러",
          measure: "총교역액",
          indicatorId,
          displayLabel,
          year: 2018 + index,
        })
      ).map((item) => ({ ...item, seriesKey: key }))
    ) as Parameters<typeof TrendUnitV125>[0]["rows"];

  const legendButtons = () => Array.from(host.querySelectorAll("button[data-chart-legend-toggle]")) as HTMLButtonElement[];

  test("an auxiliary series is in the legend and starts hidden", () => {
    render(
      <TrendUnitV125
        elementId="T-999"
        unit="백만 달러"
        rows={trendRows([
          { key: "main", indicatorId: "T-999-IND-1", displayLabel: "총교역액", values: [10, 12, 14] },
          { key: "aux", indicatorId: "T-999-IND-1_aux_kita", displayLabel: "[보조] 총교역액", values: [9, 11, 13] },
        ])}
      />
    );
    const buttons = legendButtons();
    expect(buttons).toHaveLength(2);
    const aux = buttons.find((button) => button.textContent?.includes("보조 자료"));
    expect(aux).toBeDefined();
    expect(aux?.getAttribute("aria-pressed")).toBe("false");
    const main = buttons.find((button) => button !== aux);
    expect(main?.getAttribute("aria-pressed")).toBe("true");
    // the table below still holds both sources
    expect(host.querySelectorAll("[data-testid='trend-chart-table-rows-v141'] tbody tr")).toHaveLength(6);
  });

  test("a delivery key is cut from a legend name", () => {
    render(
      <TrendUnitV125
        elementId="T-999"
        unit="%"
        rows={trendRows([
          { key: "s1", indicatorId: "T-999-IND-1", displayLabel: "배출 비중 · D006_carbon_tax_share", values: [1, 2, 3] },
          { key: "s2", indicatorId: "T-999-IND-2", displayLabel: "배출 비중 · D006_energy_tax_share", values: [2, 3, 4] },
        ])}
      />
    );
    expect(legendButtons()).toHaveLength(2);
    const text = legendButtons().map((button) => button.textContent || "").join("|");
    expect(text).toContain("배출 비중");
    expect(text).not.toMatch(/D006_/u);
    expect(host.querySelector("[data-testid='trend-chart-table-rows-v141']")?.textContent).not.toMatch(/D006_/u);
  });
});

describe("B-012 event counts", () => {
  test("the bars are one per disaster type, and the axis says so", () => {
    const entity = (id: string, type: string) =>
      ({ recordId: id, elementId: "B-012", entityType: "event", name: id, normalizedAttributes: { 재해유형: type }, rawAttributes: {}, provenance: {} } as unknown as VietnamEntityV124);
    render(<TimelineGroupCountsV141 elementId="B-012" entities={[entity("1", "홍수"), entity("2", "홍수"), entity("3", "태풍")]} />);
    expect(yAxis()).toBe("재해 유형");
    expect(host.querySelector("[data-testid='timeline-group-counts-v141']")?.textContent).toContain("2건");
  });
});

describe("climatology dating (B-001)", () => {
  test("a 1991-2020 normal reads as a span, not as the year 1991", () => {
    render(
      <SeasonalityPanelV125
        rows={[
          row({ id: "a", value: 12.5, unit: "mm", measure: "월 평균 강수량 (1991-2020 평년)", period: "1991-2020", year: 1991, dimensions: { month: "1월" } }),
          row({ id: "b", value: 20.1, unit: "mm", measure: "월 평균 강수량 (1991-2020 평년)", period: "1991-2020", year: 1991, dimensions: { month: "2월" } }),
        ] as unknown as Parameters<typeof SeasonalityPanelV125>[0]["rows"]}
      />
    );
    const text = host.textContent || "";
    expect(text).toContain("1991–2020 평년");
    expect(text).not.toContain("1991년");
  });
});
