# 분석 요약 카드와 상세 분석 — 구현·검증 보고 (V140, 독립 검토 반영판)

작성일: 2026-09-16 · 브랜치 `feat/home-map-analysis-v139` · 기준 문서 `output/public-review-20260916/REVIEW_AND_NEXT_STEPS.md`, `CLAUDE_IMPLEMENTATION_BRIEF.md`, 독립 검토 후속 지시(2026-09-16) · 새 상단 탭 없음 · commit·push·PR·병합·배포는 별도 지시 범위(이 작업에서 push·PR·병합·배포하지 않음)

## 0. 결론

| 구분 | 결과 |
| --- | --- |
| 로컬 build 필수 실패 | **0건** (152개 요소, `reports/v140/analysis-qa-v140-local-build.json`, exit 0) |
| 전체 gate `finalize:v140` | `finalize:v136` 79/79 PASS · role-split 52/52 PASS · analysis QA 152개 (§7) |
| Preview / production | 검사하지 않음(push 전) — §8 |
| 미검증(해당 없음) | PASS로 세지 않음. 각 항목에서 따로 표기 |

## 1. 독립 검토 지적 항목의 처리

| 지적 | 처리 | 카드 ↔ 상세 (검증값) |
| --- | --- | --- |
| E-019 대표 수치 | 원천이 '사무소 미설치'로 표시한 기관은 사무소로 세지 않음. 카드 **6곳 현지 사무소 · 사무소 없는 기관 3곳은 별도** (`basis.count {installed 6, notInstalled 3, rows 9}`) | 상세 '기관 디렉터리 · 현지 사무소 6곳' · 재계산 행 기준 9 = 9 |
| E-020 집계 | 지원제도 1개 = 같은 제도명(' — ' 앞). 카드 **3개 지원제도 · 활용 사례 7건** | 상세 '지원제도 수 3개 · 총 활용 사례 수 7건' |
| B-004 출처 | 제공기관은 카드가 보여준 계열의 지표 메타 `sourceOrg`. 카탈로그 기관 목록 앞 2개 절단 제거 | **World Bank CCKP (CMIP6 x0.25)** (B-003은 CRU TS, B-005~007 CMIP6) |
| E-004 'orgType별' | `GROUP_LABELS`로 내부 키를 공개 명칭으로(orgType→기관 유형, city→도시, category→분류 …). 키가 새면 빌더 경고. 152개 카드 전수: 내부 키 노출 0 | '17곳 현지사무소 수 · 기관 유형별' · 제공기관 '기관별 공식 출처 19개(상세 자료정보 참조)' |
| B-036 연도 선택기 | kpi-trend 아키타입에서 연도 2개(2020·2024)인 경우 주 분석 = 선택연도 토지 유형별 변화율 비교(선택 연도 문장 명시), 두 시점 변화는 추이 패널. 제목 '토지 유형별 이용·피복 변화율과 두 시점 변화' / '선택연도 토지 유형별 변화율 비교' | 2024 → 2020 선택 시 주 분석 수치 변경 확인(농지 1.789 → 2.049 %/yr) |
| D-012 제목 | 공개 제목 정책이 콜론 뒤 항목 목록도 제거 | '경쟁국 민간기업의 개도국 진출 현황' |
| A-023 표 | 원천별 표에 '합계(원천별)' 행: WRI 236기 41,350 MW(미기재 0기) · OSM 277곳 76,446 MW(미기재 1,450곳), WRI+OSM 합산 없음, 천 단위 구분 | 카드 41,350 MW ↔ 표 합계행 · 재계산 WRI mw 합 41,350.49 |
| A-022 | 세부 분류 선택기: 대안 옵션 없음(같은 계열 1개)으로 '시험 불가'로 기록, 무효과 판정 아님. 카드 MAIFI 1.25회/고객 2024 ↔ 상세 동일 | 재계산 일치 |

검토 과정에서 같은 기준으로 드러나 함께 고친 것:

