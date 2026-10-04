import { describe, expect, test } from "@jest/globals";

import { estimateLabelWidthV164, markedLabelPlacementV164, placeScatterLabelsV164 } from "./chartLabelLayoutV164";
import type { BoxV164 } from "./chartLabelLayoutV164";

const overlap = (a: BoxV164, b: BoxV164) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;

describe("label width", () => {
  test("a Hangul glyph is one em, a digit about 0.58 em", () => {
    expect(estimateLabelWidthV164("선택", 12)).toBe(24);
    expect(estimateLabelWidthV164("2025", 10)).toBeCloseTo(23.2, 5);
    expect(estimateLabelWidthV164("", 12)).toBe(0);
  });
});

describe("the marked year's label (A-001 / A-022 stray dot)", () => {
  const frame = { plotLeft: 60, plotRight: 700 };

  test("to the right of the line while it fits", () => {
    expect(markedLabelPlacementV164({ lineX: 300, labelWidth: 70, ...frame })).toEqual({ x: 306, anchor: "start" });
  });

  test("to the left of a line at the right edge", () => {
    expect(markedLabelPlacementV164({ lineX: 700, labelWidth: 70, ...frame })).toEqual({ x: 694, anchor: "end" });
  });

  test("pinned inside the plot when neither side has room", () => {
    const placement = markedLabelPlacementV164({ lineX: 100, labelWidth: 700, plotLeft: 60, plotRight: 400 });
    expect(placement.anchor).toBe("start");
    expect(placement.x).toBe(60);
  });
});

describe("scatter labels (E-012)", () => {
  const bounds: BoxV164 = { left: 60, right: 500, top: 30, bottom: 300 };

  test("a point at the right edge writes its name to its left, inside the bounds", () => {
    const [placed] = placeScatterLabelsV164([{ id: "machine", x: 496, y: 150, text: "기계조작" }], { bounds });
    expect(placed.anchor).not.toBe("start");
    expect(placed.box.right).toBeLessThanOrEqual(bounds.right);
    expect(placed.crowded).toBe(false);
  });

  test("points that sit close together do not write over each other or over a point", () => {
    const points = [
      { id: "manager", x: 100, y: 250, text: "관리자" },
      { id: "army", x: 108, y: 247, text: "군인" },
      { id: "craft", x: 300, y: 120, text: "기능원" },
      { id: "machine", x: 308, y: 124, text: "기계조작" },
      { id: "service", x: 312, y: 118, text: "서비스" },
    ];
    const placed = placeScatterLabelsV164(points, { bounds, radius: 8 });
    expect(placed.map((item) => item.id)).toEqual(points.map((point) => point.id));
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) expect(overlap(placed[i].box, placed[j].box)).toBe(false);
      expect(placed[i].box.left).toBeGreaterThanOrEqual(bounds.left);
      expect(placed[i].box.right).toBeLessThanOrEqual(bounds.right);
    }
    points.forEach((point, index) => {
      points.forEach((other, otherIndex) => {
        if (index === otherIndex) return;
        const dot: BoxV164 = { left: other.x - 6, right: other.x + 6, top: other.y - 6, bottom: other.y + 6 };
        expect(overlap(placed[index].box, dot)).toBe(false);
      });
    });
  });

  test("when nothing is free the least crowded spot is taken and said so", () => {
    const tiny: BoxV164 = { left: 0, right: 60, top: 0, bottom: 20 };
    const placed = placeScatterLabelsV164([{ id: "a", x: 30, y: 10, text: "아주긴이름의라벨" }], { bounds: tiny });
    expect(placed[0].crowded).toBe(true);
  });
});
