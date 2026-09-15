# 지도 대상 43개 계약과 다중선택 지도 (V138)

2026-09-15 재검토(`output/public-review-20260915/`)의 후속 작업이다. 새 탭을 만들지 않고 기존 데이터 지도 탭 안에서 사용자 선정 43개 지도 대상을 연결하고, 단일 접이식 7분류 목록과 다중선택을 구현했다.

## 계약 파일

- `src/data/visualization/publicMapTargetsV138.json` — 43개 대상 각각의 코드, 공개명, 분류(7개), 원자료 필드, 원자료 공간단위, 표시 공간단위, 표현 방식, 빌드 규칙(`build`), 선택변수, 단위, 기간, 대표 항목, 근거, 제한.
- `scripts/v138/build-map-layers-v138.mjs` — 공개 pack(`public/data/vietnam/v2/packs`)의 엔티티 행을 읽어 지도 레이어를 만든다. ETL 뒤, `asset-integrity` 전에 실행되며 `scripts/v137/build-final-data-v137.mjs`의 `map-targets` 단계로 연결했다. 산출물: `spatial/layers/<id>.json`, `map-index.json`, `catalog.json`(mapMode·mapFeatureCount), `manifest.json`(mapLayerCount·mapFeatureCount), `reports/v138/map-targets-build-v138.json`.
- `scripts/v138/report-map-targets-v138.mjs` — 43행 구현 상태표(`reports/v138/map-targets-v138.md`, `.json`).

`npm run build:map-targets:v138`은 레이어 생성과 asset-integrity 재생성을 함께 실행한다.

## 빌드 규칙(`build.kind`)

| kind | 뜻 | 대상 |
| --- | --- | --- |
| `existing` | ETL이 만든 기존 레이어를 그대로 쓰고 계약 사실만 덧붙임 | A-023, A-024, B-021, B-031~B-034, B-048, C-016, C-025, D-008, D-018 |
| `admin1-attributes` | 행의 `지역명_베트남어/로마자`(GADM GID_1 행)를 검증된 63개 경계 별칭표로 연결하고 명시된 측정 열을 값으로 발행 | B-003~B-007, B-029, B-030, B-037, B-039~B-042, C-009, C-010, C-024 |
| `region-membership` | 2025년 개편 후 34개 성·시 값을 원자료 `2025_개편_후_소속_34개_체계` 열로 도출한 소속표에 따라 소속 63개 경계에 동일 표시(`sourceSpatialUnit: "region"`, `mappingMethod: "explicit-2025-34-unit-membership"`) | C-012, C-013, C-019, C-022 |
| `entities` | 좌표가 있는 엔티티 행을 점으로 표시. 동일 객체 묶음(`identity`), 국내 범위 제한(`withinCountryOnly`), 상태 제외(`excludeWhere`), 근사 위치 표시(`approximate`)를 계약으로 명시 | A-025, B-008, B-012, B-023, B-025, B-028, E-004~E-006, E-018, E-019 |
| `none` | 위치·경계 근거가 없어 연결하지 않음. 사유와 필요한 자료를 기록 | B-017 |

값이 4,000행을 넘는 성·시 계열(B-003~B-007)은 `valueTable`(성·시 코드 배열 × 계열별 값 배열)로 발행하고, 런타임 로더(`loadVietnamSpatialLayerV124`)가 행 형태로 펼친다. 기후 계열은 지도에서 5년 간격 연도(각 시나리오의 첫·마지막 해 포함)만 제공하며 전체 연도는 상세 화면 추이와 다운로드에 있다.

## 미연결 대상

- **B-017 물 스트레스**: 원자료 좌표는 소속 성의 대표점이며 평가구역(HydroBASINS lvl6 × 성 × 대수층) 자체의 위치가 아니다. 평가구역 경계는 Aqueduct 4.0 GDB(`베트남데이터/.../aqueduct-4-0-water-risk-data.zip` 안 `Aq40_Y2023D07M05.gdb`)에만 있고 이 저장소의 파이프라인(GDAL 미설치)으로는 GeoJSON을 추출하지 못했다. 필요한 자료: `string_id` 기준으로 베트남 범위를 추출한 평가구역 폴리곤 GeoJSON. 443개 구역 값을 성·시로 합치거나 성 대표점에 찍는 표현은 하지 않는다.

부분 구현으로 기록한 대상(근사 위치·제외·경계 미확보)은 `reports/v138/map-targets-v138.md`의 '실제 구현상태' 열에 수치로 적혀 있다. 예: B-025·B-023·B-028의 유역 행은 원자료가 참조하는 `[공통]VNM_river_basins_8_HydroSHEDS.geojson`이 전달되지 않아 대표점만 표시한다.

## 지도 UI 계약(V138)

- 국가 선택 유지. 좌측 목록은 7개 접이식 분류(에너지·인프라 8 / 기후·위험 8 / 물·자원 5 / 산림·토지 8 / 정책·사업여건 6 / 국제사업·재원 3 / 협력기관·기업 5) 하나뿐이며, 각 행은 체크박스다. 미연결 대상도 비활성 행으로 목록에 남고 ⓘ에서 사유를 보여준다.
- 선택 집합(`activeIds`)에는 개수 제한이 없다. 색상 지도는 한 자료(`primary`)만 칠하고, 다른 지역 색상 자료는 외곽선과 클릭값으로 남는다. 지역 색상 자료가 2개 이상 선택되면 '현재 색상 표시' 선택기가 나타난다.
- 선택은 유지한 채 표시만 끌 수 있다(`hiddenLayerIds`, URL `hiddenLayers`). 범례는 '선택됨 · 지도 표시 꺼짐'을 표시한다.
- 추천 분석 카드는 카드에 적힌 조합을 그대로 그린다('송전망 + 발전소'는 두 자료 모두).
- 좌우 크기조절(드래그·키보드·더블클릭 복원·너비 저장·map.resize)은 기존 hook을 유지한다. 768px 이하 서랍은 접힐 때 스크롤 위치를 0으로 되돌려 제목이 잘리지 않게 했다.
- URL 복원: `layers`, `primaryLayer`, `contextLayers`, `hiddenLayers`, `mapSelectors`.