- D-018 카드가 다국가 합계(2,324만 USD)를 대표값으로 쓰고 있었음 → **베트남 단독사업 승인액 1,135만 USD** (부분 이름이 비는 차원 키를 고르지 않도록 수정).
- D-020(9→**8건**), D-024(12행 중 **7건**), C-022(98→**97건**): 상세가 제외하는 원천 집계·설명 행(레코드구분=집계)과 취합 방법 행을 카드도 세지 않음. `basis.rule`에 제외 수 명시.
- E-012 카드가 2023년 백만명 계열(51.7)로 2023년을 넘겨 상세 주 분석(직군별, 2024만 있음)이 빈 표를 보이던 문제 → 상세 KPI와 같은 **전체 직군 종사자 수 51,860천명(2024)**.
- 비교 카드(bars/composition)가 부분마다 다른 범주(D-013 ESRU, A-017 CCGT)를 상세에 고정해 넘기던 문제 → 모든 부분이 공유하는 차원만 전달.
- 전용 컴포넌트 요소는 그 컴포넌트가 읽는 키만 전달(D-005 `budgetBasis=total-climate`, D-011·A-016·E-012 measure·year). D-011 카드 라벨 '공식 공여자 총계 · 지출액 · 2024년 불변가격'.
- 성·시 분포 카드는 `dim.regionMeasure`로 전달(B-040이 심도 2km로 열리던 문제), 시나리오 카드는 상세를 그 시나리오(SSP2-4.5)로 엶. 성·시 이름은 상세와 같은 표기(Bình Thuận).
- B-026(우세 유향)은 '행 74건' 카드 대신 63개 성·시 분포(최대 Vĩnh Phúc 23.3 %). E-017은 5개국 순위 비교로 **한국 4위**(상세 KPI가 중국 5위를 대표값처럼 보이던 것도 국가별 행은 단일 KPI로 쓰지 않도록 수정). A-026은 좌표계 EPSG:4326 그대로.
- 상세가 집계 수를 밝히지 않던 화면: 연대기 '시점별 기록 · N건'(값에 단위, 수치 항목은 범주 비교 먼저 — B-015 ETS 시설 수 부문별), 확인 결과표 'N건', 기관 디렉터리 'N곳', 목록 'N건', 일반 카드 값 천 단위 구분(B-025 86,253). A-016 상세 문구 '1차 에너지 소비량'(Energy Institute 소비 통계). E-020 문장 조사.

## 2. 검증 방법 재정의 (`scripts/v140/analysis-qa-v140.mjs` 2판)

| 항목 | 판정 규칙 |
| --- | --- |
| 실제 카드 클릭 | 데이터 찾기에서 제목 검색 → 카드의 '상세보기' 클릭 → 상세 도달(`cardClicked`). 홈 8개는 홈 카드 클릭도 별도(`homeCardClicked`, measure 일치 확인) |
| `selectionUrlPreserved` | 카드 `selection`(measure·year·period·dim.*)이 URL에 그대로 남는지 |
| 동일 의미 수치 대조 | 카드 수치를 상세 주 분석의 KPI·제목·표·목록 후보에서 찾되 **같은 수치 + 단위 동반 + 카드가 밝힌 연도/기간/지역 동반**. 정수는 정확 일치, 소수는 표시 자릿수(마지막 자리의 ½), 조·억·만·십억·B/M/K 환산 명시(514.7 10억 ↔ 5,146.97억 ↔ 514,697,215,165), 두 화면 자릿수가 다르면 굵은 쪽 반올림 단위의 ½ 이내(16.65억 ↔ USD 1.67B, 0.319 ↔ 0.32). 단위 별칭은 공개 표기(십억 USD_2017/yr ↔ 2017년 구매력평가 기준 10억 미국달러/년)와 표 머리글·선택된 항목의 단위. 범위는 양 끝, 구성은 표시된 부분 전부. 0.6% 일괄 허용 없음 |
| 독립 재계산 `recomputed` | 공개 다운로드 `downloads/<id>.json`에서 카드 생성기와 무관하게 재계산: 대표 지표(`provenance.headlineIndicatorIds`)의 연도·지역 행, 성·시 최대/중앙값/합계, 등록부 행 수(집계·방법 행 제외, 개별·현행·중복 제거 규칙 적용), 문서 수, 평가구역 수, WRI 용량 합, 2016 선로 연장 합, WGI 범위 |
| 상세 분석 유형 적합 | 표시된 선택기의 값·주 분석 제목·KPI가 넘긴 measure·year/period·차원 값을 말하는지(내부 키 값은 라벨로 확인) |
| 선택기 효과 | 컨트롤마다 새 페이지(동일 초기 상태)에서 라벨로 select를 찾아 실제 선택, 주 분석의 수치 집합 또는 주제(제목·선택 표시)가 바뀌는지 |
| 분석표 검산 | 카드 수치가 표 셀에 있는지, 실패는 분류: `no-derived-row`(원자료 행 표에 산출값 없음), `row-count-differs`(등록부 카드의 건수와 표 행 수가 다름 — 상세가 행을 문서/기관 단위로 묶음), `no-table`, `not-applicable` |
| 지도 연계 | 상세 '지도에서 보기' 클릭 → 지도 목록의 해당 행이 primary·표시 상태를 3회 연속 유지(지도 페이지 mount 직후 한 프레임 inactive로 튀는 현상 배제) |
| 런타임 | 세션 전체(카드 클릭·컨트롤·표·지도 포함) 콘솔 오류·필수 자산 실패·HTML-for-JSON 응답 0 |
| 버전 | 배포판 검사 시 `card-summaries` 해시·manifest generatedAt·mapLayerCount가 로컬 계약과 같아야 진행(불일치 exit 2) |
| 종료 코드 | 필수 항목 실패 시 exit 1. `npm run qa:analysis:v140`, `npm run finalize:v140`(finalize:v136 + role-split + analysis), CI `ci.yml`에 단계·artifact 추가 |

