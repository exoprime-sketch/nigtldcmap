## 요약
- 홈: 주요 데이터 그리드 → 질문 6카드(유형 ①~⑥, 대표 KPI는 카드 요약 값만)
- 데이터 찾기: 기본 핵심 57, '전체 보기' 141(⓪ 11 숨김), 등급·유형 배지
- 상세 3층: 1층 상시(판단 포인트·1순위 차트|지도), 2층 데이터 설명(핵심 수치 포함)·3층 다운로드·참고문헌 접힘
- 지도: 핵심 레이어 20 기본 + '더 많은 레이어'(map-index·빌더·렌더러 불변)
- 등급 정본 `informationTiersV160.json`(기획서 §3에서 생성), QA `qa:core-first:v160`

## 측정
- 홈 본문 단어 535 → 203(−62.1%), 첫 뷰포트 112 → 111
- 찾기 기본 152 → 57 · 접힘 aria 12/12 · 지도 기본 20 = 정책 · 6폭 넘침 0 · 콘솔 0
- 상세 1층 ≤1.5화면: 2/12(미완료, docs/CORE_FIRST_V160.md에 원인·선택지)

## 검증
- tsc 0 · unit 561/561 · typology 152/152 · detail-contract 152/152 · core-first 8/9
- finalize:v151 2회 실패(PR #32 누적분: entity-cards, temporal-depth) → 감사 규칙 갱신 후 개별 통과, 3회차는 승인 대기
- 기대값 변경: reports/v160/EXPECTATION_CHANGES_V160.md · 상세: reports/v160/REVIEW_V160.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01V68y43MvVho6XhCXbfyvLp
