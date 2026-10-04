import { describe, expect, it } from "@jest/globals";
import type { CardSummaryV140 } from "../../../data/cardSummariesV140";
import type { DecisionPointV159 } from "../../../data/structure/decisionPointsV159";
import type { VietnamEntityV124, VietnamObservationV124 } from "../../../data/vietnam/vietnamTypesV124";
import { kpiTilesV153 } from "./DetailKpiStripV153";
import {
  coverageFigureV164,
  decisionPointCountV164,
  directoryHeadlineV164,
  guardedHeadlineV164,
  headlineAgreesWithPointsV164,
  isZeroCountV164,
  numbersInTextV164,
  pointHeadlineV164,
  promotedCountV164,
  screenPeriodTileV164,
  spatialHeadlineUnsupportedV164,
  withoutZeroCountsV164,
} from "./kpiTilesV164";

function card(kind: CardSummaryV140["kind"], headline: { value: string; label: string }, period = "2020–2024년", measureUnit = ""): CardSummaryV140 {
  return {
    elementId: "X-001",
    title: "",
    kind,
    headline,
    preview: {},
    period,
    provider: "",
    selection: null,
    basis: { unit: "", rule: "" },
    measure: measureUnit ? { key: "m", label: "m", unit: measureUnit } : null,
    mapConnected: false,
    downloadable: false,
  } as unknown as CardSummaryV140;
}

const point = (label: string, value: string, detail?: string): DecisionPointV159 => ({ key: label, label, value, detail });

let n = 0;
function entity(attributes: Record<string, unknown>, indicatorId = "X-001_indicator"): VietnamEntityV124 {
  n += 1;
  return { recordId: `X-${n}`, elementId: "X-001", indicatorId, normalizedAttributes: attributes } as unknown as VietnamEntityV124;
}
const observation = (value: number, year: number): VietnamObservationV124 => ({ recordId: `o${year}`, elementId: "X-001", indicatorId: "X-001_i", value, year }) as unknown as VietnamObservationV124;

describe("zero counts (BGD B-013, C-008, E-020)", () => {
  it("knows a count of nothing and only that: a measured zero keeps its tile", () => {
    expect(isZeroCountV164("0개 항목")).toBe(true);
    expect(isZeroCountV164("0개")).toBe(true);
    expect(isZeroCountV164("0곳")).toBe(true);
    expect(isZeroCountV164("0 %")).toBe(false);
    expect(isZeroCountV164("0 TWh")).toBe(false);
    expect(isZeroCountV164("10개")).toBe(false);
    expect(isZeroCountV164("2개")).toBe(false);
  });

  it("leaves 'NAZCA 등재 행위자 0곳 · 0년 확인' out of a label and keeps the rest", () => {
    expect(withoutZeroCountsV164("이니셔티브 · NAZCA 등재 행위자 0곳 · 0년 확인")).toBe("이니셔티브");
    expect(withoutZeroCountsV164("공고 · 2010–2026년 · 100곳")).toBe("공고 · 2010–2026년 · 100곳");
  });

  it("leads with the count the label names when the headline is a zero (E-020: 활용 사례 9건)", () => {
    expect(promotedCountV164("지원제도 · 활용 사례 9건 · 2007–2027년")).toEqual({ value: "9건", label: "활용 사례 · 2007–2027년" });
    expect(promotedCountV164("EU 평균 탄소지불액 · 값이 문장으로 기재된 자료")).toBeNull();
  });

  it("drops the headline of B-013 ('0개 항목'), keeps C-008's count without its zero parts, promotes E-020", () => {
    expect(guardedHeadlineV164(card("facts", { value: "0개 항목", label: "EU 평균 탄소지불액 · 값이 문장으로 기재된 자료" }))).toBeNull();
    expect(guardedHeadlineV164(card("bars", { value: "2개", label: "이니셔티브 · NAZCA 등재 행위자 0곳 · 0년 확인" }))).toEqual({ value: "2개", label: "이니셔티브" });
    expect(guardedHeadlineV164(card("facts", { value: "0개", label: "지원제도 · 활용 사례 9건 · 2007–2027년" }))).toEqual({ value: "9건", label: "활용 사례 · 2007–2027년" });
  });

  it("no tile of the strip prints a zero count", () => {
    const tiles = kpiTilesV153(card("facts", { value: "0개 항목", label: "EU 평균 탄소지불액 · 값이 문장으로 기재된 자료" }, "2022–2026년"), [observation(1, 2022)], [], 3);
    expect(tiles.map((tile) => tile.key)).toEqual(["period", "observations", "indicators"]);
    expect(tiles.some((tile) => /(^|\D)0\s*(개|곳|건)/u.test(tile.value + tile.label))).toBe(false);
  });
});

