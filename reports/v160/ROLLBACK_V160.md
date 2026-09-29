# V160-R — 홈·데이터 찾기 되돌리기 + 찾기 정렬(R-10)

브랜치 `fix/v160-rollback-home-finder` (main ac3f2bd에서 분기). 사용자 결정 2026-09-29: V160 홈 '질문 6카드'와 '핵심 데이터(등급)' 폐기, 상세 3단·지도 기본 레이어 유지. 되돌리기 우선, 새로 만든 것은 정렬뿐.

## 변경

- 되돌리기(fcc04f7 = #34 직전): `HomePage.tsx`·`home-final-v13.css`·`DataExplorerPage.tsx`·`FinderCardSummaryV140.tsx`
- 삭제: `home-questions-v160.css`·`homeQuestionsV160.json`·`HomePage.v160.test.tsx`·`finder-core-v160.css`·`DataExplorerPage.filterByTier.test.ts`·`coreFirstV160.ts`(+테스트)·`scripts/v160/core-first-audit-v160.mjs`
- App: 홈 질문·tier·type 상태와 URL 연결 제거(기존 `tier=` 링크는 무시하고 정상 표시), `detailLayers`·`mapList` 유지
- 신규(R-10) 데이터 찾기 정렬: 공개 요소 전체(카탈로그 파생, 건수 하드코딩 없음) · 가나다순 기본(`Intl.Collator('ko')`, 카드에 보이는 이름) · 조회순(기존 `/api/usage` 재사용, 미설정 환경은 선택지 비활성) · URL `sort=name|views`(검색어·필터 변경·초기화에도 유지) · 미입고(`not-collected`) 맨 뒤 '데이터 준비 중'. 순서 규칙은 `src/data/finderSortV160.ts`
- 홈 국가 하드코딩 제거: 현재 국가 = `?country=`(공개 국가일 때) → 없으면 레지스트리 기본 공개 국가(`resolveHomeCountryV161`). 개요·카드 요약은 그 국가 데이터 트리에서(`loadPublicOverviewV161`, `loadCardSummariesV140(iso3)`), 요약이 없으면 카드에 '데이터 준비 중'. 국가 선택 UI 없음
- 유지: 상세 3단·지도 기본 레이어·B-032·320px 수정·#39
- `informationTiersV160.json`은 지도 기본 레이어 생성 입력으로만 남음(화면·감사에서 등급을 읽는 곳 0)
- 저장소 CLAUDE.md 절대 규칙에 병합 조건 추가("PR #N 병합" 명시 + 보고 3항목)

## 하드코딩 확인(grep)

```
grep -nE "VNM|베트남|Vietnam|vietnam|/data/(vietnam|bgd)|63개|성·시" \
  src/pages/HomePage.tsx src/data/homeCountryV161.ts src/data/finderSortV160.ts
→ 일치 0건(exit 1)
```

- 남은 고정값: 검색 예시 단어("국내총생산·가뭄·산림손실·송전망", 국가 무관 데이터 용어), 지도 기본 요소 `A-024`(프레임워크 공통 요소 ID, 현재 국가가 그 지도를 가질 때만 사용 — 없으면 그 국가의 첫 지도 자료)

## 검사 기대값

`reports/v160/EXPECTATION_CHANGES_V160.md` 2026-09-29 되돌리기 3행. 감사 스크립트는 fcc04f7 판정으로 복원(검사 수 동일), qa-core-first 12 → 14.

## 검증

| 항목 | 결과 |
|---|---|
| tsc | 오류 0 |
| test:unit | 579/579 (신규: 정렬 2·현재 국가 5) |
| qa-core-first | 14/14 (홈 8카드·현재 국가 수치, 찾기 공개 전체·가나다순·미입고 맨 뒤·sort URL 유지, 상세·지도, 6폭 넘침 0 — 홈·찾기 포함) |
| analysis QA — 이 PR | 필수 실패 34(기준선 41 이내), 신규 0, 홈 카드 클릭 8/8 · `analysis-qa-rollback-pr-20260929.log` |
| analysis QA — main(origin/main 체크아웃의 스크립트·빌드) | 필수 실패 34, 신규 0, 홈 카드 클릭 해당 없음 · `analysis-qa-rollback-main-20260929.log` |
| 전체 게이트 finalize:v151 | **1회차 통과**(아래 표) |

## 게이트 — finalize:v151 1회차 통과(재실행 없음) · 로그 `reports/v160/gate/finalize-v151-rollback-r1.log` · 커밋 f8d0cef

| 단계 | 결과 |
|---|---|
| verify:dataset-directory:v150 | 152 항목 · 294 파일 확인 |
| audit:release:v136 (finalize:v136, 감사 38개 요약 모두 PASS) | 80/80 |
| qa:role-split:v140 | 53/53 (#34 이전 검사 수로 복원) |
| qa:analysis:v140:baseline | 필수 실패 34(기준선 41 이내), 신규 0 |
| audit:boundary-34:v151 --skip-browser | 21 통과 · 1 건너뜀 |
| audit:boundary-policy:v151-2 | 24/24 |

## 단위 테스트 593 → 579 내역

삭제 21 − 추가 7 = −14. 삭제는 전부 폐기된 V160 기능(홈 질문·등급·tier) 테스트 — 복원 대상 없음.

| 삭제 파일 | 케이스 |
|---|---|
| `src/pages/HomePage.v160.test.tsx` (5) | 질문 6카드 U1..U6 순서 · KPI는 heroIndicator 있을 때만 · 질문 버튼 onOpenQuestion · 주요 데이터 8그리드·정렬 없음 · 제목 위계(h1→h2→h3/질문) |
| `src/pages/DataExplorerPage.filterByTier.test.ts` (8) | core 기본 57 · all 141 · hidden 미표시 · 검색 시 core→all · 검색 시에도 hidden 제외 · 공백 검색은 검색 아님 · 등급표에 없는 id 제외 · 공개 수 141 |
| `src/data/spec/coreFirstV160.test.ts` (8) | 152 요소 등급 1개씩 · 57/50/34/11 · core는 ⓪ 아님 · hidden = 제외10+미입고 · hidden == 카탈로그 excluded ∪ not-collected · 질문 6개·유형별 core ≥5 · 질문이 core 57 전부 포함 · KPI는 카드 요약이거나 없음 |
| 추가 `src/data/finderSortV160.test.ts` (2) | 가나다순(Collator ko)·미입고 맨 뒤 · 조회순(동률 가나다순)·미입고 맨 뒤 |
| 추가 `src/data/homeCountryV161.test.ts` (5) | country 없음 · 공개 국가(VNM) · 준비 중(BGD) · 알 수 없는 코드 → 기본 공개 국가 · 공개 국가 목록/없음 |

## `core-first-audit-v160.mjs` 삭제 대조

이 파일에는 검사(check)가 없었다 — 도우미 6개만. 상세 3단·지도 기본 레이어 검사는 처음부터 `qa-core-first-v160.mjs`에 있었고 그대로 남는다.

| 내보낸 것 | 역할 | 삭제 후 |
|---|---|---|
| `FINDER_PUBLIC_IDS_V160`·`FINDER_PUBLIC_COUNT_V160`(141) | 등급 기준 찾기 건수 | 감사가 fcc04f7의 카탈로그 공개 집합(142)으로 복원 |
| `FINDER_HIDDEN_IDS_V160` | 등급 hidden 목록 | analysis QA fcc04f7 판정으로 복원(미입고도 찾기 카드로 검사) |
| `finderAutoLoadSequenceV160` | 24개씩 로드 순서 | fcc04f7의 공개 수 기준 순서로 복원 |
| `withAllTiersV160` | URL에 tier=all | main에서도 호출 0회(가져오기만) — 등급 폐기로 불필요 |
| `withAllLayersV160` | URL에 layers=all | main에서도 호출 0회. 지도 전체 펼침 진입은 공용 URL 도우미(`mapList=all`, v129·v133·v134·v135)에 유지 |

| qa-core-first 검사 | main | 이 PR |
|---|---|---|
| 상세 3단: DETAIL_FIRST_SCREEN_12 · DETAIL_CHART_LAYER1_WITHIN_2_SCREENS · DETAIL_LONG_BLOCK_OPENS_ON_10 · DETAIL_LAYERS_START_COLLAPSED | 4 | 4 (동일) |
| 지도 기본 레이어: MAP_DEFAULT_LAYERS_MATCH_POLICY · MAP_CORE_OPEN_MORE_FOLDED | 2 | 2 (동일) |
| NO_HORIZONTAL_OVERFLOW_6_WIDTHS · CONSOLE_ERRORS_ZERO | 2 | 2 (동일) |
| 홈 | HOME_BODY_WORDS_MINUS_50 · HOME_FIRST_SCREEN_WORDS_MAX_120 · HOME_SIX_QUESTIONS | HOME_FEATURED_EIGHT · HOME_FIGURES_FROM_CURRENT_COUNTRY |
| 찾기 | FINDER_DEFAULT_CORE | FINDER_LISTS_PUBLIC_SET · FINDER_SORT_NAME_DEFAULT · FINDER_PREPARING_LAST · FINDER_SORT_URL_KEPT |
| **합계** | **12** | **14** |

## 정리

- 추적표 '등급(V160)' 열 삭제 — fcc04f7 추적표와 바이트 동일
- `docs/CORE_FIRST_V160.md` 상단에 "2026-09-29 폐기 — 홈 질문·등급 철회, 상세 3단·지도 기본 레이어만 유지"
- 스태시 `home-restore-prep-churn-s4` 삭제

## 화면

- 홈 1440: 전 `screens/rollback/home-before-main-v160-1440.png` → 후 `home-after-pr-1440.png` (운영 a302191 `home-prod-a302191-1440.png`과 픽셀 비교: 안티앨리어싱 14×16px 외 동일)
- 데이터 찾기 1440: 전 `finder-before-main-v160-1440.png` → 후 `finder-after-pr-1440.png` (운영과 차이: 정렬 선택 '관련도' → '가나다순'과 그에 따른 순서, 건수 142 동일)
