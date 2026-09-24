# 지도 아이콘 (V152)

작성 2026-09-24 · 규칙·API `src/data/map/mapIconsV152.ts` · 생성 자산 `src/data/map/mapIconPathsV152.ts`(생성기 `scripts/v152/build-map-icons-v152.mjs`) · 컴포넌트 `src/components/map/MapIconSpriteV152.tsx`(스프라이트·배지), `src/components/map/MapIconLegendV152.tsx`(범례) · 스타일 `src/components/map/map-icons-v152.css`

## 1. 분류 규칙 (레이어 → 속성 키 → 값 → 아이콘 → 고리색)

값은 원자료에 실제로 존재하는 문자열이다(추정·신규 라벨 생성 없음). "미기재"류는 원자료에 없는 값을 만든 것이 아니라, 원자료가 이미 "표기 없음"이라고 말하는 상태를 가리키는 별도 범주다(`fallback: false`). 그 외 이 표에 없는 값은 안전하게 같은 자리(폭넓게는 "기타"류 또는 미기재 아이콘)로 표시하되 `fallback: true`로 표시해 검토 대상임을 남긴다.

### A-023 발전소 — 키 `fuelType`(한글 또는 WRI 영문 키, 대소문자 무관; `primaryFuel`도 `powerPlantFuelV141`로 함께 읽음)

발전원 분류는 `src/data/map/powerPlantFactsV141.ts`의 12종 라벨이 정본이며, 아이콘도 이 라벨 키로만 매핑한다(CLAUDE.md 도메인 메모).

| 값 | 아이콘 | 고리색 |
|---|---|---|
| 수력 | droplet | `#2f8fc1` |
| 태양광 | solar-panel-2 | `#e8a317` |
| 풍력 | windmill | `#27a5a5` |
| 석탄 | coal(자체 제작) | `#3f3f46` |
| 가스 | flame | `#377eb8` |
| 가스·석유 | flame-barrel(자체 합성) | `#4f6f8f` |
| 석유 | barrel | `#6b7280` |
| 바이오매스 | plant-2 | `#5a9d55` |
| 폐기물 | recycle | `#8c6bb1` |
| 원자력 | radioactive | `#7a1f5c` |
| 지열 | volcano | `#b5542b` |
| (결측·"(미표기)"·"미표기"·"미기재"·"unknown"·"-" 등) → **미기재** | bolt | `#8a9a93` |
| 그 외 인식 못한 값 → 미기재와 같은 표시, `fallback: true` | bolt | `#8a9a93` |

### B-012 재해 — 키 `disasterType`(대체 키 `재해유형`), 고리색은 항상 레이어색

| 값 | 아이콘 |
|---|---|
| 폭풍·태풍 | storm |
| 홍수 | flood |
| 가뭄 | sun-high |
| 사면이동(습윤) | landslide |
| 전염병 | virus |
| 산불 | flame |
| 병해충 | bug |
| 이상기온 | temperature-sun |
| 그 외 값(결측 포함) → 원문 그대로 표시, `fallback: true` | alert-triangle |

### C-025 탄소 프로젝트 — 키 `standard`

| 값 | 고리색 |
|---|---|
| CDM | `#7053a3` |
| Gold Standard | `#b8860b` |
| Verra VCS | `#2e7d32` |
| GCC | `#1565c0` |
| JCM | `#c62828` |
| ART TREES | `#6d4c41` |
| 그 외(결측 포함) → "기타 등록제도", `fallback: true` | `#757575` |

아이콘은 모두 certificate.

### B-048 광산 — 키 `mineral`(대체 키 `광종`)

| 값 | 고리색 |
|---|---|
| 니켈 | `#5f7f3a` |
| 구리 | `#b5651d` |
| 희토류 | `#6a5acd` |
| 보크사이트/알루미나 | `#c0504d` |
| 티타늄(ilmenite·leucoxene) | `#607d8b` |
| 텅스텐(+형석·비스무트·구리) | `#37474f` |
| 그 외(결측 포함) → "기타 광종", 레이어색, `fallback: true` | 레이어색 |

아이콘은 모두 pick.

### E-005 대학·연구기관·NGO — 키 `orgType`, 고리색은 항상 레이어색

3개 범례 그룹으로 묶는다. 정확히 일치하지 않는 값은 순서대로 정규식을 적용한다(`/NGO|네트워크/` → `/연구|싱크탱크|아카데미/` → `/대학/`, 일치 시 `fallback: false`). 아무 것도 일치하지 않으면 "기타 기관"(building, `fallback: true`).

| 그룹 | 아이콘 | 포함 값(정확히 일치) |
|---|---|---|
| 대학 | school | 대학, 대학(학부), 대학(연구그룹) |
| 연구기관 | flask | 연구소, 대학 부설 연구소, 싱크탱크, 연구기관(국가 아카데미) |
| NGO·네트워크 | heart-handshake | NGO, NGO(국제), 국제 NGO 대표사무소, 네트워크(NGO 연합) |

