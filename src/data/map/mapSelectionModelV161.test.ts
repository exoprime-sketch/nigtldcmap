import { describe, expect, it } from "@jest/globals";
import { rankLinesV161 } from "./mapSelectionModelV161";

describe("rank lines for record counts (V164-4)", () => {
  it("keeps the rank and drops the average when asked", () => {
    const lines = rankLinesV161({ value: 2, peers: [4, 2, 3, 2], unit: "건", peerLabel: "주(Division)", withAverage: false });
    expect(lines.map((line) => line.label)).toEqual(["주(Division) 중 순위"]);
  });

  it("keeps the average for a measured value", () => {
    const lines = rankLinesV161({ value: 24.7, peers: [24.7, 25.1, 23.9], unit: "°C", peerLabel: "성·시" });
    expect(lines.map((line) => line.label)).toEqual(["성·시 중 순위", "성·시 평균 대비"]);
  });
});
