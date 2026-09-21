# 카드 → 상세 분석 QA (V140) · local-build

실행 2026-09-21T06:16:01.420Z · http://127.0.0.1:55153 · 152개(값 보유 147 · 상태 안내 5) · 배포 버전 일치 예

| 항목 | 통과 | 실패 | 해당 없음 |
| --- | ---: | ---: | ---: |
| cardClicked | 152 | 0 | 0 |
| homeCardClicked | 8 | 0 | 144 |
| selectionUrlPreserved | 89 | 4 | 59 |
| screenLoaded | 150 | 2 | 0 |
| cardValueVerified | 125 | 24 | 3 |
| detailAnalysisFit | 77 | 16 | 59 |
| analysisFit | 151 | 1 | 0 |
| controlsVerified | 125 | 1 | 26 |
| tableValuesVerified | 130 | 14 | 8 |
| mapHandoffVerified | 41 | 0 | 111 |
| mapSymbolVerified | 41 | 0 | 111 |

detailAnalysisFit = 넘긴 선택(측정항목·연도·차원)이 선택기·제목·KPI에 있는지 · analysisFit = 자료 유형에 맞는 주 분석(추세/비교/구성/분포/등록부 목록과 표·단위·시점)이 있는지(152개 전부) · mapSymbolVerified = 지도 대표 기호 선택 후 값·단위·시점·출처·공간 의미가 패널에 있는지(42개)

독립 재계산(다운로드 파일): {"match":142,"not-applicable":8,"mismatch":2} · 컨트롤 시도 270회 · 표 분류(키: 지표+지역+연도/기간+단위) {"match":130,"no-derived-row":2,"not-applicable":8,"row-count-differs":12} · 필수 실패 41건

