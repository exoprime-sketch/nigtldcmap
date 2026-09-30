# 통합 인수 게이트 결과(qa:acceptance:v162)

- 판정: **FAIL** · 통과 21 · 실패 1 · 예상 실패 3 · 건너뜀 1 (총 26)
- 국가: VNM · 공개 전 폴백 검사: BGD
- 예상 실패 허용: 지도 준비 중 12건 · data-date, c003-filename

| 국가 | 영역 | 검사 | 판정 | 실측 | 기준 | 재사용 |
|---|---|---|---|---|---|---|
| VNM | finder | 찾기 목록 = 카탈로그 공개 요소 | PASS | {"total":146,"cards":146} | 146 |  |
| VNM | finder | 2026년 제외 요소 비노출(찾기) | PASS | [] | [] |  |
| VNM | finder | '데이터 준비 중' 카드 = 카탈로그 미입고 상태 | PASS | ["C-023","E-011","E-013"] | ["C-023","E-011","E-013"] |  |
| VNM | finder | 미입고 상세의 '데이터 준비 중' 안내 | PASS | ["C-023","E-011","E-013"] | ["C-023","E-011","E-013"] |  |
| VNM | finder | 찾기 기본 정렬 = 가나다순(미입고는 끝) | PASS | {"mode":"name","nameSorted":true,"preparingLast":true,"cards":146,"first":["A-016","D-003","B-005"]} | {"mode":"name","nameSorted":true,"preparingLast":true} |  |
| VNM | finder | 조회순 선택 시 조회수 순으로 순서 변경(시험 조회수 주입) | PASS | {"enabled":true,"mode":"views","orderMatches":true,"orderChanged":true,"first":["E-009","A-015","A-013"]} | {"mode":"views","orderMatches":true,"orderChanged":true} |  |
| VNM | finder | 명세 유형의 data-pending = 카탈로그 미입고(단일 출처) | PASS | ["C-023","E-011","E-013"] | ["C-023","E-011","E-013"] | src/data/spec/datasetTypologyV159.json |
| VNM | finder | 제외 요소 전 화면 비노출(audit:exclusions:v156) | PASS | {"status":"PASS","failedChecks":[]} | PASS | audit:exclusions:v156 |
| VNM | map | 지도 대상·연결 수 = map-index 실측 | PASS | {"target":72,"connected":60,"pending":12,"pendingBadges":12} | {"target":72,"connected":60} |  |
| VNM | map | 지도 '준비 중' 0 (예상 실패 허용 12건) | 예상 실패 | {"pending":12,"badges":12,"ids":["A-013","A-022","B-002","B-024","B-035","B-036","B-044","B-046","B-047","C-003","C-006","C-017"]} | {"pending":0,"expectPending":12} |  |
| VNM | map | 활성 레이어 전부 렌더·클릭(qa:map:v138) | PASS | {"active":60,"rendered":60,"clicked":60,"internalPhraseLayers":[],"consoleErrors":0,"httpFailuresExceptTiles":0} | {"layers":60} | qa:map:v138 |
| VNM | wording | 내부 작업 메모 0(홈·찾기·상세·다운로드·지도, #42) | PASS | {"findings":0,"detailPages":146,"runtimeErrors":0} | {"findings":0} | audit:source-notes:v161 |
| VNM | wording | 식별자·파일명·작업 어휘 0(지도 목록·정보·선택 패널·연관 카드·상세, #47) | PASS | {"findings":0,"elements":[],"exceptions":0,"scanned":798} | {"findings":0,"exceptions":0} | public-wording-scan-v157 |
| VNM | wording | C-003 상세의 파일명 0(V162에서 수정) | 예상 실패 | ["file-name:NAP_Vietnam_2025_EN.pdf","file-name:NAP_Vietnam_2025_VN.pdf","file-name:nap_report_eng_small.pdf"] | [] | public-wording-scan-v157 |
| VNM | wording | 다른 나라 국명 0(홈·찾기·지도·다운로드·이용안내·상세 전체, 국가 비교 절 제외) | FAIL | {"hits":34,"detailPages":146,"first":["guide:방글라데시 «획Integrated Energy and Power Master Plan방글라데시 정부가 수립한 에너지·전력 부문 중장기 기본계획입니다.IFAD국제농업개»","detail:A-022:방글라데시 «iness)의 2014~2019년 값으로 각국 최대 상업도시 기준이다. 방글라데시는 SAIDI·SAIFI  | {"hits":0,"terms":["방글라데시","Bangladesh"]} | reports/v162/other-country-names-v162.json |
| VNM | wording | '핵심' 표현 0(지도 화면, scan-core-word-v157) | PASS | {"hits":[],"layers":72} | {"hits":[]} | scan-core-word-v157 |
| VNM | numbers | 홈 전체 데이터 항목 = 카탈로그 공개 요소 | PASS | 146개 | 146 |  |
| VNM | numbers | 홈 지도 제공 항목 = map-index 활성 레이어 | PASS | 60개 | 60 |  |
| VNM | numbers | 홈 다운로드 가능 항목 = manifest | PASS | 143개 | 143 |  |
| VNM | numbers | 다운로드 목록 = 카탈로그 공개 요소(제외 0) | PASS | 146 | 146 |  |
| VNM | numbers | 데이터 기준일 = 원자료 입고일(국가별 provenance) | 예상 실패 | {"shown":"2026.08.27","manifestGeneratedAt":"2026-08-27T00:00:00Z"} | {"deliveredAt":null,"source":"(provenance 없음 - V162에서 추가)"} |  |
| VNM | widths | 6폭(320·390·768·1024·1440·1920) 가로 넘침 0 | PASS | {"combinations":42,"overflowing":0,"failing":[]} | {"overflowing":0} | review-runtime-v150 --only responsive |
| VNM | smoke | 운영 smoke(국가별, 이 빌드) | PASS | {"exit":0,"runtimeFailure":null,"routeFailures":0,"assetFailures":0,"consoleErrors":0} | {"exit":0} | smoke:production:v128 --country |
| BGD | country | ?country=BGD: 공개 전 폴백 · 다른 나라 표현 0 | PASS | [] | [] |  |
| BGD | country | ?country=BGD: 기본 국가 목록으로 폴백 | PASS | 146 | 146 |  |
| BGD | smoke | 운영 smoke(국가별) | SKIP | 공개 전(preparing) - 공개 후 실행 | live | smoke:production:v128 --country |
