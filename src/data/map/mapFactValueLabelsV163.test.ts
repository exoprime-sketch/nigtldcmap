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

test("unknown values and other fields stay as written", () => {
  expect(publicMapFactValueV163("status", "In service")).toBe("In service");
  expect(publicMapFactValueV163("name", "Riverine flood")).toBe("Riverine flood");
});
