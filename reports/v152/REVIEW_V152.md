# REVIEW V152 — 홈·상세 공용 미니맵(확대·이동) + 데이터별 지도 아이콘 체계 (feat/v152-minimap-icons)

작성 2026-09-24 · 기준 origin/main `325b355` · 지시서 `P3_V152_지도아이콘.md`(PR-C)

## 요약
- 홈 '주요 지역 데이터'와 상세 작은 지도: 첫 화면은 기존 정적 SVG, 조작 의도(마우스 300ms·포커스·터치·클릭·버튼)가 있으면 MapLibre 미니맵으로 바뀜 → 확대·이동·팝업·선택·'큰 지도에서 비교' 위치 인계
- 큰 지도·미니맵·범례·팝업: 점 계열 15개 레이어에 데이터·분류별 아이콘(35종: Tabler MIT 31 · Material Apache-2.0 2 · 자체 제작 2)
- 레이어 렌더러를 `src/map/layers/*`로 추출해 큰 지도와 미니맵이 같은 코드로 그림(추출 커밋 스타일 스냅샷 94회 차이 0)

## 커밋
| # | 커밋 | 내용 |
|---|---|---|
| ① | `7c2f46f` | 렌더러 추출(화면 변화 0) |
| ② | `626fb69` | 아이콘 모듈·라이선스(W1 worktree 서브에이전트 작성, 메인 검수) |
| ③④ | `993905d` | 미니맵(엔진·상세/홈 통합·인계) + 큰 지도·미니맵 아이콘·범례·팝업 |
| ⑤ | `43340ed` | 첫 로드 경량화 · 카드 결측 0 표기·팝업 중복·KR 표시 수정 · 러너·문서 |
| ⑥ | 이 커밋 | REVIEW·PR_BODY·게이트 결과 |

- ③과 ④를 한 커밋으로 합친 사유: 미니맵 엔진이 아이콘 렌더러(`mountPreparedMapLayerV152({icons})`)를 그대로 호출하도록 만들어, 둘을 나누면 중간 커밋에서 미니맵만 원 기호로 그리거나 아이콘 없는 옵션 경로를 임시로 더 만들어야 했음

## 변경

### ① 렌더러 추출(동작 불변)
- `src/map/layers/` 15개 모듈: `types`·`colors`(`LAYER_COLORS`·`A023_FUEL_COLORS_V126` 이동)·`baseStyle`·`ids`·`contract`·`features`·`symbols`·`boundaryLayer`·`lineLayer`·`regionLayer`·`choroplethLayer`·`clusterLayer`·`pointLayer`·`pointIconLayer`(④)·`index`
- 통일 시그니처: `prepareMapLayerV152(input, options)`(순수 — GeoJSON·렌더 시그니처) → `mountPreparedMapLayerV152(map, prepared, options)`(부수효과), 한 번에 `renderMapLayerV152(map, input, options)`. `options = { icons, labels, interactive, clusterMaxZoom }`
- 페이지에 남긴 것: 데이터 로딩, 활성·순서 계산, 이벤트 바인딩(React 클로저), 선택 강조, 캔버스 아래 SVG 대체 렌더러. 팝업 DOM 빌더는 `src/components/map/mapPublicPopupV129.ts`로 옮겨 미니맵과 공유
- `RealMapExplorerPage.tsx` 9,296 → 7,829줄

### ② 아이콘 모듈
- `src/data/map/mapIconsV152.ts`(API `mapIconIdFor`·`mapIconCategoryV152`·`mapIconSvg`·`registerMapIcons`·`attachMapIconMissingHandlerV152`·`mapIconLegendEntriesV152`, 출처·라이선스 `MAP_ICON_SOURCES_V152`), 생성 파일 `mapIconPathsV152.ts`(35종 path만), React `MapIconSpriteV152`·`MapIconLegendV152`
- 출처: `@tabler/icons` 3.48.0(devDependency, 빌드 스크립트 `scripts/v152/build-map-icons-v152.mjs`가 필요한 path만 추출), Material Symbols flood·landslide(원본 SVG + NOTICE), 자체 제작 석탄·가스·석유. 아이콘 폰트 CDN·이모지·브랜드 로고 0
- 이용안내 `#guide-map`에 조작법·아이콘 출처 문단(Tabler Icons MIT © Paweł Kuna · Material Symbols Apache-2.0 © Google · 자체 제작), 계약 문서 `docs/MAP_ICON_CONTRACT_V152.md`