## 3. 결과 — 로컬 build (152개, 2026-09-16 05:49 UTC)

| 검증 축 | 통과 | 실패 | 해당 없음(미검증, PASS 아님) |
| --- | ---: | ---: | --- |
| 실제 카드 클릭(finder) | 152 | 0 | — |
| 홈 카드 클릭(8개) | 8 | 0 | 144(홈에 없음) |
| 선택 URL 유지 | 92 | 0 | 60(선택 없는 등록부·문서 카드) |
| 화면 로딩·런타임 무오류 | 152 | 0 | — |
| 동일 의미 수치 대조 | 150 (값 145 + 상태 문구 5) | 0 | 2(B-044·D-007: 문장값 카드) |
| 독립 재계산 | 144 일치 | 0 불일치 | 1 재계산 불가(A-026 문장값) · 7 값 없음(상태 5 + B-044·D-007) |
| 상세 분석 유형 적합 | 92 | 0 | 60(선택 없음 — 집계 수·대표 항목은 수치 대조로 검증) |
| 선택기 효과 | 120 (281회 시도) | 0 | 32(select 없음). 시험 불가 3건(A-015·A-022·D-003 세부 분류: 대안 옵션 없음)은 통과로 세지 않음 |
| 분석표 검산 | 130 | — | 6 `no-derived-row`(A-010·A-024·B-025·B-035·C-016·D-023: 합계·최대는 표 행이 아님, KPI에서 대조) · 8 `row-count-differs`(B-017·C-009·C-010·D-020·D-024·E-004·E-019·E-020: 상세가 행을 구역·문서·기관 단위로 묶음, 집계 수는 화면에서 대조) · 1 `no-derived-row`(B-021) · 7 해당 없음 |
| 지도 의미 검증 | 42 / 42 | 0 | 110(지도 자료 아님). B-017은 연결 대상 아님(준비 중) |
| 필수 실패 | **0** | | |

원천·기간 일치: 제공기관은 카드가 보여준 계열의 지표 메타에서(152개 중 기관별 출처 4개 이상 19개 요소는 'N개(상세 자료정보 참조)'), 자료기간은 계열의 실제 연도(산발 연도 '2010·2013·2020년', 전망 '과거 모형 1950–2014 · 전망 2015–2100'). 카드가 밝힌 연도/기간/지역은 수치 대조에서 수치 옆에 있어야 통과.

표적 검증(`analysis-qa-v140-review-targets.json`, 14개: E-019·E-020·B-004·E-004·B-036·D-012·A-022·A-023·B-021·E-017·B-026·B-040·E-012·D-018): 필수 실패 0.

## 4. 카드 모델 변경 (`build-card-summaries-v140.mjs`)

- `providerFor`: 지표 메타 `sourceOrg` 우선, 0개면 카탈로그(3개 이상은 '외 N개 기관'), 4개 이상이면 '기관별 공식 출처 N개(상세 자료정보 참조)'.
- `GROUP_LABELS`/`groupLabelOf`: 비교 축 이름의 공개 명칭. 계약 차원 라벨 → 표 → 키(경고).
- 등록부 카드: 레코드구분=집계·취합 방법 행 제외, `basis.count {rows, distinct, sourceRows}`, E-019 `notInstalled`, E-020 `identity`.
- 비교 카드의 `selection`은 공유 차원만. `SPECIALISED_SELECTION`(A-016·D-005·D-011·E-012). 성·시 카드 `dim.regionMeasure`(+`scenario`). `REGIONAL_ENTITY_MEASURE`(B-026). `kind: "countries"`(E-017). `headlineLabel`/`measureLabel` 재정의(E-012·D-011·D-005).
- `provenance.headlineIndicatorIds`: 대표값의 지표(선택 차원으로 좁힘, 비교 카드는 비교한 부분 전부, 이름 붙은 부분은 그 부분만).
- 홈 복사 8개는 홈 자산 그대로이되 `measure`를 홈 선택에서 채워 재계산 대상 지표를 명시.

## 5. 상세 화면 변경

