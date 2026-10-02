#!/usr/bin/env node
/**
 * P8-2 (지도 12): register the twelve targets V157 left as "not connected" in the
 * map target contract (src/data/visualization/publicMapTargetsV138.json), now that
 * the 2026-09-30 delivery (V162) gives each a basis:
 *
 *   B-002 · B-024 · B-035 · B-036   per-province rows in the delivery (admin1-attributes)
 *   A-022 · C-017 · A-013 · C-003   a value stated for a group of provinces (group-constant)
 *   C-006                           JCM registry projects per province (group-constant, count)
 *   B-044 · B-046 · B-047           national mineral figures on B-048's mines (entity-join)
 *
 * Only these twelve rows are rewritten; the other sixty keep their text verbatim.
 * The public wording each layer shows is set here (PUBLIC_WORDING) and recorded in
 * reports/v157-2/REVIEW_V157-2.md §8.
 *
 *   node scripts/v157-2/register-map12-v157-2.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const TARGETS_PATH = resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json");
const CHECK = process.argv.includes("--check");
const GENERATED_BY = "scripts/v157-2/register-map12-v157-2.mjs";

const PROVINCE_UNIT = "성·시 경계(개편 후 34개 기본 · 개편 전 63개 전환)";

/** The public sentences of the twelve layers (공개 문구 표). */
export const PUBLIC_WORDING_V157_2 = {
  "A-022": {
    accuracyNotice:
      "이 값은 전력총공사 관할 전체에 적용되는 값이며, 성·시별로 다르지 않습니다. 관할 값이 공개되지 않은 곳(북부전력총공사 등)은 비워 두며 0으로 채우지 않습니다.",
    publicSpatialNotice:
      "전력총공사 관할 전체 값을 소속 성·시 경계에 같은 색으로 표시합니다. 34개 경계가 두 관할에 걸치면 '복수 소속'으로 표시하고 값을 나누지 않습니다.",
  },
  "C-017": {
    accuracyNotice:
      "이 값은 권역(북부·중부·남부) 전체에 적용되는 발전가격 상한입니다. 가격 규정 원문은 권역에 속한 성을 나열하지 않아, 성·시의 권역은 EVN 관할 기준으로 정했습니다. 닌투언성은 원문이 따로 정한 특례 가격이 있어 그 성에만 표시하고, 해역 단위 가격(해상 풍력)은 성·시에 대응하지 않아 상세 화면에서 제공합니다.",
    publicSpatialNotice: "권역 전체 가격을 소속 성·시 경계에 같은 색으로 표시합니다(성·시별 가격 아님).",
  },
  "A-013": {
    accuracyNotice:
      "NDC 조치 원문이 6대 사회경제 권역의 이름을 직접 적은 연계만 그 권역에 표시합니다. 값은 권역 전체에 해당하며 성·시별로 다르지 않습니다. 해안·산지 같은 일반 지역어는 권역에 연결하지 않습니다.",
    publicSpatialNotice: "6대 권역(결의 81/2023/QH15)의 구성 성·시 경계에 권역 값을 같은 색으로 표시합니다.",
  },
  "C-003": {
    accuracyNotice:
      "국가적응계획 원문이 6대 사회경제 권역의 이름을 직접 적은 과제·취약성 항목만 그 권역에 표시합니다. 값은 권역 전체에 해당하며 성·시별로 다르지 않습니다. 나머지 항목은 전국 단위로 상세 화면에서 제공합니다.",
    publicSpatialNotice: "6대 권역(결의 81/2023/QH15)의 구성 성·시 경계에 권역 값을 같은 색으로 표시합니다.",
  },
  "C-006": {
    accuracyNotice:
      "성·시별 JCM(공동크레딧제도) 등록 사업 건수입니다. 여러 성에 걸친 사업은 각 성에 1건으로 세며 감축량·금액은 합산하지 않습니다. 등록부가 본사 소재지만 밝힌 사업은 지도에서 제외합니다.",
    publicSpatialNotice: "34개 경계에서는 같은 단위에 속한 성·시의 사업을 중복 없이 셉니다.",
  },
};

