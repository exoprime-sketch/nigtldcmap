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

### 참고: 이 worktree에서 테스트 실행 시 주의

이 저장소 경로(한글 폴더명 + 중첩된 git worktree)에서는 `react-scripts test`의 **기본** `testMatch`(절대경로 기반)가 0건 매칭되는 환경 문제가 있었다(생성된 testMatch 문자열에 구분자가 섞여 나옴 — Jest/CRA 쪽 이슈로 보이며 이 모듈의 코드 문제는 아니다). 해결: `--testMatch='**/mapIconsV152.test.ts'`처럼 **상대 경로 glob**을 명시하면 정상 매칭된다(134개 테스트 통과 확인). 같은 증상이 다른 V15x 테스트에서도 나타나면 같은 방식으로 우회한다.

## 5. 통합 시 주의(메인 세션이 배선할 것)

- `registerMapIcons(map)`을 지도 생성 직후 1회 호출하고, `attachMapIconMissingHandlerV152(map)`을 함께 걸어 지연 등록을 지원한다.
- `mapIconCategoryV152(elementId, properties, layerColor)`의 `layerColor`는 **호출자가 그 레이어의 기존 고리색을 넘겨야** 한다(예: A-023 이외 레이어는 `RealMapExplorerPage.tsx`의 레이어별 색상표를 그대로 전달). A-023·C-025 고정 팔레트·B-048 명명된 광종은 `layerColor`를 무시한다.
- 지도 캔버스 심볼 레이어의 `icon-image`는 `mapIconImageIdV152(id)`(`"mi152-" + id`)를 그대로 쓴다. 고리·배경 원은 이 모듈이 그리지 않으므로 기존 circle 레이어(반지름·고리색은 위 2절 상수 참고)를 그대로 유지한다.
- 팝업·범례 등 DOM에서는 `MapIconBadgeV152`/`MapIconLegendV152`를 쓴다. `mapIconLegendEntriesV152`는 화면에 보여줄 `entries`를 계산만 하고 렌더링은 하지 않는다.
