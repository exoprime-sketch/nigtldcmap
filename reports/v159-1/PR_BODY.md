## 요약
- main CI 빨강(`security:v128` `TRACKED_RAW_SOURCE`)의 원인인 `docs/handoff/v159/datasetTypologyV159.xlsx`를 저장소에서 빼고, 같은 5개 표를 CSV(`docs/handoff/v159/sheets/`)로 전환. 통합문서는 `npm run build:handoff:v159`로 `output/v159/`(git 무시)에 만들어 전달

## 변경
- 생성기 `scripts/v159/build-typology-handoff-v159.mjs`: 시트 5개 CSV 출력 추가, 생성 문서 산출물 표에 CSV 한 줄
- `docs/handoff/v159/README.md` 갱신, `reports/v159-1/REVIEW_V159-1.md`
- 보안 감사 기대값·예외 불변

## 검증
- `security:v128` 13/13(`TRACKED_RAW_SOURCE` 0) · 생성기 `--check` 최신 · 시트 행 수 불변
- 로컬 `finalize:v151` 통과(main `aa8e171` 병합 후 `afd93f0`): release:v136 80/80 · role-split 53/53 · analysis QA 필수 실패 34(기준선 41, 신규 0) · boundary-34 21/22(1 skip) · boundary-policy 24/24

🤖 Generated with [Claude Code](https://claude.com/claude-code)
