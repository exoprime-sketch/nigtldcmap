import { expect, test } from "@jest/globals";
import { publicDownloadTextV163 } from "./publicDownloadNoteV163";

test("a client-review segment goes, the data notes around it stay", () => {
  const caveat =
    "[정의] 4개 계열은 모두 GDP 대비 부가가치 비중(%)이며, 제조업은 산업의 부분집합이므로 합산 시 중복됨. [원자료 수록 범위 2026-09-18] 발주처 검토의견(원본 데이터가 포괄하는 전체 국가의 data 가 raw data 에 포함되어야 함)에 따라, 본 요소의 raw 에는 전 국가 수록본을 함께 보관한다.";
  expect(publicDownloadTextV163(caveat)).toBe(
    "[정의] 4개 계열은 모두 GDP 대비 부가가치 비중(%)이며, 제조업은 산업의 부분집합이므로 합산 시 중복됨."
  );
});

test("working-file pointers and review marks are dropped", () => {
  expect(
    publicDownloadTextV163(
      "[라이선스 검증 2026-08-15] 사실 값만 수록 → 재배포 「가능」. ‖ [raw 미보관] 원본 파일은 raw 폴더에 보관되어 있지 않음. ‖ 원문이 범위값으로 제시되어 _min/_max 2개 지표로 분리 수록함."
    )
  ).toBe("원문이 범위값으로 제시되어 _min/_max 2개 지표로 분리 수록함.");
  expect(
    publicDownloadTextV163(
      "명칭의 행정구역 대표점 좌표(EPSG:4326)를 부여. 좌표 근거·후보·신뢰도는 raw 폴더의 «_지오코딩_대장_방글라데시.csv» 참조. 행정구역명은 동명 중심도시를 뜻한다."
    )
  ).toBe("명칭의 행정구역 대표점 좌표(EPSG:4326)를 부여. 행정구역명은 동명 중심도시를 뜻한다.");
  expect(publicDownloadTextV163("[★지적 반영 2026-09-18] 본 값은 PPI 거래 표본의 단순 하한이다.")).toBeNull();
});

test("a kept tag loses its date; the licence change notice stays", () => {
  expect(publicDownloadTextV163("[좌표 부여 2026-09-26] OSM Dhaka Division 대표점 · 사업지 실좌표 아님")).toBe(
    "[좌표 부여] OSM Dhaka Division 대표점 · 사업지 실좌표 아님"
  );
  expect(publicDownloadTextV163("[변경 고지] 본 값은 원자료를 가공·집계한 2차 산출물입니다.")).toBe(
    "[변경 고지] 본 값은 원자료를 가공·집계한 2차 산출물입니다."
  );
});

test("publisher file names in a citation and ordinary words stay", () => {
  expect(publicDownloadTextV163("global_power_plant_database.csv / country_long=\"Bangladesh\" 57개 행")).toBe(
    "global_power_plant_database.csv / country_long=\"Bangladesh\" 57개 행"
  );
  expect(publicDownloadTextV163("Raw Water Treatment Plant 2단계")).toBe("Raw Water Treatment Plant 2단계");
  expect(publicDownloadTextV163(null)).toBeNull();
});

test("a citation keeps the publisher's file and drops ours", () => {
  expect(
    publicDownloadTextV163("World Bank CCKP timeseries_drought-spei12_historical_BGD.json; B-005_가뭄： 연속 건조일수(CDD) 시트")
  ).toBeNull();
  expect(publicDownloadTextV163("FAOSTAT Environment_LandCover_E_All_Data_(Normalized).zip; B-037_토지피복 분류별 면적")).toBe(
    "FAOSTAT Environment_LandCover_E_All_Data_(Normalized).zip"
  );
});

test("another country's file loses the Vietnamese reform wording", () => {
  expect(publicDownloadTextV163("전국 기온 차 -0.04℃, ADM1(개편 전) 기온 차 절대값 평균 0.03℃.", "BGD")).toBe(
    "전국 기온 차 -0.04℃, ADM1 기온 차 절대값 평균 0.03℃."
  );
  expect(publicDownloadTextV163("[지역 구분] 광역 행정구역을 개편 전과 현행 두 벌로 기재함.", "BGD")).toBeNull();
  expect(publicDownloadTextV163("ADM1(개편 전) 기준.", "VNM")).toBe("ADM1(개편 전) 기준.");
});
