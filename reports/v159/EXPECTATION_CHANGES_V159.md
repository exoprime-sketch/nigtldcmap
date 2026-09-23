# V159 기대값 변경 기록

CLAUDE.md 규칙(기대값 변경은 사유를 reports에 기록)에 따른 목록.

| 날짜 | 위치 | 이전 | 이후 | 사유 |
|---|---|---|---|---|
| 2026-09-24 | `src/data/visualization/publicVisualizationContractV153.test.ts` `STATUS_IDS` | 고정 5개(C-020·C-021·C-023·E-011·E-013) | 유형 JSON의 ⓪(U0) 행에서 읽음 → 7개(+E-016·E-017) | 명세 v2 §4에서 E-016·E-017이 '제외(사용자 0923)'로 ⓪ 상태 안내에 배정됨. 계약 행을 상태 안내로 바꿨고(`reports/v159/contract-typology-alignment.md`), 상태 화면 목록의 정본을 유형 JSON 하나로 모음 |
