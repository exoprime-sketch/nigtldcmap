# 기대값 변경 기록 — V156-D 제외 10건 (feat/v156-d-exclusions)

작성 2026-09-24 · 사유: **사용자 0923 제외 6(C-020·C-023·E-011·E-013·E-016·E-017) + 명세서 0918 제외 4(A-017·C-015·D-024·E-008)** — 결정 파일 `config/data-publication/vietnam-exclusions-v156.json`

## 원칙
- 판정 규칙은 바꾸지 않는다. 바뀐 것은 **어느 집합을 도는가**와 **그 집합의 크기**뿐이다.
- 숫자를 적지 않는다: 전체 집합 = `catalog.json` 요소(152), 공개 집합 = `publicStatus ∉ {excluded, not-provided}`(현재 142). 두 값 모두 `scripts/v156/exclusions-audit-v156.mjs`가 카탈로그에서 계산한다.
- 전체 집합을 쓰는 검사(`FRAMEWORK_ELEMENTS`·`ACCOUNTED_ELEMENTS`·계약 152행·시맨틱·팩·`PORTFOLIO_ELEMENT_COUNT`)는 152 그대로 둔다.
- 검사 항목은 지우지 않는다. 제외 요소를 대상에서 뺀 감사 3개(entity-cards·portfolio-analysis·glossary)는 그 자리에 **제외 안내 카드 존재·차트 0·표 0·다운로드 링크 0** 검사를 넣었다.

## 변경 목록
| 감사·QA | 검사 | 이전 기대값 | 변경 후 | 비고 |
|---|---|---|---|---|
| `entity-cards:v131` | `ENTITY_CARD_ROUTE_COVERAGE` | 엔티티 요소 전체(56) | 공개 엔티티 요소 | 신규 `EXCLUDED_ENTITY_ROUTE_NOTICE_V156`(제외 엔티티 요소의 안내 카드) |
| `portfolio-analysis:v132` | `PORTFOLIO_LIST_BEFORE_SUMMARY` | 포트폴리오 전체 | 공개 포트폴리오 요소 | 신규 `EXCLUDED_PORTFOLIO_ROUTE_NOTICE_V156`, `PORTFOLIO_ELEMENT_COUNT`(렌더러 배정, 전체)는 불변 |
| `portfolio-analysis:v132` | `E008_ANALYSIS_BEFORE_LIST`·`RESEARCH_LIST_BEFORE_ANALYSIS`·`E008_PUBLIC_TITLE_POLICY` | E-008 연구 분석 화면 | E-008이 제외인 동안 안내 카드(존재·차트 0·다운로드 링크 0) | E-008이 다시 공개되면 원래 판정으로 자동 복귀 |
| `glossary:v134` | `PRODUCTION_DOM_ROUTE_COVERAGE` | 157(= 5 + 152) | 5 + 공개 집합 | 제외 안내 페이지 문구도 용어 인벤토리에 포함 |
| `glossary:v134` | `FINDER_ALL_CARDS_AUDITED` | 카탈로그 전체 | 공개 집합 | 신규 `EXCLUDED_DETAIL_NOTICE_V156` |
| `finder-card:v135` | `FINDER_CARD_RUNTIME_COVERAGE` | 152 | 공개 집합 | |
| `public-screen:v135` | 상세 순회 | 카탈로그 전체 | 공개 집합 | 검사 기대값 불변 |
| `detail-hierarchy:v135` | `DETAIL_ROUTE_RUNTIME_COVERAGE` | 152 | 공개 집합 | |
| `temporal-depth:v135` | `TEMPORAL_RUNTIME_COVERAGE` | 152 | 공개 집합 | `TEMPORAL_DEPTH_MARKER_COVERAGE`는 제외 경로의 시간 초과가 사라져 원래 판정 그대로 |
| `public-copy:v134` | `DETAIL_ROUTE_RUNTIME_COVERAGE` | 152 | 공개 집합 | `PUBLIC_ANALYSIS_HEADING_COVERAGE`(소스 제목 152)는 불변 |
| `public-text:v136` | `PUBLIC_ROUTE_COUNT` | ≥157(= 5 + 152) | ≥ 5 + 공개 집합 | |
| `duplicate-copy:v136` | `INSPECTED_ROUTE_COUNT` | ≥154(= 2 + 152) | ≥ 2 + 공개 집합 | |
| `finder-scroll:v136` | `AUTO_LOAD_SEQUENCE` | [24, 48, 72, 96, 120, 144, 152] | 24씩 공개 집합 크기까지([24, 48, 72, 96, 120, 142]) | 묶음 크기 24 불변 |
| `human-review:v136` | `FINDER_HUMAN_REVIEW_COUNT`·`DETAIL_HUMAN_REVIEW_COUNT` | 152 | 공개 집합 | |
| `generic-detail-public:v136-2` | `DETAIL_ROUTE_COUNT` | 152 | 공개 집합 | |
| `screen-usability:v136-4` | `INSPECTED_ROUTE_COUNT` | 요소 전체 + 4 | 공개 집합 + 4 | |
| `release:v136`(본체) | `FINDER_AUTO_LOAD_SEQUENCE` | [24, 48, 72, 96, 120, 144, 152] | 24씩 공개 집합 크기까지 | `finder-scroll` 보고서 판정 |
| `release:v136`(본체) | `FINDER_HUMAN_REVIEW_COUNT`·`DETAIL_HUMAN_REVIEW_COUNT` | 152 | 공개 집합 | `human-review` 보고서 판정 |
| `release:v136`(본체) | `PUBLIC_ROUTE_COUNT` | ≥157(= 5 + 152) | ≥ 5 + 공개 집합 | `public-text` 보고서의 경로 수 판정 |
| `release:v136`(본체) | 명령 목록 | — | `V156_EXCLUSIONS`(`npm run audit:exclusions:v156`, browser 샤드 1) 추가 | 아래 새 검사 |
| `qa:role-split:v140` | `FINDER_TOTAL_152` | 152 = 홈 '전체 데이터 항목' | 공개 집합 = 홈 '전체 데이터 항목' | 검사 이름은 유지 |
| `qa:detail-contract:v153` | 순회 행 | 계약 152행 | 공개 요소의 계약 행 | 제외 행은 `excludedIds`로 보고, 안내 카드는 `exclusions:v156`이 검사 |
| `qa:analysis:v140` | 카드 순회 | 카드 요약 152장 | 카드 요약(공개 142장) | 카드 빌더가 제외 요소 카드를 만들지 않음 |

