# 후속 작업 보고 — 기존 구현 확인 후 지도·분석 완성 (V138)

작성일: 2026-09-15 · 브랜치: `feat/public-analysis-completion-v138` · 작업 기준 커밋: `12e56f7` (변경은 이 위에 커밋)

## 1. 상태를 나누어 적음

| 구분 | 상태 | 근거 |
| --- | --- | --- |
| 구현 완료(로컬 production build) | **완료** — 지도 대상 43개 중 42개 연결(완전 28 · 부분 14), B-017 미연결 사유·필요자료 기록. 152개 상세 화면 ready 152/152, 콘솔·HTTP 오류 0, 내부 문구 잔존 0 | `reports/v138/map-targets-v138.md`, `reports/v138/screen-review-v138.md`, `reports/v138/map-runtime-qa-v138.json` |
| 후보 Preview URL | **미생성** — 이 브랜치는 원격에 push되지 않았고(`origin`에 `feat/public-analysis-completion-v138` 없음) Vercel Preview는 push 이후 생성된다. 로컬 검증은 `.\build`(같은 소스) 기준 | `git branch -r` |
| production 반영 | **미반영** — https://nigtldcmap.vercel.app 은 2026-09-15 재검토 시점에 지도 12개 레이어·3,144 객체를 제공했고, 이는 `origin/main`(`16b3ada`, PR #13)과 이 브랜치 HEAD `12e56f7`에 커밋된 V137 데이터(`map-index.json` 동일 해시 `a009f3fa6fe7`)와 같다. production 코드 SHA는 공개 DOM에 SHA를 넣지 않으므로 특정하지 않는다 | `output/public-review-20260915/map-index.json` vs `git show 16b3ada:public/data/vietnam/v2/map-index.json` |

이 지시로 main 병합·production 배포·강제 push는 하지 않았다. 원격 push도 하지 않았다(아래 '남은 문제' 참조).

## 2. 실제 변경 파일

### 계약·데이터 생성
- `src/data/visualization/publicMapTargetsV138.json` (신규) — 43개 대상 계약(코드·공개명·7분류·원자료 필드·공간단위·표현·빌드 규칙·선택변수·단위·기간·대표 항목·근거·제한)
- `scripts/v138/build-map-layers-v138.mjs` (신규), `scripts/v137/build-final-data-v137.mjs` — pack → 지도 레이어 생성 단계(`map-targets`)를 ETL 뒤·asset-integrity 앞에 연결
- `public/data/vietnam/v2/spatial/layers/{b-003,b-004,b-005,b-006,b-007,b-029,b-030,b-037,b-039,b-040,b-041,b-042,c-009,c-010,c-012,c-013,c-019,c-022,c-024}.json` (신규), `map-index.json`, `catalog.json`, `manifest.json`, `asset-integrity.json` (재생성)
- `src/data/vietnam/vietnamTypesV121.ts`, `vietnamTypesV124.ts`, `vietnamDataLoaderV124.ts` — 선택기 `measureKey/scenario/variableGroups`, 레이어 `featureIdentity/displayScope/excludeWhere/approximateLocation/memberSeries/memberFacts/…`, 자산 `valueTable`(로더에서 행으로 펼침)

### 지도 UI
- `src/pages/RealMapExplorerPage.tsx`, `src/styles/map-catalog-v138.css` (신규), `src/data/visualization/publicMapWorkspaceV126.ts`, `src/types/map.ts`, `src/App.tsx`, `src/components/map/MapDataGuideV130.tsx`
  - 단일 접이식 7분류 체크박스 목록, 다중선택(개수 제한 없음), '현재 색상 표시' 선택기, 표시 끄기(선택 유지, URL `hiddenLayers`), 분류별 선택 개수, 추천 분석은 카드 조합 그대로
  - 동일 객체 묶음·국내 범위 제한·상태 제외·근사 위치(속 빈 기호), 공유 등록부 안내(C-019/C-022), B-021 6권역·D-018 참여 범위 유지
  - 전국 요약: A-023 원천별 행·위치자료 보유·용량, '위치자료 없음(지도 미표시)'과 '필터로 가려진 수' 분리
  - 좌우 크기조절 hook 유지, 768px 이하 서랍 접힘 시 스크롤 0, 범례를 출처 표시줄 위로, 상태 배지를 확대 버튼 옆으로
  - 용어 도움말: 목록 행은 제자리 풀어쓰기(`PublicTermExpandedTextV134`), ⓘ 자료 정보·범례·분석 패널은 `PublicTermTextV134`
