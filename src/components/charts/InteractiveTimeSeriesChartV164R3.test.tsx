import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import InteractiveTimeSeriesChartV127 from "./InteractiveTimeSeriesChartV127";
import type { TimeSeriesV127 } from "../../types/chartInteractionV127";

/**
 * V164-R3 on the line chart:
 * - a count (건·곳·명) was guided at 0.5 / 1.5 (D-018 / D-019 / D-020 / D-024);
 * - a series that is 0 in every year lay on the zero line under the others (D-006, B-040);
 * - the label of the marked year ("선택 2025년") was cut at the right edge and left a stray dot (A-001, A-022).
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function measureAs(width: number) {
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ width, height: 320, top: 0, left: 0, right: width, bottom: 320, x: 0, y: 0, toJSON: () => ({}) });
}

beforeEach(() => {
  measureAs(760);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  jest.restoreAllMocks();
  act(() => root.unmount());
  container.remove();
});

const years = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const line = (id: string, label: string, unit: string, points: Array<[number, number]>): TimeSeriesV127 => ({
  id,
  label,
  unit,
  points: points.map(([x, value]) => ({ x, value })),
});

function draw(series: TimeSeriesV127[], props: { unit?: string; markedX?: number | null; markedLabel?: string } = {}) {
  act(() => {
    root.render(
      <InteractiveTimeSeriesChartV127
        series={series}
        title="시계열"
        xAxisTitle="연도"
        yAxisTitle="값"
        unit={props.unit ?? "%"}
        markedX={props.markedX}
        markedLabel={props.markedLabel}
        testId="chart-v164-r3"
      />,
    );
  });
}

const yTickLabels = () => Array.from(container.querySelectorAll('[data-chart-y-axis-tick="true"]')).map((node) => node.textContent ?? "");
const legendButton = (label: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-chart-legend-toggle="true"]')).find((button) => button.textContent?.includes(label));

describe("a count axis", () => {
  test.each([
    ["D-018 shape: 0 to 3 activities", [[2019, 0], [2020, 1], [2021, 3], [2022, 2]] as Array<[number, number]>],
    ["D-024 shape: 1 to 2", [[2019, 1], [2020, 2], [2021, 2], [2022, 1]] as Array<[number, number]>],
    ["a single constant year count", [[2019, 1], [2020, 1], [2021, 1]] as Array<[number, number]>],
  ])("%s has whole-number guides only", (_name, points) => {
    draw([line("a", "사업 수", "건", points)], { unit: "건" });
    const labels = yTickLabels();
    expect(labels.length).toBeGreaterThanOrEqual(2);
    expect(labels.every((label) => /^[0-9,]+$/u.test(label))).toBe(true);
  });

  test("a measured value keeps its fractional guides", () => {
    draw([line("a", "비율", "%", [[2019, 0.1], [2020, 0.3], [2021, 0.5]])], { unit: "%" });
    expect(yTickLabels().some((label) => label.includes("."))).toBe(true);
  });
});

describe("a series that is zero in every year", () => {
  const moving = line("a", "세목 A", "%", years(2015, 2020).map((year, step) => [year, 20 + step]));
  const zero = line("z", "세목 Z", "%", years(2015, 2020).map((year) => [year, 0]));

  test("starts hidden, says why in the legend and does not stretch the axis to 0", () => {
    draw([moving, zero]);
    const button = legendButton("세목 Z")!;
    expect(button).toBeTruthy();
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.textContent).toContain("모든 연도 0");
    const numbers = yTickLabels().map((label) => Number(label.replace(/[^0-9.\-]/gu, "")));
    expect(Math.min(...numbers)).toBeGreaterThan(0);
  });

  test("one click on the legend draws it and the axis then reaches 0", () => {
    draw([moving, zero]);
    act(() => legendButton("세목 Z")!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(legendButton("세목 Z")!.getAttribute("aria-pressed")).toBe("true");
    const numbers = yTickLabels().map((label) => Number(label.replace(/[^0-9.\-]/gu, "")));
    expect(Math.min(...numbers)).toBe(0);
  });

  test("when every series is zero none is hidden, and the legend still says the zeros are the delivered values (B-040)", () => {
    draw([zero, line("z2", "세목 Z2", "%", years(2015, 2020).map((year) => [year, 0]))]);
    expect(legendButton("세목 Z")!.getAttribute("aria-pressed")).toBe("true");
    expect(legendButton("세목 Z")!.textContent).toContain("모든 연도 0");
  });

  test("a lone series that is zero in every year is shown with the same note (B-040)", () => {
    draw([zero]);
    expect(legendButton("세목 Z")!.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll('[data-testid="chart-legend-zero-note-v164"]')).toHaveLength(1);
  });

  test("a series with one non-zero year carries no zero note", () => {
    draw([moving, line("p", "세목 P", "%", years(2015, 2020).map((year, step) => [year, step === 3 ? 1 : 0]))]);
    expect(container.querySelector('[data-testid="chart-legend-zero-note-v164"]')).toBeNull();
  });
});

describe("the marked year's label", () => {
  const series = [line("a", "값", "%", years(2019, 2025).map((year, step) => [year, 10 + step]))];

  test("the newest year's label is written left of its line, inside the plot", () => {
    draw(series, { markedX: 2025, markedLabel: "선택 2025년" });
    const label = container.querySelector('[data-testid="chart-marked-label-v164"]')!;
    const frame = container.querySelector("rect.v127-interactive-chart__frame")!;
    expect(label.textContent).toBe("선택 2025년");
    expect(label.getAttribute("text-anchor")).toBe("end");
    const lineX = Number(container.querySelector('[data-testid="chart-marked-x"] line')!.getAttribute("x1"));
    expect(Number(label.getAttribute("x"))).toBeLessThan(lineX);
    expect(Number(label.getAttribute("x"))).toBeLessThanOrEqual(Number(frame.getAttribute("x")) + Number(frame.getAttribute("width")));
  });

  test("a year with room to its right keeps the label on the right", () => {
    draw(series, { markedX: 2020, markedLabel: "선택 2020년" });
    const label = container.querySelector('[data-testid="chart-marked-label-v164"]')!;
    expect(label.getAttribute("text-anchor")).toBe("start");
  });

  test("the label is not inside the clipped group (nothing is cut to a stray dot)", () => {
    draw(series, { markedX: 2025, markedLabel: "선택 2025년" });
    const clipped = container.querySelector('[data-testid="chart-marked-x"]')!;
    expect(clipped.querySelector("text")).toBeNull();
  });
});
