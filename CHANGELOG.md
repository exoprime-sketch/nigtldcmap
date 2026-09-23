# 변경 기록

이 문서는 공개 플랫폼의 주요 변경을 기록합니다. 아직 merge·배포·tag가 확인되지 않은 작업은 `Unreleased`에 둡니다.

## Unreleased — V153-D1 상세보기 프레임 (PR 후보)

### Added

- 152개 상세의 1순위 시각화 계약 `src/data/visualization/publicVisualizationContractV153.json`(유형·1순위 타입·축·단위·2순위·지도 자리·참고 사례·상태) + 유형 표준 함수·순서 유틸·단위테스트, 문서 `docs/VISUALIZATION_CONTRACT_V153.md`(스크립트 생성)
- 상세 프레임 `DetailAnalysisFrameV153`(블록 `data-analysis-block`/`data-analysis-rank`, 계약 판정 속성·콘솔 경고, 지도 슬롯을 1순위 옆에 두는 grid 속성)·핵심 수치 행 `DetailKpiStripV153`·레이아웃 CSS `detail-layout-v153.css`, 문서 `docs/DETAIL_LAYOUT_V153.md`
- 공용 차트 `StackedAreaChartV153`(A-016에서 추출, 절대량/비중)·`CompositionStackV153`(A-010·A-011·A-018 1순위 누적영역)·`DumbbellChartV153`(B-023 건기/우기, B-025 유역 두 면적)·`EntityFacetCountsV153`(등록부·디렉터리 분류별 수)
- 계약 QA `scripts/v153/detail-contract-qa-v153.mjs`(`qa:detail-contract:v153`, CI analysis job) — 152/152 판정(첫 블록 타입·순서·축·단위·태그 정직성·해석 안내 부재·상태 화면 차트 0·정책 화면 숫자 차트 0·핵심 수치·제목 1회·지도 자리·320px 넘침·콘솔)

### Changed

- 상세 순서: 히어로 → 핵심 수치 3~4개 → [1순위 | 작은 지도](≥1024px 2열, 세로형 3:4) → 2순위 → 표 → 출처 1줄 → 이용조건(접힘) → 다운로드. 모바일은 1순위 → 지도 → 2순위
- '자료 해석 안내' 접힘 블록 삭제(`PublicIndicatorMeaningV129` 미사용 표기), 분석 제목은 페이지 제목과 다를 때만, 자료정보 패널은 출처·기간·단위 1줄 + 접힌 이용조건(유의사항 포함)
- 계약 1순위에 맞춘 순서 교체: 성·시 분포는 지역 막대 먼저(선택 지역 추이 2순위), 정책 타임라인은 유형별 수보다 먼저, 포트폴리오는 분류별 수 먼저(연도 추이 다음), 디렉터리·A-027/A-028·E-006·D-005·B-021 등
- 막대 프리미티브(`AnalysisBarsV147`·`PublicCountDistributionV143`·항목 비교)가 세로축 명사를 계약에서 받음(단위는 데이터 기준 유지). A-010 CO₂e 판별이 V150 단위 별칭(`MtCO₂e`)에서도 동작
- `qa:analysis:v140`의 `detailTilesAbsent` → `detailTilesBounded`(핵심 수치 행 ≤4·단위 필수) — 사유 `reports/v153/ANALYSIS_QA_EXPECTATION_CHANGE_V153.md`

### Fixed

- 320px 가로 넘침: C-009/C-010 타임라인(패널·목록 열 `minmax(0,1fr)`, 본문 URL 줄바꿈), 선택기 `<select>` 긴 옵션(B-006·B-041·B-017 등), 개체 카드 그리드(E-018)

## Unreleased — V151-2 34개 집계정책·국가 외곽선·배경지도 개편·CCKP 팩 분할 (PR 후보)

### Added

- 레이어별 34개 집계정책 `boundaryPolicy`(`map-index.json`, 빌드 생성): `sum`·`area-weighted-mean`·`range-only`·`count-sum`·`membership-or`·`native-34`·`six-region-only`·`none`. 대상 계약(`build.boundaryPolicy34`)에 선언하고 `scripts/v138/build-map-layers-v138.mjs`가 검증(면 레이어 누락·분위형 지표 평균화 거부). 34개 경계에서 값을 규칙대로 표시하고 팝업·패널에 "구성 n개 중 m개 값 있음 · 구성 범위 · 부분 결측"을 표기. 63개 토글은 원자료 값 그대로. 판정표 `docs/ADMIN_BOUNDARY_34_V151.md`
- CCKP B-003~B-007은 전 지표 면적가중평균(성·시 값이 격자 지표의 ADM1 공간평균이므로), B-042 상위 10% 2개 지표는 구성 범위만(range-only), C-012·C-013·C-019·C-022는 34개 경계에 직접(native-34), B-021은 GDL 6권역 자산 `vnm-region-6.geojson`
- 34개 경계 자산에 `areaKm2`·`memberAreaKm2`(면적가중치), 국가 외곽선 `vnm-country-outline.geojson`(63개 병합, 4,839 정점)·표시 전용 `vnm-country-outline-z5.geojson`(0.01° 단순화, 981 정점). 큰 지도·비교 지도·SVG 대체·미니맵이 Natural Earth 저해상 외곽선(44 정점) 대신 사용
- 점 13개 레이어 소재지 사이드카 `spatial/locations/<id>.json`(원자료 좌표 → 63개 경계 point-in-polygon, 경계 밖은 null) → 팝업 "소재 럼동 (구 닥농성)"
- 배경지도 선택기(지형·위성·도로·지명·없음, 기본 지형) `src/data/map/mapBackdropV151.ts`: Natural Earth 음영기복 + AWS Terrain Tiles(terrarium) hillshade + OpenFreeMap 하천·도로·철도·지명 / Esri World Imagery / OpenFreeMap Liberty 전체 / 없음. preconnect·z5~7 워밍업·첫 타일 계측(`data-backdrop-first-tile-ms`)·타일 실패 시 '없음' 자동 하강, kind별 귀속 표기
- 라벨 계층 `src/data/map/mapLabelsV151.ts`·polylabel 대표점 `labelAnchorV151.ts`: 행정구역 라벨(회색·소형·자간, 폴리곤 내부 대표점)과 도시 라벨(마커+진한 글씨) 분리, 성급시 6곳은 라벨 1개, 타일 place 라벨은 6개 도시 제외·name:ko 우선
- 뷰포트 유지: 레이어 추가·제거·주 분석·변수·기간·경계 토글·배경 전환에 카메라 이동 없음, 자동 범위 맞춤은 최초 진입과 '선택 0→1 첫 레이어가 뷰포트 밖'일 때만, `view=lon,lat,zoom[,bearing]` URL 저장·복원
- 게이트·러너: `audit:boundary-policy:v151-2`(finalize:v151에 추가), `qa:viewport:v151-2`, `qa:labels:v151-2`, `measure:backdrop:v151-2`, `measure:detail-prepare:v151-2`, `scripts/v151-2/screens-v151-2.mjs`

