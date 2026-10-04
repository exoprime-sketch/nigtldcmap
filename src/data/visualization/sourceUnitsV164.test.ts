import { describe, expect, it } from "@jest/globals";
import { publicUnitsV164 } from "./sourceUnitsV164";

describe("publicUnitsV164: the units a source line may print", () => {
  it("drops the header-row notes both countries filed as a unit", () => {
    expect(publicUnitsV164(["속성별 —3행 머리글 괄호 표기 참조", "건", "개국"])).toEqual(["건", "개국"]);
    expect(publicUnitsV164(["속성별,3행 머리글 괄호 표기 참조", "MtCO₂e"])).toEqual(["MtCO₂e"]);
    expect(publicUnitsV164(["속성별 — 1.2_entity 3행 머리글 괄호 표기 참조"])).toEqual([]);
  });

  it("keeps only the units of '광종별 상이 - 「단위」 열 참조 (…)'", () => {
    expect(publicUnitsV164(["광종별 상이 - 「단위」 열 참조 (t / t REO)"])).toEqual(["t", "t REO"]);
    // The source cut the list short ("… / t …"): the unfinished unit is left out, the finished ones stay.
    expect(
      publicUnitsV164(["광종별 상이 - 「단위」 열 참조 (t REO / t (W 함량) / 천 t (건조 기준) / t …)"])
    ).toEqual(["t REO", "t (W 함량)", "천 t (건조 기준)"]);
    // A note with nothing in the parenthesis names no unit at all.
    expect(publicUnitsV164(["광종별 상이 - 「단위」 열 참조"])).toEqual([]);
  });

  it("drops a column's name filed as its unit, keeps the real units beside it", () => {
    expect(publicUnitsV164(["구분", "개", "연도"])).toEqual(["개"]);
    // Only the bare column name goes: "구분·%" and "구분(국내생산/수입의존)" state more than the name.
    expect(publicUnitsV164(["구분·%", "구분(국내생산/수입의존)"])).toEqual(["구분·%", "구분(국내생산/수입의존)"]);
  });

  it("keeps real units, in order and without repeats", () => {
    expect(publicUnitsV164(["MW", "% of GDP (annual)", "MW", "지표별 상이"])).toEqual(["MW", "% of GDP (annual)", "지표별 상이"]);
    expect(publicUnitsV164([])).toEqual([]);
  });
});
