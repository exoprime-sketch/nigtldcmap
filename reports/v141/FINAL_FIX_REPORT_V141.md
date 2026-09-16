# V141 마지막 의미 오류 수정 — 결과 보고

작성일: 2026-09-16 · 브랜치 `feat/home-map-analysis-v139` · 기준 문서 `output/public-review-20260916/FINALIZATION_REVIEW_AFTER_V140.md` 및 후속 지시(V140 마지막 의미 오류 수정 및 배포 수용) · 새 탭·재설계·임의 데이터/경계 생성 없음 · 기존 4318 서버 유지 · **push·PR·병합·배포 없음(로컬 커밋까지)**

## 0. 네 항목 요약

| 구분 | 상태 |
| --- | --- |
| **로컬 완료** | 지시 §1~§6 수정 완료. 고정 소스에서 `finalize:v140` 1회 통과: `finalize:v136` 79/79 · role-split 52/52 · analysis QA 152개 필수 실패 0(analysisFit 152/152 · 지도 대표 기호 42/42 · 내부 문구 0) · Playwright 214/214(후보 build). 로컬 커밋 예정 |
| **Preview 검증** | 미실시 — push 전. 사용자 승인 후 push → CI → 로그인 Preview 또는 승인된 bypass로 `qa:analysis:v140`·`qa:role-split:v140`을 같은 URL에 실행(버전 대조 exit 2 규칙 유지) |
| **운영 반영** | 미반영. 운영은 V140 이전(카드 자산 없음, 지도 12개). 별도 병합 승인 후 배포·동일 버전 smoke QA를 마쳐야 '운영 반영 완료' |
| **자료 한계** | B-017 평가구역 경계 미확보(지도 미연결, 42/43), B-023·B-025·B-028 유역 경계 미확보(대표점, 제한 명시), A-026 건물 건수·면적 원천 미제공, A-023 두 출처 공통 식별자 없음(고유시설 합산 없음), C-018 CAGR은 원문 미제시 자체 산출값(계획값 아님) |

검증 대상 고정: 카드 자산 sha `c68f9ce3b20d35a8`(generatedAt 2026-09-16T07:40:38Z) · manifest 2026-08-27 · map-index 활성 42 · 로컬 HEAD는 커밋 후 본 보고 말미에 기재.

## 1. 해결한 문제 (지시 번호 순)

### §1 A-023 발전소 — 공통 필드 해석과 출처 선택
- `src/data/map/powerPlantFactsV141.ts`: 발전원 `fuelType`/`primaryFuel`(영문→국문), 용량 `capacityMw`/`mw`, 용량구간은 기재 용량에서 파생, `(미표기)`·`미기재` 정규화. 추정 보충 없음.
- 상세 `PowerPlantRegistrySummaryV138`와 지도 `RealMapExplorerPage`(prepareLayerRecords → 필터·기호·tooltip·집계)가 같은 함수를 읽음.
- 지도 출처 필터(map-index A-023 계약 patch `filtersAppend`): **WRI GPPD (2021) 기본** · OSM 추출 (2026) · 두 출처 함께(같은 시설 중복 미통합). 자료연도·지도 표시 범위는 선택 출처 기준("표시 236곳 · WRI GPPD (2021) · 좌표 보유 1,889곳 중"). `map-index.json` 재생성(A-023 레이어만 변경, 42 레이어·4,463 객체 동일).
- 수용 확인(브라우저): Kon Dao = 발전원 수력 · 용량 1 MW · 자료연도 2021 · 출처 WRI; WRI+수력 필터 174곳에 포함, 용량구간 10MW 미만. 요약: WRI 기준 발전원 미기재 0 · 설비용량 기재 236 · 미기재 0; OSM 기준 발전원 미기재 5 · 용량 기재 239 · 미기재 1,414. 카드 41,350 MW ↔ 상세 WRI 합계 행 ↔ 지도 WRI 기준 일치.

