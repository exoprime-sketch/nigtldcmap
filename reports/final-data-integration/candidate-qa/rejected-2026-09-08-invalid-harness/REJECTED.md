# INVALID_HARNESS_RESULT — 채택하지 않음 (보존용)

이 폴더의 `detail-coverage-*.json/csv` 는 **제품 결함 집계가 아니다.**
수집기 자체 결함으로 생성된 값이므로 결함 수로 세지 않는다. 삭제하지 않고 보존한다.

## 원인 (코드 확인)

`scripts/qa-candidate-screens-v137.mjs` (SHA `8c9a8ec`) 의 `READ_SCREEN` 은
`const body = t(main).slice(0, 4000);` 를 계산하지만 **`return {}` 에 `body` 를 넣지 않았다.**
반환값에는 `bodyLength` 만 있었다.

그 결과:

| 관측된 수치 | 실제 원인 |
|---|---|
| `NO_EFFECT` 98 | `before = screen.body` → `undefined`, `after.body !== before` → `undefined !== undefined` → 항상 `false`. **선택 변경이 무시된 증거가 아니다.** |
| `화면 오류` 26 | `screen.body.includes(...)` 가 `undefined` 에서 `TypeError`. 앱 오류가 아니라 수집기 예외. |
| `INCOMPLETE` 다수 | 위 두 가지의 파생 결과. |

## 정정하는 이전 진단

Stage 3 보고에서 `NO_EFFECT 98` 을 **"React가 selectedIndex 직접 대입을 무시한다"** 로 설명했다.
**이 진단은 근거가 없었다.** 당시 비교값이 양쪽 모두 `undefined` 였으므로
React의 동작을 시험한 적이 자체가 없다. native setter 로 고친 뒤에도 수치가 그대로였던 것도
같은 이유(비교가 여전히 undefined 대 undefined)였고, React 결함의 증거로 인용해서는 안 된다.

`body` 를 반환에 넣으려던 수정이 문자열 불일치로 조용히 적용되지 않았고(어서션 없음),
소비하는 쪽 코드만 적용된 것이 직접적인 경위다.

## 대체

교체 runId 는 `reports/final-data-integration/candidate-qa/runs/` 아래에 기록한다.
