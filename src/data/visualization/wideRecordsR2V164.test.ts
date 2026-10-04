import { describe, expect, it } from "@jest/globals";

import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import {
  isBareNumberTitleValueV164,
  publicAttributeLabelV164,
  publicWideValueV162,
  readWideRecordsV162,
  withoutPipeKeysV164,
} from "./wideRecordsV162";

type FieldDef = { sourceField: string; label: string; normalizedKey: string };

/** V164 R2: what the wide record reader does to a cell, a label and a title. */
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

describe("placeholder cells (R2)", () => {
  it("a dash or N/A is the sheet's way of writing no value and is not a value", () => {
    for (const text of ["—", "–", "-", "N/A", "n/a", "NA"]) expect(publicWideValueV162(text, "참여 지위")).toBe("");
  });

  it("a statement that something does not apply stays", () => {
    expect(publicWideValueV162("해당 없음", "통화")).toBe("해당 없음");
  });

  it("a record whose only value is a placeholder shows no row for it", () => {
    const [record] = readWideRecordsV162(
      [entityOf({ 식별_레코드명: "참여 기관", 참여_참여_지위: "—", 참여_참여_형태: "회원" })],
      fields("[참여] 참여 지위", "[참여] 참여 형태") as never
    );
    expect(record.blocks[0].values.map((value) => value.attribute)).toEqual(["참여 형태"]);
  });
});

describe("policy instrument keys (R2, C-009/C-010)", () => {
  it("the source's name|group key reads as name / group, the group in Korean", () => {
    expect(withoutPipeKeysV164("기준·의무·규범 (Standards, obligations and norms|Regulation)")).toBe(
      "기준·의무·규범 (Standards, obligations and norms / 규제)"
    );
    expect(
      publicWideValueV162("기관 권한 부여 (Institutional mandates|Governance) · 기준·의무·규범 (Standards, obligations and norms|Regulation)", "정책수단")
    ).toBe("기관 권한 부여 (Institutional mandates / 거버넌스) · 기준·의무·규범 (Standards, obligations and norms / 규제)");
  });

  it("a group the dictionary does not know stays as delivered, without the bar", () => {
    expect(withoutPipeKeysV164("조항 (Clause|Misc)")).toBe("조항 (Clause / Misc)");
  });

  it("text without a bar is returned as it is", () => {
    expect(withoutPipeKeysV164("기준·의무·규범")).toBe("기준·의무·규범");
  });
});

describe("column names in a value (R2, C-005)", () => {
  it("the TAP table's column name reads as the Korean words with the term after", () => {
    expect(publicWideValueV162("Weighted score 열", "평가 점수 산정 기준")).toBe("가중 점수 (Weighted score)");
    expect(publicWideValueV162("Weighted score (With PV) 열", "평가 점수 산정 기준")).toBe("가중 점수 (Weighted score, 태양광 포함)");
  });

  it("another column's value is never rewritten", () => {
    expect(publicWideValueV162("Weighted score 열", "비고")).toBe("Weighted score 열");
    expect(publicWideValueV162("MCDA 평균 점수", "평가 점수 산정 기준")).toBe("MCDA 평균 점수");
  });
});

describe("English classification values (R2)", () => {
  it("a classification column reads a known English value in Korean", () => {
    expect(publicWideValueV162("Support actions", "장벽 분류")).toBe("지원 조치");
    expect(publicWideValueV162("Technical barrier", "장벽 분류")).toBe("기술적 장벽");
    expect(publicWideValueV162("Social and economic barriers", "장벽 분류")).toBe("사회경제적 장벽");
  });

  it("a column of the source's own wording keeps it after the Korean name", () => {
    expect(publicWideValueV162("Energy", "부문 (원문)")).toBe("에너지 (Energy)");
    expect(publicWideValueV162("All sectors", "부문 (원문)")).toBe("전 부문 (All sectors)");
  });

  it("a name column and an unknown value are left as delivered", () => {
    expect(publicWideValueV162("Energy", "사업명 (원문)")).toBe("Energy");
    expect(publicWideValueV162("Something unlisted", "장벽 분류")).toBe("Something unlisted");
    expect(publicWideValueV162("에너지", "부문 (원문)")).toBe("에너지");
  });
});

