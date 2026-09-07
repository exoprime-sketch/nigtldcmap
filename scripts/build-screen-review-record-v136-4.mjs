#!/usr/bin/env node
/**
 * The editorial record for this pass.
 *
 * Two different things get called "reviewed", and they are not worth the same:
 * a gate that walked every route looking for one defect, and a person reading a
 * screen and deciding whether it says the right thing. Every element carries
 * the first. Only the ones named below carry the second, and the rest say so.
 */
import { resolve } from "node:path";
import { V2_ROOT, catalogElements, readJson } from "./v125/audit-utils.mjs";
import { writeCsvV136 } from "./v136/audit-helpers.mjs";

const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);

const AUTOMATED = [
  "nested interactive control sweep (v136-4)",
  "term-help opens without navigating (v136-4)",
  "KPI wording + raw code sweep (v136-2, 1292 selector states)",
  "public copy / glossary / hierarchy gates (v134-v136)",
].join("; ");

/** Screens read one by one this round, with what changed and why. */
const REVIEWED = {
  home: {
    surface: "home action cards",
    needs: "어떤 기능이 있고, CSV·JSON이 무엇인지",
    before: "이동 버튼 안에 약어 도움말 버튼이 중첩되어, 도움말을 열면 다운로드 화면으로 함께 이동",
    action: "수정",
    after: "카드는 컨테이너, 이동은 버튼, 설명·약어 도움말은 버튼 바깥",
    why: "button 안의 button은 파서가 분해하며 클릭이 두 동작을 실행",
    how: "v136-4 중첩 컨트롤 검사 0건 + 도움말 클릭 후 URL 불변 확인 + 1440/1024/768/390/1920 캡처",
  },
  "D-022": {
    surface: "KPI / 분야 선택 / 목록 제목",
    needs: "약정액·집행액·사업 수, 자료연도, 분야 구성",
    before: "상단 KPI가 약정액과 집행액을 한 measure로 묶어 첫 행만 표시; 제목 3중 중첩; '확인 금액 합계'·'확인 기간'이 어떤 금액·연도인지 불명",
    action: "수정",
    after: "모호한 상단 KPI 제거(핵심 수치에 약정액·집행액 별도 표시), '사업 규모와 구성' 단일 제목, '투자 약정액 합계'·'사업 시작연도'",
    why: "commitment 열과 field_92700393(기간 시작)을 원천에서 확인",
    how: "화면 캡처 + 15건/18.76억/2009-2025 보존 확인",
  },
  "D-025": {
    surface: "설비용량 선택기",
    needs: "사업 규모를 단위와 함께",
    before: "'설비용량'에 715 MW와 가스관 399 KM, 'Not Available MW'가 함께 제시",
    action: "수정",
    after: "'사업 규모'로 표시명 변경, 결측 표시는 '규모 미기재'/'214 (단위 미기재)'",
    why: "열이 사업별 단위를 그대로 담고 있어 용량으로 단정할 수 없음. 값·필터키는 미변경",
    how: "v136-4 용량 필터 길이단위 혼합 검사 0건 + 캡처",
  },
  "B-034": {
    surface: "KPI / 차트 단위",
    needs: "탄소 지표의 임계값·성별 차이",
    before: "임계값별과 성 단위 66행 중 첫 행을 대표값으로 표시; 차트 단위 CO₂e/yr에 용어 도움말 없음",
    action: "수정",
    after: "단일 KPI 생략(범주 비교 유지), 차트 '단위:'에 용어 도움말 연결",
    why: "임계값과 행정구역은 서로 다른 대상이라 한 행이 대표값이 될 수 없음",
    how: "v134 약어 도움말 검사 0건 + 화면 확인",
  },
  "A-017": {
    surface: "KPI / 발전원 비교",
    needs: "발전원별 균등화발전비용 비교",
    before: "가스복합화력(하한) 85 USD/MWh가 전체 대표값처럼 표시",
    action: "수정",
    after: "단일 KPI 생략, 24개 발전원 비교 차트가 답을 제시",
    why: "행이 기술별 구간값이라 첫 행이 대표값이 아님",
    how: "화면 캡처로 생략 후 가독성 확인",
  },
  "A-003": {
    surface: "KPI",
    needs: "1인당 GDP의 현재 수준",
    before: "1인당 GDP · 명목 · 경상 미달러 기준 단일 행",
    action: "유지",
    after: "변경 없음",
    why: "행이 하나라 대표값이 모호하지 않음",
    how: "KPI 유지 확인(변경 전후 census 대조)",
  },
};

const rows = [];
for (const [route, r] of Object.entries(REVIEWED)) {
  rows.push({
    route,
    surface: r.surface,
    userNeeds: r.needs,
    before: r.before,
    decision: r.action,
    after: r.after,
    rationale: r.why,
    verification: r.how,
    editorialReview: "REVIEWED",
  });
}

for (const item of catalog) {
  if (REVIEWED[item.elementId]) continue;
  rows.push({
    route: item.elementId,
    surface: "detail",
    userNeeds: "",
    before: "",
    decision: "유지",
    after: "",
    rationale: "이번 회차에서 화면별 편집 검토를 하지 않음",
    verification: AUTOMATED,
    editorialReview: "NOT_REVIEWED",
  });
}

writeCsvV136(
  "screen-review-record-v136-4.csv",
  ["route", "surface", "userNeeds", "before", "decision", "after", "rationale", "verification", "editorialReview"],
  rows
);
const reviewed = rows.filter((r) => r.editorialReview === "REVIEWED").length;
console.log(
  JSON.stringify({
    type: "summary",
    task: "screen-review-record:v136-4",
    total: rows.length,
    editorialReviewed: reviewed,
    notReviewed: rows.length - reviewed,
  })
);
