# 기대값 변경 — V162 (2026-09-30 입고 데이터 갱신)

| 대상 | 이전 기대 | 새 기대 | 사유 |
|---|---|---|---|
| `tools/etl/countries/bgd/verify_country_v2.cjs` `ROWS_PUBLISHED_EQUAL_SOURCE` | 요소별 원천 행 = 공개 행 | 원천 행 − 선언된 비공개 행(`quality-report.summary.rowExclusions`) = 공개 행 | 사용자 결정(V162): B-024 배분 추정 행 비공개. 규칙은 `config/data-publication/row-exclusions-v162.json` 1곳(모든 국가)이고, 빠진 행 수를 보고서에 남긴다 — 조용히 빠지는 행은 여전히 실패 |
| 같은 검증기 `NO_SOURCE_CELL_DROPPED` | 모든 요소의 개체 칸 수 일치 | 선언된 비공개 행이 있는 요소는 개체 칸 비교 제외(행 수 검사가 대신 셈) | 행 전체를 빼면 그 행의 칸도 빠진다. 다른 요소는 그대로 검사 |
| BGD 다운로드 `지역명_한글` | 사전의 모든 이름(검토 중 포함) | 확정(confirmed) 이름만, 없으면 원문 표기 | 화면(`formatRegionName`)은 검토 중 이름을 쓰지 않는다(사용자 2026-09-29). 다운로드도 같게 — B-012 신규 district 행(Cox's Bazar 등)에서 처음 드러남 |
| `scripts/v161/audit-source-notes-v161.mjs` 허용 목록 4건 | — | B-038 '현지조사 기준', E-004 '해당 없음 — 기관 운영 종료', E-007 '해당 없음 — 재정지원 과제', E-007 '[상충] 현지조사(… 결과 전달)는' | 새 자료의 데이터 값·값의 기준 구분(요소 한정). 출처 줄·다른 요소의 같은 말은 계속 실패 |
| E-012 semantic(`e012_decode_id`) | ILOSTAT 90개 지표 | + NSO(`_nat`)·ILO USD(`_usd`)·군인(ISCO 0)·분류불능(ISCO X), `source`·`currency` 차원 | 새 자료가 두 원천·두 통화를 함께 납품. 전용 화면은 ILOSTAT·VND만 비교(원천을 한 차트에 섞지 않음) |
| E-012 주석 검증(`validate_e012_notes`) | '직군: …·성별: …' 서식 | 위 서식 또는 새 서식('[원본: ILOSTAT …] … (ISCO-08 n) / 성별') | 새 납품의 주석 서식. 검증 강도는 같다(직군 번호·성별 일치) |
| '데이터 준비 중' 판정 | 기본 국가는 유형 명세(JSON) 고정값 | 모든 국가에서 catalog `publicStatus`로 판정 | 사용자 결정(V162): 판정은 catalog 1곳. 현 VNM 트리에서 판정 결과 차이 0(대조), E-011은 입고로 공개 전환 |
| 홈 '데이터 기준일' | `manifest.generatedAt`(ETL 고정값 2026-08-27) | `manifest.provenance.sourceDeliveredAt`(원자료 입고일, 국가별) | 사용자 결정(V162) |
