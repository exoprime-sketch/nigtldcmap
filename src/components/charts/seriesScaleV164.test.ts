import { describe, expect, test } from "@jest/globals";

import { allZeroSeriesIdsV164, scaleOutlierSeriesIdsV164 } from "./seriesScaleV164";

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

describe("V164-R3 series that are zero in every year", () => {
  test("D-006 / B-040 shape: a line that is 0 in all years while others move is named", () => {
    const ids = allZeroSeriesIdsV164([history("tax", [0, 0, 0, 0]), history("a", [3, 4, 5]), history("b", [0, 1, 0])]);
    expect(Array.from(ids)).toEqual(["tax"]);
  });

  test("a line with one non-zero year is not an all-zero line", () => {
    expect(allZeroSeriesIdsV164([history("a", [0, 0, 2]), history("b", [3, 4, 5])]).size).toBe(0);
  });

  test("when every line is zero there is nothing to hide behind", () => {
    expect(allZeroSeriesIdsV164([history("a", [0, 0]), history("b", [0, 0, 0])]).size).toBe(0);
  });

  test("a line without points is not called zero", () => {
    expect(allZeroSeriesIdsV164([{ id: "empty", points: [] }, history("b", [3, 4])]).size).toBe(0);
  });
});
