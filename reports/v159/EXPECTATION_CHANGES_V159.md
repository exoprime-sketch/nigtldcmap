# V159 기대값 변경 기록

CLAUDE.md 규칙(기대값 변경은 사유를 reports에 기록)에 따른 목록.

| 날짜 | 위치 | 이전 | 이후 | 사유 |
|---|---|---|---|---|
| 2026-09-24 | `src/data/visualization/publicVisualizationContractV153.test.ts` `STATUS_IDS` | 고정 5개(C-020·C-021·C-023·E-011·E-013) | 유형 JSON의 ⓪(U0) 행에서 읽음 → 7개(+E-016·E-017) | 명세 v2 §4에서 E-016·E-017이 '제외(사용자 0923)'로 ⓪ 상태 안내에 배정됨. 계약 행을 상태 안내로 바꿨고(`reports/v159/contract-typology-alignment.md`), 상태 화면 목록의 정본을 유형 JSON 하나로 모음 |
| 2026-09-24 | `scripts/v140/role-split-qa-v140.mjs` `DETAIL_A002_TITLE` | 홈 카드 제목 또는 `/거버넌스.*WGI/` 문자열 | `datasetSpecV159.json`의 platformName에서 출처 줄을 뗀 이름(= baseName) | 명칭 규칙 V159(출처 윗줄 + 원데이터명), 승인 2026-09-23. 같은 규칙으로 152개 상세 제목 전수 검사 `DETAIL_TITLES_FOLLOW_SPEC_V159`를 추가 |
| 2026-09-24 | `FINDER_TITLES_EQUAL_HOME` | (검사 불변) | 홈 추천 카드 제목을 코드에서 원데이터명으로 맞춤 | 같은 명칭 규칙 |
| 2026-09-24 | `scripts/v140/analysis-qa-v140.mjs` ⓪ 요소 판정 | ⓪ 7요소(C-020·C-021·C-023·E-011·E-013·E-016·E-017)도 cardValueVerified·analysisFit·detailAnalysisFit로 판정 | `datasetTypologyV159.json` displayType ⓪ 요소는 statusNoticePresent(1순위 섹션에 안내 1개, 결정·사유·결정일 3줄 표시)·chartCount0(1순위 섹션 SVG 0)·cardShowsStatus(데이터 찾기 카드에 값 없이 상태 배지) 3개로 판정. 그 외 요소 판정 불변, 기준선(41) 불변 | 제외·미입고 결정 2026-09-23, ⓪ 템플릿 |
| 2026-09-29 | `src/data/spec/datasetTypologyV159.test.ts` 유형 집합 | U0~U6(7종 이하) | U1~U6(6종 이하), 카드 명세 `statusNotice` 일치 검사 추가 | 명세 v8: ⓪(상태 안내) 유형 폐지 — 자료 없는 요소도 U1~U6 유형을 두고 화면에서만 '데이터 준비 중' 안내(`statusNotice`) |
| 2026-09-29 | `publicVisualizationContractV153.test.ts` `STATUS_IDS` · `analysis-qa-v140.mjs` `STATUS_IDS_V159` · `typology-qa-v159.mjs` 상태 판정 | 유형 JSON displayType ⓪ 행 | 유형 JSON `statusNotice` 있는 행(현재 C-020·C-021·C-023·E-011·E-013, 5개 — 대상 집합 불변) | 같은 명세 v8. 판정 내용(안내 1개·결정·사유·결정일 3줄·차트 0·카드 상태 배지)과 analysis QA 기준선(41) 불변. 카드·안내 문구는 '미입고' → '데이터 준비 중' |
| 2026-09-29 | `scripts/v159/align-contract-typology-v159.mjs` 호환표 | U0 → status-note 행 | U0 행 삭제, `statusNotice` 행은 판정 `status-notice`로 따로 셈 · ③+S4+registry+1순위 category-bar를 일치로 판정(E-008) | 명세 v8: E-008 ③S4 '개체 144건 = 문헌 1건 1행, 기술 분야별 건수 비교' — 계약 1순위(건수 막대)가 명세 설명과 같음. 그 외 조합 판정 불변(E-016 불일치 1건 그대로 보고) |
| 2026-09-29 | `src/components/data/templates/templateVariantsV159.ts` | research-patent는 U1 변형, A-017·E-008 변형 미등록(⓪ 시절) | research-patent는 U3 변형, A-017(lcoe-range)·E-008(research-patent) 재등록 | 제외 해제(2026-09-29) 후 두 요소가 범용 화면으로 떨어져 1순위가 계약과 달랐음(typology QA firstBlock 실패). 명세 v8에서 E-008이 ③으로 이동 |
| 2026-09-29 | `src/data/structure/decisionPointsV159.test.ts` | "U0 always returns no points" | 삭제 | U0 유형 없음. 안내 화면의 판단 포인트 숨김은 `CountryDataElementPage`의 `statusNotice` 조건과 typology QA가 계속 검사 |