- `src/components/help/PublicTermV134.tsx` — 텍스트 토큰을 `span` 대신 Fragment로 렌더(범례·분석 패널에서 `span { display:block }` 규칙이 용어 앞뒤를 줄바꿈하던 문제)

### 상세 화면
- `src/components/data/public/PublicRegionScenarioSummaryV138.tsx` (신규, V137 삭제), `src/data/visualization/publicRegionScenarioContractV138.ts` (신규) — B-003~007 전 기간 추이·처음·마지막 변화, B-017 평가구역(443개)·등급 분포·'성·시 · 유역 · 대수층' 행 이름, B-029/030/037/039~042 명시 측정·단위, 지역·시나리오 선택
- `SeaLevelStationAnalysisV138.tsx` (신규, B-008 관측소·시나리오·분위 전망), `PowerPlantRegistrySummaryV138.tsx` (신규, A-023 원천별 행·고유 시설·위치 보유·단일 연료 필터), `PublicDataAnalysisRouterV126.tsx`, `publicCopyRegistryV126.ts`
- `PublicPortfolioSummaryV132.tsx`, `publicFieldPolicyV126.ts`(+test), `publicEntityFieldPolicyV132.ts`, `publicEntityTitleV131.ts` — E-018 진출 상태 분리·고유 기업, E-020 지원제도·활용 사례 분리, E-008 `technologyBasis` 별칭, B-023/B-028 '폴리곤 재사용' 메모 제거
- `SemanticContractRendererV125.tsx`(+css), `SemanticArchetypePreviewV125.tsx`, `CountryDataFullPreviewV52.tsx`, `ResearchPatentAnalysisV132.tsx`(+css) — B-033 지역 추이, 정책표 구분·값·단위·기간, E-019 미설치 기관 분리, 지표군 집계, E-008 CTIS 분류·기관 분리
- `src/data/glossary/publicGlossaryV134.ts` — ADM1·ESA·USAID·CIT·VWEM·LTA·PSMSL·CTIS·FCPF·PPI·OPTA·GADM·HydroBASINS·HydroSHEDS·RX1day·RX5day·CWD·ETS·OSM

### 감사·검증
- `scripts/v135/audit-helpers.mjs`(`mapLayerCountV138`, `mapTargetCountV138`, `revealMapDatasetExpressionV138`, `toggleMapCompanionV138`), `scripts/audit-vietnam-release-v136.mjs`, `audit-vietnam-{generated-data-v133, map-list-ui-v136, map-copy-v136, map-focus-v133, map-popup-v133, map-layer-distinction-v133, map-guide-v135, map-access-v135, map-tooltip-v132, public-controls-v136, duplicate-copy-v136, public-text-v136, human-review-v136, glossary-v134, drought-analysis-v134, entity-cards-v131}.mjs` — 고정 레이어 수(12)를 map-index·43개 계약에서 읽는 기대값으로 대체(12개는 하한으로 유지), 체크박스 목록 조작, 추천 분석 조합 검사, 겹침 선택기 처리
- `scripts/v138/map-runtime-qa-v138.mjs`, `screen-review-v138.mjs`, `report-map-targets-v138.mjs`, `download-sample-compare-v138.mjs` (신규), `package.json`(`qa:map:v138`, `review:screens:v138`, `report:map-targets:v138`, `compare:downloads:v138`, `build:map-targets:v138`)
- `e2e/helpers.ts`, `e2e/map.spec.ts`, `e2e/responsive.spec.ts`, `e2e/map-presets.spec.ts`
- 문서: `docs/MAP_TARGET_CONTRACT_V138.md` (신규), `README.md`, `CHANGELOG.md`

## 3. 수행 명령과 결과

