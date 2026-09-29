# 계약(V153) ↔ 유형(V159) 정합 보고

`scripts/v159/align-contract-typology-v159.mjs`가 생성. 계약 행에 `displayType`·`structure`를 유형 JSON에서 복사하고, V153 `archetype`을 표출 유형 호환표로 판정한다. 계약은 화면에 맞춰 고치지 않으며, 명세가 명시한 변경(상태 안내 — 명세 v8부터 유형은 유지하고 statusNotice로 판정)만 적용한다.

- 일치 138 · 상태 안내(데이터 준비 중 등) 5 · 자료 한계(전국값 대체) 8 · 결정 필요 0 · 불일치 1 / 152
- 적용한 계약 변경 3건

## 적용한 계약 변경

| ID | 이전(archetype / 1순위) | 이후 | 근거 |
|---|---|---|---|
| B-014 | (V153 계약) | national-series / table | 명세 v2 변형 '표 전환' — 시나리오별 추정치를 차트 없이 표로(결정 2026-09-24) |
| C-002 | (V153 계약) | policy-document / comparison-table | ⑥ 규칙 — 1순위 문서 카드, 부문별 배출량은 KPI 타일·표로 보조(차트 없음, 결정 2026-09-24) |
| C-019 | (V153 계약) | policy-document / comparison-table | ⑥ 규칙 — 1순위 제도 문서, 성·시별 시설 수는 KPI 타일·표로 보조(차트 없음, 결정 2026-09-24) |

## 결정 필요·자료 한계·불일치

| ID | 유형 | 구조 | archetype | 1순위 | 판정 | 설명 |
|---|---|---|---|---|---|---|
| B-002 | U2 | S2 | national-series | category-bar | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-008 | U2 | S3 | national-series | line | data-limited | 관측소 지점 계열이 1순위(전용 컴포넌트) — 지역 면 값 없음 |
| B-009 | U2 | S2 | national-series | line | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-017 | U2 | S2 | national-series | table | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-024 | U2 | S2 | national-series | line | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-035 | U2 | S2 | national-series | line | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-036 | U2 | S2 | national-series | category-bar | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-037 | U2 | S2 | composition | table | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| C-020 | U5 | S4 | status-note | status-note | status-notice | 데이터 준비 중 — 자료 입고 전까지 안내만 표시(유형은 유지) |
| C-021 | U5 | S4 | status-note | status-note | status-notice | 데이터 준비 중 — 자료 입고 전까지 안내만 표시(유형은 유지) |
| C-023 | U3 | S1 | status-note | status-note | status-notice | 데이터 준비 중 — 자료 입고 전까지 안내만 표시(유형은 유지) |
| E-011 | U1 | S1 | status-note | status-note | status-notice | 데이터 준비 중 — 자료 입고 전까지 안내만 표시(유형은 유지) |
| E-013 | U1 | S1 | status-note | status-note | status-notice | 데이터 준비 중 — 자료 입고 전까지 안내만 표시(유형은 유지) |
| E-016 | U3 | S1 | policy-document | comparison-table | mismatch | 호환표 밖 조합 |

## 호환표

| 표출 유형 | 허용 archetype |
|---|---|
| U1 | national-series · composition · matrix |
| U2 | province-distribution · station · registry |
| U3 | national-series · composition · matrix |
| U4 | registry · station |
| U5 | registry · policy-document · province-distribution · national-series |
| U6 | policy-document · matrix |