describe("the headline against the 판단 포인트 (BGD D-005, D-013, E-009, A-002; VNM D-023, D-024)", () => {
  const latest = [point("최신값·연도", "59.1 점 (2024년)", "사회 통합(SI) 기준")];

  it("compares only measured figures: counts and an empty list say nothing", () => {
    expect(headlineAgreesWithPointsV164("29 순위", latest)).toBe(false);
    expect(headlineAgreesWithPointsV164("59.1 점", latest)).toBe(true);
    expect(headlineAgreesWithPointsV164("29 순위", [point("건수", "119건")])).toBeNull();
    expect(headlineAgreesWithPointsV164("29 순위", [])).toBeNull();
    expect(numbersInTextV164("−0.95 점 · 4,209만 USD")).toEqual([-0.95, 4209]);
  });

  it("a headline of another series leads with the 판단 포인트's own figure", () => {
    const headline = guardedHeadlineV164(card("level", { value: "29 순위", label: "GGGI Green Growth Index · 아시아 역내 순위 · 2024년" }), { decisionPoints: latest });
    expect(headline).toEqual({ value: "59.1 점", label: "사회 통합(SI) · 2024년" });
    const forecast = [point("전망값(2027년)", "75.2 %", "적응 · FY2026-27 총 기후예산 대비 비중 기준")];
    expect(guardedHeadlineV164(card("level", { value: "5.2 %", label: "예산 배분 구조 · FY2019-20 · 2020년" }), { decisionPoints: forecast })).toEqual({
      value: "75.2 %",
      label: "적응 · FY2026-27 총 기후예산 대비 비중 · 2027년",
    });
  });

  it("a headline the 판단 포인트 state stays", () => {
    const own = card("line", { value: "41 점", label: "CPI 점수 · 2025년" });
    expect(guardedHeadlineV164(own, { decisionPoints: [point("최신값·연도", "41 점 (2025년)", "CPI 점수 기준"), point("최근 5년 방향", "상승 2020년 38 점 → 2025년 41 점")] })).toEqual({ value: "41 점", label: "CPI 점수 · 2025년" });
  });

  it("with no figure to lead with, a disagreeing headline is left out", () => {
    const top = [point("상위 3개 지역", "까마우 (Cà Mau): 111 °C · 박리에우 (Bạc Liêu): 108 °C")];
    expect(guardedHeadlineV164(card("spatial", { value: "69.5 °C", label: "심도 1km 지온(평균) 최대 · 까마우" }), { decisionPoints: top })).toBeNull();
    expect(pointHeadlineV164(top)).toBeNull();
  });

  it("a count headline follows the count the 판단 포인트 state (D-023: 71건 → 110건, D-024: 7건 → 22건)", () => {
    const counts = [point("건수", "110건"), point("총액", "6.54억 USD", "금액 기재 46건 합계")];
    expect(decisionPointCountV164(counts)).toBe(110);
    expect(guardedHeadlineV164(card("composition", { value: "71건", label: "4개 기금의 개별 사업" }), { decisionPoints: counts })).toEqual({ value: "110건", label: "4개 기금의 개별 사업" });
    expect(guardedHeadlineV164(card("facts", { value: "110건", label: "공고" }), { decisionPoints: counts })).toEqual({ value: "110건", label: "공고" });
  });

  it("a count the label sets apart, or a measured count, is not replaced by the list's record count", () => {
    const counts = [point("건수", "7건")];
    // VNM E-020: 3 support schemes, and the label itself states the 7 cases the list holds.
    expect(guardedHeadlineV164(card("facts", { value: "3개", label: "지원제도 · 활용 사례 7건" }), { decisionPoints: counts })).toEqual({ value: "3개", label: "지원제도 · 활용 사례 7건" });
    // BGD D-012: 24 developers read from a table (a measured series), 122 is the list's rows.
    expect(guardedHeadlineV164(card("level", { value: "24 건", label: "중국계 개발사 수 · 2026년" }, "2026년", "건"), { decisionPoints: [point("건수", "122건")] })).toEqual({
      value: "24 건",
      label: "중국계 개발사 수 · 2026년",
    });
  });

  it("a total of the list's records or a long-run normal is no series to compare a headline with (BGD D-025, B-001)", () => {
    expect(headlineAgreesWithPointsV164("2,400만 USD", [point("건수", "67건"), point("총액", "75.6억 USD", "금액 기재 64건 합계")])).toBeNull();
    expect(headlineAgreesWithPointsV164("478 mm", [point("최신값·연도", "2,176 mm (1991–2020년)")])).toBeNull();
    const month = card("bars", { value: "478 mm", label: "월 평년강수 최대 · 7월 · 월별 평년값(1991–2020)" }, "1991–2020년 평년값", "mm");
    expect(guardedHeadlineV164(month, { decisionPoints: [point("최신값·연도", "2,176 mm (1991–2020년)")] })).toEqual({ value: "478 mm", label: "월 평년강수 최대 · 7월 · 월별 평년값(1991–2020)" });
  });

  it("the strip's unit follows the figure it prints", () => {
    const tiles = kpiTilesV153(card("level", { value: "29 순위", label: "GGGI · 아시아 역내 순위", }, "2024년", "순위"), [observation(1, 2024)], [], 2, { decisionPoints: latest });
    expect(tiles[0]).toEqual({ key: "headline", value: "59.1 점", unit: "점", label: "사회 통합(SI) · 2024년" });
  });
});

