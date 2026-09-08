# FINAL VIETNAM DATA INTEGRATION — 진행 상태 (v137)

갱신: 2026-09-08 (Stage 2) · 브랜치 `fix/existing-screen-usability-v136`
BASELINE_SHA `6f14b5b` (통합 착수 시점) · REVIEWED_CODE_SHA `e13fbe9` (Stage 2 검토 기준)

이 파일은 재개용 상태 기록이다. 사용자 화면에 노출하지 않는다.

---

## 1. 기준선과 원본 보호 — 완료

| 항목 | 값 |
|---|---|
| branch | `fix/existing-screen-usability-v136` (유지, 전환 없음) |
| HEAD | `6f14b5b8a0f5d72292c0007966e6a4aefdc504d4` |
| origin/main | `5ca33de4d17a8589fc5cfea02224f605696e4491` |
| 미병합 커밋 | 2개 (`574ef2a`, `6f14b5b`) — **보존됨** |

**원본 보호 조치**
- `.gitignore`에 정확한 경로 `/베트남데이터/` 추가.
- `git check-ignore -v`로 폴더와 개별 파일 모두 무시 확인.
- 추적 중이던 파일 **0건**, staged **0건** — 이력 재작성 불필요.
- `.vercelignore`/`vercel.json` 없음 → Vercel은 git 기준으로 배포하므로
  ignore 처리로 업로드 경로도 차단됨.
- 원본은 읽기 전용으로만 접근. 수정·이동·삭제·복사 없음.

**보존 대상(삭제·재번호 금지)**: `reports/live-qa-20260907-153743/`
(findings 58행, 증거 46개, coverage/resume/environment)

---

## 2. 원본 전수 목록 — 완료

`scripts/source-inventory-v137.mjs` (스트리밍 SHA-256, 6.25 GiB 전량)

| 지표 | 값 |
|---|---|
| 전체 파일 | 3,752 |
| **실제 내용 파일** | **2,035** |
| 고유 비어있지 않은 내용 | 2,248 |
| 중복 사본 | 472 |
| 0바이트 파일 | 1,032 |
| WebDAV 동기화 상태 파일 | 1,693 |
| 총 용량 | 6.25 GiB (6,706,108,199 B) |
| 읽기 실패 | **0** |
| 보안 스캔 지적 | **0** (매크로·스크립트 미실행) |

### 최초 분류에서 정정한 2건

1. **0바이트 파일 동일 해시 문제** — 빈 파일 1,032개가 모두 같은 SHA-256을 가져
   서로의 "내용 중복"으로 잘못 묶였다. 중복 판정에서 0바이트를 제외하도록 수정.
2. **`._DAV/.state_for_dir.{dir,pag}` 1,693개** — WebDAV 동기화 클라이언트 상태 파일.
   데이터가 아니며 파일 수를 크게 부풀리고 있었다. `임시`로 재분류.

### 이름이 비슷한 D/E 폴더 — 판정

`D. 시장□산업 및 재원`(11), `E. 협력□실행 기반`(10) = **21개 전부 0바이트**.

→ 정상 이름 폴더(`D. 시장·산업 및 재원`, `E. 협력·실행 기반`)의 **다른 판본이 아니라
실패한 복사본**이다. 내용 비교 대상이 아니고, 건너뛴 것도 아니며, 원본은 삭제하지 않는다.
(`·` → `□` 치환 실패로 생성된 것으로 보이나 원인은 단정하지 않음)

---

## 3. 152개 항목 대응 — 완료

`scripts/source-element-map-v137.mjs` → `element-source-map-v137.csv`

- `베트남데이터/file/` 에 **145개 정본 워크북**(`A-001.xlsx` … `E-020.xlsx`).
  기존 파이프라인이 읽던 `_source/vietnam/v124/vietnam-data(4).zip`(149개)과 같은 형태.
- 카탈로그 152개 중 **CANONICAL_WORKBOOK 145 / NO_SOURCE_FOUND 7**.

| 상태 | 항목 |
|---|---|
| 구 원천에만 존재 (OLD_ONLY) | E-011, E-013, E-016, E-017 |
| 양쪽 모두 없음 (NEITHER) | C-020, C-021, C-023 (카탈로그상 `not-collected`) |

→ OLD_ONLY 4건은 **이번 폴더에 없다는 이유만으로 삭제하지 않는다**(지시 §3).
E-016/E-017은 현재 `actual-records` 보유 → `RETAINED_WITH_REASON` 예정.

---

## 4. 최종 원자료 대조 — 완료 (가장 중요한 결과)

### 바이트 해시만으로 판단하면 틀린다

`source-baseline-comparison-v137.csv`: 145개 **전부** SHA-256 상이.
그러나 Excel은 저장할 때마다 내부 메타데이터를 다시 쓴다.

`scripts/compare-source-content-v137.py`로 **셀 내용 단위** 재비교:

| 상태 | 개수 |
|---|---|
| **CONTENT_IDENTICAL** (바이트만 다름) | **59** |
| **CONTENT_CHANGED** (실제 값·구조 변경) | **86** |
| OLD_ONLY | 4 |

→ 실제 반영 대상은 **86개**. 145개를 모두 바뀐 것으로 처리하면 안 된다.

기준화면 3개: **A-016 / D-011 CONTENT_IDENTICAL**, B-005 CONTENT_CHANGED.
A-017도 CONTENT_IDENTICAL (관측 72행 동일).

### 구조 변경의 실체 — 관측형 → 개체(entity)형

`missing-sheet:db_framework` 112건은 정상이다. 새 워크북은 데이터 시트 3개만 두고
참조 시트 4개(`3_결측사유코드`, `meta_def`, `meta_code_def`, `db_framework`)를 뺐다.

문제는 그것이 아니라 **시트 간 데이터 이동**이다. 예: B-034

| | 구 원천 | 최종 원자료 |
|---|---|---|
| `1.1_observation` | 501행 (관측 498) | **3행 (헤더뿐, 데이터 0)** |
| `1.2_entity` | 3행 (개체 없음 안내) | **249행 (개체 246)** |

새 entity 시트는 attr_1~attr_17에 다음을 담고 있다:

```
레코드 키(VNM.1_1) · 지역명(베트남어) · 지역명(로마자) · 행정단위 ·
2025 개편 후 소속(34개 체계) · 구분(수관밀도 임계 30%) · 기준연도 ·
지상부 탄소저장량(Mg C) · 지상부 탄소밀도(Mg C/ha) ·
산림탄소 총배출(Mg CO2e/yr) · 산림탄소 총흡수(Mg CO2/yr) ·
산림탄소 순플럭스(Mg CO2e/yr) · 값(전국 계열) · 단위(전국 계열) ·
경계 폴리곤 파일 · 경계·좌표 산출근거 · 기후기술 연계 근거
+ lat/lon · geometry_type=polygon · crs=EPSG:4326
```

**값 대조 결과**: An Giang 순플럭스 `-327,911`, Bạc Liêu `-95,795` —
구 원천 관측값 및 현재 라이브 차트 값과 **정확히 일치**한다.
즉 값이 사라진 것이 아니라 **관측 시트에서 개체 시트로 옮겨졌다**.

### 이것이 기존 QA 결함을 직접 해결한다

- **LQA-018 / LQA-032 (성(省) 단위 라벨)** — 최종 원자료가 지역명·로마자명·
  GADM 레코드 키(`VNM.1_1`)를 직접 제공한다. 지역명을 추측할 필요가 없어졌다.
- **LQA-031 (기간 귀속)** — `기준연도` 열이 개체별로 분리되어 있다.
- 경계 폴리곤 파일명과 산출근거가 명시되어 지도 조인 근거가 생겼다.

### 2025년 행정구역 개편 (주의)

`2025 개편 후 소속(34개 체계)` 열 존재. 예: Bạc Liêu → Cà Mau.
→ **63개 기준 값을 34개 경계로 재분배하지 않는다**(지시 §7).
63을 데이터 단위로 유지하고 34 체계는 속성으로만 보존한다.

---

## 5. 코드 수정 — 진행 중

### 완료: 부호 있는 비교 차트 (LQA-017 / LQA-013, 원인 D)

`src/components/data/semantic/SemanticContractRendererV125.tsx`
- `barScaleV137()` 추가. 그룹에 음수가 있을 때만 0 기준선을 만들고
  음수는 왼쪽, 양수는 오른쪽으로 배치. 길이는 크기, 방향·위치는 부호.
- 전부 0 이상인 그룹은 기존 좌측 정렬 렌더링을 그대로 유지(회귀 방지).
- 색만이 아니라 방향과 숫자로 구분. 안내문 1줄 추가.
- `semantic-contract-renderer-v125.css`에 `.sv125-contract-track--signed`
  0 기준선과 음수 채움색, `prefers-contrast: more` 대응 추가.

### 다음 (미착수)
- A. 필터 적용 범위 (D-022/D-025) — LQA-021/026
- B. 코드·지역 식별 — LQA-001/022/028 표시명, LQA-032 지역 crosswalk
- C. 기간·통계 의미 — LQA-031 연평균, LQA-004/016 전망/관측
- ETL 어댑터: 새 entity 중심 구조 + `SOURCE_ROOT` 입력 + staging 출력

---

## 5b. ETL 어댑터 — 완료 (staging 빌드 성공)

기존 생성기에 최소 입력 어댑터를 추가했다. 병렬 ETL을 새로 만들지 않았다.

**`tools/vietnam_etl/source_zip.py`**
- `analyze_source_dir()` 추가. ZIP과 동일한 분석 경로(`_analyze_entries`)를 공유하므로
  두 입력이 서로 어긋날 수 없다. 디렉터리는 읽기만 하며,
  컨테이너가 없으므로 파일별 digest를 누적해 식별 해시를 만든다.