| 파일 | 변경 |
| --- | --- |
| `SemanticContractRendererV125` | kpi-trend 2개년 → 선택연도 비교 + 선택 연도 문장 + 추이(B-036); 연대기 제목 '시점별 기록 · N건', 값에 단위, 수치 항목은 범주 비교 먼저(B-015); 확인 결과표 'N건'; 기관 디렉터리 'N곳'; 목록 'N건' |
| `SemanticArchetypePreviewV125` | KPI 단일 주체 판정에 `countryIso3` 포함(E-017) |
| `PublicRegionScenarioSummaryV138` | 시나리오 초기값을 `dim.scenario`에서 |
| `PublicEntityCardGridV131` | '값' 항목 천 단위 구분 |
| `PowerPlantRegistrySummaryV138` | 합계(원천별) 행 · 미기재 수 · 천 단위 |
| `PrimaryEnergyCompositionAnalysisV132` | '1차 에너지 소비량' |
| `PublicPortfolioSummaryV132` | 목적어 조사(을/를) |
| `publicAnalysisHeadingsV134` | B-036 제목 |
| `publicLabelsV122` | 콜론 항목 목록 제거(D-012) |

## 6. 지도

43개 대상 · 연결 42 · B-017 준비 중(평가구역 경계 미확보, 지도 목록에 '위치자료 없음'으로 구분, 카드·상세에서 지도 연결로 표시하지 않음). B-023/025/028 유역 경계 미전달(대표점, 제한 명시). 지도 연계 42/42는 목록 행 primary·표시 상태 3회 연속 확인 기준.

## 7. 전체 gate (`npm run finalize:v140`, 2026-09-16 05:03–05:36 UTC, 로컬)

| 단계 | 결과 | 근거 |
| --- | --- | --- |
| `finalize:v136` | PASS 79/79 | `reports/v136/release-audit-v136.json` |
| `qa:role-split:v140` | PASS 52/52 | `reports/v140/role-split-qa-v140-local-build.json` |
| `qa:analysis:v140` | gate 실행분은 A-003 1건 실패(QA 쪽 결함: 홈 카드가 단위를 라벨에 두는 경우의 10억 환산 누락) → QA 수정 후 같은 build로 재실행 152개 필수 실패 0 (§3, exit 0) | `reports/v140/analysis-qa-v140-local-build.json` |
| 개별 감사(변경 영향분 12개) | glossary 15/15 · finder-card 12/12 · entity-cards 15/15 · generic-detail 20/20 · public-naming 10/10 · public-copy 13/13 · public-text 9/9 · detail-hierarchy 12/12 · portfolio 12/12 · composition 10/10 · duplicate-copy 4/4 · home 17/17 | `reports/v13x/*.json` |
| Playwright(로컬 Windows, 후보 build `.verify/candidate`) | 214 / 214 passed (58.9s) | `reports/final-data-integration/playwright-report` |

## 8. 로컬 / Preview / production

| 대상 | 상태 |
| --- | --- |
| 로컬 build | 위 §3·§7 |
| Preview | 이 작업의 커밋은 push 전이라 Preview 없음. push 후 `node scripts/v140/analysis-qa-v140.mjs --base-url <preview> --label preview --bypass-secret <secret>`(또는 `VERCEL_AUTOMATION_BYPASS_SECRET`; 보고서에 비밀 미기록)와 `npm run qa:role-split:v140 -- --base-url <preview>`로 같은 검사. 버전 대조가 먼저 실행되어 계약과 다른 배포판이면 exit 2 |
| production | 미반영(sha 16b3ada, 12개 레이어). 병합·배포는 별도 승인 후 |

## 9. 잔여·한계

1. 분석표 검산의 `no-derived-row` 6건·`row-count-differs` 8건은 표 구조상 산출값이 행이 아닌 경우로, 값은 KPI/제목에서 대조하고 재계산이 일치함. 표에 산출 행을 추가하는 것은 이번 범위 밖.
2. A-026(건물 풋프린트)은 원천이 건수·면적을 제공하지 않아 좌표계만 카드에 실림.
3. 선택기 시험 불가 3건(A-015·A-022·D-003 세부 분류: 대안 옵션 1개) — 선택기 자체를 숨기는 것은 아키타입 공통 변경이라 보류.
4. B-017 평가구역 경계, B-023/025/028 유역 경계 미확보.
5. Linux Playwright 시각 baseline(홈·finder)은 CI artifact 검토 후 갱신 필요(로컬 Windows baseline만 갱신).
6. Preview·production 검사는 push·승인 이후.

## 10. 실행 명령

```
npm run build:card-summaries:v140      # 카드 자산 + asset-integrity
npm run build
npm run qa:analysis:v140               # 152개, exit 1 on required failures
npm run qa:role-split:v140
npm run finalize:v140                  # finalize:v136 + role-split + analysis
node scripts/v140/analysis-qa-v140.mjs --only E-019,E-020 --label review-targets
```
