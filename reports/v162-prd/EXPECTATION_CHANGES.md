# PR-D 검사 기대값 변경 사유(2026-10-03)

| 파일 | 전 | 후 | 사유 |
|---|---|---|---|
| `src/data/countryContext.test.ts` | 공개 국가 = 베트남 1개 | 베트남·방글라데시 2개 | BGD 공개(사용자 지시 PR-D) |
| `src/data/homeCountryV161.test.ts` | BGD 요청 시 기본 국가로 폴백 | BGD 요청 시 BGD 유지 · 준비 중 국가 폴백은 별도 사례로 유지 | 같은 이유. 폴백 규칙 검사는 status만 바꾼 사본으로 그대로 보존 |
| `src/data/visualization/countryCompareContractV158.test.ts` | 비교 54 · 제외에 E-011 | 비교 55 · 제외 D-004·D-006·D-008·E-012 | E-011 비교 포함(사용자 결정 2026-10-03) |
| `scripts/smoke-vietnam-production-v128.mjs` 홈 대기 | 홈 글자에 '152' 포함 | '전체 데이터 항목 N개' 문장 | '152'는 베트남 지도 라벨에 우연히 맞던 조건. 나라마다 자기 공개 수를 표시 |
| `scripts/smoke-vietnam-production-v128.mjs` 찾기 검색어 | A-002가 있으면 'CPIA' | 기본 국가만 'CPIA', 다른 나라는 그 나라 카탈로그의 A-002 이름 첫 낱말('WGI') | 방글라데시 A-002는 WGI. 검색 결과에 A-002 카드가 나와야 하는 판정 자체는 동일 |
| `src/components/data/public/CountryCompareBlockV158.test.tsx` | 화면에 비교 지표 키(`A-003_gdp_current_usd`) 표시 | 키 비표시 · 연도 기준 문장 표시 | 내부 raw 키 공개 금지 규칙(CLAUDE.md). BGD 공개로 비교 블록이 처음 화면에 나오며 발견. 지표명은 블록 제목에 이미 표시. 기준 강화 |
| `scripts/v162/acceptance-v162.mjs` | 국가 검사: 다른 나라 국명만 | + `other-country-admin-terms`: 다른 나라 고유 행정 표현 0(레지스트리 `adm.publicTerms`, 국명 검사와 같은 화면·예외). 영문 한 단어(Division)는 대문자 단어 뒤에 붙은 고유명사(기관명) 안에서는 제외 | 사용자 지시 2026-10-03 재발 방지. 기준 추가(강화). 단어는 코드에 적지 않고 레지스트리에서 읽음 |
| `public/data/countries.json` | `adm.level1`만 | + `adm.publicTerms`(VNM 성·시·34개·63개·개편 전·개편 후 / BGD 주(Division)·Division) | 같은 지시. 화면 필터(`countryTermsV158`)와 인수 검사가 같은 목록을 읽음 |
| `scripts/v162/acceptance-v162.mjs` | 국가 선택: 찾기 화면에서 BGD 선택 가능 1건 | + `country-selectors-live`: 공개 국가마다 홈·찾기·지도·다운로드·이용안내(·상세)의 모든 국가 선택기(`data-country-selector="v162"`)에서 live 국가 전부 선택 가능 | 사용자 지시 2026-10-03(베트남 지도 국가 선택에 방글라데시가 '준비 중'으로 나온 결함 재발 방지). 기준 추가(강화) |
| `src/data/visualization/periodStatementsV162.json` | C-006 보류(deferred) | C-006 기준 시점 '2026년 9월 등록부 확인'(목록 꼬리표 없음) | 사용자 결정 2026-10-03(명부형) |

- 기준을 낮춘 변경은 없음. 국가 수·비교 수는 사용자 결정, smoke 두 건은 나라마다 다른 원자료를 읽도록 한 것

## CI 재실행 2회차 원인(2026-10-03)
- analysis QA 새 실패 3건(A-013·A-022·C-003 `mapSymbolVerified.valueOrFact`)
  - 원인: 63개 경계 기본으로 열리면서, 키보드 순회의 첫 피처가 원자료상 값이 없는 성(예: EVNNPC 관할 Lai Châu)이 되어 선택 패널이 '값 없음'만 표시
  - 수정: 키보드 순회 시작 위치를 '값이 있는 첫 피처'로 변경(화면 개선, 값 없는 성도 화살표로 그대로 도달). 검사 기대값은 바꾸지 않음

## CI 3회차(재실행 확인) 원인(2026-10-03)
- finder-scroll 뒤로 가기 복원 오차 443px: 코드 변경 없이 작업만 1회 재실행 → 오차 0으로 통과(기존 불안정 항목 확인)
- 식별자 검사 D-020·D-023 `kebab-case:results-based`: 키보드 순회가 값이 있는 첫 지역(Điện Biên)에서 시작하면서 선택 패널에 GCF 사업 원문 제목 'Vietnam REDD-plus results-based payments…'가 나옴 → `SOURCE_PROPER_WORDING_V162`에 'REDD-plus results-based payments'(앞뒤 단어 포함 등록 — 다른 곳의 같은 단어는 계속 검출)
- 인수 검사 BGD map-counts 0/0: 상태 줄이 지도 목록 도착 전에 그려져 0을 읽음 → 수가 채워질 때까지 대기(최대 60초) 후 읽기. 기대값 불변
