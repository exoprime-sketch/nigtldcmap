# 분석 요약 카드와 상세 분석 — 구현·검증 보고 (V140)

작성일: 2026-09-16 · 브랜치 `feat/home-map-analysis-v139` · 기준 문서 `output/public-review-20260916/REVIEW_AND_NEXT_STEPS.md`, `CLAUDE_IMPLEMENTATION_BRIEF.md` · 새 상단 탭 없음 · commit·push·PR·병합·배포는 별도 지시 범위(이 작업에서 push·PR·병합·배포하지 않음)

## 1. 수치 요약

| 항목 | 수 | 근거 |
| --- | ---: | --- |
| 카드 계약 작성·연결 | 152 / 152 (값 보유 147 · 상태 안내 5) | `card-summaries-v140.json`, `reports/v140/card-summaries-review-v140.md` |
| 카드 개선(새 카드 모델로 렌더) | finder 152 · 홈 8(선택 전달 추가) | `FinderCardSummaryV140`, `HomePage` |
| 상세 분석 개선(전용 컴포넌트·기본값·구조) | 12개 요소 전용 변경(A-003·A-023·A-024·B-021·B-031·B-032·B-033·B-034·C-009·C-010·C-016·D-023) + 아키타입 공통 변경(차원 선택기 2건, 포트폴리오 목록 16개 요소, 지도 버튼 5개 요소) | §3 |
| 실제 선택 조작 검증 | 120개 요소 · 272개 컨트롤 변경 시도 · 118개 요소 통과 · 2개 요소 무효과(A-022 세부 분류, B-036 연도) | `analysis-qa-v140-local-build.json` |
| 카드→상세 수치 대조 | 150 통과 · 0 실패 · 2 해당 없음(D-007 문장값, C-020 등 상태 카드 중 1) | 같은 파일 |
| 카드 선택→상세 유지 | 91 통과 · 0 실패 · 61 선택 없음(집계 카드) | 같은 파일 |
| 수치표 대조 | 59 통과 · 86 미검출 · 7 해당 없음 | 상세의 원자료 표는 행 단위라 산출값(합계·중앙값·구성)이 표에 없는 경우가 대부분. 표 대조는 '표로 보기'가 있는 화면(성·시 분석 등)에서만 성립 |
| 지도 연계 | 42 / 42 연결 자료 모두 상세→지도에서 보기→레이어 표시 확인 · B-017 준비 중 | 같은 파일 |
| 지도 대상 | 43개 중 연결 42 · 요구 충족 판단은 §5 | `reports/v138/map-targets-v138.md` |
| 152개 경로 로딩 | 152 / 152 (분석 루트 ready + 지연 로딩 placeholder 0 + 콘솔 오류 0 + 필수 자산 실패 0) | 같은 파일 |
| 기존 감사 | 29개 PASS(`tmp/audits-3.txt` → `reports/v13x/*.json`), role-split 52/52, 단위 30/30 | |
| 전체 gate `finalize:v136` | §6 | `reports/v136/release-audit-v136.json` |

## 2. 카드 모델(§1·§2)

- 공통 로더 `scripts/v140/card-model-v140.mjs`가 상세 화면과 같은 행 모델(측정항목 키·차원·연도)을 만들고, `build-card-summaries-v140.mjs`가 152개 요약을 생성한다. 요소별 규칙은 코드에 명시(`OVERRIDES` 27건, `ENTITY_RULES` 52건, `COMPOSITION_ALLOWED` 3건, `REGIONAL_LAYERS` 7건, `REGION_SCENARIO` 5건). 홈 8개는 홈 자산을 그대로 복사.
- 종류 분포: line 33 · level 18 · composition 5 · bars 34 · spatial 10 · spatial-trend 5 · facts 39 · status 5 · 홈 전용(signed-bars·grouped-bars·map) 3. 파이/도넛 없음. 값 없는 5개는 상태 문구만.
- 카드 순서(finder): 데이터명 → 확인할 수 있는 내용 한 문장 → 핵심값·단위·기준연도/기간·대상 → 미니 분석 → 자료기간·제공기관 → 상세보기(+지도에서 보기/다운로드). 1440px 3열(1240px 이상), 중간 2열, 모바일 1열. 측정항목 태그('성×시나리오×연도 개체 목록' 등 내부 구조 문구) 제거. 제공기관은 보통 굵기·3줄 제한.
- 각 카드의 `selection`(measure·year·period·dim.*)을 상세로 넘긴다. 상세가 선택지로 제공하지 않는 차원(값 1개, technology)은 넘기지 않는다.