### Changed

- 데이터 팩: 8 MB 초과 요소는 단독 팩(`_plan_packs`, `tools/vietnam_etl/repack_packs_v151_2.py`) → 19→26개(B-003~B-007·B-017·B-033), 152개 요소 payload sha 불변. 로더는 압축 SHA-256 1회 + index 대조만 수행(원문 재해시 제거). CCKP 상세 준비(번들 요청→파싱) 0.19~0.51 s, 화면 ready 0.50~1.23 s(전 2.8~3.0 s)
- 문구: 레이어 부제 "성·시 경계(개편 후 34개 기본 · 개편 전 63개 토글)", 토글 아래 상시 고지 → 선택 레이어의 정책 1줄, 지도 분석 패널 통계·범례 결측 수는 표시 경계 기준(34/63/6권역), 이용안내에 집계 규칙·배경지도 귀속·view 저장 안내
- 참조 외곽선 34개 1.6 px / 63개 0.8 px, 데이터 레이어 아래에 삽입

### Fixed

- 주 분석(색상 표시) 변경 시 지도가 국가 범위로 리셋되던 동작 제거
- OpenFreeMap Liberty 레이어 임포트 시 `layout: undefined` 검증 오류

## Unreleased — V153-D0 데이터 결함 수정 (PR 후보)

### Fixed

- B-046·B-047 관측 레코드에 광물명(`name`)·측정 라벨 투영(원천 meta `요소_KR`), 다운로드 CSV `name` 열 채움. 광물별 화면(값·단위·세계 순위·비중 병기, USGS 미수록 분리)
- E-006 좌표 point-in-polygon(34개 성·시)으로 `locationClass` 속성화 — 베트남 소재 8곳 / 해외 소재(베트남 투자 실적) 7곳 목록 분리(지도 피처 8 불변)
- 38대 기후기술 ID를 카탈로그·팩·화면에서 `"07"` 한 표기로 정규화(옵션 77→38, 두 표기 합집합 매칭, `technology=07` URL 복원). 원자료 불변
- C-012 항목·값 한글화(원문 괄호 병기, `koreanTermsV153.json`), B-002 기후대 라벨 "한글(코드)" 순서·구성 표
- A-023 WRI 236기를 GPPD 추출본(CC BY 4.0) `gppd_idnr`로 조인해 소유자·가동 연도·출처 URL, OSM operator·객체 URL, 전 시설 소재지(34·63 경계) 빌드 시 속성화. 시설 카드 규격 `facilityCardV153`(국가/명칭/유형/소유·운영/규모/연도/소재지/출처)와 A-023 선택 시설 패널
- ETL 재실행 가능화(A-002 legacy 슬러그 해석) · 요소별 선별 승격 도구(`scripts/v153/diff-staging-v153.mjs`, `promote-elements-v153.mjs`)

## Unreleased — V151 행정경계 34개 기본·63개 토글 (PR 후보)

### Added

- 2025-07-01 시행 34개 성·시 경계 자산 `public/data/vietnam/v2/geometry/vnm-adm1-34.geojson`. 개편 전 63개 경계를 결의 202/2025/QH15 통합 대응표(`crosswalk34`)대로 위상 병합해 생성하며 좌표를 만들지 않음(`tools/vietnam_spatial/build_adm1_34_v151.py`, `npm run build:adm1-34:v151`). 면적 보존 오차 0.0ppm · 원천에 없는 좌표 0개 · 구성원 63개 전수 배정. 원천이 빈롱·벤째·짜빈 접점에 남긴 0.1215km² 틈은 메우지 않고 매니페스트에 면적·사유 기록
- 데이터 지도에 '행정경계 기준' 선택(34개 기본 / 개편 전 63개). 경계선·한글 지명·대체 경계·저작권·상태 문구가 선택을 따르며 선택은 브라우저에 저장. 값은 바뀌지 않는다는 고지를 토글 아래 상시 표시
- 34개 단위 계약 모듈 `src/data/map/adminBoundaryV151.ts`(단위표·한글 라벨 34개·구성원 역참조·문구 헬퍼)와 34개 한글 지명. Huế는 개명 반영해 '후에', 개편 전 라벨은 '트어티엔후에' 유지
- 게이트 `npm run audit:boundary-34:v151`(정적 21 + 브라우저 11)과 `npm run finalize:v151`(= `finalize:v140` + 경계34 정적 게이트)

