## 요약
- 새 GitHub 러너 이미지(ubuntu-24.04 `20260920.314.1`)에서 CI 정적 잡의 첫 헤드리스 Chrome이 15초 안에 DevTools 엔드포인트를 열지 못해 `LARGE_SOURCE_TABLE`이 페이지를 열기도 전에 실패(PR #28에서 2회 재현) → 감사 브라우저 실행 함수가 **1회 재기동**하도록 수정. 검사 항목·기대값 불변

## 원인
- 2026-09-23 main 성공 실행은 이전 이미지 `20260907.300.1`(Chrome 152). 새 이미지(Chrome 153)에서도 브라우저 샤드·분석 잡은 통과했는데, 그 잡들은 감사 전에 `google-chrome --version`을 먼저 실행함. 정적 잡은 그 단계가 게이트 뒤에 있어 `LARGE_SOURCE_TABLE`이 콜드 Chrome을 처음 띄움
- 정적 그룹은 명령을 순서대로 실행하므로 부하 겹침 아님. PR #28 diff는 브라우저 실행 코드·워크플로를 건드리지 않음

## 변경
- `scripts/v125/browser-runtime.mjs` `launchHeadlessBrowser`: 엔드포인트 시간 초과 시 새 포트·프로필로 1회 재기동(대기 15초 → 45초, `V125_TIMEOUT_SCALE` 적용), 그 밖의 오류는 그대로 실패, 실패 메시지에 `browser exited`/`browser still starting` 표기, 재현용 `V125_BROWSER_ENDPOINT_MS`
- `CHANGELOG.md`, `reports/v152-1/REVIEW_V152-1.md`

## 검증
- `node --test scripts/ci/browser-timeout.test.mjs` 6/6
- 재기동 경로(첫 대기 1 ms로 강제 실패) → 두 번째 기동 성공, `audit-large-source-table.mjs` 보통·강제 재기동 모두 B-005·B-006·B-007 PASS
- `finalize:v140` 1회: 통과 — `release:v136` 79/79 · `qa:role-split:v140` 52/52 · `qa:analysis:v140:baseline` 필수 실패 39(기준선 41 이내, 새 실패 0)
- CI(새 이미지)의 `Static gate`가 이 PR의 판정 근거

🤖 Generated with [Claude Code](https://claude.com/claude-code)