### 단일 아이콘 레이어 (label=null → 화면이 레이어 제목 사용, 고리색은 항상 레이어색)

| 레이어 | 아이콘 | 태그 |
|---|---|---|
| A-025 | cloud-down | — |
| B-008 | ripple | — |
| B-023 | gauge | — |
| B-028 | gauge | — |
| B-025 | droplets | — |
| D-018 | world | — |
| E-004 | building-bank | — |
| E-006 | coin | — |
| E-018 | building-skyscraper | KR |
| E-019 | building-bank | KR |

### 대표(군집·레이어 단위) 아이콘

A-023 bolt · B-012 alert-triangle · C-025 certificate · B-048 pick · E-005 building · 그 외 레이어는 자신의 단일 아이콘.

## 2. 배지 기하 상수 (`MAP_ICON_BADGE_V152`)

지도 캔버스에 그릴 때 MapLibre `interpolate` 표현식에 그대로 붙여 쓰는 줌-값 쌍이다(이 모듈은 스스로 지도 레이어를 만들지 않는다 — 아래 "통합 시 주의" 참고).

```
radius:   { primary: [[5,10],[9,13]], context: [[5,9],[9,11]] }  // px, 줌 5→9
iconSize: [[5,0.7],[9,1.0]]                                       // 배율, 줌 5→9
ring:     { primary: 2.5, context: 2 }                            // 고리 두께 px
```

DOM 배지(`MapIconBadgeV152`)는 고정 22px 원 + 2.5px 고리를 쓰며 위 표는 참고하지 않는다(지도 캔버스용과 범례/팝업용 크기 체계는 서로 다르다).

## 3. 출처·라이선스

| 출처 | 라이선스 | 대상 |
|---|---|---|
| Tabler Icons | MIT · © Paweł Kuna | 31개 아이콘 + `flame-barrel` 합성(원본 두 개 모두 Tabler, `flame`+`barrel`) |
| Material Symbols | Apache-2.0 · © Google | `flood`, `landslide` (svg-400 outlined, v0.47.5, unpkg에서 1회 내려받아 커밋) |
| 자체 제작 | CC0-1.0 | `coal`(석탄 화력을 나타내는 굴뚝·연기 오리지널 도안) |

`flame-barrel`은 Tabler의 `flame`(작게, 우상단)과 `barrel`(좌하단)을 24×24 안에 배율·이동해 합성한 것으로, MIT 라이선스가 허용하는 수정에 해당한다. 두 원본 이름을 모두 `sourceName`("flame + barrel")에 남긴다. 합성에 쓴 배율·이동값은 `MAP_ICON_PATHS_V152["flame-barrel"].partTransforms`에 기록되어 있다(참고용 — `paths`에 이미 반영됨).

`scripts/v152/icons/material/NOTICE.md`에 Material Symbols의 Apache-2.0 고지 전문이 있다.

### 이용안내 페이지에 붙일 한 문단(한국어)

> 지도에 쓰인 기호(발전원·재해·탄소사업 등 아이콘)는 Tabler Icons(MIT, © Paweł Kuna)와 Material Symbols(Apache-2.0, © Google)를 사용하고, 두 세트에 없는 기호(석탄 화력, 가스·석유 복합)는 직접 제작했습니다.

## 4. 아이콘 추가·변경 방법

1. `src/data/map/mapIconsV152.ts`의 분류 규칙(예: `A023_FUEL_RULES_V152`)을 수정하거나, 새 원본 SVG를 `scripts/v152/icons/material/` 또는 `scripts/v152/icons/custom/`에 추가한다(Tabler는 `node_modules/@tabler/icons/icons/outline/<name>.svg`에서 바로 읽으므로 `scripts/v152/build-map-icons-v152.mjs`의 `TABLER_ICON_IDS` 배열에 이름만 추가). 새 아이콘 id는 `scripts/v152/build-map-icons-v152.mjs`의 목록(Tabler/Material)이나 `CUSTOM_MANIFEST`(Custom)에도 등록한다.
2. `node scripts/v152/build-map-icons-v152.mjs`를 실행해 `src/data/map/mapIconPathsV152.ts`를 다시 생성한다(같은 입력이면 항상 같은 출력 — 결정적).
3. `npx react-scripts test --env=jsdom --watchAll=false --testMatch='**/mapIconsV152.test.ts'` 로 테스트를 갱신·확인한다(새 규칙이면 `mapIconsV152.test.ts`에 케이스 추가).
4. Tabler 파일은 `<path>` 요소만 있어야 하며, 생성기가 그 외 요소(`<circle>`, `<rect>` 등)를 만나면 즉시 실패한다 — 실패하면 해당 아이콘은 수작업 검토가 필요하다는 뜻이다.

### 참고: 테스트 실행
- 한글이 들어간 경로의 중첩 worktree에서는 CRA 기본 `testMatch`가 0건 매칭된 적이 있다(작업 worktree `nigt-wt-d3`에서는 정상). 같은 증상이면 `--testMatch='**/mapIconsV152.test.ts'`처럼 상대 glob을 준다.