### §2 C-007·C-008 — 속성 행을 사용자용 분석으로
- 공통 파서 `src/data/visualization/cTemplateRowsV141.ts`: 주제 — 속성, 값, 시점, [하한/상한], 근거 문서(Quyết định …), 파일명·검토의견·raw 메모 제거.
- `CooperationChecklistAnalysisV141`: C-007은 참여 지위(참여당사국 host Party) · 등재 NMA 1건/플랫폼 6건 · 제출당사국(일본 METI) · 대상 분야(감축·적응) · NFP(명단 미공개) KPI와 질문별 현황표(참여 지위·등록, 확인된 NMA, 제출·담당 기관, 협력 대상·분야·실적, 플랫폼 활동, 상태 코드 정의). '원 wide파일 … 재검증'·PDF 파일명·플랫폼 출처 행은 '검토 근거·자료 출처'로 접음.
- C-008: 이니셔티브 32개 비교표(정식 명칭·구분/기후분야·베트남 참여·참여 시점·주제 분야) + NAZCA 등재 행위자 98곳(기업 73·기관 12·도시 12·국가 1)의 유형·업종 막대 + 검색 목록(30건 + 모두 보기). 연도 추세 차트 없음. 카드: "32개 이니셔티브 · NAZCA 등재 행위자 98곳 · 2026년 확인".
- 같은 템플릿 점검: C 요소 25개 중 포트폴리오 렌더러는 C-007·C-008·C-025뿐. C-025는 사업 등록부(262 좌표)로 유지하되 카드가 비교한 등록 표준 분포를 상세에 추가(`standard` 열 반영). 나머지 C 요소(확인 결과표·문서 연대기)는 오류 없음.

### §3 C-018 — 제목·계약·실제 자료 일치
- 원천 = 개정 PDP8(Quyết định 768/QĐ-TTg, 2025) 계획값 89행 + 2024–25 전력가격 규정 32행. 공개 제목 '중장기 전력 계획·전망(개정 PDP8)', 질문·해석 문구·headings 재작성. 가짜 전망 차트 없음.
- `EnergyOutlookPlanAnalysisV141`: 전원별 설비용량 계획 2030/2050 하한~상한 범위 막대(연도 선택 · 총 설비 별도 · 합산 없음) + 표로 보기, 수요 전망·재생에너지 비중 목표·배출 전망·전력 교역 계획 표(단위 열), 전력가격 규정 표(가격 종류 · 하한~상한 · **VND/kWh·UScent/kWh** · 시점 · 근거 문서 · 원문), 제도 문서·시장 공표 목록. GDP 가정·CAGR(자체 산출)은 주석.
- 카드: "293,088~295,646 MW · 2050년 전원별 설비용량 계획 최대 · 태양광 · 개정 PDP8 하한~상한", 선택 `year=2050`을 상세에 전달.

### §4 B-021 — 범위 설명·분석 표·판정
- 37.1(2023 국가 GVI) 유지. 머리글 '성·시 단위 · 관측기간 1990~2100년' → **'국가·6권역 단위 · 자료기간 1990~2100년(2027년 이후 전망)'**(지표 접미사로 공간단위 판정, 미래 연도는 전망 표기).
- 추세 차트·항목 비교·두 시점 변화·구성 추세 패널에 '표로 보기'(차트에 쓴 계열·연도/시점·값·단위 표, `trend-chart-table-v141` 등). 원자료 200행 표는 그대로 접힘.
- QA 숫자 판정 키: 지표(측정항목·계열 라벨 토큰 또는 카드 라벨이 명시한 행 주제) + 지역 + 연도/기간 + 단위(행·머리글·캡션). 근처 5% 숫자 예외 로직 제거. `value-without-keys`는 필수 실패. B-021 표 판정 = match(2023 · GVI 취약성 지수 · 37.1 · 지수).
- 표 재분류(최종): match 131 · no-derived-row 4(A-010 네 가스 합계, B-025 최대, C-016 63개 성·시 합계, D-023 개별 71건 — 산출값이며 KPI·재계산으로 대조) · no-matching-row 1(A-024 606구간 23,608 km는 요약 KPI, 원자료 표는 구간 단위) · row-count-differs 9(B-017·C-007·C-009·C-010·D-020·D-024·E-004·E-019·E-020: 상세가 구역·문서·기관 단위로 묶은 등록부, 건수는 화면 KPI로 대조) · 해당 없음 7(상태 5 + 문장값 2). 실제 불일치 0.