### Changed

- 지표 값은 원자료가 발표한 개편 전 63개 성·시 기준을 그대로 둔다. 34개로 합산·평균·분할하지 않으며, 34개 지물에는 `adm1Code`를 싣지 않아 63개 기준 값이 34개 경계에 결합될 수 없게 했다
- 이용안내·지도 데이터 안내·물 유향·기후 시나리오·한계 등록부·용어집(GADM) 등 '63개 성·시' 문구에 '개편 전'을 명시
- `scripts/v138/build-map-layers-v138.mjs`의 행정단위 접두·접미어 제거가 위치를 가리지 않아 'Hà Tĩnh' 대응표 키가 'ha'로 접히던 문제 수정(34개 그룹·63개 구성원 불변, 생성 자산 무변경)

### Fixed

- 컨테이너를 root로 실행할 때 감사용 헤드리스 브라우저가 기동하지 못하던 문제(`scripts/v125/browser-runtime.mjs`). root·리눅스에서만 `--no-sandbox`를 붙이고 러너별 추가 플래그는 `V125_BROWSER_ARGS`로 주입. 감사 기대값은 변경하지 않음

## Unreleased — V150-1 자료 갱신일 결정화·CI 시간 단축 (PR 후보)

### Changed

- 자료 갱신일 디렉터리 `public/data/vietnam/v2/dataset-directory.json`(+ `src/data/datasetDirectoryV149.json` 사본)을 `npm run build:dataset-directory:v150`으로 생성해 커밋. `prebuild`는 git을 부르지 않고 `verify:dataset-directory:v150`(자료 목록·파일 SHA-256·사본 일치)만 수행하며 `finalize:v140`·CI에도 포함. 홈 '최신순'과 `/api/usage` 최신순이 같은 파일을 읽음(`docs/DATASET_DIRECTORY_V150-1.md`)
- CI(`ci.yml`): 같은 브랜치 이전 실행 자동 취소 · `static`(tsc·검증·빌드·단위테스트·정적 감사) → `browser` 4 shard(브라우저 감사, 빌드 아티팩트 공유) → `summary`(shard 결과 병합 후 V136 릴리스 판정, 검사 항목·기대값 불변) → `analysis`(role-split + 41건 기준선 비교). 문서만 바뀐 PR은 browser 생략. `audit-vietnam-release-v136.mjs --group/--shard/--results-dir`, 워크플로 계약 감사 3종은 sharded 형식을 현재 게이트로 인정
- `pages.yml`은 `workflow_dispatch` 전용(운영은 Vercel)
- `qa:analysis:v140 --baseline reports/v150/analysis-qa-baseline-v150.json`: PR-D로 이관한 41건은 기준선, 새 항목·새 검사만 게이트 실패
- glossary 감사가 찾기 목록 152개 카드를 전부 로드해 검사(`FINDER_ALL_CARDS_AUDITED`) — 홈 카드 구성과 무관. 이로써 드러난 미등록 용어 4개(BAFU·KETEP·TCCRE·TT:CLEAR) 등록, 카드 제공기관 문자열의 내부 메모("레코드별 상이 — 1.2_entity 참조") 제거(E-018·E-020)
- role-split QA 스크린샷 저장 재시도(판정 불변), CLAUDE.md merge 조건·리사이저·디렉터리 메모

## Unreleased — V150 지도 가독성·패널·축단위·개조식 설명 최종화 (V148·V149 포함, PR 후보)

### Added

- 데이터 지도: 배경지도 토글(OpenFreeMap 벡터 타일 + Natural Earth 지형, 기본 켬, 브라우저에 선택 저장)과 저작권 표기 연동, 한글 지명 심볼 레이어(국가·도시·63개 성·시, `src/data/map/mapBackdropV150.ts`). 배경지도 로딩 실패는 데이터 레이어에 영향을 주지 않고 상태 문구만 표시
- 차트 축·단위 라벨 `ChartAxesV150`(`data-chart-axes`): 시계열·막대·누적면적·구성·산점도 등 상세 분석 차트와 홈·찾기 카드 미리보기에 가로·세로·단위를 같은 형식으로 표기. 152개 상세의 차트 블록 175/175 적용
- 152개 데이터 설명을 개조식 한 구절(`datasetDescriptionsV150.json`, 13~26자)로 통일. 찾기 카드·상세 히어로·분석 제목이 같은 문자열을 사용
- 단위 표시 정규화 `unitDisplayV150`: 같은 크기의 단위만 표시 철자 통일(Mt CO2eq·MtCO2e·백만 tCO₂e → MtCO₂e, 백만 kW → GW, 십억 kWh → TWh). 값·정밀도·다운로드 불변, CO₂-only 단위는 CO₂e로 넓히지 않음
- 상세보기 작은 지도(42개, V148): 시설 점·송전선·성·시 경계, 항목·기준시점 선택과 큰 지도 인계. 지도 팝업·오른쪽 패널의 중복 문구 제거
- 홈 조회순·인기 지도 공용 집계 API(`api/usage.js`, `server/usage.cjs`, V149)와 목록 복귀 상태 보관(정렬·연도·제공 형태·상세검색·로딩 수·scrollY)
- 검증 스크립트 `scripts/v150/`: 런타임 검토(지도·찾기·홈·반응형 42조합·152 축단위·설명 일치), 설명 점검표, 단위 152행 표, 공유 URL 레이어 조합 픽스처