describe("working memos about documents and URLs (R2, C-009/C-015/C-017)", () => {
  it("drops the sentence that explains why a URL is not given", () => {
    expect(
      publicWideValueV162("2022-01-18 결정. 2024년 Decision 13/2024/QĐ-TTg로 대체·폐지. 개별 문서 URL은 원문 미제시, 오인 방지를 위해 포털 상위 URL만 표기.", "주요 내용 상세")
    ).toBe("2022-01-18 결정. 2024년 Decision 13/2024/QĐ-TTg로 대체·폐지.");
    expect(publicWideValueV162("2025-02-01 전력법 61/2024/QH15 시행으로 폐지. 개별 원문 URL 원문 미제시, 신법 URL 병기.", "주요 내용 상세")).toBe(
      "2025-02-01 전력법 61/2024/QH15 시행으로 폐지."
    );
  });

  it("drops the parenthesis that says the page is the portal's", () => {
    expect(publicWideValueV162("포털 일반 주소(문서별 URL 미제시)", "링크 유형")).toBe("포털 일반 주소");
  });

  it("keeps the statement and cuts only the note that the original was not obtained", () => {
    expect(publicWideValueV162("RE Policy 2025 제11.6조가 현행 시행지침으로 명시 · 2025년 개정판 존재, 원본 미확보", "대체·개정 관계")).toBe(
      "RE Policy 2025 제11.6조가 현행 시행지침으로 명시 · 2025년 개정판 존재"
    );
  });

  it("cuts the data-entry convention note and keeps the conditions", () => {
    expect(
      publicWideValueV162("FIT 적격 기한을 넘긴 전환기 사업 전용, EVN(EPTC)과 협상한 PPA 가격 <= 상한, 부가세 제외, 상한(최고가)이므로 하한=상한 기재", "적용 조건")
    ).toBe("FIT 적격 기한을 넘긴 전환기 사업 전용, EVN(EPTC)과 협상한 PPA 가격 <= 상한, 부가세 제외");
  });
});

describe("column labels (R2, C-017)", () => {
  it("the sheet's spec hints are not part of the name and a plus reads as a list", () => {
    expect(publicAttributeLabelV164("근거 법령 (번호 + 국문 명칭)")).toBe("근거 법령");
    expect(publicAttributeLabelV164("적용 조건 (용량·기한 등 사업 요건)")).toBe("적용 조건");
    expect(publicAttributeLabelV164("제도명 + 적용 대상")).toBe("제도명 · 적용 대상");
    expect(publicAttributeLabelV164("금액 (십억 USD)")).toBe("금액 (십억 USD)");
  });

  it("a composite name column that repeats the record's own name is not a second row", () => {
    const [record] = readWideRecordsV162(
      [entityOf({ 식별_레코드명: "수입관세 면제", 제도_제도명_적용_대상: "수입관세 면제", 제도_근거_법령_번호_국문_명칭: "수출입관세법 제16조" })],
      fields("[제도] 제도명 + 적용 대상", "[제도] 근거 법령 (번호 + 국문 명칭)") as never
    );
    expect(record.blocks[0].values).toEqual([{ attribute: "근거 법령", value: "수출입관세법 제16조", href: undefined }]);
  });
});

describe("a bare number in a title (R2)", () => {
  it("is a number without a unit, unless it is a year", () => {
    expect(isBareNumberTitleValueV164("20037")).toBe(true);
    expect(isBareNumberTitleValueV164("35,000")).toBe(true);
    expect(isBareNumberTitleValueV164("6.8")).toBe(true);
    expect(isBareNumberTitleValueV164("2023")).toBe(false);
    expect(isBareNumberTitleValueV164("2023-2050")).toBe(false);
    expect(isBareNumberTitleValueV164("십억 BDT")).toBe(false);
  });

  it("two records with one name are told apart by a stated word, never by a bare figure", () => {
    const records = readWideRecordsV162(
      [
        entityOf({ 식별_레코드명: "적응 재원 총 소요", 계획_기간: "2023-2050", 계획_값: "20037" }),
        entityOf({ 식별_레코드명: "적응 재원 총 소요", 계획_기간: "2023-2030", 계획_값: "230" }),
      ],
      fields("[계획] 기간", "[계획] 값") as never
    );
    expect(records.map((record) => record.name)).toEqual(["적응 재원 총 소요 · 2023-2050", "적응 재원 총 소요 · 2023-2030"]);
  });
});
