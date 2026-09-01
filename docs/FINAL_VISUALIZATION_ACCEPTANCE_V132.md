# 최종 시각화 수용 결과 V132

## 수용 범위

V132 수용 검사는 framework/accounted element 152개 전체의 지정 renderer와 production runtime의 첫 분석 화면을 대조한다. 주·보조 시각화, measure, dimension, unit, year, selector, 해석, 지도 연결, 목록·표 순서, 출처와 다운로드를 같이 검사했다.

원자료 149개, 데이터 요소 152개, V130 지도 12개 레이어·2,900개 feature/scope, V131 공개 명칭·카드 계약을 회귀 기준으로 삼았다.

## 최종 결과

| 항목 | 결과 |
|---|---:|
| Framework elements | 152 |
| Accounted elements | 152 |
| Runtime visualization verified | 152/152 |
| Representative route/viewport checks | 105/105 |
| External benchmark types | 7 |
| Trend data without trend visual | 0 |
| Composition without time analysis | 0 |
| Total included as component | 0 |
| Mixed-unit axis | 0 |
| Portfolio list before summary | 0 |
| Research list before analysis | 0 |
| Status-only fake visualization | 0 |
| Map layers | 12 |
| Map feature or scope count | 2,900 |
| Map placeholder primary title | 0 |
| Map tooltip missing key facts | 0 |
| Remaining blocker | 0 |

## 대표 수용 항목

### A-016

- 427개 공개 관측값, 61개 연도, 6개 에너지 구성 계열과 61개 총계 계열을 대조했다.
- 절대량 변화, 100% 구성비 변화, 선택 연도 상세가 순서대로 노출된다.
- 총 1차 에너지 공급량은 stack 구성요소에서 제외되고 별도 KPI/total line으로 표시된다.
- 범례 toggle, 툴팁, 연도 범위, 단위, 출처, 반응형 표시를 검증했다.

### E-008

- 핵심 KPI → 논문·특허 연도별 추이 → 분야·협력·기관 구성 → 개별 목록 순서를 검증했다.
- 개별 목록은 검색, 유형, 연도, 분야 필터와 pagination을 제공한다.
- 원천 제목이 없는 레코드에 가짜 제목을 생성하지 않고 확인된 공개 사실로 식별한다.

### A-010·A-011

- A-010은 `Mt CO₂eq`와 `Gg`를 selector와 축으로 분리하고, 4개 환산계열이 모두 존재하는 35개 연도에만 산출 총계를 표시한다.
- A-011은 9개 부문이 모두 존재하는 55개 연도에만 산출 총계를 표시한다.
- 산출 총계, 가스·부문 추이, 최신 구성 순서를 적용하고 결측을 0으로 대체하지 않는다.

### 사업·재원·기업

- portfolio renderer와 D-012를 포함한 19개 요소를 검사했고, entity가 있는 18개 요소의 요약과 목록 순서를 production DOM에서 확인했다.
- 사업 수, 금액, 연도, 분야·기금 구성이 개별 카드보다 먼저 나온다.
- 검색·연도·분야/기금 필터와 12건 단위 페이지 이동을 제공한다.
- V131의 의미 있는 제목과 요소별로 검토된 공개 field whitelist를 유지한다.

### 지도

- A-023 tooltip과 선택 패널에 발전소명 또는 발전원·용량 기반 공개 제목, 발전원, 용량, 상태, 자료연도를 표시한다.
- B-033 지역 선택 시 해당 지역의 2001∼2025년 산림손실 시계열과 접근 가능한 표를 함께 제공한다.
- V130의 regional-project 범위, D-023 중복 제거, 12개 레이어·2,900개 feature/scope를 유지한다.

## 자동 검증

```text
npm run audit:visualization-runtime:v132
npm run audit:composition:v132
npm run audit:portfolio-analysis:v132
npm run audit:map-tooltip:v132
npm run audit:benchmark-fit:v132
npm run finalize:v132
```

각 audit는 검사 규칙을 상수 PASS로 만들지 않고 공개 asset, 실제 소스 계약, production route DOM과 network/console 결과를 대조한다.

## 증거

- `reports/v132/external-visualization-benchmark-v132.csv`
- `reports/v132/element-visualization-runtime-review-v132.csv`
- `reports/v132/final-public-visualization-contract-v132.csv`
- `reports/v132/benchmark-fit-audit-v132.json`
- `reports/v132/composition-audit-v132.json`
- `reports/v132/portfolio-analysis-audit-v132.json`
- `reports/v132/map-tooltip-audit-v132.json`
- `reports/v132/visualization-runtime-audit-v132.json`
- `reports/v132/screenshots/`

## 회귀 동결

- V130: 공간 범위가 검증된 12개 지도 레이어, 2,900개 feature/scope, regional-scope, cross-layer dedup을 유지한다.
- V131: placeholder primary title 0, blank primary title 0, 공개 entity 제목 resolver와 카드 정보 우선순위를 유지한다.
- framework/accounted 152/152와 status-only 5개의 무-가짜-시각화 원칙을 유지한다.

최종 수용 조건은 production build PASS, console application error 0, broken asset 0, HTML-for-JSON 0, remaining blocker 0이다.
