## 요약
완료 기준 가운데 자동화되지 않았던 5건을 `qa:acceptance:v162`에 넣었습니다. 추가로 A-027 데이터 설명의 '피처'·'분류값(fclass)' 표기를 정리했습니다.

| # | 추가 판정 | 결과 |
|---|---|---|
| 1 | 다른 나라 국명 0(공개 국가별, 모든 공개 문구, 국가 비교 절 제외) | **FAIL — 34건(명세서 문구)** · 결정 필요 |
| 2 | 찾기 정렬: 기본 가나다순, 조회순 선택 시 순서 변경 | PASS · PASS |
| 3 | '핵심' 표현 0(scan-core-word-v157 연결) | PASS |
| 4 | 데이터 기준일 = 국가별 provenance 입고일 | 예상 실패(V162 병합 전 provenance 없음) |
| 5 | 운영 smoke 국가별(`smoke:production:v128 --country`) | VNM PASS · BGD 건너뜀(공개 후 실행) |

## Preview
PREVIEW_URL

## 결정 필요: 다른 나라 국명 34건
34건 · 33곳: A-022, B-001, B-003, B-004, B-006, B-007, B-016, B-021, B-031, B-034, B-038, B-039, B-048, C-003, C-004, C-005, C-008, C-009, C-010, C-012, C-013, C-014, C-016, C-017, C-018, C-019, C-025, D-005, D-008, D-009, D-023, E-010, guide
- 원인은 모두 명세서 문구입니다.
  - 활용 사례 유의점: '베트남·방글라데시 2개국에만 있다'. importer가 나라 수를 밝힌 문장이라 국명을 남기는 규칙에 해당합니다.
  - 데이터 설명: 나라별 원천 설명.
  - D-005·D-008: 방글라데시 사례.
  - 용어 풀이 2곳.
- 이 판정은 `finalize:v151`에 들어 있어, 병합 뒤에는 조치 전까지 `finalize:v151`이 실패합니다. 선택지:
  - (가) 명세서 정정 파일로 문구를 고칩니다(별도 PR). 국가 공통 필드에서 국명을 빼거나 '일부 나라'로 바꿉니다.
  - (나) 고칠 때까지 `--expect-fail other-country-names`로 표시합니다.
- 전체 목록: `reports/v162/other-country-names-v162.json`.

## 기대값 변경(사유 기록 — `reports/v162/REVIEW_ACCEPTANCE_2.md`)
- `smoke:production:v128`은 main에서도 이미 실패하고 있었습니다. 같은 빌드에 main 원본을 돌리면 13건 중 4건만 통과합니다. 어떤 게이트에도 들어 있지 않아 드러나지 않았습니다.
  - `FINDER_SEARCH`: 'CPIA'를 검색한 뒤 본문에 'CPIA' 글자가 있는지 보던 것을, 검색 결과에 A-002 카드가 있는지 보도록 바꿨습니다. V159부터 카드에 약어를 표시하지 않기 때문입니다.
  - `MAP_POWER_PRESET` → `MAP_POWER_LAYER`: 지도에서 프리셋 버튼이 없어졌습니다. 이제 목록에서 A-024를 켜고 기존과 같은 기준(주 레이어·그려짐·범례)으로 봅니다.
  - 나머지 11개 판정은 그대로입니다. 수정 후 13/13입니다.
- `scan-core-word-v157`: 자료명 '핵심광물'(B-044)은 #47에서 유일한 예상 검출로 기록돼 있어 제외했습니다.
- 데이터 기준일: 국가 공통 보고서(refresh-v156)를 대신 읽던 것을 없애고 국가별 provenance만 읽습니다.

## A-027 문구 정리(명세서 정정 파일 방식, 수기 수정 없음)
| 위치 | 수정 전 | 수정 후 |
|---|---|---|
| 상세 설명 | 철도 레이어와 도로 레이어 각각에 대해 피처 수, … 분류값(fclass)별 피처 수를 담아 | … 각각에 대해 지물 수, … 분류값별 지물 수를 담아 |
| 활용 방법 | 분류별 피처 수를 보면 | 분류별 지물 수를 보면 |
| 사례 1 논리 구조 | 등급별 피처(지도에 입력된 선 하나하나) … 전체 도로 피처 가운데 | 등급별 지물(…) … 전체 도로 지물 가운데 |
| 사례 1 쓰는 데이터(칩 5개) | 도로 등급별 피처 수 ×4 · 도로 전체 피처 수 | 도로 등급별 지물 수 ×4 · 도로 전체 지물 수 |
| 사례 1 예시 문장 | 도로 피처 가운데 | 도로 지물 가운데 |
| 사례 2 쓰는 데이터(칩 3개) | 철도 분류별 피처 수 | 철도 분류별 지물 수 |

- 정정 9건은 `specTextOverridesV159.json`에 기록돼 있고, 명세서 담당자에게 넘기는 정정 표(`docs/handoff/v159/SPEC_TEXT_CORRECTIONS.md`)에도 들어갑니다.
- importer가 활용 사례의 논리 구조와 스토리라인에도 정정을 적용하도록 고쳤습니다.

## 화면이 바뀌는 곳과 확인 경로
- A-027 상세(`/?view=data&country=VNM&element=A-027#element-detail`) → '데이터 설명' 펼치기 → 상세 설명·활용 방법 → '활용 사례' 펼치기 → 사례 1·2
- 그 밖의 화면 변화는 0입니다(스크립트만 바뀜).

| 대상 | 전(운영) | 후(이 브랜치) |
|---|---|---|
| A-027 상세 설명 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance-2/reports/v162/screens-acceptance-2/before-a027-description.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance-2/reports/v162/screens-acceptance-2/after-a027-description.png) |
| A-027 활용 사례 1(칩·예시) | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance-2/reports/v162/screens-acceptance-2/before-a027-case1.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance-2/reports/v162/screens-acceptance-2/after-a027-case1.png) |

## 검증(1회 실행)
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
  - 활용 사례 유의점(약 15곳): '베트남·방글라데시 2개국에만 있다' 같은 문장. importer가 '나라 수를 밝힌 문장'이라는 이유로 국명을 남겨 둔 규칙(`cautionKeptForCount`)에 해당합니다.
  - 데이터 설명(상세 설명·활용 방법, 약 15곳): 여러 나라 자료의 나라별 원천을 설명하는 문장(C-009·C-010·C-013·C-016~C-019·C-025·D-023 등).
  - 활용 사례 제목·논리(D-005 'Bangladesh Budget Split'·D-008): 방글라데시 사례 자체.
  - 용어 풀이 2곳: 이용안내의 IEPMP(방글라데시 정부 계획), C-008 상세의 CCAC('UNEP과 방글라데시 등 6개 창립국').
- 이 판정은 `finalize:v151`에 들어 있습니다. 그래서 병합 뒤에는 문구를 고치거나 예상 실패로 지정하기 전까지 `finalize:v151`이 실패합니다.

병합은 검토 후 "PR 병합" 지시가 있을 때만.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01V68y43MvVho6XhCXbfyvLp
