import { describe, expect, test } from "@jest/globals";

import { scaleOutlierSeriesIdsV164 } from "./seriesScaleV164";

const history = (id: string, values: number[]) => ({ id, points: values.map((value) => ({ value })) });

describe("a single point that would flatten every other line", () => {
  test("D-006 shape: seven lines under 0.3 and one lone 3 -> the lone point starts hidden", () => {
    const lines = Array.from({ length: 7 }, (_, index) => history(`tax-${index}`, [0.1, 0.2, 0.15, 0.3]));
    const ids = scaleOutlierSeriesIdsV164([...lines, { id: "lone", points: [{ value: 3 }] }]);
    expect(Array.from(ids)).toEqual(["lone"]);
  });

  test("a lone point of the same size as the lines stays visible", () => {
    const lines = [history("a", [0.1, 0.2, 0.3]), history("b", [0.1, 0.25, 0.3])];
    expect(scaleOutlierSeriesIdsV164([...lines, { id: "lone", points: [{ value: 0.4 }] }]).size).toBe(0);
  });

  test("a negative lone point is judged by its size", () => {
    const lines = [history("a", [0.1, 0.2, 0.3]), history("b", [0.1, 0.25, 0.3])];
    expect(Array.from(scaleOutlierSeriesIdsV164([...lines, { id: "lone", points: [{ value: -3 }] }]))).toEqual(["lone"]);
  });

  test("too little history leaves everything visible", () => {
    const ids = scaleOutlierSeriesIdsV164([history("a", [0.1, 0.2]), { id: "lone", points: [{ value: 9 }] }]);
    expect(ids.size).toBe(0);
  });

  test("series that all have a history are never hidden", () => {
    const ids = scaleOutlierSeriesIdsV164([history("a", [0.1, 0.2, 0.3]), history("b", [30, 40, 50])]);
    expect(ids.size).toBe(0);
  });

  test("lines that are all zero give nothing to compare against", () => {
    const ids = scaleOutlierSeriesIdsV164([history("a", [0, 0, 0]), history("b", [0, 0, 0]), { id: "lone", points: [{ value: 3 }] }]);
    expect(ids.size).toBe(0);
  });
});
