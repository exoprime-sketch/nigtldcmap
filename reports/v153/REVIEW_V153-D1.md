# REVIEW V153-D1 — 상세보기 프레임 (feat/v153-d1-detail-frame)

## 변경

### 1순위 계약(152행)
- `src/data/visualization/publicVisualizationContractV153.json` + 로더 `publicVisualizationContractV153.ts`(`standardPrimaryTypesV153`·`orderBlocksV153`) · 문서 `docs/VISUALIZATION_CONTRACT_V153.md`(`scripts/v153/build-visualization-contract-docs-v153.mjs` 생성)
- 초안은 Sonnet 서브에이전트 2개가 `reports/v148/detail-and-map-review-152-v148.md`·카드 모델·map-index에서 작성, 메인이 152행 전수 판정. 집계: 표준 108 · 보존 11 · 예외 33 · 지도 옆 42 · 지도 보류 1(B-017)
- 예외 33행은 모두 사유를 가진다(단일 시점·2개년만 있어 추이선 불가 → 막대, 단위 상이 → 정렬표, 문장값 매트릭스 → 비교표·카드(히트맵 후속 P4), 자료 부재 → 안내 등). 계약을 화면에 맞춰 역작성하지 않았고, 축 **라벨 문구**만 데이터가 쓰는 표현으로 맞췄다(타입·단위는 표준·데이터 기준).
- 단위테스트 `publicVisualizationContractV153.test.ts` 10건(카탈로그 152 일치, 어휘·축 규칙, 유형 표준 vs 예외, 고정 집합, 정책·상태 숫자 차트 0, mapRole=map-index, orderBlocks, 프레임 판정, 핵심 수치 단위)

### 순서 강제·태깅
- 블록 태깅 `data-analysis-block`: 일반 렌더러 `VisualizationFrameV125` `block` prop(17곳)+직접 태그, 전용 컴포넌트 33개(worktree Sonnet 3개 병합: `4a216fc`·`14ba10a`·`be79c9d`), V153 4개는 루트 태그를 카드 단위로 이동
- 계약 순서: 일반 렌더러(정책 타임라인 vs 유형별 수, 선택 분류 추이 vs 비교), `ProvinceSeriesAnalysisV140`(지역 막대 먼저), `PublicRegionScenarioSummaryV138`, `PublicPortfolioSummaryV132`(분류별 수 먼저), 디렉터리·일반 개체(`EntityFacetCountsV153` 분류별 수 먼저), `InvestorNetworkSummaryV153`, `InfrastructureCoverageV147`, `ClimateBudgetAllocationAnalysisV129`, B-021
- 새 차트: `StackedAreaChartV153`(A-016에서 추출, A-016 불변) → `CompositionStackV153` A-010·A-011·A-018 1순위(절대량/비중 토글, 음수 계열은 누적 제외 표기) · `DumbbellChartV153` B-023(건기/우기 m³/s), B-025(유역 전체/베트남 내 km²) · A-010 CO₂e 판별 버그(V150 별칭) 수정
- 프레임 `DetailAnalysisFrameV153`: rank·flat·split 속성, `data-contract-verdict/axes`, 콘솔 `[v153-contract]` 경고(1.2초 후 지속 시). `ChartAxesV150`는 계약 축을 `data-contract-*`로 병기, 막대 프리미티브는 세로축 명사를 계약에서 받음(단위는 데이터)

### 레이아웃
- `CountryDataElementPage.tsx`: 핵심 수치 행(`DetailKpiStripV153`: 카드 헤드라인·자료기간/기준일·공개 관측값·목록 건수·지표 수, 상태 5개는 상태 1줄) → 분석(제목은 h1과 다를 때만) → 지도 슬롯(`mapSlot` prop, `DetailLocationMapV148` 불변) → 출처 1줄 + 이용조건 접힘(유의사항 포함) → 다운로드
- '자료 해석 안내' 삭제(텍스트 DOM 0, `PublicIndicatorMeaningV129` 미사용 표기), `sv125-intro` 제목 반복 제거, 자료 요약 1줄은 DOM 유지·비표시
- `src/styles/detail-layout-v153.css` 1개: ≥1024px `[1순위 | 지도(3:4)]` dense grid, <1024px order로 1순위 → 지도 → 나머지, 1순위 차트 min-height 320px, 320px 넘침 수정(선택기·카드 그리드), 타임라인 패널·목록 열 `minmax(0,1fr)`+본문 URL 줄바꿈(C-009/C-010 39px → 0)

### QA
- `scripts/v153/detail-contract-qa-v153.mjs`(`qa:detail-contract:v153`, `--ids`, CI analysis job 스텝) → `reports/v153/detail-contract-qa-v153.{json,md}`
- `scripts/v153/d1-screens-v153.mjs`: 대표 10개 × 6폭 스크린샷·넘침·판정 → `output/v153-d1/`
- `qa:analysis:v140`: `detailTilesAbsent` → `detailTilesBounded`(사유 `ANALYSIS_QA_EXPECTATION_CHANGE_V153.md`), 지도 슬롯이 primary 안으로 들어오면서 지도 자체 선택기·문구를 분석 컨트롤·텍스트에서 제외(이전과 같은 범위)

