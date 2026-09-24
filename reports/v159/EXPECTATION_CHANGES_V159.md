# V159 기대값 변경 기록

CLAUDE.md 규칙(기대값 변경은 사유를 reports에 기록)에 따른 목록.

| 날짜 | 위치 | 이전 | 이후 | 사유 |
|---|---|---|---|---|
| 2026-09-24 | `src/data/visualization/publicVisualizationContractV153.test.ts` `STATUS_IDS` | 고정 5개(C-020·C-021·C-023·E-011·E-013) | 유형 JSON의 ⓪(U0) 행에서 읽음 → 7개(+E-016·E-017) | 명세 v2 §4에서 E-016·E-017이 '제외(사용자 0923)'로 ⓪ 상태 안내에 배정됨. 계약 행을 상태 안내로 바꿨고(`reports/v159/contract-typology-alignment.md`), 상태 화면 목록의 정본을 유형 JSON 하나로 모음 |
| 2026-09-24 | `scripts/v140/role-split-qa-v140.mjs` `DETAIL_A002_TITLE` | 홈 카드 제목 또는 `/거버넌스.*WGI/` 문자열 | `datasetSpecV159.json`의 platformName에서 출처 줄을 뗀 이름(= baseName) | 명칭 규칙 V159(출처 윗줄 + 원데이터명), 승인 2026-09-23. 같은 규칙으로 152개 상세 제목 전수 검사 `DETAIL_TITLES_FOLLOW_SPEC_V159`를 추가 |
| 2026-09-24 | `FINDER_TITLES_EQUAL_HOME` | (검사 불변) | 홈 추천 카드 제목을 코드에서 원데이터명으로 맞춤 | 같은 명칭 규칙 |