- 반환값에 `sourceKind` 추가.

**`tools/vietnam_etl/build_public_v2.py`** — 환경변수 3개. 미설정 시 기존 동작과 동일.
| 변수 | 용도 |
|---|---|
| `VIETNAM_SOURCE_DIR` | 최종 원자료 디렉터리 입력 |
| `VIETNAM_V2_OUTPUT` | staging 출력 경로 |
| `VIETNAM_EXPECTED_WORKBOOKS` | 워크북 수 기대값 |

- 출력 경로 가드: `public/data/vietnam/v2` 또는 `v2-staging*` 형제만 허용.
  (spatial 빌더가 asset URL을 `public/` 기준으로 만들기 때문에 staging도 그 아래에 둔다.
  `/public/data/vietnam/v2-staging*/`는 gitignore 처리)
- V1 manifest 대조 assert는 **원본 ZIP 빌드에서만** 강제, 교체 원천에서는 delta로 기록.
- `sourceWorkbookCount` 하드코딩 149 → 실제 분석값.
- 누락 요소 carry-forward: 최종 폴더에 없는 요소는 구 ZIP 워크북을 승계하고
  `carriedOverElementIds`로 명시. (E-011/E-013/E-016/E-017)

**`tools/vietnam_etl/workbook_parser.py`**
- `db_framework`를 필수 시트에서 제외(`DATA_SHEETS` 신설).
  이 시트는 요소 프레임워크 정의를 반복한 참조 시트일 뿐이고 카탈로그가 이미 갖고 있다.
  필수로 두면 **데이터가 온전한 112개 요소가 통째로 quarantine** 되었다.
  누락 시 `missing-optional-sheet:` 경고로만 기록.

### 회귀 검증 (구 원천 재빌드 vs 현재 public/v2)

`v2-staging-oldsrc` 재빌드 결과 **266/270 파일 바이트 동일**.
차이 4개는 manifest·asset-integrity 계열이며, 현재 `public/data/vietnam/v2`가
후속 단계(semantic v125, interpretation v129 등) 산출물 157개를 추가로 담고 있어서 생긴 것.
→ 파서 변경으로 인한 구 원천 회귀 없음.

### 최종 원자료 staging 빌드 결과

| 항목 | 구 원천 | 최종 원자료 |
|---|---|---|
| statusCounts | actual 126 / public-authorized 18 / not-collected 3 / partial 3 / data-entry-planned 1 / schema-only 1 / quarantined 0 | **전부 동일** |
| assetCount | 270 | 270 |
| mapFeatureCount | 2,900 | 2,900 |
| sourceWorkbookCount | 149 | 149 (145 + carry-forward 4) |
| rowBalance.matches | True | True |
| processedRows | 45,582 | 171,846 |
| **authorizedRowsPublished** | **360** | **443** (+83) |
| authorizedWithoutPopulatedRows | E-011, E-013 | E-011, E-013 (동일) |

구조 회귀 없이 공개 행이 늘었다. 아직 **public/에 반영하지 않았다**(staging 전용).

## 6. 아직 하지 않은 것

- 후속 파이프라인 단계(semantic v125 / interpretation v129 / 지도 계약) 미실행
- staging → public 반영 미실시
- `source_to_output_reconciliation` — 미착수
- 152개 분석 계약 — 미착수
- 지도 나머지 6개 + 추천 분석 5개 + 비교지도 — 미착수
- 벤치마킹 5개 사이트 — 미착수
- 로컬 build / `finalize:v136` — 미착수
- Draft PR — **NOT_CREATED** (아래 참조)

## 6b. commit / push — 완료

브랜치 `fix/existing-screen-usability-v136` 에 5개 커밋 추가 후 일반 push 완료.
기존 미병합 2커밋(`574ef2a`, `6f14b5b`)은 그대로 유지. force push·amend 없음.

```
65e5536 chore(reports): preserve the read-only live QA evidence
3867796 chore(reports): inventory the final source and record what actually changed
c076b8c fix(charts): place signed comparison bars around a real zero
20b3737 feat(etl): build the public projection from the final source directory
f59c2e8 chore(data): keep the final Vietnam source archive out of git and deploys
6f14b5b test(release): ...        <- 기존
574ef2a fix(screens): ...         <- 기존
```

staging 전 확인: `git status`에 원본·staging 미등장, staged 0건,
보고서 내 절대경로 유출 0건, `npm run build` 성공.
`git add -A`를 쓰지 않고 경로를 명시해 staging 했다.

### Draft PR — NOT_CREATED

`gh` CLI가 이 환경에 설치되어 있지 않다(PATH·기본 설치 경로 모두 없음).
따라서 Draft PR 생성과 GitHub CI 실행은 **수행하지 못했다**.

- `GITHUB_CI` = **NOT_TRIGGERED / NOT_OBSERVED**
- `PREVIEW_QA` = **NOT_AVAILABLE** (PR 미생성이므로 Preview 배포 없음)

