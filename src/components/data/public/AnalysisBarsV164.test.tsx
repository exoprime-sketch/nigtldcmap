import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { ReactElement } from "react";

import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import PublicCountDistributionV143 from "./PublicCountDistributionV143";
import { AnalysisContractContextV153 } from "./analysisContractContextV153";
import type { VisualizationContractRowV153 } from "../../../data/visualization/publicVisualizationContractV153";

/**
 * Review 164 on the bar charts: bar values carried six digits, a lone 0.1% filled
 * the track, a rank was drawn as a bar, the count bars said "6건" under a unit of
 * "곳", and the vertical axis took a label from the dataset's contract that
 * named something the bars were not.
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (element: ReactElement) => act(() => root.render(element));
const axisText = () => Array.from(container.querySelectorAll(".chart-axes-v150 span")).map((node) => node.textContent);
const values = () => Array.from(container.querySelectorAll(".analysis147-bars li strong")).map((node) => node.textContent);
const barWidths = () => Array.from(container.querySelectorAll(".analysis147-bars li i b")).map((node) => (node as HTMLElement).style.width);

describe("bar values", () => {
  test("a value is written with three significant digits", () => {
    render(
      <AnalysisBarsV147
        title="지표별 값"
        unit="%"
        rows={[
          { id: "a", label: "가", value: 52.2795 },
          { id: "b", label: "나", value: 3.2147 },
          { id: "c", label: "다", value: 0.6826 },
        ]}
      />,
    );
    expect(values()).toEqual(["52.3", "3.21", "0.683"]);
  });

  test("a value that has no record says so instead of 0", () => {
    render(<AnalysisBarsV147 title="값" unit="%" rows={[{ id: "a", label: "가", value: 10 }, { id: "b", label: "나", value: null }]} />);
    expect(values()).toEqual(["10", "자료 없음"]);
    expect(barWidths()).toHaveLength(1);
  });
});

describe("bar scale", () => {
  test("a lone percentage is a sliver of 0-100, not a full bar", () => {
    render(<AnalysisBarsV147 title="비중" unit="%" rows={[{ id: "a", label: "가", value: 0.1 }]} />);
    expect(parseFloat(barWidths()[0])).toBeLessThan(1);
    expect(container.querySelector(".detail146-note")?.textContent).toContain("0~100%를 기준으로 표시합니다.");
  });

  test("several percentages are measured against the longest", () => {
    render(<AnalysisBarsV147 title="비중" unit="%" rows={[{ id: "a", label: "가", value: 0.1 }, { id: "b", label: "나", value: 0.4 }]} />);
    expect(barWidths().map(parseFloat)).toEqual([25, 100]);
  });

  test("a rank is a number with no bar", () => {
    render(<AnalysisBarsV147 title="순위" unit="순위" rows={[{ id: "a", label: "가", value: 29 }, { id: "b", label: "나", value: 3 }]} />);
    expect(values()).toEqual(["29위", "3위"]);
    expect(barWidths()).toHaveLength(0);
    expect(container.querySelector('li i[data-track="none"]')).not.toBeNull();
    expect(container.querySelector(".detail146-note")).toBeNull();
  });
});

describe("vertical axis of a bar chart", () => {
  const contract = { primary: { type: "category-bar", xAxis: "건수", yAxis: "연도", unit: "건" } } as unknown as VisualizationContractRowV153;

  test("the caller's own label wins over the dataset's contract", () => {
    render(
      <AnalysisContractContextV153.Provider value={contract}>
        <AnalysisBarsV147 title="수록 지물 수" unit="건" xAxis="수록 지물 수" yAxis="자료 종류" rows={[{ id: "a", label: "가", value: 4 }]} />
      </AnalysisContractContextV153.Provider>,
    );
    expect(axisText()).toContain("세로: 자료 종류");
    expect(axisText()).not.toContain("세로: 연도");
  });
});

/** The count a bar writes, without the share (<small>) that follows it. */
const barCounts = () =>
  Array.from(container.querySelectorAll(".pcd143-bars li strong")).map((node) =>
    Array.from(node.childNodes)
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent)
      .join(""),
  );

describe("count distribution", () => {
  const rows = [{ label: "병원", value: 6 }, { label: "학교", value: 3 }];

  test("the bars state the count noun of the unit", () => {
    render(<PublicCountDistributionV143 title="시설 종류" rows={rows} unit="곳" xAxis="수록 시설 수" yAxis="시설 종류" />);
    expect(barCounts()).toEqual(["6곳", "3곳"]);
    expect(axisText()).toContain("단위: 곳");
    expect(axisText()).toContain("세로: 시설 종류");
    expect(container.querySelector(".pcd143-note")?.textContent).toBe("분류가 확인된 9곳을 기준으로 계산했습니다.");
    expect(container.querySelector(".pcd143-bars li")?.getAttribute("aria-label")).toContain("6곳");
  });

  test("people are counted in 명, and the default stays 건", () => {
    render(<PublicCountDistributionV143 title="직종" rows={rows} unit="명" />);
    expect(barCounts()[0]).toBe("6명");
    render(<PublicCountDistributionV143 title="직종" rows={rows} />);
    expect(barCounts()[0]).toBe("6건");
  });

  test("the table cells carry the same noun, no particle placeholders", () => {
    render(<PublicCountDistributionV143 title="시설 종류" rows={rows} unit="곳" />);
    act(() => (container.querySelector(".pcd143 header button") as HTMLButtonElement).click());
    expect(Array.from(container.querySelectorAll(".pcd143-table tbody tr td:nth-child(2)")).map((cell) => cell.textContent)).toEqual(["6곳", "3곳"]);
    expect(container.textContent).not.toMatch(/을\(를\)|은\(는\)/u);
  });
});
