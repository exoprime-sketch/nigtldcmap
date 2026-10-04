import { describe, expect, it } from "@jest/globals";

import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import {
  plainMarkupV164,
  publicWideValueV162,
  readWideRecordsV162,
  repairCutTitleV164,
  sortYearSeriesV164,
  titleWithProjectV164,
  withoutApiKeysV164,
} from "./wideRecordsV162";

type FieldDef = { sourceField: string; label: string; normalizedKey: string };

/** V164-3: what the wide record reader does to a cell, a title and the record order. */
function fields(...labels: string[]): FieldDef[] {
  return [
    { sourceField: "a1", label: "[식별] 레코드명", normalizedKey: "식별_레코드명" },
    { sourceField: "a2", label: "[식별] 레코드 유형", normalizedKey: "식별_레코드_유형" },
    ...labels.map((label, index) => ({ sourceField: `b${index}`, label, normalizedKey: label.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/gu, "") })),
  ];
}

function entityOf(normalizedAttributes: Record<string, unknown>): VietnamEntityV124 {
  return { elementId: "C-099", entityType: "entity", countryIso3: "VNM", name: null, normalizedAttributes, rawAttributes: {}, note: null } as unknown as VietnamEntityV124;
}

describe("plainMarkupV164", () => {
  it("writes a LaTeX span as its symbols and keeps the words and numbers around it", () => {
    expect(plainMarkupV164("consolidated revenues $\\ge 750\\text{ million EUR}$.")).toBe("consolidated revenues ≥ 750 million EUR.");
    expect(plainMarkupV164("rate $\\le 15\\%$ of GDP")).toBe("rate ≤ 15% of GDP");
  });

  it("turns the sheet's line-break mark into a line break", () => {
    expect(plainMarkupV164("• Resolution 107/2023/QH15 ⏎ • Ministry of Finance")).toBe("• Resolution 107/2023/QH15\n• Ministry of Finance");
  });

  it("leaves a dollar amount and plain text alone", () => {
    for (const text of ['Financing needs $368 billion', "Chapter 5 p.61 ($114 billion)", "전국"]) expect(plainMarkupV164(text)).toBe(text);
  });
});

describe("withoutApiKeysV164", () => {
  it("names an API field as the sheet's own column does, and drops the record pointer", () => {
    expect(withoutApiKeysV164("플랫폼 ParticipatingParties에 베트남 없음")).toBe("플랫폼 참여 당사국 목록에 베트남 없음");
    expect(withoutApiKeysV164("UNFCCC Article 6.8 NMA Platform, nma-list API (2026-09-11 조회)")).toBe("UNFCCC Article 6.8 NMA Platform (2026-09-11 조회)");
    expect(withoutApiKeysV164("nma-list API 레코드 Id=ad2f0eae · 플랫폼 상세 페이지")).toBe("플랫폼 상세 페이지");
  });

  it("does not touch a cell with no API name", () => {
    expect(withoutApiKeysV164("BTR1 §4 Climate Finance Needs(p.xvii-xviii)")).toBe("BTR1 §4 Climate Finance Needs(p.xvii-xviii)");
  });
});

describe("publicWideValueV162 (V164-3)", () => {
  it("applies the memo cut, the LaTeX and the line break to one cell", () => {
    expect(publicWideValueV162("• Imposes a 15% tax on groups with revenues $\\ge 750\\text{ million EUR}$. ⏎ • QDMTT effective Jan 1, 2024.")).toBe(
      "• Imposes a 15% tax on groups with revenues ≥ 750 million EUR.\n• QDMTT effective Jan 1, 2024."
    );
    expect(publicWideValueV162("구서식 열 「[참여] 협의 기간」에서 이관", "근거")).toBe("");
  });
});

describe("readWideRecordsV162 (V164-3)", () => {
  it("drops a citation that is a pointer into an API payload and keeps a citation that names a place in a document", () => {
    const definitions = fields("[출처] 원문 문서명", "[출처] 인용 위치");
    const [pointer, place] = readWideRecordsV162(
      [
        entityOf({ 식별_레코드명: "행위자 A", 출처_원문_문서명: "NAZCA 국가 행위자", 출처_인용_위치: "actors[] publicId=GCAP26615" }),
        entityOf({ 식별_레코드명: "행위자 B", 출처_원문_문서명: "BTR1", 출처_인용_위치: "BTR1 §4 (p.xvii)" }),
      ],
      definitions as never
    );
    expect(pointer.source.citation).toBeNull();
    expect(place.source.citation).toBe("BTR1 §4 (p.xvii)");
  });

  it("does not link an API endpoint when the record has its own page", () => {
    const definitions = fields("[출처] 원문 URL", "[출처] 문서페이지 URL");
    const [record] = readWideRecordsV162(
      [entityOf({ 식별_레코드명: "NMA", 출처_원문_URL: "https://art6nma-prd-apim01.azure-api.net/api/nma-list", 출처_문서페이지_URL: "https://unfccc.int/nma-platform/abc" })],
      definitions as never
    );
    expect(record.source.url).toBeNull();
    expect(record.source.pageUrl).toBe("https://unfccc.int/nma-platform/abc");
  });

  it("a card that defines a grade does not state a current grade", () => {
    const definitions = fields("[경보] 현재 등급 (단계)");
    const [definition, current] = readWideRecordsV162(
      [
        entityOf({ 식별_레코드명: "외교부 여행경보 등급 — 여행금지", 식별_레코드_유형: "경보 등급체계", 경보_현재_등급_단계: "4단계" }),
        entityOf({ 식별_레코드명: "여행경보 — 전국", 식별_레코드_유형: "여행경보", 경보_현재_등급_단계: "2단계" }),
      ],
      definitions as never
    );
    expect(definition.blocks[0].values[0].attribute).toBe("등급 (단계)");
    expect(current.blocks[0].values[0].attribute).toBe("현재 등급 (단계)");
  });

  it("names a CDM activity by its project instead of the sheet's short code", () => {
    const definitions = fields("[사업] 사업명 (원문)");
    const [record] = readWideRecordsV162(
      [entityOf({ 식별_레코드명: "CDM→제6.4조 전환 활동 — COOK", 사업_사업명_원문: "Improved cookstove program in Bangladesh" })],
      definitions as never
    );
    expect(record.name).toBe("CDM→제6.4조 전환 활동 — Improved cookstove program in Bangladesh");
  });
});

