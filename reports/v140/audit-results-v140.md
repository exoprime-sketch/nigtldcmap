# V140 감사 실행 결과 (로컬 production build, 2026-09-16)

| 감사 | 결과 | 비고 |
| --- | --- | --- |
| `qa:role-split:v140` (local-build) | PASS 52/52 | `role-split-qa-v140-local-build.json` |
| `qa:role-split:v140` (production, sha 16b3ada) | FAIL 21/30 | `role-split-qa-v140-production-before.json` — 현 production은 12개 레이어·V139 홈 미반영 트리. 홈 미리보기 자산 없음(SPA shell 응답), 상세 유의사항 미이동, B-017 상세의 지도 미연결 문구 없음. A-002 다운로드(CSV 164,497 B)·정적 자산은 정상. 본 변경 반영 전 상태 기록 |
| `qa:home:v139` | PASS | 카드 8·링크 8·지도엔진 미로드 유지 |
| `test:unit` | 30/30 | |
| `audit:home:v128` | PASS 17/17 | mapLayerCount 42 |
| `audit:map-list-ui:v136` | PASS | 43행·가용 42·분류 머리글 `^N개` 유지 |
| `audit:map-copy:v136` | PASS | 머리글 '개 자료 · 선택' 유지 |
| `audit:map-guide:v135` | PASS 13/13 | |
| `audit:map-access:v135` | PASS | |
| `audit:glossary:v134` | PASS 15/15 | 핵심 수치의 단위(ha·MW)를 용어 도움말로 연결한 뒤 |
| `audit:duplicate-copy:v136` | PASS | |
| `audit:public-text:v136` | PASS | |
| `audit:public-copy:v134` | PASS | |
| `audit:public-controls:v136` | PASS | |
| `audit:screen-usability:v136-4` | PASS | |
| `audit:finder-card:v135` | PASS | |
| `audit:routes:v128` | PASS | |
| `audit:generated-data:v133` | PASS 15/15 | `build:home-preview:v139`로 asset-integrity 재생성 후 |
| `audit:limitations:v127` | FAIL (기존) | v136 gate 밖. A-002 CPIA 시대 기대문구 3건(V139에서 WGI로 교체됨)과 C-001/C-003/C-004 원천 비고 노출 6건 — 본 변경과 무관. 새로 추가한 5개 요소의 유의사항 패널은 비어 있지 않음(EMPTY 0) |
| `audit:launch-polish:v136-1` | FAIL (기존) | v136 gate 밖. `.home-featured-list > button`·레이어 12개 등 V136 구조를 기대하는 감사로 V139 홈 이후 유효하지 않음. 저장된 보고서(2026-09-04 PASS)는 그대로 둠 |
| `audit:finder-ux:v126` | FAIL (기존) | v136 gate 밖. V126 원자료 표 기대(146건)로 V135 이후 대체됨 |
