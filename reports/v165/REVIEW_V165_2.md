# V165-2 — 2026 수집 대상 기준을 두 나라에 같게 적용(베트남 146 → 144)

- 브랜치: `feat/v165-2-collection-scope`(origin/main c8824579, #75 병합본에서 분기)
- 사용자 질문·지시
  - 2026-10-05 09:39: "왜 방글라데시는 141개 데이터 항목이고, 베트남은 146개 데이터 항목이죠?"
  - 09:42: "그럴 경우 베트남도 2026년도 수집 대상이 아닌 것입니다. 반영해서 플랫폼 업데이트 해주세요."
- 원칙
  - 값·행·팩·다운로드 파일은 바꾸지 않음. 상태 칸과 그 상태에서 만들어지는 목록 파일만 바꿈
  - 원자료에 없는 값은 만들지 않음. 납품된 값이 있는 항목은 그대로 공개

## 1. 원인

| 구분 | 베트남(변경 전) | 방글라데시 |
|---|---|---|
| 프레임워크 | 152 | 152 |
| 공개 제외 결정(공통 6: A-017·C-020·C-021·E-008·E-016·E-017) | −6 | −6 |
| 2026 수집 대상 아님 + 원자료 없음 | 0(C-023 '원자료 미수집', E-013 '입력 양식만'이 목록에 남음) | −5(C-023·D-001·D-002·D-004·E-013) |
| 홈 '전체 데이터 항목' | 146 | 141 |

- 방글라데시 ETL은 원자료가 없는 요소를 `not-provided`(목록·검색·항목 수 제외)로 둠
- 베트남 ETL은 같은 처지의 C-023·E-013을 `not-collected`·`schema-only`로 두어 목록에 '데이터 준비 중'으로 남김 → 같은 사실을 나라마다 다르게 셈

## 2. 바꾼 규칙(두 나라 공통)

- 결정 파일 `config/data-publication/collection-scope-v165.json`(신규)
  - 2026 수집 대상 아님 9개(db_framework '2026_수집여부' = N): C-020·C-021·C-023·D-001·D-002·D-004·E-013·E-016·E-017
  - 근거: 방글라데시 2026-09-30 입고분 프레임워크 + 사용자 결정 2026-10-05(베트남도 같음)
- 규칙
  - 목록에 있으면서 값이 든 원자료 행이 없는 요소 → 미제공(`not-provided`): 모든 목록·검색·항목 수에서 빠짐. 상세 주소는 그대로 열리고 '현재 제공하지 않음' 표시(방글라데시와 같은 화면)
  - 값이 든 행이 있는 요소 → 그대로 공개. 베트남 D-001·D-002·D-004는 납품된 값이 있어 계속 공개
  - 공개 제외 결정 요소 → 제외 그대로
- 적용
  - ETL: `tools/etl/build_public_v2.py`(베트남)·`tools/etl/countries/bgd/build_country_v2.py`(방글라데시)가 팩을 만들기 전에 같은 함수(`tools/etl/collection_scope_v165.py`)를 적용
  - 기존 산출물: 원자료 없이 같은 규칙을 적용하는 보정 실행 `python -m tools.etl.collection_scope_v165`(`--check`로 남은 변경 0 확인)

## 3. 바뀐 결과

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| 베트남 홈 '전체 데이터 항목' | 146개 | **144개** |
| 국가 선택 항목 수(홈·헤더) | 베트남 146 · 방글라데시 141 | 베트남 144 · 방글라데시 141 |
| 베트남 데이터 찾기 | 146개 | 144개(C-023·E-013 빠짐) |
| 데이터 찾기 '전체' | 287개 | 285개 |
| 베트남 C-023·E-013 상세 | '데이터 준비 중' | '현재 제공하지 않음' 표시 + '데이터 준비 중'(방글라데시 C-023과 같은 화면) |
| 방글라데시 | 141개 | 변화 없음 |

- 실제 차이(141 대 144)는 베트남에만 납품된 D-001 단위 사업당 CAPEX · D-002 시장 성장률 · D-004 크레딧 가격 연동 수익성 3개

## 4. 바뀐 파일

| 파일 | 내용 |
|---|---|
| `config/data-publication/collection-scope-v165.json` | 결정 파일(신규) |
| `tools/etl/collection_scope_v165.py` | 규칙 함수 + 기존 산출물 보정 실행(신규) |
| `tools/etl/build_public_v2.py` · `tools/etl/countries/bgd/build_country_v2.py` | 팩 생성 전 규칙 적용(각 5줄) |
| `public/data/vietnam/v2/catalog.json` | C-023·E-013: `publicStatus`·`dataPresenceStatus`·`emptyReason` = `not-provided`, `collectionPlanned` = false, 사유 '원자료 없음 · 2026 수집 대상 아님' / '입력 양식만 있고 값이 든 원자료 행 없음 · 2026 수집 대상 아님'. C-023 `packageStatus` = `not-provided`(E-013은 양식 파일이 있어 `provided` 유지) |
| `public/data/vietnam/v2/framework-coverage.json` · `packs/bundle-index-v124.json` | 같은 두 요소의 상태 칸 |
| `public/data/vietnam/v2/manifest.json` | 상태별 개수: `not-collected` 1→0, `schema-only` 1→0, `not-provided` 0→2(ETL의 허용 상태 목록에 `not-provided` 추가) |
| `public/data/vietnam/v2/semantic/element-visualization-contracts-v125.json` · `src/data/visualization/generatedVisualizationContractsV125.ts` | 의미 빌더(`build_semantic_v125.py`) 재실행 결과. 다른 차이 없이 두 요소의 `noDataReason`·`dataPresenceStatus`만 바뀜(임시 폴더로 먼저 만들어 비교) |
| `public/data/vietnam/v2/home/card-summaries-v140.json` | 카드 요약 재생성: 146 → 144장(두 요소 카드 빠짐, 나머지 동일) |
| `public/data/vietnam/v2/dataset-directory.json` · `src/data/datasetDirectoryV149.json` | 목록 디렉터리 재생성. 두 요소 지문 변경 + 이전 #72(2026-10-04 10:25) 커밋이 바꾼 14개 요소의 갱신일이 09:44 → 10:25로 반영됨(기존 디렉터리가 #72 이전 기록이었음) |
| `public/data/vietnam/v2/asset-integrity.json` | 무결성 재생성 |
| `reports/v140/card-summaries-*` | 카드 요약 빌드 기록 |
| `src/data/finderSortV160.ts`(주석) · `src/data/finderSortV160.test.ts` | 아래 5절 |
| `scripts/audit-vietnam-exclusions-v156.mjs` · `scripts/v162/acceptance-v162.mjs` | 아래 5절 |
| `reports/v165/VENDOR_NOTICE_V165.md` | 4절 항목 수 기준 추가(공유 문서도 같은 내용 반영) |

## 5. 기대값·감사 정의 변경

- 게이트·감사의 기대값을 현재값으로 바꾼 것은 없음. 아래 3건은 '미제공(not-provided)'을 '공개 제외 결정'과 구분하도록 정의를 맞춘 것(방글라데시는 이미 이 구분으로 동작)
- `src/data/finderSortV160.test.ts` "the catalogue's not-delivered set is the typology's data-pending set"
  - 변경 전: 카탈로그 전체(목록에 없는 요소 포함)에서 '준비 중' 집합 = 유형표 data-pending 집합
  - 변경 후: 목록에 오르는 요소만 비교, 두 나라 모두 검사
  - 사유: 미제공은 목록에 오르지 않으므로 데이터 찾기의 '준비 중' 정렬 대상이 아님
  - 추가 시험: "2026 수집 대상 아님 + 원자료 없음 요소는 어느 나라에서도 목록에 없음"
- `scripts/audit-vietnam-exclusions-v156.mjs`(V136 게이트 브라우저 묶음)
  - 결정 대조(`EXCLUSION_DECISIONS_MATCH_CATALOG`)·공지 화면(`EXCLUDED_DETAIL_NOTICE`)은 `publicStatus: "excluded"`(결정 6개)만 대상으로 함
  - 목록·검색·홈·다운로드에 나오지 않는지 보는 검사는 그대로 미제공까지 포함
  - 사유: 미제공 요소는 결정문이 없고 상세가 결정 공지 화면이 아님(방글라데시 미제공과 같은 일반 상세 + '현재 제공하지 않음')
- `scripts/v162/acceptance-v162.mjs` `preparing-single-source`
  - 비교 대상: 카탈로그 미입고 집합에 `not-provided` 포함
  - 사유: 유형표 가져오기(`PENDING_PUBLIC_STATUSES_V162`)와 상세 안내(`statusNoticeFromCatalogV162`)가 이미 미제공을 '데이터 준비 중'으로 셈. 데이터 찾기용 집합(`preparingIds`)은 그대로
- `scripts/v162/acceptance-v162.mjs` `finder-sort-views`의 시험 조회수 주입 경로(기존 결함 수정)
  - 화면은 V162부터 `/api/usage?country=<ISO3>`로 묻는데 시험 주입은 `**/api/usage`(물음표 뒤가 없는 주소)만 받아 조회수가 주입되지 않았고, 조회순이 꺼진 채 실패함(#75 빌드에서도 같은 실패 확인)
  - 주소 경로가 `/api/usage`로 끝나면 주입하도록 수정. 판정 조건은 그대로

## 6. 검증

- 단위 시험 162 suites / 1,656 통과 · tsc 0 · `CI=true` 빌드 통과
- 보정 실행 `--check`: 두 나라 남은 변경 0
- 데이터 디렉터리 `verify:dataset-directory:v150` 통과
- 화면(production 형식 빌드, 1440px, 변경 전 #75 빌드와 비교): 3절 표의 값 확인. 데이터 찾기 본문에 '한계저감비용'·'운영·유지보수 역량' 없음
- 필터 감사(바뀐 항목만)
  - V136 정적 묶음(`--group static`) 통과
  - `audit:exclusions:v156` 13/13(결정 제외 6 · 미제공 2 · 공개 144 · 다운로드 144)
  - `audit:public-copy:v134` 13/13 · `audit:detail-hierarchy:v135` 12/12 · `audit:temporal-depth:v135` 11/11(각 144쪽)
  - `qa:acceptance:v162` 찾기·홈·다운로드 수치 영역 양국 통과: 베트남 찾기 144·홈 144, 방글라데시 141·141, 명세 data-pending = 카탈로그 미입고(C-023·E-013), 조회순 정렬(주입 수정 후) 양국 통과

## 7. 그대로 둔 것

- 상세 화면의 '데이터 준비 중 — 자료가 입고되면 분석 화면을 제공합니다.' 문구는 방글라데시 미제공 요소와 같은 기존 문구를 그대로 씀
- `src/data/spec/datasetTypologyV159.json`(용역사 유형표)의 C-023·E-013 '데이터 준비 중' 표기는 원본 그대로(화면은 카탈로그 상태로 판단)

## 8. 전후 캡처(`reports/v165/screens/v165-2/`, 1440px)

| 화면 | 전 | 후 |
|---|---|---|
| 베트남 홈(전체 데이터 항목·국가 선택 항목 수) | `before-home-1440.png` | `after-home-1440.png` |
| 베트남 C-023 상세 | `before-detail-vnm-c023-1440.png` | `after-detail-vnm-c023-1440.png` |
| 방글라데시 C-023 상세(비교 기준, 변화 없음) | — | `after-detail-bgd-c023-1440.png` |