### §5 152개 상세·지도 42개 의미 보완
- `detailAnalysisFit`(선택 문구 일치, 93/93)과 **`analysisFit`(152/152)** 분리. 자료 유형별 기대: 시계열=추세/비교+차트 행 표+단위+연도, 구성=부분 전부+총계 분리, 기후 전망=변수·시나리오·연도·관측/전망 구분, 지역=지역 선택기+분포/순위+단위, 사업·재원/정책·기관=집계 수+목록/표/연대기(+시행/확인 시점), 실제값 없는 5개=상태 문구. 선택 없는 59개도 모두 기록.
- 이를 위해 추가한 화면: B-012 재해 유형별 건수(연대기 앞), B-025·B-023·B-028 같은 단위 값 비교(전국 집계 제외), 포트폴리오 검토 분류 키별 분포(D-014 원조 유형, D-016 기관 유형, D-025 투자 유형, C-025 등록 표준 …), A-018 카드 부분 이름을 상세와 같은 국문으로, E-018·A-010·D-023·A-002 홈/카드 부분 이름을 상세 표기에 맞춤.
- 지도: `mapHandoffVerified` 42/42(레이어 표시 검사)와 별도로 **`mapSymbolVerified` 42/42** — 키보드 항목 선택으로 대표 기호를 열고 패널의 값·단위·시점·출처·공간 의미를 검사. 사례별 확인: A-023 출처 2종(선택 시설의 WRI/OSM·연도), D-018 참여국 범위 vs 세부 활동지역 점(승인일·사업기간 행 추가), B-021 6권역, C-019/C-022 34단위 대응. D-023 지도 복원 없음, C-009/C-010 공통 문서 중복 집계 없음(문서 단위 연대기 유지), C-019/C-022 시설 모집단 동일 표기 유지.
- 내부 문구 자동검사(`internalWording`): 파일명·검토의견·raw 키·속성 키 노출 0/152(C-015 'raw 스캔본 OCR 재추출' 방법 행을 확인 결과표·카드 집계에서 제외).

### §6 화면 구조·공개 문구
- 홈(검색+지도 미리보기+주요 데이터 8)·Finder(152 카드)·상세·지도(7 카테고리·다중 선택·너비 조절) 구조 유지. 새 탭 없음.
- 지도 범례: 1200px 미만에서 접힌 채 시작, 값·단위·자료연도·표시 범위를 먼저, '현재 표시 중' 목록은 그 아래. 지도 목록 요약은 짧은 출처('WRI 2021').
- 공개 상태 문구: '자료 없음' → '자료 미제공', '위치자료 미확보(지도 표시 제외)'. '관측기간' → '자료기간', 데이터 안내에 자료 갱신일·기준연도 구분 문장.
- 용어: 새 화면의 약어(A6IP·ASAP·CCICH·CMBP·UEF·CEFIA·SIVA·SIN·ABM·RCC·SB61·SLCP·ART·TREES·JV) 용어집 등록, NAZCA 기업명 원문 조각은 검토 목록 등재. 단위는 모두 용어 도움말로 감쌈(glossary 15/15).

## 2. 변경 파일