## 3. 상세 분석(§3·§4)

| 요소 | 처리 |
| --- | --- |
| A-002 | 홈 Estimate 클릭 → `dim.wgiMeasure=est`·2024 전달, 상세는 표준값 척도로 6부문·추이 |
| A-003 | 기본 측정항목 GDP 총액(명목 USD). 카드 514.7(10억) ↔ 상세 5,146.97억 USD |
| A-010 | 유지. 카드 582.7 Mt CO₂eq ↔ 상세 동일 |
| A-016 | 유지(구성 카드는 총계 제외 6개 부분) |
| A-023 | WRI `primaryFuel` 매핑으로 '미표기 236행' 해소. 발전원별 시설 수·설비용량을 원천별 표로, 합산 없음. 카드 41,350 MW ↔ 상세 WRI 설비용량 합계 |
| A-024 | `TransmissionNetworkSummaryV140`: 2016년 실재 606구간·23,608 km(전압별 구간·연장·비중)와 PDP8 116행(기존 48·계획 68, 경로 없음) 분리. '722건 · 2016' KPI 제거 |
| B-004~007 | 기존 지역·시나리오 분석 유지. 카드는 63개 성·시 중앙값 추이(SSP2-4.5)와 10~90분위, 자료기간 '1950–2100년 (과거 모형 1950–2014 · 전망 2015–2100)'. B-005 CDD·SPEI 분리는 기존 계약 유지 |
| B-021 | 기본 측정항목 GVI 취약성 지수(현재·국가). 차원 선택기가 선택한 측정항목의 값만 보여 권역/SSP 혼재 해소 |
| B-033 | `ProvinceSeriesAnalysisV140`: 카드 지역(Quảng Ninh)·연도 전달 → 지역 추이(2001–2024) → 2024년 성·시 비교(선택 지역 표시) → 표. 성·시 값 합산 없음 |
| C-016 | 같은 컴포넌트: 항목(8개 기술)·지역·기간 선택, 63개 성·시 합계(계획 용량, 실적 아님) 27,385 MW ↔ 카드. 기본 항목 집중형 태양광 |
| D-005 | 유지. 카드 자료기간 '2010·2013·2020년'(연속 계열 아님) |
| D-011 | 유지 |
| D-018 | 카드 headline은 베트남 단독사업 승인액(1,135만 USD); 다국가 총액과 분리 |
| D-023 | 71개 개별 사업과 집계·설명 행 2건을 목록에서 분리(`portfolio-aggregate-rows-v140`) |
| E-008 | 국가 통계와 선별 목록 144건 구분 문구, 분류 중복 계산·구성비 아님 명시 |
| E-012 | 유지(카드 총 취업자 수 2023) |
| C-009/C-010 | `DocumentTimelineV140`: 문서 단위 54·41건, 시행(발효)일 순, 주무기관·위계·현행 여부는 짧은 목록, 원문 링크 행 부착 |
| D-012/E-018/E-020 | 목록 필터명 '기술분야·진출국', '업종·진출형태', '지원유형·지원기관'. D-012 분석 제목은 원자료 제목 그대로(긴 콜론 목록)라 잔여 |
| C-020/021/023·E-011/013 | 상태 안내 유지, 수치·차트 없음 |

## 4. 지도(§5)

