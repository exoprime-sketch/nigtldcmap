# 카드 → 상세 분석 QA (V140) · review-targets

실행 2026-09-16T05:55:22.819Z · http://127.0.0.1:62684 · 14개(값 보유 14 · 상태 안내 0) · 배포 버전 일치 예

| 항목 | 통과 | 실패 | 해당 없음 |
| --- | ---: | ---: | ---: |
| cardClicked | 14 | 0 | 0 |
| homeCardClicked | 1 | 0 | 13 |
| selectionUrlPreserved | 9 | 0 | 5 |
| screenLoaded | 14 | 0 | 0 |
| cardValueVerified | 14 | 0 | 0 |
| detailAnalysisFit | 9 | 0 | 5 |
| controlsVerified | 14 | 0 | 0 |
| tableValuesVerified | 10 | 4 | 0 |
| mapHandoffVerified | 7 | 0 | 7 |

독립 재계산(다운로드 파일): {"match":14} · 컨트롤 시도 38회 · 표 분류 {"match":10,"no-derived-row":1,"row-count-differs":3} · 필수 실패 0건

| 요소 | 종류 | click | url | loaded | value | recomp | fit | controls | table | map | 잔여 문제 / 해당 없음 사유 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-022 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | – | mapHandoffVerified: not a map dataset |
| A-023 | grouped-bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| B-004 | spatial-trend | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | ✓ |  |
| B-021 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✗ | ✓ |  |
| B-026 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | – | mapHandoffVerified: not a map dataset |
| B-036 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | – | mapHandoffVerified: not a map dataset |
| B-040 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | ✓ |  |
| D-012 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-018 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | ✓ |  |
| E-004 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✗ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-012 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | – | mapHandoffVerified: not a map dataset |
| E-017 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | – | mapHandoffVerified: not a map dataset |
| E-019 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✗ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-020 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✗ | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
