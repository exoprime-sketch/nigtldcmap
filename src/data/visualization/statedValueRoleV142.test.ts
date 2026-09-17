import { readFileSync } from "fs";
import { describe, expect, it } from "@jest/globals";
import { resolve } from "path";

import { classifyStatedValueV142, comparableStatedValuesV142 } from "./statedValueRoleV142";

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

  it("does not build a comparison out of the C-011 download", () => {
    const file = resolve(__dirname, "../../../public/data/vietnam/v2/downloads/c-011.json");
    const semanticsFile = resolve(__dirname, "../../../public/data/vietnam/v2/semantic/elements/c-011.json");
    const download = JSON.parse(readFileSync(file, "utf8"));
    const semantics = JSON.parse(readFileSync(semanticsFile, "utf8"));
    const units = new Map<string, { unit: string; unitFamily: string }>(
      semantics.indicators.map((indicator: { indicatorId: string; measure: { unit: string; unitFamily: string } }) => [indicator.indicatorId, indicator.measure])
    );
    const rows = download.entities.map((entity: { recordId: string; name: string; indicatorId: string; normalizedAttributes: Record<string, unknown> }) => {
      const indicator = units.get(entity.indicatorId) || { unit: "", unitFamily: "" };
      const classified = classifyStatedValueV142({
        raw: entity.normalizedAttributes["속성3_값"],
        title: entity.name,
        period: entity.normalizedAttributes["속성4_시점"],
        indicatorUnit: indicator.unit,
        indicatorUnitFamily: indicator.unitFamily,
        elementId: "C-011",
      });
      return { recordId: entity.recordId, title: entity.name, ...classified };
    });
    const byValue = (value: unknown) => rows.filter((row: { role: string; value: number | null }) => row.value === value);
    const measured = rows.filter((row: { role: string; value: number | null }) => row.role === "measure" && row.value !== null);
    expect(measured.map((row: { value: number }) => row.value)).toEqual([1.54]);
    expect(comparableStatedValuesV142(measured)).toEqual([]);
    [113, 114, 115, 2020, 2023, 11, 3].forEach((value) => expect(byValue(value)).toEqual([]));
    expect(rows.filter((row: { role: string }) => row.role === "telephone").length).toBe(9);
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
