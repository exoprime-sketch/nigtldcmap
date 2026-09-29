## 요약
- 지역명 표기 모듈 `한글명 (현지명)`: `src/data/geo/regionNameV161.ts`(`formatRegionName`·`regionNameKo`·`regionNameLocal`·`regionMergeNoteV161`) + 생성 사전 `regionNamesV161.json`
- 화면 적용 없음 — B(상세)·C(지도 패널)·P9-B1(방글라데시)이 사용. 계획서 지시대로 tsc·unit만

## 사전
- 베트남: 34개 단위·도시 6·63개 성 100% 기존 표에서(자동 변환 0), 개편 전 성은 `2025.7.1 ○○(으)로 통합` 안내
- 방글라데시: 주 8(확인) + 구 64(현지명 geoBoundaries ADM2 고정 스냅숏, 한글명 한국어 위키백과 revid 고정 — 주와 같은 이름 8 확인·56 검수 대기), 2018 표기(Barishal·Chattogram 등)도 적중
- 그 밖의 베트남 지명: 국립국어원 베트남어 표기 규칙 자동 변환(사전 97개 전부 일치) → `pending` 85개, 부호 없는 원문·오기 의심·서술형은 원문 그대로(추정 없음)
- 검수표 `docs/handoff/v161/REGION_NAME_REVIEW.md`

## 검증
- tsc 0 · test:unit 564/564(새 14건) · `check:region-names:v161`(생성 최신·변환기 5/5)

## 참고
- 계획서 예시 `호찌민시` 대신 기존 사전 표기 `호찌민` 사용(사전 우선) — 바꾸려면 사전만 수정
- 기록: `reports/v161/REVIEW_V161-A.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
