# 카드 → 상세 분석 QA (V140) · local-build

실행 2026-09-16T09:04:47.528Z · http://127.0.0.1:58612 · 152개(값 보유 147 · 상태 안내 5) · 배포 버전 일치 예

| 항목 | 통과 | 실패 | 해당 없음 |
| --- | ---: | ---: | ---: |
| cardClicked | 152 | 0 | 0 |
| homeCardClicked | 8 | 0 | 144 |
| selectionUrlPreserved | 93 | 0 | 59 |
| screenLoaded | 152 | 0 | 0 |
| cardValueVerified | 150 | 0 | 2 |
| detailAnalysisFit | 93 | 0 | 59 |
| analysisFit | 152 | 0 | 0 |
| controlsVerified | 119 | 0 | 33 |
| tableValuesVerified | 131 | 14 | 7 |
| mapHandoffVerified | 42 | 0 | 110 |
| mapSymbolVerified | 42 | 0 | 110 |

detailAnalysisFit = 넘긴 선택(측정항목·연도·차원)이 선택기·제목·KPI에 있는지 · analysisFit = 자료 유형에 맞는 주 분석(추세/비교/구성/분포/등록부 목록과 표·단위·시점)이 있는지(152개 전부) · mapSymbolVerified = 지도 대표 기호 선택 후 값·단위·시점·출처·공간 의미가 패널에 있는지(42개)

독립 재계산(다운로드 파일): {"match":144,"not-recomputed":1,"not-applicable":7} · 컨트롤 시도 278회 · 표 분류(키: 지표+지역+연도/기간+단위) {"match":131,"no-derived-row":4,"no-matching-row":1,"row-count-differs":9,"not-applicable":7} · 필수 실패 0건

| 요소 | 종류 | click | url | loaded | value | recomp | fit | afit | controls | table | map | symbol | 잔여 문제 / 해당 없음 사유 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-001 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-002 | signed-bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-003 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-004 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-005 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-006 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-007 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-008 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-009 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-010 | composition | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | no-derived-row | – | – | mapHandoffVerified: not a map dataset |
| A-011 | composition | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-012 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-013 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-014 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-015 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-016 | composition | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-017 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-018 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-019 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-020 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-021 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-022 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-023 | grouped-bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| A-024 | map | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | – | no-matching-row | ✓ | ✓ | controlsVerified: no selectable control in the primary analysis |
| A-025 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| A-026 | facts | ✓ | ✓ | ✓ | ✓ | not-recomputed | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-027 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-028 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-029 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | – | match | – | – | controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| A-030 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-031 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-032 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-033 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-001 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-002 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-003 | spatial-trend | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-004 | spatial-trend | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-005 | spatial-trend | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-006 | spatial-trend | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-007 | spatial-trend | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-008 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-009 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-010 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-011 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-012 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| B-013 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-014 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-015 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-016 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-017 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| B-018 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-019 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-020 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-021 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-022 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-023 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| B-024 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-025 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | – | no-derived-row | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| B-026 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-027 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-028 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| B-029 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-030 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-031 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-032 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-033 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-034 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-035 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-036 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-037 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-038 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-039 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-040 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-041 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-042 | spatial | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| B-043 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-044 | facts | ✓ | ✓ | ✓ | – | not-applicable | ✓ | ✓ | ✓ | not-applicable | – | – | cardValueVerified: card headline "수출금지(원광) 대상" has no number; tableValuesVerified: no number on the card; mapHandoffVerified: not a map dataset |
| B-045 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-046 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-047 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-048 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-001 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-002 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-003 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-004 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-005 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-006 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-007 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-008 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-009 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-010 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-011 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-012 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-013 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-014 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-015 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-016 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | no-derived-row | ✓ | ✓ |  |
| C-017 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-018 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| C-019 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-020 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-021 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-022 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-023 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-024 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-025 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| D-001 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-002 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-003 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-004 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-005 | composition | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-006 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-007 | facts | ✓ | ✓ | ✓ | – | not-applicable | ✓ | ✓ | ✓ | not-applicable | – | – | cardValueVerified: card headline "부분 도입 — TCCRE 유형분류 기반 사후 태깅" has no number; tableValuesVerified: no number on the card; mapHandoffVerified: not a map dataset |
| D-008 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| D-009 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-010 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-011 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-012 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-013 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-014 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-015 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-016 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-017 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-018 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| D-019 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-020 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-021 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-022 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-023 | composition | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | no-derived-row | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-024 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-025 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-026 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-001 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-002 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-003 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-004 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-005 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-006 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-007 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-008 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-009 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| E-010 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| E-011 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-012 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| E-013 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-014 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-015 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-016 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-017 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| E-018 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-019 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-020 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