브랜치는 push되어 있으므로 다음 주소에서 Draft PR을 열 수 있다:
`https://github.com/exoprime-sketch/nigtldcmap/compare/main...fix/existing-screen-usability-v136`

제안 제목: `feat(data): integrate final Vietnam sources and resolve public analysis defects`

## 7. 산출물

```
reports/final-data-integration/
  source-inventory-v137.csv              3,752행 (재분류 반영)
  source-inventory-summary-v137.json
  element-source-map-v137.csv            152행
  source-baseline-comparison-v137.csv    바이트 대조
  source-baseline-comparison-v137.json
  source-content-comparison-v137.csv     내용 대조 (핵심)
  source-content-comparison-v137.json
  INTEGRATION_STATE_V137.md              이 파일
scripts/
  source-inventory-v137.mjs
  source-element-map-v137.mjs
  compare-source-baseline-v137.py
  compare-source-content-v137.py
```


---

# Stage 2 — 실제 원천 투영과 대조

REVIEWED_CODE_SHA: `e13fbe9` (지시서의 CODE_REVIEW_BASE와 일치 확인)

## S2-1. 진단 확인 — 지시서의 지적이 정확했다

`e13fbe9`에서 실제로 대조한 결과:

- `config/data-publication/vietnam-v124-publication-decision.json`
  `approvedElementIds` = **E-001~E-020 정확히 20개**
- 생성기 분기: `if is_authorized and workbook is not None:` → 재생성,
  `else:` → `deepcopy(base_payload[...])` (구 V1 복사)
- **결과 증거**: Stage 1 staging의 `B-034` 팩 인덱스가
  `observationCount: 498 / entityCount: 0` — 최종 원천(관측 0 / 개체 246)이 아니라
  **구 V1 payload 그대로**였다.

즉 "변경을 읽었다"와 "공개에 반영했다"는 실제로 달랐다. 재구현이 아니라 신규 수정 대상이었다.

## S2-2. 원천 선택과 공개 권한 분리 — 완료

`_element_rights()` 신설. 두 정책을 분리했다.

| | 근거 | 적용 |
|---|---|---|
| **source selection** | 워크북 존재·행 보유 여부 | 어떤 파일로 재생성할지 |
| **publication policy** | 소유자 결정(E 20개) 또는 카탈로그 `rights` | 무엇을 공개·다운로드 허용할지 |

- E 계열 20개: 기존 소유자 결정 그대로 유지(`publication-authorized`, decisionId 참조).
- A~D: **카탈로그의 기존 rights를 그대로 승계**. 예 A-017은 `downloadAllowedValues: ["불가"]`
  이므로 새 원천으로 재생성해도 다운로드 불가가 유지된다.
- `approvedElementIds`를 152개로 늘리거나 전부 `public-authorized`로 바꾸지 **않았다**.

**중요**: 이 재투영은 **교체 원천에서만** 적용된다(`source_dir is not None`).
V124 기본 빌드는 기존 규칙을 그대로 쓴다 — 처음에 양쪽 모두에 적용했다가
C-016 spatial duplicate 오류로 **구 원천 빌드를 깨뜨렸고**, 범위를 좁혀 해결했다.

### 결과

| sourceSelection | 개수 |
|---|---|
| FINAL_SOURCE | **134** |
| TEMPLATE_ONLY_RETAINED_PREVIOUS | 13 |
| NO_WORKBOOK_RETAINED_PREVIOUS | 3 (C-020/021/023) |
| CARRIED_OVER_PREVIOUS_WORKBOOK | 2 (E-016, E-017) |
| 합계 | 152 |

`statusCounts`는 구 빌드와 동일(actual 126 / public-authorized 18 / …).

## S2-3. 회귀 검증

구 원천 재빌드 vs 현재 `public/data/vietnam/v2`: **268/270 바이트 동일**.
차이 2개(`asset-integrity.json`, `quality-report.json`)는 현재 v2가 후속 단계 산출물
157개를 추가로 인덱싱하기 때문. ETL 산출물 자체의 회귀 없음.

## S2-4. staging 분리 — 완료

- `VIETNAM_STAGING_ROOT` 도입. staging은 `.staging/candidate/public/...` 에 **public/ 바깥**으로 생성.
- `build_spatial_assets(..., public_dir=)` 추가 → **출력 파일시스템 루트와 논리 URL 접두사 분리**.
  논리 URL은 최종 `/data/vietnam/v2/...` 그대로 생성된다.
- 공유 자산(`world-countries.geojson`)은 repo `public/`에서 읽고 최종 URL로 기록.
- 검증: staging 산출물 내 `v2-staging` 참조 **0건**, 절대경로 **0건**,
  `public/`·`build/` 내 staging 디렉터리 **0개**.