## 5. 지도·범례·팝업 적용(구현)

| 자리 | 구현 | 파일 |
|---|---|---|
| 점 레이어(큰 지도·미니맵 공통) | 흰 원 배지(`circle`, 고리 = 분류색) + 아이콘(`symbol`, `icon-image: ["get","__icon"]`, `icon-allow-overlap`·`icon-ignore-placement` true, `icon-size` 줌 5→9: 0.7→1.0, 보조 레이어는 ×0.82) + hover 링 + 선택 링 + KR 표시(E-018·E-019, `text-field: "KR"`) | `src/map/layers/pointIconLayer.ts` |
| 피처 속성 | `__icon`(이미지 id) · `__iconColor`(고리색) · `__iconKey`(범례 그룹) · `__iconTag` — 공유 피처 빌더가 `preparePointLayerV152({icons:true})`에서 기록 | `src/map/layers/index.ts` |
| 배지 크기 | 반지름 줌 5→9: 주 분석 10→13px, 보조 9→11px(390px 화면에서도 지름 ≥ 18px). A-023은 범례 4구간(10 MW 미만·10~99·100~499·500 이상; 용량 미기재는 가장 작게)으로 5→9: 9/10/11.5/13 → 11/12.5/14/16px | `pointIconLayer.ts` |
| 클러스터 | 기존 원·숫자 유지 + 주 분석일 때 대표 아이콘 흰색 변형(`mi152-<id>--w`)을 숫자 위에 | `pointIconLayer.ts`, `registerMapIcons(map, ids, "white")` |
| D-018 활동지점 | 같은 배지 + `world` | `src/map/layers/regionLayer.ts` |
| 큰 지도 범례 | 활성 목록: 레이어 대표 아이콘 배지(`data-symbol-shape` 속성 유지 + `data-icon-id`). 초점 레이어: `MapIconLegendV152` — 지도에 그린 피처의 `__icon`·`__iconColor`를 현재 필터 기준으로 세므로 범례와 지도가 어긋날 수 없음. A-023은 발전원 아이콘·개수 + 설비용량 배지 크기 4단계 | `src/pages/RealMapExplorerPage.tsx` |
| 팝업 | 제목 앞 아이콘, 규격 있는 9개 데이터(A-023·A-025·B-048·C-025·E-004·E-005·E-006·E-018·E-019)는 `facilityCardRowsV153` 라벨형 카드 전 행("미기재" 유지) | `src/components/map/mapPointPopupV152.ts`, `mapFeaturePopupV148.ts` |
| 큰 지도 우측 패널 | 규격 있는 데이터는 `FacilityCardV153`(기존 테스트 id 유지) | `RealMapExplorerPage.tsx` |
| 미니맵 정적 SVG | 점 60개 이하 레이어는 아이콘 배지(`<use>`), 그 이상은 분류색 점 + 아이콘 범례(분류명·개수). 스프라이트·범례·분류 규칙은 지점을 그리는 레이어일 때만 동적 청크 `map-icon-kit-v152`(`src/components/map/mapIconKitV152.ts`)로 받는다 — 선·면 레이어와 홈(A-024)은 아이콘 코드를 받지 않음 | `src/components/data/public/DetailLocationMapV148.tsx` |
| KR 표시(DOM) | 배지의 CSS `::after`(7.5px 굵게) — DOM 글자가 아니므로 원시 코드·용어집 검사 대상 아님 | `map-icons-v152.css` |

- 모양 기호(V129 원·사각·삼각·마름모)는 캔버스 아래의 SVG 대체 렌더러와 범례 속성(`data-symbol-shape`)에 그대로 남는다(V133 레이어 구분 감사 계약).
- **비교 모드**(`MapComparisonWorkspaceV135`)는 이번에 바꾸지 않았다: 두 창을 창별 색으로 구분하는 것이 V135 감사 계약이라, 창 색 고리 변형과 창 범례 개편을 함께 해야 한다(후속).

## 6. 검증
- 단위: `src/data/map/mapIconsV152.test.ts`(규칙·출처·SVG 134건), `src/map/layers/iconCensusV152.test.ts`(실제 전달 데이터 — 14개 점 레이어의 모든 지점이 자기 분류 아이콘, 대체 아이콘 0건; 점·군집·지역 레이어와 아이콘 규칙 목록 일치), `src/map/layers/pointIconLayer.test.ts`(레이어 스펙·최소 반지름·A-023 용량 구간·클러스터·아이콘 끔 시 V129 그대로).
- 러너: `node scripts/v152/map-icons-runtime-v152.mjs --build <dir>` → `reports/v152/map-icons-runtime-v152.json` — 15개 레이어 사용 아이콘 등록 100%·`styleimagemissing` 0·범례와 지도 (아이콘, 색) 분류·개수 일치·390px 최소 배지 지름·스크린샷(`reports/v152/shots/icons/`).
