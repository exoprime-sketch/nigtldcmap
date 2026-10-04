import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import DumbbellChartV153, { wrapLabelV164 } from "./DumbbellChartV153";
import type { DumbbellRowV153 } from "./DumbbellChartV153";

/**
 * Review 164 (VNM B-025): a basin's three-part name ("Sông Hồng – Thái Bình ·
 * Hong – Thai Binh (Red River) · 홍–타이빈") was drawn on one line, right-aligned,
 * so its start ran out of the chart's left edge.
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

const LONG = "Sông Hồng – Thái Bình · Hong – Thai Binh (Red River) · 홍–타이빈";
const row = (id: string, label: string, note?: string): DumbbellRowV153 => ({
  id,
  label,
  note,
  low: { label: "베트남 내 면적", value: 86253 },
  high: { label: "전체 유역 면적", value: 169000 },
});

describe("wrapLabelV164", () => {
  test("a short label stays on one line", () => {
    expect(wrapLabelV164("메콩강", 192)).toEqual(["메콩강"]);
  });

  test("a long label is broken at spaces and loses no word", () => {
    const lines = wrapLabelV164(LONG, 192, 3);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe(LONG);
    expect(lines.every((line) => !line.endsWith("…"))).toBe(true);
  });

  test("what does not fit in the allowed lines ends in an ellipsis", () => {
    const lines = wrapLabelV164(LONG, 192, 1);
    expect(lines).toHaveLength(1);
    expect(lines[0].endsWith("…")).toBe(true);
  });

  test("one word wider than the line is cut, not run out of the chart", () => {
    const lines = wrapLabelV164("가".repeat(40), 150, 2);
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines[lines.length - 1].endsWith("…")).toBe(true);
  });
});

describe("DumbbellChartV153 row labels", () => {
  test("a long label is drawn on several lines, each inside the label column", () => {
    act(() => root.render(<DumbbellChartV153 rows={[row("a", LONG), row("b", "Mã")]} unit="km²" xAxis="면적" yAxis="유역" ariaLabel="유역 면적" />));
    const labels = Array.from(container.querySelectorAll('g[data-row-id="a"] text.dumbbell153__label'));
    expect(labels.length).toBeGreaterThan(1);
    expect(labels.map((node) => node.textContent).join(" ")).toBe(LONG);
    const one = container.querySelectorAll('g[data-row-id="b"] text.dumbbell153__label');
    expect(one).toHaveLength(1);
  });

  test("the rows are tall enough for the wrapped label, so rows do not overlap", () => {
    act(() => root.render(<DumbbellChartV153 rows={[row("a", LONG, "2020")]} unit="km²" xAxis="면적" yAxis="유역" ariaLabel="유역 면적" />));
    const box = (container.querySelector("svg") as SVGElement).getAttribute("viewBox")!.split(" ").map(Number);
    const ys = Array.from(container.querySelectorAll('g[data-row-id="a"] text')).map((node) => Number(node.getAttribute("y")));
    expect(Math.min(...ys)).toBeGreaterThan(0);
    // The last text line sits above the axis ticks at the bottom of the drawing.
    expect(Math.max(...ys)).toBeLessThan(box[3] - 34);
  });

  test("the full name stays in the list under the chart", () => {
    act(() => root.render(<DumbbellChartV153 rows={[row("a", LONG)]} unit="km²" xAxis="면적" yAxis="유역" ariaLabel="유역 면적" />));
    expect(container.querySelector(".dumbbell153__values strong")?.textContent).toContain("홍–타이빈");
  });
});
