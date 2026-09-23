# 계약(V153) ↔ 유형(V159) 정합 보고

`scripts/v159/align-contract-typology-v159.mjs`가 생성. 계약 행에 `displayType`·`structure`를 유형 JSON에서 복사하고, V153 `archetype`을 표출 유형 호환표로 판정한다. 계약은 화면에 맞춰 고치지 않으며, 명세가 명시한 변경(⓪ 상태 안내)만 적용한다.

- 일치 140 · 자료 한계(전국값 대체) 8 · 결정 필요 4 · 불일치 0 / 152
- 적용한 계약 변경 2건

## 적용한 계약 변경

| ID | 이전(archetype / 1순위) | 이후 | 근거 |
|---|---|---|---|
| E-016 | (V153 계약) | status-note / status-note | 명세 v2 ⓪ 상태 안내(제외(사용자 0923)) |
| E-017 | (V153 계약) | status-note / status-note | 명세 v2 ⓪ 상태 안내(제외(사용자 0923)) |

## 결정 필요·자료 한계·불일치

| ID | 유형 | 구조 | archetype | 1순위 | 판정 | 설명 |
|---|---|---|---|---|---|---|
| B-002 | U2 | S2 | national-series | category-bar | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-008 | U2 | S3 | national-series | line | data-limited | 관측소 지점 계열이 1순위(전용 컴포넌트) — 지역 면 값 없음 |
| B-009 | U2 | S2 | national-series | line | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-014 | U6 | S1 | national-series | category-bar | review | 명세 변형 '표 전환'인데 계약 1순위는 category-bar — 결정 필요 |
| B-017 | U2 | S2 | national-series | table | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-024 | U2 | S2 | national-series | line | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-035 | U2 | S2 | national-series | line | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-036 | U2 | S2 | national-series | category-bar | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| B-037 | U2 | S2 | composition | table | data-limited | 지역 단위 값이 납품되지 않아 계약이 전국 계열을 1순위로 둠 — ② 템플릿은 전국값 대체 표시 |
| C-002 | U6 | S4 | national-series | category-bar | review | ⑥은 숫자 차트 금지 — 1순위 교체 여부 결정 필요 |
| C-019 | U6 | S4 | province-distribution | region-bar | review | ⑥은 숫자 차트 금지 — 적용지역 강조로 바꿀지 결정 필요 |
| E-008 | U1 | S1 | registry | category-bar | review | 국가 수준 유형인데 계약은 레코드 목록 — 요소 상태(제외(명세서 0918)) 확인 |

## 호환표

| 표출 유형 | 허용 archetype |
|---|---|
| U0 | status-note |
| U1 | national-series · composition · matrix |
| U2 | province-distribution · station · registry |
| U3 | national-series · composition · matrix |
| U4 | registry · station |
| U5 | registry · policy-document · province-distribution · national-series |
| U6 | policy-document · matrix |
