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

## 판정표(qa:acceptance:v162, VNM + BGD 폴백)
| 국가 | 영역 | 검사 | 판정 | 실측 |
|---|---|---|---|---|
| VNM | finder | 찾기 목록 = 카탈로그 공개 요소 | PASS | {"total": 146, "cards": 146} |
| VNM | finder | 2026년 제외 요소 비노출(찾기) | PASS | [] |
| VNM | finder | '데이터 준비 중' 카드 = 카탈로그 미입고 상태 | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 미입고 상세의 '데이터 준비 중' 안내 | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 명세 유형의 data-pending = 카탈로그 미입고(단일 출처) | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 제외 요소 전 화면 비노출(audit:exclusions:v156) | PASS | {"status": "PASS", "failedChecks": []} |
| VNM | map | 지도 대상·연결 수 = map-index 실측 | PASS | {"target": 72, "connected": 60, "pending": 12, "pendingBadges": 12} |
| VNM | map | 지도 '준비 중' 0 (예상 실패 허용 12건) | 예상 실패 | {"pending": 12, "badges": 12, "ids": ["A-013", "A-022", "B-002", "B-024", "B-035", "B-036", "B-044", "B-046", "B-047", " |
| VNM | map | 활성 레이어 전부 렌더·클릭(qa:map:v138) | PASS | {"active": 60, "rendered": 60, "clicked": 60, "internalPhraseLayers": [], "consoleErrors": 0, "httpFailuresExceptTiles": |
| VNM | wording | 내부 작업 메모 0(홈·찾기·상세·다운로드·지도, #42) | PASS | {"findings": 0, "detailPages": 146, "runtimeErrors": 0} |
| VNM | wording | 식별자·파일명·작업 어휘 0(지도 목록·정보·선택 패널·연관 카드·상세, #47) | PASS | {"findings": 0, "elements": [], "exceptions": 0, "scanned": 798} |
| VNM | wording | C-003 상세의 파일명 0(V162에서 수정) | 예상 실패 | ["file-name:NAP_Vietnam_2025_EN.pdf", "file-name:NAP_Vietnam_2025_VN.pdf", "file-name:nap_report_eng_small.pdf"] |
| VNM | numbers | 홈 전체 데이터 항목 = 카탈로그 공개 요소 | PASS | 146개 |
| VNM | numbers | 홈 지도 제공 항목 = map-index 활성 레이어 | PASS | 60개 |
| VNM | numbers | 홈 다운로드 가능 항목 = manifest | PASS | 143개 |
| VNM | numbers | 다운로드 목록 = 카탈로그 공개 요소(제외 0) | PASS | 146 |
| VNM | numbers | 데이터 기준일 = 원자료 입고일 | 예상 실패 | {"shown": "2026.08.27", "manifestGeneratedAt": "2026-08-27T00:00:00Z"} |
| VNM | widths | 6폭(320·390·768·1024·1440·1920) 가로 넘침 0 | PASS | {"combinations": 42, "overflowing": 0, "failing": []} |
| BGD | country | ?country=BGD: 공개 전 폴백 · 다른 나라 표현 0 | PASS | [] |
| BGD | country | ?country=BGD: 기본 국가 목록으로 폴백 | PASS | 146 |

**PASS** — 통과 17 · 실패 0 · 예상 실패 3 (총 20)

예상 실패 인자(`finalize:v151:steps`): `--expect-pending 12 --expect-fail data-date,c003-filename`

| 인자 | 사유 | 제거 시점 |
|---|---|---|
| `--expect-pending 12` | 지도 대상 72개 중 12개 미연결 | 지도 12 PR 병합 후 |
| `data-date` | 홈 기준일이 manifest 생성일(2026-08-27)이고, 입고일(2026-09-22)은 공개 트리에 없음 | V162(세션5) 병합 후 |
| `c003-filename` | C-003 상세에 문서 파일명 3건 | V162(세션5) 병합 후 |

## 게이트 실행 기록(단계별 통과로 인정 — 사용자 결정)
| 실행 | 결과 |
|---|---|
| finalize:v151 1차(3298818) | release:v136 80/80 · role-split 53/53 · analysis QA 필수 34(기준선 41)·신규 0 · boundary-34 21 통과 · boundary-policy 25/25 · acceptance: 공개 문구 1건(B-039·B-040 INTL.txt) 실패 → 수정 |
| finalize:v151 2차(e2754ad) | release:v136 80/80·role-split 통과 뒤, analysis QA 도중 **메모리 부족으로 Claude Code가 중단**(명령 실패 아님) |
| 3차 | 실행하지 않음(사용자 결정). 대신 아래 2개 단계를 한 번씩 단독 실행 |
| (a) qa:analysis:v140:baseline 단독 | 필수 34(기준선 41 이내) · 신규 0 · **PASS**(묶음 처리 추가 불필요) |
| (b) qa:acceptance:v162 단독 | PASS — 통과 17 · 실패 0 · 예상 실패 3(지도 준비 중 12 · C-003 파일명 · 데이터 기준일) |

## main #51 merge 후 추가
- `p5:final`을 gate-lock으로 감쌈. #51 러너의 인수 게이트 이름을 `qa:acceptance:v162`로 연결하고 제한 시간을 120분으로 늘림. dry-run으로 연결 확인.
