import { describe, expect, test } from "@jest/globals";

import { scatterLayoutV164 } from "./scatterLayoutV164";

const points = [
  { id: "manager", x: 1200, y: 9800, label: "관리자" },
  { id: "professional", x: 4100, y: 11200, label: "전문가" },
  { id: "craft", x: 7400, y: 6100, label: "기능원" },
  { id: "machine", x: 7800, y: 6300, label: "기계조작" },
  { id: "elementary", x: 12909, y: 4200, label: "단순노무" },
];

describe("E-012 scatter layout (V164-R3)", () => {
  test("both axes have round ticks that cover the data, with labels", () => {
    const layout = scatterLayoutV164(points, 620);
    expect(layout.xTicks[0]).toBe(0);
    expect(layout.xTicks[layout.xTicks.length - 1]).toBeGreaterThanOrEqual(12909);
    expect(layout.yTicks[layout.yTicks.length - 1]).toBeGreaterThanOrEqual(11200);
    expect(layout.xTicks.length).toBeGreaterThanOrEqual(3);
    expect(layout.xTickLabels).toHaveLength(layout.xTicks.length);
    expect(layout.yTickLabels).toHaveLength(layout.yTicks.length);
    expect(layout.xTickLabels.every((label) => label.length > 0)).toBe(true);
  });

  test("the left margin holds the widest y tick label and the y title is not beside the axis", () => {
    const wide = scatterLayoutV164([{ id: "a", x: 1, y: 1_500_000, label: "가" }], 620);
    const narrow = scatterLayoutV164([{ id: "a", x: 1, y: 8, label: "가" }], 620);
    expect(wide.margin.left).toBeGreaterThan(narrow.margin.left);
    expect(wide.margin.top).toBeGreaterThanOrEqual(34);
  });

  test("every point is inside the plot and every name is inside the drawing", () => {
    for (const width of [224, 320, 390, 620, 900]) {
      const layout = scatterLayoutV164(points, width);
      expect(layout.width).toBe(width);
      layout.points.forEach((placed) => {
        expect(placed.cx).toBeGreaterThanOrEqual(layout.margin.left - 0.001);
        expect(placed.cx).toBeLessThanOrEqual(layout.margin.left + layout.plotWidth + 0.001);
        expect(placed.cy).toBeGreaterThanOrEqual(layout.margin.top - 0.001);
        expect(placed.cy).toBeLessThanOrEqual(layout.margin.top + layout.plotHeight + 0.001);
        expect(placed.label.box.left).toBeGreaterThanOrEqual(0);
        expect(placed.label.box.right).toBeLessThanOrEqual(layout.width);
      });
    }
  });

  test("a narrow box lays out for its own width, not a shrunken 620", () => {
    const narrow = scatterLayoutV164(points, 320);
    expect(narrow.plotWidth).toBeLessThan(320);
    expect(narrow.xTicks.length).toBeLessThanOrEqual(scatterLayoutV164(points, 900).xTicks.length);
  });

  test("names do not overlap each other at phone width", () => {
    const layout = scatterLayoutV164(points, 360);
    const boxes = layout.points.map((placed) => placed.label.box);
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const w = Math.min(boxes[i].right, boxes[j].right) - Math.max(boxes[i].left, boxes[j].left);
        const h = Math.min(boxes[i].bottom, boxes[j].bottom) - Math.max(boxes[i].top, boxes[j].top);
        expect(w > 0 && h > 0).toBe(false);
      }
    }
  });

  test("all-zero values still give a drawable axis", () => {
    const layout = scatterLayoutV164([{ id: "a", x: 0, y: 0, label: "가" }], 620);
    expect(layout.xTicks).toEqual([0, 1]);
    expect(layout.yTicks).toEqual([0, 1]);
    expect(Number.isFinite(layout.points[0].cx)).toBe(true);
  });
});
