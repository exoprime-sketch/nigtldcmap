# V162 통합 인수 게이트(qa:acceptance:v162) — 검토 보고

브랜치 `feat/v162-acceptance`(main 1374a61 = #49 병합 이후). 이 PR은 V162(세션5)보다 먼저 병합한다.

## 게이트 구성 — 기존 검사 재사용, 판정만 추가

`scripts/v162/acceptance-v162.mjs` · `npm run qa:acceptance:v162` · `finalize:v151` 마지막 단계에 편입. CLAUDE.md에 1줄 추가.

- 실행 단위: 국가별(`--country VNM|BGD`, 기본 = `countries.json`의 공개 국가 전부). 공개 전 국가는 폴백 검사만, live가 되면 선택 가능 검사로 바뀐다.
- 기준값: 모두 그 나라 `catalog.json`·`map-index.json`·`manifest.json` 실측. 고정 숫자 없음.
- 결과: `reports/v162/acceptance-v162.{json,md}`, 실패 시 exit 1.

| 항목 | 판정 | 재사용한 기존 검사 |
|---|---|---|
| 1 찾기 | 공개 수 = 카탈로그, 2026년 제외 비노출, '데이터 준비 중' 카드·상세 안내·명세 유형 = 카탈로그 미입고 상태(단일 출처) | `audit:exclusions:v156` |
| 2 지도 | 대상·연결 수 = map-index, 활성 레이어 전부 렌더·클릭, '준비 중' 0(`--expect-pending N`) | `qa:map:v138`(종료 코드가 없어 보고서로 판정, 타일 요청 실패 제외) |
| 3 공개 문구 | 내부 작업 메모 0 + 식별자·파일명·작업 어휘 0 | `audit:source-notes:v161`(#42) + `public-wording-scan-v157`(#47) |
| 4 수치 | 홈 전체·지도·다운로드 수 = 실측, 다운로드 목록 = 공개 수, 데이터 기준일 = 원자료 입고일 | — |
| 5 6폭 | 320·390·768·1024·1440·1920 가로 넘침 0 | `review-runtime-v150 --only responsive` |
| 6 국가 | `?country=BGD`(공개 전) → 기본 국가 폴백·방글라데시 표현 0 / live 국가는 선택 가능 | — |

`finalize:v151`의 예상 실패 인자: `--expect-pending 12 --expect-fail data-date,c003-filename`

| 인자 | 사유 | 제거 시점 |
|---|---|---|
| `--expect-pending 12` | 지도 대상 72 중 12 미연결 | 지도 12 PR 병합 후 |
| `data-date` | 홈 기준일은 manifest 생성일(2026-08-27). 입고일(2026-09-22)은 공개 트리에 없음 | V162(세션5) 병합 후 |
| `c003-filename` | C-003 상세에 문서 파일명 3건 | V162(세션5) 병합 후 |

## 공개 문구 검사 강화(#47 스캔)

- 괄호 속 원값은 **사전에 등재된 한글 라벨 바로 뒤**일 때만 인용으로 인정
  - 사전: `src/data/visualization/osmClassLabelsV162.json`, A-027·A-028 OSM 분류값 30개
  - 사전에 없는 앞말 + 원값('피처 수(narrow_gauge)')은 실패
- **href 밖 파일명**(`*.pdf`·`*.xlsx`·`*.csv`·`*.docx`·`*.json` 등)은 실패. 인용 예외 없음(사용자 결정)
- 상세 본문은 닫힌 `<details>`(원자료 표 등)를 열고 읽음. 이전에는 보이는 글만 읽어 닫힌 표를 놓침
- 메모리:
  - 상세 페이지를 20개 묶음으로 처리하고, 묶음마다 브라우저 컨텍스트를 닫음. 동시 1개
  - #42 감사도 20쪽마다 컨텍스트를 새로 열고, 게이트에서 `--workers 1`로 실행

### 수정 전 빌드(main 1374a61)에서 잡은 5건과 전후 문구

| 요소 | 위치 | 수정 전 | 수정 후 |
|---|---|---|---|
| A-027 | 원자료 표 '분류' 열(분류값 19행) | 분류별 피처 수(narrow_gauge) · 분류 분류값별 지물 건수 | 분류별 지물 수 · 협궤 철도 (narrow_gauge) |
| A-027 | 원자료 표 '분류' 열(레이어 2행)·카드·KPI 제목 | 피처 수 · OSM 철도 레이어의 지물 건수 / 도로 레이어 · 피처 수 · … | 지물 수 · OSM 철도 레이어의 지물 건수 / 도로 레이어 · 지물 수 · … |
| A-028 | 원자료 표 '분류' 열(분류값 11행) | 분류별 피처 수(cave_entrance) · 분류 분류값별 지물 건수 | 분류별 지물 수 · 동굴 입구 (cave_entrance) |
| E-006 | 원자료 표 열 제목 5개 | hqCountryIso3 · investSector · fundOrAffiliate · locationClass · adm1Name34 | 본부 국가 · 투자 분야 · 펀드·계열사 · 소재 구분 · 성·시(개편 후 34개) |
| C-008 | 원자료 표 항목 | 2026-08-18 기준 businessActivity 필드 보유 건수 | 2026-08-18 기준 업종 항목 보유 건수 |
| C-003 | 원자료 표 문서명 | NAP_Vietnam_2025_EN.pdf · NAP_Vietnam_2025_VN.pdf · nap_report_eng_small.pdf | (변경 없음 — V162에서 세션5가 수정, 게이트는 예상 실패로 표시) |

- A-027 원자료 표 실측: 35행 중 이전 문구 **21행**(분류값 19 + 레이어 '피처 수' 2). 지시문의 33행과 다르다. 수정 후 0행
- 명세서 문구('데이터 설명'·활용 사례)의 '피처'는 명세서 수기 수정 금지로 유지

### 게이트 1차 실행에서 추가로 잡힌 1건

- B-039·B-040 원문 확인 링크 문구: 'U.S. EIA International Energy Statistics (Bulk File INTL.txt)' → 'U.S. EIA International Energy Statistics'
- 수정: 출처명 판정 함수에서 괄호 속 파일명만 제거. 기관·자료명은 유지
- 기대값 변경: #42 때 'INTL.txt'를 메모 없는 출처명으로 유지하던 단위 테스트 2곳
  - 사유: 'href 밖 파일명은 FAIL'(사용자 결정 2026-09-30)

## 알려진 사항(보고만)

- B-004 참고문헌(APA) 'CMIP6_Amon.json'은 '다운로드·참고문헌' 층(분석 영역 밖)이라 #47 스캔 범위 밖. #42 감사의 작업 파일 패턴은 json·pdf를 보지 않는다
- B-039·B-040 등 'U.S. EIA(환경영향평가)': 용어 풀이가 잘못 붙음. 여기서 EIA는 미국 에너지정보청(Energy Information Administration)이다. 용어 사전 수정 별도 필요
- 공개 전 국가 폴백에서 국가 선택 목록(select)은 모든 나라를 이름으로 나열하므로 '다른 나라 표현' 판정에서 제외

## 검증

GATE_RESULT