## 새 검사 — `exclusions:v156`(배포 감사 `release:v136`에 추가)
제외 요소 10건 전수: 결정 파일 = 카탈로그(사유·근거·결정일 일치), 전체 = manifest 프레임워크, 공개 = 전체 − 제외, 데이터 찾기 목록·검색(대조 검색 포함)·카테고리별 건수·홈 카드(조회순·최신순)·홈 수치(전체 데이터 항목·다운로드 가능 항목)·다운로드 목록에서 부재, 다운로드 비공개(`downloadAllowed: false`, manifest 다운로드 가능 수 = 공개 요소 기준), 직접 URL 안내 카드(결정·사유·결정일, 차트·표·다운로드 링크 0).

## 그 밖의 변경(기대값이 아닌 것)
- 단위 테스트 `ResearchPatentAnalysisV144.test.ts`: E-008 카드 검증은 E-008이 제외인 동안 "카드 없음 + 제외 사유·결정일(2026-09-18) 존재"를 확인하고, 다시 공개되면 원래 카드 검증으로 돌아간다(검증 삭제 없음)
- 용어집: `NRI`(Network Readiness Index·네트워크 준비지수) 등록 — E-011 안내 카드 사유에 쓰인 약어. glossary 감사가 안내 페이지 문구도 인벤토리에 넣으면서 드러남
- 게이트 밖 옛 감사(v124–v135의 release·finder-ux·limitations·public-content·public-screens·routes·semantic·visual 등)의 152 기준값은 이번에 바꾸지 않았다(게이트 미포함, 이미 V139 이전 기대값으로 실패하는 감사 포함)

