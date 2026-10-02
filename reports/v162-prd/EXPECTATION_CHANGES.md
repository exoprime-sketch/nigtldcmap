# PR-D 검사 기대값 변경 사유(2026-10-03)

| 파일 | 전 | 후 | 사유 |
|---|---|---|---|
| `src/data/countryContext.test.ts` | 공개 국가 = 베트남 1개 | 베트남·방글라데시 2개 | BGD 공개(사용자 지시 PR-D) |
| `src/data/homeCountryV161.test.ts` | BGD 요청 시 기본 국가로 폴백 | BGD 요청 시 BGD 유지 · 준비 중 국가 폴백은 별도 사례로 유지 | 같은 이유. 폴백 규칙 검사는 status만 바꾼 사본으로 그대로 보존 |
| `src/data/visualization/countryCompareContractV158.test.ts` | 비교 54 · 제외에 E-011 | 비교 55 · 제외 D-004·D-006·D-008·E-012 | E-011 비교 포함(사용자 결정 2026-10-03) |
| `scripts/smoke-vietnam-production-v128.mjs` 홈 대기 | 홈 글자에 '152' 포함 | '전체 데이터 항목 N개' 문장 | '152'는 베트남 지도 라벨에 우연히 맞던 조건. 나라마다 자기 공개 수를 표시 |
| `scripts/smoke-vietnam-production-v128.mjs` 찾기 검색어 | A-002가 있으면 'CPIA' | 기본 국가만 'CPIA', 다른 나라는 그 나라 카탈로그의 A-002 이름 첫 낱말('WGI') | 방글라데시 A-002는 WGI. 검색 결과에 A-002 카드가 나와야 하는 판정 자체는 동일 |
| `src/components/data/public/CountryCompareBlockV158.test.tsx` | 화면에 비교 지표 키(`A-003_gdp_current_usd`) 표시 | 키 비표시 · 연도 기준 문장 표시 | 내부 raw 키 공개 금지 규칙(CLAUDE.md). BGD 공개로 비교 블록이 처음 화면에 나오며 발견. 지표명은 블록 제목에 이미 표시. 기준 강화 |

- 기준을 낮춘 변경은 없음. 국가 수·비교 수는 사용자 결정, smoke 두 건은 나라마다 다른 원자료를 읽도록 한 것