### Changed

- 데이터 지도의 '추천 분석' 버튼 5개 삭제. 같은 레이어 조합은 공유 URL(`mapPreset`·`layers`·`primaryLayer`·`contextLayers`)로 열리며 e2e·감사 스크립트는 이 경로로 전환(`scripts/v150/map-combinations.mjs`)
- 좌우 패널 리사이저(`useResizableMapPanelsV129`): 최대폭 상한(460/520) 제거, 지도 최소폭 200px과 화면 여유만 제한. 더블클릭 초기화, 화살표(±10, Shift ±40)·Home·End, 새로고침 후 유지(`cdp-map-*-panel-width-v150`)
- 클러스터 개수 라벨 글꼴을 글리프 서버가 제공하는 Noto Sans로 지정(이전 기본 Open Sans 스택은 404)
- 홈: '주제별 데이터' 영역 삭제, 조회순/최신순 정렬, 주요 지역 데이터 SVG 지도 가독성. 데이터 이용안내의 '집계 전에는 주요 자료를 안내합니다.' 문장 삭제
- 게이트 기대값: `audit:map-copy:v136`·`audit:map-access:v135`·`audit:map-guide:v135`·`qa:map:v138`·e2e `smoke`·`map-presets`는 추천 분석 버튼 0개와 공유 URL 조합을 기대(사유 `reports/v150/REVIEW_V150.md`)
- `vercel.json ignoreCommand`에 `api server scripts/v149` 추가(V149): API·서버 변경도 Preview 빌드 대상. `verify-ignore-command-v140` 동기화

## Unreleased — V141 마지막 의미 오류 수정 (후보, production 미반영)

### Fixed

- A-023 발전소: 카드·상세·지도 기호·필터·tooltip·집계가 한 정규화(`src/data/map/powerPlantFactsV141.ts`)를 읽음 — 발전원은 `fuelType`/`primaryFuel`, 용량은 `capacityMw`/`mw`, 용량구간은 기재 용량에서 파생, `(미표기)`는 미기재로. 지도는 출처 필터(WRI GPPD 2021 기본 · OSM 2026 추출 · 두 출처 함께=중복 미통합)를 두고 자료연도·표시 범위를 선택 출처로 표시(map-index A-023 계약 patch, `filters.defaultValue/allLabel`). Kon Dao는 수력 · 1 MW · 10MW 미만 · 2021로 필터에서 유지. 지도 요약은 '발전원 미기재/설비용량 기재·미기재'를 진짜 결측만 셈. 고유시설 합산 없음
- C-007·C-008: 속성 행을 사업 포트폴리오로 세지 않고 `CooperationChecklistAnalysisV141`로 읽음 — C-007은 베트남 참여 지위·등재 NMA·제출당사국·대상 분야·플랫폼 활동을 질문별 현황표로, C-008은 이니셔티브 32개의 참여 형태·시점·분야 비교표 + NAZCA 등재 행위자 98곳의 유형·업종 비교와 검색 목록. 날짜·파일명·상태가 분야 분류에 들어가지 않고, 검토 메모·자료 출처는 '검토 근거'로 접음. 공통 파서 `cTemplateRowsV141.ts`(주제 — 속성, 값, 시점, [하한/상한] 태그, 문서명, 파일명·검토의견 제거)
- C-018: 공개 제목 '중장기 전력 계획·전망(개정 PDP8)'. 주 분석 `EnergyOutlookPlanAnalysisV141` — 개정 PDP8(Quyết định 768/QĐ-TTg) 2030·2050년 전원별 설비용량 계획을 하한~상한 범위 막대(연도 선택)와 표로, 수요 전망·재생에너지 비중 목표·배출 전망·전력 교역 계획 표, 전력가격 규정은 가격 종류·단위(VND/kWh·UScent/kWh)·근거 문서와 함께 별도 표. 가짜 전망 추세 없음. 카드는 2050년 태양광 계획 293,088~295,646 MW
- B-021 등 상세 머리글: 공간단위를 지표 접미사로 판정(GDL 6권역이면 '국가·6권역 단위'), '관측기간' → '자료기간'(미래 연도는 '(YYYY년 이후 전망)'), 자료 갱신일과 기준연도를 구분(데이터 안내). 추세 차트에 '표로 보기'(차트에 쓴 계열·연도·값·단위 표)
- B-012 연대기 앞에 재해 유형별 건수, B-025 등 단일 값 등록부는 같은 단위 값 비교를 목록 앞에, 포트폴리오는 검토된 분류 키별 분포(원조 유형·등록 표준·상태 …)를 함께 표시(C-025 `standard` 열 반영). D-018 지도 선택 패널에 승인일·사업기간. 홈 카드 부분 이름을 상세 표기에 맞춤(불소계 온실가스, CIF(Clean Technology Fund), Adaptation Fund, 표준값(Estimate)), E-018 카드는 상세와 같은 진출 상태 그룹
- 공개 상태 문구: '자료 없음' → 상황별 '자료 미제공' · '위치자료 미확보(지도 표시 제외)'. 지도 범례는 1200px 미만에서 접힌 채 시작하고 값·단위·자료연도·표시 범위를 먼저 둠

### Changed