- **직전 상태 정정**: Stage 1의 `public/data/vietnam/v2-staging-*` 는 CRA가
  `build/`로 복사하고 있었다(실제 파일로 확인). 배포는 하지 않았으므로 외부 유출은 아니며,
  현재는 두 위치 모두에서 제거했다.

## S2-5. 승격 차단 목록 (promotionBlocked = true)

| 유형 | 요소 | 내용 |
|---|---|---|
| ENTITY_FORM_NOT_YET_DERIVED | B-031, B-032, B-033, B-034, B-048, C-016, C-025, D-018, D-023 | 최종 원천이 값을 개체 속성 열로 옮겼으나 지도 분석값 파생이 미구현. 이전 투영 유지 |
| MATERIAL_COVERAGE_DROP | A-023 (1,963→237), A-004 (62→29) | 원천의 실제 변경으로 확인. 반영 여부 확인 필요 |

`A-023`은 원천 자체가 발전소 개체 1,963개(좌표 보유 1,889) → **237개**로 줄었다.
지도 `mapFeatureCount` 2,900 → 1,247의 전량이 이 한 요소에서 발생한다.
과거 숫자를 맞추려 새 자료를 버리지 않았고, 조용히 반영하지도 않았다.

## S2-6. 아직 하지 않은 것 (NOT_RUN)

- **B-034 개체→분석값 파생** — Stage 2의 핵심 미완 항목.
  파서가 이미 라벨 기반 정규화 키를 만든다:
  `산림탄소_순플럭스_mg_co2e_yr = -327911`, `레코드_키 = VNM.1_1`,
  `지역명_로마자 = AnGiang`, `기준연도 = 2000`, `구분 = 수관밀도 임계 30%`.
  → measureId/regionId/period/unit/statisticType 분해 구현이 다음 작업.
- rowBalance → 독립 대조 치환 (§5), 음성 테스트 fixture (§5)
- 메타데이터·출처 새 입력 일치 (§2) — provenance의 `sourcePackage`만 실제 입력명으로 교체 완료,
  indicators/fieldDefinitions/search/source registry는 아직 V1 경로
- 후속 파이프라인(semantic v125 등), 로컬 공개 후보 배치, 새 데이터 UI QA, finalize:v136
- Draft PR (gh 부재 — 인증된 다른 경로 미확인)


---

# Stage 2B — B-034 원천→공개값→지도→다운로드 연결

REVIEWED_SHA `847634e` · 이 단계 산출 SHA는 커밋 후 기재.

## 2B-1. sourceSelection 보고 정정 (§1)

`ENTITY_FORM_NOT_YET_DERIVED` 를 기록한 뒤 `workbook_has_rows=False` 로 만들어
뒤에서 `TEMPLATE_ONLY_RETAINED_PREVIOUS` 로 보고하던 문제를 고쳤다.
원천 상태와 파생 상태를 분리했다.

| 축 | 값 |
|---|---|
| sourceSelection | FINAL_SOURCE 147 / CARRIED_OVER 2 / NO_SOURCE 3 |
| projectionOrigin | FINAL_SOURCE 137 / PREVIOUS_BASELINE 15 |
| derivationStatus | COMPLETE 137 / PENDING_ENTITY_DERIVATION 8 / TEMPLATE_ONLY 4 / NO_SOURCE 3 |

`TEMPLATE_ONLY` 4개(A-027, A-028, E-011, E-013)만이 실제 템플릿이고,
미파생 8개는 별도로 드러난다. (B-034 파생 완료로 9→8)

## 2B-2. 필드 결합을 열 순서에서 분리 (§2)

`b034_facts_v137.py` 는 **인쇄된 라벨**로 결합한다. attr_N 순서를 쓰지 않는다.
음성 fixture로 확인: 열 순서를 바꿔도 값·의미 대응이 유지되고(불변),
중간 열을 지우면 63건이 미계상으로 검출된다(검출).

## 2B-3. 권한 범위 정정 (§3)

**혼재는 가정이 아니라 실측이다** — 152개 중 **16개 요소**가 레코드별로 권한이 갈린다
(A-023: public 236 / display-limited 1,727 등). 반면 **indicatorId 단위로는 균일**하다
(A-023·C-016·A-010 표본에서 혼재 지표 0건).

→ `_element_rights` 가 첫 레코드의 `downloadEligible` 을 전체에 복제하던 구조를
**indicator 단위 해석**(`_rights_for_indicator`)으로 교체했다.
신규 지표는 요소 카탈로그 rights를 상속하며, 첫 허용행에 기대지 않는다.
E 20개 소유자 승인 범위와 decisionId는 변경하지 않았다.

B-034 자체는 498건 전부 `public` / `downloadEligible=true` 로 균일 →
다운로드 허용이 정당하며 강제로 만든 것이 아니다.

## 2B-4. B-034 변환계약 (§4)

**기준연도 2000을 모든 지표에 쓰지 않았다.** 근거는 원천 시트의 note다:

> 저장량·밀도는 2000년 기준, 배출·흡수·순플럭스는 **2001–2024 연평균**.

