# V160 기대값 변경 기록

CLAUDE.md 규칙(기대값 변경은 사유를 reports에 기록)에 따른 목록.

| 날짜 | 위치 | 이전 | 이후 | 사유 |
|---|---|---|---|---|
| 2026-09-24 | `scripts/v135/audit-helpers.mjs`(finderUrlV135·mapUrlV135·revealMapDatasetExpressionV138), v129/v133/v134 지도 URL, finder-card-v135·finder-scroll-v136·human-review-v136·release-v136·glossary-v134·public-text-v136·screen-usability-v136-4·analysis-qa-v140·role-split-qa-v140 진입 URL | 기본 URL = 데이터 찾기 전체·지도 모든 분류 펼침 | 데이터 찾기 `tier=all`, 지도 `mapList=all`로 진입 | V160 기본 화면이 핵심 57·핵심 레이어로 바뀜. 사용자 결정(1): 기존 감사는 '전체 보기' 상태에서 같은 기준으로 판정, 기본 57은 신규 `qa-core-first-v160`이 확인 |
| 2026-09-24 | 데이터 찾기 전체 카드 수(finder-card·finder-scroll·release·role-split `FINDER_TOTAL_152`·glossary) | 152(고정값) | 141(`informationTiersV160.json`에서 hidden 제외로 산출, `scripts/v160/core-first-audit-v160.mjs`) | ⓪ 상태 요소 11건(제외 10 + 미입고 C-021)은 찾기 목록에서 숨김(상세 URL은 유지). 기획서의 142(=152−10)와 1건 차이 — C-021 미입고도 ⓪이라 hidden. 자동 로드 단계 24·48·72·96·120·141 |
| 2026-09-24 | `role-split-qa-v140` HOME 항목 | 주요 데이터 그리드·정렬·카드 제목 검사 | HOME_QUESTIONS_SIX·TITLES·KPI·COUNTS·OPENS_FINDER·NO_OVERFLOW | 사용자 결정(2): 홈이 질문 6카드로 바뀜. 카드 6·대표 KPI 표시·클릭 시 찾기 이동·제목 규칙 동일 기준으로 이관 |
| 2026-09-24 | `analysis-qa-v140` 홈 카드·찾기 카드 판정 | 홈 카드 클릭(HOME_IDS)·⓪ 카드 찾기 노출 | HOME_IDS 빈 목록(홈에 데이터 카드 없음), ⓪ 요소는 찾기 미노출이 정상(cardClicked null·상태 표시 true) | 홈 개편·⓪ 숨김. 판정 대상 데이터(분석 블록) 기준은 불변 |
| 2026-09-24 | `glossary-v134` 홈 준비 선택자 | 주요 데이터 카드 | 질문 카드 버튼 포함 | 홈 구성 변경. 용어 검사 기준 불변 |
| 2026-09-24 | 지도 분류 그룹 | 6분류 펼침 | '핵심 레이어'(20, `mapDefaultLayersV160.json`) + '더 많은 레이어' 아래 6분류 | 기획 §1.4. map-index·빌더·렌더러 불변 |
| 2026-09-24 | `qa-core-first-v160` 홈 단어 수 기준 | (신규) | 홈 본문 전체 단어 수 −50% 판정, 첫 뷰포트(1440×900) 단어 수는 기록만 | P11 F항 "홈 … 본문 단어 수 −50%". 첫 뷰포트 기준은 112→111로 거의 불변 — 보고서에 그대로 표기 |
| 2026-09-24 | `qa-core-first-v160` 상세 1층 높이 | (신규) | 1층 = 제목·판단 포인트·1순위 차트\|지도 자리(기획 §D) 하단 기준, 1차 분석 영역 전체 하단은 기록만 | 기획서 1층 정의. 2순위 이하 차트는 기획상 2층이지만 이번 PR에서는 분석 영역 분리 미실시(D1 프레임·상세 감사 영향) — 미완료로 보고 |
| 2026-09-24 | `scripts/audit-vietnam-entity-cards-v131.mjs` 대상 요소 | 레코드가 있고 카드형 렌더러인 요소 전부(56) | ⓪ 유형(`datasetTypologyV159.json` displayType U0) 제외 — 기존 `status-only` 렌더러 제외와 같은 취급 | V159 PR #32 결정(제외 10건 ⓪ 통일)으로 D-024·E-008은 상태 안내 화면만 표시. #32는 이 결정 뒤 전체 게이트를 다시 돌리지 않아 V160 게이트 1회차에서 처음 드러남. 판정 기준(카드 렌더링·중복·넘침)은 불변 |
| 2026-09-24 | `scripts/audit-vietnam-portfolio-analysis-v132.mjs` 대상·E-008 검사 | 포트폴리오 렌더러 요소 전부 + E-008 연구 분석 순서 | ⓪ 유형 제외, E-008이 ⓪이면 E008_ANALYSIS_BEFORE_LIST·RESEARCH_LIST_BEFORE_ANALYSIS는 "상태 안내 화면 표시·연구 목록 없음"으로 판정 | entity-cards와 같은 사유(PR #32 제외 10건 ⓪ 통일). 판정 기준 자체는 ⓪이 아닌 요소에 그대로 적용 |
| 2026-09-24 | 지도 '모두 펼침' URL 플래그 | `layers=all`(V160 초안) | `mapList=all` | 기존 지도 상태 파라미터 `layers`(활성 레이어 목록)와 충돌 — App이 `layers=none`으로 다시 써서 감사에서 '더 많은 레이어'가 열리지 않음(map-list-ui 사전 점검에서 발견). 이름만 변경, 판정 기준 불변 |