### ③ 미니맵
- `MiniMapV152`(정적 껍데기·조작 UI) / `miniMapEngineV152`(동적 import 청크 `minimap-engine-v152`: maplibre·CSS·렌더러·배경·라벨·아이콘) / `miniMapStateV152`(상태기계·단일 인스턴스·옵션·인계) — 문서 `docs/MINIMAP_V152.md`
- `cooperativeGestures`(휠은 페이지 스크롤, Ctrl+휠 확대, 두 손가락 이동), [+]·[−]·[전체 보기]·[배경지도], 키보드(화살표·+/−·Home·Esc), 확대 4~12, 이동 한계 (핵심 bbox ∪ 레이어 bbox)+2°, 첫 화면은 레이어 범위를 본토 bbox로 자른 범위(padding 24), 한글 지명 zoom 6 이상, 회전·기울기 끔
- 페이지당 엔진 1개, 화면 밖 500ms → `map.remove()`(마지막 카메라 기억), 실패 시 정적 지도 + 안내·다음 의도 때 1회 재시도, 콘솔 오류 0(배경 오류는 없음으로 하강)
- 팝업·선택: 큰 지도와 같은 빌더. 클릭 = 지도 상자 안 카드 고정 + 선택 강조 + `onSelectFeature`(상세 선택 패널 갱신). '큰 지도에서 비교': 엔진이 움직인 카메라·변수·기간을 `App.tsx` `openElementOnMap(…, view)`로 넘겨 URL `view=`·`mapSelectors`에 기록
- `DetailLocationMapV148`은 파일명·props·기존 testid 유지(V151 경계 감사·V150 히어로 검사 계약), 인쇄는 정적 SVG

### ④ 아이콘 적용
- 점 = 흰 원 배지(고리 = 분류색) + 아이콘 symbol(`icon-image: ["get","__icon"]`, overlap 허용, 크기 줌 5→9: 0.7→1.0), 배지 반지름 주 분석 10→13px·보조 9→11px, A-023 설비용량 4구간 배지 크기(범례 10/100/500 MW와 일치), 근사 위치는 옅게, hover·선택 링, E-018·E-019 KR 표시, 클러스터에 대표 아이콘(흰색 변형)
- 큰 지도 범례: 활성 목록 대표 아이콘 배지(`data-symbol-shape` 유지), 초점 레이어는 지도에 그린 피처 속성으로 센 아이콘·분류명·개수(A-023은 + 설비용량 배지 4단계)
- 팝업·우측 패널: 규격 있는 9개 데이터는 `facilityCardV153` 라벨형 카드('미기재' 유지)
- 미니맵 정적 SVG: 점 60개 이하 레이어는 아이콘 배지, 그 이상은 분류색 점 + 아이콘 범례. 송전선은 큰 지도와 같은 전압 3구간 색

### ⑤ 첫 로드 경량화·결함 수정
- 추출 전 빌드 대비 홈 첫 로드 JS가 gzip +19.8 KB였던 원인 3가지 제거: 정적 경로의 아이콘 래스터·등록 코드 → 아이콘 묶음 동적 청크(`map-icon-kit-v152`, 지점 레이어만), 배경지도 모듈(9.6 KB raw) → 종류 판단·출처 문구를 엔진으로, 공개 레이어 제목 모듈(10.7 KB raw) → 컴포넌트가 원래 머리글에 쓰던 `publicShortTitle`
- 활성 직후 빈 지도: 엔진이 레이어 데이터 소스 로드까지(최대 2.5초) 기다린 뒤 active
- 시설 카드 숫자 칸 결측 → '0' 표기(기존 결함, `Number("")`=0): C-025 연간 예상감축 388건 중 262건이 '0 tCO₂e/년'으로 보였음 → '미기재'. 이번 PR이 팝업·선택 패널에도 카드를 쓰게 되어 함께 수정(한 줄, 라벨·명세 불변 — P7 브랜치는 이 파일 미변경 확인) + 단위 테스트
- 점 팝업: 카드에 소재지 행이 있으면 '소재 …' 주석 반복 제거(카드 없는 데이터는 주석 유지 — V151-2 정책 "팝업에 소재 성·시 표시" 충족)
- 범례 KR 표시: `font: 700 7.5px/1.15 inherit`(단축 속성에 `inherit` → 선언 전체 무효)로 글자가 과대 → 개별 속성

