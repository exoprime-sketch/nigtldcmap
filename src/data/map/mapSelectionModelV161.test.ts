import { describe, expect, it } from "@jest/globals";
import { popupContextLineV173, rankLinesV161 } from "./mapSelectionModelV161";

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

describe("hover popup context line (V173)", () => {
  it("states the rank among the drawn regions", () => {
    expect(popupContextLineV173({ value: 22204, peers: [22204, 1288, 5.2, 900], peerLabel: "성·시" })).toBe("성·시 4개 중 1위");
    expect(popupContextLineV173({ value: 5.2, peers: [22204, 1288, 5.2, 900], peerLabel: "성·시" })).toBe("성·시 4개 중 4위");
  });

  it("names the group for a group value instead of ranking a repeated figure", () => {
    expect(
      popupContextLineV173({ value: 236.8, peers: [236.8, 236.8, 29.8], peerLabel: "성·시", categoryLabel: "남부전력총공사(EVNSPC)", groupConstant: true })
    ).toBe("남부전력총공사(EVNSPC) 공통값");
  });

  it("names the class on a class map", () => {
    expect(
      popupContextLineV173({ value: 100, peers: [100, 82.8, 51.7], peerLabel: "성·시", categoryLabel: "Aw (열대사바나)", categorical: true })
    ).toBe("Aw (열대사바나)");
  });

  it("says nothing when there is nothing to compare", () => {
    expect(popupContextLineV173({ value: 4, peers: [4, 4, 4, 4], peerLabel: "성·시" })).toBe("");
    expect(popupContextLineV173({ value: 1, peers: [1, 2], peerLabel: "성·시" })).toBe("");
    expect(popupContextLineV173({ value: null, peers: [1, 2, 3], peerLabel: "성·시" })).toBe("");
    expect(popupContextLineV173({ value: 3, peers: [1, 2, 3], peerLabel: "성·시", groupConstant: true })).toBe("");
  });
});