| measureId | 단위(라벨에서) | quantityType | statisticType | 기간 |
|---|---|---|---|---|
| b034-agb-carbon-stock | Mg C | stock | point-in-time | 2000 |
| b034-agb-carbon-density | Mg C/ha | density | point-in-time | 2000 |
| b034-forest-carbon-gross-emissions | Mg CO2e/yr | flux | annual-mean | 2001–2024 |
| b034-forest-carbon-gross-removals | Mg CO2/yr | flux | annual-mean | 2001–2024 |
| b034-forest-carbon-net-flux | Mg CO2e/yr | flux | annual-mean | 2001–2024 |

부호 규약 `음수 = 순흡수원(sink)` 은 원천 note에서 가져왔다(값이 음수라서 추정한 것이 아님).
단위는 CO2 / CO2e / Mg C / Mg C/ha 를 구분해 보존했고 임의 통일하지 않았다.

**UNRESOLVED_METADATA**: 전국 계열의 `기준연도=2025` 행은 note의 2001–2024 연평균과
연도 표기가 어긋난다. 2001–2024 산술평균(110,966,746)과도 1.24% 다르고
어떤 연도 창(window)으로도 재현되지 않는다(최근접 0.11%는 우연).
→ 원천이 별도 산출한 집계로 보이나 **확정하지 않고 미해결로 기록**한다.

## 2B-5. 개체→분석값 (§5)

- 원천 entity **246** = adm1 63 + national 183
- adm1 63행 × 5지표 = **315 파생 사실** (메타의 "성별 315"와 정확히 일치)
- national 183 = 성 단위 중복 **126**(alias로 표시, 이중계상 안 함) + 임계값 27 + 기타 30
- entity 원본은 그대로 보존(246건) → 지도 폴리곤 유지, 파생값과 lineage 연결
- 246을 사업 수처럼 집계하지 않았고, 과거 498을 목표 개수로 쓰지 않았다

## 2B-6. 지역 조인 (§6)

- 원천 키: **GADM 4.1 GID_1** (`VNM.1_1`) / 지도 경계 키: **`adm1Code`** (`VN-01`), `pre-2025-63`
- 두 체계는 다르고 repo에 GADM 크로스워크가 **없다** → repo의 검증된 alias 표를 통해
  정규화 정확일치로만 결합
- 결과: **63/63 결합, GADM↔adm1 양방향 1:1, 미결합 0**
- 경계 파일 실체 확인: 63 feature, Polygon 50 + MultiPolygon 13 (파일명만 보고 판단 안 함)
- `VN-44 = An Giang` 을 경계 파일에서 직접 확인
- **34개 체계는 속성으로만 보존**. 초기 구현이 `2025_개편_후_소속` 으로 폴백하다
  63→34로 붕괴(고유 코드 34개)한 것을 발견해 제거했다.

## 2B-7. 독립 대조와 음성 테스트 (§7)

`scripts/verify-b034-reconciliation-v137.py` 는 파생기·파이프라인 파서를 쓰지 않고
**openpyxl로 셀을 직접** 읽어 기대값을 만든다.

```
reconciliation: expected 315 → derived 315
  unaccounted 0 · orphan 0 · duplicate 0 · mismatch 0
geography: joined 63 / boundary 63 · 1:1 · geometry 63
negative controls: 9/9
```

| 유형 | 사례 | 결과 |
|---|---|---|
| detect | 값 삭제 / 부호 반전 / 단위 변경 / 지역키 교체 / 중복 삽입 / 중간 열 삭제 | 6/6 검출 |
| detect | **계약의 flux 기간을 2000으로 오설정** | 검출 (mismatch 189 = 63×3) |
| invariant | 열 순서 변경 | 출력 불변 |
| invariant | `기준연도` 열을 2000으로 덮어씀 | 출력 불변(기간은 note 계약에서 옴) |

음성 테스트는 임시 사본에서만 수행했고 원본은 쓰지 않았다.

## 2B-8. 연결 결과

| 지점 | 결과 |
|---|---|
| 원천 셀 | `attr_12`, row 4, `1.2_entity(레코드형)`, B-034.xlsx |
| 공개 관측 | `B-034_prov_forest_carbon_net_flux_vn_44` = **-327911 Mg CO2e/yr**, year=None, period 2001–2024 |
| 지도 레이어 | 기본 변수 `산림탄소 순플럭스(연평균)`, 기본 기간 2001–2024, joinKey adm1Code, 63 feature |
| 다운로드 CSV | observation 315행 전부 값 보유, An Giang 행 `-327911 / Mg CO2e/yr / 2001–2024` |
| 부호 분포 | 음수(흡수) 42 / 양수(배출) 21 → 0 기준선 분기 실제 동작 |

로컬 후보 build 성공, staging 유출 0(`v2-staging`/`.staging`/절대경로 모두 0),
`build/data/vietnam` 아래 v1·v2만 존재.

