# V163-T 검사 기대값·판정 변경 사유(2026-10-03)

| 파일 | 전 | 후 | 사유 |
|---|---|---|---|
| `CLAUDE.md` 절대 규칙 merge 조건 | CI `gate`(finalize:v151) 통과 + Preview + 승인 | `Static gate` 녹색 + 바뀐 항목 필터 검사 + 공개 문구 스캔 0 + Preview 캡처 + "PR #N 병합". `PR gate finalize:v151`·Playwright(기준 이미지 4건)는 참고용 | 사용자 지시 2026-10-03 '비필수 검증 제외' |
| `tools/etl/countries/bgd/verify_country_v2.cjs` `COUNTRY_SPECIFIC_NAMES_AS_DELIVERED` | 공개 `sourceOrg` = 입고 `source_org` 그대로 | 입고 값에서 '[기준 원천]'·'[대조]' 표식만 뺀 값과 비교(나머지는 글자 단위 일치 유지) | 공개 문구 정리(내부 순위 표식 비노출, 사용자 지시) — A-029 |
| `scripts/v161/audit-source-notes-v161.mjs` | 출처 메모 계열 12종 | + `internal memo marker`: 내부 메모 대괄호 표식 · '처리규칙' · 'yyyy-mm-dd 확인' | 사용자 지시(공개 문구 스캔 패턴 추가). 기준 강화 |
| `scripts/v157/public-wording-scan-v157.mjs` | 식별자·작업 어휘 | + `memo-marker`(위와 같은 패턴, 제공기관 문장 포함 모든 화면) | 같은 지시. 기준 강화 |

- 기준을 낮춘 변경은 없음
- `REFERENCE_TREE_UNCHANGED`(BGD 검증기)는 베트남 공개 트리에 커밋 전 변경이 있으면 실패 — 이번 베트남 재생성은 의도된 변경이며 커밋 후 통과
