# analysis QA 기대값 변경 기록 — V153-D1 (2026-09-22)

## 무엇을 바꿨나
- `scripts/v140/analysis-qa-v140.mjs`의 필수 검사 `detailTilesAbsent`(analysis root 안에 `[class*="kpi"]`·`[data-testid*="kpi"]`·`public-metric-cards`가 0개)를 `detailTilesBounded`로 교체했다.
- `detailTilesBounded` = (기존) analysis root 안 큰 헤드라인 타일 0개 **그리고** 히어로 아래 '핵심 수치' 행(`[data-testid="detail-kpi-tile-v153"]`)이 3~4개이며 각 타일에 `data-kpi-unit`이 있고 단위 외 값 텍스트가 있음. 상태 안내 데이터(C-020·C-021·C-023·E-011·E-013)는 타일 0개 + 상태 1줄(`detail-kpi-status-v153`).
- 결과 JSON에는 `detailTilesAbsent`(참고)와 `detailTilesBounded`(필수)를 함께 남긴다. 기준선 파일(`reports/v150/analysis-qa-baseline-v150.json`)은 바꾸지 않았다.

## 왜
- V147은 상세 분석 영역 안의 '큰 초록색 KPI 타일'을 제거했고 V140 QA가 그 상태를 고정했다(`detail headline tiles must not return`).
- V153-D1에서 사용자가 상세 첫 화면 순서를 **히어로 → 핵심 수치 3~4개(단위 필수) → 1순위 시각화**로 확정했다. 새 행은 분석 root 밖(히어로 직후)에 있는 소형 수치 행이며, 값은 새로 계산하지 않고 카드 헤드라인(analysis QA가 상세 표출을 검증하는 바로 그 값)·자료기간·공개 관측값/목록 건수·지표 수에서 온다.
- 검사를 "타일 금지"로 두면 새 행이 root 밖에 있어 기술적으로는 통과하지만 취지를 우회하게 되므로, 기대값을 "분석 안 큰 타일 금지 + 핵심 수치 행 요건"으로 명시했다.

## 어디에
- 코드: `scripts/v140/analysis-qa-v140.mjs` (`coreFigures`·`coreStatusLine` 수집, `detailTilesBounded` 판정, 필수 실패 조건·요약·기준선 분류 키)
- 화면: `src/components/data/public/DetailKpiStripV153.tsx`, `src/pages/CountryDataElementPage.tsx`