## 검증 결과(실행 성공 ≠ 내용 완성 구분)
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0(테스트 파일 jest 타입 경고 제외) |
| `npm run test:unit` | 257/257 (30 suites) |
| production 빌드(`CI=true`, sourcemap off) | 성공, lint 경고 0 |
| `qa:detail-contract:v153` 152개 | **152/152 통과**(primaryTypeMatch·rankOrder·axesMatch·blockHonesty·readingNotesAbsent·statusNoteNoChart·policyNoNumericChart·kpiRow·titleOnce·sourceLine·mapPlacement 42·overflow320·console) — 최종 빌드 재실행 결과는 아래 갱신 |
| 대표 10개 × 6폭(`d1-screens-v153`) | 60/60 ready·넘침 0·콘솔 0·판정 match, 스크린샷 `output/v153-d1/` |
| `qa:analysis:v140:baseline` | 1차: 필수 실패 42(기준선 41) — 새 실패 3건(A-024·B-012·C-012 `controlsVerified`)은 지도 슬롯의 자체 선택기가 분석 컨트롤로 잡힌 것 → 분석 QA에서 지도 슬롯 제외. 2차 게이트는 glossary 단계에서 멈춰 analysis QA까지 진행하지 못함(1차의 A-023 해소는 확인) |
| `finalize:v140` 전체 게이트 | 1차: `audit:entity-cards:v131` 1건 실패(E-006 — 투자자 목록 컴포넌트(D0)를 카드 그리드로 인식하지 못함 → 감사의 "기록이 다른 형태로 표시됨" 목록에 `investor-network-v153` 인식 추가, 임계값 불변)와 V134 `publicCopy` 상태 파일이 커밋된 옛 FAIL(2026-09-21 "build missing")이라 재생성 → 2차: entity-cards·publicCopy PASS, **`audit:glossary:v134` FAIL 1건(VISIBLE_ACRONYM_WITHOUT_GLOSSARY 35 토큰)** → 게이트 2회 반복 후 중단·보고. 이 35개 중 이 PR이 새로 노출한 토큰은 0개(출처 1줄이 원자료 출처 문자열을 그대로 보여 12개(지표 코드·AMBIGUOUS/CITATION 메모 등)를 노출했던 것은 카드 모델의 공개 제공기관 표기로 바꿔 해소). 나머지는 main에 이미 있던 것: D0(E-006 본부 국가코드 CHE·FRA·GBR·PHL·SGP·USA, DFI·PE·VC·LP, A-023 목록의 EVN·JSC·EL, C-012 ICT·LNG·M01·SSL·MPI, B-046/047 MCS·REO, SSP·VND 원문 노출 — D0 리뷰 빌드에서 동일 감사 23개 실패 재현)와 D3(C-008 설명의 AMD·COP21·COP23·FIA·GFANZ·ICO·IGES·IIED·IPG·IUCN·NYDF, C-009/010 GRDP·QH12 — D3는 전체 게이트를 돌리지 않았고 D0 게이트 빌드에는 D3가 없었음). fix-forward 방안은 아래 |

## main 선행 결함(fix-forward 필요) — 게이트 통과 조건
- `audit:glossary:v134` 35 토큰(위 표). 처리안: ① E-006 본부 국가코드 → 한글 국가명 표기, ② 원문 그대로 찍히는 목록·주석 텍스트(A-023 시설명, B-046/047 REO·MCS, C-012, 지역 시나리오 SSP 주석, VND)를 `PublicTermTextV134`로 감싸기(용어집에 이미 있는 EVN·JSC·VC·LNG·ICT·SSP·VND·USGS·MPI는 감싸면 해결), ③ D3 설명의 기관·회의 약어 13개(AMD·COP21·COP23·FIA·GFANZ·GRDP·ICO·IGES·IIED·IPG·IUCN·NYDF·QH12)와 DFI·PE·LP·EL·M01·SSL·REO·MCS 용어집 등재 또는 공개 문구 수정. 예상 1시간 내외. 이 PR에 포함할지, 별도 fix-forward PR로 먼저 올릴지는 사용자 결정 사항.

## 미완료·사유
- 매트릭스(A-013·C-005·B-044) 히트맵·정렬표, E-017 국가별 순위 막대, B-026 우세 유향 지도: 문장값·자료 구조상 이번 라운드는 비교표/카드로 등재(예외·후속 P4)
- B-017 지도 보류(경계 미확보), 지역 패널·미니맵 값 표출(P4-D2)은 범위 밖
- 예외 33행의 다수는 단일 시점 자료(추이선 불가)로, 유형 표준 자체의 한계가 아니라 자료 시점 수의 문제. 추가 시점 확보 시 계약만 `standard`로 바꾸면 QA가 판정한다
