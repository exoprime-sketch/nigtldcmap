import { describe, expect, it } from "@jest/globals";

import { classifyStatedValueV142, comparableStatedValuesV142 } from "./statedValueRoleV142";
import { readDownloadJsonV158 } from "../testing/downloadZipV158";

/**
 * Negative fixtures first: the values C-011 delivered in its 값 column, which
 * a register comparison once drew on one axis. None of them is a measurement
 * except the homicide rate, and one rate is not a comparison.
 */
describe("classifyStatedValueV142 — C-011's values are not one axis", () => {
  const phone = (raw: number, title: string) =>
    classifyStatedValueV142({ raw, title, period: "2026-07", indicatorUnit: "전화", indicatorUnitFamily: "text" });

  it("reads emergency numbers 113 · 114 · 115 as telephones, not quantities", () => {
    expect(phone(113, "범죄신고").role).toBe("telephone");
    expect(phone(114, "화재신고").role).toBe("telephone");
    expect(phone(115, "응급환자(앰뷸런스)").role).toBe("telephone");
    expect(phone(113, "범죄신고").value).toBeNull();
  });

  it("reads a short integer under a contact heading as a telephone even without an indicator unit", () => {
    expect(classifyStatedValueV142({ raw: 113, title: "범죄신고", period: "2026-07" }).role).toBe("telephone");
  });

  it("reads grouped mission numbers as telephones", () => {
    expect(classifyStatedValueV142({ raw: "(84) 24-3771-0404", title: "주베트남 대한민국대사관(하노이)" }).role).toBe("telephone");
    expect(classifyStatedValueV142({ raw: "+84-24-2220-2828", title: "연락처" }).role).toBe("telephone");
  });

  it("reads a year or month that restates the row's period as a date", () => {
    expect(classifyStatedValueV142({ raw: 2020, title: "발령 개시", period: "2020-03" }).role).toBe("date");
    expect(classifyStatedValueV142({ raw: 3, title: "발령 개시", period: "2020-03" }).role).toBe("date");
    expect(classifyStatedValueV142({ raw: 2023, title: "최근 조정 관련 공지", period: "2023-11" }).role).toBe("date");
    expect(classifyStatedValueV142({ raw: 11, title: "최근 조정 관련 공지", period: "2023-11" }).role).toBe("date");
    expect(classifyStatedValueV142({ raw: "2026-07-13", title: "주점 요금 시비 관련 안전공지" }).role).toBe("date");
  });

  it("reads links and grades as what they are", () => {
    expect(classifyStatedValueV142({ raw: "드묾", indicatorUnit: "URL", indicatorUnitFamily: "text" }).role).toBe("text");
    expect(classifyStatedValueV142({ raw: "0404.go.kr", title: "외교부 해외안전여행 베트남 국가페이지" }).role).toBe("url");
    expect(classifyStatedValueV142({ raw: "Level 1", title: "미국 국무부 여행경보", indicatorUnit: "등급(1~4)", indicatorUnitFamily: "text" }).role).toBe("categorical");
  });

  it("keeps the homicide rate as a measure through its indicator's unit", () => {
    const rate = classifyStatedValueV142({ raw: 1.54, title: "고의살인율(Intentional Homicide Rate)", period: 2011, indicatorUnit: "건/10만명", indicatorUnitFamily: "count" });
    expect(rate.role).toBe("measure");
    expect(rate.value).toBe(1.54);
    expect(rate.unit).toBe("건/10만명");
  });

  it("never compares a number that states no unit", () => {
    expect(classifyStatedValueV142({ raw: 42, title: "어떤 항목" }).role).toBe("number-without-unit");
    expect(classifyStatedValueV142({ raw: 42, title: "어떤 항목", indicatorUnit: "구분", indicatorUnitFamily: "text" }).role).toBe("categorical");
  });

  // 2026-09-30 재적재: C-011이 "가로형" 넓은 레코드로 전면 재구성되며(속성3_값/속성4_시점
  // 같은 레코드 공통 컬럼이 사라지고, crime_stat·field_survey·safety_notice·
  // security_assessment·travel_alert 유형별로 서로 다른 컬럼군을 쓴다), 종전에 있던
  // 연락처 레코드(응급신고 113·114·115, 대사관·총영사관 전화)가 이번 납품에 없다(38개 행
  // 전체에 연락처_값이 채워진 행이 하나도 없음). 고의살인율(공식 통계)은 이제 2001~2011년
  // 11개 연도 전체가 오고(종전엔 2011년 1개만), 같은 값 컬럼을 쓰는 Numbeo 행은 원천이
  // 스스로 "크라우드소싱 인식조사(공식 통계 아님)"라고 밝혀 비교 대상에서 제외한다.
  it("does not build a comparison out of the C-011 download", () => {
    const download = readDownloadJsonV158("c-011");
    type EntityC011 = { recordId: string; name: string; indicatorId: string; normalizedAttributes: Record<string, unknown> };
    const stated = (entity: EntityC011): { raw: unknown; indicatorUnit?: string; indicatorUnitFamily?: string; period?: unknown; measureName?: unknown } => {
      const attributes = entity.normalizedAttributes;
      if (entity.indicatorId === "C-011_crime_stat" && String(attributes["통계_자료_성격"] || "").includes("공식 통계")) {
        return { raw: attributes["통계_값_건_10만_명"], indicatorUnit: "건/10만명", indicatorUnitFamily: "count", period: attributes["통계_연도_년"], measureName: attributes["통계_지표명_국문"] };
      }
      if (entity.indicatorId === "C-011_safety_notice") return { raw: attributes["공지_게시일_YYYY_MM_DD"] };
      if (entity.indicatorId === "C-011_travel_alert") return { raw: attributes["경보_현재_등급_단계"] };
      // C-011_crime_stat(Numbeo, crowdsourced), C-011_field_survey, C-011_security_assessment:
      // this delivery states no single stated-value column for these record types.
      return { raw: null };
    };
    const rows = download.entities.map((entity: EntityC011) => {
      const fact = stated(entity);
      const classified = classifyStatedValueV142({
        raw: fact.raw,
        title: entity.name,
        period: fact.period,
        indicatorUnit: fact.indicatorUnit,
        indicatorUnitFamily: fact.indicatorUnitFamily,
        measureName: fact.measureName as string | undefined,
        elementId: "C-011",
      });
      return { recordId: entity.recordId, title: entity.name, ...classified };
    });
    const byValue = (value: unknown) => rows.filter((row: { role: string; value: number | null }) => row.value === value);
    const measured = rows.filter((row: { role: string; value: number | null }) => row.role === "measure" && row.value !== null);
    expect(measured.map((row: { value: number }) => row.value)).toEqual([1.29, 1.35, 1.33, 1.32, 1.3, 1.28, 1.4, 1.28, 1.43, 1.53, 1.54]);
    expect(comparableStatedValuesV142(measured)).toEqual([]);
    [113, 114, 115, 2020, 2023, 11, 3].forEach((value) => expect(byValue(value)).toEqual([]));
    expect(rows.filter((row: { role: string }) => row.role === "telephone").length).toBe(0);
  });
});

