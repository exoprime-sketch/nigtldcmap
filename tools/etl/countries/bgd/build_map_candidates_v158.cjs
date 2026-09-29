#!/usr/bin/env node
'use strict';

/**
 * Judge every delivered Bangladesh framework element against the three
 * map-selection criteria (see CRITERIA below), using:
 *   - reports/v158/bgd-map-evidence-v158.json  (produced by extract_map_evidence.py)
 *   - tools/etl/countries/bgd/reference/vnm-map-selection-20260922.json (Vietnam precedent, verbatim)
 *
 * Writes:
 *   - reports/v158/bgd-map-candidates-v158.md          (one-page Korean summary, mirrors the Vietnam PDF)
 *   - reports/v158/bgd-map-candidates-review-v158.csv  (152-row full review, UTF-8 BOM)
 *   - <repo>/../20260827_개도국전략지도플랫폼/output/pdf/방글라데시_데이터_지도표출_후보_전수검토_20260929.pdf
 *
 * The DECISIONS table below is a curated judgment, not an auto-classifier:
 * every one of the 119 delivered elements was checked against the evidence
 * file (row counts, coordinates, division/district key matches, license
 * fields) before being assigned here. Region names that appear in the
 * generated text are rendered through the platform's own formatRegionName
 * (src/data/geo/regionNameV161.ts) rather than being written out by hand.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

require('sucrase/register/ts');
const { formatRegionName } = require(path.join(REPO_ROOT, 'src', 'data', 'geo', 'regionNameV161.ts'));

// A BGD region name as it appears in generated text - always routed through
// the platform formatter. Names the dictionary does not know (e.g. a security
// tract spanning three districts) come back unchanged, by design.
function bgdRegion(raw) {
  return formatRegionName({ country: 'BGD', raw });
}

const EVIDENCE_PATH = path.join(REPO_ROOT, 'reports', 'v158', 'bgd-map-evidence-v158.json');
const VNM_REFERENCE_PATH = path.join(__dirname, 'reference', 'vnm-map-selection-20260922.json');
const MD_OUT_PATH = path.join(REPO_ROOT, 'reports', 'v158', 'bgd-map-candidates-v158.md');
const CSV_OUT_PATH = path.join(REPO_ROOT, 'reports', 'v158', 'bgd-map-candidates-review-v158.csv');
const PDF_OUT_PATH = path.join(
  REPO_ROOT,
  '..',
  '20260827_개도국전략지도플랫폼',
  'output',
  'pdf',
  '방글라데시_데이터_지도표출_후보_전수검토_20260929.pdf',
);
const HTML_TMP_PATH = path.join(REPO_ROOT, 'tmp', 'bgd-map-candidates-v158.html');

const REVIEW_DATE = '2026. 9. 29.';

const CRITERIA = [
  ['①', '지역별 비교', '같은 지표를 여러 지역·유역에서 비교할 수 있는가?', '기후위험·자원량·산림·지역예산'],
  [
    '②',
    '시설·사업·기관의 위치',
    '어디에 있는지 또는 어느 지역에서 활동하는지 적혀 있는가? 그 시설·기관·사업에 대한 설명도 있는가?',
    '발전소 위치와 용량 / 연구기관 위치와 전문분야',
  ],
  [
    '③',
    '지역별 계획·규정·지원',
    '어느 지역에 적용되는지 적혀 있는가? 그 지역의 목표·규제·지원 내용도 적혀 있는가?',
    '어느 관구에 태양광을 얼마나 늘릴지',
  ],
];
const RULE_LINE = 'ㅇ ①~③ 중 하나 이상 충족하면 선정. ②·③은 각각 두 질문 모두 ‘예’여야 함. 전국 공통 값·규정은 지도에서 제외함.';

// ---------------------------------------------------------------------------
// Curated decisions - one entry per delivered element (119), checked against
// the evidence file. decision: 'register' | 'hold' | 'exclude'.
// criteria: array subset of ['①','②','③'], only meaningful for register/hold.
// mapContent: the "지도에서 확인할 내용" text, only for register/hold.
// reason: short, evidence-grounded justification (register/hold notes give
// the caveat; exclude notes give why the element does not qualify).
// ---------------------------------------------------------------------------

const NATIONWIDE_REASON = '전국 단일 값/제도로만 확인됨 — 지역별 비교·위치·계획 정보 없음(전국 공통 값·규정은 지도에서 제외).';

const DECISIONS = {
  // --- A: national context (mostly nationwide macro indicators) ---
  'A-001': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-002': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-003': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-004': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-005': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-006': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-007': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-008': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-009': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-010': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-011': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-012': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-013': {
    decision: 'exclude',
    reason:
      '전국 단위로만 확인됨(지역 조치 행 없음). 베트남은 "삼각주 산림보전·관개개선 계획"으로 선정(③)했으나, 방글라데시 납품에는 NDC-SDG 연계 지표에 지역 태그가 없어 차이가 남.',
  },
  'A-014': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-015': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-016': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-017': { decision: 'exclude', reason: `${NATIONWIDE_REASON} (BNEF 원자료, 전국 대표값만 존재)` },
  'A-018': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-019': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-020': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-021': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-022': {
    decision: 'exclude',
    reason:
      '전국 SAIDI/SAIFI 대표값만 확인됨(전력회사 관할별 세분 없음). 베트남은 "전력회사 관할별 정전시간·빈도"로 선정(①)했으나 방글라데시 자료는 배전회사 단위 분리가 없어 차이가 남.',
  },
  'A-023': {
    decision: 'register',
    criteria: ['②'],
    mapContent: '발전소 위치·발전원·설비용량',
    reason:
      '좌표 57건 중 1건은 원자료가 "Gopalganj"(태양광 5MW, GPPD ID WKS0070913, 출처 Wiki-Solar)로 이름 붙인 발전소인데, 좌표(위도 26.585·경도 84.145)는 동명의 인도 비하르(Bihar)주 고팔간지 인근에 위치함 — 원자료 행은 그대로 두고 지도 표시에서만 제외, 좌표를 고치거나 새로 만들지 않음. 나머지 56건 표시 대상.',
  },
  'A-024': {
    decision: 'register',
    criteria: ['②'],
    mapContent: '송전구간 시점·전압·연장',
    reason:
      '좌표는 선로 구간의 대표점(중간 정점) 1개뿐이라 실제 선형이 아니며, 지도에는 대표점으로 실제 경로와 구분해 표기함. 다운로드는 지표 메타(ODbL 1.0, download_allowed=불가)에 따라 제공하지 않음 — 표출은 공개 결정(사용자 2026-09-29, "공개 가능여부 상관없이 최대한 표출")에 따름.',
  },
  'A-025': {
    decision: 'exclude',
    reason:
      'IEA CCUS Projects Database 2026 전수조회 결과 방글라데시 등재 0건(구조적 부존) — 좌표를 가진 레코드 자체가 없음. 베트남은 실제 사업지가 있어 선정(②)된 것과 대비됨.',
  },
  'A-026': {
    decision: 'exclude',
    reason: '건물 수·면적이 전국 집계로만 존재(OSM/정부 통계) — 좌표·지역 구분 없음.',
  },
  'A-027': {
    decision: 'exclude',
    reason:
      '철도·도로 피처 수가 전국 집계(fclass별 건수)로만 존재하고 1.2_entity 레코드가 없음(엔티티 0행). 베트남은 사용자가 xlsx 검토 후 뒤늦게 추가(2026-09-23, 72개)했으나, 방글라데시 자료는 위치 정보 자체가 없어 동일하게 추가하기 어려움.',
  },
  'A-028': {
    decision: 'register',
    criteria: ['②'],
    mapContent: '해안·수자원 시설 위치·유형·연장',
    reason:
      '선 지물(하천·수로) 좌표는 시작점만 제공되어 실제 노선이 아니며, 지도에는 시작점으로 실제 경로와 구분해 표기함. 다운로드는 지표 메타(ODbL 1.0, download_allowed=불가)에 따라 제공하지 않음 — 표출은 공개 결정(사용자 2026-09-29)에 따름. 좌표 2,102건 중 36건은 국가 윤곽(+0.05°) 밖으로, 표본 확인 결과 35건이 하천(river)·1건이 운하(canal)이며 인접국과의 접경 위도·경도대에 몰려 있어 국경을 넘어오는 하천의 상류측 시작점으로 보임(오류로 단정하지 않음).',
  },
  'A-029': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-030': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-031': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-032': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'A-033': { decision: 'exclude', reason: NATIONWIDE_REASON },

  // --- B: climate / resources ---
  'B-001': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-002': { decision: 'register', criteria: ['①'], mapContent: 'Division별 기후대·유형별 면적비율' },
  'B-003': { decision: 'register', criteria: ['①'], mapContent: 'Division별 기온·강수량 및 연도별 변화' },
  'B-004': { decision: 'register', criteria: ['①'], mapContent: 'Division별 시나리오·기간별 기후 전망' },
  'B-005': { decision: 'register', criteria: ['①'], mapContent: 'Division별 연속건조일수·가뭄지수' },
  'B-006': { decision: 'register', criteria: ['①'], mapContent: 'Division별 폭염일수·열대야 등 고온지표' },
  'B-007': { decision: 'register', criteria: ['①'], mapContent: 'Division별 극한강수량·호우일수' },
  'B-008': {
    decision: 'register',
    criteria: ['①'],
    mapContent: '관측소별 시나리오·기간별 해수면 상승 전망',
    reason:
      'PSMSL 조위관측소 4곳(HIRON POINT·KHEPUPARA·COX’S BAZAAR·CHARCHANGA) 중 COX’S BAZAAR 1곳(21.45°N, 91.83°E)의 좌표가 국가 윤곽(+0.05°) 밖으로 확인됨 — 이 관측소의 시나리오·연도별 행 315건이 전부임(나머지 3곳은 윤곽 안). 좌표가 코크스바자르 읍 서쪽 벵골만 해상에 위치해 조위관측소 특성상 해안선 밖 해상 좌표로 보이며(인접국 지점 아님), 오류로 단정하지 않음.',
  },
  'B-009': { decision: 'register', criteria: ['①'], mapContent: 'Division별 생물다양성 위험도·구성지표' },
  'B-010': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-011': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-012': { decision: 'register', criteria: ['①'], mapContent: '발생·피해지역별 재해유형·이력' },
  'B-013': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-014': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-015': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-016': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-017': {
    decision: 'hold',
    criteria: ['①'],
    mapContent: '유역·관구별 물 스트레스 위험',
    reason:
      '행정단위(attr_4)가 "Division"인 레코드의 관구가 GADM 4.1 기준 7개뿐이며 마이멘싱(${MYMENSINGH}) 관구가 빠져 있어(원자료 유의사항: "GADM 3.6 기준이라 GADM 4.1보다 1개 적음 — 미수록: Mymensingh") 8개 관구 경계 자산과 1:1이 아님. 유역×관구 교차(632행) 역시 HydroBASINS 유역 경계 자산이 없어 함께 보류.',
  },
  'B-018': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-019': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-020': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-021': {
    decision: 'hold',
    criteria: ['①'],
    mapContent: 'Global Data Lab 권역별 취약성·구성지표',
    reason:
      '원천(Global Data Lab)의 자체 집계 권역이 복수 구(district)를 묶은 임시 그룹(예: 3~4개 구 결합)이라 8개 관구·64개 구 어느 경계와도 1:1로 대응하지 않음(지표 322종 중 약 67%가 복수-구 결합 접미사). 경계 자산이 없어 보류.',
  },
  'B-022': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-023': { decision: 'register', criteria: ['①'], mapContent: '지점별 건기·우기 유량 차이' },
  'B-024': { decision: 'register', criteria: ['①'], mapContent: 'Division별 벼 재배면적·용수배분 추정' },
  'B-025': {
    decision: 'register',
    criteria: ['①'],
    mapContent: '하천유역별 대표좌표·면적',
    reason: '유역 66개의 대표좌표(중심점)만 제공되고 경계 폴리곤은 없어 점으로 표시함(6건은 국가 윤곽 밖 — 접경 유역의 중심점으로 보이며 오류로 단정하지 않음).',
  },
  'B-026': { decision: 'register', criteria: ['①'], mapContent: 'Division별 우세유향·방위별 비율' },
  'B-027': { decision: 'exclude', reason: `${NATIONWIDE_REASON} (좌표·지역 구분 없음)` },
  'B-028': {
    decision: 'register',
    criteria: ['①'],
    mapContent: '수문지점·유역별 유량',
    reason: '자무나(브라마푸트라)·메그나·갠지스(파드마) 3개 국가대표 관측지점만 제공됨(전체 관측망 대비 표본).',
  },
  'B-029': { decision: 'register', criteria: ['①'], mapContent: 'Division별 이탄지 등 산림 유형·면적' },
  'B-030': { decision: 'register', criteria: ['①'], mapContent: 'Division별 기준기간 내 수관 증가면적' },
  'B-031': { decision: 'register', criteria: ['①'], mapContent: 'Division별 수관면적·연도별 변화' },
  'B-032': { decision: 'register', criteria: ['①'], mapContent: 'Division별 수관피복률' },
  'B-033': { decision: 'register', criteria: ['①'], mapContent: 'Division별 연간·누적 수관손실' },
  'B-034': { decision: 'register', criteria: ['①'], mapContent: 'Division별 탄소 저장·배출·흡수' },
  'B-035': { decision: 'register', criteria: ['①'], mapContent: 'Division별 토지이용 면적 시계열' },
  'B-036': { decision: 'register', criteria: ['①'], mapContent: 'Division별 기간별 토지이용 면적 변화율' },
  'B-037': { decision: 'register', criteria: ['①'], mapContent: 'Division별 경작지·산림·수체 등 구성' },
  'B-038': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-039': { decision: 'register', criteria: ['①'], mapContent: 'Division별 이론 수력 잠재량' },
  'B-040': { decision: 'register', criteria: ['①'], mapContent: 'Division별 심도별 지열 자원' },
  'B-041': { decision: 'register', criteria: ['①'], mapContent: 'Division별 일사량·태양광 자원' },
  'B-042': { decision: 'register', criteria: ['①'], mapContent: 'Division별 고도별 풍속·풍력밀도' },
  'B-043': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-044': {
    decision: 'exclude',
    reason:
      '광종별 전국 집계(부존 여부·순위)로만 존재하고 광산별 지역 구분이 없음(개별 위치는 B-048에서 확인). 베트남은 "광산 소재지역·광종"으로 선정(②)했으나 방글라데시는 광종 단위 국가 통계만 있어 차이가 남.',
  },
  'B-045': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'B-046': {
    decision: 'exclude',
    reason:
      '광종별 전국 매장량 집계만 존재(광산별 위치 없음). 베트남은 "광산 소재지역·니켈·리튬 매장 범위"로 선정(②)했으나 방글라데시는 전국 단위 수치만 있어 차이가 남.',
  },
  'B-047': {
    decision: 'exclude',
    reason:
      '광종별 전국 생산량 집계만 존재(광산별 위치 없음). 베트남은 "라오까이 구리 생산량 범위"처럼 특정 광산에 결부된 값을 선정(②)했으나 방글라데시는 전국 단위 수치만 있어 차이가 남.',
  },
  'B-048': {
    decision: 'register',
    criteria: ['②'],
    mapContent: '광산 소재지역·광종',
    reason: '광산 3곳 중 1곳이 국가 윤곽(+0.05°) 밖 — 접경 지역 좌표로 보이며 오류로 단정하지 않음.',
  },

  // --- C: policy / institutions ---
  'C-001': { decision: 'exclude', reason: `${NATIONWIDE_REASON} (NDC 제출 이력 4건 모두 국가 단위)` },
  'C-002': {
    decision: 'hold',
    criteria: ['①'],
    mapContent: '농업생태구역별 기후 통계(BTR 수록분)',
    reason:
      'BTR 원자료에 농업생태구역 3곳(치타공 연안평야·갠지스 조간대 범람원·메그나 하구 범람원)이 확인되나, 이 구획은 8개 관구 경계와 다른 별도 지리 분류라 경계 자산이 없어 보류. 베트남 71개 목록에는 없던 신규 항목.',
  },
  'C-003': {
    decision: 'exclude',
    reason: '스키마에 지역명 필드가 있으나 13개 레코드 전부 "전국"으로만 기재됨(기후스트레스 지역 수 "11"은 개수 값이지 지역명이 아님).',
  },
  'C-004': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'C-005': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'C-006': {
    decision: 'exclude',
    reason:
      '양자협정·국내체계·CDM전환활동 17건 전부 "국가" 수준으로 기재됨(전환활동은 코드명만 있고 사업 소재지 미기재). 베트남은 "사업지역·기술·등록상태"로 선정(②)했으나 방글라데시 자료는 개별 사업 지역이 없어 차이가 남.',
  },
  'C-007': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'C-008': {
    decision: 'exclude',
    reason:
      '지역명 필드가 96개 레코드 모두 "전국"이며, 별도 "지역" 열은 대륙 단위("Asia") 1건 외에는 행위자 구분(City/Company/Investor/Organization)만 담음. 베트남은 "도시·성별 참여·공약 건수"로 선정(②)했으나 방글라데시 자료는 도시·관구 단위 참여 기록이 없어 차이가 남.',
  },
  'C-009': { decision: 'exclude', reason: `${NATIONWIDE_REASON} 베트남도 동일 사유("지역내용 미확인")로 제외.` },
  'C-010': { decision: 'exclude', reason: `${NATIONWIDE_REASON} 베트남도 동일 사유("지역내용 미확인")로 제외.` },
  'C-011': {
    decision: 'hold',
    criteria: ['③'],
    mapContent: '지역별 치안 경보 등급·대상지역',
    reason:
      '치타공 힐 트랙스(${CHT}, Khagrachari·Rangamati·Bandarban 3개 구)에 대해 전국과 다른 경보 등급이 확인되나, 이는 8개 관구보다 작은 보안구역 단위라 경계 자산이 없어 보류. 베트남 71개 목록에는 없던 신규 항목.',
  },
  'C-012': {
    decision: 'exclude',
    reason:
      'PPP 법률·조달 체계 자체가 전국 단일 제도로만 기재됨(사업 레코드 없음). 베트남은 개별 "PPP 사업"(사업 소재지역·분야·투자액)으로 선정(②)했으나, 방글라데시 C-012 요소는 사업이 아닌 법·제도 설명이라 성격이 다름.',
  },
  'C-013': {
    decision: 'exclude',
    reason:
      '외국인 투자 규정이 전국 일괄 적용으로 기재됨. 베트남은 "지역 투자 특례"(적용지역·지원내용·조건)로 선정(③)했으나 방글라데시는 지역별 특례가 확인되지 않아 차이가 남.',
  },
  'C-014': {
    decision: 'exclude',
    reason:
      '인허가 절차(EIA·건축·전력·토지)가 전국 공통으로 기재됨. "다카·치타공"은 세계은행 Doing Business 조사대상 도시 표기일 뿐 지역별 규정 차이가 아님.',
  },
  'C-015': { decision: 'exclude', reason: '원본 문서 링크 목록으로 지역 구분 대상이 아님.' },
  'C-016': {
    decision: 'hold',
    criteria: ['②'],
    mapContent: '재생에너지 입찰사업 소재지·용량',
    reason:
      '태양광 IPP 입찰 11건은 우파질라/구 단위 지명(예: Bajitpur, Cox’s Bazar 등)은 있으나 좌표가 없어 지오코딩이 필요해 보류. 목표·발주 제도·RPO·설비용량 계열(21행)은 전국 단위. 베트남은 "성별 전원·기간별 확대용량"(①)으로 선정.',
  },
  'C-017': {
    decision: 'exclude',
    reason:
      '지역 2단계 소득세 감면(다카·치타공 대 그 외)이 2024-06-30 설립분까지로 만료되어 현재는 "지역무관"으로 기재됨. 베트남은 활성 상태인 "권역별 가격상한·닌투언 특례"로 선정(③)했으나 방글라데시는 현재 유효한 지역 인센티브가 없어 차이가 남.',
  },
  'C-018': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'C-019': { decision: 'exclude', reason: `${NATIONWIDE_REASON} 베트남도 동일 사유("전국 제도")로 제외.` },
  'C-022': {
    decision: 'exclude',
    reason:
      '방글라데시는 아직 가동 중인 탄소시장(ETS)이 없어 "준비도" 단계 국가 단위 서술만 존재. 베트남은 가동 중인 시범 ETS의 "성별 대상시설 수·업종"으로 선정(①)했으나 방글라데시는 대상시설 자체가 없어 차이가 남.',
  },
  'C-024': {
    decision: 'exclude',
    reason:
      'REDD+ 참여가 국가전략 단계로만 기재되고 사업별 소재지역이 없음. 베트남은 "참여지역·산림보전·감축사업"으로 선정(②)했으나 방글라데시는 사업 단위 지역 정보가 없어 차이가 남.',
  },
  'C-025': {
    decision: 'register',
    criteria: ['②'],
    mapContent: '탄소크레딧 사업지역·유형·발행·소각 실적',
    reason: '19개 좌표 중 1건은 해안 인접(외곽 여지, 오류로 단정하지 않음). 관구명·OCHA P-code 6종 확인.',
  },

  // --- E: cooperation / institutions ---
  'E-001': {
    decision: 'exclude',
    reason:
      '기관명·담당자 정보만 있고 위치(주소·좌표) 필드 자체가 없음. 베트남은 "기관 소재지역·역할·전문분야"로 선정(②)했으나 방글라데시 자료는 위치 필드가 없어 차이가 남.',
  },
  'E-002': {
    decision: 'hold',
    criteria: ['②'],
    mapContent: 'DNA 사무소 위치·승인업무',
    reason: 'DNA 사무소 주소 1건(다카)이 텍스트로 확인되나 좌표가 없어 지오코딩 후 표시 여부를 재검토.',
  },
  'E-003': { decision: 'exclude', reason: '기관명·담당자 정보만 있고 위치 필드가 없음(베트남 71개에도 없음).' },
  'E-004': { decision: 'register', criteria: ['②'], mapContent: '현지 사무소 위치·협력분야' },
  'E-005': { decision: 'register', criteria: ['②'], mapContent: '소재지역·전문분야·수행역량' },
  'E-006': {
    decision: 'register',
    criteria: ['②'],
    mapContent: '방글라데시 내 거점·투자분야',
    reason:
      '좌표 16건 중 국내 9건만 지도 표시 대상. 해외 본사 7건(마닐라·베이징·서울·워싱턴DC·싱가포르 3곳, 국가 윤곽 밖)은 원자료에 그대로 남아 있으며 제공 데이터에도 포함되나, 이번 지도 표시 범위(방글라데시 내 거점) 밖이라 지도에는 표시하지 않음.',
  },
  'E-007': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'E-008': { decision: 'exclude', reason: `${NATIONWIDE_REASON} (논문·특허 서지정보이며 기관 위치 아님)` },
  'E-009': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'E-010': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'E-012': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'E-014': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'E-015': { decision: 'exclude', reason: NATIONWIDE_REASON },
  'E-018': { decision: 'register', criteria: ['②'], mapContent: '사업지역·기술분야·진출상태' },
  'E-019': { decision: 'register', criteria: ['②'], mapContent: '현지 사무소 위치·지원업무' },
  'E-020': {
    decision: 'exclude',
    reason:
      '활동지역 필드가 없거나 전국으로만 기재됨. 베트남은 "확인된 활동지역·지원내용"으로 선정(②)했으나 방글라데시 자료는 지원사업별 활동지역이 확인되지 않아 차이가 남.',
  },
};

// Resolve the two hand-written region-name placeholders through the platform
// formatter rather than writing "Mymensingh"/"Chittagong Hill Tracts" by hand.
DECISIONS['B-017'].reason = DECISIONS['B-017'].reason.replace('${MYMENSINGH}', bgdRegion('Mymensingh'));
DECISIONS['C-011'].reason = DECISIONS['C-011'].reason.replace('${CHT}', bgdRegion('Chittagong Hill Tracts'));

// ---------------------------------------------------------------------------
// Load evidence + Vietnam reference
// ---------------------------------------------------------------------------

const evidence = JSON.parse(fs.readFileSync(EVIDENCE_PATH, 'utf8'));
const vnmRef = JSON.parse(fs.readFileSync(VNM_REFERENCE_PATH, 'utf8'));
const vnmByCode = new Map(vnmRef.items.map((item) => [item.elementId, item]));
const vnmNotProvided = new Set(vnmRef.summary.notProvided);

const allFramework = evidence.framework.allElements;
const deliveredCodes = new Set(Object.keys(evidence.elements));
const notProvidedCodes = new Set(evidence.framework.notProvidedCodes);
const allCodes = Object.keys(allFramework).sort();

// Sanity: every delivered code must have a curated decision, and every
// decision must point at a real delivered code - catches typos immediately.
const missingDecisions = [...deliveredCodes].filter((code) => !DECISIONS[code]);
const staleDecisions = Object.keys(DECISIONS).filter((code) => !deliveredCodes.has(code));
if (missingDecisions.length) {
  throw new Error(`no curated decision for delivered element(s): ${missingDecisions.join(', ')}`);
}
if (staleDecisions.length) {
  throw new Error(`decision table references non-delivered element(s): ${staleDecisions.join(', ')}`);
}

// Guard rail: a register/hold decision must be backed by real spatial
// evidence (coordinates or a division/district key match) - if this ever
// fails it means the curated table drifted from the evidence file.
for (const [code, entry] of Object.entries(DECISIONS)) {
  if (entry.decision === 'exclude') continue;
  const ev = evidence.elements[code];
  const hasCoord = ev.coordinates.rowsWithLatLon > 0;
  const hasDivision = ev.regionEvidence.divisionKeysFoundCount > 0;
  const hasDistrict = ev.regionEvidence.districtKeysFoundCount > 0;
  const hasRegionAttr = Object.keys(ev.regionEvidence.regionLikeAttrs).length > 0;
  if (!hasCoord && !hasDivision && !hasDistrict && !hasRegionAttr) {
    throw new Error(`${code} is marked ${entry.decision} but evidence shows no coordinates or region match`);
  }
}

// ---------------------------------------------------------------------------
// Per-code helpers
// ---------------------------------------------------------------------------

function evidenceCitation(code) {
  const ev = evidence.elements[code];
  if (!ev) return '해당 없음(미제공)';
  const parts = [];
  const obs = ev.sheets.observation;
  const ent = ev.sheets.entity;
  const meta = ev.sheets.meta;
  if (obs.dataRowCount) parts.push(`관측값 ${obs.dataRowCount}행(지표 ${obs.uniqueIndicatorCount}종)`);
  if (ent.dataRowCount) parts.push(`레코드 ${ent.dataRowCount}행(지표 ${ent.uniqueIndicatorCount}종)`);
  if (meta.dataRowCount) parts.push(`메타 ${meta.dataRowCount}행`);
  if (ev.coordinates.rowsWithLatLon) {
    const outside = ev.coordinates.outsideOutlineCount;
    parts.push(`좌표 ${ev.coordinates.rowsWithLatLon}건${outside ? `(국가 윤곽 밖 ${outside})` : ''}`);
  }
  if (ev.regionEvidence.divisionKeysFoundCount) {
    parts.push(`관구 매칭 ${ev.regionEvidence.divisionKeysFoundCount}/${evidence.country.adm1Count}`);
  }
  if (ev.regionEvidence.districtKeysFoundCount) parts.push(`구 매칭 ${ev.regionEvidence.districtKeysFoundCount}`);
  if (ev.spatialUnits.length) parts.push(`spatial_unit=${ev.spatialUnits.join('/')}`);
  return parts.join(' · ') || '해당 없음';
}

function vnmVerdict(code) {
  const item = vnmByCode.get(code);
  if (item) return { status: '선정', criteria: item.criteriaProvisional, pdfContent: item.pdfContent };
  if (vnmNotProvided.has(code)) return { status: '미제공', criteria: '', pdfContent: '' };
  return { status: '제외', criteria: '', pdfContent: '' };
}

function judgmentLabel(decision) {
  if (decision === 'register') return '등록 후보';
  if (decision === 'hold') return '보류';
  if (decision === 'exclude') return '제외';
  return '미제공';
}

// The review CSV's "대상 데이터" column is the full framework label (per spec);
// the one-page md/PDF summary instead needs a short display name, the same
// way the Vietnam PDF shows "발전소" rather than the raw framework text. Where
// BGD registers/holds the same content Vietnam selected, reuse Vietnam's own
// short targetName; the two BGD-only holds (C-002, C-011) get a hand-written one.
const SHORT_LABEL_OVERRIDES = {
  'C-002': 'BTR 지역 기후통계',
  'C-011': '치안·안전 경보',
};
function shortLabelFor(code) {
  if (SHORT_LABEL_OVERRIDES[code]) return SHORT_LABEL_OVERRIDES[code];
  const item = vnmByCode.get(code);
  if (item) return item.targetName;
  return allFramework[code].label;
}

function buildRow(code) {
  const fw = allFramework[code];
  const delivered = deliveredCodes.has(code);
  const decisionEntry = DECISIONS[code];
  const decision = delivered ? decisionEntry.decision : 'not-provided';
  const vnm = vnmVerdict(code);
  const vnmText = vnm.status === '선정' ? `선정(${vnm.criteria}) — "${vnm.pdfContent}"` : vnm.status;
  return {
    code,
    label: fw.label,
    shortLabel: decision === 'register' || decision === 'hold' ? shortLabelFor(code) : fw.label,
    delivered: delivered ? '제공' : '미제공',
    judgment: judgmentLabel(decision),
    criteria: decisionEntry && decisionEntry.criteria ? decisionEntry.criteria.join('') : '',
    mapContent: decisionEntry && decisionEntry.mapContent ? decisionEntry.mapContent : '',
    evidenceCitation: evidenceCitation(code),
    vnmVerdict: vnmText,
    note: decisionEntry && decisionEntry.reason ? decisionEntry.reason : '',
  };
}

const rows = allCodes.map(buildRow);

// ---------------------------------------------------------------------------
// Summary counts
// ---------------------------------------------------------------------------

const registered = rows.filter((r) => r.judgment === '등록 후보');
const held = rows.filter((r) => r.judgment === '보류');
// Interleaved by code (rows is already alphabetical), matching how the
// Vietnam PDF lists its one held item (A-028*) inline rather than separately.
const meetsCriteria = rows.filter((r) => r.judgment === '등록 후보' || r.judgment === '보류');
const excluded = rows.filter((r) => r.judgment === '제외');
const notProvided = rows.filter((r) => r.judgment === '미제공');

console.log('=== BGD map candidate summary ===');
console.log(`제공 ${deliveredCodes.size}개 -> 기준 충족 ${meetsCriteria.length}개(등록후보 ${registered.length} · 보류 ${held.length}) · 지도 제외 ${excluded.length}개 / 미제공 ${notProvided.length}개`);

// ---------------------------------------------------------------------------
// CSV (152 rows, UTF-8 BOM, CRLF)
// ---------------------------------------------------------------------------

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

const CSV_HEADER = ['code', '대상 데이터', '제공 여부', '판정', '충족 기준', '지도에서 확인할 내용', '근거', '베트남 판정', '비고'];
const csvLines = [CSV_HEADER.map(csvEscape).join(',')];
for (const row of rows) {
  csvLines.push(
    [row.code, row.label, row.delivered, row.judgment, row.criteria, row.mapContent, row.evidenceCitation, row.vnmVerdict, row.note]
      .map(csvEscape)
      .join(','),
  );
}
const csvContent = '\uFEFF' + csvLines.join('\r\n') + '\r\n';
fs.writeFileSync(CSV_OUT_PATH, csvContent, 'utf8');
console.log(`wrote ${CSV_OUT_PATH} (${rows.length} rows)`);

// ---------------------------------------------------------------------------
// One-page Markdown summary (same structure/wording style as the Vietnam PDF)
// ---------------------------------------------------------------------------

const notProvidedList = [...notProvidedCodes].sort();
// Fold the 26 D-* codes into one clause - naming all of them individually
// would swamp the one-page summary the way it never would for a handful.
const notProvidedD = notProvidedList.filter((c) => c.startsWith('D-'));
const notProvidedOther = notProvidedList.filter((c) => !c.startsWith('D-'));

function mdCriteriaTable() {
  const lines = ['| 선정 기준 | 원자료에서 확인할 질문 | 구체적인 예 |', '|---|---|---|'];
  for (const [mark, name, question, example] of CRITERIA) {
    lines.push(`| ${mark} ${name} | ${question} | ${example} |`);
  }
  return lines.join('\n');
}

function mdTargetTable() {
  const lines = ['| 코드 | 대상 데이터 | 지도에서 확인할 내용 |', '|---|---|---|'];
  for (const row of meetsCriteria) {
    const star = row.judgment === '보류' ? '*' : '';
    lines.push(`| ${row.code}${star} | ${row.shortLabel} | ${row.mapContent} |`);
  }
  return lines.join('\n');
}

// Vietnam's own PDF keeps each footnote to one short clause per item (e.g.
// "*A-028은 자료 내 표출제한으로 공개 보류함.") rather than a paragraph - match
// that terseness here; the full reasoning lives in the review CSV's 비고 column.
const HOLD_SHORT_REASON = {
  'B-017': '관구 7개뿐(마이멘싱 미포함)',
  'B-021': 'GDL 자체 권역이 관구·구와 불일치',
  'C-002': '농업생태구역이 관구와 다른 구획',
  'C-011': '치안구역이 관구보다 작은 단위',
  'C-016': '입찰지 11건 지명은 있으나 좌표 없음',
  'E-002': '사무소 주소만 있고 좌표 없음',
};
const holdNoteLine = held.map((row) => `${row.code}: ${HOLD_SHORT_REASON[row.code] || row.note}`).join('; ');

const VNM_UNREGISTERED_CODES = [
  'A-013', 'A-022', 'A-025', 'B-044', 'B-046', 'B-047',
  'C-006', 'C-008', 'C-012', 'C-013', 'C-014', 'C-017', 'C-022', 'C-024',
  'E-001', 'E-003', 'E-020',
];
const NEW_HOLD_NOT_IN_VNM = ['C-002', 'C-011'];

const mdContent = `# 방글라데시 데이터 지도표출 후보(전수검토)

**${REVIEW_DATE}**

## 검토 결과

□ 검토 결과: 제공 ${deliveredCodes.size}개 → 기준 충족 ${meetsCriteria.length}개* · 지도 제외 ${excluded.length}개 / 미제공 ${notProvided.length}개

※ 기준목록 ${allCodes.length}개 대비 정상 엑셀 ${deliveredCodes.size}개 전수 검토. *보류 ${held.length}건 포함(등록 후보 ${registered.length} + 보류 ${held.length}) — 미제공은 제외 판정과 구분함.

${mdCriteriaTable()}

${RULE_LINE}

## 지도 대상

□ 지도 대상: 코드 · 대상 데이터 · 지도에서 확인할 내용 (선정 요소 내 기준 충족 자료에 한정, \\* = 보류)

${mdTargetTable()}

## 유의사항

- (표출 범위) 좌표가 확인된 행만 사용. A-024(송전선)는 구간 대표점(중간 정점), A-028(하천·수로)은 시작점만 제공되어 실제 노선이 아니며, 지도에는 대표점·시작점으로 실제 경로와 구분해 표기함. A-024·A-028 다운로드는 지표 메타(ODbL 1.0, download_allowed=불가)에 따라 제공하지 않음(표출은 공개 결정 2026-09-29에 따름). 기관 주소를 사업지역으로 전용하지 않음.
- (유의사항) 보류 ${held.length}건 — ${holdNoteLine}. A-023: 원자료가 "Gopalganj"로 이름 붙인 발전소 좌표 1건이 동명의 인도 비하르주 Gopalganj 부근을 가리켜 지도 표시에서만 제외(좌표는 고치지 않음), 56건 표시. E-006: 좌표 16건 중 국내 9건만 표시, 해외 본사 7건은 원자료에 남아 있으나 표시 범위 밖.
- (차이 — 베트남 71개 대비) D 카테고리 26개(D-001~D-026) 전체 미제공. 베트남 선정분 중 방글라데시에서 표시 대상/보류로 이어지지 않은 항목: ${VNM_UNREGISTERED_CODES.join('·')}(사유는 검토표 비고란 참조). 베트남 71개에는 없었으나 새로 보류에 오른 항목: ${NEW_HOLD_NOT_IN_VNM.join('·')}.
- (미제공) ${notProvidedD.length}개(D-001~D-026) + ${notProvidedOther.join('·')}(${notProvidedOther.length}개) = 총 ${notProvidedList.length}개. 선정 ${meetsCriteria.length}개는 지도 등록 수가 아니다(등록은 승인 후 B2). 좌표가 없는 행에 좌표를 만들지 않는다 — 지명·주소만 있는 C-016·E-002는 보류.

검토근거: reports/v158/bgd-map-evidence-v158.json(요소별 시트·행수·좌표·라이선스 근거) | 항목별 상세: reports/v158/bgd-map-candidates-review-v158.csv | 외부 원문·현행성 검증은 포함하지 않음.
`;

fs.writeFileSync(MD_OUT_PATH, mdContent, 'utf8');
console.log(`wrote ${MD_OUT_PATH}`);

// ---------------------------------------------------------------------------
// HTML (A4 landscape, styled like the Vietnam PDF) -> PDF via Playwright
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function htmlCriteriaTable() {
  const rowsHtml = CRITERIA.map(
    ([mark, name, question, example]) =>
      `<tr><td class="mark">${mark} ${escapeHtml(name)}</td><td>${escapeHtml(question)}</td><td>${escapeHtml(example)}</td></tr>`,
  ).join('');
  return `<table class="criteria"><thead><tr><th>선정 기준</th><th>원자료에서 확인할 질문</th><th>구체적인 예</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
}

function htmlTargetColumns() {
  // Three parallel columns (rather than Vietnam's two) keep each column's
  // row count - and so the block's total height - down, since BGD's list is
  // shorter than Vietnam's 71 but still needs to fit one landscape page.
  const columnCount = 3;
  const perColumn = Math.ceil(meetsCriteria.length / columnCount);
  const renderRows = (list) =>
    list
      .map((row) => {
        const star = row.judgment === '보류' ? '*' : '';
        return `<tr><td class="code">${escapeHtml(row.code)}${star}</td><td>${escapeHtml(row.shortLabel)}</td><td>${escapeHtml(row.mapContent)}</td></tr>`;
      })
      .join('');
  const table = (list) =>
    `<table class="target"><thead><tr><th>코드</th><th>대상 데이터</th><th>지도에서 확인할 내용</th></tr></thead><tbody>${renderRows(list)}</tbody></table>`;
  const columns = [];
  for (let i = 0; i < columnCount; i += 1) {
    columns.push(meetsCriteria.slice(i * perColumn, (i + 1) * perColumn));
  }
  return `<div class="target-columns">${columns.map((list) => `<div class="target-col">${table(list)}</div>`).join('')}</div>`;
}

const holdNoteLineHtml = escapeHtml(holdNoteLine);

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>방글라데시 데이터 지도표출 후보(전수검토)</title>
<style>
  @page { size: A4 landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Malgun Gothic", "Noto Sans KR", sans-serif;
    font-size: 8.6pt;
    line-height: 1.15;
    color: #111;
    margin: 0;
  }
  h1 { font-size: 14pt; margin: 0; display: inline-block; }
  .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm; }
  .date { font-size: 9pt; color: #333; }
  .section-title { font-weight: bold; margin: 1.2mm 0 0.6mm 0; }
  .result-line { margin: 0; }
  .result-note { font-size: 7.6pt; color: #444; margin: 0 0 1mm 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.criteria { margin-bottom: 0.8mm; }
  table th, table td { border: 0.3pt solid #999; padding: 0.4mm 1mm; vertical-align: top; word-break: break-word; }
  table.criteria th { background: #eee; font-size: 8pt; padding: 0.6mm 1mm; }
  table.criteria td.mark { width: 15%; font-weight: bold; }
  .rule-line { margin: 0.6mm 0 1mm 0; }
  .target-columns { display: flex; gap: 2.5mm; }
  .target-col { width: 33.3%; }
  table.target th { background: #eee; font-size: 7.8pt; padding: 0.5mm 1mm; }
  table.target td.code { width: 13%; font-weight: bold; white-space: nowrap; }
  table.target td { font-size: 7.6pt; line-height: 1.1; }
  .footnotes { margin-top: 1mm; font-size: 7.3pt; color: #222; line-height: 1.25; }
  .footnotes div { margin-bottom: 0.6mm; }
  .basis-line { margin-top: 1.5mm; font-size: 7.2pt; color: #555; border-top: 0.3pt solid #999; padding-top: 1mm; }
</style>
</head>
<body>
<div id="scale-root">
  <div class="header">
    <h1>방글라데시 데이터 지도표출 후보(전수검토)</h1>
    <span class="date">${REVIEW_DATE}</span>
  </div>
  <div class="result-line">□ 검토 결과: 제공 ${deliveredCodes.size}개 → 기준 충족 ${meetsCriteria.length}개* · 지도 제외 ${excluded.length}개 / 미제공 ${notProvided.length}개</div>
  <div class="result-note">※ 기준목록 ${allCodes.length}개 대비 정상 엑셀 ${deliveredCodes.size}개 전수 검토. *보류 ${held.length}건 포함(등록 후보 ${registered.length} + 보류 ${held.length}) — 미제공은 제외 판정과 구분함.</div>

  ${htmlCriteriaTable()}
  <div class="rule-line">${escapeHtml(RULE_LINE)}</div>

  <div class="section-title">□ 지도 대상: 코드 · 대상 데이터 · 지도에서 확인할 내용 (선정 요소 내 기준 충족 자료에 한정, * = 보류)</div>
  ${htmlTargetColumns()}

  <div class="footnotes">
    <div>ㅇ (표출 범위) 좌표가 확인된 행만 사용. A-024(송전선)는 구간 대표점(중간 정점), A-028(하천·수로)은 시작점만 제공되어 실제 노선이 아니며, 지도에는 대표점·시작점으로 실제 경로와 구분해 표기함. A-024·A-028 다운로드는 지표 메타(ODbL 1.0, download_allowed=불가)에 따라 제공하지 않음(표출은 공개 결정 2026-09-29에 따름). 기관 주소를 사업지역으로 전용하지 않음.</div>
    <div>ㅇ (유의사항) 보류 ${held.length}건 — ${holdNoteLineHtml}. A-023: "Gopalganj" 발전소 좌표 1건이 동명의 인도 비하르주 Gopalganj 부근을 가리켜 지도 표시에서만 제외(좌표는 고치지 않음), 56건 표시. E-006: 좌표 16건 중 국내 9건만 표시, 해외 본사 7건은 원자료에 남아 있으나 표시 범위 밖.</div>
    <div>ㅇ (차이 — 베트남 71개 대비) D 카테고리 26개(D-001~D-026) 전체 미제공. 베트남 선정분 중 방글라데시에서 이어지지 않은 항목: ${escapeHtml(VNM_UNREGISTERED_CODES.join('·'))}(사유는 검토표 참조). 신규 보류 추가: ${escapeHtml(NEW_HOLD_NOT_IN_VNM.join('·'))}(베트남 71개엔 없음).</div>
    <div>ㅇ (미제공) ${notProvidedD.length}개(D-001~D-026) + ${escapeHtml(notProvidedOther.join('·'))}(${notProvidedOther.length}개) = 총 ${notProvidedList.length}개. 선정 ${meetsCriteria.length}개는 지도 등록 수가 아니다(등록은 승인 후 B2). 좌표가 없는 행에 좌표를 만들지 않는다 — 지명·주소만 있는 C-016·E-002는 보류.</div>
  </div>
  <div class="basis-line">검토근거: reports/v158/bgd-map-evidence-v158.json의 시트·행수·좌표·라이선스 근거 | 항목별 상세: reports/v158/bgd-map-candidates-review-v158.csv | 외부 원문·현행성 검증은 포함하지 않음.</div>
</div>
</body>
</html>
`;

fs.mkdirSync(path.dirname(HTML_TMP_PATH), { recursive: true });
fs.writeFileSync(HTML_TMP_PATH, html, 'utf8');

function countPdfPages(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const text = buffer.toString('latin1');
  const match = text.match(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/);
  return match ? Number(match[1]) : null;
}

// A4 landscape is 297mm (wide) x 210mm (tall) - the *height* available for
// content is the 210mm side, not 297mm. CSS px are 96 per inch (25.4mm).
const MM_PER_PX = 25.4 / 96;
const PAGE_WIDTH_MM = 297;
const PAGE_HEIGHT_MM = 210;
const MARGIN_TOP_BOTTOM_MM = 10;
const MARGIN_LEFT_RIGHT_MM = 12;
const CONTENT_WIDTH_PX = Math.round((PAGE_WIDTH_MM - 2 * MARGIN_LEFT_RIGHT_MM) / MM_PER_PX);
const CONTENT_HEIGHT_PX = Math.round((PAGE_HEIGHT_MM - 2 * MARGIN_TOP_BOTTOM_MM) / MM_PER_PX);

async function renderPdf() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // The viewport must match the printable content width, or on-screen text
    // wrapping (which is what scrollHeight below measures) will not match
    // what Chromium actually paginates into the PDF.
    await page.setViewportSize({ width: CONTENT_WIDTH_PX, height: CONTENT_HEIGHT_PX });
    await page.goto('file://' + HTML_TMP_PATH.replace(/\\/g, '/'));

    // Shrink the whole page with CSS zoom (which reflows, unlike `transform`)
    // until the content fits one A4-landscape page. Table cells carry their
    // own explicit font-size in the stylesheet, so scaling body font-size
    // alone would not touch them - zoom scales the rendered layout itself.
    // scrollHeight is measured in the element's own pre-zoom coordinate space
    // and does not shrink when zoom is applied; getBoundingClientRect() is
    // viewport-relative (post-zoom) and does, so it is the one to compare
    // against the page height budget.
    const measure = async () =>
      page.evaluate((pageHeightPx) => {
        const root = document.getElementById('scale-root');
        return { height: root.getBoundingClientRect().height, pageHeightPx };
      }, CONTENT_HEIGHT_PX);

    let zoom = 1;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const { height, pageHeightPx } = await measure();
      if (height <= pageHeightPx) break;
      zoom -= 0.03;
      if (zoom <= 0.4) break; // do not shrink into illegibility
      await page.evaluate((z) => {
        document.getElementById('scale-root').style.zoom = String(z);
      }, zoom);
    }
    const final = await measure();
    console.log(`layout fit: zoom=${zoom.toFixed(2)} height=${Math.round(final.height)}px page=${Math.round(final.pageHeightPx)}px`);

    fs.mkdirSync(path.dirname(PDF_OUT_PATH), { recursive: true });
    await page.pdf({
      path: PDF_OUT_PATH,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '12mm', right: '12mm' },
    });
  } finally {
    await browser.close();
  }
}

renderPdf()
  .then(() => {
    const pageCount = countPdfPages(PDF_OUT_PATH);
    console.log(`wrote ${PDF_OUT_PATH} (page count check: ${pageCount})`);
    if (pageCount !== 1) {
      throw new Error(`expected a 1-page PDF, got page count ${pageCount}`);
    }
  })
  .catch((err) => {
    console.error('PDF render failed:', err);
    process.exitCode = 1;
  });