- QA(`analysis-qa-v140.mjs`): 분석표 검산은 지표+지역+연도/기간+단위 키로 행을 식별(근처 5% 숫자 예외 제거; `value-without-keys`는 필수 실패), `analysisFit`은 152개 전부에 자료 유형별 기대(추세·비교·구성·분포·등록부 목록/표/단위/시점) 기록, `mapSymbolVerified`는 42개 레이어의 대표 기호를 선택해 값·단위·시점·출처·공간 의미를 검사(A-023 출처, D-018 범위/활동점, B-021 6권역, C-019/C-022 34단위 사례 포함), 화면의 내부 문구(파일명·검토의견·raw 키)를 필수 실패로. 보고서 JSON·MD·코드 판정 동기화

## Unreleased — V140 독립 검토 후속: 카드 집계·출처·선택기와 QA 판정 (후보, production 미반영)

### Fixed

- E-019 대표 수치는 현지 사무소 6곳(원천이 '사무소 미설치'로 표시한 3개 기관은 별도 표기), E-020은 지원제도 3개 · 활용 사례 7건(같은 제도명 ' — ' 앞을 1개로 셈). D-018은 베트남 단독사업 승인액 1,135만 USD(부분 이름이 비는 차원 키를 고르지 않음)
- 제공기관은 카드가 보여준 계열의 지표 메타 `sourceOrg`(B-004 World Bank CCKP (CMIP6 x0.25)); 카탈로그 기관 목록 앞 2개를 자르지 않음. 기관별 출처가 4개 이상이면 '기관별 공식 출처 N개(상세 자료정보 참조)'
- 카드에 내부 키 노출 금지: `orgType` → '기관 유형' 등 `GROUP_LABELS`로 표기(E-004), 키가 새면 빌더가 경고
- B-036: 연도 선택기가 주 분석(선택연도 토지 유형별 변화율 비교)을 바꾸고 선택 연도를 문장으로 밝힘, 두 시점 변화는 추이 패널. 분석 제목이 토지 유형을 말함
- D-012 분석 제목의 콜론 항목 목록 제거(공개 제목 정책 `removeFieldInventory`)
- A-023 원천별 표에 '합계(원천별)' 행(WRI 236기 41,350 MW · OSM 277곳 76,446 MW)과 용량 미기재 수(WRI 0기 · OSM 1,450곳), WRI+OSM 합산 없음. 천 단위 구분
- 등록부 카드는 상세와 같은 행 기준: 원천 집계·설명 행(레코드구분=집계)과 취합 방법 행('수집현황 v… 분류')을 세지 않음(D-020 9→8건, D-024 12행 중 7건, C-022 98→97건). E-012 카드는 상세 KPI와 같은 전체 직군 종사자 수 51,860천명(2024)
- 비교 카드(bars/composition)는 부분마다 다른 범주를 상세에 고정해 넘기지 않음(D-013 ESRU 고정 해소, A-017). 전용 컴포넌트 요소(A-016·D-005·D-011·E-012)는 그 컴포넌트가 읽는 키만 전달(D-005 `budgetBasis`, D-011 공여자 총계). 성·시 분포 카드는 `dim.regionMeasure`로 전달(B-040이 심도 2km로 열리던 문제), 시나리오 카드는 상세를 그 시나리오로 엶
- B-026 우세 유향 비율 카드를 63개 성·시 분포로(행 수 74건 카드 대체). E-017은 5개국 순위 비교로 한국 4위를 대표값으로; 상세 KPI는 국가별로 다른 행을 하나의 값으로 내세우지 않음. A-026은 좌표계 EPSG:4326을 그대로. A-016 상세 문구 '1차 에너지 소비량'(Energy Institute 소비 통계)
- 상세에 집계 수 명시: 연대기 '시점별 기록 · N건'(값에 단위 표기, 수치 항목은 범주 비교를 먼저), 확인 결과표 'N건', 기관 디렉터리 'N곳', 목록 'N건', 일반 카드의 값은 천 단위 구분. E-020 문장 조사 '사례를'
- 성·시 이름은 상세와 같이 베트남어 표기·대문자 경계 분리(Bình Thuận)

### Changed

- `scripts/v140/analysis-qa-v140.mjs` 2판: 실제 finder 카드 클릭(홈 8개 포함), `selectionUrlPreserved`, 같은 의미 수치 대조(정수 정확, 소수는 표시 자릿수, 조·억·만·B/M/K 환산 명시, 두 화면 자릿수가 다르면 굵은 쪽 반올림 단위의 절반 이내, 단위·연도/기간·지역 동반), 다운로드 파일에서 재계산(`recomputed`; 대표 지표 `provenance.headlineIndicatorIds`, 집계 행 제외, 성·시 최대/합계, 등록부 행 수), 선택기·제목·KPI로 상세 적합 판정, 컨트롤은 새 페이지에서 라벨로 찾아 실제 선택 후 주 분석의 수치·주제 변화 측정, 표 판정 분류(match/no-table/no-derived-row/mismatch/not-applicable), 지도 연계는 목록 행이 primary·표시 상태를 3회 연속 유지할 때만 통과, 세션 전체(컨트롤·지도 포함) 콘솔·자산·HTML-for-JSON 오류 누적, 배포판 버전 대조(불일치 시 exit 2), 필수 실패 시 exit 1
- Gate: `npm run qa:analysis:v140`, `npm run finalize:v140`(finalize:v136 + role-split + analysis QA), CI `ci.yml`에 V140 게이트 단계와 보고서 artifact 추가. Playwright는 `V125_BROWSER_EXECUTABLE`이 있으면 그 Chrome으로 실행

## Unreleased — V140 분석 요약 카드와 상세 분석 (후보, production 미반영)

### Added

