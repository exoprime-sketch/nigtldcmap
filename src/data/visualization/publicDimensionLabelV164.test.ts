import { describe, expect, it } from "@jest/globals";

import { publicDimensionLabelV126, publicDimensionNameV164, publicDimensionValueV134 } from "./publicCopyRegistryV126";

/** V164-3: the selectors name what they select, in a reader's words. */
describe("publicDimensionLabelV126 (V164)", () => {
  it("names A-013's four selectors apart instead of reading '분류' four times", () => {
    const labels = ["ndc_sector", "climate_response", "implementation_status", "document_type", "information_type"].map((key) => publicDimensionLabelV126(key, key));
    expect(labels).toEqual(["부문", "기후 대응", "이행 상태", "문서 유형", "정보 유형"]);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).not.toContain("분류");
  });

  it("names the other snake_case columns the contract leaves as keys", () => {
    expect(publicDimensionLabelV126("detail_2", "detail_2")).toBe("세부 분류 2");
    expect(publicDimensionLabelV126("source", "source")).toBe("출처");
  });

  it("reads the compiler's working labels as a reader would", () => {
    expect(publicDimensionLabelV126("수집_상태_collection_status", "수집 상태")).toBe("자료 상태");
    expect(publicDimensionLabelV126("행_유형_row_type", "행 유형")).toBe("사무소 구분");
    expect(publicDimensionLabelV126("좌표_구분_coord_type", "좌표 구분")).toBe("위치 표시 기준");
    expect(publicDimensionLabelV126("기후_에너지_담당_판정_focal_point_status", "기후·에너지 담당 판정")).toBe("기후·에너지 담당 여부");
  });

  it("drops a sheet's block tag and its full-width slash and leaves other labels as delivered", () => {
    expect(publicDimensionLabelV126("이니셔티브_운영_상태_NAZCA_status", "[이니셔티브] 운영 상태")).toBe("이니셔티브 운영 상태");
    expect(publicDimensionLabelV126("개체_구분_Basin_Country", "개체 구분(Basin／Country)")).toBe("개체 구분(유역·국가)");
    expect(publicDimensionNameV164("투자 분야")).toBe("투자 분야");
    expect(publicDimensionNameV164("국제협력 실적 구분")).toBe("국제협력 실적 구분");
  });

  it("keeps the labels that were already right", () => {
    expect(publicDimensionLabelV126("기술분야_Sectors", "기술분야_Sectors")).toBe("기술 분야");
    expect(publicDimensionLabelV126("a64Status", "a64Status")).toBe("상태");
    expect(publicDimensionLabelV126("dacSectorCode", "dacSectorCode")).toBe("분야");
  });
});

describe("publicDimensionValueV134 (V164)", () => {
  it("reads a known English classification in Korean and keeps the rest as delivered", () => {
    expect(publicDimensionValueV134("ndc_sector", "Cities and Urban Development")).toBe("도시·도시개발");
    expect(publicDimensionValueV134("information_type", "Needs & Gaps")).toBe("필요·격차");
    expect(publicDimensionValueV134("개체_구분_Basin_Country", "Basin")).toBe("유역");
    expect(publicDimensionValueV134("개체_구분_Basin_Country", "Country(국가 문헌)")).toBe("국가(국가 문헌)");
    expect(publicDimensionValueV134("ndc_sector", "Some New Sector")).toBe("Some New Sector");
  });

  it("does not touch a name, a sentence or a number", () => {
    expect(publicDimensionValueV134("organization", "Green Climate Fund")).toBe("Green Climate Fund");
    expect(publicDimensionValueV134("year", "2026")).toBe("2026");
    expect(publicDimensionValueV134("a64Status", "Waiting for HP approval")).toBe("Waiting for HP approval");
  });

  it("keeps the values it already translated", () => {
    expect(publicDimensionValueV134("document_type", "first_ndc")).toBe("1차 NDC");
    expect(publicDimensionValueV134("x", "")).toBe("분류 미기재");
  });
});
