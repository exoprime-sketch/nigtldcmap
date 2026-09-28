## 요약
- 제외 10건(사용자 0923: C-020·C-023·E-011·E-013·E-016·E-017 / 명세서 0918: A-017·C-015·D-024·E-008)을 목록·검색·카테고리 건수·홈 카드·홈 수치·다운로드에서 내리고, 직접 URL은 안내 카드(결정·사유·결정일) 1개만. **공개 142**, 프레임워크 152 유지, C-021 미입고 안내 유지
- 감사·QA의 152는 카탈로그에서 파생(공개 = `publicStatus ∉ {excluded, not-provided}`), 배포 감사에 제외 10건 전수 검사 `exclusions:v156` 추가
- main의 entity-cards 실패(D-024·E-008, #32 템플릿)도 이 PR로 해소 — 병합 후 18/18
- main(#32)에서 비롯된 게이트 실패 3건도 함께 처리(사용자 승인 2026-09-28): C-002 판정(⑥ KPI 타일), 제외 안내 화면 제목 머리(V159 명칭), analysis QA 제외 판정

## 변경
- 결정 파일 사유·결정일 보정, ETL 제외 요소 `downloadAllowed: false`·manifest 다운로드 가능 수 공개 기준(141), 카드 요약 제외(142장), 데이터 재생성
- 상세 제외 안내 화면: V159 제목 머리(출처 윗줄 + 원데이터명) + 안내 카드(결정·사유·결정일). 홈 '전체 데이터 항목' 142, 파사드 `not-provided` 포함
- 감사 헬퍼 `scripts/v156/exclusions-audit-v156.mjs`, 감사·QA 기대값 공개 집합 파생, entity-cards·portfolio·glossary·analysis QA·e2e에 제외 안내 카드 검사
- `temporal-depth:v135` C-002: V147 막대 그림 또는 V159 KPI 타일(표보다 먼저) — #32 ⑥ 결정(2026-09-24) 반영, 검사 의도 유지
- 기록: `reports/v156/EXPECTATION_CHANGES_V156D.md`(23건 + main 기인 3건), `docs/DATASET_EXCLUSIONS_V156.md`, `reports/v156-d/REVIEW_V156-D.md`

## 검증
- tsc 0 · test:unit 536/536 · 빌드 성공(CI=true)
- `exclusions:v156` 13/13(찾기 142·카테고리 합 142·검색 부재·홈 142/141·다운로드 142·안내 카드 10/10)
- `entity-cards:v131` 18/18 · `portfolio-analysis:v132` 13/13 · `glossary:v134` 17/17 · `temporal-depth:v135` 11/11 · `qa:detail-contract:v153` 142/142
- 재생성 diff: 결정 필드와 파생(해시·크기·packUrl·다운로드 수·카드 수)만 변경, 값·레코드 변화 0
- e2e 211/214 — 상세 152(공개 142 + 제외 안내 10) 통과. 실패 3건은 시각 기준선 미갱신(#27·#32 기인, finder는 건수 문구 142만 이 PR 몫) → 별도 fix-forward
- `finalize:v151`: **통과**(4회차, `c53debb`) — release:v136 80/80(신규 `V156_EXCLUSIONS` 포함) · role-split 53/53 · analysis QA 필수 실패 34(기준선 41, 신규 0) · boundary-34 21/22(1 skip) · boundary-policy 24/24

## 알림
- main CI 빨강(`security:v128`, #32의 xlsx)은 #35에서 처리

🤖 Generated with [Claude Code](https://claude.com/claude-code)