- 152개 카드 모델: `scripts/v140/build-card-summaries-v140.mjs`가 팩과 semantic 계약을 한 번 읽어 `card-summaries-v140.json`(요소별 종류·핵심값과 산출 규칙·미리보기·자료기간·제공기관·상세로 넘길 선택·집계 단위·출처)을 생성. 종류는 자료 형태에 따라 line/level/composition(허용 목록)/bars/spatial/spatial-trend/facts/status. 검토표 `reports/v140/card-summaries-review-v140.md`, 계약 문서 `docs/PUBLIC_CARD_ANALYSIS_CONTRACT_V140.md`
- 데이터 찾기 카드: 제목 → 확인 내용 한 문장 → 핵심값 → 미리보기 → 자료기간·제공기관 → 상세보기/지도에서 보기/다운로드. 1240px 이상 3열. 측정항목 태그 제거
- 카드 → 상세 선택 전달: 홈·finder 카드의 상세보기가 요약한 선택(measure·year·period·dim.*)을 `openElement`에 넘김. A-002 Estimate, A-003 GDP 총액, B-033 Quảng Ninh 2024, C-016 집중형 태양광 2025–2030으로 진입
- 성·시별 관측 분석 `ProvinceSeriesAnalysisV140`(B-031·B-032·B-033·B-034·C-016): 항목·지역·기준연도 선택, 지역 추이, 같은 시점 성·시 비교, 표로 보기, C-016 항목 비교와 계획용량 합계
- A-024 송전망 요약 `TransmissionNetworkSummaryV140`: 2016년 실재 선로 606구간·23,608 km(전압별)와 개정 PDP8 목록 116행(기존 48·계획 68, 경로 없음) 분리
- 공유 C 템플릿(C-009·C-010) 문서 단위 연대기 `DocumentTimelineV140`: 법령·문서 54·41건, 시행(발효)일 순, 속성은 짧은 목록, 원문 링크 행은 해당 문서에 부착
- 검증 `scripts/v140/analysis-qa-v140.mjs`: 152개별 screenLoaded·cardSummaryVerified·detailAnalysisFit·controlsVerified·tableValuesVerified·mapHandoffVerified·remainingIssue·evidence

### Changed

- 상세 기본값: A-003 GDP 총액(명목 USD), B-021 GVI 취약성 지수(현재), C-016 집중형 태양광, B-034 산림탄소 순플럭스
- A-023: WRI `primaryFuel`를 읽어 '미표기 236행' 해소, 발전원별 시설 수·설비용량을 원천별 표로(합산 없음)
- 차원 선택기는 선택한 측정항목이 실제 가진 값만 제공(B-021 권역/SSP 분리), 같은 측정항목 안에서 항상 짝지어 움직이는 두 차원은 하나만 제공(A-006 분류/세부 분류)
- 포트폴리오 목록: 원천 집계·설명 행(D-023 2건)을 목록 건수에서 분리해 따로 표시, 필터 이름을 자료 유형별로(E-018 업종·진출형태, E-020 지원유형·지원기관, D-012 기술분야·진출국 등)
- 상세 '지도에서 보기'는 catalogue의 지도 플래그를 읽어 B-003~B-007에도 표시
- 지도 우측 패널: 선택 대상 → 전국 요약 → 지표 읽는 법 → 자료정보(현재 분석 메타, 선택 후 접힘). 추천 분석은 목록 위의 짧은 행. 레이어명 B-029 '이탄지 면적(산림 유형별 면적 중)', B-039 '수력 이론 잠재량', B-040 '지열 자원(심도별 지온)'
- B-025 유역 카드에 베트남 내 면적(km², GIS)·수계 표시. E-008 분류 집계에 모집단·중복 계산 설명
- 홈 카드 사실 표기를 자료기간·제공기관으로. finder 카드 자료기간은 요약자산 기준(D-005 2010·2013·2020년, 기후 전망 '과거 모형 1950–2014 · 전망 2015–2100')
- E2E helper가 필수 자산(bundle·data·JSON) 실패와 JSON 대신 HTML 응답을 기록(404 일괄 무시 제거)

## Unreleased — V140 홈·데이터 찾기 역할 분리 (후보, production 미반영)

### Changed

- 홈 주요 데이터 8개 카드는 제목 → 핵심 질문 → 핵심 수치(값 + 산출 규칙) → 미리보기 → 기간·제공기관 → 상세보기만 표시. 단위 행, 유의사항 문단, 원자료 행 수(A-023 'WRI 236행 · OSM 1,727행'), 다운로드·지도 버튼을 카드에서 제거. 카드 제목은 데이터 찾기 카드와 같은 catalogue `publicTitle`을 같은 컴포넌트(`PublicTermTextV134`)로 그림
- 요약자산 `home-preview-v139.json`(schema `v139-home-preview-2`)에 카드별 `question`·`headline` 추가. A-023의 핵심 수치는 WRI GPPD 수록 발전소 설비용량 합계(상세 화면의 같은 집계)
- 홈에서 뺀 유의사항은 상세 화면 '자료 이용 시 유의사항'으로 이동(A-010 총계 행 없음, A-024 계획 선로 경로 없음·좌표 오차, B-033 전국 계열 없음, C-016 계획 용량, D-023 승인액 통화별 합산)
- 데이터 찾기: 상세검색에 '제공 형태'(지도 제공 / 다운로드 가능) 필터 추가. 152개 전체 목록·정렬·필터·지도에서 보기·다운로드는 데이터 찾기가 담당
- 지도 자료 수는 한 기준(`map-index.json`의 활성 레이어 = `manifest.mapLayerCount`)으로 통일(`src/data/map/mapAvailabilityV140.ts`). 지도 목록 머리글은 '43개 자료'가 아니라 '42개 자료 · 선택 N개 · 준비 중 1개', 지도 데이터 안내도 같은 수
- 지도 목록에서 위치자료가 없는 대상(B-017 물 스트레스)은 '준비 중' 배지·점선 테두리·'위치자료 없음 · 지도에 표시하지 않음'으로 연결된 자료와 구분하고, 분류 머리글에 '준비 중 1'을 표기. 체크해도 그려지지 않음
- A-002 공개 slug를 `wgi-worldwide-governance-indicators-…`로 바꿔 다운로드 파일명과 공유 링크가 CPIA가 아닌 WGI를 말하도록 함. 이전 CPIA slug는 legacy alias로 계속 열림
- 검증 스크립트 `npm run qa:role-split:v140` (`--base-url`로 Preview·production에도 동일 검사)

