# 공개 시각화 벤치마크 정책 V132

## 목적과 범위

이 정책은 베트남 공개 데이터 152개 요소를 사용자가 가장 유용한 순서와 형태로 해석하도록 시각화를 선택하는 기준을 정의한다. 벤치마크는 외부 플랫폼의 시각 디자인을 복제하는 용도가 아니라, 동일한 성격의 데이터를 어떤 분석 구조로 제공하는지 검증하는 참고 기준이다.

새 데이터나 가공값을 만들지 않으며, V130의 공간 의미 계약과 V131의 공개 명칭 정책을 단일 출발점으로 삼는다.

## 공식 벤치마크

| 데이터 유형 | 공식 참고 플랫폼 | 적용하는 분석 구조 |
|---|---|---|
| 국가 지표·시계열 | [World Bank DataBank / WDI](https://databank.worldbank.org/reports.aspx?source=2) | 핵심 현황, 연도별 추이, 툴팁, 표·다운로드 |
| 에너지·구성 | [Our World in Data – Energy Mix](https://ourworldindata.org/energy-mix) | 절대량 구성 변화, 100% 비중 변화, 선택 연도 상세 |
| 온실가스 구성 | [WRI Climate Watch Historical Emissions](https://www.wri.org/data/climate-watch-historical-emissions-data-countries-us-states-unfccc) | 총량 추이, 가스·부문 구성, 최신 구성 |
| 기후·전망 | [World Bank CCKP](https://climateknowledgeportal.worldbank.org/) | 변수, 시나리오, 기간, 공간단위 선택과 범위·추이 |
| 산림 | [Global Forest Watch](https://www.globalforestwatch.org/) | 지도와 연결된 시계열, 최신 요약, 지역 선택 |
| 논문·특허 | [WIPO IP Statistics](https://www.wipo.int/en/web/ip-statistics/index) | 연간 추이, 유형·기술·기관·협력 구성, 필터 가능 목록 |
| 사업·재원 | [World Bank Projects](https://projects.worldbank.org/en/projects-operations/projects-home) / [d-portal](https://docs.d-portal.org/) | 사업 수·금액, 연도 추이, 분야·기금·기관 구성, 검색·필터 |

## 선택 우선순위

1. 사용자가 데이터로 답할 수 있는 핵심 질문을 먼저 정의한다.
2. 실제 measure, dimension, unit, year 구조와 일치하는 주 시각화를 선택한다.
3. 보조 시각화는 주 분석에서 사라진 비교·구성·공간 차원만 보완한다.
4. 원자료 표와 개별 목록은 분석 요약 뒤에 배치한다.
5. 데이터가 없는 5개 요소는 상태만 안내하고 가짜 차트를 만들지 않는다.

## 공통 의미 안전장치

- 시계열 데이터의 주 화면을 최신연도 단면값만으로 대체하지 않는다.
- 단위가 다른 계열을 하나의 축에 섞지 않는다.
- 서로 다른 분모·방법론·공간단위의 값을 하나의 연속 추이로 연결하지 않는다.
- 총계는 구성 항목에 중복 포함하지 않고 별도 KPI 또는 total line으로 표시한다.
- 포함관계가 있는 항목을 독립된 100% 구성요소처럼 합산하지 않는다.
- 결측을 0으로 바꾸거나 원천에 없는 계열·분류·제목을 만들지 않는다.
- 분류 selector, 범례, tooltip, 표에서 공개 명칭과 단위를 동일하게 유지한다.

## V132 핵심 적용

### A-016 1차 에너지 소비구조

최신 핵심현황 뒤에 절대량 stacked area와 100% 구성비 변화를 주 분석으로 제공한다. 석유, 천연가스, 석탄, 원자력, 수력, 기타 재생에너지만 구성요소로 사용하고, `1차에너지 공급 총계`는 KPI/total line으로 분리한다. 선택 연도 가로 막대는 보조 분석으로 둔다.

### Composition 계열

비교 가능한 연도가 3개 이상이면 연도별 변화가 주 분석이다. 절대값은 stacked/grouped trend, 비중은 100% stacked/share trend를 사용한다. 단일연도이거나 비교 가능한 기간이 부족할 때만 선택 연도 구성을 주 분석으로 사용한다.

### A-010·A-011 온실가스 구성

동일 단위의 구성계열만 한 축에서 비교한다. 총계는 모든 구성계열이 제공된 연도에서만 산출하고 산출값임을 명시한다. A-010의 원가스 질량 `Gg` 계열은 온난화 영향이 서로 다르므로 합산하거나 구성비로 만들지 않는다. 주 화면은 산출 총계 추이, 가스·부문별 추이, 최신연도 구성 순서다.

### E-008 논문·특허

논문 수, 특허 수, 최신연도, 기관 범위 KPI와 연도별 추이를 먼저 표시한다. 기술·연구분야, 협력 형태, 협력국, 기관 구성을 보조 분석으로 제공한 뒤 검색·유형·연도·분야 필터와 페이징이 있는 개별 목록을 배치한다. 원천 제목이 없으면 V131 명칭 정책에 따라 공개 사실의 조합으로만 식별하며 가짜 제목을 만들지 않는다.

### 사업·재원·기업 포트폴리오

개별 카드 목록보다 사업 수, 공개 금액, 연도별 레코드, 분야·기금 구성을 먼저 배치한다. 카드는 V131 제목 resolver와 공개 field whitelist를 사용하며, 긴 note와 기술 추적정보는 기본 목록에 전달하지 않는다.
요약 뒤 목록은 검색·연도·분야/기금 filter와 pagination을 제공하며, V132 공개 분석은 요소별로 검토된 whitelist 이외의 normalized attribute를 읽지 않는다.

### 지도와 추이 연결

A-023 발전소는 V131 공개 제목 resolver를 공통 사용하고, 원천명이 없을 때 발전원·용량으로 식별한다. B-033은 선택한 성·시의 2001∼2025년 산림손실 추이가 있을 때만 지도 선택 내용과 즉시 연결한다. 단일연도 자료는 추세처럼 연결하지 않는다. V130의 12개 레이어, 2,900개 feature/scope, regional-scope, cross-layer dedup 계약은 변경하지 않는다.

## 최종 계약과 증거

각 element의 최종 계약은 핵심 공개 질문, 주·보조 시각화, selector, 기간·단위·지도·목록 행동, 벤치마크, runtime 검증 결과를 포함한다.

- `reports/v132/external-visualization-benchmark-v132.csv`
- `reports/v132/element-visualization-runtime-review-v132.csv`
- `reports/v132/final-public-visualization-contract-v132.csv`
- 동일 내용의 JSON 보고서

`runtimeVerified=true`는 계약 문구만 존재한다는 뜻이 아니라 production route에서 주 분석, 원자료·목록 순서, 출처·다운로드, 상태 안내를 실제 DOM으로 검증했음을 의미한다.