describe("comparableStatedValuesV142 — one measure, one unit, one period", () => {
  it("requires a measure identity, not just matching units", () => {
    const rows = [1, 2, 3].map((value) => ({ recordId: String(value), title: "항목", value, unit: "m³/s", measureKey: null, period: "2020" }));
    expect(comparableStatedValuesV142(rows)).toEqual([]);
  });

  it("does not treat explicit phone, date or identifier units as measurements", () => {
    expect(classifyStatedValueV142({ raw: 113, unit: "전화번호" }).role).toBe("telephone");
    expect(classifyStatedValueV142({ raw: 2020, unit: "연도" }).role).toBe("date");
    expect(classifyStatedValueV142({ raw: 1234, unit: "코드" }).role).toBe("identifier");
    expect(classifyStatedValueV142({ raw: 12, indicatorUnit: "지수", measureName: "위험지수", period: "2020-12" }).role).toBe("measure");
  });
  const basin = (recordId: string, value: number) => ({
    recordId,
    title: recordId,
    value,
    unit: "km² (베트남 내 면적, GIS 산출)",
    measureKey: "km² (베트남 내 면적, GIS 산출)",
    period: null,
  });

  it("keeps a register of one measure in one unit comparable (B-025's basin areas)", () => {
    const rows = [basin("홍–타이빈", 86253), basin("동나이", 38686), basin("끄우롱", 36226), basin("마", 18985)];
    expect(comparableStatedValuesV142(rows)).toHaveLength(4);
  });

  it("does not put different measures side by side because their unit string matches", () => {
    const rows = [
      { recordId: "a", title: "건기 최저유량 — Kratie", value: 2290, unit: "m³/s", measureKey: "건기 최저유량 — Kratie(메콩)", period: "2004" },
      { recordId: "b", title: "우기 최고유량 — Sơn Tây", value: 23000, unit: "m³/s", measureKey: "우기 최고유량 — Sơn Tây(홍강)", period: "2010" },
      { recordId: "c", title: "우기 최고유량 — Kratie", value: 36700, unit: "m³/s", measureKey: "우기 최고유량 — Kratie(메콩)", period: "2004" },
    ];
    expect(comparableStatedValuesV142(rows)).toEqual([]);
  });

  it("does not turn one measure at several periods into a comparison", () => {
    const rows = [1992, 1993, 1994, 1995].map((year) => ({ recordId: String(year), title: "시가화지역", value: year, unit: "1000 ha", measureKey: "시가화지역", period: String(year) }));
    expect(comparableStatedValuesV142(rows)).toEqual([]);
  });
});
