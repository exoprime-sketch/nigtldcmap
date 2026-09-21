# REVIEW V150 — 지도 가독성·패널·축단위·개조식 설명 최종화 (PR-A)

- 브랜치 `feat/v150-map-readability-final` ← `origin/main` 7220e24(V147 #17). Codex의 V148~V150 미커밋 WIP를 이 브랜치로 옮겨 검증·보완했다.
- 이 문서는 "실행 성공"과 "내용 완성"을 구분한다. 수치는 모두 실제 실행 결과이며, 실행하지 않은 검증은 마지막 절에 적는다.

## 1. WIP 이전(1단계)

- 이전 전 작업 트리: `git status --short` 167줄(수정 77 + 미추적 90). 미추적 90개 중 49개는 이미 `origin/main`에 있는 파일(V144~V147 산출물)이었고, 그중 42개는 내용이 같고 7개만 V148~V150 변경이 있었다.
- 프롬프트의 `stash push -u → checkout origin/main → stash pop`은 이 49개 때문에 `stash pop`이 "untracked file already exists"로 실패하므로, 승인 하에 `stash push -u → stash apply`(백업본만 보존) → `checkout -b feat/v150-map-readability-final` → `git reset --mixed origin/main`(브랜치·인덱스만 이동, 작업 트리 무변경)으로 옮겼다. `--hard`·강제 checkout 없음.
- 보존: 브랜치 `backup/v150-wip-20260921`(920d330), `stash@{0} "v148-v150 wip 20260921"`(merge 전까지 유지).
- 결과: `git diff --stat origin/main` 46 files(+568/−1,373) + 신규 ≈ 87개 파일. 500개 미만.
- 이번 PR에 넣지 않은 잔여(범위 밖, 미추적 유지): `reports/v142/`(77개, 17 MB 스크린샷), `reports/v143/`(2), `scripts/v142/`(임시 덤프 5), `reports/v144/DEPLOYMENT_PREVIEW_V144.md`, 루트 `.docx`.

## 2. 변경 요약(V148·V149·V150)

| 영역 | 내용 |
|---|---|
| 데이터 지도(V150) | '추천 분석' 버튼 5개 삭제(`src/` 내 문자열 0건). 배경지도 토글(OpenFreeMap 벡터 + Natural Earth 지형, localStorage `cdp-map-backdrop-v150`)과 저작권 표기 연동. 한글 지명 심볼 3레이어(국가·도시·성·시 63개, `mapBackdropV150.ts`). 좌우 패널 리사이저 재작성(`useResizableMapPanelsV129.ts`: 최소 120, 최대=화면 여유, 지도 최소폭 200, 더블클릭 초기화, 화살표/Shift/Home/End, `cdp-map-*-panel-width-v150`). 클러스터 개수 라벨 글꼴 `Noto Sans Regular` 지정(기본 Open Sans 스택은 글리프 서버 404 → 콘솔 오류·라벨 미표시였음). 관찰용 `__nigtMapObserverV137.styleLayers()/sourceNames()` 추가(읽기 전용) |
| 차트(V150) | `ChartAxesV150`(`data-chart-axes`, 가로·세로·단위) — WIP 15개 + 이번 추가 8개 지점: `InteractiveTimeSeriesChartV127`(단위 span 대체, `chart-unit-label` testid 유지), `PublicEmissionsAnalysisV132` 구성 막대, `PublicCompositionTrendAnalysisV132` 막대, `OccupationEmploymentWagePreviewV125` 산점도, `PrimaryEnergyCompositionAnalysisV132` 절대량·구성비 누적면적 2개, `CpiaPolicyCapacityAnalysisV126` 클러스터 막대, `ClimateBudgetAllocationAnalysisV129` 배분 누적막대 |
| 설명(V150) | `datasetDescriptionsV150.json` 152개(13~26자). 점검 스크립트 `scripts/v150/description-review-v150.mjs` → `DESCRIPTION_REVIEW_V150.md`. 데이터명 전체를 그대로 되풀이한 20개(A-008, A-020, A-021, A-031, A-033, B-001, B-016, B-024, B-025, B-028, B-032, B-033, B-039, B-047, C-023, D-006, D-010, E-008, E-013, E-014)와 공개 제목에 6자 이상을 더하지 못한 5개(A-010, A-011, B-009, D-022, E-003; `audit:finder-card:v135` 기준) 재작성 → 위반 0. 찾기 카드·상세 히어로·분석 제목이 같은 문자열을 사용(코드 경로 3곳 + 빌드 화면 152/152 일치). 홈 카드는 설명을 렌더하지 않음(제목·요약값만) |
| 단위(V150) | `scripts/v150/unit-review-v150.mjs` → `UNIT_REVIEW_V150.md`(152행 + 측정단위 1,448개 부록). 항목 판정 OK 98 · 해당 없음(등록부·상태) 46 · 검토 7 · 위반 후보 1. 조치: `unitDisplayV150.ts/.json`으로 같은 크기 단위만 표시 철자 통일(Mt CO2eq·MtCO2e·백만 tCO₂e → MtCO₂e, 백만 kW → GW, 십억 kWh → TWh; CO₂-only는 CO₂e로 넓히지 않음). 적용: ChartAxesV150, `observationUnitV125`, 배출·구성·지역·비교·요약표·원자료표·작은 지도·지역 시나리오 컴포넌트, GHG 부문·가스 분석, 카드 요약 빌드·홈 요약 빌드(A-010·A-011·A-012 카드 `Mt CO2eq` → `MtCO₂e`), 용어집 별칭, analysis QA 별칭. 값·정밀도·다운로드 불변. C-018 '에너지 수요 전망 ｜ MW'(레코드 0)는 원자료 확인 전 미변경 |
| 홈·안내(V149/V150) | 홈 '주제별 데이터' 0, 조회순/최신순, 주요 지역 SVG 지도. `DataGuidePage.tsx`의 "집계 전에는 주요 자료를 안내합니다." 삭제. `HomePage.tsx`의 "조회 집계가 준비되면 … 현재는 주요 자료를 안내합니다."는 미연결 상태 안내(V149 설계)로 유지 |
| 상세 작은 지도(V148) | `DetailLocationMapV148` 42개, 팝업·오른쪽 패널 정리(`reports/v148/FINALIZATION_V148.md`) |
| 공용 집계(V149) | `api/usage.js`, `server/usage.cjs`, `publicUsageV149`, `datasetDirectoryV149.json`(prebuild), `docs/SHARED_USAGE_V149.md`. Redis·환경변수 연결은 범위 밖 |
| 검증 인프라 | `scripts/v150/review-runtime-v150.mjs`(지도·찾기·홈·반응형·축단위·설명), `map-combinations.mjs`(공유 URL 조합), `serve-review.mjs`(4330) |
| 공개 문구·용어(게이트 회복) | V144~V148 화면이 용어 도움말 없이 내보내던 약어를 `PublicTermTextV134`로 감쌈: 작은 지도 출처 각주(GADM·ADM1·AQUASTAT·GRDC·HydroSHEDS·UMD·WRI·MONRE 등 35개 토큰; 원자료의 "(레코드별 상이 — attr_19 참조)" 내부 메모는 `publicSourceOrganizationV136_1`로 제거), 작은 지도·전국 자료 선택값 재표기(CDD·SSP·GHI·LTA·ERA5·FCPF·ERPA·kWh), 분석 막대 제목·라벨, 분포 제목(AE·IE), NDC·BUR3·CCS·LCOE·GDL·HydroSHEDS·UIS·PDP8 문구, 변화량 단위, 홈 자료기간. 용어집 추가 4개(IE 이행기관, TRWR, TAND 인민법원, VKSND 인민검찰원). B-023·B-028 '측정항목' → '관측 항목'. 중복 제목 제거: A-015·A-025·B-026의 구성요소 h3가 분석 제목(h2)과 같아 하위 제목으로 변경. D-011 주 분석에 자료기간(2020–2024년) 문장 추가 |

## 3. 기대값 변경(사유 기록 — CLAUDE.md 규칙)

| 파일 | 체크 | 이전 → 이후 | 사유 |
|---|---|---|---|
| `scripts/audit-vietnam-map-copy-v136.mjs` | `MAP_PANEL_REQUIRED_COPY` | "추천 분석" 필수 → 필수 목록에서 제거, 은퇴 목록에 추가 | V150 요구사항으로 추천 분석 삭제(승인) |
| 〃 | `MAP_PANEL_SECTION_ORDER` | 추천 분석 → 지도 데이터 순서 → 추천 분석 없음 + 지도 데이터 존재 | 〃 |
| 〃 / `audit-vietnam-map-access-v135.mjs` / `audit-vietnam-map-guide-v135.mjs` | `MAP_PRESET_COUNT` | 5 → 0 | 〃 |
| `scripts/v138/map-runtime-qa-v138.mjs` | 프리셋 클릭 · 저장 키 | 버튼 클릭 → `combinationUrlV150` URL 진입 · `-v129` → `-v150` 저장 키 | 같은 레이어 조합 검증 유지 |
| `e2e/smoke.spec.ts` | 프리셋 버튼 수 | 5 → 0 | 〃 |
| `e2e/map-presets.spec.ts` | 5개 조합 | 버튼 클릭 → 공유 URL 진입, 동일 단언(primary·rendered·context) | 〃. 프리셋 알림(`role=status`) 단언은 URL 진입 경로에 해당 UI가 없어 제거 |
| `scripts/v140/analysis-qa-v140.mjs` | `UNIT_ALIASES` | `MtCO₂e` 별칭 추가 | 표시 철자 통일(값 불변) |
| `scripts/audit-vietnam-entity-cards-v131.mjs` | `ENTITY_RECORDS_SHOWN_SOMEHOW` 인식 | 분포 요약 셀렉터에 `power-plant-list-v148`, `transmission-voltage-table-v140` 추가 | V148에서 A-023 발전소 목록·A-024 전압표가 카드 그리드를 대체(레코드는 표시됨). 기대 자체는 유지 |
| `scripts/audit-vietnam-portfolio-analysis-v132.mjs` | `PORTFOLIO_YEAR_NOT_INVENTED` 연도 판독 | 4자 숫자만 연도로 인정(`"20.4"` 값 오판 제거) | 파서 오류 수정. **main CI에서도 실패 중이던 항목**(#16·#17 CI red) |
| 〃 | `E008_ANALYSIS_BEFORE_LIST` · `RESEARCH_LIST_BEFORE_ANALYSIS` | `e008-trend` 필수 → "국가 추세 또는 '국가 통계 없음' 안내 중 하나" + breakdown·collaboration·list 순서 | V144가 관측값 0건인 국가 추세를 그리지 않도록 바꾼 결정(`ResearchPatentAnalysisV144.test.ts`)을 감사가 따라가지 못했음. main CI red 원인 |
| `scripts/audit-vietnam-generic-detail-public-v136-2.mjs` | `CATEGORY_GROUPING_PRESERVED` 건수 판독 | `<strong>`의 모든 숫자 연결(`"4건 26.7%"→4267`) → 첫 번째 정수 | V143 분포 막대가 건수와 구성비를 함께 표기. 파서 수정 |
| `scripts/audit-vietnam-glossary-v134.mjs`, `scripts/v134/public-non-glossary-allowlist-v134.mjs` | 허용 목록 | `XML`(공개 자료 형식), `A1-2`·`SQ4`(C-011 주소 지번) 추가 · `V134_ONLY_ELEMENTS` 디버그 필터 | 용어가 아닌 형식명·주소 코드 |
| `scripts/audit-vietnam-release-v136.mjs` | `MAP_PRESET_COUNT` | 5 → 0 | 추천 분석 삭제(승인) — 릴리스 감사 자체의 중복 체크 |
| `scripts/audit-vietnam-map-tooltip-v132.mjs` | `A023_TOOLTIP_PUBLIC_TITLE_RESOLVER` 훅 위치 | `RealMapExplorerPage.tsx`의 `testId: "a023-map-tooltip-v132"` → `mapFeaturePopupV148.ts`의 `testid = "a023-map-tooltip-v132"`도 인정 | V148이 팝업 조립을 별도 모듈로 옮김. 렌더 결과(`data-testid`)는 동일 |
| `scripts/audit-vietnam-finder-scroll-v136.mjs` | `FINDER_INTERSECTION_OBSERVER` | "scroll 리스너 금지" → "scroll 리스너가 `setVisibleCount`를 부르지 않음" | V149의 scroll 리스너는 복귀용 scrollY 저장(rAF·passive)이며 추가 로딩은 여전히 IntersectionObserver |
| `e2e/detail-reference.spec.ts` | A-016·D-011·A-017·D-022·D-025 | V137 문구("61개 연도", 연도 선택 기본 2050, KPI 타일 "총 사업 수") → V146 화면의 같은 사실(연도 선택지 61개, 발전비용 기본 2023·2050 선택 후 21/79, 집계표 1,876,471,402 USD·금액 기재 15건 등) | V146·V147 상세 재설계로 문구가 바뀌었으나 값은 동일. main의 e2e에서도 같은 8개가 실패 중이었음 |
| `e2e/visual.spec.ts-snapshots/*-win32.png` | 홈·A-016·D-011 baseline | 갱신 | V149·V150 화면 변경. Linux baseline은 이번에 갱신하지 않음(CI advisory) |
| `scripts/v139/home-runtime-qa-v139.mjs`, `scripts/v140/role-split-qa-v140.mjs` | 홈 주제 칩·8개 고정 목록 | V149에서 조정(주제 영역 삭제, 동적 8개) | `reports/v149/REVIEW_V149.md` |
| `vercel.json` `ignoreCommand`, `scripts/v140/verify-ignore-command-v140.mjs` | 감시 경로 | `api server scripts/v149` 추가 | V149 API·서버 변경도 Preview 빌드 대상(사용자 승인) |

## 4. 검증 결과

### 4.1 정적·단위
- `npx tsc --noEmit`: 통과(0 오류). `readabilityV150.test.ts`에 `@jest/globals` import를 추가해 tsc 경고 17건도 0.
- `npm run test:unit`: **20 suites / 211 passed**(V149 206 + readabilityV150 3 + unitDisplayV150 2). 결과 `reports/v150/unit-tests-v150.json`.
- `node scripts/v150/description-review-v150.mjs`: 152개, 위반 0, 소비 경로 3/3.
- `node scripts/v150/unit-review-v150.mjs`: 152행, 측정단위 1,448개 중 표기 25 · 검토 4 · 위반 후보 2(C-018, 레코드 0).

### 4.2 브라우저(Playwright Chromium, production 빌드 `tmp/build-v150-review`, `main.42845ea0.js`)
`reports/v150/review-runtime-v150.json`, 스크린샷 `output/public-review-20260921/v150/`.

| 항목 | 결과 |
|---|---|
| 데이터 지도 · 추천 분석 | `[data-testid=map-analysis-preset]` 0, 본문 "추천 분석" 0 |
| 배경지도 토글 | 초기 켬: 배경 레이어 5개 표시·OpenFreeMap 저작권 표시 → 끔: 5개 `visibility:none`·저작권 문구 제거·`cdp-map-backdrop-v150=off` → 켬: 복원·`on` |
| 한글 지명 | `cdp-ko-country/city/province` 3레이어 visible, 라벨 소스 133개, 하노이·다낭·호찌민 존재(성 예: 잘라이·푸옌·닥락·카인호아·럼동) |
| 패널 리사이즈(1440px) | 왼쪽 320 → 드래그 최소 120 → 1020 → 최대 1096(= `aria-valuemax`, 지도 캔버스 200px 유지) → 더블클릭 320 → ArrowRight×3 350 → Shift+ArrowLeft 310 → 저장값 310 → 새로고침 후 310(`--cdp-map-left-panel-width: 310px`). 오른쪽 120 → 420 → 더블클릭 360 |
| 42개 레이어 순차 진입 | 42/42 primary 일치 · 42/42 렌더 피처 > 0 · 콘솔 오류 **0**(클러스터 글꼴 수정 전에는 A-023·B-012에서 글리프 404 2건) |
| 데이터 찾기 뒤로가기 | 1280px: 정렬 title·대분류 B·제공 형태 map·상세검색 펼침·카드 23·scrollY 1235 → 상세 → Back → 동일. 390px: scrollY 3195, 동일 |
| 홈 | '주제별 데이터' 0 · `.home-category-chips` 0 · '집계 전' 0 · 히어로 SVG(경로 670개, 텍스트 하노이·다낭·호찌민·북) · 카드 8. 스크린샷 1440/390: 바다(연청)·육지·성 경계(회색)·송전선(주황 500 kV/파랑 500 kV 미만)·지명이 구분됨 |
| 반응형 | 홈·찾기·상세(E-005, B-023, A-023)·지도·다운로드 × 320/390/768/1024/1440/1920 = **42조합 넘침 0** |
| 상세 152 축·단위 | 차트 블록이 있는 화면 106개, 블록 175/175 `[data-chart-axes]`(적용 전 10개 미달 → 8개 지점 보완). 차트 없는 46개는 등록부·상태·표 화면 |
| 설명 일치 | 찾기 카드 152/152 = JSON, 상세 히어로 152/152 포함 |

### 4.3 게이트·e2e·릴리스
- `npm run finalize:v140` = `finalize:v136` → `qa:role-split:v140` → `qa:analysis:v140`
  - `finalize:v136`(release 감사): **79/79 PASS**(6차 실행, 그 전 실행은 entity-cards → portfolio → map-tooltip → oda·finder-card·duplicate-copy·finder-scroll 순으로 원인을 고치며 재실행. 2차·5차는 `ci-command-timings.json` 쓰기 오류(UNKNOWN, Windows 파일 잠금)로 중단 → 쓰기 재시도 추가). 개별 감사 25개도 별도 실행해 모두 PASS.
  - `qa:role-split:v140`: **52/52**(홈 `/api/usage` 응답 미소비로 networkidle 도달 실패 → 본문 닫기, A-023 홈 카드 단위 '원천 수록 행(곳)' → '곳'; 1회 파일 잠금 재시도).
  - `qa:analysis:v140`: 필수 실패 **41건 / 152(카드 값 미표기 24 · 카드 선택·지표명 미표기 16 · URL 차원 유실 4 · 다운로드 건수 불일치 2 · 컨트롤 무효 1 · 주 분석 적합 1 · selectOption 시간 초과 2; 겹침 있음). 지도 기호 41/41, 컨트롤 125/126**(1차 103 → 컨트롤 라벨 판독 일치·지도 선택 패널 '지도 표시'·자료연도 폴백 후). 남은 항목은 V146~V148 상세 재설계가 V140 카드 계약(card-summaries)과 어긋난 것으로 PR-D(V153)로 이관 — §5 표. 이 단계 때문에 CI는 붉게 끝난다(main도 V144 이후 동일).
- e2e: `node scripts/v137/build-candidate-v137.mjs --data public/data/vietnam/v2` → `npx playwright test`: **214/214**(추천 분석 spec 전환 + detail-reference 5개 갱신 + win32 baseline 3개 갱신 후; 갱신 전에는 main과 같은 8개 실패).
- `npm run test:usage:v149`: 10/10.
- `npm run release:vietnam-pilot`: 실행하지 않음(analysis QA 미해결 상태에서 릴리스 판정을 내지 않기 위해; PR-D 이후 실행).

## 5. 미완료·주의

### 5.1 PR-D(V153)로 이관하는 analysis QA 필수 실패 41건
사용자 결정(2026-09-21): 이 PR은 현 상태로 제출하고 카드 계약(card-summaries-v140) ↔ 상세 재설계(V146~V148) 불일치는 PR-D에서 처리. CI의 `qa:analysis:v140` 단계는 이 때문에 붉게 끝난다(main도 V144 이후 같은 단계에서 실패).

- 등록부 카드의 "N건"이 상세 주 분석에 없음(C-002~C-017, E-007, E-015, E-016 …): V147 화면이 목록 대신 표·매트릭스를 그리면서 카드의 건수 주장과 어긋남 → 카드 모델을 새 화면 기준으로 재정의하거나 화면에 건수를 진술
- 카드 선택·지표명 미표기(A-013, A-015, A-016, A-017, A-022, A-025, A-027, A-028, A-029, A-031, A-033, B-001, D-001, E-012 …): V147 컴포넌트가 카드가 넘긴 measure·dimension 이름을 제목·선택기에 쓰지 않음
- 카드 값 미표기(A-010 582.7 MtCO₂e, A-023 41,350 MW, B-026 23.3 %, D-011 16.65억 USD, E-012 51,860 천명 …)
- URL 차원 유실(A-006, A-030, A-031, A-033: `dim.detail`), 다운로드 건수 불일치(B-023 11 vs 10, B-028 16 vs 15 — 원자료 건수 확인 필요), B-024 기준연도 컨트롤 무효, E-018 비교 범주 명명, C-002·C-019 selectOption 시간 초과(숨김 select)

| 항목 | 카드 유형 | 분류 | QA 메시지 |
|---|---|---|---|
| A-006 | line | URL 차원 유실·카드 선택·지표명 미표기 | selection lost in URL: dim.detail=null / detail does not show the card's selection: selection "ILO 모델추정" not shown; selection "경제활동인구 대비 실업자 비율(ILO 모형 |
| A-010 | composition | 카드 값 미표기·카드 선택·지표명 미표기 | card value 582.7 (MtCO₂e, 2024) not stated as such on the detail / detail does not show the card's selection: year 2024 not shown |
| A-013 | level | 카드 선택·지표명 미표기 | detail does not show the card's selection: measure "NDC-SDG 연계 건수" not named |
| A-015 | level | 카드 선택·지표명 미표기 | detail does not show the card's selection: selection "정규화 달성도 점수(0~100)" not shown |
| A-016 | composition | 카드 선택·지표명 미표기 | detail does not show the card's selection: measure "1차 에너지 소비" not named |
| A-017 | bars | 카드 선택·지표명 미표기 | detail does not show the card's selection: measure "LCOE" not named |
| A-022 | line | 카드 선택·지표명 미표기 | detail does not show the card's selection: selection "연간 고객당 순간정전 횟수" not shown |
| A-023 | grouped-bars | 카드 값 미표기 | card value 41,350 MW (MW) not stated as such on the detail |
| A-025 | level | 카드 값 미표기·카드 선택·지표명 미표기 | card value 5 건 (건, 2026) not stated as such on the detail / detail does not show the card's selection: year 2026 not shown; measure "CCS 시설 수" not nam |
| A-027 | level | 카드 선택·지표명 미표기 | detail does not show the card's selection: selection "피처 수" not shown; selection "OSM 도로 레이어의 지물 건수" not shown; measure "도로 레이어" not named |
| A-028 | level | 카드 선택·지표명 미표기 | detail does not show the card's selection: selection "피처 수" not shown; selection "OSM 수로 레이어의 지물 건수" not shown; measure "수로 레이어" not named |
| A-029 | level | 카드 선택·지표명 미표기 | detail does not show the card's selection: measure "무역협정 건수" not named |
| A-030 | line | URL 차원 유실 | selection lost in URL: dim.detail=null |
| A-031 | line | URL 차원 유실·카드 선택·지표명 미표기 | selection lost in URL: dim.detail=null / detail does not show the card's selection: selection "통관 부문 점수(1=낮음 ~ 5=높음)" not shown |
| A-033 | line | URL 차원 유실·카드 선택·지표명 미표기 | selection lost in URL: dim.detail=null / detail does not show the card's selection: selection "정기선 해운 연결성 지수(Q1 분기값)" not shown |
| B-001 | bars | 카드 값 미표기·카드 선택·지표명 미표기 | card value 263 mm: number found without the unit "mm" / detail does not show the card's selection: measure "월 평년강수" not named |
| B-023 | facts | 다운로드 건수 불일치 | recomputed from the download file: 11 vs card 10 |
| B-024 | line | 컨트롤 무효 | control without effect on the primary analysis: 기준연도 (2023년 → 2022년) |
| B-026 | spatial | 카드 값 미표기 | card value 23.3 % (%) not stated as such on the detail |
| B-028 | facts | 카드 값 미표기·다운로드 건수 불일치 | card value 15건 (건) not stated as such on the detail / recomputed from the download file: 16 vs card 15 |
| C-002 | facts | 카드 값 미표기·화면 미로드(selectOption 시간 초과) | card value 82건 (건) not stated as such on the detail / runtime: page.selectOption: Timeout 30000ms exceeded. |
| C-003 | facts | 카드 값 미표기 | card value 96건 (건) not stated as such on the detail |
| C-004 | facts | 카드 값 미표기 | card value 58건 (건) not stated as such on the detail |
| C-005 | facts | 카드 값 미표기 | card value 135건 (건) not stated as such on the detail |
| C-006 | facts | 카드 값 미표기 | card value 50건 (건) not stated as such on the detail |
| C-011 | facts | 카드 값 미표기 | card value 44건 (건) not stated as such on the detail |
| C-012 | facts | 카드 값 미표기 | card value 120건 (건) not stated as such on the detail |
| C-013 | facts | 카드 값 미표기 | card value 64건 (건) not stated as such on the detail |
| C-014 | facts | 카드 값 미표기 | card value 93건 (건) not stated as such on the detail |
| C-015 | facts | 카드 값 미표기 | card value 20건 (건) not stated as such on the detail |
| C-016 | bars | 카드 값 미표기 | card value 27,385 MW (MW) not stated as such on the detail |
| C-017 | facts | 카드 값 미표기 | card value 52건 (건) not stated as such on the detail |
| C-019 | bars | 화면 미로드(selectOption 시간 초과) | runtime: page.selectOption: Timeout 30000ms exceeded. |
| C-024 | facts | 카드 값 미표기 | card value 20건 (건) not stated as such on the detail |
| D-001 | level | 카드 선택·지표명 미표기 | detail does not show the card's selection: selection "바이오에너지 기술 (Biomass)" not shown; selection "총투자액÷설비용량 중앙값" not shown; measure "단위 사업당 CAPEX" not  |
| D-011 | line | 카드 값 미표기 | card value 16.65억 USD (USD, 2024) not stated as such on the detail |
| E-007 | bars | 카드 값 미표기 | card value 19건 (건) not stated as such on the detail |
| E-012 | level | 카드 값 미표기·카드 선택·지표명 미표기 | card value 51,860 천명 (천명, 2024) not stated as such on the detail / detail does not show the card's selection: measure "총 취업자 수" not named |
| E-015 | facts | 카드 값 미표기 | card value 4건 (건) not stated as such on the detail |
| E-016 | facts | 카드 값 미표기 | card value 4건 (건) not stated as such on the detail |
| E-018 | bars | 주 분석 적합 |  |


- Vercel 환경변수·Redis 연결(공용 집계 운영)은 범위 밖. 연결 전 홈은 대표 자료 안내 상태.
- C-018 '에너지 수요 전망 ｜ MW·VND/kWh'(레코드 0, 선택지 전용)와 A-010 `Gg`(가스별 원단위)는 원자료 확인 대상으로 남김.
- 한글 지명·클러스터 라벨은 OpenFreeMap 글리프 서버에 의존한다. 오프라인이면 라벨만 빠지고 데이터 레이어는 유지된다(설계).
- 이번 런타임 검토는 Windows 로컬 Chromium 기준이다. Linux 시각 baseline·실기기 iOS/Safari는 실행하지 않았다.

## 6. V151(행정경계 34) 인계 메모
- `mapBackdropV150.ts`의 `PROVINCE_KO_V150`는 63개 기준(주석 명시) → 34개 라벨 추가·토글 연동 필요. `readabilityV150.test.ts` 3번 테스트(63개)도 갱신 대상.
- '63개 성·시' 문구: `RealMapExplorerPage.tsx`(지도 상태 문구·저작권), `DataGuidePage:195`, `MapDataGuideV130:22`, `DetailLocationMapV148:136`, `publicMapWorkspaceV126:392,462,464,523`, `publicRegionScenarioContractV138:63`, `geoBoundariesV116:87` 등 20여 곳.
- `reports/v138/map-targets-build-v138.json` `crosswalk34`의 Hà Tĩnh key `"ha"` 정규화 버그.
- `scripts/audit-vietnam-map-layout-v129.mjs`(게이트 밖 레거시)는 아직 `-v129` 저장 키를 읽는다.
