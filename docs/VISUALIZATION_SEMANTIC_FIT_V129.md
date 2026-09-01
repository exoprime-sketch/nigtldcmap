# Vietnam V129 시각화 의미 적합성

## 목적

이 문서는 베트남 공개 데이터 152개 요소가 데이터의 측정 의미를 훼손하지 않는 시각화 또는 상태 안내에 연결됐는지 판정하는 기준을 기록한다. 새 데이터 요소를 만들거나 원자료 값을 보정하는 문서가 아니다.

## 단일 기준 자산

감사는 다음 공개 자산을 element ID로 결합한다.

- `public/data/vietnam/v2/manifest.json`
- `public/data/vietnam/v2/catalog.json`
- `public/data/vietnam/v2/framework-coverage.json`
- `public/data/vietnam/v2/semantic/element-visualization-contracts-v125.json`
- `public/data/vietnam/v2/semantic/semantic-integrity-v125.json`
- `public/data/vietnam/v2/interpretation/indicator-interpretation-v129.json`
- `public/data/vietnam/v2/map-index.json`
- V128 공개 제목과 상태가 확정된 `reports/v128/vietnam-data-release-acceptance-v128.json`

결과는 다음 두 파일에 동일한 152개 행으로 기록한다.

- `reports/v129/visualization-semantic-fit-v129.csv`
- `reports/v129/visualization-semantic-fit-v129.json`

## 판정 값

`visualizationFitResult`는 다음 중 하나다.

- `fit`: 측정값, 단위, 분류와 시각화가 직접 일치한다.
- `fit-with-caveat`: 결측, 방법론 변화, 집계 공간단위 또는 해석 방향을 공개 설명과 selector로 분리했다.
- `specialized-required`: 공통 archetype으로 의미를 지킬 수 없어 검증된 전용 renderer를 사용한다.
- `status-only`: 실제 값이 없어 상태와 수집 방향만 표시하며 차트를 만들지 않는다.
- `fail`: 공개 전에 수정해야 하는 의미 손실이나 비교 오류가 있다.

앞의 네 상태는 수용 상태이며 `fail`만 release blocker다.

## 실패 조건

다음은 자동으로 실패한다.

1. catalog 요소 또는 시각화 계약 누락
2. 값이 있는 요소의 `status-only` 연결 또는 값이 없는 요소의 가짜 차트
3. 지수·점수·등급·순위·시나리오 등 비직관 지표의 승인된 공개 설명 누락
4. 해석 방향 또는 적용 가능한 척도 누락
5. 서로 다른 분모를 한 selector/축에 동시에 표시
6. 방법론이 다른 값을 구분 차원 없이 한 연속 계열로 연결
7. 공간 집계 수준이 다른 값을 직접 지역값으로 비교
8. 포함관계가 있는 구성비 항목의 중복 합산
9. 결측값을 0으로 대체하는 계약
10. 실제 데이터가 있는데 의미 없는 KPI만 표시
11. 지도 variable label·unit과 공개 해석의 불일치
12. 사용자용 제목·설명에 내부 기술 토큰 노출

## 비교 안전장치

모든 공통 계약은 동일 measure, unit, dimension, period일 때만 비교하도록 제한한다. 시계열은 `seriesKey`별로 연결하고 단위별 축을 분리한다. 구성비는 원자료 백분율을 임의 재정규화하지 않는다.

특히 다음 보정을 검증한다.

- A-001: 2011년 이전 0–10 척도와 이후 0–100 척도를 별도 measure와 고정 척도로 구분한다.
- A-005: 제조업은 광공업·건설의 부분집합이므로 100% 구성 막대에서 중복하지 않고 원자료 표에 별도 표시한다.
- B-013: 2022년 단면 자료를 비교형 renderer로 표시하고 `detail`을 한 번에 하나만 선택해 GDP 대비 비중과 산출액 대비 비중을 같은 축에 섞지 않는다.
- D-005: 총 기후변화 지출 88/2/10 구조와 다른 예산 분모를 전용 화면에서 분리하며 선형 추세나 0 대체를 만들지 않는다.
- D-010: measure를 단위별로 선택하고 `category`를 한 번에 하나만 선택해 GDP 비중, 연료 구성비, 총액, 리터당 효율가격을 같은 축에 섞지 않는다.
- B-021: GDL 6개 권역값을 성·시에 연결했다는 집계 수준을 명시하며 63개 반복 성값으로 순위를 계산하지 않는다.

## 해석 coverage

자동 탐지는 공개 제목과 measure의 지수, 점수, 등급, 순위, 취약성, 준비도, 거버넌스, 집약도, 시나리오, 전망 표현 및 score-like unit을 검사한다. 실제 값이 없는 상태 요소는 임의 점수 설명을 만들지 않지만, TRL처럼 상태 자체의 의미를 이해해야 하는 경우 명시적 설명을 둔다.

대표 gate는 A-001, A-002, A-008, A-013, A-014, B-021, C-019, D-005, E-007, E-014가 모두 `explanationRequired=true`이고 공개 설명·방향이 완전한지 별도로 검사한다.

## V129 최종 결과

- framework/accounted: 152/152
- visualization fit: 152/152
- `fit`: 75
- `fit-with-caveat`: 69
- `specialized-required`: 3
- `status-only`: 5
- `fail`: 0
- specialized renderer: A-002, D-005, E-012
- required interpretation entries: 59/59
- inappropriate trend: 0
- mixed denominator axis: 0
- map variable/unit mismatch: 0
- zero imputation: 0

## 재실행

```bash
npm run audit:semantic-fit:v129
```

감사는 매번 CSV와 JSON을 결정론적으로 다시 생성하고, 공개 registry와 실제 production DOM의 분모 selector 동작을 함께 확인한다. 결과 행이나 PASS를 수동으로 고정하지 않는다.
