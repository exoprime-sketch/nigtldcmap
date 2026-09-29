# Fix-forward — A-010·D-023 analysisFit (V160 후속)

브랜치 `fix/v160-analysisfit-a010-d023` (main ff600a0 = #34 병합 직후에서 분기).

## 원인(진단 정정)

- 증상: analysis QA `A-010:analysisFit`·`D-023:analysisFit` — `afit missing: parts named (0/0)`
- #34 보고에서는 "#32 유래 기존 실패"로 기록했으나 **틀린 진단**이었다.
  - `scripts/v140/analysis-qa-v140.mjs`의 `HOME_IDS`는 a747d54·2690675(#32)·8c3bf66(main)에서 모두 홈 미리보기 전체 집합이었다.
  - V160(#34)이 홈 카드 클릭 검사를 끄려고 `HOME_IDS`를 빈 집합으로 만들었는데(`.filter(() => false)`), 같은 집합이 **구성형 카드의 구성 항목·단위를 홈 미리보기 자산에서 찾는 조회**에도 쓰이고 있었다. A-010·D-023 카드 요약은 `preview: { home: true }`라 구성 항목이 홈 미리보기에만 있어, 조회가 비어 `parts named (0/0)`가 됐다.
  - #34 작업 중 "main 대조" 실행도 #34 작업 트리의 스크립트(이미 V160 수정 포함)로 돌렸기 때문에 main에서도 같은 실패가 나온 것처럼 보였다.
- 화면 문제는 없다: A-010 CO₂·CH₄·N₂O·불소계 온실가스, D-023 GEF·GCF·CIF·Adaptation Fund 네 항목이 상세 1층에 모두 표시된다.

## 수정

- `HOME_PREVIEW_IDS`(홈 미리보기 전체)를 두고 카드 기대값 조회(구성 항목·단위)는 이것을 쓴다. `HOME_IDS`(빈 집합)는 홈 카드 클릭 검사에만 남긴다.
- 기대값을 완화한 것이 아니라 V160 이전의 조회 대상을 되살린 것이다: 구성 항목 4/4 요구가 다시 적용된다(더 엄격).
- 데이터 찾기·목록 파일, 화면 코드, 기준선 파일은 건드리지 않았다.

## 검증

| 항목 | 결과 |
|---|---|
| analysis QA `--only A-010,D-023` | A-010 afit=true(구성 4/4), D-023 afit=true, 기준선 대비 신규 0 |
| analysis QA 전체(`qa:analysis:v140:baseline`) | 통과 — 필수 실패 34(기준선 41 이내, #34 병합 시 35), 신규 0 · 로그 `reports/v160/analysis-qa-fixforward-20260929.log` |
