# 상세 계약 QA V153-D1 (2026-09-22T04:23:57.351Z)

- 대상 152개 · 통과 63 · 실패 89 · 예외 행 27개(A-015, A-017, A-025, A-026, B-001, B-002, B-010, B-013, B-014, B-017, B-022, B-026, B-028, B-036, B-037, B-043, B-045, D-001, D-002, D-003, D-004, D-009, D-013, E-002, E-006, E-009, E-017)
- primaryTypeMatch: 통과 125 · 실패 27 · 해당 없음 0
- rankOrder: 통과 152 · 실패 0 · 해당 없음 0
- axesMatch: 통과 49 · 실패 68 · 해당 없음 35
- blockHonesty: 통과 152 · 실패 0 · 해당 없음 0
- readingNotesAbsent: 통과 152 · 실패 0 · 해당 없음 0
- statusNoteNoChart: 통과 5 · 실패 0 · 해당 없음 147
- policyNoNumericChart: 통과 21 · 실패 2 · 해당 없음 129
- kpiRow: 통과 141 · 실패 11 · 해당 없음 0
- titleOnce: 통과 152 · 실패 0 · 해당 없음 0
- sourceLine: 통과 152 · 실패 0 · 해당 없음 0
- mapPlacement: 통과 42 · 실패 0 · 해당 없음 110
- overflow320: 통과 146 · 실패 6 · 해당 없음 0
- console: 통과 77 · 실패 75 · 해당 없음 0