describe("the headline against the screen's own lists", () => {
  const divisions = ["Barisal", "Chittagong", "Dhaka", "Khulna"];
  const authority = entity({ 기관명: "Department of Environment", 대상_분야: "국가지정기관(DNA)" });
  const activity = (name: string) => entity({ 기관명: name, 대상_분야: "CDM 전환 활동 — 사업(Project)" });

  it("E-002: one authority and eleven CDM activities are one institution, not '12곳 기관'", () => {
    const rows = [authority, ...Array.from({ length: 11 }, (_, i) => activity(`Project ${i}`))];
    expect(directoryHeadlineV164({ value: "12곳", label: "기관 · 2024–2026년" }, rows)).toEqual({
      value: "1곳",
      label: "기관 · CDM 전환 활동 11건은 별도 · 2024–2026년",
    });
  });

  it("E-003: five contact persons at three organisations name three organisations", () => {
    const person = (name: string, org: string) => entity({ 담당자명_person_name: name, 소속기관_org_name: org });
    const rows = [person("A", "DAE"), person("B", "DAE"), person("C", "NDA"), person("D", "NDA"), person("E", "MoF")];
    expect(directoryHeadlineV164({ value: "5건", label: "담당자 정보 · 기관 2곳 · 2026년" }, rows)).toEqual({ value: "5건", label: "담당자 정보 · 기관 3곳 · 2026년" });
  });

  it("a directory the card counts rightly, and a list that is no directory, are left alone", () => {
    const offices = [entity({ organizationName: "KOTRA" }), entity({ organizationName: "KOICA" })];
    expect(directoryHeadlineV164({ value: "2곳", label: "현지 사무소" }, offices)).toBeNull();
    expect(directoryHeadlineV164({ value: "3곳", label: "광산 · 1961–2026년" }, [entity({ 광종: "Au" })])).toBeNull();
    expect(directoryHeadlineV164({ value: "3곳", label: "광산" }, [])).toBeNull();
  });

  // A measure is only a measure when the divisions differ in it.
  const division = (name: string, extra: Record<string, unknown> = {}) => entity({ 지역명_로마자: name, 행정단위: "Division", 우세_유향_비율: 10 + divisions.indexOf(name), ...extra });
  const basin = (id: number) => entity({ 지역명_로마자: `HydroBASINS lvl6 40600${id}`, 행정단위: "유역(HydroBASINS lvl6)", 우세_유향_비율: 30 });

  it("B-026: a basin code in the label, or '40개 주 중' over four divisions, cannot be the screen's headline", () => {
    const rows = [...divisions.map((name) => division(name)), ...[1, 2, 3, 4, 5].map(basin)];
    const own = card("spatial", { value: "26 %", label: "우세 유향 비율 최대 · Hydro BASINS lvl6 4060025450 · 40개 주(Division) 중 · 2022년 기준" });
    expect(spatialHeadlineUnsupportedV164(own, { value: own.headline.value, label: own.headline.label }, rows)).toBe(true);
    const counted = card("spatial", { value: "26 %", label: "우세 유향 비율 최대 · Barisal · 40개 주(Division) 중 · 2022년 기준" });
    expect(spatialHeadlineUnsupportedV164(counted, counted.headline, rows)).toBe(true);
    const right = card("spatial", { value: "26 %", label: "우세 유향 비율 최대 · Barisal · 4개 주(Division) 중 · 2022년 기준" });
    expect(spatialHeadlineUnsupportedV164(right, right.headline, rows)).toBe(false);
  });

  it("B-008: a tide-gauge value labelled as the scenario's median is not kept", () => {
    const stations = ["Hon Dau", "Vung Tau"].flatMap((name, i) =>
      [5, 50, 95].map((q) => entity({ 관측소명_로마자: name, 개편_후_소속_단위: `Unit ${i}`, 시나리오: "SSP2-4.5", 연도: 2100, 분위수: q, 상대해수면_상승_m_2005년_기준: q / 100 + i / 10 }))
    );
    const own = card("bars", { value: "0.63 m", label: "2100년 상대해수면 상승(2005년 기준) · SSP2-4.5 중앙값" });
    expect(guardedHeadlineV164(own, { entities: stations })).toBeNull();
    expect(coverageFigureV164(stations)).toEqual({ value: "2곳", label: "관측소 수" });
  });

  it("a headline with rows that are not region rows at all is judged by its own text", () => {
    const own = card("bars", { value: "86건", label: "기록 · 유형 9종" });
    expect(guardedHeadlineV164(own, { entities: [entity({ 이름: "A" })] })).toEqual({ value: "86건", label: "기록 · 유형 9종" });
  });

  it("a region list names its coverage, a list of anything else does not", () => {
    expect(coverageFigureV164(divisions.map((name) => division(name)))).toEqual({ value: "4곳", label: "대상 지역 수" });
    expect(coverageFigureV164([entity({ 이름: "A" })])).toBeNull();
    expect(coverageFigureV164([])).toBeNull();
  });

  it("the strip keeps three figures when a region headline goes: period, count and coverage", () => {
    const rows = [...divisions.map((name) => division(name, { 연도: 2022 })), ...[1, 2, 3].map(basin)];
    const own = card("spatial", { value: "26 %", label: "우세 유향 비율 최대 · Hydro BASINS lvl6 4060025450 · 40개 주(Division) 중 · 2022년 기준" }, "2022년 기준");
    const tiles = kpiTilesV153(own, [], rows, 0);
    expect(tiles.map((tile) => tile.key)).toEqual(["coverage", "period", "entities"]);
    expect(tiles[0]).toEqual({ key: "coverage", value: "4곳", unit: "곳", label: "대상 지역 수" });
    expect(tiles.every((tile) => tile.unit && tile.value.length > tile.unit.length)).toBe(true);
  });
});

