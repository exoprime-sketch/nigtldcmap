# V163 '비교해서 보기' 재구축 — 검토 보고

- 브랜치: `feat/v163-map-compare` (기준 f19b490 = PR #58 head, BGD live)
- 범위: '데이터 지도' > '비교해서 보기' 작업공간 전면 교체 (VNM 72 · BGD 38 지도 레이어, 국가 교차 비교 포함)
- 소유자 지적(2026-10-03): ① 데이터 정보가 '데이터 지도'와 달리 전혀 표출되지 않음 ② 국가 선택 기능 없음

## 1. 변경

### 새 파일 (`src/components/map/compare/`)
- `compareModelV163.ts` — 순수 규칙(React·MapLibre 없음)
  - 데이터 목록 가나다순, 국가 전환 시 같은 데이터 유지/없으면 첫 데이터로 대체(`kept` 표시)
  - 지표·기준 시점 검증(다른 국가의 지표 키 → 그 레이어 기본값)
  - 시설 레이어의 지표(전체·가스·석유 …) → 같은 값의 필터로 그림
  - 위치 함께 이동 기본값(같은 국가만 ON), 지역 연동 조건(같은 국가 + 지역 색 지도), 같은 색 구간 조건(같은 데이터·지표·단위)
  - 지역 값 추출(값 없는 지역 제외, 0 대체 없음), 요약(최대·최소·중앙값), 순위(큰 값 순, 동률 같은 순위)
  - 범위 계산(국가 범위, 지역 협력사업처럼 국가 밖으로 크게 나가는 레이어만 확장)
  - URL `compareCountries`·`compareSelectors` 읽기/쓰기, 좌우 바꾸기
- `comparePaneDataV163.ts` — 패널별 데이터 적재(큰 지도와 같은 로더·캐시)
  - 면 렌더러: 국가 로더 `loadSpatialGeoJson` + `loadSpatialLayer`
  - 지점 렌더러: `loadCountryElementEntitiesV122`(광물 레이어는 host 원소 + `applyNationalMineJoinV157_2`), VNM 소재지 사이드카(선택)
  - 경계: VNM 34/63(레이어가 63을 선언하면 63) + 34 집계용 34·6권역 파일, 다른 국가는 레지스트리 `adm.level1.asset`
  - 국가 목록 로드 전 열린 공유 링크도 동작하도록 레지스트리 로드 후 지도 목록 요청
- `comparePaneEngineV163.ts` — 패널 하나의 MapLibre 지도
  - 큰 지도 파이프라인 그대로: `prepareMapLayerV152` → `mountPreparedMapLayerV152`(아이콘·클러스터·선택 레이어 포함)
  - 기본 스타일 `MAP_STYLE`, VNM은 `applyBoundaryReferenceV152`, 다른 국가는 같은 모양의 1급 행정구역 선
  - 한국어 지명 `addKoreanMapLabelsV151` + BGD는 경계 파일의 `nameKo`로 Division 이름(8개라 첫 화면부터 표시)
  - 지역 연동용 hover 외곽선, 출처 표기 접힘(범례 가림 방지), 오류는 콘솔에 남기지 않고 패널에 표시
  - localhost에서만 `window.__cdpCompareMapsV163.{a,b}` 노출(QA용)
- `MapComparisonWorkspaceV163.tsx` — 작업공간·패널 UI
- `compareModelV163.test.ts` — 단위 테스트 15건
- `src/styles/map-comparison-v163.css`

### 수정
- `src/pages/RealMapExplorerPage.tsx`(부분 편집)
  - V135 데이터셋 구성 코드 삭제: `comparisonLayerOptionsV135`·`buildComparisonDatasetV135`·`comparisonBoundsV135`·`comparisonDatasetsV135`·`changeComparisonDatasetV135`·`changeComparisonSelectorV135`, 비교 쌍을 큰 지도 activeIds에 강제하던 effect, 미사용이 된 `publicMapCoverageTextV126`·import 2개
  - 새 상태 `comparisonPanesV163`(URL에서 시작, 작업공간이 보고) + 열 때마다 새 key
  - 일반 진입 '비교해서 보기': A = 지금 보는 데이터(없으면 직전 A/기본 D-018), B = 직전 B → 함께 표시 중인 데이터 → 기본 C-025 순
  - '비교 닫기': A 패널이 이 국가의 데이터면 그 데이터(지표·기준 시점 포함)로 일반 지도 복귀
  - **닫으면 URL이 아직 비교 모드라 다시 열리던 문제 수정**: 비교 중 URL 반영분을 적용된 hydration으로 기록
  - 비교 중 루트에 `cdp-map-page--compare-v163`(큰 지도는 visibility:hidden으로 유지 → 닫으면 그대로 복귀)
- `src/types/map.ts` — `comparisonCountries`·`comparisonSelectors`(선택 필드), `compareLayers` 중복 제거 폐지(같은 데이터 두 시점·두 국가 비교 허용)
- `src/App.tsx` — `compareCountries=VNM,BGD`·`compareSelectors=[…]` 직렬화·동등 비교, 패널별 국가로 public token
- `src/data/visualization/publicMapWorkspaceV126.ts` — `publicMapLayerTitleV126`에 선택 인자 `country`(두 국가 동시 화면)
- `e2e/compare.spec.ts` — 새 화면 문구로 갱신(자료정보·출처 기관·공간 단위, 동기화 속성) + 국가 전환 테스트 1건 추가
- 삭제: `src/components/map/MapComparisonWorkspaceV135.tsx`
- 유지(감사 계약): `map-comparison-workspace-v135`·`map-compare-pane-a/b`·`map-comparison-legend-a/b`·`map-compare-open-v135`·`select[aria-label="데이터 A 선택"]`(패널 첫 select)·`data-synchronized`·`data-layout-mode`, '일반 지도로 돌아가기' 문구

## 2. 패널마다 보이는 것
- 머리: 데이터(가나다순 select) · 국가(라이브 국가 버튼: 베트남/방글라데시) · 항목 또는 지표 select · 기준 시점 select 또는 고정값
  - 두 패널 높이를 맞추려고 고정값도 같은 자리에 표시
  - 국가 전환 시 그 국가에 없는 데이터면 첫 데이터로 바꾸고 지도 위에 한 줄 안내(닫기 가능)
- 지도: 큰 지도와 같은 렌더러 전부 + 1급 행정구역 선 + 한국어 지명
  - 상태: 불러오는 중 / 오류 + '다시 시도' / 그 국가에 지도 없음 / 조건에 맞는 대상 없음
- 범례(지도 위, 항상 보임)
  - 색 지도: 그라데이션 + 최소·최대(단위) + '색 없음: 자료 없음' + (공유 시) '두 지도 같은 색 구간'
  - 범주 지도·시설: 범주별 색과 개수, 아이콘 지점: 큰 지도 아이콘 범례, 송전망: 110/220/500 kV, 지역 협력사업: 참여국 범위·세부 활동지역
- 자료정보: 데이터명 · 항목/선택 지표 · 기준 시점 · 단위 · 출처 기관 · 공간 단위(베트남 성·시 34개(2025-07-01 시행)/63개(개편 전)/6대 권역, 방글라데시 주(Division) 8개, 평가구역 N개, 시설·지점 위치) · 읽는 법(VNM 검토 문구 있을 때)
- 요약
  - 색 지도: 값 있는 지역 n / N개 · 최댓값과 지역 · 최솟값과 지역 · 중앙값(파생) · 자료 없음 n개(0으로 대체하지 않음) · 그룹 값이면 '그룹 전체 값'
  - 지점·선·시설: 표시 대상 수 + 분류별 개수(아이콘 범례·범주·전압)
  - 지역 협력사업: 사업 수 · 참여국 범위 · 세부 활동지역
- 선택 카드(클릭)
  - 지역: 이름(한글 (현지명)) · 값+단위 · 분류 · 기준 시점 · 'N개 지역 중 k위'(그룹 값은 순위 생략) · 평균 대비 · 이 위치로 확대 · 데이터 상세보기
  - 지점: 큰 지도와 같은 시설 카드(`createMapPointPopupV152`)
  - 선·시설 구역·사업 범위: 분류 · 전압 · 구간 길이 · 운영 상태 · 면적 · 참여국 · 레이어 카드 항목(BGD `cardFactFields`)
- 패널 사이
  - 위치 함께 이동: 같은 국가 기본 ON, 국가가 다르면 자동 OFF + 각자 자기 국가로 맞춤(켜기 가능)
  - 지역 연동: 같은 국가의 두 지역 색 지도 → 한쪽 hover/클릭 지역을 다른 쪽에 외곽선 + 그 지역 값·순위 카드
  - 같은 색 구간: 같은 데이터·지표(예: 두 시점) → 기본 ON, 두 패널 최소~최대 합집합
  - 좌우 바꾸기, 비교 닫기(일반 지도로 돌아가기)
- 배치: 데스크톱 2열(1440×900에서 두 지도와 범례가 스크롤 없이 보임), ≤768px 세로 쌓기(지도 45vh)

## 3. 검증 결과
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0 |
| 단위 테스트 `compareModelV163` | 15/15 통과 |
| `npm run test:unit` 전체 | 83 suites / 847 tests 통과 |
| 프로덕션 빌드 `GENERATE_SOURCEMAP=false BUILD_PATH=tmp/build-v163-compare` (gate-lock) | Compiled successfully |
| Playwright e2e `e2e/compare.spec.ts`(새 빌드, 로컬 Chromium) | 2/2 통과 |
| `audit:map-compare:v135`(CI gate 포함 감사, 새 빌드) | 10/10 PASS (`V125_BROWSER_ARGS=--enable-unsafe-swiftshader`) → `reports/v163/map-compare-audit-v135-on-v163.json` |
| 실제 브라우저 QA `scripts/v163/qa-compare-v163.mjs` | 7개 조합 + 흐름 1건, 콘솔 오류 0 · 404 0 → `reports/v163/qa-compare-v163.json` |

### 조합별(1440×900, 두 패널 데이터 레이어 `queryRenderedFeatures` 수)
| 조합 | A | B | 동기화 | 클릭 카드 |
|---|---|---|---|---|
| (a) VNM 색 지도 ×2 B-039 / B-041 | 42 | 42 | ON | A '34개 성·시 중 6위', B는 연동 카드('왼쪽 지도에서 고른 위치') '34개 성·시 중 20위' |
| (b) VNM 지점 / 선 A-023 / A-024 | 7(클러스터) → 확대 후 11 | 1,138 → 확대 후 309 | ON | A 시설 카드(Mao Khe 440 MW), B '220 kV 송전선 구간 25.93 km' |
| (c) VNM 평가구역 / 그룹값 B-017 / A-022 | 376 | 73 | ON | A '종합 물 리스크 2.2 점', B 하노이 SAIDI 29.81 분/고객 + '그룹 전체 값'(순위 생략) |
| (d) VNM / BGD B-039 / B-039 | 42 | 15 | **OFF(자동)** | A '34개 성·시 중 6위', B 랑푸르 '8개 주(Division) 중 2위' |
| (e) BGD / BGD B-039 / A-023 | 15 | 112 | ON | A '8개 주(Division) 중 2위', B Thakurgaon 석유 47 MW |
| (f) 같은 색 구간 B-033 2005 / 2024 | 42 | 42 | ON | 두 범례 모두 최소 0 ha · 최대 14,265 ha, '두 지도 같은 색 구간' |
| (g) 기본 진입 쌍 D-018 / C-025 | 10 | 1,023 | ON | 사업 범위 카드 / 탄소크레딧 사업 카드 |

- 범례: 색 지도 패널 모두 최소·최대 표시, 1440×900에서 두 지도 하단 883px · 범례 하단 873px(창 높이 900 이내)
- 동기화: A 확대 → B 같은 zoom·중심(소수 4자리 일치), 국가가 다르면 `data-synchronized=false`
- 흐름: 진입 버튼(D-018·C-025) → B를 방글라데시(C-025 유지, 동기화 자동 OFF, URL `compareCountries=VNM,BGD`) → A를 방글라데시(D-018 없음 → '가뭄' + 안내, 동기화 ON) → 좌우 바꾸기(B-005,C-025 → C-025,B-005) → 비교 닫기(작업공간 0, URL에서 비교 해제, 일반 지도 visible)
- 가로 넘침: 320 / 390 / 768 / 1024 / 1440 / 1920px 모두 0, ≤768px 패널 세로 쌓임(A 하단 < B 상단)

### 캡처 (`reports/v163/screens/`, 1440×900)
- `compare-vnm-choropleths.png` / `-selected.png` (a)
- `compare-vnm-point-line.png` / `-zoomed.png` / `-selected.png` (b)
- `compare-vnm-unit-group.png` / `-selected.png` (c)
- `compare-vnm-bgd-cross.png` / `-selected.png` (d)
- `compare-bgd-choropleth-point.png` / `-selected.png` (e)
- `compare-vnm-same-colors.png` / `-selected.png` (f)
- `compare-vnm-scope-point.png` / `-selected.png` (g)
- `compare-bgd-after-switch.png` (국가 전환 안내)
- `compare-mobile-390.png` (390px 전체 페이지)
- 전(V135, 기준 커밋 빌드): `compare-before-v135.png` · `compare-before-v135-bgd.png`(패널 공백·국가 선택 없음 확인)

## 4. 남은 것과 사유
- **전체 게이트 미실행**: 규칙상 PR의 CI `gate`에서만 실행. 로컬은 필터 검사(위 표)만
- **이 컨테이너의 감사 브라우저 WebGL**: `audit:map-compare:v135`를 기본 인자로 돌리면 `--disable-gpu`로 WebGL이 없어 *큰 지도* 초기화가 콘솔 오류 1건 → `COMPARE_RUNTIME_ERROR_COUNT` FAIL. SwiftShader 허용 시 10/10. CI 러너(Google Chrome)는 기존 지도 감사와 같은 조건이라 영향 없을 것으로 보나 CI 결과로 확인 필요
- **배경지도(지형·위성) 미적용**: 패널은 기본 스타일만(외부 타일 의존·두 지도 부하 회피). 필요하면 후속
- **지역 연동 키**: 같은 경계 체계끼리만 연결(34 ↔ 63 혼합이면 '같은 지역의 값 없음' 카드). 63→34 대응표로 잇는 것은 후속
- **필터**: 큰 지도의 세부 필터(A-023 출처·용량, B-012 재해유형 등)는 패널에 없음. 시설 레이어 지표(전체·종류)만 필터로 연결
- **A-023 용량 크기 범례**(큰 지도의 배지 크기 설명)는 패널 범례에 없음
- **닫을 때 A 패널이 다른 국가면** 일반 지도는 현재 국가 그대로(국가 전환은 하지 않음)
- **1024px**: 머리 줄바꿈으로 지도 하단이 900px 창을 넘음(요구는 1440px). 가로 넘침은 0
- Vercel Preview·전후 캡처 비교·PR은 지시에 따라 미생성(push 안 함)
