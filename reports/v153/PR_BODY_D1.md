## 요약
- 152개 상세 첫 화면을 **1순위 시각화부터** 읽히게: 데이터별 계약(`publicVisualizationContractV153.json`, 152행) 선언 → 라우터·렌더러가 블록 순서를 강제 → 계약 QA 152/152 판정
- 레이아웃 통일: 히어로 → 핵심 수치 3~4개(단위 필수) → **[1순위 | 작은 지도(3:4)]**(≥1024px) → 2순위 → 표 → 출처 1줄 → 이용조건(접힘). 모바일은 1순위 → 지도 → 2순위
- '자료 해석 안내' 삭제, 제목 반복 1회, C-009/C-010 320px 넘침 0

## 변경
- 계약·로더·유형 표준·순서 유틸 + 단위테스트 10건, `docs/VISUALIZATION_CONTRACT_V153.md`(생성 스크립트), `docs/DETAIL_LAYOUT_V153.md`
- `DetailAnalysisFrameV153`(rank/flat/split 속성·계약 판정·콘솔 경고), `DetailKpiStripV153`, `detail-layout-v153.css`, 라우터 `mapSlot`/`pageTitle`, 출처 1줄+이용조건
- 블록 태깅 `data-analysis-block`(일반 렌더러 1곳 + 전용 33개), 계약 순서 교체(성·시 분포·정책 타임라인·포트폴리오·디렉터리·E-006·A-027/28·D-005·B-021)
- 공용 차트: `StackedAreaChartV153`(A-016 추출)·`CompositionStackV153`(A-010·A-011·A-018)·`DumbbellChartV153`(B-023·B-025)·`EntityFacetCountsV153`
- QA: `qa:detail-contract:v153`(CI analysis job) · `d1-screens-v153` · `qa:analysis:v140` `detailTilesAbsent`→`detailTilesBounded`(사유 `reports/v153/ANALYSIS_QA_EXPECTATION_CHANGE_V153.md`), 지도 슬롯 선택기 제외
- 추적표 `docs/FINALIZATION_TRACKER_V153.md` '1순위 계약(D1)' 열 152행, `CHANGELOG.md`

## 검증
- `npx tsc --noEmit` 0 · `test:unit` 257/257 · production 빌드(CI=true) 경고 0
- `qa:detail-contract:v153` 152/152(표준 108·보존 11·예외 33 — 예외는 사유 기재, `reports/v153/REVIEW_V153-D1.md`)
- 대표 10개 × 6폭 60/60(넘침 0·콘솔 0·판정 match), 스크린샷 `output/v153-d1/`
- `qa:analysis:v140:baseline` 새 실패 0(기준선 41 이내, A-023 해소) · `finalize:v140` 1회 — 결과는 REVIEW 참조

## 범위 밖(다음 PR)
- 히트맵(A-013·C-005·B-044), E-017 순위 막대, B-026 유향 지도, 지역 패널·미니맵 값 표출(P4-D2), B-017 지도

🤖 Generated with [Claude Code](https://claude.com/claude-code)
