# REVIEW V160 — 핵심 정보 우선

브랜치 `feat/v160-core-first`(origin/main 2690675에서 분기). 원칙·등급 표: `docs/CORE_FIRST_V160.md`. 기대값 변경: `reports/v160/EXPECTATION_CHANGES_V160.md`.

## 변경

- A 등급·질문 데이터: 기획서 §3 → `informationTiersV160.json`(핵심 57·보조 50·참고 34·비공개 11), `homeQuestionsV160.json`, `mapDefaultLayersV160.json`(20). 생성·검사 `build:/check:core-first:v160`
- B 홈: 주요 데이터 8그리드·정렬 제거 → 질문 6카드(대표 KPI는 카드 요약 값만, ④·⑤ 숨김), 통계 수는 공개 목록 기준
- C 데이터 찾기: 기본 핵심 57, '전체 보기'(`tier=all`) 141, 등급·유형 배지, 보조·참고 KPI 한 줄
- D 상세
  - 1층(상시): 히어로 + 판단 포인트 칩 한 줄 → 분석 제목 한 줄 → 조건 선택·축 표기 한 줄 → 1순위 차트 | 지도
  - 2순위 이하 블록은 2층으로 접힘('차트 N개 더 보기', 2층 '데이터 설명'과 같은 열림 상태), 핵심 수치 띠도 2층
  - 3층 '다운로드·참고문헌'·'자료 출처·상세 데이터' 접힘, 열림 상태 전역 기억, 인쇄 시 전부 펼침
  - 긴 1층 목록: 문서 연대기(C-009 등) 최근 순 10건, PPP 비교표(C-012) 10행, 지역 순위 막대 상위·하위 10(1순위가 지역 막대면 5) + '전체 N개 보기', 목록 위 안내 1줄(기준연도·표시 건수). 높이 상한·내부 스크롤 없음
- E 지도: '핵심 레이어' 20 기본 + '더 많은 레이어' 아래 6분류(`mapList=all` 펼침). map-index·빌더·렌더러 불변
- F QA `qa:core-first:v160`, 감사 진입 URL `tier=all`/`mapList=all`/`detailLayers=all`(V159 배치에서 기존 기준 판정)

## 측정 — 상세 첫 화면·1층(1280×800, 12표본)

기준(2026-09-29 교체): (i) 판단 포인트 줄 하단 ≤ 800px 이고 1순위 블록 상단 < 800px (12/12 필수) · (ii) 일반 차트 1층 하단 ≤ 2.0화면 · 타임라인·표는 10건 + '전체 보기'.

| 표본 | 1순위 유형 | 1순위 상단 V159 → V160 | 판단 포인트 하단 V159 → V160 | 1층 하단/800 V159 → V160 |
|---|---|---|---|---|
| A-003 | line | 1156 → 619 | 866 → 431 | 2.13 → 1.46 |
| B-003 | region-bar | 1421 → 730 | 917 → 466 | 2.95 → 1.99 |
| A-018 | stacked-area | 1126 → 640 | 871 → 467 | 2.19 → 1.58 |
| A-023 | category-bar | 1261 → 680 | 910 → 448 | 2.64 → 1.89 |
| D-022 | category-bar | 1262 → 739 | 872 → 430 | 2.46 → 1.80 |
| C-009 | timeline | 1029 → 526 | 852 → 428 | 14.45 → 2.11 (10건 + 전체 보기) |
| A-016 | stacked-area | 1088 → 569 | 866 → 429 | 2.18 → 1.53 |
| D-011 | line | 1037 → 530 | 839 → 432 | 2.08 → 1.44 |
| A-002 | line | 1183 → 642 | 890 → 429 | 2.33 → 1.61 |
| E-012 | category-bar | 1161 → 651 | 860 → 430 | 2.42 → 1.79 |
| C-012 | comparison-table | 1181 → 697 | 917 → 525 | 4.22 → 2.02 (10행 + 전체 보기) |
| B-002 | category-bar | 1112 → 598 | (없음) | 1.83 → 1.19 |
| **판정** | | (i) 0/12 → **12/12** | | (ii) 일반 차트 1/10 → **10/10** |

- V159 값은 같은 정의로 `tmp/build-v159-review`에서 측정(1층 = 1순위 블록과 옆 지도 자리 중 아래쪽)
- B-003은 1.99로 기준에 근접(지도 자리 861px). 1순위 막대 상위·하위 5, 전체 63개('전체 보기' — 원자료가 개편 전 63개 성·시 단위라 34 환산하지 않음)

## 측정 — 홈·데이터 찾기·지도

- 홈 본문 단어 535 → 204(−61.9%), 첫 화면 112 → 112(상한 120 이내)
- 데이터 찾기 기본 카드 152 → 57, '전체 보기' 141
- 지도 레이어 목록 첫 화면: 6분류(42) → 핵심 레이어 20 + 더 많은 레이어(접힘)
- 접힘 영역 초기 aria-expanded=false 12/12, 6폭(320~1920) 가로 넘침 0, 콘솔 오류 0

## 분석 QA — main 대비 신규 실패 0

같은 스크립트·같은 기준선(`reports/v150/analysis-qa-baseline-v150.json`)으로 실행.

| 회차 | main(운영) | #34 | main 대비 #34 신규 | 로그 |
|---|---|---|---|---|
| main 병합 전(9-29 오전) | 필수 46 · 기준선 밖 A-010·D-023 + 11(제외 10건 시간 초과·C-021) · 카드 요약 해시 불일치 | 필수 35 · 기준선 밖 A-010·D-023 | 0 | `analysis-qa-main-prod-20260929.log` · `analysis-qa-pr34-20260929.log` |
| main(8c3bf66) 병합 후 | 필수 36 · 기준선 밖 A-010·C-021·D-023 · 해시 일치 | 필수 35 · 기준선 밖 A-010·D-023 | **0** | `analysis-qa-main-prod-merge-20260929.log` · `analysis-qa-pr34-merge-20260929.log` |