| 명령 | 결과 |
| --- | --- |
| `node scripts/v138/build-map-layers-v138.mjs --data public/data/vietnam/v2` + `node scripts/generate-vietnam-asset-integrity-v133.mjs --data public/data/vietnam/v2` | 42개 레이어 · 4,463 객체 · `reports/v138/map-targets-build-v138.json` |
| `npm run build` (react-scripts) | Compiled successfully |
| `npm run qa:map:v138` | 활성 42 · 표시 42 · 대표 객체 선택 42 · 콘솔 오류 0 · HTTP 실패 0 · 재시도 0 · 390/768/1024/1440/1920 가로 넘침 0 · 잘린 텍스트 0 · 내부 문구 0. 다중선택(B-004 + A-023·B-008·C-019), 색상 전환(C-019), 표시 끄기, 접기, 해제, 새로고침 복원, 크기조절(키보드·드래그·저장·복원), POWER 프리셋(A-024 + A-023), B-006 지표·시나리오·지역 추이 |
| `npm run review:screens:v138` | 152 화면 ready 152 · empty 0 · 실패 0 · 재시도 0 · 콘솔·HTTP 오류 0 · 가로 넘침 0 · 내부 문구 0 |
| `npm run compare:downloads:v138` | 20건 대조 20건 일치 (B-017·A-023·B-003·B-008·E-018·C-025·B-048) |
| `npm run report:map-targets:v138` | 43행 상태표 |
| `npm run audit:glossary:v134` | PASS (157 경로, 미풀이 약어 0) |
| `npm run audit:portfolio-analysis:v132` | PASS |
| `npm run audit:public-controls:v136` | PASS |
| `npm run finalize:v136` (= `audit:release:v136`, production build 포함 전체 gate) | 최종 **PASS 79/79** (`reports/v136/release-audit-v136.json`). 앞선 실행에서 public-controls(목록 padding)와 release 요약의 고정값 12 검사, map-list-ui의 누락된 `mapNativeButtonStyleCount`가 실패해 목록 inset을 margin으로, 요약 검사를 map-index·계약 기대값으로, 목록 감사에 버튼 검사를 복원한 뒤 같은 소스로 다시 실행했다 |
| `CI=true npx react-scripts test --watchAll=false` (publicFieldPolicyV126, help) | 통과 |

## 4. 미수행 검사

- Playwright e2e(`npm run e2e`) — 시각 기준선이 Linux 캡처라 Windows에서 픽셀 비교가 맞지 않아 실행하지 않았다. `e2e/*.spec.ts`는 새 목록 selector에 맞게 수정했고 CI(ubuntu)에서 확인해야 한다.
- `npm run audit:deployment:v128`, `audit:security:v128`, `audit:performance:v128`(`release:vietnam-pilot`) — 배포·보안·번들 성능 gate는 이 지시 범위(지도·분석 완성) 밖이라 실행하지 않았다. 번들 크기는 map-catalog CSS와 새 컴포넌트만큼 늘었다.
- 실제 Vercel Preview URL 검증 — push 전이라 없다.
- 지도에서 43개 대상 각각의 모든 선택변수·기간 조합 전수 확인 — 대표 객체 1개와 기본 선택값만 확인했다(`map-runtime-qa-v138.json`의 `selectors`).

## 5. 남은 문제

1. **B-017 물 스트레스 미연결** — 평가구역(HydroBASINS lvl6 × 성 × 대수층) 경계가 Aqueduct 4.0 GDB에만 있고 GDAL이 없어 추출하지 못했다. 필요한 자료: `string_id` 기준 베트남 범위 평가구역 폴리곤 GeoJSON. 상세 화면은 평가구역 443개 단위로 표시한다.
2. **유역 경계 미확보** — B-023·B-025·B-028의 유역 행은 원자료가 참조하는 `[공통]VNM_river_basins_8_HydroSHEDS.geojson`이 전달되지 않아 대표점(근사 위치)만 표시한다.
3. **근사 위치·미표시 행** — E-004~E-006·E-018·E-019·B-012는 도시·행정구역 대표점 행을 속 빈 기호로 표시하고, 좌표 없음·범위 밖·제외 상태 행 수를 전국 요약에 적는다. 해외 본사는 베트남 사무소로 표시하지 않는다.
4. **원격 반영** — 브랜치가 push되지 않았다. `origin/main`(`16b3ada`)은 이 브랜치 이전 커밋을 squash한 PR #13이라 그대로 PR을 열면 43+α 커밋의 중복 diff가 생긴다. push·PR 방식(rebase 여부)은 사용자 결정 사항이다.
5. **감사 실행 시간** — 전체 gate는 브라우저 감사 33개를 순차 실행해 40분 이상 걸린다.

## 6. 근거 파일

- 43행 지도 대상 표: `reports/v138/map-targets-v138.md` / `.json`
- 152행 상세 화면 표: `reports/v138/screen-review-v138.md` / `.csv` / `.json`
- 지도 상호작용·반응형: `reports/v138/map-runtime-qa-v138.json`, `reports/v138/screenshots/map/*.png` (390·768·1024·1440·1920, 다중선택, 프리셋, 기후 지역 추이)
- 다운로드 표본 대조: `reports/v138/download-sample-compare-v138.md`
- 감사 결과: `reports/v13x/*-audit-*.json` (gate가 재생성), `reports/v136/release-audit-v136.json`
- 계약 문서: `docs/MAP_TARGET_CONTRACT_V138.md`
