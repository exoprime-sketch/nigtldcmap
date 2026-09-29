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
| 전체 게이트 finalize:v151 | 미실행 |

## 화면

- 홈 1440: 전 `screens/rollback/home-before-main-v160-1440.png` → 후 `home-after-pr-1440.png` (운영 a302191 `home-prod-a302191-1440.png`과 픽셀 비교: 안티앨리어싱 14×16px 외 동일)
- 데이터 찾기 1440: 전 `finder-before-main-v160-1440.png` → 후 `finder-after-pr-1440.png` (운영과 차이: 정렬 선택 '관련도' → '가나다순'과 그에 따른 순서, 건수 142 동일)