describe("titleWithProjectV164", () => {
  it("keeps a title whose ending is a sector acronym, or a record with no project name", () => {
    expect(titleWithProjectV164("NDC 3.0 감축수단 — AFOLU", [{ block: "수단", title: "수단", values: [{ attribute: "부문", value: "AFOLU" }] }])).toBe(
      "NDC 3.0 감축수단 — AFOLU"
    );
    expect(titleWithProjectV164("CDM 전환 활동 — COOK", [])).toBe("CDM 전환 활동 — COOK");
  });
});

describe("repairCutTitleV164", () => {
  const block = (value: string) => [{ block: "제도", title: "제도", values: [{ attribute: "제도명 + 적용 대상", value }] }];

  it("ends a name the sheet cut mid-word at its first whole sentence", () => {
    const full =
      "정책 대상 기술군 — 풍력 - 육상·해상 풍력 모두 대상. 저풍속 자원에서도 발전 가능한 신형 풍력터빈을 포함해 상업적으로 이용 가능한 모든 풍력 기술의 도입·보급·개발에 중점";
    const cut = full.slice(0, full.indexOf("포함") + 1);
    expect(repairCutTitleV164(cut, block(full))).toBe("정책 대상 기술군 — 풍력 - 육상·해상 풍력 모두 대상");
  });

  it("completes a short cut name from the record's own value, after the project number", () => {
    const full = "Installation of High Efficiency Kiln in Sanitary Ware Manufacturing Factory";
    const cut = `JCM VN016, ${full.slice(0, 70)}`;
    expect(repairCutTitleV164(cut, block(full))).toBe(`JCM VN016, ${full}`);
  });

  it("ends a cut list at its last whole item", () => {
    const items = "이행 기관 — 금융 기관 - 방글라데시 중앙은행 · IDCOL · 은행·비은행 금융기관 · BSEC · 개발";
    const full = `${items}협력기관 · 정부 부처 · 그 밖의 관련 기관 · 이행 지원단 · 평가 기관 · 보고 기관 · 감독 기관 · 연락 기관 · 자문 기관 · 연구 기관`;
    expect(repairCutTitleV164(items, block(full))).toBe("이행 기관 — 금융 기관 - 방글라데시 중앙은행 · IDCOL · 은행·비은행 금융기관 · BSEC");
  });

  it("leaves a short name, a whole name and a name no value continues", () => {
    expect(repairCutTitleV164("원자력", block("원자력·수력·CCS가 중요한 역할"))).toBe("원자력");
    const whole = "정책 대상 설비 — 계통연계 MW급 태양광 발전소(규모 기준은 별도 고시에 따른다)";
    expect(repairCutTitleV164(whole, block("전혀 다른 값"))).toBe(whole);
    expect(repairCutTitleV164(whole, block(whole))).toBe(whole);
  });
});

describe("sortYearSeriesV164", () => {
  const rec = (name: string, type = "집계") => ({ name, type });
  const names = (records: Array<{ name: string }>) => records.map((record) => record.name);

  it("lists a mixed yearly series together, newest year first, a year's total before its breakdown", () => {
    const sorted = sortYearSeriesV164([
      rec("PPP 제도 요약", "국가"),
      rec("투자 실적 2019"),
      rec("투자 실적 2018"),
      rec("투자 실적 2020: Energy"),
      rec("투자 실적 2020"),
      rec("PPI 국가 집계"),
    ]);
    expect(names(sorted)).toEqual(["PPP 제도 요약", "투자 실적 2020", "투자 실적 2020: Energy", "투자 실적 2019", "투자 실적 2018", "PPI 국가 집계"]);
  });

  it("groups a series that leads with the year by what it counts, at the place it first appears", () => {
    const sorted = sortYearSeriesV164([
      rec("2023 합계", "설비 실적"),
      rec("2025 태양광", "설비 실적"),
      rec("2025 합계", "설비 실적"),
      rec("2023 태양광", "설비 실적"),
      rec("2024 합계", "설비 실적"),
      rec("2024 태양광", "설비 실적"),
    ]);
    expect(names(sorted)).toEqual(["2025 합계", "2024 합계", "2023 합계", "2025 태양광", "2024 태양광", "2023 태양광"]);
  });

  it("keeps a series the sheet already lists in year order, and records that are not a series", () => {
    const ascending = [rec("고의살인율 2000"), rec("고의살인율 2001"), rec("고의살인율 2002")];
    expect(sortYearSeriesV164(ascending)).toBe(ascending);
    const two = [rec("재생에너지 목표 2041"), rec("재생에너지 목표 2030"), rec("재생에너지 목표 2030 하한")];
    expect(sortYearSeriesV164(two)).toBe(two);
  });

  it("never drops or adds a record", () => {
    const input = [rec("A 2019"), rec("B"), rec("A 2021"), rec("A 2020"), rec("C 2020"), rec("A 2022")];
    expect([...names(sortYearSeriesV164(input))].sort()).toEqual([...names(input)].sort());
  });
});