const groupConstant = (elementId, build) => ({
  ...build,
  kind: "group-constant",
  publicWording: PUBLIC_WORDING_V157_2[elementId],
});

const TARGETS_V157_2 = {
  "A-022": {
    sourceFields: ["indicatorId", "year", "value", "unit"],
    sourceSpatialUnit: "전력총공사 관할(EVN 5개 총공사)",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: groupConstant("A-022", {
      groupTable: "evn",
      measures: [
        { key: "saidi", label: "평균 정전시간(SAIDI)", unit: "분/고객", measureId: "a022-saidi" },
        { key: "saifi", label: "평균 정전횟수(SAIFI)", unit: "회/고객", measureId: "a022-saifi" },
        { key: "maifi", label: "순간 정전횟수(MAIFI)", unit: "회/고객", measureId: "a022-maifi" },
      ],
      defaultMeasure: "saidi",
      boundaryPolicy34: { kind: "group-constant" },
    }),
    selectableVariables: "전력총공사 관할별 SAIDI·SAIFI·MAIFI",
    unit: "분/고객·회/고객",
    period: "2025~2026년 공시",
    representativeItem: "전력총공사 관할별 평균 정전시간(SAIDI)",
    evidence: "관할별 관측값 4곳(EVNCPC·EVNSPC·EVNHANOI·EVNHCMC) · 관할표 63/63(총공사 공식 소속 단위 페이지)",
    limitation: "EVN 그룹 전체 연도별 추이는 상세 화면에서 제공. 북부전력총공사(EVNNPC)는 원문 값 미공개.",
  },
  "C-017": {
    sourceFields: ["지역_권역", "요율_가격_상한", "요율_가격_단위", "기간_시행일_YYYY_MM_DD", "식별_레코드명"],
    sourceSpatialUnit: "가격 권역(북부·중부·남부) · 닌투언성 특례",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: groupConstant("C-017", {
      groupTable: "c017",
      measures: [],
      defaultMeasure: "cap-2025-sol-g-ns",
      boundaryPolicy34: { kind: "group-constant" },
    }),
    selectableVariables: "2025년 발전원별 가격 상한(태양광 지상형·부유식, 저장장치 유무, 육상 풍력) · 닌투언성 태양광 특례",
    unit: "VND/kWh",
    period: "2020·2025년",
    representativeItem: "권역별 지상형 태양광 발전가격 상한(저장장치 없음)",
    evidence: "권역 명시 레코드 15건(북부·중부·남부 각 5) + 닌투언성 특례 1건 · 권역의 성 구성 63/63(EVN 관할 기준)",
    limitation: "해역 단위 가격 3건(해상 풍력)과 전국 공통 제도 37건은 성·시에 대응하지 않아 상세 화면에서 제공.",
  },
  "A-013": {
    sourceFields: ["NDC 조치 원문", "SDG 세부목표 코드"],
    sourceSpatialUnit: "6대 사회경제 권역(원문이 권역명을 적은 연계)",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: groupConstant("A-013", {
      groupTable: "six",
      periodFixed: "2016년 기준",
      measures: [{ key: "region-linked-actions", label: "권역 명시 NDC 조치 연계", unit: "건", measureId: "a013-region-linked" }],
      memberRecords: true,
      boundaryPolicy34: { kind: "group-constant" },
    }),
    selectableVariables: "권역별 NDC 조치 연계 건수 · 성 클릭 → 조치 원문·SDG 세부목표",
    unit: "건",
    period: "2016년 기준",
    representativeItem: "홍강 삼각주 관개시설 개보수",
    evidence: "연계 365건 중 원문이 권역명을 적은 8건(홍강 삼각주 4 · 메콩강 삼각주 4)",
    limitation: "권역명이 없는 357건은 전국 단위로 상세 화면에서 제공.",
  },
  "C-003": {
    sourceFields: ["식별_레코드명", "과제_세부과제_내용_원문", "과제_주관기관_원문"],
    sourceSpatialUnit: "6대 사회경제 권역(원문이 권역명을 적은 항목)",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: groupConstant("C-003", {
      groupTable: "six",
      periodFixed: "2021~2030년 계획",
      measures: [{ key: "region-named-items", label: "권역 명시 적응 과제·취약성 항목", unit: "건", measureId: "c003-region-named" }],
      memberRecords: true,
      boundaryPolicy34: { kind: "group-constant" },
    }),
    selectableVariables: "권역별 적응 과제·취약성 항목 수 · 성 클릭 → 항목 목록",
    unit: "건",
    period: "2021~2030년",
    representativeItem: "메콩강 삼각주 적응 과제",
    evidence: "NAP 레코드 272건 중 원문이 권역명을 적은 11건(메콩강 삼각주 9 · 중부 고원 4 · 홍강 삼각주 2, 두 권역을 함께 적은 항목 포함)",
    limitation: "권역명이 없는 항목은 전국 단위로 상세 화면에서 제공.",
  },
  "C-006": {
    sourceFields: ["사업_사업번호", "사업_소재지"],
    sourceSpatialUnit: "JCM 등록부 사업별 소재 성·시",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: groupConstant("C-006", {
      groupTable: "jcm",
      periodFixed: "2026",
      measures: [{ key: "jcm-projects", label: "JCM 등록 사업", unit: "건", measureId: "c006-jcm-projects", aggregate: "count" }],
      memberRecords: true,
      boundaryPolicy34: { kind: "membership-or" },
    }),
    selectableVariables: "성·시별 JCM 등록 사업 수 · 성 클릭 → 사업명·등록부 링크",
    unit: "건",
    period: "2026년 9월 등록부 확인",
    representativeItem: "성·시별 JCM 등록 사업 수",
    evidence: "등록 사업 20건 중 소재 성·시가 확인된 18건 · 27개 성·시(JCM 공식 등록부)",
    limitation: "등록부가 본사 소재지만 밝힌 2건(VN008·VN013)은 지도에서 제외하고 상세 화면에서 제공.",
  },
  "B-002": {
    sourceFields: ["우세_기후대", "우세_기후대_점유율", "열대_A군", "건조_B군", "온대_C군", "기간"],
    sourceSpatialUnit: "GADM 4.1 ADM1(63개 성·시) · 개편 후 34개 성·시 원자료 값",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: {
      kind: "admin1-attributes",
      indicatorIds: ["B-002_koppen_adm1"],
      periodKey: "기간",
      categoryKey: "우세_기후대",
      measures: [
        { key: "dominant-zone-share", sourceKey: "우세_기후대_점유율", label: "최다 기후대 점유율", unit: "%", measureId: "b002-dominant-share" },
        { key: "tropical-share", sourceKey: "열대_A군", label: "열대(A군) 면적 비율", unit: "%", measureId: "b002-tropical-share" },
        { key: "temperate-share", sourceKey: "온대_C군", label: "온대(C군) 면적 비율", unit: "%", measureId: "b002-temperate-share" },
        { key: "arid-share", sourceKey: "건조_B군", label: "건조(B군) 면적 비율", unit: "%", measureId: "b002-arid-share" },
      ],
      defaultMeasure: "dominant-zone-share",
      boundaryPolicy34: { kind: "area-weighted-mean" },
    },
    selectableVariables: "성·시별 최다 기후대(분류)·기후대군 면적 비율, 기간(1901–1930 · 1991–2020 · 2071–2099 SSP2-4.5·SSP5-8.5)",
    unit: "%",
    period: "1901~2099년",
    representativeItem: "성·시별 최다 기후대(1991–2020)",
    evidence: "성·시 63개 × 4기간 + 개편 후 34개 × 4기간(Beck et al. 2023, 1 km 격자 집계)",
    limitation: "2071–2099는 시나리오 전망값. 성·시의 최다 기후대는 면적 기준이며 성 전체가 그 기후대라는 뜻은 아님.",
  },
  "B-024": {
    sourceFields: ["값", "단위", "기준연도", "값의_성격"],
    sourceSpatialUnit: "GADM 4.1 ADM1(63개 성·시) · 개편 후 34개 성·시 원자료 값",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: {
      kind: "admin1-attributes",
      indicatorIds: ["B-024_irrigated_area_subnat"],
      periodKey: "기준연도",
      measures: [{ key: "paddy-area", sourceKey: "값", label: "벼 재배면적(농업용수 대리지표)", unit: "ha", measureId: "b024-paddy-area" }],
      defaultMeasure: "paddy-area",
      boundaryPolicy34: { kind: "sum" },
    },
    selectableVariables: "성·시별 벼 재배면적(농업용수 비중의 대리지표)",
    unit: "ha",
    period: "2024년(잠정)",
    representativeItem: "성·시별 벼 재배면적",
    evidence: "베트남 통계청(NSO) 성별 벼 재배면적 63개 + 개편 후 34개 · 배분 추정 97행 제외",
    limitation: "원자료에 농업용수 비중의 성별 값이 없어 벼 재배면적(대리지표)으로 대신 표시. 국가 농업용수 비중 추이는 상세 화면에서 제공.",
  },
  "B-035": {
    sourceFields: ["산림_비율_육지_대비", "농경지_비율_육지_대비", "도시_비율_육지_대비", "산림_면적_km", "농경지_면적_km", "도시_면적_km", "연도"],
    sourceSpatialUnit: "GADM 4.1 ADM1(63개 성·시) · 개편 후 34개 성·시 원자료 값",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: {
      kind: "admin1-attributes",
      indicatorIds: ["B-035_lc_adm1_year"],
      periodKey: "연도",
      periodStep: 5,
      measures: [
        { key: "forest-share", sourceKey: "산림_비율_육지_대비", label: "산림 비율(육지 대비)", unit: "%", measureId: "b035-forest-share" },
        { key: "cropland-share", sourceKey: "농경지_비율_육지_대비", label: "농경지 비율(육지 대비)", unit: "%", measureId: "b035-cropland-share" },
        { key: "urban-share", sourceKey: "도시_비율_육지_대비", label: "도시 비율(육지 대비)", unit: "%", measureId: "b035-urban-share" },
        { key: "forest-area", sourceKey: "산림_면적_km", label: "산림 면적", unit: "km²", measureId: "b035-forest-area" },
        { key: "cropland-area", sourceKey: "농경지_면적_km", label: "농경지 면적", unit: "km²", measureId: "b035-cropland-area" },
        { key: "urban-area", sourceKey: "도시_면적_km", label: "도시 면적", unit: "km²", measureId: "b035-urban-area" },
      ],
      defaultMeasure: "forest-share",
      boundaryPolicy34: {
        kind: "area-weighted-mean",
        byMeasureKey: { "forest-area": "sum", "cropland-area": "sum", "urban-area": "sum" },
      },
    },
    selectableVariables: "성·시별 토지피복(산림·농경지·도시) 비율·면적, 연도(1992~2022, 5년 간격 + 최신)",
    unit: "%·km²",
    period: "1992~2022년",
    representativeItem: "성·시별 산림 비율(2022)",
    evidence: "성·시 63개 × 31개 연도 + 개편 후 34개 × 31개 연도(ESA CCI / C3S Land Cover 300 m 격자 집계)",
    limitation: "지도는 5년 간격 연도만 제공. 국가 토지이용(FAO) 추이는 상세 화면에서 제공.",
  },
  "B-036": {
    sourceFields: ["산림_CAGR_yr", "농경지_CAGR_yr", "도시_CAGR_yr", "습지_CAGR_yr", "초지_관목_CAGR_yr", "기간_시작_종료"],
    sourceSpatialUnit: "GADM 4.1 ADM1(63개 성·시) · 개편 후 34개 성·시 원자료 값",
    displaySpatialUnit: PROVINCE_UNIT,
    representation: "admin1-choropleth",
    build: {
      kind: "admin1-attributes",
      indicatorIds: ["B-036_lc_cagr_adm1"],
      periodKey: "기간_시작_종료",
      measures: [
        { key: "forest-cagr", sourceKey: "산림_CAGR_yr", label: "산림 연평균 변화율", unit: "%/년", measureId: "b036-forest-cagr" },
        { key: "cropland-cagr", sourceKey: "농경지_CAGR_yr", label: "농경지 연평균 변화율", unit: "%/년", measureId: "b036-cropland-cagr" },
        { key: "urban-cagr", sourceKey: "도시_CAGR_yr", label: "도시 연평균 변화율", unit: "%/년", measureId: "b036-urban-cagr" },
        { key: "grassland-cagr", sourceKey: "초지_관목_CAGR_yr", label: "초지·관목 연평균 변화율", unit: "%/년", measureId: "b036-grassland-cagr" },
        { key: "wetland-cagr", sourceKey: "습지_CAGR_yr", label: "습지 연평균 변화율", unit: "%/년", measureId: "b036-wetland-cagr" },
      ],
      defaultMeasure: "forest-cagr",
      boundaryPolicy34: { kind: "range-only" },
    },
    selectableVariables: "성·시별 토지피복 유형 연평균 변화율, 기간 선택",
    unit: "%/년",
    period: "1992~2022년",
    representativeItem: "성·시별 산림 연평균 변화율(1992–2022)",
    evidence: "성·시 63개 × 4기간 + 개편 후 34개 × 4기간(원자료 제공기관이 토지피복 면적에서 산출)",
    limitation: "변화율은 합하거나 평균할 수 없어, 34개 경계에서는 원자료가 밝힌 34개 값을 쓰고 없으면 구성 성·시의 범위만 표시.",
  },
};

