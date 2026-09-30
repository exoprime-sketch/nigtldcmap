## 요약
`npm run import:spec:v159`로 다시 적재하면 활용 사례의 데이터 매핑(useCasesV159.json `dataUsed[].mapped`)이 전부 unmapped(0/521)로 바뀌던 결함을 고쳤습니다. 매핑이 줄면 아무 파일도 쓰지 않고 멈추는 가드를 넣었습니다.

## 원인
- 매핑 판정에 쓰는 지표 ID 목록을 `public/data/vietnam/v2/downloads/*.json`에서 읽고 있었습니다.
- #48(요소별 다운로드 사전 압축)에서 이 파일들이 `<id>.zip`(안에 `<id>.json`·`<id>.csv`)으로 바뀌었습니다. 그 뒤로 읽히는 JSON이 없어 지표 목록이 비었고, 모든 매핑이 unmapped가 됐습니다.
- 같은 목록을 쓰는 유형표의 시나리오 판별도 이 목록을 읽습니다. 수정 후 재적재에서 `scenario` 변화는 0입니다.

## 수정
- `catalogIndicators()`가 다운로드 ZIP 안의 `<id>.json`을 V158 ZIP 리더(`scripts/v158/download-zip-v158.mjs`)로 읽습니다. #48 이전 형식의 `.json`도 계속 읽습니다.
- 지표 ID가 하나도 없으면 오류로 멈춥니다.
- **가드**: 커밋된 useCasesV159.json에서 매핑(exact·prefix)이 있던 항목이 하나라도 빠지거나 매핑 수가 줄면, 빠진 매핑(요소·사례 번호·지표 ID)을 전부 출력하고 exit 1로 멈춥니다. 이때 아무 파일도 쓰지 않습니다. `--check`에도 똑같이 적용됩니다.
- **국가 목록**: 재적재 중 두 번째 원인이 나왔습니다.
  - #50에서 `public/data/bgd/v2`가 생기면서, 폴더를 훑어 만들던 국가 목록에 BGD가 들어갔습니다.
  - 그 결과 주의 문구 약 40건의 '일부 나라'가 '방글라데시'로 바뀌고, `registryCountries`에 BGD가 추가되고 있었습니다.
  - 이제 국가 목록은 `public/data/countries.json`에서 `status: "live"`인 나라(현재 VNM)만 읽습니다. 모든 나라 화면이 함께 쓰는 공통 필드에 공개 전 국가명이 들어가지 않습니다.

## 검증
| 항목 | 결과 |
|---|---|
| 재적재 매핑 | **492/521**(exact 483 · prefix 9, 커밋본과 같음) · unmapped 29 · label-only 83 |
| useCasesV159.json diff | **0줄**(매핑 동일, 주의 문구 '일부 나라' 유지, registryCountries 유지) |
| 가드 모의 시험(지표 목록을 가짜 1개로 바꾼 복사본) | exit 1, `use-case data mappings dropped: 492 -> 0 (nothing written)`, 빠진 매핑 492줄 출력, 작업 트리 변경 0 |
| 지표 목록 비교 | #48 직전 다운로드 JSON의 지표 ID 7,066개 = ZIP에서 읽은 지표 ID 7,066개(차집합 0) |

## 이 PR에 넣지 않은 재적재 차이(보고만)
재적재하면 useCases 밖의 파일도 바뀝니다. 이번 결함과 관계없는 이전 변경이 쌓인 것이라 되돌렸습니다. 반영할지는 따로 결정이 필요합니다.
- `datasetTypologyV159.json`: `geometry`가 21개 요소는 false → true, 3개 요소는 true → false로 바뀝니다. `reports/v159/spec-import-v159.json`의 geometry도 42 → 60으로 바뀝니다. #47에서 지도 활성 레이어가 60개로 늘어난 결과입니다.
- `reports/v159/short-definition-card-review.md`: A-025 한 줄(규칙 no-org-name → no-subject). 원자료 문구가 바뀐 결과입니다.
- `docs/handoff/v159/SPEC_TEXT_CORRECTIONS.md`: A-028 두 줄(바꿀 문구 칸의 공백·'(삭제)' 표기).
- 위 차이 때문에 `import-dataset-spec-v159.mjs --check`는 main에서도 stale로 실패합니다. 이 명령은 게이트·CI에서 쓰이지 않습니다.

## 화면 변화
**화면 변화 0**. 스크립트만 바뀌었고, 앱이 읽는 데이터 파일은 바뀌지 않았습니다.

## Preview
PREVIEW_URL

병합은 검토 후 "PR 병합" 지시가 있을 때만.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01V68y43MvVho6XhCXbfyvLp
