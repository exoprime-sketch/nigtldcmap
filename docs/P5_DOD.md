# P5 완료 정의(DoD) — 증빙 매핑

작성: 2026-09-30(chore/p5-prep). 마스터 인계서 5.9(2026-09-30 확정) 8개 항목 기준.
실행은 V162·P8-2·PR-D 병합 후.

범례: **자동** = `run-p5.mjs`(`reports/p5/P5_RESULT.md`) 또는 `build-tracker-p5.mjs`
(`reports/p5/tracker-preview.md`)의 산출물로 그대로 증빙됨. **부분** = 두 스크립트가
관련 숫자는 내지만 항목의 일부만 덮음(나머지는 별도 확인 필요). **수동/미자동화** =
지금은 이 두 스크립트가 만들지 않음 — P5 실행 전에 무엇으로 확인할지 정해야 한다
(있는 그대로 표시했다, 없는 걸 있다고 하지 않는다).

## 1) 데이터

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| VNM 공개 146(전체 152 - 제외 6) | **자동** | `reports/p5/tracker-preview.md` "## 집계" → "VNM 공개: N(전체 152 - 제외 M)". 지금 main 기준 실측 **146(제외 6)** — 이미 참. |
| 데이터 준비 중 = C-023·E-013(V162 반영 후) | **자동** | 같은 줄의 "그중 데이터 준비 중: N(목록)". 지금은 0건(V162 미병합) — V162 병합 후 재실행해 C-023·E-013만 나오는지 확인 |
| 2026년 제외 6 목록 비노출·상세 안내 1줄 | **부분** | 비노출 여부는 `run-p5.mjs` (5) finalize:v151 → `finalize:v136` 내 `V156_EXCLUSIONS`(`npm run audit:exclusions:v156`) 통과 여부. 상세 안내 "1줄"의 문구 자체는 이 검사가 개수만 보고 문구를 안 보므로 별도 스크린샷 확인 |
| BGD 공개 수 = catalog 실측 | **자동** | `reports/p5/tracker-preview.md` "## 집계" → "BGD 공개: N". 지금 main 기준 실측 **146(제외 6)** |
| 미입고 = '데이터 준비 중' 표기 | **자동** | 트래커 표의 BGD 열이 `미입고`로 시작하는 칸 수 = "그중 데이터 준비 중" 값(지금 **33건**). 표기 문구 자체(스크린샷)는 별도 |
| 홈 데이터 기준일 = 입고일 2026.09.30(양국) | **수동/미자동화** | catalog.json에 요소별 `latestYear`는 있으나 "입고일" 단일값은 없음(`dataset-directory.json`의 `generatedAt`이 가장 가까움). 홈 화면의 실제 표시 문구는 e2e/스크린샷으로 확인 필요 — `run-p5.mjs`에 없음 |

## 2) 상세

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| 양국 공개 요소 1순위 계약 일치 | **자동** | `run-p5.mjs` (5) finalize:v151 → `qa:role-split:v140`/`qa:analysis:v140:baseline` 요약 줄. BGD는 (2) `qa:acceptance --country VNM,BGD`가 같은 판정을 BGD에도 수행(병합 후) |
| 레코드 ID·파일명·내부 메모 노출 0 | **자동** | `run-p5.mjs` (5) finalize:v151 → `finalize:v136` 내 `audit:public-text:v136`의 `internalPublicTokenCount`(release-audit-v136 요약의 필드) = 0 |
| 다른 나라 표현 0(교차 국가 문구) | **수동/미자동화** | 기존 감사 중 이 항목 전용 검사가 없다(V158 다국 지원 이후 새로 생긴 요구). `run-p5.mjs`에 신규 단계로 추가하거나, `scripts/v157/public-wording-scan-v157.mjs`를 다국 버전으로 확장해야 함 — 지금은 없음, 있다고 표시하지 않음 |

## 3) 지도

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| VNM 72 표출·준비 중 0 | **자동** | `reports/p5/tracker-preview.md` "## 집계" → "VNM 지도 표출(활성 레이어): N". 지금 **60**(P8-2 병합 전 — 목표 72는 병합 후) |
| 전 레이어 렌더·클릭 | **부분** | `qa:map:v138`(`node scripts/v138/map-runtime-qa-v138.mjs`)이 렌더·클릭을 검사하지만 `run-p5.mjs`의 6단계에는 없다(빠짐 — 아래 §비고) |
| BGD 지도 대상 = 판정표 실측 | **자동** | 트래커의 BGD "지도○" 집계 vs BGD용 1-pager 판정표(있다면) 대조. 지금 BGD map-index 활성 0(status: preparing이라 정상) |
| BGD 렌더·클릭 | **부분** | VNM과 같은 한계 — `qa:map:v138`이 BGD를 지원하면(`--country BGD`) 같은 자리에서 확인, 없으면 신규 |