describe("the period tile and the source line state one period (BGD A-013, B-006, B-008, B-048; VNM A-022, B-016)", () => {
  it("bare years on the card give way to the span of the loaded records", () => {
    expect(screenPeriodTileV164("2016–2026년", { span: { first: 2016, last: 2016 } })).toEqual({ value: "2016년", unit: "년", label: "자료기간" });
    expect(screenPeriodTileV164("2015–2024년", { span: { first: 2015, last: 2026 } })).toEqual({ value: "2015–2026년", unit: "년", label: "자료기간" });
    // A card with no year ("0년 확인") has nothing to keep: the span states the period.
    expect(screenPeriodTileV164("0년 확인", { span: { first: 2026, last: 2026 } })?.value).toBe("2026년");
    expect(screenPeriodTileV164("2025–2030년 · 집중형 태양광", { span: { first: 2025, last: 2035 } })?.value).toBe("2025–2035년");
  });

  it("the card's own wording is kept: a climate normal, a model split, a collection date", () => {
    const span = { first: 2018, last: 2018 };
    expect(screenPeriodTileV164("1999–2018 장기평균(LTA)", { span })).toBeNull();
    expect(screenPeriodTileV164("1950–2100년 (과거 모형 1950–2014 · 전망 2015–2100)", { span })).toBeNull();
    expect(screenPeriodTileV164("2026-08-14 수집", { span })).toBeNull();
    expect(screenPeriodTileV164("2021·2022·2024년", { span })).toBeNull();
    expect(screenPeriodTileV164("2016–2026년", { span: null })).toBeNull();
  });

  it("an element with a period statement shows the statement the source line shows", () => {
    expect(screenPeriodTileV164("2026-08-14 수집", { statement: { label: "기준 시점", text: "2026-08-14 수집" }, span: { first: 2020, last: 2025 } })).toEqual({
      value: "2026-08-14 수집",
      unit: "수집",
      label: "기준 시점",
    });
    expect(screenPeriodTileV164("1997–2024년", { statement: { label: "자료기간", text: "1997–2024년" } })?.unit).toBe("년");
  });

  it("the strip's period tile and the headline label follow the loaded records", () => {
    const own = card("facts", { value: "3곳", label: "광산 · 1961–2026년" }, "1961–2026년");
    const tiles = kpiTilesV153(own, [], [entity({ 이름: "A" }), entity({ 이름: "B" }), entity({ 이름: "C" })], 0, { span: { first: 1961, last: 2016 } });
    expect(tiles.find((tile) => tile.key === "period")).toEqual({ key: "period", value: "1961–2016년", unit: "년", label: "자료기간" });
    expect(tiles.find((tile) => tile.key === "headline")?.label).toBe("광산 · 1961–2016년");
  });
});