## 감사 변경

고정된 레이어 수(12)에 맞추던 검사는 모두 `map-index.json`의 활성 레이어 수와 43개 계약에서 기대값을 읽도록 바꿨다(`scripts/v135/audit-helpers.mjs`의 `mapLayerCountV138`, `mapTargetCountV138`, `toggleMapCompanionV138`, `revealMapDatasetExpressionV138`).

| 감사 | 변경 |
| --- | --- |
| generated-data v133 | `MAP_INTEGRITY`: 선언 수 = 활성 수, 43개 이하, 빌드 보고서의 연결 대상이 모두 존재, 가짜 geometry 0 |
| map-list-ui v136 | V138 목록 계약(43행, 가용 42, 7분류, 체크박스·라벨, 접기 시 선택 유지, 반응형) |
| map-copy v136, map-guide v135, map-access v135, map-tooltip v132 | 기대 수를 인덱스에서 읽고 체크박스 목록으로 조작 |
| map-focus v133 | `PRESET_DRAWS_NAMED_COMBINATION`(카드 조합 그대로), `CONTEXT_SELECTION_KEPT`(다중선택 유지), 색상 지도 1개 유지 |
| map-layer-distinction v133 | 프리셋 동반 자료가 켜진 상태에서 범례·기호 일치 검사, 재원 프리셋은 두 자료 모두 |
| drought v134, entity-cards v131 | V138 지역·시나리오 컴포넌트와 B-008 관측소 분석 인식 |
| glossary v134 | 추천 분석이 카드 조합(B-021 + D-008 + D-018)을 모두 그리므로 GVI 지역 클릭이 겹침 선택기를 연다. 선택기에서 B-021 항목을 골라 선택 화면 문구까지 검사 |
| portfolio-analysis v132 | E-008 `기술코드_근거문구`를 검토된 별칭(`technologyBasis`)으로 읽음 |

## 브라우저 검증

- `npm run qa:map:v138` — 활성 레이어 전수 표시·대표 객체 선택, 다중선택·접기·색상 전환·표시 끄기·새로고침 복원·크기조절·추천 분석·기후 지역 추이, 390/768/1024/1440/1920 화면(가로 넘침과 텍스트 잘림 측정). `reports/v138/map-runtime-qa-v138.json`, `reports/v138/screenshots/map/`.
- `npm run review:screens:v138` — 152개 상세 화면 초기 상태 검토표. `reports/v138/screen-review-v138.{json,csv,md}`. 내부 작업 문구(검토의견·CF/M0x·attr_NN·폴리곤 재사용 등)가 공개 화면에 남았는지 함께 기록하며, 지도 QA도 같은 문구 목록을 분석·요약·선택 패널에서 확인한다.
- `npm run compare:downloads:v138` — 다운로드 파일(`downloads/<id>.json`)에서 화면이 말하는 규칙대로 다시 센 값과, 위 두 검토가 캡처한 화면 문구를 대조한다(B-017·A-023·B-003·B-008·E-018·C-025·B-048). `reports/v138/download-sample-compare-v138.{json,md}`.

## 공개 문구 규칙(V138에서 추가)

- 지도 목록 행의 제목·요약은 `<label>` 안이라 용어 버튼을 넣을 수 없어 `PublicTermExpandedTextV134`로 약어를 제자리에서 풀어쓴다. ⓘ 자료 정보와 상세 화면 문장은 `PublicTermTextV134`로 도움말을 연결한다.
- B-017 평가구역 행은 원천 키 `string_id`(`pfaf_id-GID_1-aqid`)를 그대로 쓰지 않고 '성·시 · 유역 {pfaf_id} · 대수층 {aqid}'로 적는다. 유역·대수층 부분이 `None`/`-9999`이면 '유역 구분 없음'·'대수층 없음'으로 적는다. 원천 키는 상세 데이터 표와 다운로드에 남는다.
- 지도 전국 요약은 좌표가 없는 행을 '위치자료 없음(지도 미표시)'으로 따로 세고, '필터로 가려진 수'는 사용자가 고른 필터로 빠진 수만 뜻한다.

## V140 갱신 — 지도 자료 수와 준비 중 표기

- 지도 자료 수는 `map-index.json`의 활성 레이어 수(= `manifest.mapLayerCount`) 하나만 쓴다(`src/data/map/mapAvailabilityV140.ts`의 `summarizeMapAvailabilityV140`). 홈 상태띠 '지도 제공 항목', 지도 목록 머리글 `'{연결}개 자료 · 선택 N개 · 준비 중 {대기}개'`, 지도 데이터 안내, 데이터 찾기 '제공 형태 = 지도 제공' 필터가 같은 수를 낸다. 43은 계약의 대상 수이며 화면에서는 '지도 대상 43개 중'으로만 언급한다.
- 계약에는 있으나 레이어가 없는 대상(B-017)은 목록에서 '준비 중' 배지·점선 테두리·'위치자료 없음 · 지도에 표시하지 않음' 요약·비활성 체크박스로 표시하고, 분류 머리글에 '준비 중 N'을 덧붙인다. ⓘ에는 '준비 중 사유'와 필요한 자료를 적는다. 체크해도 그려지지 않으며 map-index에 레이어가 없으므로 지도에 위치가 표시되지 않는다.
- 검증: `npm run qa:role-split:v140` (`--base-url`로 배포본에도 실행).
