# REVIEW V160 — 핵심 정보 우선

브랜치 `feat/v160-core-first`(origin/main 2690675에서 분기). 상세 원칙·측정: `docs/CORE_FIRST_V160.md`. 기대값 변경: `reports/v160/EXPECTATION_CHANGES_V160.md`.

## 변경

- A 등급·질문 데이터: 기획서 §3 → `informationTiersV160.json`(핵심 57·보조 50·참고 34·비공개 11), `homeQuestionsV160.json`, `mapDefaultLayersV160.json`(20). 생성·검사 `build:/check:core-first:v160`
- B 홈: 주요 데이터 8그리드·정렬 제거 → 질문 6카드(대표 KPI는 카드 요약 값만, ④·⑤ 숨김), 통계 수는 공개 목록 기준
- C 데이터 찾기: 기본 핵심 57, '전체 보기'(`tier=all`) 141, 등급·유형 배지, 보조·참고 KPI 한 줄
- D 상세 3층: 1층 상시(히어로·판단 포인트 2열·1순위 차트|지도), 2층 '데이터 설명'(핵심 수치 띠 포함), 3층 '다운로드·참고문헌'(출처·상세 표) — `<details>`·aria-expanded·전역 기억·인쇄 펼침
- E 지도: '핵심 레이어' 20 기본 + '더 많은 레이어' 아래 6분류(`mapList=all` 펼침). map-index·빌더·렌더러 불변
- F QA `qa:core-first:v160`, 감사 진입 URL `tier=all`/`mapList=all`, role-split 홈 검사 질문 6카드 기준 이관, 추적표 '등급(V160)' 열, CHANGELOG

## 검증

| 항목 | 결과 |
|---|---|
| tsc | 오류 0 |
| test:unit | 561/561 |
| qa:core-first:v160 | 8/9 — 상세 1층 ≤1.5화면만 실패(2/12) |
| qa:typology:v159 | 152/152 |
| qa:detail-contract:v153 | 152/152 |
| 6폭 넘침(6화면) | 0 |
| 콘솔 오류 | 0 |
| finalize:v151 1회차 | 실패 — entity-cards:v131(D-024·E-008) → 이후 감사 미실행 |
| finalize:v151 2회차 | 실패 — temporal-depth:v135 GHG_ANALYTICAL_VIEW(C-002). 그 앞 감사 전부 통과(release 60/63) |
| 사후 개별 확인 | entity-cards 17/17 · portfolio 12/12 · glossary 16/16 · map-list-ui 19/19 · temporal-depth 11/11 · finder-scroll 13/13 · human-review 10/10 · generic-detail 20/20 · finder-card 12/12 |
| 게이트 3회차 | 미실행 — CLAUDE.md "2회 초과 반복 시 멈춤". 승인 시 1회 실행 |

## 측정(전후)

- 홈 본문 단어 535 → 203(−62.1%). 첫 뷰포트 단어 112 → 111(히어로·검색 유지로 거의 불변)
- 데이터 찾기 기본 카드 152 → 57
- 상세 1층 하단/800px: 1.24~13.85(통과 B-002·D-011). 1차 분석 영역 전체는 1.85~13.85
- 지도 레이어 목록 첫 화면: 6분류(42) → 핵심 레이어 20 + 더 많은 레이어(접힘)

## 게이트 실패 원인(V160 이전 누적분)

- 세 건 모두 PR #32 merge 직전 결정(제외 10건 ⓪ 통일, C-002 ⑥ 숫자 차트 없음)이 게이트 재실행 없이 반영된 결과. V160 코드 탓이 아님
- 조치: entity-cards·portfolio는 ⓪ 유형 제외(E-008은 상태 화면 판정), temporal-depth는 C-002 타일 목록 인정. 사유는 EXPECTATION_CHANGES_V160.md
- 사전 점검에서 V160 자체 결함 2건도 발견·수정: 지도 펼침 플래그 `layers=all`이 기존 `layers` 파라미터와 충돌 → `mapList=all`; 홈 질문 설명 NDC·C-002 ktCO₂e 용어 도움말 누락
- main CI도 같은 원인으로 빨강일 가능성 — 이 PR merge가 fix-forward

## 미완료와 사유

- 상세 1층 ≤1.5화면 10/12 미달: 1순위 블록이 히어로·판단 포인트 아래에서 시작하고, C-009(13.85)·C-012(3.66)는 1순위 블록 자체가 여러 화면. 분석 영역 분리(2순위 이하 → 2층)는 D1 프레임·상세 감사 기대 변경이 필요해 이번 PR에서 보류. 선택지: 1순위 블록 높이 상한+더 보기 / 2순위 이하 2층 분리 / 판단 포인트 히어로 옆 배치
- 홈 첫 뷰포트 단어는 줄지 않음(카드 설명·KPI가 기존 그리드 자리를 채움)
- 데이터 찾기 전체 141 ≠ 기획서 142: 미입고 C-021도 ⓪이라 숨김
- 대표 KPI ④ 발전소 수·⑤ GCF 승인액: 카드 요약에 값 없음 → 숨김(추정 금지)
- 2층 '2순위 차트·연관 데이터 칩': 연관 데이터 패널은 현재 없음(V157) → 해당 없음, 2순위 차트는 위 보류와 같음
- 카탈로그 공개·다운로드 제외는 세션5 PR 몫. 그 PR merge 후 rebase 시 "informationTiersV160 hidden == 카탈로그 excluded/not-provided" 단위 테스트 추가 예정