- 43개 대상·7분류·다중선택·resize·drawer 유지. 추천 분석은 목록 위 짧은 행. 우측 패널 순서: 선택 대상 → 전국 요약 → 지표 읽는 법 → 자료정보(현재 분석 메타, 선택 후 접힘).
- 레이어명: B-029 이탄지 면적(산림 유형별 면적 중), B-039 수력 이론 잠재량, B-040 지열 자원(심도별 지온).
- 연결 42 / 미연결 1(B-017). 요구 충족: B-017(평가구역 경계 미확보), B-023/025/028(유역 경계 미전달, 대표점은 속이 빈 기호로 구분·제한 명시) 미충족 유지. B-021 6권역·C-012/013/019/022 34개 단위 값은 카드에서 합산·순위화하지 않음(facts 카드).

## 5. 검증 방법(§7)

- `scripts/v140/analysis-qa-v140.mjs`: 카드 선택을 URL로 넘겨 152개 상세를 열고 ready·지연 로딩·콘솔·필수 자산 실패·HTML-for-JSON을 검사, 카드 핵심값을 상세 본문·표에서 수치 대조(억·만·조 환산 허용, 반올림 0.6%), 선택 유지 대조, 주 분석의 select 컨트롤을 하나씩 바꿔 본문 변화를 확인(컨트롤마다 원상 복구), 지도 연계는 실제 클릭 후 레이어 표시 확인.
- `e2e/helpers.ts`: 필수 bundle·data·JSON 요청 실패와 JSON 대신 HTML 응답을 기록(404 일괄 무시 제거). 로컬 Playwright 214/214(변경 전 후보 기준 실행; 후보 재생성 후 재실행은 §6).
- 해상도: role-split QA 1440, 홈 QA(v139) 390/768/1024/1440/1920 PASS, finder 390/1440 캡처(`reports/v140/screenshots/`), 지도 QA(v138)는 gate에 포함.

## 6. 로컬 / Preview / production

| 대상 | 상태 |
| --- | --- |
| 로컬 build | analysis QA 152/152 로딩, 카드 대조 150/150, 선택 유지 91/91, 컨트롤 118/120, 지도 42/42 · 감사 29개 PASS · role-split 52/52 · `finalize:v136` §7 |
| Preview | 이 작업의 커밋은 push 전이라 Preview 없음. 직전 Preview(e1138c4)는 SSO 보호로 자동 검사 불가(bypass secret 미제공). push 후 `node scripts/v140/analysis-qa-v140.mjs --base-url <preview> --label preview`와 `qa:role-split:v140`으로 같은 검사 실행 필요 |
| production | 미반영(sha 16b3ada, 12개 레이어) |

## 7. 잔여 문제

1. A-022 '세부 분류', B-036 '연도' 선택이 주 분석 본문을 바꾸지 않음(아키타입 범용 선택기; 2/120).
2. 수치표 대조 86건 미검출: 원자료 표에는 행 값만 있어 산출값(합계·중앙값·구성)이 표에 없음. 분석별 표(표로 보기)는 성·시 분석·A-002·E-012 등에서만 제공.
3. D-012 분석 제목이 원자료의 긴 콜론 목록 제목(`elementPresentationRegistryV100` `titleKo`) 그대로.
4. B-017 평가구역 경계, B-023/025/028 유역 경계 미확보(§4).
5. Linux Playwright 시각 baseline(홈·finder)은 CI artifact 검토 후 갱신 필요; 이번 변경으로 finder 카드가 바뀌어 `finder-chromium-linux.png`도 갱신 대상.
6. 카드 kind 'facts' 39건은 등록부 성격상 수치 미니 분석 없이 대표 항목 목록임(정책·기관·문서). 정책형은 문서 수·대표 문서만 제시.

## 8. 실행 명령

```
node scripts/v140/build-card-summaries-v140.mjs
node scripts/generate-vietnam-asset-integrity-v133.mjs --data public/data/vietnam/v2
npm run build
node scripts/v140/analysis-qa-v140.mjs            # reports/v140/analysis-qa-v140-local-build.{json,md}
npm run qa:role-split:v140
npm run finalize:v136
```
