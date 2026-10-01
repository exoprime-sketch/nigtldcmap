# REVIEW — 국가 중립 문구(feat/v162-country-neutral, PR #55)

변경·검증 상세는 `reports/v162/PR_BODY_COUNTRY_NEUTRAL.md`를 봅니다.

## 게이트(CI `gate` 작업) — PASS
- CI 실행: https://github.com/exoprime-sketch/nigtldcmap/actions/runs/36804223976 (커밋 71c0a4e 기준)
  - `gate`: success
  - static·browser 4샤드·summary·analysis 작업: 모두 success
- `finalize:v151`(CI, 로컬 실행 없음):
  - release:v136 80/80
  - role-split 53/53
  - analysis QA 필수 실패 34건(기준선 41 이내), 신규 0, 해소 7(A-017·A-023·B-026·C-002·C-012·C-019·E-016)
  - boundary-34 21 통과·1 건너뜀
  - boundary-policy 25/25
- `qa:acceptance:v162`: **PASS** — 통과 22 · 실패 0 · 예상 실패 3 · 건너뜀 1 (총 26)
  - **다른 나라 국명 0건**(PR #54에서는 34건)
- artifact: `gate-finalize-v151-36804223976-1`(acceptance-v162.json·.md, finalize-v151-ci.log 등)

### 판정표
| 국가 | 영역 | 검사 | 판정 | 실측 |
|---|---|---|---|---|
| VNM | finder | 찾기 목록 = 카탈로그 공개 요소 | PASS | {"total": 146, "cards": 146} |
| VNM | finder | 2026년 제외 요소 비노출(찾기) | PASS | [] |
| VNM | finder | '데이터 준비 중' 카드 = 카탈로그 미입고 상태 | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 미입고 상세의 '데이터 준비 중' 안내 | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 찾기 기본 정렬 = 가나다순(미입고는 끝) | PASS | {"mode": "name", "nameSorted": true, "preparingLast": true, "cards": 146, "first": ["A-016", "D-003", "B-005"] |
| VNM | finder | 조회순 선택 시 조회수 순으로 순서 변경(시험 조회수 주입) | PASS | {"enabled": true, "mode": "views", "orderMatches": true, "orderChanged": true, "first": ["E-009", "A-015", "A- |
| VNM | finder | 명세 유형의 data-pending = 카탈로그 미입고(단일 출처) | PASS | ["C-023", "E-011", "E-013"] |
| VNM | finder | 제외 요소 전 화면 비노출(audit:exclusions:v156) | PASS | {"status": "PASS", "failedChecks": []} |
| VNM | map | 지도 대상·연결 수 = map-index 실측 | PASS | {"target": 72, "connected": 60, "pending": 12, "pendingBadges": 12} |
| VNM | map | 지도 '준비 중' 0 (예상 실패 허용 12건) | 예상 실패 | {"pending": 12, "badges": 12, "ids": ["A-013", "A-022", "B-002", "B-024", "B-035", "B-036", "B-044", "B-046",  |
| VNM | map | 활성 레이어 전부 렌더·클릭(qa:map:v138) | PASS | {"active": 60, "rendered": 60, "clicked": 60, "internalPhraseLayers": [], "consoleErrors": 0, "httpFailuresExc |
| VNM | wording | 내부 작업 메모 0(홈·찾기·상세·다운로드·지도, #42) | PASS | {"findings": 0, "detailPages": 146, "runtimeErrors": 0} |
| VNM | wording | 식별자·파일명·작업 어휘 0(지도 목록·정보·선택 패널·연관 카드·상세, #47) | PASS | {"findings": 0, "elements": [], "exceptions": 0, "scanned": 798} |
| VNM | wording | C-003 상세의 파일명 0(V162에서 수정) | 예상 실패 | ["file-name:NAP_Vietnam_2025_EN.pdf", "file-name:NAP_Vietnam_2025_VN.pdf", "file-name:nap_report_eng_small.pdf |
| VNM | wording | 다른 나라 국명 0(홈·찾기·지도·다운로드·이용안내·상세 전체, 국가 비교 절 제외) | PASS | {"hits": 0, "detailPages": 146, "first": []} |
| VNM | wording | '핵심' 표현 0(지도 화면, scan-core-word-v157) | PASS | {"hits": [], "layers": 72} |
| VNM | numbers | 홈 전체 데이터 항목 = 카탈로그 공개 요소 | PASS | 146개 |
| VNM | numbers | 홈 지도 제공 항목 = map-index 활성 레이어 | PASS | 60개 |
| VNM | numbers | 홈 다운로드 가능 항목 = manifest | PASS | 143개 |
| VNM | numbers | 다운로드 목록 = 카탈로그 공개 요소(제외 0) | PASS | 146 |
| VNM | numbers | 데이터 기준일 = 원자료 입고일(국가별 provenance) | 예상 실패 | {"shown": "2026.08.27", "manifestGeneratedAt": "2026-08-27T00:00:00Z"} |
| VNM | widths | 6폭(320·390·768·1024·1440·1920) 가로 넘침 0 | PASS | {"combinations": 42, "overflowing": 0, "failing": []} |
| VNM | smoke | 운영 smoke(국가별, 이 빌드) | PASS | {"exit": 0, "runtimeFailure": null, "routeFailures": 0, "assetFailures": 0, "consoleErrors": 0} |
| BGD | country | ?country=BGD: 공개 전 폴백 · 다른 나라 표현 0 | PASS | [] |
| BGD | country | ?country=BGD: 기본 국가 목록으로 폴백 | PASS | 146 |
| BGD | smoke | 운영 smoke(국가별) | 건너뜀 | 공개 전(preparing) - 공개 후 실행 |

예상 실패 3건은 기존과 같습니다(지도 준비 중 12건, C-003 파일명, 데이터 기준일 = V162 병합 후 제거). BGD 운영 smoke는 공개 전이라 건너뜁니다.

## 기대값 변경(사유)
- `DataDescriptionV159.test.tsx`: '원문 유의점 툴팁' 테스트를 '원문은 보이지 않음' 테스트로 바꿨다. 사유: 명세서 원문에 다른 나라 이름이 있어 툴팁도 공개 노출이기 때문이다.
- `finalize:v151:steps`: `--expect-fail other-country-names`를 제거했다(34건 해소).

## 미완료와 사유
- ASAP 정책 설명 한 줄은 대상 밖 나라(부탄·네팔)가 목록에 섞여 국가 중립 문구로 바꿀 수 없다. 그래서 VNM 화면에서 뺐다.
- 명세서 원문 정정(v1.2): `docs/handoff/v162/COUNTRY_TEXT_VIEWS_V162.md`를 원천으로 용역사가 작성한다.
- 잠금 파일(`~/.nigt-gate.lock`): 지시대로 그대로 두었다.