| ID | 계약 1순위 | 첫 블록 | 판정 | 문제 |
|---|---|---|---|---|
| A-001 | line | line | 통과 |  |
| A-002 | line | line | 실패 | axes {"x":"연도","y":"백분위(같은 해 조사대상국 중 위치)","unit":"백분위"} ≠ {"x":"연도","y":"표준값(Estimate)","unit":"점"}; console: [v153-contract] A-002: axes {"x":"연도","y":"백분위(같은 해 조사대상국 중 위치)","unit":"백분위"} ≠ contract {"x":"연도","y":"표준값(E |
| A-003 | line | line | 실패 | kpi tiles 4 (unit missing) |
| A-004 | line | line | 통과 |  |
| A-005 | line | line | 실패 | axes {"x":"연도","y":"산업구조","unit":"%"} ≠ {"x":"연도","y":"산업 비중","unit":"%"}; console: [v153-contract] A-005: axes {"x":"연도","y":"산업구조","unit":"%"} ≠ contract {"x":"연도","y":"산업 비중","unit":"%"} |
| A-006 | line | line | 통과 |  |
| A-007 | line | line | 통과 |  |
| A-008 | line | line | 통과 |  |
| A-009 | line | line | 통과 |  |
| A-010 | stacked-area | note | 실패 | first block "note" ≠ contract "stacked-area"; axes null ≠ {"x":"연도","y":"가스별 배출량","unit":"MtCO₂e"}; console: [v153-contract] A-010: first block "note" ≠ contract "stacked-area" |
| A-011 | stacked-area | stacked-area | 통과 |  |
| A-012 | line | line | 통과 |  |
| A-013 | sorted-table | comparison-table | 실패 | first block "comparison-table" ≠ contract "sorted-table"; console: [v153-contract] A-013: first block "comparison-table" ≠ contract "sorted-table" |
| A-014 | line | line | 통과 |  |
| A-015 | category-bar | category-bar | 실패 | axes {"x":"SDG1 세부지표 달성도","y":"비교 항목","unit":"점(0~100)"} ≠ {"x":"정규화 달성도 점수","y":"SDG 세부지표","unit":"점"}; console: [v153-contract] A-015: axes {"x":"SDG1 세부지표 달성도","y":"비교 항목","unit":"점(0~100)"} ≠ contract {"x":"정규화 달성도 점 |
| A-016 | stacked-area | stacked-area | 통과 |  |
| A-017 | dumbbell | dumbbell | 실패 | axes null ≠ {"x":"LCOE","y":"발전기술","unit":"USD/MWh"} |
| A-018 | stacked-area | stacked-area | 통과 |  |
| A-019 | line | line | 통과 |  |
| A-020 | line | line | 통과 |  |
| A-021 | line | line | 통과 |  |
| A-022 | line | line | 실패 | axes {"x":"연도","y":"MAIFI","unit":"회/고객"} ≠ {"x":"연도","y":"정전빈도(SAIDI/SAIFI/MAIFI)","unit":"회/고객"}; console: [v153-contract] A-022: axes {"x":"연도","y":"MAIFI","unit":"회/고객"} ≠ contract {"x":"연도","y":"정전빈도(SAIDI/SAIFI/MAI |
| A-023 | category-bar | category-bar | 통과 |  |
| A-024 | category-bar | category-bar | 실패 | axes {"x":"전압별 송전선 길이 · 2016년","y":"비교 항목","unit":"km"} ≠ {"x":"선로 연장","y":"전압 등급","unit":"km"}; console: [v153-contract] A-024: axes {"x":"전압별 송전선 길이 · 2016년","y":"비교 항목","unit":"km"} ≠ contract {"x":"선로 연장","y":"전압 등급" |
| A-025 | comparison-table | comparison-table | 통과 |  |
| A-026 | note | note | 통과 |  |
| A-027 | category-bar | category-bar | 실패 | axes {"x":"자료 종류별 수록 지물 수","y":"비교 항목","unit":"건"} ≠ {"x":"지물 건수","y":"인프라 종류(도로/철도)","unit":"건"}; console: [v153-contract] A-027: axes {"x":"자료 종류별 수록 지물 수","y":"비교 항목","unit":"건"} ≠ contract {"x":"지물 건수","y":"인프라 종류(도로 |
| A-028 | category-bar | category-bar | 실패 | axes {"x":"자료 종류별 수록 지물 수","y":"비교 항목","unit":"건"} ≠ {"x":"지물 건수","y":"인프라 종류(항만/댐/저수지)","unit":"건"}; console: [v153-contract] A-028: axes {"x":"자료 종류별 수록 지물 수","y":"비교 항목","unit":"건"} ≠ contract {"x":"지물 건수","y":"인프라 종류 |
| A-029 | timeline | timeline | 통과 |  |
| A-030 | line | line | 실패 | axes {"x":"연도","y":"한-베트남 교역","unit":"10억 USD"} ≠ {"x":"연도","y":"교역액","unit":"10억 USD"}; console: [v153-contract] A-030: axes {"x":"연도","y":"한-베트남 교역","unit":"10억 USD"} ≠ contract {"x":"연도","y":"교역액","unit":"10억 USD"} |
| A-031 | line | line | 통과 |  |
| A-032 | line | line | 통과 |  |
| A-033 | line | line | 통과 |  |
| B-001 | category-bar | category-bar | 실패 | axes {"x":"월별 평년 강수량","y":"비교 항목","unit":"mm"} ≠ {"x":"월 평년강수","y":"월","unit":"mm"}; console: [v153-contract] B-001: axes {"x":"월별 평년 강수량","y":"비교 항목","unit":"mm"} ≠ contract {"x":"월 평년강수","y":"월","unit":"mm"} |
| B-002 | category-bar | category-bar | 실패 | axes {"x":"기후대별 점유 면적 · 2020년(1991–2020 관측)","y":"비교 항목","unit":"km²"} ≠ {"x":"점유 면적","y":"기후대","unit":"km²"}; console: [v153-contract] B-002: axes {"x":"기후대별 점유 면적 · 2020년(1991–2020 관측)","y":"비교 항목","unit":"km²"} ≠ cont |
| B-003 | region-bar | region-bar | 통과 |  |
| B-004 | region-bar | region-bar | 통과 |  |
| B-005 | region-bar | region-bar | 통과 |  |
| B-006 | region-bar | region-bar | 실패 | 320px overflow 8px |
| B-007 | region-bar | region-bar | 통과 |  |
| B-008 | line | line | 통과 |  |
| B-009 | line | line | 통과 |  |
| B-010 | category-bar | category-bar | 실패 | axes {"x":"CRI 종합 순위","y":"비교 항목","unit":"순위"} ≠ {"x":"값","y":"지표(순위/피해액/인명피해)","unit":"순위"}; console: [v153-contract] B-010: axes {"x":"CRI 종합 순위","y":"비교 항목","unit":"순위"} ≠ contract {"x":"값","y":"지표(순위/피해액/인명피해)","unit |
| B-011 | line | line | 통과 |  |
| B-012 | category-bar | category-bar | 실패 | axes null ≠ {"x":"재해 사건 수","y":"재해 유형","unit":"건"} |
| B-013 | category-bar | category-bar | 실패 | axes {"x":"EU 평균 탄소지불액","y":"비교 항목","unit":"%"} ≠ {"x":"EU 평균 탄소지불액","y":"산업","unit":"%"}; console: [v153-contract] B-013: axes {"x":"EU 평균 탄소지불액","y":"비교 항목","unit":"%"} ≠ contract {"x":"EU 평균 탄소지불액","y":"산업","unit":"%" |
| B-014 | category-bar | category-bar | 실패 | axes {"x":"GDP 영향","y":"비교 항목","unit":"%"} ≠ {"x":"GDP 영향","y":"시나리오","unit":"%"}; console: [v153-contract] B-014: axes {"x":"GDP 영향","y":"비교 항목","unit":"%"} ≠ contract {"x":"GDP 영향","y":"시나리오","unit":"%"} |
| B-015 | comparison-table | category-bar | 실패 | first block "category-bar" ≠ contract "comparison-table"; policy screen opens on "category-bar"; console: [v153-contract] B-015: first block "category-bar" ≠ contract "comparison-table" |
| B-016 | line | line | 통과 |  |
| B-017 | category-bar | table | 실패 | first block "table" ≠ contract "category-bar"; axes null ≠ {"x":"평가구역 수","y":"물 스트레스 등급","unit":"개"}; 320px overflow 275px; console: [v153-contract] B-017: first block "table" ≠ contract "category-bar" |
| B-018 | line | line | 실패 | axes {"x":"연도","y":"GDP(PPP) 전 구간","unit":"2017년 구매력평가 기준 10억 미국달러/년"} ≠ {"x":"연도","y":"GDP(PPP) 전 구간","unit":"십억 USD_2017/yr"}; kpi tiles 4 (unit missing); console: [v153-contract] B-018: axes {"x":"연도","y":"GDP(PPP) 전  |
| B-019 | line | line | 통과 |  |
| B-020 | line | line | 실패 | axes {"x":"연도","y":"INFORM Risk 시계열(2017–2026)","unit":"지수"} ≠ {"x":"연도","y":"INFORM 종합","unit":"지수"}; console: [v153-contract] B-020: axes {"x":"연도","y":"INFORM Risk 시계열(2017–2026)","unit":"지수"} ≠ contract {"x":"연도","y" |
| B-021 | region-bar | region-bar | 실패 | axes {"x":"2023년 권역별 GVI","y":"비교 항목","unit":"지수"} ≠ {"x":"GVI 취약성 지수","y":"권역","unit":"지수"}; console: [v153-contract] B-021: axes {"x":"2023년 권역별 GVI","y":"비교 항목","unit":"지수"} ≠ contract {"x":"GVI 취약성 지수","y":"권역","unit |
| B-022 | category-bar | category-bar | 실패 | axes {"x":"기후 투자 재원 구성","y":"비교 항목","unit":"십억 US$"} ≠ {"x":"재원 규모","y":"재원 구성(공공/민간)","unit":"십억 US$"}; console: [v153-contract] B-022: axes {"x":"기후 투자 재원 구성","y":"비교 항목","unit":"십억 US$"} ≠ contract {"x":"재원 규모","y":"재 |
| B-023 | dumbbell | dumbbell | 통과 |  |
| B-024 | line | line | 통과 |  |
| B-025 | dumbbell | dumbbell | 통과 |  |
| B-026 | category-bar | category-bar | 실패 | axes {"x":"KiênGiang · 8방향별 격자 비율","y":"비교 항목","unit":"%"} ≠ {"x":"방향별 비율","y":"유향(8방향)","unit":"%"}; console: [v153-contract] B-026: axes {"x":"KiênGiang · 8방향별 격자 비율","y":"비교 항목","unit":"%"} ≠ contract {"x":"방향별 비율","y |
| B-027 | line | line | 통과 |  |
| B-028 | sorted-table | sorted-table | 통과 |  |
| B-029 | region-bar | region-bar | 실패 | kpi tiles 3 (unit missing) |
| B-030 | region-bar | region-bar | 실패 | kpi tiles 3 (unit missing) |
| B-031 | region-bar | region-bar | 통과 |  |
| B-032 | region-bar | region-bar | 통과 |  |
| B-033 | region-bar | region-bar | 통과 |  |
| B-034 | region-bar | region-bar | 통과 |  |
| B-035 | line | line | 통과 |  |
| B-036 | category-bar | category-bar | 실패 | axes {"x":"토지이용 변화율","y":"비교 항목","unit":"%/yr"} ≠ {"x":"토지이용 변화율","y":"토지 유형","unit":"%/yr"}; console: [v153-contract] B-036: axes {"x":"토지이용 변화율","y":"비교 항목","unit":"%/yr"} ≠ contract {"x":"토지이용 변화율","y":"토지 유형","unit": |
| B-037 | category-bar | table | 실패 | first block "table" ≠ contract "category-bar"; axes null ≠ {"x":"면적","y":"토지피복 분류","unit":"km²"}; kpi tiles 3 (unit missing); console: [v153-contract] B-037: first block "table" ≠ contract "category-bar" |
| B-038 | line | line | 통과 |  |
| B-039 | region-bar | region-bar | 실패 | kpi tiles 3 (unit missing) |
| B-040 | region-bar | region-bar | 실패 | axes {"x":"심도 2km 지온(평균)","y":"성·시","unit":"°C"} ≠ {"x":"심도 1km 지온(평균)","y":"성·시","unit":"°C"}; kpi tiles 3 (unit missing); console: [v153-contract] B-040: axes {"x":"심도 2km 지온(평균)","y":"성·시","unit":"°C"} ≠ contract {"x" |
| B-041 | region-bar | region-bar | 실패 | kpi tiles 3 (unit missing); 320px overflow 10px |
| B-042 | region-bar | region-bar | 실패 | kpi tiles 3 (unit missing) |
| B-043 | category-bar | category-bar | 실패 | axes {"x":"가채연수(R/P ratio)","y":"비교 항목","unit":"년"} ≠ {"x":"가채연수(R/P ratio)","y":"자원 종류","unit":"년"}; console: [v153-contract] B-043: axes {"x":"가채연수(R/P ratio)","y":"비교 항목","unit":"년"} ≠ contract {"x":"가채연수(R/P ratio)", |
| B-044 | sorted-table | cards-list | 실패 | first block "cards-list" ≠ contract "sorted-table"; console: [v153-contract] B-044: first block "cards-list" ≠ contract "sorted-table" |
| B-045 | category-bar | category-bar | 실패 | axes {"x":"세계 매장량 비중","y":"비교 항목","unit":"%"} ≠ {"x":"세계 매장량 비중","y":"광물","unit":"%"}; console: [v153-contract] B-045: axes {"x":"세계 매장량 비중","y":"비교 항목","unit":"%"} ≠ contract {"x":"세계 매장량 비중","y":"광물","unit":"%"} |
| B-046 | category-bar | category-bar | 통과 |  |
| B-047 | category-bar | table | 실패 | first block "table" ≠ contract "category-bar"; axes null ≠ {"x":"세계 광산 생산량 비중","y":"광물","unit":"%"}; console: [v153-contract] B-047: first block "table" ≠ contract "category-bar" |
| B-048 | category-bar | cards-list | 실패 | first block "cards-list" ≠ contract "category-bar"; axes null ≠ {"x":"광산 수","y":"광종","unit":"곳"}; console: [v153-contract] B-048: first block "cards-list" ≠ contract "category-bar" |
| C-001 | timeline | table | 실패 | first block "table" ≠ contract "timeline"; console: [v153-contract] C-001: first block "table" ≠ contract "timeline" |
| C-002 | timeline | category-bar | 실패 | first block "category-bar" ≠ contract "timeline"; policy screen opens on "category-bar"; console: [v153-contract] C-002: first block "category-bar" ≠ contract "timeline" |
| C-003 | timeline | comparison-table | 실패 | first block "comparison-table" ≠ contract "timeline"; console: [v153-contract] C-003: first block "comparison-table" ≠ contract "timeline" |
| C-004 | timeline | comparison-table | 실패 | first block "comparison-table" ≠ contract "timeline"; console: [v153-contract] C-004: first block "comparison-table" ≠ contract "timeline" |
| C-005 | sorted-table | comparison-table | 실패 | first block "comparison-table" ≠ contract "sorted-table"; console: [v153-contract] C-005: first block "comparison-table" ≠ contract "sorted-table" |
| C-006 | timeline | comparison-table | 실패 | first block "comparison-table" ≠ contract "timeline"; console: [v153-contract] C-006: first block "comparison-table" ≠ contract "timeline" |
| C-007 | comparison-table | comparison-table | 통과 |  |
| C-008 | timeline | comparison-table | 실패 | first block "comparison-table" ≠ contract "timeline"; console: [v153-contract] C-008: first block "comparison-table" ≠ contract "timeline" |
| C-009 | timeline | timeline | 실패 | 320px overflow 39px |
| C-010 | timeline | timeline | 실패 | 320px overflow 39px |
| C-011 | comparison-table | comparison-table | 통과 |  |
| C-012 | comparison-table | comparison-table | 통과 |  |
| C-013 | comparison-table | comparison-table | 통과 |  |
| C-014 | comparison-table | comparison-table | 통과 |  |
| C-015 | comparison-table | comparison-table | 통과 |  |
| C-016 | region-bar | region-bar | 통과 |  |
| C-017 | comparison-table | comparison-table | 통과 |  |
| C-018 | category-bar | category-bar | 실패 | axes null ≠ {"x":"설비용량 계획(하한~상한)","y":"전원(기술)","unit":"MW"} |
| C-019 | region-bar | region-bar | 실패 | axes null ≠ {"x":"인벤토리 의무대상 시설 수","y":"성·시","unit":"개소"}; kpi tiles 3 (unit missing) |
| C-020 | status-note | status-note | 통과 |  |
| C-021 | status-note | status-note | 통과 |  |
| C-022 | region-bar | region-bar | 실패 | axes null ≠ {"x":"탄소시장 대상시설 수","y":"성·시","unit":"개소"}; kpi tiles 3 (unit missing) |
| C-023 | status-note | status-note | 통과 |  |
| C-024 | timeline | comparison-table | 실패 | first block "comparison-table" ≠ contract "timeline"; console: [v153-contract] C-024: first block "comparison-table" ≠ contract "timeline" |
| C-025 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"프로젝트 수","y":"등록 표준","unit":"건"}; console: [v153-contract] C-025: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"프로젝트 수","y":"등록 표준","unit":"건"} |
| D-001 | category-bar | category-bar | 실패 | axes {"x":"기술별 투자비 중앙값","y":"비교 항목","unit":"USD/kW"} ≠ {"x":"단위 사업당 CAPEX","y":"발전기술","unit":"USD/kW"}; console: [v153-contract] D-001: axes {"x":"기술별 투자비 중앙값","y":"비교 항목","unit":"USD/kW"} ≠ contract {"x":"단위 사업당 CAPEX", |
| D-002 | category-bar | category-bar | 실패 | axes {"x":"시장 성장률","y":"비교 항목","unit":"%"} ≠ {"x":"시장 성장률(CAGR)","y":"기술 분야","unit":"%"}; console: [v153-contract] D-002: axes {"x":"시장 성장률","y":"비교 항목","unit":"%"} ≠ contract {"x":"시장 성장률(CAGR)","y":"기술 분야","unit":"%"} |
| D-003 | category-bar | category-bar | 실패 | axes {"x":"예상 감축량","y":"비교 항목","unit":"tCO2/20년·MW"} ≠ {"x":"예상 감축량","y":"발전기술","unit":"tCO2/20년·MW"}; console: [v153-contract] D-003: axes {"x":"예상 감축량","y":"비교 항목","unit":"tCO2/20년·MW"} ≠ contract {"x":"예상 감축량","y":"발전 |
| D-004 | category-bar | category-bar | 실패 | axes {"x":"크레딧 가격 연동 수익성","y":"비교 항목","unit":"%"} ≠ {"x":"크레딧 수익 회수율","y":"발전기술","unit":"%"}; console: [v153-contract] D-004: axes {"x":"크레딧 가격 연동 수익성","y":"비교 항목","unit":"%"} ≠ contract {"x":"크레딧 수익 회수율","y":"발전기술","uni |
| D-005 | category-bar | note | 실패 | first block "note" ≠ contract "category-bar"; axes null ≠ {"x":"예산 배분 비중","y":"구분(감축/적응/복합)","unit":"%"}; console: [v153-contract] D-005: first block "note" ≠ contract "category-bar" |
| D-006 | line | line | 통과 |  |
| D-007 | comparison-table | timeline | 실패 | first block "timeline" ≠ contract "comparison-table"; console: [v153-contract] D-007: first block "timeline" ≠ contract "comparison-table" |
| D-008 | region-bar | category-bar | 실패 | first block "category-bar" ≠ contract "region-bar"; axes {"x":"주관 부처별 기후 예산 규모","y":"비교 항목","unit":"%"} ≠ {"x":"기후예산 비중","y":"성·시","unit":"%"}; console: [v153-contract] D-008: first block "category-bar" ≠ contract "regio |
| D-009 | category-bar | category-bar | 실패 | axes {"x":"기후대응 정부 예산","y":"비교 항목","unit":"%"} ≠ {"x":"GDP 대비 기후지출 비중","y":"연도","unit":"%"}; console: [v153-contract] D-009: axes {"x":"기후대응 정부 예산","y":"비교 항목","unit":"%"} ≠ contract {"x":"GDP 대비 기후지출 비중","y":"연도","unit" |
| D-010 | line | line | 통과 |  |
| D-011 | line | line | 실패 | axes {"x":"연도","y":"공적개발원조 지출액","unit":"USD (2024년 불변가격)"} ≠ {"x":"연도","y":"총 ODA","unit":"USD"}; console: [v153-contract] D-011: no tagged analysis block (contract "line") |
| D-012 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"기업 수","y":"기술 분야","unit":"곳"}; console: [v153-contract] D-012: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"기업 수","y":"기술 분야","unit":"곳"} |
| D-013 | category-bar | category-bar | 실패 | axes {"x":"GGGI Green Growth Index","y":"비교 항목","unit":"점"} ≠ {"x":"GGGI 점수","y":"부문·차원","unit":"점"}; console: [v153-contract] D-013: axes {"x":"GGGI Green Growth Index","y":"비교 항목","unit":"점"} ≠ contract {"x":"GGGI 점수", |
| D-014 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"사업 수","y":"원조 유형","unit":"건"}; console: [v153-contract] D-014: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"사업 수","y":"원조 유형","unit":"건"} |
| D-015 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"사업 기록 수","y":"상태","unit":"건"}; console: [v153-contract] D-015: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"사업 기록 수","y":"상태","unit":"건"} |
| D-016 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"사업 기록 수","y":"기관 유형","unit":"건"}; console: [v153-contract] D-016: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"사업 기록 수","y":"기관 유형","unit":"건"} |
| D-017 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"공고 수","y":"분야","unit":"건"}; console: [v153-contract] D-017: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"공고 수","y":"분야","unit":"건"} |
| D-018 | category-bar | table | 실패 | first block "table" ≠ contract "category-bar"; axes null ≠ {"x":"금액","y":"구분","unit":"USD"}; console: [v153-contract] D-018: first block "table" ≠ contract "category-bar" |
| D-019 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"기술지원 요청 수","y":"기술 유형","unit":"건"}; console: [v153-contract] D-019: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"기술지원 요청 수","y":"기술 유형","unit":"건"} |
| D-020 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"사업 수","y":"분야","unit":"건"}; console: [v153-contract] D-020: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"사업 수","y":"분야","unit":"건"} |
| D-021 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"지원 활동 수","y":"활동 상태","unit":"건"}; console: [v153-contract] D-021: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"지원 활동 수","y":"활동 상태","unit":"건"} |
| D-022 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"사업 수","y":"투자 유형","unit":"건"}; console: [v153-contract] D-022: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"사업 수","y":"투자 유형","unit":"건"} |
| D-023 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"사업 수","y":"기금","unit":"건"}; console: [v153-contract] D-023: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"사업 수","y":"기금","unit":"건"} |
| D-024 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"투자 건 수","y":"투자 라운드","unit":"건"}; console: [v153-contract] D-024: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"투자 건 수","y":"투자 라운드","unit":"건"} |
| D-025 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"사업 수","y":"투자 유형","unit":"건"}; console: [v153-contract] D-025: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"사업 수","y":"투자 유형","unit":"건"} |
| D-026 | category-bar | category-bar | 실패 | axes {"x":"연도","y":"건수","unit":"건"} ≠ {"x":"보증사업 수","y":"보증 유형","unit":"건"}; console: [v153-contract] D-026: axes {"x":"연도","y":"건수","unit":"건"} ≠ contract {"x":"보증사업 수","y":"보증 유형","unit":"건"} |
| E-001 | category-bar | cards-list | 실패 | first block "cards-list" ≠ contract "category-bar"; axes null ≠ {"x":"기관 수","y":"역할 구분","unit":"곳"}; console: [v153-contract] E-001: first block "cards-list" ≠ contract "category-bar" |
| E-002 | cards-list | cards-list | 통과 |  |
| E-003 | category-bar | cards-list | 실패 | first block "cards-list" ≠ contract "category-bar"; axes null ≠ {"x":"담당자 수","y":"기관","unit":"명"}; console: [v153-contract] E-003: first block "cards-list" ≠ contract "category-bar" |
| E-004 | category-bar | cards-list | 실패 | first block "cards-list" ≠ contract "category-bar"; axes null ≠ {"x":"현지사무소 수","y":"기관 유형","unit":"곳"}; console: [v153-contract] E-004: first block "cards-list" ≠ contract "category-bar" |
| E-005 | category-bar | cards-list | 실패 | first block "cards-list" ≠ contract "category-bar"; axes null ≠ {"x":"기관 수","y":"도시","unit":"곳"}; console: [v153-contract] E-005: first block "cards-list" ≠ contract "category-bar" |
| E-006 | region-bar | region-bar | 통과 |  |
| E-007 | comparison-table | comparison-table | 통과 |  |
| E-008 | line | category-bar | 실패 | first block "category-bar" ≠ contract "line"; axes null ≠ {"x":"연도","y":"논문·특허 수","unit":"건"}; console: [v153-contract] E-008: first block "category-bar" ≠ contract "line" |
| E-009 | category-bar | category-bar | 실패 | axes {"x":"2016년 · 고등교육 졸업자 중 STEM 전공 비중","y":"비교 항목","unit":"%"} ≠ {"x":"STEM 졸업 비중(남성)","y":"연도","unit":"%"}; console: [v153-contract] E-009: axes {"x":"2016년 · 고등교육 졸업자 중 STEM 전공 비중","y":"비교 항목","unit":"%"} ≠ contract |
| E-010 | line | line | 실패 | axes {"x":"연도","y":"GERD","unit":"%"} ≠ {"x":"연도","y":"GDP 대비 R&D 총지출 비율","unit":"%"}; console: [v153-contract] E-010: axes {"x":"연도","y":"GERD","unit":"%"} ≠ contract {"x":"연도","y":"GDP 대비 R&D 총지출 비율","unit":"%"} |
| E-011 | status-note | status-note | 통과 |  |
| E-012 | category-bar | category-bar | 실패 | axes null ≠ {"x":"종사자 수","y":"직군","unit":"천명"}; console: [v153-contract] E-012: no tagged analysis block (contract "category-bar") |
| E-013 | status-note | status-note | 통과 |  |
| E-014 | timeline | timeline | 통과 |  |
| E-015 | comparison-table | comparison-table | 통과 |  |
| E-016 | comparison-table | comparison-table | 통과 |  |
| E-017 | category-bar | comparison-table | 실패 | first block "comparison-table" ≠ contract "category-bar"; axes null ≠ {"x":"기후기술 수준 순위","y":"국가","unit":"위"}; console: [v153-contract] E-017: first block "comparison-table" ≠ contract "category-bar" |
| E-018 | category-bar | category-bar | 실패 | axes {"x":"건수","y":"분류","unit":"건"} ≠ {"x":"기업 수","y":"진출 상태","unit":"곳"}; 320px overflow 9px; console: [v153-contract] E-018: axes {"x":"건수","y":"분류","unit":"건"} ≠ contract {"x":"기업 수","y":"진출 상태","unit":"곳"} |
| E-019 | category-bar | cards-list | 실패 | first block "cards-list" ≠ contract "category-bar"; axes null ≠ {"x":"현지 사무소 수","y":"기관","unit":"곳"}; console: [v153-contract] E-019: first block "cards-list" ≠ contract "category-bar" |
| E-020 | category-bar | category-bar | 실패 | axes {"x":"건수","y":"분류","unit":"건"} ≠ {"x":"활용 사례 수","y":"지원제도","unit":"건"}; console: [v153-contract] E-020: axes {"x":"건수","y":"분류","unit":"건"} ≠ contract {"x":"활용 사례 수","y":"지원제도","unit":"건"} |

