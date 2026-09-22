# REVIEW — V151-2 34개 집계정책 · 국가 외곽선 · 배경지도 개편 · CCKP 팩 분할 (+ 라벨 계층 · 뷰포트 유지)

브랜치 `feat/v151-2-boundary-policy-backdrop` · 기준 `origin/main` a2d30ac(PR #21) · 작성 2026-09-22 · 실행 환경: 로컬 PC(Windows 11, node 22.19, Chromium 1243, python 3.14 + shapely 2.1.2/pyproj 3.8.0)

## 1. 한 줄 요약
- 34개 경계에서 값을 **레이어별 한 가지 규칙**(`boundaryPolicy`, 빌드 생성)으로 보여 준다. 국가 외곽선을 63개 성·시 병합으로 교체하고, 배경지도를 지형/위성/도로·지명/없음 선택기로 바꿨으며, CCKP 팩을 단독 분할해 상세 준비시간을 줄였다. 구현 중 사용자가 추가한 라벨 중복 제거('다낭' 2회)와 뷰포트 유지(레이어 체크 시 리셋)도 끝냈다.
- main CI(#21 push) 실패 원인은 pack-005(447 MB 디코드) 타임아웃(B-004~B-007 상세, duplicate-copy·screen-usability)이었고, 이 PR의 0단계(팩 분할)가 그 fix-forward다.

## 2. 사용자 결정(구현 전 질문)
- CCKP B-003~B-007: **전 지표 area-weighted-mean**. 원자료 성·시 값이 격자 지표의 ADM1 공간평균이므로 병합 단위의 같은 통계는 면적가중평균이고, member-max/min은 어휘에만 두고 적용 지표 0(판정표 `docs/ADMIN_BOUNDARY_34_V151.md` §2.3).
- B-042: 평균·면적비율 3개 area-weighted-mean, **상위 10% 2개 range-only**(분위형 평균화 금지).

## 3. 변경 내용

### 3.0 팩 분할 (커밋 8eabb56 등)
- 규칙: 요소 payload(`_envelope`와 같은 직렬화) > 8 MB → 단독 팩(`build_public_v2.py#_plan_packs`, ETL과 리팩 공통). 실측 결과 지시문의 B-003~B-007 5개 외에 **B-017(15.3 MB)·B-033(9.3 MB)** 도 초과 → 팩 **19→26**(pack-005/007/009 분할). 데이터 조작 금지 원칙상 하드코딩 대신 규칙으로 판정.
- `tools/vietnam_etl/repack_packs_v151_2.py`: 기존 envelope 디코드(양쪽 해시 검증) → 재봉투 → bundle-index/manifest 갱신, 나머지 16개 팩 바이트 불변. **152개 요소 payload sha256 분할 전후 동일(불일치 0)**. `card-summaries-v140.json`의 packUrl 22곳은 `build:card-summaries:v140`으로 재생성(분석 내용 무변경, generatedAt/sourceHash/packUrl만). `audit-vietnam-generated-data-v133` 15/15 PASS.
- 로더(`vietnamDataLoaderV124.ts`): 원문(최대 447 MB) SHA-256 2차 검증 제거, 압축 SHA-256 1회 + contentByteSize + index 대조 유지. `contentSha256` 필드는 오프라인 게이트용으로 보존. 성능 게이트 리터럴(`audit-vietnam-performance-v128` SELECTED_SHARD_ONLY) 통과.
- 상세 준비시간 계측: `CountryDataElementPage` `performance.measure("cdp-detail-prepare")` + `data-detail-prepare-ms`.

| 실측(3회 중앙값, 콜드 컨텍스트) | 분할 전(main 빌드) | 분할 후 |
|---|---|---|
| B-003 화면 ready / 번들 준비 | 3.02 s / — | **0.50 s / 0.19 s** |
| B-004 | 2.91 s | 1.20 s / 0.51 s |
| B-005 | 2.83 s | 1.10 s / 0.43 s |
| B-006 | 2.84 s | 1.23 s / 0.49 s |
| B-007 | 2.86 s | 1.17 s / 0.48 s |
| 팩 바이트(3회 합) | 41.0 MB | 2.6~11.2 MB |

- 목표 ≤0.8 s: **번들 준비(요청→파싱) 0.19~0.51 s로 충족**. 화면 ready 전체(내비게이션→분석 준비)는 0.50~1.23 s로 전 2.8~3.0 s 대비 58~83% 단축(B-004~B-007은 80 MB JSON 파싱 포함). 파일 `reports/v151-2/detail-prepare-timing-{before,after}.json`.

### 3.1 34개 집계정책
- 계약 `publicMapTargetsV138.json`에 `build.boundaryPolicy34` 42개 선언 → `build-map-layers-v138.mjs`(+`scripts/v151-2/boundary-policy-build-v151-2.mjs`)가 검증·기록. 게이트: 면 레이어 누락·분위 라벨 비-range-only·미존재 measureKey → 빌드 실패.
- 판정: sum 9(B-029 B-030 B-031 B-033 B-034 B-037 B-039 C-016 D-008) · area-weighted-mean 8(B-003~B-007 B-032 B-040 B-041) + B-042(byVariable 2 range-only) · count-sum 2(C-009 C-010) · membership-or 1(C-024) · native-34 4(C-012 C-013 C-019 C-022) · six-region-only 1(B-021) · none 16(점 13·선 1·권역 1 + …). 상세 표 `docs/ADMIN_BOUNDARY_34_V151.md`.
- 면적가중치: `vnm-adm1-34.geojson` 지물에 `areaKm2`·`memberAreaKm2`(63개 전수, 기하 바이트 불변). 6권역 자산 `vnm-region-6.geojson`(6/63, 면적 오차 0 ppm, 합성 정점 0).
- 점 13개 레이어: 좌표 → 63개 경계 point-in-polygon 사이드카 `spatial/locations/<id>.json`(A-023 1,870 located/19 outside/74 no-coord, B-008 관측소 5개소 전부 해상(outside 1575) 등). 팝업 "소재 뚜옌꽝 (구 하장성)".
- 런타임 `src/data/map/boundaryPolicyV151.ts`(257줄, 14 tests) + RMEP 래퍼 `choroplethFeatureCollectionV151`(호출 4곳 교체: MapLibre·SVG 대체·키보드 모델·분석 행). 팝업·우측 패널·토글 고지·지도 분석 패널 통계(최소·중앙·최대·결측 수)가 표시 경계(34/63/6권역) 기준.
- 수치 검증(jest): B-031 34 합계 == 63 합계(3 계열 전수) · B-032 Lâm Đồng 58.05 ∈ [35.57, 73.35](구성 3개, 실자산은 memberAreaKm2 가중) · C-019 34/34 단위 종전 복제값과 동일(conflict 0).

### 3.2 국가 외곽선
- `vnm-country-outline.geojson`(63 병합, 4,839 정점, 44 파트, 면적 330,108 km², 오차 0 ppm) · `-z5`(0.01° 단순화, 981 정점, 2 km² 미만 도서 22개 제외 — 표시 전용). Natural Earth 세계 파일의 베트남(44 정점)은 큰 지도·비교 지도·SVG 대체·미니맵에서 대체(세계 파일은 인접국만, `filter iso3 != VNM`). 스크린샷 `reports/v151-2/shots/outline-before-map.png`(NE 저해상, 해안선 어긋남) / `outline-after-map.png`.
- 잔여: '없음' 배경에서 NE 인접국(라오스) 폴리곤과 실제 국경 사이에 배경색 틈이 보임(NE 저해상도 한계). 지형/위성 배경에서는 덮임. 인접국 외곽선이 베트남 안으로 들어오는 부분은 베트남 fill을 위로 올려 가림.

### 3.3 배경지도
- 저줌(4~5) 이음새(사용자 지적): 워밍업 범위를 국토 ±5°(z5~6 광역 + z7 국토)로 넓히고 래스터 `raster-fade-duration` 700 ms → 배경 러너 z4.5 스크린샷(`reports/v151-2/shots/backdrop-*-z4.5.png`) 24장에서 직사각형 패치 없음(소스 `bounds` 제한은 원래 없었음).
- `mapBackdropV151.ts`(23 tests): 지형(Natural Earth 음영기복 → terrarium hillshade → OFM 하천·도로·철도·지명) / 위성(Esri World Imagery + OFM 국경·지명) / 도로·지명(Liberty 110 레이어 임포트, sprite setSprite, place 라벨 name:ko 우선) / 없음. 배경 레이어 모두 `cdp-country-fill` 아래, 데이터·라벨 위 유지, 국가 fill 0.08/1.
- 성능: preconnect 3호스트, 마운트 시 z5~7 워밍업(+liberty 스타일), 첫 타일 계측(`data-backdrop-first-tile-ms`, `performance.measure`), 5 s 내 타일 0 + 오류 3회 → '없음' 자동 하강 + 1줄.

| 첫 타일(지도, 콜드 컨텍스트 3회) | 1차(워밍업 전) | 최종 |
|---|---|---|
| 지형(기본) | 1.37~1.68 s | **0.59~1.16 s(중앙 0.85)** |
| 위성 | 0.30~0.33 s | 0.23~0.34 s |
| 도로·지명 | 2.62~2.79 s | 1.04~1.34 s(중앙 1.07) |

- 목표 ≤1 s: 위성 충족, 지형 중앙값 충족(최대 1.16 s), 도로·지명 미충족(Liberty 스타일 JSON fetch + 110 레이어 + OFM 벡터 0.75~1.1 s 네트워크). 홈 화면 미니맵은 SVG(타일 없음)라 측정값 없음. 병목은 OFM/S3 타일 네트워크 지연(리소스 타이밍: OFM z5 750~1,076 ms, terrarium 1.2~1.4 ms 콜드)으로 확인.
- 귀속: 지도 하단 kind별 문구 + 이용안내.

### 3.4 문구
- `displaySpatialUnit` 20곳 → "성·시 경계(개편 후 34개 기본 · 개편 전 63개 토글)". 토글 아래 상시 고지 → 선택 레이어 정책 1줄(`data-boundary-policy`), 대기 문구는 "자료를 선택하면 34개 경계에 적용되는 집계 규칙을 여기에 표시합니다". 이용안내(집계 규칙·배경 귀속·view 저장), 지도 작업공간 설명, D-008 안내, 미니맵 각주. `grep -rn "개편 전 63" src`: 원자료 사실 기술(용어집 GADM·한계등록부·시나리오 계약·물 유향·시나리오 요약)은 유지, 화면 설명은 34 기준 병기.

### 3.5 (추가) 라벨 계층·중복 제거
- `mapLabelsV151.ts` + `labelAnchorV151.ts`(polylabel 포트, 의존성 없음). 행정구역 라벨 회색·11 px·자간 0.12·마커 없음·폴리곤 내부 대표점(면적중심은 97개 중 2개가 폴리곤 밖이었음), 도시 라벨 마커+Bold 12.5 px. 성급시 6곳 라벨 1개(63 모드: 트어티엔후에·꽝남 각각). 타일 place 라벨 6개 도시 제외·name:ko 우선, streets는 타일 라벨 사용·우리 도시 라벨 끔. 도시 티어를 행정구역 위에 두어 충돌 우선권.
- `qa:labels:v151-2`: 6곳 × zoom 5·7·9 × {34, 63} 문자열 1개 36검사 + 대표점 내부 28/28(34)·58/58(63) → 40/40 PASS(러너는 도시별로 중심 이동 후 계수).

### 3.6 (추가) 뷰포트 유지
- 원인: `restoreCountryExtent` effect가 `spatialByElement`/`recordsByElement`/`primaryLayerId` 변화마다 fitBounds, `activatePrimaryLayerV126`이 `fitSelectedCountry()` 호출. 수정: 자동 맞춤은 (a) 최초 진입(URL `view=` 있으면 jumpTo, 상세에서 대상 레이어를 들고 오면 그 bbox 1회) (b) 선택 0→1 첫 레이어 bbox가 뷰포트와 전혀 안 겹칠 때만. map 인스턴스 1개(deps `[]`) 유지.
- `MapViewState.camera` + `view=lon,lat,zoom[,bearing]`(App `replaceState`), `moveend`마다 갱신. 상세→지도 진입 시 camera null.
- `qa:viewport:v151-2`: 다낭 z8 → B-033·B-041·A-023 체크, A-023 해제, 색상 표시 B-041, 34/63 토글, 배경 4종 전환 각 단계 center Δ0·zoom Δ0, `view=108.20200,16.05400,8.00` 저장, 새로고침 복원, 무 view 진입은 국가 범위 → **16/16 PASS**.

## 4. 검증 결과

| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0 |
| `npm run test:unit` | **262건 통과(25 suites)** (기준 206+, V151-2 신규: boundaryPolicy 14 · mapBackdrop 23 · mapLabels 5) |
| `audit:boundary-policy:v151-2` | 24/24 PASS(정책 전수·분위 range-only·계약 일치·CCKP awm·B-042 byVariable·파생 자산·사이드카·팩 26) |
| `audit:boundary-34:v151 --skip-browser` | 21 PASS · 1 SKIP |
| `scripts/v151-2/screens-v151-2.mjs` | 54/54 PASS: 42 레이어 × {34, 63} 렌더·콘솔 오류 0 · 배경 4종 × 6 레이어 ready · 팝업 5 · 6폭(320~1920) 가로 넘침 0(지도·상세 B-033) → `reports/v151-2/shots/` |
| `qa:viewport:v151-2` | 16/16 PASS |
| `qa:labels:v151-2` | 40/40 PASS |
| `measure:backdrop:v151-2` / `measure:detail-prepare:v151-2` | §3.3 / §3.0 표 |
| `audit-vietnam-generated-data-v133`(팩 분할 후) | 15/15 PASS |
| `npm run finalize:v151` | (아래 §4.1) |

### 4.1 finalize:v151 (전체 게이트 2회 실행 — CLAUDE.md 반복 상한)
- **1차**(09:42): `release:v136` 48/52 — `map-tooltip:v132` FAIL(`B033_MAP_REGION_TREND`: 34 단위 선택 시 63 행이 없어 추이 없음). 원인 수정(구성 성·시 행을 기간별 같은 규칙으로 집계 + 키보드 선택 모델 unitCode 전달) → `audit:map-tooltip:v132` 단독 8/8 PASS.
- **2차**(12:22): `release:v136` — `map-tooltip:v132` PASS, 나머지 11개 감사 PASS, **`map-popup:v133` FAIL 4건**(GVI 팝업 `place`가 6권역명이라 성 이름 정규식 불일치, D-008 통계 대표점(34 집계)이 B-021 권역 fill 위에서 겹침 선택기 미개방). 원인 수정(구성원 기준 겹침 판정 `fillHasMemberV151`, 감사 `place`에 6권역명 허용 — §4.2) → `audit:map-popup:v133` 단독 **12/12 PASS**.
- 2차에서 `finalize:v136`이 실패해 뒤 단계가 실행되지 않은 항목은 개별 실행: `qa:role-split:v140` **52/52 PASS**, `qa:analysis:v140:baseline` **필수 실패 41 = 기준선 41, 신규 0, 해소 0 → pass**, `audit:boundary-34:v151 --skip-browser` 21 PASS, `audit:boundary-policy:v151-2` 24/24.
- **3차**(13:03, 사용자 승인): `release:v136` — map-tooltip·map-popup 포함 14개 감사 PASS, **`glossary:v134` FAIL 1건**(`VISIBLE_ACRONYM_WITHOUT_GLOSSARY`: 지형 귀속 문구의 AWS·SRTM·GMTED·ETOPO1). 문구를 "Terrain Tiles(Mapzen · Amazon Web Services 공개 데이터, terrarium 인코딩)"로 바꿔 약어 제거 → `audit:glossary:v134` 단독 재실행에서 다른 실패(`active GVI canvas hover popup was not pixel-visible`)가 드러남: 상세→지도 진입 시 대상 레이어 bbox 자동 맞춤이 63개 자산의 도서(Trường Sa 등, ~115°E)까지 포함해 카메라가 해상으로 밀림(중심 108.6°E). bbox를 국가 지도 범위로 클립하도록 수정(중심 106.5°E 확인) → `audit:glossary:v134` 단독 **16/16 PASS**.
- 이후 `git rebase origin/main`(#22~#24): 팩은 main의 19개(#23 데이터 수정 반영)를 규칙으로 재분할(26, payload sha 152 불변), 카드 요약 packUrl·map-index(변경 없음)·asset-integrity 재생성, geometry-manifest 양쪽 자산 유지. 재기준 트리: tsc 0 · unit **289/289**(32 suites) · generated-data 15/15 · boundary-policy 24/24.
- 재기준 트리의 전체 `finalize:v151`은 실행하지 않은 상태(전체 게이트 3회 실행 후 정지 — 반복 상한). merge 전 1회 실행에 사용자 승인 필요.

### 4.2 기대값 변경(사유 기록)
- `scripts/v151/audit-boundary-34-v151.mjs` `SCREEN_VALUE_NOTICE`/`SCREEN_63_NOTICE`: V151의 "값을 34개로 합산하지 않습니다" 상시 고지가 V151-2의 레이어별 집계정책 1줄로 대체됐다. 검사는 정책 문구 또는 대기 안내("집계 규칙")를 허용하도록 확장(값 고지가 사라진 것이 아니라 규칙별 문장으로 구체화). `adminBoundaryV151.test.ts` 동일.
- `scripts/audit-vietnam-map-popup-v133.mjs` `GVI_HOVER_POPUP.place`: B-021이 6권역 경계에 그려지므로 호버 지명이 성 이름이 아니라 권역명(중부고원 등 6개)이 된다. 정규식에 6권역 한글명을 추가(성 이름 조건은 유지).
- `review-runtime-v150.mjs`(게이트 밖 리뷰 러너): 배경 체크박스 → kind 라디오, 레이어 id 접두 `cdp-bd-v151-`, 라벨 레이어 4개로 갱신.

## 5. 미완료와 사유
| 항목 | 사유 |
|---|---|
| 도로·지명 배경 첫 타일 ≤1 s | 1.04~1.34 s. Liberty 스타일 fetch + 110 레이어 삽입 + OFM 벡터 네트워크(0.75~1.1 s)가 한계. 기본값이 아니며 자동 하강 경로 뒤. 후속(스타일 JSON 번들 내장)으로 `docs/FINALIZATION_TRACKER_V153.md` 비고에 기록 |
| 홈 화면 첫 타일 실측 | 홈 미니맵은 SVG(타일 없음) — 측정 대상 아님으로 기록 |
| 미니맵 34 집계 표시 | 미니맵은 63 값 + 국가 외곽선만 교체(V152 인계, 정책 노트는 기존 문구 유지) |
| 34 모드 추이(선택 지역 시계열) | 집계 단위 선택 시 추이는 native-34/단독 단위만 표시(합산 시계열은 후속) |
| '없음' 배경에서 인접국 NE 폴리곤과 실제 국경 사이 배경색 틈 | NE 세계 파일 저해상도 한계, 외부 기하 교체 금지 원칙상 유지 |
| 워크트리 jest 0건 매칭 | `.claude/worktrees/` 경로의 `.` 세그먼트로 CRA testMatch 변환 실패 — 메인 체크아웃에서 실행(환경 이슈, 코드 무관) |
| B-017 | Aqueduct 경계 미확보로 지도 보류 유지 |

## 6. V152 인계
- 미니맵(`DetailLocationMapV148`)에 `boundaryPolicyV151.aggregateTo34V151`을 적용해 34 집계·정책 노트 표시; 배경 상태는 `mapBackdropV151`에서 상속.
- 아이콘 작업 시 `mapLabelsV151`의 도시 마커 레이어(`cdp-ko-city-marker`)와 충돌 규칙 재검토.
