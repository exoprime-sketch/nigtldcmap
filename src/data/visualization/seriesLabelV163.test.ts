import { expect, test } from "@jest/globals";
import { publicGasTextV163, publicSeriesNameV163 } from "./seriesLabelV163";

test("series part of a delivered label reads as words", () => {
  expect(publicSeriesNameV163("가스별 배출량 · CH4(CO2 환산) — GWP-100 AR5 적용 CO2 환산 배출량")).toBe("메탄(CH₄ 환산)");
  expect(publicSeriesNameV163("1차 에너지 소비 · 석탄 — 석탄 1차에너지 소비량")).toBe("석탄");
  expect(publicSeriesNameV163("국내총생산")).toBe("국내총생산");
  expect(publicSeriesNameV163(null)).toBe("");
});

test("gas tokens inside a title, not inside units", () => {
  expect(publicGasTextV163("가스별 배출량 · CH4(CO2 환산) — GWP-100 AR5 적용 CO2 환산 배출량")).toBe(
    "가스별 배출량 · 메탄(CH₄ 환산) — GWP-100 AR5 적용 CO₂ 환산 배출량"
  );
  expect(publicGasTextV163("가스별 배출량 · F-gas — 불소계 온실가스 10개 화종 질량 합계")).toBe(
    "가스별 배출량 · 불소계 온실가스 — 불소계 온실가스 10개 화종 질량 합계"
  );
  expect(publicGasTextV163("Mt CO2eq")).toBe("Mt CO2eq");
});
