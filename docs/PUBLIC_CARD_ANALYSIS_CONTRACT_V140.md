# 공개 카드·상세 분석 계약 (V140)

카드는 핵심 결과를 요약하고, 상세는 같은 데이터의 기간·지역·항목을 바꾸며 비교·분석하는 화면이다. 두 화면은 같은 선택 모델(`DataFinderSelectorStateV125`: measure·year·period·dimensions)을 쓰며, 카드가 요약한 선택을 상세에 그대로 넘긴다.

## 계약 파일

| 파일 | 내용 |
| --- | --- |
| `scripts/v140/card-model-v140.mjs` | 팩·semantic 계약을 읽어 상세 화면과 같은 행 모델(측정항목·차원·연도)을 만드는 공통 로더. 기본 측정항목 규칙은 상세(`SemanticArchetypePreviewV125`)와 같다(검토된 기본값 → 첫 번째 값 있는 측정항목) |
| `scripts/v140/build-card-summaries-v140.mjs` | 152개 요소의 카드 요약 생성기. 요소별 규칙(`OVERRIDES`, `ENTITY_RULES`, `COMPOSITION_ALLOWED`, `REGIONAL_LAYERS`, `REGION_SCENARIO`)을 코드에 명시 |
| `public/data/vietnam/v2/home/card-summaries-v140.json` | 152개 요소별 `kind`·`headline`(값·산출 규칙)·`preview`·`period`·`provider`·`selection`(상세로 넘기는 선택)·`basis`(집계 단위·계산 규칙)·`provenance`(팩 경로·행 수·지표 ID)·원천 해시 |
| `reports/v140/card-summaries-review-v140.md` | 152행 검토표(종류·핵심값·설명·자료기간·집계 규칙) |
| `public/data/vietnam/v2/home/home-preview-v139.json` | 홈 8개 카드. `selection`을 포함하며 finder 카드는 이 8개를 그대로 복사 |

## 카드 종류와 선택 규칙

| kind | 조건 | 요약 방식 |
| --- | --- | --- |
| line | 대표 계열에 연도 3개 이상 | 최신값 + 연도별 선 |
| level | 연도 1~2개 | 값만, 추이를 그리지 않음 |
| composition | 허용 목록(A-010·A-011·A-016·D-005·D-023)의 배타적 구성 | 최대 부분 + 구성 띠 |
| bars | 범주 비교(기술·부문·시나리오·기금·유형 등) | 최대 항목 + 가로 막대(상위 6) |
| spatial | 63개 성·시 값(관측 또는 지역 레이어) | 최대 성·시 + 상위 5 + 중앙값·10~90분위, 합산하지 않음 |
| spatial-trend | 성×시나리오×연도(B-003~B-007) | 63개 성·시 중앙값 추이(SSP2-4.5 또는 관측), 과거 모형과 전망 구간을 잇지 않음 |
| facts | 등록부·문서(정책·기관·사업) | 집계 단위(문서·기관·사업·관측지점) 수와 대표 항목 |
| status | 값 없는 5개(C-020·C-021·C-023·E-011·E-013) | 제공 상태 문구만, 수치·그래프 없음 |

대표 지표: 검토된 기본 측정항목(`publicVisualizationRegistryV126.ts`의 `PUBLIC_DEFAULT_MEASURE_KEYS_V127`; V140에서 A-003 GDP 총액, B-021 GVI 취약성 지수, C-016 집중형 태양광, B-034 순플럭스 추가) → 없으면 상세와 같은 첫 번째 값 있는 측정항목. 계열은 총액·전체 계열을 우선하고, 없으면 연도가 가장 많은 계열.

`selection`에는 상세가 실제 선택지로 제공하는 차원만 넣는다(값이 1개인 차원, `technology` 제외). 연도로 쓰인 period는 year로 넘긴다.

## 상세 화면 진입 규칙

- 홈·finder 카드의 상세보기는 `openElement(elementId, "VNM", selection)`으로 선택을 넘긴다. URL(`measure`, `year`, `period`, `dim.*`)에 그대로 남아 공유 링크도 같은 화면을 연다.
- 성·시별 관측(B-031·B-032·B-033·B-034·C-016)은 `ProvinceSeriesAnalysisV140`: 항목 선택·지역 선택·기준연도/기간 → 지역 추이 → 같은 시점 성·시 비교(선택 지역 표시) → 표로 보기 → (C-016) 같은 지역·기간의 항목 비교. 합계는 C-016(계획 용량)에서만.
- A-023: 원천별(WRI/OSM) 시설 수·설비용량을 발전원별 표로, 합치지 않음. A-024: 2016년 실재 선로 606구간·23,608 km(전압별)와 개정 PDP8 목록 116행(기존 48·계획 68)을 분리.
- 공유 C 템플릿(C-009·C-010): 문서 단위 연대기(`DocumentTimelineV140`), 원천 링크 행은 해당 문서에 붙임, 문서 수는 카드와 같은 규칙.
- 포트폴리오 목록: 원천의 집계·설명 행을 목록 건수에서 분리, 필터 이름은 자료 유형별(업종·진출형태, 지원유형·지원기관, 기금·분야 등).

## 검증

- `node scripts/v140/analysis-qa-v140.mjs [--base-url URL] [--only IDs]` → `reports/v140/analysis-qa-v140-<label>.{json,md}`: 152개별 `screenLoaded`·`cardSummaryVerified`·`detailAnalysisFit`·`controlsVerified`·`tableValuesVerified`·`mapHandoffVerified`·`remainingIssue`·`evidence`.
- `npm run qa:role-split:v140` — 홈·finder·지도 역할 분리 52개 검사.
- 값이 있는 147개와 상태 안내 5개를 구분해 센다. `ready`만으로 semantic PASS를 대신하지 않는다.
