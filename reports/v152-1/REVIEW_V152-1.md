# REVIEW V152-1 — CI 감사 브라우저 콜드 스타트 재기동 (fix/ci-chrome-cold-start)

작성 2026-09-24 · 기준 origin/main `325b355` · 계기: PR #28(V152) CI `Static gate` 실패

## 문제
- PR #28의 CI `Static gate`에서 `V136 gate — static group` 14개 명령 중 `LARGE_SOURCE_TABLE`(`node scripts/ci/audit-large-source-table.mjs`)만 실패(run 35940539232, 1차·재실행 2차 동일)
- 오류: `launchHeadlessBrowser` → `DevTools endpoint timeout: fetch failed` — 헤드리스 Chrome이 15초(고정, 배율 미적용) 안에 DevTools 엔드포인트를 열지 않음. 페이지 이동 전, Chrome stderr 없음
- 같은 잡의 타입 검사·단위 테스트 467/467·빌드·데이터 감사는 통과, 이후 브라우저 샤드·요약 게이트는 skip

## 원인 판단
- 러너 이미지 변경: ubuntu-24.04 `20260907.300.1`(2026-09-23 main 성공, 정적 잡 Chrome 152) → `20260920.314.1`(2026-09-24)
- 같은 새 이미지(Chrome 153)에서도 브라우저 샤드·분석 잡은 2026-09-23에 통과 — 그 잡들은 감사 전에 `Resolve Chrome executable` 단계에서 `google-chrome --version`을 먼저 실행함. 정적 잡은 이 단계가 게이트 **뒤**에 있어, `LARGE_SOURCE_TABLE`이 새 VM에서 Chrome을 처음(콜드) 띄우는 명령
- 정적 그룹은 명령을 순서대로 실행(빌드 42.6초 → 데이터 감사 → `LARGE_SOURCE_TABLE` 15.1초에 실패) — 다른 명령과 겹친 부하 아님
- PR #28의 diff는 `scripts/v125`·`scripts/ci`·워크플로를 건드리지 않음 → 코드가 아니라 새 이미지에서 콜드 Chrome의 기동이 15초를 넘은 것으로 판단(최근 CI 실패 9건에서 이 오류는 처음)

## 변경
- `scripts/v125/browser-runtime.mjs` `launchHeadlessBrowser`
  - 엔드포인트 시간 초과면 새 포트·새 프로필로 **1회 재기동**(대기 15초 → 45초, 둘 다 `V125_TIMEOUT_SCALE` 적용 — 기존에는 이 대기만 배율 밖이었음)
  - 시간 초과 외의 오류(실행 파일 없음·소켓 오류 등)는 재기동하지 않고 그대로 실패
  - 실패 메시지에 브라우저 상태 추가: `browser exited: <code>`(충돌) / `browser still starting`(느린 기동) — 다음 실패의 원인 구분용
  - 재현용 `V125_BROWSER_ENDPOINT_MS`(첫 대기 단축). 기본값에서는 동작 불변
- 검사 항목·기대값·감사 스크립트 불변(프로젝트 규칙: 환경성 실패는 예산·재시도를 넣고 기록)
- `CHANGELOG.md`

## 검증
| 항목 | 결과 |
|---|---|
| `node --test scripts/ci/browser-timeout.test.mjs` | 6/6 |
| 재기동 경로(`V125_BROWSER_ENDPOINT_MS=1`로 첫 시도 강제 실패) | 두 번째 기동 성공 773 ms, `Runtime.evaluate` 정상 |
| `audit-large-source-table.mjs` 보통 경로 | B-005·B-006·B-007 PASS |
| `audit-large-source-table.mjs` 강제 재기동 | B-005·B-006·B-007 PASS |
| `finalize:v140` 1회(모든 브라우저 감사가 이 함수로 기동) | **통과**(`GATE_EXIT 0`, 10:22~10:49) — `release:v136` 79/79 · `qa:role-split:v140` 52/52 · `qa:analysis:v140:baseline` 필수 실패 39(기준선 41 이내, 새 실패 0) |
| CI(새 이미지) | push 후 `Static gate` 결과로 확인 |

## 미완료·사유
- 새 이미지에서 Chrome이 실제로 느린 것인지(재기동으로 해결) 아니면 계속 뜨지 못하는 것인지는 CI에서만 판정 가능 — 계속 실패하면 새 오류 메시지의 `browser exited`/`browser still starting`으로 다음 조치(정적 잡에서 Chrome 경로 해석 단계를 게이트 앞으로 옮기기 등)를 정함
- 병합 후 PR #28(V152)은 P7 병합과 함께 main을 합쳐 이 수정을 받음
