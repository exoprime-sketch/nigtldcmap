## 요약
통합 인수 게이트 `qa:acceptance:v162`를 추가하고 `finalize:v151`에 편입했습니다. 공개 문구 스캔을 강화했고, 강화된 스캔이 잡은 공개 화면 문구를 고쳤습니다.
- **게이트**: 국가별(`--country VNM|BGD`, 기본 = 공개 국가 전부)로 판정합니다. 기존 검사를 프로세스로 실행해 보고서를 읽고, 없던 판정만 새로 넣었습니다.
  - 재사용: exclusions v156, qa:map v138, source-notes v161(#42), 공개 문구 스캔 v157(#47), review-runtime v150 반응형
  - 새 판정:
    - 카탈로그 실측 수
    - '데이터 준비 중' 단일 출처
    - 데이터 기준일 = 입고일
    - 공개 전 국가 폴백 / live 국가 선택 가능
  - 결과는 `reports/v162/acceptance-v162.{json,md}`에 쓰고, 실패하면 exit 1
- **문구 스캔 강화**(#47):
  - 괄호 원값은 사전 등재 한글 라벨 바로 뒤일 때만 인용으로 인정합니다(A-027·A-028 OSM 분류값 30개).
  - href 밖 파일명은 실패로 판정합니다(인용 예외 없음).
  - 닫힌 표(`<details>`)까지 읽습니다.
- **메모리**: 상세 페이지를 20개 묶음으로 처리하고 묶음마다 브라우저 컨텍스트를 닫습니다(동시 1개). source-notes 감사는 `--workers 1`로 실행하고 20쪽마다 컨텍스트를 새로 엽니다.
- **gate-lock**: `scripts/gate-lock.mjs`(`~/.nigt-gate.lock`)가 무거운 게이트를 한 번에 1개만 돌립니다.
  - 적용: `finalize:v151`·`qa:acceptance:v162`·`e2e`
  - 대기 30초, 2시간 지난 잠금은 만료 처리, 게이트 안에서 부른 게이트는 잠금을 이어받음
  - `p5:final`은 main에 없어 적용하지 못했습니다.
- CLAUDE.md에 2줄을 추가했습니다(보고 전 게이트 실행, gate-lock).

## Preview
PREVIEW_URL

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

## 수정 전 빌드(main 1374a61)에서 잡은 5건과 전후 문구
| 요소 | 위치 | 수정 전 | 수정 후 |
|---|---|---|---|
| A-027 | 원자료 표 '분류' 열(분류값 19행) | 분류별 피처 수(narrow_gauge) · 분류 분류값별 지물 건수 | 분류별 지물 수 · 협궤 철도 (narrow_gauge) |
| A-027 | 원자료 표(레이어 2행)·카드·KPI 제목 | 피처 수 · OSM 철도 레이어의 지물 건수 / 도로 레이어 · 피처 수 · … | 지물 수 · … / 도로 레이어 · 지물 수 · … |
| A-028 | 원자료 표 '분류' 열(분류값 11행) | 분류별 피처 수(cave_entrance) · 분류 분류값별 지물 건수 | 분류별 지물 수 · 동굴 입구 (cave_entrance) |
| E-006 | 원자료 표 열 제목 5개 | hqCountryIso3 · investSector · fundOrAffiliate · locationClass · adm1Name34 | 본부 국가 · 투자 분야 · 펀드·계열사 · 소재 구분 · 성·시(개편 후 34개) |
| C-008 | 원자료 표 항목 | 2026-08-18 기준 businessActivity 필드 보유 건수 | 2026-08-18 기준 업종 항목 보유 건수 |
| C-003 | 원자료 표 문서명 | NAP_Vietnam_2025_EN.pdf 외 2 | 변경 없음(V162에서 세션5가 수정, 예상 실패로 표시) |

- A-027 실측: 35행 중 **21행**(분류값 19 + '피처 수' 2)이 해당합니다. 지시문의 33행과 수가 다릅니다. 수정 후 0행입니다.
- 게이트 1차 실행에서 1건이 추가로 잡혔습니다. B-039·B-040 원문 링크 'U.S. EIA International Energy Statistics (Bulk File INTL.txt)' → 'U.S. EIA International Energy Statistics'
  - 출처명에서 괄호 속 파일명만 제거했습니다.
  - #42 단위 테스트 2곳의 기대값을 바꿨습니다(사유: href 밖 파일명 FAIL).

## 게이트 실행 기록(단계별 통과로 인정 — 사용자 결정)
| 실행 | 결과 |
|---|---|
| finalize:v151 1차(3298818) | release:v136 80/80 · role-split 53/53 · analysis QA 필수 34(기준선 41)·신규 0 · boundary-34 21 통과 · boundary-policy 25/25 · acceptance: 공개 문구 1건(B-039·B-040 INTL.txt) 실패 → 수정 |
| finalize:v151 2차(e2754ad) | release:v136 80/80·role-split 통과 뒤, analysis QA 도중 **메모리 부족으로 Claude Code가 중단**(명령 실패 아님) |
| 3차 | 실행하지 않음(사용자 결정). 대신 아래 2개 단계를 한 번씩 단독 실행 |
| (a) qa:analysis:v140:baseline 단독 | 필수 34(기준선 41 이내) · 신규 0 · **PASS**(묶음 처리 추가 불필요) |
| (b) qa:acceptance:v162 단독 | PASS — 통과 17 · 실패 0 · 예상 실패 3(지도 준비 중 12 · C-003 파일명 · 데이터 기준일) |

## 화면이 바뀌는 곳과 확인 경로
- A-027·A-028 상세: '자료 출처·상세 데이터' → 원자료 표 '분류' 열
- E-006 상세: 원자료 표 열 제목
- C-008 상세: 원자료 표 항목
- A-027 찾기 카드·상세 KPI: '지물 수'
- B-039·B-040 상세: 원문 확인 링크 문구
- 위 원자료 표는 접힌 층 안에 있습니다. 1440 전후 캡처는 아래 링크에 있습니다.

| 대상 | 전(운영 main) | 후(이 브랜치) |
|---|---|---|
| A-027 원자료 표 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/before-raw-A-027.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/after-raw-A-027.png) |
| A-028 원자료 표 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/before-raw-A-028.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/after-raw-A-028.png) |
| E-006 원자료 표 열 제목 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/before-raw-E-006.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/after-raw-E-006.png) |
| C-008 원자료 표 항목 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/before-raw-C-008.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/after-raw-C-008.png) |
| B-039 원문 확인 링크 | [전](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/before-source-B-039.png) | [후](https://github.com/exoprime-sketch/nigtldcmap/blob/feat/v162-acceptance/reports/v162/screens-acceptance/after-source-B-039.png) |

## 알려진 사항(보고만)
- B-004 참고문헌 'CMIP6_Amon.json'은 '다운로드·참고문헌' 층(분석 영역 밖)이라 스캔 범위 밖입니다.
- 'U.S. EIA(환경영향평가)' 용어 풀이가 잘못 붙어 있습니다. EIA는 미국 에너지정보청을 뜻하므로 용어 사전 수정이 따로 필요합니다.
- 명세서 문구('데이터 설명'·활용 사례)의 '피처'는 명세서 수기 수정 금지에 따라 그대로 두었습니다.

병합은 검토 후 "PR 병합" 지시가 있을 때만.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01V68y43MvVho6XhCXbfyvLp