### Deployment

- Vercel Deployment Storage 점검(`docs/VERCEL_DEPLOYMENT_STORAGE_V140.md`): 배포 산출물은 `public/` 복사본 705 MB + 번들 12 MB(소스맵 8.9 MB 포함)이며 reports·스크린샷·원본·ZIP은 들어가지 않음을 재확인. 기준선 67개 배포·보존 추정 17.3 GB를 `reports/v140/deployment-storage-ledger-v140.json`에 기록(`npm run storage:ledger:v140`)
- `vercel.json` `ignoreCommand`: 빌드 입력(`public/ src/ package*.json tsconfig .eslintrc .gitattributes vercel.json .env*`)이 바뀌지 않은 커밋은 Preview 빌드를 만들지 않음. production은 항상 빌드. 최근 40개 커밋 재생 검증 8 생략·32 빌드·결함 0(`npm run verify:ignore-command:v140`)
- `.gitignore`에 `/output/`, `/tmp/` 추가. `GENERATE_SOURCEMAP=false` 환경변수와 Preview 7일 보존 정책은 설정안으로 문서화(대시보드 적용 필요). `downloads/` 외부 이전은 별도 설계 전까지 보류

## Unreleased — V139 홈 개선 (후보, production 미반영)

### Changed

- 홈: 상단 메뉴와 같은 기능 카드 3개를 hero에서 제거하고 제목·설명·국가 배지·검색(예시 4개는 실제 검색 결과로 이동)만 남김. 오른쪽에는 2016년 송전망(A-024)을 63개 성·시 경계 위에 사전 생성한 정적 SVG 1개와 같은 자료의 지도 deep link. 홈에서 지도 엔진과 레이어 geometry를 불러오지 않음
- 데이터 현황은 전체 항목·지도 제공·다운로드 가능·데이터 기준일의 한 줄 상태띠(manifest·catalog·map-index 파생)
- 주요 데이터 8개(A-002·A-003·A-010·A-023·A-024·B-033·C-016·D-023)는 빌드 단계 요약자산(`public/data/vietnam/v2/home/home-preview-v139.json`)으로 그린 실제 분석 미리보기 카드(값·기간·단위·제공기관·유의사항·상세보기). 순위 번호 제거, 4열/2열/1열 반응형
- 주제분류 5개는 hero에서 빼서 주요 데이터 아래 '주제별 데이터' 바로가기로 한 번 제공. 헤더 브랜드명과 푸터 '지도' 항목을 플랫폼명·'데이터 지도'로 통일
- 지도·상세 잔여 수용조건: C-019/C-022는 개편 후 34개 성·시를 값의 단위로 적고 63개 경계는 '소속 대응 표시'로만 표기(같은 이름의 성·시는 '개편 후에도 유지'로 설명), B-025 '선택 유역'과 유역 경계 미제공 안내(B-023/B-028 포함), A-025 제목을 원천 비고의 시설명(예: Rang Dong 유전 CO2-EOR 파일럿)으로, D-018 승인액을 원천 표기(USD)대로 표시하고 '검증된 세부 활동지역 점 N개 표시'로 집계, E-008 목록 분야 필터를 상단 CTIS 집계와 같은 분류 코드로 연결, C-022 표에서 수집 방법 메모 행 제외·영문 구분명 번역·중복 근거문 제거·연도값 표기·부문명 없는 시설수 행에 근거문 인용
- 생성 단계 `home-preview`(`scripts/v139/build-home-preview-v139.mjs`)를 map-targets 뒤에 연결. 홈 감사(home:v128)는 기능 진입점을 주 메뉴에서 읽고 홈 안의 중복 카드 0, 카드별 미리보기, 지도 엔진 미로드를 검사. routes:v128의 A-002 기대 문구를 WGI로 갱신

## Unreleased — V138 지도 43개 대상·분석 완성 (후보, production 미반영)

### Added

