import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import InteractiveTimeSeriesChartV127 from "./InteractiveTimeSeriesChartV127";
import type { TimeSeriesV127 } from "../../types/chartInteractionV127";

/**
 * Review 164 on the line chart: tick labels wrote a different number of
 * decimals from one tick to the next, a lone 0.1 axis went to 120%, the year
 * axis showed 2000, 2004, 2008 - not the years the data holds - the unit
 * brackets of the axis title closed twice, and one single-point series pressed
 * every other line onto the zero line.
 */
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

/** jsdom has no layout; the chart measures its stage, so the tests state a desktop width. */
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

function draw(series: TimeSeriesV127[], props: { unit?: string; yAxisTitle?: string; fixedYDomain?: [number, number] } = {}) {
  act(() => {
    root.render(
      <InteractiveTimeSeriesChartV127
        series={series}
        title="시계열"
        xAxisTitle="연도"
        yAxisTitle={props.yAxisTitle ?? "값"}
        unit={props.unit ?? "%"}
        fixedYDomain={props.fixedYDomain}
        testId="chart-v164"
      />,
    );
  });
}

const yTickLabels = () => Array.from(container.querySelectorAll('[data-chart-y-axis-tick="true"]')).map((node) => node.textContent ?? "");
const xTickLabels = () =>
  Array.from(container.querySelectorAll("text.v127-interactive-chart__tick:not([data-chart-y-axis-tick])")).map((node) => node.textContent ?? "");

describe("value axis", () => {
  test("every tick is written with the same number of decimals", () => {
    draw([line("a", "성장률", "%", years(2015, 2022).map((year, index) => [year, 2.1 + index * 0.37]))]);
    const labels = yTickLabels();
    expect(labels.length).toBeGreaterThanOrEqual(3);
    const decimals = labels.map((label) => (label.split(".")[1] ?? "").length);
    expect(new Set(decimals).size).toBe(1);
  });

  test("a percentage series whose values stay below 100 never gets an axis past 100", () => {
    draw([line("a", "비중", "%", years(2015, 2022).map((year, index) => [year, 92 + index]))]);
    const numbers = yTickLabels().map((label) => Number(label.replace(/[^0-9.\-]/gu, "")));
    expect(Math.max(...numbers)).toBeLessThanOrEqual(100);
  });
});

describe("year axis", () => {
  test("a short run of years labels every year it holds", () => {
    draw([line("a", "값", "%", years(2019, 2023).map((year, index) => [year, 10 + index]))]);
    expect(xTickLabels()).toEqual(["2019", "2020", "2021", "2022", "2023"]);
  });

  test("a long run is labelled with round years that lie inside the data", () => {
    draw([line("a", "값", "%", years(1990, 2022).map((year, index) => [year, 10 + index]))]);
    const labels = xTickLabels().map(Number);
    expect(labels.length).toBeGreaterThanOrEqual(3);
    expect(labels.every((year) => year >= 1990 && year <= 2022)).toBe(true);
    expect(labels.every((year) => year % 5 === 0 || year % 2 === 0)).toBe(true);
  });

  test("the plot clip leaves room for a marker on the first and last year", () => {
    draw([line("a", "값", "%", years(2019, 2023).map((year, index) => [year, 10 + index]))]);
    const frame = container.querySelector("rect.v127-interactive-chart__frame")!;
    const clip = container.querySelector("clipPath rect")!;
    expect(Number(clip.getAttribute("x"))).toBeLessThan(Number(frame.getAttribute("x")));
    expect(Number(clip.getAttribute("width"))).toBeGreaterThan(Number(frame.getAttribute("width")));
  });
});

describe("axis title", () => {
  test("a unit that already carries brackets is not bracketed twice", () => {
    draw([line("a", "값", "백만 달러(2015년 기준)", years(2019, 2023).map((year, index) => [year, 100 + index]))], {
      unit: "백만 달러(2015년 기준)",
      yAxisTitle: "경제 규모",
    });
    const title = container.querySelector('[data-testid="chart-y-axis-title"]')?.textContent ?? "";
    expect(title).toContain("경제 규모");
    expect(title).not.toContain("))");
    expect(title.match(/\(/gu)?.length ?? 0).toBe(title.match(/\)/gu)?.length ?? 0);
  });
});

describe("a series that would flatten the rest", () => {
  const lines = Array.from({ length: 7 }, (_, index) => line(`tax-${index}`, `세목 ${index + 1}`, "%", years(2015, 2020).map((year, step) => [year, 0.1 + step * 0.03])));

  test("a lone point 10x the lines starts hidden but stays in the legend", () => {
    draw([...lines, line("lone", "단일 조사", "%", [[2021, 3]])]);
    const legend = container.querySelector(".v127-interactive-chart__legend")!;
    expect(legend.textContent).toContain("단일 조사");
    const numbers = yTickLabels().map((label) => Number(label.replace(/[^0-9.\-]/gu, "")));
    expect(Math.max(...numbers)).toBeLessThan(1);
  });

  test("a fixed domain keeps every series on, as the page asked", () => {
    draw([...lines, line("lone", "단일 조사", "%", [[2021, 3]])], { fixedYDomain: [0, 4] });
    const numbers = yTickLabels().map((label) => Number(label.replace(/[^0-9.\-]/gu, "")));
    expect(Math.max(...numbers)).toBeGreaterThanOrEqual(3);
  });
});