| 구분 | 파일 |
| --- | --- |
| 새 파일 | `src/data/map/powerPlantFactsV141.ts`, `src/data/visualization/cTemplateRowsV141.ts`, `src/components/data/public/CooperationChecklistAnalysisV141.tsx`, `EnergyOutlookPlanAnalysisV141.tsx`, `energy-outlook-plan-v141.css`, `reports/v141/` |
| 상세·지도 | `PublicDataAnalysisRouterV126`(C-007/C-008/C-018 라우팅), `PowerPlantRegistrySummaryV138`, `RealMapExplorerPage`(정규화·출처 필터 기본값·자료연도·요약·범례 순서/기본 접힘·D-018 승인일), `PublicRegionScenarioSummaryV138`, `PublicPortfolioSummaryV132`(분류 키별 분포·facet.attributes), `PublicEntityCardGridV131`(stated values), `PublicCompositionTrendAnalysisV132`(표로 보기), `SemanticContractRendererV125`(차트 행 표 3종, 연대기 유형별 건수, 등록부 값 비교, 방법 행 제외), `CountryDataFullPreviewV52`(공간단위·자료기간), `MapDataGuideV130`, `DataGuidePage` |
| 데이터·계약 | `publicLabelsV122`(C-018), `publicAnalysisHeadingsV134`(C-007/C-008/C-018), `publicIndicatorInterpretationV129`(C-018), `publicEntityFieldPolicyV132`(C-025 standard, D-016 agencyType), `publicMapTargetsV138.json`(A-023 patch), `vietnamTypesV121`(filter defaultValue/allLabel), `mapAvailabilityV140`, `publicGlossaryV134`(15 항목), `public-non-glossary-allowlist-v134.mjs` |
| 생성 자산 | `map-index.json`(A-023), `home-preview-v139.json`(부분 이름·A-002 단위), `card-summaries-v140.json`(C-007/C-008/C-018/E-018/A-018 등), `asset-integrity.json` |
| 스크립트 | `build-map-layers-v138.mjs`(patch filtersAppend/factFieldsAppend/periodLabel), `build-home-preview-v139.mjs`, `build-card-summaries-v140.mjs`(C 템플릿 카드, 에너지 범주 국문, groupBy 함수), `analysis-qa-v140.mjs`(키 기반 표 판정·analysisFit·mapSymbol·내부 문구·회귀), `role-split-qa-v140.mjs`, 감사 4종(entity-cards·portfolio·generic-detail·data-summary: V141 화면 인식) |

## 3. 검증 (로컬, 고정 build)

| 검사 | 결과 | 근거 |
| --- | --- | --- |
| 단위·표적 재현 | A-023 지도(WRI/OSM/함께, 수력 필터, Kon Dao), C-007/C-008/C-018/B-021/B-012/B-025 화면, 1024/768/1440 지도 스크린샷 | `reports/v141/screenshots/` |
| `finalize:v140` 1회 | finalize:v136 **79/79** · role-split **52/52** · analysis QA **152개 필수 실패 0** (exit 0) | `reports/v136/release-audit-v136.json`, `reports/v140/role-split-qa-v140-local-build.json`, `reports/v140/analysis-qa-v140-local-build.{json,md}` |
| analysis QA 세부 | 카드 클릭 152 · 홈 8 · 선택 URL 93 · 수치 대조 150(+2 문장값) · 재계산 144 일치/0 불일치 · 선택 문구 93 · **analysisFit 152** · 컨트롤 119(278회, 시험 불가 3) · 표 131 match(위 재분류) · 지도 42 · **대표 기호 42** · 내부 문구 0 | 같은 파일 |
| Playwright(후보 build) | 214/214 | `reports/final-data-integration/` |
| 검증하지 않은 항목 | Preview·운영(§0), Linux 시각 baseline(CI diff 검토 후), 모든 tooltip 조합(대표 기호 1개/레이어만 검사), 390/768/1024/1920 전 화면 육안 검토(지도 3폭만 캡처) |

## 4. 남은 절차 (승인 필요)

1. 사용자 승인 후 기존 브랜치 push → CI 실제 실패 처리 → Linux 시각 baseline은 diff 검토 후 갱신.
2. 로그인 Preview 또는 승인된 bypass로 자산 fingerprint 대조 후 `qa:analysis:v140 --base-url <preview>`·`qa:role-split:v140 --base-url <preview>` 실행(비밀값 로그 미기록).
3. Preview에서 390/768/1024/1440/1920, 데이터 152, 지도 42, 다운로드 형식·내용 검증(코드 SHA/자산 fingerprint 고정).
4. 별도 병합 승인 후 운영 배포와 동일 버전 smoke QA. 그 전까지 '운영 반영 완료'로 보고하지 않음.
