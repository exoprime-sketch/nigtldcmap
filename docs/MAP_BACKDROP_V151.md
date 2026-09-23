# 배경지도 (V151-2)

작성 2026-09-22 · 모듈 `src/data/map/mapBackdropV151.ts` · 라벨 `src/data/map/mapLabelsV151.ts`, `labelAnchorV151.ts` · 화면 `src/pages/RealMapExplorerPage.tsx`

## 1. 종류(패널 좌상단 라디오, 기본 '지형')
| kind | 구성 | 타일 호스트 | maxzoom |
|---|---|---|---|
| `terrain` 지형 | Natural Earth 음영기복 래스터(OpenFreeMap ne2sr, z≤6, 먼저 그려짐) + AWS Terrain Tiles(terrarium) `raster-dem`→`hillshade` + OpenFreeMap planet 벡터(water·waterway·landcover·주요 도로·철도·town/village 지명) | tiles.openfreemap.org, s3.amazonaws.com | DEM 12 |
| `satellite` 위성 | Esri World Imagery 래스터 + OpenFreeMap 국경·지명 | server.arcgisonline.com, tiles.openfreemap.org | 17 |
| `streets` 도로·지명 | OpenFreeMap `liberty` 스타일 전체(런타임에 스타일 JSON을 받아 `background` 제외 110개 레이어를 접두 `cdp-bd-v151-lib-`로 삽입, sprite `setSprite`) | tiles.openfreemap.org | 14 |
| `none` 없음 | 국가 fill만 | — | — |

- 모든 배경 레이어는 `cdp-country-fill` 앞(아래)에 삽입 → 데이터 레이어·한글 라벨은 항상 위. 국가 fill 불투명도: 배경 있음 0.08 / 없음 1(`BASE_FILL_OPACITY_V151`). 바다색 `cdp-base-background`.
- 저장 키 `cdp-map-backdrop-v151`(V150 `cdp-map-backdrop-v150` "off"→"none", "on"→"terrain" 이전 후 삭제).
- 경계: 34개 참조 외곽선 1.6 px(불투명 0.7), 63개 토글 0.8 px(0.42).

## 2. 라벨 계층(사용자 지적: '다낭' 2회)
- 행정구역 라벨(34/63 성·시): 회색(#6b7a76)·11 px·자간 0.12·마커 없음, 대표점은 **polylabel(pole of inaccessibility)** — 면적중심은 오목 폴리곤 밖으로 나가는 사례가 97개 중 2개 있었음. zoom ≥ 6.3.
- 도시 라벨: 점 마커 + 진한 글씨(Noto Sans Bold 12.5 px), zoom ≥ 4. 성급시 6곳(하노이·호찌민·다낭·하이퐁·껀터·후에)은 라벨 문자열이 도시명과 같으면 행정구역 라벨을 그리지 않는다(63 모드의 '트어티엔후에'·'꽝남'은 문자열이 달라 각각 표시).
- 타일 place 라벨: 6개 도시(영문·베트남어 표기)를 필터로 제외, town/village만 z≥8, `name:ko` 우선. `streets`는 liberty 라벨이 도시명을 소유 → 우리 도시 라벨을 끈다(두 소스 동시 표시 금지).
- 토글 시 대표점은 해당 경계 자산(34/63) 기준으로 재계산.

## 3. 성능
- `public/index.html` `<link rel="preconnect">` 3호스트.
- 페이지 마운트 시 저장된 kind의 베트남 bbox z5~7 타일(≈40개/소스)과 liberty 스타일 JSON을 `fetch(cache:"default")`로 워밍업(`warmBackdropV151`) → MapLibre 요청이 HTTP 캐시를 공유. `navigator.connection.saveData`면 생략, 동시 6.
- 첫 타일 시각: `sourcedata`(tile) 첫 발생 − `new maplibregl.Map` → `performance.measure("cdp-backdrop-first-tile")`, `<main.cdp-map-canvas-wrap>` `data-backdrop-kind|status|first-tile-ms`.
- 실패: 배경 소스 `error` 3회 이상이고 5 s 내 타일이 없으면 '없음'으로 자동 하강 + 1줄 안내(`role="status"`). 데이터·경계 레이어는 영향 없음.
- 실측은 `reports/v151-2/backdrop-first-tile.json`(각 kind 3회, 새 컨텍스트=콜드 캐시). 홈 화면의 미니맵은 SVG(타일 없음)라 측정값 없음.

## 4. 라이선스·귀속(지도 하단·이용안내)
- 지형: Terrain Tiles(Mapzen · Amazon Web Services 공개 데이터, terrarium 인코딩) · 음영기복 Natural Earth · 하천·도로·지명 © OpenStreetMap contributors(ODbL) · OpenFreeMap
- 위성: Esri World Imagery — Esri, Maxar, Earthstar Geographics, and the GIS User Community · 지명·경계 © OpenStreetMap contributors(ODbL) · OpenFreeMap
- 도로·지명: © OpenStreetMap contributors(ODbL) · OpenFreeMap Liberty
- 행정경계: geoBoundaries VNM ADM1(CC BY 4.0), 34개는 결의 202/2025/QH15 대응표로 위상 병합.

## 5. 뷰포트 유지(V151-2)
- 레이어 추가·제거, 주 분석(색상 표시) 변경, 변수·기간, 34/63 토글, 배경 전환은 카메라를 움직이지 않는다(`fitBounds`/`flyTo` 호출 없음, map 인스턴스 1개).
- 자동 범위 맞춤 2경우: (a) 최초 진입(URL `view=` 있으면 그 카메라, 상세에서 대상 레이어를 들고 오면 그 레이어 bbox 1회) (b) 선택 0→1에서 켠 첫 레이어 bbox가 뷰포트와 전혀 겹치지 않을 때. 그 외는 '전체 범위 보기' 버튼.
- `view=lon,lat,zoom[,bearing]`을 `moveend`마다 App 상태(`MapViewState.camera`)로 올려 `history.replaceState`로 URL에 기록 → 새로고침·공유 링크 복원.
- 검증 `scripts/v151-2/viewport-preserve-v151-2.mjs` → `reports/v151-2/viewport-preserve.json`.

## 6. 러너
- `scripts/v151-2/measure-backdrop-v151-2.mjs --build <dir> --runs 3 [--screens]` 첫 타일 실측·스크린샷
- `scripts/v151-2/label-dedup-v151-2.mjs --build <dir>` 성급시 6곳×zoom 5·7·9 문자열 1개, 대표점 내부 34/63
- `scripts/v151-2/viewport-preserve-v151-2.mjs --build <dir>` 뷰포트 유지 16검사
- `scripts/v151-2/smoke-boundary-policy-v151-2.mjs --build <dir>` 34/63/6권역 렌더 스모크