- 사용자 선정 지도 대상 43개 계약(`src/data/visualization/publicMapTargetsV138.json`)과 pack 기반 레이어 생성 단계(`scripts/v138/build-map-layers-v138.mjs`). 42개 연결(완전 28·부분 14), B-017은 평가구역 경계 미확보로 미연결 사유 기록
- 데이터 지도: 국가 선택 아래 단일 접이식 7분류 체크박스 목록, 다중선택, '현재 색상 표시' 선택기, 표시 끄기(선택 유지), 분류별 선택 개수, URL 복원(`hiddenLayers`), 추천 분석이 카드 조합을 그대로 표시
- 기후 성·시 계열(B-003~B-007)의 시나리오·지표 선택과 지역 클릭 추이, B-008 관측소 시나리오 전망 차트(지도·상세), 문서·사업 지역의 원천 행 목록, 근사 위치 기호
- 상세: 지역·시나리오 계열의 전체 연도 추이 차트와 처음·마지막 변화, 단일 기간 자료의 지역 순위표, B-017 평가구역·등급 분포, A-023 원천별 수록 행 요약, E-008 원천 CTIS 분류 집계, 정책표 구분·단위 열, E-018 진출 상태 분리, E-020 지원제도·활용 사례 분리, E-019 미설치 기관 분리
- 브라우저 QA 스크립트(`npm run qa:map:v138`, `npm run review:screens:v138`)와 43행·152행 보고서, 다운로드 표본 대조(`npm run compare:downloads:v138`)
- 용어 풀이: ADM1·ESA·USAID·CIT·VWEM·LTA·PSMSL·CTIS·FCPF·PPI·OPTA·GADM·HydroBASINS·HydroSHEDS·RX1day·RX5day·CWD·ETS·OSM 추가. 지도 목록 행·자료 정보, 지역·시나리오 화면의 단위·제약 문장, B-008 출처 문장, A-023 원천별 행, 기관 목록의 미설치 문구에 용어 도움말 연결

### Changed

- 지도 관련 감사는 고정 레이어 수(12) 대신 map-index와 43개 계약에서 기대값을 읽음
- 지표 수 집계에서 성·시별 지표 ID를 지표군으로 묶음, 카테고리 비교의 기본 기간을 최신연도로, 정책 설명에서 내부 검토 문구 제거
- B-017 평가구역 순위표의 행 이름을 원천 키(`pfaf-GID_1-aqid`) 대신 '성·시 · 유역 번호 · 대수층 번호'로 표시. B-023·B-028 위치 설명의 경계 파일 재사용 메모, 지도 출처 행의 시트 열 참조 메모를 공개 문장에서 제거
- 지도 전국 요약에서 좌표가 없는 행을 '위치자료 없음(지도 미표시)'으로 따로 세고, '필터로 가려진 수'는 사용자가 고른 필터로 빠진 수만 표시
- 용어 감사(glossary v134)는 V138 추천 분석이 카드 조합을 모두 그리므로 지역 클릭 시 겹침 선택기에서 GVI 항목을 골라 선택 화면까지 검사

## Unreleased — Vietnam pilot V128

### Added

- 152개 요소별 데이터 릴리스 수용 matrix와 미수집·미입력 gap disposition
- 데이터 보유 요소와 다운로드 자산의 reconciliation 보고서
- manifest·catalog·map-index에서 현황을 파생하는 베트남 파일럿 홈
- 공개 데이터명·측정항목·분류·기술·기관·사업·지역을 사용하는 검색 흐름
- 통합 데이터 이용안내와 공개 404 복구 화면
- 데이터 수용, 홈, 공개 경로, 다운로드, 공개화면 V128 audit와 전체 release gate
- root domain과 `/nigtldcmap/` project path를 함께 지원하는 단일 공개 asset URL resolver
- main PR/push release gate, Pages production 배포와 배포 후 public URL smoke workflow
- deployment, security, performance와 production smoke audit
- V127 baseline 대비 entry bundle 회귀 및 지도·검색·element shard lazy-load 보고서
- 배포·운영·데이터 갱신·롤백 문서

### Changed

- 공개 상태를 “데이터 제공”, “일부 데이터 제공”, “입력 양식”, “입력 예정”, “원자료 미수집”으로 통일
- 다운로드 상태를 “다운로드 가능”, “화면에서만 제공”, “다운로드 자료 없음”으로 분리
- 구형 dataset detail, country, compare, insights 경로를 검증된 v2 공개 흐름으로 정규화
- 홈·검색·상세·지도·다운로드의 제목과 상태를 공통 베트남 v2 provider 기준으로 정리

### Security and privacy

- 표준 화면·tooltip·CSV·JSON에서 원본 파일·시트·행, 내부 ID, API 매개변수, pack/shard, hash와 publication decision을 제외
- `_source/` 원본 ZIP·Excel과 credential의 공개 및 Git 추적을 금지

### Release status

- 이 항목은 branch 작업 기록입니다.
- PR 생성, main merge, GitHub Pages 배포와 release tag 완료를 의미하지 않습니다.

## V127 — Public chart interaction and caveats

- 조건부 사용자 유의사항과 정확한 populated/missing 요약 도입
- 공통 interactive 시계열 chart의 축·단위·custom tooltip·keyboard/mobile interaction·X축 zoom/pan/reset 추가
- CPIA 1~6 고정척도와 실제 2005~2015 관측범위 반영
- 기존 데이터·지도·공개화면 회귀 gate 유지

## V126 — Public analysis and map workspace

- 내부 provenance를 제외한 공개 분석 view model과 안전 다운로드 projection 도입
- 데이터 유형별 분석 renderer와 CPIA·직군/임금 전용 분석화면 연결
- 지도 주 분석 레이어 1개, 보조 레이어 최대 2개와 5개 분석 preset 도입
- 사용자용 지도 범례·전국 요약·feature detail·양방향 이동 정리

## V125 — Semantic visualization

- 152개 요소의 의미·분류 차원 및 시각화 계약 생성
- E-012 직군·성별·종사자 수·임금 전용 시각화 구현
- 데이터 찾기와 지도의 selector·URL 상태 계약 연결

## V124 — Vietnam data and spatial assets

- 149개 source workbook에서 재현 가능한 베트남 v2 공개 자산 생성
- 프레임워크 152개 요소 계상과 공개 승인 projection 구축
- 검증된 지도 13개 레이어, feature 2,904개, ADM1 63개 경계 구성
- 실제 송전망 geometry와 지역별 산림·취약성·재생에너지·기후예산 자료 연결
