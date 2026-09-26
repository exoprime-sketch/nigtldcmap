## 요약
- 제외 10건(사용자 0923: C-020·C-023·E-011·E-013·E-016·E-017 / 명세서 0918: A-017·C-015·D-024·E-008)을 목록·검색·카테고리 건수·홈 카드·홈 수치·다운로드에서 내리고, 직접 URL은 안내 카드(결정·사유·결정일) 1개만. **공개 142**, 프레임워크 152 유지, C-021 미입고 안내 유지
- 감사·QA의 152는 카탈로그에서 파생(공개 = `publicStatus ∉ {excluded, not-provided}`), 배포 감사에 제외 10건 전수 검사 `exclusions:v156` 추가
- main의 entity-cards 실패(D-024·E-008, #32 템플릿)도 이 PR로 해소 — 병합 후 18/18

## 변경
- 결정 파일 사유·결정일 보정, ETL 제외 요소 `downloadAllowed: false`·manifest 다운로드 가능 수 공개 기준(141), 카드 요약 제외(142장), 데이터 재생성
- 상세 제외 안내 카드(결정·사유·결정일), 홈 '전체 데이터 항목' 142, 파사드 `not-provided` 포함
- 감사 헬퍼 `scripts/v156/exclusions-audit-v156.mjs`, 감사·QA 17개와 배포 감사 본체 기대값 파생, entity-cards·portfolio·glossary에 안내 카드 검사
- 기록: `reports/v156/EXPECTATION_CHANGES_V156D.md`, `docs/DATASET_EXCLUSIONS_V156.md`, `reports/v156-d/REVIEW_V156-D.md`

## 검증
- tsc 0 · test:unit 536/536 · 빌드 성공
- `exclusions:v156` 13/13(찾기 142·카테고리 합 142·검색 부재·홈 142/141·다운로드 142·안내 카드 10/10)
- `entity-cards:v131` 18/18(main 병합 후, D-024·E-008 안내 카드) · `portfolio-analysis:v132` 13/13 · `glossary:v134` 17/17 · `qa:detail-contract:v153` 142/142
- 재생성 diff: 결정 필드와 파생(해시·크기·packUrl·다운로드 수·카드 수)만 변경, 값·레코드 변화 0
- `finalize:v151`: GATE_SUMMARY

## 알림
- main CI는 #32의 `docs/handoff/v159/datasetTypologyV159.xlsx`(security:v128 TRACKED_RAW_SOURCE)로 빨강 — 이 PR 범위 밖, 별도 처리 필요

🤖 Generated with [Claude Code](https://claude.com/claude-code)
