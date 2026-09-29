# REVIEW — e2e 기존 실패 fix-forward: 상세 테스트가 '자료 출처·상세 데이터' 층을 펼친 뒤 읽기

브랜치 `fix/e2e-open-source-layer` (origin/main 26df689에서 분기). 2026-09-29. **화면 변화 0**(테스트만 수정, 앱 코드 변경 0).

## 원인
- V160(#34)부터 상세의 출처 패널이 접힌 3층 `<details data-testid="detail-layer-v160">`('자료 출처·상세 데이터') 안에 있다. 닫힌 `<details>`는 자식을 DOM에 두지만 `innerText`는 ""이라, `e2e/detail-all.spec.ts`의 '상세 로드' 테스트가 안쪽 '자료정보·이용조건'만 펼치고 '제공기관'을 찾다 공개 요소 전부에서 실패했다(44행).

## 수정
- `e2e/detail-all.spec.ts`: 출처 패널이 든 `detail-layer-v160`을 먼저 펼친 뒤 '자료정보·이용조건'을 펼쳐 읽는다.
- 미입고(C-023·E-011·E-013 — `src/data/finderSortV160.ts`와 같은 상태 3종 `not-collected`·`data-entry-planned`·`schema-only`)는 V156-E 결정대로 자료기간 줄이 없음을 기대한다. 나머지 공개 요소는 그대로 '제공기관'·'자료기간'을 요구한다.
- `e2e/helpers.ts`: `candidatePreparingElementIds` 추가, `CandidateCatalogRow.exclusion` 타입에 `basis`·`publicNotice`(#43에서 쓰기 시작한 필드) 추가.

## E2E 실패 수 before / after
| 기준 | before | after |
|---|---|---|
| CI 'Playwright against the candidate build' | main 147 · #43 마지막 실행 151(= 146 상세 로드 + 화면 기준 이미지 4 + 지도 1) | **7 실패 · 207 통과**(PR #45 CI) — 상세 로드 2(A-002·A-019) + 화면 기준 이미지 4(home·finder·detail-a016·detail-d011) + 지도 1(B-031) |
| 로컬 후보 빌드(같은 명령 `npx playwright test`) | 상세 로드 146 실패(수정 전 필터 실행) | 전체 **4 실패 · 210 통과** |

로컬 after 4건
- A-002·A-019 상세 로드: 출처 검사를 통과한 뒤 '첫 선택 상자를 바꿔도 1층 글자 변화 없음'에서 실패. 연도 선택이 V160의 접힌 '추가 차트'(2층)에만 반영되는 것으로 보임(A-002는 '추가 차트'를 펼치면 변화 확인). 3회 반복 모두 실패 — 출처 층과 다른 원인이라 이번 범위 밖, 수정 전에는 44행에서 먼저 멈춰 가려져 있던 실패.
- `map.spec.ts` B-031 폴리곤 클릭·`visual.spec.ts` detail-a016 기준 이미지: CI main에서도 실패하는 기존 항목(CI에서는 기준 이미지 4건이 실패, 로컬에서는 1건).

## 검증
- 로컬 후보 빌드 `node scripts/v137/build-candidate-v137.mjs --data public/data/vietnam/v2` → `npx playwright test`: 4 실패 · 210 통과(2.5분).
- 앱 코드·데이터·게이트 스크립트 변경 0 — tsc·unit·finalize 대상 아님.
