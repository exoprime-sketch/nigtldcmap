## 요약
- 홈: 주요 데이터 그리드 → 질문 6카드(유형 ①~⑥, 대표 KPI는 카드 요약 값만)
- 데이터 찾기: 기본 핵심 57, '전체 보기' 141(⓪ 11 숨김), 등급·유형 배지
- 상세 3층: 1층 상시(히어로+판단 포인트 칩 한 줄·분석 제목·조건 한 줄·1순위 차트|지도), 2층(2순위 이하 차트·데이터 설명·핵심 수치)·3층(출처·표·다운로드) 접힘, 긴 목록 10건·지역 순위 상하위 10(1순위 5) + 전체 보기
- 지도: 핵심 레이어 20 기본 + '더 많은 레이어'(map-index·빌더·렌더러 불변)
- 등급 정본 `informationTiersV160.json`(기획서 §3에서 생성), QA `qa:core-first:v160`

## 측정(V159 → V160)
- 홈 본문 단어 535 → 204(−61.9%), 첫 화면 112(상한 120)
- 데이터 찾기 기본 152 → 57 · 지도 기본 20 = 정책 · 6폭 넘침 0 · 콘솔 0
- 상세 첫 화면(판단 포인트 줄·1순위 상단 800px 안) 0/12 → 12/12
- 일반 차트 1층 ≤ 2.0화면 1/10 → 10/10, 타임라인·표 10건 + 전체 보기(C-009 14.45 → 2.11, C-012 4.22 → 2.02)

## 검증
- tsc 0 · unit 564/564 · core-first 12/12
- finalize:v151 3회 실패 후 단계별: detail-hierarchy 12/12 · duplicate-copy 0 · human-review 10/10 · release 79/79 · role-split 49/49 · analysis QA main 대비 신규 0 · boundary-34 21(+1 skip) · boundary-policy 24/24
- main(fcc04f7, #33·#35·#36·#37·#38) 병합 후: finalize:v151 1회차 exclusions:v156 실패 → 감사 V160 이관(사용자 결정) → release 80/80 · role-split 49/49 · analysis QA main 대비 신규 0 · boundary-34 21(+1 skip) · boundary-policy 24/24 · unit 593/593(hidden == 카탈로그 excluded ∪ not-collected 테스트 추가)
- A-010·D-023 analysisFit은 main에도 있는 #32 유래 실패 — merge 직후 fix-forward PR
- 상세: reports/v160/REVIEW_V160.md · 기대값 변경: reports/v160/EXPECTATION_CHANGES_V160.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01V68y43MvVho6XhCXbfyvLp
