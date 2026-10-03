# 통합 인수 게이트 결과(qa:acceptance:v162)

- 판정: **FAIL** · 통과 12 · 실패 6 · 예상 실패 0 · 건너뜀 0 (총 18)
- 국가: BGD · 공개 전 폴백 검사: (없음)
- 예상 실패 허용: 지도 준비 중 0건

| 국가 | 영역 | 검사 | 판정 | 실측 | 기준 | 재사용 |
|---|---|---|---|---|---|---|
| BGD | finder | 찾기 목록 = 카탈로그 공개 요소 | PASS | {"total":141,"cards":141} | 141 |  |
| BGD | finder | 2026년 제외 요소 비노출(찾기) | PASS | [] | [] |  |
| BGD | finder | '데이터 준비 중' 카드 = 카탈로그 미입고 상태 | PASS | ["B-045"] | ["B-045"] |  |
| BGD | finder | 미입고 상세의 '데이터 준비 중' 안내 | PASS | ["B-045"] | ["B-045"] |  |
| BGD | finder | 찾기 기본 정렬 = 가나다순(미입고는 끝) | PASS | {"mode":"name","nameSorted":true,"preparingLast":true,"cards":141,"first":["A-016","B-005","A-010"]} | {"mode":"name","nameSorted":true,"preparingLast":true} |  |
| BGD | finder | 조회순 선택 시 조회수 순으로 순서 변경(시험 조회수 주입) | PASS | {"enabled":true,"mode":"views","orderMatches":true,"orderChanged":true,"first":["E-009","A-015","A-013"]} | {"mode":"views","orderMatches":true,"orderChanged":true} |  |
| BGD | map | 지도 대상·연결 수 = map-index 실측 | FAIL | {"target":72,"connected":0,"pending":72,"pendingBadges":72} | {"target":0,"connected":0} |  |
| BGD | map | 지도 '준비 중' 0 | FAIL | {"pending":72,"badges":72,"ids":[]} | {"pending":0,"expectPending":0} |  |
| BGD | wording | 내부 작업 메모 0(홈·찾기·상세·다운로드·지도, #42) | PASS | {"findings":0,"detailPages":141,"runtimeErrors":0} | {"findings":0} | audit:source-notes:v161 |
| BGD | wording | 다른 나라 국명 0(홈·찾기·지도·다운로드·이용안내·상세 전체, 국가 비교 절 제외) | FAIL | {"hits":6,"detailPages":141,"first":["home:베트남 «정보를 검색하고, 지역별 분포와 변화를 확인하세요.현재 제공 국가 · 베트남 · 방글라데시데이터명·지역·기술·기관 검색검색검색 예시국내총생산가뭄산림»","map:베트남 «지도 표시 제외준비 중i발전소위치자료 미확보 · 지도 표시 제외준비 중i베트남 송전망위치자료 미확보 · 지도 표시 제외준비 중iCCS(탄소 | {"hits":0,"terms":["베트남","Viet Nam"]} | reports/v162/other-country-names-v162-bgd.json |
| BGD | wording | '핵심' 표현 0(지도 화면, scan-core-word-v157) | PASS | {"hits":[],"layers":72} | {"hits":[]} | scan-core-word-v157 |
| BGD | numbers | 홈 전체 데이터 항목 = 카탈로그 공개 요소 | PASS | 141개 | 141 |  |
| BGD | numbers | 홈 지도 제공 항목 = map-index 활성 레이어 | FAIL | 0개 | 0 |  |
| BGD | numbers | 홈 다운로드 가능 항목 = manifest | PASS | 100개 | 100 |  |
| BGD | numbers | 다운로드 목록 = 카탈로그 공개 요소(제외 0) | FAIL | 146 | 141 |  |
| BGD | numbers | 데이터 기준일 = 원자료 입고일(국가별 provenance) | PASS | {"shown":"2026.09.30","manifestGeneratedAt":"2026-09-29T00:00:00Z"} | {"deliveredAt":"2026-09-30","source":"manifest.provenance.sourceDeliveredAt"} |  |
| BGD | smoke | 운영 smoke(국가별, 이 빌드) | FAIL | {"exit":1,"runtimeFailure":"condition timeout; last value: false","routeFailures":0,"assetFailures":0,"consoleErrors":0} | {"exit":0} | smoke:production:v128 --country |
| BGD | country | BGD 선택 가능(공개 국가) | PASS | true | true |  |