## 4) 찾기·홈

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| 가나다순(기본)·조회순 정렬 | **수동/미자동화** | 이 정렬 규칙을 검사하던 `scripts/v160/qa-core-first-v160.mjs`의 찾기(R-10) 절은 `finalize:v151`에도 `run-p5.mjs`에도 없다. e2e에도 찾기 정렬 테스트가 없다(확인함) — 신규 필요 |
| '핵심' 표현 0 | **수동/미자동화** | `scripts/v157/scan-core-word-v157.mjs`(지도)·`scripts/v157/public-wording-scan-v157.mjs`(지도 목록·패널·상세)가 저장소에 있지만 `run-p5.mjs`가 부르지 않는다. P5 실행 전 이 두 스크립트를 (2)와 (5) 사이 단계로 추가하거나 수동 실행 |
| 홈 수치 = catalog·map-index 실측 | **자동** | `reports/p5/tracker-preview.md`의 "## 집계"(공개·지도 표출 수)가 홈이 보여줄 수와 같은 소스(catalog·map-index)에서 나온다 — 숫자가 같은지는 홈 화면 스크린샷과 대조 |

## 5) 반응형

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| 320·390·768·1024·1440·1920px 가로 넘침 0(양국) | **부분** | `run-p5.mjs` (4) e2e 전체가 `e2e/responsive.spec.ts`를 포함(존재 확인함)하므로 VNM은 그 안에서 판정. BGD가 `status: preparing`인 동안은 이 스펙이 국가 전환을 하지 않으면 BGD 몫이 빠질 수 있음 — `e2e/responsive.spec.ts`가 국가별로 도는지 확인 필요 |

## 6) 게이트

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| `finalize:v151` 통과(`qa:acceptance` 포함, expect 플래그 0) | **자동** | `reports/p5/P5_RESULT.md` 표의 "(5) finalize:v151" 행 = 통과, "(2) qa:acceptance" 행 = 통과(건너뜀이 아니라). "expect 플래그 0"은 각 놈의 요약 줄에서 `expect`/`todo`/`skip` 표시가 있는 테스트가 0인지(playwright 결과 JSON) — `run-p5.mjs`가 e2e 결과 JSON을 아직 파싱하지 않으므로 "마지막 출력" 블록을 직접 읽어야 함(부분 자동) |
| main CI 녹색 | **수동** | `run-p5.mjs`는 로컬 실행만 한다. `gh pr checks`/`gh run list --branch main`으로 별도 확인 |
| e2e 신규 실패 0(기준 이미지 4개 재생성 후) | **자동** | `reports/p5/P5_RESULT.md` 표의 "(3) e2e 기준 이미지 갱신(4개)" = 통과 → 뒤이은 "(4) e2e 전체" = 통과(신규 실패가 있었다면 (4)가 실패로 나온다) |

## 7) 운영

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| 배포 후 `smoke:production:v128` 통과 | **자동** | `reports/p5/P5_RESULT.md` 표의 "(6) smoke:production:v128" 행 = 통과(PRODUCTION_URL 설정 후 재실행 전까지는 "건너뜀") |
| 운영에서 VNM·BGD 선택 확인 | **부분** | `smoke-vietnam-production-v128.mjs`는 이름 그대로 VNM 전용이다. BGD 선택 확인은 스모크 스크립트가 국가 인자를 받도록 확장하거나 수동으로 `?country=BGD`를 열어 확인해야 함 — 지금은 VNM 몫만 자동 |

## 8) 문서

| 판정 기준 | 자동성 | 증빙 |
| --- | --- | --- |
| 추적표 VNM·BGD 열 자동 생성 | **자동** | `reports/p5/tracker-preview.md` 그 자체(152행, VNM·BGD 열 채움 확인 완료). 실제 트래커 파일 반영은 `node scripts/p5/build-tracker-p5.mjs --write-tracker` |
| 저장소 유형 명세 = 용역사 배정표 v1.2 수치 일치 | **자동** | `datasetTypologyV159.json`이 곧 배정표 v1.2의 원천(`docs/plan/V159_데이터유형화_명세.md` §4에서 생성, P8-2 typology 갱신 커밋에서 이미 확인 — `datasetTypologyV159.test.ts` 11/11). 트래커의 "유형(S/U)" 열이 그 파일에서 그대로 읽히므로 두 문서가 구조적으로 같은 소스다 |

## 비고 — 이번 매핑에서 드러난 빈틈(참고용)

`run-p5.mjs`의 지금 6단계는 **finalize:v151·e2e·build·qa:acceptance·smoke**만 돈다.
위 매핑에서 "수동/미자동화"로 나온 5건(다른 나라 표현 · 가나다순 정렬 · '핵심' 표현 ·
홈 데이터 기준일 · 운영 BGD 선택)은 전부 새 검사이거나 기존 스크립트를 아직
`run-p5.mjs`가 부르지 않는 경우다. 이번 PR은 **1:1 매핑까지만** 하라는 지시였으므로
`run-p5.mjs`에 새 단계를 추가하지 않았다 — 필요하면 후속으로 반영한다.
