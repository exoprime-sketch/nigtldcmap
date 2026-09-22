# REVIEW — V153-D0 데이터 결함 수정 (PR-D0)

브랜치 `feat/v153-d0-data-defects` · 기준 origin/main 12cffab(#22) 위 rebase · 작성 2026-09-22 · 실행 환경: 로컬(Windows, Node 22, Python 3.14, Playwright Chromium)

## 1. 한 줄 요약
- 광물명 복원(B-046·B-047), 투자자 소재 구분(E-006 8/7), 38대 기후기술 ID 정규화(옵션 77→38), C-012 한글화, B-002 "한글(코드)" 라벨, A-023 시설 카드(소유·연도·출처·소재지 보강)를 **원천 재투영 + 표시 계층**으로 처리. 값 생성·추정 없음. 지도 페이지·map-index·배경지도 파일 미접촉.

## 2. 설계 결정
- 파이프라인 전체 승격 금지: `promote-public-data-v137`는 트리 전체를 치환하는데 `geometry/vnm-adm1-34.geojson`(V151)·`home/card-summaries-v140.json`·`dataset-directory.json`은 파이프라인이 만들지 않는다. → `scripts/v153/diff-staging-v153.mjs`(staging↔published 파일·catalog 키 단위 diff)와 `scripts/v153/promote-elements-v153.mjs`(요소별 downloads·semantic·팩 shard·bundle-index·delivery-manifest·manifest(searchIndex만)·catalog(허용 키만) 선별 복사)로 승격. `map-index.json`·`spatial/**`·`geometry/**`·`home/**`는 절대 복사하지 않음.
- 기준선 측정: 코드 변경 전 파이프라인 실행 결과와 published 트리의 차이는 `asset-integrity`·`geometry-manifest`·`interpretation/indicator-interpretation-v129`·`manifest`·`map-index`뿐(모두 후행 단계 산출) → `reports/v153/staging-diff-baseline-v153.json`.
- ETL 재실행 가능화: v144에서 바뀐 A-002 슬러그를 v1 검색 색인이 모르므로 `_load_v1_search`가 legacy 슬러그 맵으로 해석. 파이프라인 7단계 소요 약 2분.
- 기술 ID: 카탈로그·팩 indicator의 `technologyIds`를 ETL에서 `"07"` 형식으로 정규화(원자료 v1 catalog·워크북 `tech_ids` 불변). 프런트는 `technologyIdV153`로 옵션 dedupe·매칭·검색·URL 복원. `확인필요`(E-008·E-011)는 옵션에서 제외(38개), 값은 유지.
- 광물명: 관측 시트에 광물 열이 없어 meta 시트 `요소_KR`("확인 매장량 — 희토류")의 " — " 뒤를 `name`, 앞을 `measureLabel`로 투영(단위 문자열 미사용).
- E-006 소재: 좌표의 34개 성·시 경계 포함 여부(point-in-polygon)로 `locationClass` 속성화. 원자료 기준 **베트남 소재 8 / 해외 7**(프롬프트의 9/6과 다름: Patamar Capital은 본부 USA지만 호찌민 사무소, Clime·Armstrong은 싱가포르). 지도 피처 8 불변(map-index 무변경).
- A-023: WRI 236기의 note `[발전소ID: WRI…/WKS…]`를 GPPD 추출본(`tools/vietnam_etl/source/A-023_global_power_plant_database.vnm.csv`, VNM 236행, CC BY 4.0) `gppd_idnr`로 정확 조인(236/236). OSM은 operator·start_date·객체 URL을 안정 키로. 전 시설 소재지는 순수 파이썬 ray-casting(34·63 경계)으로 빌드 시 속성화.
- B-002·C-012 한글화는 표시 계층(`koreanTermsV153.json/.ts`)에서만; 데이터 자산·카드 자산 불변, 원문 병기.

## 3. 변경 내용

### 3.1 B-046 매장량·B-047 생산량 광물명 복원 (§1)
- 전: CSV `name` 공란, indicator id `reserves_0…`, 화면 카테고리 라벨 "1 · 3 · 18 · 24"(기술 차원이 광종보다 우선).
- 후: 관측 `name`·`measureLabel` 채움. 광물명 목록
  - B-046 확인 매장량(2026, USGS MCS 2026): 희토류 3,500,000 t REO(세계 5위·4.67%) · 텅스텐 170,000 t(W 함량)(4위·3.62%) · 보크사이트 3,100,000 천 t(건조 기준)(3위·10.69%) · 흑연 9,700,000 t(천연)(7위·3.13%) · 안티모니 54,000 t(Sb 함량)(11위·2.70% 이하) · 주석 23,000 t(Sn 함량)(10위·0.38% 이하) · 형석 16,000 천 t(5위·4.85%) · 인광석 30,000 천 t(아파타이트)(21위·0.04%). USGS 미수록 5종: 코발트·구리·리튬·망간·니켈(사유 note 표시).
  - B-047 광산 생산량(2024 실적·2025 추정): 텅스텐 3,400→3,000 t · 보크사이트 3,710→3,800 천 t · 알루미나 1,410→1,500 천 t · 주석 11,000→11,000 t · 형석 146→160 천 t · 희토류 300→150 t REO · 흑연 500→500 t · 인광석 3,000→3,000 천 t · 시멘트 91,000→100,000 천 t. 원천 미보고 2종: 구리·망간. 희토류 급감 각주(USGS 각주 12) 별도 표시.
- 화면 `MineralResourceSummaryV153`: B-046은 세계 비중(%) 막대(단위 상이로 값 막대 미사용, 사용자 확정) + 값·단위·순위·비중·비고 표; B-047은 광종별 2024/2025 나란히(행 내 상대 막대)·증감률·순위 표.

| 검증 | 결과 |
|---|---|
| `mineralResourcesV153.test.ts` | 광물 8+5 / 9+2+1 통과 |
| 화면 6폭 넘침 | 0 (`reports/v153/screens/d0-screens-v153.json`) |
| analysis QA B-046·B-047 | 필수 실패 0 |

### 3.2 E-006 현지 투자자 네트워크 소재 구분 (§2)
| 구분 | 기관 |
|---|---|
| 베트남 소재 8 (지도 표시, 도시 단위) | Beacon Fund · Do Ventures · Dragon Capital Group · Mekong Capital · New Energy Nexus Vietnam · Patamar Capital(본부 USA) · Touchstone Partners · VinaCapital — 모두 호찌민(Hồ Chí Minh) |
| 해외 소재(베트남 투자 실적) 7 | Armstrong Asset Management(Singapore) · ADB(Manila) · Clime Capital Management(Singapore) · EAAIF(London) · IFC(Washington, D.C.) · Proparco(Paris) · responsAbility(Zurich) |
- 데이터: `locationClass`·`adm1Name34/Code34`·`adm1Name63/Code63` 파생 속성(fieldDefinitions `derived:` 표기). 좌표·city·hqCountryIso3 불변. 지도 피처 8·map-index 변경 없음.
- 화면 `InvestorNetworkSummaryV153`: 두 목록 + 기관 클릭 시 카드(국가/명칭/기관 유형/펀드·소속/투자 분야/규모/본부 소재국/소재지/출처) + 도시별 기관 수 막대(카드 자산 표기 유지).

### 3.3 38대 기후기술 ID 정규화 (§3)
- 전: 카탈로그 77종(`"1".."38"` + `"CTIS-01".."CTIS-38"` + `확인필요`), 찾기 옵션 77개(중복 라벨), 한 표기만 매칭, URL `technology=CTIS-07`는 새로고침에 유실.
- 후: 카탈로그 58개 요소·팩 indicator 정규화(`01..38`), 옵션 정확히 38, `"7"`·`"CTIS-07"`·`"07"`·슬러그 모두 같은 결과, URL `technology=07` 새로고침 복원(브라우저 확인). 검색 색인·다운로드 페이지 동일 규칙. 관측 semantic의 기술 차원 "01,03,18,24"를 라벨로 표시.
- 단위테스트 `technologyIdV153.test.ts`: 옵션 38, v1 원자료의 두 표기 합집합 == 정규화 매칭 수(38개 코드 전부).

### 3.4 C-012 PPP·조달 제도 한글화 (§4)
- `koreanTermsV153.json`(계약 유형 7종·낙찰 방식·부문·상태·법령 번호·출처명·성 이름 28건 등) + `koreanTermV153()`(표 우선 → "English(한글)"은 "한글(English)"로 반전, 한글 머리는 불변). 120행의 name·값·부문·상태 중 미번역 라틴 토큰 0(포털 호스트명 `thuvienphapluat.vn` 등 고유명 제외, 테스트로 고정).
- 화면 `PppProcurementSummaryV153`: 법률·시행령 33 / 전담 기관 3 / 계약 유형 7 / 조달 방식 9 / 사업 이력 / VfM 그룹별 "항목: 값 (시점) · 출처 · meta 설명", 세계은행 PPI 성·시별 건수 표(개편 전 성 표기, 34개로 합산하지 않음).
- 원천 결함 기록: `procurement_method_ppi_worldbank` 5행("낙찰방식별 건수" 1·23·40·46·54)은 워크북 자체에 방식 열이 없어 값만 표시 → PE(데이터 확보) 항목.
- 34개 지역 지도·지역 클릭 패널은 P4 범위(미포함).

### 3.5 B-002 기후대 (§5)
- 라벨 "온대·동계건조·고온하계(Cwa)" 순서(표시 계층, 데이터 불변). `ClimateZoneSummaryV153`: 국가 우세 기후대, 기후대별 면적 막대(1991–2020), **기후대 구성 표**(한글(코드)·원문 표기·면적 km²·비율 %), 열대기후(A군) 비율 시기·시나리오별 4건.
- 카드 자산(`card-summaries-v140.json`)의 "Cwa (…)" 표기는 유지(구성 표 '원문 표기' 열로 계약 대조 통과). 카드 재생성 시 같은 헬퍼 적용은 P4 항목.

### 3.6 A-023 발전소 정보 카드 (§6)
- 원천 확인: 워크북 A-023.xlsx에는 owner/commissioning_year/source/url 열 없음(note 텍스트에만). 납품 `raw/A-023_global_power_plant_database.csv`(GPPD v1.3.0)에서 VNM 236행 추출본을 저장소에 두고 `gppd_idnr`로 조인(README에 출처·라이선스·추출 기준).
- 카드 규격 `src/data/visualization/facilityCardV153.ts`(A-023·E-006 적용, A-025·B-048·C-025·E-004/005/018/019 선언), `FacilityCardV153` 렌더러. A-023 상세: 시설명 클릭 → 카드, 목록에 소유·운영·소재지(34개 기준) 열, 출처별 설비용량 합계 문장.
- 채움률(`reports/v153/facility-card-fill-v153.json`):

| 집단 | 소유·운영 | 가동 연도 | 출처 URL | 소재지(34) |
|---|---|---|---|---|
| WRI 236 | 210 (89.0%) | 167 (70.8%) | 236 (100%) | 233 (98.7%) |
| OSM 1,727 | 193 (11.2%) | 34 (2.0%) | 1,727 (100%) | 1,637 (94.8%) |
| 전체 1,963 | 403 (20.5%) | 201 (10.2%) | 100% | 1,870 (95.3%) |
| 표본 20(WRI 10·OSM 10, 이름순) | 9 (45%) | 7 (35%) | 20 (100%) | 19 (95%) |

- 미기재 사유: 소유 — GPPD owner 공란 26 · OSM operator 태그 없음 1,534 / 연도 — GPPD 공란 69 · OSM start_date 없음 1,693 / 소재지 — 좌표가 34개 경계 밖 93(해안 매립지·도서·해상풍력, OSM 추출에 포함된 라오스 Nam Phao 수력 1건 포함 → PE 보고). 값을 만들지 않음.
- 지도 팝업·미니맵 팝업 적용은 P3(V152) 몫: `mapPresentationV148.ts` A-023/E-006 fact 순서에 `owner·commissioningYear·adm1Name34·locationClass` 추가, 팝업 본문을 `facilityCardV153` 규격으로. `publicMapTargetsV138.json` E-006에 `locationClass` 필터 추가 여부는 지도 세션 판단(이 PR은 미변경).

## 4. 검증 결과
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | 오류 0 |
| `npm run test:unit` | 26 suites · 233건 통과(신규 5 suite 17건) |
| 파이프라인 기준선 diff | published와 후행 단계 산출 5개 파일만 상이(`staging-diff-baseline-v153.json`) |
| 승격 결과 | 커밋1: catalog 58요소 technologyIds·60 downloads·19 packs; 커밋2: A-023·B-046·B-047·E-006 downloads/semantic·팩 3개·search-index·manifest(searchIndex만); `git status`로 map-index·spatial·geometry·home 무변경 확인 |
| `verify:dataset-directory:v150` · `check-download-delivery-v137` | 통과 · problems 0 |
| `audit-vietnam-release-v136 --group static`(로컬) | PASS 15/15 · 7/7 — 첫 CI에서 `BROKEN_ASSET_COUNT` 16(홈 카드 자산이 구 팩 파일명을 참조) → `build:card-summaries:v140` 재생성(값·라벨 변화 0, provenance 팩명만)으로 해소 |
| `scripts/v153/d0-screens-v153.mjs`(6개 × 320/390/768/1024/1440/1920) | 36/36 통과 · 가로 넘침 0 · 콘솔/HTTP 오류 0 · 찾기 옵션 38 · `technology=07` 새로고침 복원 |
| `screen-review-v138 --ids 6개 --out reports/v153/screens/v138-review` | ready 6/6 · 오류 0 · 내부 문구 0 |
| `analysis-qa-v140 --only 6개`(로컬 production 빌드) | 필수 실패 0 — 기준선 41건 중 A-023·C-012 `cardValueVerified` 2건 해소(`reports/v153/qa/analysis-qa-v140-d0.json`) |
| Vercel Preview | rebase(force-push) 뒤 배포가 즉시 실패 반복 → `scripts/vercel-ignore-build.sh`에서 이전 성공 배포 SHA가 clone에 없으면 build(exit 1)하도록 가드(`verify-ignore-command-v140` PASS, fail-safe 3/3) → a4316af Preview Ready(보호된 URL) |
| 전체 `finalize:v140` | 미실행(메인 PR에서 1회) |

## 5. 미완료·보류와 사유
- 지도 팝업·미니맵의 시설 카드 적용(P3 몫, 지도 파일 편집 금지).
- C-012 34개 지역 지도·지역 패널(P4), 카드 자산의 B-002 라벨 재생성(P4).
- A-023 경계 밖 93곳 소재지(경계 단순화·해상): 임의 배정 금지로 미기재 유지. 라오스 소재 OSM 1건은 원천 추출 범위 문제로 PE 보고.
- C-012 낙찰방식별 건수 5행 방식 미기재(원천 결함) → PE.
- 각 항목 독립 커밋 원칙 중 데이터 재투영은 한 파이프라인 실행 산출이므로 1개 커밋(dc229ea)으로 묶음(팩 shard가 요소 8개 단위라 분리 승격 불가).
