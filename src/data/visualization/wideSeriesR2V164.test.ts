import { describe, expect, it } from "@jest/globals";

import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import type { WideRecordV162 } from "./wideRecordsV162";
import { isEnglishSentenceV164, sharedWideValuesV164, sortNumberedSeriesV164 } from "./wideRecordsV162";

/** V164 R2: the order of a numbered series, a value many records state alike, and an English sentence. */
const named = (names: string[], type: string | null = "절차 단계") => names.map((name) => ({ name, type }));
const orderOf = (names: string[], type: string | null = "절차 단계") => sortNumberedSeriesV164(named(names, type)).map((record) => record.name);

describe("sortNumberedSeriesV164", () => {
  it("lists the steps of one procedure in number order, not in text order", () => {
    const steps = [10, 11, 12, 2, 3, 1].map((number) => `건축허가 절차 ${number} — step`);
    expect(orderOf(steps)).toEqual([1, 2, 3, 10, 11, 12].map((number) => `건축허가 절차 ${number} — step`));
  });

  it("gathers each procedure's steps at the place the procedure first appears", () => {
    expect(orderOf(["전기 연결 절차 2 — b", "부동산 등기 절차 3 — x", "전기 연결 절차 1 — a", "부동산 등기 절차 1 — x", "전기 연결 절차 3 — c", "부동산 등기 절차 2 — x"])).toEqual([
      "전기 연결 절차 1 — a",
      "전기 연결 절차 2 — b",
      "전기 연결 절차 3 — c",
      "부동산 등기 절차 1 — x",
      "부동산 등기 절차 2 — x",
      "부동산 등기 절차 3 — x",
    ]);
  });

  it("lists fee brackets from the smallest bound, the open-ended one last", () => {
    const brackets = ["5,000,000 ~ 10,000,000", "500,000,000 초과", "100,000 ~ 500,000", "10,000,000 ~ 200,000,000", "500,000 ~ 1,000,000", "1,000,000 ~ 5,000,000", "200,000,000 ~ 500,000,000"];
    expect(orderOf(brackets.map((bracket) => `환경허가 수수료 — 투자규모 ${bracket} Tk`), "수수료 구간")).toEqual(
      ["100,000 ~ 500,000", "500,000 ~ 1,000,000", "1,000,000 ~ 5,000,000", "5,000,000 ~ 10,000,000", "10,000,000 ~ 200,000,000", "200,000,000 ~ 500,000,000", "500,000,000 초과"].map((bracket) => `환경허가 수수료 — 투자규모 ${bracket} Tk`)
    );
  });

  it("reads 2.10 as the tenth item of section 2, after 2.9", () => {
    expect(orderOf(["M&E 지표 I-2.9, b", "M&E 지표 I-2.1, a", "M&E 지표 I-2.10, c"])).toEqual(["M&E 지표 I-2.1, a", "M&E 지표 I-2.9, b", "M&E 지표 I-2.10, c"]);
  });

  it("keeps a series the sheet already lists in order, either way", () => {
    const up = ["건축 절차 1 — a", "건축 절차 2 — b", "건축 절차 10 — c"];
    expect(orderOf(up)).toEqual(up);
    const down = [...up].reverse();
    expect(orderOf(down)).toEqual(down);
  });

  it("does not mix two outlines that each start again at 1", () => {
    const outlines = ["현장 확인 — 1. Legal", "현장 확인 — 2. Technical", "현장 확인 — 3. Monitoring", "현장 확인 — 1. Pilot ETS", "현장 확인 — 2. Article 6.4"];
    expect(orderOf(outlines)).toEqual(outlines);
  });

  it("does not order documents by their number or years by this rule", () => {
    const decrees = ["Decree 57/2025/NĐ-CP, a", "Decree 06/2022/NĐ-CP, b", "Decree 119/2025/NĐ-CP, c", "Decree 80/2024/NĐ-CP, d"];
    expect(orderOf(decrees)).toEqual(decrees);
    const years = ["투자 실적 2022", "투자 실적 2020", "투자 실적 2021"];
    expect(orderOf(years)).toEqual(years);
  });

  it("leaves records of different types apart and fewer than three entries alone", () => {
    expect(orderOf(["건축 절차 2 — b", "건축 절차 1 — a"])).toEqual(["건축 절차 2 — b", "건축 절차 1 — a"]);
    const mixed = [
      { name: "건축 절차 3 — c", type: "A" },
      { name: "건축 절차 1 — a", type: "B" },
      { name: "건축 절차 2 — b", type: "A" },
    ];
    expect(sortNumberedSeriesV164(mixed).map((record) => record.name)).toEqual(["건축 절차 3 — c", "건축 절차 1 — a", "건축 절차 2 — b"]);
  });
});