- A-010·D-023: 기존 실패(main 동일, #32 유래). #32 직전 보고서(a747d54)에서는 'parts named 4/4' 통과. #34 merge 직후 main에서 fix-forward PR — **정정(2026-09-29): #32가 아니라 V160이 analysis QA의 `HOME_IDS`를 비워 구성 항목 조회가 빈 것이 원인. main 대조도 V160 스크립트로 실행돼 같게 보였음. `reports/v160/FIXFORWARD_A010_D023.md`**
- #34 병합 후 실행은 8c3bf66 병합 시점. 이후 병합한 #38(fcc04f7)은 public/data/bgd·tools/etl/countries/bgd·reports/v158만 추가해 베트남 화면·코드·데이터가 같으므로 재실행하지 않음
- B-032(#34에서만 실패했던 1건): 목록 위 안내 1줄을 되살려 해결 — 아래 화면

## B-032 수정 전후

- 전: `reports/v160/screens/b032-rank-notice-before.png` — 연도 제목과 목록만, 안내 문장 없음
- 후: `reports/v160/screens/b032-rank-notice-after.png` — "2010년 기준 상위·하위 10개 성·시와 선택 지역입니다. 전체는 '전체 63개 보기'에서 확인할 수 있습니다." (문장 수치는 목록 접힘 값에서 생성, 화면 건수와 항상 일치)
- A-024 첫 화면: `reports/v160/screens/a024-first-screen-1280x800.png`

## 검증

### main 병합(c7c1d5e: 8c3bf66 · faf2894: fcc04f7) 후 게이트 — 로그 `reports/v160/gate/`

| 회차 | 단계 | 결과 | 로그 |
|---|---|---|---|
| 1 | finalize:v151 (verify → finalize:v136 → …) | 실패 — `exclusions:v156`(#36 감사, V160 이전 홈 그리드·찾기 142 기준) 6건 → release:v136 파생 4건 | `finalize-v151-merge-r1.log` |
| — | 사용자 결정: exclusions:v156 V160 이관 → `audit:exclusions:v156` 단독 | 13/13 | — |
| 2 | audit:release:v136 (실패 단계 단독 재실행) | 80/80 | `release-v136-merge-r2.log` |
| 2 | qa:role-split:v140 | 49/49 | `role-split-v140-merge.log` |
| 2 | qa:analysis:v140:baseline | main 대비 신규 0(위 표) | `analysis-qa-*-merge-20260929.log` |
| 2 | audit:boundary-34:v151 --skip-browser | 21 통과 · 1 건너뜀 | `boundary-34-v151-merge.log` |
| 2 | audit:boundary-policy:v151-2 | 24/24 | `boundary-policy-v151-2-merge.log` |

### 기타(최종 헤드 faf2894)

| 항목 | 결과 |
|---|---|
| tsc | 오류 0 |
| test:unit | 593/593 (신규: hidden == 카탈로그 excluded ∪ not-collected) |
| qa:core-first:v160 | 12/12 |
| qa:typology:v159 · qa:detail-contract:v153 | 병합 전 4건(320px 넘침) 수정 후 `--ids` 5/5 |

### 병합 전 경과(참고)

- finalize:v151 1·2·3회차 실패(entity-cards / temporal-depth / detail-hierarchy) → 단계별: detail-hierarchy 12/12 · duplicate-copy 0 · human-review 10/10 · release 79/79 · role-split 49/49

### main 병합 충돌 해소

- 8c3bf66(#33·#35·#36·#37) 병합 충돌 13건
  - 감사 스크립트 10: 제외 10건은 main 처리 채택(entity-cards·portfolio·temporal-depth는 main 파일 그대로), 찾기 건수는 V160(tier=all 141), 상세 경로 건수는 main 공개 집합(142), human-review 찾기 스크롤 한도도 141
  - HomePage: V160 질문 6카드 유지 · CHANGELOG: 양쪽 유지 · 추적표: main 표 + 등급(V160) 열 재생성
- fcc04f7(#38) 병합 충돌 1건: CHANGELOG 양쪽 유지
- V160 생성 자산(`build:core-first:v160 --check`)은 main 데이터 기준으로도 최신(재생성 결과 동일)

## 미완료와 사유

- 데이터 찾기 전체 141 ≠ 기획서 142: 미입고 C-021도 ⓪이라 숨김
- 대표 KPI ④ 발전소 수·⑤ GCF 승인액: 카드 요약에 값 없음 → 숨김(추정 금지)
- 2층 '연관 데이터 칩': 연관 데이터 패널이 현재 없음(V157) → 해당 없음
- 분석 제목은 히어로가 아니라 분석 영역 첫 줄로 병합: detail-hierarchy가 분석 영역 안 제목을 요구(기준 불변)
- A-010·D-023 analysisFit: #32 유래 기존 실패, #34 merge 직후 fix-forward PR — **정정(2026-09-29): #32가 아니라 V160이 analysis QA의 `HOME_IDS`를 비워 구성 항목 조회가 빈 것이 원인. main 대조도 V160 스크립트로 실행돼 같게 보였음. `reports/v160/FIXFORWARD_A010_D023.md`**
- (완료) "informationTiersV160 hidden == 카탈로그 excluded ∪ not-collected" 단위 테스트 — main 병합 시 추가
- 데이터 찾기 '핵심' 기본 필터·전체 보기 토글은 P12-B에서 공개 142 전체 + 정렬(가나다순/조회순)로 교체 예정(사용자 결정 2026-09-29)
