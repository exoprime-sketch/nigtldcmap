# REVIEW V159-1 — 인계 통합문서(xlsx) 저장소 제거 · CSV 전환 (fix/v159-handoff-xlsx)

작성 2026-09-28 · 기준 origin/main `2690675`(#32) · 계기: main CI 정적 잡 `security:v128` `TRACKED_RAW_SOURCE` 실패

## 문제
- #32가 `docs/handoff/v159/datasetTypologyV159.xlsx`(용역사 인계 통합문서)를 커밋 → 보안 감사가 추적된 `.xlsx`를 원자료로 판정해 main CI 정적 잡 실패, 브라우저 샤드·분석 게이트는 실행되지 않음
- 생성기(`scripts/v159/build-typology-handoff-v159.mjs`)는 원래 이 파일을 git 무시 경로 `output/v159/`에 쓰도록 되어 있었고, 저장소 사본은 수동 복사본

## 변경
- `docs/handoff/v159/datasetTypologyV159.xlsx` 삭제(추적 해제)
- 생성기가 같은 5개 시트를 CSV로도 출력(`output/v159/sheets/1~5-*.csv`) → 저장소 사본 `docs/handoff/v159/sheets/`(표출유형 정의 7행 · 구조 스키마 41행 · 152 배정표 152행 · 명칭 분리표 152행 · 사례 통계 155행)
- 같은 표는 이미 `docs/DATA_TYPOLOGY_V159.md`에 Markdown으로 있음 — 산출물 표에 CSV 사본 한 줄 추가(생성기로 재생성)
- `docs/handoff/v159/README.md`: CSV 목록과 통합문서 전달 방법(`npm run build:handoff:v159` → `output/v159/`)
- 보안 감사 기대값·예외 목록은 바꾸지 않음

## 검증
| 항목 | 결과 |
|---|---|
| `audit-vietnam-security-v128.mjs` | 13/13, `TRACKED_RAW_SOURCE` 0건 |
| `build-typology-handoff-v159.mjs --check` | 생성 문서 최신 |
| 생성기 재실행 | 시트 행 수 동일(7·41·152·152·155), 생성 문서 내용 변화는 CSV 행 1줄뿐 |

## 게이트(로컬 finalize:v151)
- 기준: `afd93f0` = main `aa8e171`(#36 제외 10건 + #33 다국가 골격 포함) + 이 PR. 1회차는 #33 병합 전 기준이라 중단하고 최신 main을 병합해 다시 실행(판정 전 중단, 실패 아님)
- 결과 **통과**: release:v136 80/80 · role-split 53/53 · analysis QA 필수 실패 34(기준선 41, 신규 0) · boundary-34 21/22(1 skip) · boundary-policy 24/24
- `security:v128` 13/13(`TRACKED_RAW_SOURCE` 0) — main CI 정적 잡 실패 원인 해소
