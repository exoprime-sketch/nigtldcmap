# 패널 리사이저 포인터 입력 결정화 — PR #19 CI 실패 원인과 수정

## 1. 실패
- PR #19 1차 CI(Linux, headless Chrome) `audit:map-access:v135` → `LEFT_PANEL_POINTER_RESIZE_PASS` false.
  - 감사 절차(`scripts/audit-vietnam-map-access-v135.mjs:109-123`): `localStorage.clear()` → 지도 재진입 → 분리자 존재 대기(100 ms 폴링) → 레이아웃 읽기 → **CDP `Input.dispatchMouseEvent` mousePressed → mouseMoved(+145 px) → mouseReleased**(연속 3회, 사이 대기 없음) → 180 ms 대기 → 레이아웃 읽기 → 재진입 후 저장값 확인.
  - 기대: 왼쪽 ≥ 420 px, 이전보다 +80 px 초과, 지도 폭 −70 px 초과, 재진입 후 ±3 px 유지.
  - 실측(CI): 왼쪽 320 → **120**, 오른쪽 360 → **120**, 저장값 120/120.
- 로컬(Windows): 같은 감사 10/10, CPU ×6 스로틀 3/3 통과 → 기계 속도에 따라 드러나는 경쟁 조건.

## 2. 원인(V150 훅 `useResizableMapPanelsV129.ts`)
1. `pointermove`/`pointerup` 리스너를 `isResizing` 상태에 대한 `useEffect`로 붙였다. 브라우저는 CDP mouse 입력에서 pointer 이벤트를 파생시키므로 경로 자체는 맞지만, React가 효과를 커밋하기 전에 도착한 move는 **유실**된다(폭 불변).
2. `setWidth`가 상태 `layoutWidth`로 clamp한다. 첫 `ResizeObserver` 측정 전(또는 노드가 숨겨진 동안) 값이 0이면 `fitMapPanelsV150(0, …)`이 **양쪽을 최소 120 px로 접고 localStorage에 기록**한다 — CI 실측과 일치.
3. 그 밖에 rAF/디바운스는 없었다(폭 갱신은 이벤트 안에서 동기 setState).

## 3. 수정
- `onPointerDown`에서 window 리스너를 **동기적으로** 붙이고(`attach`), `pointerup`/`pointercancel`/`blur`에서 떼어낸다. 최신 `setWidth`는 ref로 참조.
- clamp 기준 폭은 `layoutRef.current.getBoundingClientRect().width`를 **동기 측정**하고, 0이면 상태값, 그것도 0이면 `window.innerWidth`.
- `setPointerCapture`는 합성 포인터에서 예외를 낼 수 있어 try/catch. `ResizeObserver`가 없는 환경(jsdom·구형)은 resize 이벤트만 사용.
- 감사 스크립트의 기대값·검사 항목은 바꾸지 않았다.

## 4. 재현·검증
- 결정적 재현: `src/hooks/useResizableMapPanelsV129.test.tsx` — jsdom(모든 rect 폭 0)에서 pointerdown 직후 같은 태스크에 move·up을 보낸다.
  - main(2d8d7ee) 훅: 3/3 실패 — 커밋 전 move 유실(465 기대 → 320), 폭 0 clamp(420 기대 → **120**: CI와 같은 값).
  - 수정 훅: 3/3 통과. 전체 `test:unit` 214/214.
- 반복 실행(`scripts/v150/map-access-flake-v150.mjs` → `reports/v150/map-access-flake-v150.json`, 같은 러너·`--headless=new`·감사 뷰포트 1920×1100):
  - baseline(main 훅): 10/10, CPU ×6 3/3 — Windows에서는 재현되지 않음(기록).
  - fixed: 10/10(320 → 465 → 재진입 465), CPU ×6 3/3 — 로컬 기준. Linux 재현은 CI 결과로 판정
- CI(Linux) 결과: PR #19 3차 push 후 `V136 blocking release gate` 잡 결과로 갱신(아래 PR 보고 참조)

## 5. PR-A 게이트 실행 이력에서 재시도로만 통과한 항목(사용자 요청 #4)
| 실행 | 결과 | 처리 |
|---|---|---|
| finalize:v136 1차 | `entity-cards` 실패 | 감사 인식 수정(코드 변경) |
| finalize:v136 2차 | `ci-command-timings.json` 쓰기 `UNKNOWN`(Windows 파일 잠금)으로 중단 | **환경 오류**. 5차에도 재발 → 쓰기 재시도 로직 추가(코드 변경) |
| finalize:v136 3차 | `map-tooltip` 실패 | 감사 훅 위치 수정(코드 변경) |
| 개별 감사 25개 | `oda`·`finder-card`·`duplicate-copy`·`finder-scroll` 실패 | 화면 문구·감사 파서 수정(코드 변경) |
| finalize:v136 5차 | timings 쓰기 `UNKNOWN`으로 중단 | 위와 동일(환경) |
| finalize:v136 6차 | 79/79 PASS | — |
| `qa:role-split:v140` 2차 | `SECTION_FINDER_RUNTIME` — 스크린샷 png 쓰기 `UNKNOWN` | **재실행으로 통과(52/52)** — 브라우저 판정이 아니라 파일 쓰기 오류. 코드 변경 없음 |
| `qa:analysis:v140` | C-002·C-019 `selectOption` 시간 초과 | 재현됨, 재시도로 넘기지 않고 41건에 포함(PR-D) |
| e2e 214 | 1차 실패 8개 | spec·baseline 갱신(코드 변경), 재실행 214/214 |
- 결론: 브라우저 판정이 재시도만으로 뒤집힌 사례는 없다. 재시도로 지나간 것은 Windows 파일 쓰기 `UNKNOWN` 3건(gate 2회, role-split 1회)이며, gate 쪽은 재시도 코드로 완화했고 role-split 쪽 스크린샷 쓰기는 미완화(환경 이슈로 기록).
