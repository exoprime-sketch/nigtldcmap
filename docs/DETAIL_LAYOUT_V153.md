# 상세보기 레이아웃 V153-D1

152개 공개 상세 화면이 같은 순서로 읽히도록 프레임을 통일했다. 값·차트 내용은 각 데이터 컴포넌트가 그대로 그리고, 프레임은 **순서·자리·판정**만 맡는다.

## 화면 순서

1. 히어로(제목·설명·상태 칩·지도에서 보기·다운로드) — 제목은 여기 1회
2. 핵심 수치 행 `DetailKpiStripV153` — 3~4개, 각각 값+단위+기준(카드 헤드라인·자료기간·공개 관측값/목록 건수·지표 수). 상태 안내 데이터(5개)는 상태 1줄만
3. 분석 프레임 `DetailAnalysisFrameV153`
   - 선택기 행(있을 때) → **[1순위 시각화 | 작은 지도]** (≥1024px 2열, 지도는 세로형 3:4 · 지도 데이터 42개) → 2순위 이하 블록 → 표
   - 모바일(<1024px): 1순위 → 지도 → 2순위 …
4. 출처 1줄(`출처 · 자료기간 · 단위`) → 접힌 **이용조건**(라이선스·원문 링크·산정기준·자료 범위·유의사항)
5. 다운로드

삭제: '자료 해석 안내' 접힘 블록(`PublicIndicatorMeaningV129`는 미사용 표기). 자료 요약 1줄(`public-data-summary`)은 DOM에 두되 핵심 수치 행이 대신 보인다.

## 계약과 순서 강제

- 계약: `src/data/visualization/publicVisualizationContractV153.json`(152행) — `archetype`, `primary{type,title,xAxis,yAxis,unit}`, `secondary[]`, `mapRole`, `benchmarks[≥2]`, `status`(standard·preserved·exception), `note`. 표는 `docs/VISUALIZATION_CONTRACT_V153.md`(생성).
- 블록 태깅: 차트·표·타임라인·카드 목록의 **카드 단위 루트**에 `data-analysis-block="<type>"`. 어휘: `line · stacked-area · region-bar · category-bar · dumbbell · timeline · comparison-table · heatmap · sorted-table · status-note · table · cards-list · note`. 일반 렌더러는 `VisualizationFrameV125`의 `block` prop 1곳, 전용 컴포넌트는 각자 태깅. 블록은 중첩하지 않는다(중첩되면 바깥이 판정 대상).
- 순서: 컴포넌트는 `orderBlocksV153(blocks, contract.primary.type)`으로 계약의 1순위 타입 블록을 먼저 그린다(일반 렌더러·성·시 분포·구성비·정책 타임라인·포트폴리오·디렉터리). 계약은 `AnalysisContractContextV153`으로 전달된다.
- 프레임 효과(`useLayoutEffect`+`MutationObserver`): 최상위 블록에 DOM 순서로 `data-analysis-rank`, 1순위와 `.pav126-primary` 사이 래퍼에 `data-dl153-flat`, 1순위와 지도 슬롯이 있으면 `.pav126-primary[data-dl153-split]`. 속성만 쓰고 노드는 옮기지 않는다. 판정은 프레임 루트의 `data-contract-verdict`(match·mismatch·untagged)·`data-contract-axes`(match·mismatch·missing·not-applicable)에 남기고, 어긋나면 콘솔 `[v153-contract] …` 경고(지연 로딩을 고려해 1.2초 뒤 같은 판정일 때만).
- 축·단위: `ChartAxesV150`가 데이터의 축·단위를 `data-x-axis/y-axis/unit`으로 내고 계약값을 `data-contract-*`로 병기한다. 막대 프리미티브(`AnalysisBarsV147`·`PublicCountDistributionV143`·일반 항목 비교)는 "각 막대가 무엇인지"(세로축 명사)를 계약에서 받는다. 단위는 항상 데이터에서 온다.

## 지도 자리 CSS(`src/styles/detail-layout-v153.css`)

- `.pav126-primary[data-dl153-split]{display:grid}` · `[data-dl153-flat]{display:contents}` · 모든 항목 `grid-column:1/-1`
- ≥1024px: `grid-template-columns:minmax(0,1fr) minmax(260px,32%)`, `grid-auto-flow:row dense`, 1순위 `grid-column:1`, 슬롯 `grid-column:2`(dense가 1순위 행의 빈 2열에 채움)
- <1024px: 1순위 뒤 항목 `order:2`, 슬롯 `order:1`
- 지도 세로형: `.dl153-map-slot .detail-map148-layout{grid-template-columns:1fr}`, `svg{aspect-ratio:3/4}` — `DetailLocationMapV148` 컴포넌트는 불변
- 1순위 차트 블록 `min-height:320px`

## QA

- `npm run qa:detail-contract:v153 [-- --ids A-016,B-033]` → `reports/v153/detail-contract-qa-v153.{json,md}`. 판정: primaryTypeMatch · rankOrder · axesMatch · blockHonesty · readingNotesAbsent · statusNoteNoChart · policyNoNumericChart · kpiRow · titleOnce · sourceLine · mapPlacement(1440 옆·390 사이) · overflow320 · console. 필수 실패 exit 1. CI `analysis` job에 포함.
- `qa:analysis:v140`의 `detailTilesAbsent`는 `detailTilesBounded`로 바뀜 — 사유 `reports/v153/ANALYSIS_QA_EXPECTATION_CHANGE_V153.md`.
