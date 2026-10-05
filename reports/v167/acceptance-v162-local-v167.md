# 통합 인수 게이트 결과(qa:acceptance:v162)

- 판정: **FAIL** · 통과 29 · 실패 1 · 예상 실패 0 · 건너뜀 1 (총 31)
- 국가: VNM, BGD · 공개 전 폴백 검사: (없음)
- 예상 실패 허용: 지도 준비 중 0건

| 국가 | 영역 | 검사 | 판정 | 실측 | 기준 | 재사용 |
|---|---|---|---|---|---|---|
| VNM | finder | 찾기 목록 = 카탈로그 공개 요소 | PASS | {"total":141,"cards":141} | 141 |  |
| VNM | finder | 2026년 제외 요소 비노출(찾기) | PASS | [] | [] |  |
| VNM | finder | '데이터 준비 중' 카드 = 카탈로그 미입고 상태 | PASS | [] | [] |  |
| VNM | finder | 미입고 상세의 '데이터 준비 중' 안내 | PASS | [] | [] |  |
| VNM | finder | 찾기 기본 정렬 = 가나다순(미입고는 끝) | PASS | {"mode":"name","nameSorted":true,"preparingLast":true,"cards":141,"first":["A-016","D-003","B-005"]} | {"mode":"name","nameSorted":true,"preparingLast":true} |  |
| VNM | finder | 조회순 선택 시 조회수 순으로 순서 변경(시험 조회수 주입) | PASS | {"enabled":true,"mode":"views","orderMatches":true,"orderChanged":true,"first":["E-009","A-015","A-013"]} | {"mode":"views","orderMatches":true,"orderChanged":true} |  |
| VNM | finder | 명세 유형의 data-pending = 카탈로그 미입고(단일 출처) | PASS | [] | [] | src/data/spec/datasetTypologyV159.json |
| VNM | finder | 제외 요소 전 화면 비노출(audit:exclusions:v156) | SKIP | the audit reads build/ only | --build build | audit:exclusions:v156 |
| VNM | wording | 다른 나라 국명 0(홈·찾기·지도·다운로드·이용안내·상세 전체, 국가 비교 절 제외) | PASS | {"hits":0,"detailPages":141,"first":[]} | {"hits":0,"terms":["방글라데시","Bangladesh"]} | reports/v162/other-country-names-v162.json |
| VNM | wording | 다른 나라 고유 행정 표현 0(레지스트리 adm.publicTerms, 국명 검사와 같은 화면·예외) | PASS | {"hits":0,"detailPages":141,"first":[]} | {"hits":0,"terms":["주(Division)","Division"]} | reports/v162/other-country-admin-terms-v162.json |
| VNM | numbers | 홈 전체 데이터 항목 = 카탈로그 공개 요소 | PASS | 141개 | 141 |  |
| VNM | numbers | 홈 지도 제공 항목 = map-index 활성 레이어 | PASS | 72개 | 72 |  |
| VNM | numbers | 홈 다운로드 가능 항목 = 다운로드 허브 규칙(hasDownloadableData) | PASS | 141개 | 141 |  |
| VNM | numbers | 다운로드 목록 = 카탈로그 공개 요소(제외 0) | PASS | 141 | 141 |  |
| VNM | numbers | 데이터 기준일 = 원자료 입고일(국가별 provenance) | PASS | {"shown":"2026.09.30","manifestGeneratedAt":"2026-09-30T00:00:00Z"} | {"deliveredAt":"2026-09-30","source":"manifest.provenance.sourceDeliveredAt"} |  |
| BGD | finder | 찾기 목록 = 카탈로그 공개 요소 | PASS | {"total":141,"cards":141} | 141 |  |
| BGD | finder | 2026년 제외 요소 비노출(찾기) | PASS | [] | [] |  |
| BGD | finder | '데이터 준비 중' 카드 = 카탈로그 미입고 상태 | PASS | ["B-045"] | ["B-045"] |  |
| BGD | finder | 미입고 상세의 '데이터 준비 중' 안내 | PASS | ["B-045"] | ["B-045"] |  |
| BGD | finder | 찾기 기본 정렬 = 가나다순(미입고는 끝) | PASS | {"mode":"name","nameSorted":true,"preparingLast":true,"cards":141,"first":["A-016","B-005","A-010"]} | {"mode":"name","nameSorted":true,"preparingLast":true} |  |
| BGD | finder | 조회순 선택 시 조회수 순으로 순서 변경(시험 조회수 주입) | PASS | {"enabled":true,"mode":"views","orderMatches":true,"orderChanged":true,"first":["E-009","A-015","A-013"]} | {"mode":"views","orderMatches":true,"orderChanged":true} |  |
| BGD | wording | 다른 나라 국명 0(홈·찾기·지도·다운로드·이용안내·상세 전체, 국가 비교 절 제외) | PASS | {"hits":0,"detailPages":141,"first":[]} | {"hits":0,"terms":["베트남","Viet Nam"]} | reports/v162/other-country-names-v162-bgd.json |
| BGD | wording | 다른 나라 고유 행정 표현 0(레지스트리 adm.publicTerms, 국명 검사와 같은 화면·예외) | FAIL | {"hits":1,"detailPages":141,"first":["detail:B-039:EVN «r·백만 kW) — Hoes 외 전지구 수력 총잠재량 전국 계열(IHA·EVN·Energy Institute·U.S.\"대상국의 수력 기술 잠재량은 문»"]} | {"hits":0,"terms":["성·시","34개","63개","개편 전","개편 후","PDP8","EVN","QĐ-TTg"]} | reports/v162/other-country-admin-terms-v162-bgd.json |
| BGD | numbers | 홈 전체 데이터 항목 = 카탈로그 공개 요소 | PASS | 141개 | 141 |  |
| BGD | numbers | 홈 지도 제공 항목 = map-index 활성 레이어 | PASS | 51개 | 51 |  |
| BGD | numbers | 홈 다운로드 가능 항목 = 다운로드 허브 규칙(hasDownloadableData) | PASS | 99개 | 99 |  |
| BGD | numbers | 다운로드 목록 = 카탈로그 공개 요소(제외 0) | PASS | 141 | 141 |  |
| BGD | numbers | 데이터 기준일 = 원자료 입고일(국가별 provenance) | PASS | {"shown":"2026.09.30","manifestGeneratedAt":"2026-09-29T00:00:00Z"} | {"deliveredAt":"2026-09-30","source":"manifest.provenance.sourceDeliveredAt"} |  |
| BGD | country | BGD 선택 가능(공개 국가) | PASS | true | true |  |
| VNM | country | 모든 국가 선택기에서 live 국가 선택 가능(홈·찾기·지도·다운로드·이용안내, 상세는 있을 때) | PASS | {"problems":[],"selectors":{"home":2,"finder":2,"map":2,"download":2,"guide":1,"detail":2}} | {"problems":[],"live":["VNM","BGD"]} |  |
| BGD | country | 모든 국가 선택기에서 live 국가 선택 가능(홈·찾기·지도·다운로드·이용안내, 상세는 있을 때) | PASS | {"problems":[],"selectors":{"home":2,"finder":2,"map":2,"download":2,"guide":1,"detail":2}} | {"problems":[],"live":["VNM","BGD"]} |  |
