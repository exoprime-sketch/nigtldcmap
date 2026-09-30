# REVIEW — 인수 게이트 2차(feat/v162-acceptance-2)

기준: origin/main e093db1(#52·#53 병합 후). 사용자 지시 2026-10-01.

## 변경
### qa:acceptance:v162에 추가한 판정 5건
| # | 판정 id | 내용 | 방식 |
|---|---|---|---|
| 1 | `other-country-names` | 공개 국가별로 모든 공개 문구에서 다른 나라 국명(countries.json 한글·영문명) 0 | 홈·찾기(카드 전부)·지도(목록 펼침)·다운로드·이용안내·상세 전체(모든 층·`<details>` 열고 textContent)를 읽는다. 국가 선택 목록과 국가 비교 절(`country-compare-v158`)은 뺀다. 상세는 20개 묶음마다 컨텍스트를 닫는다. 검출 전부는 `reports/v162/other-country-names-v162.json`에 쓴다. |
| 2 | `finder-sort-default` · `finder-sort-views` | 기본 가나다순(미입고는 끝), 조회순을 고르면 조회수 순으로 순서가 바뀜 | 정적 빌드에는 조회 서비스가 없어 `/api/usage`에 시험 조회수(가나다 역순)를 넣는다. 조회순을 쓸 수 있는 상태에서도 기본값이 가나다순인지 함께 본다. |
| 3 | `core-word` | 지도 화면 '핵심' 0 | `scan-core-word-v157`에 `--out`·`--country`·종료 코드를 추가해 연결했다. 자료명 '핵심광물'(B-044 핵심광물 부존)은 #47에서 유일한 예상 검출로 기록돼 있어 제외한다. |
| 4 | `data-date` | 홈 데이터 기준일 = 국가별 provenance 입고일 | `catalog.provenance.sourceDeliveredAt`을 먼저, V162가 쓰는 `manifest.provenance.sourceDeliveredAt`을 다음으로 읽는다. 국가 공통 보고서(`reports/v156/refresh-v156.json`) 대체는 없앴다. provenance가 없으면 실패이고, V162 병합 전에는 예상 실패다. |
| 5 | `production-smoke` | 운영 smoke 국가별 | `smoke:production:v128 --country`를 쓴다. 기본값은 공개 국가 전부이고, 여러 나라면 나라마다 따로 프로세스를 띄운다. 공개 전 국가는 SKIPPED로 끝낸다(BGD는 공개 후 실행). 인수 게이트는 `PRODUCTION_URL`이 있으면 운영을, 없으면 자기가 띄운 빌드를 검사한다. |

### smoke:production:v128 기대값 변경(사유 기록 — CLAUDE.md 규칙)
- main의 smoke는 현재 빌드에서 **이미 실패** 상태였다(13건 중 통과 4). 같은 빌드에 main 원본 스크립트를 돌려 확인했다. 어떤 게이트에도 들어 있지 않아 드러나지 않았다.
- `FINDER_SEARCH`
  - 전: 'CPIA' 검색 뒤 화면 본문에 'CPIA'라는 글자가 있어야 했다.
  - 문제: V159부터 카드는 출처 약어 없이 자료명만 보여 준다. 검색은 1건(A-002)을 찾지만 본문에 'CPIA'가 없다.
  - 후: 검색 결과에 검색한 요소(A-002) 카드가 있어야 한다. 검색이 해당 자료를 찾는다는 의도는 같다.
- `MAP_POWER_PRESET` → `MAP_POWER_LAYER`
  - 문제: 지도에서 프리셋 버튼(`data-preset-id`)이 없어졌다.
  - 후: 데이터 목록에서 A-024를 켜고, 기존과 같게 주 레이어 A-024·지도가 그려짐·범례를 본다. 프리셋 속성 조건만 뺐다.
- 나머지 11개 판정은 기대값을 그대로 두고 통과했다.

### A-027 데이터 설명 문구(명세서 정정 파일 방식)
- `specTextOverridesV159.json`에 A-027 정정 9건을 넣었다.
  - 상세 설명 2건, 활용 방법 1건
  - 사례 1의 논리 구조 2건, 쓰는 데이터 2건, 스토리라인 1건
  - 사례 2의 쓰는 데이터 1건
- '피처'는 '지물'로, '분류값(fclass)'은 '분류값'으로 바꿨다.
- 명세서 담당자에게 넘기는 `docs/handoff/v159/SPEC_TEXT_CORRECTIONS.md`에 9행이 생성됐다.
- importer 수정:
  - 활용 사례 `logic`·`storyline` 필드에도 정정을 적용한다(전에는 caution·dataUsed만).
  - 정정 문서의 빈 '플랫폼 표시'는 '(삭제)'로 쓰고, 칸 앞뒤 공백을 지운다. 그래서 기존 A-028 행이 커밋본과 같게 다시 생성된다.
- 재적재 결과 중 A-027과 관계없는 차이는 되돌렸다(#53에서 보고한 typology geometry 등).

## 검증
| 항목 | 결과 |
|---|---|
| tsc | 오류 0 |
| test:unit | 71 스위트 · 739 통과 |
| build(GENERATE_SOURCEMAP=false) | 성공 |
| smoke:production:v128(VNM, 이 빌드) | 13/13 PASS(수정 전 main 원본은 같은 빌드에서 4/13) |
| smoke:production:v128 --country BGD | SKIPPED(공개 전, exit 0) |
| **qa:acceptance:v162 1회**(gate-lock, `--expect-pending 12 --expect-fail data-date,c003-filename`) | FAIL — 통과 21 · 실패 1 · 예상 실패 3 · 건너뜀 1 |

### 판정표
| 국가 | 영역 | 검사 | 판정 | 실측 |
|---|---|---|---|---|
| VNM | finder | 찾기 목록 = 카탈로그 공개 요소 | PASS | {"total": 146, "cards": 146} |
| VNM | finder | 2026년 제외 요소 비노출(찾기) | PASS | [] |
| VNM | finder | '데이터 준비 중' 카드 = 카탈로그 미입고 상태 | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 미입고 상세의 '데이터 준비 중' 안내 | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 찾기 기본 정렬 = 가나다순(미입고는 끝) 🆕 | PASS | {"mode": "name", "nameSorted": true, "preparingLast": true, "cards": 146, "first": ["A-016", "D-003", "B-005"] |
| VNM | finder | 조회순 선택 시 조회수 순으로 순서 변경(시험 조회수 주입) 🆕 | PASS | {"enabled": true, "mode": "views", "orderMatches": true, "orderChanged": true, "first": ["E-009", "A-015", "A- |
| VNM | finder | 명세 유형의 data-pending = 카탈로그 미입고(단일 출처) | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 제외 요소 전 화면 비노출(audit:exclusions:v156) | PASS | {"status": "PASS", "failedChecks": []} |
| VNM | map | 지도 대상·연결 수 = map-index 실측 | PASS | {"target": 72, "connected": 60, "pending": 12, "pendingBadges": 12} |
| VNM | map | 지도 '준비 중' 0 (예상 실패 허용 12건) | 예상 실패 | {"pending": 12, "badges": 12, "ids": ["A-013", "A-022", "B-002", "B-024", "B-035", "B-036", "B-044", "B-046",  |
| VNM | map | 활성 레이어 전부 렌더·클릭(qa:map:v138) | PASS | {"active": 60, "rendered": 60, "clicked": 60, "internalPhraseLayers": [], "consoleErrors": 0, "httpFailuresExc |
| VNM | wording | 내부 작업 메모 0(홈·찾기·상세·다운로드·지도, #42) | PASS | {"findings": 0, "detailPages": 146, "runtimeErrors": 0} |
| VNM | wording | 식별자·파일명·작업 어휘 0(지도 목록·정보·선택 패널·연관 카드·상세, #47) | PASS | {"findings": 0, "elements": [], "exceptions": 0, "scanned": 798} |
| VNM | wording | C-003 상세의 파일명 0(V162에서 수정) | 예상 실패 | ["file-name:NAP_Vietnam_2025_EN.pdf", "file-name:NAP_Vietnam_2025_VN.pdf", "file-name:nap_report_eng_small.pdf |
| VNM | wording | 다른 나라 국명 0(홈·찾기·지도·다운로드·이용안내·상세 전체, 국가 비교 절 제외) 🆕 | **FAIL** | {"hits": 34, "detailPages": 146, "first": ["guide:방글라데시 «획Integrated Energy and Power Master Plan방글라데시 정부가 수립한 |
| VNM | wording | '핵심' 표현 0(지도 화면, scan-core-word-v157) 🆕 | PASS | {"hits": [], "layers": 72} |
| VNM | numbers | 홈 전체 데이터 항목 = 카탈로그 공개 요소 | PASS | 146개 |
| VNM | numbers | 홈 지도 제공 항목 = map-index 활성 레이어 | PASS | 60개 |
| VNM | numbers | 홈 다운로드 가능 항목 = manifest | PASS | 143개 |
| VNM | numbers | 다운로드 목록 = 카탈로그 공개 요소(제외 0) | PASS | 146 |
| VNM | numbers | 데이터 기준일 = 원자료 입고일(국가별 provenance) 🆕 | 예상 실패 | {"shown": "2026.08.27", "manifestGeneratedAt": "2026-08-27T00:00:00Z"} |
| VNM | widths | 6폭(320·390·768·1024·1440·1920) 가로 넘침 0 | PASS | {"combinations": 42, "overflowing": 0, "failing": []} |
| VNM | smoke | 운영 smoke(국가별, 이 빌드) 🆕 | PASS | {"exit": 0, "runtimeFailure": null, "routeFailures": 0, "assetFailures": 0, "consoleErrors": 0} |
| BGD | country | ?country=BGD: 공개 전 폴백 · 다른 나라 표현 0 | PASS | [] |
| BGD | country | ?country=BGD: 기본 국가 목록으로 폴백 | PASS | 146 |
| BGD | smoke | 운영 smoke(국가별) 🆕 | 건너뜀 | 공개 전(preparing) - 공개 후 실행 |

**FAIL** — 통과 21 · 실패 1 · 예상 실패 3 · 건너뜀 1 (총 26). 🆕 = 이번에 추가한 판정

### 실패 1건: 다른 나라 국명(`other-country-names`)
- 34건 · 33곳: A-022, B-001, B-003, B-004, B-006, B-007, B-016, B-021, B-031, B-034, B-038, B-039, B-048, C-003, C-004, C-005, C-008, C-009, C-010, C-012, C-013, C-014, C-016, C-017, C-018, C-019, C-025, D-005, D-008, D-009, D-023, E-010, guide
- 전부 명세서(워크북)에서 온 공개 문구입니다. 이 PR에서는 고치지 않았습니다. 전체 목록: `reports/v162/other-country-names-v162.json`.
  - 활용 사례 유의점(약 15곳): '베트남·방글라데시 2개국에만 있다' 같은 문장. importer가 '나라 수를 밝힌 문장'이라는 이유로 국명을 남겨 둔 규칙(`keep-original(count)`·`keep-original(list)`)에 해당합니다.
  - 데이터 설명(상세 설명·활용 방법, 약 15곳): 여러 나라 자료의 나라별 원천을 설명하는 문장(C-009·C-010·C-013·C-016~C-019·C-025·D-023 등).
  - 활용 사례 제목·논리(D-005 'Bangladesh Budget Split'·D-008): 방글라데시 사례 자체.
  - 용어 풀이 2곳: 이용안내의 IEPMP(방글라데시 정부 계획), C-008 상세의 CCAC('UNEP과 방글라데시 등 6개 창립국').
- 이 판정은 `finalize:v151`에 들어 있습니다. 그래서 병합 뒤에는 문구를 고치거나 예상 실패로 지정하기 전까지 `finalize:v151`이 실패합니다.

## 미완료와 사유
- 다른 나라 국명 34건: 명세서 문구 정정(또는 국가별 표시 규칙)이 필요해 사용자 결정 대기.
- 데이터 기준일: V162(manifest.provenance.sourceDeliveredAt) 병합 전까지 예상 실패.
- 운영 smoke BGD: 공개(status live) 후 실행.