function record(name: string, rows: Array<[string, string, string]>): WideRecordV162 {
  const blocks = new Map<string, { block: string; title: string; values: Array<{ attribute: string; value: string }> }>();
  for (const [block, attribute, value] of rows) {
    const current = blocks.get(block) || { block, title: block, values: [] };
    current.values.push({ attribute, value });
    blocks.set(block, current);
  }
  return { entity: {} as unknown as VietnamEntityV124, name, type: null, blocks: [...blocks.values()], source: { document: null, url: null, pageUrl: null, citation: null }, get: () => null };
}

const NOTE = "근거: 재생에너지 소득세 면제는 전국 동일 적용. 일반 산업 tax holiday의 지역 구분은 만료. 낙후지역 목록을 확정하는 별도 제도 없음";

describe("sharedWideValuesV164", () => {
  it("finds a long value that nearly every record states in the same words", () => {
    const records = ["가", "나", "다", "라", "마"].map((name) => record(name, [["지역", "지역 요건 판정", NOTE], ["지역", "권역", "전국"]]));
    const shared = sharedWideValuesV164(records);
    expect(shared).toHaveLength(1);
    expect(shared[0]).toMatchObject({ block: "지역", attribute: "지역 요건 판정", value: NOTE, count: 5, total: 5 });
  });

  it("counts against the records that have the column, not against the whole list", () => {
    const withNote = ["가", "나", "다", "라"].map((name) => record(name, [["지역", "지역 요건 판정", NOTE]]));
    const without = ["마", "바", "사"].map((name) => record(name, [["지역", "권역", "전국"]]));
    const [note] = sharedWideValuesV164([...withNote, ...without]);
    expect(note).toMatchObject({ count: 4, total: 7 });
  });

  it("leaves a value that fewer than four records state, or that is a minority of its column", () => {
    const three = ["가", "나", "다"].map((name) => record(name, [["지역", "지역 요건 판정", NOTE]]));
    expect(sharedWideValuesV164(three)).toEqual([]);
    const half = [
      ...["가", "나", "다", "라"].map((name) => record(name, [["근거", "근거", NOTE]])),
      ...["마", "바", "사", "아", "자"].map((name, index) => record(name, [["근거", "근거", `${NOTE} (${index})`]])),
    ];
    expect(sharedWideValuesV164(half)).toEqual([]);
  });

  it("leaves a short value and a link", () => {
    const short = ["가", "나", "다", "라", "마"].map((name) => record(name, [["지역", "권역", "전국"]]));
    expect(sharedWideValuesV164(short)).toEqual([]);
    const links = ["가", "나", "다", "라"].map((name) => ({
      ...record(name, []),
      blocks: [{ block: "링크", title: "링크", values: [{ attribute: "원문 URL", value: "https://example.org/a-very-long-address-that-is-longer-than-sixty-characters.pdf", href: "https://example.org/x.pdf" }] }],
    }));
    expect(sharedWideValuesV164(links)).toEqual([]);
  });
});

describe("isEnglishSentenceV164", () => {
  it("is true for a sentence the source wrote in English", () => {
    expect(isEnglishSentenceV164("Obtain permission for installation of underground cable")).toBe(true);
    expect(isEnglishSentenceV164("Hire electrical contracting firm to purchase substation equipment, get it tested")).toBe(true);
  });

  it("is false for a name, a code, a short phrase and a link", () => {
    expect(isEnglishSentenceV164("Power Grid Bangladesh (PGB)")).toBe(false);
    expect(isEnglishSentenceV164("IDCOL")).toBe(false);
    expect(isEnglishSentenceV164("Orange-A")).toBe(false);
    expect(isEnglishSentenceV164("https://archive.doingbusiness.org/content/dam/doingBusiness/country/b/bangladesh/BGD.pdf")).toBe(false);
  });

  it("is false for a text with any Korean and for a Vietnamese or Bengali sentence", () => {
    expect(isEnglishSentenceV164("Review, amend, and supplement 법령 and regulations on adaptation")).toBe(false);
    expect(isEnglishSentenceV164("Nghị định này quy định chi tiết một số điều của Luật Bảo vệ môi trường")).toBe(false);
    expect(isEnglishSentenceV164("কর অব্যাহতির মেয়াদ এবং কর অব্যাহতির হার সংক্রান্ত বিধান এখানে")).toBe(false);
  });
});
