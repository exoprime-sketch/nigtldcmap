# REVIEW V152-2 — 분석 QA 지도 기호 검사 대기 예산 (fix/analysis-qa-keyboard-wait)

작성 2026-09-24 · 기준 origin/main `1501eb6` · 계기: 새 러너 이미지에서 `V140 card and detail analysis gates` 간헐 실패

## 문제
- `qa:analysis:v140:baseline`에서 새 실패 `B-031:mapSymbolVerified` — "map symbol: no keyboard feature to select"
- 2026-09-24 새 러너 이미지(ubuntu-24.04 `20260920.314.1`)에서 분석 잡 5회 중 2회 발생: PR #29 1차(run 35944629825), PR #28 1차(run 35952025784). 두 번 모두 재실행에서 통과(필수 실패 39 ≤ 41, 새 실패 0), main(`1501eb6`)은 통과
- PR #29는 이 PR과 관계없는 코드(`scripts/v125/browser-runtime.mjs`만 변경)에서도 같은 실패 → 화면 코드가 아니라 검사의 타이밍 문제

## 원인
- `scripts/v140/analysis-qa-v140.mjs` `mapSymbolSemanticsOf`가 레이어 행이 `drawn`·`checked`·`primary`로 3회 연속 읽힌 직후 `[data-testid="map-keyboard-feature-select"]`를 `page.$`로 **한 번만** 조회
- 키보드 탐색 목록은 그려진 피처를 조회할 수 있게 된 뒤 만들어지므로, 느린 러너에서는 레이어 행 상태보다 조금 늦게 생김 → 조회 시점에 버튼이 없으면 곧바로 실패
- B-031은 성·시 단계구분도(63개 면)로, 지도 아이콘·미니맵 변경(PR #28)의 대상이 아님

## 변경
- `mapSymbolSemanticsOf`: 버튼을 `waitForSelector(state: attached, 15초)`로 기다린 뒤 같은 검사(클릭 → 선택 패널 → 값·단위·시점·출처·공간 문구). 버튼이 이미 있으면 기존과 동일하게 즉시 진행
- 판정 기준·기대값·기준선(`reports/v150/analysis-qa-baseline-v150.json`)은 변경하지 않음(프로젝트 규칙: 환경성 실패는 예산을 넣고 기록)
- `CHANGELOG.md`

## 검증
| 항목 | 결과 |
|---|---|
| `node --check` | 통과 |
| `analysis-qa-v140.mjs --only B-031,A-023,B-021,C-019,D-018,A-024` | 지도 기호 검사 5개 모두 `sym=true`(B-031 포함). C-019는 기준선에 있는 `page.selectOption` 시간 초과 |
| `finalize:v140`(2회) | 1차(13:12) FAIL — `generic-detail-public:v136-2`가 D-012에서 로컬 소켓 오류 `net::ERR_NO_BUFFER_SPACE`로 `catalog.json`을 받지 못해 117/152 경로에서 중단(같은 PC에서 다른 세션의 감사가 동시에 돌던 때의 환경 문제, 이 PR의 변경 파일과 무관). 해당 감사 단독 재실행 20/20·152경로 PASS 확인 후 2차(13:32) **통과**(`GATE_EXIT 0`) — `release:v136` 79/79 · `qa:role-split:v140` 52/52 · `qa:analysis:v140:baseline` 필수 실패 39(기준선 41 이내, 새 실패 0), B-031 `sym=true` |
| CI(새 이미지) | push 후 `V140 card and detail analysis gates` 결과로 확인 |

## 미완료·사유
- 같은 잡의 C-002·C-019 `page.selectOption: Timeout 30000ms`는 기준선 41건에 이미 있는 항목(PR-D 이관분)이라 이 PR 범위 밖
