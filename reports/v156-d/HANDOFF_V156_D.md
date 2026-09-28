# 인계 — V156-D 제외 10건 (세션5)

작성: 2026-09-24 · 브랜치 `feat/v156-d-exclusions` (main `e50f55b` 기준) · **작업 중(WIP)**

## 결정 사항

제외 10건 = 사용자 결정 6(C-020·C-023·E-011·E-013·E-016·E-017) + 데이터 명세서 4(A-017·C-015·D-024·E-008). C-021은 제외가 아니라 미입고 상태안내 유지. 공개 요소 152 → **142**.

## 완료한 것

| 항목 | 내용 |
|---|---|
| 결정 파일 | `config/data-publication/vietnam-exclusions-v156.json` — 요소별 `reason`·`basis`·`decidedAt`. 사유·결정일이 비면 ETL이 실패 |
| ETL | 결정 파일을 읽어 `publicStatus: "excluded"`와 `exclusion{reason, basis, decidedAt, measuredStatus, measuredPresence}`를 카탈로그에 기록. `ALLOWED_STATUSES`에 `excluded` 추가. 측정 상태를 함께 남겨 "제공하지 않기로 했다"와 "제공할 것이 없다"를 구분 |
| 타입·라벨 | `VietnamElementPublicStatusV124`에 `excluded`, `VietnamElementExclusionV156` 추가. 라벨 "제공 대상 제외"(`vietnamCountryDataProviderV122`·`vietnamActualV121`) |
| 파사드 | `loadCatalogForCountrySelectionV122(country, { includeExcluded })` — 기본은 제외를 뺀다. 검색 인덱스도 같은 기준으로 필터. 찾기·비교·다운로드·홈이 모두 이 함수를 지난다 |
| 상세 화면 | 제외 요소는 `includeExcluded: true`로 해석해 안내 카드 1개만 표시(`data-testid="detail-excluded-v156"`, 차트·표·다운로드 없음) |
| 문서 | `docs/DATASET_EXCLUSIONS_V156.md`(10건 표·화면별 처리·파일 취급·기대값 변경 사유), 추적표 10행 `제외(V156 제공 대상 제외)` |
| 데이터 | `npm run refresh:data -- --source 베트남데이터/20260922 --adopt "A-002,B-015,B-022,E-001,E-010" --apply` 재실행 완료. 카탈로그 상태 분포: actual 123 · excluded 10 · partial 3 · not-collected 1 · public-authorized 15 = 152 |
| 런북 결함 수정 | `refresh-data-v156.mjs`가 `--adopt`를 스테이징 단계로 전달하지 않아 보류가 무시됐다(B-033에서 중단). 전달·`--help`·문서 수정 |
| 검증 | `npx tsc --noEmit` 0건 · `npm run test:unit` 299/299 PASS |

## 남은 것 — 감사 조정

`npm run finalize:v151`은 `entity-cards:v131`에서 멈춘다. 제외 요소의 상세가 안내 카드만 렌더하므로 상세 라우트를 순회하는 감사들이 깨진다. 개별 실행으로 확인한 결과:

| 감사 | 결과 | 실패 검사 |
|---|---|---|
| `entity-cards:v131` | FAIL | `ENTITY_CARD_ROUTE_COVERAGE` 54 vs 56(제외 요소 2개 라우트가 분석 ready 신호를 내지 않음) |
| `composition:v132` | PASS | — |
| `portfolio-analysis:v132` | FAIL | `PORTFOLIO_LIST_BEFORE_SUMMARY` · `E008_ANALYSIS_B…`(E-008이 제외라 분석 블록 없음) 등 3건 |
| `benchmark-fit:v132` | PASS | — |
| `glossary:v134` | FAIL | `PRODUCTION_DOM_ROUTE_COVERAGE` · `FINDER_ALL_CARDS_AUDITED` 등 6건 |
| `public-copy:v134` 이하 | 미측정 | 배치를 중단했다(세션 전환) |

미측정 후보: `public-copy:v134` · `finder-card:v135` · `temporal-depth:v135` · `detail-hierarchy:v135` · `public-screen:v135` · `finder-scroll:v136` · `generic-detail-public:v136-2` · `screen-usability:v136-4` · `human-review:v136` · `qa:detail-contract:v153` · `qa:analysis:v140:baseline` · `qa:role-split:v140`.

### 권장 방식

1. `scripts/v125/audit-utils.mjs`에 공통 헬퍼를 추가한다(예: `excludedElementIds(document)`·`publicListedElements(document)`). `catalogElements()`는 **152를 그대로 반환해야 한다** — `FRAMEWORK_ELEMENTS`·`ACCOUNTED_ELEMENTS`는 152 유지가 맞다.
2. 상세 라우트를 순회하는 감사는 제외 요소를 건너뛰게 한다(분석 ready 신호가 없는 것이 정상이므로).
3. 공개 목록을 세는 기대값만 142 기준으로 바꾼다. 확인된 대상: `FINDER_AUTO_LOAD_SEQUENCE`(24·48·72·96·120·144·152 → 24·48·72·96·120·142) · `FINDER_HUMAN_REVIEW_COUNT` 152→142 · `DETAIL_HUMAN_REVIEW_COUNT` 152→142. `PUBLIC_ROUTE_COUNT >= 157`은 상세 라우트가 살아 있으므로 그대로일 것으로 보이나 실측 필요.
4. 기대값을 바꾼 검사는 사유를 `docs/DATASET_EXCLUSIONS_V156.md` 마지막 절과 그 라운드 REVIEW에 적는다(판정 규칙은 바꾸지 않는다).
5. 제외 요소는 지도 대상이 아니므로 지도 감사는 영향이 없을 것으로 보인다(실측 권장).

## 주의

- `public/data/vietnam/v2`의 팩·다운로드 파일은 **삭제하지 않았다**. 결정이 바뀌면 결정 파일에서 줄을 지우고 `refresh:data … --apply`만 다시 돌리면 복귀한다.
- 이 브랜치의 데이터는 PR #31(값만 바뀐 5개 적용) 위에 제외 결정만 얹은 상태다. 입고분 채택 범위를 다시 바꾸지 말 것.
- `reports/` 아래 감사 산출물 변경은 커밋 대상이 아니다(churn).
