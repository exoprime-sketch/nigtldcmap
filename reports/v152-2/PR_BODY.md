## 요약
- 분석 QA의 지도 기호 검사(`mapSymbolVerified`)가 키보드 선택 버튼을 **기다리지 않고 한 번만** 찾아, 새 러너 이미지에서 B-031이 간헐적으로 실패하던 문제(2026-09-24 분석 잡 5회 중 2회, 재실행 시 통과) → 버튼을 최대 15초 기다린 뒤 같은 검사. 판정 기준·기대값·기준선 불변

## 원인
- `mapSymbolSemanticsOf`가 레이어 행이 drawn으로 읽힌 직후 `page.$`로 1회 조회. 키보드 탐색 목록은 그려진 피처를 조회할 수 있게 된 뒤 생겨 느린 러너에서는 그보다 늦음
- PR #29(브라우저 실행 함수만 변경)에서도 같은 실패 → 화면 코드가 아니라 검사 타이밍. B-031은 성·시 단계구분도라 지도 아이콘 변경(PR #28) 대상 아님

## 변경
- `scripts/v140/analysis-qa-v140.mjs` `mapSymbolSemanticsOf`: `waitForSelector(attached, 15초)` 후 기존 검사 그대로
- `CHANGELOG.md`, `reports/v152-2/REVIEW_V152-2.md`

## 검증
- `--only B-031,A-023,B-021,C-019,D-018,A-024`: 지도 기호 검사 전부 `sym=true`(C-019는 기준선에 있는 selectOption 시간 초과)
- `finalize:v140`: 2차 통과 — `release:v136` 79/79 · `qa:role-split:v140` 52/52 · `qa:analysis:v140:baseline` 필수 실패 39(기준선 41 이내, 새 실패 0). 1차는 로컬 소켓 오류(`ERR_NO_BUFFER_SPACE`)로 상세 감사가 중단 — 단독 재실행 PASS 확인 후 재실행
- CI(새 이미지)의 `V140 card and detail analysis gates`가 이 PR의 판정 근거

🤖 Generated with [Claude Code](https://claude.com/claude-code)