| 요소 | 종류 | click | url | loaded | value | recomp | fit | afit | controls | table | map | symbol | 잔여 문제 / 해당 없음 사유 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-001 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-002 | signed-bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-003 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-004 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-005 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-006 | line | ✓ | ✗ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | selection lost in URL: dim.detail=null; detail does not show the card's selection: selection "ILO 모델추정" not shown; selection "경제활동인구 대비 실업자 비율(ILO 모형 보정 추정치)" not shown; mapHandoffVerified: not a map dataset |
| A-007 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-008 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-009 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-010 | composition | ✓ | ✓ | ✓ | ✗ | match | ✗ | ✓ | ✓ | no-derived-row | – | – | card value 582.7 (MtCO₂e, 2024) not stated as such on the detail; detail does not show the card's selection: year 2024 not shown; mapHandoffVerified: not a map dataset |
| A-011 | composition | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-012 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-013 | level | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | detail does not show the card's selection: measure "NDC-SDG 연계 건수" not named; mapHandoffVerified: not a map dataset |
| A-014 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-015 | level | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | detail does not show the card's selection: selection "정규화 달성도 점수(0~100)" not shown; mapHandoffVerified: not a map dataset |
| A-016 | composition | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | detail does not show the card's selection: measure "1차 에너지 소비" not named; mapHandoffVerified: not a map dataset |
| A-017 | bars | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | detail does not show the card's selection: measure "LCOE" not named; mapHandoffVerified: not a map dataset |
| A-018 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-019 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-020 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-021 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-022 | line | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | detail does not show the card's selection: selection "연간 고객당 순간정전 횟수" not shown; mapHandoffVerified: not a map dataset |
| A-023 | grouped-bars | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | ✓ | ✓ | card value 41,350 MW (MW) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| A-024 | map | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | – | match | ✓ | ✓ | controlsVerified: no selectable control in the primary analysis |
| A-025 | level | ✓ | ✓ | ✓ | ✗ | match | ✗ | ✓ | – | match | ✓ | ✓ | card value 5 건 (건, 2026) not stated as such on the detail; detail does not show the card's selection: year 2026 not shown; measure "CCS 시설 수" not named; controlsVerified: no selectable control in the primary analysis |
| A-026 | facts | ✓ | – | ✓ | – | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: card headline "건물 수·면적 미제공" has no number; detailAnalysisFit: card carries no selection; tableValuesVerified: no number on the card; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| A-027 | level | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | detail does not show the card's selection: selection "피처 수" not shown; selection "OSM 도로 레이어의 지물 건수" not shown; measure "도로 레이어" not named; mapHandoffVerified: not a map dataset |
| A-028 | level | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | detail does not show the card's selection: selection "피처 수" not shown; selection "OSM 수로 레이어의 지물 건수" not shown; measure "수로 레이어" not named; mapHandoffVerified: not a map dataset |
| A-029 | level | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | – | match | – | – | detail does not show the card's selection: measure "무역협정 건수" not named; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| A-030 | line | ✓ | ✗ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | selection lost in URL: dim.detail=null; mapHandoffVerified: not a map dataset |
| A-031 | line | ✓ | ✗ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | selection lost in URL: dim.detail=null; detail does not show the card's selection: selection "통관 부문 점수(1=낮음 ~ 5=높음)" not shown; mapHandoffVerified: not a map dataset |
| A-032 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| A-033 | line | ✓ | ✗ | ✓ | ✓ | match | ✗ | ✓ | ✓ | match | – | – | selection lost in URL: dim.detail=null; detail does not show the card's selection: selection "정기선 해운 연결성 지수(Q1 분기값)" not shown; mapHandoffVerified: not a map dataset |
| B-001 | bars | ✓ | ✓ | ✓ | ✗ | match | ✗ | ✓ | – | match | – | – | card value 263 mm: number found without the unit "mm"; detail does not show the card's selection: measure "월 평년강수" not named; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
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
| B-023 | facts | ✓ | – | ✓ | ✓ | mismatch | – | ✓ | – | row-count-differs | ✓ | ✓ | recomputed from the download file: 11 vs card 10; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| B-024 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✗ | match | – | – | control without effect on the primary analysis: 기준연도 (2023년 → 2022년); mapHandoffVerified: not a map dataset |
| B-025 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| B-026 | spatial | ✓ | ✓ | ✓ | ✗ | match | ✓ | ✓ | ✓ | no-derived-row | – | – | card value 23.3 % (%) not stated as such on the detail; mapHandoffVerified: not a map dataset |
| B-027 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| B-028 | facts | ✓ | – | ✓ | ✗ | mismatch | – | ✓ | – | row-count-differs | ✓ | ✓ | card value 15건 (건) not stated as such on the detail; recomputed from the download file: 16 vs card 15; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
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
| C-001 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| C-002 | facts | ✓ | – | ✗ | ✗ | match | – | ✓ | – | match | – | – | card value 82건 (건) not stated as such on the detail; runtime: page.selectOption: Timeout 30000ms exceeded.; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| C-003 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 96건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| C-004 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 58건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| C-005 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 135건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| C-006 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 50건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| C-007 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-008 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-009 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-010 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis |
| C-011 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | – | match | – | – | card value 44건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-012 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | ✓ | ✓ | card value 120건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| C-013 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | ✓ | ✓ | card value 64건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| C-014 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 93건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| C-015 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | – | match | – | – | card value 20건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-016 | bars | ✓ | ✓ | ✓ | ✗ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ | card value 27,385 MW (MW) not stated as such on the detail |
| C-017 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 52건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| C-018 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| C-019 | bars | ✓ | – | ✗ | ✓ | match | – | ✓ | – | match | – | – | runtime: page.selectOption: Timeout 30000ms exceeded.; detailAnalysisFit: card carries no selection |
| C-020 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-021 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-022 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| C-023 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| C-024 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | ✓ | ✓ | card value 20건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| C-025 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| D-001 | level | ✓ | ✓ | ✓ | ✓ | match | ✗ | ✓ | – | match | – | – | detail does not show the card's selection: selection "바이오에너지 기술 (Biomass)" not shown; selection "총투자액÷설비용량 중앙값" not shown; measure "단위 사업당 CAPEX" not named; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| D-002 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-003 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-004 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-005 | composition | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-006 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-007 | facts | ✓ | ✓ | ✓ | – | not-applicable | ✓ | ✓ | ✓ | not-applicable | – | – | cardValueVerified: card headline "부분 도입 — TCCRE 유형분류 기반 사후 태깅" has no number; tableValuesVerified: no number on the card; mapHandoffVerified: not a map dataset |
| D-008 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | ✓ | ✓ |  |
| D-009 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-010 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| D-011 | line | ✓ | ✓ | ✓ | ✗ | match | ✓ | ✓ | ✓ | match | – | – | card value 16.65억 USD (USD, 2024) not stated as such on the detail; mapHandoffVerified: not a map dataset |
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
| D-023 | composition | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-024 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-025 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| D-026 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-001 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-002 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | – | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-003 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-004 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-005 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-006 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-007 | bars | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 19건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-008 | bars | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-009 | level | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | – | match | – | – | controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-010 | line | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| E-011 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-012 | level | ✓ | ✓ | ✓ | ✗ | match | ✗ | ✓ | ✓ | match | – | – | card value 51,860 천명 (천명, 2024) not stated as such on the detail; detail does not show the card's selection: measure "총 취업자 수" not named; mapHandoffVerified: not a map dataset |
| E-013 | status | ✓ | – | ✓ | ✓ | not-applicable | – | ✓ | – | not-applicable | – | – | cardValueVerified: status screen (checked for the status wording only); detailAnalysisFit: card carries no selection; tableValuesVerified: status screen, no values; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-014 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | match | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-015 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | – | match | – | – | card value 4건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; controlsVerified: no selectable control in the primary analysis; mapHandoffVerified: not a map dataset |
| E-016 | facts | ✓ | – | ✓ | ✗ | match | – | ✓ | ✓ | match | – | – | card value 4건 (건) not stated as such on the detail; selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
| E-017 | bars | ✓ | ✓ | ✓ | ✓ | match | ✓ | ✓ | ✓ | match | – | – | mapHandoffVerified: not a map dataset |
| E-018 | bars | ✓ | – | ✓ | ✓ | match | – | ✗ | ✓ | match | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; analysisFit: compared categories named (1/2) |
| E-019 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | ✓ | ✓ | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection |
| E-020 | facts | ✓ | – | ✓ | ✓ | match | – | ✓ | ✓ | row-count-differs | – | – | selectionUrlPreserved: card carries no selection; detailAnalysisFit: card carries no selection; mapHandoffVerified: not a map dataset |
