import { expect, test } from "@jest/globals";
import { publicMapFactValueV163 } from "./mapFactValueLabelsV163";

test("source classification values read as words", () => {
  expect(publicMapFactValueV163("disasterSubtype", "Riverine flood")).toBe("하천 범람");
  expect(publicMapFactValueV163("featureClass", "river")).toBe("하천");
  expect(publicMapFactValueV163("status", "shelved - inferred 2 y")).toBe("보류(2년간 진행 소식 없음)");
  expect(publicMapFactValueV163("status", "pre-construction")).toBe("착공 전");
  expect(publicMapFactValueV163("locationBasis", "원천 geolocation_source: WRI")).toBe("원천 제공 좌표(WRI)");
  expect(publicMapFactValueV163("locationBasis", "원천 제공 좌표(geolocation_source 미기재)")).toBe("원천 제공 좌표(근거 미기재)");
});

test("a mine's record id is dropped and its type named", () => {
  expect(publicMapFactValueV163("remarks", "Processing Plant · 개발단계 가동 설비(플랜트) · 최초생산 1974년 · MRDS dep_id 10159086")).toBe(
    "가공 설비 · 개발단계 가동 설비(플랜트) · 최초생산 1974년"
  );
  expect(publicMapFactValueV163("remarks", "운영형태 Surface · 개발단계 부존 확인(occurrence) · MRDS dep_id 10207027")).toBe(
    "운영형태 노천 · 개발단계 부존 확인"
  );
});

test("owner nationality and multi-word mine type", () => {
  expect(publicMapFactValueV163("nationality", "China(20%)")).toBe("중국(20%)");
  expect(publicMapFactValueV163("nationality", "United States; Bangladesh")).toBe("미국; 방글라데시");
  expect(publicMapFactValueV163("nationality", "미상(GEM 미제공)")).toBe("미상(GEM 미제공)");
  expect(publicMapFactValueV163("remarks", "운영형태 Processing Plant · 개발단계 가동 설비(플랜트)")).toBe("운영형태 가공 설비 · 개발단계 가동 설비(플랜트)");
});

test("carbon-credit project types", () => {
  expect(publicMapFactValueV163("technology", "Cookstoves")).toBe("고효율 조리기구(쿡스토브)");
  expect(publicMapFactValueV163("technology", "Solar - Centralized")).toBe("태양광(집중형)");
});

test("coding memo and source ids leave mine notes", () => {
  expect(publicMapFactValueV163("climateTechBasis", "38대 기후기술 대응 불명확 — tech_id 공란(별첨2 R4: 억지 매핑 금지)")).toBe("");
  expect(publicMapFactValueV163("siteNote", "개발단계 생산 중(producer) · GADM gid VNM.38_1 · MRDS dep_id 10106727")).toBe("개발단계 생산 중");
});

test("unknown values and other fields stay as written", () => {
  expect(publicMapFactValueV163("status", "In service")).toBe("In service");
  expect(publicMapFactValueV163("name", "Riverine flood")).toBe("Riverine flood");
});

test("V164: places read 한글 (현지명) and a country code reads as a country", () => {
  expect(publicMapFactValueV163("adm1Name34", "Quảng Trị")).toBe("꽝찌 (Quảng Trị)");
  expect(publicMapFactValueV163("regionName", "Quang Tri")).toBe("꽝찌 (Quang Tri)");
  expect(publicMapFactValueV163("city", "Ho Chi Minh City; Hanoi")).toBe("호찌민 (Ho Chi Minh City) · 하노이 (Hanoi)");
  expect(publicMapFactValueV163("division", "Dhaka")).toBe("다카 (Dhaka)");
  expect(publicMapFactValueV163("hqCountry", "VNM")).toBe("베트남");
  expect(publicMapFactValueV163("hqCountry", "USA")).toBe("미국");
  // Not in the dictionary: as written, never guessed.
  expect(publicMapFactValueV163("city", "Nowhereville")).toBe("Nowhereville");
  expect(publicMapFactValueV163("hqCountry", "XYZ")).toBe("XYZ");
});