**LOCAL_NEW_DATA_UI_QA_RESULT = NOT_RUN** — Chrome 확장에 localhost/127.0.0.1
사이트 권한이 없어 실제 화면 캡처를 하지 못했다. 보안 차단을 우회하지 않았다.
따라서 **"B-034 데이터 연결을 검증했다"와 "사용자 화면까지 확인했다"는 구분해 보고한다.**

## 2B-9. A-023 / A-004 (§9)

- **A-004: 차단 해제(오탐 정정)** — 이전 62→29는 **원천 행수** 비교였다.
  공개 산출 기준으로는 62→62로 변화 없다. 비교 기준을 공개 산출물로 옮겨 해소.
- **A-023: 차단 유지** — 공개 기준 1,963 entity → 237. 원천의 실제 축소.
  아직 조사하지 않음: 1,963/237의 단위 의미(원천행/고유발전소/발전기), stable ID 집합 비교,
  237이 특정 발전원·규모·지역의 부분집합인지, 최종 폴더 내 보완 파일 존재 여부.
  → **자동 승인하지 않고 별도 승인 요청 대상으로 유지**.

## 2B-10. 남은 차단 (promotionBlocked = true 유지)

`A-023` (MATERIAL_COVERAGE_DROP) +
`B-031 B-032 B-033 B-048 C-016 C-025 D-018 D-023` (ENTITY_FORM_NOT_YET_DERIVED)

B-034 차단사유만 근거를 갖고 해제했다. 나머지는 각자의 의미계약이 필요하다
(탄소 변환규칙을 사업·광산·계획 자료에 그대로 적용하지 않는다).

## 2B-11. 미완료

- B-034 전국 계열 56행(임계값 27 + 전국 30, 2001–2024 총배출 연도별 시계열 포함)은
  분류까지 마쳤으나 아직 공개 관측으로 방출하지 않았다 → 315/약 474만 공개 중
- 후속 파이프라인(semantic v125 / interpretation / search / source registry) 미실행
- 다운로드 CSV의 `year` 열이 기간 문자열 `2001–2024` 를 담는다(스키마상 별도 period 열 없음)
- finalize:v136, 152개 화면 검수, Draft PR 미수행


---

# Stage 3 — 전체 공개 승인 적용과 남은 통합

REVIEWED_CODE_SHA `e7a5e4c` → 커밋 `8b0e5fa`

## S3-1. 전체 공개 승인 (§0)

새 결정 파일 `config/data-publication/vietnam-all-data-20260908.json` 을 **추가**했다.
기존 20개 결정 파일은 승인일·대상 그대로 보존했고 덮어쓰지 않았다.

- 범위: 152개 ID 전체 명시 · displayAllowed/downloadAllowed true
- 근거: 사용자 진술 원문 기록
- 원문 라이선스·출처 문구는 `rightsNote` 로 그대로 승계 (새 오픈 라이선스로 꾸미지 않음)
- 승계 레코드에도 유효 권한을 재적용 — 그러지 않으면 다른 이유로 보류된 요소가
  이미 해제된 판정 때문에 계속 다운로드를 거부한다

**downloadAllowed 114 → 147.** 남은 5개(C-020/021/023, E-011/E-013)는
권리 차단이 아니라 **자료 자체가 없음**(DATA_UNAVAILABLE).

## S3-2. A-023 범위 조사 (§3) — 식별번호 기준

| | 레코드 | 발전소ID | 신규와 교집합 |
|---|---|---|---|
| 신규 A-023 | 236 | 236 (WRI 220 + WKS 16) | — |
| 구 `_registry` (public) | 236 | 236 (WRI 220 + WKS 16) | **236 / 236** |
| 구 `_osm2026` (display-limited) | 1,727 | 0 (ID 없음) | **0** |

→ 236·237의 근접이 아니라 **식별자 100% 일치**다.
최종 폴더는 과거 public 분류 부분집합만 담고 있고 OSM 계열은 통째로 빠졌다.
과거 권리 필터가 내보내기에 영향을 준 것으로 보인다(가설, 단정하지 않음).

**처리**: 전체 공개 승인에 따라 OSM 1,727건을 **별도 indicator로 복원**.
합치지 않았다 — ID 교집합 0, 이름만 22건 겹쳐 합치면 같은 발전소를 두 번 셀 위험.
지도 feature 2,900 복귀는 숫자를 맞춘 것이 아니라 식별자 복원의 결과다.

## S3-3. 남은 개체형 (§6)

| 요소 | 결과 |
|---|---|
| B-031 | 189 (63×3) · 자체 계약 |
| B-032 | 63 · **분모 기준 보존**(GFW 분석대상 면적) |
| B-033 | 1,489 · **연도 열 기반 실제 연간 관측** (연평균 복제 아님) |
| B-048 / C-025 / D-023 | 개체 레이어 — 한국어 명칭 열 인식으로 해결 |
| **C-016** | **차단 유지** — 계획용량이 indicator 주소 방식. 목표/일정/발주기관을 구분하는 계약 필요 |
| **D-018** | **차단 유지** — Mekong EbA 검증 활동지점 2곳 단언. 완화하면 검증 사실을 빌드 통과와 맞바꾸는 셈 |

