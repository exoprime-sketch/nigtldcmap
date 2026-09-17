# 카드 → 상세 분석 QA (V140) · probe

실행 2026-09-16T01:56:41.836Z · http://127.0.0.1:54592 · 10개

| 항목 | 통과 | 실패 | 해당 없음 |
| --- | ---: | ---: | ---: |
| screenLoaded | 10 | 0 | 0 |
| cardSummaryVerified | 9 | 0 | 1 |
| detailAnalysisFit | 8 | 0 | 2 |
| controlsVerified | 6 | 2 | 2 |
| tableValuesVerified | 5 | 4 | 1 |
| mapHandoffVerified | 2 | 0 | 8 |

잔여 문제가 있는 요소: 2개

| 요소 | 종류 | loaded | card | fit | controls | table | map | 잔여 문제 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-006 | line | ✓ | ✓ | ✓ | ✓ | ✓ | – |  |
| A-022 | line | ✓ | ✓ | ✓ | ✗ | ✗ | – | control without effect: 세부 분류 |
| A-026 | facts | ✓ | ✓ | ✓ | ✓ | ✗ | – |  |
| A-032 | line | ✓ | ✓ | ✓ | ✓ | ✓ | – |  |
| B-010 | level | ✓ | ✓ | ✓ | ✓ | ✓ | – |  |
| B-025 | bars | ✓ | ✓ | – | – | ✗ | ✓ |  |
| B-036 | bars | ✓ | ✓ | ✓ | ✗ | ✓ | – | control without effect: 연도 |
| C-009 | facts | ✓ | ✓ | – | – | ✗ | ✓ |  |
| D-006 | line | ✓ | ✓ | ✓ | ✓ | ✓ | – |  |
| D-007 | facts | ✓ | – | ✓ | ✓ | – | – |  |