for (const [elementId, label, analysisItemLabel] of [
  ["B-044", "광종별 부존 상태(국가 전체)", "핵심광물 광산"],
  ["B-046", "광종별 매장량(국가 전체)", "매장 광물 광산"],
  ["B-047", "광종별 광산 생산량(국가 전체)", "생산 광물 광산"],
]) {
  TARGETS_V157_2[elementId] = {
    sourceFields: ["광종_표준", "광종_USGS_영문", "값", "단위", "연도"],
    sourceSpatialUnit: "국가 단위 값 · 주요 광산 지점에 광종으로 연결",
    displaySpatialUnit: "광산 점(주요 광산 중 광종 일치)",
    representation: "point",
    build: { kind: "entity-join", hostElementId: "B-048", analysisItemLabel, boundaryPolicy34: { kind: "none" } },
    selectableVariables: `${label} · 광산 클릭 → 광종·국가 전체 값`,
    unit: "곳",
    period: elementId === "B-044" ? "2026년 기준" : "2020~2026년",
    representativeItem: `${label}`,
    evidence: "USGS 상품명 기준 광종 대응표로 주요 광산과 연결",
    limitation: "값은 광종별 국가 전체 값이며 개별 광산의 값이 아님. 광산이 없는 광종은 상세 화면에서 제공.",
  };
}

const doc = JSON.parse(readFileSync(TARGETS_PATH, "utf8"));
const changed = [];
doc.targets = doc.targets.map((target) => {
  const next = TARGETS_V157_2[target.elementId];
  if (!next) return target;
  const merged = {
    elementId: target.elementId,
    category: target.category,
    publicName: target.publicName,
    ...next,
    generatedBy: GENERATED_BY,
  };
  if (JSON.stringify(merged) !== JSON.stringify(target)) changed.push(target.elementId);
  return merged;
});
const missing = Object.keys(TARGETS_V157_2).filter((id) => !doc.targets.some((target) => target.elementId === id));
if (missing.length) throw new Error(`targets not in the contract: ${missing.join(", ")}`);
if (CHECK) {
  if (changed.length) {
    console.error(`map12 targets out of date: ${changed.join(", ")}`);
    process.exit(1);
  }
  console.log("map12 targets up to date (12)");
} else {
  // The contract is checked in with CRLF line ends; keep them.
  writeFileSync(TARGETS_PATH, `${JSON.stringify(doc, null, 2)}\n`.replace(/\n/gu, "\r\n"), "utf8");
  console.log(`map12 targets written: ${changed.length} changed (${changed.join(", ")})`);
}