## 검증 결과(실행 성공 ≠ 내용 완성)
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0(테스트 파일 jest 타입 경고 제외) |
| `npm run test:unit` | 467/467 (37 suites) — 아이콘 규칙·출처 134, 실데이터 아이콘 전수 15, 레이어 스펙 6, 미니맵 상태기계·옵션·인계 12, 카드 결측 1 포함 |
| production 빌드(`CI=true`, sourcemap off) | 성공, lint 경고 0 |
| 렌더러 추출 스타일 스냅샷 | 42개 레이어 단독 + 조합 5종 × 경계 34/63, 94회 **차이 0**(`renderer-extraction-diff-v152.json`) |
| `qa:map:v138` 추출 전후 | 42/42 동일, 콘솔 0(차이는 외부 타일 요청 취소 건수 410→412뿐) |
| 미니맵 러너 | 9화면 × 25검사 + 390px 터치 2 × 6검사 전부 통과, 콘솔 0 (`minimap-runtime-v152.json`) |
| 아이콘 러너 | 15개 레이어: 아이콘 부여 100%·등록 100%·`styleimagemissing` 0·범례=지도(14, D-018 해당 없음)·390px 최소 배지 지름 18~20px, 콘솔 0 (`map-icons-runtime-v152.json`) |
| 6폭(320/390/768/1024/1440/1920) × 홈·지도·상세 8 | 60/60 가로 넘침 0, 콘솔 0 (`responsive-v152.json`) |
| `qa:detail-contract:v153 --ids` 8개 | 8/8 |
| `review:screens:v138 --ids` 8개 | 8/8 ready, 콘솔·HTTP 실패·넘침·내부 문구 0 |
| 인식 목록형 구 감사 15개 개별 실행 | 14 PASS(home v128·entity-cards v131·portfolio v132·map-tooltip v132·map-popup v133·layer-distinction v133·map-focus v133·glossary v134·map-list-ui v136·public-text v136·duplicate-copy v136·map-copy v136·generic-detail v136-2·screen-usability v136-4), `map-interaction:v129` FAIL — 아래 |
| 홈 LCP(5회 중앙값) | 144 → 144 ms(변화 0%), LCP 요소 H1 동일, 의도 없이 엔진 로드 0 (`home-lcp-v152.json`) |
| `audit:performance:v128` | FAIL 3건 — 모두 main 빌드에서 동일(아래) |
| `finalize:v140` 1회 | **통과**(`GATE_EXIT 0`, 09:18~09:45) — `verify:dataset-directory:v150` 통과 · `release:v136` **79/79** · `qa:role-split:v140` **52/52** · `qa:analysis:v140:baseline` 필수 실패 39건(기준선 41 이내), **새 실패 0**, 해소 A-023·C-012 |
| e2e(`build-candidate-v137` + playwright) | 213 통과 · 1 실패 — `visual › detail-a016`(3% 차이: 핵심 수치 줄부터 약 60px 어긋남). D1(#27)이 상세 레이아웃(핵심 수치 줄)을 바꾼 뒤 기준 이미지를 갱신하지 않은 것으로, D1 PR의 CI e2e(advisory, Linux)에서도 `home`·`detail-a016`·`detail-d011` 3건이 실패(이 PR의 CI e2e도 같은 3건) → **이 PR 원인 아님**. 미니맵 오버레이가 들어간 홈 기준선(win32)은 2% 이내 통과. 기준 이미지 교체는 README 절차(실제 이미지 검토 후 교체, Linux는 CI 산출물)로 fix-forward 후보 |

- `map-interaction:v129`: 지도 카드가 정확히 12개가 되기를 기다리는 V129 기대값(현재 42개)이라 main에서도 map-load 단계 시간 초과 — 게이트(release v136) 밖의 옛 감사. 이 PR로 바뀐 것은 소스 문자열 검사 `publicPopup` 1개(팝업 빌더 파일 이동). 기대값은 바꾸지 않음
- `audit:performance:v128`: ① `INITIAL_BUNDLE_REGRESSION` — V128 기준선(226,643 B) 대비 main이 이미 +110%(진입 gzip 475,895 B, 이 PR 477,042 B: +1,147 B = 이용안내 문단·인계 코드) ② `DUPLICATE_BUILD_ASSET` — CSS 140/699(osa134·sda134) 중복은 main 빌드에도 동일 ③ `DEPLOYMENT_SOURCE_MAP_POLICY` — 로컬에서는 배포 산출물 확인 불가(not-verified)

## 감사 인식 목록 변경(기대값·임계값 변경 없음)
- `scripts/v134/public-non-glossary-allowlist-v134.mjs` `PUBLIC_LICENSE_IDENTIFIERS_V134`에 `MIT` 1개 추가 — 이용안내 아이콘 출처 표기("Tabler Icons(MIT, © Paweł Kuna)")의 라이선스 식별자. 이 목록은 "라이선스 원문 정확성을 위해 코드를 유지"하는 공개 라이선스 식별자 목록(CC·CC-BY-4.0·BY-NC-SA 등 CC 계열)이라 같은 성격으로 등재("Apache-2.0"은 약어 패턴에 걸리지 않아 추가 불필요). 용어집 감사 임계값·다른 목록은 불변, glossary v134 PASS(미등재 약어 0)

## 미니맵 실측(게이트 빌드 `43340ed`, 1440px)
| 화면 | 첫 줌 | Ctrl+휠 줌 | 휠만(스크롤 Δ·줌) | 드래그 Δ(경·위도) | 버튼 +/− | 키보드 →·+·−·Home | 전체 보기 | 팝업(카드) | 인계 `view=` | 해제(생성/해제) | 정적 아이콘 | 검사 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | 4.58 | 4.58→5.09 | +240px · 불변 | +0.99, -0.68 | 6.09→7.09/−1 | 통과 | 복귀 | 열림 | `105.85000,16.09531,5.58` | 2/2 | 받지 않음 | 25/25 |
| A-023 | 4.21 | 4.21→4.71 | +240px · 불변 | +1.30, -0.89 | 5.71→6.71/−1 | 통과 | 복귀 | 열림·카드 | `105.85000,16.31252,5.21` | 2/2 | 배지 0·범례 7 | 25/25 |
| A-024 | 4.21 | 4.21→4.71 | +240px · 불변 | +1.30, -0.89 | 5.71→6.71/−1 | 통과 | 복귀 | 열림 | `105.85000,16.09531,5.21` | 2/2 | 받지 않음 | 25/25 |
| B-004 | 4.00 | 4.00→4.50 | +240px · 불변 | +1.50, -1.03 | 5.50→6.50/−1 | 통과 | 복귀 | 열림 | `106.73574,16.05557,5.00` | 2/2 | 받지 않음 | 25/25 |
| B-023 | 4.40 | 4.40→4.90 | +240px · 불변 | +1.13, -0.78 | 5.90→6.90/−1 | 통과 | 복귀 | 열림 | `105.75833,15.55620,5.40` | 2/2 | 배지 3·범례 1 | 25/25 |
| B-033 | 4.00 | 4.00→4.50 | +240px · 불변 | +1.50, -1.03 | 5.50→6.50/−1 | 통과 | 복귀 | 열림 | `106.73574,16.05557,5.00` | 2/2 | 받지 않음 | 25/25 |
| C-025 | 4.21 | 4.21→4.71 | +240px · 불변 | +1.29, -0.89 | 5.71→6.71/−1 | 통과 | 복귀 | 열림·카드 | `105.85000,16.25606,5.21` | 2/2 | 배지 0·범례 3 | 25/25 |
| E-018 | 4.51 | 4.51→5.01 | +240px · 불변 | +1.05, -0.73 | 6.01→7.01/−1 | 통과 | 복귀 | 열림·카드 | `105.70904,16.03911,5.51` | 2/2 | 배지 14·범례 1 | 25/25 |
| B-021 | 4.00 | 4.00→4.50 | +240px · 불변 | +1.50, -1.04 | 5.50→6.50/−1 | 통과 | 복귀 | 열림 | `106.73574,16.05557,5.00` | 2/2 | 받지 않음 | 25/25 |

- 휠만: 페이지가 240px 스크롤되고 지도 배율 불변(cooperativeGestures) · 드래그·키보드·버튼은 배율/중심 실측 변화 · 전체 보기·Home은 첫 화면으로 정확히 복귀 · 해제: 화면 밖 500ms 뒤 인스턴스 생성 2 = 해제 2, 캔버스 0 · 인계: 큰 지도가 URL `view=`의 카메라(±0.01°, 배율 ±0.05)로 열림 · 정적 아이콘: 지점 레이어만 아이콘 묶음을 받고(배지 = 점 60개 이하일 때 그린 수, 범례 = 분류 항목 수), 선·면·홈은 받지 않음

| 터치(390px) | 검사 | 결과 |
|---|---|---|
| A-023 | tapStartsEngine, touchHelpText, oneFingerScrollsPage, twoFingerPan, pinchZooms, noHorizontalOverflow390 | 6/6 |
| A-024 | tapStartsEngine, touchHelpText, oneFingerScrollsPage, twoFingerPan, pinchZooms, noHorizontalOverflow390 | 6/6 |

## 아이콘 누락값
- 실제 전달 데이터 전수(`iconCensusV152.test.ts`): 점·군집 14개 레이어의 모든 지점이 자기 분류 아이콘, 대체(`alert-triangle` 등 기본) 아이콘 **0건**. A-023 원자료 `(미표기)` 5건은 의도된 '미기재' 분류(회색 번개), 원자력·지열은 자료 0건이라 범례에 나타나지 않음
- 러너(큰 지도, 기본 필터):

| 레이어 | 지점 | 아이콘 부여 | 사용 아이콘 | 등록 | `styleimagemissing` | 범례=지도 |
|---|---|---|---|---|---|---|
| A-023 | 236 | 236 | 7 | 7/7 | 0 | 일치 |
| B-012 | 265 | 265 | 6 | 6/6 | 0 | 일치 |
| C-025 | 262 | 262 | 1 | 1/1 | 0 | 일치 |
| B-048 | 2 | 2 | 1 | 1/1 | 0 | 일치 |
| E-005 | 20 | 20 | 3 | 3/3 | 0 | 일치 |
| A-025 | 3 | 3 | 1 | 1/1 | 0 | 일치 |
| B-008 | 5 | 5 | 1 | 1/1 | 0 | 일치 |
| B-023 | 3 | 3 | 1 | 1/1 | 0 | 일치 |
| B-028 | 4 | 4 | 1 | 1/1 | 0 | 일치 |
| B-025 | 8 | 8 | 1 | 1/1 | 0 | 일치 |
| D-018 | 4 | 2 | 1 | 1/1 | 0 | 해당 없음(지역 범위 — 활동지점만 아이콘) |
| E-004 | 17 | 17 | 1 | 1/1 | 0 | 일치 |
| E-006 | 8 | 8 | 1 | 1/1 | 0 | 일치 |
| E-018 | 14 | 14 | 1 | 1/1 | 0 | 일치 |
| E-019 | 6 | 6 | 1 | 1/1 | 0 | 일치 |

- 390px 최소 배지 지름: A-023 18px, C-025 20px, E-018 20px

## 번들·LCP
| 항목 | 추출 전(main `325b355`) | 이 PR | 변화 |
|---|---|---|---|
| `main.js` raw / gzip | 2,042,653 / 430,421 B | 2,045,308 / 431,531 B | +2,655 / +1,110 B(이용안내 문단·인계 인자) |
| 홈 첫 로드 JS(의도 전) gzip | 447,153 B | 453,065 B | +5,912 B(+1.3%) — 미니맵 껍데기·상태기계 |
| 상세 선·면(A-024·B-004) 첫 로드 gzip | 447,153 B | 453,065 B | +5,912 B |
| 상세 지점(A-023·C-025) 첫 로드 gzip | 447,153 B | 461,271 B | +14,118 B — 위 + 정적 아이콘 묶음 8.2 KB(첫 렌더 뒤 동적 요청) |
| maplibre 청크(1,062,816 B)·엔진 청크 | 의도 전 요청 0 | 의도 전 요청 0 | 러너 `noEngineChunkBeforeIntent` 9/9 |
| 홈 LCP 중앙값(5회) | 144 ms | 144 ms | 0% |

## 스크린샷
- 미니맵: `reports/v152/shots/minimap/{home,A-023,A-024,B-004,B-023,B-033,C-025,E-018,B-021}-active-1440.png`·`-popup-1440.png`, 터치 `A-023-touch-390.png`·`A-024-touch-390.png`
- 큰 지도 아이콘·범례: `reports/v152/shots/icons/`(A-023 1440·390·위성, B-012, C-025 1440·390, D-018, E-005, E-018 1440·390)

## 지시서와 다른 점(결정·사유)
- 엔진 활성화는 **조작 의도 시에만**(사용자 결정 2026-09-24) — "보이고 1초 후 자동" 대신. 방문자 대부분은 엔진·타일을 받지 않고, 홈 감사 `HOME_MAP_ENGINE_NOT_LOADED` 기대값 불변
- 홈은 히어로 지도만 미니맵화(사용자 결정). '주요 데이터' A-024 카드 썸네일은 그대로
- 점 계열은 13개가 아니라 **15개**(cluster 2 · point 12 · D-018 활동지점)
- 정적 SVG는 기존 63개 경계 그림 유지(지시서) → 엔진 활성 시 34개 기준 경계로 바뀔 수 있음(P4 값 인코딩 때 정비)
- 비교 모드(`MapComparisonWorkspaceV135`) 아이콘 보류: 창별 색 구분이 V135 감사 계약이라 창 색 고리 변형·창 범례 개편이 함께 필요(후속)
- `MapLegendV118`은 import처가 없는 코드라 큰 지도 인라인 범례에 적용
- 미니맵만 `clusterMaxZoom` 11(큰 지도 13 유지) — 최대 확대 12에서 A-023 군집이 끝까지 안 풀리던 문제
- KR 표시: 캔버스는 `text-field: "KR"`, DOM 범례는 CSS `::after`(원시 코드 노출·용어집 검사 대상 아님)
- 미니맵 범례의 단일 아이콘 레이어 이름은 작은 지도 머리글과 같은 `publicShortTitle`(큰 지도는 공개 레이어 제목) — 첫 로드에서 제목 모듈(10.7 KB)을 빼기 위함
- 성능 목표 "main.js 증가 0"·"상세 초기 JS 증가 없음": main.js +1.1 KB gzip(이용안내 문단은 main 번들 페이지), 첫 로드 +5.9 KB gzip(의도를 받는 껍데기는 정적이어야 함). 엔진·maplibre는 목표대로 0

## 범위 밖 발견(보고만)
- C-025·B-048 필터 필드가 원자료 속성에 없어 값을 고르면 점이 모두 사라지는 것으로 보임(`filterRecords`, 미검증)
- A-025 `symbolByFact` 미사용, 상세 → 큰 지도 `__map*` 차원 키가 URL에 남지 않음(이번 인계는 `mapSelectors`로 우회)
- 미니맵 배경 출처 줄(좌상단)이 좁은 상세 폭에서 북서쪽 일부를 덮음(클릭은 통과, 반투명)
- `map-interaction:v129`·`audit:performance:v128` 기준선이 V129/V128에 고정 — 게이트 밖 옛 감사

## 미완료·사유
- 병합 순서 P7 → P3 → P10: P7(`feat/v156-data-refresh-20260922`)이 아직 main에 없음 → P7 병합 후 origin/main을 이 브랜치에 합치고 아이콘 전수 테스트(`iconCensusV152`)·아이콘 러너를 갱신된 데이터로 다시 돌린다
- 상세 페이지 선택 연동(`onSelectFeature` → V153 차트)은 prop만 제공 — `CountryDataElementPage`는 P10 영역이라 연결하지 않음
- e2e 시각 기준선 `detail-a016`(win32·Linux)과 `home`·`detail-d011`(Linux) 교체: D1 이후 기존 실패라 이 PR에서 바꾸지 않음(기준 이미지를 현재 화면으로 덮지 않는 규칙). 필요하면 별도 fix-forward에서 실제 이미지 검토 후 교체
- CI 정적 게이트: 새 러너 이미지(ubuntu-24.04 `20260920.314.1`)에서 첫 헤드리스 Chrome 기동이 15초를 넘어 `LARGE_SOURCE_TABLE`이 2회 실패(이 PR 원인 아님) → 별도 PR #29(재기동·대기 예산, `reports/v152-1/`)로 main에 먼저 반영하고 이 브랜치에 main을 합침
- Vercel Preview 확인·사용자 승인 대기(merge는 승인 후 `--squash --delete-branch`)