derivationStatus: COMPLETE 143 / PENDING 2 / TEMPLATE_ONLY 4 / NO_SOURCE 3
mapFeatureCount 3,144 · layers 12 · assets 336

## S3-4. 시간 스키마 (§5)

`year = row.year or row.period` 를 제거하고 열을 분리했다.

| 예시 | year | period_start | period_end | period | statistic_type |
|---|---|---|---|---|---|
| B-034 순플럭스 | (빈값) | 2001 | 2024 | 2001–2024 | annual-mean |
| B-034 저장량 | 2000 | 2000 | 2000 | 2000 | point-in-time |
| B-033 손실 | 2024 | 2024 | 2024 | 2024 | annual |

음수값 `-327911` 은 CSV 수식 안전처리에서 문자열로 깨지지 않음을 확인.

## S3-5. 후보 빌드

`.verify/candidate` 격리 worktree · CANDIDATE_DATA_FINGERPRINT `99382f26befc6cda`
앱 빌드 성공 · src 타입 오류 0 · B-034 독립 대조 재실행 PASS (315/315, 63/63, 음성 9/9)


## S3-6. 후속 파이프라인 (§6) — 완료

후보 화면이 전부 `데이터를 준비하는 중` 에서 멈춰 있었다. 콘솔:
`V125 semantic asset returned HTML: /data/vietnam/v2/semantic/indicator-semantics-v125.json`
ETL이 v2/를 새로 만들지만 semantic·interpretation·temporal 단계는 `public/` 로 경로가
고정되어 있어 후보 트리에 산출물이 없었고, 정적 서버가 없는 파일에 index.html을 돌려주고 있었다.

- 세 단계 모두 `VIETNAM_DATA_ROOT` 를 받도록 변경(미설정 시 기존 `public/` 동작 유지)
- **지표 정의를 워크북 meta_info에서 생성**하도록 변경.
  값은 최종 원천에서 오는데 indicators는 V1에서 복사되고 있어
  `A-002_wgi_cc_est` 처럼 새 지표에 정의가 없어 semantic 빌드가 거부했다.
- 실행 순서: ETL → semantic v125 → interpretation v129 → temporal contract v135 → 앱 build

결과: A-017 6,312자·선택 3개·막대 24개, B-034 23,264자·단위 헤딩 12개, **런타임 오류 0**

## S3-7. 다운로드 대조 (§5) — PASS

B-034 기준 **CSV 315 = JSON 315 = 지도 315**, 값·단위·기간 **불일치 0**.
An Giang: `-327911 / Mg CO2e/yr / year=null / period 2001–2024 / annual-mean / regionLabel=An Giang`

## S3-8. 릴리스 점검 (§11, 브라우저 불요) — PASS

| 항목 | 결과 |
|---|---|
| 승인 대상 = 실제 152 | YES |
| 배포 산출물 내 원본·staging·.verify | 0 |
| node_modules | 0 |
| 인증정보(단어경계) | 0 (기존 15건은 "**Secret**ariat" 부분일치) |
| v2-staging 참조 | 0 |
| 상단 탭 | 3개 유지 |
| 신규 route/nav | 0 (src 변경 파일 2개: 부호 막대 렌더러 + CSS) |

## S3-9. 152개 화면 자동 스윕 — **신뢰 불가, 결과 불채택**

`scripts/qa-candidate-screens-v137.mjs` 를 4회 돌렸으나 **하네스 자체가 아직 부정확**하다.
아래는 전부 하네스 문제로 확인되었고 **결함으로 보고하지 않는다**:

| 증상 | 원인 |
|---|---|
| 1차 147건 "값·단위 없음" | semantic 자산 누락(실제 원인, S3-6에서 해결) |
| "units=0" 다수 | 단위 검출이 한 템플릿의 `h5` 마크업만 확인 |
| `NO_EFFECT 98` | React가 `selectedIndex` 직접 대입을 무시. native setter로 고쳤으나 여전히 미해결 |
| `화면 오류 26` | 하네스가 던진 `TypeError`(앱 오류 아님) |

**따라서 DETAIL_INTERACTION_REVIEWED / DETAIL_SEMANTIC_REVIEWED 는 NOT_RUN 으로 보고한다.**
개별 확인이 끝난 화면(A-017·B-034·B-005·D-022·D-025 등)은 별도 근거로만 인정한다.

다음 작업: 하네스를 실제 포인터·키보드 조작(CDP Input)으로 바꾸고
단위 검출을 요소별 실제 단위 대조로 교체한 뒤 재실행.
`scripts/qa-candidate-map-v137.mjs` (지도 12개 실제 포인터) 는 **아직 미실행**.
