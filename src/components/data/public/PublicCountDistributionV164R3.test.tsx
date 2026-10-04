import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { ReactElement } from "react";

import PublicCountDistributionV143 from "./PublicCountDistributionV143";
import SdgIndicatorsAnalysisV147 from "./SdgIndicatorsAnalysisV147";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 } from "../../../types/dataFinderV125";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";

/**
 * V164-R3:
 * - D-021: one bar that is 100% compares nothing; it is said in a sentence;
 * - D-012: the year axis ran to 2045 because the register files a plant under the year it is planned to
 *   start; the years after the data's own year are a separate, dotted "계획 연도" series, never counts of what happened;
 * - A-015: the score table had a "카드 선택" column that held nothing.
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ width: 720, height: 320, top: 0, left: 0, right: 720, bottom: 320, x: 0, y: 0, toJSON: () => ({}) });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  jest.restoreAllMocks();
  act(() => root.unmount());
  container.remove();
});

const render = (element: ReactElement) => act(() => root.render(element));

describe("a distribution with a single category (D-021)", () => {
  test("is stated in a sentence and draws neither a 100% bar nor axes", () => {
    render(<PublicCountDistributionV143 title="분류별 사업" rows={[{ label: "분류 가", value: 6 }]} unit="건" />);
    const statement = container.querySelector("[data-testid='pcd143-single-v164']");
    expect(statement?.textContent).toContain("6건은 모두 「분류 가」입니다");
    expect(container.querySelector(".pcd143-bars")).toBeNull();
    expect(container.querySelector(".chart-axes-v150")).toBeNull();
    expect(container.textContent).not.toContain("100.0%");
  });

  test("two categories are still bars", () => {
    render(<PublicCountDistributionV143 title="분류별 사업" rows={[{ label: "분류 가", value: 6 }, { label: "분류 나", value: 2 }]} unit="건" />);
    expect(container.querySelector("[data-testid='pcd143-single-v164']")).toBeNull();
    expect(container.querySelectorAll(".pcd143-bars li")).toHaveLength(2);
  });

  test("the table view keeps the single row and its share", () => {
    render(<PublicCountDistributionV143 title="분류별 사업" rows={[{ label: "분류 가", value: 6 }]} unit="건" />);
    act(() => (container.querySelector("button[aria-pressed]") as HTMLButtonElement).click());
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(container.querySelector("tbody")?.textContent).toContain("100.0%");
  });
});

describe("a count by year whose later years are plans (D-012)", () => {
  const rows = [
    ...[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year, index) => ({ label: String(year), value: 3 + index })),
    { label: "2030", value: 21 },
    { label: "2035", value: 9 },
    { label: "2045", value: 2 },
  ];

  test("the years after the data's year are a separate dotted series with a note, not part of the counted line", () => {
    render(<PublicCountDistributionV143 title="연도별 발전소" rows={rows} chronological plannedAfterYear={2026} unit="건" />);
    const legend = Array.from(container.querySelectorAll('button[data-chart-legend-toggle="true"]')).map((button) => button.textContent);
    expect(legend.some((text) => text?.includes("연도별 발전소"))).toBe(true);
    expect(legend.some((text) => text?.includes("계획 연도(2027년 이후)"))).toBe(true);
    const planned = container.querySelector('button[aria-label^="계획 연도"]') as HTMLButtonElement;
    expect(planned.getAttribute("data-line-pattern")).toBe("dot");
    expect(container.querySelector("[data-testid='pcd143-planned-note-v164']")?.textContent).toContain("2027년 이후로 기재된 32건");
  });

  test("the table marks each planned year and gives the plan nothing the register did not say", () => {
    render(<PublicCountDistributionV143 title="연도별 발전소" rows={rows} chronological plannedAfterYear={2026} unit="건" />);
    act(() => (container.querySelector("button[aria-pressed]") as HTMLButtonElement).click());
    const labels = Array.from(container.querySelectorAll("tbody th")).map((cell) => cell.textContent);
    expect(labels).toContain("2026");
    expect(labels).toContain("2030 (계획)");
    expect(labels).toContain("2045 (계획)");
    expect(labels).toHaveLength(rows.length);
  });

  test("without a plan year the chart and note are as before", () => {
    render(<PublicCountDistributionV143 title="연도별 발전소" rows={rows} chronological unit="건" />);
    expect(container.querySelector("[data-testid='pcd143-planned-note-v164']")).toBeNull();
    const legend = Array.from(container.querySelectorAll('button[data-chart-legend-toggle="true"]')).map((button) => button.textContent);
    expect(legend.some((text) => text?.includes("계획 연도"))).toBe(false);
  });
});

function scoreRow(id: string, category: string, value: number, year: number): SemanticObservationV125 {
  return {
    recordId: id,
    elementId: "A-015",
    indicatorId: id,
    countryIso3: "VNM",
    year,
    value,
    unit: "점",
    semanticMeasure: { key: "sdg-1", labelKo: "목표 1", unit: "점", unitFamily: "other" },
    dimensions: { detail: "정규화 달성도 점수(0~100)", category },
    dimensionLabels: {},
    displayLabel: category,
  } as unknown as SemanticObservationV125;
}

describe("the SDG score table (A-015)", () => {
  test("has indicator, score and year only - no empty 카드 선택 column - and writes the score with three digits", () => {
    render(
      <SdgIndicatorsAnalysisV147
        rows={[scoreRow("r1", "지표 가", 52.2795, 2022), scoreRow("r2", "지표 나", 3.2147, 2021)]}
        selectorState={EMPTY_DATA_FINDER_SELECTOR_STATE_V125}
        onSelectorStateChange={() => undefined}
      />
    );
    const headers = Array.from(container.querySelectorAll("table thead th")).map((cell) => cell.textContent);
    expect(headers).toEqual(["지표", "점수", "기준연도"]);
    expect(container.textContent).not.toContain("카드 선택");
    const scores = Array.from(container.querySelectorAll("table tbody tr")).map((row) => row.children[1].textContent);
    expect(scores).toEqual(["52.3", "3.21"]);
  });
});
