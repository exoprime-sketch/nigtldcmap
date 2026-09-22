# PROGRESS — PR-D1 V153 상세보기 프레임 (feat/v153-d1-detail-frame)

## PR 목표
- 152개 상세 첫 화면을 데이터별 1순위 시각화부터 읽히게: 계약(`publicVisualizationContractV153.json`) 선언 → 라우터·렌더러 순서 강제(`data-analysis-block`/`data-analysis-rank`) → 레이아웃 통일(히어로 → 핵심 수치 → [1순위 | 지도] → 2순위 → 표 → 출처 1줄 → 이용조건 접힘) → '자료 해석 안내' 삭제 → 계약↔화면 QA 152/152.

## 수용기준
- 계약 152행 스키마·유형 규칙 단위테스트 통과, `docs/VISUALIZATION_CONTRACT_V153.md`는 JSON에서 생성
- `qa:detail-contract:v153` 152/152(예외 행은 사유와 함께 별도 집계), `qa:analysis:v140:baseline` 새 실패 0
- 대표 10개 × 6폭 넘침 0, C-009/C-010 320px 넘침 0
- '자료 해석 안내' 텍스트 DOM 0, 상태 안내 5개 차트 0, 정책·문서형 숫자 차트 0
- 금지 파일(RealMapExplorerPage·src/data/map·src/components/map·DetailLocationMapV148·map-index) 무편집
- KPI: 소형 '핵심 수치' 행(≤4·단위 필수) — `detailTilesAbsent` 기대값 변경 사유 `reports/v153/ANALYSIS_QA_EXPECTATION_CHANGE_V153.md`

## 단계
- [x] 1 계약 초안(서브에이전트 2) → 전수 판정 → JSON·로더·테스트
- [x] 2 블록 태깅(서브에이전트 3 worktree) 병합 + 일반 렌더러 태깅·순서
- [x] 3 프레임·핵심 수치 행·레이아웃 CSS·지도 슬롯·해석 안내 삭제·출처 1줄
- [x] 4 유형 표준 화면 변경(누적영역 공용화·덤벨·지역 막대 순서)
- [x] 5 QA 스크립트·package.json·CI, analysis QA 기대값 변경
- [x] 6 검증: tsc 0 · unit 257/257 · 계약 QA 152/152 · 대표 10개×6폭 60/60 · analysis QA 기준선(지도 슬롯 제외 후 재실행) · 문서·추적표·CHANGELOG
- [~] 7 finalize:v140 2회 실행(1차 entity-cards/publicCopy 상태 파일 → 처리, 2차 glossary 35 토큰 = main 선행 결함) → push → PR #27 → Vercel Preview 확인·glossary fix-forward 결정 대기

## 미완료·후속
- 히트맵(A-013·C-005·B-044)·E-017 순위 막대·B-026 유향 지도·B-017 지도·지역 패널 값 표출(P4-D2)은 범위 밖. 예외 33행 사유는 계약 note·docs/VISUALIZATION_CONTRACT_V153.md
